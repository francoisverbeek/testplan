"""
    XML Export logic for test reports.
"""
import socket
import os
import shutil

from lxml import etree
from lxml.builder import E  # pylint: disable=no-name-in-module

from testplan import defaults
from testplan.common.utils.logger import TESTPLAN_LOGGER
from testplan.common.utils.path import unique_name
from testplan.common.utils.strings import slugify

from testplan.common.config import ConfigOption
from testplan.common.exporters import ExporterConfig

from testplan.report.testing import TestCaseReport, TestGroupReport
from testplan.testing.multitest.base import Categories, Status

from ..base import Exporter


class BaseRenderer(object):
    """
    Basic renderer, will render a test group report with the following structure:

    TestGroupReport(name=..., category='<test-category>')
        TestGroupReport(name=..., category='suite')
            TestCaseReport(name=...)  (failing)
                RawAssertion (dict form)
            TestCaseReport(name=...) (passing)
            TestCaseReport(name=...) (passing)
    """

    def render(self, source):
        """
        Top level rendering logic, renders each suite
        separately & groups them within `testsuites` tag.
        """
        testsuites = []
        num_tests = 0
        num_failures = 0
        num_errors = 0

        for index, suite_report in enumerate(source):
            num_tests += suite_report.counts.total
            num_errors += suite_report.counts.error
            num_failures += suite_report.counts.failed
            suite_elem = self.render_testsuite(index, source, suite_report)
            testsuites.append(suite_elem)

        return E.testsuites(
            *testsuites,
            tests=str(num_tests),
            errors=str(num_errors),
            failures=str(num_failures))

    def get_testcase_reports(self, testsuite_report):
        """
        Get testcases from a suite report, normally this is more or less
        equal to all children of the suite report, however certain test
        runners (e.g. MultiTest) may have nested data that needs to be
        flattened.
        """
        for child in testsuite_report:
            if isinstance(child, TestCaseReport):
                yield child
            elif isinstance(child, TestGroupReport):
                # Recurse - yield each of the testcases in this group.
                for testcase in self.get_testcase_reports(child):
                    yield testcase
            else:
                raise TypeError('Unsupported report type: {}'.format(child))

    def render_testsuite(self, index, test_report, testsuite_report):
        """Render a single testsuite with its testcases within a `testsuite` tag."""
        cases = [
            self.render_testcase(
                test_report,
                testsuite_report,
                testcase_report
            )
            for testcase_report in self.get_testcase_reports(testsuite_report)]

        return E.testsuite(
            *cases,
            hostname=socket.gethostname(),
            id=str(index),
            package='{}:{}'.format(
                test_report.name, testsuite_report.name),
            name=testsuite_report.name,
            errors=str(testsuite_report.counts.error),
            failures=str(testsuite_report.counts.failed),
            tests=str(len(testsuite_report))
        )

    def render_testcase(
        self, test_report, testsuite_report, testcase_report
    ):
        """Render a testcase with errors & failures within a `testcase` tag."""
        # the xsd for junit only allows errors OR failures not both
        if testcase_report.status == Status.ERROR:
            details = self.render_testcase_errors(testcase_report)
        elif testcase_report.status == Status.FAILED:
            details = self.render_testcase_failures(testcase_report)
        else:
            details = []

        return E.testcase(
            *details,
            name=testcase_report.name,
            classname="{}:{}:{}".format(
                test_report.name,
                testsuite_report.name,
                testcase_report.name
            ),
            time=str(testcase_report.timer['run'].elapsed)
            if 'run' in testcase_report.timer else '0'
        )

    def render_testcase_errors(self, testcase_report):
        """Create an `error` tag that holds error information via testcase report's logs."""
        return [
            E.error(message=log['message'])
            for log in testcase_report.logs if log['levelname'] == 'ERROR'
        ]

    def render_testcase_failures(self, testcase_report):
        """
        Entries of a testcase report are in dict form, which may
        also be nested in case there are groups/summaries.

        This method flattens the enty data and iterates over failing
        assertions to create `failure` tags with element tree.
        """
        # Depth does not matter, we just need entries in flat form
        flat_dicts = list(zip(*testcase_report.flattened_entries(depth=0)))[1]

        failed_assertions = [
            entry for entry in flat_dicts
            # Only get failing assertions
            if entry['meta_type'] == 'assertion' and
            not entry['passed'] and
            # Groups have no use in XML output
            not entry['type'] in ('Group', 'Summary')
        ]

        failures = []
        for entry in failed_assertions:
            failure = E.failure(
                message=entry['description'] or entry['type'],
                type='assertion'
            )
            if entry['type'] == 'RawAssertion':
                failure.text = etree.CDATA(entry['content'])
            failures.append(failure)

        return failures


class MultiTestRenderer(BaseRenderer):
    """
    Source report represents a MultiTest with the following structure:

    TestGroupReport(name=..., category='multitest')
        TestGroupReport(name=..., category='suite')
            TestCaseReport(name=...)
                Assertion entry (dict)
                Assertion entry (dict)
            TestGroupReport(name='...', category='parametrization')
                TestCaseReport(name=...)
                    Assertion entry (dict)
                    Assertion entry (dict)
                TestCaseReport(name=...)
                    Assertion entry (dict)
                    Assertion entry (dict)

    Final XML will have flattened testcase data from parametrization groups.
    """

    def get_testcase_reports(self, testsuite_report):
        """Multitest suites may have additional nested in case of parametrization."""
        testcase_reports = []
        for child in testsuite_report:
            if isinstance(child, TestCaseReport):
                testcase_reports.append(child)
            elif isinstance(child, TestGroupReport) and\
                    child.category == Categories.PARAMETRIZATION:
                testcase_reports.extend(child.entries)
            else:
                raise TypeError('Unsupported report type: {}'.format(child))
        return testcase_reports


class XMLExporterConfig(ExporterConfig):
    """Config for XML exporter"""

    @classmethod
    def get_options(cls):
        return {
            ConfigOption(
                'xml_dir', default=defaults.XML_DIR,
                block_propagation=False): str
        }


class XMLExporter(Exporter):
    """
    Produces one XML file per each child of
    TestPlanReport (e.g. Multitest reports)
    """

    CONFIG = XMLExporterConfig

    renderer_map = {
        Categories.MULTITEST: MultiTestRenderer,
    }

    def export(self, source):
        """Create multiple XML files in the given directory for each top level test group report."""
        xml_dir = self.cfg.xml_dir

        if os.path.exists(xml_dir):
            shutil.rmtree(xml_dir)

        os.makedirs(xml_dir)

        files = set(os.listdir(xml_dir))

        for child_report in source:
            filename = '{}.xml'.format(slugify(child_report.name))
            filename = unique_name(filename, files)
            files.add(filename)
            file_path = os.path.join(self.cfg.xml_dir, filename)

            # If a report has XML string attribute it was mostly generated via parsing
            # a JUnit compatible XML file already, meaning we don't need to re-generate
            # the XML contents, but can directly write the contents to a file instead.
            if hasattr(child_report, 'xml_string'):
                with open(file_path, 'w') as xml_target:
                    xml_target.write(child_report.xml_string)
            else:
                renderer = self.renderer_map.get(child_report.category, BaseRenderer)()
                element = etree.ElementTree(renderer.render(child_report))
                element.write(
                    file_path,
                    pretty_print=True,
                    xml_declaration=True,
                    encoding='UTF-8'
                )

        TESTPLAN_LOGGER.exporter_info(
            '%s XML files created at: %s', len(source), xml_dir)
