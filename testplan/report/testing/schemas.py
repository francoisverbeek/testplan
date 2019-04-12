"""Schema classes for test Reports."""

import functools

from marshmallow import Schema, fields, post_load

from testplan.common.serialization.schemas import load_tree_data
from testplan.common.report.schemas import ReportSchema
from testplan.common.serialization import fields as custom_fields

from testplan.common.utils import timing

from .base import TestCaseReport, TestGroupReport, TestReport


__all__ = [
    'TestCaseReportSchema',
    'TestGroupReportSchema',
    'TestReportSchema'
]


class IntervalSchema(Schema):
    """Schema for ``timer.Interval``"""

    start = custom_fields.UTCDateTime()
    end = custom_fields.UTCDateTime(allow_none=True)

    @post_load
    def make_interval(self, data):  # pylint: disable=no-self-use
        """Create an Interal object."""
        return timing.Interval(**data)


class TagField(fields.Field):
    """Field for serializing tag data, which is a ``dict`` of ``set``."""

    def _serialize(self, value, attr, obj):
        return {
            tag_name: list(tag_values)
            for tag_name, tag_values in value.items()
            }

    def _deserialize(self, value, attr, data):
        return {
            tag_name: set(tag_values)
            for tag_name, tag_values in value.items()
            }


class TimerField(fields.Field):
    """
    Field for serializing ``timer.Timer`` objects, which is a ``dict``
    of ``timer.Interval``.
    """

    def _serialize(self, value, attr, obj):
        return {
            k: IntervalSchema(strict=True).dump(v).data
            for k, v in value.items()
            }

    def _deserialize(self, value, attr, data):
        return timing.Timer({
            k: IntervalSchema(strict=True).load(v).data
            for k, v in value.items()
        })


class TestCaseReportSchema(ReportSchema):
    """Schema for ``testing.TestCaseReport``"""

    source_class = TestCaseReport

    status_override = fields.String(allow_none=True)

    entries = fields.List(fields.Raw())

    status = fields.String(dump_only=True)
    suite_related = fields.Bool()
    timer = TimerField()
    tags = TagField()

    @post_load
    def make_report(self, data):
        """
        Create the report object, assign ``timer`` &
        ``status_override`` attributes explicitly
        """
        status_override = data.pop('status_override')
        timer = data.pop('timer')

        rep = super(TestCaseReportSchema, self).make_report(data)
        rep.status_override = status_override
        rep.timer = timer
        return rep


class TestGroupReportSchema(TestCaseReportSchema):
    """
    Schema for ``testing.TestGroupReportSchema``, supports tree serialization.
    """

    source_class = TestGroupReport
    category = fields.String(allow_none=True)
    part = fields.List(fields.Integer, allow_none=True)
    fix_spec_path = fields.String(allow_none=True)

    entries = custom_fields.GenericNested(
        schema_context={
            TestCaseReport: TestCaseReportSchema,
            TestGroupReport: 'self'
        },
        many=True
    )

    @post_load
    def make_report(self, data):
        """
        Propagate tag indices after deserialization
        """
        rep = super(TestGroupReportSchema, self).make_report(data)
        rep.propagate_tag_indices()
        return rep


class TestReportSchema(Schema):
    """Schema for test report root, ``testing.TestReport``."""

    timer = TimerField()
    name = fields.String()
    uid = fields.String()
    meta = fields.Dict()

    status = fields.String(dump_only=True)
    tags_index = TagField(dump_only=True)
    status_override = fields.String(allow_none=True)

    attachments = fields.Dict()

    entries = custom_fields.GenericNested(
        schema_context={
            TestGroupReport: TestGroupReportSchema
        },
        many=True
    )

    @post_load
    def make_test_report(self, data):  # pylint: disable=no-self-use
        """Create report object & deserialize sub trees."""
        load_tree = functools.partial(
            load_tree_data,
            node_schema=TestGroupReportSchema,
            leaf_schema=TestCaseReportSchema,
        )

        entry_data = data.pop('entries')
        status_override = data.pop('status_override')
        timer = data.pop('timer')

        test_plan_report = TestReport(**data)
        test_plan_report.entries = [load_tree(c_data) for c_data in entry_data]
        test_plan_report.propagate_tag_indices()

        test_plan_report.status_override = status_override
        test_plan_report.timer = timer
        return test_plan_report
