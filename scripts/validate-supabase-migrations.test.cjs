const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const {
  anonymousPublicSecurityDefinerAllowlist,
  authenticatedPublicSecurityDefinerAllowlist,
  preRecipePublicSecurityDefinerSignatures,
  platformManagedPublicSecurityDefinerSignatures,
  preMigrationPublicSecurityDefinerSignatures,
  privatePolicyHelperGrants,
  serviceRolePublicSecurityDefinerAllowlist,
} = require('./security-definer-privilege-contract.cjs');
const {
  enumerateDestructiveStatements,
  maskSqlCommentsAndStringLiterals,
  normalizeSqlStatement,
  validateDestructiveStatements,
} = require('./validate-supabase-migrations.cjs');

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

const setupRecipeMigrationFileName =
  '20260730100000_setup_recipe_database_authority.sql';
const setupRecipeRemoveDelete = `
  delete from public.setup_recipes r
  where r.workspace_id = p_expected_workspace_id
    and r.setup_product_id = p_setup_product_id;
`;
const setupRecipeReplaceItemsDelete = `
  delete from public.setup_recipe_items i
  where i.workspace_id = p_expected_workspace_id
    and i.setup_product_id = p_setup_product_id;
`;

function customDestructiveAllowlist(fileName, entries) {
  return entries.map(({ occurrenceId, statementClass = 'DELETE', statement }) => ({
    occurrenceId,
    fileName,
    label: 'destructive SQL statement',
    statementClass,
    statement,
  }));
}

function destructiveViolations(sql, allowlist = []) {
  return validateDestructiveStatements(
    '20260526143000_validator_fixture.sql',
    sql,
    allowlist,
  );
}

function executableBodySql({
  declaration = 'create function public.example() returns void language plpgsql',
  asClause = 'as',
  delimiter = '$$',
  body = 'begin delete from public.messages; end;',
  closingDelimiter = delimiter,
} = {}) {
  return `${declaration}\n${asClause} ${delimiter}\n${body}\n${closingDelimiter};`;
}

function doLanguageBodySql({
  prefix = 'DO LANGUAGE plpgsql',
  delimiter = '$$',
  body = 'begin drop schema tenant_private cascade; end;',
  closingDelimiter = delimiter,
  postCodeClause = '',
} = {}) {
  return `${prefix} ${delimiter}\n${body}\n${closingDelimiter}${postCodeClause};`;
}

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

const proceduralDynamicSqlPolicy =
  'Procedural dynamic SQL is not permitted in reviewed migrations.';

const proceduralDynamicExecutionFixtures = [
  {
    name: 'standard string EXECUTE',
    statementClass: 'EXECUTE',
    sql: "DO $body$ BEGIN EXECUTE 'SELECT 1'; END $body$;",
  },
  {
    name: 'escape string EXECUTE',
    statementClass: 'EXECUTE',
    sql: "DO $body$ BEGIN EXECUTE E'SELECT\\n1'; END $body$;",
  },
  {
    name: 'Unicode string EXECUTE',
    statementClass: 'EXECUTE',
    sql: "DO $body$ BEGIN EXECUTE U&'SELECT 1'; END $body$;",
  },
  {
    name: 'dollar string EXECUTE',
    statementClass: 'EXECUTE',
    sql: 'DO $body$ BEGIN EXECUTE $sql$SELECT 1$sql$; END $body$;',
  },
  {
    name: 'adjacent string EXECUTE',
    statementClass: 'EXECUTE',
    sql: "DO $body$ BEGIN EXECUTE 'SELECT ' \n '1'; END $body$;",
  },
  {
    name: 'concatenated EXECUTE with quote functions',
    statementClass: 'EXECUTE',
    sql: `
      DO $body$
      DECLARE target_name text := 'messages';
      BEGIN
        EXECUTE 'SELECT ' || quote_ident(target_name)
          || quote_literal('value') || quote_nullable(null);
      END
      $body$;
    `,
  },
  {
    name: 'format function EXECUTE with cast and conditional expression',
    statementClass: 'EXECUTE',
    sql: `
      DO $body$
      DECLARE target_name text := 'messages';
      BEGIN
        EXECUTE (
          CASE WHEN target_name IS NULL
            THEN format('SELECT 1')
            ELSE format('SELECT * FROM %I', target_name::text)
          END
        );
      END
      $body$;
    `,
  },
  {
    name: 'variable EXECUTE with INTO STRICT and USING',
    statementClass: 'EXECUTE',
    sql: `
      DO $body$
      DECLARE command_variable text := 'SELECT $1'; result_value integer;
      BEGIN
        EXECUTE command_variable
          INTO STRICT result_value
          USING 1;
      END
      $body$;
    `,
  },
  {
    name: 'RETURN QUERY EXECUTE parameter',
    statementClass: 'RETURN QUERY EXECUTE',
    sql: `
      CREATE FUNCTION public.run33_return_query(command_variable text)
      RETURNS SETOF integer
      LANGUAGE plpgsql
      AS $body$
      BEGIN
        RETURN QUERY EXECUTE command_variable USING 1;
      END
      $body$;
    `,
  },
  {
    name: 'labelled FOR IN EXECUTE loop',
    statementClass: 'FOR IN EXECUTE',
    sql: `
      DO $body$
      DECLARE row_value record; command_variable text := 'SELECT 1';
      BEGIN
        <<dynamic_rows>>
        FOR row_value IN EXECUTE command_variable USING 1 LOOP
          NULL;
        END LOOP dynamic_rows;
      END
      $body$;
    `,
  },
  {
    name: 'OPEN FOR EXECUTE function call',
    statementClass: 'OPEN FOR EXECUTE',
    sql: `
      DO $body$
      DECLARE cursor_name refcursor; command_variable text := 'SELECT 1';
      BEGIN
        OPEN cursor_name NO SCROLL
          FOR EXECUTE command_variable USING 1;
      END
      $body$;
    `,
  },
];

const historicalDynamicSqlFileName =
  '20260721190000_platform_rls_auto_enable_privilege_hardening.sql';
const historicalDynamicSqlPath = path.join(
  realMigrationsDir,
  historicalDynamicSqlFileName,
);

function historicalDynamicSqlValidation({
  content,
  fileName = historicalDynamicSqlFileName,
  migrationPath = historicalDynamicSqlPath,
  rawContent = content,
}) {
  const state = {
    historicalExceptionCount: 0,
    unapprovedOccurrenceCount: 0,
  };
  const violations = validateDestructiveStatements(
    fileName,
    content,
    [],
    {
      migrationPath,
      rawContent,
      proceduralDynamicSqlState: state,
    },
  );
  return { state, violations };
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

function normalizeFunctionSignature(signature) {
  return signature.replace(/\s+/g, '').toLowerCase();
}

function functionAclStatements(sql, action) {
  const direction = action === 'grant' ? 'to' : 'from';
  const pattern = new RegExp(
    `${action}\\s+execute\\s+on\\s+function\\s+([a-z0-9_.]+\\s*\\([^;]*?\\))\\s+${direction}\\s+([^;]+);`,
    'gi',
  );
  const statements = new Map();

  for (const match of sql.matchAll(pattern)) {
    const signature = normalizeFunctionSignature(match[1]);
    const roles = match[2]
      .split(',')
      .map((role) => role.trim().toLowerCase())
      .filter(Boolean);
    const existing = statements.get(signature) ?? new Set();

    for (const role of roles) {
      existing.add(role);
    }
    statements.set(signature, existing);
  }

  return statements;
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

test('one explicitly allowlisted DELETE occurrence passes', () => {
  const allowlist = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [{
      occurrenceId: 'one-bounded-delete',
      statement: setupRecipeRemoveDelete,
    }],
  );

  assert.deepEqual(destructiveViolations(setupRecipeRemoveDelete, allowlist), []);
});

test('an allowlisted DELETE followed by an unreviewed DELETE fails', () => {
  const root = makeTempRoot();
  const migrationsDir = writeMigration(
    root,
    setupRecipeMigrationFileName,
    `
      ${setupRecipeRemoveDelete}
      delete from public.messages;
    `,
  );

  const result = runValidator(migrationsDir);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /DELETE destructive SQL statement/i);
  assert.match(result.stderr, /:\d+: DELETE destructive SQL statement/i);
});

test('an unreviewed DELETE followed by an allowlisted DELETE fails', () => {
  const root = makeTempRoot();
  const migrationsDir = writeMigration(
    root,
    setupRecipeMigrationFileName,
    `
      delete from public.messages;
      ${setupRecipeRemoveDelete}
    `,
  );

  const result = runValidator(migrationsDir);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /DELETE destructive SQL statement/i);
  assert.match(result.stderr, /:1:/);
});

test('multiple DELETE occurrences pass only when every occurrence is explicitly allowlisted', () => {
  const root = makeTempRoot();
  const migrationsDir = writeMigration(
    root,
    setupRecipeMigrationFileName,
    `
      ${setupRecipeRemoveDelete}
      ${setupRecipeReplaceItemsDelete}
    `,
  );

  const result = runValidator(migrationsDir);

  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('mixed destructive statement classes fail when any occurrence is unapproved', () => {
  const root = makeTempRoot();
  const migrationsDir = writeMigration(
    root,
    setupRecipeMigrationFileName,
    `
      ${setupRecipeRemoveDelete}
      truncate table public.messages;
      drop table public.audit_logs;
    `,
  );

  const result = runValidator(migrationsDir);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /TRUNCATE destructive SQL statement/i);
  assert.match(result.stderr, /DROP TABLE destructive SQL statement/i);
});

test('bounded DELETE followed by unbounded DELETE on the same table fails the second occurrence', () => {
  const statement = 'delete from public.setup_recipes r where r.workspace_id = p_workspace_id;';
  const allowlist = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [{ occurrenceId: 'bounded-delete', statement }],
  );
  const violations = destructiveViolations(
    `${statement}\ndelete from public.setup_recipes;`,
    allowlist,
  );

  assert.equal(
    violations.filter((violation) => /not exactly allowlisted/.test(violation)).length,
    1,
  );
  assert.match(violations.join('\n'), /:2: DELETE destructive SQL statement/);
});

test('unbounded DELETE followed by bounded DELETE on the same table fails the first occurrence', () => {
  const statement = 'delete from public.setup_recipes r where r.workspace_id = p_workspace_id;';
  const allowlist = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [{ occurrenceId: 'bounded-delete', statement }],
  );
  const violations = destructiveViolations(
    `delete from public.setup_recipes;\n${statement}`,
    allowlist,
  );

  assert.match(violations.join('\n'), /:1: DELETE destructive SQL statement/);
  assert.doesNotMatch(
    violations.join('\n'),
    /bounded-delete was not found/,
  );
});

test('two identical DELETE occurrences fail when only one occurrence is allowlisted', () => {
  const statement = 'delete from public.setup_recipes where workspace_id = p_workspace_id;';
  const allowlist = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [{ occurrenceId: 'only-approved-occurrence', statement }],
  );
  const violations = destructiveViolations(`${statement}\n${statement}`, allowlist);

  assert.equal(
    violations.filter((violation) => /not exactly allowlisted/.test(violation)).length,
    1,
  );
});

test('two identical DELETE occurrences pass only with two unique allowlist entries', () => {
  const statement = 'delete from public.setup_recipes where workspace_id = p_workspace_id;';
  const allowlist = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [
      { occurrenceId: 'first-approved-occurrence', statement },
      { occurrenceId: 'second-approved-occurrence', statement },
    ],
  );
  const violations = destructiveViolations(`${statement}\n${statement}`, allowlist);

  assert.deepEqual(violations, []);
});

test('a missing expected allowlist occurrence fails even when another occurrence passes', () => {
  const first = 'delete from public.setup_recipes where workspace_id = p_workspace_id;';
  const second = 'delete from public.setup_recipe_items where workspace_id = p_workspace_id;';
  const allowlist = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [
      { occurrenceId: 'first-expected', statement: first },
      { occurrenceId: 'second-expected', statement: second },
    ],
  );
  const violations = destructiveViolations(first, allowlist);

  assert.match(
    violations.join('\n'),
    /second-expected was not found exactly once/,
  );
});

test('two different bounded DELETE statements on one table do not share approval', () => {
  const first = 'delete from public.setup_recipes where workspace_id = p_workspace_id;';
  const second = 'delete from public.setup_recipes where workspace_id = p_other_workspace_id;';
  const allowlist = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [{ occurrenceId: 'first-predicate', statement: first }],
  );
  const violations = destructiveViolations(`${first}\n${second}`, allowlist);

  assert.match(violations.join('\n'), /:2: DELETE destructive SQL statement/);
});

test('approved DELETE plus an unapproved DELETE on another table fails independently', () => {
  const approved = 'delete from public.setup_recipes where workspace_id = p_workspace_id;';
  const allowlist = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [{ occurrenceId: 'setup-delete', statement: approved }],
  );
  const violations = destructiveViolations(
    `${approved}\ndelete from public.messages where workspace_id = p_workspace_id;`,
    allowlist,
  );

  assert.match(violations.join('\n'), /:2: DELETE destructive SQL statement/);
});

