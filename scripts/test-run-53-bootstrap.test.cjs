const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  ALLOWED_PHASES,
  RECEIPT_PREFIX,
  parseJoinedReceiptOutput,
  receipt,
  serializeJoinedReceipt,
} = require('./run-49-joined-receipt.cjs');
const Reporter = require('./run-49-joined-reporter.cjs');
const {
  BOOTSTRAP_PHASES,
  JOINED_PHASE_BY_TEST_NAME,
  JOINED_TEST_CASE_NAMES,
  readSessionClientDiagnostic,
  REQUIRED_JOINED_ENVIRONMENT_KEYS,
  classifyChildFailure,
  classifyTestRun,
  createBootstrapFailure,
  expectedNpmInvocation,
  validateCommandAdmission,
  validateDependencyResolution,
  validateEnvironmentAdmission,
  validateReporterLoad,
  validateWorkingDirectory,
} = require('./run-53-joined-bootstrap.cjs');
const {
  SESSION_CLIENT_DIAGNOSTIC_PREFIX,
} = require('./run-54-session-client-runner.cjs');
const {
  runBoundedChildProcess,
} = require('./run-bounded-child-process.cjs');

const repoRoot = path.resolve(__dirname, '..');
const websiteRoot = path.join(repoRoot, 'website');

function assertBootstrapFailure(callback, phase, category) {
  assert.throws(
    callback,
    (error) => error.phase === phase && error.category === category,
  );
}

function validEnvironment() {
  const environment = {};
  for (const key of REQUIRED_JOINED_ENVIRONMENT_KEYS) {
    environment[key] = `run53-${key.toLowerCase()}`;
  }
  environment.PATH = process.env.PATH ?? '';
  return environment;
}

function makeTestCase(name, state = 'passed', errors = []) {
  return {
    name,
    fullName: "locked joined suite > " + name,
    result: () => ({ state, ...(errors.length > 0 ? { errors } : {}) }),
  };
}

function makeModule(testCases) {
  return {
    children: {
      allTests: function* allTests() {
        yield* testCases;
      },
    },
  };
}

function allCases(state = 'passed', failedName = null) {
  return JOINED_TEST_CASE_NAMES.map((name) =>
    makeTestCase(name, name === failedName ? 'failed' : state),
  );
}

function captureReceipt(callback) {
  const writes = [];
  const originalWrite = process.stdout.write;
  process.stdout.write = (chunk) => {
    writes.push(String(chunk));
    return true;
  };

  try {
    callback();
  } finally {
    process.stdout.write = originalWrite;
  }

  assert.equal(writes.length, 1);
  return parseJoinedReceiptOutput(writes[0]);
}

test('exact hosted command and repository working-directory admission are closed', () => {
  const invocation = expectedNpmInvocation({ platform: 'linux' });
  assert.deepEqual(invocation, {
    command: 'npm',
    args: [
      '--silent',
      'test',
      '--',
      '--run',
      'test/run-49-joined-postgres.integration.test.ts',
      '--reporter',
      '../scripts/run-49-joined-reporter.cjs',
    ],
  });
  assert.doesNotThrow(() => validateCommandAdmission(invocation, { platform: 'linux' }));
  assertBootstrapFailure(
    () => validateCommandAdmission({ ...invocation, args: [...invocation.args, '--watch'] }, { platform: 'linux' }),
    'command_admission',
    'command_invalid',
  );

  assert.doesNotThrow(() => validateWorkingDirectory({
    cwd: websiteRoot,
    repoRoot,
    websiteRoot,
  }));
  for (const cwd of ['', path.join(os.tmpdir(), 'run53-missing-directory'), __filename, repoRoot]) {
    assertBootstrapFailure(
      () => validateWorkingDirectory({ cwd, repoRoot, websiteRoot }),
      'working_directory',
      'working_directory_invalid',
    );
  }
});

