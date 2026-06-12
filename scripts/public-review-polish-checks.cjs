const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const phase154MergeCommit = '85bfc8fb459cfc74db3ff80634ff35302691cb7f';
const phase155MergeCommit = '00b750ab34f433f1d4ca5567828b73e8ddeb3d05';
const phase156MergeCommit = 'adca108ef0b5577fea0078b69f3ad524d9406e77';
const phase157MergeCommit = '1f471213c71aa1d3ff979a267ffd1c8b2a39fe6f';
const phase158MergeCommit = 'f5f3b23426df052568158ba3cf1c898deb617a93';
const phase159MergeCommit = 'aec1d7e781f3db463aac3079a00ddb7a25564a0c';
const phase160MergeCommit = 'faa06b3598317699c06ab55a1f987dac831306b6';
const phase161MergeCommit = 'e051d98ee50501fccca8e9b55411dee6a6d7cc95';
const phase162MergeCommit = 'fddfce84daa93141a7b353179f906c8827a9d6e7';
const phase163MergeCommit = '62c8a9aefb15e2bbc420507a1b52bc716f49b670';
const phase164MergeCommit = '68d4a20ac46c2a37abca3a253e0ae11ed713e2e1';
const phase166MergeCommit = 'fc9eb856143be259e63a31fa8cc9c54426741a97';
const phase167MergeCommit = '4fe4b56cf2853517b9998d1d23237b6e1a37d8f4';
const phase168MergeCommit = '4def227c0da884391a1d1789ed8386b84211c0e8';
const phase169MergeCommit = '0fe53323a6346bb425c9fd66efea00e82ab3cfe6';
const phase170MergeCommit = 'dc2307a3ce2389b5b7b1780b4012e957a2fa49ed';
const phase171MergeCommit = '3a1e1e80dfe0f1e21ac58335a7dfafebed829c53';
const phase172MergeCommit = '607196e684649c2ed0fa70a9e530e9a58c7d09ab';
const phase173MergeCommit = '6d6bcd9ebae98a068a89d062eea8654879ca2019';
const phase174MergeCommit = '98afaaf7ea94dfd8aac80d2b5dda26c2d57e731d';
const phase175MergeCommit = '92a39f6fa8540a45f9a2369b3ec1fc497e76058e';
const phase176MergeCommit = 'a1a8161e01d7da67de7512e06f09dc271c269333';
const phase177MergeCommit = 'c803f30191a1f7264f8f4be2b55c084a7565957a';
const phase178MergeCommit = 'f88ff02523a8a82db2d6a163717aa53a1e3b7118';
const currentPhase5a = 'Phase 5A-A/B public owner-review polish sweep, local content-readiness cleanup, and protected admin review UX closure';
const currentPhase5b = 'Phase 5B-A/B public catalogue-to-enquiry journey hardening, listing continuity, and admin/public parity checks';
const currentPhase5c = 'Phase 5C-A/B public discovery search/filter polish, quote-intent context, and admin discovery parity closure';
const currentPhase5d = 'Phase 5D-A/B public listing-detail readiness, media/context polish, and quote-intent review closure';
const currentPhase5e = 'Phase 5E-A/B quote/enquiry intake reliability, receipt boundary, and protected admin triage parity';
const currentPhase5f = 'Phase 5F-A/B protected admin quote triage workflow, response-readiness checklist, and public/private boundary hardening';
const currentPhase5g = 'Phase 5G-A/B protected admin catalogue content-ops readiness, media safety review, and public parity boundary';
const currentPhase5h = 'Phase 5H-A/B protected admin catalogue write workflow polish, validation/error UX, and public parity guard';
const currentPhase5i = 'Phase 5I-A/B owner-review walkthrough readiness, full-route acceptance matrix, and no-deploy handoff refresh';
const currentPhase5j = 'Phase 5J-A/B owner-review feedback intake readiness, correction queue reconciliation, and no-approval update guard';
const currentPhase5k = 'Phase 5K-A/B owner correction workflow readiness, public content-gap guard, and no-response/no-deploy correction handoff';
const currentPhase5l = 'Phase 5L-A/B owner re-review request readiness, correction delta packet, and no-signoff/no-response guard';
const currentPhase5m = 'Phase 5M-A/B owner decision intake readiness, sign-off criteria ledger, and no-launch/no-deploy decision guard';
const currentPhase5n = 'Phase 5N-A/B deployment approval request readiness, pre-launch blocker ledger, and no-provider/no-deploy approval firewall';
const currentPhase5o = 'Phase 5O-A/B deployment execution runbook readiness, provider/env decision matrix, and rollback rehearsal firewall';
const currentPhase5p = 'Phase 5P-A/B smoke evidence intake readiness, route verification ledger, and rollback observation firewall';
const currentPhase5q = 'Phase 5Q-A/B smoke evidence review readiness, go/no-go decision ledger, and no-launch/no-production firewall';
const currentPhase5r = 'Phase 5R-A/B launch decision response readiness, release closure packet template, and no-live-change firewall';
const currentPhase5s = 'Phase 5S-A/B post-launch observation readiness, incident/follow-up ledger, and no-live-monitoring firewall';
const currentPhase5t = 'Phase 5T-A/B post-launch remediation readiness, incident triage correction backlog, and no-live-hotfix firewall';
const currentPhase5u = 'Phase 5U-A/B remediation verification readiness, correction retest ledger, and no-resolution-claim firewall';
const currentPhase5v = 'Phase 5V-A/B incident resolution response readiness, post-remediation closure ledger, and no-support-response firewall';
const currentPhase5w = 'Phase 5W-A/B preventive maintenance readiness, lessons-to-maintenance backlog, and no-maintenance-change firewall';
const currentPhase5x = 'Phase 5X-A/B maintenance approval readiness, change-window planning ledger, and no-schedule/no-change firewall';
const latestCompletedPhase4f = 'Phase 4F-A/B owner-facing review handoff bundle, approval issue template, and no-deploy preflight command center';
const cleanupDocPath = 'docs/content/LOCAL-CONTENT-READINESS-CLEANUP.md';
const publicJourneyAcceptanceDocPath = 'docs/content/LOCAL-PUBLIC-JOURNEY-ACCEPTANCE.md';
const discoveryAcceptanceDocPath = 'docs/content/LOCAL-DISCOVERY-SEARCH-FILTER-ACCEPTANCE.md';
const listingDetailReadinessDocPath = 'docs/content/LOCAL-LISTING-DETAIL-READINESS.md';
const quoteIntakeReadinessDocPath = 'docs/content/LOCAL-QUOTE-ENQUIRY-INTAKE-READINESS.md';
const quoteTriageReadinessDocPath = 'docs/content/LOCAL-QUOTE-TRIAGE-READINESS.md';
const catalogueContentOpsReadinessDocPath = 'docs/content/LOCAL-CATALOGUE-CONTENT-OPS-READINESS.md';
const catalogueWriteWorkflowReadinessDocPath = 'docs/content/LOCAL-CATALOGUE-WRITE-WORKFLOW-READINESS.md';
const ownerReviewWalkthroughReadinessDocPath = 'docs/content/LOCAL-OWNER-REVIEW-WALKTHROUGH-READINESS.md';
const fullRouteAcceptanceMatrixDocPath = 'docs/content/LOCAL-FULL-ROUTE-ACCEPTANCE-MATRIX.md';
const ownerFeedbackIntakeReadinessDocPath = 'docs/content/LOCAL-OWNER-FEEDBACK-INTAKE-READINESS.md';
const ownerCorrectionQueueReconciliationDocPath = 'docs/content/LOCAL-OWNER-CORRECTION-QUEUE-RECONCILIATION.md';
const ownerCorrectionWorkflowReadinessDocPath = 'docs/content/LOCAL-OWNER-CORRECTION-WORKFLOW-READINESS.md';
const publicContentGapRegisterDocPath = 'docs/content/LOCAL-PUBLIC-CONTENT-GAP-REGISTER.md';
const ownerReReviewRequestReadinessDocPath = 'docs/content/LOCAL-OWNER-RE-REVIEW-REQUEST-READINESS.md';
const correctionDeltaPacketTemplateDocPath = 'docs/content/LOCAL-CORRECTION-DELTA-PACKET-TEMPLATE.md';
const ownerDecisionIntakeReadinessDocPath = 'docs/content/LOCAL-OWNER-DECISION-INTAKE-READINESS.md';
const signoffCriteriaLedgerTemplateDocPath = 'docs/content/LOCAL-SIGNOFF-CRITERIA-LEDGER-TEMPLATE.md';
const deploymentApprovalRequestReadinessDocPath = 'docs/content/LOCAL-DEPLOYMENT-APPROVAL-REQUEST-READINESS.md';
const preLaunchBlockerLedgerTemplateDocPath = 'docs/content/LOCAL-PRE-LAUNCH-BLOCKER-LEDGER-TEMPLATE.md';
const deploymentExecutionRunbookReadinessDocPath = 'docs/content/LOCAL-DEPLOYMENT-EXECUTION-RUNBOOK-READINESS.md';
const providerEnvDecisionMatrixTemplateDocPath = 'docs/content/LOCAL-PROVIDER-ENV-DECISION-MATRIX-TEMPLATE.md';
const smokeEvidenceIntakeReadinessDocPath = 'docs/content/LOCAL-SMOKE-EVIDENCE-INTAKE-READINESS.md';
const routeVerificationRollbackLedgerTemplateDocPath = 'docs/content/LOCAL-ROUTE-VERIFICATION-ROLLBACK-LEDGER-TEMPLATE.md';
const smokeEvidenceReviewReadinessDocPath = 'docs/content/LOCAL-SMOKE-EVIDENCE-REVIEW-READINESS.md';
const goNogoDecisionLedgerTemplateDocPath = 'docs/content/LOCAL-GO-NOGO-DECISION-LEDGER-TEMPLATE.md';
const launchDecisionResponseReadinessDocPath = 'docs/content/LOCAL-LAUNCH-DECISION-RESPONSE-READINESS.md';
const releaseClosurePacketTemplateDocPath = 'docs/content/LOCAL-RELEASE-CLOSURE-PACKET-TEMPLATE.md';
const postLaunchObservationReadinessDocPath = 'docs/content/LOCAL-POST-LAUNCH-OBSERVATION-READINESS.md';
const incidentFollowupLedgerTemplateDocPath = 'docs/content/LOCAL-INCIDENT-FOLLOWUP-LEDGER-TEMPLATE.md';
const postLaunchRemediationReadinessDocPath = 'docs/content/LOCAL-POST-LAUNCH-REMEDIATION-READINESS.md';
const incidentTriageCorrectionBacklogTemplateDocPath = 'docs/content/LOCAL-INCIDENT-TRIAGE-CORRECTION-BACKLOG-TEMPLATE.md';
const remediationVerificationReadinessDocPath = 'docs/content/LOCAL-REMEDIATION-VERIFICATION-READINESS.md';
const correctionRetestResolutionLedgerTemplateDocPath = 'docs/content/LOCAL-CORRECTION-RETEST-RESOLUTION-LEDGER-TEMPLATE.md';
const incidentResolutionResponseReadinessDocPath = 'docs/content/LOCAL-INCIDENT-RESOLUTION-RESPONSE-READINESS.md';
const postRemediationClosureLessonsLedgerTemplateDocPath = 'docs/content/LOCAL-POST-REMEDIATION-CLOSURE-LESSONS-LEDGER-TEMPLATE.md';
const preventiveMaintenanceReadinessDocPath = 'docs/content/LOCAL-PREVENTIVE-MAINTENANCE-READINESS.md';
const lessonsToMaintenanceBacklogTemplateDocPath = 'docs/content/LOCAL-LESSONS-TO-MAINTENANCE-BACKLOG-TEMPLATE.md';
const maintenanceApprovalReadinessDocPath = 'docs/content/LOCAL-MAINTENANCE-APPROVAL-READINESS.md';
const maintenanceChangeWindowPlanningLedgerTemplateDocPath = 'docs/content/LOCAL-MAINTENANCE-CHANGE-WINDOW-PLANNING-LEDGER-TEMPLATE.md';
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
    /owner approved|owner sign-?off complete|accepted by owner|owner decision recorded|preview evidence captured|production evidence captured|smoke evidence captured|sign-off evidence captured/i,
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
    'scripts/validate-public-discovery-acceptance.cjs',
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
  for (const required of [
    /Search listings/i,
    /Filter rental listings/i,
    /Browse categories/i,
    /Explore event-use ideas/i,
    /Active filters/i,
    /Clear filters/i,
  ]) {
    assert(required.test(source), `public production source missing discovery wording: ${required}`);
  }
  assert(/selected listing/i.test(source), 'Quote/enquiry source must retain selected listing context');
  assert(/starting point only/i.test(source), 'Selected listing context must be a starting point only');
  assert(/editable request|request text|requested listings or items|request intake only/i.test(source), 'Selected listing context must remain editable/request intake');
  assert(/Category interest|Event-use interest|Search interest/i.test(source), 'Quote/enquiry source must support discovery context as interest only');
  assertNoMatch(source, /confirmed|reserved|booked|ordered|paid|completed rental|guaranteed availability|response time/i, 'public production source');
}

function assertReleaseSuiteHasPublicJourney() {
  const suite = readRepoFile('scripts/validate-release-candidate-suite.cjs');
  assertIncludes(suite, "args: ['run', 'validate:public-journey-acceptance']", 'release-candidate suite');
  assertIncludes(suite, "args: ['run', 'validate:public-discovery-acceptance']", 'release-candidate suite');
  assertIncludes(suite, "args: ['run', 'validate:listing-detail-readiness']", 'release-candidate suite');
  assertNoMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');
}

function assertPhase5dStatusRollForward() {
  const docs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    `Current phase: ${currentPhase5d}`,
    `Latest completed capability: ${currentPhase5c}`,
    'Last merged capability PR: #157',
    `Last merged capability merge commit: ${phase157MergeCommit}`,
    listingDetailReadinessDocPath,
    discoveryAcceptanceDocPath,
    publicJourneyAcceptanceDocPath,
    'scripts/validate-listing-detail-readiness.cjs',
    'No deployment is performed or approved by Phase 5D-A/B',
  ]) {
    assertIncludes(docs, required, 'Phase 5D status roll-forward docs');
  }
}

function assertListingDetailReadinessDoc() {
  assertTracked([listingDetailReadinessDocPath], 'Phase 5D listing detail readiness doc');
  const doc = normalizeWhitespace(readRepoFile(listingDetailReadinessDocPath));
  for (const required of [
    'repo-local, template-only, non-live listing detail readiness note',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Public listing detail layout',
    'Media and fallback behavior',
    'Related browsing continuity',
    'Quote-intent handoff boundary',
    'Protected admin listing-detail parity helper',
    'Owner inputs still missing',
    'Public claims still blocked',
    'docs/OWNER-HANDOFF-BUNDLE.md',
    'docs/content/LOCAL-PUBLIC-JOURNEY-ACCEPTANCE.md',
    'docs/content/LOCAL-DISCOVERY-SEARCH-FILTER-ACCEPTANCE.md',
    'docs/content/LOCAL-LISTING-DETAIL-READINESS.md',
  ]) {
    assertIncludes(doc, required, 'Phase 5D listing detail readiness doc');
  }
  assertNoMatch(
    doc,
    /owner approved|owner sign-?off complete|actual owner decision|accepted by owner|preview evidence captured|production evidence captured|manual qa completed/i,
    'Phase 5D listing detail readiness doc'
  );
}

function assertListingDetailPackageScript() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts?.['validate:listing-detail-readiness'] === 'node scripts/validate-listing-detail-readiness.cjs',
    'package.json must register validate:listing-detail-readiness'
  );
}

function assertListingDetailSources() {
  const source = readTrackedProductionSources([
    'website/app/catalogue/[slug]',
    'website/app/listings/[slug]',
    'website/app/quote',
    'website/components/QuoteRequestForm.tsx',
  ]);
  for (const required of [
    /View rental listing/i,
    /Request a quote/i,
    /Send an enquiry/i,
    /Start a rental enquiry/i,
    /Listing context is\s+a starting point only/i,
    /The team can review the request/i,
    /Browse listings/i,
    /Browse categories/i,
    /Explore event-use ideas/i,
    /representative, review-safe rental image/i,
    /public-safe alt text/i,
    /Related rental listing context/i,
  ]) {
    assert(required.test(source), `listing detail source missing safe wording: ${required}`);
  }
  assert(/requested listings or items/i.test(source), 'quote source must keep selected listing context editable');
  assert(/receipt only/i.test(source), 'quote source must keep receipt copy non-promissory');
  assertNoMatch(source, /\b(?:cart|checkout|payment|purchase|online ordering|confirmed order)\b/i, 'listing detail source');
  assertNoMatch(source, /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'listing detail source');
  assertNoMatch(source, /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i, 'listing detail source');
  assertNoMatch(source, /owner handoff bundle|owner-facing review brief|owner approval issue template|no-deploy preflight command center|owner approval packet|release-control internals|admin urls?|internal notes|recovery lanes?|destructive-action safeguards|status-transition matrix|\/admin\//i, 'listing detail source');
  assertNoMatch(source, /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b/i, 'listing detail source');
  assertNoMatch(source, /owner-approved media|real inventory confirmation|final styling|final availability|guaranteed availability/i, 'listing detail media source');
  assertNoMatch(source, /confirmed|reserved|booked|ordered|paid|completed rental|response time/i, 'listing detail quote source');
}

function assertPhase5dListingDetailReadiness() {
  assertListingDetailReadinessDoc();
  assertPhase5dStatusRollForward();
  assertListingDetailPackageScript();
  assertPublicSources();
  assertPublicJourneySources();
  assertListingDetailSources();
  assertNoForbiddenTrackedFiles();
  assertNoFilledEvidence();
  assertReleaseSuiteHasPublicJourney();
  assertSuiteAndTests();
}

function assertPhase5eStatusRollForward() {
  const docs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    `Current phase: ${currentPhase5e}`,
    `Latest completed capability: ${currentPhase5d}`,
    'Last merged capability PR: #158',
    `Last merged capability merge commit: ${phase158MergeCommit}`,
    quoteIntakeReadinessDocPath,
  quoteTriageReadinessDocPath,
  catalogueContentOpsReadinessDocPath,
    listingDetailReadinessDocPath,
    'scripts/validate-quote-intake-readiness.cjs',
    'No deployment is performed or approved by Phase 5E-A/B',
  ]) {
    assertIncludes(docs, required, 'Phase 5E status roll-forward docs');
  }
}

function assertQuoteIntakeReadinessDoc() {
  assertTracked([quoteIntakeReadinessDocPath], 'Phase 5E quote intake readiness doc');
  const doc = normalizeWhitespace(readRepoFile(quoteIntakeReadinessDocPath));
  for (const required of [
    'repo-local, template-only, non-live',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Public quote/enquiry form boundary',
    'Selected context boundary',
    'Validation/error boundary',
    'Receipt/reference boundary',
    'Protected admin triage parity helper',
    'Owner inputs still missing',
    'Public claims still blocked',
    'No-deploy/no-evidence status',
    'docs/OWNER-HANDOFF-BUNDLE.md',
    'docs/content/LOCAL-LISTING-DETAIL-READINESS.md',
    'docs/content/LOCAL-PUBLIC-JOURNEY-ACCEPTANCE.md',
    'docs/content/LOCAL-QUOTE-ENQUIRY-INTAKE-READINESS.md',
  ]) {
    assertIncludes(doc, required, 'Phase 5E quote intake readiness doc');
  }
  assertNoMatch(
    doc,
    /owner approved|owner sign-?off complete|actual owner decision|accepted by owner|preview evidence captured|production evidence captured|manual qa completed/i,
    'Phase 5E quote intake readiness doc'
  );
}

function assertQuoteIntakePackageScript() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts?.['validate:quote-intake-readiness'] === 'node scripts/validate-quote-intake-readiness.cjs',
    'package.json must register validate:quote-intake-readiness'
  );
}

function assertQuoteIntakeSources() {
  const publicQuoteSource = readTrackedProductionSources([
    'website/app/quote',
    'website/components/QuoteRequestForm.tsx',
  ]);
  const quoteReceiptSource = readTrackedProductionSources([
    'website/app/quote',
    'website/components/QuoteRequestForm.tsx',
    'website/app/api/quote',
  ]);
  const adminSource = readTrackedProductionSources([
    'website/app/admin',
    'website/components/admin/quote-request-inbox-panel.tsx',
  ]);

  for (const required of [
    /enquiry intake only/i,
    /requested listings or items/i,
    /event date/i,
    /quantities/i,
    /alternates/i,
    /setup, access, and timing notes/i,
    /Email or phone required/i,
    /editable request text/i,
    /listing, category, event-use, or search context/i,
    /received/i,
    /receipt only/i,
    /team can review/i,
    /follow up directly/i,
    /does not set aside furniture/i,
    /does not finalise rental details/i,
  ]) {
    assert(required.test(publicQuoteSource), `quote intake source missing safe wording: ${required}`);
  }

  assert(/status:\s*"received"|status: "received"/.test(quoteReceiptSource), 'quote receipt source must keep received status');
  assert(/Please check the required enquiry details and try again/.test(quoteReceiptSource), 'quote validation response must stay generic');
  assert(/Quote intake parity helper/.test(adminSource), 'admin quote triage helper must exist');
  assert(/Protected quote intake parity helper/.test(adminSource), 'admin quote triage helper must be protected');
  assert(/docs\/content\/LOCAL-QUOTE-ENQUIRY-INTAKE-READINESS\.md/.test(adminSource), 'admin helper must reference Phase 5E doc');

  assertNoMatch(publicQuoteSource, /\b(?:cart|checkout|payment|purchase|online ordering|confirmed order)\b/i, 'quote intake public source');
  assertNoMatch(publicQuoteSource, /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'quote intake public source');
  assertNoMatch(publicQuoteSource, /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i, 'quote intake public source');
  assertNoMatch(publicQuoteSource, /owner handoff bundle|owner-facing review brief|owner approval issue template|no-deploy preflight command center|owner approval packet|release-control internals|admin urls?|internal notes|recovery lanes?|destructive-action safeguards|status-transition matrix|\/admin\//i, 'quote intake public source');
  assertNoMatch(publicQuoteSource, /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b/i, 'quote intake public source');
  assertNoMatch(quoteReceiptSource, /tracking portal|status lookup|accepted outcome|availability statement|\bhold\b|confirmed|reserved|booked|ordered|paid|completed rental|guaranteed|response time|fulfilment|fulfillment|payment|purchase/i, 'quote receipt/reference source');
}

function assertReleaseSuiteHasQuoteIntake() {
  const suite = readRepoFile('scripts/validate-release-candidate-suite.cjs');
  assertIncludes(suite, "args: ['run', 'validate:quote-intake-readiness']", 'release-candidate suite');
  assertNoMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');
}


function assertPhase5fStatusRollForward() {
  const docs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    `Current phase: ${currentPhase5f}`,
    `Latest completed capability: ${currentPhase5e}`,
    'Last merged capability PR: #159',
    `Last merged capability merge commit: ${phase159MergeCommit}`,
    quoteTriageReadinessDocPath,
  catalogueContentOpsReadinessDocPath,
    quoteIntakeReadinessDocPath,
    'scripts/validate-quote-triage-readiness.cjs',
    'validate:quote-triage-readiness',
    'No deployment is performed or approved by Phase 5F-A/B',
  ]) {
    assertIncludes(docs, required, 'Phase 5F status roll-forward docs');
  }
}

function assertQuoteTriageReadinessDoc() {
  assertTracked([quoteTriageReadinessDocPath], 'Phase 5F quote triage readiness doc');
  const doc = normalizeWhitespace(readRepoFile(quoteTriageReadinessDocPath));
  for (const required of [
    'repo-local, template-only, non-live quote triage readiness note',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Protected admin quote inbox triage workflow',
    'Admin status/lifecycle display boundary',
    'Response-readiness checklist boundary',
    'Public/private quote boundary',
    'Receipt/reference boundary',
    'Owner inputs still missing',
    'Claims still blocked',
    'No-notification/no-CRM/no-public-tracking boundary',
    'No-deploy/no-evidence status',
  ]) {
    assertIncludes(doc, required, 'Phase 5F quote triage readiness doc');
  }
  assertNoMatch(
    doc,
    /owner approved|owner sign-?off complete|actual owner decision|accepted by owner|preview evidence captured|production evidence captured|manual qa completed|response sent evidence captured/i,
    'Phase 5F quote triage readiness doc'
  );
}

function assertQuoteTriagePackageScript() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts?.['validate:quote-triage-readiness'] === 'node scripts/validate-quote-triage-readiness.cjs',
    'package.json must register validate:quote-triage-readiness'
  );
}

