const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const migrationsDir = path.join(repoRoot, 'supabase', 'migrations');
const dockerImage = process.env.SUPABASE_RLS_DB_IMAGE || 'postgres:16-alpine';
const containerName =
  process.env.SUPABASE_RLS_CONTAINER_NAME ||
  `spacekonceptrental-rls-test-${process.pid}-${Date.now()}`;
const keepContainer = process.env.SUPABASE_RLS_KEEP_DB === '1';
const dockerConfigDir = fs.mkdtempSync(
  path.join(os.tmpdir(), 'spacekonceptrental-docker-config-'),
);

const expectedTables = [
  'admin_users',
  'audit_logs',
  'categories',
  'conversations',
  'integration_connections',
  'memberships',
  'messages',
  'product_images',
  'products',
  'quote_request_items',
  'quote_requests',
  'usage_events',
  'workspaces',
];

const ids = {
  workspaceA: '10000000-0000-4000-8000-000000000001',
  workspaceB: '10000000-0000-4000-8000-000000000002',
  authMemberA: '20000000-0000-4000-8000-000000000001',
  authMemberB: '20000000-0000-4000-8000-000000000002',
  authNoMembership: '20000000-0000-4000-8000-000000000003',
  adminA: '30000000-0000-4000-8000-000000000001',
  adminB: '30000000-0000-4000-8000-000000000002',
  adminNoMembership: '30000000-0000-4000-8000-000000000003',
  categoryPublishedA: '40000000-0000-4000-8000-000000000001',
  categoryDraftA: '40000000-0000-4000-8000-000000000002',
  categoryPublishedB: '40000000-0000-4000-8000-000000000003',
  categoryDraftB: '40000000-0000-4000-8000-000000000004',
  productPublishedA: '50000000-0000-4000-8000-000000000001',
  productDraftA: '50000000-0000-4000-8000-000000000002',
  productPublishedB: '50000000-0000-4000-8000-000000000003',
  productDraftB: '50000000-0000-4000-8000-000000000004',
  imagePublishedA: '60000000-0000-4000-8000-000000000001',
  imageDraftA: '60000000-0000-4000-8000-000000000002',
  imagePublishedB: '60000000-0000-4000-8000-000000000003',
  imageDraftB: '60000000-0000-4000-8000-000000000004',
  quoteA: '70000000-0000-4000-8000-000000000001',
  quoteB: '70000000-0000-4000-8000-000000000002',
  quoteItemA: '71000000-0000-4000-8000-000000000001',
  quoteItemB: '71000000-0000-4000-8000-000000000002',
  conversationA: '80000000-0000-4000-8000-000000000001',
  conversationB: '80000000-0000-4000-8000-000000000002',
  messageA: '90000000-0000-4000-8000-000000000001',
  messageB: '90000000-0000-4000-8000-000000000002',
  usageA: 'a0000000-0000-4000-8000-000000000001',
  usageB: 'a0000000-0000-4000-8000-000000000002',
  auditA: 'b0000000-0000-4000-8000-000000000001',
  auditB: 'b0000000-0000-4000-8000-000000000002',
  integrationA: 'c0000000-0000-4000-8000-000000000001',
  integrationB: 'c0000000-0000-4000-8000-000000000002',
};

const checks = [];

function check(name, fn) {
  checks.push({ name, fn });
}

function assertSafeContainerName(name) {
  assert.match(
    name,
    /^spacekonceptrental-rls-test-[A-Za-z0-9_.-]+$/,
    'Refusing to manage a Docker container without the spacekonceptrental-rls-test- prefix.',
  );
}

function commandForDisplay(command, args) {
  return [command, ...args].join(' ');
}

