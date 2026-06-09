const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const acceptanceMatrixPath =
  'docs/content/LOCAL-RELEASE-CANDIDATE-ACCEPTANCE-MATRIX.md';
const routeInventoryFreezePath = 'docs/content/LOCAL-ROUTE-INVENTORY-FREEZE.md';
const commandCentrePath = 'docs/content/LOCAL-RELEASE-CANDIDATE-COMMAND-CENTRE.md';
const finalOwnerHandoffPackPath = 'docs/content/FINAL-LOCAL-OWNER-HANDOFF-PACK.md';
const localAcceptanceTriageBoardPath = 'docs/content/LOCAL-ACCEPTANCE-TRIAGE-BOARD.md';
const deploymentDecisionFirewallPath = 'docs/content/DEPLOYMENT-DECISION-FIREWALL.md';
const quoteWorkflowChecklistPath =
  'docs/content/QUOTE-ENQUIRY-WORKFLOW-ACCEPTANCE-CHECKLIST.md';
const catalogueListingMediaChecklistPath =
  'docs/content/CATALOGUE-LISTING-MEDIA-ACCEPTANCE-CHECKLIST.md';
const protectedAdminWriteOpsChecklistPath =
  'docs/content/PROTECTED-ADMIN-WRITE-OPS-ACCEPTANCE-CHECKLIST.md';