function assertQuoteTriageSources() {
  const publicQuoteSource = readTrackedProductionSources([
    'website/app/quote',
    'website/components/QuoteRequestForm.tsx',
  ]);
  const quoteReceiptSource = readTrackedProductionSources([
    'website/app/quote',
    'website/components/QuoteRequestForm.tsx',
    'website/app/api/quote',
  ]);
  const adminSource = readTrackedProductionSources([
    'website/app/admin',
    'website/components/admin/quote-request-inbox-panel.tsx',
  ]);

  for (const required of [
    /Quote intake parity helper/i,
    /Protected quote intake parity helper/i,
    /LOCAL-QUOTE-TRIAGE-READINESS\.md/i,
    /Customer\/contact summary/i,
    /Event date\/venue summary/i,
    /Requested listing\/item summary/i,
    /Intake completeness/i,
    /Quote\/enquiry context summary/i,
    /Response-readiness checklist/i,
    /do not promise availability/i,
    /do not treat the public reference as\s+tracking/i,
    /New enquiry/i,
    /In review/i,
    /Follow-up prepared/i,
    /Closed locally/i,
  ]) {
    assert(required.test(adminSource), `admin quote triage source missing safe wording: ${required}`);
  }

  assertNoMatch(publicQuoteSource, /admin triage helper|admin-only status|response-readiness checklist|internal notes|release-control internals|owner handoff internals|admin urls?|\/admin\//i, 'Phase 5F public quote source');
  assertNoMatch(publicQuoteSource, /status lookup|tracking portal|public tracking|accepted outcome|availability statement|response-time promise/i, 'Phase 5F public quote source');
  assert(/receipt only/i.test(quoteReceiptSource), 'quote receipt source must stay receipt-only');
  assert(/public reference receipt/i.test(quoteReceiptSource), 'quote receipt source must keep public reference receipt wording');
  assertNoMatch(quoteReceiptSource, /tracking portal|status lookup|accepted outcome|availability statement|\bhold\b|confirmed|reserved|booked|ordered|paid|completed rental|guaranteed|response time|fulfilment|fulfillment|payment|purchase/i, 'Phase 5F quote receipt/reference source');

  assertNoMatch(publicQuoteSource, /\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i, 'Phase 5F public source');
  assertNoMatch(publicQuoteSource, /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'Phase 5F public source');
  assertNoMatch(publicQuoteSource, /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i, 'Phase 5F public source');
  assertNoMatch(publicQuoteSource, /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging/i, 'Phase 5F public source');
  assertNoMatch(adminSource, /send(?:s|ing)?\s+(?:an?\s+)?(?:email|sms|whatsapp)|webhook dispatch|notification sending|CRM integration|Pinecone|\bRAG\b|process\.env\.(?:NEXT_PUBLIC_|SUPABASE|N8N|PINECONE|VERCEL)/i, 'Phase 5F admin source');
}

function assertReleaseSuiteHasQuoteTriage() {
  const suite = readRepoFile('scripts/validate-release-candidate-suite.cjs');
  assertIncludes(suite, "args: ['run', 'validate:quote-triage-readiness']", 'release-candidate suite');
  assertNoMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');
}

function assertPhase5fQuoteTriageReadiness() {
  assertQuoteTriageReadinessDoc();
  assertPhase5fStatusRollForward();
  assertQuoteTriagePackageScript();
  assertPublicSources();
  assertPublicJourneySources();
  assertListingDetailSources();
  assertQuoteIntakeSources();
  assertQuoteTriageSources();
  assertNoForbiddenTrackedFiles();
  assertNoFilledEvidence();
  assertReleaseSuiteHasPublicJourney();
  assertReleaseSuiteHasQuoteIntake();
  assertReleaseSuiteHasQuoteTriage();
  assertReleaseSuiteHasCatalogueContentOps();
  assertSuiteAndTests();
  assertPhase5gCatalogueContentOpsReadiness();
}


function assertPhase5gStatusRollForward() {
  const docs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    `Current phase: ${currentPhase5h}`,
    `Latest completed capability: ${currentPhase5g}`,
    'Last merged capability PR: #161',
    `Last merged capability merge commit: ${phase161MergeCommit}`,
    catalogueWriteWorkflowReadinessDocPath,
    catalogueContentOpsReadinessDocPath,
    quoteTriageReadinessDocPath,
    'scripts/validate-catalogue-content-ops-readiness.cjs',
    'validate:catalogue-content-ops-readiness',
    'validate:catalogue-write-workflow-readiness',
    'No deployment is performed or approved by Phase 5H-A/B',
  ]) {
    assertIncludes(docs, required, 'Phase 5G status roll-forward docs');
  }
}

function assertCatalogueContentOpsReadinessDoc() {
  assertTracked([catalogueContentOpsReadinessDocPath], 'Phase 5G catalogue content-ops readiness doc');
  const doc = normalizeWhitespace(readRepoFile(catalogueContentOpsReadinessDocPath));
  for (const required of [
    'repo-local, template-only, non-live catalogue content-ops readiness note',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Protected admin catalogue content-ops workflow',
    'Listing/category/media readiness checklist',
    'Media, fallback, and alt-text boundary',
    'Public catalogue parity boundary',
    'Admin write and operation boundary',
    'Owner inputs still missing',
    'Public claims still blocked',
    'No-upload/no-provider/no-deploy/no-evidence status',
  ]) {
    assertIncludes(doc, required, 'Phase 5G catalogue content-ops readiness doc');
  }
  assertNoMatch(
    doc,
    /owner approved|owner sign-?off complete|actual owner decision|accepted by owner|preview evidence captured|production evidence captured|manual qa completed|response sent evidence captured|public launch evidence captured/i,
    'Phase 5G catalogue content-ops readiness doc'
  );
}

function assertCatalogueContentOpsPackageScript() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts?.['validate:catalogue-content-ops-readiness'] === 'node scripts/validate-catalogue-content-ops-readiness.cjs',
    'package.json must register validate:catalogue-content-ops-readiness'
  );
}

function assertCatalogueContentOpsSources() {
  const adminSource = readTrackedProductionSources([
    'website/app/admin',
    'website/components/admin/listing-management-panel.tsx',
    'website/components/admin/category-management-panel.tsx',
    'website/components/admin/listing-image-metadata-management-panel.tsx',
    'website/components/admin/listing-image-upload-panel.tsx',
  ]);
  const publicSource = readTrackedProductionSources(publicSourceRoots);

  for (const required of [
    /Catalogue content-ops readiness helper/i,
    /LOCAL-CATALOGUE-CONTENT-OPS-READINESS\.md/i,
    /Content completeness/i,
    /Media readiness/i,
    /Public-safe copy readiness/i,
    /Quote\/enquiry handoff readiness/i,
    /Owner input still missing/i,
    /Claims still blocked/i,
    /No-deploy\/no-evidence reminder/i,
    /Alt text review/i,
    /Public visibility\/status review/i,
  ]) {
    assert(required.test(adminSource), `admin catalogue content-ops source missing safe wording: ${required}`);
  }

  assert(/\b(?:listing|listings)\b/i.test(publicSource), 'public catalogue source must retain listing wording');
  assert(/\b(?:rental|rentals)\b/i.test(publicSource), 'public catalogue source must retain rental wording');
  assert(/\b(?:quote|enquiry|request)\b/i.test(publicSource), 'public catalogue source must retain quote/enquiry/request wording');
  assertNoMatch(publicSource, /catalogue content-ops readiness helper|admin catalogue readiness helper|media checklist|owner handoff internals|release-control internals|internal notes|admin urls?|destructive-action safeguards|recovery lanes?|status-transition matrix|public admin status|\/admin\//i, 'Phase 5G public source');
  assertNoMatch(publicSource, /\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i, 'Phase 5G public source');
  assertNoMatch(publicSource, /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'Phase 5G public source');
  assertNoMatch(publicSource, /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i, 'Phase 5G public source');
  assertNoMatch(publicSource, /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging/i, 'Phase 5G public source');
  assertNoMatch(adminSource, /public upload|customer upload|new storage provider|NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE_KEY|service-role browser|Pinecone|\bRAG\b|outbound messaging|email sending|sms sending|whatsapp sending|process\.env\.(?:NEXT_PUBLIC_|SUPABASE|N8N|PINECONE|VERCEL)/i, 'Phase 5G admin source');
  assertNoMatch(adminSource, /owner-approved media|final styling|final availability|real inventory confirmation|confirmed owner-approved media/i, 'Phase 5G media/fallback copy');
}

function assertCatalogueWriteWorkflowReadinessDoc() {
  assertTracked([catalogueWriteWorkflowReadinessDocPath], 'Phase 5H catalogue write workflow readiness doc');
  const doc = normalizeWhitespace(readRepoFile(catalogueWriteWorkflowReadinessDocPath));
  for (const required of [
    'repo-local, template-only, non-live catalogue write workflow readiness note',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Protected admin listing write workflow',
    'Protected admin category write workflow',
    'Protected admin media metadata and upload workflow',
    'Admin validation/error/success boundary',
    'Public parity guard',
    'Admin write and operation boundary',
    'Owner inputs still missing',
    'Public claims still blocked',
    'No-upload/no-provider/no-deploy/no-evidence status',
  ]) {
    assertIncludes(doc, required, 'Phase 5H catalogue write workflow readiness doc');
  }
  assertNoMatch(
    doc,
    /owner approved|owner sign-?off complete|actual owner decision|accepted by owner|preview evidence captured|production evidence captured|manual qa completed|response sent evidence captured|public launch evidence captured|write-success evidence captured/i,
    'Phase 5H catalogue write workflow readiness doc'
  );
}

function assertCatalogueWriteWorkflowPackageScript() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts?.['validate:catalogue-write-workflow-readiness'] === 'node scripts/validate-catalogue-write-workflow-readiness.cjs',
    'package.json must register validate:catalogue-write-workflow-readiness'
  );
}

function assertCatalogueWriteWorkflowSources() {
  const adminSource = readTrackedProductionSources([
    'website/components/admin/listing-management-panel.tsx',
    'website/components/admin/category-management-panel.tsx',
    'website/components/admin/listing-image-metadata-management-panel.tsx',
    'website/components/admin/listing-image-upload-panel.tsx',
  ]);
  const publicSource = readTrackedProductionSources(publicSourceRoots);

  for (const required of [
    /Protected admin save/i,
    /Save listing metadata/i,
    /Save category metadata/i,
    /Save image metadata/i,
    /Public-safe copy review/i,
    /Ready for owner review/i,
    /validation errors/i,
    /does not deploy/i,
    /does not record owner approval/i,
    /does not create evidence/i,
    /LOCAL-CATALOGUE-WRITE-WORKFLOW-READINESS\.md/i,
  ]) {
    assert(required.test(adminSource), `admin catalogue write workflow source missing safe wording: ${required}`);
  }

  assertNoMatch(adminSource, /SQL details|Supabase internals|service-role details|workspace IDs|stack traces|token internals|cookie internals|session internals|service-role browser|NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE_KEY|Pinecone|\bRAG\b|outbound messaging|email sending|sms sending|whatsapp sending|process\.env\.(?:NEXT_PUBLIC_|SUPABASE|N8N|PINECONE|VERCEL)|public upload|customer upload|new storage provider|external image service/i, 'Phase 5H admin source');
  assertNoMatch(adminSource, /owner-approved media|confirmed owner-approved media|final styling|final availability|real inventory confirmation|production media/i, 'Phase 5H media/fallback copy');
  assertNoMatch(adminSource, /deployed successfully|owner approved|evidence created|production published|launch complete|publish live/i, 'Phase 5H admin success/error copy');

  assert(/\b(?:listing|listings)\b/i.test(publicSource), 'public catalogue source must retain listing wording');
  assert(/\b(?:rental|rentals)\b/i.test(publicSource), 'public catalogue source must retain rental wording');
  assert(/\b(?:quote|enquiry|request)\b/i.test(publicSource), 'public catalogue source must retain quote/enquiry/request wording');
  assertNoMatch(publicSource, /admin listing write helper|admin category write helper|admin media write helper|protected admin save|admin validation details|internal notes|admin urls?|release-control internals|owner handoff internals|destructive-action safeguards|recovery lanes?|status-transition matrix|public admin status|\/admin\//i, 'Phase 5H public source');
  assertNoMatch(publicSource, /\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i, 'Phase 5H public source');
  assertNoMatch(publicSource, /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'Phase 5H public source');
  assertNoMatch(publicSource, /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i, 'Phase 5H public source');
  assertNoMatch(publicSource, /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging/i, 'Phase 5H public source');
}

function assertReleaseSuiteHasCatalogueWriteWorkflow() {
  const suite = readRepoFile('scripts/validate-release-candidate-suite.cjs');
  assertIncludes(suite, "args: ['run', 'validate:catalogue-write-workflow-readiness']", 'release-candidate suite');
  assertNoMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');
}

function assertPhase5hCatalogueWriteWorkflowReadiness() {
  assertCatalogueWriteWorkflowReadinessDoc();
  assertCatalogueWriteWorkflowPackageScript();
  assertCatalogueWriteWorkflowSources();
  assertNoForbiddenTrackedFiles();
  assertNoFilledEvidence();
  assertReleaseSuiteHasCatalogueWriteWorkflow();
  assertSuiteAndTests();
}

function assertPhase5iStatusRollForward() {
  const docs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    `Current phase: ${currentPhase5i}`,
    `Latest completed capability: ${currentPhase5h}`,
    'Last merged capability PR: #162',
    `Last merged capability merge commit: ${phase162MergeCommit}`,
    ownerReviewWalkthroughReadinessDocPath,
    fullRouteAcceptanceMatrixDocPath,
    'scripts/validate-owner-review-walkthrough-readiness.cjs',
    'No deployment is performed or approved by Phase 5I-A/B',
  ]) {
    assertIncludes(docs, required, 'Phase 5I status roll-forward docs');
  }
}

function assertOwnerReviewWalkthroughReadinessDocs() {
  assertTracked(
    [ownerReviewWalkthroughReadinessDocPath, fullRouteAcceptanceMatrixDocPath],
    'Phase 5I owner-review walkthrough docs'
  );
  const doc = normalizeWhitespace(readRepoFile(ownerReviewWalkthroughReadinessDocPath));
  for (const required of [
    'repo-local, template-only, non-live owner-review walkthrough readiness package',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Public homepage walkthrough',
    'Public catalogue/listings/categories/events walkthrough',
    'Public listing detail walkthrough',
    'Public quote/enquiry intake walkthrough',
    'Public receipt/reference boundary',
    'Protected admin quote inbox/triage walkthrough',
    'Protected admin listing/category/media content ops walkthrough',
    'Protected admin write workflow walkthrough',
    'Owner input questions still unresolved',
    'Claims still blocked',
    'No-deploy/no-evidence/no-provider/no-public-tracking boundary',
    'Contact details still missing',
    'Address/business hours still missing',
    'Service-area wording still missing',
    'Legal/policy/guarantee/proof claims still blocked',
  ]) {
    assertIncludes(doc, required, 'Phase 5I owner-review walkthrough doc');
  }
  const matrix = normalizeWhitespace(readRepoFile(fullRouteAcceptanceMatrixDocPath));
  for (const required of [
    'local-only full-route acceptance matrix',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    '`/`',
    '`/catalogue`',
    '`/catalogue/[slug]`',
    '`/listings`',
    '`/listings/[slug]`',
    '`/categories`',
    'Category-specific browsing routes',
    '`/events`',
    '`/quote`',
    '`/admin` protected shell',
    'Protected admin listings/categories/media views',
    'Protected admin quotes views',
    'Not-found route',
    'Local review only; not evidence',
  ]) {
    assertIncludes(matrix, required, 'Phase 5I route acceptance matrix');
  }
  assertNoMatch(
    `${doc}\n${matrix}`,
    /owner approved|owner sign-?off complete|actual owner decision|actual owner feedback|accepted by owner|preview evidence captured|production evidence captured|smoke evidence captured|route-walkthrough evidence captured|public launch evidence captured|write-success evidence captured|response-sent evidence captured|sign-off evidence captured/i,
    'Phase 5I docs'
  );
}

function assertOwnerReviewWalkthroughPackageScript() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts?.['validate:owner-review-walkthrough-readiness'] === 'node scripts/validate-owner-review-walkthrough-readiness.cjs',
    'package.json must register validate:owner-review-walkthrough-readiness'
  );
}

function assertOwnerReviewWalkthroughSources() {
  const adminSource = readTrackedProductionSources(['website/app/admin/protected-admin-shell.tsx']);
  const publicSource = readTrackedProductionSources(publicSourceRoots);

  for (const required of [
    /Phase 5I-A\/B admin-only walkthrough readiness/i,
    /Owner-review walkthrough readiness helper/i,
    /Public homepage walkthrough/i,
    /Public catalogue\/listings\/categories\/events walkthrough/i,
    /Public quote\/enquiry intake walkthrough/i,
    /Protected admin quote inbox\/triage walkthrough/i,
    /Protected admin listing\/category\/media content ops walkthrough/i,
    /Protected admin write workflow walkthrough/i,
    /Owner input placeholders/i,
    /Public claims still blocked/i,
    /no-deploy\/no-evidence boundary/i,
    /LOCAL-OWNER-REVIEW-WALKTHROUGH-READINESS\.md/i,
    /LOCAL-FULL-ROUTE-ACCEPTANCE-MATRIX\.md/i,
  ]) {
    assert(required.test(adminSource), `Phase 5I admin source missing safe wording: ${required}`);
  }

  assertNoMatch(
    publicSource,
    /owner-review walkthrough readiness helper|full-route acceptance matrix|route acceptance matrix internals|admin route\/view checklist|owner handoff internals|owner approval issue template|no-deploy preflight command|release-control internals|admin urls?|internal notes|destructive-action safeguards|recovery lanes?|status-transition matrix|public admin status|\/admin\//i,
    'Phase 5I public source'
  );
  assert(/\b(?:listing|listings)\b/i.test(publicSource), 'public source must retain listing wording');
  assert(/\b(?:rental|rentals)\b/i.test(publicSource), 'public source must retain rental wording');
  assert(/\b(?:quote|enquiry|request)\b/i.test(publicSource), 'public source must retain quote/enquiry/request wording');
  assertNoMatch(publicSource, /\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i, 'Phase 5I public source');
  assertNoMatch(publicSource, /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'Phase 5I public source');
  assertNoMatch(publicSource, /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i, 'Phase 5I public source');
  assertNoMatch(publicSource, /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging|public status view/i, 'Phase 5I public source');
  assertNoMatch(
    adminSource,
    /public upload|customer upload|new provider setup|new storage provider|NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE_KEY|service-role browser|Pinecone|\bRAG\b|outbound messaging|email sending|sms sending|whatsapp sending|process\.env\.(?:NEXT_PUBLIC_|SUPABASE|N8N|PINECONE|VERCEL)/i,
    'Phase 5I admin source'
  );
}

function assertReleaseSuiteHasOwnerReviewWalkthrough() {
  const suite = readRepoFile('scripts/validate-release-candidate-suite.cjs');
  assertIncludes(suite, "args: ['run', 'validate:owner-review-walkthrough-readiness']", 'release-candidate suite');
  assertNoMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');
}

function assertPhase5iOwnerReviewWalkthroughReadiness() {
  assertOwnerReviewWalkthroughReadinessDocs();
  assertPhase5iStatusRollForward();
  assertOwnerReviewWalkthroughPackageScript();
  assertOwnerReviewWalkthroughSources();
  assertNoForbiddenTrackedFiles();
  assertNoFilledEvidence();
  assertPhase5hCatalogueWriteWorkflowReadiness();
  assertReleaseSuiteHasOwnerReviewWalkthrough();
  assertReleaseSuiteHasCatalogueWriteWorkflow();
  assertSuiteAndTests();
}


function assertPhase5jStatusRollForward() {
  const docs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    `Current phase: ${currentPhase5j}`,
    `Latest completed capability: ${currentPhase5i}`,
    'Last merged capability PR: #163',
    `Last merged capability merge commit: ${phase163MergeCommit}`,
    ownerFeedbackIntakeReadinessDocPath,
    ownerCorrectionQueueReconciliationDocPath,
    ownerReviewWalkthroughReadinessDocPath,
    fullRouteAcceptanceMatrixDocPath,
    'scripts/validate-owner-feedback-intake-readiness.cjs',
    'No deployment is performed or approved by Phase 5J-A/B',
  ]) {
    assertIncludes(docs, required, 'Phase 5J status roll-forward docs');
  }
}

function assertOwnerFeedbackIntakeReadinessDocs() {
  assertTracked(
    [ownerFeedbackIntakeReadinessDocPath, ownerCorrectionQueueReconciliationDocPath],
    'Phase 5J owner feedback intake docs'
  );
  const intake = normalizeWhitespace(readRepoFile(ownerFeedbackIntakeReadinessDocPath));
  for (const required of [
    'repo-local, template-only, non-live owner feedback intake readiness package',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Public copy correction',
    'Listing/category/media facts',
    'Image/alt-text selection',
    'Quote/enquiry wording',
    'Admin workflow wording',
    'Missing contact/service-area/policy details',
    'Claims blocked until supplied',
    'Deployment/launch question',
    'Out-of-scope request',
    'Casual comments outside a captured owner review record',
    'Unverified assumptions',
    'Codex/agent guesses',
    'Inferred business facts',
    'Public route tests',
    'Local screenshots',
    'Preview/deployment output',
  ]) {
    assertIncludes(intake, required, 'Phase 5J owner feedback intake doc');
  }
  const queue = normalizeWhitespace(readRepoFile(ownerCorrectionQueueReconciliationDocPath));
  for (const required of [
    'repo-local, template-only, non-live correction queue reconciliation package',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Capture raw owner comment separately',
    'Classify the owner comment into the matching feedback bucket',
    'Identify the affected route, component, document, validator, or test',
    'Identify whether an owner fact is supplied or whether the fact is still missing',
    'Identify whether copy can be safely changed without adding unsupported claims',
    'Identify whether a claim remains blocked because support is not supplied',
    'Identify whether a follow-up question is needed before local correction work',
    'Identify whether deployment approval is still absent',
    'Not captured',
    'Needs owner input',
    'Ready for local correction',
    'Blocked: claim unsupported',
    'Blocked: deployment approval missing',
    'Ready for review PR',
  ]) {
    assertIncludes(queue, required, 'Phase 5J correction queue reconciliation doc');
  }
  assertNoMatch(
    `${intake}\n${queue}`,
    /owner approved|owner sign-?off complete|actual owner decision|actual owner feedback|accepted by owner|rejected by owner|preview evidence captured|production evidence captured|smoke evidence captured|route-walkthrough evidence captured|correction-completed evidence captured|response-sent evidence captured|public launch evidence captured|sign-off evidence captured/i,
    'Phase 5J docs'
  );
}

function assertOwnerFeedbackIntakePackageScript() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts?.['validate:owner-feedback-intake-readiness'] === 'node scripts/validate-owner-feedback-intake-readiness.cjs',
    'package.json must register validate:owner-feedback-intake-readiness'
  );
}

function assertOwnerFeedbackIntakeSources() {
  const adminSource = readTrackedProductionSources(['website/app/admin/protected-admin-shell.tsx']);
  const publicSource = readTrackedProductionSources(publicSourceRoots);

  for (const required of [
    /Phase 5J-A\/B admin-only feedback intake readiness/i,
    /Owner-feedback intake readiness helper/i,
    /Future feedback intake buckets/i,
    /Correction queue reconciliation steps/i,
    /Owner facts can support local copy corrections/i,
    /unsupported claims remain/i,
    /deployment\/launch questions remain separate from feedback/i,
    /LOCAL-OWNER-FEEDBACK-INTAKE-READINESS\.md/i,
    /LOCAL-OWNER-CORRECTION-QUEUE-RECONCILIATION\.md/i,
    /LOCAL-OWNER-REVIEW-WALKTHROUGH-READINESS\.md/i,
    /LOCAL-FULL-ROUTE-ACCEPTANCE-MATRIX\.md/i,
  ]) {
    assert(required.test(adminSource), `Phase 5J admin source missing safe wording: ${required}`);
  }

  assertNoMatch(
    publicSource,
    /owner-feedback intake helper|owner feedback intake helper|correction queue reconciliation|owner-review walkthrough helper|owner-review walkthrough internals|full-route acceptance matrix|route acceptance matrix internals|admin route\/view checklist|owner handoff internals|owner approval issue template|no-deploy preflight command|no-deploy command-center|release-control internals|admin urls?|internal notes|destructive-action safeguards|recovery lanes?|status-transition matrix|public admin status|\/admin\//i,
    'Phase 5J public source'
  );
  assert(/\b(?:listing|listings)\b/i.test(publicSource), 'public source must retain listing wording');
  assert(/\b(?:rental|rentals)\b/i.test(publicSource), 'public source must retain rental wording');
  assert(/\b(?:quote|enquiry|request)\b/i.test(publicSource), 'public source must retain quote/enquiry/request wording');
  assertNoMatch(publicSource, /\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i, 'Phase 5J public source');
  assertNoMatch(publicSource, /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'Phase 5J public source');
  assertNoMatch(publicSource, /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i, 'Phase 5J public source');
  assertNoMatch(publicSource, /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging|public status view/i, 'Phase 5J public source');
  assertNoMatch(
    adminSource,
    /public upload|customer upload|new provider setup|new storage provider|NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE_KEY|service-role browser|Pinecone|\bRAG\b|outbound messaging|email sending|sms sending|whatsapp sending|process\.env\.(?:NEXT_PUBLIC_|SUPABASE|N8N|PINECONE|VERCEL)/i,
    'Phase 5J admin source'
  );
}


function assertPhase5kStatusRollForward() {
  const docs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    `Current phase: ${currentPhase5k}`,
    `Latest completed capability: ${currentPhase5j}`,
    'Last merged capability PR: #164',
    `Last merged capability merge commit: ${phase164MergeCommit}`,
    ownerCorrectionWorkflowReadinessDocPath,
    publicContentGapRegisterDocPath,
    ownerFeedbackIntakeReadinessDocPath,
    ownerCorrectionQueueReconciliationDocPath,
    'scripts/validate-owner-correction-workflow-readiness.cjs',
    'No deployment is performed or approved by Phase 5K-A/B',
  ]) {
    assertIncludes(docs, required, 'Phase 5K status roll-forward docs');
  }
}

