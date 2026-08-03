const assert = require('node:assert/strict');
const test = require('node:test');

const {
  JOINED_TEST_CASE_NAMES,
} = require('./run-53-joined-bootstrap.cjs');
const {
  SESSION_CLIENT_CATEGORIES,
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
} = require('./run-54-session-client-runner.cjs');

const authUserId = '20000000-0000-4000-8000-000000000001';
const workspaceId = '10000000-0000-4000-8000-000000000001';
const otherWorkspaceId = '10000000-0000-4000-8000-000000000002';
const cookie = {
  name: 'sb-run49-auth-token',
  value: `base64-${Buffer.from(JSON.stringify({
    access_token: 'synthetic-session-token',
    refresh_token: 'synthetic-refresh-token',
    token_type: 'bearer',
    expires_in: 900,
    expires_at: 4102444800,
  })).toString('base64url')}`,
};
const headers = {
  origin: 'https://admin.space.test',
  host: 'admin.space.test',
};
const identity = {
  authUserId,
  email: 'admin-a@example.test',
  provider: 'google',
};
const session = {
  accessToken: 'synthetic-session-token',
  authUserId,
  issuer: 'run49-local',
  audience: 'authenticated',
  expiresAtMs: 4102444800000,
};
const membership = {
  authUserId,
  workspaceId,
  role: 'owner',
  status: 'active',
};
const client = {
  endpointName: 'disposable-postgrest',
  workspaceId,
  authenticated: true,
  staleSession: false,
  privileged: false,
};

function assertFailure(callback, phase, category) {
  assert.throws(callback, (error) => {
    assert.equal(error.code, 'session_client_state_failed');
    assert.deepEqual({ phase: error.phase, category: error.category }, {
      phase,
      category,
    });
    assert.deepEqual(Object.keys(error).sort(), ['category', 'code', 'phase']);
    return true;
  });
}

function validFixture() {
  return {
    identity,
    session,
    workspace: {
      id: workspaceId,
      memberships: [membership],
    },
  };
}

function validTransport() {
  return {
    adapter: { getAll: () => [cookie] },
    cookies: [cookie],
    headers,
  };
}

