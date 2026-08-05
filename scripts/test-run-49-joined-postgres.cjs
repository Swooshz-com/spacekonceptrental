const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { ensureDockerRunning } = require('./ensure-docker-running.cjs');
const {
  createMinimalChildEnvironment,
  runBoundedChildProcess,
} = require('./run-bounded-child-process.cjs');
const {
  JOINED_STDOUT_LIMIT_BYTES,
  parseJoinedReceiptOutput,
  validateJoinedReceiptProcess,
} = require('./run-49-joined-receipt.cjs');
const {
  JOINED_REPORTER_PATH,
  classifyChildFailure,
  createBootstrapFailure,
  expectedNpmInvocation,
  validateCommandAdmission,
  validateDependencyResolution,
  validateEnvironmentAdmission,
  validateReporterLoad,
  validateWorkingDirectory,
} = require('./run-53-joined-bootstrap.cjs');
const {
  DIAGNOSTIC_CONTROL_ENV_KEY,
  assertDiagnosticControlIdentity,
  createDiagnosticControl,
  readDiagnosticControl,
  removeDiagnosticControl,
} = require('./run-49-diagnostic-control.cjs');
const {
  validateClientConfiguration,
  validateIdentityFixture,
  validateSessionAdmission,
  validateSessionFixture,
  validateSessionIssue,
  validateSessionTransport,
  validateWorkspaceBinding,
} = require('./run-54-session-client-runner.cjs');

const repoRoot = path.resolve(__dirname, '..');
const websiteRoot = path.join(repoRoot, 'website');
const reporterPath = path.resolve(websiteRoot, JOINED_REPORTER_PATH);
const migrationsDir = path.join(repoRoot, 'supabase', 'migrations');
const dockerConfigDir = fs.mkdtempSync(
  path.join(os.tmpdir(), 'spacekonceptrental-run49-docker-config-'),
);
const suffix = `${process.pid}-${Date.now()}`;
const containerName = `spacekonceptrental-run49-db-${suffix}`;
const postgrestName = `spacekonceptrental-run49-postgrest-${suffix}`;
const networkName = `spacekonceptrental-run49-net-${suffix}`;
const postgresImage = process.env.SUPABASE_RLS_DB_IMAGE || 'postgres:17-alpine';
const postgrestImage =
  process.env.SUPABASE_POSTGREST_IMAGE || 'postgrest/postgrest:v12.2.12';
const postgresPassword = 'run49-postgres-password';
const authenticatorPassword = 'run49-authenticator-password';
const jwtSecret = 'run49-local-jwt-secret-32-character-test-key';

const ids = {
  workspace: '10000000-0000-4000-8000-000000000001',
  authUser: '20000000-0000-4000-8000-000000000001',
  adminUser: '30000000-0000-4000-8000-000000000001',
  category: '40000000-0000-4000-8000-000000000001',
  setupProduct: '50000000-0000-4000-8000-000000000001',
  childProduct: '50000000-0000-4000-8000-000000000002',
  otherWorkspace: '10000000-0000-4000-8000-000000000002',
  otherCategory: '40000000-0000-4000-8000-000000000002',
  otherSetupProduct: '50000000-0000-4000-8000-000000000003',
  otherChildProduct: '50000000-0000-4000-8000-000000000004',
  unauthorisedAuthUser: '60000000-0000-4000-8000-000000000001',
  unauthorisedAuthUserEmail: 'unauthorised@example.test',
};

function docker(args, options = {}) {
  const result = spawnSync('docker', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    input: options.input,
    env: {
      ...process.env,
      DOCKER_CONFIG: dockerConfigDir,
    },
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 20,
  });

  if (result.error && options.check !== false) {
    const error = new Error('disposable_docker_unavailable');
    error.code = 'disposable_docker_unavailable';
    throw error;
  }
  if (options.check !== false && result.status !== 0) {
    const error = new Error('disposable_docker_command_failed');
    error.code = 'disposable_docker_command_failed';
    throw error;
  }
  return result;
}

