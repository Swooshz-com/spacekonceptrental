const SESSION_CLIENT_PHASES = Object.freeze([
  'session_fixture',
  'identity_fixture',
  'session_issue',
  'session_transport',
  'session_admission',
  'workspace_binding',
  'client_configuration',
  'client_construction',
  'client_authentication',
  'session_cookie_recovery',
  'auth_user_lookup',
  'authorization_transport',
  'postgrest_jwt_admission',
  'authenticated_role_selection',
  'rpc_execution',
  'rpc_result',
  'request_context',
  'test_runner_setup',
  'case_execution',
  'final_receipt',
]);

const SESSION_CLIENT_CATEGORIES = Object.freeze([
  'session_fixture_invalid',
  'identity_fixture_failed',
  'session_issue_failed',
  'session_cookie_missing',
  'session_cookie_invalid',
  'session_transport_invalid',
  'session_admission_failed',
  'workspace_missing',
  'workspace_mismatch',
  'workspace_binding_failed',
  'client_environment_missing',
  'client_environment_invalid',
  'client_construction_failed',
  'client_authentication_failed',
  'session_cookie_recovery_failed',
  'auth_user_lookup_failed',
  'authorization_transport_failed',
  'postgrest_jwt_admission_failed',
  'authenticated_role_selection_failed',
  'rpc_execution_denied',
  'rpc_result_invalid',
  'request_context_failed',
  'test_runner_setup_failed',
  'case_execution_failed',
  'case_result_invalid',
  'final_receipt_invalid',
  'test_runner_failed',
  'none',
]);

const SESSION_CLIENT_PHASE_CATEGORY_MAP = new Map([
  ['session_fixture', new Set(['session_fixture_invalid'])],
  ['identity_fixture', new Set(['identity_fixture_failed'])],
  ['session_issue', new Set(['session_issue_failed'])],
  ['session_transport', new Set([
    'session_cookie_missing',
    'session_cookie_invalid',
    'session_transport_invalid',
  ])],
  ['session_admission', new Set(['session_admission_failed'])],
  ['workspace_binding', new Set([
    'workspace_missing',
    'workspace_mismatch',
    'workspace_binding_failed',
  ])],
  ['client_configuration', new Set([
    'client_environment_missing',
    'client_environment_invalid',
  ])],
  ['client_construction', new Set(['client_construction_failed'])],
  ['client_authentication', new Set(['client_authentication_failed'])],
  ['session_cookie_recovery', new Set(['session_cookie_recovery_failed'])],
  ['auth_user_lookup', new Set(['auth_user_lookup_failed'])],
  ['authorization_transport', new Set(['authorization_transport_failed'])],
  ['postgrest_jwt_admission', new Set(['postgrest_jwt_admission_failed'])],
  ['authenticated_role_selection', new Set(['authenticated_role_selection_failed'])],
  ['rpc_execution', new Set(['rpc_execution_denied'])],
  ['rpc_result', new Set(['rpc_result_invalid'])],
  ['request_context', new Set(['request_context_failed'])],
  ['test_runner_setup', new Set([
    'test_runner_setup_failed',
    'test_runner_failed',
  ])],
  ['case_execution', new Set([
    'case_execution_failed',
    'case_result_invalid',
  ])],
  ['final_receipt', new Set(['final_receipt_invalid'])],
]);

