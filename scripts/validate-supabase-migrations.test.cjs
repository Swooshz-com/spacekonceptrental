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

function readRealMigration(fileName) {
  return fs.readFileSync(path.join(realMigrationsDir, fileName), 'utf8');
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
    "select '" + "sk-test_" + "abcdefghijklmnopqrstuvwxyz';",
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
  assert.match(result.stdout, /checked 27 migration SQL file\(s\)/);
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
    /alter table public\.quote_requests add column if not exists customer_message text;/,
  );
  assert.match(
    sql,
    /constraint quote_requests_customer_message_length_check check \(customer_message is null or char_length\(customer_message\) <= 1200\)/,
  );
  assert.match(
    sql,
    /grant insert \(\s*id, workspace_id, public_reference, customer_name, customer_email, customer_phone, event_date, venue, status, source\s*\) on public\.quote_requests to anon;/,
  );
  assert.match(
    sql,
    /grant insert \(\s*customer_message\s*\) on public\.quote_requests to anon;/,
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
  assert.doesNotMatch(
    sql,
    /on public\.quote_requests for update to anon/,
  );
  assert.doesNotMatch(
    sql,
    /on public\.quote_requests for delete to anon/,
  );
  assert.doesNotMatch(
    sql,
    /on public\.quote_request_items for update to anon/,
  );
  assert.doesNotMatch(
    sql,
    /on public\.quote_request_items for delete to anon/,
  );
});

