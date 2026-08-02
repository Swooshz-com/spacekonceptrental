const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const {
  JOINED_STDOUT_LIMIT_BYTES,
  parseJoinedReceiptOutput,
  validateJoinedReceiptProcess,
} = require('./run-49-joined-receipt.cjs');
const {
  createMinimalChildEnvironment,
  runBoundedChildProcess,
} = require('./run-bounded-child-process.cjs');
const {
  expectedNpmInvocation,
} = require('./run-53-joined-bootstrap.cjs');

const repoRoot = path.resolve(__dirname, '..');
const websiteRoot = path.join(repoRoot, 'website');

function joinedNpmInvocation({ silent }) {
  return expectedNpmInvocation({ silent });
}

function joinedEnvironment() {
  return createMinimalChildEnvironment({
    ...process.env,
    RUN49_JOINED: '1',
  });
}

async function runJoinedVitest({ silent }) {
  const invocation = joinedNpmInvocation({ silent });
  return runBoundedChildProcess(invocation.command, invocation.args, {
    cwd: websiteRoot,
    env: joinedEnvironment(),
    allowNonZeroExit: true,
    maxStdoutBytes: JOINED_STDOUT_LIMIT_BYTES,
    stdoutValidator: parseJoinedReceiptOutput,
    timeoutMs: 60_000,
  });
}

test('the real npm/Vitest/reporter/collector/parser chain rejects wrapper noise and accepts silent framing', async () => {
  await assert.rejects(
    runJoinedVitest({ silent: false }),
    (error) =>
      error.code === 'joined_receipt_invalid' &&
      error.message === 'joined_receipt_invalid' &&
      error.terminationConfirmed === true,
  );

  const result = await runJoinedVitest({ silent: true });
  assert.notEqual(result.exitCode, 0);
  assert.equal(result.signal, null);
  assert.equal(Object.hasOwn(result, 'stdout'), false);
  assert.equal(Object.hasOwn(result, 'stderr'), false);
  assert.equal(typeof result.stdoutBytes, 'number');
  assert.equal(typeof result.stderrBytes, 'number');
  assert.equal(result.stdoutValue.outcome, 'failed');
  assert.doesNotThrow(() => validateJoinedReceiptProcess(result.stdoutValue, result));
});

test('the bounded collector passes exact bytes to fatal UTF-8 receipt validation', async () => {
  await assert.rejects(
    runBoundedChildProcess(
      process.execPath,
      [
        '-e',
        'process.stdout.write(Buffer.from([0xc3, 0x28])); process.exit(1)',
      ],
      {
        env: { PATH: process.env.PATH ?? '' },
        allowNonZeroExit: true,
        maxStdoutBytes: JOINED_STDOUT_LIMIT_BYTES,
        stdoutValidator: parseJoinedReceiptOutput,
        timeoutMs: 5_000,
      },
    ),
    (error) => error.code === 'joined_receipt_invalid' && error.terminationConfirmed === true,
  );
});
