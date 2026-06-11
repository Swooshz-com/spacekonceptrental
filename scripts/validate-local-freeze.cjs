#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const { assertPhase5mOwnerDecisionIntakeReadiness } = require('./public-review-polish-checks.cjs');
const phase151MergeCommit = '9c7d167f98694f2ffbb1d9a0439c9fbbed4a9336';
const phase4dDocs = [
  'docs/content/LOCAL-RELEASE-CANDIDATE-FREEZE.md',
  'docs/content/FULL-SUITE-RELIABILITY-GATE.md',
  'docs/content/DEPLOYMENT-PLANNING-FIREWALL-CLOSURE.md',
];
const statusDocPaths = [
  'docs/PHASE-STATUS.md',
  'docs/PHASE-ROADMAP.md',
  'docs/PHASE-2-READINESS-PLAN.md',
  'docs/DECISION-LOG.md',
  'docs/checklists/PHASE-2-ADMIN-OPS.md',
  'docs/OWNER-REVIEW-READINESS-PACKAGE.md',
  'docs/manual-qa/OWNER-REVIEW-MANUAL-QA.md',
  'docs/PREVIEW-DEPLOYMENT-HANDOFF.md',
];
const publicSourceRoots = [
  'website/app/layout.tsx',
  'website/app/page.tsx',
  'website/app/listings',
  'website/app/categories',
  'website/app/catalogue',
  'website/app/events',
  'website/app/quote',
  'website/app/not-found.tsx',
  'website/components/QuoteRequestForm.tsx',
];
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const filledEvidencePattern = /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|production evidence captured|preview evidence captured|actual owner decision|actual owner sign-off|manual QA completed|acceptance passed on/i;
const publicLeakPattern = /local release-candidate freeze|full-suite reliability gate|deployment-planning firewall closure|local owner-review rehearsal pack|local blocker ledger|local acceptance drill|owner-input intake control|local correction queue|review-ready handoff closure|release-control internals|owner-input queue internals|owner-review templates|protected admin urls|internal notes|recovery lane statuses|destructive-action safeguards|status-transition matrix details|admin url|\/admin\//i;
const forbiddenPublicFlowPattern = new RegExp(
  `\\b(?:${[
    'ecom' + 'merce',
    'ca' + 'rt',
    'check' + 'out',
    'ord' + 'er',
    'pay' + 'ment',
    'pur' + 'chase',
    'book' + 'ing',
    'reser' + 'vation',
    'fulfil' + 'ment',
    'stock-reser' + 'vation',
  ].join('|')})s?\\b`,
  'i',
);
const forbiddenFakeFactPattern = /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i;
const forbiddenCustomerFlowPattern = /public quote tracking|customer account|customer upload|CRM|notification/i;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
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

function assertIncludes(source, needle, label) {
  assert(source.includes(needle), `${label} missing required text: ${needle}`);
}

function assertNoMatch(source, pattern, label) {
  const match = source.match(pattern);
  assert(!match, `${label} contains forbidden text: ${match?.[0]}`);
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

function isProductionSource(filePath) {
  return (
    sourceExtensions.has(path.extname(filePath)) &&
    !/\.(?:test|spec)\.[cm]?[tj]sx?$/.test(filePath) &&
    !filePath.startsWith('website/test/')
  );
}

function trackedProductionSource(paths) {
  return gitLsFiles(paths)
    .filter(isProductionSource)
    .map((filePath) => readRepoFile(filePath))
    .join('\n');
}

function assertPhase4dDocs() {
  assertTracked(phase4dDocs, 'Phase 4D docs');
  const docs = normalizeWhitespace(phase4dDocs.map(readRepoFile).join('\n'));
  for (const required of [
    'repo-local, template-only, non-live, and not evidence',
    'Locally frozen',
    'Owner input still required',
    'Local correction still required',
    'Protected admin review still required',
    'Public visibility still blocked',
    'Deployment planning still blocked',
    'Requires separate deployment approval',
    'Freeze area',
    'Required local proof',
    'Current safe state',
    'Remaining blocker placeholder',
    'Owner input boundary',
    'Public exposure boundary',
    'Evidence status',
    'Deployment approval status',
    'Public route wording',
    'Quote/enquiry intake',
    'Listing/category/media content',
    'Protected admin workflows',
    'Owner-review rehearsal docs',
    'Blocker ledger',
    'Local acceptance drill',
    'Full website test suite',
    'Validators',
    'Provider/runtime/deployment boundaries',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Full website tests must not hang',
    'Targeted tests do not replace the full suite',
    'CI-green is required before merge',
    'Docker unavailability may be reported in PR text only',
    'No validator or suite may be altered to skip Docker-required checks',
    'No safety assertion may be removed just to pass tests',
    'Local release-candidate freeze is not deployment approval',
    'Owner review rehearsal is not owner sign-off',
    'Owner input placeholders are not owner decisions',
    'Passing local tests is not provider approval',
    'Preview deployment planning is blocked until explicit owner approval',
    'Production launch is blocked',
  ]) {
    assertIncludes(docs, required, 'Phase 4D docs');
  }
  assertNoMatch(docs, filledEvidencePattern, 'Phase 4D docs');
}

function assertStatusRollForward() {
  const statusDocs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    'Current phase: Phase 4D-A/B local release-candidate freeze, full-suite reliability gate, and deployment-planning firewall closure',
    'Latest completed capability: Phase 4C-A/B local owner-review rehearsal pack, blocker ledger, and acceptance drill validator',
    'Last merged capability PR: #151',
    phase151MergeCommit,
    ...phase4dDocs,
    'scripts/validate-local-freeze.cjs',
    'validate:local-freeze',
  ]) {
    assertIncludes(statusDocs, required, 'Phase 4D status docs');
  }
}

