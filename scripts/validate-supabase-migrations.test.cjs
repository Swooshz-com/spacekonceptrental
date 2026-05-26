const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const validatorPath = path.join(repoRoot, 'scripts', 'validate-supabase-migrations.cjs');
const realMigrationsDir = path.join(repoRoot, 'supabase', 'migrations');

const expectedBaseSchemaTables = [
  'workspaces',
  'admin_users',
  'memberships',
  'categories',
  'products',
  'product_images',
  'quote_requests',
  'quote_request_items',
  'conversations',
  'messages',
  'usage_events',
  'audit_logs',
  'integration_connections',
];

function makeTempRoot() {
  const baseDir = os.tmpdir();
  fs.mkdirSync(baseDir, { recursive: true });
  return fs.mkdtempSync(path.join(baseDir, 'spacekonceptrental-supabase-validation-test-'));
}

function writeMigration(root, fileName, content) {
  const migrationsDir = path.join(root, 'supabase', 'migrations');
  fs.mkdirSync(migrationsDir, { recursive: true });
  fs.writeFileSync(path.join(migrationsDir, fileName), `${content.trim()}\n`, 'utf8');
  return migrationsDir;
}

function writeReadmeOnlyMigrations(root) {
  const migrationsDir = path.join(root, 'supabase', 'migrations');
  fs.mkdirSync(migrationsDir, { recursive: true });
  fs.writeFileSync(
    path.join(migrationsDir, 'README.md'),
    '# Test migrations\n\nNo SQL migrations in this fixture.\n',
    'utf8',
  );
  return migrationsDir;
}

function runValidator(migrationsDir, options = {}) {
  return spawnSync(process.execPath, [validatorPath, migrationsDir], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      ...options.env,
    },
  });
}

function readRealBaseSchemaMigration() {
  const files = fs
    .readdirSync(realMigrationsDir)
    .filter((fileName) => /^\d{14}_create_base_schema\.sql$/.test(fileName));

  assert.equal(
    files.length,
    1,
    `Expected exactly one create_base_schema migration, found: ${files.join(', ')}`,
  );

  const fileName = files[0];
  return {
    fileName,
    content: fs.readFileSync(path.join(realMigrationsDir, fileName), 'utf8'),
  };
}

function normalizeSql(sql) {
  return sql.replace(/\s+/g, ' ').trim().toLowerCase();
}

test('empty migration directory with no real SQL passes', () => {
  const root = makeTempRoot();
  const migrationsDir = writeReadmeOnlyMigrations(root);

  const result = runValidator(migrationsDir);

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /checked 0 migration SQL file\(s\)/);
});

test('valid timestamped SQL filename passes', () => {
  const root = makeTempRoot();
  const migrationsDir = writeMigration(
    root,
    '20260526143000_create_workspaces.sql',
    'create table if not exists workspaces (id uuid primary key);',
  );

  const result = runValidator(migrationsDir);

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /checked 1 migration SQL file\(s\)/);
});

test('bad SQL filename fails', () => {
  const root = makeTempRoot();
  const migrationsDir = writeMigration(
    root,
    'create_workspaces.sql',
    'create table if not exists workspaces (id uuid primary key);',
  );

  const result = runValidator(migrationsDir);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /timestamped filename/i);
});

test('secret-looking content fails', () => {
  const root = makeTempRoot();
  const migrationsDir = writeMigration(
    root,
    '20260526143000_bad_secret.sql',
    "select 'sk-test_abcdefghijklmnopqrstuvwxyz';",
  );

  const result = runValidator(migrationsDir);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /secret/i);
});

test('.env reference fails', () => {
  const root = makeTempRoot();
  const migrationsDir = writeMigration(
    root,
    '20260526143000_bad_env_reference.sql',
    "select '.env.local';",
  );

  const result = runValidator(migrationsDir);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /\.env/i);
});

test('NEXT_PUBLIC secret-looking variable fails', () => {
  const root = makeTempRoot();
  const migrationsDir = writeMigration(
    root,
    '20260526143000_bad_public_secret.sql',
    "select 'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY';",
  );

  const result = runValidator(migrationsDir);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /NEXT_PUBLIC/i);
});

test('service-role warning comment without an actual key passes', () => {
  const root = makeTempRoot();
  const migrationsDir = writeMigration(
    root,
    '20260526143000_service_role_warning.sql',
    `
      -- Service-role keys must never reach browser code.
      create table if not exists workspaces (id uuid primary key);
    `,
  );

  const result = runValidator(migrationsDir);

  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('service-role key variable in migration content fails', () => {
  const root = makeTempRoot();
  const migrationsDir = writeMigration(
    root,
    '20260526143000_bad_service_role_key.sql',
    "select 'SUPABASE_SERVICE_ROLE_KEY';",
  );

  const result = runValidator(migrationsDir);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /service-role/i);
});

test('destructive SQL pattern fails', () => {
  const root = makeTempRoot();
  const migrationsDir = writeMigration(
    root,
    '20260526143000_drop_public_schema.sql',
    'drop schema public cascade;',
  );

  const result = runValidator(migrationsDir);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /destructive/i);
});