const SESSION_CLIENT_DIAGNOSTIC_PREFIX = 'run49_session_client_diagnostic:';
const SESSION_CLIENT_DIAGNOSTIC_STATES = Object.freeze([
  Object.freeze({
    phase: 'session_cookie_recovery',
    category: 'session_cookie_recovery_failed',
  }),
  Object.freeze({
    phase: 'auth_user_lookup',
    category: 'auth_user_lookup_failed',
  }),
  Object.freeze({
    phase: 'authorization_transport',
    category: 'authorization_transport_failed',
  }),
  Object.freeze({
    phase: 'postgrest_jwt_admission',
    category: 'postgrest_jwt_admission_failed',
  }),
  Object.freeze({
    phase: 'authenticated_role_selection',
    category: 'authenticated_role_selection_failed',
  }),
  Object.freeze({
    phase: 'rpc_execution',
    category: 'rpc_execution_denied',
  }),
  Object.freeze({
    phase: 'rpc_result',
    category: 'rpc_result_invalid',
  }),
]);
const SESSION_CLIENT_DIAGNOSTIC_BY_MESSAGE = new Map(
  SESSION_CLIENT_DIAGNOSTIC_STATES.map((state) => [
    `${SESSION_CLIENT_DIAGNOSTIC_PREFIX}${state.phase}:${state.category}`,
    state,
  ]),
);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function createSessionClientFailure(phase, category) {
  const allowedCategories = SESSION_CLIENT_PHASE_CATEGORY_MAP.get(phase);
  if (!allowedCategories || !allowedCategories.has(category)) {
    throw new Error('session_client_state_invalid');
  }

  const error = new Error('session_client_state_failed');
  error.code = 'session_client_state_failed';
  error.phase = phase;
  error.category = category;
  return error;
}

function fail(phase, category) {
  throw createSessionClientFailure(phase, category);
}

function assertSessionClientState(value) {
  if (
    !isRecord(value) ||
    !SESSION_CLIENT_PHASES.includes(value.phase) ||
    !SESSION_CLIENT_CATEGORIES.includes(value.category) ||
    value.category === 'none' ||
    !SESSION_CLIENT_PHASE_CATEGORY_MAP.get(value.phase)?.has(value.category)
  ) {
    throw new Error('session_client_state_invalid');
  }

  return { phase: value.phase, category: value.category };
}

function validateSessionFixture(fixture) {
  if (
    !isRecord(fixture) ||
    !isRecord(fixture.identity) ||
    !isRecord(fixture.session) ||
    !isRecord(fixture.workspace)
  ) {
    fail('session_fixture', 'session_fixture_invalid');
  }

  return { admitted: true };
}

function validateIdentityFixture(identity, options = {}) {
  if (
    !isRecord(identity) ||
    typeof identity.authUserId !== 'string' ||
    !UUID_PATTERN.test(identity.authUserId) ||
    typeof identity.email !== 'string' ||
    !EMAIL_PATTERN.test(identity.email) ||
    identity.provider !== 'google'
  ) {
    fail('identity_fixture', 'identity_fixture_failed');
  }

  if (
    Array.isArray(options.existingAuthUserIds) &&
    options.existingAuthUserIds.includes(identity.authUserId)
  ) {
    fail('identity_fixture', 'identity_fixture_failed');
  }

  return { admitted: true };
}

function validateSessionIssue(session, options = {}) {
  if (
    !isRecord(session) ||
    typeof session.accessToken !== 'string' ||
    session.accessToken.trim() === '' ||
    typeof session.authUserId !== 'string' ||
    !UUID_PATTERN.test(session.authUserId) ||
    session.issuer !== (options.issuer ?? 'run49-local') ||
    session.audience !== 'authenticated' ||
    !Number.isSafeInteger(session.expiresAtMs) ||
    session.expiresAtMs <= (options.nowMs ?? Date.now())
  ) {
    fail('session_issue', 'session_issue_failed');
  }

  return { admitted: true };
}

function validateSessionAdmission({ identity, session, authenticated } = {}) {
  if (
    authenticated !== true ||
    !isRecord(identity) ||
    !isRecord(session) ||
    identity.authUserId !== session.authUserId ||
    session.issuer !== 'run49-local' ||
    session.audience !== 'authenticated' ||
    !Number.isSafeInteger(session.expiresAtMs) ||
    session.expiresAtMs <= Date.now()
  ) {
    fail('session_admission', 'session_admission_failed');
  }

  return { admitted: true };
}

function readHeader(headers, name) {
  if (headers && typeof headers.get === 'function') {
    return headers.get(name);
  }

  if (!isRecord(headers)) return null;

  const wanted = name.toLowerCase();
  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === wanted);
  return key ? headers[key] : null;
}