function assertOwnerCorrectionWorkflowReadinessDocs() {
  assertTracked(
    [ownerCorrectionWorkflowReadinessDocPath, publicContentGapRegisterDocPath],
    'Phase 5K owner correction workflow docs'
  );
  const workflow = normalizeWhitespace(readRepoFile(ownerCorrectionWorkflowReadinessDocPath));
  for (const required of [
    'repo-local, template-only, non-live',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'does not record actual owner feedback, owner decisions, owner approval, owner corrections, correction-completed evidence, response-sent evidence, launch clearance, or deployment permission',
    'Not captured',
    'Needs owner input',
    'Ready for local correction planning',
    'Ready for local correction PR',
    'Blocked: unsupported claim',
    'Blocked: deployment approval missing',
    'Ready for owner re-review request',
    'Owner-supplied fact exists',
    'Public copy can change without adding unsupported claims',
    'Admin-only wording can change without public leakage',
    'Public route remains rental/enquiry-only',
    'No deployment approval is inferred',
    'Contact details missing',
    'Service area missing',
    'Operating hours missing',
    'Policy/legal claim missing',
    'Award/certification/testimonial/client claim unsupported',
    'Booking/payment/order/customer-account flow requested',
    'Provider/deployment/runtime request made',
    'A correction PR is not a response sent to owner',
    'A merged local correction is not response-sent evidence',
    'A local validation pass is not owner acknowledgement',
  ]) {
    assertIncludes(workflow, required, 'Phase 5K owner correction workflow doc');
  }
  const gap = normalizeWhitespace(readRepoFile(publicContentGapRegisterDocPath));
  for (const required of [
    'template-only',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    '[NOT SUPPLIED]',
    '[OWNER INPUT REQUIRED]',
    '[BLOCKED UNTIL SUPPLIED]',
    'Contact details',
    'Service area',
    'Operating hours',
    'Event/rental policies',
    'Listing-specific dimensions/materials/condition',
    'Media/alt-text preferences',
    'Response expectations',
    'Claims/testimonials/certifications/client names',
  ]) {
    assertIncludes(gap, required, 'Phase 5K public content-gap register doc');
  }
  assertNoMatch(
    `${workflow}\n${gap}`,
    /owner approved|owner sign-?off complete|accepted by owner|owner decision recorded|owner feedback recorded|owner correction completed|owner response sent|preview evidence captured|production evidence captured|smoke evidence captured|route-walkthrough evidence captured|correction-completed evidence captured|response-sent evidence captured|public launch evidence captured|sign-off evidence captured/i,
    'Phase 5K docs'
  );
}

function assertOwnerCorrectionWorkflowPackageScript() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts?.['validate:owner-correction-workflow-readiness'] === 'node scripts/validate-owner-correction-workflow-readiness.cjs',
    'package.json must register validate:owner-correction-workflow-readiness'
  );
}

function assertOwnerCorrectionWorkflowSources() {
  const adminSource = readTrackedProductionSources(['website/app/admin/protected-admin-shell.tsx']);
  const publicSource = readTrackedProductionSources(publicSourceRoots);

  for (const required of [
    /Phase 5K-A\/B admin-only correction workflow readiness/i,
    /Owner correction workflow readiness helper/i,
    /LOCAL-OWNER-CORRECTION-WORKFLOW-READINESS\.md/i,
    /LOCAL-PUBLIC-CONTENT-GAP-REGISTER\.md/i,
    /LOCAL-OWNER-FEEDBACK-INTAKE-READINESS\.md/i,
    /LOCAL-OWNER-CORRECTION-QUEUE-RECONCILIATION\.md/i,
    /No owner feedback is recorded here/i,
    /No owner response is sent here/i,
    /No correction completion is claimed here/i,
    /No\s+deployment\s+approval\s+is\s+granted\s+here/i,
    /\[NOT EVIDENCE \/ NOT RECORDED\]/i,
    /\[DEPLOYMENT APPROVAL: NOT GRANTED\]/i,
    /Ready for local correction planning/i,
    /Public content-gap groups/i,
    /Blocked correction categories/i,
  ]) {
    assert(required.test(adminSource), `Phase 5K admin source missing safe wording: ${required}`);
  }

  assertNoMatch(
    publicSource,
    /owner correction workflow|correction workflow readiness|content-gap register|public content-gap|owner-feedback intake helper|owner feedback intake helper|correction queue reconciliation|owner-review walkthrough helper|owner-review walkthrough internals|full-route acceptance matrix|route acceptance matrix internals|admin route\/view checklist|owner handoff internals|owner approval issue template|no-deploy preflight command|no-deploy command-center|release-control internals|admin urls?|internal notes|destructive-action safeguards|recovery lanes?|status-transition matrix|public admin status|\/admin\//i,
    'Phase 5K public source'
  );
  assert(/\b(?:listing|listings)\b/i.test(publicSource), 'public source must retain listing wording');
  assert(/\b(?:rental|rentals)\b/i.test(publicSource), 'public source must retain rental wording');
  assert(/\b(?:quote|enquiry|request)\b/i.test(publicSource), 'public source must retain quote/enquiry/request wording');
  assertNoMatch(publicSource, /\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i, 'Phase 5K public source');
  assertNoMatch(publicSource, /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'Phase 5K public source');
  assertNoMatch(publicSource, /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i, 'Phase 5K public source');
  assertNoMatch(publicSource, /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging|public status view/i, 'Phase 5K public source');
  assertNoMatch(
    adminSource,
    /public upload|customer upload|new provider setup|new storage provider|NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE_KEY|service-role browser|Pinecone|\bRAG\b|n8n runtime|\/api\/chat.*retrieval|outbound messaging|email sending|sms sending|whatsapp sending|process\.env\.(?:NEXT_PUBLIC_|SUPABASE|N8N|PINECONE|VERCEL)/i,
    'Phase 5K admin source'
  );
}

function assertReleaseSuiteHasOwnerCorrectionWorkflow() {
  const suite = readRepoFile('scripts/validate-release-candidate-suite.cjs');
  assertIncludes(suite, "args: ['run', 'validate:owner-correction-workflow-readiness']", 'release-candidate suite');
  assertIncludes(suite, "args: ['run', 'validate:owner-feedback-intake-readiness']", 'release-candidate suite');
  assertNoMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');
}

function assertPhase5kOwnerCorrectionWorkflowReadiness() {
  assertOwnerCorrectionWorkflowReadinessDocs();
  assertPhase5kStatusRollForward();
  assertOwnerCorrectionWorkflowPackageScript();
  assertOwnerCorrectionWorkflowSources();
  assertNoForbiddenTrackedFiles();
  assertNoFilledEvidence();
  assertPhase5jOwnerFeedbackIntakeReadiness();
  assertReleaseSuiteHasOwnerCorrectionWorkflow();
  assertReleaseSuiteHasOwnerFeedbackIntake();
  assertReleaseSuiteHasOwnerReviewWalkthrough();
  assertReleaseSuiteHasCatalogueWriteWorkflow();
  assertSuiteAndTests();
}




function assertPhase5nStatusRollForward() {
  const docs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    `Current phase: ${currentPhase5n}`,
    `Latest completed capability: ${currentPhase5m}`,
    'Last merged capability PR: #168',
    `Last merged capability merge commit: ${phase168MergeCommit}`,
    deploymentApprovalRequestReadinessDocPath,
    preLaunchBlockerLedgerTemplateDocPath,
    ownerDecisionIntakeReadinessDocPath,
    signoffCriteriaLedgerTemplateDocPath,
    'scripts/validate-deployment-approval-request-readiness.cjs',
    'No deployment is performed or approved by Phase 5N-A/B',
  ]) {
    assertIncludes(docs, required, 'Phase 5N status roll-forward docs');
  }
}

function assertDeploymentApprovalRequestReadinessDocs() {
  assertTracked(
    [deploymentApprovalRequestReadinessDocPath, preLaunchBlockerLedgerTemplateDocPath],
    'Phase 5N deployment approval request readiness docs'
  );
  const readiness = normalizeWhitespace(readRepoFile(deploymentApprovalRequestReadinessDocPath));
  const ledger = normalizeWhitespace(readRepoFile(preLaunchBlockerLedgerTemplateDocPath));
  for (const required of [
    'repo-local, template-only, non-live',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'does not record deployment approval, launch clearance, provider setup, preview publication, production launch, production evidence, owner approval, owner sign-off, owner decision evidence, smoke evidence, or deployment permission',
    'Deployment approval request purpose',
    'Owner decision/sign-off reference',
    'Sign-off criteria ledger reference',
    'Pre-launch blocker ledger reference',
    'Public route readiness summary',
    'Protected admin readiness summary',
    'Provider/runtime setup status',
    'Secrets/env readiness status',
    'Rollback/recovery readiness status',
    'Explicit approval status',
    'Not prepared.',
    'Draft only.',
    'Needs owner decision.',
    'Needs sign-off criteria closure.',
    'Needs provider decision.',
    'Needs environment/secrets decision.',
    'Blocked: unresolved launch blocker.',
    'Blocked: deployment approval missing.',
    'Ready to ask for approval.',
    'A deployment approval request is not deployment approval',
    'Provider setup readiness is not provider setup',
    'Environment readiness is not secrets/config creation',
    'Passing validators is not launch clearance',
    'A merged PR is not deployment permission',
    'A future owner sign-off is not provider approval unless separately stated',
  ]) {
    assertIncludes(readiness, required, 'Phase 5N deployment approval request readiness doc');
  }
  for (const required of [
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Blocker ID: [NOT ASSIGNED]',
    'Blocker area: [NOT SELECTED]',
    'Public route affected: [NOT IDENTIFIED]',
    'Admin route affected: [NOT IDENTIFIED]',
    'Owner input required: [OWNER INPUT REQUIRED]',
    'Provider/runtime input required: [PROVIDER DECISION REQUIRED]',
    'Environment/secrets input required: [ENV DECISION REQUIRED]',
    'Resolution status: [NOT STARTED]',
    'Evidence status: [NOT EVIDENCE / NOT RECORDED]',
    'Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Owner sign-off.',
    'Public copy and unsupported claims.',
    'Listing/category/media readiness.',
    'Quote/enquiry request readiness.',
    'Protected admin workflow readiness.',
    'Provider/runtime setup decision.',
    'Environment/secrets decision.',
    'Rollback/recovery readiness.',
    'Final deployment approval.',
    'not owner sign-off, not owner approval, not provider setup, not production evidence, not launch clearance, and not deployment approval',
  ]) {
    assertIncludes(ledger, required, 'Phase 5N pre-launch blocker ledger template doc');
  }
  assertNoMatch(
    `${readiness}\n${ledger}`,
    /owner approved|owner sign-?off complete|accepted by owner|rejected by owner|owner decision recorded|owner approval recorded|owner feedback recorded|owner re-review recorded|owner corrections completed|owner response sent|preview evidence captured|production evidence captured|smoke evidence captured|route-walkthrough evidence captured|correction-completed evidence captured|response-sent evidence captured|public launch evidence captured|sign-off evidence captured|deployment approval granted|launch approval granted|launch clearance granted|provider setup completed|secrets created|deployment performed/i,
    'Phase 5N docs'
  );
}

function assertDeploymentApprovalRequestPackageScript() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts?.['validate:deployment-approval-request-readiness'] === 'node scripts/validate-deployment-approval-request-readiness.cjs',
    'package.json must register validate:deployment-approval-request-readiness'
  );
}

function assertDeploymentApprovalRequestSources() {
  const adminSource = readTrackedProductionSources(['website/app/admin/protected-admin-shell.tsx']);
  const adminPage = readRepoFile('website/app/admin/page.tsx');
  const publicSource = readTrackedProductionSources(publicSourceRoots);

  for (const required of [
    /Phase 5N-A\/B admin-only deployment approval request readiness/i,
    /Deployment approval request readiness helper/i,
    /LOCAL-DEPLOYMENT-APPROVAL-REQUEST-READINESS\.md/i,
    /LOCAL-PRE-LAUNCH-BLOCKER-LEDGER-TEMPLATE\.md/i,
    /LOCAL-OWNER-DECISION-INTAKE-READINESS\.md/i,
    /LOCAL-SIGNOFF-CRITERIA-LEDGER-TEMPLATE\.md/i,
    /Safe future deployment approval request sections/i,
    /Pre-launch blocker ledger placeholders/i,
    /Allowed future approval request statuses/i,
    /No-provider\/no-deploy boundaries/i,
    /No deployment approval is recorded here/i,
    /No launch clearance is granted here/i,
    /No provider setup is performed here/i,
    /No environment\/secrets are created here/i,
    /No production evidence is captured here/i,
    /No\s+deployment\s+is\s+performed\s+here/i,
    /\[NOT EVIDENCE \/ NOT RECORDED\]/i,
    /\[DEPLOYMENT APPROVAL: NOT GRANTED\]/i,
  ]) {
    assert(required.test(adminSource), `Phase 5N admin source missing safe wording: ${required}`);
  }

  assertIncludes(adminPage, 'view={{ kind: "home" }}', 'admin page home view');
  assert(
    /function AdminOperationsHome[\s\S]*<OwnerReadinessHelpersPanel \/>/.test(adminSource),
    'Phase 5N admin source must render owner readiness helpers from the real AdminOperationsHome path'
  );
  assert(
    /function OwnerReadinessHelpersPanel[\s\S]*<OwnerReviewWalkthroughReadinessHelper \/>[\s\S]*<OwnerFeedbackIntakeReadinessHelper \/>[\s\S]*<OwnerCorrectionWorkflowReadinessHelper \/>[\s\S]*<OwnerReReviewRequestReadinessHelper \/>[\s\S]*<OwnerDecisionIntakeReadinessHelper \/>[\s\S]*<DeploymentApprovalRequestReadinessHelper \/>/.test(adminSource),
    'Phase 5N admin source must keep the complete owner readiness helper chain in the shared panel'
  );

  assertNoMatch(
    publicSource,
    /deployment approval request|pre-launch blocker ledger|owner decision intake|decision intake readiness|sign-off criteria ledger|owner re-review request|re-review request readiness|correction delta packet|owner correction workflow|correction workflow readiness|content-gap register|public content-gap|owner-feedback intake helper|owner feedback intake helper|correction queue reconciliation|owner-review walkthrough helper|owner-review walkthrough internals|full-route acceptance matrix|route acceptance matrix internals|admin route\/view checklist|owner handoff internals|owner approval issue template|no-deploy preflight command|no-deploy command-center|release-control internals|provider setup internals|environment\/secrets internals|admin urls?|internal notes|destructive-action safeguards|recovery lanes?|status-transition matrix|public admin status|\/admin\//i,
    'Phase 5N public source'
  );
  assert(/\b(?:listing|listings)\b/i.test(publicSource), 'public source must retain listing wording');
  assert(/\b(?:rental|rentals)\b/i.test(publicSource), 'public source must retain rental wording');
  assert(/\b(?:quote|enquiry|request)\b/i.test(publicSource), 'public source must retain quote/enquiry/request wording');
  assertNoMatch(publicSource, /\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i, 'Phase 5N public source');
  assertNoMatch(publicSource, /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'Phase 5N public source');
  assertNoMatch(publicSource, /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i, 'Phase 5N public source');
  assertNoMatch(publicSource, /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging|public status view/i, 'Phase 5N public source');
  assertNoMatch(
    adminSource,
    /public upload|customer upload|new provider setup|new storage provider|NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE_KEY|service-role browser|Pinecone|\bRAG\b|n8n runtime|\/api\/chat.*retrieval|outbound messaging|email sending|sms sending|whatsapp sending|process\.env\.(?:NEXT_PUBLIC_|SUPABASE|N8N|PINECONE|VERCEL)/i,
    'Phase 5N admin source'
  );
}

function assertReleaseSuiteHasDeploymentApprovalRequestReadiness() {
  const suite = readRepoFile('scripts/validate-release-candidate-suite.cjs');
  assertIncludes(suite, "args: ['run', 'validate:deployment-approval-request-readiness']", 'release-candidate suite');
  assertIncludes(suite, "args: ['run', 'validate:owner-decision-intake-readiness']", 'release-candidate suite');
  assertNoMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');
}

function assertPhase5nDeploymentApprovalRequestReadiness() {
  assertDeploymentApprovalRequestReadinessDocs();
  assertPhase5nStatusRollForward();
  assertDeploymentApprovalRequestPackageScript();
  assertDeploymentApprovalRequestSources();
  assertNoForbiddenTrackedFiles();
  assertNoFilledEvidence();
  assertPhase5mOwnerDecisionIntakeReadiness();
  assertReleaseSuiteHasDeploymentApprovalRequestReadiness();
  assertReleaseSuiteHasOwnerDecisionIntakeReadiness();
  assertReleaseSuiteHasOwnerReReviewRequestReadiness();
  assertReleaseSuiteHasOwnerCorrectionWorkflow();
  assertReleaseSuiteHasOwnerFeedbackIntake();
  assertReleaseSuiteHasOwnerReviewWalkthrough();
  assertReleaseSuiteHasCatalogueWriteWorkflow();
  assertSuiteAndTests();
}


function assertPhase5oStatusRollForward() {
  const docs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    `Current phase: ${currentPhase5o}`,
    `Latest completed capability: ${currentPhase5n}`,
    'Last merged capability PR: #169',
    `Last merged capability merge commit: ${phase169MergeCommit}`,
    deploymentExecutionRunbookReadinessDocPath,
    providerEnvDecisionMatrixTemplateDocPath,
  smokeEvidenceIntakeReadinessDocPath,
  routeVerificationRollbackLedgerTemplateDocPath,
    deploymentApprovalRequestReadinessDocPath,
    preLaunchBlockerLedgerTemplateDocPath,
    'scripts/validate-deployment-execution-runbook-readiness.cjs',
    'No deployment is performed or approved by Phase 5O-A/B',
  ]) {
    assertIncludes(docs, required, 'Phase 5O status roll-forward docs');
  }
}

function assertDeploymentExecutionRunbookReadinessDocs() {
  assertTracked(
    [deploymentExecutionRunbookReadinessDocPath, providerEnvDecisionMatrixTemplateDocPath],
    'Phase 5O deployment execution runbook readiness docs'
  );
  const runbook = normalizeWhitespace(readRepoFile(deploymentExecutionRunbookReadinessDocPath));
  const matrix = normalizeWhitespace(readRepoFile(providerEnvDecisionMatrixTemplateDocPath));
  for (const required of [
    'repo-local, template-only, non-live',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'does not perform deployment, provider setup, preview publication, production launch, environment/secrets creation, smoke testing, rollback execution, owner approval, owner sign-off, launch clearance, production evidence, preview evidence, or deployment permission',
    'Deployment approval source reference',
    'Provider decision reference',
    'Environment/secrets decision reference',
    'Build command readiness',
    'Database/migration readiness',
    'Preview smoke plan readiness',
    'Production smoke plan readiness',
    'Rollback/recovery plan readiness',
    'Post-deploy verification checklist',
    'Final go/no-go status',
    'Not approved',
    'Approval missing',
    'Provider decision pending',
    'Environment/secrets pending',
    'Build verification pending',
    'Migration verification pending',
    'Preview smoke plan pending',
    'Production smoke plan pending',
    'Rollback plan pending',
    'Ready for approved deployment handoff',
    'A runbook is not deployment',
    'A provider decision placeholder is not provider setup',
    'An environment placeholder is not secret creation',
    'A smoke plan is not smoke evidence',
    'A rollback plan is not rollback execution',
    'A merged PR is not launch clearance',
  ]) {
    assertIncludes(runbook, required, 'Phase 5O deployment execution runbook readiness doc');
  }
  for (const required of [
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Decision ID: [NOT ASSIGNED]',
    'Decision area: [NOT SELECTED]',
    'Provider/platform option: [NOT SELECTED]',
    'Environment variable name: [NOT FILLED]',
    'Secret/value status: [NOT CREATED]',
    'Domain/DNS status: [NOT CONFIGURED]',
    'Database/provider status: [NOT CONFIGURED]',
    'Build/deploy command status: [NOT APPROVED]',
    'Smoke check status: [NOT RUN]',
    'Rollback status: [NOT RUN]',
    'Evidence status: [NOT EVIDENCE / NOT RECORDED]',
    'Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Hosting/provider selection',
    'Environment/secrets inventory',
    'Domain/DNS routing',
    'Database/provider runtime',
    'Build/deploy command',
    'Preview smoke checks',
    'Production smoke checks',
    'Rollback/recovery decision',
    'Final deployment authorization',
    'not provider setup, not env/secrets creation, not DNS setup, not smoke evidence, not rollback evidence, not production evidence, and not deployment approval',
  ]) {
    assertIncludes(matrix, required, 'Phase 5O provider/env decision matrix template doc');
  }
  assertNoMatch(
    `${runbook}\n${matrix}`,
    /owner approved|owner sign-?off complete|accepted by owner|rejected by owner|owner decision recorded|owner approval recorded|owner feedback recorded|owner re-review recorded|owner corrections completed|owner response sent|preview evidence captured|production evidence captured|smoke evidence captured|rollback evidence captured|route-walkthrough evidence captured|correction-completed evidence captured|response-sent evidence captured|public launch evidence captured|sign-off evidence captured|deployment approval granted|launch approval granted|launch clearance granted|provider setup completed|secrets created|deployment performed|preview published|production launched/i,
    'Phase 5O docs'
  );
}

function assertDeploymentExecutionRunbookPackageScript() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts?.['validate:deployment-execution-runbook-readiness'] === 'node scripts/validate-deployment-execution-runbook-readiness.cjs',
    'package.json must register validate:deployment-execution-runbook-readiness'
  );
}

function assertDeploymentExecutionRunbookSources() {
  const adminSource = readTrackedProductionSources(['website/app/admin/protected-admin-shell.tsx']);
  const adminPage = readRepoFile('website/app/admin/page.tsx');
  const publicSource = readTrackedProductionSources(publicSourceRoots);

  for (const required of [
    /Phase 5O-A\/B admin-only deployment execution runbook readiness/i,
    /Deployment execution runbook readiness helper/i,
    /LOCAL-DEPLOYMENT-EXECUTION-RUNBOOK-READINESS\.md/i,
    /LOCAL-PROVIDER-ENV-DECISION-MATRIX-TEMPLATE\.md/i,
    /LOCAL-DEPLOYMENT-APPROVAL-REQUEST-READINESS\.md/i,
    /LOCAL-PRE-LAUNCH-BLOCKER-LEDGER-TEMPLATE\.md/i,
    /Safe future deployment execution runbook sections/i,
    /Provider\/environment decision matrix placeholders/i,
    /Allowed future runbook statuses/i,
    /No-execution boundaries/i,
    /No\s+deployment\s+is\s+performed\s+here/i,
    /No provider setup is performed here/i,
    /No environment\/secrets are created here/i,
    /No preview is published here/i,
    /No production launch is performed here/i,
    /No smoke evidence is captured here/i,
    /No\s+rollback\s+is\s+executed\s+here/i,
    /No\s+deployment\s+approval\s+is\s+granted\s+here/i,
    /\[NOT EVIDENCE \/ NOT RECORDED\]/i,
    /\[DEPLOYMENT APPROVAL: NOT GRANTED\]/i,
  ]) {
    assert(required.test(adminSource), `Phase 5O admin source missing safe wording: ${required}`);
  }

  assertIncludes(adminPage, 'view={{ kind: "home" }}', 'admin page home view');
  assert(
    /function AdminOperationsHome[\s\S]*<OwnerReadinessHelpersPanel \/>/.test(adminSource),
    'Phase 5O admin source must render owner readiness helpers from the real AdminOperationsHome path'
  );
  assert(
    /function OwnerReadinessHelpersPanel[\s\S]*<OwnerReviewWalkthroughReadinessHelper \/>[\s\S]*<OwnerFeedbackIntakeReadinessHelper \/>[\s\S]*<OwnerCorrectionWorkflowReadinessHelper \/>[\s\S]*<OwnerReReviewRequestReadinessHelper \/>[\s\S]*<OwnerDecisionIntakeReadinessHelper \/>[\s\S]*<DeploymentApprovalRequestReadinessHelper \/>[\s\S]*<DeploymentExecutionRunbookReadinessHelper \/>/.test(adminSource),
    'Phase 5O admin source must keep the complete owner readiness helper chain in the shared panel'
  );

  assertNoMatch(
    publicSource,
    /deployment execution runbook|provider\/environment decision matrix|provider env decision matrix|deployment approval request|pre-launch blocker ledger|provider setup internals|environment\/secrets internals|smoke\/rollback internals|admin route\/view checklist|owner handoff internals|release-control internals|admin urls?|internal notes|destructive-action safeguards|recovery lanes?|status-transition matrix|public admin status|\/admin\//i,
    'Phase 5O public source'
  );
  assert(/\b(?:listing|listings)\b/i.test(publicSource), 'public source must retain listing wording');
  assert(/\b(?:rental|rentals)\b/i.test(publicSource), 'public source must retain rental wording');
  assert(/\b(?:quote|enquiry|request)\b/i.test(publicSource), 'public source must retain quote/enquiry/request wording');
  assertNoMatch(publicSource, /\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i, 'Phase 5O public source');
  assertNoMatch(publicSource, /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'Phase 5O public source');
  assertNoMatch(publicSource, /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i, 'Phase 5O public source');
  assertNoMatch(publicSource, /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging|public status view/i, 'Phase 5O public source');
  assertNoMatch(
    adminSource,
    /public upload|customer upload|new provider setup|new storage provider|NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE_KEY|service-role browser|Pinecone|\bRAG\b|n8n runtime|\/api\/chat.*retrieval|outbound messaging|email sending|sms sending|whatsapp sending|process\.env\.(?:NEXT_PUBLIC_|SUPABASE|N8N|PINECONE|VERCEL)/i,
    'Phase 5O admin source'
  );
}

