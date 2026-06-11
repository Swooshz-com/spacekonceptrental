const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const { assertPhase5pSmokeEvidenceIntakeReadiness } = require('./public-review-polish-checks.cjs');
const phase4cDocs = [
  'docs/content/LOCAL-OWNER-REVIEW-REHEARSAL-PACK.md',
  'docs/content/LOCAL-BLOCKER-LEDGER-TEMPLATE.md',
  'docs/content/LOCAL-ACCEPTANCE-DRILL.md',
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
const phase4bMergeCommit = 'baa076679756751a725ea65ac565545c6fe56d76';
const phase151MergeCommit = '9c7d167f98694f2ffbb1d9a0439c9fbbed4a9336';
const phase4dDocs = [
  'docs/content/LOCAL-RELEASE-CANDIDATE-FREEZE.md',
  'docs/content/FULL-SUITE-RELIABILITY-GATE.md',
  'docs/content/DEPLOYMENT-PLANNING-FIREWALL-CLOSURE.md',
];

function fail(message) {
  console.error(`Owner-review rehearsal validation failed: ${message}`);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function trackedFiles(paths) {
  return execFileSync('git', ['ls-files', '--', ...paths], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
    .split(/\r?\n/)
    .filter(Boolean);
}

function assertIncludes(source, expected, label) {
  assert(source.includes(expected), `${label} must include ${expected}`);
}

function assertNoMatch(source, pattern, label) {
  assert(!pattern.test(source), `${label} contains forbidden ${pattern}`);
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

function trackedProductionSource(paths) {
  return trackedFiles(paths)
    .filter(isProductionSource)
    .map(readRepoFile)
    .join('\n');
}

function assertDocsExistAndContainBoundaries() {
  const tracked = trackedFiles(phase4cDocs).sort();
  assert(JSON.stringify(tracked) === JSON.stringify([...phase4cDocs].sort()), 'Phase 4C docs must be tracked.');
  const combined = phase4cDocs.map(readRepoFile).join('\n');

  for (const required of [
    'repo-local, template-only, non-live, and not evidence',
    '[NOT EVIDENCE / NOT RECORDED]',
    '[DEPLOYMENT APPROVAL: NOT GRANTED]',
    '[OWNER INPUT NEEDED:',
    '[MISSING OWNER INPUT:',
    '[LOCAL CORRECTION PLACEHOLDER:',
    'Public exposure boundary',
    'Evidence status',
    'Deployment approval status',
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
    assertIncludes(combined, required, 'Phase 4C docs');
  }

  assertNoMatch(
    combined,
    /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|preview evidence captured|production evidence captured|actual owner decision|actual owner sign-off|manual QA completed|acceptance passed on/i,
    'Phase 4C docs',
  );
}

function assertStatusRollForward() {
  const combined = statusDocPaths.map(readRepoFile).join('\n');
  for (const required of [
    'Last merged capability PR: #150',
    phase4bMergeCommit,
    'Latest completed capability: Phase 4B-A/B owner-input intake control, local correction queue, and review-ready handoff closure',
    'Current phase: Phase 4C-A/B local owner-review rehearsal pack, blocker ledger, and acceptance drill validator',
    ...phase4cDocs,
    'scripts/validate-owner-review-rehearsal.cjs',
    'validate:owner-review-rehearsal',
  ]) {
    assertIncludes(combined, required, 'status docs');
  }
}

function assertAdminReleaseControl() {
  const shell = readRepoFile('website/app/admin/protected-admin-shell.tsx');
  const route = readRepoFile('website/app/admin/release-control/page.tsx');
  for (const required of [
    'Phase 4C-A/B local owner-review rehearsal',
    'phase4cOwnerReviewRehearsalSnapshot',
    'phase4cOwnerReviewRehearsalDocs',
    ...phase4cDocs,
    'Owner input boundary',
    'Local correction boundary',
    'Public exposure boundary',
    'Evidence boundary',
    'Deployment approval boundary',
  ]) {
    assertIncludes(shell, required, 'protected admin shell');
  }
  assertIncludes(route, 'view={{ kind: "release-control" }}', 'release-control route');
}

function assertPhase4dLocalFreeze() {
  const tracked = trackedFiles(phase4dDocs).sort();
  assert(JSON.stringify(tracked) === JSON.stringify([...phase4dDocs].sort()), 'Phase 4D local-freeze docs must be tracked.');
  const statusDocs = normalizeWhitespace(statusDocPaths.map(readRepoFile).join('\n'));
  for (const required of [
    'Current phase: Phase 4D-A/B local release-candidate freeze, full-suite reliability gate, and deployment-planning firewall closure',
    'Latest completed capability: Phase 4C-A/B local owner-review rehearsal pack, blocker ledger, and acceptance drill validator',
    'Last merged capability PR: #151',
    phase151MergeCommit,
    'validate:local-freeze',
    ...phase4dDocs,
  ]) {
    assertIncludes(statusDocs, required, 'Phase 4D status docs');
  }
  const shell = readRepoFile('website/app/admin/protected-admin-shell.tsx');
  for (const required of ['phase4dLocalFreezeSnapshot', 'phase4dLocalFreezeDocs', ...phase4dDocs]) {
    assertIncludes(shell, required, 'protected admin shell Phase 4D snapshot');
  }
  const packageJson = JSON.parse(readRepoFile('package.json'));
  assert(
    packageJson.scripts['validate:local-freeze'] === 'node scripts/validate-local-freeze.cjs',
    'validate:local-freeze script is missing.',
  );
  execFileSync('node', ['scripts/validate-local-freeze.cjs'], { cwd: repoRoot, stdio: 'inherit' });
}

function assertNoFilledEvidenceOrForbiddenTrackedFiles() {
  const tracked = trackedFiles(['.']);
  const forbiddenPrefixes = [
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
  ];
  const matches = tracked.filter((filePath) => forbiddenPrefixes.some((prefix) => filePath === prefix || filePath.startsWith(`${prefix}/`)));
  assert(matches.length === 0, `forbidden tracked files present: ${matches.join(', ')}`);

}

function assertPublicSourceSafe() {
  const publicSource = trackedProductionSource(publicSourceRoots);
  for (const required of ['listing', 'enquiry', 'quote', 'request', 'rental', 'event furniture']) {
    assert(new RegExp(required, 'i').test(publicSource), `public source must retain ${required} wording.`);
  }
  assertNoMatch(
    publicSource,
    /local owner-review rehearsal pack|local blocker ledger template|local acceptance drill|owner-input intake control|local correction queue|review-ready handoff closure|release-control internals|owner-review templates|protected admin urls|internal notes|recovery lane statuses|destructive-action safeguards|status-transition matrix details|\/admin\//i,
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

function assertReleaseCandidateSuiteNotWeakened() {
  const source = readRepoFile('scripts/validate-release-candidate-suite.cjs');
  assertNoMatch(source, /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i, 'release-candidate suite');
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
    packageJson.scripts['validate:owner-review-rehearsal'] === 'node scripts/validate-owner-review-rehearsal.cjs',
    'validate:owner-review-rehearsal script is missing.',
  );
}

assertDocsExistAndContainBoundaries();
assertStatusRollForward();
assertAdminReleaseControl();
assertNoFilledEvidenceOrForbiddenTrackedFiles();
assertPublicSourceSafe();
assertReleaseCandidateSuiteNotWeakened();

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
assertPhase4dLocalFreeze();
assertPhase4fOwnerHandoffBundle();

assertPhase5pSmokeEvidenceIntakeReadiness();

console.log('Owner-review rehearsal validation passed. No deployment was performed. This does not approve deployment.');
