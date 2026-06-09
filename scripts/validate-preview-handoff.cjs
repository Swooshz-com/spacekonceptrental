const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const handoffDocPath = 'docs/PREVIEW-DEPLOYMENT-HANDOFF.md';
const branchFreezeDocPath = 'docs/PREVIEW-DEPLOYMENT-BRANCH-FREEZE.md';
const ownerReviewPackagePath = 'docs/OWNER-REVIEW-READINESS-PACKAGE.md';
const ownerManualQaPath = 'docs/manual-qa/OWNER-REVIEW-MANUAL-QA.md';
const ownerContentIntakePath = 'docs/content/OWNER-CONTENT-INTAKE.md';
const contentGapRegisterPath = 'docs/content/CONTENT-GAP-REGISTER.md';
const ownerReviewLedgerPath = 'docs/content/OWNER-REVIEW-ISSUE-LEDGER.md';
const ownerReviewExecutionChecklistPath = 'docs/content/OWNER-REVIEW-EXECUTION-CHECKLIST.md';
const ownerReviewRouteDecisionMatrixPath = 'docs/content/OWNER-REVIEW-ROUTE-DECISION-MATRIX.md';
const ownerReviewDryRunPacketPath = 'docs/content/OWNER-REVIEW-DRY-RUN-PACKET.md';
const ownerReviewFindingsDispositionPath = 'docs/content/OWNER-REVIEW-FINDINGS-DISPOSITION.md';
const ownerReviewLaunchDecisionRehearsalPath = 'docs/content/OWNER-REVIEW-LAUNCH-DECISION-REHEARSAL.md';
const ownerReviewCorrectionIntakePath = 'docs/content/OWNER-REVIEW-CORRECTION-INTAKE.md';
const ownerReviewLaunchBlockerFreezeGatePath = 'docs/content/OWNER-REVIEW-LAUNCH-BLOCKER-FREEZE-GATE.md';
const ownerReviewCorrectionPrPlanPath = 'docs/content/OWNER-REVIEW-CORRECTION-PR-PLAN.md';
const ownerReviewClosurePacketPath = 'docs/content/OWNER-REVIEW-CLOSURE-PACKET.md';
const ownerReviewClosureSignoffTemplatePath = 'docs/content/OWNER-REVIEW-CLOSURE-SIGN-OFF-TEMPLATE.md';
const ownerReviewDeploymentApprovalSeparationPath = 'docs/content/OWNER-REVIEW-DEPLOYMENT-APPROVAL-SEPARATION.md';
const ownerDemoWalkthroughPath = 'docs/content/OWNER-DEMO-WALKTHROUGH.md';
const ownerDemoIssueBacklogPath = 'docs/content/OWNER-DEMO-ISSUE-BACKLOG.md';
const localReleaseCandidateAcceptanceMatrixPath =
  'docs/content/LOCAL-RELEASE-CANDIDATE-ACCEPTANCE-MATRIX.md';
const localRouteInventoryFreezePath = 'docs/content/LOCAL-ROUTE-INVENTORY-FREEZE.md';
const localReleaseCandidateCommandCentrePath =
  'docs/content/LOCAL-RELEASE-CANDIDATE-COMMAND-CENTRE.md';
const finalOwnerHandoffPackPath = 'docs/content/FINAL-LOCAL-OWNER-HANDOFF-PACK.md';
const localAcceptanceTriageBoardPath = 'docs/content/LOCAL-ACCEPTANCE-TRIAGE-BOARD.md';
const deploymentDecisionFirewallPath = 'docs/content/DEPLOYMENT-DECISION-FIREWALL.md';
const quoteWorkflowChecklistPath =
  'docs/content/QUOTE-ENQUIRY-WORKFLOW-ACCEPTANCE-CHECKLIST.md';
const catalogueListingMediaChecklistPath =
  'docs/content/CATALOGUE-LISTING-MEDIA-ACCEPTANCE-CHECKLIST.md';
const protectedAdminWriteOpsChecklistPath =
  'docs/content/PROTECTED-ADMIN-WRITE-OPS-ACCEPTANCE-CHECKLIST.md';
const protectedAdminDestructiveActionSafeguardsPath =
  'docs/content/PROTECTED-ADMIN-DESTRUCTIVE-ACTION-SAFEGUARDS.md';
const protectedAdminRecoveryLanePath = 'docs/content/PROTECTED-ADMIN-RECOVERY-LANE.md';
const protectedAdminStatusTransitionMatrixPath =
  'docs/content/PROTECTED-ADMIN-STATUS-TRANSITION-MATRIX.md';
const publicJourneyReadinessClosurePath =
  'docs/content/PUBLIC-JOURNEY-READINESS-CLOSURE.md';
const quotePublicExpectationBoundaryPath =
  'docs/content/QUOTE-ENQUIRY-PUBLIC-EXPECTATION-BOUNDARY.md';
const protectedAdminPublicReviewBridgePath =
  'docs/content/PROTECTED-ADMIN-PUBLIC-REVIEW-BRIDGE.md';
const contentReadinessRoutePath = 'website/app/admin/content-readiness/page.tsx';
const protectedAdminShellPath = 'website/app/admin/protected-admin-shell.tsx';
const releaseControlRoutePath = 'website/app/admin/release-control/page.tsx';
const phase4aLocalReleaseControlGatePath = 'docs/release/PHASE-4A-LOCAL-RELEASE-CONTROL-GATE.md';
const ownerInputIntakeControlPath = 'docs/content/OWNER-INPUT-INTAKE-CONTROL.md';
const localCorrectionQueuePath = 'docs/content/LOCAL-CORRECTION-QUEUE.md';
const reviewReadyHandoffClosurePath = 'docs/content/REVIEW-READY-HANDOFF-CLOSURE.md';
const localOwnerReviewRehearsalPackPath = 'docs/content/LOCAL-OWNER-REVIEW-REHEARSAL-PACK.md';
const localBlockerLedgerTemplatePath = 'docs/content/LOCAL-BLOCKER-LEDGER-TEMPLATE.md';
const localAcceptanceDrillPath = 'docs/content/LOCAL-ACCEPTANCE-DRILL.md';
const ownerReviewRehearsalRunbookPath = 'docs/content/OWNER-REVIEW-REHEARSAL-RUNBOOK.md';
const deploymentApprovalFirewallMatrixPath = 'docs/content/DEPLOYMENT-APPROVAL-FIREWALL-MATRIX.md';
const handoffValidatorPath = 'scripts/validate-preview-handoff.cjs';
const suiteRunnerPath = 'scripts/validate-release-candidate-suite.cjs';
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const forbiddenTransactionTermPattern = new RegExp(
  `\\b(?:${[
    'ecom' + 'merce',
    'ca' + 'rt',
    'check' + 'out',
    'ord' + 'er',
    'pay' + 'ment',
    'pur' + 'chase',
    'trans' + 'action',
    'ret' + 'ail',
    'book' + 'ing',
    'reser' + 'vation',
    'reser' + 'ved',
    'fulfil' + 'ment',
  ].join('|')})s?\\b`,
  'i',
);
const phase2pMergeCommit = '15a5d23941ac7fbe3297792311f50e414d622f5f';
const phase2qMergeCommit = '62c2b11b6b15192434eb4035ba0a66a44cd6f763';
const phase3aMergeCommit = '6e8bcf23bc8d7eef12b738613344764c0c1961e6';
const phase3bMergeCommit = 'bfcf9916a0edd1b7133a1765719b9ddd73197dac';
const phase3cMergeCommit = 'd031d7f47a6893f92d0b6739300d52147f6abfa4';
const phase3dMergeCommit = 'de357ee234ed1d92ab27eb1f6d571c0c4f0ccd04';
const phase3fMergeCommit = '69665bb241b1af5c05ad34ac1464cdaeece8b7f8';
const phase3gMergeCommit = '75fd104966e3e8c69a434f2325f6f79e4742a40f';
const phase3hMergeCommit = '09f92ede4b5d9f725d0df560838a12fef27940b9';
const phase3iMergeCommit = '0d2d40898c4e716032fdec130704117494c542d6';
const phase3jMergeCommit = '1c7dc0ac7c2532fa8a837cd46b0d1f0103d5ccfa';
const phase3kMergeCommit = 'd4271ea6b181ee702dfe9d6f2b6003903b0c54dd';
const phase3lMergeCommit = 'be7fda99f25f73c86494e1ab323e0624dd917806';
const phase3mMergeCommit = '0528ad92ad756a68d2094a16cd204f1c404c99a3';
const phase3nMergeCommit = '98d62e9d6641d0d34770c76f156e914be5ba4edd';
const phase3oMergeCommit = 'fd5614bb1e0a9e0e33f064ecaba7bc85dba36efb';
const phase3pMergeCommit = '586d17e3f909fcf2986115633bb329a06fbcdf49';
const phase3qMergeCommit = '0a0bd665111decffb6cdc837e48782943940f22f';
const phase3rMergeCommit = 'ef18c2357d37fdb613851c427130bb108861de31';
const phase3sMergeCommit = '7d6af15e09f7603e2107801f3b6417fd4d2d40bc';
const phase3tMergeCommit = '66840d5d3bb77d39200a864bfcbecc29ee859f76';
const phase3uMergeCommit = 'dd2c3c0176c427e69efa01d6e54841637d61548c';
const phase3vMergeCommit = '3904a661aa3d72606d4c48743030406656128b2c';
const phase3wMergeCommit = '54cd8d5e7b829e56d245da2ca503c9b4058dca76';
const phase3xMergeCommit = '50316a5c4052607487ba7409d5dc854889db6e24';
const phase3yMergeCommit = '7f422fd47ffa75cf982bd4f9d859b530a96961ad';
const phase3zMergeCommit = '26792f73f8e7943eac5e421c6d829bde7613b562';
const phase4aMergeCommit = 'd825a112d017e95bd28ce030a5755ef78223e4c1';
const phase4bMergeCommit = 'baa076679756751a725ea65ac565545c6fe56d76';
const phase151MergeCommit = '9c7d167f98694f2ffbb1d9a0439c9fbbed4a9336';
const phase4dLocalFreezeDocs = [
  'docs/content/LOCAL-RELEASE-CANDIDATE-FREEZE.md',
  'docs/content/FULL-SUITE-RELIABILITY-GATE.md',
  'docs/content/DEPLOYMENT-PLANNING-FIREWALL-CLOSURE.md',
];
const phase4dStatusDocPaths = [
  'docs/PHASE-STATUS.md',
  'docs/PHASE-ROADMAP.md',
  'docs/PHASE-2-READINESS-PLAN.md',
  'docs/DECISION-LOG.md',
  'docs/checklists/PHASE-2-ADMIN-OPS.md',
  'docs/OWNER-REVIEW-READINESS-PACKAGE.md',
  'docs/manual-qa/OWNER-REVIEW-MANUAL-QA.md',
  'docs/PREVIEW-DEPLOYMENT-HANDOFF.md',
];

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

function statusHistoryBlock(source, startMarker, endMarker, label) {
  const start = source.indexOf(startMarker);
  assert(start !== -1, `${label} is missing block start: ${startMarker}`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert(end !== -1, `${label} is missing block end: ${endMarker}`);
  return source.slice(start, end);
}

function normalizeWhitespace(source) {
  return source.replace(/\s+/g, ' ').trim();
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
    .map((filePath) => readRepoFile(filePath))
    .join('\n');
}

function assertPackageAndCi() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  const workflow = readRepoFile('.github/workflows/ci.yml');

  assert(
    packageJson.scripts['validate:preview-handoff'] === 'node scripts/validate-preview-handoff.cjs',
    'validate:preview-handoff script is missing.',
  );
  assert(
    packageJson.scripts['validate:release-candidate-suite'] ===
      'node scripts/validate-release-candidate-suite.cjs',
    'validate:release-candidate-suite script is missing.',
  );
  assertIncludes(workflow, 'npm run validate:preview-handoff', '.github/workflows/ci.yml');
  assert(!workflow.includes('npm run smoke:preview'), 'live smoke:preview must not run in CI.');
}