test('approved DELETE plus unapproved TRUNCATE, DROP TABLE, or DROP SCHEMA fails each class', () => {
  const approved = 'delete from public.setup_recipes where workspace_id = p_workspace_id;';
  const allowlist = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [{ occurrenceId: 'setup-delete', statement: approved }],
  );

  for (const [statementClass, statement] of [
    ['TRUNCATE', 'truncate table public.messages;'],
    ['DROP TABLE', 'drop table public.messages;'],
    ['DROP SCHEMA', 'drop schema public cascade;'],
  ]) {
    const violations = destructiveViolations(`${approved}\n${statement}`, allowlist);
    assert.match(
      violations.join('\n'),
      new RegExp(`:2: ${statementClass} destructive SQL statement`),
    );
  }
});

test('DROP SCHEMA IF EXISTS is enumerated and rejected when unallowlisted', () => {
  const violations = destructiveViolations('drop schema if exists public cascade;');

  assert.match(violations.join('\n'), /:1: DROP SCHEMA destructive SQL statement/);
});

test('DROP SCHEMA targeting a non-public schema is enumerated and rejected', () => {
  const violations = destructiveViolations('drop schema tenant_private cascade;');

  assert.match(violations.join('\n'), /:1: DROP SCHEMA destructive SQL statement/);
});

test('DROP SCHEMA options remain material to the complete statement fingerprint', () => {
  const bare = 'drop schema public cascade;';
  const ifExists = 'drop schema if exists public cascade;';
  const allowlist = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [{ occurrenceId: 'bare-schema-drop', statementClass: 'DROP SCHEMA', statement: bare }],
  );
  const violations = destructiveViolations(ifExists, allowlist);

  assert.match(violations.join('\n'), /not exactly allowlisted/);
  assert.match(violations.join('\n'), /bare-schema-drop was not found exactly once/);
});

test('DROP SCHEMA target remains material to the complete statement fingerprint', () => {
  const publicSchema = 'drop schema public cascade;';
  const otherSchema = 'drop schema tenant_private cascade;';
  const allowlist = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [{ occurrenceId: 'public-schema-drop', statementClass: 'DROP SCHEMA', statement: publicSchema }],
  );
  const violations = destructiveViolations(otherSchema, allowlist);

  assert.match(violations.join('\n'), /not exactly allowlisted/);
  assert.match(violations.join('\n'), /public-schema-drop was not found exactly once/);
});

test('two identical DROP SCHEMA occurrences require two unique allowlist entries', () => {
  const statement = 'drop schema if exists public cascade;';
  const oneEntry = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [{ occurrenceId: 'only-schema-drop', statementClass: 'DROP SCHEMA', statement }],
  );
  const oneViolation = destructiveViolations(`${statement}\n${statement}`, oneEntry);

  assert.equal(
    oneViolation.filter((violation) => /not exactly allowlisted/.test(violation)).length,
    1,
  );

  const twoEntries = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [
      { occurrenceId: 'first-schema-drop', statementClass: 'DROP SCHEMA', statement },
      { occurrenceId: 'second-schema-drop', statementClass: 'DROP SCHEMA', statement },
    ],
  );

  assert.deepEqual(destructiveViolations(`${statement}\n${statement}`, twoEntries), []);
});

test('comments and quoted strings do not create DROP SCHEMA occurrences', () => {
  const sql = [
    '-- drop schema public cascade;',
    '/* drop schema tenant_private cascade; */',
    "select 'drop schema quoted_schema cascade;'",
    'select $data$ drop schema dollar_schema cascade; $data$;',
  ].join('\n');

  assert.deepEqual(destructiveViolations(sql), []);
});

test('formatting-only differences normalize to the same destructive statement fingerprint', () => {
  const canonical = 'delete from public.setup_recipes r where r.workspace_id = p_workspace_id and r.setup_product_id = p_setup_product_id;';
  const formatted = `
    DELETE /* formatting comment */
    FROM public.setup_recipes r
    WHERE r.workspace_id = p_workspace_id
      AND r.setup_product_id = p_setup_product_id
    ;
  `;
  const allowlist = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [{ occurrenceId: 'formatted-delete', statement: canonical }],
  );

  assert.equal(normalizeSqlStatement(formatted), normalizeSqlStatement(canonical));
  assert.deepEqual(destructiveViolations(formatted, allowlist), []);
});

test('predicate differences remain distinct destructive statement fingerprints', () => {
  const canonical = 'delete from public.setup_recipes where workspace_id = p_workspace_id;';
  const changedPredicate = 'delete from public.setup_recipes where workspace_id = p_other_workspace_id;';
  const allowlist = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [{ occurrenceId: 'predicate-delete', statement: canonical }],
  );

  assert.notEqual(
    normalizeSqlStatement(canonical),
    normalizeSqlStatement(changedPredicate),
  );
  assert.match(
    destructiveViolations(changedPredicate, allowlist).join('\n'),
    /not exactly allowlisted/,
  );
});

test('multiline DELETE statements are captured as complete occurrences', () => {
  const statement = `
    delete from public.setup_recipes r
    where r.workspace_id = p_workspace_id
      and r.setup_product_id = p_setup_product_id;
  `;
  const allowlist = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [{ occurrenceId: 'multiline-delete', statement }],
  );

  assert.deepEqual(destructiveViolations(statement, allowlist), []);
});

test('DELETE statements using a CTE are matched with the complete CTE statement', () => {
  const statement = `
    with targets as (
      select id from public.setup_recipes where workspace_id = p_workspace_id
    )
    delete from public.setup_recipes
    where id in (select id from targets);
  `;
  const allowlist = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [{ occurrenceId: 'cte-delete', statement }],
  );

  assert.deepEqual(destructiveViolations(statement, allowlist), []);
});

test('DELETE statements with aliases and USING clauses retain their material scope', () => {
  const statement = `
    delete from public.setup_recipes r
    using public.workspaces w
    where r.workspace_id = w.id
      and w.id = p_workspace_id;
  `;
  const allowlist = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [{ occurrenceId: 'using-delete', statement }],
  );

  assert.deepEqual(destructiveViolations(statement, allowlist), []);
});

