#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const { assertPhase5tPostLaunchRemediationReadiness } = require('./public-review-polish-checks.cjs');
const phase153MergeCommit = '0e5379d21edd9ee67b9f929a3ba8e217d51ed17f';
const currentPhase = 'Phase 4F-A/B owner-facing review handoff bundle, approval issue template, and no-deploy preflight command center';
const latestCompletedCapability = 'Phase 4E-A/B owner approval request packet, preview-planning handoff template, and final no-deploy decision gate';
const phase4fDocs = [
  'docs/content/OWNER-FACING-REVIEW-BRIEF.md',
  '.github/ISSUE_TEMPLATE/owner-approval-request.md',
  'docs/content/NO-DEPLOY-PREFLIGHT-COMMAND-CENTER.md',
  'docs/OWNER-HANDOFF-BUNDLE.md',
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

function fail(message) { console.error(message); process.exit(1); }
function assert(condition, message) { if (!condition) fail(message); }
function readRepoFile(relativePath) { return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'); }
function normalizeWhitespace(value) { return value.replace(/\s+/g, ' ').trim(); }
function gitLsFiles(paths) {
  const result = spawnSync('git', ['ls-files', '--', ...paths], { cwd: repoRoot, encoding: 'utf8' });
  if (result.error || result.status !== 0) fail(`git ls-files failed: ${result.error?.message || result.stderr.trim()}`);
  return result.stdout.split(/\r?\n/).filter(Boolean);
}
function assertIncludes(source, needle, label) { assert(source.includes(needle), `${label} missing required text: ${needle}`); }
function assertNoMatch(source, pattern, label) {
  const match = source.match(pattern);
  assert(!match, `${label} contains forbidden text: ${match?.[0]}`);
}
function assertTracked(paths, label) {
  const tracked = gitLsFiles(paths).sort();
  const expected = [...paths].sort();
  assert(JSON.stringify(tracked) === JSON.stringify(expected), `${label} must be tracked exactly. Expected ${expected.join(', ')}; got ${tracked.join(', ')}`);
}
function assertNoTracked(paths, label) {
  const tracked = gitLsFiles(paths);
  assert(tracked.length === 0, `${label} must not be tracked: ${tracked.join(', ')}`);
}
function isProductionSource(filePath) {
  return sourceExtensions.has(path.extname(filePath)) && !/\.(?:test|spec)\.[cm]?[tj]sx?$/.test(filePath) && !filePath.startsWith('website/test/');
}
function trackedProductionSource(paths) {
  return gitLsFiles(paths).filter(isProductionSource).map((filePath) => `${filePath}\n${readRepoFile(filePath)}`).join('\n');
}

function assertPhase4fDocs() {
  assertTracked(phase4fDocs, 'Phase 4F docs/templates');
  const docs = normalizeWhitespace(phase4fDocs.map(readRepoFile).join('\n'));
  for (const required of [
    'repo-local, template-only, non-live',
    'not evidence',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Owner review question placeholder',
    'Current safe state',
    'Blocked action',
    'Required explicit owner response placeholder',
    'Evidence boundary',
    'Deployment boundary',
    'Public homepage wording',
    'Listings/categories/media wording',
    'Listing detail facts',
    'Quote/enquiry expectations',
    'Contact/business/service-area facts',
    'Legal/policy/guarantee claims',
    'Protected admin workflow',
    'Preview planning decision',
    'Deployment decision',
    'Owner content review approval',
    'Owner public wording approval',
    'Owner listing/category/media fact approval',
    'Owner quote/enquiry expectation approval',
    'Owner contact/business/service-area fact approval',
    'Owner legal/policy/guarantee wording approval',
    'Protected admin workflow review approval',
    'Preview planning approval',
    'Provider/environment setup approval',
    'Deployment approval',
    'Requested decision',
    'Scope of approval',
    'Target environment placeholder',
    'Provider/environment owner placeholder',
    'Rollback owner placeholder',
    'Evidence capture location placeholder',
    'Stop/rollback condition placeholder',
    'Explicit owner response placeholder',
    'Passing all commands does not equal owner approval',
    'Passing all commands does not equal provider approval',
    'Passing all commands does not equal deployment approval',
    'No preview smoke command is allowed in this phase',
    'Docker unavailability may be reported only in PR text; do not bypass Docker-required checks',
    'git diff --check',
    'npm run validate:owner-approval-request',
    'npm run validate:local-freeze',
    'npm run validate:owner-review-rehearsal',
    'npm run validate:preview-handoff',
    'npm run validate:local-release-candidate',
    'cd website && npm test',
    'cd website && npm run typecheck',
    'cd website && npm run build',
    'npm run validate:release-candidate-suite',
    'This bundle is not evidence',
    'It records no owner approval',
    'It performs no deployment',
    'It is a handoff bundle only',
  ]) assertIncludes(docs, required, 'Phase 4F docs/templates');
}

function assertStatusRollForward() {
  const statusDocs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    `Current phase: ${currentPhase}`,
    `Latest completed capability: ${latestCompletedCapability}`,
    'Last merged capability PR: #153',
    phase153MergeCommit,
    'validate:owner-handoff-bundle',
    ...phase4fDocs,
  ]) assertIncludes(statusDocs, required, 'Phase 4F status docs');
}

