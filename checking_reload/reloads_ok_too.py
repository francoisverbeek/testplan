
from testplan.testing.multitest import testsuite, testcase

@testsuite
class ThisTestReloadsToo:
    @testcase
    def test(self, env, result):
        result.true(False, 'can pass')