test('real migrations add admin-only quote workflow activity policies', () => {
  const sql = normalizeSql(readAllRealMigrationSql());

  assert.match(
    sql,
    /create table if not exists public\.quote_request_activity \(/,
  );
  assert.match(
    sql,
    /constraint quote_request_activity_quote_request_workspace_id_fkey foreign key \(quote_request_id, workspace_id\) references public\.quote_requests \(id, workspace_id\) on delete cascade/,
  );
  assert.match(
    sql,
    /constraint quote_request_activity_type_check check \(activity_type in \('status_change', 'internal_note'\)\)/,
  );
  assert.match(
    sql,
    /constraint quote_request_activity_note_length_check check \(note is null or char_length\(note\) <= 1200\)/,
  );
  assert.match(
    sql,
    /alter table public\.quote_request_activity enable row level security;/,
  );
  assert.match(
    sql,
    /grant update \(\s*status, updated_at\s*\) on public\.quote_requests to authenticated;/,
  );
  assert.match(
    sql,
    /grant select, insert on public\.quote_request_activity to authenticated;/,
  );
  assert.match(
    sql,
    /create policy quote_requests_quote_admin_update on public\.quote_requests for update to authenticated using \(public\.is_workspace_quote_manager\(workspace_id\)\) with check \(public\.is_workspace_quote_manager\(workspace_id\)\);/,
  );
  assert.match(
    sql,
    /create policy quote_request_activity_quote_admin_select on public\.quote_request_activity for select to authenticated using \(public\.is_workspace_quote_manager\(workspace_id\)\);/,
  );
  assert.match(
    sql,
    /create policy quote_request_activity_quote_admin_insert on public\.quote_request_activity for insert to authenticated with check \(/,
  );
  assert.doesNotMatch(
    sql,
    /grant (select|insert|update|delete).*on public\.quote_request_activity to anon;/,
  );
  assert.doesNotMatch(
    sql,
    /create policy [^;]* on public\.quote_request_activity [^;]* to anon/,
  );
});

test('real migrations add atomic admin quote workflow RPC with least-privilege grants', () => {
  const sql = normalizeSql(readAllRealMigrationSql());

  assert.match(
    sql,
    /create or replace function public\.execute_admin_quote_workflow\(\s*p_quote_request_id uuid,\s*p_workspace_id uuid,\s*p_status text,\s*p_internal_note text\s*\)/,
  );
  assert.match(sql, /security definer/);
  assert.match(sql, /set search_path = public/);
  assert.match(sql, /public\.current_quote_admin_user_id\(p_workspace_id\)/);
  assert.match(sql, /for update/);
  assert.match(sql, /insert into public\.quote_request_activity/);
  assert.match(
    sql,
    /revoke all on function public\.execute_admin_quote_workflow\(uuid, uuid, text, text\) from public;/,
  );
  assert.match(
    sql,
    /grant execute on function public\.execute_admin_quote_workflow\(uuid, uuid, text, text\) to authenticated;/,
  );
  assert.match(
    sql,
    /revoke update \(\s*status,\s*updated_at\s*\) on public\.quote_requests from authenticated;/,
  );
  assert.match(
    sql,
    /revoke insert on public\.quote_request_activity from authenticated;/,
  );
  assert.match(
    sql,
    /alter policy quote_requests_quote_admin_update on public\.quote_requests using \(false\) with check \(false\);/,
  );
  assert.match(
    sql,
    /alter policy quote_request_activity_quote_admin_insert on public\.quote_request_activity with check \(false\);/,
  );
  assert.doesNotMatch(
    sql,
    /grant execute on function public\.execute_admin_quote_workflow\(uuid, uuid, text, text\) to anon;/,
  );
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

test('real migrations harden product-admin writes behind the RPC boundary only', () => {
  const sql = normalizeSql(readAllRealMigrationSql());
  const hardeningMigration = normalizeSql(
    fs.readFileSync(
      path.join(realMigrationsDir, '20260606143000_admin_write_boundary_hardening.sql'),
      'utf8',
    ),
  );

  assert.match(
    hardeningMigration,
    /create or replace function public\.execute_admin_product_write\( p_action text, p_target_id uuid, p_workspace_id uuid, p_payload jsonb \) returns uuid language plpgsql security definer set search_path = public as \$\$/,
  );
  assert.ok(
    (
      hardeningMigration.match(
        /from public\.categories c where c\.id = v_category_id and c\.workspace_id = p_workspace_id/g,
      ) || []
    ).length >= 2,
    'execute_admin_product_write should validate product category relationships against the target workspace',
  );
  assert.ok(
    (hardeningMigration.match(/raise exception 'product_category_workspace_mismatch';/g) || [])
      .length >= 2,
    'execute_admin_product_write should raise a safe category workspace mismatch error',
  );
  assert.match(
    hardeningMigration,
    /from public\.products p where p\.id = v_product_id and p\.workspace_id = p_workspace_id/,
    'execute_admin_product_write should validate product image relationships against the target workspace',
  );
  assert.match(
    hardeningMigration,
    /raise exception 'product_image_workspace_mismatch';/,
    'execute_admin_product_write should raise a safe product image workspace mismatch error',
  );
  assert.match(
    hardeningMigration,
    /revoke all on function public\.execute_admin_product_write\(text, uuid, uuid, jsonb\) from public;/,
  );
  assert.match(
    hardeningMigration,
    /grant execute on function public\.execute_admin_product_write\(text, uuid, uuid, jsonb\) to authenticated;/,
  );

  for (const [tableName, insertPolicy, updatePolicy] of [
    ['categories', 'categories_product_admin_insert', 'categories_product_admin_update'],
    ['products', 'products_product_admin_insert', 'products_product_admin_update'],
    ['product_images', 'product_images_product_admin_insert', 'product_images_product_admin_update'],
  ]) {
    assert.match(
      hardeningMigration,
      new RegExp(`revoke insert[\\s\\S]*on public\\.${tableName} from authenticated;`),
      `${tableName} should revoke direct authenticated inserts`,
    );
    assert.match(
      hardeningMigration,
      new RegExp(`revoke update[\\s\\S]*on public\\.${tableName} from authenticated;`),
      `${tableName} should revoke direct authenticated updates`,
    );
    assert.match(
      hardeningMigration,
      new RegExp(`alter policy ${insertPolicy} on public\\.${tableName} with check \\(false\\);`),
      `${tableName} should neutralize the direct insert policy`,
    );
    assert.match(
      hardeningMigration,
      new RegExp(`alter policy ${updatePolicy} on public\\.${tableName} using \\(false\\) with check \\(false\\);`),
      `${tableName} should neutralize the direct update policy`,
    );
  }

  assert.match(
    hardeningMigration,
    /revoke insert[\s\S]*on public\.audit_logs from authenticated;/,
  );
  assert.match(
    hardeningMigration,
    /alter policy audit_logs_product_admin_insert on public\.audit_logs with check \(false\);/,
  );
  assert.match(sql, /grant execute on function public\.execute_admin_product_write\(text, uuid, uuid, jsonb\) to authenticated;/);
  assert.doesNotMatch(hardeningMigration, /service_role|supabase_service_role/i);
  assert.doesNotMatch(hardeningMigration, /grant\s+(insert|update|delete|all)[\s\S]*on public\.(categories|products|product_images|audit_logs) to anon;/);
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
      new RegExp(`create policy (?!${tableName}_no_direct_)[^;]* on public\\.${tableName} for insert to anon`),
      `${tableName} should not have anonymous insert policies except fail-closed direct-deny policies`,
    );
    assert.doesNotMatch(
      sql,
      new RegExp(`create policy (?!${tableName}_no_direct_)[^;]* on public\\.${tableName} for update to anon`),
      `${tableName} should not have anonymous update policies except fail-closed direct-deny policies`,
    );
    assert.doesNotMatch(
      sql,
      new RegExp(`create policy (?!${tableName}_no_direct_)[^;]* on public\\.${tableName} for delete to anon`),
      `${tableName} should not have anonymous delete policies except fail-closed direct-deny policies`,
    );
  }
});

test('real migrations add the Phase 2E-B conversation/message schema and RLS foundation', () => {
  const migrationFileName = '20260604090000_conversation_message_schema_rls_foundation.sql';
  const migrationPath = path.join(realMigrationsDir, migrationFileName);
  assert.ok(fs.existsSync(migrationPath), `Missing ${migrationFileName}`);

  const migration = normalizeSql(fs.readFileSync(migrationPath, 'utf8'));

  assert.match(
    migration,
    /alter table public\.conversations add column if not exists metadata jsonb not null default '\{\}'::jsonb/,
  );
  assert.match(
    migration,
    /alter table public\.conversations add column if not exists retention_expires_at timestamptz/,
  );
  assert.match(
    migration,
    /alter table public\.conversations add column if not exists deleted_at timestamptz/,
  );
  assert.match(
    migration,
    /alter table public\.conversations add column if not exists last_message_at timestamptz/,
  );
  assert.match(
    migration,
    /constraint conversations_client_session_hash_format_check check/,
  );
  assert.match(
    migration,
    /constraint conversations_metadata_safe_keys_check check/,
  );

  assert.match(
    migration,
    /alter table public\.messages add column if not exists message_type text not null default 'chat'/,
  );
  assert.match(
    migration,
    /alter table public\.messages add column if not exists metadata jsonb not null default '\{\}'::jsonb/,
  );
  assert.match(
    migration,
    /alter table public\.messages add column if not exists retention_expires_at timestamptz/,
  );
  assert.match(
    migration,
    /alter table public\.messages add column if not exists deleted_at timestamptz/,
  );
  assert.match(
    migration,
    /alter table public\.messages add column if not exists sequence_number integer/,
  );
  assert.match(migration, /constraint messages_message_type_check check/);
  assert.match(migration, /constraint messages_role_type_check check/);
  assert.match(migration, /constraint messages_content_length_check check/);
  assert.match(migration, /constraint messages_metadata_safe_keys_check check/);

  assert.match(
    migration,
    /alter policy conversations_member_read on public\.conversations using \(false\);/,
  );
  assert.match(
    migration,
    /alter policy messages_member_read on public\.messages using \(false\);/,
  );

  for (const tableName of ['conversations', 'messages']) {
    for (const action of ['insert', 'update', 'delete']) {
      assert.match(
        migration,
        new RegExp(`create policy ${tableName}_no_direct_${action} on public\\.${tableName}`),
        `${tableName} should have a fail-closed ${action} policy`,
      );
    }

    assert.doesNotMatch(
      migration,
      new RegExp(`grant\\s+(select|insert|update|delete|all)[\\s\\S]*on public\\.${tableName} to (anon|authenticated);`),
      `${tableName} should not grant direct client access`,
    );
  }

  assert.doesNotMatch(migration, /webhook-test|raw_provider_payload|raw_headers/i);
});

test('real migrations add the Phase 2E-D transcript persistence RPC boundary without browser grants', () => {
  const migrationFileName = '20260604100000_transcript_persistence_rpc_boundary.sql';
  const migration = readRealMigration(migrationFileName);
  const allSql = normalizeSql(readAllRealMigrationSql());
  const sql = normalizeSql(migration);

  assert.match(
    migration,
    /create or replace function public\.is_safe_transcript_metadata\(\s*p_metadata jsonb,\s*p_max_bytes integer\s*\)/,
  );
  assert.match(
    migration,
    /create or replace function public\.persist_transcript_batch\(\s*p_workspace_id uuid,\s*p_conversation jsonb,\s*p_messages jsonb\s*\)/,
  );
  assert.match(migration, /returns jsonb/i);
  assert.match(migration, /security definer/i);
  assert.match(migration, /set search_path = public/i);
  assert.match(migration, /transcript_metadata_unsafe/);
  assert.match(migration, /transcript_workspace_mismatch/);
  assert.match(migration, /on conflict \(id\) do update/i);
  assert.match(migration, /client_message_id/);
  assert.ok(
    allSql.includes(
      'constraint messages_workspace_conversation_client_message_key unique (workspace_id, conversation_id, client_message_id)',
    ) ||
      allSql.includes(
        'create unique index if not exists messages_workspace_conversation_client_message_id_unique_idx on public.messages (workspace_id, conversation_id, client_message_id) where client_message_id is not null;',
      ),
    'messages must have a DB-level idempotency uniqueness arbiter for non-null client_message_id values',
  );
  assert.match(
    sql,
    /on conflict on constraint messages_workspace_conversation_client_message_key do update/,
    'persist_transcript_batch must use the DB idempotency constraint so concurrent duplicate client_message_id inserts return the original row',
  );
  assert.match(
    migration,
    /concurrency arbiter/i,
    'migration should document that DB uniqueness is the concurrency arbiter for client_message_id retries',
  );
  assert.match(
    migration,
    /transcript_client_message_id_conflict/,
    'persist_transcript_batch must reject conflicting client_message_id reuse with a controlled exception',
  );
  assert.match(
    migration,
    /exact duplicate retries are accepted while conflicting client_message_id reuse is rejected/i,
    'migration should document exact duplicate retry acceptance and conflicting reuse rejection',
  );
  for (const field of [
    'role',
    'message_type',
    'content',
    'provider',
    'request_id',
    'sequence_number',
    'retention_expires_at',
    'metadata',
  ]) {
    assert.match(
      sql,
      new RegExp(`public\\.messages\\.${field}\\s+is\\s+not\\s+distinct\\s+from\\s+excluded\\.${field}`),
      `client_message_id idempotency fingerprint must compare ${field}`,
    );
  }
  assert.ok(
    sql.includes(
      'revoke all on function public.persist_transcript_batch(uuid, jsonb, jsonb) from public;',
    ),
    'transcript persistence RPC must revoke default public execute',
  );
  assert.doesNotMatch(
    migration,
    /grant execute on function public\.persist_transcript_batch\(uuid, jsonb, jsonb\) to (anon|authenticated)/i,
  );
  assert.doesNotMatch(migration, /service_role|service-role|NEXT_PUBLIC|chat-config/i);
});

test('real migrations add the Phase 2E-H transcript audit/evidence schema without browser grants', () => {
  const migrationFileName = '20260604110000_transcript_audit_evidence_foundation.sql';
  const migration = readRealMigration(migrationFileName);
  const sql = normalizeSql(migration);

  assert.match(
    migration,
    /create table if not exists public\.transcript_audit_events \(/,
  );
  assert.match(
    migration,
    /create table if not exists public\.transcript_evidence_records \(/,
  );
  assert.match(
    migration,
    /create or replace function public\.is_safe_transcript_metadata\(\s*p_metadata jsonb,\s*p_max_bytes integer\s*\)/,
    'Phase 2E-H must harden the shared transcript metadata helper before audit/evidence constraints use it',
  );
  assert.match(
    migration,
    /with recursive metadata_walk\(key_name, value\) as/,
    'metadata helper must keep recursive metadata traversal',
  );
  assert.match(
    sql,
    /jsonb_typeof\(p_metadata\) = 'object'/,
    'metadata helper must keep top-level JSON object enforcement',
  );
  assert.match(
    sql,
    /octet_length\(p_metadata::text\) <= p_max_bytes/,
    'metadata helper must keep the configured byte-size limit',
  );
  assert.match(
    migration,
    /revoke all on function public\.is_safe_transcript_metadata\(jsonb, integer\) from public;/,
    'metadata helper must keep public execute revoked',
  );

  for (const denylistFragment of [
    'full[_-]?transcript',
    'transcript[_-]?content',
    'raw[_-]?provider[_-]?payload',
    'provider[_-]?payload',
    'debug[_-]?payload',
    'workflow[_-]?payload',
    'webhook',
    'headers?',
    'raw[_-]?headers?',
    'tokens?',
    'authorization',
    'cookie',
    'credentials?',
    'private[_-]?key',
    'secret',
    'password',
    'api[_-]?key',
    'service[_-]?role',
    'customer[_-]?visible[_-]?internal[_-]?notes',
  ]) {
    assert.ok(
      migration.includes(denylistFragment),
      `metadata helper denylist must include ${denylistFragment}`,
    );
  }

  for (const tableName of ['transcript_audit_events', 'transcript_evidence_records']) {
    assert.match(
      migration,
      new RegExp(`alter table public\\.${tableName} enable row level security;`),
      `${tableName} must enable RLS`,
    );
    assert.match(
      migration,
      new RegExp(`revoke all on table public\\.${tableName} from public;`),
      `${tableName} must revoke public table privileges`,
    );
    assert.match(
      migration,
      new RegExp(`revoke all on table public\\.${tableName} from anon, authenticated;`),
      `${tableName} must revoke browser-role table privileges`,
    );
    assert.doesNotMatch(
      migration,
      new RegExp(`grant\\s+(select|insert|update|delete|all)[\\s\\S]*?on table public\\.${tableName} to (anon|authenticated);`, 'i'),
      `${tableName} should not grant direct browser access`,
    );
    assert.doesNotMatch(
      migration,
      new RegExp(`create policy [^;]* on public\\.${tableName}`, 'i'),
      `${tableName} should not add browser-access policies yet`,
    );
  }

  assert.match(sql, /constraint transcript_audit_events_workspace_id_fkey foreign key \(workspace_id\) references public\.workspaces \(id\)/);
  assert.match(sql, /constraint transcript_audit_events_conversation_workspace_id_fkey foreign key \(conversation_id, workspace_id\) references public\.conversations \(id, workspace_id\)/);
  assert.match(sql, /constraint transcript_audit_events_quote_request_workspace_id_fkey foreign key \(quote_request_id, workspace_id\) references public\.quote_requests \(id, workspace_id\)/);
  assert.match(sql, /constraint transcript_audit_events_actor_admin_user_id_fkey foreign key \(actor_admin_user_id\) references public\.admin_users \(id\)/);
  assert.match(sql, /constraint transcript_audit_events_event_type_check check/);
  assert.match(sql, /transcript_persistence_attempt/);
  assert.match(sql, /transcript_access_read/);
  assert.match(sql, /transcript_export_request/);
  assert.match(sql, /transcript_deletion_request/);
  assert.match(sql, /retention_expiry_processing/);
  assert.match(sql, /evidence_capture/);
  assert.match(sql, /constraint transcript_audit_events_actor_type_check check/);
  assert.match(sql, /constraint transcript_audit_events_result_status_check check/);
  assert.match(sql, /constraint transcript_audit_events_affected_record_count_check check/);
  assert.match(sql, /constraint transcript_audit_events_metadata_safe_check check \(public\.is_safe_transcript_metadata\(metadata, 4096\)\)/);

  assert.match(sql, /constraint transcript_evidence_records_workspace_id_fkey foreign key \(workspace_id\) references public\.workspaces \(id\)/);
  assert.match(sql, /constraint transcript_evidence_records_audit_event_workspace_id_fkey foreign key \(audit_event_id, workspace_id\) references public\.transcript_audit_events \(id, workspace_id\)/);
  assert.match(sql, /constraint transcript_evidence_records_evidence_type_check check/);
  assert.match(sql, /local_sql_rls_proof/);
  assert.match(sql, /static_guard_proof/);
  assert.match(sql, /operator_approval/);
  assert.match(sql, /post_action_verification/);
  assert.match(sql, /constraint transcript_evidence_records_metadata_safe_check check \(public\.is_safe_transcript_metadata\(metadata, 4096\)\)/);
  assert.match(sql, /constraint transcript_evidence_records_safe_text_check check/);

  for (const columnName of [
    'full_transcript',
    'transcript_content',
    'raw_provider_payload',
    'provider_payload',
    'workflow_payload',
    'webhook_url',
    'raw_headers',
    'cookies',
    'tokens',
    'api_keys',
    'private_keys',
    'secrets',
    'service_role_material',
    'production_evidence',
  ]) {
    assert.doesNotMatch(
      sql,
      new RegExp(`\\b${columnName}\\b\\s+(text|jsonb|bytea|uuid)`),
      `${columnName} must not be stored as a transcript audit/evidence column`,
    );
  }

  assert.doesNotMatch(
    migration,
    /grant execute on function public\.[a-z_]*transcript_(audit|evidence)[a-z_]*\(.*\) to (anon|authenticated)/i,
    'Phase 2E-H must not introduce browser-granted audit/evidence RPCs',
  );
});

test('real migrations add the Phase 2E-I transcript audit/evidence insert RPC boundary without browser grants', () => {
  const migrationFileName = '20260604120000_transcript_audit_evidence_insert_boundary.sql';
  const migration = readRealMigration(migrationFileName);
  const sql = normalizeSql(migration);

  assert.match(
    migration,
    /create or replace function public\.insert_transcript_audit_event\(\s*p_workspace_id uuid,\s*p_event jsonb\s*\)/,
  );
  assert.match(
    migration,
    /create or replace function public\.insert_transcript_evidence_record\(\s*p_workspace_id uuid,\s*p_evidence jsonb\s*\)/,
  );
  assert.match(migration, /returns jsonb/i);
  assert.match(migration, /security definer/i);
  assert.match(migration, /set search_path = public/i);
  assert.match(migration, /public\.is_safe_transcript_metadata/);
  assert.match(sql, /insert into public\.transcript_audit_events/);
  assert.match(sql, /insert into public\.transcript_evidence_records/);

  for (const controlledError of [
    'transcript_audit_workspace_required',
    'transcript_audit_event_invalid',
    'transcript_audit_workspace_mismatch',
    'transcript_audit_conversation_workspace_mismatch',
    'transcript_audit_quote_request_workspace_mismatch',
    'transcript_audit_actor_workspace_mismatch',
    'transcript_audit_metadata_unsafe',
    'transcript_evidence_workspace_required',
    'transcript_evidence_record_invalid',
    'transcript_evidence_workspace_mismatch',
    'transcript_evidence_audit_event_workspace_mismatch',
    'transcript_evidence_metadata_unsafe',
    'transcript_evidence_text_unsafe',
  ]) {
    assert.match(
      migration,
      new RegExp(controlledError),
      `Phase 2E-I insert RPC must keep controlled error ${controlledError}`,
    );
  }

  for (const signature of [
    'public.insert_transcript_audit_event(uuid, jsonb)',
    'public.insert_transcript_evidence_record(uuid, jsonb)',
  ]) {
    assert.ok(
      sql.includes(`revoke all on function ${signature} from public;`),
      `${signature} must revoke default public execute`,
    );
    assert.ok(
      sql.includes(`revoke all on function ${signature} from anon, authenticated;`),
      `${signature} must explicitly revoke browser-role execute`,
    );
  }

  assert.doesNotMatch(
    migration,
    /grant execute on function public\.insert_transcript_(audit_event|evidence_record)\(uuid, jsonb\) to (anon|authenticated)/i,
  );
  assert.doesNotMatch(
    migration,
    /grant\s+(select|insert|update|delete|all)[\s\S]*?on table public\.transcript_(audit_events|evidence_records) to (anon|authenticated)/i,
  );
  assert.doesNotMatch(migration, /service_role|service-role|NEXT_PUBLIC|chat-config/i);
});

test('real migrations restore transcript metadata diagnostic denylist classes without browser grants', () => {
  const migrationFileName = '20260605122000_transcript_metadata_diagnostic_denylist_hotfix.sql';
  const migration = readRealMigration(migrationFileName);
  const sql = normalizeSql(migration);
  const allSql = normalizeSql(readAllRealMigrationSql());

  assert.match(
    migration,
    /create or replace function public\.is_safe_transcript_metadata\(\s*p_metadata jsonb,\s*p_max_bytes integer\s*\)/,
    'hotfix must replace the shared transcript metadata helper',
  );
  assert.match(
    migration,
    /with recursive metadata_walk\(key_name, value\) as/,
    'hotfix must preserve recursive metadata traversal',
  );
  assert.match(
    sql,
    /jsonb_typeof\(p_metadata\) = 'object'/,
    'hotfix must preserve top-level JSON object enforcement',
  );
  assert.match(
    sql,
    /octet_length\(p_metadata::text\) <= p_max_bytes/,
    'hotfix must preserve byte-size enforcement',
  );
  assert.match(
    migration,
    /revoke all on function public\.is_safe_transcript_metadata\(jsonb, integer\) from public;/,
    'hotfix must preserve public execute revocation',
  );

  for (const denylistFragment of [
    'provider[_-]?debug',
    'trace[_-]?dump',
    'full[_-]?transcript',
    'transcript[_-]?content',
    'raw[_-]?provider[_-]?payload',
    'provider[_-]?payload',
    'debug[_-]?payload',
    'workflow[_-]?payload',
    'webhook',
    'headers?',
    'raw[_-]?headers?',
    'tokens?',
    'authorization',
    'cookie',
    'credentials?',
    'private[_-]?key',
    'secret',
    'password',
    'api[_-]?key',
    'service[_-]?role',
    'customer[_-]?visible[_-]?internal[_-]?notes',
  ]) {
    assert.ok(
      migration.includes(denylistFragment),
      `hotfix metadata helper denylist must include ${denylistFragment}`,
    );
  }

  assert.match(
    allSql,
    /create or replace function public\.is_safe_transcript_metadata/,
    'final migration set must include the shared transcript metadata helper',
  );
  assert.doesNotMatch(
    migration,
    /grant execute on function public\.is_safe_transcript_metadata\(jsonb, integer\) to (anon|authenticated)/i,
    'hotfix must not grant browser execute on the helper',
  );
  assert.doesNotMatch(
    migration,
    /service_role|service-role|NEXT_PUBLIC|chat-config|PINECONE/i,
    'hotfix must not introduce runtime secrets or Pinecone/chat config references',
  );
});

test('real migrations add the Phase 2G-B search-index outbox foundation without browser grants', () => {
  const migrationFileName = '20260605133000_search_index_outbox_foundation.sql';
  const migration = readRealMigration(migrationFileName);
  const sql = normalizeSql(migration);

  assert.match(
    migration,
    /create or replace function public\.is_safe_search_index_metadata\(\s*p_metadata jsonb,\s*p_max_bytes integer\s*\)/,
    'Phase 2G-B must add a dedicated recursive metadata helper for search-index metadata',
  );
  assert.match(
    migration,
    /with recursive metadata_walk\(key_name, value\) as/,
    'search-index metadata helper must recursively inspect nested metadata keys',
  );
  assert.match(
    sql,
    /jsonb_typeof\(p_metadata\) = 'object'/,
    'search-index metadata helper must require a top-level object',
  );
  assert.match(
    sql,
    /octet_length\(p_metadata::text\) <= p_max_bytes/,
    'search-index metadata helper must enforce a byte-size bound',
  );

  for (const denylistFragment of [
    'provider[_-]?debug',
    'trace[_-]?dump',
    'full[_-]?transcript',
    'transcript[_-]?content',
    'raw[_-]?provider[_-]?payload',
    'provider[_-]?payload',
    'webhook',
    'headers?',
    'tokens?',
    'cookie',
    'credentials?',
    'private[_-]?key',
    'secret',
    'password',
    'api[_-]?key',
    'service[_-]?role',
    'customer[_-]?visible[_-]?internal[_-]?notes',
    'internal[_-]?notes',
    'payment',
    'customer[_-]?contact',
  ]) {
    assert.ok(
      migration.includes(denylistFragment),
      `search-index metadata helper denylist must include ${denylistFragment}`,
    );
  }

  assert.match(
    migration,
    /create table if not exists public\.search_index_jobs \(/,
  );
  assert.match(
    migration,
    /create table if not exists public\.search_index_documents \(/,
  );

  for (const tableName of ['search_index_jobs', 'search_index_documents']) {
    assert.match(
      migration,
      new RegExp(`alter table public\\.${tableName} enable row level security;`),
      `${tableName} must enable RLS`,
    );
    assert.match(
      migration,
      new RegExp(`revoke all on table public\\.${tableName} from public;`),
      `${tableName} must revoke public table privileges`,
    );
    assert.match(
      migration,
      new RegExp(`revoke all on table public\\.${tableName} from anon, authenticated;`),
      `${tableName} must revoke browser-role table privileges`,
    );
    assert.doesNotMatch(
      migration,
      new RegExp(`grant\\s+(select|insert|update|delete|all)[\\s\\S]*?on table public\\.${tableName} to (anon|authenticated);`, 'i'),
      `${tableName} should not grant direct browser access`,
    );
    assert.doesNotMatch(
      migration,
      new RegExp(`create policy [^;]* on public\\.${tableName}`, 'i'),
      `${tableName} should not add browser-access policies yet`,
    );
  }

  assert.match(sql, /constraint search_index_jobs_workspace_id_fkey foreign key \(workspace_id\) references public\.workspaces \(id\)/);
  assert.match(sql, /constraint search_index_jobs_source_type_check check/);
  assert.match(sql, /constraint search_index_jobs_visibility_check check/);
  assert.match(sql, /constraint search_index_jobs_operation_check check/);
  assert.match(sql, /constraint search_index_jobs_status_check check/);
  assert.match(sql, /constraint search_index_jobs_attempt_count_check check \(attempt_count >= 0\)/);
  assert.match(sql, /constraint search_index_jobs_error_code_check check/);
  assert.match(sql, /constraint search_index_jobs_error_message_check check/);
  assert.match(sql, /constraint search_index_jobs_content_hash_check check/);
  assert.match(sql, /constraint search_index_jobs_metadata_safe_check check \(public\.is_safe_search_index_metadata\(metadata, 4096\)\)/);

  assert.match(sql, /constraint search_index_documents_workspace_id_fkey foreign key \(workspace_id\) references public\.workspaces \(id\)/);
  assert.match(sql, /constraint search_index_documents_last_index_job_workspace_id_fkey foreign key \(last_index_job_id, workspace_id\) references public\.search_index_jobs \(id, workspace_id\) on delete restrict/);
  assert.match(sql, /constraint search_index_documents_source_visibility_key unique \(workspace_id, source_type, source_id, visibility\)/);
  assert.match(sql, /constraint search_index_documents_chunk_count_check check \(chunk_count >= 0\)/);
  assert.match(sql, /constraint search_index_documents_metadata_safe_check check \(public\.is_safe_search_index_metadata\(metadata, 4096\)\)/);

  for (const enumValue of [
    'listing',
    'category',
    'policy',
    'faq',
    'document',
    'listing_image_alt_text',
    'public_chat',
    'admin_only',
    'blocked',
    'upsert',
    'delete',
    'hide',
    'rebuild',
    'queued',
    'processing',
    'succeeded',
    'failed',
    'skipped',
    'cancelled',
  ]) {
    assert.match(sql, new RegExp(`'${enumValue}'`));
  }

  assert.match(sql, /create unique index if not exists search_index_jobs_active_idempotency_key/);
  assert.match(sql, /where content_hash is not null and status in \('queued', 'processing'\)/);
  assert.match(sql, /create index if not exists search_index_jobs_queued_idx/);
  assert.match(sql, /create index if not exists search_index_jobs_source_lookup_idx/);
  assert.match(sql, /create index if not exists search_index_documents_source_lookup_idx/);
  assert.match(sql, /create index if not exists search_index_documents_last_job_idx/);

  assert.doesNotMatch(migration, /@pinecone-database|pinecone_api_key|process\.env|n8n|chat-config/i);
  assert.doesNotMatch(migration, /embedding|rerank|vector[_ -]?(upsert|delete)|retrieval/i);
});

test('real migrations add the Phase 2G-C/D local search-index enqueue RPC without browser table grants', () => {
  const migrationFileName = '20260605150000_search_index_enqueue_integration.sql';
  const migration = readRealMigration(migrationFileName);
  const sql = normalizeSql(migration);
  const allSql = normalizeSql(readAllRealMigrationSql());

  assert.match(
    migration,
    /create or replace function public\.enqueue_search_index_job\(\s*p_workspace_id uuid,\s*p_source_type text,\s*p_source_id uuid,\s*p_visibility text,\s*p_operation text,\s*p_source_version text default null,\s*p_content_hash text default null,\s*p_metadata jsonb default '\{\}'::jsonb,\s*p_status text default 'queued'\s*\)/,
    'Phase 2G-C/D must add the narrow local enqueue RPC',
  );
  assert.match(sql, /returns jsonb/);
  assert.match(sql, /security definer/);
  assert.match(sql, /set search_path = public/);
  assert.match(sql, /public\.is_workspace_product_manager\(p_workspace_id\)/);
  assert.match(sql, /public\.is_safe_search_index_metadata\(v_metadata, 4096\)/);
  assert.match(sql, /insert into public\.search_index_jobs/);
  assert.match(sql, /status in \('queued', 'processing'\)/);
  assert.match(sql, /unique_violation/);
  assert.match(sql, /search_index_reused/);
  assert.match(sql, /search_index_queued/);

  assert.match(
    sql,
    /revoke all on function public\.enqueue_search_index_job\(uuid, text, uuid, text, text, text, text, jsonb, text\) from public;/,
  );
  assert.match(
    sql,
    /grant execute on function public\.enqueue_search_index_job\(uuid, text, uuid, text, text, text, text, jsonb, text\) to authenticated;/,
  );
  assert.doesNotMatch(
    migration,
    /grant\s+(select|insert|update|delete|all)[\s\S]*?on table public\.search_index_(jobs|documents) to (anon|authenticated);/i,
    'Phase 2G-C/D must not grant browser table access to search-index tables',
  );
  assert.doesNotMatch(
    migration,
    /create policy [^;]* on public\.search_index_(jobs|documents)/i,
    'Phase 2G-C/D must not add browser-access table policies',
  );

  assert.match(sql, /perform public\.enqueue_search_index_job/);
  assert.match(sql, /p_action = 'category\.archive'/);
  assert.match(sql, /p_action = 'product\.publish'/);
  assert.match(sql, /p_action = 'productimage\.archive'/);
  assert.match(
    allSql,
    /create or replace function public\.execute_admin_product_write\(\s*p_action text,\s*p_target_id uuid,\s*p_workspace_id uuid,\s*p_payload jsonb\s*\) returns uuid/,
    'final migration set must keep the admin product write RPC',
  );
  assert.match(
    allSql,
    /perform public\.enqueue_search_index_job\(\s*p_workspace_id,\s*v_search_source_type,\s*v_returned_id,\s*v_search_visibility,\s*v_search_operation,/,
    'admin listing/category/image writes must enqueue local search-index jobs in the DB boundary',
  );

  assert.doesNotMatch(migration, /@pinecone-database|pinecone_api_key|process\.env|n8n|chat-config/i);
  assert.doesNotMatch(migration, /embedding|rerank|vector[_ -]?(upsert|delete)|retrieval/i);
});

test('real migrations add protected admin HubSpot manual import outcome ledger append-only metadata', () => {
  const migrationFileName =
    '20260617113000_hubspot_manual_import_outcome_ledger_foundation.sql';
  const migration = readRealMigration(migrationFileName);
  const sql = normalizeSql(migration);

  assert.match(
    sql,
    /create table if not exists public\.quote_crm_handoff_manual_import_outcomes \(/,
  );
  for (const column of [
    'id uuid primary key default gen_random_uuid()',
    'workspace_id uuid not null',
    'manifest_id uuid not null',
    "provider text not null default 'hubspot'",
    "packet_kind text not null default 'hubspot_import_csv'",
    'outcome_status text not null',
    'record_count integer not null',
    "request_ids uuid[] not null default '{}'::uuid[]",
    'recorded_by_admin_user_id uuid not null',
    'recorded_at timestamptz not null default now()',
    "source text not null default 'protected_admin'",
    'created_at timestamptz not null default now()',
  ]) {
    assert.ok(sql.includes(column), `Missing metadata-only column: ${column}`);
  }
  for (const forbidden of [
    'customer_name',
    'customer_email',
    'customer_phone',
    'customer_message',
    'message_details',
    'internal_notes',
    'freeform_notes',
    'operator_notes',
    'notes text',
    'csv_content',
    'packet_json',
    'raw_payload',
    'hubspot_contact_id',
    'hubspot_deal_id',
    'hubspot_import_job_id',
    'provider_response',
    'provider_token',
    'authorization',
    'auth_session',
    'session_id',
    'session text',
    'headers json',
    'headers jsonb',
    'cookies json',
    'cookies jsonb',
    'crm_last_sync_attempt_at',
  ]) {
    assert.doesNotMatch(sql, new RegExp(forbidden));
  }

  assert.match(
    sql,
    /constraint quote_crm_handoff_manual_import_outcomes_manifest_workspace_fkey foreign key \(manifest_id, workspace_id\) references public\.quote_crm_handoff_packet_manifests \(id, workspace_id\) on delete cascade/,
  );
  assert.match(
    sql,
    /constraint quote_crm_handoff_manual_import_outcomes_provider_check check \(provider = 'hubspot'\)/,
  );
  assert.match(
    sql,
    /constraint quote_crm_handoff_manual_import_outcomes_packet_kind_check check \(packet_kind = 'hubspot_import_csv'\)/,
  );
  for (const status of [
    'manual_import_reviewed',
    'manual_import_completed_outside_skr',
    'manual_import_rejected_needs_correction',
    'manual_import_partial_needs_follow_up',
  ]) {
    assert.match(sql, new RegExp(`'${status}'`));
  }
  assert.match(
    sql,
    /alter table public\.quote_crm_handoff_manual_import_outcomes enable row level security;/,
  );
  assert.match(
    sql,
    /revoke all on table public\.quote_crm_handoff_manual_import_outcomes from public;/,
  );
  assert.match(
    sql,
    /revoke all on table public\.quote_crm_handoff_manual_import_outcomes from anon;/,
  );
  assert.match(
    sql,
    /revoke update, delete on table public\.quote_crm_handoff_manual_import_outcomes from authenticated;/,
  );
  assert.match(
    sql,
    /grant select, insert on public\.quote_crm_handoff_manual_import_outcomes to authenticated;/,
  );
  assert.match(
    sql,
    /create policy quote_crm_handoff_manual_import_outcomes_quote_admin_select on public\.quote_crm_handoff_manual_import_outcomes for select to authenticated using \(public\.is_workspace_quote_manager\(workspace_id\)\);/,
  );
  assert.match(
    sql,
    /create policy quote_crm_handoff_manual_import_outcomes_quote_admin_insert on public\.quote_crm_handoff_manual_import_outcomes for insert to authenticated with check/,
  );
  assert.match(sql, /public\.is_workspace_quote_manager\(workspace_id\)/);
  assert.match(
    sql,
    /recorded_by_admin_user_id = public\.current_quote_admin_user_id\(workspace_id\)/,
  );
  assert.match(sql, /provider = 'hubspot'/);
  assert.match(sql, /packet_kind = 'hubspot_import_csv'/);
  assert.match(sql, /source = 'protected_admin'/);
  assert.match(
    sql,
    /exists \( select 1 from public\.quote_crm_handoff_packet_manifests manifest where manifest\.id = public\.quote_crm_handoff_manual_import_outcomes\.manifest_id and manifest\.workspace_id = public\.quote_crm_handoff_manual_import_outcomes\.workspace_id and manifest\.provider = 'hubspot' and manifest\.packet_kind = 'hubspot_import_csv' and manifest\.status_filter = 'queued' and manifest\.record_count = public\.quote_crm_handoff_manual_import_outcomes\.record_count and manifest\.request_ids = public\.quote_crm_handoff_manual_import_outcomes\.request_ids \)/,
  );
  for (const ambiguousManifestComparison of [
    /manifest\.workspace_id = workspace_id/,
    /manifest\.record_count = record_count/,
    /manifest\.request_ids = request_ids/,
  ]) {
    assert.doesNotMatch(sql, ambiguousManifestComparison);
  }
  assert.doesNotMatch(
    sql,
    /on public\.quote_crm_handoff_manual_import_outcomes for update to authenticated/,
  );
  assert.doesNotMatch(
    sql,
    /on public\.quote_crm_handoff_manual_import_outcomes for delete to authenticated/,
  );
  assert.doesNotMatch(migration, /hubapi|hubspot api|n8n|webhook|smtp|resend|google workspace/i);
  assert.doesNotMatch(migration, /checkout|payment|purchase|booking|reservation|order/i);
});

test('real migrations add quote email delivery log as append-only technical metadata', () => {
  const migrationFileName =
    '20260703010000_quote_email_delivery_log_foundation.sql';
  const migration = readRealMigration(migrationFileName);
  const sql = normalizeSql(migration);

  assert.match(
    sql,
    /create table if not exists public\.quote_email_delivery_log \(/,
  );
  for (const column of [
    'id uuid primary key default gen_random_uuid()',
    'workspace_id uuid not null',
    'quote_request_id uuid not null',
    'public_reference text not null',
    'attempted_at timestamptz not null default now()',
    'recipient_email_redacted text',
    'provider text not null',
    'delivery_status text not null',
    'provider_message_id text',
    'error_code text',
    'request_id text not null',
    'created_at timestamptz not null default now()',
  ]) {
    assert.ok(sql.includes(column), `Missing delivery log metadata column: ${column}`);
  }
  for (const forbidden of [
    'customer_name',
    'customer_email text',
    'customer_phone',
    'customer_message',
    'message_details',
    'internal_notes',
    'operator_notes',
    'notes text',
    'line_items',
    'item_details',
    'email_body',
    'email_html',
    'raw_payload',
    'provider_response',
    'provider_error',
    'provider_token',
    'authorization',
    'auth_session',
    'session_id',
    'headers json',
    'headers jsonb',
    'cookies json',
    'cookies jsonb',
    'api_key',
  ]) {
    assert.doesNotMatch(sql, new RegExp(forbidden));
  }

  assert.match(
    sql,
    /constraint quote_email_delivery_log_quote_request_workspace_id_fkey foreign key \(quote_request_id, workspace_id\) references public\.quote_requests \(id, workspace_id\) on delete cascade/,
  );
  assert.match(
    sql,
    /constraint quote_email_delivery_log_provider_check check \(provider = 'resend'\)/,
  );
  assert.match(
    sql,
    /constraint quote_email_delivery_log_delivery_status_check check \(delivery_status in \('sent', 'failed', 'not_configured'\)\)/,
  );
  assert.match(
    sql,
    /alter table public\.quote_email_delivery_log enable row level security;/,
  );
  assert.match(
    sql,
    /revoke all on table public\.quote_email_delivery_log from public;/,
  );
  assert.match(
    sql,
    /revoke all on table public\.quote_email_delivery_log from anon;/,
  );
  assert.match(
    sql,
    /revoke all on table public\.quote_email_delivery_log from authenticated;/,
  );
  assert.match(
    sql,
    /grant insert \( workspace_id, quote_request_id, public_reference, recipient_email_redacted, provider, delivery_status, provider_message_id, error_code, request_id \) on public\.quote_email_delivery_log to anon;/,
  );
  assert.match(
    sql,
    /grant select \( id, workspace_id, quote_request_id, public_reference, attempted_at, recipient_email_redacted, provider, delivery_status, provider_message_id, error_code, request_id \) on public\.quote_email_delivery_log to authenticated;/,
  );
  assert.match(
    sql,
    /create policy quote_email_delivery_log_public_insert_website_quote on public\.quote_email_delivery_log for insert to anon with check \( public\.is_public_website_quote_request\(quote_request_id, workspace_id\) and provider = 'resend' and delivery_status in \('sent', 'failed', 'not_configured'\) \);/,
  );
  assert.match(
    sql,
    /create policy quote_email_delivery_log_member_read on public\.quote_email_delivery_log for select to authenticated using \(public\.is_workspace_member\(workspace_id\)\);/,
  );
  assert.doesNotMatch(
    sql,
    /on public\.quote_email_delivery_log for update/,
  );
  assert.doesNotMatch(
    sql,
    /on public\.quote_email_delivery_log for delete/,
  );
  assert.doesNotMatch(migration, /hubapi|hubspot api|n8n|webhook|smtp|google workspace/i);
  assert.doesNotMatch(migration, /checkout|payment|purchase|booking|reservation/i);
});

test('real migrations add workspace-scoped homepage hero content with protected admin writes', () => {
  const migrationFileName =
    '20260703100000_homepage_hero_content_foundation.sql';
  const migration = readRealMigration(migrationFileName);
  const sql = normalizeSql(migration);

  assert.match(sql, /create table if not exists public\.homepage_hero_content \(/);
  for (const column of [
    'workspace_id uuid primary key',
    'eyebrow text not null default',
    'headline text not null',
    'body text not null',
    'primary_cta_label text not null',
    'primary_cta_href text not null',
    'secondary_cta_label text not null',
    'secondary_cta_href text not null',
    'image_url text not null',
    'image_alt text not null',
    'is_enabled boolean not null default false',
    'updated_at timestamptz not null default now()',
    'updated_by uuid',
  ]) {
    assert.ok(sql.includes(column), `Missing homepage hero column: ${column}`);
  }

  assert.match(
    sql,
    /constraint homepage_hero_content_workspace_id_fkey foreign key \(workspace_id\) references public\.workspaces \(id\) on delete cascade/,
  );
  assert.match(
    sql,
    /alter table public\.homepage_hero_content enable row level security;/,
  );
  assert.match(sql, /revoke all on table public\.homepage_hero_content from public;/);
  assert.match(sql, /revoke all on table public\.homepage_hero_content from anon;/);
  assert.match(
    sql,
    /revoke all on table public\.homepage_hero_content from authenticated;/,
  );
  assert.match(
    sql,
    /grant select \( workspace_id, eyebrow, headline, body, primary_cta_label, primary_cta_href, secondary_cta_label, secondary_cta_href, image_url, image_alt, is_enabled, updated_at, updated_by \) on public\.homepage_hero_content to authenticated;/,
  );
  assert.doesNotMatch(
    sql,
    /grant select [^;]* on public\.homepage_hero_content to anon\b/,
  );
  assert.doesNotMatch(
    sql,
    /create policy [^;]* on public\.homepage_hero_content for select to anon\b/,
  );
  assert.match(
    sql,
    /create policy homepage_hero_content_admin_select on public\.homepage_hero_content for select to authenticated using \(public\.is_workspace_product_manager\(workspace_id\)\);/,
  );
  assert.match(
    sql,
    /create or replace function public\.get_public_homepage_hero\( expected_workspace_id uuid \)/,
  );
  const publicHeroRpcSql =
    sql.match(
      /create or replace function public\.get_public_homepage_hero\( expected_workspace_id uuid \).*?\$\$;/,
    )?.[0] ?? '';
  const publicHeroReturnColumns =
    publicHeroRpcSql.match(/returns table \( (?<columns>.*?) \) language sql/)?.groups
      ?.columns ?? '';
  assert.match(publicHeroRpcSql, /returns table \( eyebrow text, headline text, body text, primary_cta_label text, primary_cta_href text, secondary_cta_label text, secondary_cta_href text, image_url text, image_alt text \)/);
  assert.match(publicHeroRpcSql, /security definer/);
  assert.match(publicHeroRpcSql, /set search_path = public/);
  assert.match(publicHeroRpcSql, /where h\.workspace_id = expected_workspace_id and h\.is_enabled = true/);
  assert.doesNotMatch(publicHeroReturnColumns, /\bworkspace_id\b|\bupdated_by\b|\bupdated_at\b|\bis_enabled\b/);
  assert.doesNotMatch(publicHeroRpcSql, /\bupdated_by\b/);
  assert.match(
    sql,
    /grant execute on function public\.get_public_homepage_hero\(uuid\) to anon, authenticated;/,
  );
  assert.match(
    sql,
    /create or replace function public\.execute_admin_homepage_hero_write\( p_workspace_id uuid, p_payload jsonb \)/,
  );
  assert.match(sql, /security definer/);
  assert.match(sql, /v_actor_id := public\.current_product_admin_user_id\(p_workspace_id\);/);
  assert.match(
    sql,
    /grant execute on function public\.execute_admin_homepage_hero_write\(uuid, jsonb\) to authenticated;/,
  );
  assert.doesNotMatch(
    sql,
    /grant execute on function public\.execute_admin_homepage_hero_write\(uuid, jsonb\) to anon/,
  );
  assert.doesNotMatch(
    sql,
    /grant (insert|update|delete).*on public\.homepage_hero_content to (anon|authenticated)/,
  );
  assert.doesNotMatch(
    sql,
    /create policy [^;]* on public\.homepage_hero_content for (insert|update|delete|all) to anon/,
  );
  assert.doesNotMatch(
    sql,
    /create policy [^;]* on public\.homepage_hero_content for (insert|update|delete|all) to authenticated/,
  );
  assert.doesNotMatch(migration, /SUPABASE_SERVICE_ROLE|NEXT_PUBLIC|chat-config/i);
  assert.doesNotMatch(migration, /hubapi|hubspot api|n8n|pinecone|webhook|smtp|resend/i);
  assert.doesNotMatch(migration, /checkout|payment|purchase|booking|reservation/i);
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