function docker(args, options = {}) {
  const result = spawnSync('docker', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    input: options.input,
    env: {
      ...process.env,
      DOCKER_CONFIG: dockerConfigDir,
    },
    maxBuffer: 1024 * 1024 * 20,
  });

  if (result.error) {
    throw result.error;
  }

  if (options.check !== false && result.status !== 0) {
    throw new Error(
      [
        `Command failed: ${commandForDisplay('docker', args)}`,
        result.stdout.trim(),
        result.stderr.trim(),
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }

  return result;
}

function psql(sql, options = {}) {
  const result = docker(
    [
      'exec',
      '-i',
      containerName,
      'psql',
      '-v',
      'ON_ERROR_STOP=1',
      '-X',
      '-q',
      '-t',
      '-A',
      '-F',
      '\t',
      '-U',
      'postgres',
      '-d',
      'postgres',
    ],
    {
      input: sql,
      check: options.check,
    },
  );

  if (options.check === false) {
    return result;
  }

  return result.stdout.replace(/\r/g, '').trim();
}

function runSqlFile(filePath) {
  psql(fs.readFileSync(filePath, 'utf8'));
}

function listMigrationFiles() {
  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => path.join(migrationsDir, entry.name))
    .sort();
}

function waitForDatabase() {
  const deadline = Date.now() + 60_000;
  let lastError = '';

  while (Date.now() < deadline) {
    const result = docker(
      ['exec', containerName, 'pg_isready', '-U', 'postgres', '-d', 'postgres'],
      { check: false },
    );

    if (result.status === 0) {
      return;
    }

    lastError = `${result.stdout}${result.stderr}`.trim();
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
  }

  throw new Error(`Local test database did not become ready. ${lastError}`);
}

// Test-only Supabase auth shim. Production migrations must not define auth.uid().
function setupSupabaseCompatibility() {
  psql(`
    do $setup$
    begin
      if not exists (select 1 from pg_roles where rolname = 'anon') then
        create role anon nologin;
      end if;

      if not exists (select 1 from pg_roles where rolname = 'authenticated') then
        create role authenticated nologin;
      end if;
    end
    $setup$;

    create schema if not exists auth;

    create or replace function auth.uid()
    returns uuid
    language sql
    stable
    as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;

    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    grant usage on schema public to anon, authenticated;
  `);
}

function grantBrowserRoleSelects() {
  psql(`
    grant usage on schema public to anon, authenticated;
    grant select on all tables in schema public to anon, authenticated;
  `);
}

