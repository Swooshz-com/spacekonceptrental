const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { ensureDockerRunning } = require('./ensure-docker-running.cjs');

const repoRoot = path.resolve(__dirname, '..');
const migrationsDir = path.join(repoRoot, 'supabase', 'migrations');
const dockerImage = process.env.SUPABASE_RLS_DB_IMAGE || 'postgres:16-alpine';
const containerName =
  process.env.SUPABASE_RLS_CONTAINER_NAME ||
  `spacekonceptrental-rls-test-${process.pid}-${Date.now()}`;
const keepContainer = process.env.SUPABASE_RLS_KEEP_DB === '1';
const dockerReadiness = ensureDockerRunning();

if (!dockerReadiness.ok) {
  process.exit(1);
}

const dockerConfigDir = fs.mkdtempSync(
  path.join(os.tmpdir(), 'spacekonceptrental-docker-config-'),
);

const expectedTables = [
  'admin_users',
  'audit_logs',
  'catalogue_public_workspace_config',
  'categories',
  'conversations',
  'homepage_hero_content',
  'integration_connections',
  'memberships',
  'messages',
  'product_images',
  'products',
  'quote_email_delivery_log',
  'quote_handoff_outbox',
  'quote_public_workspace_config',
  'quote_request_activity',
  'quote_request_items',
  'quote_requests',
  'search_index_documents',
  'search_index_jobs',
  'transcript_audit_events',
  'transcript_evidence_records',
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
  quoteEmailDeliveryA: '70600000-0000-4000-8000-000000000001',
  quoteEmailDeliveryB: '70600000-0000-4000-8000-000000000002',
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
  transcriptAuditEventA: 'd0000000-0000-4000-8000-000000000001',
  transcriptAuditEventB: 'd0000000-0000-4000-8000-000000000002',
  transcriptEvidenceRecordA: 'e0000000-0000-4000-8000-000000000001',
  transcriptEvidenceRecordB: 'e0000000-0000-4000-8000-000000000002',
  searchIndexJobA: 'f1000000-0000-4000-8000-000000000001',
  searchIndexJobB: 'f1000000-0000-4000-8000-000000000002',
  searchIndexDocumentA: 'f2000000-0000-4000-8000-000000000001',
  searchIndexDocumentB: 'f2000000-0000-4000-8000-000000000002',
};