function assertReleaseSuiteHasDeploymentExecutionRunbookReadiness() {
  const suite = readRepoFile('scripts/validate-release-candidate-suite.cjs');
  assertIncludes(suite, "args: ['run', 'validate:deployment-execution-runbook-readiness']", 'release-candidate suite');
  assertIncludes(suite, "args: ['run', 'validate:deployment-approval-request-readiness']", 'release-candidate suite');
  assertNoMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');
}

function assertPhase5oDeploymentExecutionRunbookReadiness() {
  assertDeploymentExecutionRunbookReadinessDocs();
  assertPhase5oStatusRollForward();
  assertDeploymentExecutionRunbookPackageScript();
  assertDeploymentExecutionRunbookSources();
  assertNoForbiddenTrackedFiles();
  assertNoFilledEvidence();
  assertPhase5nDeploymentApprovalRequestReadiness();
  assertReleaseSuiteHasDeploymentExecutionRunbookReadiness();
  assertReleaseSuiteHasDeploymentApprovalRequestReadiness();
  assertReleaseSuiteHasOwnerDecisionIntakeReadiness();
  assertReleaseSuiteHasOwnerReReviewRequestReadiness();
  assertReleaseSuiteHasOwnerCorrectionWorkflow();
  assertReleaseSuiteHasOwnerFeedbackIntake();
  assertReleaseSuiteHasOwnerReviewWalkthrough();
  assertReleaseSuiteHasCatalogueWriteWorkflow();
  assertSuiteAndTests();
}

function assertPhase5pStatusRollForward() {
  const docs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    `Current phase: ${currentPhase5p}`,
    `Latest completed capability: ${currentPhase5o}`,
    'Last merged capability PR: #170',
    `Last merged capability merge commit: ${phase170MergeCommit}`,
    smokeEvidenceIntakeReadinessDocPath,
    routeVerificationRollbackLedgerTemplateDocPath,
    deploymentExecutionRunbookReadinessDocPath,
    providerEnvDecisionMatrixTemplateDocPath,
    'scripts/validate-smoke-evidence-intake-readiness.cjs',
    'No deployment is performed or approved by Phase 5P-A/B',
  ]) {
    assertIncludes(docs, required, 'Phase 5P status roll-forward docs');
  }
}

function assertSmokeEvidenceIntakeReadinessDocs() {
  assertTracked(
    [smokeEvidenceIntakeReadinessDocPath, routeVerificationRollbackLedgerTemplateDocPath],
    'Phase 5P smoke evidence intake readiness docs'
  );
  const intake = normalizeWhitespace(readRepoFile(smokeEvidenceIntakeReadinessDocPath));
  const ledger = normalizeWhitespace(readRepoFile(routeVerificationRollbackLedgerTemplateDocPath));
  for (const required of [
    'repo-local, template-only, non-live',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'does not run smoke checks, record smoke evidence, publish preview, launch production, perform deployment, execute rollback, capture route-walkthrough evidence, capture production evidence, capture preview evidence, record owner approval, or grant deployment permission',
    'Deployment execution runbook reference',
    'Provider/environment decision reference',
    'Preview URL placeholder',
    'Production URL placeholder',
    'Public route smoke checklist',
    'Protected admin route smoke checklist',
    'Quote/enquiry request smoke checklist',
    'Listing/category/media smoke checklist',
    'Rollback observation placeholder',
    'Final evidence status',
    'Not approved',
    'Not run',
    'URL not supplied',
    'Provider decision pending',
    'Environment/secrets pending',
    'Smoke plan drafted only',
    'Evidence not captured',
    'Rollback not run',
    'Blocked: deployment approval missing',
    'Ready for future approved smoke run',
    'A smoke intake template is not smoke evidence',
    'A URL placeholder is not a live URL',
    'A route checklist is not a route walkthrough',
    'A rollback observation placeholder is not rollback evidence',
    'Passing validators is not smoke success',
    'A merged PR is not production readiness',
  ]) {
    assertIncludes(intake, required, 'Phase 5P smoke evidence intake readiness doc');
  }
  for (const required of [
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Check ID: [NOT ASSIGNED]',
    'Route/surface: [NOT SELECTED]',
    'Environment target: [NOT SELECTED]',
    'URL: [NOT SUPPLIED]',
    'Expected result: [NOT FILLED]',
    'Actual result: [NOT RUN]',
    'Smoke status: [NOT RUN]',
    'Rollback observation: [NOT RUN]',
    'Owner/business fact dependency: [OWNER INPUT REQUIRED]',
    'Evidence status: [NOT EVIDENCE / NOT RECORDED]',
    'Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Homepage',
    'Listings route',
    'Listing detail route',
    'Category/catalogue routes',
    'Events/event-use route',
    'Quote/enquiry request route',
    'Public not-found/recovery route',
    'Protected admin home route',
    'Protected admin listings/categories/media routes',
    'Protected admin quote workflow routes',
    'Rollback/recovery observation',
    'not smoke evidence, not route-walkthrough evidence, not rollback evidence, not preview evidence, not production evidence, and not deployment approval',
  ]) {
    assertIncludes(ledger, required, 'Phase 5P route verification rollback ledger template doc');
  }
  assertNoMatch(
    `${intake}\n${ledger}`,
    /owner approved|owner sign-?off complete|accepted by owner|rejected by owner|owner decision recorded|owner approval recorded|owner feedback recorded|owner re-review recorded|owner corrections completed|owner response sent|preview evidence captured|production evidence captured|smoke evidence captured|rollback evidence captured|route-walkthrough evidence captured|correction-completed evidence captured|response-sent evidence captured|public launch evidence captured|sign-off evidence captured|deployment approval granted|launch approval granted|launch clearance granted|provider setup completed|secrets created|deployment performed|preview published|production launched|actual deployment|smoke run completed|route walkthrough completed/i,
    'Phase 5P docs'
  );
}

function assertSmokeEvidenceIntakePackageScript() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts?.['validate:smoke-evidence-intake-readiness'] === 'node scripts/validate-smoke-evidence-intake-readiness.cjs',
    'package.json must register validate:smoke-evidence-intake-readiness'
  );
}

function assertSmokeEvidenceIntakeSources() {
  const adminSource = readTrackedProductionSources(['website/app/admin/protected-admin-shell.tsx']);
  const adminPage = readRepoFile('website/app/admin/page.tsx');
  const publicSource = readTrackedProductionSources(publicSourceRoots);

  for (const required of [
    /Phase 5P-A\/B admin-only smoke evidence intake readiness/i,
    /Smoke evidence intake readiness helper/i,
    /LOCAL-SMOKE-EVIDENCE-INTAKE-READINESS\.md/i,
    /LOCAL-ROUTE-VERIFICATION-ROLLBACK-LEDGER-TEMPLATE\.md/i,
    /LOCAL-DEPLOYMENT-EXECUTION-RUNBOOK-READINESS\.md/i,
    /LOCAL-PROVIDER-ENV-DECISION-MATRIX-TEMPLATE\.md/i,
    /Safe future smoke intake sections/i,
    /Route verification \/ rollback ledger placeholders/i,
    /Allowed future smoke intake statuses/i,
    /No-evidence\/no-run boundaries/i,
    /No smoke check is run here/i,
    /No route walkthrough is recorded here/i,
    /No\s+rollback\s+is\s+executed\s+here/i,
    /No preview evidence is captured here/i,
    /No production evidence is captured here/i,
    /No\s+deployment\s+is\s+performed\s+here/i,
    /No\s+deployment\s+approval\s+is\s+granted\s+here/i,
    /\[NOT EVIDENCE \/ NOT RECORDED\]/i,
    /\[DEPLOYMENT APPROVAL: NOT GRANTED\]/i,
  ]) {
    assert(required.test(adminSource), `Phase 5P admin source missing safe wording: ${required}`);
  }

  assertIncludes(adminPage, 'view={{ kind: "home" }}', 'admin page home view');
  assert(
    /function AdminOperationsHome[\s\S]*<OwnerReadinessHelpersPanel \/>/.test(adminSource),
    'Phase 5P admin source must render owner readiness helpers from the real AdminOperationsHome path'
  );
  assert(
    /function OwnerReadinessHelpersPanel[\s\S]*<OwnerReviewWalkthroughReadinessHelper \/>[\s\S]*<OwnerFeedbackIntakeReadinessHelper \/>[\s\S]*<OwnerCorrectionWorkflowReadinessHelper \/>[\s\S]*<OwnerReReviewRequestReadinessHelper \/>[\s\S]*<OwnerDecisionIntakeReadinessHelper \/>[\s\S]*<DeploymentApprovalRequestReadinessHelper \/>[\s\S]*<DeploymentExecutionRunbookReadinessHelper \/>[\s\S]*<SmokeEvidenceIntakeReadinessHelper \/>/.test(adminSource),
    'Phase 5P admin source must keep the complete owner readiness helper chain in the shared panel'
  );

  assertNoMatch(
    publicSource,
    /smoke evidence intake|route verification ledger|rollback observation|deployment execution runbook|provider\/environment decision matrix|provider env decision matrix|deployment approval request|provider setup internals|environment\/secrets internals|admin route internals|owner handoff internals|release-control internals|admin urls?|internal notes|public admin status|\/admin\//i,
    'Phase 5P public source'
  );
  assert(/\b(?:listing|listings)\b/i.test(publicSource), 'public source must retain listing wording');
  assert(/\b(?:rental|rentals)\b/i.test(publicSource), 'public source must retain rental wording');
  assert(/\b(?:quote|enquiry|request)\b/i.test(publicSource), 'public source must retain quote/enquiry/request wording');
  assertNoMatch(publicSource, /\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i, 'Phase 5P public source');
  assertNoMatch(publicSource, /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'Phase 5P public source');
  assertNoMatch(publicSource, /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i, 'Phase 5P public source');
  assertNoMatch(publicSource, /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging|public status view/i, 'Phase 5P public source');
  assertNoMatch(
    adminSource,
    /public upload|customer upload|new provider setup|new storage provider|NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE_KEY|service-role browser|Pinecone|\bRAG\b|n8n runtime|\/api\/chat.*retrieval|outbound messaging|email sending|sms sending|whatsapp sending|process\.env\.(?:NEXT_PUBLIC_|SUPABASE|N8N|PINECONE|VERCEL)/i,
    'Phase 5P admin source'
  );
}

function assertReleaseSuiteHasSmokeEvidenceIntakeReadiness() {
  const suite = readRepoFile('scripts/validate-release-candidate-suite.cjs');
  assertIncludes(suite, "args: ['run', 'validate:smoke-evidence-intake-readiness']", 'release-candidate suite');
  assertIncludes(suite, "args: ['run', 'validate:deployment-execution-runbook-readiness']", 'release-candidate suite');
  assertNoMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');
}

function assertPhase5pSmokeEvidenceIntakeReadiness() {
  assertSmokeEvidenceIntakeReadinessDocs();
  assertPhase5pStatusRollForward();
  assertSmokeEvidenceIntakePackageScript();
  assertSmokeEvidenceIntakeSources();
  assertNoForbiddenTrackedFiles();
  assertNoFilledEvidence();
  assertPhase5oDeploymentExecutionRunbookReadiness();
  assertReleaseSuiteHasSmokeEvidenceIntakeReadiness();
  assertReleaseSuiteHasDeploymentExecutionRunbookReadiness();
  assertReleaseSuiteHasDeploymentApprovalRequestReadiness();
  assertReleaseSuiteHasOwnerDecisionIntakeReadiness();
  assertReleaseSuiteHasOwnerReReviewRequestReadiness();
  assertReleaseSuiteHasOwnerCorrectionWorkflow();
  assertReleaseSuiteHasOwnerFeedbackIntake();
  assertReleaseSuiteHasOwnerReviewWalkthrough();
  assertReleaseSuiteHasCatalogueWriteWorkflow();
  assertSuiteAndTests();
}

function assertPhase5mStatusRollForward() {
  const docs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    `Current phase: ${currentPhase5m}`,
    `Latest completed capability: ${currentPhase5l}`,
    'Last merged capability PR: #167',
    `Last merged capability merge commit: ${phase167MergeCommit}`,
    ownerDecisionIntakeReadinessDocPath,
    signoffCriteriaLedgerTemplateDocPath,
    ownerReReviewRequestReadinessDocPath,
    correctionDeltaPacketTemplateDocPath,
    'scripts/validate-owner-decision-intake-readiness.cjs',
    'No deployment is performed or approved by Phase 5M-A/B',
  ]) {
    assertIncludes(docs, required, 'Phase 5M status roll-forward docs');
  }
}

function assertOwnerDecisionIntakeReadinessDocs() {
  assertTracked(
    [ownerDecisionIntakeReadinessDocPath, signoffCriteriaLedgerTemplateDocPath],
    'Phase 5M owner decision intake readiness docs'
  );
  const readiness = normalizeWhitespace(readRepoFile(ownerDecisionIntakeReadinessDocPath));
  const ledger = normalizeWhitespace(readRepoFile(signoffCriteriaLedgerTemplateDocPath));
  for (const required of [
    'repo-local, template-only, non-live',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'does not record actual owner decisions, owner approval, owner acceptance, owner rejection, owner sign-off, launch clearance, production evidence, response-sent evidence, correction-completed evidence, or deployment permission',
    'Owner decision source reference',
    'Re-review request reference',
    'Correction delta packet reference',
    'Decision scope',
    'Public copy acceptance',
    'Listing/category/media acceptance',
    'Admin-only workflow acceptance',
    'Blocked claims still unresolved',
    'Public content gaps still unresolved',
    'Deployment approval status',
    'Not requested.',
    'Not received.',
    'Needs owner clarification.',
    'Accepted for local correction scope only.',
    'Rejected / needs revision.',
    'Partially accepted / needs split.',
    'Blocked: unsupported claim.',
    'Blocked: deployment approval missing.',
    'A future owner decision is not deployment approval unless explicitly separate',
    'Local correction acceptance is not launch clearance',
    'Sign-off readiness is not sign-off evidence',
    'Passing validators is not owner acknowledgement',
    'A merged PR is not owner approval',
    'A re-review reply is not production evidence',
  ]) {
    assertIncludes(readiness, required, 'Phase 5M owner decision intake readiness doc');
  }
  for (const required of [
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Criterion ID: [NOT ASSIGNED]',
    'Criterion area: [NOT SELECTED]',
    'Owner input required: [OWNER INPUT REQUIRED]',
    'Supporting fact/reference: [NOT SUPPLIED]',
    'Public copy affected: [NOT IDENTIFIED]',
    'Admin workflow affected: [NOT IDENTIFIED]',
    'Acceptance status: [NOT REQUESTED]',
    'Rejection/revision note: [NOT CAPTURED]',
    'Evidence status: [NOT EVIDENCE / NOT RECORDED]',
    'Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Public homepage/category/listing copy.',
    'Quote/enquiry request wording.',
    'Listing/category/media facts.',
    'Image/alt-text preferences.',
    'Admin-only workflow wording.',
    'Public content gaps.',
    'Blocked business claims.',
    'Launch/deployment decision.',
    'not owner sign-off, not owner approval, not response-sent evidence, not production evidence, and not deployment approval',
  ]) {
    assertIncludes(ledger, required, 'Phase 5M sign-off criteria ledger template doc');
  }
  assertNoMatch(
    `${readiness}\n${ledger}`,
    /owner approved|owner sign-?off complete|accepted by owner|rejected by owner|owner decision recorded|owner approval recorded|owner feedback recorded|owner re-review recorded|owner corrections completed|owner response sent|preview evidence captured|production evidence captured|smoke evidence captured|route-walkthrough evidence captured|correction-completed evidence captured|response-sent evidence captured|public launch evidence captured|sign-off evidence captured|deployment approval granted|launch approval granted|launch clearance granted/i,
    'Phase 5M docs'
  );
}

function assertOwnerDecisionIntakePackageScript() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts?.['validate:owner-decision-intake-readiness'] === 'node scripts/validate-owner-decision-intake-readiness.cjs',
    'package.json must register validate:owner-decision-intake-readiness'
  );
}

function assertOwnerDecisionIntakeSources() {
  const adminSource = readTrackedProductionSources(['website/app/admin/protected-admin-shell.tsx']);
  const publicSource = readTrackedProductionSources(publicSourceRoots);

  for (const required of [
    /Phase 5M-A\/B admin-only owner decision intake readiness/i,
    /Owner decision intake readiness helper/i,
    /LOCAL-OWNER-DECISION-INTAKE-READINESS\.md/i,
    /LOCAL-SIGNOFF-CRITERIA-LEDGER-TEMPLATE\.md/i,
    /LOCAL-OWNER-RE-REVIEW-REQUEST-READINESS\.md/i,
    /LOCAL-CORRECTION-DELTA-PACKET-TEMPLATE\.md/i,
    /Safe future decision intake sections/i,
    /Sign-off criteria ledger placeholders/i,
    /Allowed future decision statuses/i,
    /No-launch\/no-deploy boundaries/i,
    /No owner decision is recorded here/i,
    /No owner approval is recorded here/i,
    /No owner sign-off is claimed here/i,
    /No launch clearance is granted here/i,
    /No\s+deployment\s+approval\s+is\s+granted\s+here/i,
    /\[NOT EVIDENCE \/ NOT RECORDED\]/i,
    /\[DEPLOYMENT APPROVAL: NOT GRANTED\]/i,
  ]) {
    assert(required.test(adminSource), `Phase 5M admin source missing safe wording: ${required}`);
  }

  assert(
    /function AdminOperationsHome[\s\S]*<OwnerReadinessHelpersPanel \/>/.test(adminSource),
    'Phase 5M admin source must render owner readiness helpers from the real AdminOperationsHome path'
  );
  assert(
    /function OwnerReadinessHelpersPanel[\s\S]*<OwnerReviewWalkthroughReadinessHelper \/>[\s\S]*<OwnerFeedbackIntakeReadinessHelper \/>[\s\S]*<OwnerCorrectionWorkflowReadinessHelper \/>[\s\S]*<OwnerReReviewRequestReadinessHelper \/>[\s\S]*<OwnerDecisionIntakeReadinessHelper \/>/.test(adminSource),
    'Phase 5M admin source must keep the full owner readiness helper chain in the shared panel'
  );

  assertNoMatch(
    publicSource,
    /owner decision intake|decision intake readiness|sign-off criteria ledger|owner re-review request|re-review request readiness|correction delta packet|owner correction workflow|correction workflow readiness|content-gap register|public content-gap|owner-feedback intake helper|owner feedback intake helper|correction queue reconciliation|owner-review walkthrough helper|owner-review walkthrough internals|full-route acceptance matrix|route acceptance matrix internals|admin route\/view checklist|owner handoff internals|owner approval issue template|no-deploy preflight command|no-deploy command-center|release-control internals|admin urls?|internal notes|destructive-action safeguards|recovery lanes?|status-transition matrix|public admin status|\/admin\//i,
    'Phase 5M public source'
  );
  assert(/\b(?:listing|listings)\b/i.test(publicSource), 'public source must retain listing wording');
  assert(/\b(?:rental|rentals)\b/i.test(publicSource), 'public source must retain rental wording');
  assert(/\b(?:quote|enquiry|request)\b/i.test(publicSource), 'public source must retain quote/enquiry/request wording');
  assertNoMatch(publicSource, /\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i, 'Phase 5M public source');
  assertNoMatch(publicSource, /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'Phase 5M public source');
  assertNoMatch(publicSource, /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i, 'Phase 5M public source');
  assertNoMatch(publicSource, /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging|public status view/i, 'Phase 5M public source');
  assertNoMatch(
    adminSource,
    /public upload|customer upload|new provider setup|new storage provider|NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE_KEY|service-role browser|Pinecone|\bRAG\b|n8n runtime|\/api\/chat.*retrieval|outbound messaging|email sending|sms sending|whatsapp sending|process\.env\.(?:NEXT_PUBLIC_|SUPABASE|N8N|PINECONE|VERCEL)/i,
    'Phase 5M admin source'
  );
}

function assertReleaseSuiteHasOwnerDecisionIntakeReadiness() {
  const suite = readRepoFile('scripts/validate-release-candidate-suite.cjs');
  assertIncludes(suite, "args: ['run', 'validate:owner-decision-intake-readiness']", 'release-candidate suite');
  assertIncludes(suite, "args: ['run', 'validate:owner-re-review-request-readiness']", 'release-candidate suite');
  assertNoMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');
}

function assertPhase5mOwnerDecisionIntakeReadiness() {
  assertOwnerDecisionIntakeReadinessDocs();
  assertPhase5mStatusRollForward();
  assertOwnerDecisionIntakePackageScript();
  assertOwnerDecisionIntakeSources();
  assertNoForbiddenTrackedFiles();
  assertNoFilledEvidence();
  assertPhase5lOwnerReReviewRequestReadiness();
  assertReleaseSuiteHasOwnerDecisionIntakeReadiness();
  assertReleaseSuiteHasOwnerReReviewRequestReadiness();
  assertReleaseSuiteHasOwnerCorrectionWorkflow();
  assertReleaseSuiteHasOwnerFeedbackIntake();
  assertReleaseSuiteHasOwnerReviewWalkthrough();
  assertReleaseSuiteHasCatalogueWriteWorkflow();
  assertSuiteAndTests();
}

function assertPhase5lStatusRollForward() {
  const docs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    `Current phase: ${currentPhase5l}`,
    `Latest completed capability: ${currentPhase5k}`,
    'Last merged capability PR: #166',
    `Last merged capability merge commit: ${phase166MergeCommit}`,
    ownerReReviewRequestReadinessDocPath,
    correctionDeltaPacketTemplateDocPath,
    ownerCorrectionWorkflowReadinessDocPath,
    publicContentGapRegisterDocPath,
    'scripts/validate-owner-re-review-request-readiness.cjs',
    'No deployment is performed or approved by Phase 5L-A/B',
  ]) {
    assertIncludes(docs, required, 'Phase 5L status roll-forward docs');
  }
}

function assertOwnerReReviewRequestReadinessDocs() {
  assertTracked(
    [ownerReReviewRequestReadinessDocPath, correctionDeltaPacketTemplateDocPath],
    'Phase 5L owner re-review request readiness docs'
  );
  const readiness = normalizeWhitespace(readRepoFile(ownerReReviewRequestReadinessDocPath));
  const packet = normalizeWhitespace(readRepoFile(correctionDeltaPacketTemplateDocPath));
  for (const required of [
    'repo-local, template-only, non-live',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'does not record actual owner feedback, owner re-review, owner response, owner acceptance, owner rejection, owner approval, owner sign-off, correction-completed evidence, response-sent evidence, launch clearance, or deployment permission',
    'Review purpose',
    'Changed public copy summary',
    'Changed listing/category/media summary',
    'Changed admin-only workflow wording summary',
    'Unchanged blocked claims',
    'Public content gaps still requiring owner facts',
    'Questions requiring owner input',
    'Deployment approval still absent',
    'Preparing a request is not sending a response',
    'Sending a future request must be tracked separately',
    'A re-review request is not owner approval',
    'A re-review request is not sign-off evidence',
    'A correction delta packet is not deployment approval',
    'A local validation pass is not owner acknowledgement',
  ]) {
    assertIncludes(readiness, required, 'Phase 5L owner re-review request readiness doc');
  }
  for (const required of [
    'template-only',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Source owner comment reference: [NOT CAPTURED]',
    'Correction PR reference: [NOT CREATED]',
    'Affected route/component/doc/test: [NOT IDENTIFIED]',
    'Before copy: [NOT FILLED]',
    'After copy: [NOT FILLED]',
    'Owner fact supplied: [NOT SUPPLIED]',
    'Public claim support status: [BLOCKED UNTIL SUPPLIED]',
    'Follow-up question: [OWNER INPUT REQUIRED]',
    'Response sent status: [NOT SENT]',
    'Re-review status: [NOT REQUESTED]',
    'Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]',
    'not correction-completed evidence, not response-sent evidence, not owner approval, and not deployment approval',
  ]) {
    assertIncludes(packet, required, 'Phase 5L correction delta packet template doc');
  }
  assertNoMatch(
    `${readiness}\n${packet}`,
    /owner approved|owner sign-?off complete|accepted by owner|owner decision recorded|owner feedback recorded|owner re-review recorded|owner corrections completed|owner response sent|preview evidence captured|production evidence captured|smoke evidence captured|route-walkthrough evidence captured|correction-completed evidence captured|response-sent evidence captured|public launch evidence captured|sign-off evidence captured|deployment approval granted|launch approval granted/i,
    'Phase 5L docs'
  );
}

