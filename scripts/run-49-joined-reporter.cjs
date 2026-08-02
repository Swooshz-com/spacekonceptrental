const {
  RECEIPT_PREFIX,
  receipt,
  serializeJoinedReceipt,
} = require('./run-49-joined-receipt.cjs');

const {
  BOOTSTRAP_PHASES,
  JOINED_PHASE_BY_TEST_NAME,
  classifyTestRun,
} = require('./run-53-joined-bootstrap.cjs');

class Run49JoinedReceiptReporter {
  constructor() {
    this.receiptWritten = false;
    this.collectionObserved = false;
    this.executionStarted = false;
  }

  onTestModuleCollected() {
    this.collectionObserved = true;
  }

  onTestModuleStart() {
    this.executionStarted = true;
  }

  onTestRunEnd(testModules, unhandledErrors, reason) {
    if (this.receiptWritten) return;
    this.receiptWritten = true;

    let result;
    try {
      result = classifyTestRun({ testModules, unhandledErrors, reason });
    } catch {
      result = { phase: 'bootstrap_complete', category: 'bootstrap_failed' };
    }

    const finalReceipt =
      result.phase === 'complete' && result.category === 'none'
        ? receipt('passed', 'complete', 'none')
        : receipt('failed', result.phase, result.category);

    process.stdout.write(`${RECEIPT_PREFIX}${serializeJoinedReceipt(finalReceipt)}\n`);
  }
}

module.exports = Run49JoinedReceiptReporter;
module.exports.BOOTSTRAP_PHASES = BOOTSTRAP_PHASES;
module.exports.phaseByTestName = JOINED_PHASE_BY_TEST_NAME;
