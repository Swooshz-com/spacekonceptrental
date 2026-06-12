#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const { assertPhase5xMaintenanceApprovalReadiness } = require('./public-review-polish-checks.cjs');
const phase152MergeCommit = '10950d11ca6c40580982f35e615b3cf063f58a49';
const currentPhase = 'Phase 4E-A/B owner approval request packet, preview-planning handoff template, and final no-deploy decision gate';
const latestCompletedCapability = 'Phase 4D-A/B local release-candidate freeze, full-suite reliability gate, and deployment-planning firewall closure';
const phase4eDocs = [
  'docs/content/OWNER-APPROVAL-REQUEST-PACKET.md',
  'docs/content/PREVIEW-PLANNING-HANDOFF-TEMPLATE.md',
  'docs/content/FINAL-NO-DEPLOY-DECISION-GATE.md',
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
    .map((filePath) => `${filePath}\n${readRepoFile(filePath)}`)
    .join('\n');
}

function assertPhase4eDocs() {
  assertTracked(phase4eDocs, 'Phase 4E docs');
  const docs = normalizeWhitespace(phase4eDocs.map(readRepoFile).join('\n'));
  for (const required of [
    'repo-local, template-only, non-live, and not evidence',
    'Passing local validators',
    'does not equal owner approval',
    'Owner content review approval',
    'Owner public wording approval',
    'Owner listing/category/media fact approval',
    'Owner quote/enquiry expectation approval',
    'Owner contact/business/service-area fact approval',
    'Owner legal/policy/guarantee wording approval',
    'Owner protected admin workflow review approval',
    'Preview planning approval',
    'Provider/environment setup approval',
    'Deployment approval',
    'Approval request category',
    'What approval would allow',
    'What approval would not allow',
    'Required owner response placeholder',
    'Current status',
    'Evidence boundary',
    'Deployment boundary',
    '[OWNER RESPONSE PLACEHOLDER:',
    '[OWNER APPROVAL REQUIRED / NOT RECORDED]',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Explicit owner approval',
    'Named target environment',
    'Provider access confirmation',
    'Required env/secrets owner',
    'Rollback owner',
    'Smoke test scope',
    'Public route checklist',
    'Protected admin checklist',
    'Quote/enquiry checklist',
    'Evidence capture location',
    'Stop/rollback condition',
    'This PR does not perform preview planning',
    'This PR does not create preview evidence',
    'This PR does not approve provider setup',
    'This PR does not approve deployment',
    'No approval requested',
    'Owner approval required',
    'Preview planning blocked',
    'Provider setup blocked',
    'Deployment blocked',
    'Evidence capture blocked',
    'Owner sign-off not recorded',
    'Allowed now',
    'Blocked now',
    'Required to unblock',
    'Forbidden shortcut',
  ]) {
    assertIncludes(docs, required, 'Phase 4E docs');
  }
}

function assertStatusRollForward() {
  const statusDocs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    `Current phase: ${currentPhase}`,
    `Latest completed capability: ${latestCompletedCapability}`,
    'Last merged capability PR: #152',
    phase152MergeCommit,
    'validate:owner-approval-request',
    ...phase4eDocs,
  ]) {
    assertIncludes(statusDocs, required, 'Phase 4E status docs');
  }
}

function assertAdminSnapshot() {
  const shell = readRepoFile('website/app/admin/protected-admin-shell.tsx');
  for (const required of [
    'phase4eOwnerApprovalRequestDocs',
    'phase4eOwnerApprovalRequestSnapshot',
    'Phase 4E approval-request snapshot',
    'Owner approval request packet',
    'Preview-planning handoff template',
    'Final no-deploy decision gate',
    'Approval request boundary',
    'Owner sign-off boundary',
    'Evidence capture boundary',
    'Provider setup boundary',
    'Deployment approval boundary',
    ...phase4eDocs,
  ]) {
    assertIncludes(shell, required, 'protected admin shell Phase 4E snapshot');
  }
  const route = readRepoFile('website/app/admin/release-control/page.tsx');
  assertIncludes(route, 'view={{ kind: "release-control" }}', 'protected admin release-control route');
}

function assertForbiddenEvidenceAbsent() {
  const docsAndSource = [
    ...phase4eDocs,
    'website/app/admin/protected-admin-shell.tsx',
  ].map((filePath) => `${filePath}\n${readRepoFile(filePath)}`).join('\n');
  assertNoMatch(
    docsAndSource,
    /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|preview evidence captured|production evidence captured|manual QA completed|acceptance passed on/i,
    'Phase 4E docs/admin source',
  );
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
  assertNoMatch(
    publicSource,
    /owner approval request packet|preview-planning handoff template|final no-deploy decision gate|local release-candidate freeze|full-suite reliability gate|deployment-planning firewall closure|local owner-review rehearsal pack|local blocker ledger|local acceptance drill|owner-input intake control|local correction queue|review-ready handoff closure|release-control internals|owner-input queue internals|admin urls|internal notes|recovery lane statuses|destructive-action safeguards|status-transition matrix details|owner-review templates|protected admin urls|\/admin\//i,
    'public source',
  );
  assertNoMatch(publicSource, /\b(?:ecommerce|cart|checkout|order|payment|purchase|booking|reservation|fulfilment|stock-reservation)s?\b/i, 'public source');
  assertNoMatch(publicSource, /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i, 'public source');
  assertNoMatch(publicSource, /public quote tracking|customer account|customer upload|CRM|notification/i, 'public source');

  const appAndLibSource = trackedProductionSource(['website/app', 'website/components', 'website/lib']);
  const packageSource = readRepoFile('package.json') + readRepoFile('website/package.json');
  assertNoMatch(packageSource, /@pinecone-database|pinecone/i, 'package manifests');
  assertNoMatch(appAndLibSource, /NEXT_PUBLIC_SUPABASE|NEXT_PUBLIC_N8N|SUPABASE_SERVICE_ROLE|PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i, 'app/lib source');
}

function assertSuiteAndTestsNotWeakened() {
  const suiteRunner = readRepoFile('scripts/validate-release-candidate-suite.cjs');
  assertIncludes(suiteRunner, 'validate:owner-approval-request', 'release-candidate suite');
  assertIncludes(suiteRunner, 'validate:local-freeze', 'release-candidate suite');
  assertIncludes(suiteRunner, 'test:supabase-rls', 'release-candidate suite');
  assertIncludes(suiteRunner, 'validate:supabase-migrations', 'release-candidate suite');
  assertNoMatch(suiteRunner, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');

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
    packageJson.scripts['validate:owner-approval-request'] === 'node scripts/validate-owner-approval-request.cjs',
    'validate:owner-approval-request script is missing.',
  );
}

assertPhase4eDocs();
assertStatusRollForward();
assertAdminSnapshot();
assertForbiddenEvidenceAbsent();
assertForbiddenTrackedPathsAbsent();
assertPublicSourceSafe();
assertSuiteAndTestsNotWeakened();
assertPackageScript();
assertPhase4fOwnerHandoffBundle();

assertPhase5xMaintenanceApprovalReadiness();

console.log('Owner approval request validation passed. No deployment was performed. This does not approve deployment.');