function assertHandoffDocs() {
  const docs = [
    readRepoFile(handoffDocPath),
    readRepoFile(branchFreezeDocPath),
  ].join('\n');
  const normalizedDocs = normalizeWhitespace(docs);

  assertTracked([handoffDocPath, branchFreezeDocPath], 'handoff docs');

  for (const required of [
    'No deployment is performed by this PR.',
    'This does not approve deployment.',
    'Future preview deployment requires explicit later approval.',
    'Owner Review Decision Inputs',
    'review `docs/OWNER-REVIEW-READINESS-PACKAGE.md`',
    'review `docs/manual-qa/OWNER-REVIEW-MANUAL-QA.md`',
    'docs/content/OWNER-CONTENT-INTAKE.md',
    'docs/content/CONTENT-GAP-REGISTER.md',
    'docs/content/OWNER-REVIEW-ISSUE-LEDGER.md',
    'docs/content/OWNER-REVIEW-EXECUTION-CHECKLIST.md',
    'docs/content/OWNER-REVIEW-ROUTE-DECISION-MATRIX.md',
    'docs/content/OWNER-REVIEW-DRY-RUN-PACKET.md',
    'docs/content/OWNER-REVIEW-FINDINGS-DISPOSITION.md',
    'docs/content/OWNER-REVIEW-LAUNCH-DECISION-REHEARSAL.md',
    'docs/content/OWNER-REVIEW-CORRECTION-INTAKE.md',
    'docs/content/OWNER-REVIEW-LAUNCH-BLOCKER-FREEZE-GATE.md',
    'docs/content/OWNER-REVIEW-CORRECTION-PR-PLAN.md',
    'docs/content/OWNER-REVIEW-CLOSURE-PACKET.md',
    'docs/content/OWNER-REVIEW-CLOSURE-SIGN-OFF-TEMPLATE.md',
    'docs/content/OWNER-REVIEW-DEPLOYMENT-APPROVAL-SEPARATION.md',
    'docs/content/OWNER-DEMO-WALKTHROUGH.md',
    'docs/content/OWNER-DEMO-ISSUE-BACKLOG.md',
    'docs/content/LOCAL-RELEASE-CANDIDATE-ACCEPTANCE-MATRIX.md',
    'docs/content/LOCAL-ROUTE-INVENTORY-FREEZE.md',
    'docs/content/LOCAL-RELEASE-CANDIDATE-COMMAND-CENTRE.md',
    'docs/content/FINAL-LOCAL-OWNER-HANDOFF-PACK.md',
    'docs/content/LOCAL-ACCEPTANCE-TRIAGE-BOARD.md',
    'docs/content/DEPLOYMENT-DECISION-FIREWALL.md',
    'docs/content/QUOTE-ENQUIRY-WORKFLOW-ACCEPTANCE-CHECKLIST.md',
    'docs/content/QUOTE-ENQUIRY-WORKFLOW-ACCEPTANCE-CHECKLIST.md',
    '/admin/content-readiness',
    'Protected content readiness workspace',
    'Owner-review execution checklist',
    'Route-by-route decision matrix',
    'Owner-review dry-run packet',
    'findings disposition workflow',
    'launch hold/approve rehearsal',
    'Owner-review correction intake',
    'launch-blocker freeze gate',
    'correction PR plan',
    'Owner-review closure packet',
    'readiness sign-off template',
    'deployment approval separation',
    'Owner-demo walkthrough',
    'Owner-demo issue backlog',
    'Local release-candidate acceptance matrix',
    'Local route inventory freeze',
    'local release-candidate acceptance gate',
    'local release-candidate command centre',
    'final local owner handoff pack',
    'local acceptance triage board',
    'deployment decision firewall',
    'quote/enquiry workflow acceptance checklist',
    'quote/enquiry workflow acceptance checklist',
    'product acceptance hardening',
    'public journey review',
    'protected admin closure workspace',
    'What the owner should supply before launch',
    'What remains blocked until explicit approval',
    'Owner content blockers',
    'Missing real contact/legal/business-hour content does not get invented',
    'Public launch cannot proceed until required owner content and explicit deployment approval are both supplied',
    'Owner review can continue without deployment',
    'Approve preview deployment',
    'Approve future deployment separately',
    'Hold deployment',
    'Pivot to product polish',
    'Stop doing generic deployment-prep PRs',
    'What counts as a blocker',
    'What does not count as a blocker',
    'npm run validate:release-candidate',
    'npm run validate:deploy-dry-run',
    'npm run validate:preview-approval-package',
    'npm run validate:preview-smoke-harness',
    'npm run validate:preview-handoff',
    'npm run smoke:preview',
    'operator-only',
    'PR #121',
    phase2pMergeCommit,
    '<redacted>',
    '<reviewed externally>',
  ]) {
    assertIncludes(normalizedDocs, required, 'handoff docs');
  }

  assertNoMatch(docs, /https?:\/\/|www\./i, 'handoff docs');
  assertNoMatch(
    docs,
    /\b(?:sk|pk|rk|gh[pousr]|xox[baprs])_[A-Za-z0-9_-]{8,}\b/i,
    'handoff docs',
  );
  assertNoMatch(docs, /eyJ[A-Za-z0-9_-]{20,}/, 'handoff docs');
}

