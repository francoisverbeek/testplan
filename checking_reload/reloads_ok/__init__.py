from testplan.testing.multitest import testsuite, testcase
@testsuite
class ThisTestReloads:
    @testcase
    def test(self, env, result):
        result.true(False, 'can pass')