test('comments and string literals do not create destructive SQL approvals or violations', () => {
  const root = makeTempRoot();
  const migrationsDir = writeMigration(
    root,
    '20260730100000_comment_and_string_literals.sql',
    `
      -- delete from public.messages;
      /* truncate table public.audit_logs; */
      select 'drop table public.products';
      select $$delete from public.messages$$;
      create table public.safe_literal_probe (id uuid primary key);
    `,
  );

  const result = runValidator(migrationsDir);

  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('untagged executable function bodies remain visible to destructive scanning', () => {
  const violations = destructiveViolations(executableBodySql());

  assert.match(violations.join('\n'), /DELETE destructive SQL statement/);
});

test('tagged executable function bodies remain visible to destructive scanning', () => {
  const violations = destructiveViolations(
    executableBodySql({ delimiter: '$body$' }),
  );

  assert.match(violations.join('\n'), /DELETE destructive SQL statement/);
});

test('a block comment between AS and an executable dollar delimiter is normalized away', () => {
  const violations = destructiveViolations(
    executableBodySql({ asClause: 'AS/* comment */' }),
  );

  assert.match(violations.join('\n'), /DELETE destructive SQL statement/);
});

test('a line comment between AS and an executable dollar delimiter is normalized away', () => {
  const violations = destructiveViolations(
    executableBodySql({ asClause: 'AS -- comment\n' }),
  );

  assert.match(violations.join('\n'), /DELETE destructive SQL statement/);
});

test('mixed-case AS and multiline executable dollar spacing are supported', () => {
  const violations = destructiveViolations(
    executableBodySql({
      asClause: 'aS\n/* multiline comment */\n',
      delimiter: '$body$',
    }),
  );

  assert.match(violations.join('\n'), /DELETE destructive SQL statement/);
});

test('untagged DO blocks remain visible to destructive scanning', () => {
  const violations = destructiveViolations(
    executableBodySql({ declaration: 'DO', asClause: '' }),
  );

  assert.match(violations.join('\n'), /DELETE destructive SQL statement/);
});

test('tagged DO blocks and comments between DO and the delimiter are supported', () => {
  const violations = destructiveViolations(
    executableBodySql({
      declaration: 'DO',
      asClause: '/* comment */',
      delimiter: '$do_body$',
    }),
  );

  assert.match(violations.join('\n'), /DELETE destructive SQL statement/);
});

// RED-to-GREEN coverage for valid pre-code DO LANGUAGE forms.
test('untagged DO LANGUAGE bodies remain visible to destructive scanning', () => {
  const violations = destructiveViolations(
    doLanguageBodySql({
      body: 'begin drop schema if exists tenant_private cascade; end;',
    }),
  );

  assert.match(violations.join('\n'), /DROP SCHEMA destructive SQL statement/);
});

test('tagged DO LANGUAGE bodies remain visible to destructive scanning', () => {
  const violations = destructiveViolations(
    doLanguageBodySql({ delimiter: '$body$' }),
  );

  assert.match(violations.join('\n'), /DROP SCHEMA destructive SQL statement/);
});

test('mixed-case DO LANGUAGE keywords are recognized', () => {
  const violations = destructiveViolations(
    doLanguageBodySql({
      prefix: 'dO lAnGuAgE plpgsql',
      delimiter: '$mixed$',
    }),
  );

  assert.match(violations.join('\n'), /DROP SCHEMA destructive SQL statement/);
});

test('multiline whitespace in DO LANGUAGE prefixes is recognized', () => {
  const violations = destructiveViolations(
    doLanguageBodySql({
      prefix: 'DO\n\tLANGUAGE\r\nplpgsql\n',
      delimiter: '$multiline$',
    }),
  );

  assert.match(violations.join('\n'), /DROP SCHEMA destructive SQL statement/);
});

test('block comments between every DO LANGUAGE prefix token are recognized', () => {
  const violations = destructiveViolations(
    doLanguageBodySql({
      prefix: 'DO/* one */LANGUAGE/* two */plpgsql/* three */',
      delimiter: '$commented$',
    }),
  );

  assert.match(violations.join('\n'), /DROP SCHEMA destructive SQL statement/);
});

test('line comments between every DO LANGUAGE prefix token are recognized', () => {
  const violations = destructiveViolations(
    doLanguageBodySql({
      prefix: 'DO -- one\nLANGUAGE -- two\nplpgsql -- three\n',
      delimiter: '$commented$',
    }),
  );

  assert.match(violations.join('\n'), /DROP SCHEMA destructive SQL statement/);
});

test('quoted DO LANGUAGE identifiers with doubled quotes are recognized', () => {
  const violations = destructiveViolations(
    doLanguageBodySql({
      prefix: 'DO LANGUAGE "pl""pgsql"',
      delimiter: '$quoted$',
    }),
  );

  assert.match(violations.join('\n'), /DROP SCHEMA destructive SQL statement/);
});

test('valid unquoted DO LANGUAGE identifier characters are recognized', () => {
  const violations = destructiveViolations(
    doLanguageBodySql({
      prefix: 'DO LANGUAGE _plpgsql2$trusted',
      delimiter: '$identifier$',
    }),
  );

  assert.match(violations.join('\n'), /DROP SCHEMA destructive SQL statement/);
});

// Positive preservation coverage around the new prefix classifier.
test('post-code LANGUAGE syntax remains supported', () => {
  const violations = destructiveViolations(
    doLanguageBodySql({
      prefix: 'DO',
      delimiter: '$post_code$',
      postCodeClause: ' LANGUAGE plpgsql',
    }),
  );

  assert.match(violations.join('\n'), /DROP SCHEMA destructive SQL statement/);
});

test('multiple DO LANGUAGE bodies are scanned independently', () => {
  const sql = [
    doLanguageBodySql({ delimiter: '$one$' }),
    doLanguageBodySql({
      prefix: 'DO LANGUAGE "plpgsql"',
      delimiter: '$two$',
    }),
  ].join('\n');
  const violations = destructiveViolations(sql);

  assert.equal(
    violations.filter((violation) => /DROP SCHEMA destructive SQL statement/.test(violation))
      .length,
    2,
  );
});

test('direct DO plus DO LANGUAGE bodies are both scanned', () => {
  const sql = [
    executableBodySql({
      declaration: 'DO',
      asClause: '',
      body: 'begin drop schema direct_schema cascade; end;',
    }),
    doLanguageBodySql({ delimiter: '$language_body$' }),
  ].join('\n');
  const violations = destructiveViolations(sql);

  assert.equal(
    violations.filter((violation) => /DROP SCHEMA destructive SQL statement/.test(violation))
      .length,
    2,
  );
});

test('DO LANGUAGE detects non-public DROP SCHEMA targets', () => {
  const violations = destructiveViolations(
    doLanguageBodySql({
      body: 'begin drop schema if exists tenant_private cascade; end;',
    }),
  );

  assert.match(violations.join('\n'), /DROP SCHEMA destructive SQL statement/);
});

test('DO LANGUAGE detects destructive classes other than DROP SCHEMA', () => {
  const violations = destructiveViolations(
    doLanguageBodySql({
      body: 'begin truncate table public.audit_logs; end;',
    }),
  );

  assert.match(violations.join('\n'), /TRUNCATE destructive SQL statement/);
});

// Negative controls: invalid prefixes and non-code dollar strings stay masked.
test('comments containing DO LANGUAGE do not authorize a dollar string', () => {
  const sql = [
    '-- DO LANGUAGE plpgsql',
    '/* DO LANGUAGE "plpgsql" */',
    'select $data$ drop schema tenant_private cascade; $data$;',
  ].join('\n');

  assert.deepEqual(destructiveViolations(sql), []);
});

test('quoted strings containing DO LANGUAGE do not authorize a dollar string', () => {
  const sql = [
    "select 'DO LANGUAGE plpgsql';",
    'select $data$ drop schema tenant_private cascade; $data$;',
  ].join('\n');

  assert.deepEqual(destructiveViolations(sql), []);
});

test('SELECT dollar strings containing destructive SQL remain ordinary strings', () => {
  const violations = destructiveViolations(
    'select $tag$ drop schema tenant_private cascade; $tag$;',
  );

  assert.deepEqual(violations, []);
});

test('DO LANGUAGE without a language name does not authorize a dollar body', () => {
  const violations = destructiveViolations(
    'DO LANGUAGE $body$ drop schema tenant_private cascade; $body$;',
  );

  assert.match(
    violations.join('\n'),
    /invalid or unsupported executable SQL body context.*failed closed/,
  );
});

test('an extra token before a DO LANGUAGE delimiter is rejected', () => {
  const violations = destructiveViolations(
    'DO LANGUAGE plpgsql SECURITY $body$ drop schema tenant_private cascade; $body$;',
  );

  assert.match(
    violations.join('\n'),
    /invalid or unsupported executable SQL body context.*failed closed/,
  );
});

test('a string constant is a valid DO LANGUAGE name', () => {
  const violations = destructiveViolations(
    "DO LANGUAGE 'plpgsql' $body$ drop schema tenant_private cascade; $body$;",
  );

  assert.match(
    violations.join('\n'),
    /DROP SCHEMA destructive SQL statement/,
  );
});

test('a qualified DO LANGUAGE name is rejected', () => {
  const violations = destructiveViolations(
    'DO LANGUAGE public.plpgsql $body$ drop schema tenant_private cascade; $body$;',
  );

  assert.match(
    violations.join('\n'),
    /invalid or unsupported executable SQL body context.*failed closed/,
  );
});

test('an expression-like DO LANGUAGE name is rejected', () => {
  const violations = destructiveViolations(
    'DO LANGUAGE plpgsql() $body$ drop schema tenant_private cascade; $body$;',
  );

  assert.match(
    violations.join('\n'),
    /invalid or unsupported executable SQL body context.*failed closed/,
  );
});

test('Unicode-escaped quoted DO LANGUAGE identifiers are recognized', () => {
  const violations = destructiveViolations(
    'DO LANGUAGE U&"plpgsql" $body$ begin delete from "messages"; end; $body$;',
  );

  assert.match(violations.join('\n'), /DELETE destructive SQL statement/);
});

test('Unicode-escaped quoted DO LANGUAGE identifiers support valid UESCAPE clauses', () => {
  const violations = destructiveViolations(
    'DO LANGUAGE U&"plpgsql" UESCAPE \'!\' $body$ begin delete from "messages"; end; $body$;',
  );

  assert.match(violations.join('\n'), /DELETE destructive SQL statement/);
});

test('escape, Unicode, and dollar string DO LANGUAGE names are recognized', () => {
  const fixtures = [
    'DO LANGUAGE E\'plpgsql\' $body$ begin delete from "messages"; end; $body$;',
    'DO LANGUAGE U&\'plpgsql\' $body$ begin delete from "messages"; end; $body$;',
    'DO LANGUAGE $lang$plpgsql$lang$ $body$ begin delete from "messages"; end; $body$;',
  ];

  for (const sql of fixtures) {
    assert.match(
      destructiveViolations(sql).join('\n'),
      /DELETE destructive SQL statement/,
      sql,
    );
  }
});

test('standard, escape, and Unicode DO string bodies are scanned as executable code', () => {
  const fixtures = [
    'DO \'BEGIN DELETE FROM "messages"; END\';',
    'DO E\'BEGIN\\n DELETE FROM "messages";\\nEND\';',
    'DO U&\'BEGIN!000a DELETE FROM "messages";!000aEND\' UESCAPE \'!\';',
  ];

  for (const sql of fixtures) {
    assert.match(
      destructiveViolations(sql).join('\n'),
      /DELETE destructive SQL statement/,
      sql,
    );
  }
});

test('escape-body byte, Unicode, and unknown escapes decode with PostgreSQL semantics', () => {
  const fixtures = [
    'DO E\'BEGIN \\x44ELETE FROM "messages"; END\';',
    'DO E\'BEGIN \\104ELETE FROM "messages"; END\';',
    'DO E\'BEGIN \\u0044ELETE FROM "messages"; END\';',
    'DO E\'BEGIN \\DELETE FROM "messages"; END\';',
  ];

  for (const sql of fixtures) {
    assert.match(
      destructiveViolations(sql).join('\n'),
      /DELETE destructive SQL statement/,
      sql,
    );
  }
});

test('Unicode-body escapes decode before destructive classification', () => {
  const fixtures = [
    'DO U&\'BEGIN \\0044ELETE FROM "messages"; END\';',
    'DO U&\'BEGIN !0044ELETE FROM "messages"; END\' UESCAPE \'!\';',
  ];

  for (const sql of fixtures) {
    assert.match(
      destructiveViolations(sql).join('\n'),
      /DELETE destructive SQL statement/,
      sql,
    );
  }
});

test('post-code LANGUAGE remains valid for single-quoted DO bodies', () => {
  const violations = destructiveViolations(
    'DO \'BEGIN DELETE FROM "messages"; END\' LANGUAGE \'plpgsql\';',
  );

  assert.match(violations.join('\n'), /DELETE destructive SQL statement/);
});

test('function standard, escape, and Unicode AS bodies are scanned', () => {
  const fixtures = [
    'CREATE FUNCTION public.f1() RETURNS void AS \'BEGIN DELETE FROM "messages"; END\' LANGUAGE plpgsql;',
    'CREATE FUNCTION public.f2() RETURNS void AS E\'BEGIN\\n DELETE FROM "messages";\\nEND\' LANGUAGE plpgsql;',
    'CREATE FUNCTION public.f3() RETURNS void AS U&\'BEGIN!000a DELETE FROM "messages";!000aEND\' UESCAPE \'!\' LANGUAGE plpgsql;',
  ];

  for (const sql of fixtures) {
    assert.match(
      destructiveViolations(sql).join('\n'),
      /DELETE destructive SQL statement/,
      sql,
    );
  }
});

test('procedure standard, escape, Unicode, and dollar AS bodies are scanned', () => {
  const fixtures = [
    'CREATE PROCEDURE public.p1() AS \'BEGIN DELETE FROM "messages"; END\' LANGUAGE plpgsql;',
    'CREATE PROCEDURE public.p2() AS E\'BEGIN\\n DELETE FROM "messages";\\nEND\' LANGUAGE plpgsql;',
    'CREATE PROCEDURE public.p3() AS U&\'BEGIN!000a DELETE FROM "messages";!000aEND\' UESCAPE \'!\' LANGUAGE plpgsql;',
    'CREATE PROCEDURE public.p4() AS $body$ BEGIN DELETE FROM "messages"; END $body$ LANGUAGE plpgsql;',
  ];

  for (const sql of fixtures) {
    assert.match(
      destructiveViolations(sql).join('\n'),
      /DELETE destructive SQL statement/,
      sql,
    );
  }
});

test('C object-file and link-symbol AS strings remain non-executable', () => {
  const violations = destructiveViolations(
    'CREATE FUNCTION public.c_probe() RETURNS void AS \'delete from messages\', \'drop_table_symbol\' LANGUAGE c;',
  );

  assert.deepEqual(violations, []);
});

test('PostgreSQL built-in C object-file and link-symbol form remains non-executable', () => {
  const violations = destructiveViolations(
    'CREATE FUNCTION public.plpgsql_handler_probe() RETURNS language_handler AS \'$libdir/plpgsql\', \'plpgsql_call_handler\' LANGUAGE c;',
  );

  assert.deepEqual(violations, []);
});

test('single C object-file AS strings remain non-executable', () => {
  const violations = destructiveViolations(
    'CREATE FUNCTION public.c_probe() RETURNS void AS \'delete from messages\' LANGUAGE c;',
  );

  assert.deepEqual(violations, []);
});

test('object-file and link-symbol pairs fail closed outside LANGUAGE c', () => {
  const violations = destructiveViolations(
    'CREATE FUNCTION public.bad_pair() RETURNS void AS \'delete from messages\', \'symbol\' LANGUAGE plpgsql;',
  );

  assert.match(
    violations.join('\n'),
    /invalid or unsupported executable SQL body context.*failed closed/,
  );
});

test('quoted and schema-qualified quoted DELETE targets are classified', () => {
  const fixtures = [
    'DELETE FROM "messages";',
    'DELETE FROM "Messages";',
    'DELETE FROM "a""b";',
    'DELETE FROM public."messages";',
    'DELETE FROM "public"."messages";',
    'DELETE FROM U&"m\\0065ssages";',
  ];

  for (const sql of fixtures) {
    assert.match(
      destructiveViolations(sql).join('\n'),
      /DELETE destructive SQL statement/,
      sql,
    );
  }
});

test('quoted destructive occurrences expose exact class, target, statement, and source offset', () => {
  const sql = 'select 1;\nDELETE FROM "public"."Messages" WHERE "id" = 1;';
  const masked = maskSqlCommentsAndStringLiterals(sql);
  const occurrences = enumerateDestructiveStatements(sql, masked);

  assert.equal(occurrences.length, 1);
  assert.equal(occurrences[0].statementClass, 'DELETE');
  assert.equal(occurrences[0].target, '"public"."Messages"');
  assert.equal(
    occurrences[0].normalizedStatement,
    'delete from "public"."Messages" where "id"=1;',
  );
  assert.equal(sql.slice(0, occurrences[0].offset).split(/\r?\n/).length, 2);
});

test('quoted targets are classified for TRUNCATE, DROP TABLE, and DROP SCHEMA', () => {
  const fixtures = [
    ['TRUNCATE', 'TRUNCATE "messages";'],
    ['DROP TABLE', 'DROP TABLE "messages";'],
    ['DROP SCHEMA', 'DROP SCHEMA "private";'],
  ];

  for (const [statementClass, sql] of fixtures) {
    assert.match(
      destructiveViolations(sql).join('\n'),
      new RegExp(`${statementClass} destructive SQL statement`),
      sql,
    );
  }
});

test('one quoted destructive target cannot authorize a different target', () => {
  const approved = 'delete from "messages";';
  const allowlist = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [{ occurrenceId: 'quoted-delete', statement: approved }],
  );

  assert.deepEqual(destructiveViolations(approved, allowlist), []);
  for (const changed of [
    'delete from "Messages";',
    'delete from "a""b";',
    'delete from "public"."messages";',
  ]) {
    const violations = destructiveViolations(changed, allowlist);
    assert.match(violations.join('\n'), /not exactly allowlisted/);
    assert.match(
      violations.join('\n'),
      /quoted-delete was not found exactly once/,
    );
  }
});

test('quoted destructive fingerprints retain complete predicates and terminators', () => {
  const approved = 'delete from "public"."messages" where "id" = 1;';
  const allowlist = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [{ occurrenceId: 'quoted-bounded-delete', statement: approved }],
  );

  assert.deepEqual(destructiveViolations(approved, allowlist), []);
  assert.match(
    destructiveViolations(
      'delete from "public"."messages" where "id" = 2;',
      allowlist,
    ).join('\n'),
    /not exactly allowlisted/,
  );
  assert.match(
    destructiveViolations(
      'delete from "public"."messages" where "id" = 1',
      allowlist,
    ).join('\n'),
    /not exactly allowlisted/,
  );
});

test('ordinary standard, escape, Unicode, and dollar data strings remain masked', () => {
  const sql = [
    'select \'delete from "messages";\';',
    'select E\'delete from "messages";\';',
    'select U&\'delete from "messages";\';',
    'select $data$ delete from "messages"; $data$;',
  ].join('\n');

  assert.deepEqual(destructiveViolations(sql), []);
});

test('comments and keyword-shaped quoted identifiers remain non-executable', () => {
  const sql = [
    '-- DO LANGUAGE plpgsql AS DELETE FROM "messages";',
    '/* CREATE FUNCTION f() AS \'DELETE FROM messages\' */',
    'select "DELETE FROM messages", "DO LANGUAGE", "DROP TABLE";',
  ].join('\n');

  assert.deepEqual(destructiveViolations(sql), []);
});

test('invalid Unicode UESCAPE forms fail closed with a fixed error', () => {
  const fixtures = [
    'DO U&\'BEGIN!000a DELETE FROM "messages";!000aEND\' UESCAPE \'0\';',
    'DO U&\'BEGIN!000a DELETE FROM "messages";!000aEND\' UESCAPE \'!!\';',
    'DO U&\'BEGIN!000a DELETE FROM "messages";!000aEND\' UESCAPE E\'!\';',
  ];

  for (const sql of fixtures) {
    assert.match(
      destructiveViolations(sql).join('\n'),
      /invalid Unicode UESCAPE clause.*failed closed/,
      sql,
    );
  }
});

test('malformed escape and Unicode body sequences fail closed', () => {
  const fixtures = [
    'DO E\'BEGIN \\x DELETE FROM "messages"; END\';',
    'DO E\'BEGIN \\u123 DELETE FROM "messages"; END\';',
    'DO U&\'BEGIN \\123 DELETE FROM "messages"; END\';',
    'DO U&\'BEGIN \\D800 DELETE FROM "messages"; END\';',
  ];

  for (const sql of fixtures) {
    assert.match(
      destructiveViolations(sql).join('\n'),
      /invalid or unsupported (?:escape string|Unicode escape) sequence.*failed closed/,
      sql,
    );
  }
});