test('common destructive SQL statements fail static validation', () => {
  const cases = [
    ['20260526143000_drop_products.sql', 'drop table public.products;'],
    ['20260526143000_truncate_quotes.sql', 'truncate table public.quote_requests;'],
    ['20260526143000_delete_messages.sql', 'delete from public.messages;'],
    ['20260526143000_drop_product_column.sql', 'alter table public.products drop column description;'],
    ['20260526143000_drop_rls_policy.sql', 'drop policy product_read on public.products;'],
    [
      '20260526143000_disable_rls.sql',
      'alter table public.products disable row level security;',
    ],
  ];

  for (const [fileName, sql] of cases) {
    const root = makeTempRoot();
    const migrationsDir = writeMigration(root, fileName, sql);

    const result = runValidator(migrationsDir);

    assert.notEqual(result.status, 0, `${fileName} unexpectedly passed`);
    assert.match(result.stderr, /destructive/i);
  }
});

test('validator does not require or use a live Supabase connection', () => {
  const root = makeTempRoot();
  const migrationsDir = writeMigration(
    root,
    '20260526143000_create_categories.sql',
    'create table if not exists categories (id uuid primary key);',
  );

  const result = runValidator(migrationsDir, {
    env: {
      SUPABASE_URL: 'https://example.invalid',
      SUPABASE_SERVICE_ROLE_KEY: 'not-a-real-key',
    },
  });

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.doesNotMatch(result.stdout + result.stderr, /connecting|connected/i);
});

test('real base schema migration filename follows the repo convention', () => {
  const { fileName } = readRealBaseSchemaMigration();

  assert.match(fileName, /^\d{14}_create_base_schema\.sql$/);
});

test('real base schema migration passes static validation', () => {
  const result = runValidator(realMigrationsDir);

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /checked 1 migration SQL file\(s\)/);
});

test('real base schema migration creates the planned MVP tables', () => {
  const { content } = readRealBaseSchemaMigration();

  for (const tableName of expectedBaseSchemaTables) {
    assert.match(
      content,
      new RegExp(`create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.${tableName}\\b`, 'i'),
    );
  }
});

test('real base schema migration adds workspace-safe parent keys for scoped relationships', () => {
  const { content } = readRealBaseSchemaMigration();
  const sql = normalizeSql(content);

  const parentKeySnippets = [
    'constraint categories_id_workspace_id_key unique (id, workspace_id)',
    'constraint products_id_workspace_id_key unique (id, workspace_id)',
    'constraint quote_requests_id_workspace_id_key unique (id, workspace_id)',
    'constraint conversations_id_workspace_id_key unique (id, workspace_id)',
  ];

  for (const snippet of parentKeySnippets) {
    assert.ok(sql.includes(snippet), `Missing workspace-safe parent key: ${snippet}`);
  }
});

test('real base schema migration uses composite workspace foreign keys for scoped child rows', () => {
  const { content } = readRealBaseSchemaMigration();
  const sql = normalizeSql(content);

  const relationshipSnippets = [
    'constraint products_category_workspace_id_fkey foreign key (category_id, workspace_id) references public.categories (id, workspace_id) on delete restrict',
    'constraint product_images_product_workspace_id_fkey foreign key (product_id, workspace_id) references public.products (id, workspace_id) on delete cascade',
    'constraint quote_request_items_quote_request_workspace_id_fkey foreign key (quote_request_id, workspace_id) references public.quote_requests (id, workspace_id) on delete cascade',
    'constraint quote_request_items_product_workspace_id_fkey foreign key (product_id, workspace_id) references public.products (id, workspace_id) on delete restrict',
    'constraint conversations_quote_request_workspace_id_fkey foreign key (quote_request_id, workspace_id) references public.quote_requests (id, workspace_id) on delete restrict',
    'constraint messages_conversation_workspace_id_fkey foreign key (conversation_id, workspace_id) references public.conversations (id, workspace_id) on delete cascade',
  ];

  for (const snippet of relationshipSnippets) {
    assert.ok(sql.includes(snippet), `Missing workspace-safe relationship: ${snippet}`);
  }
});

test('real base schema migration does not add RLS policy SQL or seed data', () => {
  const { content } = readRealBaseSchemaMigration();

  assert.doesNotMatch(content, /\bcreate\s+policy\b/i);
  assert.doesNotMatch(
    content,
    /\balter\s+table\b[\s\S]*?\benable\s+row\s+level\s+security\b/i,
  );
  assert.doesNotMatch(content, /\binsert\s+into\b/i);
});
