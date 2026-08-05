const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const test = require('node:test');

const {
  ALLOWED_PHASES,
  JOINED_STDOUT_LIMIT_BYTES,
  MAX_RECEIPT_BYTES,
  RECEIPT_PREFIX,
  parseJoinedReceiptOutput,
  validateJoinedReceiptProcess,
} = require('./run-49-joined-receipt.cjs');
const Run49JoinedReceiptReporter = require('./run-49-joined-reporter.cjs');
const {
  runBoundedChildProcess,
} = require('./run-bounded-child-process.cjs');
const {
  BOOTSTRAP_PHASES,
} = require('./run-53-joined-bootstrap.cjs');

const nodeExecutable = process.execPath;

function passingReceipt() {
  return {
    schema_version: 1,
    outcome: 'passed',
    phase: 'complete',
    category: 'none',
    exit_code_class: 'zero',
    signal: false,
    timeout: false,
    stdout_overflow: false,
    stderr_overflow: false,
  };
}

function failedReceipt(phase, overrides = {}) {
  const bootstrapCategoryByPhase = {
    process_launch: 'spawn_failed',
    command_admission: 'command_invalid',
    working_directory: 'working_directory_invalid',
    environment_admission: 'environment_missing',
    dependency_resolution: 'dependency_missing',
    module_resolution: 'module_resolution_failed',
    reporter_load: 'reporter_load_failed',
    service_readiness: 'service_readiness_failed',
    test_collection: 'test_collection_failed',
    bootstrap_complete: 'bootstrap_failed',
  };
  const sessionClientCategoryByPhase = {
    session_fixture: 'session_fixture_invalid',
    identity_fixture: 'identity_fixture_failed',
    session_issue: 'session_issue_failed',
    session_transport: 'session_transport_invalid',
    session_admission: 'session_admission_failed',
    workspace_binding: 'workspace_binding_failed',
    client_configuration: 'client_environment_invalid',
    client_construction: 'client_construction_failed',
    client_authentication: 'client_authentication_failed',
    session_cookie_recovery: 'session_cookie_recovery_failed',
    auth_user_lookup: 'auth_user_lookup_failed',
    authorization_transport: 'authorization_transport_failed',
    postgrest_jwt_admission: 'postgrest_jwt_admission_failed',
    authenticated_role_selection: 'authenticated_role_selection_failed',
    rpc_execution: 'rpc_execution_denied',
    rpc_result: 'rpc_result_invalid',
    request_context: 'request_context_failed',
    test_runner_setup: 'test_runner_setup_failed',
    case_execution: 'case_execution_failed',
    final_receipt: 'final_receipt_invalid',
  };
  return {
    schema_version: 1,
    outcome: 'failed',
    phase,
    category:
      bootstrapCategoryByPhase[phase] ??
      sessionClientCategoryByPhase[phase] ??
      'test_runner_failed',
    exit_code_class: 'nonzero',
    signal: false,
    timeout: false,
    stdout_overflow: false,
    stderr_overflow: false,
    ...overrides,
  };
}

function line(value) {
  return `${RECEIPT_PREFIX}${JSON.stringify(value)}\n`;
}

function assertInvalid(value) {
  assert.throws(
    () => parseJoinedReceiptOutput(value),
    (error) => error.code === 'joined_receipt_invalid' && error.message === 'joined_receipt_invalid',
  );
}

test('accepts one canonical passing receipt and one failure receipt per allowed phase', () => {
  assert.deepEqual(parseJoinedReceiptOutput(line(passingReceipt())), passingReceipt());
  for (const phase of ALLOWED_PHASES) {
    if (phase === 'complete') continue;
    assert.deepEqual(parseJoinedReceiptOutput(line(failedReceipt(phase))).phase, phase);
  }
  assert.equal(BOOTSTRAP_PHASES.length, 10);
});