test('Run-54 state machine and category pairs are closed and public-safe', () => {
  assert.deepEqual(SESSION_CLIENT_PHASES, [
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
  assert.deepEqual(SESSION_CLIENT_CATEGORIES, [
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
  assert.deepEqual(
    assertSessionClientState({
      phase: 'client_authentication',
      category: 'client_authentication_failed',
    }),
    {
      phase: 'client_authentication',
      category: 'client_authentication_failed',
    },
  );
  for (const [phase, category] of [
    ['session_cookie_recovery', 'session_cookie_recovery_failed'],
    ['auth_user_lookup', 'auth_user_lookup_failed'],
    ['authorization_transport', 'authorization_transport_failed'],
    ['postgrest_jwt_admission', 'postgrest_jwt_admission_failed'],
    ['authenticated_role_selection', 'authenticated_role_selection_failed'],
    ['rpc_execution', 'rpc_execution_denied'],
    ['rpc_result', 'rpc_result_invalid'],
  ]) {
    assert.deepEqual(assertSessionClientState({ phase, category }), { phase, category });
  }
  assert.throws(() => createSessionClientFailure('client_authentication', 'case_execution_failed'));
  assert.throws(() => assertSessionClientState({ phase: 'unknown', category: 'unknown' }));
  for (const [phase, categories] of SESSION_CLIENT_PHASE_CATEGORY_MAP) {
    assert.ok(SESSION_CLIENT_PHASES.includes(phase));
    for (const category of categories) assert.ok(SESSION_CLIENT_CATEGORIES.includes(category));
  }
});

test('Run-54 session fixture, identity and issuance admission is closed', () => {
  assert.doesNotThrow(() => validateSessionFixture(validFixture()));
  assertFailure(() => validateSessionFixture({}), 'session_fixture', 'session_fixture_invalid');
  assertFailure(
    () => validateSessionFixture({ identity, session }),
    'session_fixture',
    'session_fixture_invalid',
  );

  assert.doesNotThrow(() => validateIdentityFixture(identity));
  assertFailure(() => validateIdentityFixture(null), 'identity_fixture', 'identity_fixture_failed');
  assertFailure(
    () => validateIdentityFixture({ ...identity, provider: 'password' }),
    'identity_fixture',
    'identity_fixture_failed',
  );
  assertFailure(
    () => validateIdentityFixture(identity, { existingAuthUserIds: [authUserId] }),
    'identity_fixture',
    'identity_fixture_failed',
  );

  assert.doesNotThrow(() => validateSessionIssue(session));
  assertFailure(
    () => validateSessionIssue({ ...session, accessToken: '' }),
    'session_issue',
    'session_issue_failed',
  );
  assertFailure(
    () => validateSessionIssue({ ...session, issuer: 'wrong-issuer' }),
    'session_issue',
    'session_issue_failed',
  );
  assertFailure(
    () => validateSessionIssue({ ...session, audience: 'anonymous' }),
    'session_issue',
    'session_issue_failed',
  );
  assertFailure(
    () => validateSessionIssue({ ...session, expiresAtMs: 1 }, { nowMs: 2 }),
    'session_issue',
    'session_issue_failed',
  );

  assert.doesNotThrow(() => validateSessionAdmission({ identity, session, authenticated: true }));
  assertFailure(
    () => validateSessionAdmission({ identity, session, authenticated: false }),
    'session_admission',
    'session_admission_failed',
  );
  assertFailure(
    () => validateSessionAdmission({
      identity,
      session: { ...session, authUserId: '30000000-0000-4000-8000-000000000001' },
      authenticated: true,
    }),
    'session_admission',
    'session_admission_failed',
  );
});

test('Run-54 session transport rejects the complete negative matrix', () => {
  assert.doesNotThrow(() => validateSessionTransport(validTransport()));
  assertFailure(
    () => validateSessionTransport({ ...validTransport(), cookies: undefined }),
    'session_transport',
    'session_cookie_missing',
  );
  assertFailure(
    () => validateSessionTransport({ ...validTransport(), cookies: [] }),
    'session_transport',
    'session_cookie_missing',
  );
  assertFailure(
    () => validateSessionTransport({
      ...validTransport(),
      cookies: [cookie, { ...cookie, name: cookie.name.toUpperCase() }],
    }),
    'session_transport',
    'session_cookie_invalid',
  );
  assertFailure(
    () => validateSessionTransport({
      ...validTransport(),
      cookies: [cookie, { name: 'sb-other-auth-token', value: 'base64-conflict' }],
    }),
    'session_transport',
    'session_cookie_invalid',
  );
  assertFailure(
    () => validateSessionTransport({
      ...validTransport(),
      cookies: [{ ...cookie, value: cookie.value.slice(0, -4) }],
    }),
    'session_transport',
    'session_cookie_invalid',
  );
  assertFailure(
    () => validateSessionTransport({ ...validTransport(), adapter: {} }),
    'session_transport',
    'session_transport_invalid',
  );
  assertFailure(
    () => validateSessionTransport({ ...validTransport(), headers: undefined }),
    'session_transport',
    'session_transport_invalid',
  );
  assertFailure(
    () => validateSessionTransport({ ...validTransport(), cookies: [{ name: 'other', value: 'value' }] }),
    'session_transport',
    'session_cookie_invalid',
  );
});

test('Run-54 workspace binding rejects missing, unknown, unauthorized and cross-workspace state', () => {
  assert.doesNotThrow(() => validateWorkspaceBinding({
    workspaceId,
    knownWorkspaceIds: [workspaceId, otherWorkspaceId],
    authUserId,
    memberships: [membership],
    clientWorkspaceId: workspaceId,
  }));
  assertFailure(
    () => validateWorkspaceBinding({ knownWorkspaceIds: [workspaceId], authUserId, memberships: [membership] }),
    'workspace_binding',
    'workspace_missing',
  );
  assertFailure(
    () => validateWorkspaceBinding({
      workspaceId: otherWorkspaceId,
      knownWorkspaceIds: [workspaceId],
      authUserId,
      memberships: [membership],
    }),
    'workspace_binding',
    'workspace_mismatch',
  );
  assertFailure(
    () => validateWorkspaceBinding({
      workspaceId,
      knownWorkspaceIds: [workspaceId],
      authUserId,
      memberships: [{ ...membership, role: 'viewer' }],
    }),
    'workspace_binding',
    'workspace_binding_failed',
  );
  assertFailure(
    () => validateWorkspaceBinding({
      workspaceId,
      knownWorkspaceIds: [workspaceId],
      authUserId,
      memberships: [membership, membership],
    }),
    'workspace_binding',
    'workspace_binding_failed',
  );
  assertFailure(
    () => validateWorkspaceBinding({
      workspaceId,
      knownWorkspaceIds: [workspaceId],
      authUserId: '30000000-0000-4000-8000-000000000001',
      memberships: [membership],
    }),
    'workspace_binding',
    'workspace_binding_failed',
  );
  assertFailure(
    () => validateWorkspaceBinding({
      workspaceId,
      knownWorkspaceIds: [workspaceId],
      authUserId,
      memberships: [membership],
      clientWorkspaceId: otherWorkspaceId,
    }),
    'workspace_binding',
    'workspace_mismatch',
  );
});

test('Run-54 client construction and authentication reject privileged, stale and anonymous clients', () => {
  assert.doesNotThrow(() => validateClientConfiguration({
    endpointName: 'disposable-postgrest',
    publicClient: true,
    privileged: false,
    browserOnly: false,
    factoryAvailable: true,
  }));
  assertFailure(
    () => validateClientConfiguration({ publicClient: true, factoryAvailable: true }),
    'client_configuration',
    'client_environment_missing',
  );
  assertFailure(
    () => validateClientConfiguration({ endpointName: 'disposable-postgrest', publicClient: false, factoryAvailable: true }),
    'client_configuration',
    'client_environment_invalid',
  );
  assertFailure(
    () => validateClientConfiguration({ endpointName: 'disposable-postgrest', publicClient: true, configuration: [] }),
    'client_configuration',
    'client_environment_invalid',
  );
  assertFailure(
    () => validateClientConfiguration({ endpointName: 'disposable-postgrest', publicClient: true, privileged: true, factoryAvailable: true }),
    'client_configuration',
    'client_environment_invalid',
  );
  assertFailure(
    () => validateClientConfiguration({ endpointName: 'disposable-postgrest', publicClient: true, factoryAvailable: false }),
    'client_construction',
    'client_construction_failed',
  );
  assert.doesNotThrow(() => validateClientConstruction({ client, endpointName: client.endpointName, workspaceId }));
  assertFailure(
    () => validateClientConstruction({ client: null, endpointName: client.endpointName, workspaceId }),
    'client_construction',
    'client_construction_failed',
  );
  assertFailure(
    () => validateClientConstruction({ client: { ...client, endpointName: 'wrong-target' }, endpointName: client.endpointName, workspaceId }),
    'client_construction',
    'client_construction_failed',
  );
  assertFailure(
    () => validateClientConstruction({ client: { ...client, authenticated: false }, endpointName: client.endpointName, workspaceId }),
    'client_authentication',
    'client_authentication_failed',
  );
  assertFailure(
    () => validateClientConstruction({ client: { ...client, staleSession: true }, endpointName: client.endpointName, workspaceId }),
    'client_authentication',
    'client_authentication_failed',
  );
  assertFailure(
    () => validateClientConstruction({ client: { ...client, privileged: true }, endpointName: client.endpointName, workspaceId }),
    'client_authentication',
    'client_authentication_failed',
  );
});

test('Run-54 request context, runner setup, case counts and final receipt are closed', () => {
  assert.doesNotThrow(() => validateRequestContext({
    headers,
    cookies: [cookie],
    client,
    workspaceId,
  }));
  assertFailure(
    () => validateRequestContext({ headers, cookies: [], client, workspaceId }),
    'request_context',
    'request_context_failed',
  );
  assertFailure(
    () => validateRequestContext({ headers, cookies: [cookie], client: null, workspaceId }),
    'request_context',
    'request_context_failed',
  );
  assertFailure(
    () => validateRequestContext({ headers, cookies: [cookie], client, workspaceId: otherWorkspaceId }),
    'workspace_binding',
    'workspace_mismatch',
  );

  const runnerInput = {
    testFile: 'test/run-49-joined-postgres.integration.test.ts',
    expectedTestFile: 'test/run-49-joined-postgres.integration.test.ts',
    caseNames: [...JOINED_TEST_CASE_NAMES],
    expectedCaseNames: [...JOINED_TEST_CASE_NAMES],
    reporterActive: true,
    context: { clientAdmitted: true, workspaceBound: true },
  };
  assert.doesNotThrow(() => validateRunnerSetup(runnerInput));
  assertFailure(
    () => validateRunnerSetup({ ...runnerInput, testFile: 'test/wrong-file.ts' }),
    'test_runner_setup',
    'test_runner_setup_failed',
  );
  assertFailure(
    () => validateRunnerSetup({ ...runnerInput, caseNames: JOINED_TEST_CASE_NAMES.slice(0, 6) }),
    'test_runner_setup',
    'test_runner_setup_failed',
  );
  assertFailure(
    () => validateRunnerSetup({ ...runnerInput, caseNames: [...JOINED_TEST_CASE_NAMES, 'extra'] }),
    'test_runner_setup',
    'test_runner_setup_failed',
  );
  assertFailure(
    () => validateRunnerSetup({ ...runnerInput, caseNames: [JOINED_TEST_CASE_NAMES[0], ...JOINED_TEST_CASE_NAMES.slice(0, 6)] }),
    'test_runner_setup',
    'test_runner_setup_failed',
  );
  assertFailure(
    () => validateRunnerSetup({ ...runnerInput, reporterActive: false }),
    'test_runner_setup',
    'test_runner_setup_failed',
  );
  assertFailure(
    () => validateRunnerSetup({ ...runnerInput, context: {} }),
    'test_runner_setup',
    'test_runner_setup_failed',
  );

  assert.doesNotThrow(() => validateCaseResults({ collected: 7, executed: 7, expectedCaseCount: 7 }));
  assertFailure(
    () => validateCaseResults({ collected: 6, executed: 7, expectedCaseCount: 7 }),
    'case_execution',
    'case_result_invalid',
  );
  assertFailure(
    () => validateCaseResults({ collected: 7, executed: 8, expectedCaseCount: 7 }),
    'case_execution',
    'case_result_invalid',
  );
  assert.doesNotThrow(() => validateFinalReceipt({
    outcome: 'passed',
    phase: 'complete',
    category: 'none',
    collected: 7,
    executed: 7,
  }));
  assertFailure(
    () => validateFinalReceipt({ outcome: 'passed', phase: 'complete', category: 'none', collected: 6, executed: 7 }),
    'final_receipt',
    'final_receipt_invalid',
  );
  assertFailure(
    () => validateFinalReceipt({ outcome: 'failed', phase: 'client_authentication', category: 'test_runner_failed' }),
    'final_receipt',
    'final_receipt_invalid',
  );
});
