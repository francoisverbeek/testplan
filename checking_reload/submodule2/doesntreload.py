from testplan.testing.multitest import testsuite, testcase

@testsuite
class ThisTestDoesNotReload:
    @testcase
    def test(self, env, result):
        result.false(True, 'can pass')