function assertAdminSnapshot() {
  const shell = readRepoFile('website/app/admin/protected-admin-shell.tsx');
  for (const required of [
    'phase4fOwnerHandoffBundleDocs',
    'phase4fOwnerHandoffBundleSnapshot',
    'Phase 4F handoff-bundle snapshot',
    'Owner-facing review brief',
    'Owner approval issue template',
    'No-deploy preflight command center',
    'Owner handoff bundle index',
    'Approval request boundary',
    'Evidence capture boundary',
    'Provider setup boundary',
    'Deployment approval boundary',
    ...phase4fDocs,
  ]) assertIncludes(shell, required, 'protected admin shell Phase 4F snapshot');
  const route = readRepoFile('website/app/admin/release-control/page.tsx');
  assertIncludes(route, 'view={{ kind: "release-control" }}', 'protected admin release-control route');
}

function assertForbiddenEvidenceAbsent() {
  const docsAndSource = [...phase4fDocs, 'website/app/admin/protected-admin-shell.tsx'].map((filePath) => `${filePath}\n${readRepoFile(filePath)}`).join('\n');
  assertNoMatch(docsAndSource, /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|preview evidence captured|production evidence captured|manual QA completed|acceptance passed on/i, 'Phase 4F docs/admin source');
}

function assertForbiddenTrackedPathsAbsent() {
  assertNoTracked([
    'website/chat-config.js', 'vercel.json', 'website/vercel.json', '.vercel', 'supabase/config.toml', 'supabase/.branches',
    '.env', '.env.local', '.env.development', '.env.production', '.env.test',
    'website/.env', 'website/.env.local', 'website/.env.development', 'website/.env.production', 'website/.env.test',
    'docs/evidence', 'docs/production-evidence', 'docs/owner-review-evidence', 'docs/preview-evidence',
    'website/app/api/customer-uploads', 'website/app/api/public/uploads', 'website/app/api/customer-accounts',
    'website/app/api/quote-tracking', 'website/app/api/quote-status', 'website/app/quote/status',
    'website/app/api/notifications', 'website/app/api/crm', 'website/app/api/chat/retrieval',
  ], 'forbidden runtime/provider/deployment/evidence files');
}

function assertPublicSourceSafe() {
  const publicSource = trackedProductionSource(publicSourceRoots);
  for (const required of ['listing', 'enquiry', 'quote', 'request', 'rental', 'event furniture']) {
    assert(new RegExp(required, 'i').test(publicSource), `public source must retain ${required} wording.`);
  }
  assertNoMatch(
    publicSource,
    /owner-facing review brief|owner approval issue template|no-deploy preflight command center|owner handoff bundle|owner approval request packet|preview-planning handoff template|final no-deploy decision gate|local release-candidate freeze|full-suite reliability gate|deployment-planning firewall closure|local owner-review rehearsal pack|local blocker ledger|local acceptance drill|release-control internals|owner-input queue internals|admin urls|internal notes|recovery lane statuses|destructive-action safeguards|status-transition matrix details|owner-review templates|protected admin urls|\/admin\//i,
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
  assertIncludes(suiteRunner, 'validate:owner-handoff-bundle', 'release-candidate suite');
  assertIncludes(suiteRunner, 'validate:owner-approval-request', 'release-candidate suite');
  assertIncludes(suiteRunner, 'test:supabase-rls', 'release-candidate suite');
  assertIncludes(suiteRunner, 'validate:supabase-migrations', 'release-candidate suite');
  assertNoMatch(suiteRunner, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');
  const testFiles = gitLsFiles(['website']).filter((filePath) => /\.(?:test|spec)\.[cm]?[tj]sx?$/.test(filePath));
  const combinedTests = testFiles.map((filePath) => `${filePath}\n${readRepoFile(filePath)}`).join('\n');
  assertNoMatch(combinedTests, /\b(?:describe|it|test)\.(?:skip|only)\s*\(/, 'website tests');
  assertNoMatch(combinedTests, /fake pass placeholder|placeholder pass|safety assertion removed|broad safety assertion remov/i, 'website tests');
}

function assertPackageScript() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(packageJson.scripts['validate:owner-handoff-bundle'] === 'node scripts/validate-owner-handoff-bundle.cjs', 'validate:owner-handoff-bundle script is missing.');
}

assertPhase4fDocs();
assertStatusRollForward();
assertAdminSnapshot();
assertForbiddenEvidenceAbsent();
assertForbiddenTrackedPathsAbsent();
assertPublicSourceSafe();
assertSuiteAndTestsNotWeakened();
assertPackageScript();

assertPhase5tPostLaunchRemediationReadiness();

console.log('Owner handoff bundle validation passed. No deployment was performed. This does not approve deployment.');
