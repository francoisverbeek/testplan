import React from 'react';

import {TESTPLAN_REPORT} from "../../Common/sampleReports";
import {propagateIndices} from "../reportUtils";

describe('Report/reportUtils', () => {

  describe('propagateIndices', () => {

    let report;
    let testplan;
    let multitest;
    let suiteA;
    let suiteB;
    let testcase;
    let testplanEntries = {};

    beforeEach(() => {
      report = propagateIndices([TESTPLAN_REPORT]);
      testplan = report[0];
      multitest = testplan.entries[0];
      suiteA = multitest.entries[0];
      suiteB = multitest.entries[1];
      testcase = suiteA.entries[0];
      testplanEntries = {
        testplan: testplan,
        multitest: multitest,
        suite: suiteA,
        testcase: testcase,
      };
    });

    afterEach(() => {
      report = undefined;
      testplan = undefined;
      multitest = undefined;
      suiteA = undefined;
      suiteB = undefined;
      testcase = undefined;
      testplanEntries = {};
    });

    it('tags - exact same tags on parent & child don\'t appear twice in ' +
       'child\'s tags', () => {
      expect(multitest.tags).toEqual(suiteA.tags);
    });

    it('tags - parent & child with same named tags but different values ' +
       'extend the child tag\'s list', () => {
      const expected = {
        simple: ['server', 'client'],
      };
      expect(suiteB.tags).toEqual(expected);
    });

    it('tags - parent & child with different named tags both appear in ' +
       'child tags', () => {
      const expected = {
        simple: ['server'],
        colour: ['white'],
      };
      expect(testcase.tags).toEqual(expected);
    });

    it('tags_index - stores parent tags & descendent\'s tags', () => {
      const expected = {
        simple: ['server', 'client'],
        colour: ['white'],
      };
      expect(multitest.tags_index).toEqual(expected);
    });

    [
      [
        'testplan',
        new Set([
          'Sample Testplan|testplan',
          'Primary|multitest',
          'AlphaSuite|suite',
          'test_equality_passing|testcase',
          'test_equality_passing2|testcase',
          'BetaSuite|suite',
          'Secondary|multitest',
          'GammaSuite|suite',
      ]),
      ],
      [
        'multitest',
        new Set([
          'Primary|multitest',
          'Sample Testplan|testplan',
          'AlphaSuite|suite',
          'test_equality_passing|testcase',
          'test_equality_passing2|testcase',
          'BetaSuite|suite',
        ]),
      ],
      [
        'suite',
        new Set([
          'AlphaSuite|suite',
          'Primary|multitest',
          'Sample Testplan|testplan',
          'test_equality_passing|testcase',
          'test_equality_passing2|testcase',
        ]),
      ],
      [
        'testcase',
        new Set([
          'test_equality_passing|testcase',
          'AlphaSuite|suite',
          'Primary|multitest',
          'Sample Testplan|testplan',
        ]),
      ],
    ].forEach(([entryType, nameTypeIndex]) => {
      it(`${entryType} name_type_index - stores ancestors & ` +
         'descendents names & types', () => {
        const entry = testplanEntries[entryType];
        expect(entry.name_type_index).toEqual(nameTypeIndex);
      });
    });

    [
      ['testplan', {passed: 3, failed: 1}],
      ['multitest', {passed: 2, failed: 1}],
      ['suite', {passed: 1, failed: 1}],
      ['testcase', {passed: 1, failed: 0}],
    ].forEach(([entryType, caseCount]) => {
      it(`${entryType} case_count - stores number of passing & failing ` +
         'testcases within entry', () => {
        const entry = testplanEntries[entryType];
        expect(entry.case_count).toEqual(caseCount);
      });
    });

  });

});