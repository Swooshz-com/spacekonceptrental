const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const acceptanceMatrixPath =
  'docs/content/LOCAL-RELEASE-CANDIDATE-ACCEPTANCE-MATRIX.md';
const routeInventoryFreezePath = 'docs/content/LOCAL-ROUTE-INVENTORY-FREEZE.md';
const protectedAdminShellPath = 'website/app/admin/protected-admin-shell.tsx';
const phase3rMergeCommit = 'ef18c2357d37fdb613851c427130bb108861de31';
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const forbiddenCustomerFlowTermPattern = new RegExp(
  `\\b(?:${[
    'ecom' + 'merce',
    'ca' + 'rt',
    'check' + 'out',
    'ord' + 'er',
    'pay' + 'ment',
    'pur' + 'chase',
    'trans' + 'action',
    'ret' + 'ail',
  ].join('|')})s?\\b`,
  'i',
);
const publicInternalLeakPattern =
  /Owner-demo|walkthrough|closure readiness|deployment approval|internal review|admin-only|protected content readiness|owner input required|issue backlog|route decision matrix|\/admin\/content-readiness|release-candidate acceptance matrix|route inventory freeze|acceptance status|local release-candidate/i;
const forbiddenBusinessFactPattern =
  /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy/i;
const forbiddenContactFactPattern =
  /\b(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i;
const filledEvidencePattern =
  /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|production evidence captured|preview evidence captured|actual owner decision|actual owner sign-off|manual QA completed|acceptance passed on/i;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function gitLsFiles(paths) {
  const result = spawnSync('git', ['ls-files', '--', ...paths], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  if (result.error || result.status !== 0) {
    fail(`git ls-files failed: ${result.error?.message || result.stderr.trim()}`);
  }

  return result.stdout.split(/\r?\n/).filter(Boolean);
}

function assertTracked(paths, label) {
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

function assertNoMatch(source, pattern, label) {
  assert(!pattern.test(source), `${label} contains forbidden content.`);
}

function normalizeWhitespace(source) {
  return source.replace(/\s+/g, ' ').trim();
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
    .map((filePath) => readRepoFile(filePath))
    .join('\n');
}

function assertAcceptanceMatrix() {
  const matrix = readRepoFile(acceptanceMatrixPath);
  const normalized = normalizeWhitespace(matrix);

  assertTracked([acceptanceMatrixPath], 'local release-candidate acceptance matrix');

  for (const required of [
    'This matrix is repo-local, template-only, non-live, and not evidence.',
    'Public route inventory',
    'Protected admin route inventory',
    'Route purpose',
    'Audience',
    'Allowed public wording',
    'Forbidden public wording',
    'Data boundary',
    'Owner input status',
    'Deployment boundary',
    'Acceptance status placeholder',
    'Follow-up placeholder',
    '[ROUTE]',
    '[PUBLIC / PROTECTED ADMIN]',
    '[PURPOSE]',
    '[DATA BOUNDARY]',
    '[ACCEPTANCE STATUS: NOT RUN / PASS / NEEDS FOLLOW-UP]',
    '[OWNER INPUT REQUIRED]',
    '[LOCAL FOLLOW-UP]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
  ]) {
    assertIncludes(normalized, required, 'local release-candidate acceptance matrix');
  }

  assertNoMatch(matrix, filledEvidencePattern, 'local release-candidate acceptance matrix');
  assertNoMatch(matrix, forbiddenBusinessFactPattern, 'local release-candidate acceptance matrix');
  assertNoMatch(matrix, forbiddenContactFactPattern, 'local release-candidate acceptance matrix');
}

function assertRouteInventoryFreeze() {
  const routeFreeze = readRepoFile(routeInventoryFreezePath);
  const normalized = normalizeWhitespace(routeFreeze);

  assertTracked([routeInventoryFreezePath], 'local route inventory freeze');

  for (const required of [
    'This is a freeze of local expectations only.',
    'It is not production route evidence.',
    'It is not preview evidence.',
    'Public homepage',
    'Public listings/catalogue index',
    'Public listing detail',
    'Public categories',
    'Public category-to-listing journey',
    'Public events/event-use guidance',
    'Public quote/enquiry request',
    'Public not-found/recovery',
    'Protected admin overview',
    'Protected admin listings/categories/media',
    'Protected admin quote inbox/detail',
    'Protected content readiness workspace',
    'Audience',
    'Public/admin visibility',
    'Allowed wording',
    'Forbidden public leakage',
    'Data boundary',
    'Expected local test coverage',
    'Deployment boundary',
  ]) {
    assertIncludes(normalized, required, 'local route inventory freeze');
  }

  assertNoMatch(routeFreeze, filledEvidencePattern, 'local route inventory freeze');
  assertNoMatch(routeFreeze, forbiddenBusinessFactPattern, 'local route inventory freeze');
  assertNoMatch(routeFreeze, forbiddenContactFactPattern, 'local route inventory freeze');
}

function assertStatusDocs() {
  const status = readRepoFile('docs/PHASE-STATUS.md');
  const currentStatus = normalizeWhitespace(
    status.split('Previous Current Phase 3R-A/B status:')[0] || status,
  );
  const roadmap = normalizeWhitespace(readRepoFile('docs/PHASE-ROADMAP.md'));
  const readiness = readRepoFile('docs/PHASE-2-READINESS-PLAN.md');
  const decisionLog = readRepoFile('docs/DECISION-LOG.md');
  const checklist = readRepoFile('docs/checklists/PHASE-2-ADMIN-OPS.md');
  const ownerReviewDocs = normalizeWhitespace(
    [
      readRepoFile('docs/OWNER-REVIEW-READINESS-PACKAGE.md'),
      readRepoFile('docs/manual-qa/OWNER-REVIEW-MANUAL-QA.md'),
      readRepoFile('docs/PREVIEW-DEPLOYMENT-HANDOFF.md'),
    ].join('\n'),
  );

  for (const required of [
    'Current phase: Phase 3S-A/B - repo-local release-candidate acceptance gate, route inventory freeze, and public/admin regression harness.',
    'Latest completed capability: Phase 3R-A/B repo-local product acceptance hardening, public/admin route polish, and owner-demo issue backlog readiness.',
    'Last merged capability PR: #140',
    `Merge commit: \`${phase3rMergeCommit}\``,
  ]) {
    assertIncludes(currentStatus, required, 'Phase 3S status');
  }

  assertIncludes(status, 'Previous Current Phase 3R-A/B status', 'Phase 3S status');
  assertIncludes(
    roadmap,
    'Phase 3S-A/B adds a repo-local release-candidate acceptance gate, route inventory freeze, and public/admin regression harness',
    'Phase 3S roadmap',
  );
  assertIncludes(readiness, 'Current Phase 3S-A/B status', 'Phase 3S readiness');
  assertIncludes(readiness, 'Previous Current Phase 3R-A/B status', 'Phase 3S readiness');
  assertIncludes(
    decisionLog,
    'Decision: Phase 3S-A/B adds a repo-local release-candidate acceptance gate, route inventory freeze, and public/admin regression harness.',
    'Phase 3S decision log',
  );
  assertIncludes(
    checklist,
    '## Phase 3S-A/B Local Release-Candidate Acceptance Gate Route Inventory Freeze And Public-Admin Regression Harness',
    'Phase 3S checklist',
  );
  assertIncludes(ownerReviewDocs, acceptanceMatrixPath, 'owner review docs');
  assertIncludes(ownerReviewDocs, routeInventoryFreezePath, 'owner review docs');
  assertIncludes(ownerReviewDocs, 'local release-candidate acceptance gate', 'owner review docs');
}

function assertProtectedAdminShell() {
  const shell = readRepoFile(protectedAdminShellPath);

  assertIncludes(shell, acceptanceMatrixPath, 'protected admin shell');
  assertIncludes(shell, routeInventoryFreezePath, 'protected admin shell');
  assertIncludes(shell, 'localAcceptanceSnapshot', 'protected admin shell');
  assertIncludes(shell, 'localAcceptanceLastLocalUpdate', 'protected admin shell');
  assertIncludes(shell, 'Local release-candidate acceptance snapshot', 'protected admin shell');
}

function assertPublicSourceBoundary() {
  const publicSource = readTrackedProductionSources([
    'website/app/layout.tsx',
    'website/app/page.tsx',
    'website/app/listings',
    'website/app/categories',
    'website/app/catalogue',
    'website/app/events',
    'website/app/quote',
    'website/app/not-found.tsx',
    'website/components/QuoteRequestForm.tsx',
  ]);
  const appAndLibSource = readTrackedProductionSources([
    'website/app',
    'website/components',
    'website/lib',
  ]);
  const packageSource = [
    readRepoFile('package.json'),
    readRepoFile('website/package.json'),
  ].join('\n');

  for (const required of ['listing', 'enquiry', 'quote', 'request', 'rental', 'event furniture']) {
    assert(new RegExp(required, 'i').test(publicSource), `public source is missing ${required}`);
  }

  assertNoMatch(publicSource, forbiddenContactFactPattern, 'public source');
  assertNoMatch(publicSource, forbiddenBusinessFactPattern, 'public source');
  assertNoMatch(publicSource, forbiddenCustomerFlowTermPattern, 'public source');
  assertNoMatch(publicSource, publicInternalLeakPattern, 'public source');
  assertNoMatch(packageSource, /@pinecone-database|pinecone/i, 'package source');
  assert(!appAndLibSource.includes('NEXT_PUBLIC_SUPABASE'), 'browser Supabase public env must not be added.');
  assert(!appAndLibSource.includes('NEXT_PUBLIC_N8N'), 'browser n8n public env must not be added.');
  assert(!appAndLibSource.includes('SUPABASE_SERVICE_ROLE'), 'service-role runtime paths must not be added.');
  assertNoMatch(appAndLibSource, /PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i, 'app/lib source');
}

function assertForbiddenTrackedPathsAbsent() {
  assertNoTracked(
    [
      'website/chat-config.js',
      'vercel.json',
      'website/vercel.json',
      '.vercel',
      'supabase/config.toml',
      'supabase/.branches',
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
      'docs/evidence',
      'docs/production-evidence',
      'docs/owner-review-evidence',
      'docs/preview-evidence',
      'website/app/api/customer-uploads',
      'website/app/api/public/uploads',
      'website/app/api/customer-accounts',
      'website/app/api/quote-tracking',
      'website/app/api/quote-status',
      'website/app/quote/status',
      'website/app/api/notifications',
      'website/app/api/crm',
      'website/app/api/chat/retrieval',
    ],
    'forbidden local/provider/runtime/evidence files',
  );
}

function assertPackageAndCi() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  const workflow = readRepoFile('.github/workflows/ci.yml');

  assert(
    packageJson.scripts['validate:local-release-candidate'] ===
      'node scripts/validate-local-release-candidate.cjs',
    'validate:local-release-candidate script is missing.',
  );
  assertIncludes(workflow, 'npm run validate:local-release-candidate', '.github/workflows/ci.yml');
}

assertAcceptanceMatrix();
assertRouteInventoryFreeze();
assertStatusDocs();
assertProtectedAdminShell();
assertPublicSourceBoundary();
assertForbiddenTrackedPathsAbsent();
assertPackageAndCi();

console.log('Local release-candidate validation passed. No deployment was performed. This does not approve deployment.');
