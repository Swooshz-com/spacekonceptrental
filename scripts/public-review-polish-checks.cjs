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
    /No deployment approval is granted here/i,
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
    /No deployment approval is granted here/i,
    /\[NOT EVIDENCE \/ NOT RECORDED\]/i,
    /\[DEPLOYMENT APPROVAL: NOT GRANTED\]/i,
  ]) {
    assert(required.test(adminSource), `Phase 5M admin source missing safe wording: ${required}`);
  }

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
    /No deployment approval is granted here/i,
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

module.exports = {
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
};
