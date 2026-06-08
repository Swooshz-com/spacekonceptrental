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
const contentReadinessRoutePath = 'website/app/admin/content-readiness/page.tsx';
const protectedAdminShellPath = 'website/app/admin/protected-admin-shell.tsx';
const handoffValidatorPath = 'scripts/validate-preview-handoff.cjs';
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

function assertStatusDocs() {
  const status = readRepoFile('docs/PHASE-STATUS.md');
  const roadmap = readRepoFile('docs/PHASE-ROADMAP.md').replace(/\s+/g, ' ');
  const readiness = readRepoFile('docs/PHASE-2-READINESS-PLAN.md');
  const decisionLog = readRepoFile('docs/DECISION-LOG.md');
  const checklist = readRepoFile('docs/checklists/PHASE-2-ADMIN-OPS.md');

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
    /Owner input required|Ready for owner review|Blocks owner review|Blocks launch\/deployment|Deferred after launch|Not in scope by owner direction|Requires separate deployment approval|Correction template only|Owner-demo walkthrough|Owner-demo walkthrough snapshot|Owner-review issue ledger|Owner-review execution checklist|Owner-review dry-run packet|Owner-review correction intake|Owner-review closure packet|Owner-review closure sign-off template|deployment approval separation|Closure readiness snapshot|Current owner-review closure state|DEPLOYMENT APPROVAL: NOT GRANTED|findings disposition|launch decision rehearsal|launch-blocker freeze gate|correction PR plan|Dry-run review snapshot|Correction\/freeze snapshot|route decision matrix|content readiness workspace|admin-only readiness|Protected admin content readiness|\/admin\/content-readiness|admin issue ledger|owner decision needed|owner-only statuses|Admin-only notes/i,
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
assertStatusDocs();
assertProtectedContentReadinessWorkspace();
assertPublicCopyFactSafety();
assertStaticScope();
assertValidatorSafety();

console.log('Preview handoff validation passed. No deployment was performed. This does not approve deployment.');