function assertOwnerReReviewRequestPackageScript() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts?.['validate:owner-re-review-request-readiness'] === 'node scripts/validate-owner-re-review-request-readiness.cjs',
    'package.json must register validate:owner-re-review-request-readiness'
  );
}

function assertOwnerReReviewRequestSources() {
  const adminSource = readTrackedProductionSources(['website/app/admin/protected-admin-shell.tsx']);
  const publicSource = readTrackedProductionSources(publicSourceRoots);

  for (const required of [
    /Phase 5L-A\/B admin-only owner re-review request readiness/i,
    /Owner re-review request readiness helper/i,
    /LOCAL-OWNER-RE-REVIEW-REQUEST-READINESS\.md/i,
    /LOCAL-CORRECTION-DELTA-PACKET-TEMPLATE\.md/i,
    /LOCAL-OWNER-CORRECTION-WORKFLOW-READINESS\.md/i,
    /LOCAL-PUBLIC-CONTENT-GAP-REGISTER\.md/i,
    /Safe future re-review request sections/i,
    /Correction delta packet placeholders/i,
    /No-response\/no-signoff boundaries/i,
    /No owner re-review is recorded here/i,
    /No owner response is sent here/i,
    /No owner sign-off is claimed here/i,
    /No correction completion is claimed here/i,
    /No\s+deployment\s+approval\s+is\s+granted\s+here/i,
    /\[NOT EVIDENCE \/ NOT RECORDED\]/i,
    /\[DEPLOYMENT APPROVAL: NOT GRANTED\]/i,
  ]) {
    assert(required.test(adminSource), `Phase 5L admin source missing safe wording: ${required}`);
  }

  assertNoMatch(
    publicSource,
    /owner re-review request|re-review request readiness|correction delta packet|owner correction workflow|correction workflow readiness|content-gap register|public content-gap|owner-feedback intake helper|owner feedback intake helper|correction queue reconciliation|owner-review walkthrough helper|owner-review walkthrough internals|full-route acceptance matrix|route acceptance matrix internals|admin route\/view checklist|owner handoff internals|owner approval issue template|no-deploy preflight command|no-deploy command-center|release-control internals|admin urls?|internal notes|destructive-action safeguards|recovery lanes?|status-transition matrix|public admin status|\/admin\//i,
    'Phase 5L public source'
  );
  assert(/\b(?:listing|listings)\b/i.test(publicSource), 'public source must retain listing wording');
  assert(/\b(?:rental|rentals)\b/i.test(publicSource), 'public source must retain rental wording');
  assert(/\b(?:quote|enquiry|request)\b/i.test(publicSource), 'public source must retain quote/enquiry/request wording');
  assertNoMatch(publicSource, /\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i, 'Phase 5L public source');
  assertNoMatch(publicSource, /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'Phase 5L public source');
  assertNoMatch(publicSource, /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i, 'Phase 5L public source');
  assertNoMatch(publicSource, /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging|public status view/i, 'Phase 5L public source');
  assertNoMatch(
    adminSource,
    /public upload|customer upload|new provider setup|new storage provider|NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE_KEY|service-role browser|Pinecone|\bRAG\b|n8n runtime|\/api\/chat.*retrieval|outbound messaging|email sending|sms sending|whatsapp sending|process\.env\.(?:NEXT_PUBLIC_|SUPABASE|N8N|PINECONE|VERCEL)/i,
    'Phase 5L admin source'
  );
}

function assertReleaseSuiteHasOwnerReReviewRequestReadiness() {
  const suite = readRepoFile('scripts/validate-release-candidate-suite.cjs');
  assertIncludes(suite, "args: ['run', 'validate:owner-re-review-request-readiness']", 'release-candidate suite');
  assertIncludes(suite, "args: ['run', 'validate:owner-correction-workflow-readiness']", 'release-candidate suite');
  assertNoMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');
}

function assertPhase5lOwnerReReviewRequestReadiness() {
  assertOwnerReReviewRequestReadinessDocs();
  assertPhase5lStatusRollForward();
  assertOwnerReReviewRequestPackageScript();
  assertOwnerReReviewRequestSources();
  assertNoForbiddenTrackedFiles();
  assertNoFilledEvidence();
  assertPhase5kOwnerCorrectionWorkflowReadiness();
  assertReleaseSuiteHasOwnerReReviewRequestReadiness();
  assertReleaseSuiteHasOwnerCorrectionWorkflow();
  assertReleaseSuiteHasOwnerFeedbackIntake();
  assertReleaseSuiteHasOwnerReviewWalkthrough();
  assertReleaseSuiteHasCatalogueWriteWorkflow();
  assertSuiteAndTests();
}

function assertReleaseSuiteHasOwnerFeedbackIntake() {
  const suite = readRepoFile('scripts/validate-release-candidate-suite.cjs');
  assertIncludes(suite, "args: ['run', 'validate:owner-feedback-intake-readiness']", 'release-candidate suite');
  assertNoMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');
}

function assertPhase5jOwnerFeedbackIntakeReadiness() {
  assertOwnerFeedbackIntakeReadinessDocs();
  assertPhase5jStatusRollForward();
  assertOwnerFeedbackIntakePackageScript();
  assertOwnerFeedbackIntakeSources();
  assertNoForbiddenTrackedFiles();
  assertNoFilledEvidence();
  assertPhase5iOwnerReviewWalkthroughReadiness();
  assertReleaseSuiteHasOwnerFeedbackIntake();
  assertReleaseSuiteHasOwnerReviewWalkthrough();
  assertReleaseSuiteHasCatalogueWriteWorkflow();
  assertSuiteAndTests();
}

function assertReleaseSuiteHasCatalogueContentOps() {
  const suite = readRepoFile('scripts/validate-release-candidate-suite.cjs');
  assertIncludes(suite, "args: ['run', 'validate:catalogue-content-ops-readiness']", 'release-candidate suite');
  assertNoMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');
}

function assertPhase5gCatalogueContentOpsReadiness() {
  assertCatalogueContentOpsReadinessDoc();
  assertPhase5gStatusRollForward();
  assertCatalogueContentOpsPackageScript();
  assertPublicSources();
  assertPublicJourneySources();
  assertListingDetailSources();
  assertQuoteIntakeSources();
  assertQuoteTriageSources();
  assertCatalogueContentOpsSources();
  assertNoForbiddenTrackedFiles();
  assertNoFilledEvidence();
  assertReleaseSuiteHasPublicJourney();
  assertReleaseSuiteHasQuoteIntake();
  assertReleaseSuiteHasQuoteTriage();
  assertReleaseSuiteHasCatalogueContentOps();
  assertReleaseSuiteHasCatalogueWriteWorkflow();
  assertSuiteAndTests();
  assertPhase5hCatalogueWriteWorkflowReadiness();
}

function assertPhase5eQuoteIntakeReadiness() {
  assertQuoteIntakeReadinessDoc();
  assertPhase5eStatusRollForward();
  assertQuoteIntakePackageScript();
  assertPublicSources();
  assertPublicJourneySources();
  assertListingDetailSources();
  assertQuoteIntakeSources();
  assertNoForbiddenTrackedFiles();
  assertNoFilledEvidence();
  assertReleaseSuiteHasPublicJourney();
  assertReleaseSuiteHasQuoteIntake();
  assertSuiteAndTests();
}

function assertPhase5cStatusRollForward() {
  const docs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    `Current phase: ${currentPhase5c}`,
    `Latest completed capability: ${currentPhase5b}`,
    'Last merged capability PR: #156',
    `Last merged capability merge commit: ${phase156MergeCommit}`,
    discoveryAcceptanceDocPath,
    publicJourneyAcceptanceDocPath,
    cleanupDocPath,
    'scripts/validate-public-discovery-acceptance.cjs',
    'No deployment is performed or approved by Phase 5C-A/B',
  ]) {
    assertIncludes(docs, required, 'Phase 5C status roll-forward docs');
  }
}

function assertPublicDiscoveryAcceptanceDoc() {
  assertTracked([discoveryAcceptanceDocPath], 'Phase 5C discovery acceptance doc');
  const doc = normalizeWhitespace(readRepoFile(discoveryAcceptanceDocPath));
  for (const required of [
    'repo-local, template-only, non-live discovery search/filter acceptance note',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Public search/filter path',
    'Category/event-use discovery coverage',
    'Active filter/search state',
    'Empty-result recovery',
    'Quote-intent context boundary',
    'Protected admin discovery parity helper',
    'Owner inputs still missing',
    'Public claims still blocked',
    'docs/OWNER-HANDOFF-BUNDLE.md',
    'docs/content/LOCAL-CONTENT-READINESS-CLEANUP.md',
    'docs/content/LOCAL-PUBLIC-JOURNEY-ACCEPTANCE.md',
    'docs/content/LOCAL-DISCOVERY-SEARCH-FILTER-ACCEPTANCE.md',
  ]) {
    assertIncludes(doc, required, 'Phase 5C discovery acceptance doc');
  }
  assertNoMatch(
    doc,
    /owner approved|owner sign-?off complete|actual owner decision|accepted by owner|preview evidence captured|production evidence captured|manual qa completed/i,
    'Phase 5C discovery acceptance doc'
  );
}

function assertPublicDiscoveryPackageScript() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts?.['validate:public-discovery-acceptance'] === 'node scripts/validate-public-discovery-acceptance.cjs',
    'package.json must register validate:public-discovery-acceptance'
  );
}

function assertPhase5cPublicDiscoveryAcceptance() {
  assertPublicDiscoveryAcceptanceDoc();
  assertPhase5cStatusRollForward();
  assertPublicDiscoveryPackageScript();
  assertPublicSources();
  assertPublicJourneySources();
  assertNoForbiddenTrackedFiles();
  assertNoFilledEvidence();
  assertReleaseSuiteHasPublicJourney();
  assertSuiteAndTests();
  assertPhase5dListingDetailReadiness();
  assertPhase5eQuoteIntakeReadiness();
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
  assertPhase5cPublicDiscoveryAcceptance();
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

function assertPhase5qStatusRollForward() {
  const docs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    `Current phase: ${currentPhase5q}`,
    `Latest completed capability: ${currentPhase5p}`,
    'Last merged capability PR: #171',
    `Last merged capability merge commit: ${phase171MergeCommit}`,
    smokeEvidenceReviewReadinessDocPath,
    goNogoDecisionLedgerTemplateDocPath,
    smokeEvidenceIntakeReadinessDocPath,
    routeVerificationRollbackLedgerTemplateDocPath,
    'scripts/validate-smoke-evidence-review-readiness.cjs',
    'No deployment is performed or approved by Phase 5Q-A/B',
  ]) {
    assertIncludes(docs, required, 'Phase 5Q status roll-forward docs');
  }
}

function assertSmokeEvidenceReviewReadinessDocs() {
  assertTracked(
    [smokeEvidenceReviewReadinessDocPath, goNogoDecisionLedgerTemplateDocPath],
    'Phase 5Q smoke evidence review readiness docs'
  );
  const review = normalizeWhitespace(readRepoFile(smokeEvidenceReviewReadinessDocPath));
  const ledger = normalizeWhitespace(readRepoFile(goNogoDecisionLedgerTemplateDocPath));
  for (const required of [
    'repo-local, template-only, non-live',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'does not review actual smoke evidence, approve launch, record go/no-go decisions, record route-walkthrough evidence, capture production evidence, capture preview evidence, execute rollback, perform deployment, record owner approval, or grant deployment permission',
    'Smoke evidence intake reference',
    'Route verification ledger reference',
    'Preview evidence review placeholder',
    'Production evidence review placeholder',
    'Public route result review placeholder',
    'Protected admin route result review placeholder',
    'Quote/enquiry result review placeholder',
    'Listing/category/media result review placeholder',
    'Rollback observation review placeholder',
    'Final go/no-go review status',
    'Not started',
    'Evidence not captured',
    'Evidence incomplete',
    'Needs owner clarification',
    'Needs provider clarification',
    'Needs route retest',
    'Needs rollback review',
    'Blocked: deployment approval missing',
    'Blocked: production readiness not proven',
    'Ready for future go/no-go review',
    'A review template is not completed evidence review',
    'Evidence placeholders are not evidence',
    'A route result placeholder is not route verification',
    'A rollback review placeholder is not rollback evidence',
    'Passing validators is not smoke success',
    'A merged PR is not go/no-go approval',
  ]) {
    assertIncludes(review, required, 'Phase 5Q smoke evidence review readiness doc');
  }
  for (const required of [
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Decision ID: [NOT ASSIGNED]',
    'Decision area: [NOT SELECTED]',
    'Evidence source: [NOT SUPPLIED]',
    'Route/surface affected: [NOT SELECTED]',
    'Owner input status: [OWNER INPUT REQUIRED]',
    'Provider/runtime status: [PROVIDER DECISION REQUIRED]',
    'Smoke result status: [NOT RUN]',
    'Rollback result status: [NOT RUN]',
    'Go/no-go status: [NOT DECIDED]',
    'Follow-up required: [NOT CAPTURED]',
    'Evidence status: [NOT EVIDENCE / NOT RECORDED]',
    'Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Public route smoke review',
    'Protected admin smoke review',
    'Quote/enquiry smoke review',
    'Listing/category/media smoke review',
    'Provider/runtime review',
    'Environment/secrets review',
    'Rollback/recovery review',
    'Owner sign-off dependency',
    'Final launch go/no-go',
    'not go/no-go approval, not launch clearance, not owner approval, not smoke evidence, not rollback evidence, not preview evidence, not production evidence, and not deployment approval',
  ]) {
    assertIncludes(ledger, required, 'Phase 5Q go/no-go decision ledger template doc');
  }
  assertNoMatch(
    `${review}\n${ledger}`,
    /owner approved|owner sign-?off complete|accepted by owner|rejected by owner|owner decision recorded|owner approval recorded|owner feedback recorded|owner re-review recorded|owner corrections completed|owner response sent|preview evidence captured|production evidence captured|smoke evidence captured|rollback evidence captured|route-walkthrough evidence captured|correction-completed evidence captured|response-sent evidence captured|public launch evidence captured|sign-off evidence captured|deployment approval granted|launch approval granted|launch clearance granted|provider setup completed|secrets created|deployment performed|preview published|production launched|actual deployment|smoke run completed|route walkthrough completed/i,
    'Phase 5Q docs'
  );
}

function assertSmokeEvidenceReviewPackageScript() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts?.['validate:smoke-evidence-review-readiness'] === 'node scripts/validate-smoke-evidence-review-readiness.cjs',
    'package.json must register validate:smoke-evidence-review-readiness'
  );
}

function assertSmokeEvidenceReviewSources() {
  const adminSource = readTrackedProductionSources(['website/app/admin/protected-admin-shell.tsx']);
  const adminPage = readRepoFile('website/app/admin/page.tsx');
  const publicSource = readTrackedProductionSources(publicSourceRoots);

  for (const required of [
    /Phase 5Q-A\/B admin-only smoke evidence review readiness/i,
    /Smoke evidence review readiness helper/i,
    /LOCAL-SMOKE-EVIDENCE-REVIEW-READINESS\.md/i,
    /LOCAL-GO-NOGO-DECISION-LEDGER-TEMPLATE\.md/i,
    /LOCAL-SMOKE-EVIDENCE-INTAKE-READINESS\.md/i,
    /LOCAL-ROUTE-VERIFICATION-ROLLBACK-LEDGER-TEMPLATE\.md/i,
    /Safe future evidence review sections/i,
    /Go\/no-go decision ledger placeholders/i,
    /Allowed future evidence review statuses/i,
    /No-review\/no-launch boundaries/i,
    /No smoke evidence is reviewed here/i,
    /No go\/no-go decision is recorded here/i,
    /No launch clearance is granted here/i,
    /No route verification is recorded here/i,
    /No rollback evidence is captured here/i,
    /No preview evidence is captured here/i,
    /No production evidence is captured here/i,
    /No\s+deployment\s+is\s+performed\s+here/i,
    /No\s+deployment\s+approval\s+is\s+granted\s+here/i,
    /\[NOT EVIDENCE \/ NOT RECORDED\]/i,
    /\[DEPLOYMENT APPROVAL: NOT GRANTED\]/i,
  ]) {
    assert(required.test(adminSource), `Phase 5Q admin source missing safe wording: ${required}`);
  }

  assertIncludes(adminPage, 'view={{ kind: "home" }}', 'admin page home view');
  assert(
    /function AdminOperationsHome[\s\S]*<OwnerReadinessHelpersPanel \/>/.test(adminSource),
    'Phase 5Q admin source must render owner readiness helpers from the real AdminOperationsHome path'
  );
  assert(
    /function OwnerReadinessHelpersPanel[\s\S]*<OwnerReviewWalkthroughReadinessHelper \/>[\s\S]*<OwnerFeedbackIntakeReadinessHelper \/>[\s\S]*<OwnerCorrectionWorkflowReadinessHelper \/>[\s\S]*<OwnerReReviewRequestReadinessHelper \/>[\s\S]*<OwnerDecisionIntakeReadinessHelper \/>[\s\S]*<DeploymentApprovalRequestReadinessHelper \/>[\s\S]*<DeploymentExecutionRunbookReadinessHelper \/>[\s\S]*<SmokeEvidenceIntakeReadinessHelper \/>[\s\S]*<SmokeEvidenceReviewReadinessHelper \/>/.test(adminSource),
    'Phase 5Q admin source must keep the complete owner readiness helper chain in the shared panel'
  );

  assertNoMatch(
    publicSource,
    /smoke evidence review|go\/no-go decision ledger|smoke evidence intake|route verification ledger|rollback observation|deployment execution runbook|provider\/environment decision matrix|provider env decision matrix|deployment approval request|provider setup internals|environment\/secrets internals|admin route internals|owner handoff internals|release-control internals|admin urls?|internal notes|public admin status|\/admin\//i,
    'Phase 5Q public source'
  );
  assert(/\b(?:listing|listings)\b/i.test(publicSource), 'public source must retain listing wording');
  assert(/\b(?:rental|rentals)\b/i.test(publicSource), 'public source must retain rental wording');
  assert(/\b(?:quote|enquiry|request)\b/i.test(publicSource), 'public source must retain quote/enquiry/request wording');
  assertNoMatch(publicSource, /\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i, 'Phase 5Q public source');
  assertNoMatch(publicSource, /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'Phase 5Q public source');
  assertNoMatch(publicSource, /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i, 'Phase 5Q public source');
  assertNoMatch(publicSource, /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging|public status view/i, 'Phase 5Q public source');
  assertNoMatch(
    adminSource,
    /public upload|customer upload|new provider setup|new storage provider|NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE_KEY|service-role browser|Pinecone|\bRAG\b|n8n runtime|\/api\/chat.*retrieval|outbound messaging|email sending|sms sending|whatsapp sending|process\.env\.(?:NEXT_PUBLIC_|SUPABASE|N8N|PINECONE|VERCEL)/i,
    'Phase 5Q admin source'
  );
}


function assertPhase5rStatusRollForward() {
  const docs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    `Current phase: ${currentPhase5r}`,
    `Latest completed capability: ${currentPhase5q}`,
    'Last merged capability PR: #172',
    `Last merged capability merge commit: ${phase172MergeCommit}`,
    launchDecisionResponseReadinessDocPath,
    releaseClosurePacketTemplateDocPath,
    smokeEvidenceReviewReadinessDocPath,
    goNogoDecisionLedgerTemplateDocPath,
    'scripts/validate-launch-decision-response-readiness.cjs',
    'No deployment is performed or approved by Phase 5R-A/B',
  ]) {
    assertIncludes(docs, required, 'Phase 5R status roll-forward docs');
  }
}

function assertLaunchDecisionResponseReadinessDocs() {
  assertTracked(
    [launchDecisionResponseReadinessDocPath, releaseClosurePacketTemplateDocPath],
    'Phase 5R launch decision response readiness docs'
  );
  const response = normalizeWhitespace(readRepoFile(launchDecisionResponseReadinessDocPath));
  const packet = normalizeWhitespace(readRepoFile(releaseClosurePacketTemplateDocPath));
  for (const required of [
    'repo-local, template-only, non-live',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'does not send any launch decision response, record go/no-go decisions, approve launch, publish announcements, publish preview, launch production, perform deployment, capture production evidence, capture preview evidence, record owner approval, record owner sign-off, record response-sent evidence, or grant deployment permission',
    'Go/no-go decision ledger reference',
    'Smoke evidence review reference',
    'Owner sign-off reference',
    'Launch decision summary placeholder',
    'Go response placeholder',
    'No-go response placeholder',
    'Blocked launch continuation placeholder',
    'Follow-up owner questions placeholder',
    'Public change summary placeholder',
    'Final response status',
    'Not prepared',
    'Decision not recorded',
    'Evidence review incomplete',
    'Owner sign-off missing',
    'Needs owner clarification',
    'Needs provider clarification',
    'Draft response only',
    'Blocked: launch clearance missing',
    'Blocked: deployment approval missing',
    'Ready for future approved response',
    'A response template is not a sent response',
    'A launch decision summary is not launch approval',
    'A go response placeholder is not go approval',
    'A no-go response placeholder is not a recorded no-go decision',
    'Passing validators is not launch clearance',
    'A merged PR is not release closure',
  ]) {
    assertIncludes(response, required, 'Phase 5R launch decision response readiness doc');
  }
  for (const required of [
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Packet ID: [NOT ASSIGNED]',
    'Packet type: [NOT SELECTED]',
    'Decision source: [NOT SUPPLIED]',
    'Response recipient/status: [NOT SENT]',
    'Launch status: [NOT APPROVED]',
    'Public route impact: [NOT IDENTIFIED]',
    'Admin workflow impact: [NOT IDENTIFIED]',
    'Owner follow-up required: [OWNER INPUT REQUIRED]',
    'Provider/runtime follow-up required: [PROVIDER DECISION REQUIRED]',
    'Closure status: [NOT CLOSED]',
    'Evidence status: [NOT EVIDENCE / NOT RECORDED]',
    'Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Go response draft',
    'No-go response draft',
    'Blocked launch continuation',
    'Owner follow-up questions',
    'Provider/runtime follow-up',
    'Public route change summary',
    'Protected admin change summary',
    'Smoke/evidence review dependency',
    'Final closure / continuation status',
    'not release closure, not launch approval, not go/no-go approval, not owner approval, not response-sent evidence, not smoke evidence, not preview evidence, not production evidence, and not deployment approval',
  ]) {
    assertIncludes(packet, required, 'Phase 5R release closure packet template doc');
  }
  assertNoMatch(
    `${response}\n${packet}`,
    /owner approved|owner sign-?off complete|accepted by owner|rejected by owner|owner decision recorded|owner approval recorded|owner feedback recorded|owner re-review recorded|owner corrections completed|owner response sent|launch response sent|preview evidence captured|production evidence captured|smoke evidence captured|rollback evidence captured|route-walkthrough evidence captured|correction-completed evidence captured|response-sent evidence captured|public launch evidence captured|sign-off evidence captured|deployment approval granted|launch approval granted|launch clearance granted|provider setup completed|secrets created|deployment performed|preview published|production launched|actual deployment|smoke run completed|route walkthrough completed|evidence review completed|release closure completed/i,
    'Phase 5R docs'
  );
}

function assertLaunchDecisionResponsePackageScript() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts?.['validate:launch-decision-response-readiness'] === 'node scripts/validate-launch-decision-response-readiness.cjs',
    'package.json must register validate:launch-decision-response-readiness'
  );
}

