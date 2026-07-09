const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const trackedFilesCommandDescription = 'git ls-files';
const phase2nMergeCommit = 'ad97aace9c2145af139a45f3e0f2d0b6d09a24a9';
const approvalPackagePath = 'docs/PREVIEW-DEPLOYMENT-APPROVAL-PACKAGE.md';
const templatePaths = [
  'docs/templates/preview-deployment-evidence-template.md',
  'docs/templates/redacted-env-inventory-template.md',
  'docs/templates/go-no-go-decision-template.md',
];
const approvalDocPaths = [approvalPackagePath, ...templatePaths];
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

function assert(condition, message) {
  if (!condition) {
    fail(message);
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

function assertTrackedExactly(paths, label) {
  const tracked = gitLsFiles(paths).sort();
  const expected = [...paths].sort();

  assert(
    JSON.stringify(tracked) === JSON.stringify(expected),
    `${label} must be tracked exactly. Expected ${expected.join(', ')}; got ${tracked.join(', ')}`,
  );
}

function assertNoTracked(paths, label) {
  const tracked = gitLsFiles(paths);

  assert(tracked.length === 0, `${label} must not be tracked: ${tracked.join(', ')}`);
}

function assertIncludes(source, needle, label) {
  assert(source.includes(needle), `${label} is missing required text: ${needle}`);
}

function assertIncludesNormalized(source, needle, label) {
  const normalizedSource = source.replace(/\s+/g, ' ').trim();
  const normalizedNeedle = needle.replace(/\s+/g, ' ').trim();

  assert(
    normalizedSource.includes(normalizedNeedle),
    `${label} is missing required text: ${needle}`,
  );
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

function assertApprovalPackageDocs() {
  assertTrackedExactly(approvalDocPaths, 'preview approval package docs');

  const status = readRepoFile('docs/PHASE-STATUS.md');
  const roadmap = readRepoFile('docs/PHASE-ROADMAP.md');
  const readiness = readRepoFile('docs/PHASE-2-READINESS-PLAN.md');
  const decisionLog = readRepoFile('docs/DECISION-LOG.md');
  const checklist = readRepoFile('docs/checklists/PHASE-2-ADMIN-OPS.md');
  const approvalPackage = readRepoFile(approvalPackagePath);
  const templates = templatePaths.map(readRepoFile).join('\n');
  const combinedApprovalDocs = [approvalPackage, templates].join('\n');

  assertIncludes(
    status,
    'Current phase: Phase 2O-A/B - preview deployment approval package and operator evidence templates.',
    'phase status',
  );
  assertIncludes(
    status,
    'Latest completed capability: Phase 2N-A/B server runtime configuration hardening and deploy dry-run harness.',
    'phase status',
  );
  assertIncludes(status, 'Last merged capability PR: #119', 'phase status');
  assertIncludes(status, `Merge commit: \`${phase2nMergeCommit}\``, 'phase status');
  assertIncludesNormalized(
    roadmap,
    'Phase 2O-A/B adds preview deployment approval package docs and redacted operator evidence templates',
    'phase roadmap',
  );
  assertIncludes(readiness, 'Current Phase 2O-A/B status', 'readiness plan');
  assertIncludes(
    decisionLog,
    'Decision: Phase 2O-A/B adds preview deployment approval packaging and redacted operator evidence templates.',
    'decision log',
  );
  assertIncludes(
    checklist,
    '## Phase 2O-A/B Preview Deployment Approval Package And Operator Evidence Templates',
    'phase checklist',
  );

  for (const requiredText of [
    'This package does not approve deployment and does not deploy anything.',
    'A later current-turn approval is required before any deployment',
    'explicit later approval',
    'npm run validate:release-candidate',
    'npm run validate:deploy-dry-run',
    'npm run validate:preview-approval-package',
    'Supabase Cloud Review Checklist',
    'Vercel Project Review Checklist',
    'Server-Only Environment Setup Checklist',
    'Admin Access Review Checklist',
    'Public Listing And Quote Smoke Checklist',
    'Rollback And Abort Checklist',
    'Final Go/No-Go Decision Table',
  ]) {
    assertIncludes(approvalPackage, requiredText, approvalPackagePath);
  }

  for (const envName of serverRuntimeEnvNames) {
    assertIncludes(approvalPackage, envName, approvalPackagePath);
  }

  for (const requiredTemplateText of [
    'Do not commit filled production evidence.',
    'Do not commit screenshots containing secrets.',
    'Do not commit real env values.',
    'Store filled evidence outside the repo unless a later approved policy says otherwise.',
  ]) {
    assertIncludes(templates, requiredTemplateText, 'preview approval templates');
  }

  assertNoMatch(combinedApprovalDocs, /https?:\/\/|www\./i, 'approval docs');
  assertNoMatch(
    combinedApprovalDocs,
    /\b(?:sk|pk|rk|gh[pousr]|xox[baprs])_[A-Za-z0-9_-]{8,}\b/i,
    'approval docs',
  );
  assertNoMatch(combinedApprovalDocs, /eyJ[A-Za-z0-9_-]{20,}/, 'approval docs');
  assertNoMatch(combinedApprovalDocs, /-----BEGIN [A-Z ]+PRIVATE KEY-----/, 'approval docs');
  assertNoMatch(
    combinedApprovalDocs,
    /\b[A-Z][A-Z0-9_]{2,}\s*=\s*(?!<)[^\s|]+/,
    'approval docs',
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

  assertNoTracked(['vercel.json', 'website/vercel.json', '.vercel'], 'Vercel config');
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
  assertNoTracked(['website/app/api/customer-accounts'], 'customer account routes');
  assertNoTracked(['website/app/api/quote-tracking'], 'public quote tracking routes');
  assertNoTracked(['website/app/api/chat/retrieval'], 'chat retrieval routes');
  assertNoTracked(
    [
      'website/app/cart',
      'website/app/checkout',
      'website/app/orders',
      'website/app/payments',
      'website/app/api/cart',
      'website/app/api/checkout',
      'website/app/api/orders',
      'website/app/api/payments',
    ],
    'ecommerce routes',
  );
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

assertApprovalPackageDocs();
assertStaticScope();

console.log('Preview approval package validation passed. No deployment was performed.');