function psql(sql, options = {}) {
  const result = docker(
    [
      'exec', '-i', containerName, 'psql', '-v', 'ON_ERROR_STOP=1', '-X',
      '-q', '-t', '-A', '-F', '\t', '-U', 'postgres', '-d', 'postgres',
    ],
    { input: sql, check: options.check },
  );
  if (options.check === false) return result;
  return result.stdout.replace(/\r/g, '').trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPostgres() {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const probe = docker(
      ['exec', containerName, 'pg_isready', '-U', 'postgres', '-d', 'postgres'],
      { check: false },
    );
    if (probe.status === 0) {
      const query = psql('select 1;', { check: false });
      if (query.status === 0) return;
    }
    await sleep(500);
  }
  throw createBootstrapFailure('service_readiness', 'postgres_not_ready');
}

async function waitForPostgrest(port) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`);
      if (response.status < 500) return;
    } catch {
      // Keep waiting for the disposable PostgREST process.
    }
    await sleep(500);
  }
  throw createBootstrapFailure('service_readiness', 'postgrest_not_ready');
}

function setupCompatibility() {
  psql(`
    do $setup$
    begin
      if not exists (select 1 from pg_roles where rolname = 'anon') then
        create role anon nologin;
      end if;
      if not exists (select 1 from pg_roles where rolname = 'authenticated') then
        create role authenticated nologin;
      end if;
      if not exists (select 1 from pg_roles where rolname = 'service_role') then
        create role service_role nologin;
      end if;
      if not exists (select 1 from pg_roles where rolname = 'authenticator') then
        create role authenticator login password '${authenticatorPassword}' noinherit;
      end if;
    end
    $setup$;
    create schema if not exists extensions;
    create extension if not exists pgcrypto with schema extensions;
    create schema if not exists auth;
    create schema if not exists storage;
    create table if not exists storage.buckets (
      id text primary key,
      name text not null,
      public boolean not null default false,
      file_size_limit integer,
      allowed_mime_types text[],
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    create table if not exists storage.objects (
      id uuid primary key default gen_random_uuid(),
      bucket_id text not null references storage.buckets (id),
      name text not null,
      owner uuid,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      constraint storage_objects_bucket_name_key unique (bucket_id, name)
    );
    create or replace function auth.uid()
    returns uuid language sql stable
    as $$
      select coalesce(
        nullif(current_setting('request.jwt.claims', true), '')::json->>'sub',
        nullif(current_setting('request.jwt.claim.sub', true), '')
      )::uuid;
    $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    grant usage on schema public to anon, authenticated, service_role;
    grant usage on schema storage to anon, authenticated;
    grant anon to authenticator;
    grant authenticated to authenticator;
  `);
}

function applyMigrations() {
  const files = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort();
  for (const name of files) {
    psql(fs.readFileSync(path.join(migrationsDir, name), 'utf8'));
  }
}

function seedFixture() {
  psql(`
    begin;
    insert into public.workspaces (id, slug, name)
    values ('${ids.workspace}', 'run49-workspace', 'Run 49 Workspace');
    insert into public.categories (id, workspace_id, slug, name, is_published, sort_order)
    values ('${ids.category}', '${ids.workspace}', 'run49-category', 'Run 49 Category', false, 1);
    insert into public.products (id, workspace_id, category_id, slug, name, status, sort_order)
    values
      ('${ids.setupProduct}', '${ids.workspace}', '${ids.category}', 'run49-setup', 'Run 49 Setup', 'draft', 1),
      ('${ids.childProduct}', '${ids.workspace}', '${ids.category}', 'run49-child', 'Run 49 Child', 'draft', 2);
    insert into public.admin_users (id, auth_user_id, email, display_name)
    values ('${ids.adminUser}', '${ids.authUser}', 'admin-a@example.test', 'Run 49 Admin');
    insert into public.memberships (workspace_id, admin_user_id, role, status)
    values ('${ids.workspace}', '${ids.adminUser}', 'owner', 'active');
    insert into public.admin_access (
      workspace_id, normalized_email, role, status, linked_admin_user_id
    ) values (
      '${ids.workspace}', 'admin-a@example.test', 'owner', 'active', '${ids.adminUser}'
    );
    insert into public.setup_recipes (workspace_id, setup_product_id, revision)
    values ('${ids.workspace}', '${ids.setupProduct}', 1);
    insert into public.setup_recipe_items (
      workspace_id, setup_product_id, included_product_id, position, base_quantity
    ) values (
      '${ids.workspace}', '${ids.setupProduct}', '${ids.childProduct}', 0, 2
    );
    insert into public.workspaces (id, slug, name)
    values ('${ids.otherWorkspace}', 'run49-other-workspace', 'Run 49 Other Workspace');
    insert into public.categories (id, workspace_id, slug, name, is_published, sort_order)
    values ('${ids.otherCategory}', '${ids.otherWorkspace}', 'run49-other-category', 'Run 49 Other Category', false, 1);
    insert into public.products (id, workspace_id, category_id, slug, name, status, sort_order)
    values
      ('${ids.otherSetupProduct}', '${ids.otherWorkspace}', '${ids.otherCategory}', 'run49-other-setup', 'Run 49 Other Setup', 'draft', 1),
      ('${ids.otherChildProduct}', '${ids.otherWorkspace}', '${ids.otherCategory}', 'run49-other-child', 'Run 49 Other Child', 'draft', 2);
    insert into public.setup_recipes (workspace_id, setup_product_id, revision)
    values ('${ids.otherWorkspace}', '${ids.otherSetupProduct}', 1);
    insert into public.setup_recipe_items (
      workspace_id, setup_product_id, included_product_id, position, base_quantity
    ) values (
      '${ids.otherWorkspace}', '${ids.otherSetupProduct}', '${ids.otherChildProduct}', 0, 1
    );
    commit;
    grant select on table public.admin_users, public.memberships to authenticated;
    grant anon to authenticator;
    grant authenticated to authenticator;
    grant connect on database postgres to authenticator;
  `);
}

function base64UrlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function verifyJwt(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  let parsedHeader;
  let parsedPayload;
  try {
    parsedHeader = JSON.parse(Buffer.from(header, 'base64url').toString('utf8'));
    parsedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (
    parsedHeader?.alg !== 'HS256' ||
    typeof parsedPayload?.sub !== 'string' ||
    parsedPayload?.iss !== 'run49-local' ||
    parsedPayload?.aud !== 'authenticated'
  ) return null;
  const expected = crypto
    .createHmac('sha256', jwtSecret)
    .update(`${header}.${payload}`)
    .digest('base64url');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  if (typeof parsedPayload.exp === 'number' && parsedPayload.exp <= Math.floor(Date.now() / 1000)) return null;
  return parsedPayload;
}

const consumeRpcSignature =
  'public.consume_admin_csrf_proof(text,uuid,text,bigint,bigint)';

function createConsumeRpcFailureController() {
  let originalDefinition = null;

  function reloadPostgrestSchema() {
    psql("notify pgrst, 'reload schema';");
  }

  function enable() {
    if (originalDefinition !== null) {
      throw new Error('fixture_consume_rpc_already_intervened');
    }

    originalDefinition = psql(
      `select pg_catalog.pg_get_functiondef('${consumeRpcSignature}'::pg_catalog.regprocedure);`,
    );
    psql(`
      create or replace function public.consume_admin_csrf_proof(
        p_operation text,
        p_expected_workspace_id uuid,
        p_proof_fingerprint text,
        p_issued_at_ms bigint,
        p_expires_at_ms bigint
      )
      returns boolean
      language plpgsql
      volatile
      security definer
      set search_path = pg_catalog
      as $run62$
      begin
        raise exception 'run62_fixture_consume_rpc_operational_failure';
      end;
      $run62$;
    `);
    reloadPostgrestSchema();
    return { ok: true, enabled: true };
  }

  function restore() {
    if (originalDefinition === null) {
      return { ok: true, restored: true };
    }

    const definition = originalDefinition;
    psql(definition);
    reloadPostgrestSchema();
    const restoredDefinition = psql(
      `select pg_catalog.pg_get_functiondef('${consumeRpcSignature}'::pg_catalog.regprocedure);`,
    );
    if (restoredDefinition !== definition) {
      throw new Error('fixture_consume_rpc_restore_failed');
    }
    originalDefinition = null;
    return { ok: true, restored: true };
  }

  return {
    hasIntervention: () => originalDefinition !== null,
    enable,
    restore,
  };
}

function startAuthAndPostgrestGateway(postgrestPort, fixtureController) {
  const server = http.createServer(async (request, response) => {
    try {
      if (
        request.method === 'POST' &&
        request.url === '/__run49_fixture/consume-rpc-failure/enable'
      ) {
        const result = fixtureController.enable();
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify(result));
        return;
      }

      if (
        request.method === 'POST' &&
        request.url === '/__run49_fixture/consume-rpc-failure/restore'
      ) {
        const result = fixtureController.restore();
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify(result));
        return;
      }

      if (request.url === '/auth/v1/user') {
        const token = String(request.headers.authorization || '').replace(/^Bearer\s+/i, '');
        const claims = verifyJwt(token);
        if (!claims) {
          response.writeHead(401, { 'content-type': 'application/json' });
          response.end(JSON.stringify({ error: 'invalid_token' }));
          return;
        }
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify({
          id: claims.sub,
          email: claims.email,
          app_metadata: { provider: 'google' },
          user_metadata: {},
        }));
        return;
      }

      const chunks = [];
      for await (const chunk of request) chunks.push(Buffer.from(chunk));
      const postgrestPath = request.url.startsWith('/rest/v1')
        ? request.url.slice('/rest/v1'.length) || '/'
        : request.url;
      const upstream = await fetch(`http://127.0.0.1:${postgrestPort}${postgrestPath}`, {
        method: request.method,
        headers: Object.fromEntries(
          Object.entries(request.headers).filter(([name]) => name.toLowerCase() !== 'host'),
        ),
        body: chunks.length ? Buffer.concat(chunks) : undefined,
      });
      const body = Buffer.from(await upstream.arrayBuffer());
      const headers = {};
      upstream.headers.forEach((value, name) => {
        if (!['connection', 'keep-alive', 'transfer-encoding'].includes(name.toLowerCase())) {
          headers[name] = value;
        }
      });
      response.writeHead(upstream.status, headers);
      response.end(body);
    } catch {
      response.writeHead(502, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: 'local_transport_unavailable' }));
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({ server, port: address.port });
    });
  });
}