test('custom reporter emits one bounded receipt and suppresses test titles', () => {
  const testNames = [...Run49JoinedReceiptReporter.phaseByTestName.keys()];
  const writes = [];
  const originalWrite = process.stdout.write;
  process.stdout.write = (chunk) => {
    writes.push(String(chunk));
    return true;
  };

  try {
    const reporter = new Run49JoinedReceiptReporter();
    reporter.onTestRunEnd(
      [{ children: {
        allTests: () => testNames.map((name) => ({ name, result: () => ({ state: 'passed' }) })),
      } }],
      [],
      'passed',
    );
    reporter.onTestRunEnd([], [], 'failed');
  } finally {
    process.stdout.write = originalWrite;
  }

  assert.equal(writes.length, 1);
  const parsed = parseJoinedReceiptOutput(writes[0]);
  assert.equal(parsed.outcome, 'passed');
  assert.equal(writes[0].includes(testNames[0]), false);
});

test('custom reporter maps each failed joined case to a safe phase only', () => {
  for (const [name, phase] of Run49JoinedReceiptReporter.phaseByTestName) {
    const writes = [];
    const originalWrite = process.stdout.write;
    process.stdout.write = (chunk) => {
      writes.push(String(chunk));
      return true;
    };
    try {
      new Run49JoinedReceiptReporter().onTestRunEnd(
        [{
          children: {
            allTests: () => Array.from(Run49JoinedReceiptReporter.phaseByTestName.keys()).map((candidate) => ({
              name: candidate,
              result: () => ({ state: candidate === name ? 'failed' : 'passed' }),
            })),
          },
        }],
        [],
        'failed',
      );
    } finally {
      process.stdout.write = originalWrite;
    }
    const parsed = parseJoinedReceiptOutput(writes[0]);
    assert.equal(parsed.outcome, 'failed');
    if (phase === 'client_authentication') {
      assert.equal(parsed.phase, 'final_receipt');
      assert.equal(parsed.category, 'final_receipt_invalid');
    } else {
      assert.equal(parsed.phase, phase);
      assert.equal(parsed.category, 'case_execution_failed');
    }
  }
});

test('rejects missing, duplicate, conflicting, malformed and duplicate-key receipts', () => {
  const passing = line(passingReceipt());
  assertInvalid('');
  assertInvalid(`${passing}${passing}`);
  assertInvalid(`${passing}${line(failedReceipt('client_authentication'))}`);
  assertInvalid(line({
    ...failedReceipt('client_authentication'),
    phase: 'session_bound_client',
  }));
  assertInvalid(`${RECEIPT_PREFIX}{"schema_version":`);
  assertInvalid(
    `${RECEIPT_PREFIX}{"schema_version":1,"outcome":"passed","phase":"complete","category":"none","category":"none","exit_code_class":"zero","signal":false,"timeout":false,"stdout_overflow":false,"stderr_overflow":false}\n`,
  );
});

test('rejects unknown properties, phases, categories, oversized, multiline, trailing and colliding output', () => {
  assertInvalid(line({ ...passingReceipt(), extra: 'value' }));
  assertInvalid(line({ ...passingReceipt(), phase: 'unknown_phase' }));
  assertInvalid(line({ ...passingReceipt(), category: 'unknown_category' }));
  assertInvalid(`${RECEIPT_PREFIX}${'x'.repeat(MAX_RECEIPT_BYTES)}`);
  assertInvalid(`${line(passingReceipt())}trailing`);
  assertInvalid(`${RECEIPT_PREFIX}${JSON.stringify(passingReceipt())}\nextra`);
  assertInvalid(`${line(passingReceipt())}${RECEIPT_PREFIX}`);
});

test('rejects missing keys, wrong key order and every unsafe primitive posture', () => {
  const { stderr_overflow: _stderrOverflow, ...missingKey } = passingReceipt();
  assertInvalid(line(missingKey));

  const reordered = {
    outcome: 'passed',
    schema_version: 1,
    phase: 'complete',
    category: 'none',
    exit_code_class: 'zero',
    signal: false,
    timeout: false,
    stdout_overflow: false,
    stderr_overflow: false,
  };
  assertInvalid(line(reordered));

  assertInvalid(line({ ...passingReceipt(), outcome: 'unknown' }));
  assertInvalid(line({ ...passingReceipt(), exit_code_class: 'unknown' }));
  assertInvalid(line({ ...passingReceipt(), signal: 'false' }));
  assertInvalid(line({ ...passingReceipt(), timeout: 0 }));
  assertInvalid(line({ ...passingReceipt(), stdout_overflow: null }));
  assertInvalid(line({ ...passingReceipt(), stderr_overflow: [] }));
  assertInvalid(`leading-output${line(passingReceipt())}`);
  assertInvalid(`\u001b[31m${line(passingReceipt())}`);
  assertInvalid(`${line(passingReceipt())} `);
  assertInvalid(`${RECEIPT_PREFIX}${JSON.stringify(passingReceipt())}\r\n`);
});