function seedFixtures() {
  psql(`
    insert into public.workspaces (id, slug, name)
    values
      ('${ids.workspaceA}', 'workspace-a', 'Workspace A'),
      ('${ids.workspaceB}', 'workspace-b', 'Workspace B');

    insert into public.admin_users (id, auth_user_id, email, display_name)
    values
      ('${ids.adminA}', '${ids.authMemberA}', 'admin-a@example.test', 'Admin A'),
      ('${ids.adminB}', '${ids.authMemberB}', 'admin-b@example.test', 'Admin B'),
      ('${ids.adminNoMembership}', '${ids.authNoMembership}', 'admin-no-membership@example.test', 'No Membership');

    insert into public.memberships (workspace_id, admin_user_id, role, status)
    values
      ('${ids.workspaceA}', '${ids.adminA}', 'owner', 'active'),
      ('${ids.workspaceB}', '${ids.adminB}', 'owner', 'active');

    insert into public.categories (id, workspace_id, slug, name, is_published, sort_order)
    values
      ('${ids.categoryPublishedA}', '${ids.workspaceA}', 'published-a', 'Published A', true, 1),
      ('${ids.categoryDraftA}', '${ids.workspaceA}', 'draft-a', 'Draft A', false, 2),
      ('${ids.categoryPublishedB}', '${ids.workspaceB}', 'published-b', 'Published B', true, 1),
      ('${ids.categoryDraftB}', '${ids.workspaceB}', 'draft-b', 'Draft B', false, 2);

    insert into public.products (id, workspace_id, category_id, slug, name, status, sort_order)
    values
      ('${ids.productPublishedA}', '${ids.workspaceA}', '${ids.categoryPublishedA}', 'published-product-a', 'Published Product A', 'published', 1),
      ('${ids.productDraftA}', '${ids.workspaceA}', '${ids.categoryPublishedA}', 'draft-product-a', 'Draft Product A', 'draft', 2),
      ('${ids.productPublishedB}', '${ids.workspaceB}', '${ids.categoryPublishedB}', 'published-product-b', 'Published Product B', 'published', 1),
      ('${ids.productDraftB}', '${ids.workspaceB}', '${ids.categoryPublishedB}', 'draft-product-b', 'Draft Product B', 'draft', 2);

    insert into public.product_images (id, workspace_id, product_id, storage_bucket, storage_path, alt_text, sort_order, is_primary)
    values
      ('${ids.imagePublishedA}', '${ids.workspaceA}', '${ids.productPublishedA}', 'test-public', 'published-a.jpg', 'Published A image', 1, true),
      ('${ids.imageDraftA}', '${ids.workspaceA}', '${ids.productDraftA}', 'test-public', 'draft-a.jpg', 'Draft A image', 1, true),
      ('${ids.imagePublishedB}', '${ids.workspaceB}', '${ids.productPublishedB}', 'test-public', 'published-b.jpg', 'Published B image', 1, true),
      ('${ids.imageDraftB}', '${ids.workspaceB}', '${ids.productDraftB}', 'test-public', 'draft-b.jpg', 'Draft B image', 1, true);

    insert into public.quote_requests (id, workspace_id, public_reference, customer_name, customer_email)
    values
      ('${ids.quoteA}', '${ids.workspaceA}', 'quote-a', 'Fake Customer A', 'customer-a@example.test'),
      ('${ids.quoteB}', '${ids.workspaceB}', 'quote-b', 'Fake Customer B', 'customer-b@example.test');

    insert into public.quote_request_items (id, workspace_id, quote_request_id, product_id, product_name_snapshot, quantity)
    values
      ('${ids.quoteItemA}', '${ids.workspaceA}', '${ids.quoteA}', '${ids.productPublishedA}', 'Published Product A', 2),
      ('${ids.quoteItemB}', '${ids.workspaceB}', '${ids.quoteB}', '${ids.productPublishedB}', 'Published Product B', 3);

    insert into public.conversations (id, workspace_id, public_reference, quote_request_id)
    values
      ('${ids.conversationA}', '${ids.workspaceA}', 'conversation-a', '${ids.quoteA}'),
      ('${ids.conversationB}', '${ids.workspaceB}', 'conversation-b', '${ids.quoteB}');

    insert into public.messages (id, workspace_id, conversation_id, role, content, provider, client_message_id)
    values
      ('${ids.messageA}', '${ids.workspaceA}', '${ids.conversationA}', 'user', 'Fake message A', 'test', 'client-message-a'),
      ('${ids.messageB}', '${ids.workspaceB}', '${ids.conversationB}', 'user', 'Fake message B', 'test', 'client-message-b');

    insert into public.usage_events (id, workspace_id, event_type, subject_type, subject_id)
    values
      ('${ids.usageA}', '${ids.workspaceA}', 'test_event', 'conversation', '${ids.conversationA}'),
      ('${ids.usageB}', '${ids.workspaceB}', 'test_event', 'conversation', '${ids.conversationB}');

    insert into public.audit_logs (id, workspace_id, actor_admin_user_id, actor_type, action, target_type, target_id)
    values
      ('${ids.auditA}', '${ids.workspaceA}', '${ids.adminA}', 'admin', 'test_action', 'quote_request', '${ids.quoteA}'),
      ('${ids.auditB}', '${ids.workspaceB}', '${ids.adminB}', 'admin', 'test_action', 'quote_request', '${ids.quoteB}');

    insert into public.integration_connections (id, workspace_id, provider, display_name, status, metadata)
    values
      ('${ids.integrationA}', '${ids.workspaceA}', 'test-provider', 'Test Provider A', 'disabled', '{"fake": true}'::jsonb),
      ('${ids.integrationB}', '${ids.workspaceB}', 'test-provider', 'Test Provider B', 'disabled', '{"fake": true}'::jsonb);
  `);
}

function roleSql(role, authUserId, sql) {
  assert.ok(role === 'anon' || role === 'authenticated', `Unexpected role: ${role}`);

  return `
    begin;
    set local role ${role};
    set local "request.jwt.claim.role" = '${role}';
    set local "request.jwt.claim.sub" = '${authUserId || ''}';
    ${sql.trim().replace(/;?\s*$/, ';')}
    rollback;
  `;
}

function queryAs(role, authUserId, sql) {
  return psql(roleSql(role, authUserId, sql));
}

