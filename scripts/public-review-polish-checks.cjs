const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const phase154MergeCommit = '85bfc8fb459cfc74db3ff80634ff35302691cb7f';
const phase155MergeCommit = '00b750ab34f433f1d4ca5567828b73e8ddeb3d05';
const currentPhase5a = 'Phase 5A-A/B public owner-review polish sweep, local content-readiness cleanup, and protected admin review UX closure';
const currentPhase5b = 'Phase 5B-A/B public catalogue-to-enquiry journey hardening, listing continuity, and admin/public parity checks';
const latestCompletedPhase4f = 'Phase 4F-A/B owner-facing review handoff bundle, approval issue template, and no-deploy preflight command center';
const cleanupDocPath = 'docs/content/LOCAL-CONTENT-READINESS-CLEANUP.md';
const publicJourneyAcceptanceDocPath = 'docs/content/LOCAL-PUBLIC-JOURNEY-ACCEPTANCE.md';
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
const statusDocPaths = [
  'docs/PHASE-STATUS.md',
  'docs/PHASE-ROADMAP.md',
  'docs/PHASE-2-READINESS-PLAN.md',
  'docs/DECISION-LOG.md',
  'docs/checklists/PHASE-2-ADMIN-OPS.md',
  'docs/OWNER-REVIEW-READINESS-PACKAGE.md',
  'docs/manual-qa/OWNER-REVIEW-MANUAL-QA.md',
  'docs/PREVIEW-DEPLOYMENT-HANDOFF.md',
  'docs/OWNER-HANDOFF-BUNDLE.md',
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
    `${label} must be tracked exactly. Expected ${expected.join(', ')}; got ${tracked.join(', ')}`
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
function readTrackedProductionSources(paths) {
  return gitLsFiles(paths)
    .filter(isProductionSource)
    .map((filePath) => `${filePath}\n${readRepoFile(filePath)}`)
    .join('\n');
}
function readTrackedFiles(paths) {
  return gitLsFiles(paths).map((filePath) => `${filePath}\n${readRepoFile(filePath)}`).join('\n');
}

function assertPhase5aStatusRollForward() {
  const docs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    `Current phase: ${currentPhase5a}`,
    `Latest completed capability: ${latestCompletedPhase4f}`,
    'Last merged capability PR: #154',
    `Last merged capability merge commit: ${phase154MergeCommit}`,
    cleanupDocPath,
    publicJourneyAcceptanceDocPath,
    'scripts/validate-public-review-polish.cjs',
    'No deployment is performed or approved by Phase 5A-A/B',
  ]) {
    assertIncludes(docs, required, 'Phase 5A status roll-forward docs');
  }
}

function assertCleanupDoc() {
  assertTracked([cleanupDocPath], 'Phase 5A cleanup doc');
  const doc = normalizeWhitespace(readRepoFile(cleanupDocPath));
  for (const required of [
    'repo-local, template-only, non-live cleanup note',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Public copy made safer',
    'Owner inputs still missing',
    'Public claims still blocked',
    'Admin-only review helpers',
    'Must still not be deployed',
    'docs/OWNER-HANDOFF-BUNDLE.md',
    'docs/content/OWNER-FACING-REVIEW-BRIEF.md',
    '.github/ISSUE_TEMPLATE/owner-approval-request.md',
    'docs/content/NO-DEPLOY-PREFLIGHT-COMMAND-CENTER.md',
  ]) {
    assertIncludes(doc, required, 'Phase 5A cleanup doc');
  }
  assertNoMatch(
    doc,
    /owner approved|owner sign-?off complete|actual owner decision|accepted by owner|preview evidence captured|production evidence captured|manual qa completed/i,
    'Phase 5A cleanup doc'
  );
}

function assertPackageScript() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts?.['validate:public-review-polish'] === 'node scripts/validate-public-review-polish.cjs',
    'package.json must register validate:public-review-polish'
  );
}

function assertPublicSources() {
  const source = readTrackedProductionSources(publicSourceRoots);
  assert(/\b(?:listing|listings)\b/i.test(source), 'Public source must retain listing wording');
  assert(/\b(?:rental|rentals)\b/i.test(source), 'Public source must retain rental wording');
  assert(/\b(?:quote|enquiry|request)\b/i.test(source), 'Public source must retain quote/enquiry/request wording');

  assertNoMatch(source, /\b(?:cart|checkout|payment|purchase|online ordering|confirmed order)\b/i, 'public production source');
  assertNoMatch(source, /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'public production source');
  assertNoMatch(
    source,
    /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i,
    'public production source'
  );
  assertNoMatch(
    source,
    /owner handoff bundle|owner-facing review brief|owner approval issue template|no-deploy preflight command center|owner approval packet|release-control internals|admin urls?|internal notes|recovery lanes?|destructive-action safeguards|status-transition matrix|\/admin\//i,
    'public production source'
  );
  assertNoMatch(
    source,
    /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b/i,
    'public production source'
  );
}

function assertNoForbiddenTrackedFiles() {
  assertNoTracked(
    [
      'vercel.json',
      '.vercel',
      '.env',
      '.env.local',
      '.env.production',
      'website/.env',
      'website/.env.local',
      'website/.env.production',
      'website/chat-config.js',
    ],
    'forbidden runtime/provider/deployment files'
  );
}