const suiteRunnerPath = 'scripts/validate-release-candidate-suite.cjs';
const protectedAdminShellPath = 'website/app/admin/protected-admin-shell.tsx';
const phase3rMergeCommit = 'ef18c2357d37fdb613851c427130bb108861de31';
const phase3sMergeCommit = '7d6af15e09f7603e2107801f3b6417fd4d2d40bc';
const phase3tMergeCommit = '66840d5d3bb77d39200a864bfcbecc29ee859f76';
const phase3uMergeCommit = 'dd2c3c0176c427e69efa01d6e54841637d61548c';
const phase3vMergeCommit = '3904a661aa3d72606d4c48743030406656128b2c';
const phase3wMergeCommit = '54cd8d5e7b829e56d245da2ca503c9b4058dca76';
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
    'book' + 'ing',
    'reser' + 'vation',
    'reser' + 'ved',
    'fulfil' + 'ment',
  ].join('|')})s?\\b`,
  'i',
);
const publicInternalLeakPattern =
  /Owner-demo|walkthrough|closure readiness|deployment approval|internal review|admin-only|protected content readiness|owner input required|issue backlog|route decision matrix|\/admin\/content-readiness|release-candidate acceptance matrix|route inventory freeze|acceptance status|local release-candidate|command centre|owner handoff|handoff pack|deployment firewall|acceptance triage|final local owner handoff|quote\/enquiry acceptance snapshot/i;
const forbiddenBusinessFactPattern =
  /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy/i;
const forbiddenContactFactPattern =
  /\b(?!(?:\d{4}-\d{2}-\d{2})\b)(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i;
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

function assertCommandCentre() {
  const commandCentre = readRepoFile(commandCentrePath);
  const normalized = normalizeWhitespace(commandCentre);

  assertTracked([commandCentrePath], 'local release-candidate command centre');

  for (const required of [
    'This command centre is repo-local, template-only, non-live, and not evidence.',
    'Safe local command groups',
    'Forbidden commands',
    'Local acceptance-suite sequence',
    'What each command proves',
    'What each command does not prove',
    'What remains blocked until explicit future approval',
    'How to report failures without creating filled evidence',
    '[COMMAND GROUP]',
    '[COMMAND]',
    '[LOCAL PURPOSE]',
    '[PASS / FAIL / NOT RUN]',
    '[LOCAL FOLLOW-UP]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
  ]) {
    assertIncludes(normalized, required, 'local release-candidate command centre');
  }

  assertNoMatch(commandCentre, filledEvidencePattern, 'local release-candidate command centre');
  assertNoMatch(commandCentre, forbiddenBusinessFactPattern, 'local release-candidate command centre');
  assertNoMatch(commandCentre, forbiddenContactFactPattern, 'local release-candidate command centre');
}

function assertSuiteRunner() {
  const runner = readRepoFile(suiteRunnerPath);

  assertTracked([suiteRunnerPath], 'local release-candidate suite runner');

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
    assertIncludes(runner, required, 'local release-candidate suite runner');
  }

  assertNoMatch(runner, /\bvercel\s+(?:deploy|link|env|pull|promote)\b/i, 'local release-candidate suite runner');
  assertNoMatch(
    runner,
    /\bsupabase\s+(?:link|login|secrets|projects|functions|db\s+(?:push|pull|remote|reset))\b/i,
    'local release-candidate suite runner',
  );
  assertNoMatch(runner, /smoke:preview|curl\b|fetch\s*\(|https?:\/\/|www\./i, 'local release-candidate suite runner');
  assertNoMatch(
    runner,
    /docs\/(?:evidence|preview-evidence|production-evidence|owner-review-evidence)/i,
    'local release-candidate suite runner',
  );
  assertNoMatch(runner, /(?:^|[\\/])\.env(?:\.|$)|website\/chat-config\.js/i, 'local release-candidate suite runner');
}

function assertFinalOwnerHandoffMaterials() {
  const handoffPack = readRepoFile(finalOwnerHandoffPackPath);
  const triageBoard = readRepoFile(localAcceptanceTriageBoardPath);
  const firewall = readRepoFile(deploymentDecisionFirewallPath);
  const combined = [handoffPack, triageBoard, firewall].join('\n');
  const normalized = normalizeWhitespace(combined);

  assertTracked(
    [finalOwnerHandoffPackPath, localAcceptanceTriageBoardPath, deploymentDecisionFirewallPath],
    'final local owner handoff materials',
  );

  for (const required of [
    'repo-local, template-only, non-live, and not evidence',
    'Current candidate purpose',
    'Public route review summary',
    'Protected admin review summary',
    'Local release-candidate suite summary',
    'Owner input still required',
    'Local follow-up categories',
    'Items blocked until explicit future approval',
    'Deployment decision firewall',
    'Failure reporting without evidence files',
    'Public route polish',
    'Listing/category/media content',
    'Quote/enquiry flow',
    'Protected admin workflow',
    'Owner input required',
    'Local suite failure',
    'Future deployment blocker',
    'Deferred after launch',
    'Not in current scope',
    'Local acceptance readiness',
    'Owner review readiness',
    'Owner sign-off',
    'Deployment approval',
    'Provider configuration',
    'Preview publication',
    'Production launch',
    'Post-launch monitoring',
    '[OWNER REVIEWER]',
    '[REVIEW DATE]',
    '[ROUTE / AREA]',
    '[PUBLIC / PROTECTED ADMIN]',
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
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
  ]) {
    assertIncludes(normalized, required, 'final local owner handoff materials');
  }

  assertNoMatch(combined, filledEvidencePattern, 'final local owner handoff materials');
  assertNoMatch(combined, forbiddenBusinessFactPattern, 'final local owner handoff materials');
  assertNoMatch(combined, forbiddenContactFactPattern, 'final local owner handoff materials');
}

function assertQuoteEnquiryWorkflowChecklist() {
  const checklist = readRepoFile(quoteWorkflowChecklistPath);
  const normalized = normalizeWhitespace(checklist);

  assertTracked([quoteWorkflowChecklistPath], 'quote/enquiry workflow acceptance checklist');

  for (const required of [
    'repo-local, template-only, non-live, and not evidence',
    'Public quote/enquiry route expectations',
    'Listing/category/event handoff expectations',
    'Protected admin quote triage expectations',
    'Public copy allowed wording',
    'Public copy forbidden wording',
    'Admin-only internal note boundary',
    'Local acceptance placeholders',
    'Deployment boundary',
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
    '[ROUTE / AREA]',
    '[PUBLIC / PROTECTED ADMIN]',
    '[QUOTE / ENQUIRY CHECK]',
    '[LOCAL ACCEPTANCE STATE: NOT RUN / PASS / NEEDS FOLLOW-UP]',
    '[OWNER INPUT REQUIRED]',
    '[LOCAL FOLLOW-UP]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
  ]) {
    assertIncludes(normalized, required, 'quote/enquiry workflow acceptance checklist');
  }

  assertNoMatch(checklist, filledEvidencePattern, 'quote/enquiry workflow acceptance checklist');
  assertNoMatch(checklist, forbiddenBusinessFactPattern, 'quote/enquiry workflow acceptance checklist');
  assertNoMatch(checklist, forbiddenContactFactPattern, 'quote/enquiry workflow acceptance checklist');
}

function assertCatalogueListingMediaChecklist() {
  const checklist = readRepoFile(catalogueListingMediaChecklistPath);
  const normalized = normalizeWhitespace(checklist);

  assertTracked([catalogueListingMediaChecklistPath], 'catalogue/listing/media acceptance checklist');

  for (const required of [
    'repo-local, template-only, non-live, and not evidence',
    'Public Catalogue Route Expectations',
    'Public Listing Detail Expectations',
    'Public Category Route Expectations',
    'Public Event-Use Handoff Expectations',
    'Protected Admin Listing Category Media Expectations',
    'Media And Alt-Text Expectations',
    'Public Allowed Wording',
    'Public Forbidden Wording',
    'Admin-Only Boundary',
    'Local Acceptance Placeholders',
    'Deployment Boundary',
    '[ROUTE / AREA]',
    '[PUBLIC / PROTECTED ADMIN]',
    '[CATALOGUE / LISTING / MEDIA CHECK]',
    '[LOCAL ACCEPTANCE STATE: NOT RUN / PASS / NEEDS FOLLOW-UP]',
    '[OWNER INPUT REQUIRED]',
    '[LOCAL FOLLOW-UP]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
  ]) {
    assertIncludes(normalized, required, 'catalogue/listing/media acceptance checklist');
  }

  assertNoMatch(checklist, filledEvidencePattern, 'catalogue/listing/media acceptance checklist');
  assertNoMatch(checklist, forbiddenBusinessFactPattern, 'catalogue/listing/media acceptance checklist');
  assertNoMatch(checklist, forbiddenContactFactPattern, 'catalogue/listing/media acceptance checklist');
}


function assertProtectedAdminWriteOpsChecklist() {
  const checklist = readRepoFile(protectedAdminWriteOpsChecklistPath);
  const normalized = normalizeWhitespace(checklist);

  assertTracked([protectedAdminWriteOpsChecklistPath], 'protected admin write-ops acceptance checklist');

  for (const required of [
    'repo-local, template-only, non-live, and not evidence',
    'Listing Write-Operation Expectations',
    'Category Write-Operation Expectations',
    'Media Write-Operation Expectations',
    'Quote Follow-Up Write-Operation Expectations',
    'Protected Admin-Only Wording',
    'Public Exposure Boundary',
    'Safe Validation And Recovery Copy',
    'Forbidden Public/Customer Workflow Additions',
    'Local Acceptance Placeholders',
    'Deployment Boundary',
    '[ROUTE / AREA]',
    '[PROTECTED ADMIN WRITE CHECK]',
    '[WRITE BOUNDARY]',
    '[PUBLIC EXPOSURE: NONE / PUBLIC FIELD ONLY]',
    '[LOCAL ACCEPTANCE STATE: NOT RUN / PASS / NEEDS FOLLOW-UP]',
    '[OWNER INPUT REQUIRED]',
    '[LOCAL FOLLOW-UP]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
  ]) {
    assertIncludes(normalized, required, 'protected admin write-ops acceptance checklist');
  }

  assertNoMatch(checklist, filledEvidencePattern, 'protected admin write-ops acceptance checklist');
  assertNoMatch(checklist, forbiddenBusinessFactPattern, 'protected admin write-ops acceptance checklist');
  assertNoMatch(checklist, forbiddenContactFactPattern, 'protected admin write-ops acceptance checklist');
}

function assertStatusDocs() {
  const status = readRepoFile('docs/PHASE-STATUS.md');
  const currentStatus = normalizeWhitespace(
    status.split('Previous Current Phase 3W-A/B status:')[0] || status,
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
    'Current phase: Phase 3X-A/B - protected admin write-ops hardening, content-operation guardrails, and local acceptance coverage.',
    'Latest completed capability: Phase 3W-A/B catalogue listing media hardening, protected admin content-ops polish, and local acceptance coverage.',
    'Last merged capability PR: #145',
    `Merge commit: \`${phase3wMergeCommit}\``,
  ]) {
    assertIncludes(currentStatus, required, 'Phase 3X status');
  }

  assertIncludes(status, 'Previous Current Phase 3W-A/B status', 'Phase 3X status');
  assertIncludes(status, `Merge commit: \`${phase3vMergeCommit}\``, 'Phase 3W history');
  assertIncludes(status, 'Previous Current Phase 3V-A/B status', 'Phase 3W status');
  assertIncludes(status, `Merge commit: \`${phase3uMergeCommit}\``, 'Phase 3V history');
  assertIncludes(status, 'Previous Current Phase 3U-A/B status', 'Phase 3V status');
  assertIncludes(status, `Merge commit: \`${phase3tMergeCommit}\``, 'Phase 3U history');
  assertIncludes(status, 'Previous Current Phase 3T-A/B status', 'Phase 3U status');
  assertIncludes(status, 'Previous Current Phase 3T-A/B status', 'Phase 3U status');
  assertIncludes(status, `Merge commit: \`${phase3sMergeCommit}\``, 'Phase 3T history');
  assertIncludes(status, 'Previous Current Phase 3S-A/B status', 'Phase 3T status');
  assertIncludes(status, `Merge commit: \`${phase3rMergeCommit}\``, 'Phase 3S history');
  assertIncludes(status, 'Previous Current Phase 3R-A/B status', 'Phase 3S status');
  assertIncludes(
    roadmap,
    'Phase 3X-A/B hardens the protected admin write operations lane',
    'Phase 3X roadmap',
  );
  assertIncludes(
    roadmap,
    'Phase 3V-A/B hardens the public quote/enquiry conversion path and protected admin quote triage',
    'Phase 3V roadmap',
  );
  assertIncludes(
    roadmap,
    'Phase 3U-A/B adds a final local owner handoff pack, acceptance triage board, and deployment decision firewall',
    'Phase 3U roadmap',
  );
  assertIncludes(
    roadmap,
    'Phase 3T-A/B adds a local release-candidate command centre, acceptance-suite orchestration, and no-deploy command allowlist',
    'Phase 3T roadmap',
  );
  assertIncludes(
    roadmap,
    'Phase 3S-A/B adds a repo-local release-candidate acceptance gate, route inventory freeze, and public/admin regression harness',
    'Phase 3S roadmap',
  );
  assertIncludes(readiness, 'Current Phase 3X-A/B status', 'Phase 3X readiness');
  assertIncludes(readiness, 'Previous Current Phase 3W-A/B status', 'Phase 3X readiness');
  assertIncludes(readiness, 'Previous Current Phase 3V-A/B status', 'Phase 3W readiness');
  assertIncludes(readiness, 'Current Phase 3V-A/B status', 'Phase 3V readiness');
  assertIncludes(readiness, 'Previous Current Phase 3U-A/B status', 'Phase 3V readiness');
  assertIncludes(readiness, 'Current Phase 3T-A/B status', 'Phase 3T readiness');
  assertIncludes(readiness, 'Current Phase 3U-A/B status', 'Phase 3U readiness');
  assertIncludes(readiness, 'Previous Current Phase 3T-A/B status', 'Phase 3U readiness');
  assertIncludes(readiness, 'Previous Current Phase 3S-A/B status', 'Phase 3T readiness');
  assertIncludes(readiness, 'Current Phase 3S-A/B status', 'Phase 3S readiness');
  assertIncludes(readiness, 'Previous Current Phase 3R-A/B status', 'Phase 3S readiness');
  assertIncludes(
    decisionLog,
    'Decision: Phase 3X-A/B hardens protected admin listing, category, media, and quote follow-up write operations, content-operation guardrails, and local acceptance coverage.',
    'Phase 3W decision log',
  );
  assertIncludes(
    decisionLog,
    'Decision: Phase 3V-A/B hardens the quote/enquiry workflow, protected admin triage, and local acceptance coverage.',
    'Phase 3V decision log',
  );
  assertIncludes(
    checklist,
    '## Phase 3X-A/B Protected Admin Write-Ops Hardening Content-Operation Guardrails And Local Acceptance Coverage',
    'Phase 3W checklist',
  );
  assertIncludes(
    checklist,
    '## Phase 3V-A/B Quote Enquiry Workflow Hardening Protected Admin Triage Polish And Local Acceptance Coverage',
    'Phase 3V checklist',
  );
  assertIncludes(
    decisionLog,
    'Decision: Phase 3U-A/B adds a final local owner handoff pack, acceptance triage board, and deployment decision firewall.',
    'Phase 3U decision log',
  );
  assertIncludes(
    checklist,
    '## Phase 3U-A/B Final Local Owner Handoff Pack Acceptance Triage Board And Deployment Decision Firewall',
    'Phase 3U checklist',
  );
  assertIncludes(
    decisionLog,
    'Decision: Phase 3T-A/B adds a local release-candidate command centre, acceptance-suite orchestration, and no-deploy command allowlist.',
    'Phase 3T decision log',
  );
  assertIncludes(
    checklist,
    '## Phase 3T-A/B Local Release-Candidate Command Centre Acceptance-Suite Orchestration And No-Deploy Command Allowlist',
    'Phase 3T checklist',
  );
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
  assertIncludes(ownerReviewDocs, commandCentrePath, 'owner review docs');
  assertIncludes(ownerReviewDocs, finalOwnerHandoffPackPath, 'owner review docs');
  assertIncludes(ownerReviewDocs, localAcceptanceTriageBoardPath, 'owner review docs');
  assertIncludes(ownerReviewDocs, deploymentDecisionFirewallPath, 'owner review docs');
  assertIncludes(ownerReviewDocs, quoteWorkflowChecklistPath, 'owner review docs');
  assertIncludes(ownerReviewDocs, catalogueListingMediaChecklistPath, 'owner review docs');
  assertIncludes(ownerReviewDocs, protectedAdminWriteOpsChecklistPath, 'owner review docs');
  assertIncludes(ownerReviewDocs, 'quote/enquiry workflow acceptance checklist', 'owner review docs');
  assertIncludes(ownerReviewDocs, 'catalogue/listing/media', 'owner review docs');
  assertIncludes(ownerReviewDocs, 'final local owner handoff pack', 'owner review docs');
  assertIncludes(ownerReviewDocs, 'local release-candidate command centre', 'owner review docs');
  assertIncludes(ownerReviewDocs, 'local release-candidate acceptance gate', 'owner review docs');
}