function assertLaunchDecisionResponseSources() {
  const adminSource = readTrackedProductionSources(['website/app/admin/protected-admin-shell.tsx']);
  const adminPage = readRepoFile('website/app/admin/page.tsx');
  const publicSource = readTrackedProductionSources(publicSourceRoots);

  for (const required of [
    /Phase 5R-A\/B admin-only launch decision response readiness/i,
    /Launch decision response readiness helper/i,
    /LOCAL-LAUNCH-DECISION-RESPONSE-READINESS\.md/i,
    /LOCAL-RELEASE-CLOSURE-PACKET-TEMPLATE\.md/i,
    /LOCAL-SMOKE-EVIDENCE-REVIEW-READINESS\.md/i,
    /LOCAL-GO-NOGO-DECISION-LEDGER-TEMPLATE\.md/i,
    /Safe future response sections/i,
    /Release closure \/ continuation packet placeholders/i,
    /Allowed future response statuses/i,
    /No-response\/no-launch boundaries/i,
    /No launch decision response is sent here/i,
    /No go\/no-go decision is recorded here/i,
    /No launch clearance is granted here/i,
    /No release closure is claimed here/i,
    /No response-sent evidence is captured here/i,
    /No preview evidence is captured here/i,
    /No production evidence is captured here/i,
    /No\s+deployment\s+is\s+performed\s+here/i,
    /No\s+deployment\s+approval\s+is\s+granted\s+here/i,
    /\[NOT EVIDENCE \/ NOT RECORDED\]/i,
    /\[DEPLOYMENT APPROVAL: NOT GRANTED\]/i,
  ]) {
    assert(required.test(adminSource), `Phase 5R admin source missing safe wording: ${required}`);
  }

  assertIncludes(adminPage, 'view={{ kind: "home" }}', 'admin page home view');
  assert(
    /function AdminOperationsHome[\s\S]*<OwnerReadinessHelpersPanel \/>/.test(adminSource),
    'Phase 5R admin source must render owner readiness helpers from the real AdminOperationsHome path'
  );
  assert(
    /function OwnerReadinessHelpersPanel[\s\S]*<OwnerReviewWalkthroughReadinessHelper \/>[\s\S]*<OwnerFeedbackIntakeReadinessHelper \/>[\s\S]*<OwnerCorrectionWorkflowReadinessHelper \/>[\s\S]*<OwnerReReviewRequestReadinessHelper \/>[\s\S]*<OwnerDecisionIntakeReadinessHelper \/>[\s\S]*<DeploymentApprovalRequestReadinessHelper \/>[\s\S]*<DeploymentExecutionRunbookReadinessHelper \/>[\s\S]*<SmokeEvidenceIntakeReadinessHelper \/>[\s\S]*<SmokeEvidenceReviewReadinessHelper \/>[\s\S]*<LaunchDecisionResponseReadinessHelper \/>/.test(adminSource),
    'Phase 5R admin source must keep the complete owner readiness helper chain in the shared panel'
  );

  assertNoMatch(
    publicSource,
    /launch decision response|release closure packet|smoke evidence review|go\/no-go decision ledger|smoke evidence intake|route verification ledger|rollback observation|deployment execution runbook|provider\/environment decision matrix|provider env decision matrix|deployment approval request|provider setup internals|environment\/secrets internals|admin route internals|owner handoff internals|release-control internals|admin urls?|internal notes|public admin status|\/admin\//i,
    'Phase 5R public source'
  );
  assert(/\b(?:listing|listings)\b/i.test(publicSource), 'public source must retain listing wording');
  assert(/\b(?:rental|rentals)\b/i.test(publicSource), 'public source must retain rental wording');
  assert(/\b(?:quote|enquiry|request)\b/i.test(publicSource), 'public source must retain quote/enquiry/request wording');
  assertNoMatch(publicSource, /\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i, 'Phase 5R public source');
  assertNoMatch(publicSource, /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'Phase 5R public source');
  assertNoMatch(publicSource, /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i, 'Phase 5R public source');
  assertNoMatch(publicSource, /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging|public status view/i, 'Phase 5R public source');
  assertNoMatch(
    adminSource,
    /public upload|customer upload|new provider setup|new storage provider|NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE_KEY|service-role browser|Pinecone|\bRAG\b|n8n runtime|\/api\/chat.*retrieval|outbound messaging|email sending|sms sending|whatsapp sending|process\.env\.(?:NEXT_PUBLIC_|SUPABASE|N8N|PINECONE|VERCEL)/i,
    'Phase 5R admin source'
  );
}


function assertPhase5sStatusRollForward() {
  const docs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    `Current phase: ${currentPhase5s}`,
    `Latest completed capability: ${currentPhase5r}`,
    'Last merged capability PR: #173',
    `Last merged capability merge commit: ${phase173MergeCommit}`,
    postLaunchObservationReadinessDocPath,
    incidentFollowupLedgerTemplateDocPath,
    launchDecisionResponseReadinessDocPath,
    releaseClosurePacketTemplateDocPath,
    'scripts/validate-post-launch-observation-readiness.cjs',
    'No deployment is performed or approved by Phase 5S-A/B',
  ]) {
    assertIncludes(docs, required, 'Phase 5S status roll-forward docs');
  }
}

function assertPostLaunchObservationReadinessDocs() {
  assertTracked(
    [postLaunchObservationReadinessDocPath, incidentFollowupLedgerTemplateDocPath],
    'Phase 5S post-launch observation readiness docs'
  );
  const observation = normalizeWhitespace(readRepoFile(postLaunchObservationReadinessDocPath));
  const ledger = normalizeWhitespace(readRepoFile(incidentFollowupLedgerTemplateDocPath));
  for (const required of [
    'repo-local, template-only, non-live, and not evidence',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'does not monitor live traffic, collect analytics, configure alerts, record incidents, send support responses, capture post-launch evidence, capture production evidence, capture preview evidence, execute rollback, perform deployment, record owner approval, record release closure, or grant deployment permission',
    'Release closure packet reference',
    'Launch decision response reference',
    'Post-launch observation window placeholder',
    'Public route observation placeholder',
    'Protected admin route observation placeholder',
    'Quote/enquiry workflow observation placeholder',
    'Listing/category/media observation placeholder',
    'Incident/follow-up ledger reference',
    'Rollback escalation placeholder',
    'Final observation status',
    'Not started',
    'Launch not approved',
    'Release closure missing',
    'Observation window not opened',
    'Monitoring not configured',
    'Incident not recorded',
    'Needs owner clarification',
    'Needs provider clarification',
    'Blocked: production launch missing',
    'Ready for future approved observation',
    'An observation template is not monitoring',
    'An incident placeholder is not an incident record',
    'A follow-up placeholder is not a sent response',
    'A rollback escalation placeholder is not rollback execution',
    'Passing validators is not production health',
    'A merged PR is not post-launch readiness',
  ]) {
    assertIncludes(observation, required, 'Phase 5S post-launch observation readiness doc');
  }
  for (const required of [
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Incident ID: [NOT ASSIGNED]',
    'Incident area: [NOT SELECTED]',
    'Observation source: [NOT SUPPLIED]',
    'Route/surface affected: [NOT SELECTED]',
    'User/customer impact: [NOT CAPTURED]',
    'Owner input status: [OWNER INPUT REQUIRED]',
    'Provider/runtime status: [PROVIDER DECISION REQUIRED]',
    'Follow-up status: [NOT SENT]',
    'Rollback/escalation status: [NOT RUN]',
    'Resolution status: [NOT STARTED]',
    'Evidence status: [NOT EVIDENCE / NOT RECORDED]',
    'Deployment status: [DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Public route observation',
    'Protected admin observation',
    'Quote/enquiry workflow observation',
    'Listing/category/media observation',
    'Provider/runtime follow-up',
    'Environment/secrets follow-up',
    'Owner clarification follow-up',
    'Rollback/escalation review',
    'Final post-launch continuation status',
    'not an incident record, not support evidence, not response-sent evidence, not monitoring evidence, not analytics evidence, not rollback evidence, not production evidence, not release closure, and not deployment approval',
  ]) {
    assertIncludes(ledger, required, 'Phase 5S incident/follow-up ledger template doc');
  }
  assertNoMatch(
    `${observation}\n${ledger}`,
    /owner approved|owner sign-?off complete|accepted by owner|rejected by owner|owner decision recorded|owner approval recorded|owner feedback recorded|owner re-review recorded|owner corrections completed|owner response sent|launch response sent|support response sent|customer follow-up sent|preview evidence captured|production evidence captured|smoke evidence captured|rollback evidence captured|route-walkthrough evidence captured|correction-completed evidence captured|response-sent evidence captured|monitoring evidence captured|analytics evidence captured|public launch evidence captured|sign-off evidence captured|deployment approval granted|launch approval granted|launch clearance granted|provider setup completed|secrets created|deployment performed|preview published|production launched|actual deployment|smoke run completed|route walkthrough completed|evidence review completed|release closure completed|incident response sent|live monitoring configured|analytics captured/i,
    'Phase 5S docs'
  );
}

function assertPostLaunchObservationPackageScript() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts?.['validate:post-launch-observation-readiness'] === 'node scripts/validate-post-launch-observation-readiness.cjs',
    'package.json must register validate:post-launch-observation-readiness'
  );
}

function assertPostLaunchObservationSources() {
  const adminSource = readTrackedProductionSources(['website/app/admin/protected-admin-shell.tsx']);
  const adminPage = readRepoFile('website/app/admin/page.tsx');
  const publicSource = readTrackedProductionSources(publicSourceRoots);

  for (const required of [
    /Phase 5S-A\/B admin-only post-launch observation readiness/i,
    /Post-launch observation readiness helper/i,
    /LOCAL-POST-LAUNCH-OBSERVATION-READINESS\.md/i,
    /LOCAL-INCIDENT-FOLLOWUP-LEDGER-TEMPLATE\.md/i,
    /LOCAL-LAUNCH-DECISION-RESPONSE-READINESS\.md/i,
    /LOCAL-RELEASE-CLOSURE-PACKET-TEMPLATE\.md/i,
    /Safe future observation sections/i,
    /Incident\/follow-up ledger placeholders/i,
    /Allowed future observation statuses/i,
    /No-monitoring\/no-incident boundaries/i,
    /No live monitoring is configured here/i,
    /No\s+incident\s+is\s+recorded\s+here/i,
    /No\s+support\s+response\s+is\s+sent\s+here/i,
    /No\s+customer\s+follow-up\s+is\s+sent\s+here/i,
    /No post-launch evidence is captured here/i,
    /No\s+monitoring\s+evidence\s+is\s+captured\s+here/i,
    /No\s+analytics\s+evidence\s+is\s+captured\s+here/i,
    /No\s+rollback\s+is\s+executed\s+here/i,
    /No\s+deployment\s+is\s+performed\s+here/i,
    /No\s+deployment\s+approval\s+is\s+granted\s+here/i,
    /\[NOT EVIDENCE \/ NOT RECORDED\]/i,
    /\[DEPLOYMENT APPROVAL: NOT GRANTED\]/i,
  ]) {
    assert(required.test(adminSource), `Phase 5S admin source missing safe wording: ${required}`);
  }

  assertIncludes(adminPage, 'view={{ kind: "home" }}', 'admin page home view');
  assert(
    /function AdminOperationsHome[\s\S]*<OwnerReadinessHelpersPanel \/>/.test(adminSource),
    'Phase 5S admin source must render owner readiness helpers from the real AdminOperationsHome path'
  );
  assert(
    /function OwnerReadinessHelpersPanel[\s\S]*<OwnerReviewWalkthroughReadinessHelper \/>[\s\S]*<OwnerFeedbackIntakeReadinessHelper \/>[\s\S]*<OwnerCorrectionWorkflowReadinessHelper \/>[\s\S]*<OwnerReReviewRequestReadinessHelper \/>[\s\S]*<OwnerDecisionIntakeReadinessHelper \/>[\s\S]*<DeploymentApprovalRequestReadinessHelper \/>[\s\S]*<DeploymentExecutionRunbookReadinessHelper \/>[\s\S]*<SmokeEvidenceIntakeReadinessHelper \/>[\s\S]*<SmokeEvidenceReviewReadinessHelper \/>[\s\S]*<LaunchDecisionResponseReadinessHelper \/>[\s\S]*<PostLaunchObservationReadinessHelper \/>/.test(adminSource),
    'Phase 5S admin source must keep the complete owner readiness helper chain in the shared panel'
  );

  assertNoMatch(
    publicSource,
    /post-launch observation|incident\/follow-up ledger|launch decision response|release closure packet|smoke evidence review|go\/no-go decision ledger|smoke evidence intake|route verification ledger|rollback observation|deployment execution runbook|provider\/environment decision matrix|provider env decision matrix|deployment approval request|provider setup internals|environment\/secrets internals|monitoring\/analytics internals|admin route internals|owner handoff internals|release-control internals|admin urls?|internal notes|public admin status|\/admin\//i,
    'Phase 5S public source'
  );
  assert(/\b(?:listing|listings)\b/i.test(publicSource), 'public source must retain listing wording');
  assert(/\b(?:rental|rentals)\b/i.test(publicSource), 'public source must retain rental wording');
  assert(/\b(?:quote|enquiry|request)\b/i.test(publicSource), 'public source must retain quote/enquiry/request wording');
  assertNoMatch(publicSource, /\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i, 'Phase 5S public source');
  assertNoMatch(publicSource, /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'Phase 5S public source');
  assertNoMatch(publicSource, /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i, 'Phase 5S public source');
  assertNoMatch(publicSource, /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging|public status view/i, 'Phase 5S public source');
  assertNoMatch(
    adminSource,
    /public upload|customer upload|new provider setup|new storage provider|monitoring provider setup|analytics provider setup|alerting provider setup|NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE_KEY|service-role browser|Pinecone|\bRAG\b|n8n runtime|\/api\/chat.*retrieval|outbound messaging|email sending|sms sending|whatsapp sending|process\.env\.(?:NEXT_PUBLIC_|SUPABASE|N8N|PINECONE|VERCEL)/i,
    'Phase 5S admin source'
  );
}



function assertPhase5uStatusRollForward() {
  const docs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    `Current phase: ${currentPhase5u}`,
    `Latest completed capability: ${currentPhase5t}`,
    'Last merged capability PR: #175',
    `Last merged capability merge commit: ${phase175MergeCommit}`,
    remediationVerificationReadinessDocPath,
    correctionRetestResolutionLedgerTemplateDocPath,
    postLaunchRemediationReadinessDocPath,
    incidentTriageCorrectionBacklogTemplateDocPath,
    'scripts/validate-remediation-verification-readiness.cjs',
    'No deployment is performed or approved by Phase 5U-A/B',
  ]) {
    assertIncludes(docs, required, 'Phase 5U status roll-forward docs');
  }
}

function assertRemediationVerificationReadinessDocs() {
  assertTracked(
    [remediationVerificationReadinessDocPath, correctionRetestResolutionLedgerTemplateDocPath],
    'Phase 5U remediation verification readiness docs'
  );
  const readiness = normalizeWhitespace(readRepoFile(remediationVerificationReadinessDocPath));
  const ledger = normalizeWhitespace(readRepoFile(correctionRetestResolutionLedgerTemplateDocPath));
  for (const required of [
    'repo-local, template-only, non-live, and not evidence',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'does not apply hotfixes, change production, change public runtime behavior, run retests, verify corrections, resolve incidents, perform remediation, complete corrections, send support responses, contact customers, configure providers, capture retest evidence, capture resolution evidence, capture remediation evidence, capture production evidence, execute rollback, perform deployment, record owner approval, record release closure, or grant deployment permission',
    'Incident triage correction backlog reference',
    'Post-launch remediation readiness reference',
    'Proposed correction source placeholder',
    'Retest route/surface placeholder',
    'Reproduction comparison placeholder',
    'Owner verification placeholder',
    'Provider/runtime verification placeholder',
    'Correction retest ledger reference',
    'Rollback/escalation verification placeholder',
    'Final resolution-readiness status',
    'Not started',
    'Correction not implemented',
    'Retest not run',
    'Needs owner verification',
    'Needs provider verification',
    'Needs reproduction comparison',
    'Needs correction retest',
    'Blocked: no live approval',
    'Blocked: deployment approval missing',
    'Ready for future approved verification',
    'A verification template is not a retest',
    'A retest placeholder is not retest evidence',
    'A correction verification row is not a completed correction',
    'A resolution placeholder is not incident resolution',
    'Passing validators is not remediation success',
    'A merged PR is not live issue resolution',
  ]) {
    assertIncludes(readiness, required, 'Phase 5U remediation verification readiness doc');
  }
  for (const required of [
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Retest ID: `[NOT ASSIGNED]`',
    'Retest area: `[NOT SELECTED]`',
    'Source triage item: `[NOT SUPPLIED]`',
    'Route/surface affected: `[NOT SELECTED]`',
    'Proposed correction: `[NOT CAPTURED]`',
    'Retest status: `[NOT RUN]`',
    'Expected result: `[NOT FILLED]`',
    'Actual result: `[NOT RUN]`',
    'Owner verification status: `[OWNER INPUT REQUIRED]`',
    'Provider/runtime status: `[PROVIDER DECISION REQUIRED]`',
    'Resolution status: `[NOT RESOLVED]`',
    'Release/correction status: `[NOT SCHEDULED]`',
    'Evidence status: `[NOT EVIDENCE / NOT RECORDED]`',
    'Deployment status: `[DEPLOYMENT APPROVAL: NOT GRANTED]`',
    'Public route retest',
    'Protected admin retest',
    'Quote/enquiry workflow retest',
    'Listing/category/media retest',
    'Provider/runtime verification',
    'Environment/secrets verification',
    'Owner verification',
    'Rollback/escalation verification',
    'Future resolution planning',
    'not retest evidence, not incident resolution, not support evidence, not response-sent evidence, not monitoring evidence, not analytics evidence, not remediation evidence, not correction completion, not hotfix approval, not rollback evidence, not production evidence, not release closure, and not deployment approval',
  ]) {
    assertIncludes(ledger, required, 'Phase 5U correction retest resolution ledger template doc');
  }
  assertNoMatch(
    `${readiness}\n${ledger}`,
    /owner approved|owner sign-?off complete|accepted by owner|rejected by owner|owner decision recorded|owner approval recorded|owner feedback recorded|owner re-review recorded|owner corrections completed|owner response sent|launch response sent|support response sent|customer follow-up sent|preview evidence captured|production evidence captured|smoke evidence captured|rollback evidence captured|route-walkthrough evidence captured|correction-completed evidence captured|response-sent evidence captured|monitoring evidence captured|analytics evidence captured|remediation evidence captured|hotfix evidence captured|retest evidence captured|resolution evidence captured|public launch evidence captured|sign-off evidence captured|deployment approval granted|launch approval granted|launch clearance granted|provider setup completed|secrets created|deployment performed|preview published|production launched|actual deployment|live hotfix applied|remediation performed|correction completed|retest run completed|incident resolved|smoke run completed|route walkthrough completed|route verification completed|evidence review completed|release closure completed|incident response sent|incident record completed|live monitoring configured|analytics captured/i,
    'Phase 5U docs'
  );
}

function assertRemediationVerificationPackageScript() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts?.['validate:remediation-verification-readiness'] === 'node scripts/validate-remediation-verification-readiness.cjs',
    'package.json must register validate:remediation-verification-readiness'
  );
}

function assertRemediationVerificationSources() {
  const adminSource = readTrackedProductionSources(['website/app/admin/protected-admin-shell.tsx']);
  const adminPage = readRepoFile('website/app/admin/page.tsx');
  const publicSource = readTrackedProductionSources(publicSourceRoots);

  for (const required of [
    /Phase 5U-A\/B admin-only remediation verification readiness/i,
    /Remediation verification readiness helper/i,
    /LOCAL-REMEDIATION-VERIFICATION-READINESS\.md/i,
    /LOCAL-CORRECTION-RETEST-RESOLUTION-LEDGER-TEMPLATE\.md/i,
    /LOCAL-POST-LAUNCH-REMEDIATION-READINESS\.md/i,
    /LOCAL-INCIDENT-TRIAGE-CORRECTION-BACKLOG-TEMPLATE\.md/i,
    /Safe future verification sections/i,
    /Correction retest\/resolution ledger placeholders/i,
    /Allowed future verification statuses/i,
    /No-retest\/no-resolution boundaries/i,
    /No\s+correction\s+retest\s+is\s+run\s+here/i,
    /No\s+incident\s+resolution\s+is\s+recorded\s+here/i,
    /No\s+correction\s+completion\s+is\s+claimed\s+here/i,
    /No\s+live\s+hotfix\s+is\s+applied\s+here/i,
    /No\s+production\s+change\s+is\s+made\s+here/i,
    /No\s+remediation\s+is\s+performed\s+here/i,
    /No\s+support\s+response\s+is\s+sent\s+here/i,
    /No\s+customer\s+follow-up\s+is\s+sent\s+here/i,
    /No\s+retest\s+evidence\s+is\s+captured\s+here/i,
    /No\s+resolution\s+evidence\s+is\s+captured\s+here/i,
    /No\s+remediation\s+evidence\s+is\s+captured\s+here/i,
    /No\s+rollback\s+is\s+executed\s+here/i,
    /No\s+deployment\s+is\s+performed\s+here/i,
    /No\s+deployment\s+approval\s+is\s+granted\s+here/i,
    /\[NOT EVIDENCE \/ NOT RECORDED\]/i,
    /\[DEPLOYMENT APPROVAL: NOT GRANTED\]/i,
  ]) {
    assert(required.test(adminSource), `Phase 5U admin source missing safe wording: ${required}`);
  }

  assertIncludes(adminPage, 'view={{ kind: "home" }}', 'admin page home view');
  assert(
    /function AdminOperationsHome[\s\S]*<OwnerReadinessHelpersPanel \/>/.test(adminSource),
    'Phase 5U admin source must render owner readiness helpers from the real AdminOperationsHome path'
  );
  assert(
    /function OwnerReadinessHelpersPanel[\s\S]*<OwnerReviewWalkthroughReadinessHelper \/>[\s\S]*<OwnerFeedbackIntakeReadinessHelper \/>[\s\S]*<OwnerCorrectionWorkflowReadinessHelper \/>[\s\S]*<OwnerReReviewRequestReadinessHelper \/>[\s\S]*<OwnerDecisionIntakeReadinessHelper \/>[\s\S]*<DeploymentApprovalRequestReadinessHelper \/>[\s\S]*<DeploymentExecutionRunbookReadinessHelper \/>[\s\S]*<SmokeEvidenceIntakeReadinessHelper \/>[\s\S]*<SmokeEvidenceReviewReadinessHelper \/>[\s\S]*<LaunchDecisionResponseReadinessHelper \/>[\s\S]*<PostLaunchObservationReadinessHelper \/>[\s\S]*<PostLaunchRemediationReadinessHelper \/>[\s\S]*<RemediationVerificationReadinessHelper \/>/.test(adminSource),
    'Phase 5U admin source must keep the complete owner readiness helper chain in the shared panel'
  );

  assertNoMatch(
    publicSource,
    /remediation verification|correction retest|resolution ledger|post-launch remediation|incident triage correction backlog|post-launch observation|incident\/follow-up ledger|monitoring\/analytics internals|hotfix internals|retest internals|resolution internals|provider setup internals|environment\/secrets internals|admin route internals|owner handoff internals|release-control internals|admin urls?|internal notes|public admin status|\/admin\//i,
    'Phase 5U public source'
  );
  assert(/\b(?:listing|listings)\b/i.test(publicSource), 'public source must retain listing wording');
  assert(/\b(?:rental|rentals)\b/i.test(publicSource), 'public source must retain rental wording');
  assert(/\b(?:quote|enquiry|request)\b/i.test(publicSource), 'public source must retain quote/enquiry/request wording');
  assertNoMatch(publicSource, /\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i, 'Phase 5U public source');
  assertNoMatch(publicSource, /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'Phase 5U public source');
  assertNoMatch(publicSource, /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i, 'Phase 5U public source');
  assertNoMatch(publicSource, /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging|public status view/i, 'Phase 5U public source');
  assertNoMatch(
    adminSource,
    /public upload|customer upload|new provider setup|new storage provider|storage provider changes|monitoring provider setup|analytics provider setup|alerting provider setup|NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE_KEY|service-role browser|Pinecone|\bRAG\b|n8n runtime|\/api\/chat.*retrieval|outbound messaging|email sending|sms sending|whatsapp sending|process\.env\.(?:NEXT_PUBLIC_|SUPABASE|N8N|PINECONE|VERCEL)/i,
    'Phase 5U admin source'
  );
}

function assertReleaseSuiteHasRemediationVerificationReadiness() {
  const suite = readRepoFile('scripts/validate-release-candidate-suite.cjs');
  assertIncludes(suite, "args: ['run', 'validate:remediation-verification-readiness']", 'release-candidate suite');
  assertIncludes(suite, "args: ['run', 'validate:post-launch-remediation-readiness']", 'release-candidate suite');
  assertNoMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');
}