test('nested block comments preserve structure and unterminated nesting fails closed', () => {
  const valid = [
    '/* outer /* DELETE FROM "hidden"; */ still outer */',
    'DELETE FROM "messages";',
  ].join('\n');
  const validViolations = destructiveViolations(valid);

  assert.equal(
    validViolations.filter((violation) => /DELETE destructive SQL statement/.test(violation))
      .length,
    1,
  );
  assert.match(
    destructiveViolations('/* outer /* inner */').join('\n'),
    /unterminated nested block comment.*failed closed/,
  );
});

test('unterminated standard, escape, Unicode, and dollar strings fail closed', () => {
  const fixtures = [
    ['standard', 'DO \'BEGIN DELETE FROM "messages"; END;'],
    ['escape', 'DO E\'BEGIN\\n DELETE FROM "messages";'],
    ['Unicode', 'DO U&\'BEGIN!000a DELETE FROM "messages";'],
    ['dollar', 'DO $body$ BEGIN DELETE FROM "messages"; END;'],
  ];

  for (const [kind, sql] of fixtures) {
    assert.match(
      destructiveViolations(sql).join('\n'),
      new RegExp(`unterminated ${kind}|unterminated executable`),
      sql,
    );
    assert.match(
      destructiveViolations(sql).join('\n'),
      /failed closed/,
      sql,
    );
  }
});

test('invalid and unterminated quoted identifiers fail closed', () => {
  for (const sql of [
    'delete from "";',
    'delete from "messages;',
    'delete from U&"m!0065ssages" UESCAPE \'0\';',
  ]) {
    assert.match(
      destructiveViolations(sql).join('\n'),
      /quoted identifier|UESCAPE clause/,
      sql,
    );
    assert.match(destructiveViolations(sql).join('\n'), /failed closed/, sql);
  }
});

test('cross-statement text cannot authorize a later executable body', () => {
  const sql = [
    'select \'DO LANGUAGE plpgsql\';',
    'select $data$ delete from "messages"; $data$;',
    'DO \'BEGIN DELETE FROM "messages"; END\';',
  ].join('\n');
  const violations = destructiveViolations(sql);

  assert.equal(
    violations.filter((violation) => /DELETE destructive SQL statement/.test(violation))
      .length,
    1,
  );
});

test('nested non-executable strings inside executable code stay masked', () => {
  const sql =
    'DO \'BEGIN PERFORM \'\'DELETE FROM "hidden"\'\'; DELETE FROM "visible"; END\';';
  const violations = destructiveViolations(sql);

  assert.equal(
    violations.filter((violation) => /DELETE destructive SQL statement/.test(violation))
      .length,
    1,
  );
});

test('quoted target lookalikes inside data strings stay masked', () => {
  assert.deepEqual(
    destructiveViolations(
      'select \'DELETE FROM "Messages";\', E\'TRUNCATE "messages";\', U&\'DROP TABLE "messages";\';',
    ),
    [],
  );
});

test('PostgreSQL-valid Run-31 fixtures reject through temporary migration CLI files', () => {
  const fixtures = [
    'DO LANGUAGE \'plpgsql\' $b$ BEGIN DELETE FROM "messages"; END $b$;',
    'DO LANGUAGE U&"plpgsql" $b$ BEGIN DELETE FROM "messages"; END $b$;',
    'DO LANGUAGE E\'plpgsql\' $b$ BEGIN DELETE FROM "messages"; END $b$;',
    'DO LANGUAGE U&\'plpgsql\' $b$ BEGIN DELETE FROM "messages"; END $b$;',
    'DO LANGUAGE $lang$plpgsql$lang$ $b$ BEGIN DELETE FROM "messages"; END $b$;',
    'DO \'BEGIN DELETE FROM "messages"; END\';',
    'DO E\'BEGIN\\n DELETE FROM "messages";\\nEND\';',
    'DO U&\'BEGIN!000a DELETE FROM "messages";!000aEND\' UESCAPE \'!\';',
    'CREATE FUNCTION public.f1() RETURNS void AS \'BEGIN DELETE FROM "messages"; END\' LANGUAGE plpgsql;',
    'CREATE FUNCTION public.f2() RETURNS void AS E\'BEGIN\\n DELETE FROM "messages";\\nEND\' LANGUAGE plpgsql;',
    'CREATE PROCEDURE public.p1() AS \'BEGIN DELETE FROM "messages"; END\' LANGUAGE plpgsql;',
    'DELETE FROM "messages";',
    'DO \'BEGIN DELETE FROM "Run31"."Messages"; END\';',
    'DO \'BEGIN TRUNCATE "messages"; END\';',
    'DO \'BEGIN DROP TABLE "messages"; END\';',
    'DO \'BEGIN DROP SCHEMA "Run31Drop"; END\';',
  ];

  for (const [index, sql] of fixtures.entries()) {
    const root = makeTempRoot();
    const migrationsDir = writeMigration(
      root,
      `2026073112${String(index).padStart(4, '0')}_run31_cli_fixture.sql`,
      sql,
    );
    const result = runValidator(migrationsDir);

    assert.notEqual(result.status, 0, sql);
    assert.match(
      result.stderr,
      /destructive SQL statement is not exactly allowlisted/,
      sql,
    );
  }
});

