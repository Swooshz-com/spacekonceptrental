const fs = require('node:fs');
const path = require('node:path');
const {
  SESSION_CLIENT_CATEGORIES,
  SESSION_CLIENT_PHASES,
  SESSION_CLIENT_PHASE_CATEGORY_MAP,
} = require('./run-54-session-client-runner.cjs');
const {
  DIAGNOSTIC_CONTROL_ENV_KEY,
  readDiagnosticControl,
} = require('./run-49-diagnostic-control.cjs');

const BOOTSTRAP_PHASES = Object.freeze([
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

const BOOTSTRAP_CATEGORIES = Object.freeze([
  'spawn_failed',
  'command_invalid',
  'working_directory_invalid',
  'environment_missing',
  'environment_invalid',
  'dependency_missing',
  'dependency_resolution_failed',
  'module_resolution_failed',
  'reporter_load_failed',
  'postgres_not_ready',
  'postgrest_not_ready',
  'service_readiness_failed',
  'test_collection_failed',
  'bootstrap_timeout',
  'bootstrap_signal',
  'bootstrap_output_overflow',
  'bootstrap_failed',
  'receipt_invalid',
  'none',
]);

const JOINED_TEST_PATH = 'test/run-49-joined-postgres.integration.test.ts';
const JOINED_REPORTER_PATH = '../scripts/run-49-joined-reporter.cjs';

const JOINED_TEST_CASE_NAMES = Object.freeze([
  'uses the real session-bound client and crosses the HTTP RPC transport',
  'consumes before malformed JSON body failure, then denies the same proof and accepts a fresh proof',
  'consumes before oversized body failure, then denies the same proof and accepts a fresh proof',
  'consumes before unknown-action failure, then denies the same proof and accepts a fresh proof',
  'consumes before schema-rejection failure, then denies the same proof and accepts a fresh proof',
  'accepts one valid authorised request through the durable joined authority',
  'rejects a wrong-operation proof only after consuming the signed proof',
  'allows exactly one concurrent identical route request through PostgreSQL',
  'retains replay denial across separate Node processes',
  'denies direct replay-table access for the authenticated client',
  'rejects a missing CSRF proof through the production route',
  'rejects a malformed CSRF proof through the production route',
  'rejects a stale CSRF proof without consuming the durable nonce',
  'rejects an anonymous session through the production route',
  'rejects an authenticated non-admin user through the production route',
  'rejects a cross-workspace record request through the production route',
]);

const JOINED_PHASE_BY_TEST_NAME = new Map(
  JOINED_TEST_CASE_NAMES.map((name, index) => [
    name,
    index === 0 ? 'client_authentication' : 'case_execution',
  ]),
);

const ALLOWED_CHILD_ENVIRONMENT_KEYS = new Set([
  'CI',
  'ComSpec',
  'HOME',
  'NODE_ENV',
  'PATH',
  'PATHEXT',
  'SystemRoot',
  'TEMP',
  'TMP',
  'USERPROFILE',
  'ADMIN_CSRF_PROOF_SECRET',
  'ADMIN_EXPECTED_HOST',
  'ADMIN_EXPECTED_ORIGIN',
  'ADMIN_MUTATIONS_ENABLED',
  'ADMIN_TRUSTED_WORKSPACE_ID',
  'RUN49_ACCESS_TOKEN',
  'RUN49_CHILD_PRODUCT_ID',
  'RUN49_DIAGNOSTIC_CONTROL_FILE',
  'RUN49_JOINED',
  'RUN49_JWT_SECRET',
  'RUN49_OTHER_SETUP_PRODUCT_ID',
  'RUN49_OTHER_WORKSPACE_ID',
  'RUN49_SETUP_PRODUCT_ID',
  'RUN49_SUPABASE_URL',
  'RUN49_UNAUTHORISED_AUTH_USER_EMAIL',
  'RUN49_UNAUTHORISED_AUTH_USER_ID',
  'RUN49_WORKSPACE_ID',
  'SUPABASE_ANON_KEY',
  'SUPABASE_URL',
]);

const REQUIRED_JOINED_ENVIRONMENT_KEYS = Object.freeze([
  'ADMIN_CSRF_PROOF_SECRET',
  'ADMIN_EXPECTED_HOST',
  'ADMIN_EXPECTED_ORIGIN',
  'ADMIN_MUTATIONS_ENABLED',
  'ADMIN_TRUSTED_WORKSPACE_ID',
  'RUN49_ACCESS_TOKEN',
  'RUN49_CHILD_PRODUCT_ID',
  'RUN49_JOINED',
  'RUN49_SETUP_PRODUCT_ID',
  'RUN49_SUPABASE_URL',
  'RUN49_WORKSPACE_ID',
  'SUPABASE_ANON_KEY',
  'SUPABASE_URL',
]);

const REQUIRED_DEPENDENCIES = Object.freeze([
  'vitest',
  'next',
  '@supabase/supabase-js',
  'typescript',
]);

const EXECUTION_PHASES = new Set([
  'client_authentication',
  'case_execution',
]);

const BOOTSTRAP_PHASE_SET = new Set(BOOTSTRAP_PHASES);
const BOOTSTRAP_CATEGORY_SET = new Set(BOOTSTRAP_CATEGORIES);
const SESSION_CLIENT_PHASE_SET = new Set(SESSION_CLIENT_PHASES);
const SESSION_CLIENT_CATEGORY_SET = new Set(SESSION_CLIENT_CATEGORIES);

function createBootstrapFailure(phase, category) {
  if (!BOOTSTRAP_PHASE_SET.has(phase) || !BOOTSTRAP_CATEGORY_SET.has(category)) {
    throw new Error('bootstrap_classifier_invalid');
  }

  const error = new Error('joined_bootstrap_failed');
  error.code = 'joined_bootstrap_failed';
  error.phase = phase;
  error.category = category;
  return error;
}

function assertBootstrapFailure(value) {
  if (
    !value ||
    typeof value !== 'object' ||
    !BOOTSTRAP_PHASE_SET.has(value.phase) ||
    !BOOTSTRAP_CATEGORY_SET.has(value.category) ||
    value.category === 'none'
  ) {
    throw new Error('bootstrap_classifier_invalid');
  }
  return { phase: value.phase, category: value.category };
}

function expectedNpmInvocation({
  platform = process.platform,
  comSpec = process.env.ComSpec || 'cmd.exe',
  silent = true,
} = {}) {
  const npmArgs = [
    ...(silent ? ['--silent'] : []),
    'test',
    '--',
    '--run',
    JOINED_TEST_PATH,
    '--reporter',
    JOINED_REPORTER_PATH,
  ];

  if (platform !== 'win32') {
    return { command: 'npm', args: npmArgs };
  }

  const commandLine = [
    'npm',
    ...npmArgs.map((value) => {
      const text = String(value);
      return /[\s"]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    }),
  ].join(' ');

  return {
    command: comSpec,
    args: ['/d', '/s', '/c', commandLine],
  };
}

function validateCommandAdmission(actual, options = {}) {
  const expected = expectedNpmInvocation(options);
  if (
    !actual ||
    actual.command !== expected.command ||
    !Array.isArray(actual.args) ||
    actual.args.length !== expected.args.length ||
    actual.args.some((value, index) => value !== expected.args[index])
  ) {
    throw createBootstrapFailure('command_admission', 'command_invalid');
  }
  return { admitted: true };
}

function validateWorkingDirectory({ cwd, repoRoot, websiteRoot }) {
  if (
    typeof cwd !== 'string' ||
    typeof repoRoot !== 'string' ||
    typeof websiteRoot !== 'string' ||
    cwd.trim() === '' ||
    repoRoot.trim() === '' ||
    websiteRoot.trim() === ''
  ) {
    throw createBootstrapFailure(
      'working_directory',
      'working_directory_invalid',
    );
  }

  let actual;
  let expected;
  let repository;
  try {
    actual = fs.realpathSync(cwd);
    expected = fs.realpathSync(websiteRoot);
    repository = fs.realpathSync(repoRoot);
    if (!fs.statSync(actual).isDirectory()) throw new Error('not_directory');
  } catch {
    throw createBootstrapFailure(
      'working_directory',
      'working_directory_invalid',
    );
  }

  const relative = path.relative(repository, actual);
  if (
    actual !== expected ||
    relative === '' ||
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw createBootstrapFailure(
      'working_directory',
      'working_directory_invalid',
    );
  }

  return { admitted: true };
}

function validateEnvironmentAdmission(environment) {
  if (!environment || typeof environment !== 'object' || Array.isArray(environment)) {
    throw createBootstrapFailure(
      'environment_admission',
      'environment_invalid',
    );
  }

  const keys = Object.keys(environment);
  const normalizedKeys = new Set();
  for (const key of keys) {
    const normalized = key.toLowerCase();
    if (normalizedKeys.has(normalized)) {
      throw createBootstrapFailure(
        'environment_admission',
        'environment_invalid',
      );
    }
    normalizedKeys.add(normalized);

    if (!ALLOWED_CHILD_ENVIRONMENT_KEYS.has(key)) {
      throw createBootstrapFailure(
        'environment_admission',
        'environment_invalid',
      );
    }
  }

  for (const key of REQUIRED_JOINED_ENVIRONMENT_KEYS) {
    if (!Object.hasOwn(environment, key)) {
      throw createBootstrapFailure(
        'environment_admission',
        'environment_missing',
      );
    }
    if (typeof environment[key] !== 'string' || environment[key].trim() === '') {
      throw createBootstrapFailure(
        'environment_admission',
        'environment_invalid',
      );
    }
  }

  return { admitted: true };
}

function validateDependencyResolution({
  websiteRoot,
  resolve = require.resolve,
  dependencies = REQUIRED_DEPENDENCIES,
}) {
  if (typeof websiteRoot !== 'string' || websiteRoot.trim() === '') {
    throw createBootstrapFailure(
      'dependency_resolution',
      'dependency_resolution_failed',
    );
  }

  for (const dependency of dependencies) {
    try {
      resolve(dependency, { paths: [websiteRoot] });
    } catch (error) {
      const category =
        error && typeof error === 'object' && error.code === 'MODULE_NOT_FOUND'
          ? 'dependency_missing'
          : 'dependency_resolution_failed';
      throw createBootstrapFailure('dependency_resolution', category);
    }
  }

  return { admitted: true };
}

function validateReporterLoad({
  reporterPath,
  load = (value) => require(value),
  expectedCaseCount = JOINED_TEST_CASE_NAMES.length,
}) {
  if (typeof reporterPath !== 'string' || reporterPath.trim() === '') {
    throw createBootstrapFailure('reporter_load', 'reporter_load_failed');
  }

  let Reporter;
  try {
    Reporter = load(reporterPath);
    if (typeof Reporter !== 'function') throw new Error('invalid_export');
    const instance = new Reporter();
    if (
      typeof instance.onTestRunEnd !== 'function' ||
      !(Reporter.phaseByTestName instanceof Map) ||
      Reporter.phaseByTestName.size !== expectedCaseCount
    ) {
      throw new Error('invalid_reporter');
    }
  } catch {
    throw createBootstrapFailure('reporter_load', 'reporter_load_failed');
  }

  return { admitted: true };
}

function allTestCases(testModules) {
  const cases = [];
  for (const module of testModules ?? []) {
    const collection = module?.children;
    if (!collection || typeof collection.allTests !== 'function') {
      throw createBootstrapFailure(
        'module_resolution',
        'module_resolution_failed',
      );
    }
    for (const testCase of collection.allTests()) cases.push(testCase);
  }
  return cases;
}

function caseNameCandidates(testCase) {
  const candidates = [];
  if (typeof testCase?.name === 'string') candidates.push(testCase.name);
  if (typeof testCase?.fullName === 'string') {
    candidates.push(testCase.fullName.split(' > ').at(-1));
  }
  return candidates;
}

function phaseForTestCase(testCase) {
  for (const candidate of caseNameCandidates(testCase)) {
    const phase = JOINED_PHASE_BY_TEST_NAME.get(candidate);
    if (phase) return phase;
  }
  return null;
}

function readSessionClientDiagnostic(options = {}) {
  const filePath =
    typeof options.filePath === 'string'
      ? options.filePath
      : process.env[DIAGNOSTIC_CONTROL_ENV_KEY];

  return readDiagnosticControl({ filePath, required: false });
}

function classifyTestRun({
  testModules,
  unhandledErrors = [],
  reason,
  expectedCaseCount = JOINED_TEST_CASE_NAMES.length,
}) {
  if (
    (!Array.isArray(testModules) || testModules.length === 0) &&
    unhandledErrors.length > 0
  ) {
    return {
      phase: 'module_resolution',
      category: 'module_resolution_failed',
    };
  }

  let testCases;
  try {
    testCases = allTestCases(testModules);
  } catch (error) {
    return assertBootstrapFailure({
      phase: error.phase ?? 'module_resolution',
      category: error.category ?? 'module_resolution_failed',
    });
  }

  if (testCases.length !== expectedCaseCount) {
    return {
      phase: 'test_collection',
      category: 'test_collection_failed',
    };
  }

  const seenNames = new Set();
  for (const testCase of testCases) {
    const phase = phaseForTestCase(testCase);
    const name = caseNameCandidates(testCase).find((candidate) =>
      JOINED_PHASE_BY_TEST_NAME.has(candidate),
    );
    if (!phase || !name || seenNames.has(name)) {
      return {
        phase: 'test_collection',
        category: 'test_collection_failed',
      };
    }
    seenNames.add(name);

    let state;
    try {
      state = testCase?.result?.()?.state;
    } catch {
      return {
        phase: 'test_collection',
        category: 'test_collection_failed',
      };
    }
    if (state === 'skipped' || state === 'pending' || !state) {
      return {
        phase: 'test_collection',
        category: 'test_collection_failed',
      };
    }
  }

  const failedCase = testCases.find((testCase) => {
    try {
      return testCase.result()?.state === 'failed';
    } catch {
      return false;
    }
  });
  if (failedCase) {
    const phase = phaseForTestCase(failedCase);
    if (phase === 'client_authentication') {
      let diagnostic;
      try {
        diagnostic = readSessionClientDiagnostic();
      } catch {
        return {
          phase: 'final_receipt',
          category: 'final_receipt_invalid',
        };
      }
      if (diagnostic) return diagnostic;
      return {
        phase: 'final_receipt',
        category: 'final_receipt_invalid',
      };
    }
    return {
      phase,
      category:
        phase === 'client_authentication'
          ? 'client_authentication_failed'
          : 'case_execution_failed',
    };
  }

  if (unhandledErrors.length > 0) {
    return {
      phase: 'module_resolution',
      category: 'module_resolution_failed',
    };
  }

  const allPassed = testCases.every((testCase) => {
    try {
      return testCase.result()?.state === 'passed';
    } catch {
      return false;
    }
  });
  if (reason === 'passed' && allPassed) {
    return { phase: 'complete', category: 'none' };
  }

  return {
    phase: 'final_receipt',
    category: 'final_receipt_invalid',
  };
}

function classifyChildFailure(error, fallbackPhase = 'process_launch') {
  if (
    error &&
    typeof error === 'object' &&
    BOOTSTRAP_PHASE_SET.has(error.phase) &&
    BOOTSTRAP_CATEGORY_SET.has(error.category) &&
    error.category !== 'none'
  ) {
    return { phase: error.phase, category: error.category };
  }

  if (
    error &&
    typeof error === 'object' &&
    SESSION_CLIENT_PHASE_SET.has(error.phase) &&
    SESSION_CLIENT_CATEGORY_SET.has(error.category) &&
    SESSION_CLIENT_PHASE_CATEGORY_MAP.get(error.phase)?.has(error.category)
  ) {
    return { phase: error.phase, category: error.category };
  }

  const code = error && typeof error === 'object' ? error.code : null;
  const known = {
    child_spawn_failed: ['process_launch', 'spawn_failed'],
    child_command_invalid: ['command_admission', 'command_invalid'],
    child_working_directory_invalid: [
      'working_directory',
      'working_directory_invalid',
    ],
    child_timeout: ['process_launch', 'bootstrap_timeout'],
    child_signaled: ['process_launch', 'bootstrap_signal'],
    child_stdout_overflow: ['process_launch', 'bootstrap_output_overflow'],
    child_stderr_overflow: ['process_launch', 'bootstrap_output_overflow'],
    joined_receipt_invalid: ['final_receipt', 'final_receipt_invalid'],
    child_stdout_invalid: ['final_receipt', 'final_receipt_invalid'],
  };
  if (known[code]) {
    return { phase: known[code][0], category: known[code][1] };
  }

  return {
    phase: BOOTSTRAP_PHASE_SET.has(fallbackPhase)
      ? fallbackPhase
      : 'process_launch',
    category: 'bootstrap_failed',
  };
}

module.exports = {
  ALLOWED_CHILD_ENVIRONMENT_KEYS,
  BOOTSTRAP_CATEGORIES,
  BOOTSTRAP_PHASES,
  EXECUTION_PHASES,
  JOINED_PHASE_BY_TEST_NAME,
  JOINED_REPORTER_PATH,
  JOINED_TEST_CASE_NAMES,
  JOINED_TEST_PATH,
  REQUIRED_DEPENDENCIES,
  REQUIRED_JOINED_ENVIRONMENT_KEYS,
  allTestCases,
  assertBootstrapFailure,
  classifyChildFailure,
  classifyTestRun,
  createBootstrapFailure,
  expectedNpmInvocation,
  phaseForTestCase,
  readSessionClientDiagnostic,
  validateCommandAdmission,
  validateDependencyResolution,
  validateEnvironmentAdmission,
  validateReporterLoad,
  validateWorkingDirectory,
};
