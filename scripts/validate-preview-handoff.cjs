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
const handoffValidatorPath = 'scripts/validate-preview-handoff.cjs';
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
    'Not-found/recovery states',
    'docs/content/OWNER-CONTENT-INTAKE.md',
    'docs/content/CONTENT-GAP-REGISTER.md',
    'Owner content blockers',
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

function assertStatusDocs() {
  const status = readRepoFile('docs/PHASE-STATUS.md');
  const roadmap = readRepoFile('docs/PHASE-ROADMAP.md').replace(/\s+/g, ' ');
  const readiness = readRepoFile('docs/PHASE-2-READINESS-PLAN.md');
  const decisionLog = readRepoFile('docs/DECISION-LOG.md');
  const checklist = readRepoFile('docs/checklists/PHASE-2-ADMIN-OPS.md');

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
  assertIncludes(readiness, 'Current Phase 3K-A/B status', 'readiness plan');
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
  assertNoTracked(['website/chat-config.js'], 'legacy local chat config');
  assertNoTracked(['website/app/api/customer-uploads'], 'customer upload routes');
  assertNoTracked(['website/app/api/public/uploads'], 'public upload routes');
  assertNoTracked(['website/app/api/customer-accounts'], 'customer account routes');
  assertNoTracked(['website/app/api/quote-tracking'], 'public quote tracking routes');
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
assertStatusDocs();
assertStaticScope();
assertValidatorSafety();

console.log('Preview handoff validation passed. No deployment was performed. This does not approve deployment.');