function startPostgrest() {
  docker([
    'run', '--rm', '--name', postgrestName, '--network', networkName,
    '-e', `PGRST_DB_URI=postgres://authenticator:${authenticatorPassword}@${containerName}:5432/postgres`,
    '-e', 'PGRST_DB_SCHEMAS=public',
    '-e', 'PGRST_DB_ANON_ROLE=anon',
    '-e', `PGRST_JWT_SECRET=${jwtSecret}`,
    '-e', 'PGRST_SERVER_PORT=3000',
    '-p', '127.0.0.1::3000',
    '-d', postgrestImage,
  ]);
  const mapped = docker(['port', postgrestName, '3000/tcp']).stdout.trim();
  const match = mapped.match(/:(\d+)$/m);
  if (!match) {
    throw createBootstrapFailure('service_readiness', 'postgrest_not_ready');
  }
  return Number(match[1]);
}

function createRun49Jwt({ sub, email } = {}) {
  const header = base64UrlJson({ alg: 'HS256', typ: 'JWT' });
  const payload = base64UrlJson({
    sub: sub ?? ids.authUser,
    email: email ?? 'admin-a@example.test',
    iss: 'run49-local',
    role: 'authenticated',
    aud: 'authenticated',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900,
  });
  const signature = crypto.createHmac('sha256', jwtSecret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function admitRun54SessionFixture({ accessToken, gatewayPort }) {
  const identity = {
    authUserId: ids.authUser,
    email: 'admin-a@example.test',
    provider: 'google',
  };
  const session = {
    accessToken,
    authUserId: ids.authUser,
    issuer: 'run49-local',
    audience: 'authenticated',
    expiresAtMs: Date.now() + 900_000,
  };
  const cookieName = `sb-${new URL(`http://127.0.0.1:${gatewayPort}`).hostname.split('.')[0]}-auth-token`;
  const sessionCookie = {
    name: cookieName,
    value: `base64-${base64UrlJson({
      access_token: accessToken,
      refresh_token: 'run49-local-refresh-token',
      token_type: 'bearer',
      expires_in: 900,
      expires_at: Math.floor(session.expiresAtMs / 1000),
    })}`,
  };
  const fixture = {
    identity,
    session,
    workspace: {
      id: ids.workspace,
      memberships: [{
        authUserId: ids.authUser,
        workspaceId: ids.workspace,
        role: 'owner',
        status: 'active',
      }],
    },
  };

  validateSessionFixture(fixture);
  validateIdentityFixture(identity);
  validateSessionIssue(session);
  validateSessionAdmission({ identity, session, authenticated: true });
  validateSessionTransport({
    adapter: { getAll: () => [sessionCookie] },
    cookies: [sessionCookie],
    headers: {
      origin: 'https://admin.space.test',
      host: 'admin.space.test',
    },
  });
  validateWorkspaceBinding({
    workspaceId: ids.workspace,
    knownWorkspaceIds: [ids.workspace],
    authUserId: ids.authUser,
    memberships: fixture.workspace.memberships,
  });

  const claims = verifyJwt(accessToken);
  if (!claims) {
    const error = new Error('session_client_state_failed');
    error.code = 'session_client_state_failed';
    error.phase = 'session_issue';
    error.category = 'session_issue_failed';
    throw error;
  }

  return fixture;
}

async function main() {
  const readiness = ensureDockerRunning();
  if (!readiness.ok) {
    console.error(
      'Run-49 joined integration failed: service_readiness/service_readiness_failed.',
    );
    fs.rmSync(dockerConfigDir, { recursive: true, force: true });
    process.exitCode = 1;
    return;
  }

  let gateway;
  let fixtureController;
  let diagnosticControl = null;
  let currentPhase = 'service_readiness';
  try {
    docker(['network', 'create', '--label', 'spacekonceptrental.run49=true', networkName]);
    docker([
      'run', '--rm', '--name', containerName, '--network', networkName,
      '--label', 'spacekonceptrental.run49=true',
      '-e', `POSTGRES_PASSWORD=${postgresPassword}`,
      '-e', 'POSTGRES_DB=postgres', '-d', postgresImage,
    ]);
    await waitForPostgres();
    setupCompatibility();
    applyMigrations();
    seedFixture();
    const postgrestPort = startPostgrest();
    await waitForPostgrest(postgrestPort);
    fixtureController = createConsumeRpcFailureController();
    gateway = await startAuthAndPostgrestGateway(postgrestPort, fixtureController);

    currentPhase = 'command_admission';
    const invocation = expectedNpmInvocation();
    validateCommandAdmission(invocation);

    currentPhase = 'working_directory';
    validateWorkingDirectory({
      cwd: websiteRoot,
      repoRoot,
      websiteRoot,
    });

    currentPhase = 'dependency_resolution';
    validateDependencyResolution({ websiteRoot });

    currentPhase = 'reporter_load';
    validateReporterLoad({ reporterPath });

    diagnosticControl = createDiagnosticControl();
    const childEnvironment = createMinimalChildEnvironment({
      ...process.env,
      RUN49_JOINED: '1',
      RUN49_SUPABASE_URL: `http://127.0.0.1:${gateway.port}`,
      RUN49_ACCESS_TOKEN: createRun49Jwt(),
      RUN49_JWT_SECRET: jwtSecret,
      RUN49_WORKSPACE_ID: ids.workspace,
      RUN49_SETUP_PRODUCT_ID: ids.setupProduct,
      RUN49_CHILD_PRODUCT_ID: ids.childProduct,
      RUN49_OTHER_WORKSPACE_ID: ids.otherWorkspace,
      RUN49_OTHER_SETUP_PRODUCT_ID: ids.otherSetupProduct,
      RUN49_UNAUTHORISED_AUTH_USER_ID: ids.unauthorisedAuthUser,
      RUN49_UNAUTHORISED_AUTH_USER_EMAIL: ids.unauthorisedAuthUserEmail,
      RUN49_FIXTURE_CONTROL_URL: `http://127.0.0.1:${gateway.port}/__run49_fixture`,
      [DIAGNOSTIC_CONTROL_ENV_KEY]: diagnosticControl.filePath,
      ADMIN_EXPECTED_ORIGIN: 'https://admin.space.test',
      ADMIN_EXPECTED_HOST: 'admin.space.test',
      ADMIN_TRUSTED_WORKSPACE_ID: ids.workspace,
      ADMIN_MUTATIONS_ENABLED: 'true',
      ADMIN_CSRF_PROOF_SECRET: 'run49-csrf-proof-secret',
      SUPABASE_URL: `http://127.0.0.1:${gateway.port}`,
      SUPABASE_ANON_KEY: 'run49-anon-key',
    });

    admitRun54SessionFixture({
      accessToken: childEnvironment.RUN49_ACCESS_TOKEN,
      gatewayPort: gateway.port,
    });
    validateClientConfiguration({
      endpointName: childEnvironment.RUN49_SUPABASE_URL,
      publicClient: Object.hasOwn(childEnvironment, 'SUPABASE_ANON_KEY'),
      privileged: Object.hasOwn(childEnvironment, 'SUPABASE_SERVICE_ROLE_KEY'),
      browserOnly: false,
      factoryAvailable: true,
    });

    currentPhase = 'environment_admission';
    validateEnvironmentAdmission(childEnvironment);

    currentPhase = 'process_launch';
    const result = await runBoundedChildProcess(
      invocation.command,
      invocation.args,
      {
        cwd: websiteRoot,
        env: childEnvironment,
        allowNonZeroExit: true,
        maxStdoutBytes: JOINED_STDOUT_LIMIT_BYTES,
        stdoutValidator: parseJoinedReceiptOutput,
      },
    );
    const joinedReceipt = validateJoinedReceiptProcess(result.stdoutValue, result);
    assertDiagnosticControlIdentity({ filePath: diagnosticControl.filePath });
    const diagnosticRecord = readDiagnosticControl({
      filePath: diagnosticControl.filePath,
      required: false,
    });

    const diagnosticPhases = new Set([
      'session_cookie_recovery',
      'auth_user_lookup',
      'authorization_transport',
      'postgrest_jwt_admission',
      'authenticated_role_selection',
      'rpc_execution',
      'rpc_result',
    ]);
    const receiptCarriesDiagnostic = diagnosticPhases.has(joinedReceipt.phase);
    if (joinedReceipt.outcome === 'passed') {
      if (diagnosticRecord) {
        console.error(
          'Run-49 joined integration failed: final_receipt/diagnostic_on_passed_run.',
        );
        process.exitCode = 1;
      } else {
        console.log('Run-49 joined integration completed.');
      }
    } else {
      if (receiptCarriesDiagnostic && diagnosticRecord) {
        if (
          diagnosticRecord.phase !== joinedReceipt.phase ||
          diagnosticRecord.category !== joinedReceipt.category
        ) {
          console.error(
            'Run-49 joined integration failed: final_receipt/diagnostic_conflict.',
          );
          process.exitCode = 1;
        } else {
          console.error(
            `Run-49 joined integration failed: ${joinedReceipt.phase}/${joinedReceipt.category}.`,
          );
          process.exitCode = 1;
        }
      } else {
        const diagnosticSuffix = diagnosticRecord
          ? `/${diagnosticRecord.phase}/${diagnosticRecord.category}`
          : '';
        console.error(
          `Run-49 joined integration failed: ${joinedReceipt.phase}/${joinedReceipt.category}${diagnosticSuffix}.`,
        );
        process.exitCode = 1;
      }
    }
  } catch (error) {
    const failure =
      currentPhase === 'service_readiness' &&
      !(error && typeof error === 'object' && error.phase && error.category)
        ? { phase: 'service_readiness', category: 'service_readiness_failed' }
        : classifyChildFailure(error, currentPhase);
    console.error(
      `Run-49 joined integration failed: ${failure.phase}/${failure.category}.`,
    );
    process.exitCode = 1;
  } finally {
    if (fixtureController?.hasIntervention()) {
      try {
        fixtureController.restore();
      } catch {
        process.exitCode = 1;
      }
    }
    if (gateway) await new Promise((resolve) => gateway.server.close(resolve));
    docker(['rm', '-f', postgrestName], { check: false });
    docker(['rm', '-f', containerName], { check: false });
    docker(['network', 'rm', networkName], { check: false });
    const remainingContainers = [containerName, postgrestName].flatMap((name) =>
      docker(
        ['ps', '-a', '--filter', `name=${name}`, '--format', '{{.Names}}'],
        { check: false },
      ).stdout.trim().split(/\r?\n/).filter(Boolean),
    );
    const remainingNetworks = docker(
      ['network', 'ls', '--filter', `name=${networkName}`, '--format', '{{.Name}}'],
      { check: false },
    ).stdout.trim();
    if (remainingContainers.length > 0 || remainingNetworks) {
      process.exitCode = 1;
    }
    fs.rmSync(dockerConfigDir, { recursive: true, force: true });
    if (diagnosticControl) {
      removeDiagnosticControl({ dir: diagnosticControl.dir });
    }
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Run-49 joined integration failed: final_receipt/final_receipt_invalid.');
    process.exitCode = 1;
  });
}

module.exports = {
  createMinimalChildEnvironment,
  runBoundedChildProcess,
};
