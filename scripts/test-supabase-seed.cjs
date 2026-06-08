const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const migrationsDir = path.join(repoRoot, 'supabase', 'migrations');
const seedFile = path.join(repoRoot, 'supabase', 'seeds', 'sample_catalogue.sql');
const dockerImage = process.env.SUPABASE_SEED_DB_IMAGE || 'postgres:16-alpine';
const containerName =
  process.env.SUPABASE_SEED_CONTAINER_NAME ||
  `spacekonceptrental-seed-test-${process.pid}-${Date.now()}`;
const keepContainer = process.env.SUPABASE_SEED_KEEP_DB === '1';
const dockerConfigDir = fs.mkdtempSync(
  path.join(os.tmpdir(), 'spacekonceptrental-docker-config-'),
);

const checks = [];
const allowedSeedTables = ['workspaces', 'categories', 'products', 'product_images'];
const forbiddenDataTables = [
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

function check(name, fn) {
  checks.push({ name, fn });
}

function assertSafeContainerName(name) {
  assert.match(
    name,
    /^spacekonceptrental-seed-test-[A-Za-z0-9_.-]+$/,
    'Refusing to manage a Docker container without the spacekonceptrental-seed-test- prefix.',
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

// Test-only Supabase auth/storage shim. Production migrations and seed files must not define these.
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

function setupPublicCatalogueConfig() {
  psql(`
    insert into public.catalogue_public_workspace_config (
      id,
      active_workspace_id,
      is_enabled
    ) values (
      true,
      '11111111-1111-4111-8111-111111111111',
      true
    )
    on conflict (id) do update
    set
      active_workspace_id = excluded.active_workspace_id,
      is_enabled = excluded.is_enabled;
  `);
}

function roleSql(role, sql) {
  assert.ok(role === 'anon' || role === 'authenticated', `Unexpected role: ${role}`);

  return `
    begin;
    set local role ${role};
    set local "request.jwt.claim.role" = '${role}';
    set local "request.jwt.claim.sub" = '';
    ${sql.trim().replace(/;?\s*$/, ';')}
    rollback;
  `;
}

function scalar(sql) {
  return psql(sql).trim();
}

function scalarAs(role, sql) {
  return psql(roleSql(role, sql)).trim();
}

function readSeedSql() {
  assert.ok(fs.existsSync(seedFile), `Seed fixture does not exist: ${seedFile}`);
  return fs.readFileSync(seedFile, 'utf8').replace(/^\uFEFF/, '');
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
          /\.rpc\(["']get_public_catalogue["']/,
          `${relativePath} must read catalogue data through the approved RPC.`,
        );
        assert.match(
          content,
          /\bexpected_workspace_id\b/,
          `${relativePath} must pass the expected workspace id to the catalogue RPC.`,
        );
        assert.match(
          content,
          /\bproduct_slug\b/,
          `${relativePath} must keep product slug filtering inside the catalogue RPC.`,
        );
        assert.doesNotMatch(
          content,
          /\.from\(["'](?:categories|products|product_images)["']\)/,
          `${relativePath} must not read catalogue base tables directly.`,
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

function assertSeedContentIsSafe() {
  const content = readSeedSql();
  const strippedComments = content.replace(/--.*$/gm, '');
  const insertTargets = [...strippedComments.matchAll(/\binsert\s+into\s+public\.([a-z_]+)/gi)].map(
    (match) => match[1],
  );
  const uniqueTargets = [...new Set(insertTargets)].sort();

  assert.deepEqual(
    uniqueTargets,
    allowedSeedTables.slice().sort(),
    'Seed SQL may only insert catalogue fixture tables.',
  );

  const blockedPatterns = [
    ['.env reference', /(^|[^A-Za-z0-9_])\.env(?:\.[A-Za-z0-9_-]+)?([^A-Za-z0-9_]|$)/i],
    ['NEXT_PUBLIC variable', /\bNEXT_PUBLIC_[A-Z0-9_]+\b/i],
    ['service-role key reference', /\b(?:SUPABASE_SERVICE_ROLE_KEY|service_role_key|service-role key|service role key)\b/i],
    ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/i],
    ['sk-prefixed secret', /\bsk-[A-Za-z0-9_-]{20,}\b/],
    ['Bearer token', /\bBearer\s+[A-Za-z0-9._-]{20,}\b/i],
    ['JWT-looking token', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
    ['hardcoded webhook URL', /https?:\/\/[^\s"'`<>]+\/webhook(?:-test)?\//i],
    ['storage object write', /\bstorage\.objects\b/i],
    ['Supabase Storage bucket operation', /\bcreate\s+(?:bucket|policy)\b/i],
    ['quote request insert', /\binsert\s+into\s+public\.quote_requests\b/i],
    ['conversation insert', /\binsert\s+into\s+public\.conversations\b/i],
    ['admin user insert', /\binsert\s+into\s+public\.admin_users\b/i],
    ['membership insert', /\binsert\s+into\s+public\.memberships\b/i],
  ];

  for (const [label, pattern] of blockedPatterns) {
    assert.doesNotMatch(content, pattern, `Seed SQL contains blocked content: ${label}`);
  }
}

check('seed SQL is limited to safe fake catalogue fixture tables', () => {
  assertSeedContentIsSafe();
});

check('seed SQL applies cleanly after committed migrations', () => {
  assert.equal(scalar('select count(*)::text from public.workspaces'), '2');
  assert.equal(scalar('select count(*)::text from public.categories'), '4');
  assert.equal(scalar('select count(*)::text from public.products'), '4');
  assert.equal(scalar('select count(*)::text from public.product_images'), '4');
});

check('seed data keeps non-catalogue tables empty', () => {
  for (const table of forbiddenDataTables) {
    assert.equal(
      scalar(`select count(*)::text from public.${table}`),
      '0',
      `Seed must not populate ${table}`,
    );
  }
});

check('seed data respects workspace-safe foreign keys', () => {
  assert.equal(
    scalar(`
      select count(*)::text
      from public.products p
      left join public.categories c
        on c.id = p.category_id
       and c.workspace_id = p.workspace_id
      where p.category_id is not null
        and c.id is null
    `),
    '0',
    'Products must reference categories in the same workspace.',
  );

  assert.equal(
    scalar(`
      select count(*)::text
      from public.product_images pi
      left join public.products p
        on p.id = pi.product_id
       and p.workspace_id = pi.workspace_id
      where p.id is null
    `),
    '0',
    'Product images must reference products in the same workspace.',
  );
});

check('anonymous users see only published catalogue seed rows', () => {
  const catalogue = JSON.parse(
    scalarAs(
      'anon',
      `
        select public.get_public_catalogue(
          '11111111-1111-4111-8111-111111111111',
          null
        )::text
      `,
    ),
  );

  assert.deepEqual(
    catalogue.categories.map((category) => category.slug),
    ['lounge-seating', 'banquet-tables'],
  );

  assert.deepEqual(
    catalogue.products.map((product) => product.slug),
    ['modular-lounge-set', 'banquet-table-pair'],
  );

  assert.deepEqual(
    catalogue.products.flatMap((product) =>
      product.product_images.map((image) => image.storage_path),
    ),
    [
      'sample-fixtures/modular-lounge-set-main.jpg',
      'sample-fixtures/banquet-table-pair-main.jpg',
    ],
  );
});

check('anonymous users cannot read catalogue base tables directly', () => {
  assert.equal(
    scalarAs('anon', 'select count(*)::text from public.categories'),
    '0',
  );

  assert.equal(
    scalarAs('anon', 'select count(*)::text from public.products'),
    '0',
  );

  assert.equal(
    scalarAs('anon', 'select count(*)::text from public.product_images'),
    '0',
  );
});

check('anonymous users cannot see draft/unpublished seed rows', () => {
  assert.equal(
    scalarAs(
      'anon',
      "select count(*)::text from public.categories where slug = 'draft-concepts'",
    ),
    '0',
  );

  assert.equal(
    scalarAs(
      'anon',
      "select count(*)::text from public.products where slug = 'concept-backdrop-frame'",
    ),
    '0',
  );

  assert.equal(
    scalarAs(
      'anon',
      "select count(*)::text from public.product_images where storage_path like 'sample-fixtures/draft/%'",
    ),
    '0',
  );
});

check('seed image rows are metadata-only sample paths', () => {
  assert.equal(
    scalar(`
      select count(*)::text
      from public.product_images
      where storage_bucket <> 'sample-catalogue-public'
         or storage_path !~ '^sample-fixtures/'
         or storage_path ~ '^https?://'
    `),
    '0',
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

  console.log(`Starting local-only seed test database (${dockerImage})...`);
  docker(['rm', '-f', containerName], { check: false });
  docker([
    'run',
    '--rm',
    '--name',
    containerName,
    '--label',
    'spacekonceptrental.seed-test=true',
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
    runSqlFile(seedFile);
    setupPublicCatalogueConfig();
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
