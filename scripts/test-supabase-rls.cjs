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
  'catalogue_public_workspace_config',
  'categories',
  'conversations',
  'integration_connections',
  'memberships',
  'messages',
  'product_images',
  'products',
  'quote_request_activity',
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
  authViewerA: '20000000-0000-4000-8000-000000000004',
  adminA: '30000000-0000-4000-8000-000000000001',
  adminB: '30000000-0000-4000-8000-000000000002',
  adminNoMembership: '30000000-0000-4000-8000-000000000003',
  adminViewerA: '30000000-0000-4000-8000-000000000004',
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
  quoteActivityA: '70500000-0000-4000-8000-000000000001',
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
      const queryResult = psql('select 1;', { check: false });

      if (queryResult.status === 0) {
        return;
      }

      lastError = `${queryResult.stdout}${queryResult.stderr}`.trim();
    } else {
      lastError = `${result.stdout}${result.stderr}`.trim();
    }
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
    create schema if not exists storage;

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
    grant usage on schema storage to anon, authenticated;

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

    insert into public.catalogue_public_workspace_config (
      active_workspace_id,
      is_enabled
    )
    values ('${ids.workspaceA}', true);

    insert into public.admin_users (id, auth_user_id, email, display_name)
    values
      ('${ids.adminA}', '${ids.authMemberA}', 'admin-a@example.test', 'Admin A'),
      ('${ids.adminB}', '${ids.authMemberB}', 'admin-b@example.test', 'Admin B'),
      ('${ids.adminNoMembership}', '${ids.authNoMembership}', 'admin-no-membership@example.test', 'No Membership'),
      ('${ids.adminViewerA}', '${ids.authViewerA}', 'viewer-a@example.test', 'Viewer A');

    insert into public.memberships (workspace_id, admin_user_id, role, status)
    values
      ('${ids.workspaceA}', '${ids.adminA}', 'owner', 'active'),
      ('${ids.workspaceB}', '${ids.adminB}', 'owner', 'active'),
      ('${ids.workspaceA}', '${ids.adminViewerA}', 'viewer', 'active');

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

    insert into public.quote_request_activity (
      id,
      workspace_id,
      quote_request_id,
      actor_admin_user_id,
      activity_type,
      note
    )
    values (
      '${ids.quoteActivityA}',
      '${ids.workspaceA}',
      '${ids.quoteA}',
      '${ids.adminA}',
      'internal_note',
      'Seeded internal quote note'
    );

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

function statementFailsAs(
  role,
  authUserId,
  sql,
  expectedError = /permission denied|violates row-level security/i,
) {
  const result = psql(roleSql(role, authUserId, sql), { check: false });
  assert.notEqual(result.status, 0, `${role} statement unexpectedly succeeded: ${sql}`);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    expectedError,
    `${role} statement failed for an unexpected reason: ${result.stdout}${result.stderr}`,
  );
}

function statementFails(
  sql,
  expectedError = /violates|invalid|permission denied|constraint|cannot/i,
) {
  const result = psql(sql, { check: false });
  assert.notEqual(result.status, 0, `Statement unexpectedly succeeded: ${sql}`);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    expectedError,
    `Statement failed for an unexpected reason: ${result.stdout}${result.stderr}`,
  );
}

function scalarAs(role, authUserId, sql) {
  return queryAs(role, authUserId, sql).trim();
}

function assertCsv(actual, expected, label) {
  assert.equal(actual, expected, label);
}