test('environment admission requires only the fixed disposable contract', () => {
  assert.doesNotThrow(() => validateEnvironmentAdmission(validEnvironment()));

  const missing = validEnvironment();
  delete missing.RUN49_ACCESS_TOKEN;
  assertBootstrapFailure(
    () => validateEnvironmentAdmission(missing),
    'environment_admission',
    'environment_missing',
  );

  const blank = validEnvironment();
  blank.RUN49_ACCESS_TOKEN = '   ';
  assertBootstrapFailure(
    () => validateEnvironmentAdmission(blank),
    'environment_admission',
    'environment_invalid',
  );

  const sensitive = validEnvironment();
  sensitive.SUPABASE_SERVICE_ROLE_KEY = 'must-not-pass';
  assertBootstrapFailure(
    () => validateEnvironmentAdmission(sensitive),
    'environment_admission',
    'environment_invalid',
  );

  const collision = validEnvironment();
  collision.path = 'case-collision';
  assertBootstrapFailure(
    () => validateEnvironmentAdmission(collision),
    'environment_admission',
    'environment_invalid',
  );
});

test('dependency and reporter admission classify missing, invalid and unsupported modules safely', () => {
  assert.doesNotThrow(() => validateDependencyResolution({
    websiteRoot,
    resolve: () => websiteRoot,
  }));
  assertBootstrapFailure(
    () => validateDependencyResolution({
      websiteRoot,
      resolve: () => {
        const error = new Error('synthetic missing dependency');
        error.code = 'MODULE_NOT_FOUND';
        throw error;
      },
      dependencies: ['vitest'],
    }),
    'dependency_resolution',
    'dependency_missing',
  );
  assertBootstrapFailure(
    () => validateDependencyResolution({
      websiteRoot,
      resolve: () => {
        throw new Error('synthetic resolver failure');
      },
      dependencies: ['vitest'],
    }),
    'dependency_resolution',
    'dependency_resolution_failed',
  );

  class ValidReporter {
    onTestRunEnd() {}
  }
  ValidReporter.phaseByTestName = new Map(JOINED_PHASE_BY_TEST_NAME);
  assert.doesNotThrow(() => validateReporterLoad({
    reporterPath: 'locked-reporter',
    load: () => ValidReporter,
  }));

  for (const load of [
    () => {
      throw new Error('missing reporter');
    },
    () => ({ invalid: true }),
    () => {
      throw new Error('unsupported module format');
    },
  ]) {
    assertBootstrapFailure(
      () => validateReporterLoad({ reporterPath: 'locked-reporter', load }),
      'reporter_load',
      'reporter_load_failed',
    );
  }

  class InvalidReporterExport {
    onTestRunEnd() {}
  }
  InvalidReporterExport.phaseByTestName = new Map();
  assertBootstrapFailure(
    () => validateReporterLoad({
      reporterPath: 'locked-reporter',
      load: () => InvalidReporterExport,
    }),
    'reporter_load',
    'reporter_load_failed',
  );

  class ConstructorFailureReporter {
    constructor() {
      throw new Error('synthetic constructor failure');
    }
  }
  ConstructorFailureReporter.phaseByTestName = new Map(JOINED_PHASE_BY_TEST_NAME);
  assertBootstrapFailure(
    () => validateReporterLoad({
      reporterPath: 'locked-reporter',
      load: () => ConstructorFailureReporter,
    }),
    'reporter_load',
    'reporter_load_failed',
  );
});