function assertNoFilledEvidence() {
  const docsAndTemplates = readTrackedFiles(['docs', '.github/ISSUE_TEMPLATE']);
  assertNoMatch(
    docsAndTemplates,
    /owner approved|owner sign-?off complete|actual owner decision|actual owner feedback|accepted by owner|preview evidence captured|production evidence captured|smoke evidence captured|sign-off evidence captured/i,
    'docs and issue templates'
  );
}

function assertSuiteAndTests() {
  const suite = readRepoFile('scripts/validate-release-candidate-suite.cjs');
  assertIncludes(suite, "args: ['run', 'validate:public-review-polish']", 'release-candidate suite');
  assertNoMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');

  const websiteTests = readTrackedFiles(['website/app', 'website/components', 'website/test']);
  assertNoMatch(websiteTests, /\b(?:describe|it|test)\.(?:skip|only)\s*\(/, 'website tests');
  assertNoMatch(websiteTests, /fake pass placeholder|placeholder pass|safety assertion removed|broad safety assertion remov/i, 'website tests');
}

function assertPhase5bStatusRollForward() {
  const docs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    `Current phase: ${currentPhase5b}`,
    `Latest completed capability: ${currentPhase5a}`,
    'Last merged capability PR: #155',
    `Last merged capability merge commit: ${phase155MergeCommit}`,
    publicJourneyAcceptanceDocPath,
    cleanupDocPath,
    'scripts/validate-public-journey-acceptance.cjs',
    'No deployment is performed or approved by Phase 5B-A/B',
  ]) {
    assertIncludes(docs, required, 'Phase 5B status roll-forward docs');
  }
}

function assertPublicJourneyAcceptanceDoc() {
  assertTracked([publicJourneyAcceptanceDocPath], 'Phase 5B public journey acceptance doc');
  const doc = normalizeWhitespace(readRepoFile(publicJourneyAcceptanceDocPath));
  for (const required of [
    'repo-local, template-only, non-live public journey acceptance note',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Public browse path',
    'Catalogue, listing, category, and event continuity',
    'Listing-to-enquiry continuity',
    'Quote/enquiry receipt boundary',
    'Public fallback and not-found safety',
    'Protected admin public-parity review helper',
    'Owner inputs still missing',
    'Public claims still blocked',
    'docs/OWNER-HANDOFF-BUNDLE.md',
    'docs/content/LOCAL-CONTENT-READINESS-CLEANUP.md',
  ]) {
    assertIncludes(doc, required, 'Phase 5B public journey acceptance doc');
  }
  assertNoMatch(
    doc,
    /owner approved|owner sign-?off complete|actual owner decision|accepted by owner|preview evidence captured|production evidence captured|manual qa completed/i,
    'Phase 5B public journey acceptance doc'
  );
}

function assertPublicJourneyPackageScript() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts?.['validate:public-journey-acceptance'] === 'node scripts/validate-public-journey-acceptance.cjs',
    'package.json must register validate:public-journey-acceptance'
  );
}

function assertPublicJourneySources() {
  const source = readTrackedProductionSources(publicSourceRoots);
  for (const required of [
    /Browse listings/i,
    /View rental listing/i,
    /Request a quote/i,
    /Send an enquiry/i,
    /Start a rental enquiry/i,
  ]) {
    assert(required.test(source), `public production source missing safe CTA: ${required}`);
  }
  assert(/selected listing/i.test(source), 'Quote/enquiry source must retain selected listing context');
  assert(/starting point only/i.test(source), 'Selected listing context must be a starting point only');
  assert(/editable request|request text|requested listings or items/i.test(source), 'Selected listing context must remain editable/request intake');
  assertNoMatch(source, /confirmed|reserved|booked|ordered|paid|completed rental|guaranteed availability|response time/i, 'public production source');
}

function assertReleaseSuiteHasPublicJourney() {
  const suite = readRepoFile('scripts/validate-release-candidate-suite.cjs');
  assertIncludes(suite, "args: ['run', 'validate:public-journey-acceptance']", 'release-candidate suite');
  assertNoMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');
}

function assertPhase5bPublicJourneyAcceptance() {
  assertPublicJourneyAcceptanceDoc();
  assertPhase5bStatusRollForward();
  assertPublicJourneyPackageScript();
  assertPublicSources();
  assertPublicJourneySources();
  assertNoForbiddenTrackedFiles();
  assertNoFilledEvidence();
  assertReleaseSuiteHasPublicJourney();
  assertSuiteAndTests();
}

function assertPhase5aPublicReviewPolish() {
  assertCleanupDoc();
  assertPhase5aStatusRollForward();
  assertPackageScript();
  assertPublicSources();
  assertNoForbiddenTrackedFiles();
  assertNoFilledEvidence();
  assertSuiteAndTests();
  assertPhase5bPublicJourneyAcceptance();
}

module.exports = {
  assertPhase5aPublicReviewPolish,
  assertPhase5bPublicJourneyAcceptance,
  phase154MergeCommit,
  phase155MergeCommit,
  currentPhase5a,
  currentPhase5b,
  latestCompletedPhase4f,
  cleanupDocPath,
  publicJourneyAcceptanceDocPath,
};
