const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const trackedFilesCommandDescription = 'git ls-files';
const serverRuntimeEnvNames = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'CATALOGUE_WORKSPACE_ID',
  'QUOTE_WORKSPACE_ID',
  'ADMIN_TRUSTED_WORKSPACE_ID',
  'ADMIN_EXPECTED_ORIGIN',
  'ADMIN_EXPECTED_HOST',
  'ADMIN_CSRF_PROOF_SECRET',
  'CHAT_PROVIDER',
  'N8N_CHAT_WEBHOOK_URL',
  'N8N_CHAT_WEBHOOK_TIMEOUT_MS',
  'CHAT_TRUSTED_CLIENT_IP_HEADER',
  'QUOTE_TRUSTED_CLIENT_IP_HEADER',
];
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function run(label, shellCommand) {
  console.log(`\n> ${shellCommand}`);
  const result = spawnSync(shellCommand, [], {
    cwd: repoRoot,
    shell: true,
    stdio: 'inherit',
  });

  if (result.error) {
    fail(`Failed to start ${label}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    fail(`${label} failed with exit code ${result.status}.`);
  }
}

function gitLsFiles(paths) {
  const result = spawnSync('git', ['ls-files', '--', ...paths], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  if (result.error || result.status !== 0) {
    fail(
      `${trackedFilesCommandDescription} failed: ${
        result.error?.message || result.stderr.trim()
      }`,
    );
  }

  return result.stdout.split(/\r?\n/).filter(Boolean);
}

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function assertNoTracked(paths, label) {
  const tracked = gitLsFiles(paths);

  assert(tracked.length === 0, `${label} must not be tracked: ${tracked.join(', ')}`);
}

function assertNoMatch(source, pattern, label) {
  assert(!pattern.test(source), `${label} contains forbidden content.`);
}

function isProductionSource(filePath) {
  return (
    sourceExtensions.has(path.extname(filePath)) &&
    !/\.(?:test|spec)\.[cm]?[tj]sx?$/.test(filePath) &&
    !filePath.startsWith('website/test/')
  );
}

function readTrackedProductionSources(paths) {
  return gitLsFiles(paths)
    .filter(isProductionSource)
    .map(readRepoFile)
    .join('\n');
}

function assertServerRuntimeConfigContract() {
  const source = readRepoFile('website/lib/server-runtime-config.ts');
  const docs = [
    readRepoFile('docs/PREVIEW-DEPLOYMENT-PREFLIGHT.md'),
    readRepoFile('docs/DEPLOYMENT-ENVIRONMENT-READINESS.md'),
    readRepoFile('docs/DEPLOYMENT-SMOKE-TEST-RUNBOOK.md'),
  ].join('\n');

  assert(
    source.includes('import "server-only";'),
    'server runtime config contract must be server-only.',
  );
  assert(
    source.includes('serverRuntimeEnvNames'),
    'serverRuntimeEnvNames must be exported.',
  );
  assert(
    source.includes('parseServerRuntimeConfig'),
    'parseServerRuntimeConfig must be exported.',
  );
  assert(
    source.includes('getPublicSafeServerRuntimeConfigSummary'),
    'safe config summary helper must be exported.',
  );

  for (const envName of serverRuntimeEnvNames) {
    assert(source.includes(envName), `server runtime config is missing ${envName}.`);
    assert(docs.includes(envName), `deployment docs are missing ${envName}.`);
  }

  assert(
    docs.includes('validate:deploy-dry-run'),
    'deployment docs must mention validate:deploy-dry-run.',
  );
}

function assertStaticScope() {
  const packageSource = [
    readRepoFile('package.json'),
    readRepoFile('website/package.json'),
  ].join('\n');
  const appAndLibSource = readTrackedProductionSources([
    'website/app',
    'website/components',
    'website/lib',
  ]);
  const browserFacingSource = readTrackedProductionSources([
    'website/app/page.tsx',
    'website/app/listings',
    'website/app/categories',
    'website/app/catalogue',
    'website/app/events',
    'website/app/quote',
    'website/components',
  ]);
  const chatRoute = readRepoFile('website/app/api/chat/route.ts');
  const n8nWorkflows = gitLsFiles(['n8n-workflows']).sort();

  assertNoTracked(['vercel.json', 'website/vercel.json', '.vercel'], 'deployment config');
  assertNoTracked(['supabase/config.toml', 'supabase/.branches'], 'Supabase Cloud config');
  assertNoTracked(
    [
      '.env',
      '.env.local',
      '.env.development',
      '.env.production',
      '.env.test',
      'website/.env',
      'website/.env.local',
      'website/.env.development',
      'website/.env.production',
      'website/.env.test',
    ],
    'environment files',
  );
  assertNoTracked(['docs/evidence', 'docs/production-evidence'], 'production evidence');
  assertNoTracked(['website/chat-config.js'], 'legacy local chat config');
  assertNoTracked(['website/app/api/customer-uploads'], 'customer upload routes');
  assertNoTracked(['website/app/api/public/uploads'], 'public upload routes');
  assertNoTracked(['website/app/api/chat/retrieval'], 'chat retrieval routes');
  assert(
    JSON.stringify(n8nWorkflows) ===
      JSON.stringify([
        'n8n-workflows/spacekonceptrental-customer-support-agent.workflow.json',
        'n8n-workflows/spacekonceptrental-enquiry-handoff.workflow.json',
        'n8n-workflows/spacekonceptrental-error-handler.workflow.json',
        'n8n-workflows/spacekonceptrental-rag-ingestion.workflow.json',
      ]),
    'n8n workflows must remain unchanged.',
  );

  assertNoMatch(packageSource, /@pinecone-database|pinecone/i, 'package manifests');
  assertNoMatch(browserFacingSource, /@supabase\/|createBrowserClient/i, 'browser source');
  assertNoMatch(appAndLibSource, /NEXT_PUBLIC_SUPABASE|NEXT_PUBLIC_N8N/i, 'app/lib source');
  assertNoMatch(appAndLibSource, /SUPABASE_SERVICE_ROLE/i, 'app/lib source');
  assertNoMatch(
    appAndLibSource,
    /PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i,
    'app/lib source',
  );
  assertNoMatch(
    chatRoute,
    /pinecone|retrieval|rerank|vector|embedding|rag|search[_ -]?index/i,
    'chat route',
  );
}

run('release-candidate validation', 'npm run validate:release-candidate');
run(
  'server runtime config tests',
  'npm --prefix website test -- server-runtime-config phase-2n-ab-server-config-dry-run-hardening',
);
assertServerRuntimeConfigContract();
assertStaticScope();

console.log('\nDeploy dry-run validation passed. No deployment was performed.');