function statementFailsAs(role, authUserId, sql) {
  const result = psql(roleSql(role, authUserId, sql), { check: false });
  assert.notEqual(result.status, 0, `${role} statement unexpectedly succeeded: ${sql}`);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /permission denied|violates row-level security/i,
    `${role} statement failed for an unexpected reason: ${result.stdout}${result.stderr}`,
  );
}

function scalarAs(role, authUserId, sql) {
  return queryAs(role, authUserId, sql).trim();
}

function assertCsv(actual, expected, label) {
  assert.equal(actual, expected, label);
}

function assertNoRuntimeSupabaseUse() {
  const roots = [
    path.join(repoRoot, 'website', 'app'),
    path.join(repoRoot, 'website', 'components'),
    path.join(repoRoot, 'website', 'lib'),
    path.join(repoRoot, 'website', 'test'),
  ];
  const extensions = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']);
  const blockedPatterns = [
    /@supabase\//i,
    /\bcreateClient\s*\(/i,
    /\bNEXT_PUBLIC_SUPABASE_/i,
    /\bSUPABASE_SERVICE_ROLE/i,
    /\bSUPABASE_URL\b/i,
  ];
  const violations = [];

  function visit(filePath) {
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      for (const child of fs.readdirSync(filePath)) {
        visit(path.join(filePath, child));
      }
      return;
    }

    if (!extensions.has(path.extname(filePath))) {
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    for (const pattern of blockedPatterns) {
      if (pattern.test(content)) {
        violations.push(path.relative(repoRoot, filePath));
        break;
      }
    }
  }

  for (const root of roots) {
    if (fs.existsSync(root)) {
      visit(root);
    }
  }

  assert.deepEqual(violations, [], 'Runtime website code must not use Supabase yet.');
}

check('RLS is enabled on all MVP tables', () => {
  const enabledTables = psql(`
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = any(array[${expectedTables.map((table) => `'${table}'`).join(', ')}])
      and c.relrowsecurity
    order by c.relname;
  `)
    .split('\n')
    .filter(Boolean);

  assert.deepEqual(enabledTables, expectedTables);
});

check('authenticated active member reads only their workspace admin data', () => {
  assertCsv(
    scalarAs(
      'authenticated',
      ids.authMemberA,
      "select coalesce(string_agg(slug, ',' order by slug), '') from public.workspaces",
    ),
    'workspace-a',
    'member A should read only workspace A',
  );

  assertCsv(
    scalarAs(
      'authenticated',
      ids.authMemberA,
      "select coalesce(string_agg(email, ',' order by email), '') from public.admin_users",
    ),
    'admin-a@example.test',
    'member A should read only their admin profile',
  );

  assertCsv(
    scalarAs(
      'authenticated',
      ids.authMemberA,
      "select coalesce(string_agg(public_reference, ',' order by public_reference), '') from public.quote_requests",
    ),
    'quote-a',
    'member A should read only workspace A quote requests',
  );

  assertCsv(
    scalarAs(
      'authenticated',
      ids.authMemberA,
      "select coalesce(string_agg(public_reference, ',' order by public_reference), '') from public.conversations",
    ),
    'conversation-a',
    'member A should read only workspace A conversations',
  );

  assertCsv(
    scalarAs(
      'authenticated',
      ids.authMemberA,
      "select coalesce(string_agg(content, ',' order by content), '') from public.messages",
    ),
    'Fake message A',
    'member A should read only workspace A messages',
  );

  assertCsv(
    scalarAs(
      'authenticated',
      ids.authMemberA,
      "select coalesce(string_agg(display_name, ',' order by display_name), '') from public.integration_connections",
    ),
    'Test Provider A',
    'member A should read only workspace A integration metadata',
  );
});

check('authenticated active member cannot read another workspace admin rows', () => {
  const workspaceBFilters = [
    ['workspaces', `id = '${ids.workspaceB}'`],
    ['memberships', `workspace_id = '${ids.workspaceB}'`],
    ['quote_requests', `workspace_id = '${ids.workspaceB}'`],
    ['quote_request_items', `workspace_id = '${ids.workspaceB}'`],
    ['conversations', `workspace_id = '${ids.workspaceB}'`],
    ['messages', `workspace_id = '${ids.workspaceB}'`],
    ['integration_connections', `workspace_id = '${ids.workspaceB}'`],
  ];

  for (const [table, whereClause] of workspaceBFilters) {
    assert.equal(
      scalarAs(
        'authenticated',
        ids.authMemberA,
        `select count(*)::text from public.${table} where ${whereClause}`,
      ),
      '0',
      `member A should not read workspace B rows from ${table}`,
    );
  }
});

check('authenticated user without membership cannot read admin-only workspace rows', () => {
  const adminOnlyTables = [
    'workspaces',
    'memberships',
    'quote_requests',
    'quote_request_items',
    'conversations',
    'messages',
    'integration_connections',
  ];

  for (const table of adminOnlyTables) {
    assert.equal(
      scalarAs('authenticated', ids.authNoMembership, `select count(*)::text from public.${table}`),
      '0',
      `no-membership user should not read ${table}`,
    );
  }
});

check('anonymous public reads only published catalogue rows', () => {
  assertCsv(
    scalarAs(
      'anon',
      null,
      "select coalesce(string_agg(slug, ',' order by slug), '') from public.categories",
    ),
    'published-a,published-b',
    'anon should read only published categories',
  );

  assertCsv(
    scalarAs(
      'anon',
      null,
      "select coalesce(string_agg(slug, ',' order by slug), '') from public.products",
    ),
    'published-product-a,published-product-b',
    'anon should read only published products',
  );

  assertCsv(
    scalarAs(
      'anon',
      null,
      "select coalesce(string_agg(storage_path, ',' order by storage_path), '') from public.product_images",
    ),
    'published-a.jpg,published-b.jpg',
    'anon should read only images for published products',
  );
});

check('anonymous public reads do not return private workspace data', () => {
  const privateTables = [
    'admin_users',
    'memberships',
    'quote_requests',
    'quote_request_items',
    'conversations',
    'messages',
    'usage_events',
    'audit_logs',
    'integration_connections',
  ];

  for (const table of privateTables) {
    assert.equal(
      scalarAs('anon', null, `select count(*)::text from public.${table}`),
      '0',
      `anon should not read ${table}`,
    );
  }
});

check('service-only tables expose no broad anonymous or authenticated client access', () => {
  for (const [role, authUserId] of [
    ['anon', null],
    ['authenticated', ids.authMemberA],
    ['authenticated', ids.authNoMembership],
  ]) {
    for (const table of ['usage_events', 'audit_logs']) {
      assert.equal(
        scalarAs(role, authUserId, `select count(*)::text from public.${table}`),
        '0',
        `${role} should not read ${table}`,
      );
    }
  }

  statementFailsAs(
    'anon',
    null,
    `insert into public.usage_events (workspace_id, event_type) values ('${ids.workspaceA}', 'client_write')`,
  );
  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `insert into public.audit_logs (workspace_id, actor_type, action) values ('${ids.workspaceA}', 'admin', 'client_write')`,
  );
});

check('runtime website code still does not rely on Supabase', () => {
  assertNoRuntimeSupabaseUse();
});

function runChecks() {
  for (const item of checks) {
    item.fn();
    console.log(`PASS ${item.name}`);
  }
}

function main() {
  assertSafeContainerName(containerName);

  console.log(`Starting local-only RLS test database (${dockerImage})...`);
  docker(['rm', '-f', containerName], { check: false });
  docker([
    'run',
    '--rm',
    '--name',
    containerName,
    '--label',
    'spacekonceptrental.rls-test=true',
    '-e',
    'POSTGRES_PASSWORD=postgres',
    '-e',
    'POSTGRES_DB=postgres',
    '-d',
    dockerImage,
  ]);

  try {
    waitForDatabase();
    setupSupabaseCompatibility();

    for (const migrationFile of listMigrationFiles()) {
      runSqlFile(migrationFile);
    }

    grantBrowserRoleSelects();
    seedFixtures();
    runChecks();
  } finally {
    if (keepContainer) {
      console.log(`Keeping local test container for inspection: ${containerName}`);
    } else {
      docker(['stop', containerName], { check: false });
    }

    fs.rmSync(dockerConfigDir, { recursive: true, force: true });
  }
}

main();