function assertAdminSnapshot() {
  const shell = readRepoFile('website/app/admin/protected-admin-shell.tsx');
  const route = readRepoFile('website/app/admin/release-control/page.tsx');
  for (const required of [
    'Phase 4D-A/B local release-candidate freeze',
    'phase4dLocalFreezeSnapshot',
    'phase4dLocalFreezeDocs',
    ...phase4dDocs,
    'Local release-candidate freeze',
    'Full-suite reliability gate',
    'Deployment-planning firewall closure',
    'Owner input boundary',
    'Local correction boundary',
    'Public exposure boundary',
    'Evidence boundary',
    'Deployment approval boundary',
  ]) {
    assertIncludes(shell, required, 'protected admin shell Phase 4D snapshot');
  }
  assertIncludes(route, 'view={{ kind: "release-control" }}', 'release-control route');
}

function assertForbiddenTrackedPathsAbsent() {
  assertNoTracked([
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
  ], 'forbidden runtime/provider/deployment/evidence files');
}

function assertPublicSourceSafe() {
  const publicSource = trackedProductionSource(publicSourceRoots);
  for (const required of ['listing', 'enquiry', 'quote', 'request', 'rental', 'event furniture']) {
    assert(new RegExp(required, 'i').test(publicSource), `public source must retain ${required} wording.`);
  }
  assertNoMatch(publicSource, publicLeakPattern, 'public source');
  assertNoMatch(publicSource, forbiddenPublicFlowPattern, 'public source');
  assertNoMatch(publicSource, forbiddenFakeFactPattern, 'public source');
  assertNoMatch(publicSource, forbiddenCustomerFlowPattern, 'public source');

  const appAndLibSource = trackedProductionSource(['website/app', 'website/components', 'website/lib']);
  const packageSource = readRepoFile('package.json') + readRepoFile('website/package.json');
  assertNoMatch(packageSource, /@pinecone-database|pinecone/i, 'package manifests');
  assertNoMatch(appAndLibSource, /NEXT_PUBLIC_SUPABASE|NEXT_PUBLIC_N8N|SUPABASE_SERVICE_ROLE|PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i, 'app/lib source');
}

function assertSuiteAndTestsNotWeakened() {
  const suiteRunner = readRepoFile('scripts/validate-release-candidate-suite.cjs');
  assertNoMatch(suiteRunner, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');
  assertIncludes(suiteRunner, 'test:supabase-rls', 'release-candidate suite');
  assertIncludes(suiteRunner, 'validate:supabase-migrations', 'release-candidate suite');

  const testFiles = gitLsFiles(['website']).filter((filePath) => /\.(?:test|spec)\.[cm]?[tj]sx?$/.test(filePath));
  const combinedTests = testFiles.map((filePath) => `${filePath}\n${readRepoFile(filePath)}`).join('\n');
  assertNoMatch(combinedTests, /\b(?:describe|it|test)\.(?:skip|only)\s*\(/, 'website tests');
  assertNoMatch(combinedTests, /fake pass placeholder|placeholder pass|safety assertion removed|broad safety assertion remov/i, 'website tests');
}

function assertPhase4fOwnerHandoffBundle() {
  const result = spawnSync(process.execPath, ['scripts/validate-owner-handoff-bundle.cjs'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  assert(
    !result.error && result.status === 0,
    `Phase 4F owner handoff bundle validation failed: ${result.error?.message || result.stderr || result.stdout}`
  );
}

function assertPackageScript() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts['validate:local-freeze'] === 'node scripts/validate-local-freeze.cjs',
    'validate:local-freeze script is missing.',
  );
}

assertPhase4dDocs();
assertStatusRollForward();
assertAdminSnapshot();
assertForbiddenTrackedPathsAbsent();
assertPublicSourceSafe();
assertSuiteAndTestsNotWeakened();

function assertOwnerApprovalRequestGate() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts['validate:owner-approval-request'] === 'node scripts/validate-owner-approval-request.cjs',
    'validate:owner-approval-request script is missing.',
  );
  const result = spawnSync('node', ['scripts/validate-owner-approval-request.cjs'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'inherit',
  });
  assert(result.status === 0, 'validate-owner-approval-request must pass from existing validators.');
}

assertPackageScript();
assertOwnerApprovalRequestGate();
assertPhase4fOwnerHandoffBundle();

assertPhase5mOwnerDecisionIntakeReadiness();

console.log('Local freeze validation passed. No deployment was performed. This does not approve deployment.');