test('collection and module admission rejects every non-locked seven-case shape', () => {
  assert.deepEqual(
    classifyTestRun({ testModules: [], unhandledErrors: [], reason: 'failed' }),
    { phase: 'test_collection', category: 'test_collection_failed' },
  );
  assert.deepEqual(
    classifyTestRun({ testModules: [], unhandledErrors: [{}], reason: 'failed' }),
    { phase: 'module_resolution', category: 'module_resolution_failed' },
  );
  assert.deepEqual(
    classifyTestRun({ testModules: [makeModule(allCases().slice(0, 6))], reason: 'passed' }),
    { phase: 'test_collection', category: 'test_collection_failed' },
  );
  assert.deepEqual(
    classifyTestRun({ testModules: [makeModule([...allCases(), makeTestCase('extra')])], reason: 'passed' }),
    { phase: 'test_collection', category: 'test_collection_failed' },
  );

  const duplicateCases = allCases();
  duplicateCases[1] = makeTestCase(duplicateCases[0].name);
  assert.deepEqual(
    classifyTestRun({ testModules: [makeModule(duplicateCases)], reason: 'passed' }),
    { phase: 'test_collection', category: 'test_collection_failed' },
  );
  assert.deepEqual(
    classifyTestRun({
      testModules: [makeModule(allCases('skipped'))],
      reason: 'passed',
    }),
    { phase: 'test_collection', category: 'test_collection_failed' },
  );
  assert.deepEqual(
    classifyTestRun({
      testModules: [{ children: { allTests: () => { throw new Error('import failure'); } } }],
      reason: 'failed',
    }),
    { phase: 'module_resolution', category: 'module_resolution_failed' },
  );
});

test('seven locked cases prove bootstrap completion and preserve the failing case phase', () => {
  assert.deepEqual(
    classifyTestRun({
      testModules: [makeModule(allCases('passed'))],
      reason: 'passed',
    }),
    { phase: 'complete', category: 'none' },
  );

  const failedName = JOINED_TEST_CASE_NAMES[4];
  assert.deepEqual(
    classifyTestRun({
      testModules: [makeModule(allCases('passed', failedName))],
      reason: 'failed',
    }),
    { phase: 'case_execution', category: 'case_execution_failed' },
  );
  assert.notEqual(
    classifyTestRun({
      testModules: [makeModule(allCases('passed', failedName))],
      reason: 'failed',
    }).phase,
    'child_bootstrap',
  );
  assert.deepEqual(
    classifyTestRun({
      testModules: [makeModule(allCases('passed'))],
      reason: 'failed',
    }),
    { phase: 'final_receipt', category: 'final_receipt_invalid' },
  );

  const passed = captureReceipt(() => {
    new Reporter().onTestRunEnd(
      [makeModule(allCases('passed'))],
      [],
      'passed',
    );
  });
  assert.deepEqual(passed, {
    schema_version: 1,
    outcome: 'passed',
    phase: 'complete',
    category: 'none',
    exit_code_class: 'zero',
    signal: false,
    timeout: false,
    stdout_overflow: false,
    stderr_overflow: false,
  });

  const failed = captureReceipt(() => {
    new Reporter().onTestRunEnd(
      [makeModule(allCases('passed', failedName))],
      [],
      'failed',
    );
  });
  assert.equal(failed.phase, 'case_execution');
  assert.equal(failed.category, 'case_execution_failed');
});

test('the first joined authentication failure carries only a closed fixed diagnostic', () => {
  const diagnosticMessage =
    SESSION_CLIENT_DIAGNOSTIC_PREFIX + "rpc_execution:rpc_execution_denied";
  const failedCase = makeTestCase(
    JOINED_TEST_CASE_NAMES[0],
    'failed',
    [{ message: diagnosticMessage }],
  );
  assert.deepEqual(
    readSessionClientDiagnostic(failedCase),
    { phase: 'rpc_execution', category: 'rpc_execution_denied' },
  );
  assert.deepEqual(
    classifyTestRun({
      testModules: [makeModule([
        failedCase,
        ...allCases('passed').slice(1),
      ])],
      reason: 'failed',
    }),
    { phase: 'rpc_execution', category: 'rpc_execution_denied' },
  );
  assert.deepEqual(
    readSessionClientDiagnostic(makeTestCase(
      JOINED_TEST_CASE_NAMES[0],
      'failed',
      [{ message: SESSION_CLIENT_DIAGNOSTIC_PREFIX + "unknown:unknown" }],
    )),
    { phase: 'final_receipt', category: 'final_receipt_invalid' },
  );
});