function assertOwnerReviewDocs() {
  const packageDoc = readRepoFile(ownerReviewPackagePath);
  const manualQa = readRepoFile(ownerManualQaPath);
  const combined = [packageDoc, manualQa].join('\n');
  const normalizedCombined = normalizeWhitespace(combined);

  assertTracked([ownerReviewPackagePath, ownerManualQaPath], 'owner review docs');

  for (const required of [
    'Ready for owner review',
    'Intentionally not implemented',
    'Public website journey readiness',
    'Admin listing/category/media readiness',
    'Quote/enquiry intake and admin triage readiness',
    'Known deferred capabilities',
    'Non-deployment decision status',
    'Owner go/no-go decision points',
    'Needs owner-supplied content',
    'Needs deployment approval later',
    'Explicitly deferred features',
    'Hold deployment',
    'Approve future deployment separately',
    'This package does not approve deployment and does not deploy anything.',
    'This manual QA runbook is non-live and does not approve deployment.',
    'Protected admin quote detail',
    'Protected content readiness workspace',
    'Not-found/recovery states',
    'docs/content/OWNER-CONTENT-INTAKE.md',
    'docs/content/CONTENT-GAP-REGISTER.md',
    'docs/content/OWNER-REVIEW-ISSUE-LEDGER.md',
    'docs/content/OWNER-REVIEW-EXECUTION-CHECKLIST.md',
    'docs/content/OWNER-REVIEW-ROUTE-DECISION-MATRIX.md',
    'docs/content/OWNER-REVIEW-DRY-RUN-PACKET.md',
    'docs/content/OWNER-REVIEW-FINDINGS-DISPOSITION.md',
    'docs/content/OWNER-REVIEW-LAUNCH-DECISION-REHEARSAL.md',
    'docs/content/OWNER-REVIEW-CORRECTION-INTAKE.md',
    'docs/content/OWNER-REVIEW-LAUNCH-BLOCKER-FREEZE-GATE.md',
    'docs/content/OWNER-REVIEW-CORRECTION-PR-PLAN.md',
    'docs/content/OWNER-REVIEW-CLOSURE-PACKET.md',
    'docs/content/OWNER-REVIEW-CLOSURE-SIGN-OFF-TEMPLATE.md',
    'docs/content/OWNER-REVIEW-DEPLOYMENT-APPROVAL-SEPARATION.md',
    'docs/content/OWNER-DEMO-WALKTHROUGH.md',
    'docs/content/OWNER-DEMO-ISSUE-BACKLOG.md',
    'docs/content/LOCAL-RELEASE-CANDIDATE-ACCEPTANCE-MATRIX.md',
    'docs/content/LOCAL-ROUTE-INVENTORY-FREEZE.md',
    'docs/content/LOCAL-RELEASE-CANDIDATE-COMMAND-CENTRE.md',
    'docs/content/FINAL-LOCAL-OWNER-HANDOFF-PACK.md',
    'docs/content/LOCAL-ACCEPTANCE-TRIAGE-BOARD.md',
    'docs/content/DEPLOYMENT-DECISION-FIREWALL.md',
    '/admin/content-readiness',
    'Owner content blockers',
    'Owner-review execution checklist',
    'Route-by-route decision matrix',
    'Owner-review dry-run packet',
    'findings disposition workflow',
    'launch hold/approve rehearsal',
    'Owner-review correction intake',
    'launch-blocker freeze gate',
    'correction PR plan',
    'Owner-review closure packet',
    'readiness sign-off template',
    'deployment approval separation',
    'Owner-demo walkthrough',
    'Owner-demo issue backlog',
    'Local release-candidate acceptance matrix',
    'Local route inventory freeze',
    'local release-candidate acceptance gate',
    'local release-candidate command centre',
    'final local owner handoff pack',
    'local acceptance triage board',
    'deployment decision firewall',
    'product acceptance hardening',
    'public journey review',
    'protected admin closure workspace',
    'Missing real contact/legal/business-hour content does not get invented',
    'Public launch cannot proceed until required owner content and explicit deployment approval are both supplied',
    'Owner review can continue without deployment',
  ]) {
    assertIncludes(normalizedCombined, required, 'owner review docs');
  }

  assertNoMatch(combined, /\bvercel\s+(?:deploy|link|env|pull|promote)\b/i, 'owner review docs');
  assertNoMatch(
    combined,
    /\bsupabase\s+(?:link|login|projects|secrets|functions|db\s+(?:push|pull|remote|reset))\b/i,
    'owner review docs',
  );
  assertNoMatch(
    combined,
    /\b(?:create|copy|edit|fill|commit|configure|add)\s+(?:a\s+)?`?\.env/i,
    'owner review docs',
  );
  assertNoMatch(combined, /\bnpm run smoke:preview\b|live preview smoke/i, 'owner review docs');
  assertNoMatch(
    combined,
    /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery/i,
    'owner review docs',
  );
}

function assertContentGovernanceDocs() {
  const intake = readRepoFile(ownerContentIntakePath);
  const register = readRepoFile(contentGapRegisterPath);
  const combined = [intake, register].join('\n');
  const normalizedCombined = normalizeWhitespace(combined);

  assertTracked([ownerContentIntakePath, contentGapRegisterPath], 'content governance docs');

  for (const required of [
    'Approved brand spelling and public display name',
    'Approved listing/product names',
    'Listing/category/event descriptions',
    'Image selection and alt text',
    'Public service-area wording',
    'Public contact details',
    'Business hours',
    'Operating expectations',
    'Legal/policy wording',
    'Admin access/workspace ownership expectations',
    'Owner input required',
    'Content Gap Register',
    'Brand and naming',
    'Public route copy',
    'Listings/categories/events',
    'Images and alt text',
    'Quote/enquiry expectations',
    'Admin access and operator ownership',
    'Launch/legal/policy/contact content',
    'Gap',
    'Impact',
    'Required owner input',
    'Launch blocker status',
    'Deferred / not required for current owner review',
    'Blocks owner review',
    'Blocks launch/deployment',
    'Deferred after launch',
    'Not in scope by owner direction',
    'Missing real contact/legal/business-hour content does not get invented',
    'Public launch cannot proceed until required owner content and explicit deployment approval are both supplied',
    'Owner review can continue without deployment',
  ]) {
    assertIncludes(normalizedCombined, required, 'content governance docs');
  }

  assertNoMatch(combined, /\bvercel\s+(?:deploy|link|env|pull|promote)\b/i, 'content governance docs');
  assertNoMatch(
    combined,
    /\bsupabase\s+(?:link|login|projects|secrets|functions|db\s+(?:push|pull|remote|reset))\b/i,
    'content governance docs',
  );
  assertNoMatch(
    combined,
    /\b(?:create|copy|edit|fill|commit|configure|add)\s+(?:a\s+)?`?\.env/i,
    'content governance docs',
  );
  assertNoMatch(
    combined,
    /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured/i,
    'content governance docs',
  );
  assertNoMatch(
    combined,
    /\b(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i,
    'content governance docs',
  );
}

function assertOwnerReviewIssueLedger() {
  const ledger = readRepoFile(ownerReviewLedgerPath);
  const normalizedLedger = normalizeWhitespace(ledger);

  assertTracked([ownerReviewLedgerPath], 'owner-review issue ledger');

  for (const required of [
    'Public copy',
    'Listing/category/event content',
    'Images and alt text',
    'Quote/enquiry expectations',
    'Admin operator ownership',
    'Legal/policy/contact gaps',
    'Launch/deployment blockers',
    'Owner input required',
    'Ready for owner review',
    'Blocks owner review',
    'Blocks launch/deployment',
    'Deferred after launch',
    'Not in scope by owner direction',
  ]) {
    assertIncludes(normalizedLedger, required, 'owner-review issue ledger');
  }

  assertNoMatch(ledger, /\bvercel\s+(?:deploy|link|env|pull|promote)\b/i, 'owner-review issue ledger');
  assertNoMatch(
    ledger,
    /\bsupabase\s+(?:link|login|projects|secrets|functions|db\s+(?:push|pull|remote|reset))\b/i,
    'owner-review issue ledger',
  );
  assertNoMatch(
    ledger,
    /\b(?:create|copy|edit|fill|commit|configure|add)\s+(?:a\s+)?`?\.env/i,
    'owner-review issue ledger',
  );
  assertNoMatch(
    ledger,
    /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy/i,
    'owner-review issue ledger',
  );
  assertNoMatch(
    ledger,
    /\b(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i,
    'owner-review issue ledger',
  );
}

function assertOwnerReviewExecutionChecklist() {
  const checklist = readRepoFile(ownerReviewExecutionChecklistPath);
  const normalizedChecklist = normalizeWhitespace(checklist);

  assertTracked([ownerReviewExecutionChecklistPath], 'owner-review execution checklist');

  for (const required of [
    'Public homepage',
    'Public catalogue/listings',
    'Public listing detail',
    'Public categories',
    'Public events/event-use guidance',
    'Public quote/enquiry request flow',
    'Public recovery/not-found states',
    'Protected admin overview',
    'Protected admin listings/categories/media',
    'Protected admin quote inbox/detail',
    'Protected admin content readiness workspace',
    'What to review',
    'Required owner decision',
    'Owner input required fields',
    'Launch/deployment blocker status',
    'Deferred/not-in-scope notes',
    'Public/admin visibility boundary',
    'Owner input required',
    'Blocks launch/deployment',
    'Not in scope by owner direction',
  ]) {
    assertIncludes(normalizedChecklist, required, 'owner-review execution checklist');
  }

  assertNoMatch(checklist, /\bvercel\s+(?:deploy|link|env|pull|promote)\b/i, 'owner-review execution checklist');
  assertNoMatch(
    checklist,
    /\bsupabase\s+(?:link|login|projects|secrets|functions|db\s+(?:push|pull|remote|reset))\b/i,
    'owner-review execution checklist',
  );
  assertNoMatch(
    checklist,
    /\b(?:create|copy|edit|fill|commit|configure|add)\s+(?:a\s+)?`?\.env/i,
    'owner-review execution checklist',
  );
  assertNoMatch(
    checklist,
    /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy/i,
    'owner-review execution checklist',
  );
  assertNoMatch(
    checklist,
    /\b(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i,
    'owner-review execution checklist',
  );
}

function assertOwnerReviewRouteDecisionMatrix() {
  const matrix = readRepoFile(ownerReviewRouteDecisionMatrixPath);
  const normalizedMatrix = normalizeWhitespace(matrix);

  assertTracked([ownerReviewRouteDecisionMatrixPath], 'owner-review route decision matrix');

  for (const required of [
    'Route',
    'Audience',
    'Review category',
    'Current readiness status',
    'Owner decision needed',
    'Blocks owner review?',
    'Blocks launch/deployment?',
    'Public-safe notes',
    'Admin-only notes',
    '`/`',
    '`/catalogue`',
    '`/listings`',
    '`/listings/[slug]`',
    '`/catalogue/[slug]`',
    '`/categories`',
    '`/categories/[slug]`',
    '`/events`',
    '`/quote`',
    'Public recovery/not-found',
    '`/admin`',
    '`/admin/listings`',
    '`/admin/categories`',
    '`/admin/media`',
    '`/admin/quotes`',
    '`/admin/quotes/[quoteRequestId]`',
    '`/admin/content-readiness`',
    'Owner input required',
    'Ready for owner review',
    'Blocks launch/deployment',
    'Deferred after launch',
    'Not in scope by owner direction',
  ]) {
    assertIncludes(normalizedMatrix, required, 'owner-review route decision matrix');
  }

  assertNoMatch(matrix, /\bvercel\s+(?:deploy|link|env|pull|promote)\b/i, 'owner-review route decision matrix');
  assertNoMatch(
    matrix,
    /\bsupabase\s+(?:link|login|projects|secrets|functions|db\s+(?:push|pull|remote|reset))\b/i,
    'owner-review route decision matrix',
  );
  assertNoMatch(
    matrix,
    /\b(?:create|copy|edit|fill|commit|configure|add)\s+(?:a\s+)?`?\.env/i,
    'owner-review route decision matrix',
  );
  assertNoMatch(
    matrix,
    /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy/i,
    'owner-review route decision matrix',
  );
  assertNoMatch(
    matrix,
    /\b(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i,
    'owner-review route decision matrix',
  );
}

function assertOwnerReviewDryRunPacket() {
  const packet = readRepoFile(ownerReviewDryRunPacketPath);
  const normalizedPacket = normalizeWhitespace(packet);

  assertTracked([ownerReviewDryRunPacketPath], 'owner-review dry-run packet');

  for (const required of [
    'dry-run/template only',
    'does not claim owner review has happened',
    'does not include filled owner-review evidence',
    'Public homepage',
    'Public catalogue/listings',
    'Public listing detail routes',
    'Public categories',
    'Public events/event-use guidance',
    'Public quote/enquiry request flow',
    'Public recovery/not-found states',
    'Protected admin overview',
    'Protected admin listings/categories/media',
    'Protected admin quote inbox/detail',
    'Protected admin content readiness workspace',
    'Review objective',
    'Questions for the owner',
    'Safe outcome statuses',
    'Owner input required placeholders',
    'Blocks owner review?',
    'Blocks launch/deployment?',
    'Deferred/not-in-scope notes',
    'Public/admin visibility boundary',
    'Owner input required',
    'Requires separate deployment approval',
  ]) {
    assertIncludes(normalizedPacket, required, 'owner-review dry-run packet');
  }

  assertNoMatch(packet, /\bvercel\s+(?:deploy|link|env|pull|promote)\b/i, 'owner-review dry-run packet');
  assertNoMatch(
    packet,
    /\bsupabase\s+(?:link|login|projects|secrets|functions|db\s+(?:push|pull|remote|reset))\b/i,
    'owner-review dry-run packet',
  );
  assertNoMatch(
    packet,
    /\b(?:create|copy|edit|fill|commit|configure|add)\s+(?:a\s+)?`?\.env/i,
    'owner-review dry-run packet',
  );
  assertNoMatch(
    packet,
    /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy/i,
    'owner-review dry-run packet',
  );
  assertNoMatch(
    packet,
    /\b(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i,
    'owner-review dry-run packet',
  );
  assertNoMatch(
    packet,
    /owner approved|owner sign-?off complete|actual finding|actual owner decision|review completed on|signed off by|production evidence captured|preview evidence captured/i,
    'owner-review dry-run packet',
  );
}

function assertOwnerReviewFindingsDisposition() {
  const disposition = readRepoFile(ownerReviewFindingsDispositionPath);
  const normalizedDisposition = normalizeWhitespace(disposition);

  assertTracked([ownerReviewFindingsDispositionPath], 'owner-review findings disposition');

  for (const required of [
    'No issue found',
    'Owner input required',
    'Change requested before owner review closes',
    'Blocks owner review',
    'Blocks launch/deployment',
    'Deferred after launch',
    'Not in scope by owner direction',
    'Requires separate deployment approval',
    'template table',
    '<review area>',
    '<finding summary placeholder>',
    '<safe status>',
    '<owner input placeholder>',
    '<next local action>',
    'Do not fill real findings in this PR',
    'does not claim real owner sign-off',
    'does not add production evidence',
    'does not add preview evidence',
  ]) {
    assertIncludes(normalizedDisposition, required, 'owner-review findings disposition');
  }

  assertNoMatch(disposition, /\bvercel\s+(?:deploy|link|env|pull|promote)\b/i, 'owner-review findings disposition');
  assertNoMatch(
    disposition,
    /\bsupabase\s+(?:link|login|projects|secrets|functions|db\s+(?:push|pull|remote|reset))\b/i,
    'owner-review findings disposition',
  );
  assertNoMatch(
    disposition,
    /\b(?:create|copy|edit|fill|commit|configure|add)\s+(?:a\s+)?`?\.env/i,
    'owner-review findings disposition',
  );
  assertNoMatch(
    disposition,
    /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy/i,
    'owner-review findings disposition',
  );
  assertNoMatch(
    disposition,
    /\b(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i,
    'owner-review findings disposition',
  );
  assertNoMatch(
    disposition,
    /owner approved|owner sign-?off complete|actual finding|actual owner decision|review completed on|signed off by|production evidence captured|preview evidence captured/i,
    'owner-review findings disposition',
  );
}

function assertOwnerReviewLaunchDecisionRehearsal() {
  const rehearsal = readRepoFile(ownerReviewLaunchDecisionRehearsalPath);
  const normalizedRehearsal = normalizeWhitespace(rehearsal);

  assertTracked([ownerReviewLaunchDecisionRehearsalPath], 'owner-review launch decision rehearsal');

  for (const required of [
    'Continue owner review',
    'Hold launch',
    'Ready for later deployment planning',
    'Approve future deployment separately',
    'This phase does not approve deployment',
    'Any future deployment approval must be explicit and separate',
    'Missing owner-required facts keep launch blocked',
    'No production evidence is created',
    'No provider config is changed',
    'template language only',
    'not real owner decisions',
    'Requires separate deployment approval',
  ]) {
    assertIncludes(normalizedRehearsal, required, 'owner-review launch decision rehearsal');
  }

  assertNoMatch(rehearsal, /\bvercel\s+(?:deploy|link|env|pull|promote)\b/i, 'owner-review launch decision rehearsal');
  assertNoMatch(
    rehearsal,
    /\bsupabase\s+(?:link|login|projects|secrets|functions|db\s+(?:push|pull|remote|reset))\b/i,
    'owner-review launch decision rehearsal',
  );
  assertNoMatch(
    rehearsal,
    /\b(?:create|copy|edit|fill|commit|configure|add)\s+(?:a\s+)?`?\.env/i,
    'owner-review launch decision rehearsal',
  );
  assertNoMatch(
    rehearsal,
    /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy/i,
    'owner-review launch decision rehearsal',
  );
  assertNoMatch(
    rehearsal,
    /\b(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i,
    'owner-review launch decision rehearsal',
  );
  assertNoMatch(
    rehearsal,
    /owner approved|owner sign-?off complete|actual finding|actual owner decision|review completed on|signed off by|production evidence captured|preview evidence captured/i,
    'owner-review launch decision rehearsal',
  );
}

function assertOwnerReviewCorrectionIntake() {
  const intake = readRepoFile(ownerReviewCorrectionIntakePath);
  const normalizedIntake = normalizeWhitespace(intake);

  assertTracked([ownerReviewCorrectionIntakePath], 'owner-review correction intake');

  for (const required of [
    'repo-local and template-only',
    'No actual owner corrections are recorded in this phase',
    'No owner sign-off is recorded',
    'No deployment approval is created',
    'Missing owner facts remain `Owner input required`',
    'Public homepage copy',
    'Public catalogue/listing summary copy',
    'Public listing detail copy',
    'Category/event-use wording',
    'Quote/enquiry expectation wording',
    'Image selection and alt text',
    'Protected admin listing/category/media workflow',
    'Protected admin quote workflow',
    'Legal/policy/contact/business-hour content',
    'Launch/deployment approval boundary',
    'Correction template only',
    'Owner input required',
    'Ready for local correction PR',
    'Blocks owner review',
    'Blocks launch/deployment',
    'Deferred after launch',
    'Not in scope by owner direction',
    'Requires separate deployment approval',
    '<correction category>',
    '<owner correction placeholder>',
    '<safe correction status>',
    '<future local PR placeholder>',
    '<evidence handling placeholder>',
  ]) {
    assertIncludes(normalizedIntake, required, 'owner-review correction intake');
  }

  assertNoMatch(intake, /\bvercel\s+(?:deploy|link|env|pull|promote)\b/i, 'owner-review correction intake');
  assertNoMatch(
    intake,
    /\bsupabase\s+(?:link|login|projects|secrets|functions|db\s+(?:push|pull|remote|reset))\b/i,
    'owner-review correction intake',
  );
  assertNoMatch(
    intake,
    /\b(?:create|copy|edit|fill|commit|configure|add)\s+(?:a\s+)?`?\.env/i,
    'owner-review correction intake',
  );
  assertNoMatch(
    intake,
    /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy/i,
    'owner-review correction intake',
  );
  assertNoMatch(
    intake,
    /\b(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i,
    'owner-review correction intake',
  );
  assertNoMatch(
    intake,
    /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|production evidence captured|preview evidence captured/i,
    'owner-review correction intake',
  );
}

function assertOwnerReviewLaunchBlockerFreezeGate() {
  const freezeGate = readRepoFile(ownerReviewLaunchBlockerFreezeGatePath);
  const normalizedFreezeGate = normalizeWhitespace(freezeGate);

  assertTracked([ownerReviewLaunchBlockerFreezeGatePath], 'owner-review launch-blocker freeze gate');

  for (const required of [
    'repo-local gate',
    'does not approve launch or deployment',
    'Owner-review blockers',
    'Launch/deployment blockers',
    'Deferred after launch',
    'Not in scope by owner direction',
    'Requires separate deployment approval',
    'Not evaluated',
    'Owner input required',
    'Blocked before owner review closes',
    'Blocked before launch planning',
    'Ready for later planning, not deployment approval',
    'Public launch remains blocked until owner-required facts and explicit deployment approval both exist',
    'No production evidence is created',
    'No preview evidence is filled',
    'No provider config is changed',
    'No route, upload, account, notification, CRM, Pinecone, n8n, or RAG runtime is added',
    '<freeze area>',
    '<freeze state>',
    '<owner input placeholder>',
    '<local blocker placeholder>',
  ]) {
    assertIncludes(normalizedFreezeGate, required, 'owner-review launch-blocker freeze gate');
  }

  assertNoMatch(freezeGate, /\bvercel\s+(?:deploy|link|env|pull|promote)\b/i, 'owner-review launch-blocker freeze gate');
  assertNoMatch(
    freezeGate,
    /\bsupabase\s+(?:link|login|projects|secrets|functions|db\s+(?:push|pull|remote|reset))\b/i,
    'owner-review launch-blocker freeze gate',
  );
  assertNoMatch(
    freezeGate,
    /\b(?:create|copy|edit|fill|commit|configure|add)\s+(?:a\s+)?`?\.env/i,
    'owner-review launch-blocker freeze gate',
  );
  assertNoMatch(
    freezeGate,
    /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy/i,
    'owner-review launch-blocker freeze gate',
  );
  assertNoMatch(
    freezeGate,
    /\b(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i,
    'owner-review launch-blocker freeze gate',
  );
  assertNoMatch(
    freezeGate,
    /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|production evidence captured|preview evidence captured/i,
    'owner-review launch-blocker freeze gate',
  );
}

function assertOwnerReviewCorrectionPrPlan() {
  const plan = readRepoFile(ownerReviewCorrectionPrPlanPath);
  const normalizedPlan = normalizeWhitespace(plan);

  assertTracked([ownerReviewCorrectionPrPlanPath], 'owner-review correction PR plan');

  for (const required of [
    'does not implement actual owner corrections',
    'Public copy correction PR',
    'Listing/category content correction PR',
    'Image/alt-text correction PR',
    'Quote/enquiry wording correction PR',
    'Protected admin workflow wording correction PR',
    'Legal/policy/contact content PR',
    'only when owner supplies approved content',
    'Deployment planning PR',
    'only after separate explicit approval',
    'Allowed changes',
    'Forbidden changes',
    'Required validation',
    'Evidence handling',
    'repo-local and non-deployment',
  ]) {
    assertIncludes(normalizedPlan, required, 'owner-review correction PR plan');
  }

  assertNoMatch(plan, /\bvercel\s+(?:deploy|link|env|pull|promote)\b/i, 'owner-review correction PR plan');
  assertNoMatch(
    plan,
    /\bsupabase\s+(?:link|login|projects|secrets|functions|db\s+(?:push|pull|remote|reset))\b/i,
    'owner-review correction PR plan',
  );
  assertNoMatch(
    plan,
    /\b(?:create|copy|edit|fill|commit|configure|add)\s+(?:a\s+)?`?\.env/i,
    'owner-review correction PR plan',
  );
  assertNoMatch(
    plan,
    /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy/i,
    'owner-review correction PR plan',
  );
  assertNoMatch(
    plan,
    /\b(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i,
    'owner-review correction PR plan',
  );
  assertNoMatch(
    plan,
    /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|production evidence captured|preview evidence captured/i,
    'owner-review correction PR plan',
  );
}

function assertOwnerReviewClosurePacket() {
  const packet = readRepoFile(ownerReviewClosurePacketPath);
  const normalizedPacket = normalizeWhitespace(packet);

  assertTracked([ownerReviewClosurePacketPath], 'owner-review closure packet');

  for (const required of [
    'repo-local and template-only',
    'This is not deployment approval',
    'This is not owner sign-off',
    'This is not preview evidence',
    'Owner review can continue',
    'Owner review is blocked',
    'Owner review is locally ready to close',
    'Launch/deployment remains separately blocked unless explicitly approved',
    'Owner-review closure readiness',
    'Deployment approval',
    'Preview evidence',
    'Production launch',
    'Post-launch monitoring',
    '[OWNER NAME / ROLE]',
    '[REVIEW DATE]',
    '[ROUTE / AREA]',
    '[DECISION: CONTINUE / BLOCKED / READY TO CLOSE]',
    '[OPEN ITEM SUMMARY]',
    '[REQUIRED FOLLOW-UP]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
  ]) {
    assertIncludes(normalizedPacket, required, 'owner-review closure packet');
  }

  assertNoMatch(packet, /\bvercel\s+(?:deploy|link|env|pull|promote)\b/i, 'owner-review closure packet');
  assertNoMatch(
    packet,
    /\bsupabase\s+(?:link|login|projects|secrets|functions|db\s+(?:push|pull|remote|reset))\b/i,
    'owner-review closure packet',
  );
  assertNoMatch(
    packet,
    /\b(?:create|copy|edit|fill|commit|configure|add)\s+(?:a\s+)?`?\.env/i,
    'owner-review closure packet',
  );
  assertNoMatch(
    packet,
    /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy/i,
    'owner-review closure packet',
  );
  assertNoMatch(
    packet,
    /\b(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i,
    'owner-review closure packet',
  );
  assertNoMatch(
    packet,
    /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|production evidence captured|preview evidence captured|actual owner decision|actual owner sign-off/i,
    'owner-review closure packet',
  );
}

function assertOwnerReviewClosureSignoffTemplate() {
  const signoff = readRepoFile(ownerReviewClosureSignoffTemplatePath);
  const normalizedSignoff = normalizeWhitespace(signoff);

  assertTracked([ownerReviewClosureSignoffTemplatePath], 'owner-review closure sign-off template');

  for (const required of [
    'Owner-review closure readiness does not approve deployment, preview publication, production launch, provider configuration, or live smoke testing.',
    'Owner-review closure decision',
    'Remaining blockers',
    'Routes/areas reviewed',
    'Corrections still pending',
    'Corrections accepted as locally resolved',
    'Items explicitly deferred',
    'No deployment approval is implied',
    'launch/deployment remains separately blocked unless explicitly approved',
    '[OWNER NAME / ROLE]',
    '[REVIEW DATE]',
    '[ROUTE / AREA]',
    '[DECISION: CONTINUE / BLOCKED / READY TO CLOSE]',
    '[OPEN ITEM SUMMARY]',
    '[REQUIRED FOLLOW-UP]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
  ]) {
    assertIncludes(normalizedSignoff, required, 'owner-review closure sign-off template');
  }

  assertNoMatch(signoff, /\bvercel\s+(?:deploy|link|env|pull|promote)\b/i, 'owner-review closure sign-off template');
  assertNoMatch(
    signoff,
    /\bsupabase\s+(?:link|login|projects|secrets|functions|db\s+(?:push|pull|remote|reset))\b/i,
    'owner-review closure sign-off template',
  );
  assertNoMatch(
    signoff,
    /\b(?:create|copy|edit|fill|commit|configure|add)\s+(?:a\s+)?`?\.env/i,
    'owner-review closure sign-off template',
  );
  assertNoMatch(
    signoff,
    /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy/i,
    'owner-review closure sign-off template',
  );
  assertNoMatch(
    signoff,
    /\b(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i,
    'owner-review closure sign-off template',
  );
  assertNoMatch(
    signoff,
    /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|production evidence captured|preview evidence captured|actual owner decision|actual owner sign-off/i,
    'owner-review closure sign-off template',
  );
}

function assertOwnerReviewDeploymentApprovalSeparation() {
  const separation = readRepoFile(ownerReviewDeploymentApprovalSeparationPath);
  const normalizedSeparation = normalizeWhitespace(separation);

  assertTracked([ownerReviewDeploymentApprovalSeparationPath], 'owner-review deployment approval separation');

  for (const required of [
    'Owner review continues',
    'Review is still ongoing',
    'Update template placeholders and local docs only',
    'Deployment or filled evidence',
    'Owner review blocked',
    'Review cannot close because blockers remain',
    'Track blockers locally',
    'Pretend sign-off happened',
    'Owner review ready to close',
    'Local templates suggest review may be closable',
    'Prepare owner-facing closure packet',
    'Deploy or approve launch',
    'Deployment approved',
    'Explicit future owner approval only',
    'Future deployment workflow may begin',
    'Must not be assumed in Phase 3P',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
  ]) {
    assertIncludes(normalizedSeparation, required, 'owner-review deployment approval separation');
  }

  assertNoMatch(separation, /\bvercel\s+(?:deploy|link|env|pull|promote)\b/i, 'owner-review deployment approval separation');
  assertNoMatch(
    separation,
    /\bsupabase\s+(?:link|login|projects|secrets|functions|db\s+(?:push|pull|remote|reset))\b/i,
    'owner-review deployment approval separation',
  );
  assertNoMatch(
    separation,
    /\b(?:create|copy|edit|fill|commit|configure|add)\s+(?:a\s+)?`?\.env/i,
    'owner-review deployment approval separation',
  );
  assertNoMatch(
    separation,
    /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy/i,
    'owner-review deployment approval separation',
  );
  assertNoMatch(
    separation,
    /\b(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i,
    'owner-review deployment approval separation',
  );
  assertNoMatch(
    separation,
    /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|production evidence captured|preview evidence captured|actual owner decision|actual owner sign-off/i,
    'owner-review deployment approval separation',
  );
}

function assertOwnerDemoWalkthrough() {
  const walkthrough = readRepoFile(ownerDemoWalkthroughPath);
  const normalizedWalkthrough = normalizeWhitespace(walkthrough);

  assertTracked([ownerDemoWalkthroughPath], 'owner-demo walkthrough');

  for (const required of [
    'This walkthrough is repo-local, template-only, and non-live.',
    'Public homepage review',
    'Public catalogue/listing review',
    'Public category/event-use review',
    'Public quote/enquiry request review',
    'Protected admin overview review',
    'Protected admin listing/category/media review',
    'Protected admin quote workflow review',
    'Protected content readiness / closure workspace review',
    'What the owner should check',
    'What remains owner input required',
    'What remains blocked until explicit later approval',
    'This must not be treated as deployment approval',
    '[OWNER REVIEWER]',
    '[REVIEW DATE]',
    '[ROUTE REVIEWED]',
    '[OWNER INPUT REQUIRED]',
    '[LOCAL ISSUE / FOLLOW-UP]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
  ]) {
    assertIncludes(normalizedWalkthrough, required, 'owner-demo walkthrough');
  }

  assertNoMatch(walkthrough, /\bvercel\s+(?:deploy|link|env|pull|promote)\b/i, 'owner-demo walkthrough');
  assertNoMatch(
    walkthrough,
    /\bsupabase\s+(?:link|login|projects|secrets|functions|db\s+(?:push|pull|remote|reset))\b/i,
    'owner-demo walkthrough',
  );
  assertNoMatch(
    walkthrough,
    /\b(?:create|copy|edit|fill|commit|configure|add)\s+(?:a\s+)?`?\.env/i,
    'owner-demo walkthrough',
  );
  assertNoMatch(
    walkthrough,
    /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy/i,
    'owner-demo walkthrough',
  );
  assertNoMatch(
    walkthrough,
    /\b(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i,
    'owner-demo walkthrough',
  );
  assertNoMatch(walkthrough, forbiddenTransactionTermPattern, 'owner-demo walkthrough');
  assertNoMatch(
    walkthrough,
    /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|production evidence captured|preview evidence captured|actual owner decision|actual owner sign-off/i,
    'owner-demo walkthrough',
  );
}

function assertOwnerDemoIssueBacklog() {
  const backlog = readRepoFile(ownerDemoIssueBacklogPath);
  const normalizedBacklog = normalizeWhitespace(backlog);

  assertTracked([ownerDemoIssueBacklogPath], 'owner-demo issue backlog');

  for (const required of [
    'This backlog is repo-local, template-only, and non-live.',
    'Public Route Issue Template',
    'Listing/Category/Media Issue Template',
    'Quote/Enquiry Workflow Issue Template',
    'Protected Admin Workflow Issue Template',
    'Content Readiness / Closure Workspace Issue Template',
    'Product polish',
    'Owner input required',
    'Blocks owner review',
    'Blocks future launch/deployment',
    'Deferred after launch',
    'Not in current scope',
    '[ISSUE ID]',
    '[ROUTE / AREA]',
    '[PUBLIC OR ADMIN]',
    '[OBSERVED ISSUE]',
    '[OWNER INPUT REQUIRED]',
    '[LOCAL FOLLOW-UP]',
    '[STATUS: OPEN / OWNER INPUT REQUIRED / LOCALLY RESOLVED / DEFERRED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
  ]) {
    assertIncludes(normalizedBacklog, required, 'owner-demo issue backlog');
  }

  assertNoMatch(backlog, /\bvercel\s+(?:deploy|link|env|pull|promote)\b/i, 'owner-demo issue backlog');
  assertNoMatch(
    backlog,
    /\bsupabase\s+(?:link|login|projects|secrets|functions|db\s+(?:push|pull|remote|reset))\b/i,
    'owner-demo issue backlog',
  );
  assertNoMatch(
    backlog,
    /\b(?:create|copy|edit|fill|commit|configure|add)\s+(?:a\s+)?`?\.env/i,
    'owner-demo issue backlog',
  );
  assertNoMatch(
    backlog,
    /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy/i,
    'owner-demo issue backlog',
  );
  assertNoMatch(
    backlog,
    /\b(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i,
    'owner-demo issue backlog',
  );
  assertNoMatch(backlog, forbiddenTransactionTermPattern, 'owner-demo issue backlog');
  assertNoMatch(
    backlog,
    /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|production evidence captured|preview evidence captured|actual owner decision|actual owner sign-off/i,
    'owner-demo issue backlog',
  );
}

function assertLocalReleaseCandidateDocs() {
  const matrix = readRepoFile(localReleaseCandidateAcceptanceMatrixPath);
  const routeFreeze = readRepoFile(localRouteInventoryFreezePath);
  const commandCentre = readRepoFile(localReleaseCandidateCommandCentrePath);
  const finalOwnerHandoffPack = readRepoFile(finalOwnerHandoffPackPath);
  const localAcceptanceTriageBoard = readRepoFile(localAcceptanceTriageBoardPath);
  const deploymentDecisionFirewall = readRepoFile(deploymentDecisionFirewallPath);
  const quoteWorkflowChecklist = readRepoFile(quoteWorkflowChecklistPath);
  const catalogueListingMediaChecklist = readRepoFile(catalogueListingMediaChecklistPath);
  const protectedAdminWriteOpsChecklist = readRepoFile(protectedAdminWriteOpsChecklistPath);
  const protectedAdminDestructiveActionSafeguards = readRepoFile(protectedAdminDestructiveActionSafeguardsPath);
  const protectedAdminRecoveryLane = readRepoFile(protectedAdminRecoveryLanePath);
  const protectedAdminStatusTransitionMatrix = readRepoFile(protectedAdminStatusTransitionMatrixPath);
  const suiteRunner = readRepoFile(suiteRunnerPath);
  const combined = [
    matrix,
    routeFreeze,
    commandCentre,
    finalOwnerHandoffPack,
    localAcceptanceTriageBoard,
    deploymentDecisionFirewall,
    quoteWorkflowChecklist,
    catalogueListingMediaChecklist,
    protectedAdminWriteOpsChecklist,
    protectedAdminDestructiveActionSafeguards,
    protectedAdminRecoveryLane,
    protectedAdminStatusTransitionMatrix,
  ].join('\n');
  const normalizedCombined = normalizeWhitespace(combined);

  assertTracked(
    [
      localReleaseCandidateAcceptanceMatrixPath,
      localRouteInventoryFreezePath,
      localReleaseCandidateCommandCentrePath,
      finalOwnerHandoffPackPath,
      localAcceptanceTriageBoardPath,
      deploymentDecisionFirewallPath,
      quoteWorkflowChecklistPath,
      catalogueListingMediaChecklistPath,
      protectedAdminWriteOpsChecklistPath,
      protectedAdminDestructiveActionSafeguardsPath,
      protectedAdminRecoveryLanePath,
      protectedAdminStatusTransitionMatrixPath,
      suiteRunnerPath,
    ],
    'local release-candidate docs',
  );

  for (const required of [
    'This matrix is repo-local, template-only, non-live, and not evidence.',
    'Public route inventory',
    'Protected admin route inventory',
    'Allowed public wording',
    'Forbidden public wording',
    '[ACCEPTANCE STATUS: NOT RUN / PASS / NEEDS FOLLOW-UP]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
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
    'Listing Write-Operation Expectations',
    'Category Write-Operation Expectations',
    'Media Write-Operation Expectations',
    'Quote Follow-Up Write-Operation Expectations',
    '[PROTECTED ADMIN WRITE CHECK]',
    '[WRITE BOUNDARY]',
    'Protected admin quote inbox/detail',
    'Protected content readiness workspace',
    'This command centre is repo-local, template-only, non-live, and not evidence.',
    'Safe local command groups',
    'Forbidden commands',
    'Local acceptance-suite sequence',
    '[COMMAND GROUP]',
    '[COMMAND]',
    '[LOCAL PURPOSE]',
    '[PASS / FAIL / NOT RUN]',
    'Current candidate purpose',
    'Public route review summary',
    'Protected admin review summary',
    'Local release-candidate suite summary',
    'Owner input still required',
    'Local follow-up categories',
    'Deployment decision firewall',
    'Failure reporting without evidence files',
    'Public route polish',
    'Listing/category/media content',
    'Quote/enquiry flow',
    'Protected admin workflow',
    'Local suite failure',
    'Future deployment blocker',
    'Deferred after launch',
    'Not in current scope',
    'Local acceptance readiness',
    'Owner review readiness',
    'Owner sign-off',
    'Provider configuration',
    'Preview publication',
    'Production launch',
    'Post-launch monitoring',
    'Public quote/enquiry route expectations',
    'Public Catalogue Route Expectations',
    'Public Listing Detail Expectations',
    'Public Category Route Expectations',
    'Public Event-Use Handoff Expectations',
    'Protected Admin Listing Category Media Expectations',
    'Media And Alt-Text Expectations',
    'Listing/category/event handoff expectations',
    'Protected admin quote triage expectations',
    'Public copy allowed wording',
    'Public copy forbidden wording',
    'Admin-only internal note boundary',
    'Local acceptance placeholders',
    'event date',
    'venue or location',
    'requested listings or items',
    'quantities',
    'alternatives',
    'setup/access/timing notes',
    'preferred contact method',
    'Request this listing',
    'Send category enquiry',
    'Compare event setup guidance',
    'Start quote request',
    'contact and follow-up',
    'event and setup details',
    'requested listings and items',
    'admin-only status and notes',
    '[OWNER REVIEWER]',
    '[REVIEW DATE]',
    '[ROUTE / AREA]',
    '[PUBLIC / PROTECTED ADMIN]',
    '[CATALOGUE / LISTING / MEDIA CHECK]',
    '[LOCAL ACCEPTANCE STATE: NOT RUN / PASS / NEEDS FOLLOW-UP]',
    '[OWNER INPUT REQUIRED]',
    '[LOCAL FOLLOW-UP]',
    '[BLOCKER TYPE]',
    '[TRIAGE ID]',
    '[LANE]',
    '[OBSERVED ITEM]',
    '[STATUS: OPEN / OWNER INPUT REQUIRED / LOCALLY RESOLVED / DEFERRED / OUT OF SCOPE]',
    '[DECISION OWNER]',
    '[DECISION DATE]',
    '[DECISION: NOT GRANTED / GRANTED IN FUTURE SEPARATE LANE]',
    '[SCOPE IF GRANTED]',
    '[QUOTE / ENQUIRY CHECK]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
  ]) {
    assertIncludes(normalizedCombined, required, 'local release-candidate docs');
  }

  assertNoMatch(combined, /\bvercel\s+(?:deploy|link|env|pull|promote)\b/i, 'local release-candidate docs');
  assertNoMatch(
    combined,
    /\bsupabase\s+(?:link|login|projects|secrets|functions|db\s+(?:push|pull|remote|reset))\b/i,
    'local release-candidate docs',
  );
  assertNoMatch(
    combined,
    /\b(?:create|copy|edit|fill|commit|configure|add)\s+(?:a\s+)?`?\.env/i,
    'local release-candidate docs',
  );
  assertNoMatch(
    combined.replace(/No guaranteed availability/g, 'No availability guarantee'),
    /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy/i,
    'local release-candidate docs',
  );
  assertNoMatch(
    combined,
    /\b(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i,
    'local release-candidate docs',
  );
  assertNoMatch(
    combined,
    /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|production evidence captured|preview evidence captured|actual owner decision|actual owner sign-off|manual QA completed|acceptance passed on/i,
    'local release-candidate docs',
  );

  for (const required of [
    'validate:preview-approval-package',
    'validate:preview-smoke-harness',
    'validate:preview-handoff',
    'validate:local-release-candidate',
    'validate:supabase-migrations',
    'test:supabase-seed',
    'test:supabase-rls',
    'validate:n8n',
    'test:n8n-validation',
    'website:test',
    'website:typecheck',
    'website:build',
    'Local release-candidate suite passed. No deployment was performed. This does not approve deployment.',
  ]) {
    assertIncludes(suiteRunner, required, 'local release-candidate suite runner');
  }

  assertNoMatch(suiteRunner, /\bvercel\s+(?:deploy|link|env|pull|promote)\b/i, 'local release-candidate suite runner');
  assertNoMatch(
    suiteRunner,
    /\bsupabase\s+(?:link|login|secrets|projects|functions|db\s+(?:push|pull|remote|reset))\b/i,
    'local release-candidate suite runner',
  );
  const forbiddenRunnerNetworkPattern = new RegExp(
    ['smoke:preview', 'cu' + 'rl\\b', 'fet' + 'ch\\s*\\(', 'https?:\\/\\/', 'www\\.'].join('|'),
    'i',
  );
  assertNoMatch(suiteRunner, forbiddenRunnerNetworkPattern, 'local release-candidate suite runner');
  assertNoMatch(
    suiteRunner,
    /docs\/(?:evidence|preview-evidence|production-evidence|owner-review-evidence)/i,
    'local release-candidate suite runner',
  );
  assertNoMatch(suiteRunner, /(?:^|[\\/])\.env(?:\.|$)|website\/chat-config\.js/i, 'local release-candidate suite runner');
}


function assertPublicReadinessClosureDocs() {
  assertTracked(
    [
      publicJourneyReadinessClosurePath,
      quotePublicExpectationBoundaryPath,
      protectedAdminPublicReviewBridgePath,
    ],
    'Phase 3Z public readiness docs',
  );

  const combined = [
    readRepoFile(publicJourneyReadinessClosurePath),
    readRepoFile(quotePublicExpectationBoundaryPath),
    readRepoFile(protectedAdminPublicReviewBridgePath),
  ].join('\n');
  const normalized = normalizeWhitespace(combined);

  for (const required of [
    'repo-local, template-only, non-live, and not evidence',
    'Homepage',
    'Listings route',
    'Listing detail route',
    'Catalogue/category routes where present',
    'Events/event-use route where present',
    'Quote/enquiry request route',
    'Public not-found/recovery states',
    'No guaranteed availability',
    'No confirmed booking',
    'No public quote tracking',
    'No payment/order/checkout wording',
    'No customer account',
    'No upload/self-service workflow',
    'Public confirmation is receipt-style only',
    'Safe public copy examples',
    'Unsafe public copy examples',
    'Public-safe',
    'Owner input required',
    'Keep protected',
    'Needs local correction',
    'Admin-only detail',
    'Blocked before public visibility',
    'Requires separate deployment approval',
    '[LOCAL ACCEPTANCE: NOT RUN / PASS / NEEDS FOLLOW-UP]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
  ]) {
    assertIncludes(normalized, required, 'Phase 3Z public readiness docs');
  }

  assertNoMatch(
    combined,
    /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|production evidence captured|preview evidence captured|actual owner decision|actual owner sign-off|manual QA completed|acceptance passed on/i,
    'Phase 3Z public readiness docs',
  );
  assertNoMatch(
    combined,
    /\b(?!(?:\d{4}-\d{2}-\d{2})\b)(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i,
    'Phase 3Z public readiness docs',
  );
}


function assertPhase4aReleaseControl() {
  assertTracked(
    [
      phase4aLocalReleaseControlGatePath,
      ownerReviewRehearsalRunbookPath,
      deploymentApprovalFirewallMatrixPath,
      ownerInputIntakeControlPath,
      localCorrectionQueuePath,
      reviewReadyHandoffClosurePath,
      releaseControlRoutePath,
    ],
    'Phase 4A/4B release-control docs and route',
  );

  const phase4aDocs = [
    readRepoFile(phase4aLocalReleaseControlGatePath),
    readRepoFile(ownerReviewRehearsalRunbookPath),
    readRepoFile(deploymentApprovalFirewallMatrixPath),
  ].join('\n');
  const phase4bDocs = [
    readRepoFile(ownerInputIntakeControlPath),
    readRepoFile(localCorrectionQueuePath),
    readRepoFile(reviewReadyHandoffClosurePath),
  ].join('\n');
  const normalized4a = normalizeWhitespace(phase4aDocs);
  const normalized4b = normalizeWhitespace(phase4bDocs);
  const statusDocs = normalizeWhitespace(
    [
      readRepoFile('docs/PHASE-STATUS.md'),
      readRepoFile('docs/PHASE-ROADMAP.md'),
      readRepoFile('docs/PHASE-2-READINESS-PLAN.md'),
      readRepoFile('docs/DECISION-LOG.md'),
      readRepoFile('docs/checklists/PHASE-2-ADMIN-OPS.md'),
      readRepoFile('docs/OWNER-REVIEW-READINESS-PACKAGE.md'),
      readRepoFile('docs/manual-qa/OWNER-REVIEW-MANUAL-QA.md'),
      readRepoFile('docs/PREVIEW-DEPLOYMENT-HANDOFF.md'),
    ].join('\n'),
  );
  const shell = readRepoFile(protectedAdminShellPath);
  const route = readRepoFile(releaseControlRoutePath);

  for (const required of [
    'Local review ready',
    'Owner input required',
    'Local correction required',
    'Protected admin review required',
    'Blocked before public visibility',
    'Blocked before deployment planning',
    'Requires separate deployment approval',
    'Public route readiness',
    'Quote/enquiry expectation boundary',
    'Listing/category/media readiness',
    'Protected admin write/destructive-action safeguards',
    'Public leakage boundary',
    'Fake-fact/business-claim boundary',
    'Provider/runtime/deployment boundary',
    'Local acceptance command boundary',
    'No owner feedback is recorded',
    'No owner sign-off is recorded',
    'No deployment approval is granted',
    'No preview/production evidence is created',
    'Actual deployment',
    'Production launch',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
  ]) {
    assertIncludes(normalized4a, required, 'Phase 4A release-control docs');
  }

  for (const required of [
    'Public homepage wording',
    'Public listing/category/event-use wording',
    'Listing detail facts',
    'Image selection and alt text',
    'Quote/enquiry expectation wording',
    'Contact/business-hour/service-area facts',
    'Legal/policy/guarantee wording',
    'Protected admin operator ownership',
    'Deployment approval',
    'Owner input needed',
    'Current safe placeholder',
    'Public exposure boundary',
    'Admin-only handling',
    'Local correction lane',
    'Deployment approval boundary',
    'Not evaluated',
    'Owner input required',
    'Ready for local correction',
    'Local correction in progress',
    'Local correction complete',
    'Blocked before public visibility',
    'Blocked before deployment planning',
    'Requires separate deployment approval',
    'Public copy',
    'Listing/category content',
    'Media/alt text',
    'Quote/enquiry wording',
    'Protected admin helper text',
    'Admin workflow privacy',
    'Fake-fact removal',
    'Public leakage removal',
    'Provider/deployment boundary',
    'Local review ready',
    'Local correction required',
    'Protected admin review required',
    'Public visibility blocked',
    'Deployment planning blocked',
    'No owner feedback recorded',
    'No owner sign-off recorded',
    'No preview evidence created',
    'No production evidence created',
    'No deployment approval granted',
    '[NOT EVIDENCE / NOT RECORDED]',
  ]) {
    assertIncludes(normalized4b, required, 'Phase 4B owner-input correction docs');
  }

  for (const required of [
    'Current phase: Phase 4B-A/B',
    'Latest completed capability: Phase 4A-A/B local release-control gate, owner-review rehearsal, and deployment approval firewall',
    'Last merged capability PR: #149',
    phase4aMergeCommit,
    ownerInputIntakeControlPath,
    localCorrectionQueuePath,
    reviewReadyHandoffClosurePath,
  ]) {
    assertIncludes(statusDocs, required, 'Phase 4B status docs');
  }

  for (const required of [
    phase4aLocalReleaseControlGatePath,
    ownerReviewRehearsalRunbookPath,
    deploymentApprovalFirewallMatrixPath,
    ownerInputIntakeControlPath,
    localCorrectionQueuePath,
    reviewReadyHandoffClosurePath,
    'phase4bOwnerInputCorrectionSnapshot',
    'ownerInputIntakeCategories',
    'localCorrectionQueueStatuses',
    'reviewReadyHandoffClosureStates',
    'Owner-input and local correction snapshot',
    '/admin/release-control',
  ]) {
    assertIncludes(shell, required, 'protected admin shell release-control snapshot');
  }
  assertIncludes(route, 'view={{ kind: "release-control" }}', 'release-control route');
  assertNoMatch(phase4aDocs, filledEvidencePattern, 'Phase 4A release-control docs');
  assertNoMatch(phase4bDocs, filledEvidencePattern, 'Phase 4B owner-input correction docs');
}


function assertPhase4cOwnerReviewRehearsal() {
  const phase4cDocPaths = [
    localOwnerReviewRehearsalPackPath,
    localBlockerLedgerTemplatePath,
    localAcceptanceDrillPath,
  ];
  const docs = phase4cDocPaths.map(readRepoFile).join('\n');
  const statusDocs = [
    readRepoFile('docs/PHASE-STATUS.md'),
    readRepoFile('docs/PHASE-ROADMAP.md'),
    readRepoFile('docs/PHASE-2-READINESS-PLAN.md'),
    readRepoFile('docs/DECISION-LOG.md'),
    readRepoFile('docs/checklists/PHASE-2-ADMIN-OPS.md'),
    readRepoFile('docs/OWNER-REVIEW-READINESS-PACKAGE.md'),
    readRepoFile('docs/manual-qa/OWNER-REVIEW-MANUAL-QA.md'),
    readRepoFile('docs/PREVIEW-DEPLOYMENT-HANDOFF.md'),
  ].join('\n');
  const shell = readRepoFile(protectedAdminShellPath);
  const route = readRepoFile(releaseControlRoutePath);
  const packageJson = JSON.parse(readRepoFile('package.json'));
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
  const suiteRunner = readRepoFile(suiteRunnerPath);

  for (const required of [
    'repo-local, template-only, non-live, and not evidence',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    '[OWNER INPUT NEEDED:',
    '[MISSING OWNER INPUT:',
    '[LOCAL CORRECTION PLACEHOLDER:',
    'Owner input missing',
    'Local correction required',
    'Public visibility blocked',
    'Protected admin review required',
    'Fake-fact risk',
    'Public leakage risk',
    'Provider/runtime blocked',
    'Deployment planning blocked',
    'Requires separate deployment approval',
    'Confirm public route wording remains rental/enquiry-only',
    'Confirm quote/enquiry remains request/intake only',
    'Confirm no public account/tracking/upload/notification/CRM flow exists',
    'Confirm no ecommerce/cart/checkout/order/payment wording exists',
    'Confirm admin-only release-control and correction internals are protected',
    'Confirm fake facts remain absent',
    'Confirm no provider/runtime/deployment files or env reads were added',
    'Confirm release-candidate suite was not weakened',
  ]) {
    assertIncludes(docs, required, 'Phase 4C owner-review rehearsal docs');
  }

  for (const required of [
    'Current phase: Phase 4C-A/B local owner-review rehearsal pack, blocker ledger, and acceptance drill validator',
    'Latest completed capability: Phase 4B-A/B owner-input intake control, local correction queue, and review-ready handoff closure',
    'Last merged capability PR: #150',
    phase4bMergeCommit,
    localOwnerReviewRehearsalPackPath,
    localBlockerLedgerTemplatePath,
    localAcceptanceDrillPath,
    'validate:owner-review-rehearsal',
  ]) {
    assertIncludes(statusDocs, required, 'Phase 4C status docs');
  }

  for (const required of [
    'Phase 4C-A/B local owner-review rehearsal',
    'phase4cOwnerReviewRehearsalSnapshot',
    localOwnerReviewRehearsalPackPath,
    localBlockerLedgerTemplatePath,
    localAcceptanceDrillPath,
    'Owner input boundary',
    'Local correction boundary',
    'Public exposure boundary',
    'Evidence boundary',
    'Deployment approval boundary',
  ]) {
    assertIncludes(shell, required, 'protected admin shell Phase 4C rehearsal snapshot');
  }
  assertIncludes(route, 'view={{ kind: "release-control" }}', 'release-control route');
  assert(
    packageJson.scripts['validate:owner-review-rehearsal'] === 'node scripts/validate-owner-review-rehearsal.cjs',
    'validate:owner-review-rehearsal script is missing.',
  );
  assertNoMatch(docs, filledEvidencePattern, 'Phase 4C owner-review rehearsal docs');
  assertNoMatch(
    publicSource,
    /local owner-review rehearsal pack|local blocker ledger template|local acceptance drill|owner-input intake control|local correction queue|review-ready handoff closure|release-control internals|owner-review templates|protected admin urls|internal notes|recovery lane statuses|destructive-action safeguards|status-transition matrix details|\/admin\//i,
    'public source',
  );
  assertNoMatch(publicSource, forbiddenTransactionTermPattern, 'public source');
  assertNoMatch(publicSource, /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy/i, 'public source');
  assertNoMatch(suiteRunner, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, suiteRunnerPath);
}

function assertStatusDocs() {
  const status = readRepoFile('docs/PHASE-STATUS.md');
  const roadmap = readRepoFile('docs/PHASE-ROADMAP.md').replace(/\s+/g, ' ');
  const readiness = readRepoFile('docs/PHASE-2-READINESS-PLAN.md');
  const decisionLog = readRepoFile('docs/DECISION-LOG.md');
  const checklist = readRepoFile('docs/checklists/PHASE-2-ADMIN-OPS.md');

  const phase3zStatusBlock = statusHistoryBlock(
    status,
    'Previous Current Phase 3Z-A/B status:',
    'Previous Current Phase 3Y-A/B status:',
    'Phase 3Z status history',
  );
  assertIncludes(
    phase3zStatusBlock,
    'Current phase: Phase 3Z-A/B - public route readiness closure, protected admin review bridge, and local acceptance coverage.',
    'Phase 3Z status history',
  );
  assertIncludes(
    phase3zStatusBlock,
    'Latest completed capability: Phase 3Y-A/B protected admin destructive-action safeguards, recovery lanes, and local acceptance coverage.',
    'Phase 3Z status history',
  );
  assertIncludes(phase3zStatusBlock, 'Last merged capability PR: #147', 'Phase 3Z status history');
  assertIncludes(phase3zStatusBlock, `Merge commit: \`${phase3yMergeCommit}\``, 'Phase 3Z status history');
  assertIncludes(status, 'Previous Current Phase 3Y-A/B status', 'phase status');
  assertIncludes(status, `Merge commit: \`${phase3xMergeCommit}\``, 'phase status');
  assertIncludes(status, 'Previous Current Phase 3X-A/B status', 'phase status');
  assertIncludes(status, `Merge commit: \`${phase3wMergeCommit}\``, 'phase status');
  assertIncludes(status, 'Previous Current Phase 3W-A/B status', 'phase status');
  assertIncludes(status, `Merge commit: \`${phase3vMergeCommit}\``, 'phase status');
  assertIncludes(status, 'Previous Current Phase 3V-A/B status', 'phase status');
  assertIncludes(status, `Merge commit: \`${phase3uMergeCommit}\``, 'phase status');
  assertIncludes(status, 'Previous Current Phase 3U-A/B status', 'phase status');
  assertIncludes(
    status,
    'Current phase: Phase 3V-A/B - quote/enquiry workflow hardening, protected admin triage polish, and local acceptance coverage.',
    'phase status',
  );
  assertIncludes(
    status,
    'Current phase: Phase 3U-A/B - final local owner handoff pack, acceptance triage board, and deployment decision firewall.',
    'phase status',
  );
  assertIncludes(
    status,
    'Latest completed capability: Phase 3T-A/B local release-candidate command centre, acceptance-suite orchestration, and no-deploy command allowlist.',
    'phase status',
  );
  assertIncludes(status, 'Last merged capability PR: #142', 'phase status');
  assertIncludes(status, `Merge commit: \`${phase3tMergeCommit}\``, 'phase status');
  assertIncludes(status, 'Previous Current Phase 3T-A/B status', 'phase status');
  assertIncludes(
    status,
    'Current phase: Phase 3T-A/B - local release-candidate command centre, acceptance-suite orchestration, and no-deploy command allowlist.',
    'phase status',
  );
  assertIncludes(
    status,
    'Latest completed capability: Phase 3S-A/B repo-local release-candidate acceptance gate, route inventory freeze, and public/admin regression harness.',
    'phase status',
  );
  assertIncludes(status, 'Last merged capability PR: #141', 'phase status');
  assertIncludes(status, `Merge commit: \`${phase3sMergeCommit}\``, 'phase status');
  assertIncludes(status, 'Previous Current Phase 3S-A/B status', 'phase status');
  assertIncludes(
    status,
    'Current phase: Phase 3S-A/B - repo-local release-candidate acceptance gate, route inventory freeze, and public/admin regression harness.',
    'phase status',
  );
  assertIncludes(
    status,
    'Latest completed capability: Phase 3R-A/B repo-local product acceptance hardening, public/admin route polish, and owner-demo issue backlog readiness.',
    'phase status',
  );
  assertIncludes(status, 'Last merged capability PR: #140', 'phase status');
  assertIncludes(status, `Merge commit: \`${phase3rMergeCommit}\``, 'phase status');
  assertIncludes(status, 'Previous Current Phase 3R-A/B status', 'phase status');
  assertIncludes(
    status,
    'Current phase: Phase 3R-A/B - repo-local product acceptance hardening, public/admin route polish, and owner-demo issue backlog readiness.',
    'phase status',
  );
  assertIncludes(
    status,
    'Latest completed capability: Phase 3Q-A/B repo-local owner-demo polish, public journey QA hardening, and protected admin closure workspace polish.',
    'phase status',
  );
  assertIncludes(status, 'Last merged capability PR: #139', 'phase status');
  assertIncludes(status, `Merge commit: \`${phase3qMergeCommit}\``, 'phase status');
  assertIncludes(status, 'Previous Current Phase 3Q-A/B status', 'phase status');
  assertIncludes(
    status,
    'Current phase: Phase 3Q-A/B - repo-local owner-demo polish, public journey QA hardening, and protected admin closure workspace polish.',
    'phase status',
  );
  assertIncludes(
    status,
    'Latest completed capability: Phase 3P-A/B owner-review closure packet, readiness sign-off template, and deployment approval separation.',
    'phase status',
  );
  assertIncludes(status, 'Last merged capability PR: #138', 'phase status');
  assertIncludes(status, `Merge commit: \`${phase3pMergeCommit}\``, 'phase status');
  assertIncludes(status, 'Previous Current Phase 3P-A/B status', 'phase status');
  assertIncludes(
    status,
    'Current phase: Phase 3P-A/B - owner-review closure packet, readiness sign-off template, and deployment approval separation.',
    'phase status',
  );
  assertIncludes(
    status,
    'Latest completed capability: Phase 3O-A/B owner-review correction intake, launch-blocker freeze gate, and admin triage snapshot.',
    'phase status',
  );
  assertIncludes(status, 'Last merged capability PR: #137', 'phase status');
  assertIncludes(status, `Merge commit: \`${phase3oMergeCommit}\``, 'phase status');
  assertIncludes(status, 'Previous Current Phase 3O-A/B status', 'phase status');
  assertIncludes(
    status,
    'Current phase: Phase 3O-A/B - owner-review correction intake, launch-blocker freeze gate, and admin triage snapshot.',
    'phase status',
  );
  assertIncludes(
    status,
    'Latest completed capability: Phase 3N-A/B owner-review dry-run packet, findings disposition workflow, and launch hold/approve rehearsal.',
    'phase status',
  );
  assertIncludes(status, 'Last merged capability PR: #136', 'phase status');
  assertIncludes(status, `Merge commit: \`${phase3nMergeCommit}\``, 'phase status');
  assertIncludes(status, 'Previous Current Phase 3N-A/B status', 'phase status');
  assertIncludes(
    status,
    'Current phase: Phase 3N-A/B - owner-review dry-run packet, findings disposition workflow, and launch hold/approve rehearsal.',
    'phase status',
  );
  assertIncludes(
    status,
    'Latest completed capability: Phase 3M-A/B owner-review execution checklist, route-by-route decision matrix, and admin review snapshot.',
    'phase status',
  );
  assertIncludes(status, 'Last merged capability PR: #135', 'phase status');
  assertIncludes(status, `Merge commit: \`${phase3mMergeCommit}\``, 'phase status');
  assertIncludes(status, 'Previous Current Phase 3M-A/B status', 'phase status');
  assertIncludes(
    status,
    'Current phase: Phase 3M-A/B - owner-review execution checklist, route-by-route decision matrix, and admin review snapshot.',
    'phase status',
  );
  assertIncludes(
    status,
    'Latest completed capability: Phase 3L-A/B protected content readiness workspace, owner-review issue ledger, and public copy fact-safety audit.',
    'phase status',
  );
  assertIncludes(status, 'Last merged capability PR: #134', 'phase status');
  assertIncludes(status, `Merge commit: \`${phase3lMergeCommit}\``, 'phase status');
  assertIncludes(status, 'Previous Current Phase 3L-A/B status', 'phase status');
  assertIncludes(
    status,
    'Current phase: Phase 3L-A/B - protected content readiness workspace, owner-review issue ledger, and public copy fact-safety audit.',
    'phase status',
  );
  assertIncludes(
    status,
    'Latest completed capability: Phase 3K-A/B owner content intake, content gap register, and launch-blocker governance.',
    'phase status',
  );
  assertIncludes(status, 'Last merged capability PR: #133', 'phase status');
  assertIncludes(status, `Merge commit: \`${phase3kMergeCommit}\``, 'phase status');
  assertIncludes(status, 'Previous Current Phase 3K-A/B status', 'phase status');
  assertIncludes(
    status,
    'Current phase: Phase 3K-A/B - owner content intake, content gap register, and launch-blocker governance.',
    'phase status',
  );
  assertIncludes(
    status,
    'Latest completed capability: Phase 3J-A/B owner review readiness package, manual QA runbook, and release-decision preparation.',
    'phase status',
  );
  assertIncludes(status, 'Last merged capability PR: #132', 'phase status');
  assertIncludes(status, `Merge commit: \`${phase3jMergeCommit}\``, 'phase status');
  assertIncludes(status, 'Previous Current Phase 3J-A/B status', 'phase status');
  assertIncludes(status, 'Previous Current Phase 3I-A/B status', 'phase status');
  assertIncludes(status, 'Previous Current Phase 3H-A/B status', 'phase status');
  assertIncludes(status, 'Previous Current Phase 3G-A/B status', 'phase status');
  assertIncludes(status, 'Previous Current Phase 3F-A/B status', 'phase status');
  assertIncludes(status, 'Previous Current Phase 3E-A/B status', 'phase status');
  assertIncludes(status, 'Previous Current Phase 3D-A/B status', 'phase status');
  assertIncludes(status, 'Previous Current Phase 3C-A/B status', 'phase status');
  assertIncludes(status, 'Previous Current Phase 3B-A/B status', 'phase status');
  assertIncludes(status, 'Previous Current Phase 3A-A/B status', 'phase status');
  assertIncludes(status, 'Previous Current Phase 2Q-A/B status', 'phase status');
  assertIncludes(
    roadmap,
    'Phase 2Q-A/B adds the final preview deployment handoff and branch-freeze package',
    'phase roadmap',
  );
  assertIncludes(
    roadmap,
    'Phase 3I-A/B adds full-site acceptance QA, public SEO/accessibility polish, and non-deployment release hardening',
    'phase roadmap',
  );
  assertIncludes(
    roadmap,
    'Phase 3J-A/B adds an owner review readiness package, manual QA runbook, and release-decision preparation',
    'phase roadmap',
  );
  assertIncludes(
    roadmap,
    'Phase 3K-A/B adds owner content intake, a content gap register, and launch-blocker governance',
    'phase roadmap',
  );
  assertIncludes(
    roadmap,
    'Phase 3L-A/B adds a protected content readiness workspace, owner-review issue ledger, and public copy fact-safety audit',
    'phase roadmap',
  );
  assertIncludes(
    roadmap,
    'Phase 3M-A/B adds an owner-review execution checklist, route-by-route decision matrix, and admin review snapshot',
    'phase roadmap',
  );
  assertIncludes(
    roadmap,
    'Phase 3N-A/B adds an owner-review dry-run packet, findings disposition workflow, and launch hold/approve rehearsal',
    'phase roadmap',
  );
  assertIncludes(
    roadmap,
    'Phase 3Z-A/B closes the repo-local public journey/readiness gap',
    'phase roadmap',
  );
  assertIncludes(
    roadmap,
    'Phase 3Y-A/B hardens protected admin destructive-action safeguards',
    'phase roadmap',
  );
  assertIncludes(
    roadmap,
    'Phase 3V-A/B hardens the public quote/enquiry conversion path and protected admin quote triage',
    'phase roadmap',
  );
  assertIncludes(
    roadmap,
    'Phase 3U-A/B adds a final local owner handoff pack, acceptance triage board, and deployment decision firewall',
    'phase roadmap',
  );
  assertIncludes(
    roadmap,
    'Phase 3T-A/B adds a local release-candidate command centre, acceptance-suite orchestration, and no-deploy command allowlist',
    'phase roadmap',
  );
  assertIncludes(
    roadmap,
    'Phase 3S-A/B adds a repo-local release-candidate acceptance gate, route inventory freeze, and public/admin regression harness',
    'phase roadmap',
  );
  assertIncludes(
    roadmap,
    'Phase 3R-A/B adds repo-local product acceptance hardening, public/admin route polish, and owner-demo issue backlog readiness',
    'phase roadmap',
  );
  assertIncludes(
    roadmap,
    'Phase 3Q-A/B adds repo-local owner-demo polish, public journey QA hardening, and protected admin closure workspace polish',
    'phase roadmap',
  );
  assertIncludes(
    roadmap,
    'Phase 3P-A/B adds an owner-review closure packet, readiness sign-off template, and deployment approval separation',
    'phase roadmap',
  );
  assertIncludes(
    roadmap,
    'Phase 3O-A/B adds owner-review correction intake, a launch-blocker freeze gate, and admin triage snapshot',
    'phase roadmap',
  );
  assertIncludes(readiness, 'Current Phase 3V-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Previous Current Phase 3U-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Current Phase 3U-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Previous Current Phase 3T-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Current Phase 3T-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Previous Current Phase 3S-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Current Phase 3S-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Previous Current Phase 3R-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Current Phase 3R-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Previous Current Phase 3Q-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Current Phase 3Q-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Previous Current Phase 3P-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Previous Current Phase 3O-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Previous Current Phase 3N-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Previous Current Phase 3M-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Previous Current Phase 3L-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Previous Current Phase 3K-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Previous Current Phase 3K-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Previous Current Phase 3J-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Previous Current Phase 3I-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Previous Current Phase 3H-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Previous Current Phase 3G-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Previous Current Phase 3F-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Previous Current Phase 3E-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Previous Current Phase 3D-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Previous Current Phase 3C-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Previous Current Phase 3B-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Previous Current Phase 3A-A/B status', 'readiness plan');
  assertIncludes(readiness, 'Previous Current Phase 2Q-A/B status', 'readiness plan');
  assertIncludes(
    decisionLog,
    'Decision: Phase 2Q-A/B adds the final preview deployment handoff and branch-freeze package.',
    'decision log',
  );
  assertIncludes(
    checklist,
    '## Phase 2Q-A/B Preview Deployment Handoff And Branch-Freeze Package',
    'phase checklist',
  );
  assertIncludes(
    decisionLog,
    'Decision: Phase 3F-A/B adds catalogue content quality, media readiness, and admin publication polish.',
    'decision log',
  );
  assertIncludes(
    checklist,
    '## Phase 3F-A/B Catalogue Content Quality Media Readiness And Admin Publication Polish',
    'phase checklist',
  );
  assertIncludes(
    decisionLog,
    'Decision: Phase 3G-A/B adds quote intake quality, admin triage depth, and enquiry workflow polish.',
    'decision log',
  );
  assertIncludes(
    checklist,
    '## Phase 3G-A/B Quote Intake Quality Admin Triage Depth And Enquiry Workflow Polish',
    'phase checklist',
  );
  assertIncludes(
    decisionLog,
    'Decision: Phase 3H-A/B adds admin operator QA, dashboard consistency, and non-deployment release readiness polish.',
    'decision log',
  );
  assertIncludes(
    checklist,
    '## Phase 3H-A/B Admin Operator QA Dashboard Consistency And Non-Deployment Release Readiness Polish',
    'phase checklist',
  );
  assertIncludes(
    decisionLog,
    'Decision: Phase 3I-A/B adds full-site acceptance QA, public SEO/accessibility polish, and non-deployment release hardening.',
    'decision log',
  );
  assertIncludes(
    checklist,
    '## Phase 3I-A/B Full-Site Acceptance QA Public SEO Accessibility Polish And Non-Deployment Release Hardening',
    'phase checklist',
  );
  assertIncludes(
    decisionLog,
    'Decision: Phase 3J-A/B adds an owner review readiness package, manual QA runbook, and release-decision preparation.',
    'decision log',
  );
  assertIncludes(
    checklist,
    '## Phase 3J-A/B Owner Review Readiness Package Manual QA Runbook And Release-Decision Preparation',
    'phase checklist',
  );
  assertIncludes(
    decisionLog,
    'Decision: Phase 3K-A/B adds owner content intake, content gap register, and launch-blocker governance.',
    'decision log',
  );
  assertIncludes(
    checklist,
    '## Phase 3K-A/B Owner Content Intake Content Gap Register And Launch-Blocker Governance',
    'phase checklist',
  );
  assertIncludes(
    decisionLog,
    'Decision: Phase 3L-A/B adds a protected content readiness workspace, owner-review issue ledger, and public copy fact-safety audit.',
    'decision log',
  );
  assertIncludes(
    checklist,
    '## Phase 3L-A/B Protected Content Readiness Workspace Owner-Review Issue Ledger And Public Copy Fact-Safety Audit',
    'phase checklist',
  );
  assertIncludes(
    decisionLog,
    'Decision: Phase 3M-A/B adds an owner-review execution checklist, route-by-route decision matrix, and admin review snapshot.',
    'decision log',
  );
  assertIncludes(
    checklist,
    '## Phase 3M-A/B Owner-Review Execution Checklist Route-By-Route Decision Matrix And Admin Review Snapshot',
    'phase checklist',
  );
  assertIncludes(
    decisionLog,
    'Decision: Phase 3N-A/B adds an owner-review dry-run packet, findings disposition workflow, and launch hold/approve rehearsal.',
    'decision log',
  );
  assertIncludes(
    checklist,
    '## Phase 3N-A/B Owner-Review Dry-Run Packet Findings Disposition Workflow And Launch Hold/Approve Rehearsal',
    'phase checklist',
  );
  assertIncludes(
    decisionLog,
    'Decision: Phase 3Z-A/B adds public journey readiness closure docs, a quote/enquiry public expectation boundary, a protected admin public-review bridge',
    'decision log',
  );
  assertIncludes(
    decisionLog,
    'Decision: Phase 3Y-A/B adds protected admin destructive-action safeguard docs, recovery lane guidance, a status-transition matrix',
    'decision log',
  );
  assertIncludes(
    decisionLog,
    'Decision: Phase 3V-A/B hardens the quote/enquiry workflow, protected admin triage, and local acceptance coverage.',
    'decision log',
  );
  assertIncludes(
    checklist,
    '## Phase 3Z-A/B Public Route Readiness Closure Protected Admin Review Bridge And Local Acceptance Coverage',
    'admin ops checklist',
  );
  assertIncludes(
    checklist,
    '## Phase 3Y-A/B Protected Admin Destructive-Action Safeguards Recovery Lanes And Local Acceptance Coverage',
    'admin ops checklist',
  );
  assertIncludes(
    checklist,
    '## Phase 3V-A/B Quote Enquiry Workflow Hardening Protected Admin Triage Polish And Local Acceptance Coverage',
    'phase checklist',
  );
  assertIncludes(
    decisionLog,
    'Decision: Phase 3U-A/B adds a final local owner handoff pack, acceptance triage board, and deployment decision firewall.',
    'decision log',
  );
  assertIncludes(
    checklist,
    '## Phase 3U-A/B Final Local Owner Handoff Pack Acceptance Triage Board And Deployment Decision Firewall',
    'phase checklist',
  );
  assertIncludes(
    decisionLog,
    'Decision: Phase 3T-A/B adds a local release-candidate command centre, acceptance-suite orchestration, and no-deploy command allowlist.',
    'decision log',
  );
  assertIncludes(
    checklist,
    '## Phase 3T-A/B Local Release-Candidate Command Centre Acceptance-Suite Orchestration And No-Deploy Command Allowlist',
    'phase checklist',
  );
  assertIncludes(
    decisionLog,
    'Decision: Phase 3S-A/B adds a repo-local release-candidate acceptance gate, route inventory freeze, and public/admin regression harness.',
    'decision log',
  );
  assertIncludes(
    checklist,
    '## Phase 3S-A/B Local Release-Candidate Acceptance Gate Route Inventory Freeze And Public-Admin Regression Harness',
    'phase checklist',
  );
  assertIncludes(
    decisionLog,
    'Decision: Phase 3R-A/B adds repo-local product acceptance hardening, public/admin route polish, and owner-demo issue backlog readiness.',
    'decision log',
  );
  assertIncludes(
    checklist,
    '## Phase 3R-A/B Product Acceptance Hardening Public-Admin Route Polish And Owner-Demo Issue Backlog Readiness',
    'phase checklist',
  );
  assertIncludes(
    decisionLog,
    'Decision: Phase 3Q-A/B adds repo-local owner-demo polish, public journey QA hardening, and protected admin closure workspace polish.',
    'decision log',
  );
  assertIncludes(
    checklist,
    '## Phase 3Q-A/B Repo-Local Owner-Demo Polish Public Journey QA Hardening And Protected Admin Closure Workspace Polish',
    'phase checklist',
  );
  assertIncludes(
    decisionLog,
    'Decision: Phase 3P-A/B adds an owner-review closure packet, readiness sign-off template, and deployment approval separation.',
    'decision log',
  );
  assertIncludes(
    checklist,
    '## Phase 3P-A/B Owner-Review Closure Packet Readiness Sign-Off Template And Deployment Approval Separation',
    'phase checklist',
  );
  assertIncludes(
    decisionLog,
    'Decision: Phase 3O-A/B adds owner-review correction intake, a launch-blocker freeze gate, and admin triage snapshot.',
    'decision log',
  );
  assertIncludes(
    checklist,
    '## Phase 3O-A/B Owner-Review Correction Intake Launch-Blocker Freeze Gate And Admin Triage Snapshot',
    'phase checklist',
  );
}

function assertProtectedContentReadinessWorkspace() {
  const routeSource = readRepoFile(contentReadinessRoutePath);
  const shellSource = readRepoFile(protectedAdminShellPath);

  assertTracked(
    [contentReadinessRoutePath, protectedAdminShellPath],
    'protected content readiness workspace',
  );
  assertIncludes(routeSource, 'resolveProtectedAdminShellState', contentReadinessRoutePath);
  assertIncludes(routeSource, 'AdminShellContent', contentReadinessRoutePath);
  assertIncludes(routeSource, 'view={{ kind: "content-readiness" }}', contentReadinessRoutePath);
  assertIncludes(routeSource, 'dynamic = "force-dynamic"', contentReadinessRoutePath);
  assertIncludes(routeSource, 'revalidate = 0', contentReadinessRoutePath);
  assertIncludes(shellSource, '"content-readiness"', protectedAdminShellPath);
  assertIncludes(shellSource, ownerContentIntakePath, protectedAdminShellPath);
  assertIncludes(shellSource, contentGapRegisterPath, protectedAdminShellPath);
  assertIncludes(shellSource, ownerReviewLedgerPath, protectedAdminShellPath);
  assertIncludes(shellSource, ownerReviewExecutionChecklistPath, protectedAdminShellPath);
  assertIncludes(shellSource, ownerReviewRouteDecisionMatrixPath, protectedAdminShellPath);
  assertIncludes(shellSource, ownerReviewDryRunPacketPath, protectedAdminShellPath);
  assertIncludes(shellSource, ownerReviewFindingsDispositionPath, protectedAdminShellPath);
  assertIncludes(shellSource, ownerReviewLaunchDecisionRehearsalPath, protectedAdminShellPath);
  assertIncludes(shellSource, ownerReviewCorrectionIntakePath, protectedAdminShellPath);
  assertIncludes(shellSource, ownerReviewLaunchBlockerFreezeGatePath, protectedAdminShellPath);
  assertIncludes(shellSource, ownerReviewCorrectionPrPlanPath, protectedAdminShellPath);
  assertIncludes(shellSource, ownerReviewClosurePacketPath, protectedAdminShellPath);
  assertIncludes(shellSource, ownerReviewClosureSignoffTemplatePath, protectedAdminShellPath);
  assertIncludes(shellSource, ownerReviewDeploymentApprovalSeparationPath, protectedAdminShellPath);
  assertIncludes(shellSource, ownerDemoWalkthroughPath, protectedAdminShellPath);
  assertIncludes(shellSource, ownerDemoIssueBacklogPath, protectedAdminShellPath);
  assertIncludes(shellSource, localReleaseCandidateAcceptanceMatrixPath, protectedAdminShellPath);
  assertIncludes(shellSource, localRouteInventoryFreezePath, protectedAdminShellPath);
  assertIncludes(shellSource, localReleaseCandidateCommandCentrePath, protectedAdminShellPath);
  assertIncludes(shellSource, finalOwnerHandoffPackPath, protectedAdminShellPath);
  assertIncludes(shellSource, localAcceptanceTriageBoardPath, protectedAdminShellPath);
  assertIncludes(shellSource, deploymentDecisionFirewallPath, protectedAdminShellPath);
  assertIncludes(shellSource, quoteWorkflowChecklistPath, protectedAdminShellPath);
  assertIncludes(shellSource, catalogueListingMediaChecklistPath, protectedAdminShellPath);
  assertIncludes(shellSource, protectedAdminWriteOpsChecklistPath, protectedAdminShellPath);
  assertIncludes(shellSource, protectedAdminDestructiveActionSafeguardsPath, protectedAdminShellPath);
  assertIncludes(shellSource, protectedAdminRecoveryLanePath, protectedAdminShellPath);
  assertIncludes(shellSource, protectedAdminStatusTransitionMatrixPath, protectedAdminShellPath);
  assertIncludes(shellSource, publicJourneyReadinessClosurePath, protectedAdminShellPath);
  assertIncludes(shellSource, quotePublicExpectationBoundaryPath, protectedAdminShellPath);
  assertIncludes(shellSource, protectedAdminPublicReviewBridgePath, protectedAdminShellPath);
  assertIncludes(shellSource, 'Catalogue/listing/media acceptance snapshot', protectedAdminShellPath);
  assertIncludes(shellSource, 'catalogueListingMediaAcceptanceSnapshot', protectedAdminShellPath);
  assertIncludes(shellSource, 'Protected admin write-ops acceptance snapshot', protectedAdminShellPath);
  assertIncludes(shellSource, 'protectedAdminWriteOpsAcceptanceSnapshot', protectedAdminShellPath);
  assertIncludes(shellSource, 'protectedAdminDestructiveRecoverySnapshot', protectedAdminShellPath);
  assertIncludes(shellSource, 'Protected admin destructive-action/recovery snapshot', protectedAdminShellPath);
  assertIncludes(shellSource, 'publicRouteReadinessClosureSnapshot', protectedAdminShellPath);
  assertIncludes(shellSource, 'Public route/readiness closure snapshot', protectedAdminShellPath);
  assertIncludes(shellSource, 'protectedAdminPublicReviewBridgeStatuses', protectedAdminShellPath);
  assertIncludes(shellSource, 'reviewSurfaceGroups', protectedAdminShellPath);
  assertIncludes(shellSource, 'routeFamiliesCovered', protectedAdminShellPath);
  assertIncludes(shellSource, 'ownerDecisionCategories', protectedAdminShellPath);
  assertIncludes(shellSource, 'ownerInputRequiredCategories', protectedAdminShellPath);
  assertIncludes(shellSource, 'launchBlockerCategories', protectedAdminShellPath);
  assertIncludes(shellSource, 'dryRunReviewAreas', protectedAdminShellPath);
  assertIncludes(shellSource, 'findingDispositionStatuses', protectedAdminShellPath);
  assertIncludes(shellSource, 'launchDecisionRehearsalStates', protectedAdminShellPath);
  assertIncludes(shellSource, 'dryRunOwnerInputRequiredCategories', protectedAdminShellPath);
  assertIncludes(shellSource, 'explicitDeploymentApprovalBoundary', protectedAdminShellPath);
  assertIncludes(shellSource, 'ownerCorrectionCategories', protectedAdminShellPath);
  assertIncludes(shellSource, 'ownerCorrectionStatuses', protectedAdminShellPath);
  assertIncludes(shellSource, 'launchBlockerFreezeStates', protectedAdminShellPath);
  assertIncludes(shellSource, 'futureCorrectionPrTypes', protectedAdminShellPath);
  assertIncludes(shellSource, 'correctionFreezeDeploymentBoundary', protectedAdminShellPath);
  assertIncludes(shellSource, 'ownerReviewClosureStates', protectedAdminShellPath);
  assertIncludes(shellSource, 'ownerReviewClosureTemplateFields', protectedAdminShellPath);
  assertIncludes(shellSource, 'closureDeploymentApprovalStatus', protectedAdminShellPath);
  assertIncludes(shellSource, 'closureSnapshotLastLocalPacketUpdate', protectedAdminShellPath);
  assertIncludes(shellSource, 'ownerDemoWalkthroughSnapshot', protectedAdminShellPath);
  assertIncludes(shellSource, 'ownerDemoSnapshotLastLocalPacketUpdate', protectedAdminShellPath);
  assertIncludes(shellSource, 'ownerDemoIssueBacklogSnapshot', protectedAdminShellPath);
  assertIncludes(shellSource, 'ownerDemoIssueBacklogLastLocalUpdate', protectedAdminShellPath);
  assertIncludes(shellSource, 'localAcceptanceSnapshot', protectedAdminShellPath);
  assertIncludes(shellSource, 'localAcceptanceLastLocalUpdate', protectedAdminShellPath);
  assertIncludes(shellSource, 'localCommandCentreSnapshot', protectedAdminShellPath);
  assertIncludes(shellSource, 'localCommandCentreLastLocalUpdate', protectedAdminShellPath);
  assertIncludes(shellSource, 'finalOwnerHandoffSnapshot', protectedAdminShellPath);
  assertIncludes(shellSource, 'finalOwnerHandoffLastLocalUpdate', protectedAdminShellPath);
  assertIncludes(shellSource, 'quoteEnquiryAcceptanceSnapshot', protectedAdminShellPath);
  assertIncludes(shellSource, 'quoteEnquiryAcceptanceLastLocalUpdate', protectedAdminShellPath);
  assertIncludes(shellSource, 'Quote/enquiry acceptance snapshot', protectedAdminShellPath);
  assertNoMatch(routeSource, /NEXT_PUBLIC_SUPABASE|NEXT_PUBLIC_N8N|SUPABASE_SERVICE_ROLE/i, contentReadinessRoutePath);
}

function assertPublicCopyFactSafety() {
  const publicSource = readTrackedProductionSources([
    'website/app/layout.tsx',
    'website/app/page.tsx',
    'website/app/listings',
    'website/app/categories',
    'website/app/catalogue',
    'website/app/events',
    'website/app/quote',
    'website/components/QuoteRequestForm.tsx',
    'website/components/ChatWidget.tsx',
  ]);

  assertNoMatch(
    publicSource,
    /\b(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i,
    'public route source',
  );
  assertNoMatch(
    publicSource,
    /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy/i,
    'public route source',
  );
  assertNoMatch(
    publicSource,
    forbiddenTransactionTermPattern,
    'public route source',
  );
  assertNoMatch(
    publicSource,
    /Owner input required|Ready for owner review|Blocks owner review|Blocks launch\/deployment|Deferred after launch|Not in scope by owner direction|Requires separate deployment approval|Correction template only|Owner-demo walkthrough|Owner-demo walkthrough snapshot|Owner-review issue ledger|Owner-review execution checklist|Owner-review dry-run packet|Owner-review correction intake|Owner-review closure packet|Owner-review closure sign-off template|deployment approval separation|Closure readiness snapshot|Current owner-review closure state|DEPLOYMENT APPROVAL: NOT GRANTED|findings disposition|launch decision rehearsal|launch-blocker freeze gate|correction PR plan|Dry-run review snapshot|Correction\/freeze snapshot|route decision matrix|content readiness workspace|admin-only readiness|Protected admin content readiness|\/admin\/content-readiness|admin issue ledger|owner decision needed|owner-only statuses|Admin-only notes|Public review prompts|Review the rental journey|Confirm each listing|Check that categories|Make sure the enquiry path|Request review|owner-demo|walkthrough|closure readiness|deployment approval|internal review|admin-only|protected content readiness|owner handoff|handoff pack|deployment firewall|acceptance triage|final local owner handoff|quote\/enquiry acceptance snapshot|catalogue\/listing\/media acceptance snapshot|protected admin write-ops acceptance snapshot|protected admin write-ops checklist|destructive-action safeguards|recovery lane statuses|status-transition matrix|protected admin destructive-action\/recovery snapshot|release-control gate|owner-review rehearsal|deployment approval firewall matrix|owner-input intake control|local correction queue|review-ready handoff closure|owner-input and local correction snapshot|\/admin\/release-control/i,
    'public route source',
  );
}

function assertStaticScope() {
  const packageSource = [
    readRepoFile('package.json'),
    readRepoFile('website/package.json'),
  ].join('\n');
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
  assertNoTracked(['docs/evidence', 'docs/production-evidence'], 'filled evidence');
  assertNoTracked(['docs/owner-review-evidence'], 'owner-review evidence');
  assertNoTracked(['docs/preview-evidence'], 'preview evidence');
  assertNoTracked(['website/chat-config.js'], 'legacy local chat config');
  assertNoTracked(['website/app/api/customer-uploads'], 'customer upload routes');
  assertNoTracked(['website/app/api/public/uploads'], 'public upload routes');
  assertNoTracked(['website/app/api/customer-accounts'], 'customer account routes');
  assertNoTracked(['website/app/api/quote-tracking'], 'public quote tracking routes');
  assertNoTracked(['website/app/api/quote-status'], 'public quote status API routes');
  assertNoTracked(['website/app/quote/status'], 'public quote status routes');
  assertNoTracked(['website/app/api/notifications'], 'notification routes');
  assertNoTracked(['website/app/api/crm'], 'CRM routes');
  assertNoTracked(['website/app/api/chat/retrieval'], 'chat retrieval routes');
  assertNoMatch(packageSource, /@pinecone-database|pinecone/i, 'package manifests');
  assert(
    JSON.stringify(n8nWorkflows) ===
      JSON.stringify([
        'n8n-workflows/spacekonceptrental-customer-support-agent.workflow.json',
        'n8n-workflows/spacekonceptrental-error-handler.workflow.json',
        'n8n-workflows/spacekonceptrental-rag-ingestion.workflow.json',
      ]),
    'n8n workflows must remain unchanged.',
  );
}

function assertValidatorSafety() {
  const source = readRepoFile(handoffValidatorPath);

  assertIncludes(source, 'git ls-files', handoffValidatorPath);
  assertNoMatch(source, /\bcurl\b|fetch\s*\(/i, handoffValidatorPath);
  assertNoMatch(source, /\bvercel\s+(?:deploy|link|env|pull|promote)\b/i, handoffValidatorPath);
  assertNoMatch(
    source,
    /\bsupabase\s+(?:link|login|db|secrets|projects|functions)\b/i,
    handoffValidatorPath,
  );
  assertNoMatch(source, /\bn8n\s+(?:import|execute|start)\b/i, handoffValidatorPath);
}

assertPackageAndCi();
assertHandoffDocs();
assertOwnerReviewDocs();
assertContentGovernanceDocs();
assertOwnerReviewIssueLedger();
assertOwnerReviewExecutionChecklist();
assertOwnerReviewRouteDecisionMatrix();
assertOwnerReviewDryRunPacket();
assertOwnerReviewFindingsDisposition();
assertOwnerReviewLaunchDecisionRehearsal();
assertOwnerReviewCorrectionIntake();
assertOwnerReviewLaunchBlockerFreezeGate();
assertOwnerReviewCorrectionPrPlan();
assertOwnerReviewClosurePacket();
assertOwnerReviewClosureSignoffTemplate();
assertOwnerReviewDeploymentApprovalSeparation();
assertOwnerDemoWalkthrough();
assertOwnerDemoIssueBacklog();
assertLocalReleaseCandidateDocs();
assertPublicReadinessClosureDocs();
assertPhase4aReleaseControl();
assertPhase4cOwnerReviewRehearsal();
function assertPhase4dLocalFreeze() {
  assertTracked(phase4dLocalFreezeDocs, 'Phase 4D local-freeze docs');
  const statusDocs = normalizeWhitespace(phase4dStatusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    'Current phase: Phase 4D-A/B local release-candidate freeze, full-suite reliability gate, and deployment-planning firewall closure',
    'Latest completed capability: Phase 4C-A/B local owner-review rehearsal pack, blocker ledger, and acceptance drill validator',
    'Last merged capability PR: #151',
    phase151MergeCommit,
    'validate:local-freeze',
    ...phase4dLocalFreezeDocs,
  ]) {
    assertIncludes(statusDocs, required, 'Phase 4D status docs');
  }
  const shell = readRepoFile('website/app/admin/protected-admin-shell.tsx');
  for (const required of ['phase4dLocalFreezeSnapshot', 'phase4dLocalFreezeDocs', ...phase4dLocalFreezeDocs]) {
    assertIncludes(shell, required, 'protected admin shell Phase 4D snapshot');
  }
  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts['validate:local-freeze'] === 'node scripts/validate-local-freeze.cjs',
    'validate:local-freeze script is missing.',
  );
  const result = spawnSync('node', ['scripts/validate-local-freeze.cjs'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'inherit',
  });
  assert(result.status === 0, 'validate-local-freeze must pass from existing validators.');
}

assertStatusDocs();
assertPhase4dLocalFreeze();
assertProtectedContentReadinessWorkspace();
assertPublicCopyFactSafety();
assertStaticScope();

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

assertValidatorSafety();
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

assertOwnerApprovalRequestGate();
assertPhase4fOwnerHandoffBundle();

console.log('Preview handoff validation passed. No deployment was performed. This does not approve deployment.');