test('rejects secret-shaped, URI-like and raw assertion content without echoing it', () => {
  assertInvalid(line({ ...passingReceipt(), phase: 'https://example.invalid' }));
  assertInvalid(line({ ...passingReceipt(), category: 'postgresql://local.invalid' }));
  assertInvalid(line({ ...passingReceipt(), assertion: 'expected 200 received 500' }));
  assertInvalid(line({ ...passingReceipt(), proof: 'synthetic-proof-value' }));
});

test('rejects contradictory outcome, exit, signal, timeout and overflow posture', () => {
  assertInvalid(line({ ...passingReceipt(), timeout: true }));
  assertInvalid(line({ ...passingReceipt(), exit_code_class: 'nonzero' }));
  assertInvalid(line(failedReceipt('complete', { category: 'none' })));
  assertInvalid(line(failedReceipt('complete', { stdout_overflow: true, stderr_overflow: true })));
  assertInvalid(line(failedReceipt('complete', { signal: true, timeout: true })));
});

test('process validation rejects nonzero pass and zero failure while accepting aligned failure', () => {
  const passed = parseJoinedReceiptOutput(line(passingReceipt()));
  assert.doesNotThrow(() => validateJoinedReceiptProcess(passed, { exitCode: 0, signal: null }));
  assert.throws(() => validateJoinedReceiptProcess(passed, { exitCode: 1, signal: null }));

  const failed = parseJoinedReceiptOutput(line(failedReceipt('client_authentication')));
  assert.doesNotThrow(() => validateJoinedReceiptProcess(failed, { exitCode: 1, signal: null }));
  assert.throws(() => validateJoinedReceiptProcess(failed, { exitCode: 0, signal: null }));

  const signaled = parseJoinedReceiptOutput(
    line(failedReceipt('bootstrap_complete', { signal: true })),
  );
  assert.doesNotThrow(() => validateJoinedReceiptProcess(signaled, { exitCode: null, signal: 'SIGTERM' }));
});

test('bounded child receipt transport returns only the parsed receipt and handles nonzero exit safely', async () => {
  const failed = line(failedReceipt('case_execution'));
  let child;
  const result = await runBoundedChildProcess(
    nodeExecutable,
    ['-e', 'process.stdout.write(process.env.RUN49_RECEIPT); process.exit(1)'],
    {
      env: { PATH: process.env.PATH ?? '', RUN49_RECEIPT: failed },
      allowNonZeroExit: true,
      maxStdoutBytes: JOINED_STDOUT_LIMIT_BYTES,
      stdoutValidator: parseJoinedReceiptOutput,
      timeoutMs: 5_000,
      spawnProcess: (...args) => {
        child = spawn(...args);
        return child;
      },
    },
  );

  assert.equal(result.exitCode, 1);
  assert.equal(result.stdoutValue.phase, 'case_execution');
  assert.equal(Object.hasOwn(result, 'stdout'), false);
  assert.equal(Object.hasOwn(result, 'stderr'), false);
  assert.equal(child.listenerCount('close'), 0);
  assert.equal(child.stdout.listenerCount('data'), 0);
  assert.equal(child.stderr.listenerCount('data'), 0);
  assert.doesNotThrow(() => validateJoinedReceiptProcess(result.stdoutValue, result));
});