function isValidSessionCookieValue(value) {
  if (!value.startsWith('base64-')) return false;

  try {
    const decoded = JSON.parse(
      Buffer.from(value.slice('base64-'.length), 'base64url').toString('utf8'),
    );
    return Boolean(
      isRecord(decoded) &&
      typeof decoded.access_token === 'string' &&
      decoded.access_token.trim() !== '' &&
      typeof decoded.refresh_token === 'string' &&
      decoded.refresh_token.trim() !== '' &&
      decoded.token_type === 'bearer' &&
      Number.isSafeInteger(decoded.expires_in) &&
      Number.isSafeInteger(decoded.expires_at),
    );
  } catch {
    return false;
  }
}

function validateSessionTransport({ adapter, cookies, headers } = {}) {
  if (!isRecord(adapter) || typeof adapter.getAll !== 'function') {
    fail('session_transport', 'session_transport_invalid');
  }

  if (!Array.isArray(cookies) || cookies.length === 0) {
    fail('session_transport', 'session_cookie_missing');
  }

  const names = new Set();
  for (const cookie of cookies) {
    if (
      !isRecord(cookie) ||
      typeof cookie.name !== 'string' ||
      cookie.name.trim() === '' ||
      typeof cookie.value !== 'string' ||
      cookie.value === '' ||
      !isValidSessionCookieValue(cookie.value)
    ) {
      fail('session_transport', 'session_cookie_invalid');
    }

    const normalizedName = cookie.name.toLowerCase();
    if (names.has(normalizedName)) {
      fail('session_transport', 'session_cookie_invalid');
    }
    names.add(normalizedName);
  }

  const authCookies = cookies.filter((cookie) =>
    cookie.name.toLowerCase().includes('auth-token'),
  );
  if (authCookies.length === 0) {
    fail('session_transport', 'session_cookie_missing');
  }
  if (authCookies.length > 1) {
    fail('session_transport', 'session_cookie_invalid');
  }

  if (
    typeof readHeader(headers, 'origin') !== 'string' ||
    readHeader(headers, 'origin').trim() === '' ||
    typeof readHeader(headers, 'host') !== 'string' ||
    readHeader(headers, 'host').trim() === ''
  ) {
    fail('session_transport', 'session_transport_invalid');
  }

  return { admitted: true };
}

function validateWorkspaceBinding({
  workspaceId,
  knownWorkspaceIds,
  authUserId,
  memberships,
  clientWorkspaceId,
} = {}) {
  if (typeof workspaceId !== 'string' || workspaceId.trim() === '') {
    fail('workspace_binding', 'workspace_missing');
  }

  if (!Array.isArray(knownWorkspaceIds) || !knownWorkspaceIds.includes(workspaceId)) {
    fail('workspace_binding', 'workspace_mismatch');
  }

  const matchingMemberships = (Array.isArray(memberships) ? memberships : []).filter(
    (membership) => membership?.workspaceId === workspaceId,
  );
  if (matchingMemberships.length !== 1) {
    fail('workspace_binding', 'workspace_binding_failed');
  }

  const membership = matchingMemberships[0];
  if (
    membership.authUserId !== authUserId ||
    membership.status !== 'active' ||
    !['owner', 'admin'].includes(membership.role)
  ) {
    fail('workspace_binding', 'workspace_binding_failed');
  }

  if (clientWorkspaceId !== undefined && clientWorkspaceId !== workspaceId) {
    fail('workspace_binding', 'workspace_mismatch');
  }

  return { admitted: true };
}

function validateClientConfiguration(input = {}) {
  if (!isRecord(input)) {
    fail('client_configuration', 'client_environment_invalid');
  }

  const {
    endpointName,
    publicClient,
    privileged,
    browserOnly,
    factoryAvailable,
    configuration,
  } = input;

  if (typeof endpointName !== 'string' || endpointName.trim() === '') {
    fail('client_configuration', 'client_environment_missing');
  }

  if (
    publicClient !== true ||
    privileged === true ||
    browserOnly === true ||
    (configuration !== undefined && !isRecord(configuration))
  ) {
    fail('client_configuration', 'client_environment_invalid');
  }

  if (factoryAvailable !== true) {
    fail('client_construction', 'client_construction_failed');
  }

  return { admitted: true };
}