function assertNoRuntimeSupabaseUse() {
  const browserAndRouteRoots = [
    path.join(repoRoot, 'website', 'app'),
    path.join(repoRoot, 'website', 'components'),
  ];
  const libRoot = path.join(repoRoot, 'website', 'lib');
  const approvedServerSupabaseFiles = new Set([
    'website/lib/supabase/env.ts',
    'website/lib/supabase/server.ts',
    'website/lib/admin/authorization/supabase-admin-auth-identity-adapter.ts',
    'website/lib/admin/authorization/supabase-admin-profile-membership-adapters.ts',
  ]);
  const approvedCatalogueReadFiles = new Set([
    'website/lib/catalogue/catalogue-repository.ts',
  ]);
  const approvedQuoteWriteFiles = new Set([
    'website/lib/quote/quote-repository.ts',
  ]);
  const approvedMediaUploadFiles = new Set([
    'website/lib/products/media/admin-product-image-upload-route.ts',
  ]);
  const extensions = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']);
  const browserBlockedPatterns = [
    /@supabase\//i,
    /\bcreateClient\s*\(/i,
    /\bNEXT_PUBLIC_SUPABASE_/i,
    /\bSUPABASE_SERVICE_ROLE/i,
    /\bSUPABASE_ANON_KEY\b/i,
    /\bSUPABASE_URL\b/i,
    /\bcreateServerSupabaseClient\b/i,
    /supabase[\\/]server/i,
    /lib\/supabase/i,
  ];
  const serverBlockedPatterns = [
    /\bNEXT_PUBLIC_SUPABASE_/i,
    /\bSUPABASE_SERVICE_ROLE/i,
  ];
  const blockedCatalogueTablePatterns = [
    /\bquote_requests\b/i,
    /\bquote_request_items\b/i,
    /\bconversations\b/i,
    /\bmessages\b/i,
    /\badmin_users\b/i,
    /\bmemberships\b/i,
    /\busage_events\b/i,
    /\baudit_logs\b/i,
    /\bintegration_connections\b/i,
  ];
  const blockedQuoteWriteTablePatterns = [
    /from\(["']products["']\)/i,
    /from\(["']categories["']\)/i,
    /from\(["']product_images["']\)/i,
    /from\(["']conversations["']\)/i,
    /from\(["']messages["']\)/i,
    /from\(["']admin_users["']\)/i,
    /from\(["']memberships["']\)/i,
    /from\(["']usage_events["']\)/i,
    /from\(["']audit_logs["']\)/i,
    /from\(["']integration_connections["']\)/i,
  ];
  const blockedMediaUploadTablePatterns = [
    /from\(["']categories["']\)/i,
    /from\(["']quote_requests["']\)/i,
    /from\(["']quote_request_items["']\)/i,
    /from\(["']conversations["']\)/i,
    /from\(["']messages["']\)/i,
    /from\(["']admin_users["']\)/i,
    /from\(["']memberships["']\)/i,
    /from\(["']usage_events["']\)/i,
    /from\(["']audit_logs["']\)/i,
    /from\(["']integration_connections["']\)/i,
  ];
  const violations = [];

  function repoRelative(filePath) {
    return path.relative(repoRoot, filePath).replace(/\\/g, '/');
  }

  function isTestSource(filePath) {
    return /\.(?:test|spec)\.[cm]?[tj]sx?$/.test(filePath);
  }

  function assertNoMatches(filePath, content, patterns) {
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        violations.push(repoRelative(filePath));
        break;
      }
    }
  }

  function visit(filePath, onSourceFile) {
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      for (const child of fs.readdirSync(filePath)) {
        visit(path.join(filePath, child), onSourceFile);
      }
      return;
    }

    if (!extensions.has(path.extname(filePath)) || isTestSource(filePath)) {
      return;
    }

    onSourceFile(filePath, fs.readFileSync(filePath, 'utf8'));
  }

  for (const root of browserAndRouteRoots) {
    if (fs.existsSync(root)) {
      visit(root, (filePath, content) => {
        assertNoMatches(filePath, content, browserBlockedPatterns);
      });
    }
  }

  if (fs.existsSync(libRoot)) {
    visit(libRoot, (filePath, content) => {
      const relativePath = repoRelative(filePath);

      if (approvedServerSupabaseFiles.has(relativePath)) {
        assert.match(
          content,
          /import\s+["']server-only["'];/,
          `${relativePath} must be marked server-only.`,
        );
        assertNoMatches(filePath, content, serverBlockedPatterns);
        return;
      }

      if (approvedCatalogueReadFiles.has(relativePath)) {
        assert.match(
          content,
          /import\s+["']server-only["'];/,
          `${relativePath} must be marked server-only.`,
        );
        assert.match(
          content,
          /rpc\(["']get_public_catalogue["']/,
          `${relativePath} must use the trusted public catalogue RPC.`,
        );
        assertNoMatches(filePath, content, serverBlockedPatterns);
        assertNoMatches(filePath, content, blockedCatalogueTablePatterns);
        return;
      }

      if (approvedQuoteWriteFiles.has(relativePath)) {
        assert.match(
          content,
          /import\s+["']server-only["'];/,
          `${relativePath} must be marked server-only.`,
        );
        assert.match(
          content,
          /createServerSupabaseClient/,
          `${relativePath} must use the approved server Supabase wrapper.`,
        );
        assert.match(
          content,
          /from\(["']quote_requests["']\)/,
          `${relativePath} must insert quote_requests explicitly.`,
        );
        assert.match(
          content,
          /from\(["']quote_request_items["']\)/,
          `${relativePath} must insert quote_request_items explicitly.`,
        );
        assertNoMatches(filePath, content, serverBlockedPatterns);
        assertNoMatches(filePath, content, blockedQuoteWriteTablePatterns);
        return;
      }

      if (approvedMediaUploadFiles.has(relativePath)) {
        assert.match(
          content,
          /import\s+["']server-only["'];/,
          `${relativePath} must be marked server-only.`,
        );
        assert.match(
          content,
          /resolveServerAdminCsrfProofSessionWorkspaceBinding/,
          `${relativePath} must require the approved admin CSRF/session workspace binding.`,
        );
        assert.match(
          content,
          /requestedOperation:\s*productImageWriteOperation/,
          `${relativePath} must require productImage.write.`,
        );
        assert.match(
          content,
          /createSessionBoundSupabaseAdminReadClient/,
          `${relativePath} must use the session-bound Supabase client.`,
        );
        assert.match(
          content,
          /\.storage\.from\(listingMediaBucket\)/,
          `${relativePath} must write only through the fixed listing media bucket.`,
        );
        assertNoMatches(filePath, content, serverBlockedPatterns);
        assertNoMatches(filePath, content, blockedMediaUploadTablePatterns);
        return;
      }

      assertNoMatches(filePath, content, browserBlockedPatterns);
    });
  }

  assert.deepEqual(
    violations,
    [],
    'Runtime website Supabase code must stay server-only and private-env-only.',
  );
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
      "select coalesce(string_agg(note, ',' order by note), '') from public.quote_request_activity",
    ),
    'Seeded internal quote note',
    'owner A should read only workspace A quote activity',
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
    ['quote_request_activity', `workspace_id = '${ids.workspaceB}'`],
    ['quote_requests', `workspace_id = '${ids.workspaceB}'`],
    ['quote_request_items', `workspace_id = '${ids.workspaceB}'`],
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
    'quote_request_activity',
    'quote_requests',
    'quote_request_items',
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

check('anonymous direct base-table reads cannot return catalogue rows', () => {
  assertCsv(
    scalarAs(
      'anon',
      null,
      "select coalesce(string_agg(slug, ',' order by slug), '') from public.categories",
    ),
    '',
    'anon should not read categories directly',
  );

  assertCsv(
    scalarAs(
      'anon',
      null,
      "select coalesce(string_agg(slug, ',' order by slug), '') from public.products",
    ),
    '',
    'anon should not read products directly',
  );

  assertCsv(
    scalarAs(
      'anon',
      null,
      "select coalesce(string_agg(storage_path, ',' order by storage_path), '') from public.product_images",
    ),
    '',
    'anon should not read product images directly',
  );
});

check('anonymous direct base-table reads cannot return cross-workspace published catalogue rows', () => {
  const crossWorkspaceChecks = [
    ['categories', `workspace_id = '${ids.workspaceB}'`],
    ['products', `workspace_id = '${ids.workspaceB}'`],
    ['product_images', `workspace_id = '${ids.workspaceB}'`],
  ];

  for (const [table, whereClause] of crossWorkspaceChecks) {
    assert.equal(
      scalarAs('anon', null, `select count(*)::text from public.${table} where ${whereClause}`),
      '0',
      `anon should not directly read workspace B ${table}`,
    );
  }
});

check('anonymous direct base-table reads still cannot return draft catalogue rows', () => {
  assert.equal(
    scalarAs('anon', null, "select count(*)::text from public.categories where is_published = false"),
    '0',
    'anon should not directly read draft categories',
  );
  assert.equal(
    scalarAs('anon', null, "select count(*)::text from public.products where status <> 'published'"),
    '0',
    'anon should not directly read draft products',
  );
  assert.equal(
    scalarAs(
      'anon',
      null,
      `select count(*)::text
       from public.product_images
       where product_id in ('${ids.productDraftA}', '${ids.productDraftB}')`,
    ),
    '0',
    'anon should not directly read images for draft products',
  );
});

check('trusted active-workspace catalogue RPC returns active workspace rows only', () => {
  assertCsv(
    scalarAs(
      'anon',
      null,
      `
        with catalogue as (
          select public.get_public_catalogue('${ids.workspaceA}', null) as data
        )
        select coalesce(string_agg(category.value->>'slug', ',' order by category.value->>'slug'), '')
        from catalogue,
          lateral jsonb_array_elements(catalogue.data->'categories') as category(value)
      `,
    ),
    'published-a',
    'trusted catalogue RPC should return active workspace published categories',
  );

  assertCsv(
    scalarAs(
      'anon',
      null,
      `
        with catalogue as (
          select public.get_public_catalogue('${ids.workspaceA}', null) as data
        )
        select coalesce(string_agg(product.value->>'slug', ',' order by product.value->>'slug'), '')
        from catalogue,
          lateral jsonb_array_elements(catalogue.data->'products') as product(value)
      `,
    ),
    'published-product-a',
    'trusted catalogue RPC should return active workspace published products',
  );

  assertCsv(
    scalarAs(
      'anon',
      null,
      `
        with catalogue as (
          select public.get_public_catalogue('${ids.workspaceA}', null) as data
        ),
        products as (
          select product.value as product
          from catalogue,
            lateral jsonb_array_elements(catalogue.data->'products') as product(value)
        )
        select coalesce(string_agg(image.value->>'storage_path', ',' order by image.value->>'storage_path'), '')
        from products,
          lateral jsonb_array_elements(products.product->'product_images') as image(value)
      `,
    ),
    'published-a.jpg',
    'trusted catalogue RPC should return active workspace images for published products only',
  );
});

check('trusted active-workspace catalogue RPC does not return inactive workspace rows', () => {
  assertCsv(
    scalarAs(
      'anon',
      null,
      `select coalesce(public.get_public_catalogue('${ids.workspaceB}', null)::text, '')`,
    ),
    '',
    'trusted catalogue RPC should not return rows when the expected workspace is not active',
  );

  assertCsv(
    scalarAs(
      'anon',
      null,
      `
        with catalogue as (
          select public.get_public_catalogue('${ids.workspaceA}', 'published-product-b') as data
        )
        select coalesce(string_agg(product.value->>'slug', ',' order by product.value->>'slug'), '')
        from catalogue,
          lateral jsonb_array_elements(catalogue.data->'products') as product(value)
      `,
    ),
    '',
    'trusted catalogue RPC should not return another workspace product by slug',
  );
});

check('anonymous public reads do not return private workspace data', () => {
  const privateTables = [
    'admin_users',
    'catalogue_public_workspace_config',
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

check('conversation and message transcript tables deny direct client reads and writes', () => {
  for (const [role, authUserId] of [
    ['anon', null],
    ['authenticated', ids.authMemberA],
    ['authenticated', ids.authMemberB],
    ['authenticated', ids.authViewerA],
    ['authenticated', ids.authNoMembership],
  ]) {
    for (const table of ['conversations', 'messages']) {
      assert.equal(
        scalarAs(role, authUserId, `select count(*)::text from public.${table}`),
        '0',
        `${role} should not read ${table}`,
      );
    }

    statementFailsAs(
      role,
      authUserId,
      `
        insert into public.conversations (
          workspace_id,
          public_reference,
          status
        )
        values (
          '${ids.workspaceA}',
          'direct-client-conversation-${role}-${authUserId || 'anon'}',
          'open'
        )
      `,
    );

    statementFailsAs(
      role,
      authUserId,
      `
        insert into public.messages (
          workspace_id,
          conversation_id,
          role,
          content
        )
        values (
          '${ids.workspaceA}',
          '${ids.conversationA}',
          'user',
          'Direct client transcript write should fail.'
        )
      `,
    );
  }
});

check('conversation and message schema constraints reject unsafe transcript shapes', () => {
  statementFails(
    `
      insert into public.conversations (
        workspace_id,
        public_reference,
        client_session_hash
      )
      values (
        '${ids.workspaceA}',
        'unsafe-short-session-hash',
        'raw-session'
      )
    `,
    /conversations_client_session_hash_format_check/i,
  );

  statementFails(
    `
      insert into public.conversations (
        workspace_id,
        public_reference,
        metadata
      )
      values (
        '${ids.workspaceA}',
        'unsafe-conversation-metadata',
        '{"webhook_url": "blocked"}'::jsonb
      )
    `,
    /conversations_metadata_safe_keys_check/i,
  );

  statementFails(
    `
      insert into public.messages (
        workspace_id,
        conversation_id,
        role,
        content
      )
      values (
        '${ids.workspaceA}',
        '${ids.conversationA}',
        'tool',
        'Invalid role should fail.'
      )
    `,
    /messages_role_check/i,
  );

  statementFails(
    `
      insert into public.messages (
        workspace_id,
        conversation_id,
        role,
        message_type,
        content
      )
      values (
        '${ids.workspaceA}',
        '${ids.conversationA}',
        'assistant',
        'provider_debug',
        'Invalid message type should fail.'
      )
    `,
    /messages_message_type_check/i,
  );

  statementFails(
    `
      insert into public.messages (
        workspace_id,
        conversation_id,
        role,
        content
      )
      values (
        '${ids.workspaceA}',
        '${ids.conversationA}',
        'user',
        repeat('x', 8001)
      )
    `,
    /messages_content_length_check/i,
  );

  statementFails(
    `
      insert into public.messages (
        workspace_id,
        conversation_id,
        role,
        content,
        metadata
      )
      values (
        '${ids.workspaceA}',
        '${ids.conversationA}',
        'assistant',
        'Unsafe metadata should fail.',
        '{"provider_debug": true}'::jsonb
      )
    `,
    /messages_metadata_safe_keys_check/i,
  );

  statementFails(
    `
      insert into public.messages (
        workspace_id,
        conversation_id,
        role,
        content
      )
      values (
        '${ids.workspaceA}',
        '${ids.conversationB}',
        'user',
        'Cross-workspace relationship should fail.'
      )
    `,
    /messages_conversation_workspace_id_fkey/i,
  );
});

check('transcript persistence RPC stays ungranted to direct client roles', () => {
  for (const [role, authUserId] of [
    ['anon', null],
    ['authenticated', ids.authMemberA],
    ['authenticated', ids.authMemberB],
    ['authenticated', ids.authViewerA],
    ['authenticated', ids.authNoMembership],
  ]) {
    statementFailsAs(
      role,
      authUserId,
      `
        select public.persist_transcript_batch(
          '${ids.workspaceA}'::uuid,
          '{}'::jsonb,
          '[]'::jsonb
        )
      `,
    );
  }
});

check('transcript persistence RPC has a DB-backed client_message_id idempotency arbiter', () => {
  assert.equal(
    psql(`
      select count(*)::text
      from pg_constraint
      where conrelid = 'public.messages'::regclass
        and conname = 'messages_workspace_conversation_client_message_key'
        and contype = 'u'
    `),
    '1',
    'client_message_id retries must be protected by a database uniqueness constraint for concurrency safety',
  );
});

check('transcript persistence RPC persists idempotent batches for privileged executor only', () => {
  const conversationId = '80000000-0000-4000-8000-000000000101';
  const firstMessageId = '90000000-0000-4000-8000-000000000101';
  const duplicateMessageId = '90000000-0000-4000-8000-000000000102';
  const contentConflictMessageId = '90000000-0000-4000-8000-000000000103';
  const requestConflictMessageId = '90000000-0000-4000-8000-000000000104';
  const metadataConflictMessageId = '90000000-0000-4000-8000-000000000105';
  const clientMessageId = 'rpc-client-message-a';
  const first = psql(`
    select public.persist_transcript_batch(
      '${ids.workspaceA}'::uuid,
      jsonb_build_object(
        'id', '${conversationId}',
        'workspace_id', '${ids.workspaceA}',
        'public_reference', 'rpc-conversation-a',
        'client_session_hash', repeat('d', 64),
        'status', 'open',
        'retention_expires_at', '2026-07-04T00:00:00.000Z',
        'metadata', jsonb_build_object('entryPoint', 'rls-test')
      ),
      jsonb_build_array(
        jsonb_build_object(
          'id', '${firstMessageId}',
          'workspace_id', '${ids.workspaceA}',
          'conversation_id', '${conversationId}',
          'role', 'user',
          'message_type', 'chat',
          'content', 'I need chairs for an event.',
          'provider', 'n8n',
          'client_message_id', '${clientMessageId}',
          'request_id', 'rls-request-a',
          'sequence_number', 0,
          'retention_expires_at', '2026-07-04T00:00:00.000Z',
          'metadata', jsonb_build_object('source', 'rls-test')
        )
      )
    )::text;
  `);

  assert.match(first, new RegExp(firstMessageId));

  const second = psql(`
    select public.persist_transcript_batch(
      '${ids.workspaceA}'::uuid,
      jsonb_build_object(
        'id', '${conversationId}',
        'workspace_id', '${ids.workspaceA}',
        'public_reference', 'rpc-conversation-a',
        'client_session_hash', repeat('d', 64),
        'status', 'open',
        'metadata', jsonb_build_object('entryPoint', 'rls-test')
      ),
      jsonb_build_array(
        jsonb_build_object(
          'id', '${duplicateMessageId}',
          'workspace_id', '${ids.workspaceA}',
          'conversation_id', '${conversationId}',
          'role', 'user',
          'message_type', 'chat',
          'content', 'I need chairs for an event.',
          'provider', 'n8n',
          'client_message_id', '${clientMessageId}',
          'request_id', 'rls-request-a',
          'sequence_number', 0,
          'retention_expires_at', '2026-07-04T00:00:00.000Z',
          'metadata', jsonb_build_object('source', 'rls-test')
        )
      )
    )::text;
  `);

  assert.match(second, new RegExp(firstMessageId));
  assert.doesNotMatch(second, new RegExp(duplicateMessageId));
  assert.equal(
    psql(
      `
        select count(*)::text
        from public.messages
        where workspace_id = '${ids.workspaceA}'
          and conversation_id = '${conversationId}'
          and client_message_id = '${clientMessageId}'
      `
    ),
    '1',
    'duplicate clientMessageId should not insert another message',
  );

  statementFails(
    `
      select public.persist_transcript_batch(
        '${ids.workspaceA}'::uuid,
        jsonb_build_object(
          'id', '${conversationId}',
          'workspace_id', '${ids.workspaceA}',
          'public_reference', 'rpc-conversation-a',
          'metadata', jsonb_build_object('entryPoint', 'rls-test')
        ),
        jsonb_build_array(
          jsonb_build_object(
            'id', '${contentConflictMessageId}',
            'workspace_id', '${ids.workspaceA}',
            'conversation_id', '${conversationId}',
            'role', 'user',
            'message_type', 'chat',
            'content', 'Changed content must not be silently dropped.',
            'provider', 'n8n',
            'client_message_id', '${clientMessageId}',
            'request_id', 'rls-request-a',
            'sequence_number', 0,
            'retention_expires_at', '2026-07-04T00:00:00.000Z',
            'metadata', jsonb_build_object('source', 'rls-test')
          )
        )
      )
    `,
    /transcript_client_message_id_conflict/i,
  );

  statementFails(
    `
      select public.persist_transcript_batch(
        '${ids.workspaceA}'::uuid,
        jsonb_build_object(
          'id', '${conversationId}',
          'workspace_id', '${ids.workspaceA}',
          'public_reference', 'rpc-conversation-a',
          'metadata', jsonb_build_object('entryPoint', 'rls-test')
        ),
        jsonb_build_array(
          jsonb_build_object(
            'id', '${requestConflictMessageId}',
            'workspace_id', '${ids.workspaceA}',
            'conversation_id', '${conversationId}',
            'role', 'user',
            'message_type', 'chat',
            'content', 'I need chairs for an event.',
            'provider', 'n8n',
            'client_message_id', '${clientMessageId}',
            'request_id', 'rls-request-a-changed',
            'sequence_number', 0,
            'retention_expires_at', '2026-07-04T00:00:00.000Z',
            'metadata', jsonb_build_object('source', 'rls-test')
          )
        )
      )
    `,
    /transcript_client_message_id_conflict/i,
  );

  statementFails(
    `
      select public.persist_transcript_batch(
        '${ids.workspaceA}'::uuid,
        jsonb_build_object(
          'id', '${conversationId}',
          'workspace_id', '${ids.workspaceA}',
          'public_reference', 'rpc-conversation-a',
          'metadata', jsonb_build_object('entryPoint', 'rls-test')
        ),
        jsonb_build_array(
          jsonb_build_object(
            'id', '${metadataConflictMessageId}',
            'workspace_id', '${ids.workspaceA}',
            'conversation_id', '${conversationId}',
            'role', 'user',
            'message_type', 'chat',
            'content', 'I need chairs for an event.',
            'provider', 'n8n',
            'client_message_id', '${clientMessageId}',
            'request_id', 'rls-request-a',
            'sequence_number', 0,
            'retention_expires_at', '2026-07-04T00:00:00.000Z',
            'metadata', jsonb_build_object('source', 'changed-rls-test')
          )
        )
      )
    `,
    /transcript_client_message_id_conflict/i,
  );

  assert.equal(
    psql(
      `
        select count(*)::text
        from public.messages
        where workspace_id = '${ids.workspaceA}'
          and conversation_id = '${conversationId}'
          and client_message_id = '${clientMessageId}'
          and content = 'I need chairs for an event.'
          and request_id = 'rls-request-a'
          and metadata = jsonb_build_object('source', 'rls-test')
      `
    ),
    '1',
    'conflicting clientMessageId retries should leave only the original message row',
  );
});

check('transcript persistence RPC rejects unsafe metadata before inserts', () => {
  const conversationId = '80000000-0000-4000-8000-000000000201';
  const messageId = '90000000-0000-4000-8000-000000000201';

  statementFails(
    `
      select public.persist_transcript_batch(
        '${ids.workspaceA}'::uuid,
        jsonb_build_object(
          'id', '${conversationId}',
          'workspace_id', '${ids.workspaceA}',
          'public_reference', 'rpc-unsafe-metadata',
          'metadata', jsonb_build_object('webhook_url', 'blocked')
        ),
        jsonb_build_array(
          jsonb_build_object(
            'id', '${messageId}',
            'workspace_id', '${ids.workspaceA}',
            'conversation_id', '${conversationId}',
            'role', 'user',
            'message_type', 'chat',
            'content', 'Unsafe conversation metadata should fail.',
            'metadata', jsonb_build_object('source', 'rls-test')
          )
        )
      )
    `,
    /transcript_metadata_unsafe/i,
  );
});

check('anonymous public can create website quote rows without reading them back', () => {
  const quoteId = '70000000-0000-4000-8000-000000000101';
  const output = queryAs(
    'anon',
    null,
    `
      insert into public.quote_requests (
        id,
        workspace_id,
        public_reference,
        customer_name,
        customer_email,
        customer_phone,
        event_date,
        venue,
        status,
        source
      )
      values (
        '${quoteId}',
        '${ids.workspaceA}',
        'quote-public-create',
        'Fake Public Customer',
        'public-customer@example.test',
        '+65 8123 4567',
        '2026-06-12',
        'Fake Venue',
        'new',
        'website'
      );

      insert into public.quote_request_items (
        workspace_id,
        quote_request_id,
        product_name_snapshot,
        quantity,
        notes
      )
      values (
        '${ids.workspaceA}',
        '${quoteId}',
        'Fake requested lounge set',
        2,
        'Fake public quote item note'
      );

      select count(*)::text from public.quote_requests where id = '${quoteId}';
      select count(*)::text from public.quote_request_items where quote_request_id = '${quoteId}';
    `,
  );

  assert.deepEqual(
    output.split('\n').filter(Boolean),
    ['0', '0'],
    'anon quote inserts should not grant anonymous quote reads.',
  );
});

check('anonymous public quote creation rejects non-website workflow states', () => {
  statementFailsAs(
    'anon',
    null,
    `
      insert into public.quote_requests (
        id,
        workspace_id,
        public_reference,
        customer_name,
        customer_email,
        status,
        source
      )
      values (
        '70000000-0000-4000-8000-000000000102',
        '${ids.workspaceA}',
        'quote-public-rejected-status',
        'Fake Public Customer',
        'public-customer@example.test',
        'reviewing',
        'website'
      )
    `,
  );
});

check('atomic quote workflow RPC updates status and activity together for owner/admin users', () => {
  const output = queryAs(
    'authenticated',
    ids.authMemberA,
    `
      select public.execute_admin_quote_workflow(
        '${ids.quoteA}',
        '${ids.workspaceA}',
        'reviewing',
        ' Follow up on lounge seating quantities. '
      )::text;

      select status from public.quote_requests where id = '${ids.quoteA}';

      select count(*)::text
      from public.quote_request_activity
      where quote_request_id = '${ids.quoteA}'
        and activity_type = 'status_change'
        and status_from = 'new'
        and status_to = 'reviewing';

      select count(*)::text
      from public.quote_request_activity
      where quote_request_id = '${ids.quoteA}'
        and activity_type = 'internal_note'
        and note = 'Follow up on lounge seating quantities.';

      select public.execute_admin_quote_workflow(
        '${ids.quoteA}',
        '${ids.workspaceA}',
        'reviewing',
        '   '
      )::text;

      select count(*)::text
      from public.quote_request_activity
      where quote_request_id = '${ids.quoteA}'
        and activity_type = 'status_change'
        and status_to = 'reviewing';

      select count(*)::text
      from public.quote_request_activity
      where quote_request_id = '${ids.quoteA}'
        and activity_type = 'internal_note'
        and note = 'Follow up on lounge seating quantities.';
    `,
  );

  assert.deepEqual(
    output.split('\n').filter(Boolean),
    [ids.quoteA, 'reviewing', '1', '1', ids.quoteA, '1', '1'],
    'owner should update quote workflow atomically and skip duplicate/blank activity rows',
  );
});

check('atomic quote workflow RPC denies oversized notes, cross-workspace, viewer, no-membership, and anonymous callers', () => {
  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
      select public.execute_admin_quote_workflow(
        '${ids.quoteA}',
        '${ids.workspaceA}',
        'reviewing',
        repeat('x', 1201)
      )
    `,
    /quote_workflow_note_too_long/i,
  );

  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
      select public.execute_admin_quote_workflow(
        '${ids.quoteB}',
        '${ids.workspaceB}',
        'reviewing',
        'Cross-workspace note should fail.'
      )
    `,
    /quote_workflow_not_authorized/i,
  );

  statementFailsAs(
    'authenticated',
    ids.authViewerA,
    `
      select public.execute_admin_quote_workflow(
        '${ids.quoteA}',
        '${ids.workspaceA}',
        'reviewing',
        'Viewer note should fail.'
      )
    `,
    /quote_workflow_not_authorized/i,
  );

  statementFailsAs(
    'authenticated',
    ids.authNoMembership,
    `
      select public.execute_admin_quote_workflow(
        '${ids.quoteA}',
        '${ids.workspaceA}',
        'reviewing',
        'No-membership note should fail.'
      )
    `,
    /quote_workflow_not_authorized/i,
  );

  statementFailsAs(
    'anon',
    null,
    `
      select public.execute_admin_quote_workflow(
        '${ids.quoteA}',
        '${ids.workspaceA}',
        'reviewing',
        'Anonymous note should fail.'
      )
    `,
  );
});

check('direct quote workflow table writes are not granted after atomic RPC hardening', () => {
  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
      update public.quote_requests
      set status = 'quoted',
        updated_at = now()
      where id = '${ids.quoteA}'
        and workspace_id = '${ids.workspaceA}'
    `,
  );

  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
      insert into public.quote_request_activity (
        workspace_id,
        quote_request_id,
        actor_admin_user_id,
        activity_type,
        note
      )
      values (
        '${ids.workspaceA}',
        '${ids.quoteA}',
        '${ids.adminA}',
        'internal_note',
        'Direct table insert should fail.'
      )
    `,
  );
});

check('direct quote workflow table writes reject cross-workspace, viewer, and anonymous callers', () => {
  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
      update public.quote_requests
      set status = 'quoted'
      where id = '${ids.quoteB}'
        and workspace_id = '${ids.workspaceB}'
      returning id::text
    `,
  );

  statementFailsAs(
    'authenticated',
    ids.authViewerA,
    `
      insert into public.quote_request_activity (
        workspace_id,
        quote_request_id,
        actor_admin_user_id,
        activity_type,
        note
      )
      values (
        '${ids.workspaceA}',
        '${ids.quoteA}',
        '${ids.adminViewerA}',
        'internal_note',
        'Viewer should not write notes.'
      )
    `,
  );

  statementFailsAs(
    'authenticated',
    ids.authNoMembership,
    `
      insert into public.quote_request_activity (
        workspace_id,
        quote_request_id,
        actor_admin_user_id,
        activity_type,
        note
      )
      values (
        '${ids.workspaceA}',
        '${ids.quoteA}',
        '${ids.adminNoMembership}',
        'internal_note',
        'No-membership user should not write notes.'
      )
    `,
  );

  statementFailsAs(
    'anon',
    null,
    `
      insert into public.quote_request_activity (
        workspace_id,
        quote_request_id,
        actor_admin_user_id,
        activity_type,
        note
      )
      values (
        '${ids.workspaceA}',
        '${ids.quoteA}',
        '${ids.adminA}',
        'internal_note',
        'Anonymous note should fail.'
      )
    `,
  );
});

check('anonymous public cannot write catalogue tables', () => {
  statementFailsAs(
    'anon',
    null,
    `
      insert into public.categories (workspace_id, slug, name, is_published)
      values ('${ids.workspaceA}', 'anon-category-write', 'Anon Category Write', true)
    `,
  );
  statementFailsAs(
    'anon',
    null,
    `
      insert into public.products (workspace_id, slug, name, status)
      values ('${ids.workspaceA}', 'anon-product-write', 'Anon Product Write', 'published')
    `,
  );
  statementFailsAs(
    'anon',
    null,
    `
      insert into public.product_images (
        workspace_id,
        product_id,
        storage_bucket,
        storage_path
      )
      values (
        '${ids.workspaceA}',
        '${ids.productPublishedA}',
        'test-public',
        'anon-product-image-write.jpg'
      )
    `,
  );
});

check('authenticated product admins can write only their workspace catalogue rows and audit product actions', () => {
  const categoryId = '40000000-0000-4000-8000-000000000101';
  const productId = '50000000-0000-4000-8000-000000000101';
  const imageId = '60000000-0000-4000-8000-000000000101';
  const output = queryAs(
    'authenticated',
    ids.authMemberA,
    `
      insert into public.categories (
        id,
        workspace_id,
        slug,
        name,
        is_published,
        sort_order
      )
      values (
        '${categoryId}',
        '${ids.workspaceA}',
        'admin-category-write',
        'Admin Category Write',
        false,
        10
      )
      returning id::text;

      update public.categories
      set is_published = true
      where id = '${categoryId}'
        and workspace_id = '${ids.workspaceA}'
      returning id::text;

      insert into public.products (
        id,
        workspace_id,
        category_id,
        slug,
        name,
        status,
        sort_order
      )
      values (
        '${productId}',
        '${ids.workspaceA}',
        '${categoryId}',
        'admin-product-write',
        'Admin Product Write',
        'draft',
        10
      )
      returning id::text;

      update public.products
      set status = 'published'
      where id = '${productId}'
        and workspace_id = '${ids.workspaceA}'
      returning id::text;

      insert into public.product_images (
        id,
        workspace_id,
        product_id,
        storage_bucket,
        storage_path,
        alt_text,
        sort_order,
        is_primary
      )
      values (
        '${imageId}',
        '${ids.workspaceA}',
        '${productId}',
        'test-public',
        'admin-product-write.jpg',
        'Admin product write image',
        10,
        true
      )
      returning id::text;

      update public.product_images
      set status = 'archived',
        is_primary = false
      where id = '${imageId}'
        and workspace_id = '${ids.workspaceA}'
      returning id::text;

      insert into public.audit_logs (
        workspace_id,
        actor_admin_user_id,
        actor_type,
        action,
        target_type,
        target_id,
        metadata
      )
      values (
        '${ids.workspaceA}',
        '${ids.adminA}',
        'admin',
        'product.create',
        'product',
        '${productId}',
        '{}'::jsonb
      );
    `,
  );

  assert.deepEqual(
    output.split('\n').filter(Boolean),
    [categoryId, categoryId, productId, productId, imageId, imageId],
    'owner should write and update only their workspace catalogue rows',
  );
});

check('authenticated product writes reject cross-workspace, viewer, and no-membership callers', () => {
  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
      insert into public.categories (workspace_id, slug, name, is_published)
      values ('${ids.workspaceB}', 'cross-workspace-write', 'Cross Workspace Write', false)
    `,
  );

  statementFailsAs(
    'authenticated',
    ids.authViewerA,
    `
      insert into public.products (workspace_id, slug, name, status)
      values ('${ids.workspaceA}', 'viewer-product-write', 'Viewer Product Write', 'draft')
    `,
  );

  statementFailsAs(
    'authenticated',
    ids.authNoMembership,
    `
      insert into public.product_images (
        workspace_id,
        product_id,
        storage_bucket,
        storage_path
      )
      values (
        '${ids.workspaceA}',
        '${ids.productPublishedA}',
        'test-public',
        'no-membership-product-image-write.jpg'
      )
    `,
  );
});

check('authenticated product writes reject cross-workspace relationships', () => {
  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
      insert into public.products (workspace_id, category_id, slug, name, status)
      values ('${ids.workspaceA}', '${ids.categoryPublishedB}', 'cross-workspace-product', 'Cross', 'draft')
    `,
  );

  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
      update public.products
      set category_id = '${ids.categoryPublishedB}'
      where id = '${ids.productPublishedA}'
    `,
  );

  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
      insert into public.product_images (
        workspace_id,
        product_id,
        storage_bucket,
        storage_path
      )
      values (
        '${ids.workspaceA}',
        '${ids.productPublishedB}',
        'test-public',
        'cross-workspace-product-image.jpg'
      )
    `,
  );
});

check('listing media storage uses public bucket URLs with workspace-admin scoped writes', () => {
  const storagePath = `${ids.workspaceA}/${ids.productPublishedA}/1700000000000-60000000-0000-4000-8000-000000000201.webp`;

  assert.equal(
    scalarAs(
      'anon',
      null,
      'select "public"::text from storage.buckets where id = \'listing-media\'',
    ),
    'true',
    'listing-media bucket should be public for rendered catalogue images',
  );

  queryAs(
    'authenticated',
    ids.authMemberA,
    `
      insert into storage.objects (
        bucket_id,
        name,
        owner,
        metadata
      )
      values (
        'listing-media',
        '${storagePath}',
        '${ids.authMemberA}',
        '{"mimetype": "image/webp"}'::jsonb
      )
    `,
  );

  statementFailsAs(
    'anon',
    null,
    `
      select count(*)::text
      from storage.objects
      where name = '${storagePath}'
    `,
  );

  statementFailsAs(
    'authenticated',
    ids.authViewerA,
    `
      insert into storage.objects (
        bucket_id,
        name,
        owner
      )
      values (
        'listing-media',
        '${ids.workspaceA}/${ids.productPublishedA}/1700000000000-60000000-0000-4000-8000-000000000202.webp',
        '${ids.authViewerA}'
      )
    `,
  );

  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
      insert into storage.objects (bucket_id, name, owner)
      values (
        'listing-media',
        '${ids.workspaceB}/${ids.productPublishedB}/1700000000000-60000000-0000-4000-8000-000000000203.webp',
        '${ids.authMemberA}'
      )
    `,
  );

  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
      insert into storage.objects (bucket_id, name, owner)
      values (
        'listing-media',
        '${ids.workspaceA}/${ids.productPublishedA}/unsafe-name.svg',
        '${ids.authMemberA}'
      )
    `,
  );
});

check('execute_admin_product_write rolls back mutation if audit insert fails', () => {
  psql(`
    create or replace function public.fail_audit() returns trigger as $$
    begin
      raise exception 'throwaway audit failure';
    end;
    $$ language plpgsql;

    create trigger force_audit_failure
    before insert on public.audit_logs
    for each row execute function public.fail_audit();
  `);

  try {
    const categoryId = 'f0000000-0000-4000-8000-000000000001';

    const result = psql(
      roleSql(
        'authenticated',
        ids.authMemberA,
        `
          select public.execute_admin_product_write(
            'category.create',
            '${categoryId}',
            '${ids.workspaceA}',
            '{"slug": "atomic-test", "name": "Atomic Test", "sort_order": 0}'::jsonb
          )
        `
      ),
      { check: false }
    );

    assert.notEqual(result.status, 0, 'Mutation should have failed due to trigger');
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /throwaway audit failure/i,
      'Mutation should have failed with throwaway audit failure',
    );

    assert.equal(
      scalarAs('anon', null, `select count(*)::text from public.categories where id = '${categoryId}'`),
      '0',
      'Mutation should have been rolled back',
    );
  } finally {
    psql(`
      drop trigger if exists force_audit_failure on public.audit_logs;
      drop function if exists public.fail_audit();
    `);
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

check('runtime website Supabase code stays server-only', () => {
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