test('bootstrap failure and process posture remain fixed and public-safe', async () => {
  assert.deepEqual(
    classifyChildFailure({ code: 'child_spawn_failed' }),
    { phase: 'process_launch', category: 'spawn_failed' },
  );
  assert.deepEqual(
    classifyChildFailure({ code: 'child_timeout' }),
    { phase: 'process_launch', category: 'bootstrap_timeout' },
  );
  assert.deepEqual(
    classifyChildFailure({ code: 'child_signaled' }),
    { phase: 'process_launch', category: 'bootstrap_signal' },
  );
  assert.deepEqual(
    classifyChildFailure({ code: 'child_stdout_overflow' }),
    { phase: 'process_launch', category: 'bootstrap_output_overflow' },
  );
  assert.deepEqual(
    classifyChildFailure({ code: 'joined_receipt_invalid' }),
    { phase: 'final_receipt', category: 'final_receipt_invalid' },
  );
  assert.deepEqual(
    classifyChildFailure(createBootstrapFailure('service_readiness', 'postgres_not_ready')),
    { phase: 'service_readiness', category: 'postgres_not_ready' },
  );

  await assert.rejects(
    runBoundedChildProcess('', [], { timeoutMs: 100 }),
    (error) => error.code === 'child_command_invalid' && error.terminationConfirmed,
  );
  await assert.rejects(
    runBoundedChildProcess(process.execPath, [1], { timeoutMs: 100 }),
    (error) => error.code === 'child_command_invalid' && error.terminationConfirmed,
  );
  await assert.rejects(
    runBoundedChildProcess(process.execPath, [], { cwd: '', timeoutMs: 100 }),
    (error) => error.code === 'child_working_directory_invalid' && error.terminationConfirmed,
  );

  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.pid = null;
  const spawnFailure = runBoundedChildProcess('synthetic-command', [], {
    timeoutMs: 1_000,
    spawnProcess: () => {
      setImmediate(() => {
        child.emit('error', new Error('synthetic spawn failure'));
        child.emit('close', null, null);
      });
      return child;
    },
  });
  await assert.rejects(
    spawnFailure,
    (error) => error.code === 'child_spawn_failed' && error.terminationConfirmed,
  );
  assert.equal(child.listenerCount('error'), 0);
  assert.equal(child.listenerCount('close'), 0);
  assert.equal(child.stdout.listenerCount('data'), 0);
  assert.equal(child.stderr.listenerCount('data'), 0);
});

test('bootstrap allowlists stay closed and receipt framing rejects the old broad phase', () => {
  assert.deepEqual(BOOTSTRAP_PHASES, [
    'process_launch',
    'command_admission',
    'working_directory',
    'environment_admission',
    'dependency_resolution',
    'module_resolution',
    'reporter_load',
    'service_readiness',
    'test_collection',
    'bootstrap_complete',
  ]);
  assert.equal(ALLOWED_PHASES.has('child_bootstrap'), false);
  assert.throws(() => parseJoinedReceiptOutput(
    `${RECEIPT_PREFIX}${JSON.stringify(receipt('failed', 'bootstrap_complete', 'bootstrap_failed'))}\nextra`,
  ));
  assert.doesNotThrow(() => parseJoinedReceiptOutput(
    `${RECEIPT_PREFIX}${serializeJoinedReceipt(receipt('failed', 'bootstrap_complete', 'bootstrap_failed'))}\n`,
  ));
});

test('diagnostic fixtures do not persist', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'spacekonceptrental-run53-'));
  try {
    assert.equal(fs.existsSync(fixture), true);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
  assert.equal(fs.existsSync(fixture), false);
});
