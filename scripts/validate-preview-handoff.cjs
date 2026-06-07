const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const handoffDocPath = 'docs/PREVIEW-DEPLOYMENT-HANDOFF.md';
const branchFreezeDocPath = 'docs/PREVIEW-DEPLOYMENT-BRANCH-FREEZE.md';
const handoffValidatorPath = 'scripts/validate-preview-handoff.cjs';
const phase2pMergeCommit = '15a5d23941ac7fbe3297792311f50e414d622f5f';
const phase2qMergeCommit = '62c2b11b6b15192434eb4035ba0a66a44cd6f763';
const phase3aMergeCommit = '6e8bcf23bc8d7eef12b738613344764c0c1961e6';
const phase3bMergeCommit = 'bfcf9916a0edd1b7133a1765719b9ddd73197dac';
const phase3cMergeCommit = 'd031d7f47a6893f92d0b6739300d52147f6abfa4';
const phase3dMergeCommit = 'de357ee234ed1d92ab27eb1f6d571c0c4f0ccd04';

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

  assertTracked([handoffDocPath, branchFreezeDocPath], 'handoff docs');

  for (const required of [
    'No deployment is performed by this PR.',
    'This does not approve deployment.',
    'Future preview deployment requires explicit later approval.',
    'Approve preview deployment',
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
    assertIncludes(docs, required, 'handoff docs');
  }

  assertNoMatch(docs, /https?:\/\/|www\./i, 'handoff docs');
  assertNoMatch(
    docs,
    /\b(?:sk|pk|rk|gh[pousr]|xox[baprs])_[A-Za-z0-9_-]{8,}\b/i,
    'handoff docs',
  );
  assertNoMatch(docs, /eyJ[A-Za-z0-9_-]{20,}/, 'handoff docs');
}

function assertStatusDocs() {
  const status = readRepoFile('docs/PHASE-STATUS.md');
  const roadmap = readRepoFile('docs/PHASE-ROADMAP.md').replace(/\s+/g, ' ');
  const readiness = readRepoFile('docs/PHASE-2-READINESS-PLAN.md');
  const decisionLog = readRepoFile('docs/DECISION-LOG.md');
  const checklist = readRepoFile('docs/checklists/PHASE-2-ADMIN-OPS.md');

  assertIncludes(
    status,
    'Current phase: Phase 3E-A/B - product readiness, navigation QA, and dead-end polish.',
    'phase status',
  );
  assertIncludes(
    status,
    'Latest completed capability: Phase 3D-A/B sitewide public journey, trust content, and route polish.',
    'phase status',
  );
  assertIncludes(status, 'Last merged capability PR: #126', 'phase status');
  assertIncludes(status, `Merge commit: \`${phase3dMergeCommit}\``, 'phase status');
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
  assertIncludes(readiness, 'Current Phase 3E-A/B status', 'readiness plan');
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
    'Decision: Phase 3E-A/B adds product readiness, navigation QA, and public/admin dead-end polish.',
    'decision log',
  );
  assertIncludes(
    checklist,
    '## Phase 3E-A/B Product Readiness Navigation QA And Public Admin Dead-End Polish',
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
assertStatusDocs();
assertStaticScope();
assertValidatorSafety();

console.log('Preview handoff validation passed. No deployment was performed. This does not approve deployment.');