test('bounded child transport reassembles a receipt split across stdout chunks', async () => {
  const receipt = line(failedReceipt('client_authentication'));
  const result = await runBoundedChildProcess(
    nodeExecutable,
    [
      '-e',
      'const value=process.env.RUN49_RECEIPT; process.stdout.write(value.slice(0, 11)); setImmediate(() => { process.stdout.write(value.slice(11)); process.exit(1); });',
    ],
    {
      env: { PATH: process.env.PATH ?? '', RUN49_RECEIPT: receipt },
      allowNonZeroExit: true,
      maxStdoutBytes: JOINED_STDOUT_LIMIT_BYTES,
      stdoutValidator: parseJoinedReceiptOutput,
      timeoutMs: 5_000,
    },
  );

  assert.equal(result.stdoutValue.phase, 'client_authentication');
  assert.doesNotThrow(() => validateJoinedReceiptProcess(result.stdoutValue, result));
});

test('nonzero exit without a receipt becomes joined_receipt_invalid without raw output', async () => {
  await assert.rejects(
    runBoundedChildProcess(
      nodeExecutable,
      ['-e', 'process.stdout.write("raw assertion text"); process.exit(1)'],
      {
        env: { PATH: process.env.PATH ?? '' },
        allowNonZeroExit: true,
        maxStdoutBytes: JOINED_STDOUT_LIMIT_BYTES,
        stdoutValidator: parseJoinedReceiptOutput,
        timeoutMs: 5_000,
      },
    ),
    (error) => error.code === 'joined_receipt_invalid' && error.message === 'joined_receipt_invalid',
  );
});

test('receipt pass with nonzero exit and receipt failure with zero exit are rejected', async () => {
  const passing = line(passingReceipt());
  const failed = line(failedReceipt('case_execution'));

  const nonzeroPass = await runBoundedChildProcess(
    nodeExecutable,
    ['-e', 'process.stdout.write(process.env.RUN49_RECEIPT); process.exit(1)'],
    {
      env: { PATH: process.env.PATH ?? '', RUN49_RECEIPT: passing },
      allowNonZeroExit: true,
      maxStdoutBytes: JOINED_STDOUT_LIMIT_BYTES,
      stdoutValidator: parseJoinedReceiptOutput,
      timeoutMs: 5_000,
    },
  );
  assert.throws(() => validateJoinedReceiptProcess(nonzeroPass.stdoutValue, nonzeroPass));

  const zeroFailure = await runBoundedChildProcess(
    nodeExecutable,
    ['-e', 'process.stdout.write(process.env.RUN49_RECEIPT)'],
    {
      env: { PATH: process.env.PATH ?? '', RUN49_RECEIPT: failed },
      allowNonZeroExit: true,
      maxStdoutBytes: JOINED_STDOUT_LIMIT_BYTES,
      stdoutValidator: parseJoinedReceiptOutput,
      timeoutMs: 5_000,
    },
  );
  assert.throws(() => validateJoinedReceiptProcess(zeroFailure.stdoutValue, zeroFailure));
});

test('receipt transport preserves existing overflow, timeout and signal cleanup categories', async () => {
  await assert.rejects(
    runBoundedChildProcess(
      nodeExecutable,
      ['-e', 'process.stdout.write("x".repeat(20_000))'],
      {
        env: { PATH: process.env.PATH ?? '' },
        maxStdoutBytes: 128,
        stdoutValidator: parseJoinedReceiptOutput,
        timeoutMs: 5_000,
      },
    ),
    (error) => error.code === 'child_stdout_overflow' && error.terminationConfirmed,
  );

  await assert.rejects(
    runBoundedChildProcess(
      nodeExecutable,
      ['-e', 'setInterval(() => {}, 1_000)'],
      {
        env: { PATH: process.env.PATH ?? '' },
        stdoutValidator: parseJoinedReceiptOutput,
        timeoutMs: 100,
      },
    ),
    (error) => error.code === 'child_timeout' && error.terminationConfirmed,
  );

  if (process.platform !== 'win32') {
    await assert.rejects(
      runBoundedChildProcess(
        nodeExecutable,
        ['-e', 'process.kill(process.pid, "SIGTERM")'],
        {
          env: { PATH: process.env.PATH ?? '' },
          stdoutValidator: parseJoinedReceiptOutput,
          timeoutMs: 5_000,
        },
      ),
      (error) => error.code === 'child_signaled' && error.terminationConfirmed,
    );
  }
});
