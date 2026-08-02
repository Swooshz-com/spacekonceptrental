const {
  RECEIPT_PREFIX,
  receipt,
  serializeJoinedReceipt,
} = require('./run-49-joined-receipt.cjs');

const phaseByTestName = new Map([
  [
    'uses the real session-bound client and crosses the HTTP RPC transport',
    'session_bound_client',
  ],
  [
    'consumes before malformed and oversized bodies, then accepts only a fresh proof',
    'malformed_and_replay',
  ],
  [
    'persists a setup write through the production repository and reloads it authoritatively',
    'write_and_reload',
  ],
  [
    'rejects a mismatched action only after consuming the signed operation',
    'operation_mismatch',
  ],
  [
    'allows exactly one concurrent identical route request through PostgreSQL',
    'concurrent_one_winner',
  ],
  [
    'retains replay denial across separate Node processes',
    'cross_process_replay',
  ],
  [
    'denies direct replay-table access for the authenticated client',
    'direct_table_denial',
  ],
]);

function allTestCases(testModules) {
  const cases = [];
  for (const module of testModules ?? []) {
    if (!module || typeof module.allTests !== 'function') continue;
    for (const testCase of module.allTests()) cases.push(testCase);
  }
  return cases;
}

function phaseForFailedCase(testCase) {
  return phaseByTestName.get(testCase?.name) ?? 'child_bootstrap';
}

class Run49JoinedReceiptReporter {
  constructor() {
    this.receiptWritten = false;
  }

  onTestRunEnd(testModules, unhandledErrors, reason) {
    if (this.receiptWritten) return;
    this.receiptWritten = true;

    let testCases;
    try {
      testCases = allTestCases(testModules);
    } catch {
      testCases = [];
    }

    const failedCase = testCases.find((testCase) => {
      try {
        return testCase.result()?.state === 'failed';
      } catch {
        return false;
      }
    });
    const allSevenPassed =
      reason === 'passed' &&
      testCases.length === phaseByTestName.size &&
      testCases.every((testCase) => {
        try {
          return testCase.result()?.state === 'passed';
        } catch {
          return false;
        }
      });

    const result = allSevenPassed
      ? receipt('passed', 'complete', 'none')
      : receipt(
          'failed',
          failedCase ? phaseForFailedCase(failedCase) : 'child_bootstrap',
          failedCase || unhandledErrors?.length ? 'test_runner_failed' : 'bootstrap_failed',
        );

    process.stdout.write(`${RECEIPT_PREFIX}${serializeJoinedReceipt(result)}\n`);
  }
}

module.exports = Run49JoinedReceiptReporter;
module.exports.phaseByTestName = phaseByTestName;