for (const fixture of proceduralDynamicExecutionFixtures) {
  test(`procedural dynamic SQL rejects ${fixture.name}`, () => {
    const masked = maskSqlCommentsAndStringLiterals(fixture.sql);
    const findings = masked.errors.filter(
      (error) => error.message.includes(proceduralDynamicSqlPolicy),
    );

    assert.equal(findings.length, 1);
    assert.equal(
      findings[0].proceduralStatementClass,
      fixture.statementClass,
    );
    assert.match(
      findings[0].executableBodyIdentity,
      /^(?:DO|CREATE FUNCTION|CREATE PROCEDURE)@\d+$/,
    );
    assert.equal(findings[0].sourceOffset, findings[0].offset);

    const violations = destructiveViolations(fixture.sql);
    assert.equal(violations.length, 1);
    assert.match(violations[0], new RegExp(proceduralDynamicSqlPolicy));
  });

  test(`procedural dynamic SQL rejects ${fixture.name} through the CLI`, () => {
    const root = makeTempRoot();
    try {
      const migrationsDir = writeMigration(
        root,
        '20260731130000_run33_dynamic_cli_fixture.sql',
        fixture.sql,
      );
      const result = runValidator(migrationsDir);

      assert.notEqual(result.status, 0);
      assert.match(result.stderr, new RegExp(proceduralDynamicSqlPolicy));
      assert.doesNotMatch(result.stdout, /result PASS/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
}

test('procedural dynamic SQL rejects nested blocks, comments, and multiline formatting', () => {
  const sql = `
    DO $body$
    DECLARE command_variable text := 'SELECT 1';
    BEGIN
      <<outer_loop>>
      LOOP
        IF true THEN
          /* bounded comment */
          EXECUTE
            command_variable;
        END IF;
        EXIT outer_loop;
      END LOOP outer_loop;
    END
    $body$;
  `;

  const findings = maskSqlCommentsAndStringLiterals(sql).errors.filter(
    (error) => error.message.includes(proceduralDynamicSqlPolicy),
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].proceduralStatementClass, 'EXECUTE');
});

test('procedural dynamic SQL recognises comments between surface keywords', () => {
  const sql = `
    CREATE FUNCTION public.run33_commented_return(command_variable text)
    RETURNS SETOF integer LANGUAGE plpgsql AS $first$
    BEGIN
      RETURN /* a */ QUERY /* b */ EXECUTE command_variable;
    END
    $first$;
    DO $second$
    DECLARE row_value record; command_variable text := 'select 1';
    BEGIN
      FOR row_value IN /* c */ EXECUTE command_variable LOOP
        NULL;
      END LOOP;
    END
    $second$;
    DO $third$
    DECLARE cursor_name refcursor; command_variable text := 'select 1';
    BEGIN
      OPEN cursor_name FOR /* d */ EXECUTE command_variable;
    END
    $third$;
  `;

  const findings = maskSqlCommentsAndStringLiterals(sql).errors.filter(
    (error) => error.message.includes(proceduralDynamicSqlPolicy),
  );
  assert.deepEqual(
    findings.map((finding) => finding.proceduralStatementClass),
    [
      'RETURN QUERY EXECUTE',
      'FOR IN EXECUTE',
      'OPEN FOR EXECUTE',
    ],
  );
});

test('procedural dynamic SQL findings bind source offsets, lines, bodies, and classes', () => {
  const sql = [
    'DO $first$',
    'BEGIN',
    '  EXECUTE first_command;',
    '  RETURN QUERY EXECUTE second_command;',
    'END',
    '$first$;',
    'DO $second$',
    'BEGIN',
    '  OPEN second_cursor FOR EXECUTE third_command;',
    'END',
    '$second$;',
  ].join('\n');

  const findings = maskSqlCommentsAndStringLiterals(sql).errors.filter(
    (error) => error.message.includes(proceduralDynamicSqlPolicy),
  );
  assert.deepEqual(
    findings.map((finding) => finding.proceduralStatementClass),
    ['EXECUTE', 'RETURN QUERY EXECUTE', 'OPEN FOR EXECUTE'],
  );
  assert.deepEqual(
    findings.map((finding) => finding.sourceOffset),
    [
      sql.indexOf('EXECUTE first_command'),
      sql.indexOf('EXECUTE second_command'),
      sql.indexOf('EXECUTE third_command'),
    ],
  );
  assert.equal(new Set(
    findings.map((finding) => finding.executableBodyIdentity),
  ).size, 2);

  const violations = destructiveViolations(sql);
  assert.match(violations[0], /fixture\.sql:3:/);
  assert.match(violations[1], /fixture\.sql:4:/);
  assert.match(violations[2], /fixture\.sql:9:/);
});

test('procedural dynamic SQL diagnostic does not expose the command expression', () => {
  const privateMarker = 'RUN33_DYNAMIC_COMMAND_EXPRESSION_MUST_NOT_APPEAR';
  const sql = `
    DO $body$
    BEGIN
      EXECUTE '${privateMarker}';
    END
    $body$;
  `;
  const root = makeTempRoot();
  try {
    const migrationsDir = writeMigration(
      root,
      '20260731130001_run33_no_expression_leak.sql',
      sql,
    );
    const result = runValidator(migrationsDir);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, new RegExp(proceduralDynamicSqlPolicy));
    assert.doesNotMatch(result.stderr, new RegExp(privateMarker));
    assert.doesNotMatch(result.stdout, new RegExp(privateMarker));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('procedural dynamic SQL controls remain non-executable data', () => {
  const controls = [
    `
      DO $body$
      BEGIN
        -- EXECUTE 'SELECT 1';
        PERFORM 'EXECUTE string data';
        PERFORM execute FROM public.messages;
        PERFORM "execute" FROM public.messages;
      END
      $body$;
    `,
    'SELECT $data$EXECUTE command_variable$data$;',
    "SELECT 'EXECUTE command_variable';",
    `
      CREATE FUNCTION public.run33_sql_control()
      RETURNS text
      LANGUAGE sql
      AS 'SELECT execute FROM public.messages';
    `,
    `
      CREATE FUNCTION public.run33_c_control()
      RETURNS void
      AS '$libdir/run33_control', 'run33_symbol'
      LANGUAGE c;
    `,
  ];

  for (const sql of controls) {
    assert.deepEqual(destructiveViolations(sql), []);
  }
});

test('an unquoted execute column in a SQL CASE expression is ordinary data', () => {
  const sql = `
    DO $$
    BEGIN
      PERFORM CASE WHEN true THEN execute ELSE 0 END
      FROM public.messages;
    END
    $$;
  `;

  assert.deepEqual(destructiveViolations(sql), []);
});

test('procedural CASE branches still reject dynamic execution', () => {
  const sql = `
    DO $$
    DECLARE
      command_variable text := 'SELECT 1';
    BEGIN
      CASE WHEN true THEN
        EXECUTE command_variable;
      ELSE
        NULL;
      END CASE;
    END
    $$;
  `;

  const violations = destructiveViolations(sql);
  assert.equal(violations.length, 1);
  assert.match(violations[0], /Procedural statement class: EXECUTE/);
});

test('a conditional command expression still rejects dynamic execution', () => {
  const sql = `
    DO $$
    BEGIN
      EXECUTE CASE WHEN true THEN 'SELECT 1' ELSE 'SELECT 2' END;
    END
    $$;
  `;

  const violations = destructiveViolations(sql);
  assert.equal(violations.length, 1);
  assert.match(violations[0], /Procedural statement class: EXECUTE/);
});

test('exact canonical historical procedural dynamic SQL exception passes', () => {
  const content = fs.readFileSync(historicalDynamicSqlPath, 'utf8');
  const result = historicalDynamicSqlValidation({ content });

  assert.deepEqual(result.violations, []);
  assert.deepEqual(result.state, {
    historicalExceptionCount: 1,
    unapprovedOccurrenceCount: 0,
  });
});

test('historical exception fingerprints match the controller contract', () => {
  const content = fs
    .readFileSync(historicalDynamicSqlPath, 'utf8')
    .replace(/\r\n/g, '\n');
  const buffer = Buffer.from(content, 'utf8');
  const blobHeader = Buffer.from(`blob ${buffer.length}\0`, 'utf8');

  assert.equal(
    crypto.createHash('sha1')
      .update(Buffer.concat([blobHeader, buffer]))
      .digest('hex'),
    '5729e7a81fbb39ee04f6e5cb37450a261e55468f',
  );
  assert.equal(
    crypto.createHash('sha256').update(content, 'utf8').digest('hex').toUpperCase(),
    '939DA4DDB6ABB1D884317E56835CAA7027B51CCD7B40BE1AB4FCB3362C73A35A',
  );
});

test('historical exception accepts only LF or equivalent CRLF content', () => {
  const canonicalLf = fs
    .readFileSync(historicalDynamicSqlPath, 'utf8')
    .replace(/\r\n/g, '\n');
  const crlf = canonicalLf.replace(/\n/g, '\r\n');

  assert.deepEqual(
    historicalDynamicSqlValidation({ content: canonicalLf }).violations,
    [],
  );
  assert.deepEqual(
    historicalDynamicSqlValidation({ content: crlf }).violations,
    [],
  );
});

test('historical exception rejects bare carriage-return content', () => {
  const content = fs
    .readFileSync(historicalDynamicSqlPath, 'utf8')
    .replace(/\r\n|\n/g, '\r');
  const result = historicalDynamicSqlValidation({ content });

  assert.equal(result.state.historicalExceptionCount, 0);
  assert.equal(result.state.unapprovedOccurrenceCount, 0);
  assert.match(
    result.violations.join('\n'),
    /immutable historical migration fingerprint mismatch/,
  );
});

test('canonical historical content under another path fails', () => {
  const content = fs.readFileSync(historicalDynamicSqlPath, 'utf8');
  const result = historicalDynamicSqlValidation({
    content,
    migrationPath: path.join(
      os.tmpdir(),
      'copied-historical-migration',
      historicalDynamicSqlFileName,
    ),
  });

  assert.equal(result.state.historicalExceptionCount, 0);
  assert.equal(result.state.unapprovedOccurrenceCount, 1);
  assert.match(result.violations.join('\n'), new RegExp(proceduralDynamicSqlPolicy));
});

test('one-byte historical canonical-content change fails', () => {
  const content = fs
    .readFileSync(historicalDynamicSqlPath, 'utf8')
    .replace('optional public', 'optional Public');
  const result = historicalDynamicSqlValidation({ content });

  assert.equal(result.state.historicalExceptionCount, 0);
  assert.equal(result.state.unapprovedOccurrenceCount, 1);
  assert.match(result.violations.join('\n'), new RegExp(proceduralDynamicSqlPolicy));
});

test('a second historical EXECUTE occurrence fails', () => {
  const content = fs
    .readFileSync(historicalDynamicSqlPath, 'utf8')
    .replace(
      '  end if;',
      "  execute 'select 1';\n  end if;",
    );
  const result = historicalDynamicSqlValidation({ content });

  assert.equal(result.state.historicalExceptionCount, 0);
  assert.equal(result.state.unapprovedOccurrenceCount, 2);
  assert.equal(
    result.violations.filter(
      (violation) => violation.includes(proceduralDynamicSqlPolicy),
    ).length,
    2,
  );
});

for (const mutation of [
  {
    name: 'changed function target',
    replace: ['public.rls_auto_enable()', 'public.other_helper()'],
  },
  {
    name: 'changed role set',
    replace: ['public, anon, authenticated, service_role', 'public, anon'],
  },
  {
    name: 'changed privilege',
    replace: ['revoke execute on function', 'revoke usage on function'],
  },
]) {
  test(`historical exception rejects ${mutation.name}`, () => {
    const canonical = fs.readFileSync(historicalDynamicSqlPath, 'utf8');
    const content = canonical.replace(...mutation.replace);
    const result = historicalDynamicSqlValidation({ content });

    assert.notEqual(content, canonical);
    assert.equal(result.state.historicalExceptionCount, 0);
    assert.equal(result.state.unapprovedOccurrenceCount, 1);
    assert.match(result.violations.join('\n'), new RegExp(proceduralDynamicSqlPolicy));
  });
}

for (const expression of [
  {
    name: 'concatenated equivalent text',
    sql: `EXECUTE 'revoke execute on function public.rls_auto_enable() ' ||
      'from public, anon, authenticated, service_role';`,
  },
  {
    name: 'format equivalent text',
    sql: `EXECUTE format('%s',
      'revoke execute on function public.rls_auto_enable() from public, anon, authenticated, service_role');`,
  },
  {
    name: 'variable-held equivalent text',
    declaration: `command_variable text :=
      'revoke execute on function public.rls_auto_enable() from public, anon, authenticated, service_role';`,
    sql: 'EXECUTE command_variable;',
  },
  {
    name: 'parameter-held equivalent text',
    sql: 'EXECUTE command_parameter;',
  },
  {
    name: 'dollar-quoted equivalent text',
    sql: 'EXECUTE $command$revoke execute on function public.rls_auto_enable() from public, anon, authenticated, service_role$command$;',
  },
  {
    name: 'escape-string equivalent text',
    sql: "EXECUTE E'revoke execute on function public.rls_auto_enable() from public, anon, authenticated, service_role';",
  },
  {
    name: 'Unicode-string equivalent text',
    sql: "EXECUTE U&'revoke execute on function public.rls_auto_enable() from public, anon, authenticated, service_role';",
  },
]) {
  test(`historical exception rejects ${expression.name}`, () => {
    const content = `
      DO $migration$
      DECLARE
        command_parameter text := 'select 1';
        ${expression.declaration ?? ''}
      BEGIN
        ${expression.sql}
      END
      $migration$;
    `;
    const result = historicalDynamicSqlValidation({ content });

    assert.equal(result.state.historicalExceptionCount, 0);
    assert.equal(result.state.unapprovedOccurrenceCount, 1);
    assert.match(result.violations.join('\n'), new RegExp(proceduralDynamicSqlPolicy));
  });
}

test('future migration containing the exact historical command fails', () => {
  const fileName = '20260801120000_future_dynamic_sql.sql';
  const content = `
    DO $body$
    BEGIN
      EXECUTE 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated, service_role';
    END
    $body$;
  `;
  const result = historicalDynamicSqlValidation({
    content,
    fileName,
    migrationPath: path.join(realMigrationsDir, fileName),
  });

  assert.equal(result.state.historicalExceptionCount, 0);
  assert.equal(result.state.unapprovedOccurrenceCount, 1);
  assert.match(result.violations.join('\n'), new RegExp(proceduralDynamicSqlPolicy));
});

test('additional destructive dynamic statement in historical content fails', () => {
  const content = fs
    .readFileSync(historicalDynamicSqlPath, 'utf8')
    .replace(
      '  end if;',
      "  execute 'drop table public.messages';\n  end if;",
    );
  const result = historicalDynamicSqlValidation({ content });

  assert.equal(result.state.historicalExceptionCount, 0);
  assert.equal(result.state.unapprovedOccurrenceCount, 2);
  assert.equal(
    result.violations.filter(
      (violation) => violation.includes(proceduralDynamicSqlPolicy),
    ).length,
    2,
  );
});

test('copied historical migration fails through the complete CLI', () => {
  const root = makeTempRoot();
  try {
    const content = fs.readFileSync(historicalDynamicSqlPath, 'utf8');
    const migrationsDir = writeMigration(
      root,
      historicalDynamicSqlFileName,
      content,
    );
    const result = runValidator(migrationsDir);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, new RegExp(proceduralDynamicSqlPolicy));
    assert.match(
      result.stderr,
      /historical_dynamic_sql_exceptions=0, unapproved_procedural_dynamic_sql_occurrences=1/,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('mismatched DO LANGUAGE dollar tags fail closed', () => {
  const violations = destructiveViolations(
    doLanguageBodySql({
      delimiter: '$expected$',
      closingDelimiter: '$other$',
    }),
  );

  assert.match(violations.join('\n'), /unterminated|lexical scan failed closed/);
});

test('unterminated DO LANGUAGE bodies fail closed', () => {
  const violations = destructiveViolations(
    'DO LANGUAGE plpgsql $body$ begin drop schema tenant_private cascade;',
  );

  assert.match(
    violations.join('\n'),
    /unterminated executable dollar-quoted body|lexical scan failed closed/,
  );
});

test('nested ordinary dollar strings inside DO LANGUAGE remain masked', () => {
  const violations = destructiveViolations(
    doLanguageBodySql({
      delimiter: '$outer$',
      body: [
        'begin',
        '  perform $inner$ drop schema hidden_schema cascade; $inner$;',
        '  drop schema visible_schema cascade;',
        'end;',
      ].join('\n'),
    }),
  );

  assert.equal(
    violations.filter((violation) => /DROP SCHEMA destructive SQL statement/.test(violation))
      .length,
    1,
  );
});

test('a prior DO statement cannot authorize a later ordinary dollar string', () => {
  const sql = [
    executableBodySql({
      declaration: 'DO',
      asClause: '',
      body: 'begin null; end;',
    }),
    'select $later$ drop schema tenant_private cascade; $later$;',
  ].join('\n');

  assert.deepEqual(destructiveViolations(sql), []);
});

// Authority-preservation coverage for complete statements and occurrences.
test('DO LANGUAGE allowlisting retains the complete DROP SCHEMA statement', () => {
  const statement = 'drop schema if exists tenant_private cascade;';
  const sql = doLanguageBodySql({ body: `begin ${statement} end;` });
  const allowlist = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [{
      occurrenceId: 'do-language-schema-drop',
      statementClass: 'DROP SCHEMA',
      statement,
    }],
  );

  assert.deepEqual(destructiveViolations(sql, allowlist), []);
});

test('DO LANGUAGE DROP SCHEMA target remains material', () => {
  const approved = 'drop schema tenant_private cascade;';
  const sql = doLanguageBodySql({
    body: 'begin drop schema other_private cascade; end;',
  });
  const allowlist = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [{
      occurrenceId: 'approved-target',
      statementClass: 'DROP SCHEMA',
      statement: approved,
    }],
  );
  const violations = destructiveViolations(sql, allowlist);

  assert.match(violations.join('\n'), /not exactly allowlisted/);
  assert.match(violations.join('\n'), /approved-target was not found exactly once/);
});

test('DO LANGUAGE DROP SCHEMA options remain material', () => {
  const approved = 'drop schema tenant_private cascade;';
  const sql = doLanguageBodySql({
    body: 'begin drop schema if exists tenant_private cascade; end;',
  });
  const allowlist = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [{
      occurrenceId: 'approved-options',
      statementClass: 'DROP SCHEMA',
      statement: approved,
    }],
  );
  const violations = destructiveViolations(sql, allowlist);

  assert.match(violations.join('\n'), /not exactly allowlisted/);
  assert.match(violations.join('\n'), /approved-options was not found exactly once/);
});

test('DO LANGUAGE destructive statement terminators remain material', () => {
  const occurrence = 'drop schema tenant_private cascade;';
  const sql = doLanguageBodySql({ body: `begin ${occurrence} end;` });
  const allowlist = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [{
      occurrenceId: 'missing-terminator',
      statementClass: 'DROP SCHEMA',
      statement: 'drop schema tenant_private cascade',
    }],
  );
  const violations = destructiveViolations(sql, allowlist);

  assert.match(violations.join('\n'), /not exactly allowlisted/);
  assert.match(violations.join('\n'), /missing-terminator was not found exactly once/);
});

test('two DO LANGUAGE occurrences require two unique allowlist entries', () => {
  const statement = 'drop schema tenant_private cascade;';
  const sql = [
    doLanguageBodySql({ delimiter: '$one$', body: `begin ${statement} end;` }),
    doLanguageBodySql({ delimiter: '$two$', body: `begin ${statement} end;` }),
  ].join('\n');
  const duplicateIds = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [
      { occurrenceId: 'duplicate-id', statementClass: 'DROP SCHEMA', statement },
      { occurrenceId: 'duplicate-id', statementClass: 'DROP SCHEMA', statement },
    ],
  );
  const duplicateViolations = destructiveViolations(sql, duplicateIds);

  assert.match(duplicateViolations.join('\n'), /occurrence IDs must be present and unique/);
  assert.match(duplicateViolations.join('\n'), /not exactly allowlisted/);

  const uniqueEntries = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [
      { occurrenceId: 'first-id', statementClass: 'DROP SCHEMA', statement },
      { occurrenceId: 'second-id', statementClass: 'DROP SCHEMA', statement },
    ],
  );

  assert.deepEqual(destructiveViolations(sql, uniqueEntries), []);
});

test('an additional DO LANGUAGE destructive occurrence fails independently', () => {
  const approved = 'drop schema tenant_private cascade;';
  const sql = doLanguageBodySql({
    body: `begin ${approved} truncate table public.audit_logs; end;`,
  });
  const allowlist = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [{
      occurrenceId: 'approved-schema-drop',
      statementClass: 'DROP SCHEMA',
      statement: approved,
    }],
  );
  const violations = destructiveViolations(sql, allowlist);

  assert.match(violations.join('\n'), /TRUNCATE destructive SQL statement/);
  assert.doesNotMatch(violations.join('\n'), /approved-schema-drop was not found/);
});

test('a missing DO LANGUAGE destructive occurrence fails independently', () => {
  const present = 'drop schema tenant_private cascade;';
  const missing = 'truncate table public.audit_logs;';
  const sql = doLanguageBodySql({ body: `begin ${present} end;` });
  const allowlist = customDestructiveAllowlist(
    '20260526143000_validator_fixture.sql',
    [
      {
        occurrenceId: 'present-schema-drop',
        statementClass: 'DROP SCHEMA',
        statement: present,
      },
      {
        occurrenceId: 'missing-truncate',
        statementClass: 'TRUNCATE',
        statement: missing,
      },
    ],
  );
  const violations = destructiveViolations(sql, allowlist);

  assert.match(violations.join('\n'), /missing-truncate was not found exactly once/);
  assert.doesNotMatch(violations.join('\n'), /present-schema-drop was not found/);
});

test('ordinary dollar-quoted strings remain masked', () => {
  const violations = destructiveViolations(
    'select $data$ delete from public.messages; $data$;',
  );

  assert.deepEqual(violations, []);
});

test('destructive-looking text in line and block comments remains masked', () => {
  const violations = destructiveViolations(
    '-- delete from public.messages;\n/* truncate table public.messages; */',
  );

  assert.deepEqual(violations, []);
});

test('multiple executable dollar bodies are each scanned', () => {
  const sql = [
    executableBodySql({ declaration: 'DO', asClause: '', delimiter: '$one$' }),
    executableBodySql({ declaration: 'DO', asClause: '', delimiter: '$two$' }),
  ].join('\n');
  const violations = destructiveViolations(sql);

  assert.equal(
    violations.filter((violation) => /DELETE destructive SQL statement/.test(violation)).length,
    2,
  );
});

test('an executable body followed by an ordinary dollar string scans only the executable body', () => {
  const sql = `${executableBodySql({ declaration: 'DO', asClause: '' })}\nselect $data$ delete from public.messages; $data$;`;
  const violations = destructiveViolations(sql);

  assert.equal(
    violations.filter((violation) => /DELETE destructive SQL statement/.test(violation)).length,
    1,
  );
});

test('an ordinary dollar string followed by an executable body still detects the body', () => {
  const sql = `select $data$ delete from public.messages; $data$;\n${executableBodySql({ declaration: 'DO', asClause: '' })}`;
  const violations = destructiveViolations(sql);

  assert.equal(
    violations.filter((violation) => /DELETE destructive SQL statement/.test(violation)).length,
    1,
  );
});

test('mismatched dollar tags fail closed instead of masking the remainder', () => {
  const violations = destructiveViolations(
    executableBodySql({ delimiter: '$expected$', closingDelimiter: '$other$' }),
  );

  assert.match(violations.join('\n'), /unterminated|lexical scan failed closed/);
});

test('unterminated executable dollar bodies fail closed', () => {
  const violations = destructiveViolations(
    'create function public.example() returns void language plpgsql as $$ begin delete from public.messages;',
  );

  assert.match(violations.join('\n'), /unterminated executable dollar-quoted body/);
  assert.match(violations.join('\n'), /lexical scan failed closed/);
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
  assert.match(result.stdout, /checked 37 migration SQL file\(s\)/);
  assert.match(
    result.stdout,
    /historical_dynamic_sql_exceptions=1, unapproved_procedural_dynamic_sql_occurrences=0/,
  );
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
  assert.doesNotMatch(
    sql,
    /grant execute on function public\.[^;]+ to service_role;/i,
  );
  assert.doesNotMatch(sql, /current_setting\('app\.catalogue_workspace_id/);
});

test('setup recipe migration defines the locked two-table workspace-safe schema', () => {
  const migration = readRealMigration(
    '20260730100000_setup_recipe_database_authority.sql',
  );
  const sql = normalizeSql(migration);

  assert.match(sql, /create table public\.setup_recipes \(/);
  assert.match(sql, /workspace_id uuid not null/);
  assert.match(sql, /setup_product_id uuid not null/);
  assert.match(sql, /revision bigint not null default 1/);
  assert.match(sql, /constraint setup_recipes_pkey primary key \(workspace_id, setup_product_id\)/);
  assert.match(sql, /constraint setup_recipes_revision_check check \(revision > 0\)/);
  assert.match(
    sql,
    /foreign key \(setup_product_id, workspace_id\) references public\.products \(id, workspace_id\) on delete cascade on update restrict/,
  );

  assert.match(sql, /create table public\.setup_recipe_items \(/);
  assert.match(
    sql,
    /primary key \(workspace_id, setup_product_id, included_product_id\)/,
  );
  assert.match(
    sql,
    /unique \(workspace_id, setup_product_id, position\)/,
  );
  assert.match(
    sql,
    /foreign key \(workspace_id, setup_product_id\) references public\.setup_recipes \(workspace_id, setup_product_id\) on delete cascade on update restrict/,
  );
  assert.match(
    sql,
    /foreign key \(included_product_id, workspace_id\) references public\.products \(id, workspace_id\) on delete restrict on update restrict/,
  );
  assert.match(sql, /check \(included_product_id <> setup_product_id\)/);
  assert.match(sql, /check \(position between 0 and 19\)/);
  assert.match(sql, /check \(base_quantity between 1 and 99\)/);
  assert.match(
    sql,
    /create index setup_recipe_items_workspace_included_product_idx on public\.setup_recipe_items \(workspace_id, included_product_id\);/,
  );
  assert.doesNotMatch(sql, /products\.kind/);
  assert.doesNotMatch(migration, /values\s*\(\s*'[0-9a-f-]{36}'/i);
});

test('setup recipe migration enforces aggregate, non-nesting, and publication invariants in the database', () => {
  const sql = normalizeSql(
    readRealMigration('20260730100000_setup_recipe_database_authority.sql'),
  );

  for (const triggerName of [
    'setup_recipes_parent_write_guard',
    'setup_recipes_aggregate_guard',
    'setup_recipe_items_nesting_guard',
    'setup_recipe_items_aggregate_guard',
    'products_setup_recipe_dependency_guard',
    'products_setup_recipe_publication_guard',
  ]) {
    assert.match(sql, new RegExp(`create (?:constraint )?trigger ${triggerName}`));
  }
  assert.match(sql, /setup_recipe_nested_setup/);
  assert.match(sql, /setup_recipe_published_child_protected/);
  assert.match(sql, /setup_recipe_published_child_invalid/);
  assert.match(sql, /setup_recipe_published_parent_invalid/);
  assert.match(sql, /setup_recipe_positions_not_contiguous/);
  assert.match(sql, /deferrable initially deferred/);
  assert.match(sql, /if tg_op = 'delete'[\s\S]*?setup_recipe_published_parent_remove[\s\S]*?return old;/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /create function public\.is_public_catalogue_product\( target_workspace_id uuid, target_product_id uuid \) returns boolean language sql stable set search_path = pg_catalog/);
});

test('setup recipe migration exposes only reviewed RLS and RPC privilege contracts', () => {
  const sql = normalizeSql(
    readRealMigration('20260730100000_setup_recipe_database_authority.sql'),
  );

  for (const tableName of ['setup_recipes', 'setup_recipe_items']) {
    assert.match(sql, new RegExp(`alter table public\\.${tableName} enable row level security;`));
    assert.match(
      sql,
      new RegExp(`revoke all privileges on table public\\.${tableName} from public, anon, authenticated, service_role;`),
    );
    assert.doesNotMatch(
      sql,
      new RegExp(`grant (?:insert|update|delete|all)[\\s\\S]*on (?:table )?public\\.${tableName} to (?:anon|authenticated|service_role);`),
    );
  }
  assert.match(sql, /setup_recipes_product_manager_select/);
  assert.match(sql, /setup_recipe_items_product_manager_select/);
  assert.match(sql, /private\.is_workspace_product_manager\(workspace_id\)/);
  assert.match(
    sql,
    /revoke all privileges on function public\.assert_setup_recipe_valid\(uuid, uuid\) from public, anon, authenticated, service_role;/,
  );
  assert.match(
    sql,
    /revoke all privileges on function public\.is_public_catalogue_product\(uuid, uuid\) from public, anon, authenticated, service_role;/,
  );
  for (const functionName of [
    'setup_recipe_item_nesting_guard',
    'setup_recipe_aggregate_guard',
    'setup_recipe_product_publication_guard',
  ]) {
    assert.match(
      sql,
      new RegExp(`create function public\\.${functionName}\\(\\) returns trigger language plpgsql volatile security definer set search_path = pg_catalog as`),
    );
    assert.match(
      sql,
      new RegExp(`revoke all privileges on function public\\.${functionName}\\(\\) from public, anon, authenticated, service_role;`),
    );
  }
  assert.match(
    sql,
    /revoke all privileges on function public\.execute_admin_setup_recipe_write\(text, uuid, uuid, bigint, jsonb\) from public, anon, authenticated, service_role;/,
  );
  assert.match(
    sql,
    /grant execute on function public\.execute_admin_setup_recipe_write\(text, uuid, uuid, bigint, jsonb\) to authenticated;/,
  );
  assert.doesNotMatch(
    sql,
    /grant execute on function public\.execute_admin_setup_recipe_write\([^;]+\) to (?:public|anon|service_role);/,
  );
});

test('setup recipe RPC is bounded, optimistic-concurrency safe, and auditable', () => {
  const sql = normalizeSql(
    readRealMigration('20260730100000_setup_recipe_database_authority.sql'),
  );

  assert.match(
    sql,
    /create function public\.execute_admin_setup_recipe_write\( p_operation text, p_expected_workspace_id uuid, p_setup_product_id uuid, p_expected_revision bigint, p_items jsonb \)/,
  );
  assert.doesNotMatch(sql, new RegExp(['recipe', 'rpc'].join('_') + '\\.'));
  assert.doesNotMatch(sql, new RegExp('<<' + ['recipe', 'rpc'].join('_') + '>>'));
  assert.match(sql, /p_operation is null or p_operation not in \('replace', 'remove'\)/);
  assert.match(sql, /setup_recipe_creation_revision_required/);
  assert.match(sql, /setup_recipe_revision_conflict/);
  assert.match(sql, /new_revision := current_revision \+ 1/);
  assert.match(sql, /setup_recipe_empty_replacement/);
  assert.match(sql, /setup_recipe_remove_items_must_be_empty/);
  assert.match(sql, /setuprecipe\.replace/);
  assert.match(sql, /setuprecipe\.remove/);
  assert.match(sql, /jsonb_build_object\( 'operation'/);
  assert.doesNotMatch(sql, /execute_admin_product_write/);
  assert.match(sql, /delete from public\.setup_recipes/);
  assert.match(sql, /delete from public\.setup_recipe_items/);
});

test('setup recipe catalogue projection is additive and fails closed without inference', () => {
  const sql = normalizeSql(
    readRealMigration('20260730100000_setup_recipe_database_authority.sql'),
  );

  assert.match(sql, /create or replace function public\.get_public_catalogue\(/);
  assert.match(sql, /valid_setup_recipes as/);
  assert.match(sql, /'product_kind', case/);
  assert.match(sql, /when p\.valid_setup_product_id is not null then 'setup'/);
  assert.match(sql, /else 'rental'/);
  assert.match(sql, /'setup_composition', case/);
  assert.match(sql, /when p\.valid_setup_product_id is null then null/);
  assert.match(sql, /order by item\.position/);
  assert.match(sql, /public\.is_public_catalogue_product\(child\.workspace_id, child\.id\)/);
  assert.match(sql, /public\.is_public_catalogue_product\(parent\.workspace_id, parent\.id\)/);
  assert.match(sql, /public\.is_public_catalogue_product\(p\.workspace_id, p\.id\)/);
  assert.match(sql, /and \(r\.setup_product_id is null or vsr\.setup_product_id is not null\)/);
  assert.doesNotMatch(sql, /case[\s\S]{0,250}(category|rental_unit|slug|name)[\s\S]{0,250}product_kind/);
  assert.match(
    sql,
    /revoke all privileges on function public\.get_public_catalogue\(uuid, text\) from public, anon, authenticated, service_role;/,
  );
  assert.match(
    sql,
    /grant execute on function public\.get_public_catalogue\(uuid, text\) to anon;/,
  );
});

test('durable admin CSRF replay migration defines the exact private table contract', () => {
  const migration = readRealMigration(
    '20260802013000_admin_csrf_proof_replay_authority.sql',
  );
  const sql = normalizeSql(migration);

  assert.match(sql, /create table public\.admin_csrf_proof_consumptions \(/);
  for (const column of [
    'proof_fingerprint text primary key',
    'workspace_id uuid not null',
    'operation text not null',
    'actor_admin_user_id uuid not null',
    'issued_at timestamptz not null',
    'expires_at timestamptz not null',
    'consumed_at timestamptz not null default statement_timestamp\(\)',
  ]) {
    assert.match(sql, new RegExp(column));
  }
  assert.match(sql, /proof_fingerprint ~ '\^\[0-9a-f\]\{64\}\$'/);
  for (const operation of [
    'product.write',
    'category.write',
    'productImage.write',
    'hero.write',
    'quote.write',
    'membership.manage',
    'admin.setupRecipe.read',
    'admin.setupRecipe.write',
  ]) {
    assert.match(
      sql,
      new RegExp(operation.toLowerCase().replaceAll('.', '\\.')),
    );
  }
  assert.match(sql, /expires_at > issued_at/);
  assert.match(sql, /expires_at - issued_at <= interval '5 minutes'/);
  assert.match(
    sql,
    /create index admin_csrf_proof_consumptions_expires_at_idx on public\.admin_csrf_proof_consumptions \(expires_at\);/,
  );
  assert.match(sql, /alter table public\.admin_csrf_proof_consumptions enable row level security;/);
  assert.match(
    sql,
    /revoke all privileges on table public\.admin_csrf_proof_consumptions from public, anon, authenticated, service_role;/,
  );
  assert.doesNotMatch(sql, /create policy [^;]+ on public\.admin_csrf_proof_consumptions/);
});

test('durable admin CSRF replay RPC is exact, bounded, atomic, and least privilege', () => {
  const migration = readRealMigration(
    '20260802013000_admin_csrf_proof_replay_authority.sql',
  );
  const sql = normalizeSql(migration);
  const tableDefinition = sql.match(
    /create table public\.admin_csrf_proof_consumptions \(([\s\S]*?)\);/,
  )?.[1] ?? '';

  assert.match(
    sql,
    /create function public\.consume_admin_csrf_proof\( p_operation text, p_expected_workspace_id uuid, p_proof_fingerprint text, p_issued_at_ms bigint, p_expires_at_ms bigint \) returns boolean language plpgsql volatile security definer set search_path = pg_catalog/,
  );
  assert.match(
    sql,
    /public\.current_product_admin_user_id\(p_expected_workspace_id\)/,
  );
  assert.match(sql, /limit 128 for update skip locked/);
  assert.match(
    sql,
    /delete from public\.admin_csrf_proof_consumptions consumption using expired_fingerprints/,
  );
  assert.match(sql, /on conflict \(proof_fingerprint\) do nothing returning true/);
  assert.doesNotMatch(sql, /select exists[\s\S]{0,300}proof_fingerprint/);
  assert.match(
    sql,
    /revoke execute on function public\.consume_admin_csrf_proof\( text, uuid, text, bigint, bigint \) from public, anon, authenticated, service_role;/,
  );
  assert.match(
    sql,
    /grant execute on function public\.consume_admin_csrf_proof\( text, uuid, text, bigint, bigint \) to authenticated;/,
  );
  assert.doesNotMatch(
    sql,
    /grant execute on function public\.consume_admin_csrf_proof\([^;]+\) to (?:public|anon|service_role);/,
  );
  for (const forbiddenColumn of [
    'raw_proof',
    'nonce',
    'session_binding',
    'cookie',
    'access_token',
    'signature',
    'hmac_secret',
    'request_body',
  ]) {
    assert.doesNotMatch(
      tableDefinition,
      new RegExp(`\\b${forbiddenColumn}\\b`),
    );
  }
});

test('additive atomic setup recipe read migration defines one single-statement RPC', () => {
  const migration = readRealMigration('20260804100000_setup_recipe_atomic_read.sql');
  const sql = normalizeSql(migration);

  assert.match(
    sql,
    /create function public\.read_admin_setup_recipe\( p_expected_workspace_id uuid, p_setup_product_id uuid \) returns jsonb language plpgsql stable set search_path = pg_catalog/,
  );
  assert.match(sql, /select[\s\S]*r\.revision[\s\S]*jsonb_agg[\s\S]*order by i\.position/);
  assert.match(sql, /raise exception 'setup_recipe_not_found'/);
  assert.match(sql, /raise exception 'setup_recipe_read_failed'/);
  assert.match(
    sql,
    /revoke all privileges on function public\.read_admin_setup_recipe\(uuid, uuid\) from public, anon, authenticated, service_role;/,
  );
  assert.match(
    sql,
    /grant execute on function public\.read_admin_setup_recipe\(uuid, uuid\) to authenticated;/,
  );
  assert.doesNotMatch(
    sql,
    /grant execute on function public\.read_admin_setup_recipe\([^;]+\) to (?:public|anon|service_role);/,
  );
});

test('SECURITY DEFINER inventory documents setup recipe and durable CSRF replay authority', () => {
  const inventory = fs.readFileSync(
    path.join(repoRoot, 'docs', 'SUPABASE-SECURITY-DEFINER-PRIVILEGE-INVENTORY.md'),
    'utf8',
  );

  assert.match(inventory, /Twelve authenticated RPC signatures are allowlisted/);
  assert.match(inventory, /All twelve have website call sites/);
  assert.match(
    inventory,
    /public\.consume_admin_csrf_proof\(text,uuid,text,bigint,bigint\)/,
  );

  for (const functionName of [
    'public.setup_recipe_item_nesting_guard()',
    'public.setup_recipe_aggregate_guard()',
    'public.setup_recipe_product_publication_guard()',
  ]) {
    const escapedFunctionName = functionName
      .replaceAll('.', '\\.')
      .replaceAll('(', '\\(')
      .replaceAll(')', '\\)');
    const entry = new RegExp(
      '### `' + escapedFunctionName + '`[\\s\\S]*?' +
        'Owner: `postgres`[\\s\\S]*?' +
        'SECURITY DEFINER: yes\\.[\\s\\S]*?' +
        'Fixed `search_path`: `pg_catalog`\\.[\\s\\S]*?' +
        'Trigger dependency:[\\s\\S]*?' +
        'Internal helper dependency:[\\s\\S]*?' +
        'Direct EXECUTE: denied for `PUBLIC`, `anon`, `authenticated`, and[\\s\\S]*?' +
        '`service_role`\\.[\\s\\S]*?' +
        'Trigger execution: valid[\\s\\S]*?' +
        'Browser call site: none\\.',
    );
    assert.match(inventory, entry);
  }
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

test('real migrations replace every historical anonymous quote write with durable narrow RPCs', () => {
  const sql = normalizeSql(
    readRealMigration('20260720090000_atomic_public_quote_submission.sql'),
  );

  assert.match(sql, /create table public\.quote_public_workspace_config \(/);
  assert.match(sql, /alter table public\.quote_public_workspace_config enable row level security;/);
  assert.match(sql, /create table public\.quote_handoff_outbox \(/);
  assert.match(sql, /alter table public\.quote_handoff_outbox enable row level security;/);
  assert.match(sql, /create or replace function public\.submit_public_quote_request\(/);
  assert.match(sql, /language plpgsql security definer set search_path = '' as/);
  assert.match(sql, /from public\.quote_public_workspace_config cfg/);
  assert.doesNotMatch(sql, /from public\.catalogue_public_workspace_config cfg/);
  assert.match(sql, /from public\.quote_requests quote/);
  assert.match(sql, /from public\.quote_request_items item/);
  assert.match(sql, /or p_submission_request_id is null or btrim\(p_submission_request_id\) = ''/);
  assert.match(sql, /nullif\(btrim\(p_customer_email\), ''\) is null and nullif\(btrim\(p_customer_phone\), ''\) is null/);
  assert.match(sql, /returns table \( quote_request_id uuid, public_reference text, was_created boolean, handoff_claim_status text, handoff_claim_token uuid \)/);
  assert.match(sql, /state = 'claimed'/);
  assert.match(sql, /claim_expires_at = now\(\) \+ interval '5 minutes'/);
  assert.match(sql, /create or replace function public\.finalize_public_quote_handoff\(/);
  assert.match(sql, /revoke all privileges on function public\.submit_public_quote_request\([\s\S]*?\) from public, anon, authenticated;/);
  assert.match(sql, /grant execute on function public\.submit_public_quote_request\([\s\S]*?\) to anon;/);
  assert.doesNotMatch(sql, /grant execute on function public\.submit_public_quote_request\([\s\S]*?\) to authenticated;/);
  assert.match(sql, /revoke all privileges on function public\.finalize_public_quote_handoff\([\s\S]*?\) from public, anon, authenticated;/);
  assert.match(sql, /grant execute on function public\.finalize_public_quote_handoff\([\s\S]*?\) to anon;/);
  assert.doesNotMatch(sql, /grant execute on function public\.finalize_public_quote_handoff\([\s\S]*?\) to authenticated;/);
  assert.match(sql, /revoke all privileges on table public\.quote_requests from anon;/);
  assert.match(sql, /revoke insert \( id, workspace_id, public_reference, customer_name, customer_email, customer_phone, customer_message, event_date, venue, status, source, source_page_path, source_listing_slug, source_listing_id, submission_request_id, crm_provider, crm_sync_status, crm_contact_id, crm_deal_id, crm_last_sync_attempt_at, crm_sync_error \) on public\.quote_requests from anon;/);
  assert.match(sql, /revoke all privileges on table public\.quote_request_items from anon;/);
  assert.match(sql, /revoke insert \( workspace_id, quote_request_id, product_name_snapshot, quantity, notes \) on public\.quote_request_items from anon;/);
  assert.match(sql, /revoke all privileges on table public\.quote_handoff_outbox from public, anon, authenticated;/);
  assert.match(sql, /revoke all privileges on table public\.quote_public_workspace_config from public, anon, authenticated;/);
});

test('no migration after quote hardening can restore anonymous direct quote writes', () => {
  const migrationNames = fs.readdirSync(realMigrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort();
  const hardeningIndex = migrationNames.indexOf(
    '20260720090000_atomic_public_quote_submission.sql',
  );
  const laterSql = normalizeSql(
    migrationNames
      .slice(hardeningIndex + 1)
      .map((name) => readRealMigration(name))
      .join('\n'),
  );

  assert.doesNotMatch(
    laterSql,
    /grant\s+[^;]*(insert|update|delete)[^;]*on(?: table)? public\.(quote_requests|quote_request_items)[^;]*to anon/,
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
  assert.doesNotMatch(
    sql,
    /grant execute on function public\.[^;]+ to service_role;/i,
  );
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

test('real migrations update quote email delivery log for n8n enquiry handoff states', () => {
  const migrationFileName =
    '20260708100000_n8n_enquiry_handoff_delivery_log_contract.sql';
  const migration = readRealMigration(migrationFileName);
  const sql = normalizeSql(migration);

  assert.match(
    sql,
    /alter table public\.quote_email_delivery_log drop constraint if exists quote_email_delivery_log_provider_check/,
  );
  assert.match(
    sql,
    /drop constraint if exists quote_email_delivery_log_delivery_status_check/,
  );
  assert.match(
    sql,
    /drop constraint if exists quote_email_delivery_log_status_shape_check/,
  );
  assert.ok(
    sql.includes("constraint quote_email_delivery_log_provider_check check (provider in ('resend', 'n8n'))"),
    'delivery log must allow n8n while preserving legacy resend rows',
  );
  assert.match(
    sql,
    /constraint quote_email_delivery_log_delivery_status_check check \(delivery_status in \(\s*'sent',\s*'pending',\s*'delivered',\s*'failed',\s*'not_configured'\s*\)\)/,
  );
  assert.match(
    sql,
    /delivery_status in \('sent', 'pending', 'delivered'\) and error_code is null/,
  );
  assert.match(
    sql,
    /delivery_status in \('failed', 'not_configured'\) and error_code is not null/,
  );
  assert.match(
    sql,
    /alter policy quote_email_delivery_log_public_insert_website_quote on public\.quote_email_delivery_log with check/,
  );
  assert.match(sql, /public\.is_public_website_quote_request\(quote_request_id, workspace_id\)/);
  assert.match(sql, /provider in \('resend', 'n8n'\)/);
  assert.match(
    sql,
    /delivery_status in \(\s*'sent',\s*'pending',\s*'delivered',\s*'failed',\s*'not_configured'\s*\)/,
  );
  assert.match(
    sql,
    /append-only quote enquiry handoff delivery metadata/,
  );
  assert.doesNotMatch(migration, /create table|alter table public\.quote_email_delivery_log add column/i);
  assert.doesNotMatch(migration, /grant\s+(select|insert|update|delete|all)/i);
  assert.doesNotMatch(migration, /https?:\/\/|N8N_ENQUIRY_HANDOFF|shared_secret|provider_response|email_body|headers json|headers jsonb/i);
  assert.doesNotMatch(migration, /checkout|payment|purchase|booking|reservation|stock|inventory/i);
});

test('real migrations add Google-only DB-backed admin access management', () => {
  const migrationFileName =
    '20260709100000_google_admin_access_management.sql';
  const migration = readRealMigration(migrationFileName);
  const sql = normalizeSql(migration);

  assert.match(
    sql,
    /create table if not exists public\.admin_access \(/,
  );
  for (const column of [
    'normalized_email text not null',
    "role text not null default 'admin'",
    "status text not null default 'active'",
    'linked_admin_user_id uuid',
    'created_by_admin_access_id uuid',
    'updated_by_admin_access_id uuid',
  ]) {
    assert.ok(sql.includes(column), `Missing admin access column: ${column}`);
  }
  assert.match(sql, /constraint admin_access_role_check check \(role in \('owner', 'admin'\)\)/);
  assert.match(
    sql,
    /constraint admin_access_status_check check \(status in \('active', 'disabled', 'removed'\)\)/,
  );
  assert.match(sql, /unique \(workspace_id, normalized_email\)/);
  assert.match(
    sql,
    /create unique index if not exists admin_access_single_owner_per_workspace_idx on public\.admin_access \(workspace_id\) where role = 'owner';/,
  );
  assert.match(sql, /alter table public\.admin_access enable row level security;/);
  assert.match(sql, /revoke all on table public\.admin_access from anon;/);
  assert.match(sql, /grant select \( normalized_email, role, status, created_at, updated_at \) on public\.admin_access to authenticated;/);
  assert.doesNotMatch(sql, /grant select \*/);
  assert.doesNotMatch(sql, /grant select \([^)]*\b(?:id|workspace_id|linked_admin_user_id|created_by_admin_access_id|updated_by_admin_access_id)\b[^)]*\) on public\.admin_access to authenticated/);
  assert.match(sql, /create or replace function public\.prevent_admin_access_owner_mutation\(\)/);
  assert.match(sql, /raise exception 'admin_owner_immutable'/);
  assert.match(sql, /create trigger admin_access_prevent_owner_mutation/);
  assert.match(sql, /create or replace function public\.ensure_admin_access_membership\(\s*p_workspace_id uuid\s*\)/);
  assert.match(sql, /create or replace function public\.list_admin_access_records\(\s*p_workspace_id uuid\s*\)/);
  assert.match(sql, /returns table \( normalized_email text, role text, status text, created_at timestamp with time zone, updated_at timestamp with time zone \)/);
  assert.match(sql, /from public\.admin_access aa where aa\.workspace_id = p_workspace_id and public\.is_workspace_admin_access_member\(p_workspace_id\)/);
  assert.match(sql, /grant execute on function public\.list_admin_access_records\(uuid\) to authenticated;/);
  assert.match(sql, /create or replace function public\.get_admin_access_membership\(\s*p_workspace_id uuid,\s*p_admin_user_id uuid\s*\)/);
  assert.match(sql, /returns table \( normalized_email text, role text, status text \)/);
  assert.match(sql, /aa\.linked_admin_user_id/);
  assert.match(sql, /au\.auth_user_id = \(\s*select auth\.uid\(\)\s*\)/);
  assert.match(sql, /grant execute on function public\.get_admin_access_membership\(uuid, uuid\) to authenticated;/);
  assert.match(sql, /create or replace function public\.execute_admin_access_write\(\s*p_workspace_id uuid,\s*p_action text,\s*p_email text\s*\)/);
  assert.match(sql, /not public\.is_workspace_admin_access_owner\(p_workspace_id\)/);
  assert.match(sql, /'owner_immutable'/);
  assert.match(sql, /grant execute on function public\.execute_admin_access_write\(uuid, text, text\) to authenticated;/);
  assert.match(sql, /create or replace function public\.is_workspace_member\(target_workspace_id uuid\)/);
  assert.match(sql, /public\.is_workspace_admin_access_member\(target_workspace_id\)/);
  assert.match(sql, /create or replace function public\.is_workspace_product_manager/);
  assert.match(sql, /create or replace function public\.is_workspace_quote_manager/);
  assert.match(sql, /aa\.status = 'active'/);
  assert.match(sql, /aa\.role in \('owner', 'admin'\)/);
  assert.doesNotMatch(migration, /insert into public\.admin_access\s+values/i);
  assert.doesNotMatch(migration, /values\s*\(\s*'[^']+@[^']+'/i);
  assert.doesNotMatch(migration, /password|viewer/i);
  assert.doesNotMatch(sql, /role in \('owner', 'admin', 'viewer'\)/);
  assert.doesNotMatch(migration, /checkout|payment|purchase|booking|reservation|stock|inventory/i);
  assert.doesNotMatch(migration, /https?:\/\/|oauth|client_secret|service_role/i);
});

test('preproduction remediation keeps admin access writes workspace-local', () => {
  const migration = readRealMigration(
    '20260721090000_preproduction_security_remediation.sql',
  );
  const sql = normalizeSql(migration);

  assert.match(
    sql,
    /create or replace function public\.execute_admin_access_write\(\s*p_workspace_id uuid,\s*p_action text,\s*p_email text\s*\)/,
  );
  assert.match(sql, /update public\.admin_access/);
  assert.match(sql, /update public\.memberships/);
  assert.match(
    sql,
    /revoke all privileges on function public\.execute_admin_access_write\( uuid, text, text \) from public, anon, authenticated;/,
    'The forward migration must explicitly remove the production anon EXECUTE ACL.',
  );
  assert.match(
    sql,
    /grant execute on function public\.execute_admin_access_write\( uuid, text, text \) to authenticated;/,
  );
  assert.doesNotMatch(
    sql,
    /update public\.admin_users/,
    'Workspace-local admin access writes must not mutate global admin identity state.',
  );
});

test('preproduction remediation uses production-shaped pgcrypto schema qualification', () => {
  const migration = readRealMigration(
    '20260721090000_preproduction_security_remediation.sql',
  );
  const sql = normalizeSql(migration);

  assert.match(sql, /extensions\.digest\(/);
  assert.match(sql, /extensions\.hmac\(/);
  assert.match(
    sql,
    /alter function public\.execute_admin_product_write\( text, uuid, uuid, jsonb \) set search_path = public, extensions;/,
  );
  assert.match(
    sql,
    /alter function public\.enqueue_search_index_job\( uuid, text, uuid, text, text, text, text, jsonb, text \) set search_path = public, extensions;/,
  );
  assert.doesNotMatch(sql, /public\.digest\(/);
  assert.doesNotMatch(sql, /public\.hmac\(/);
});

test('forward privilege hardening uses exact signatures and explicit role allowlists', () => {
  const migrationFileName =
    '20260721183000_public_security_definer_privilege_hardening.sql';
  const migration = readRealMigration(migrationFileName);
  const sql = normalizeSql(migration);
  const revokes = functionAclStatements(migration, 'revoke');
  const grants = functionAclStatements(migration, 'grant');
  const allRevokedRoles = ['anon', 'authenticated', 'public', 'service_role'];

  for (const signature of preMigrationPublicSecurityDefinerSignatures) {
    assert.deepEqual(
      [...(revokes.get(signature) ?? [])].sort(),
      allRevokedRoles,
      `Missing exact all-role revoke for ${signature}.`,
    );
  }

  const expectedPublicGrants = new Map();
  for (const signature of anonymousPublicSecurityDefinerAllowlist) {
    expectedPublicGrants.set(signature, new Set(['anon']));
  }
  for (const signature of authenticatedPublicSecurityDefinerAllowlist) {
    const roles = expectedPublicGrants.get(signature) ?? new Set();
    roles.add('authenticated');
    expectedPublicGrants.set(signature, roles);
  }
  for (const signature of serviceRolePublicSecurityDefinerAllowlist) {
    const roles = expectedPublicGrants.get(signature) ?? new Set();
    roles.add('service_role');
    expectedPublicGrants.set(signature, roles);
  }

  for (const signature of preRecipePublicSecurityDefinerSignatures) {
    assert.deepEqual(
      [...(grants.get(signature) ?? [])].sort(),
      [...(expectedPublicGrants.get(signature) ?? [])].sort(),
      `Unexpected public-schema grant set for ${signature}.`,
    );
  }

  const grantedPublicSignatures = [...grants.keys()]
    .filter((signature) => signature.startsWith('public.'))
    .sort();
  const expectedPreRecipePublicGrants = [...expectedPublicGrants.keys()]
    .filter((signature) => preRecipePublicSecurityDefinerSignatures.includes(signature))
    .sort();
  assert.deepEqual(
    grantedPublicSignatures,
    expectedPreRecipePublicGrants,
    'The migration must not grant an unreviewed public function signature.',
  );

  for (const [role, signatures] of Object.entries(privatePolicyHelperGrants)) {
    for (const signature of signatures) {
      assert.deepEqual(
        [...(grants.get(signature) ?? [])].sort(),
        [role],
        `Missing exact private policy-helper grant for ${signature}.`,
      );
      assert.deepEqual(
        [...(revokes.get(signature) ?? [])].sort(),
        allRevokedRoles,
        `Missing exact private policy-helper revoke for ${signature}.`,
      );
    }
  }

  for (const signature of [
    'public.is_public_website_quote_request(uuid,uuid)',
    'public.is_workspace_admin_access_member(uuid)',
    'public.is_workspace_member(uuid)',
    'public.is_workspace_product_manager(uuid)',
    'public.is_workspace_quote_manager(uuid)',
    'public.current_quote_admin_user_id(uuid)',
    'public.is_listing_media_product_admin_object(text,text)',
    'public.is_hero_media_admin_object(text,text)',
  ]) {
    assert.ok(
      sql.includes(`alter function ${signature} set schema private;`),
      `Missing OID-preserving private-schema move for ${signature}.`,
    );
  }

  assert.match(
    sql,
    /alter function public\.normalize_admin_access_email\(text\) set search_path = pg_catalog;/,
  );
  assert.deepEqual(
    [...(revokes.get('public.normalize_admin_access_email(text)') ?? [])].sort(),
    allRevokedRoles,
  );
  assert.match(
    sql,
    /alter default privileges revoke execute on functions from public, anon, authenticated, service_role;/,
    'Future functions require a global default EXECUTE revoke; a schema-scoped revoke cannot remove PostgreSQL\'s global PUBLIC default.',
  );
  assert.match(
    sql,
    /alter default privileges in schema public revoke execute on functions from public, anon, authenticated, service_role;/,
  );
  assert.match(
    sql,
    /alter default privileges in schema private revoke execute on functions from public, anon, authenticated, service_role;/,
  );
  assert.match(
    sql,
    /revoke execute on all functions in schema private from public, anon, authenticated, service_role;/,
  );
  assert.doesNotMatch(
    sql,
    /grant execute on function public\.[^;]+ to (?:public|service_role)/,
  );
});

test('platform auto-RLS helper hardening is conditional, exact-signature, and ACL-only', () => {
  const migrationFileName =
    '20260721190000_platform_rls_auto_enable_privilege_hardening.sql';
  const migration = readRealMigration(migrationFileName);
  const sql = normalizeSql(migration);
  const [platformSignature] = platformManagedPublicSecurityDefinerSignatures;

  assert.equal(platformSignature, 'public.rls_auto_enable()');
  assert.match(
    sql,
    /if pg_catalog\.to_regprocedure\('public\.rls_auto_enable\(\)'\) is not null then/,
  );
  assert.match(
    sql,
    /execute 'revoke execute on function public\.rls_auto_enable\(\) from public, anon, authenticated, service_role';/,
  );
  assert.doesNotMatch(sql, /\bgrant\s+execute\b/);
  assert.doesNotMatch(
    sql,
    /\b(?:create|alter|drop)\s+(?:or replace\s+)?function\b/,
    'The ACL repair must not redefine, move, replace, or drop the helper.',
  );
  assert.doesNotMatch(
    sql,
    /\b(?:create|alter|drop)\s+event\s+trigger\b/,
    'The ACL repair must not change the ensure_rls event-trigger definition.',
  );
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

test('real migrations add protected hero media storage and image-only writes', () => {
  const migrationFileName = '20260707130000_hero_media_storage_foundation.sql';
  const migration = readRealMigration(migrationFileName);
  const sql = normalizeSql(migration);

  assert.match(
    sql,
    /insert into storage\.buckets \( id, name, public, file_size_limit, allowed_mime_types \) values \( 'hero-media', 'hero-media', true, 5242880, array\['image\/jpeg', 'image\/png', 'image\/webp', 'image\/avif'\] \)/,
  );
  assert.match(
    sql,
    /create or replace function public\.is_hero_media_object_path\( object_name text \)/,
  );
  assert.match(
    sql,
    /homepage-hero\/\[0-9a-f\]\{13\}/,
  );
  assert.match(
    sql,
    /create or replace function public\.is_hero_media_admin_object\( object_bucket text, object_name text \)/,
  );
  assert.match(
    sql,
    /object_bucket <> 'hero-media'/,
  );
  assert.match(
    sql,
    /public\.is_workspace_product_manager\( split_part\(object_name, '\/', 1\)::uuid \)/,
  );
  assert.match(
    sql,
    /create policy hero_media_admin_insert on storage\.objects for insert to authenticated with check \(/,
  );
  assert.match(
    sql,
    /public\.is_hero_media_admin_object\( storage\.objects\.bucket_id, storage\.objects\.name \)/,
  );
  assert.match(
    sql,
    /create or replace function public\.execute_admin_homepage_hero_image_write\( p_workspace_id uuid, p_payload jsonb \)/,
  );
  assert.match(sql, /security definer/);
  assert.match(
    sql,
    /v_actor_id := public\.current_product_admin_user_id\(p_workspace_id\);/,
  );
  assert.match(
    sql,
    /grant execute on function public\.execute_admin_homepage_hero_image_write\(uuid, jsonb\) to authenticated;/,
  );
  assert.match(
    sql,
    /create or replace function public\.execute_admin_homepage_hero_write\( p_workspace_id uuid, p_payload jsonb \)/,
  );
  assert.match(
    sql,
    /from public\.execute_admin_homepage_hero_image_write\( p_workspace_id, jsonb_build_object\(/,
  );
  assert.match(
    sql,
    /copy and cta payload fields are ignored/i,
  );
  assert.doesNotMatch(
    sql,
    /grant execute on function public\.execute_admin_homepage_hero_image_write\(uuid, jsonb\) to anon/,
  );
  assert.doesNotMatch(migration, /hero_media_public_read/);
  assert.doesNotMatch(migration, /for select to anon/);
  assert.doesNotMatch(migration, /grant select on storage\.objects to anon/);
  assert.doesNotMatch(migration, /for insert to anon/);
  assert.doesNotMatch(migration, /image\/svg\+xml|svg/);
  assert.doesNotMatch(migration, /service_role/i);
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
