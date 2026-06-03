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
const expectedRlsTables = expectedBaseSchemaTables;
const serviceOnlyRlsTables = [
  'usage_events',
  'audit_logs',
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

function readRealRlsPolicyMigration() {
  const files = fs
    .readdirSync(realMigrationsDir)
    .filter((fileName) => /^\d{14}_enable_rls_policies\.sql$/.test(fileName));

  assert.equal(
    files.length,
    1,
    `Expected exactly one enable_rls_policies migration, found: ${files.join(', ')}`,
  );

  const fileName = files[0];
  return {
    fileName,
    content: fs.readFileSync(path.join(realMigrationsDir, fileName), 'utf8'),
  };
}

function readAllRealMigrationSql() {
  return fs
    .readdirSync(realMigrationsDir)
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort()
    .map((fileName) => fs.readFileSync(path.join(realMigrationsDir, fileName), 'utf8'))
    .join('\n');
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

test('real RLS policy migration filename follows the repo convention', () => {
  const { fileName } = readRealRlsPolicyMigration();

  assert.match(fileName, /^\d{14}_enable_rls_policies\.sql$/);
});

test('real migration directory passes static validation', () => {
  const result = runValidator(realMigrationsDir);

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /checked 7 migration SQL file\(s\)/);
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

test('real RLS policy migration enables RLS for each MVP table', () => {
  const { content } = readRealRlsPolicyMigration();
  const sql = normalizeSql(content);

  for (const tableName of expectedRlsTables) {
    assert.ok(
      sql.includes(`alter table public.${tableName} enable row level security;`),
      `Missing RLS enablement for ${tableName}`,
    );
  }
});

test('real RLS policy migration includes public catalogue read policies only for published data', () => {
  const { content } = readRealRlsPolicyMigration();
  const sql = normalizeSql(content);

  assert.match(sql, /create policy categories_public_read_published on public\.categories for select to anon, authenticated using \(is_published = true\);/);
  assert.match(sql, /create policy products_public_read_published on public\.products for select to anon, authenticated using \(status = 'published'\);/);
  assert.match(sql, /create policy product_images_public_read_published_products on public\.product_images for select to anon, authenticated using \(.*exists \( select 1 from public\.products p where p\.id = product_images\.product_id and p\.workspace_id = product_images\.workspace_id and p\.status = 'published' \).* \);/);
});

test('real migrations add trusted active-workspace catalogue read surface', () => {
  const sql = normalizeSql(readAllRealMigrationSql());

  assert.match(
    sql,
    /create table if not exists public\.catalogue_public_workspace_config \(/,
  );
  assert.match(
    sql,
    /alter table public\.catalogue_public_workspace_config enable row level security;/,
  );
  assert.match(
    sql,
    /create or replace function public\.get_public_catalogue\(\s*expected_workspace_id uuid,\s*product_slug text default null\s*\)/,
  );
  assert.match(sql, /security definer/);
  assert.match(sql, /set search_path = public/);
  assert.match(
    sql,
    /grant execute on function public\.get_public_catalogue\(uuid, text\) to anon, authenticated;/,
  );
  assert.match(
    sql,
    /alter policy categories_public_read_published on public\.categories to anon, authenticated using \(false\);/,
  );
  assert.match(
    sql,
    /alter policy products_public_read_published on public\.products to anon, authenticated using \(false\);/,
  );
  assert.match(
    sql,
    /alter policy product_images_public_read_published_products on public\.product_images to anon, authenticated using \(false\);/,
  );
  assert.doesNotMatch(sql, /execute\s+.*service_role/i);
  assert.doesNotMatch(sql, /current_setting\('app\.catalogue_workspace_id/);
});

test('real migrations add narrow anonymous website quote insert policies only', () => {
  const sql = normalizeSql(readAllRealMigrationSql());

  assert.match(
    sql,
    /grant insert \(\s*id, workspace_id, public_reference, customer_name, customer_email, customer_phone, event_date, venue, status, source\s*\) on public\.quote_requests to anon;/,
  );
  assert.match(
    sql,
    /grant insert \(\s*workspace_id, quote_request_id, product_name_snapshot, quantity, notes\s*\) on public\.quote_request_items to anon;/,
  );
  assert.match(
    sql,
    /create policy quote_requests_public_insert_website on public\.quote_requests for insert to anon with check \(source = 'website' and status = 'new'\);/,
  );
  assert.match(
    sql,
    /create or replace function public\.is_public_website_quote_request\(\s*target_quote_request_id uuid, target_workspace_id uuid\s*\)/,
  );
  assert.match(
    sql,
    /create policy quote_request_items_public_insert_website_quote on public\.quote_request_items for insert to anon with check \(\s*public\.is_public_website_quote_request\(quote_request_id, workspace_id\)\s*\);/,
  );
  assert.doesNotMatch(
    sql,
    /create policy .* on public\.quote_requests for select to anon/,
  );
  assert.doesNotMatch(
    sql,
    /create policy .* on public\.quote_request_items for select to anon/,
  );
  assert.doesNotMatch(sql, /for update to anon/);
  assert.doesNotMatch(sql, /for delete to anon/);
});

test('real migrations do not enable anonymous catalogue product writes', () => {
  const sql = normalizeSql(readAllRealMigrationSql());
  const productAdminTables = ['categories', 'products', 'product_images'];

  for (const tableName of productAdminTables) {
    assert.doesNotMatch(
      sql,
      new RegExp(`grant\\s+(insert|update|delete|all)[\\s\\S]*?on public\\.${tableName} to anon;`),
      `${tableName} should not grant anonymous writes`,
    );
    assert.doesNotMatch(
      sql,
      new RegExp(`create policy .* on public\\.${tableName} for (insert|update|delete|all) to anon`),
      `${tableName} should not have anonymous write policies`,
    );
  }
});

test('real migrations add authenticated product-admin write policies without service-role paths', () => {
  const sql = normalizeSql(readAllRealMigrationSql());

  assert.match(
    sql,
    /create or replace function public\.is_workspace_product_manager\(\s*target_workspace_id uuid\s*\)/,
  );
  assert.match(sql, /m\.role in \('owner', 'admin'\)/);
  assert.match(
    sql,
    /grant execute on function public\.is_workspace_product_manager\(uuid\) to authenticated;/,
  );
  assert.match(
    sql,
    /alter table public\.product_images add column if not exists status text not null default 'active'/,
  );

  for (const [tableName, policyPrefix] of [
    ['categories', 'categories_product_admin'],
    ['products', 'products_product_admin'],
    ['product_images', 'product_images_product_admin'],
  ]) {
    assert.match(
      sql,
      new RegExp(`create policy ${policyPrefix}_insert on public\\.${tableName} for insert to authenticated with check \\(\\s*public\\.is_workspace_product_manager\\(workspace_id\\)[^;]*\\);`),
      `${tableName} should have product-admin insert policy`,
    );
    assert.match(
      sql,
      new RegExp(`create policy ${policyPrefix}_update on public\\.${tableName} for update to authenticated using \\(\\s*public\\.is_workspace_product_manager\\(workspace_id\\)\\s*\\) with check \\(\\s*public\\.is_workspace_product_manager\\(workspace_id\\)[^;]*\\);`),
      `${tableName} should have product-admin update policy`,
    );
  }

  assert.match(
    sql,
    /create policy audit_logs_product_admin_insert on public\.audit_logs for insert to authenticated with check \(/,
  );
  assert.match(
    sql,
    /action in \([\s\S]*'category\.create'[\s\S]*'category\.update'[\s\S]*'category\.archive'[\s\S]*'product\.create'[\s\S]*'product\.update'[\s\S]*'product\.publish'[\s\S]*'product\.archive'[\s\S]*'productimage\.create'[\s\S]*'productimage\.update'[\s\S]*'productimage\.archive'[\s\S]*\)/,
  );
  assert.doesNotMatch(sql, /service_role/i);
  assert.doesNotMatch(
    sql,
    /grant\s+(insert|update|delete|all)\b[\s\S]*on public\.(categories|products|product_images) to anon;/,
  );
});

test('real migrations add listing media storage bucket and workspace-scoped object policies', () => {
  const sql = normalizeSql(readAllRealMigrationSql());
  const storageMigration = normalizeSql(
    fs.readFileSync(
      path.join(realMigrationsDir, '20260603090000_listing_media_storage.sql'),
      'utf8',
    ),
  );

  assert.match(
    sql,
    /insert into storage\.buckets \( id, name, public, file_size_limit, allowed_mime_types \) values \( 'listing-media', 'listing-media', true, 5242880, array\['image\/jpeg', 'image\/png', 'image\/webp', 'image\/avif'\] \)/,
  );
  assert.match(
    sql,
    /create or replace function public\.is_listing_media_object_path\( object_name text \)/,
  );
  assert.match(
    sql,
    /create policy listing_media_product_admin_insert on storage\.objects for insert to authenticated with check \(/,
  );
  assert.match(
    sql,
    /create or replace function public\.is_listing_media_product_admin_object\( object_bucket text, object_name text \)/,
  );
  assert.match(
    sql,
    /public\.is_workspace_product_manager\( split_part\(object_name, '\/', 1\)::uuid \)/,
  );
  assert.match(sql, /p\.id = split_part\(object_name, '\/', 2\)::uuid/);
  assert.match(
    sql,
    /public\.is_listing_media_product_admin_object\( storage\.objects\.bucket_id, storage\.objects\.name \)/,
  );
  assert.doesNotMatch(storageMigration, /listing_media_public_read/);
  assert.doesNotMatch(storageMigration, /for select to anon/);
  assert.doesNotMatch(storageMigration, /grant select on storage\.objects to anon/);
  assert.doesNotMatch(storageMigration, /for insert to anon/);
  assert.doesNotMatch(storageMigration, /image\/svg\+xml|svg/);
  assert.doesNotMatch(storageMigration, /service_role/i);
});

test('real migrations do not enable anonymous chat persistence writes', () => {
  const sql = normalizeSql(readAllRealMigrationSql());
  const chatTables = ['conversations', 'messages'];

  for (const tableName of chatTables) {
    assert.doesNotMatch(
      sql,
      new RegExp(`grant\\s+insert[\\s\\S]*?on public\\.${tableName} to anon;`),
      `${tableName} should not grant anonymous inserts`,
    );
    assert.doesNotMatch(
      sql,
      new RegExp(`create policy .* on public\\.${tableName} for insert to anon`),
      `${tableName} should not have anonymous insert policies`,
    );
    assert.doesNotMatch(
      sql,
      new RegExp(`create policy .* on public\\.${tableName} for update to anon`),
      `${tableName} should not have anonymous update policies`,
    );
    assert.doesNotMatch(
      sql,
      new RegExp(`create policy .* on public\\.${tableName} for delete to anon`),
      `${tableName} should not have anonymous delete policies`,
    );
  }
});

test('real RLS policy migration scopes admin reads through workspace membership', () => {
  const { content } = readRealRlsPolicyMigration();
  const sql = normalizeSql(content);

  assert.match(sql, /create or replace function public\.is_workspace_member\(target_workspace_id uuid\)/);
  assert.match(sql, /au\.auth_user_id = auth\.uid\(\)/);
  assert.match(sql, /m\.status = 'active'/);

  assert.match(
    sql,
    /create policy workspaces_member_read on public\.workspaces for select to authenticated using \(public\.is_workspace_member\(id\)\);/,
  );

  const workspaceScopedAdminPolicyTables = [
    'memberships',
    'categories',
    'products',
    'product_images',
    'quote_requests',
    'quote_request_items',
    'conversations',
    'messages',
    'integration_connections',
  ];

  for (const tableName of workspaceScopedAdminPolicyTables) {
    assert.match(
      sql,
      new RegExp(`create policy ${tableName}_member_read on public\\.${tableName} for select to authenticated using \\(public\\.is_workspace_member\\(workspace_id\\)\\);`),
      `Missing membership-scoped read policy for ${tableName}`,
    );
  }
});

test('real RLS policy migration keeps service-only tables without broad anonymous policies', () => {
  const { content } = readRealRlsPolicyMigration();
  const sql = normalizeSql(content);

  for (const tableName of serviceOnlyRlsTables) {
    assert.doesNotMatch(
      sql,
      new RegExp(`create policy .* on public\\.${tableName} .* to anon`),
      `${tableName} should not have anonymous policies`,
    );
    assert.doesNotMatch(
      sql,
      new RegExp(`create policy .* on public\\.${tableName} .* using \\(true\\)`),
      `${tableName} should not have broad true policies`,
    );
    assert.doesNotMatch(
      sql,
      new RegExp(`create policy .* on public\\.${tableName} .* with check \\(true\\)`),
      `${tableName} should not have broad true write policies`,
    );
  }
});

test('real RLS policy migration does not add seed data, destructive SQL, or secret references', () => {
  const { content } = readRealRlsPolicyMigration();

  assert.doesNotMatch(content, /\binsert\s+into\b/i);
  assert.doesNotMatch(content, /\bdrop\s+schema\b/i);
  assert.doesNotMatch(content, /\bdrop\s+table\b/i);
  assert.doesNotMatch(content, /\btruncate\b/i);
  assert.doesNotMatch(content, /\bdelete\s+from\b/i);
  assert.doesNotMatch(content, /\bdrop\s+policy\b/i);
  assert.doesNotMatch(content, /\.env/i);
  assert.doesNotMatch(content, /SUPABASE_SERVICE_ROLE_KEY/i);
  assert.doesNotMatch(content, /NEXT_PUBLIC_/i);
});