function assertPhase5vIncidentResolutionResponseReadiness() {
  assertPhase5uRemediationVerificationReadiness();
  assertTracked(
    [incidentResolutionResponseReadinessDocPath, postRemediationClosureLessonsLedgerTemplateDocPath],
    'Phase 5V incident resolution response readiness docs'
  );

  const readiness = normalizeWhitespace(readRepoFile(incidentResolutionResponseReadinessDocPath));
  const ledger = normalizeWhitespace(readRepoFile(postRemediationClosureLessonsLedgerTemplateDocPath));
  const docs = `${readiness}\n${ledger}`;

  for (const required of [
    'repo-local, template-only, non-live incident resolution response readiness package is not evidence',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'does not send support responses, send customer follow-ups, close incidents, record incident resolution, publish public notices, publish changelogs, perform remediation, verify corrections, run retests, apply hotfixes, change production, change public runtime behavior, configure providers, capture resolution evidence, capture response-sent evidence, capture closure evidence, capture production evidence, execute rollback, perform deployment, record owner approval, record release closure, or grant deployment permission',
    'Remediation verification readiness reference',
    'Correction retest / resolution ledger reference',
    'Source triage item placeholder',
    'Verified correction summary placeholder',
    'Owner confirmation placeholder',
    'Provider/runtime confirmation placeholder',
    'Support response draft placeholder',
    'Customer follow-up draft placeholder',
    'Public notice decision placeholder',
    'Final resolution-response status',
    'Not started',
    'Verification not completed',
    'Retest not run',
    'Resolution not recorded',
    'Needs owner confirmation',
    'Needs provider confirmation',
    'Draft response only',
    'Blocked: no support approval',
    'Blocked: deployment approval missing',
    'Ready for future approved response',
    'A response template is not a sent response',
    'A support draft is not support evidence',
    'A customer follow-up placeholder is not customer contact',
    'A resolution summary is not incident resolution',
    'Passing validators is not verified remediation',
    'A merged PR is not issue closure',
    'Closure ID: `[NOT ASSIGNED]`',
    'Closure area: `[NOT SELECTED]`',
    'Source retest item: `[NOT SUPPLIED]`',
    'Route/surface affected: `[NOT SELECTED]`',
    'Resolution summary: `[NOT CAPTURED]`',
    'Support response status: `[NOT SENT]`',
    'Customer follow-up status: `[NOT SENT]`',
    'Public notice status: `[NOT APPROVED]`',
    'Owner confirmation status: `[OWNER INPUT REQUIRED]`',
    'Provider/runtime status: `[PROVIDER DECISION REQUIRED]`',
    'Lessons learned: `[NOT CAPTURED]`',
    'Maintenance follow-up status: `[NOT SCHEDULED]`',
    'Public route closure review',
    'Protected admin closure review',
    'Quote/enquiry workflow closure review',
    'Listing/category/media closure review',
    'Provider/runtime confirmation',
    'Environment/secrets confirmation',
    'Support/customer response draft',
    'Future maintenance planning',
    'not incident closure, not issue resolution, not support evidence, not response-sent evidence, not customer-contact evidence, not monitoring evidence, not analytics evidence, not remediation evidence, not correction completion, not hotfix approval, not rollback evidence, not production evidence, not release closure, not maintenance completion, and not deployment approval'
  ]) {
    assertIncludes(docs, required, 'Phase 5V docs');
  }

  const statusDocs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    `Current phase: ${currentPhase5v}`,
    `Latest completed capability: ${currentPhase5u}`,
    'Last merged capability PR: #176',
    `Last merged capability merge commit: ${phase176MergeCommit}`,
    incidentResolutionResponseReadinessDocPath,
    postRemediationClosureLessonsLedgerTemplateDocPath,
  preventiveMaintenanceReadinessDocPath,
  lessonsToMaintenanceBacklogTemplateDocPath,
  maintenanceApprovalReadinessDocPath,
  maintenanceChangeWindowPlanningLedgerTemplateDocPath,
    'scripts/validate-incident-resolution-response-readiness.cjs',
    'No deployment is performed or approved by Phase 5V-A/B'
  ]) {
    assertIncludes(statusDocs, required, 'Phase 5V status roll-forward docs');
  }

  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts?.['validate:incident-resolution-response-readiness'] === 'node scripts/validate-incident-resolution-response-readiness.cjs',
    'package.json must register validate:incident-resolution-response-readiness'
  );

  const adminSource = readRepoFile('website/app/admin/protected-admin-shell.tsx');
  for (const required of [
    /Phase 5V-A\/B admin-only incident resolution response readiness/i,
    /IncidentResolutionResponseReadinessHelper/i,
    /LOCAL-INCIDENT-RESOLUTION-RESPONSE-READINESS\.md/i,
    /LOCAL-POST-REMEDIATION-CLOSURE-LESSONS-LEDGER-TEMPLATE\.md/i,
    /LOCAL-REMEDIATION-VERIFICATION-READINESS\.md/i,
    /LOCAL-CORRECTION-RETEST-RESOLUTION-LEDGER-TEMPLATE\.md/i,
    /No support\s+response is sent here/i,
    /No customer follow-up is sent here/i,
    /No incident\s+is closed here/i,
    /No incident resolution is recorded here/i,
    /No public\s+notice is published here/i,
    /No maintenance\s+task is completed here/i,
    /No response-sent evidence is captured here/i,
    /No closure evidence is\s+captured here/i,
    /No resolution evidence is captured here/i,
    /No remediation\s+evidence is captured here/i,
    /No rollback is executed here/i,
    /No deployment is performed here/i,
    /No deployment approval is granted here/i
  ]) {
    assert(required.test(adminSource), `Phase 5V admin source missing safe wording: ${required}`);
  }

  assertIncludes(readRepoFile('website/app/admin/page.tsx'), 'view={{ kind: "home" }}', 'admin home page');
  assert(/function AdminOperationsHome[\s\S]*<OwnerReadinessHelpersPanel \/>/.test(adminSource), 'AdminOperationsHome must render shared owner readiness helper panel');
  assert(/function OwnerReadinessHelpersPanel[\s\S]*<OwnerReviewWalkthroughReadinessHelper \/>[\s\S]*<OwnerFeedbackIntakeReadinessHelper \/>[\s\S]*<OwnerCorrectionWorkflowReadinessHelper \/>[\s\S]*<OwnerReReviewRequestReadinessHelper \/>[\s\S]*<OwnerDecisionIntakeReadinessHelper \/>[\s\S]*<DeploymentApprovalRequestReadinessHelper \/>[\s\S]*<DeploymentExecutionRunbookReadinessHelper \/>[\s\S]*<SmokeEvidenceIntakeReadinessHelper \/>[\s\S]*<SmokeEvidenceReviewReadinessHelper \/>[\s\S]*<LaunchDecisionResponseReadinessHelper \/>[\s\S]*<PostLaunchObservationReadinessHelper \/>[\s\S]*<PostLaunchRemediationReadinessHelper \/>[\s\S]*<RemediationVerificationReadinessHelper \/>[\s\S]*<IncidentResolutionResponseReadinessHelper \/>/.test(adminSource), 'Phase 5V admin source must keep complete owner readiness helper chain in shared panel');

  const publicSource = readTrackedProductionSources(publicSourceRoots);
  assertNoMatch(publicSource, /incident resolution response|post-remediation closure|remediation verification|correction retest|resolution ledger|post-launch remediation|incident triage correction backlog|support response|customer follow-up|public notice|maintenance internals|monitoring\/analytics internals|hotfix internals|retest internals|resolution internals|provider setup internals|environment\/secrets internals|admin route internals|owner handoff internals|release-control internals|admin urls?|\/admin\//i, 'Phase 5V public source');
  assert(/listing|listings/i.test(publicSource), 'Phase 5V public source must retain listing wording');
  assert(/rental|rentals/i.test(publicSource), 'Phase 5V public source must retain rental wording');
  assert(/quote|enquiry|request/i.test(publicSource), 'Phase 5V public source must retain quote/enquiry/request wording');
  assertNoMatch(publicSource, /\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i, 'Phase 5V public source');
  assertNoMatch(publicSource, /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'Phase 5V public source');
  assertNoMatch(publicSource, /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i, 'Phase 5V public source');
  assertNoMatch(publicSource, /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging|public status view/i, 'Phase 5V public source');
  assertNoMatch(adminSource, /public upload|customer upload|storage provider|monitoring provider setup|analytics provider setup|alerting provider setup|process\.env|NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE|Pinecone|\bRAG\b|n8n runtime|\/api\/chat|outbound messaging/i, 'Phase 5V admin source');
  assertNoMatch(docs, /actual deployment|support response sent|customer follow-up sent|incident closed|incident resolved|public notice published|maintenance completed|live hotfix|remediation performed|correction completed|retest run completed|live monitoring configured|analytics captured|route verification completed|route walkthrough completed|preview publication completed|production launch completed|provider setup completed|env\/secrets setup completed|owner approved|owner sign-?off complete|launch clearance granted|production evidence captured|preview evidence captured|smoke evidence captured|rollback evidence captured|response-sent evidence captured|closure evidence captured|resolution evidence captured|maintenance evidence captured|correction-completed evidence captured|remediation evidence captured|hotfix evidence captured|retest evidence captured|monitoring evidence captured|analytics evidence captured|deployment approval granted/i, 'Phase 5V docs');

  const suite = readRepoFile('scripts/validate-release-candidate-suite.cjs');
  assertIncludes(suite, "args: ['run', 'validate:incident-resolution-response-readiness']", 'release-candidate suite');
  assertIncludes(suite, "args: ['run', 'validate:remediation-verification-readiness']", 'release-candidate suite');
  assertNoMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');
}


function assertPhase5wPreventiveMaintenanceReadiness() {
  assertPhase5vIncidentResolutionResponseReadiness();
  assertTracked(
    [preventiveMaintenanceReadinessDocPath, lessonsToMaintenanceBacklogTemplateDocPath],
    'Phase 5W preventive maintenance readiness docs'
  );

  const readiness = normalizeWhitespace(readRepoFile(preventiveMaintenanceReadinessDocPath));
  const backlog = normalizeWhitespace(readRepoFile(lessonsToMaintenanceBacklogTemplateDocPath));
  const docs = `${readiness}\n${backlog}`;

  for (const required of [
    'repo-local, template-only, non-live preventive maintenance readiness package is not evidence',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'does not implement maintenance tasks, schedule jobs, create cron, configure monitoring, configure analytics, configure alerts, change production, change public runtime behavior, close incidents, record issue resolution, send support responses, contact customers, publish public notices, perform remediation, verify corrections, run retests, apply hotfixes, capture maintenance evidence, capture monitoring evidence, capture analytics evidence, capture production evidence, execute rollback, perform deployment, record owner approval, record release closure, or grant deployment permission',
    'Incident resolution response readiness reference',
    'Post-remediation closure / lessons ledger reference',
    'Lesson source placeholder',
    'Maintenance candidate placeholder',
    'Affected route/surface placeholder',
    'Owner priority placeholder',
    'Provider/runtime dependency placeholder',
    'Lessons-to-maintenance backlog reference',
    'Future verification dependency placeholder',
    'Final maintenance-readiness status',
    'Not started',
    'Lesson not approved',
    'Maintenance candidate not captured',
    'Needs owner prioritisation',
    'Needs provider clarification',
    'Needs future correction planning',
    'Needs future verification planning',
    'Blocked: no maintenance approval',
    'Blocked: deployment approval missing',
    'Ready for future approved maintenance planning',
    'A maintenance template is not implemented maintenance',
    'A backlog placeholder is not scheduled work',
    'A lesson placeholder is not a real lesson learned',
    'A provider dependency placeholder is not provider setup',
    'Passing validators is not maintenance completion',
    'A merged PR is not preventive maintenance',
    'Maintenance ID: `[NOT ASSIGNED]`',
    'Maintenance area: `[NOT SELECTED]`',
    'Source closure item: `[NOT SUPPLIED]`',
    'Route/surface affected: `[NOT SELECTED]`',
    'Lesson summary: `[NOT CAPTURED]`',
    'Proposed maintenance item: `[NOT CAPTURED]`',
    'Owner priority status: `[OWNER INPUT REQUIRED]`',
    'Provider/runtime dependency: `[PROVIDER DECISION REQUIRED]`',
    'Schedule status: `[NOT SCHEDULED]`',
    'Implementation status: `[NOT STARTED]`',
    'Verification dependency: `[NOT CAPTURED]`',
    'Public route maintenance planning',
    'Protected admin maintenance planning',
    'Quote/enquiry workflow maintenance planning',
    'Listing/category/media maintenance planning',
    'Provider/runtime clarification',
    'Environment/secrets clarification',
    'Owner prioritisation',
    'Future verification planning',
    'Future maintenance backlog review',
    'not maintenance implementation, not scheduled work, not support evidence, not response-sent evidence, not customer-contact evidence, not monitoring evidence, not analytics evidence, not remediation evidence, not correction completion, not hotfix approval, not rollback evidence, not production evidence, not release closure, not maintenance completion, and not deployment approval'
  ]) {
    assertIncludes(docs, required, 'Phase 5W docs');
  }

  const statusDocs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    `Current phase: ${currentPhase5w}`,
    `Latest completed capability: ${currentPhase5v}`,
    'Last merged capability PR: #177',
    `Last merged capability merge commit: ${phase177MergeCommit}`,
    preventiveMaintenanceReadinessDocPath,
    lessonsToMaintenanceBacklogTemplateDocPath,
  maintenanceApprovalReadinessDocPath,
  maintenanceChangeWindowPlanningLedgerTemplateDocPath,
    incidentResolutionResponseReadinessDocPath,
    postRemediationClosureLessonsLedgerTemplateDocPath,
  preventiveMaintenanceReadinessDocPath,
  lessonsToMaintenanceBacklogTemplateDocPath,
  maintenanceApprovalReadinessDocPath,
  maintenanceChangeWindowPlanningLedgerTemplateDocPath,
    'scripts/validate-preventive-maintenance-readiness.cjs',
    'No deployment is performed or approved by Phase 5W-A/B'
  ]) {
    assertIncludes(statusDocs, required, 'Phase 5W status roll-forward docs');
  }

  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts?.['validate:preventive-maintenance-readiness'] === 'node scripts/validate-preventive-maintenance-readiness.cjs',
    'package.json must register validate:preventive-maintenance-readiness'
  );

  const adminSource = readRepoFile('website/app/admin/protected-admin-shell.tsx');
  for (const required of [
    /Phase 5W-A\/B admin-only preventive maintenance readiness/i,
    /PreventiveMaintenanceReadinessHelper/i,
    /LOCAL-PREVENTIVE-MAINTENANCE-READINESS\.md/i,
    /LOCAL-LESSONS-TO-MAINTENANCE-BACKLOG-TEMPLATE\.md/i,
    /LOCAL-INCIDENT-RESOLUTION-RESPONSE-READINESS\.md/i,
    /LOCAL-POST-REMEDIATION-CLOSURE-LESSONS-LEDGER-TEMPLATE\.md/i,
    /No maintenance task is implemented here/i,
    /No maintenance schedule is created here/i,
    /No cron or job scheduler is\s+added here/i,
    /No monitoring is configured here/i,
    /No analytics is configured\s+here/i,
    /No provider setup is performed here/i,
    /No support response is sent\s+here/i,
    /No customer follow-up is sent here/i,
    /No maintenance evidence is\s+captured here/i,
    /No monitoring evidence is captured here/i,
    /No analytics\s+evidence is captured here/i,
    /No production change is made here/i,
    /No rollback is executed here/i,
    /No deployment is performed here/i,
    /No deployment approval is granted here/i
  ]) {
    assert(required.test(adminSource), `Phase 5W admin source missing safe wording: ${required}`);
  }

  assertIncludes(readRepoFile('website/app/admin/page.tsx'), 'view={{ kind: "home" }}', 'admin home page');
  assert(/function AdminOperationsHome[\s\S]*<OwnerReadinessHelpersPanel \/>/.test(adminSource), 'AdminOperationsHome must render shared owner readiness helper panel');
  assert(/function OwnerReadinessHelpersPanel[\s\S]*<OwnerReviewWalkthroughReadinessHelper \/>[\s\S]*<OwnerFeedbackIntakeReadinessHelper \/>[\s\S]*<OwnerCorrectionWorkflowReadinessHelper \/>[\s\S]*<OwnerReReviewRequestReadinessHelper \/>[\s\S]*<OwnerDecisionIntakeReadinessHelper \/>[\s\S]*<DeploymentApprovalRequestReadinessHelper \/>[\s\S]*<DeploymentExecutionRunbookReadinessHelper \/>[\s\S]*<SmokeEvidenceIntakeReadinessHelper \/>[\s\S]*<SmokeEvidenceReviewReadinessHelper \/>[\s\S]*<LaunchDecisionResponseReadinessHelper \/>[\s\S]*<PostLaunchObservationReadinessHelper \/>[\s\S]*<PostLaunchRemediationReadinessHelper \/>[\s\S]*<RemediationVerificationReadinessHelper \/>[\s\S]*<IncidentResolutionResponseReadinessHelper \/>[\s\S]*<PreventiveMaintenanceReadinessHelper \/>/.test(adminSource), 'Phase 5W admin source must keep complete owner readiness helper chain in shared panel');

  const publicSource = readTrackedProductionSources(publicSourceRoots);
  assertNoMatch(publicSource, /preventive maintenance|lessons-to-maintenance|incident resolution response|post-remediation closure|support response|customer follow-up|public notice|maintenance internals|monitoring\/analytics internals|scheduler\/cron internals|provider setup internals|environment\/secrets internals|admin route internals|owner handoff internals|release-control internals|admin urls?|\/admin\//i, 'Phase 5W public source');
  assert(/listing|listings/i.test(publicSource), 'Phase 5W public source must retain listing wording');
  assert(/rental|rentals/i.test(publicSource), 'Phase 5W public source must retain rental wording');
  assert(/quote|enquiry|request/i.test(publicSource), 'Phase 5W public source must retain quote/enquiry/request wording');
  assertNoMatch(publicSource, /\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i, 'Phase 5W public source');
  assertNoMatch(publicSource, /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'Phase 5W public source');
  assertNoMatch(publicSource, /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i, 'Phase 5W public source');
  assertNoMatch(publicSource, /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging|public status view/i, 'Phase 5W public source');
  assertNoMatch(adminSource, /public upload|customer upload|storage provider|monitoring provider setup|analytics provider setup|alerting provider setup|scheduler setup|cron setup|process\.env|NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE|Pinecone|\bRAG\b|n8n runtime|\/api\/chat|outbound messaging/i, 'Phase 5W admin source');
  assertNoMatch(docs, /actual deployment|maintenance implemented|maintenance scheduled|cron configured|job configured|support response sent|customer follow-up sent|public notice published|maintenance completed|live hotfix|remediation performed|correction completed|retest run completed|live monitoring|analytics capture|route verification completed|route walkthrough completed|preview publication completed|production launch completed|provider setup completed|env\/secrets setup completed|owner approved|owner sign-?off complete|launch clearance granted|production evidence captured|preview evidence captured|smoke evidence captured|rollback evidence captured|response-sent evidence captured|closure evidence captured|resolution evidence captured|maintenance evidence captured|maintenance-schedule evidence captured|correction-completed evidence captured|remediation evidence captured|hotfix evidence captured|retest evidence captured|monitoring evidence captured|analytics evidence captured|deployment approval granted/i, 'Phase 5W docs');

  const suite = readRepoFile('scripts/validate-release-candidate-suite.cjs');
  assertIncludes(suite, "args: ['run', 'validate:preventive-maintenance-readiness']", 'release-candidate suite');
  assertIncludes(suite, "args: ['run', 'validate:incident-resolution-response-readiness']", 'release-candidate suite');
  assertNoMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');
  assertSuiteAndTests();
}


function assertPhase5xMaintenanceApprovalReadiness() {
  assertPhase5wPreventiveMaintenanceReadiness();
  assertTracked(
    [maintenanceApprovalReadinessDocPath, maintenanceChangeWindowPlanningLedgerTemplateDocPath],
    'Phase 5X maintenance approval readiness docs'
  );

  const readiness = normalizeWhitespace(readRepoFile(maintenanceApprovalReadinessDocPath));
  const ledger = normalizeWhitespace(readRepoFile(maintenanceChangeWindowPlanningLedgerTemplateDocPath));
  const docs = `${readiness}\n${ledger}`;

  for (const required of [
    'repo-local, template-only, non-live maintenance approval readiness package is not evidence',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'does not record owner approval, record provider approval, approve maintenance, schedule maintenance, create change windows, create cron, create jobs, configure monitoring, configure analytics, configure alerts, implement maintenance tasks, change production, change public runtime behavior, send support responses, contact customers, publish public notices, perform remediation, verify corrections, run retests, apply hotfixes, capture maintenance approval evidence, capture schedule evidence, capture change-window evidence, capture production evidence, execute rollback, perform deployment, record release closure, or grant deployment permission',
    'Preventive maintenance readiness reference',
    'Lessons-to-maintenance backlog reference',
    'Maintenance candidate source placeholder',
    'Owner approval placeholder',
    'Provider/runtime approval placeholder',
    'Change-window planning placeholder',
    'Risk/rollback dependency placeholder',
    'Maintenance change-window ledger reference',
    'Future verification dependency placeholder',
    'Final maintenance-approval status',
    'Not started',
    'Maintenance candidate not approved',
    'Needs owner prioritisation',
    'Needs provider clarification',
    'Needs rollback planning',
    'Needs future verification planning',
    'Draft approval only',
    'Blocked: no maintenance approval',
    'Blocked: deployment approval missing',
    'Ready for future approved scheduling review',
    'An approval template is not owner approval',
    'A provider approval placeholder is not provider approval',
    'A change-window placeholder is not scheduled maintenance',
    'A rollback dependency placeholder is not rollback readiness',
    'Passing validators is not maintenance approval',
    'A merged PR is not scheduled maintenance',
    'Approval ID: `[NOT ASSIGNED]`',
    'Approval area: `[NOT SELECTED]`',
    'Source maintenance item: `[NOT SUPPLIED]`',
    'Route/surface affected: `[NOT SELECTED]`',
    'Proposed maintenance summary: `[NOT CAPTURED]`',
    'Owner approval status: `[OWNER INPUT REQUIRED]`',
    'Provider/runtime approval status: `[PROVIDER DECISION REQUIRED]`',
    'Change-window status: `[NOT SCHEDULED]`',
    'Schedule status: `[NOT SCHEDULED]`',
    'Rollback dependency: `[NOT CAPTURED]`',
    'Verification dependency: `[NOT CAPTURED]`',
    'Implementation status: `[NOT STARTED]`',
    'Evidence status: `[NOT EVIDENCE / NOT RECORDED]`',
    'Deployment status: `[DEPLOYMENT APPROVAL: NOT GRANTED]`',
    'Public route maintenance approval',
    'Protected admin maintenance approval',
    'Quote/enquiry workflow maintenance approval',
    'Listing/category/media maintenance approval',
    'Provider/runtime approval',
    'Environment/secrets approval',
    'Owner prioritisation',
    'Rollback/change-window planning',
    'Future scheduling review',
    'not owner approval, not provider approval, not maintenance approval, not scheduled work, not change-window evidence, not maintenance implementation, not support evidence, not response-sent evidence, not customer-contact evidence, not monitoring evidence, not analytics evidence, not remediation evidence, not correction completion, not hotfix approval, not rollback evidence, not production evidence, not release closure, not maintenance completion, and not deployment approval'
  ]) {
    assertIncludes(docs, required, 'Phase 5X docs');
  }

  const statusDocs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    `Current phase: ${currentPhase5x}`,
    `Latest completed capability: ${currentPhase5w}`,
    'Last merged capability PR: #178',
    `Last merged capability merge commit: ${phase178MergeCommit}`,
    maintenanceApprovalReadinessDocPath,
    maintenanceChangeWindowPlanningLedgerTemplateDocPath,
    preventiveMaintenanceReadinessDocPath,
    lessonsToMaintenanceBacklogTemplateDocPath,
  maintenanceApprovalReadinessDocPath,
  maintenanceChangeWindowPlanningLedgerTemplateDocPath,
    'scripts/validate-maintenance-approval-readiness.cjs',
    'No deployment is performed or approved by Phase 5X-A/B'
  ]) {
    assertIncludes(statusDocs, required, 'Phase 5X status roll-forward docs');
  }

  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts?.['validate:maintenance-approval-readiness'] === 'node scripts/validate-maintenance-approval-readiness.cjs',
    'package.json must register validate:maintenance-approval-readiness'
  );

  const adminSource = readRepoFile('website/app/admin/protected-admin-shell.tsx');
  for (const required of [
    /Phase 5X-A\/B admin-only maintenance approval readiness/i,
    /MaintenanceApprovalReadinessHelper/i,
    /LOCAL-MAINTENANCE-APPROVAL-READINESS\.md/i,
    /LOCAL-MAINTENANCE-CHANGE-WINDOW-PLANNING-LEDGER-TEMPLATE\.md/i,
    /LOCAL-PREVENTIVE-MAINTENANCE-READINESS\.md/i,
    /LOCAL-LESSONS-TO-MAINTENANCE-BACKLOG-TEMPLATE\.md/i,
    /No owner approval is recorded here/i,
    /No provider approval is recorded here/i,
    /No maintenance approval is\s+granted here/i,
    /No maintenance schedule is created here/i,
    /No change window\s+is scheduled here/i,
    /No cron or job scheduler is added here/i,
    /No monitoring\s+is configured here/i,
    /No analytics is configured here/i,
    /No provider setup is\s+performed here/i,
    /No maintenance task is implemented here/i,
    /No maintenance\s+approval evidence is captured here/i,
    /No schedule evidence is captured\s+here/i,
    /No change-window evidence is captured here/i,
    /No production change\s+is made here/i,
    /No rollback is executed here/i,
    /No deployment is performed\s+here/i,
    /No deployment approval is granted here/i
  ]) {
    assert(required.test(adminSource), `Phase 5X admin source missing safe wording: ${required}`);
  }

  assertIncludes(readRepoFile('website/app/admin/page.tsx'), 'view={{ kind: "home" }}', 'admin home page');
  assert(/function AdminOperationsHome[\s\S]*<OwnerReadinessHelpersPanel \/>/.test(adminSource), 'AdminOperationsHome must render shared owner readiness helper panel');
  assert(/function OwnerReadinessHelpersPanel[\s\S]*<OwnerReviewWalkthroughReadinessHelper \/>[\s\S]*<OwnerFeedbackIntakeReadinessHelper \/>[\s\S]*<OwnerCorrectionWorkflowReadinessHelper \/>[\s\S]*<OwnerReReviewRequestReadinessHelper \/>[\s\S]*<OwnerDecisionIntakeReadinessHelper \/>[\s\S]*<DeploymentApprovalRequestReadinessHelper \/>[\s\S]*<DeploymentExecutionRunbookReadinessHelper \/>[\s\S]*<SmokeEvidenceIntakeReadinessHelper \/>[\s\S]*<SmokeEvidenceReviewReadinessHelper \/>[\s\S]*<LaunchDecisionResponseReadinessHelper \/>[\s\S]*<PostLaunchObservationReadinessHelper \/>[\s\S]*<PostLaunchRemediationReadinessHelper \/>[\s\S]*<RemediationVerificationReadinessHelper \/>[\s\S]*<IncidentResolutionResponseReadinessHelper \/>[\s\S]*<PreventiveMaintenanceReadinessHelper \/>[\s\S]*<MaintenanceApprovalReadinessHelper \/>/.test(adminSource), 'Phase 5X admin source must keep complete owner readiness helper chain in shared panel');

  const publicSource = readTrackedProductionSources(publicSourceRoots);
  assertNoMatch(publicSource, /maintenance approval|maintenance change-window|preventive maintenance|lessons-to-maintenance|incident resolution response|support response|customer follow-up|public notice|maintenance internals|monitoring\/analytics internals|scheduler\/cron internals|provider setup internals|environment\/secrets internals|admin route internals|owner handoff internals|release-control internals|admin urls?|\/admin\//i, 'Phase 5X public source');
  assert(/listing|listings/i.test(publicSource), 'Phase 5X public source must retain listing wording');
  assert(/rental|rentals/i.test(publicSource), 'Phase 5X public source must retain rental wording');
  assert(/quote|enquiry|request/i.test(publicSource), 'Phase 5X public source must retain quote/enquiry/request wording');
  assertNoMatch(publicSource, /\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i, 'Phase 5X public source');
  assertNoMatch(publicSource, /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'Phase 5X public source');
  assertNoMatch(publicSource, /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i, 'Phase 5X public source');
  assertNoMatch(publicSource, /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging|public status view/i, 'Phase 5X public source');
  assertNoMatch(adminSource, /public upload|customer upload|storage provider|monitoring provider setup|analytics provider setup|alerting provider setup|scheduler setup|cron setup|process\.env|NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE|Pinecone|\bRAG\b|n8n runtime|\/api\/chat|outbound messaging/i, 'Phase 5X admin source');
  assertNoMatch(docs, /actual deployment|maintenance approved|owner approved|provider approved|maintenance scheduled|change window scheduled|cron configured|job configured|monitoring configured|analytics configured|support response sent|customer follow-up sent|public notice published|maintenance completed|live hotfix|remediation performed|correction completed|retest run completed|live monitoring|analytics capture|route verification completed|route walkthrough completed|preview publication completed|production launch completed|provider setup completed|env\/secrets setup completed|owner sign-?off complete|launch clearance granted|production evidence captured|preview evidence captured|smoke evidence captured|rollback evidence captured|response-sent evidence captured|closure evidence captured|resolution evidence captured|maintenance evidence captured|maintenance-approval evidence captured|maintenance-schedule evidence captured|change-window evidence captured|correction-completed evidence captured|remediation evidence captured|hotfix evidence captured|retest evidence captured|monitoring evidence captured|analytics evidence captured|deployment approval granted/i, 'Phase 5X docs');

  const suite = readRepoFile('scripts/validate-release-candidate-suite.cjs');
  assertIncludes(suite, "args: ['run', 'validate:maintenance-approval-readiness']", 'release-candidate suite');
  assertIncludes(suite, "args: ['run', 'validate:preventive-maintenance-readiness']", 'release-candidate suite');
  assertNoMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');
  assertSuiteAndTests();
}