function assertProtectedAdminShell() {
  const shell = readRepoFile(protectedAdminShellPath);

  assertIncludes(shell, acceptanceMatrixPath, 'protected admin shell');
  assertIncludes(shell, routeInventoryFreezePath, 'protected admin shell');
  assertIncludes(shell, commandCentrePath, 'protected admin shell');
  assertIncludes(shell, finalOwnerHandoffPackPath, 'protected admin shell');
  assertIncludes(shell, localAcceptanceTriageBoardPath, 'protected admin shell');
  assertIncludes(shell, deploymentDecisionFirewallPath, 'protected admin shell');
  assertIncludes(shell, quoteWorkflowChecklistPath, 'protected admin shell');
  assertIncludes(shell, catalogueListingMediaChecklistPath, 'protected admin shell');
  assertIncludes(shell, protectedAdminWriteOpsChecklistPath, 'protected admin shell');
  assertIncludes(shell, 'localAcceptanceSnapshot', 'protected admin shell');
  assertIncludes(shell, 'localAcceptanceLastLocalUpdate', 'protected admin shell');
  assertIncludes(shell, 'Local release-candidate acceptance snapshot', 'protected admin shell');
  assertIncludes(shell, 'localCommandCentreSnapshot', 'protected admin shell');
  assertIncludes(shell, 'localCommandCentreLastLocalUpdate', 'protected admin shell');
  assertIncludes(shell, 'Local release-candidate command centre snapshot', 'protected admin shell');
  assertIncludes(shell, 'finalOwnerHandoffSnapshot', 'protected admin shell');
  assertIncludes(shell, 'finalOwnerHandoffLastLocalUpdate', 'protected admin shell');
  assertIncludes(shell, 'Final local owner handoff snapshot', 'protected admin shell');
  assertIncludes(shell, 'quoteEnquiryAcceptanceSnapshot', 'protected admin shell');
  assertIncludes(shell, 'quoteEnquiryAcceptanceLastLocalUpdate', 'protected admin shell');
  assertIncludes(shell, 'Quote/enquiry acceptance snapshot', 'protected admin shell');
  assertIncludes(shell, 'catalogueListingMediaAcceptanceSnapshot', 'protected admin shell');
  assertIncludes(shell, 'catalogueMediaAcceptanceLastLocalUpdate', 'protected admin shell');
  assertIncludes(shell, 'Catalogue/listing/media acceptance snapshot', 'protected admin shell');
  assertIncludes(shell, 'protectedAdminWriteOpsAcceptanceSnapshot', 'protected admin shell');
  assertIncludes(shell, 'protectedAdminWriteOpsLastLocalUpdate', 'protected admin shell');
  assertIncludes(shell, 'Protected admin write-ops acceptance snapshot', 'protected admin shell');
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
  assert(
    packageJson.scripts['validate:release-candidate-suite'] ===
      'node scripts/validate-release-candidate-suite.cjs',
    'validate:release-candidate-suite script is missing.',
  );
  assertIncludes(workflow, 'npm run validate:local-release-candidate', '.github/workflows/ci.yml');
}

assertAcceptanceMatrix();
assertRouteInventoryFreeze();
assertCommandCentre();
assertSuiteRunner();
assertFinalOwnerHandoffMaterials();
assertQuoteEnquiryWorkflowChecklist();
assertCatalogueListingMediaChecklist();
assertProtectedAdminWriteOpsChecklist();
assertStatusDocs();
assertProtectedAdminShell();
assertPublicSourceBoundary();
assertForbiddenTrackedPathsAbsent();
assertPackageAndCi();

console.log('Local release-candidate validation passed. No deployment was performed. This does not approve deployment.');
