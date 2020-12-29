from testplan import test_plan
from testplan.testing.multitest import MultiTest
import reloads_ok
import submodule2.doesntreload
import reloads_ok_too
import sys

@test_plan(name='InteractiveRelad')
def main(plan):
    test = MultiTest(name='reload_demo',
                     suites=[reloads_ok.ThisTestReloads(), 
                             submodule2.doesntreload.ThisTestDoesNotReload(),
                             reloads_ok_too.ThisTestReloadsToo()],
                     environment=[],
    )
    plan.add(test)


if __name__ == '__main__':
    res = main()
    sys.exit(res.exit_code)