function validateClientConstruction({ client, endpointName, workspaceId } = {}) {
  if (
    !isRecord(client) ||
    client.endpointName !== endpointName ||
    client.workspaceId !== workspaceId
  ) {
    fail('client_construction', 'client_construction_failed');
  }

  if (
    client.authenticated !== true ||
    client.staleSession === true ||
    client.privileged === true
  ) {
    fail('client_authentication', 'client_authentication_failed');
  }

  return { admitted: true };
}

function validateRequestContext({
  headers,
  cookies,
  client,
  workspaceId,
} = {}) {
  if (
    !isRecord(client) ||
    client.authenticated !== true ||
    !Array.isArray(cookies) ||
    cookies.length === 0 ||
    typeof readHeader(headers, 'origin') !== 'string' ||
    typeof readHeader(headers, 'host') !== 'string'
  ) {
    fail('request_context', 'request_context_failed');
  }

  if (client.workspaceId !== workspaceId) {
    fail('workspace_binding', 'workspace_mismatch');
  }

  return { admitted: true };
}

function validateRunnerSetup({
  testFile,
  expectedTestFile,
  caseNames,
  expectedCaseNames,
  reporterActive,
  context,
} = {}) {
  if (
    testFile !== expectedTestFile ||
    reporterActive !== true ||
    !isRecord(context) ||
    context.clientAdmitted !== true ||
    context.workspaceBound !== true ||
    !Array.isArray(caseNames) ||
    !Array.isArray(expectedCaseNames) ||
    caseNames.length !== expectedCaseNames.length ||
    new Set(caseNames).size !== caseNames.length ||
    caseNames.some((name, index) => name !== expectedCaseNames[index])
  ) {
    fail('test_runner_setup', 'test_runner_setup_failed');
  }

  return { admitted: true };
}

function validateCaseResults({ collected, executed, expectedCaseCount } = {}) {
  if (
    !Number.isSafeInteger(collected) ||
    !Number.isSafeInteger(executed) ||
    !Number.isSafeInteger(expectedCaseCount) ||
    collected !== expectedCaseCount ||
    executed !== expectedCaseCount
  ) {
    fail('case_execution', 'case_result_invalid');
  }

  return { admitted: true };
}

function validateFinalReceipt({ outcome, phase, category, collected, executed } = {}) {
  if (
    outcome === 'passed' &&
    (phase !== 'complete' || category !== 'none' || collected !== 7 || executed !== 7)
  ) {
    fail('final_receipt', 'final_receipt_invalid');
  }

  if (
    outcome !== 'passed' &&
    (!SESSION_CLIENT_PHASE_CATEGORY_MAP.get(phase)?.has(category) || category === 'none')
  ) {
    fail('final_receipt', 'final_receipt_invalid');
  }

  return { admitted: true };
}

module.exports = {
  SESSION_CLIENT_CATEGORIES,
  SESSION_CLIENT_DIAGNOSTIC_BY_MESSAGE,
  SESSION_CLIENT_DIAGNOSTIC_PREFIX,
  SESSION_CLIENT_DIAGNOSTIC_STATES,
  SESSION_CLIENT_PHASES,
  SESSION_CLIENT_PHASE_CATEGORY_MAP,
  assertSessionClientState,
  createSessionClientFailure,
  validateCaseResults,
  validateClientConfiguration,
  validateClientConstruction,
  validateFinalReceipt,
  validateIdentityFixture,
  validateRequestContext,
  validateRunnerSetup,
  validateSessionAdmission,
  validateSessionFixture,
  validateSessionIssue,
  validateSessionTransport,
  validateWorkspaceBinding,
};