const authEmails = {
  [ids.authMemberA]: 'admin-a@example.test',
  [ids.authMemberB]: 'admin-b@example.test',
  [ids.authNoMembership]: 'admin-no-membership@example.test',
  [ids.authViewerA]: 'viewer-a@example.test',
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

    insert into public.quote_public_workspace_config (
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

    insert into public.admin_access (
      workspace_id,
      normalized_email,
      role,
      status,
      linked_admin_user_id
    )
    values
      ('${ids.workspaceA}', 'admin-a@example.test', 'owner', 'active', '${ids.adminA}'),
      ('${ids.workspaceB}', 'admin-b@example.test', 'owner', 'active', '${ids.adminB}');

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

    insert into public.quote_email_delivery_log (
      id,
      workspace_id,
      quote_request_id,
      public_reference,
      recipient_email_redacted,
      provider,
      delivery_status,
      provider_message_id,
      error_code,
      request_id
    )
    values
      (
        '${ids.quoteEmailDeliveryA}',
        '${ids.workspaceA}',
        '${ids.quoteA}',
        'quote-a',
        'qu***@example.test',
        'resend',
        'sent',
        'resend-message-a',
        null,
        'rls-delivery-request-a'
      ),
      (
        '${ids.quoteEmailDeliveryB}',
        '${ids.workspaceB}',
        '${ids.quoteB}',
        'quote-b',
        'qu***@example.test',
        'resend',
        'failed',
        null,
        'provider_unavailable',
        'rls-delivery-request-b'
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

    insert into public.transcript_audit_events (
      id,
      workspace_id,
      conversation_id,
      quote_request_id,
      actor_admin_user_id,
      event_type,
      actor_type,
      request_id,
      approval_reference,
      reason_code,
      result_status,
      affected_record_count,
      metadata
    )
    values
      (
        '${ids.transcriptAuditEventA}',
        '${ids.workspaceA}',
        '${ids.conversationA}',
        '${ids.quoteA}',
        '${ids.adminA}',
        'transcript_persistence_attempt',
        'system',
        'rls-audit-request-a',
        'approval-a',
        'local_rls_seed',
        'succeeded',
        1,
        '{"source": "rls-seed"}'::jsonb
      ),
      (
        '${ids.transcriptAuditEventB}',
        '${ids.workspaceB}',
        '${ids.conversationB}',
        '${ids.quoteB}',
        '${ids.adminB}',
        'evidence_capture',
        'operator',
        'rls-audit-request-b',
        'approval-b',
        'local_rls_seed',
        'succeeded',
        1,
        '{"source": "rls-seed"}'::jsonb
      );

    insert into public.transcript_evidence_records (
      id,
      workspace_id,
      audit_event_id,
      evidence_type,
      environment_label,
      commit_sha,
      validation_summary,
      dry_run_summary,
      rollback_summary,
      operator_notes,
      metadata
    )
    values
      (
        '${ids.transcriptEvidenceRecordA}',
        '${ids.workspaceA}',
        '${ids.transcriptAuditEventA}',
        'local_sql_rls_proof',
        'local',
        'a59547130c33ec56e275dfdee48ceac9a1f8587f',
        'Local RLS proof placeholder only.',
        'Dry-run placeholder only.',
        'Rollback placeholder only.',
        'Operator note placeholder only.',
        '{"source": "rls-seed"}'::jsonb
      ),
      (
        '${ids.transcriptEvidenceRecordB}',
        '${ids.workspaceB}',
        '${ids.transcriptAuditEventB}',
        'static_guard_proof',
        'local',
        'a59547130c33ec56e275dfdee48ceac9a1f8587f',
        'Static guard proof placeholder only.',
        'Dry-run placeholder only.',
        'Rollback placeholder only.',
        'Operator note placeholder only.',
        '{"source": "rls-seed"}'::jsonb
      );

    insert into public.search_index_jobs (
      id,
      workspace_id,
      source_type,
      source_id,
      source_version,
      visibility,
      operation,
      status,
      content_hash,
      metadata
    )
    values
      (
        '${ids.searchIndexJobA}',
        '${ids.workspaceA}',
        'listing',
        '${ids.productPublishedA}',
        'listing-v1',
        'public_chat',
        'upsert',
        'queued',
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        '{"source": "rls-seed"}'::jsonb
      ),
      (
        '${ids.searchIndexJobB}',
        '${ids.workspaceB}',
        'category',
        '${ids.categoryPublishedB}',
        'category-v1',
        'public_chat',
        'upsert',
        'queued',
        'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        '{"source": "rls-seed"}'::jsonb
      );

    insert into public.search_index_documents (
      id,
      workspace_id,
      source_type,
      source_id,
      source_version,
      visibility,
      status,
      title,
      content_hash,
      chunk_count,
      last_index_job_id,
      indexed_at,
      metadata
    )
    values
      (
        '${ids.searchIndexDocumentA}',
        '${ids.workspaceA}',
        'listing',
        '${ids.productPublishedA}',
        'listing-v1',
        'public_chat',
        'succeeded',
        'Published product A',
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        2,
        '${ids.searchIndexJobA}',
        now(),
        '{"source": "rls-seed"}'::jsonb
      ),
      (
        '${ids.searchIndexDocumentB}',
        '${ids.workspaceB}',
        'category',
        '${ids.categoryPublishedB}',
        'category-v1',
        'public_chat',
        'succeeded',
        'Published category B',
        'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        1,
        '${ids.searchIndexJobB}',
        now(),
        '{"source": "rls-seed"}'::jsonb
      );
  `);
}

function authEmailFor(authUserId) {
  return authEmails[authUserId] || '';
}

function roleSql(role, authUserId, sql) {
  assert.ok(role === 'anon' || role === 'authenticated', `Unexpected role: ${role}`);

  return `
    begin;
    set local role ${role};
    set local "request.jwt.claim.role" = '${role}';
    set local "request.jwt.claim.sub" = '${authUserId || ''}';
    set local "request.jwt.claim.email" = '${authEmailFor(authUserId)}';
    ${sql.trim().replace(/;?\s*$/, ';')}
    rollback;
  `;
}

function committedRoleSql(role, authUserId, sql) {
  assert.ok(role === 'anon' || role === 'authenticated', `Unexpected role: ${role}`);

  return `
    begin;
    set local role ${role};
    set local "request.jwt.claim.role" = '${role}';
    set local "request.jwt.claim.sub" = '${authUserId || ''}';
    set local "request.jwt.claim.email" = '${authEmailFor(authUserId)}';
    ${sql.trim().replace(/;?\s*$/, ';')}
    commit;
  `;
}

function queryAs(role, authUserId, sql) {
  return psql(roleSql(role, authUserId, sql));
}

function queryCommittedAs(role, authUserId, sql) {
  return psql(committedRoleSql(role, authUserId, sql));
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
  label = 'Statement',
) {
  const result = psql(sql, { check: false });
  assert.notEqual(result.status, 0, `${label} unexpectedly succeeded: ${sql}`);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    expectedError,
    `${label} failed for an unexpected reason: ${result.stdout}${result.stderr}`,
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
    'website/lib/server-runtime-config.ts',
    'website/lib/supabase/env.ts',
    'website/lib/supabase/server.ts',
    'website/lib/admin/authorization/supabase-admin-auth-identity-adapter.ts',
    'website/lib/admin/authorization/supabase-admin-profile-membership-adapters.ts',
  ]);
  const approvedCatalogueReadFiles = new Set([
    'website/lib/catalogue/catalogue-repository.ts',
  ]);
  const approvedQuoteWriteFiles = new Map([
    [
      'website/lib/quote/quote-repository.ts',
      'submit_public_quote_request',
    ],
    [
      'website/lib/quote/quote-handoff-repository.ts',
      'finalize_public_quote_handoff',
    ],
  ]);
  const approvedQuoteEmailDeliveryLogFiles = new Set([
    'website/lib/quote/quote-email-delivery-log-repository.ts',
  ]);
  const approvedPublicHeroReadFiles = new Set([
    'website/lib/hero/public-homepage-hero-repository.ts',
  ]);
  const approvedPublicPageMediaReadFiles = new Set([
    'website/lib/page-media/public-page-media-repository.ts',
  ]);
  const approvedMediaUploadFiles = new Set([
    'website/lib/products/media/admin-product-image-upload-route.ts',
  ]);
  const approvedHeroMediaUploadFiles = new Set([
    'website/lib/hero/admin-homepage-hero-write-route.ts',
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
    /from\(["']quote_requests["']\)/i,
    /from\(["']quote_request_items["']\)/i,
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
        const approvedRpc = approvedQuoteWriteFiles.get(relativePath);

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
          new RegExp(`rpc\\(["']${approvedRpc}["']`),
          `${relativePath} must use only its approved public quote RPC.`,
        );
        assertNoMatches(filePath, content, serverBlockedPatterns);
        assertNoMatches(filePath, content, blockedQuoteWriteTablePatterns);
        return;
      }

      if (approvedQuoteEmailDeliveryLogFiles.has(relativePath)) {
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
          /from\(["']quote_email_delivery_log["']\)/,
          `${relativePath} must insert quote_email_delivery_log explicitly.`,
        );
        assertNoMatches(filePath, content, serverBlockedPatterns);
        assertNoMatches(filePath, content, blockedQuoteWriteTablePatterns);
        return;
      }

      if (approvedPublicHeroReadFiles.has(relativePath)) {
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
          /rpc\(["']get_public_homepage_hero["']/,
          `${relativePath} must use the trusted public homepage hero RPC.`,
        );
        assert.doesNotMatch(
          content,
          /from\(["']homepage_hero_content["']\)/,
          `${relativePath} must not read the homepage hero base table directly.`,
        );
        assert.doesNotMatch(
          content,
          /updatedBy|updated_by/,
          `${relativePath} must not carry protected admin hero metadata into public content.`,
        );
        assertNoMatches(filePath, content, serverBlockedPatterns);
        assertNoMatches(filePath, content, blockedCatalogueTablePatterns);
        return;
      }

      if (approvedPublicPageMediaReadFiles.has(relativePath)) {
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
          /rpc\(["']get_public_page_media["']/,
          `${relativePath} must use the trusted public page media RPC.`,
        );
        assert.doesNotMatch(
          content,
          /from\(["']public_page_media["']\)/,
          `${relativePath} must not read the public page media base table directly.`,
        );
        assert.doesNotMatch(
          content,
          /updatedBy|updated_by/,
          `${relativePath} must not carry protected admin page media metadata into public content.`,
        );
        assertNoMatches(filePath, content, serverBlockedPatterns);
        assertNoMatches(filePath, content, blockedCatalogueTablePatterns);
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

      if (approvedHeroMediaUploadFiles.has(relativePath)) {
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
          /requestedOperation:\s*heroWriteOperation/,
          `${relativePath} must require hero.write.`,
        );
        assert.match(
          content,
          /createSessionBoundSupabaseAdminReadClient/,
          `${relativePath} must use the session-bound Supabase client.`,
        );
        assert.match(
          content,
          /\.storage\.from\(heroMediaBucket\)/,
          `${relativePath} must write only through the fixed hero media bucket.`,
        );
        assert.doesNotMatch(
          content,
          /productId|product_id/,
          `${relativePath} must not require listing/product ids for homepage hero images.`,
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
      "select coalesce(string_agg(public_reference || ':' || delivery_status, ',' order by public_reference), '') from public.quote_email_delivery_log",
    ),
    'quote-a:sent',
    'member A should read only workspace A quote email delivery metadata',
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

check('admin access read helpers expose safe DTOs without direct private-column filters', () => {
  assertCsv(
    scalarAs(
      'authenticated',
      ids.authMemberA,
      `
        select coalesce(
          string_agg(
            normalized_email || ':' || role || ':' || status,
            ',' order by normalized_email
          ),
          ''
        )
        from public.list_admin_access_records('${ids.workspaceA}'::uuid)
      `,
    ),
    'admin-a@example.test:owner:active',
    'active owner should read owner-safe admin access records through the RPC helper',
  );

  assertCsv(
    scalarAs(
      'authenticated',
      ids.authMemberA,
      `
        select coalesce(
          string_agg(normalized_email || ':' || role || ':' || status, ','),
          ''
        )
        from public.get_admin_access_membership(
          '${ids.workspaceA}'::uuid,
          '${ids.adminA}'::uuid
        )
      `,
    ),
    'admin-a@example.test:owner:active',
    'membership resolver should read owner-safe access data through the self-scoped RPC helper',
  );

  assertCsv(
    scalarAs(
      'authenticated',
      ids.authNoMembership,
      `
        select count(*)::text
        from public.list_admin_access_records('${ids.workspaceA}'::uuid)
      `,
    ),
    '0',
    'unknown Google-authenticated users should not read admin access records',
  );

});

check('authenticated active member cannot read another workspace admin rows', () => {
  const workspaceBFilters = [
    ['workspaces', `id = '${ids.workspaceB}'`],
    ['memberships', `workspace_id = '${ids.workspaceB}'`],
    ['quote_request_activity', `workspace_id = '${ids.workspaceB}'`],
    ['quote_email_delivery_log', `workspace_id = '${ids.workspaceB}'`],
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
    'quote_email_delivery_log',
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

check('homepage hero content exposes enabled public reads and protected admin writes only', () => {
  const enabledWrite = queryCommittedAs(
    'authenticated',
    ids.authMemberA,
    `
      select workspace_id::text
      from public.execute_admin_homepage_hero_write(
        '${ids.workspaceA}'::uuid,
        jsonb_build_object(
          'eyebrow', 'Owner managed',
          'headline', 'Managed homepage hero',
          'body', 'Protected admin homepage content.',
          'primary_cta_label', 'Request Quote',
          'primary_cta_href', '/quote',
          'secondary_cta_label', 'Browse Catalogue',
          'secondary_cta_href', '/catalogue',
          'image_url', 'https://cdn.example.test/hero.jpg',
          'image_alt', 'Managed lounge setup',
          'is_enabled', true
        )
      )
    `,
  );

  assertCsv(
    enabledWrite,
    ids.workspaceA,
    'owner/admin should write homepage hero image state through the compatibility RPC',
  );
  assertCsv(
    scalarAs(
      'anon',
      null,
      `select headline from public.get_public_homepage_hero('${ids.workspaceA}')`,
    ),
    'Furnish Your Vision, Elevate Every Space',
    'legacy hero write RPC should keep enabled homepage copy code-owned',
  );
  assertCsv(
    scalarAs(
      'anon',
      null,
      `
        select concat(
          to_jsonb(hero) ? 'workspace_id',
          ':',
          to_jsonb(hero) ? 'updated_by'
        )
        from public.get_public_homepage_hero('${ids.workspaceA}') as hero
      `,
    ),
    'f:f',
    'anonymous public RPC should not return workspace/admin metadata',
  );
  assertCsv(
    scalarAs(
      'anon',
      null,
      `select count(*)::text from public.homepage_hero_content where workspace_id = '${ids.workspaceA}'`,
    ),
    '0',
    'anonymous direct table reads should not return homepage hero rows',
  );
  assertCsv(
    scalarAs(
      'anon',
      null,
      `select count(*)::text from public.get_public_homepage_hero('${ids.workspaceA}')`,
    ),
    '1',
    'anonymous public RPC should remain the only public read surface',
  );
  assertCsv(
    scalarAs(
      'anon',
      null,
      `select count(*)::text from public.get_public_homepage_hero('${ids.workspaceB}')`,
    ),
    '0',
    'anonymous public RPC should not read another workspace without enabled content',
  );

  queryCommittedAs(
    'authenticated',
    ids.authMemberA,
    `
      select workspace_id::text
      from public.execute_admin_homepage_hero_write(
        '${ids.workspaceA}'::uuid,
        jsonb_build_object(
          'eyebrow', 'Owner draft',
          'headline', 'Draft homepage hero',
          'body', 'Draft protected admin homepage content.',
          'primary_cta_label', 'Request Quote',
          'primary_cta_href', '/quote',
          'secondary_cta_label', 'Browse Catalogue',
          'secondary_cta_href', '/catalogue',
          'image_url', 'https://cdn.example.test/draft-hero.jpg',
          'image_alt', 'Draft managed lounge setup',
          'is_enabled', false
        )
      )
    `,
  );
  assertCsv(
    scalarAs(
      'anon',
      null,
      `select count(*)::text from public.get_public_homepage_hero('${ids.workspaceA}')`,
    ),
    '0',
    'anonymous public RPC should hide unpublished hero content',
  );
  assertCsv(
    scalarAs(
      'authenticated',
      ids.authMemberA,
      `select headline from public.homepage_hero_content where workspace_id = '${ids.workspaceA}'`,
    ),
    'Furnish Your Vision, Elevate Every Space',
    'legacy hero write RPC should keep unpublished homepage copy code-owned',
  );
  assertCsv(
    scalarAs(
      'authenticated',
      ids.authViewerA,
      `select count(*)::text from public.homepage_hero_content where workspace_id = '${ids.workspaceA}'`,
    ),
    '0',
    'workspace viewers should not read unpublished hero content',
  );
  queryCommittedAs(
    'authenticated',
    ids.authMemberA,
    `
      select workspace_id::text
      from public.execute_admin_homepage_hero_image_write(
        '${ids.workspaceA}'::uuid,
        jsonb_build_object(
          'image_url', 'https://cdn.example.test/uploaded-hero.webp',
          'image_alt', 'Uploaded owner hero image',
          'is_enabled', true
        )
      )
    `,
  );
  assertCsv(
    scalarAs(
      'anon',
      null,
      `select image_alt from public.get_public_homepage_hero('${ids.workspaceA}')`,
    ),
    'Uploaded owner hero image',
    'image-only hero RPC should publish owner-managed alt text',
  );
  assertCsv(
    scalarAs(
      'anon',
      null,
      `select headline from public.get_public_homepage_hero('${ids.workspaceA}')`,
    ),
    'Furnish Your Vision, Elevate Every Space',
    'image-only hero RPC should keep homepage copy code-owned',
  );
  statementFailsAs(
    'authenticated',
    ids.authViewerA,
    `
      select workspace_id::text
      from public.execute_admin_homepage_hero_image_write(
        '${ids.workspaceA}'::uuid,
        jsonb_build_object(
          'image_url', 'https://cdn.example.test/viewer-hero.jpg',
          'image_alt', 'Viewer hero',
          'is_enabled', true
        )
      )
    `,
    /hero_admin_context_invalid|permission denied/i,
  );
  statementFailsAs(
    'anon',
    null,
    `
      select workspace_id::text
      from public.execute_admin_homepage_hero_image_write(
        '${ids.workspaceA}'::uuid,
        jsonb_build_object(
          'image_url', 'https://cdn.example.test/anon-hero.jpg',
          'image_alt', 'Anonymous hero',
          'is_enabled', true
        )
      )
    `,
    /permission denied/i,
  );
  statementFailsAs(
    'authenticated',
    ids.authViewerA,
    `
      select workspace_id::text
      from public.execute_admin_homepage_hero_write(
        '${ids.workspaceA}'::uuid,
        jsonb_build_object(
          'headline', 'Viewer write',
          'body', 'Viewer write should fail.',
          'primary_cta_label', 'Request Quote',
          'primary_cta_href', '/quote',
          'secondary_cta_label', 'Browse Catalogue',
          'secondary_cta_href', '/catalogue',
          'image_url', 'https://cdn.example.test/viewer-hero.jpg',
          'image_alt', 'Viewer hero',
          'is_enabled', true
        )
      )
    `,
    /hero_admin_context_invalid|permission denied/i,
  );
  statementFailsAs(
    'anon',
    null,
    `
      select workspace_id::text
      from public.execute_admin_homepage_hero_write(
        '${ids.workspaceA}'::uuid,
        jsonb_build_object(
          'headline', 'Anonymous write',
          'body', 'Anonymous write should fail.',
          'primary_cta_label', 'Request Quote',
          'primary_cta_href', '/quote',
          'secondary_cta_label', 'Browse Catalogue',
          'secondary_cta_href', '/catalogue',
          'image_url', 'https://cdn.example.test/anon-hero.jpg',
          'image_alt', 'Anonymous hero',
          'is_enabled', true
        )
      )
    `,
    /permission denied/i,
  );
  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
      insert into public.homepage_hero_content (
        workspace_id,
        headline,
        body,
        primary_cta_label,
        primary_cta_href,
        secondary_cta_label,
        secondary_cta_href,
        image_url,
        image_alt
      )
      values (
        '${ids.workspaceB}',
        'Direct write',
        'Direct writes should fail.',
        'Request Quote',
        '/quote',
        'Browse Catalogue',
        '/catalogue',
        'https://cdn.example.test/direct.jpg',
        'Direct write hero'
      )
    `,
    /permission denied/i,
  );
  statementFailsAs(
    'anon',
    null,
    `
      insert into public.homepage_hero_content (
        workspace_id,
        headline,
        body,
        primary_cta_label,
        primary_cta_href,
        secondary_cta_label,
        secondary_cta_href,
        image_url,
        image_alt
      )
      values (
        '${ids.workspaceA}',
        'Anonymous direct write',
        'Anonymous direct writes should fail.',
        'Request Quote',
        '/quote',
        'Browse Catalogue',
        '/catalogue',
        'https://cdn.example.test/anon-direct.jpg',
        'Anonymous direct write hero'
      )
    `,
    /permission denied/i,
  );
});

check('anonymous public reads do not return private workspace data', () => {
  const privateTables = [
    'admin_users',
    'catalogue_public_workspace_config',
    'quote_public_workspace_config',
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
  const unsafeMetadataCases = [
    [
      'conversation webhook_url',
      "jsonb_build_object('webhook_url', 'blocked')",
      "jsonb_build_object('source', 'rls-test')",
    ],
    [
      'conversation nested providerDebug',
      "jsonb_build_object('nested', jsonb_build_object('providerDebug', 'blocked'))",
      "jsonb_build_object('source', 'rls-test')",
    ],
    [
      'conversation nested provider_debug',
      "jsonb_build_object('nested', jsonb_build_object('provider_debug', 'blocked'))",
      "jsonb_build_object('source', 'rls-test')",
    ],
    [
      'message nested traceDump',
      "jsonb_build_object('entryPoint', 'rls-test')",
      "jsonb_build_object('nested', jsonb_build_object('traceDump', 'blocked'))",
    ],
    [
      'message nested trace_dump',
      "jsonb_build_object('entryPoint', 'rls-test')",
      "jsonb_build_object('nested', jsonb_build_object('trace_dump', 'blocked'))",
    ],
  ];

  for (const [index, [label, conversationMetadataSql, messageMetadataSql]] of unsafeMetadataCases.entries()) {
    const conversationId = `80000000-0000-4000-8000-${String(201 + index).padStart(12, '0')}`;
    const messageId = `90000000-0000-4000-8000-${String(201 + index).padStart(12, '0')}`;

    statementFails(
      `
        select public.persist_transcript_batch(
          '${ids.workspaceA}'::uuid,
          jsonb_build_object(
            'id', '${conversationId}',
            'workspace_id', '${ids.workspaceA}',
            'public_reference', 'rpc-unsafe-metadata-${index}',
            'metadata', ${conversationMetadataSql}
          ),
          jsonb_build_array(
            jsonb_build_object(
              'id', '${messageId}',
              'workspace_id', '${ids.workspaceA}',
              'conversation_id', '${conversationId}',
              'role', 'user',
              'message_type', 'chat',
              'content', 'Unsafe metadata should fail.',
              'metadata', ${messageMetadataSql}
            )
          )
        )
      `,
      /transcript_metadata_unsafe/i,
      `persist_transcript_batch should reject unsafe metadata key ${label}`,
    );
  }
});

check('transcript audit/evidence tables deny direct client reads and writes', () => {
  const clientRoles = [
    ['anon', null],
    ['authenticated', ids.authMemberA],
    ['authenticated', ids.authMemberB],
    ['authenticated', ids.authViewerA],
    ['authenticated', ids.authNoMembership],
  ];

  for (const [role, authUserId] of clientRoles) {
    for (const table of ['transcript_audit_events', 'transcript_evidence_records']) {
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
        insert into public.transcript_audit_events (
          workspace_id,
          event_type,
          actor_type,
          result_status,
          metadata
        )
        values (
          '${ids.workspaceA}',
          'transcript_persistence_attempt',
          'system',
          'succeeded',
          '{"source": "client-write-attempt"}'::jsonb
        )
      `,
    );

    statementFailsAs(
      role,
      authUserId,
      `
        insert into public.transcript_evidence_records (
          workspace_id,
          evidence_type,
          metadata
        )
        values (
          '${ids.workspaceA}',
          'local_sql_rls_proof',
          '{"source": "client-write-attempt"}'::jsonb
        )
      `,
    );

    statementFailsAs(
      role,
      authUserId,
      `
        update public.transcript_audit_events
        set metadata = '{"source": "client-update-attempt"}'::jsonb
        where id = '${ids.transcriptAuditEventA}'
      `,
    );

    statementFailsAs(
      role,
      authUserId,
      `
        update public.transcript_evidence_records
        set metadata = '{"source": "client-update-attempt"}'::jsonb
        where id = '${ids.transcriptEvidenceRecordA}'
      `,
    );

    statementFailsAs(
      role,
      authUserId,
      `
        delete from public.transcript_audit_events
        where id = '${ids.transcriptAuditEventA}'
      `,
    );

    statementFailsAs(
      role,
      authUserId,
      `
        delete from public.transcript_evidence_records
        where id = '${ids.transcriptEvidenceRecordA}'
      `,
    );
  }
});

check('transcript audit/evidence constraints accept safe local rows and reject unsafe payloads', () => {
  const safeAuditEventId = 'd0000000-0000-4000-8000-000000000101';
  const safeEvidenceRecordId = 'e0000000-0000-4000-8000-000000000101';

  psql(`
    insert into public.transcript_audit_events (
      id,
      workspace_id,
      conversation_id,
      quote_request_id,
      actor_admin_user_id,
      event_type,
      actor_type,
      request_id,
      approval_reference,
      reason_code,
      result_status,
      affected_record_count,
      metadata
    )
    values (
      '${safeAuditEventId}',
      '${ids.workspaceA}',
      '${ids.conversationA}',
      '${ids.quoteA}',
      '${ids.adminA}',
      'evidence_capture',
      'operator',
      'rls-safe-audit-request',
      'local-approval',
      'local_sql_rls_proof',
      'succeeded',
      1,
      jsonb_build_object('source', 'rls-test', 'nested', jsonb_build_object('proof', true))
    );
  `);

  psql(`
    insert into public.transcript_evidence_records (
      id,
      workspace_id,
      audit_event_id,
      evidence_type,
      environment_label,
      commit_sha,
      validation_summary,
      dry_run_summary,
      rollback_summary,
      operator_notes,
      metadata
    )
    values (
      '${safeEvidenceRecordId}',
      '${ids.workspaceA}',
      '${safeAuditEventId}',
      'local_sql_rls_proof',
      'local',
      'a59547130c33ec56e275dfdee48ceac9a1f8587f',
      'Local SQL and RLS proof summary placeholder.',
      'Dry-run proof placeholder.',
      'Rollback and disable plan placeholder.',
      'Operator notes placeholder.',
      jsonb_build_object('source', 'rls-test')
    );
  `);

  assert.equal(
    psql(`
      select count(*)::text
      from public.transcript_evidence_records
      where id = '${safeEvidenceRecordId}'
        and metadata = jsonb_build_object('source', 'rls-test')
    `),
    '1',
    'safe local evidence placeholder row should be inserted by privileged harness',
  );

  assert.equal(
    psql(`
      select count(*)::text
      from public.transcript_audit_events tae
      left join public.transcript_evidence_records ter on ter.audit_event_id = tae.id
      where (tae.metadata::text || coalesce(ter.metadata::text, '') || coalesce(ter.validation_summary, '')) ~*
        'full[_ -]?transcript|raw[_ -]?provider|provider[_ -]?payload|workflow[_ -]?payload|webhook|tokens?|api[_ -]?key|private[_ -]?key|secret|service[_ -]?role'
    `),
    '0',
    'audit/evidence placeholders should not store transcript content, provider payloads, or secrets',
  );

  statementFails(
    `
      insert into public.transcript_audit_events (
        workspace_id,
        event_type,
        actor_type,
        result_status,
        metadata
      )
      values (
        '${ids.workspaceA}',
        'unsupported_event',
        'system',
        'succeeded',
        '{"source": "rls-test"}'::jsonb
      )
    `,
    /transcript_audit_events_event_type_check/i,
  );

  statementFails(
    `
      insert into public.transcript_audit_events (
        workspace_id,
        event_type,
        actor_type,
        result_status,
        metadata
      )
      values (
        '${ids.workspaceA}',
        'transcript_persistence_attempt',
        'customer',
        'succeeded',
        '{"source": "rls-test"}'::jsonb
      )
    `,
    /transcript_audit_events_actor_type_check/i,
  );

  statementFails(
    `
      insert into public.transcript_audit_events (
        workspace_id,
        event_type,
        actor_type,
        result_status,
        affected_record_count,
        metadata
      )
      values (
        '${ids.workspaceA}',
        'transcript_persistence_attempt',
        'system',
        'succeeded',
        -1,
        '{"source": "rls-test"}'::jsonb
      )
    `,
    /transcript_audit_events_affected_record_count_check/i,
  );

  const unsafeMetadataCases = [
    ['fullTranscript', "jsonb_build_object('fullTranscript', 'blocked')"],
    ['transcriptContent', "jsonb_build_object('transcriptContent', 'blocked')"],
    [
      'nested providerDebug',
      "jsonb_build_object('nested', jsonb_build_object('providerDebug', 'blocked'))",
    ],
    [
      'nested provider_debug',
      "jsonb_build_object('nested', jsonb_build_object('provider_debug', 'blocked'))",
    ],
    [
      'nested traceDump',
      "jsonb_build_object('nested', jsonb_build_object('traceDump', 'blocked'))",
    ],
    [
      'nested trace_dump',
      "jsonb_build_object('nested', jsonb_build_object('trace_dump', 'blocked'))",
    ],
    ['serviceRole', "jsonb_build_object('serviceRole', 'blocked')"],
    [
      'customerVisibleInternalNotes',
      "jsonb_build_object('customerVisibleInternalNotes', 'blocked')",
    ],
    [
      'nested customerVisibleInternalNotes',
      "jsonb_build_object('nested', jsonb_build_object('customerVisibleInternalNotes', 'blocked'))",
    ],
    [
      'nested rawProviderPayload',
      "jsonb_build_object('nested', jsonb_build_object('rawProviderPayload', 'blocked'))",
    ],
    ['apiKey', "jsonb_build_object('apiKey', 'blocked')"],
  ];

  for (const [label, metadataSql] of unsafeMetadataCases) {
    statementFails(
      `
        insert into public.transcript_audit_events (
          workspace_id,
          event_type,
          actor_type,
          result_status,
          metadata
        )
        values (
          '${ids.workspaceA}',
          'transcript_persistence_attempt',
          'system',
          'succeeded',
          ${metadataSql}
        )
      `,
      /transcript_audit_events_metadata_safe_check/i,
      `transcript_audit_events should reject unsafe metadata key ${label}`,
    );

    statementFails(
      `
        insert into public.transcript_evidence_records (
          workspace_id,
          evidence_type,
          metadata
        )
        values (
          '${ids.workspaceA}',
          'local_sql_rls_proof',
          ${metadataSql}
        )
      `,
      /transcript_evidence_records_metadata_safe_check/i,
      `transcript_evidence_records should reject unsafe metadata key ${label}`,
    );
  }

  statementFails(
    `
      insert into public.transcript_evidence_records (
        workspace_id,
        evidence_type,
        validation_summary,
        metadata
      )
      values (
        '${ids.workspaceA}',
        'local_sql_rls_proof',
        'raw provider payload should not be stored',
        '{"source": "rls-test"}'::jsonb
      )
    `,
    /transcript_evidence_records_safe_text_check/i,
  );

  statementFails(
    `
      insert into public.transcript_evidence_records (
        workspace_id,
        audit_event_id,
        evidence_type,
        metadata
      )
      values (
        '${ids.workspaceB}',
        '${safeAuditEventId}',
        'local_sql_rls_proof',
        '{"source": "rls-test"}'::jsonb
      )
    `,
    /transcript_evidence_records_audit_event_workspace_id_fkey/i,
  );
});

check('search-index outbox tables deny direct client reads and writes', () => {
  const clientRoles = [
    ['anon', null],
    ['authenticated', ids.authMemberA],
    ['authenticated', ids.authMemberB],
    ['authenticated', ids.authViewerA],
    ['authenticated', ids.authNoMembership],
  ];

  for (const [role, authUserId] of clientRoles) {
    for (const table of ['search_index_jobs', 'search_index_documents']) {
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
        insert into public.search_index_jobs (
          workspace_id,
          source_type,
          source_id,
          visibility,
          operation,
          status,
          content_hash,
          metadata
        )
        values (
          '${ids.workspaceA}',
          'listing',
          '${ids.productPublishedA}',
          'public_chat',
          'upsert',
          'queued',
          'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
          '{"source": "client-write-attempt"}'::jsonb
        )
      `,
    );

    statementFailsAs(
      role,
      authUserId,
      `
        insert into public.search_index_documents (
          workspace_id,
          source_type,
          source_id,
          visibility,
          status,
          content_hash,
          metadata
        )
        values (
          '${ids.workspaceA}',
          'listing',
          '${ids.productPublishedA}',
          'public_chat',
          'succeeded',
          'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
          '{"source": "client-write-attempt"}'::jsonb
        )
      `,
    );

    statementFailsAs(
      role,
      authUserId,
      `
        update public.search_index_jobs
        set metadata = '{"source": "client-update-attempt"}'::jsonb
        where id = '${ids.searchIndexJobA}'
      `,
    );

    statementFailsAs(
      role,
      authUserId,
      `
        update public.search_index_documents
        set metadata = '{"source": "client-update-attempt"}'::jsonb
        where id = '${ids.searchIndexDocumentA}'
      `,
    );

    statementFailsAs(
      role,
      authUserId,
      `
        delete from public.search_index_jobs
        where id = '${ids.searchIndexJobA}'
      `,
    );

    statementFailsAs(
      role,
      authUserId,
      `
        delete from public.search_index_documents
        where id = '${ids.searchIndexDocumentA}'
      `,
    );
  }
});

check('search-index outbox constraints accept safe local rows and reject unsafe payloads', () => {
  const safeJobId = 'f1000000-0000-4000-8000-000000000101';
  const safeDocumentId = 'f2000000-0000-4000-8000-000000000101';
  const duplicateFailedJobId = 'f1000000-0000-4000-8000-000000000102';
  const contentHash =
    'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';

  psql(`
    insert into public.search_index_jobs (
      id,
      workspace_id,
      source_type,
      source_id,
      source_version,
      visibility,
      operation,
      status,
      content_hash,
      metadata
    )
    values (
      '${safeJobId}',
      '${ids.workspaceA}',
      'listing',
      '${ids.productDraftA}',
      'listing-v2',
      'admin_only',
      'upsert',
      'queued',
      '${contentHash}',
      jsonb_build_object('source', 'rls-test', 'nested', jsonb_build_object('proof', true))
    );
  `);

  psql(`
    insert into public.search_index_documents (
      id,
      workspace_id,
      source_type,
      source_id,
      source_version,
      visibility,
      status,
      title,
      content_hash,
      chunk_count,
      last_index_job_id,
      indexed_at,
      metadata
    )
    values (
      '${safeDocumentId}',
      '${ids.workspaceA}',
      'listing',
      '${ids.productDraftA}',
      'listing-v2',
      'admin_only',
      'succeeded',
      'Draft product A',
      '${contentHash}',
      3,
      '${safeJobId}',
      now(),
      jsonb_build_object('source', 'rls-test')
    );
  `);

  assert.equal(
    psql(`
      select count(*)::text
      from public.search_index_documents
      where id = '${safeDocumentId}'
        and chunk_count = 3
        and metadata = jsonb_build_object('source', 'rls-test')
    `),
    '1',
    'safe local search-index document row should be inserted by privileged harness',
  );

  statementFails(
    `
      delete from public.search_index_jobs
      where id = '${safeJobId}'
        and workspace_id = '${ids.workspaceA}'
    `,
    /search_index_documents_last_index_job_workspace_id_fkey|still referenced|foreign key/i,
    'referenced search_index_jobs row should be restricted while a document points at it',
  );

  assert.equal(
    psql(`
      select count(*)::text
      from public.search_index_documents
      where id = '${safeDocumentId}'
        and last_index_job_id = '${safeJobId}'
    `),
    '1',
    'restricted job deletion should leave the document/job reference intact',
  );

  statementFails(
    `
      insert into public.search_index_jobs (
        workspace_id,
        source_type,
        source_id,
        visibility,
        operation,
        status,
        content_hash,
        metadata
      )
      values (
        '${ids.workspaceA}',
        'quote_request',
        '${ids.quoteA}',
        'public_chat',
        'upsert',
        'queued',
        '${contentHash}',
        '{"source": "rls-test"}'::jsonb
      )
    `,
    /search_index_jobs_source_type_check/i,
  );

  statementFails(
    `
      insert into public.search_index_jobs (
        workspace_id,
        source_type,
        source_id,
        visibility,
        operation,
        status,
        attempt_count,
        metadata
      )
      values (
        '${ids.workspaceA}',
        'listing',
        '${ids.productDraftA}',
        'public_chat',
        'rebuild',
        'queued',
        -1,
        '{"source": "rls-test"}'::jsonb
      )
    `,
    /search_index_jobs_attempt_count_check/i,
  );

  statementFails(
    `
      insert into public.search_index_documents (
        workspace_id,
        source_type,
        source_id,
        visibility,
        status,
        content_hash,
        chunk_count,
        metadata
      )
      values (
        '${ids.workspaceA}',
        'listing',
        '${ids.productDraftA}',
        'customer_visible',
        'succeeded',
        'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
        1,
        '{"source": "rls-test"}'::jsonb
      )
    `,
    /search_index_documents_visibility_check/i,
  );

  statementFails(
    `
      insert into public.search_index_documents (
        workspace_id,
        source_type,
        source_id,
        visibility,
        status,
        content_hash,
        chunk_count,
        metadata
      )
      values (
        '${ids.workspaceA}',
        'listing',
        '${ids.productDraftA}',
        'blocked',
        'succeeded',
        'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
        -1,
        '{"source": "rls-test"}'::jsonb
      )
    `,
    /search_index_documents_chunk_count_check/i,
  );

  const unsafeMetadataCases = [
    ['providerDebug', "jsonb_build_object('providerDebug', 'blocked')"],
    ['traceDump', "jsonb_build_object('traceDump', 'blocked')"],
    ['apiKey', "jsonb_build_object('apiKey', 'blocked')"],
    ['serviceRole', "jsonb_build_object('serviceRole', 'blocked')"],
    [
      'customerVisibleInternalNotes',
      "jsonb_build_object('customerVisibleInternalNotes', 'blocked')",
    ],
    ['fullTranscript', "jsonb_build_object('fullTranscript', 'blocked')"],
    ['webhookHeaders', "jsonb_build_object('webhookHeaders', 'blocked')"],
  ];

  for (const [label, metadataSql] of unsafeMetadataCases) {
    statementFails(
      `
        insert into public.search_index_jobs (
          workspace_id,
          source_type,
          source_id,
          visibility,
          operation,
          status,
          content_hash,
          metadata
        )
        values (
          '${ids.workspaceA}',
          'listing',
          '${ids.productDraftA}',
          'blocked',
          'hide',
          'queued',
          'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          ${metadataSql}
        )
      `,
      /search_index_jobs_metadata_safe_check/i,
      `search_index_jobs should reject unsafe metadata key ${label}`,
    );

    statementFails(
      `
        insert into public.search_index_documents (
          workspace_id,
          source_type,
          source_id,
          visibility,
          status,
          content_hash,
          metadata
        )
        values (
          '${ids.workspaceA}',
          'listing_image_alt_text',
          '${ids.imageDraftA}',
          'blocked',
          'skipped',
          'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          ${metadataSql}
        )
      `,
      /search_index_documents_metadata_safe_check/i,
      `search_index_documents should reject unsafe metadata key ${label}`,
    );
  }

  statementFails(
    `
      insert into public.search_index_jobs (
        workspace_id,
        source_type,
        source_id,
        visibility,
        operation,
        status,
        content_hash,
        metadata
      )
      values (
        '${ids.workspaceA}',
        'listing',
        '${ids.productDraftA}',
        'admin_only',
        'upsert',
        'queued',
        '${contentHash}',
        '{"source": "duplicate-active-job"}'::jsonb
      )
    `,
    /search_index_jobs_active_idempotency_key/i,
  );

  psql(`
    insert into public.search_index_jobs (
      id,
      workspace_id,
      source_type,
      source_id,
      visibility,
      operation,
      status,
      content_hash,
      metadata
    )
    values (
      '${duplicateFailedJobId}',
      '${ids.workspaceA}',
      'listing',
      '${ids.productDraftA}',
      'admin_only',
      'upsert',
      'failed',
      '${contentHash}',
      '{"source": "retry-after-failure"}'::jsonb
    );
  `);

  statementFails(
    `
      insert into public.search_index_documents (
        workspace_id,
        source_type,
        source_id,
        visibility,
        status,
        content_hash,
        metadata
      )
      values (
        '${ids.workspaceA}',
        'listing',
        '${ids.productDraftA}',
        'admin_only',
        'succeeded',
        'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        '{"source": "duplicate-document"}'::jsonb
      )
    `,
    /search_index_documents_source_visibility_key/i,
  );
});

check('search-index enqueue RPC is narrow, idempotent, and metadata safe', () => {
  const enqueueSourceId = 'f3000000-0000-4000-8000-000000000101';
  const retrySourceId = 'f3000000-0000-4000-8000-000000000102';
  const activeHash =
    '1111111111111111111111111111111111111111111111111111111111111111';
  const retryHash =
    '2222222222222222222222222222222222222222222222222222222222222222';

  statementFailsAs(
    'anon',
    null,
    `
      select public.enqueue_search_index_job(
        '${ids.workspaceA}'::uuid,
        'listing',
        '${enqueueSourceId}'::uuid,
        'public_chat',
        'upsert',
        'listing-v1',
        '${activeHash}',
        '{"source": "anon-attempt"}'::jsonb
      )
    `,
    /permission denied|search_index_not_authorized/i,
  );

  statementFailsAs(
    'authenticated',
    ids.authViewerA,
    `
      select public.enqueue_search_index_job(
        '${ids.workspaceA}'::uuid,
        'listing',
        '${enqueueSourceId}'::uuid,
        'public_chat',
        'upsert',
        'listing-v1',
        '${activeHash}',
        '{"source": "viewer-attempt"}'::jsonb
      )
    `,
    /search_index_not_authorized/i,
  );

  const firstOutput = queryAs(
    'authenticated',
    ids.authMemberA,
    `
      with first_result as (
        select public.enqueue_search_index_job(
          '${ids.workspaceA}'::uuid,
          'listing',
          '${enqueueSourceId}'::uuid,
          'public_chat',
          'upsert',
          'listing-v1',
          '${activeHash}',
          jsonb_build_object('source', 'rls-enqueue-test')
        ) as result
      ),
      second_result as (
        select public.enqueue_search_index_job(
          '${ids.workspaceA}'::uuid,
          'listing',
          '${enqueueSourceId}'::uuid,
          'public_chat',
          'upsert',
          'listing-v1',
          '${activeHash}',
          jsonb_build_object('source', 'rls-enqueue-test')
        ) as result
      )
      select
        first_result.result->>'status',
        second_result.result->>'reused',
        (
          first_result.result->>'searchIndexJobId'
          = second_result.result->>'searchIndexJobId'
        )::text
      from first_result, second_result;
    `,
  );

  assert.deepEqual(
    firstOutput.split('\n').filter(Boolean),
    ['queued\ttrue\ttrue'],
    'active duplicate enqueue should reuse the existing queued job id',
  );

  psql(`
    insert into public.search_index_jobs (
      workspace_id,
      source_type,
      source_id,
      source_version,
      visibility,
      operation,
      status,
      content_hash,
      metadata
    )
    values (
      '${ids.workspaceA}',
      'listing',
      '${retrySourceId}',
      'listing-v1',
      'public_chat',
      'upsert',
      'failed',
      '${retryHash}',
      '{"source": "failed-history"}'::jsonb
    );
  `);

  const retryOutput = queryAs(
    'authenticated',
    ids.authMemberA,
    `
      select
        public.enqueue_search_index_job(
        '${ids.workspaceA}'::uuid,
        'listing',
        '${retrySourceId}'::uuid,
        'public_chat',
        'upsert',
        'listing-v1',
        '${retryHash}',
        jsonb_build_object('source', 'retry-after-failure')
      )->>'status',
      public.enqueue_search_index_job(
        '${ids.workspaceA}'::uuid,
        'listing',
        '${retrySourceId}'::uuid,
        'public_chat',
        'upsert',
        'listing-v1',
        '${retryHash}',
        jsonb_build_object('source', 'retry-after-failure')
      )->>'reused';
    `,
  );

  assert.deepEqual(
    retryOutput.split('\n').filter(Boolean),
    ['queued\ttrue'],
    'failed historical jobs should allow a retry enqueue that can be reused while active',
  );

  for (const [label, sql] of [
    [
      'invalid source type',
      `'quote_request', '${enqueueSourceId}'::uuid, 'public_chat', 'upsert', 'listing-v1', '${activeHash}', '{}'::jsonb`,
    ],
    [
      'invalid visibility',
      `'listing', '${enqueueSourceId}'::uuid, 'customer_visible', 'upsert', 'listing-v1', '${activeHash}', '{}'::jsonb`,
    ],
    [
      'invalid operation',
      `'listing', '${enqueueSourceId}'::uuid, 'public_chat', 'vector_upsert', 'listing-v1', '${activeHash}', '{}'::jsonb`,
    ],
    [
      'invalid status',
      `'listing', '${enqueueSourceId}'::uuid, 'public_chat', 'upsert', 'listing-v1', '${activeHash}', '{}'::jsonb, 'processing'`,
    ],
  ]) {
    statementFailsAs(
      'authenticated',
      ids.authMemberA,
      `select public.enqueue_search_index_job('${ids.workspaceA}'::uuid, ${sql})`,
      /search_index_.*invalid/i,
      `enqueue RPC should reject ${label}`,
    );
  }

  const unsafeMetadataCases = [
    ['providerDebug', "jsonb_build_object('nested', jsonb_build_object('providerDebug', 'blocked'))"],
    ['provider_debug', "jsonb_build_object('provider_debug', 'blocked')"],
    ['traceDump', "jsonb_build_object('traceDump', 'blocked')"],
    ['trace_dump', "jsonb_build_object('trace_dump', 'blocked')"],
    ['fullTranscript', "jsonb_build_object('fullTranscript', 'blocked')"],
    ['transcriptContent', "jsonb_build_object('transcriptContent', 'blocked')"],
    ['rawProviderPayload', "jsonb_build_object('rawProviderPayload', 'blocked')"],
    ['webhookHeaders', "jsonb_build_object('webhookHeaders', 'blocked')"],
    ['apiKey', "jsonb_build_object('apiKey', 'blocked')"],
    ['serviceRole', "jsonb_build_object('serviceRole', 'blocked')"],
    ['internalNotes', "jsonb_build_object('internalNotes', 'blocked')"],
    ['customerVisibleInternalNotes', "jsonb_build_object('customerVisibleInternalNotes', 'blocked')"],
    ['customerContact', "jsonb_build_object('customerContact', 'blocked')"],
    ['contactEmail', "jsonb_build_object('contactEmail', 'blocked')"],
    ['contactPhone', "jsonb_build_object('contactPhone', 'blocked')"],
    ['email', "jsonb_build_object('email', 'blocked')"],
    ['phone', "jsonb_build_object('phone', 'blocked')"],
    ['payment', "jsonb_build_object('payment', 'blocked')"],
  ];

  for (const [label, metadataSql] of unsafeMetadataCases) {
    statementFailsAs(
      'authenticated',
      ids.authMemberA,
      `
        select public.enqueue_search_index_job(
          '${ids.workspaceA}'::uuid,
          'listing',
          '${enqueueSourceId}'::uuid,
          'blocked',
          'hide',
          'listing-v1',
          '3333333333333333333333333333333333333333333333333333333333333333',
          ${metadataSql}
        )
      `,
      /search_index_metadata_unsafe/i,
      `enqueue RPC should reject unsafe metadata key ${label}`,
    );
  }
});

check('admin listing and media writes enqueue local search-index jobs only', () => {
  const createdProductId = '50000000-0000-4000-8000-000000000301';
  const createdCategoryId = '40000000-0000-4000-8000-000000000301';
  const createdImageId = '60000000-0000-4000-8000-000000000301';

  const output = queryCommittedAs(
    'authenticated',
    ids.authMemberA,
    `
      select public.execute_admin_product_write(
        'category.create',
        '${createdCategoryId}'::uuid,
        '${ids.workspaceA}'::uuid,
        jsonb_build_object(
          'slug', 'indexed-lounge',
          'name', 'Indexed Lounge',
          'description', 'Public lounge category',
          'is_published', true,
          'sort_order', 40
        )
      )::text;

      select public.execute_admin_product_write(
        'product.create',
        '${createdProductId}'::uuid,
        '${ids.workspaceA}'::uuid,
        jsonb_build_object(
          'category_id', '${createdCategoryId}',
          'slug', 'indexed-sofa',
          'name', 'Indexed Sofa',
          'short_description', 'Public searchable sofa',
          'description', 'Safe listing details',
          'rental_unit', 'day',
          'status', 'published',
          'sort_order', 50
        )
      )::text;

      select public.execute_admin_product_write(
        'productImage.create',
        '${createdImageId}'::uuid,
        '${ids.workspaceA}'::uuid,
        jsonb_build_object(
          'product_id', '${createdProductId}',
          'storage_bucket', 'listing-media',
          'storage_path', '${ids.workspaceA}/${createdProductId}/indexed-sofa.webp',
          'alt_text', 'Indexed sofa image',
          'sort_order', 1,
          'is_primary', true
        )
      )::text;

      select public.execute_admin_product_write(
        'product.archive',
        '${createdProductId}'::uuid,
        '${ids.workspaceA}'::uuid,
        '{}'::jsonb
      )::text;
    `,
  );

  assert.deepEqual(
    output.split('\n').filter(Boolean),
    [
      createdCategoryId,
      createdProductId,
      createdImageId,
      createdProductId,
    ],
    'admin category/listing/image writes should return the mutated row ids',
  );

  const jobOutput = psql(`
    select source_type || ':' || visibility || ':' || operation
    from public.search_index_jobs
    where workspace_id = '${ids.workspaceA}'
      and source_id = '${createdCategoryId}'
    order by created_at asc;

    select source_type || ':' || visibility || ':' || operation
    from public.search_index_jobs
    where workspace_id = '${ids.workspaceA}'
      and source_id = '${createdProductId}'
    order by case when operation = 'upsert' then 0 else 1 end, created_at asc;

    select source_type || ':' || visibility || ':' || operation
    from public.search_index_jobs
    where workspace_id = '${ids.workspaceA}'
      and source_id = '${createdImageId}'
    order by created_at asc;
  `);

  assert.deepEqual(
    jobOutput.split('\n').filter(Boolean),
    [
      'category:public_chat:upsert',
      'listing:public_chat:upsert',
      'listing:blocked:hide',
      'listing_image_alt_text:public_chat:upsert',
    ],
    'admin category/listing/image writes should enqueue local search-index jobs with safe mappings',
  );
});

check('transcript audit/evidence insert RPCs insert safe local rows for privileged executor only', () => {
  const rpcAuditEventId = 'd0000000-0000-4000-8000-000000000201';
  const rpcEvidenceRecordId = 'e0000000-0000-4000-8000-000000000201';

  const auditOutput = psql(`
    select public.insert_transcript_audit_event(
      '${ids.workspaceA}'::uuid,
      jsonb_build_object(
        'id', '${rpcAuditEventId}',
        'workspace_id', '${ids.workspaceA}',
        'conversation_id', '${ids.conversationA}',
        'quote_request_id', '${ids.quoteA}',
        'actor_admin_user_id', '${ids.adminA}',
        'event_type', 'evidence_capture',
        'actor_type', 'operator',
        'request_id', 'rls-insert-boundary-audit',
        'approval_reference', 'local-approval-2e-i',
        'reason_code', 'local_sql_rls_proof',
        'result_status', 'succeeded',
        'affected_record_count', 1,
        'metadata', jsonb_build_object('source', 'phase-2e-i-rls')
      )
    )::text;
  `);

  assert.match(auditOutput, new RegExp(rpcAuditEventId));

  const evidenceOutput = psql(`
    select public.insert_transcript_evidence_record(
      '${ids.workspaceA}'::uuid,
      jsonb_build_object(
        'id', '${rpcEvidenceRecordId}',
        'workspace_id', '${ids.workspaceA}',
        'audit_event_id', '${rpcAuditEventId}',
        'evidence_type', 'local_sql_rls_proof',
        'environment_label', 'local',
        'commit_sha', '8607e16d3c405df0797ec08536cce79f1b4f68d2',
        'validation_summary', 'Local SQL and RLS proof placeholder.',
        'dry_run_summary', 'Dry-run placeholder.',
        'rollback_summary', 'Rollback placeholder.',
        'operator_notes', 'Operator note placeholder.',
        'metadata', jsonb_build_object('source', 'phase-2e-i-rls')
      )
    )::text;
  `);

  assert.match(evidenceOutput, new RegExp(rpcEvidenceRecordId));
  assert.equal(
    psql(`
      select count(*)::text
      from public.transcript_evidence_records
      where id = '${rpcEvidenceRecordId}'
        and audit_event_id = '${rpcAuditEventId}'
        and workspace_id = '${ids.workspaceA}'
    `),
    '1',
    'privileged local insert RPC should create a same-workspace evidence placeholder row',
  );

  statementFails(
    `
      select public.insert_transcript_audit_event(
        '${ids.workspaceA}'::uuid,
        jsonb_build_object(
          'workspace_id', '${ids.workspaceA}',
          'conversation_id', '${ids.conversationB}',
          'event_type', 'evidence_capture',
          'actor_type', 'operator',
          'result_status', 'succeeded',
          'metadata', jsonb_build_object('source', 'phase-2e-i-rls')
        )
      )
    `,
    /transcript_audit_conversation_workspace_mismatch/i,
  );

  statementFails(
    `
      select public.insert_transcript_evidence_record(
        '${ids.workspaceA}'::uuid,
        jsonb_build_object(
          'workspace_id', '${ids.workspaceA}',
          'audit_event_id', '${ids.transcriptAuditEventB}',
          'evidence_type', 'local_sql_rls_proof',
          'metadata', jsonb_build_object('source', 'phase-2e-i-rls')
        )
      )
    `,
    /transcript_evidence_audit_event_workspace_mismatch/i,
  );

  for (const [label, metadataSql] of [
    ['fullTranscript', "jsonb_build_object('fullTranscript', 'blocked')"],
    ['transcriptContent', "jsonb_build_object('transcriptContent', 'blocked')"],
    ['providerPayload', "jsonb_build_object('providerPayload', 'blocked')"],
    [
      'nested providerDebug',
      "jsonb_build_object('nested', jsonb_build_object('providerDebug', 'blocked'))",
    ],
    [
      'nested provider_debug',
      "jsonb_build_object('nested', jsonb_build_object('provider_debug', 'blocked'))",
    ],
    [
      'nested traceDump',
      "jsonb_build_object('nested', jsonb_build_object('traceDump', 'blocked'))",
    ],
    [
      'nested trace_dump',
      "jsonb_build_object('nested', jsonb_build_object('trace_dump', 'blocked'))",
    ],
    ['webhookHeaders', "jsonb_build_object('webhookHeaders', 'blocked')"],
    ['cookie', "jsonb_build_object('cookie', 'blocked')"],
    ['token', "jsonb_build_object('token', 'blocked')"],
    ['credential', "jsonb_build_object('credential', 'blocked')"],
    ['serviceRole', "jsonb_build_object('serviceRole', 'blocked')"],
    [
      'customerVisibleInternalNotes',
      "jsonb_build_object('customerVisibleInternalNotes', 'blocked')",
    ],
  ]) {
    statementFails(
      `
        select public.insert_transcript_audit_event(
          '${ids.workspaceA}'::uuid,
          jsonb_build_object(
            'workspace_id', '${ids.workspaceA}',
            'event_type', 'evidence_capture',
            'actor_type', 'operator',
            'result_status', 'succeeded',
            'metadata', ${metadataSql}
          )
        )
      `,
      /transcript_audit_metadata_unsafe/i,
      `insert_transcript_audit_event should reject unsafe metadata key ${label}`,
    );

    statementFails(
      `
        select public.insert_transcript_evidence_record(
          '${ids.workspaceA}'::uuid,
          jsonb_build_object(
            'workspace_id', '${ids.workspaceA}',
            'evidence_type', 'local_sql_rls_proof',
            'metadata', ${metadataSql}
          )
        )
      `,
      /transcript_evidence_metadata_unsafe/i,
      `insert_transcript_evidence_record should reject unsafe metadata key ${label}`,
    );
  }

  statementFails(
    `
      select public.insert_transcript_evidence_record(
        '${ids.workspaceA}'::uuid,
        jsonb_build_object(
          'workspace_id', '${ids.workspaceA}',
          'evidence_type', 'local_sql_rls_proof',
          'validation_summary', 'provider payload and service-role token',
          'metadata', jsonb_build_object('source', 'phase-2e-i-rls')
        )
      )
    `,
    /transcript_evidence_text_unsafe/i,
  );
});

check('browser roles cannot execute transcript audit/evidence insert RPCs', () => {
  for (const role of ['anon', 'authenticated']) {
    for (const signature of [
      'public.insert_transcript_audit_event(uuid,jsonb)',
      'public.insert_transcript_evidence_record(uuid,jsonb)',
    ]) {
      assert.equal(
        psql(`select has_function_privilege('${role}', '${signature}', 'EXECUTE')::text`),
        'false',
        `${role} should not have execute on ${signature}`,
      );
    }
  }

  for (const [role, authUserId] of [
    ['anon', null],
    ['authenticated', ids.authMemberA],
    ['authenticated', ids.authNoMembership],
  ]) {
    statementFailsAs(
      role,
      authUserId,
      `
        select public.insert_transcript_audit_event(
          '${ids.workspaceA}'::uuid,
          jsonb_build_object(
            'workspace_id', '${ids.workspaceA}',
            'event_type', 'evidence_capture',
            'actor_type', 'operator',
            'result_status', 'succeeded',
            'metadata', jsonb_build_object('source', 'client-rpc-attempt')
          )
        )
      `,
      /permission denied/i,
    );

    statementFailsAs(
      role,
      authUserId,
      `
        select public.insert_transcript_evidence_record(
          '${ids.workspaceA}'::uuid,
          jsonb_build_object(
            'workspace_id', '${ids.workspaceA}',
            'evidence_type', 'local_sql_rls_proof',
            'metadata', jsonb_build_object('source', 'client-rpc-attempt')
          )
        )
      `,
      /permission denied/i,
    );
  }
});

check('public quote workspace configuration stays independent from catalogue configuration', () => {
  const quoteId = '70000000-0000-4000-8000-000000000121';
  const claimToken = '71000000-0000-4000-8000-000000000121';

  psql(`
    update public.quote_public_workspace_config
    set active_workspace_id = '${ids.workspaceB}', is_enabled = true;
  `);

  const cataloguePayload = scalarAs(
    'anon',
    null,
    `select public.get_public_catalogue('${ids.workspaceA}', null)::text`,
  );
  assert.match(
    cataloguePayload,
    /published-product-a/,
    'catalogue reads must keep using independently configured workspace A.',
  );
  assert.doesNotMatch(cataloguePayload, /published-product-b/);

  const created = queryCommittedAs(
    'anon',
    null,
    `
      select quote_request_id::text || '|' || handoff_claim_status
      from public.submit_public_quote_request(
        '${quoteId}', '${ids.workspaceB}', 'quote-workspace-b',
        'Workspace B Customer', 'workspace-b@example.test', null,
        null, null, null, '/quote', null, 'rls-quote-workspace-b',
        '[]'::jsonb, '${claimToken}'
      )
    `,
  );
  assert.equal(created, `${quoteId}|claimed`);
  assert.equal(
    queryCommittedAs(
      'anon',
      null,
      `select public.finalize_public_quote_handoff(
        '${quoteId}', '${ids.workspaceB}', 'rls-quote-workspace-b',
        '${claimToken}', 'completed', null
      )::text`,
    ),
    'true',
    'handoff finalization must use the same quote-specific workspace authority.',
  );

  statementFailsAs(
    'anon',
    null,
    `select * from public.submit_public_quote_request(
      '70000000-0000-4000-8000-000000000122', '${ids.workspaceA}',
      'catalogue-workspace-not-quote-workspace', 'Wrong Workspace Customer',
      'wrong-workspace@example.test', null, null, null, null, '/quote', null,
      'rls-catalogue-workspace-denied', '[]'::jsonb,
      '71000000-0000-4000-8000-000000000122'
    )`,
    /workspace is not available/i,
  );

  statementFailsAs(
    'anon',
    null,
    `select public.finalize_public_quote_handoff(
      '${quoteId}', '${ids.workspaceA}', 'rls-quote-workspace-b',
      '${claimToken}', 'completed', null
    )`,
    /workspace is not available/i,
  );

  psql(`
    update public.workspaces set status = 'paused' where id = '${ids.workspaceB}';
  `);
  statementFailsAs(
    'anon',
    null,
    `select * from public.submit_public_quote_request(
      '70000000-0000-4000-8000-000000000123', '${ids.workspaceB}',
      'inactive-quote-workspace', 'Inactive Workspace Customer',
      'inactive-workspace@example.test', null, null, null, null, '/quote', null,
      'rls-inactive-quote-workspace', '[]'::jsonb,
      '71000000-0000-4000-8000-000000000123'
    )`,
    /workspace is not available/i,
  );

  psql(`
    update public.workspaces set status = 'active' where id = '${ids.workspaceB}';
    update public.quote_public_workspace_config
    set active_workspace_id = '${ids.workspaceA}', is_enabled = true;
  `);

  statementFailsAs(
    'anon',
    null,
    `update public.quote_public_workspace_config
     set active_workspace_id = '${ids.workspaceB}'`,
    /permission denied/i,
  );
  assert.equal(
    scalarAs('anon', null, 'select count(*)::text from public.quote_public_workspace_config'),
    '0',
    'anonymous callers must not inspect or select an arbitrary quote workspace.',
  );
});

check('anonymous quote writes use one atomic replay-safe RPC without direct table access', () => {
  const quoteId = '70000000-0000-4000-8000-000000000101';
  const output = queryCommittedAs(
    'anon',
    null,
    `
      select
        quote_request_id::text || '|' || public_reference || '|' || was_created::text || '|' || handoff_claim_status || '|' || coalesce(handoff_claim_token::text, 'none')
      from public.submit_public_quote_request(
        '${quoteId}',
        '${ids.workspaceA}',
        'quote-public-create',
        'Fake Public Customer',
        'public-customer@example.test',
        '+65 8123 4567',
        'Please recommend a warm lounge setup for a reception.',
        '2026-06-12',
        'Fake Venue',
        '/quote',
        null,
        'rls-public-submission-101',
        '[{"product_name_snapshot":"Fake requested lounge set","quantity":2,"notes":"Fake public quote item note"}]'::jsonb,
        '71000000-0000-4000-8000-000000000101'
      );

      select
        quote_request_id::text || '|' || public_reference || '|' || was_created::text || '|' || handoff_claim_status || '|' || coalesce(handoff_claim_token::text, 'none')
      from public.submit_public_quote_request(
        '70000000-0000-4000-8000-000000000199',
        '${ids.workspaceA}',
        'quote-public-retry-proposed-reference',
        'Fake Public Customer',
        'public-customer@example.test',
        '+65 8123 4567',
        'Please recommend a warm lounge setup for a reception.',
        '2026-06-12',
        'Fake Venue',
        '/quote',
        null,
        'rls-public-submission-101',
        '[{"product_name_snapshot":"Fake requested lounge set","quantity":2,"notes":"Fake public quote item note"}]'::jsonb,
        '71000000-0000-4000-8000-000000000102'
      );
    `,
  );

  assert.deepEqual(
    output.split('\n').filter(Boolean),
    [
      `${quoteId}|quote-public-create|true|claimed|71000000-0000-4000-8000-000000000101`,
      `${quoteId}|quote-public-create|false|in_progress|none`,
    ],
    'matching retries should return the original persisted identifiers without a second insert.',
  );

  psql(`
    update public.quote_handoff_outbox
    set claim_expires_at = now() - interval '1 second'
    where quote_request_id = '${quoteId}';
  `);

  const recoveredClaim = queryCommittedAs(
    'anon',
    null,
    `
      select handoff_claim_status || '|' || handoff_claim_token::text
      from public.submit_public_quote_request(
        '70000000-0000-4000-8000-000000000188',
        '${ids.workspaceA}', 'unused-recovery-reference',
        'Fake Public Customer', 'public-customer@example.test', '+65 8123 4567',
        'Please recommend a warm lounge setup for a reception.', '2026-06-12',
        'Fake Venue', '/quote', null, 'rls-public-submission-101',
        '[{"product_name_snapshot":"Fake requested lounge set","quantity":2,"notes":"Fake public quote item note"}]'::jsonb,
        '71000000-0000-4000-8000-000000000109'
      )
    `,
  );
  assert.equal(
    recoveredClaim,
    'claimed|71000000-0000-4000-8000-000000000109',
    'an expired claim should be recoverable with a new token.',
  );

  statementFailsAs(
    'anon',
    null,
    `select public.finalize_public_quote_handoff(
      '${quoteId}', '${ids.workspaceA}', 'rls-public-submission-101',
      '71000000-0000-4000-8000-000000000101', 'completed', null
    )`,
    /claim is unavailable/i,
  );

  assert.equal(
    queryCommittedAs(
      'anon',
      null,
      `select public.finalize_public_quote_handoff(
        '${quoteId}', '${ids.workspaceA}', 'rls-public-submission-101',
        '71000000-0000-4000-8000-000000000109',
        'retryable_failed', 'n8n_unavailable'
      )::text`,
    ),
    'true',
  );

  const changedSubmissionId = '70000000-0000-4000-8000-000000000185';
  const changedSubmissionClaim = '71000000-0000-4000-8000-000000000108';
  assert.equal(
    queryCommittedAs(
      'anon',
      null,
      `
        select quote_request_id::text || '|' || handoff_claim_status
        from public.submit_public_quote_request(
          '${changedSubmissionId}', '${ids.workspaceA}',
          'quote-edited-distinct-submission', 'Edited Public Customer',
          'public-customer@example.test', '+65 8123 4567',
          'A materially edited enquiry.', '2026-06-12', 'Fake Venue',
          '/quote', null, 'rls-public-submission-101-edited',
          '[{"product_name_snapshot":"Different requested set","quantity":3,"notes":"Edited note"}]'::jsonb,
          '${changedSubmissionClaim}'
        )
      `,
    ),
    `${changedSubmissionId}|claimed`,
    'an edited payload with a new submission identifier must create a distinct enquiry.',
  );
  assert.equal(
    psql(`
      select state || '|' || attempt_count::text
      from public.quote_handoff_outbox
      where quote_request_id = '${quoteId}'
        and submission_request_id = 'rls-public-submission-101'
    `),
    'retryable_failed|2',
    'a distinct edited submission must not mutate or remove the original pending handoff.',
  );
  assert.equal(
    queryCommittedAs(
      'anon',
      null,
      `select public.finalize_public_quote_handoff(
        '${changedSubmissionId}', '${ids.workspaceA}',
        'rls-public-submission-101-edited', '${changedSubmissionClaim}',
        'completed', null
      )::text`,
    ),
    'true',
  );

  const retryAfterFailure = queryCommittedAs(
    'anon',
    null,
    `
      select handoff_claim_status || '|' || handoff_claim_token::text
      from public.submit_public_quote_request(
        '70000000-0000-4000-8000-000000000187',
        '${ids.workspaceA}', 'unused-retry-reference',
        'Fake Public Customer', 'public-customer@example.test', '+65 8123 4567',
        'Please recommend a warm lounge setup for a reception.', '2026-06-12',
        'Fake Venue', '/quote', null, 'rls-public-submission-101',
        '[{"product_name_snapshot":"Fake requested lounge set","quantity":2,"notes":"Fake public quote item note"}]'::jsonb,
        '71000000-0000-4000-8000-000000000110'
      )
    `,
  );
  assert.equal(
    retryAfterFailure,
    'claimed|71000000-0000-4000-8000-000000000110',
    'an outbound failure should release the durable state for retry.',
  );

  assert.equal(
    queryCommittedAs(
      'anon',
      null,
      `select public.finalize_public_quote_handoff(
        '${quoteId}', '${ids.workspaceA}', 'rls-public-submission-101',
        '71000000-0000-4000-8000-000000000110', 'completed', null
      )::text`,
    ),
    'true',
  );

  const completedReplay = queryCommittedAs(
    'anon',
    null,
    `
      select handoff_claim_status || '|' || coalesce(handoff_claim_token::text, 'none')
      from public.submit_public_quote_request(
        '70000000-0000-4000-8000-000000000186',
        '${ids.workspaceA}', 'unused-completed-reference',
        'Fake Public Customer', 'public-customer@example.test', '+65 8123 4567',
        'Please recommend a warm lounge setup for a reception.', '2026-06-12',
        'Fake Venue', '/quote', null, 'rls-public-submission-101',
        '[{"product_name_snapshot":"Fake requested lounge set","quantity":2,"notes":"Fake public quote item note"}]'::jsonb,
        '71000000-0000-4000-8000-000000000111'
      )
    `,
  );
  assert.equal(completedReplay, 'completed|none');

  const adminOutput = queryAs(
    'authenticated',
    ids.authMemberA,
    `
      select
        qr.customer_message || '|' || count(item.id)::text
      from public.quote_requests qr
      left join public.quote_request_items item
        on item.workspace_id = qr.workspace_id
        and item.quote_request_id = qr.id
      where qr.id = '${quoteId}'
      group by qr.customer_message;
    `,
  );

  assert.equal(
    adminOutput,
    'Please recommend a warm lounge setup for a reception.|1',
    'a replay should leave exactly one complete parent and one item.',
  );

  statementFailsAs(
    'anon',
    null,
    `
      insert into public.quote_requests (
        id, workspace_id, public_reference, customer_name,
        customer_email, status, source
      ) values (
        '70000000-0000-4000-8000-000000000198',
        '${ids.workspaceA}',
        'quote-direct-insert-denied',
        'Fake Public Customer',
        'public-customer@example.test',
        'new',
        'website'
      )
    `,
    /permission denied/i,
  );

  statementFailsAs(
    'anon',
    null,
    `
      insert into public.quote_request_items (
        workspace_id, quote_request_id, product_name_snapshot, quantity
      ) values (
        '${ids.workspaceA}',
        '${quoteId}',
        'quote-direct-item-insert-denied',
        1
      )
    `,
    /permission denied/i,
  );
  statementFailsAs(
    'anon',
    null,
    `
      select * from public.submit_public_quote_request(
        '70000000-0000-4000-8000-000000000193',
        '${ids.workspaceA}',
        'quote-blank-contact-denied',
        'Fake Public Customer',
        '   ',
        '   ',
        null, null, null, '/quote', null,
        'rls-contact-values-required',
        '[]'::jsonb,
        '71000000-0000-4000-8000-000000000103'
      )
    `,
    /invalid public quote submission/i,
  );
  statementFailsAs(
    'anon',
    null,
    `
      select * from public.submit_public_quote_request(
        '70000000-0000-4000-8000-000000000197',
        '${ids.workspaceA}',
        'quote-public-mismatch',
        'Different Customer',
        'public-customer@example.test',
        '+65 8123 4567',
        'Please recommend a warm lounge setup for a reception.',
        '2026-06-12',
        'Fake Venue',
        '/quote',
        null,
        'rls-public-submission-101',
        '[{"product_name_snapshot":"Fake requested lounge set","quantity":2,"notes":"Fake public quote item note"}]'::jsonb,
        '71000000-0000-4000-8000-000000000104'
      )
    `,
    /payload mismatch/i,
  );

  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
      select * from public.submit_public_quote_request(
        '70000000-0000-4000-8000-000000000196',
        '${ids.workspaceA}',
        'quote-authenticated-rpc-denied',
        'Fake Public Customer',
        'public-customer@example.test',
        null, null, null, null, null, null,
        'rls-authenticated-denied',
        '[]'::jsonb,
        '71000000-0000-4000-8000-000000000105'
      )
    `,
    /permission denied/i,
  );

  statementFailsAs(
    'anon',
    null,
    `
      select * from public.submit_public_quote_request(
        '70000000-0000-4000-8000-000000000195',
        '${ids.workspaceB}',
        'quote-cross-workspace-denied',
        'Fake Public Customer',
        'public-customer@example.test',
        null, null, null, null, null, null,
        'rls-cross-workspace-denied',
        '[]'::jsonb,
        '71000000-0000-4000-8000-000000000106'
      )
    `,
    /workspace is not available/i,
  );
});

check('atomic quote RPC rolls back its parent when item persistence raises', () => {
  const quoteId = '70000000-0000-4000-8000-000000000194';

  psql(`
    create or replace function public.test_reject_quote_item()
    returns trigger
    language plpgsql
    set search_path = ''
    as $$
    begin
      raise exception 'test item persistence failure';
    end;
    $$;

    create trigger test_reject_quote_item
      before insert on public.quote_request_items
      for each row execute function public.test_reject_quote_item();
  `);

  try {
    statementFailsAs(
      'anon',
      null,
      `
        select * from public.submit_public_quote_request(
          '${quoteId}', '${ids.workspaceA}', 'quote-atomic-rollback',
          'Fake Public Customer', 'public-customer@example.test', null,
          null, null, null, '/quote', null, 'rls-atomic-rollback',
          '[{"product_name_snapshot":"Rollback item","quantity":1,"notes":null}]'::jsonb,
          '71000000-0000-4000-8000-000000000107'
        )
      `,
      /test item persistence failure/i,
    );
  } finally {
    psql(`
      drop trigger test_reject_quote_item on public.quote_request_items;
      drop function public.test_reject_quote_item();
    `);
  }

  assert.equal(
    queryAs(
      'authenticated',
      ids.authMemberA,
      `select count(*)::text from public.quote_requests where id = '${quoteId}'`,
    ),
    '0',
    'the parent must roll back when an item insert fails.',
  );
  assert.equal(
    psql(
      `select count(*)::text from public.quote_handoff_outbox where quote_request_id = '${quoteId}'`,
    ),
    '0',
    'the durable handoff row must not survive a rolled-back quote submission.',
  );
});

check('anonymous quote ACLs deny every historical direct write surface', () => {
  for (const table of ['quote_requests', 'quote_request_items']) {
    for (const privilege of ['INSERT', 'UPDATE', 'DELETE']) {
      assert.equal(
        psql(
          `select has_table_privilege('anon', 'public.${table}', '${privilege}')::text`,
        ),
        'false',
        `anon must not retain table-level ${privilege} on ${table}.`,
      );
    }

    assert.equal(
      psql(`
        select (not exists (
          select 1
          from pg_catalog.pg_class relation
          cross join lateral pg_catalog.aclexplode(
            coalesce(relation.relacl, pg_catalog.acldefault('r', relation.relowner))
          ) acl
          where relation.oid = 'public.${table}'::regclass
            and acl.grantee = 0
            and acl.privilege_type in ('INSERT', 'UPDATE', 'DELETE')
        ))::text
      `),
      'true',
      `PUBLIC must not have a direct write ACL on ${table}.`,
    );
  }

  const historicalColumns = {
    quote_requests: [
      'id', 'workspace_id', 'public_reference', 'customer_name',
      'customer_email', 'customer_phone', 'customer_message', 'event_date',
      'venue', 'status', 'source', 'source_page_path', 'source_listing_slug',
      'source_listing_id', 'submission_request_id', 'crm_provider',
      'crm_sync_status', 'crm_contact_id', 'crm_deal_id',
      'crm_last_sync_attempt_at', 'crm_sync_error',
    ],
    quote_request_items: [
      'workspace_id', 'quote_request_id', 'product_name_snapshot', 'quantity',
      'notes',
    ],
  };

  for (const [table, columns] of Object.entries(historicalColumns)) {
    for (const column of columns) {
      assert.equal(
        psql(
          `select has_column_privilege('anon', 'public.${table}', '${column}', 'INSERT')::text`,
        ),
        'false',
        `anon must not retain column-level INSERT on ${table}.${column}.`,
      );
    }
  }

  for (const signature of [
    'public.submit_public_quote_request(uuid,uuid,text,text,text,text,text,date,text,text,text,text,jsonb,uuid)',
    'public.finalize_public_quote_handoff(uuid,uuid,text,uuid,text,text)',
  ]) {
    assert.equal(
      psql(`select has_function_privilege('anon', '${signature}', 'EXECUTE')::text`),
      'true',
    );
    assert.equal(
      psql(`select has_function_privilege('authenticated', '${signature}', 'EXECUTE')::text`),
      'false',
    );
    assert.equal(
      psql(`
        select (not exists (
          select 1
          from pg_catalog.pg_proc proc
          cross join lateral pg_catalog.aclexplode(
            coalesce(proc.proacl, pg_catalog.acldefault('f', proc.proowner))
          ) acl
          where proc.oid = '${signature}'::regprocedure
            and acl.grantee = 0
            and acl.privilege_type = 'EXECUTE'
        ))::text
      `),
      'true',
      `${signature} must not be executable through PUBLIC.`,
    );
  }

  for (const role of ['anon', 'authenticated']) {
    for (const privilege of ['INSERT', 'UPDATE', 'DELETE']) {
      assert.equal(
        psql(
          `select has_table_privilege('${role}', 'public.quote_handoff_outbox', '${privilege}')::text`,
        ),
        'false',
        `${role} must have no direct outbox ${privilege} access.`,
      );
    }
  }

  statementFailsAs(
    'anon',
    null,
    `insert into public.quote_requests (customer_message) values ('denied')`,
    /permission denied/i,
  );
  statementFailsAs(
    'anon',
    null,
    `insert into public.quote_requests (
      source_page_path, source_listing_slug, source_listing_id,
      submission_request_id, crm_provider, crm_sync_status, crm_contact_id,
      crm_deal_id, crm_last_sync_attempt_at, crm_sync_error
    ) values ('/quote', null, null, 'denied', 'hubspot', 'not_queued', null, null, null, null)`,
    /permission denied/i,
  );
  for (const [role, authUserId] of [
    ['anon', null],
    ['authenticated', ids.authMemberA],
  ]) {
    assert.equal(
      queryAs(
        role,
        authUserId,
        `select count(*)::text from public.quote_handoff_outbox`,
      ),
      '0',
      `${role} must not inspect any private handoff state through RLS.`,
    );
  }
  statementFailsAs(
    'anon',
    null,
    `select public.finalize_public_quote_handoff(
      '${ids.quoteB}', '${ids.workspaceB}', 'other-workspace-submission',
      '71000000-0000-4000-8000-000000000199', 'completed', null
    )`,
    /workspace is not available/i,
  );
  statementFailsAs(
    'anon',
    null,
    `select public.finalize_public_quote_handoff(
      '70000000-0000-4000-8000-000000000101', '${ids.workspaceA}',
      'rls-public-submission-101',
      '71000000-0000-4000-8000-000000000198', 'completed', null
    )`,
    /claim is unavailable/i,
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

check('anonymous public quote email delivery log rejects unsafe scope and states', () => {
  statementFailsAs(
    'anon',
    null,
    `
      insert into public.quote_email_delivery_log (
        workspace_id,
        quote_request_id,
        public_reference,
        recipient_email_redacted,
        provider,
        delivery_status,
        provider_message_id,
        request_id
      )
      values (
        '${ids.workspaceB}',
        '${ids.quoteA}',
        'quote-a',
        'qu***@example.test',
        'resend',
        'sent',
        'resend-message-cross-workspace',
        'rls-delivery-cross-workspace'
      )
    `,
  );

  statementFailsAs(
    'anon',
    null,
    `
      insert into public.quote_email_delivery_log (
        workspace_id,
        quote_request_id,
        public_reference,
        recipient_email_redacted,
        provider,
        delivery_status,
        provider_message_id,
        request_id
      )
      values (
        '${ids.workspaceA}',
        '${ids.quoteA}',
        'quote-a',
        'qu***@example.test',
        'smtp',
        'sent',
        'smtp-message-unsafe',
        'rls-delivery-unsafe-provider'
      )
    `,
  );
});

check('anonymous public quote creation rejects oversized customer messages', () => {
  statementFailsAs(
    'anon',
    null,
    `
      select * from public.submit_public_quote_request(
        '70000000-0000-4000-8000-000000000103',
        '${ids.workspaceA}',
        'quote-public-rejected-message',
        'Fake Public Customer',
        'public-customer@example.test',
        null,
        '${'x'.repeat(1201)}',
        null,
        null,
        '/quote',
        null,
        'rls-public-oversized-message',
        '[]'::jsonb,
        '71000000-0000-4000-8000-000000000108'
      )
    `,
    /invalid public quote submission/i,
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
        null
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
        and activity_type = 'internal_note';

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
        and activity_type = 'internal_note';
    `,
  );

  assert.deepEqual(
    output.split('\n').filter(Boolean),
    [ids.quoteA, 'reviewing', '1', '1', ids.quoteA, '1', '1'],
    'owner should update quote workflow status atomically without adding internal-note activity rows',
  );
});

check('atomic quote workflow RPC denies notes, archived status, cross-workspace, viewer, no-membership, and anonymous callers', () => {
  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
      select public.execute_admin_quote_workflow(
        '${ids.quoteA}',
        '${ids.workspaceA}',
        'reviewing',
        'Internal notes are not supported by this status-update foundation.'
      )
    `,
    /quote_workflow_internal_note_not_supported/i,
  );

  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
      select public.execute_admin_quote_workflow(
        '${ids.quoteA}',
        '${ids.workspaceA}',
        'archived',
        null
      )
    `,
    /quote_workflow_status_invalid/i,
  );

  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
      select public.execute_admin_quote_workflow(
        '${ids.quoteB}',
        '${ids.workspaceB}',
        'reviewing',
        null
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
        null
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
        null
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
        null
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

check('authenticated product admins cannot bypass product write RPC with direct catalogue or audit writes', () => {
  const categoryId = '40000000-0000-4000-8000-000000000101';
  const productId = '50000000-0000-4000-8000-000000000101';
  const imageId = '60000000-0000-4000-8000-000000000101';

  statementFailsAs(
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
    `,
  );

  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
      update public.categories
      set is_published = true
      where id = '${ids.categoryDraftA}'
        and workspace_id = '${ids.workspaceA}'
    `,
  );

  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
      delete from public.categories
      where id = '${ids.categoryDraftA}'
        and workspace_id = '${ids.workspaceA}'
    `,
  );

  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
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
    `,
  );

  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
      update public.products
      set status = 'published'
      where id = '${ids.productDraftA}'
        and workspace_id = '${ids.workspaceA}'
    `,
  );

  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
      delete from public.products
      where id = '${ids.productDraftA}'
        and workspace_id = '${ids.workspaceA}'
    `,
  );

  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
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
    `,
  );

  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
      update public.product_images
      set status = 'archived',
        is_primary = false
      where id = '${ids.imagePublishedA}'
        and workspace_id = '${ids.workspaceA}'
    `,
  );

  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
      delete from public.product_images
      where id = '${ids.imagePublishedA}'
        and workspace_id = '${ids.workspaceA}'
    `,
  );

  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
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

check('execute_admin_product_write rejects cross-workspace relationship payloads', () => {
  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
      select public.execute_admin_product_write(
        'product.create',
        '50000000-0000-4000-8000-000000000401'::uuid,
        '${ids.workspaceA}'::uuid,
        jsonb_build_object(
          'category_id', '${ids.categoryPublishedB}',
          'slug', 'rpc-cross-category-create',
          'name', 'RPC Cross Category Create',
          'short_description', 'Rejected',
          'description', 'Rejected',
          'rental_unit', 'day',
          'status', 'draft',
          'sort_order', 60
        )
      )
    `,
    /product_category_workspace_mismatch/i,
  );

  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
      select public.execute_admin_product_write(
        'product.update',
        '${ids.productDraftA}'::uuid,
        '${ids.workspaceA}'::uuid,
        jsonb_build_object(
          'category_id', '${ids.categoryPublishedB}'
        )
      )
    `,
    /product_category_workspace_mismatch/i,
  );

  statementFailsAs(
    'authenticated',
    ids.authMemberA,
    `
      select public.execute_admin_product_write(
        'productImage.create',
        '60000000-0000-4000-8000-000000000401'::uuid,
        '${ids.workspaceA}'::uuid,
        jsonb_build_object(
          'product_id', '${ids.productPublishedB}',
          'storage_bucket', 'listing-media',
          'storage_path', '${ids.workspaceA}/${ids.productPublishedB}/rpc-cross-product-image.webp',
          'alt_text', 'Rejected cross-workspace product image',
          'sort_order', 10,
          'is_primary', false
        )
      )
    `,
    /product_image_workspace_mismatch/i,
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

check('hero media storage uses public bucket URLs with workspace-admin scoped writes', () => {
  const storagePath = `${ids.workspaceA}/homepage-hero/1700000000000-60000000-0000-4000-8000-000000000301.webp`;

  assert.equal(
    scalarAs(
      'anon',
      null,
      'select "public"::text from storage.buckets where id = \'hero-media\'',
    ),
    'true',
    'hero-media bucket should be public for rendered homepage hero images',
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
        'hero-media',
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
        'hero-media',
        '${ids.workspaceA}/homepage-hero/1700000000000-60000000-0000-4000-8000-000000000302.webp',
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
        'hero-media',
        '${ids.workspaceB}/homepage-hero/1700000000000-60000000-0000-4000-8000-000000000303.webp',
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
        'hero-media',
        '${ids.workspaceA}/homepage-hero/unsafe-name.svg',
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