function assertPhase5uRemediationVerificationReadiness() {
  assertPhase5tPostLaunchRemediationReadiness();
  assertRemediationVerificationReadinessDocs();
  assertPhase5uStatusRollForward();
  assertRemediationVerificationPackageScript();
  assertRemediationVerificationSources();
  assertNoForbiddenTrackedFiles();
  assertNoFilledEvidence();
  assertReleaseSuiteHasRemediationVerificationReadiness();
  assertReleaseSuiteHasPostLaunchRemediationReadiness();
  assertReleaseSuiteHasPostLaunchObservationReadiness();
  assertReleaseSuiteHasLaunchDecisionResponseReadiness();
  assertReleaseSuiteHasSmokeEvidenceReviewReadiness();
  assertReleaseSuiteHasSmokeEvidenceIntakeReadiness();
  assertReleaseSuiteHasDeploymentExecutionRunbookReadiness();
  assertReleaseSuiteHasDeploymentApprovalRequestReadiness();
  assertReleaseSuiteHasOwnerDecisionIntakeReadiness();
  assertReleaseSuiteHasOwnerReReviewRequestReadiness();
  assertReleaseSuiteHasOwnerCorrectionWorkflow();
  assertReleaseSuiteHasOwnerFeedbackIntake();
  assertReleaseSuiteHasOwnerReviewWalkthrough();
  assertReleaseSuiteHasCatalogueWriteWorkflow();
  assertSuiteAndTests();
}

function assertPhase5tStatusRollForward() {
  const docs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    `Current phase: ${currentPhase5t}`,
    `Latest completed capability: ${currentPhase5s}`,
    'Last merged capability PR: #174',
    `Last merged capability merge commit: ${phase174MergeCommit}`,
    postLaunchRemediationReadinessDocPath,
    incidentTriageCorrectionBacklogTemplateDocPath,
    postLaunchObservationReadinessDocPath,
    incidentFollowupLedgerTemplateDocPath,
    'scripts/validate-post-launch-remediation-readiness.cjs',
    'No deployment is performed or approved by Phase 5T-A/B',
  ]) {
    assertIncludes(docs, required, 'Phase 5T status roll-forward docs');
  }
}

function assertPostLaunchRemediationReadinessDocs() {
  assertTracked(
    [postLaunchRemediationReadinessDocPath, incidentTriageCorrectionBacklogTemplateDocPath],
    'Phase 5T post-launch remediation readiness docs'
  );
  const remediation = normalizeWhitespace(readRepoFile(postLaunchRemediationReadinessDocPath));
  const backlog = normalizeWhitespace(readRepoFile(incidentTriageCorrectionBacklogTemplateDocPath));
  for (const required of [
    'repo-local, template-only, non-live, and not evidence',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'does not apply hotfixes, change production, change public runtime behavior, record incidents, perform remediation, complete corrections, send support responses, contact customers, configure providers, capture remediation evidence, capture production evidence, execute rollback, perform deployment, record owner approval, record release closure, or grant deployment permission',
    'Incident/follow-up ledger reference',
    'Post-launch observation reference',
    'Incident triage source placeholder',
    'Affected route/surface placeholder',
    'Severity/impact placeholder',
    'Owner clarification placeholder',
    'Provider/runtime clarification placeholder',
    'Correction backlog reference',
    'Rollback/escalation review placeholder',
    'Final remediation planning status',
    'Not started',
    'Incident not recorded',
    'Observation missing',
    'Needs owner clarification',
    'Needs provider clarification',
    'Needs reproduction',
    'Needs correction planning',
    'Blocked: no live approval',
    'Blocked: deployment approval missing',
    'Ready for future approved correction planning',
    'A remediation template is not a hotfix',
    'A triage placeholder is not an incident record',
    'A correction backlog row is not a completed correction',
    'A rollback/escalation placeholder is not rollback execution',
    'Passing validators is not remediation success',
    'A merged PR is not live incident resolution',
  ]) {
    assertIncludes(remediation, required, 'Phase 5T post-launch remediation readiness doc');
  }
  for (const required of [
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    'Triage ID: `[NOT ASSIGNED]`',
    'Triage area: `[NOT SELECTED]`',
    'Source incident/follow-up: `[NOT SUPPLIED]`',
    'Route/surface affected: `[NOT SELECTED]`',
    'Severity/impact: `[NOT CAPTURED]`',
    'Reproduction status: `[NOT RUN]`',
    'Owner input status: `[OWNER INPUT REQUIRED]`',
    'Provider/runtime status: `[PROVIDER DECISION REQUIRED]`',
    'Proposed correction: `[NOT CAPTURED]`',
    'Hotfix status: `[NOT APPROVED]`',
    'Release/correction status: `[NOT SCHEDULED]`',
    'Evidence status: `[NOT EVIDENCE / NOT RECORDED]`',
    'Deployment status: `[DEPLOYMENT APPROVAL: NOT GRANTED]`',
    'Public route triage',
    'Protected admin triage',
    'Quote/enquiry workflow triage',
    'Listing/category/media triage',
    'Provider/runtime clarification',
    'Environment/secrets clarification',
    'Owner clarification',
    'Rollback/escalation review',
    'Future correction planning',
    'not an incident record, not support evidence, not response-sent evidence, not monitoring evidence, not analytics evidence, not remediation evidence, not hotfix approval, not rollback evidence, not production evidence, not release closure, and not deployment approval',
  ]) {
    assertIncludes(backlog, required, 'Phase 5T incident triage correction backlog template doc');
  }
  assertNoMatch(
    `${remediation}\n${backlog}`,
    /owner approved|owner sign-?off complete|accepted by owner|rejected by owner|owner decision recorded|owner approval recorded|owner feedback recorded|owner re-review recorded|owner corrections completed|owner response sent|launch response sent|support response sent|customer follow-up sent|preview evidence captured|production evidence captured|smoke evidence captured|rollback evidence captured|route-walkthrough evidence captured|correction-completed evidence captured|response-sent evidence captured|monitoring evidence captured|analytics evidence captured|remediation evidence captured|hotfix evidence captured|public launch evidence captured|sign-off evidence captured|deployment approval granted|launch approval granted|launch clearance granted|provider setup completed|secrets created|deployment performed|preview published|production launched|actual deployment|live hotfix applied|remediation performed|correction completed|smoke run completed|route walkthrough completed|route verification completed|evidence review completed|release closure completed|incident response sent|incident record completed|live monitoring configured|analytics captured/i,
    'Phase 5T docs'
  );
}

function assertPostLaunchRemediationPackageScript() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts?.['validate:post-launch-remediation-readiness'] === 'node scripts/validate-post-launch-remediation-readiness.cjs',
    'package.json must register validate:post-launch-remediation-readiness'
  );
}

function assertPostLaunchRemediationSources() {
  const adminSource = readTrackedProductionSources(['website/app/admin/protected-admin-shell.tsx']);
  const adminPage = readRepoFile('website/app/admin/page.tsx');
  const publicSource = readTrackedProductionSources(publicSourceRoots);

  for (const required of [
    /Phase 5T-A\/B admin-only post-launch remediation readiness/i,
    /Post-launch remediation readiness helper/i,
    /LOCAL-POST-LAUNCH-REMEDIATION-READINESS\.md/i,
    /LOCAL-INCIDENT-TRIAGE-CORRECTION-BACKLOG-TEMPLATE\.md/i,
    /LOCAL-POST-LAUNCH-OBSERVATION-READINESS\.md/i,
    /LOCAL-INCIDENT-FOLLOWUP-LEDGER-TEMPLATE\.md/i,
    /Safe future remediation sections/i,
    /Incident triage\/correction backlog placeholders/i,
    /Allowed future remediation statuses/i,
    /No-hotfix\/no-remediation boundaries/i,
    /No\s+live\s+hotfix\s+is\s+applied\s+here/i,
    /No\s+production\s+change\s+is\s+made\s+here/i,
    /No\s+remediation\s+is\s+performed\s+here/i,
    /No\s+incident\s+is\s+recorded\s+here/i,
    /No\s+support\s+response\s+is\s+sent\s+here/i,
    /No\s+customer\s+follow-up\s+is\s+sent\s+here/i,
    /No\s+remediation\s+evidence\s+is\s+captured\s+here/i,
    /No\s+monitoring\s+evidence\s+is\s+captured\s+here/i,
    /No\s+analytics\s+evidence\s+is\s+captured\s+here/i,
    /No\s+rollback\s+is\s+executed\s+here/i,
    /No\s+deployment\s+is\s+performed\s+here/i,
    /No\s+deployment\s+approval\s+is\s+granted\s+here/i,
    /\[NOT EVIDENCE \/ NOT RECORDED\]/i,
    /\[DEPLOYMENT APPROVAL: NOT GRANTED\]/i,
  ]) {
    assert(required.test(adminSource), `Phase 5T admin source missing safe wording: ${required}`);
  }

  assertIncludes(adminPage, 'view={{ kind: "home" }}', 'admin page home view');
  assert(
    /function AdminOperationsHome[\s\S]*<OwnerReadinessHelpersPanel \/>/.test(adminSource),
    'Phase 5T admin source must render owner readiness helpers from the real AdminOperationsHome path'
  );
  assert(
    /function OwnerReadinessHelpersPanel[\s\S]*<OwnerReviewWalkthroughReadinessHelper \/>[\s\S]*<OwnerFeedbackIntakeReadinessHelper \/>[\s\S]*<OwnerCorrectionWorkflowReadinessHelper \/>[\s\S]*<OwnerReReviewRequestReadinessHelper \/>[\s\S]*<OwnerDecisionIntakeReadinessHelper \/>[\s\S]*<DeploymentApprovalRequestReadinessHelper \/>[\s\S]*<DeploymentExecutionRunbookReadinessHelper \/>[\s\S]*<SmokeEvidenceIntakeReadinessHelper \/>[\s\S]*<SmokeEvidenceReviewReadinessHelper \/>[\s\S]*<LaunchDecisionResponseReadinessHelper \/>[\s\S]*<PostLaunchObservationReadinessHelper \/>[\s\S]*<PostLaunchRemediationReadinessHelper \/>/.test(adminSource),
    'Phase 5T admin source must keep the complete owner readiness helper chain in the shared panel'
  );

  assertNoMatch(
    publicSource,
    /post-launch remediation|incident triage correction backlog|post-launch observation|incident\/follow-up ledger|launch decision response|release closure packet|smoke evidence review|go\/no-go decision ledger|smoke evidence intake|route verification ledger|rollback observation|deployment execution runbook|provider\/environment decision matrix|provider env decision matrix|deployment approval request|provider setup internals|environment\/secrets internals|monitoring\/analytics internals|hotfix internals|admin route internals|owner handoff internals|release-control internals|admin urls?|internal notes|public admin status|\/admin\//i,
    'Phase 5T public source'
  );
  assert(/\b(?:listing|listings)\b/i.test(publicSource), 'public source must retain listing wording');
  assert(/\b(?:rental|rentals)\b/i.test(publicSource), 'public source must retain rental wording');
  assert(/\b(?:quote|enquiry|request)\b/i.test(publicSource), 'public source must retain quote/enquiry/request wording');
  assertNoMatch(publicSource, /\b(?:cart|checkout|order|payment|purchase|online ordering)\b/i, 'Phase 5T public source');
  assertNoMatch(publicSource, /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i, 'Phase 5T public source');
  assertNoMatch(publicSource, /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i, 'Phase 5T public source');
  assertNoMatch(publicSource, /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b|email sending|sms sending|whatsapp|outbound messaging|public status view/i, 'Phase 5T public source');
  assertNoMatch(
    adminSource,
    /public upload|customer upload|new provider setup|new storage provider|storage provider changes|monitoring provider setup|analytics provider setup|alerting provider setup|NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE_KEY|service-role browser|Pinecone|\bRAG\b|n8n runtime|\/api\/chat.*retrieval|outbound messaging|email sending|sms sending|whatsapp sending|process\.env\.(?:NEXT_PUBLIC_|SUPABASE|N8N|PINECONE|VERCEL)/i,
    'Phase 5T admin source'
  );
}

function assertReleaseSuiteHasPostLaunchRemediationReadiness() {
  const suite = readRepoFile('scripts/validate-release-candidate-suite.cjs');
  assertIncludes(suite, "args: ['run', 'validate:post-launch-remediation-readiness']", 'release-candidate suite');
  assertIncludes(suite, "args: ['run', 'validate:post-launch-observation-readiness']", 'release-candidate suite');
  assertNoMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');
}

function assertPhase5tPostLaunchRemediationReadiness() {
  assertPhase5sPostLaunchObservationReadiness();
  assertPostLaunchRemediationReadinessDocs();
  assertPhase5tStatusRollForward();
  assertPostLaunchRemediationPackageScript();
  assertPostLaunchRemediationSources();
  assertNoForbiddenTrackedFiles();
  assertNoFilledEvidence();
  assertReleaseSuiteHasPostLaunchRemediationReadiness();
  assertReleaseSuiteHasPostLaunchObservationReadiness();
  assertReleaseSuiteHasLaunchDecisionResponseReadiness();
  assertReleaseSuiteHasSmokeEvidenceReviewReadiness();
  assertReleaseSuiteHasSmokeEvidenceIntakeReadiness();
  assertReleaseSuiteHasDeploymentExecutionRunbookReadiness();
  assertReleaseSuiteHasDeploymentApprovalRequestReadiness();
  assertReleaseSuiteHasOwnerDecisionIntakeReadiness();
  assertReleaseSuiteHasOwnerReReviewRequestReadiness();
  assertReleaseSuiteHasOwnerCorrectionWorkflow();
  assertReleaseSuiteHasOwnerFeedbackIntake();
  assertReleaseSuiteHasOwnerReviewWalkthrough();
  assertReleaseSuiteHasCatalogueWriteWorkflow();
  assertSuiteAndTests();
}

function assertReleaseSuiteHasPostLaunchObservationReadiness() {
  const suite = readRepoFile('scripts/validate-release-candidate-suite.cjs');
  assertIncludes(suite, "args: ['run', 'validate:post-launch-observation-readiness']", 'release-candidate suite');
  assertIncludes(suite, "args: ['run', 'validate:launch-decision-response-readiness']", 'release-candidate suite');
  assertNoMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');
}

function assertPhase5sPostLaunchObservationReadiness() {
  assertPhase5rLaunchDecisionResponseReadiness();
  assertPostLaunchObservationReadinessDocs();
  assertPhase5sStatusRollForward();
  assertPostLaunchObservationPackageScript();
  assertPostLaunchObservationSources();
  assertNoForbiddenTrackedFiles();
  assertNoFilledEvidence();
  assertReleaseSuiteHasPostLaunchObservationReadiness();
  assertReleaseSuiteHasLaunchDecisionResponseReadiness();
  assertReleaseSuiteHasSmokeEvidenceReviewReadiness();
  assertReleaseSuiteHasSmokeEvidenceIntakeReadiness();
  assertReleaseSuiteHasDeploymentExecutionRunbookReadiness();
  assertReleaseSuiteHasDeploymentApprovalRequestReadiness();
  assertReleaseSuiteHasOwnerDecisionIntakeReadiness();
  assertReleaseSuiteHasOwnerReReviewRequestReadiness();
  assertReleaseSuiteHasOwnerCorrectionWorkflow();
  assertReleaseSuiteHasOwnerFeedbackIntake();
  assertReleaseSuiteHasOwnerReviewWalkthrough();
  assertReleaseSuiteHasCatalogueWriteWorkflow();
  assertSuiteAndTests();
}

function assertReleaseSuiteHasLaunchDecisionResponseReadiness() {
  const suite = readRepoFile('scripts/validate-release-candidate-suite.cjs');
  assertIncludes(suite, "args: ['run', 'validate:launch-decision-response-readiness']", 'release-candidate suite');
  assertIncludes(suite, "args: ['run', 'validate:smoke-evidence-review-readiness']", 'release-candidate suite');
  assertNoMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');
}

function assertPhase5rLaunchDecisionResponseReadiness() {
  assertPhase5qSmokeEvidenceReviewReadiness();
  assertLaunchDecisionResponseReadinessDocs();
  assertPhase5rStatusRollForward();
  assertLaunchDecisionResponsePackageScript();
  assertLaunchDecisionResponseSources();
  assertNoForbiddenTrackedFiles();
  assertNoFilledEvidence();
  assertReleaseSuiteHasLaunchDecisionResponseReadiness();
  assertReleaseSuiteHasSmokeEvidenceReviewReadiness();
  assertReleaseSuiteHasSmokeEvidenceIntakeReadiness();
  assertReleaseSuiteHasDeploymentExecutionRunbookReadiness();
  assertReleaseSuiteHasDeploymentApprovalRequestReadiness();
  assertReleaseSuiteHasOwnerDecisionIntakeReadiness();
  assertReleaseSuiteHasOwnerReReviewRequestReadiness();
  assertReleaseSuiteHasOwnerCorrectionWorkflow();
  assertReleaseSuiteHasOwnerFeedbackIntake();
  assertReleaseSuiteHasOwnerReviewWalkthrough();
  assertReleaseSuiteHasCatalogueWriteWorkflow();
  assertSuiteAndTests();
}

function assertReleaseSuiteHasSmokeEvidenceReviewReadiness() {
  const suite = readRepoFile('scripts/validate-release-candidate-suite.cjs');
  assertIncludes(suite, "args: ['run', 'validate:smoke-evidence-review-readiness']", 'release-candidate suite');
  assertIncludes(suite, "args: ['run', 'validate:smoke-evidence-intake-readiness']", 'release-candidate suite');
  assertNoMatch(suite, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');
}

function assertPhase5qSmokeEvidenceReviewReadiness() {
  assertPhase5pSmokeEvidenceIntakeReadiness();
  assertSmokeEvidenceReviewReadinessDocs();
  assertPhase5qStatusRollForward();
  assertSmokeEvidenceReviewPackageScript();
  assertSmokeEvidenceReviewSources();
  assertNoForbiddenTrackedFiles();
  assertNoFilledEvidence();
  assertReleaseSuiteHasSmokeEvidenceReviewReadiness();
  assertReleaseSuiteHasSmokeEvidenceIntakeReadiness();
  assertReleaseSuiteHasDeploymentExecutionRunbookReadiness();
  assertReleaseSuiteHasDeploymentApprovalRequestReadiness();
  assertReleaseSuiteHasOwnerDecisionIntakeReadiness();
  assertReleaseSuiteHasOwnerReReviewRequestReadiness();
  assertReleaseSuiteHasOwnerCorrectionWorkflow();
  assertReleaseSuiteHasOwnerFeedbackIntake();
  assertReleaseSuiteHasOwnerReviewWalkthrough();
  assertReleaseSuiteHasCatalogueWriteWorkflow();
  assertSuiteAndTests();
}

module.exports = {
  assertPhase5xMaintenanceApprovalReadiness,
  assertPhase5wPreventiveMaintenanceReadiness,
  assertPhase5vIncidentResolutionResponseReadiness,
  assertPhase5uRemediationVerificationReadiness,
  assertPhase5tPostLaunchRemediationReadiness,
  assertPhase5sPostLaunchObservationReadiness,
  assertPhase5rLaunchDecisionResponseReadiness,
  assertPhase5qSmokeEvidenceReviewReadiness,
  assertPhase5pSmokeEvidenceIntakeReadiness,
  assertPhase5oDeploymentExecutionRunbookReadiness,
  assertPhase5nDeploymentApprovalRequestReadiness,
  assertPhase5mOwnerDecisionIntakeReadiness,
  assertPhase5lOwnerReReviewRequestReadiness,
  assertPhase5kOwnerCorrectionWorkflowReadiness,
  assertPhase5jOwnerFeedbackIntakeReadiness,
  assertPhase5iOwnerReviewWalkthroughReadiness,
  assertPhase5hCatalogueWriteWorkflowReadiness,
  assertPhase5gCatalogueContentOpsReadiness,
  assertPhase5aPublicReviewPolish,
  assertPhase5bPublicJourneyAcceptance,
  assertPhase5cPublicDiscoveryAcceptance,
  assertPhase5dListingDetailReadiness,
  assertPhase5eQuoteIntakeReadiness,
  assertPhase5fQuoteTriageReadiness,
  phase154MergeCommit,
  phase155MergeCommit,
  phase156MergeCommit,
  phase157MergeCommit,
  phase158MergeCommit,
  phase159MergeCommit,
  phase160MergeCommit,
  phase161MergeCommit,
  phase162MergeCommit,
  phase163MergeCommit,
  phase164MergeCommit,
  phase166MergeCommit,
  phase167MergeCommit,
  phase168MergeCommit,
  phase169MergeCommit,
  phase170MergeCommit,
  phase171MergeCommit,
  currentPhase5a,
  currentPhase5b,
  currentPhase5c,
  currentPhase5d,
  currentPhase5e,
  currentPhase5f,
  currentPhase5g,
  currentPhase5h,
  currentPhase5i,
  currentPhase5j,
  currentPhase5k,
  currentPhase5l,
  currentPhase5m,
  currentPhase5n,
  currentPhase5o,
  currentPhase5p,
  currentPhase5q,
  currentPhase5r,
  currentPhase5s,
  currentPhase5t,
  currentPhase5u,
  currentPhase5v,
  currentPhase5w,
  currentPhase5x,
  latestCompletedPhase4f,
  cleanupDocPath,
  publicJourneyAcceptanceDocPath,
  discoveryAcceptanceDocPath,
  listingDetailReadinessDocPath,
  quoteIntakeReadinessDocPath,
  quoteTriageReadinessDocPath,
  catalogueContentOpsReadinessDocPath,
  catalogueWriteWorkflowReadinessDocPath,
  ownerReviewWalkthroughReadinessDocPath,
  fullRouteAcceptanceMatrixDocPath,
  ownerDecisionIntakeReadinessDocPath,
  signoffCriteriaLedgerTemplateDocPath,
  deploymentApprovalRequestReadinessDocPath,
  preLaunchBlockerLedgerTemplateDocPath,
  deploymentExecutionRunbookReadinessDocPath,
  providerEnvDecisionMatrixTemplateDocPath,
  smokeEvidenceIntakeReadinessDocPath,
  routeVerificationRollbackLedgerTemplateDocPath,
  smokeEvidenceReviewReadinessDocPath,
  goNogoDecisionLedgerTemplateDocPath,
  launchDecisionResponseReadinessDocPath,
  releaseClosurePacketTemplateDocPath,
  postLaunchObservationReadinessDocPath,
  incidentFollowupLedgerTemplateDocPath,
  postLaunchRemediationReadinessDocPath,
  incidentTriageCorrectionBacklogTemplateDocPath,
  remediationVerificationReadinessDocPath,
  correctionRetestResolutionLedgerTemplateDocPath,
};
