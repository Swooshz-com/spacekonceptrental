const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const smokeScriptPath = 'scripts/smoke-preview.cjs';
const smokeValidatorPath = 'scripts/validate-preview-smoke-harness.cjs';
const rollbackDrillPath = 'docs/PREVIEW-ROLLBACK-DRILL.md';
const smokeTemplatePaths = [
  'docs/templates/preview-smoke-result-template.md',
  'docs/templates/rollback-drill-result-template.md',
];
const phase2oMergeCommit = '81431f13836e0b9b182aaca9638ae2e07abd7571';

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

function assertNoMatch(source, pattern, label) {
  assert(!pattern.test(source), `${label} contains forbidden content.`);
}

function assertIncludes(source, needle, label) {
  assert(source.includes(needle), `${label} is missing required text: ${needle}`);
}

function runSmokeFailClosed(extraEnv) {
  const env = { ...process.env, ...extraEnv };

  delete env.SKR_PREVIEW_BASE_URL;

  if (Object.hasOwn(extraEnv, 'SKR_PREVIEW_BASE_URL')) {
    env.SKR_PREVIEW_BASE_URL = extraEnv.SKR_PREVIEW_BASE_URL;
  }

  return spawnSync('node', [smokeScriptPath], {
    cwd: repoRoot,
    encoding: 'utf8',
    env,
  });
}

function assertSmokeHarness() {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  const smokeSource = readRepoFile(smokeScriptPath);
  const workflow = readRepoFile('.github/workflows/ci.yml');
  const unsafeLocalPreview = `http:${'//'}localhost:3000`;
  const fetchCallNeedle = 'fetch' + '(';

  assert(packageJson.scripts['smoke:preview'] === 'node scripts/smoke-preview.cjs', 'smoke:preview script is missing.');
  assert(
    packageJson.scripts['validate:preview-smoke-harness'] ===
      'node scripts/validate-preview-smoke-harness.cjs',
    'validate:preview-smoke-harness script is missing.',
  );
  assertIncludes(smokeSource, 'SKR_PREVIEW_BASE_URL', smokeScriptPath);
  assertIncludes(smokeSource, 'assertSafePreviewBaseUrl', smokeScriptPath);
  assertIncludes(smokeSource, 'redactPreviewBaseUrl', smokeScriptPath);
  assertIncludes(smokeSource, fetchCallNeedle, smokeScriptPath);
  assertIncludes(smokeSource, '/', smokeScriptPath);
  assertIncludes(smokeSource, '/listings', smokeScriptPath);
  assertIncludes(smokeSource, '/categories', smokeScriptPath);
  assertIncludes(smokeSource, '/quote', smokeScriptPath);
  assertIncludes(smokeSource, '/api/chat', smokeScriptPath);
  assertIncludes(smokeSource, '/admin', smokeScriptPath);
  assertIncludes(smokeSource, 'unsafe_preview_base_url', smokeScriptPath);
  assertNoMatch(smokeSource, /https?:\/\/|www\./i, smokeScriptPath);
  assertNoMatch(smokeSource, /\bdotenv\b|readFileSync|["']\.env/i, smokeScriptPath);
  assertNoMatch(smokeSource, /\bvercel\s+(?:deploy|link|env|pull|promote)\b/i, smokeScriptPath);
  assertNoMatch(
    smokeSource,
    /\bsupabase\s+(?:link|login|db|secrets|projects|functions)\b/i,
    smokeScriptPath,
  );
  assertNoMatch(smokeSource, /\bn8n\s+(?:import|execute|start)\b/i, smokeScriptPath);
  assertNoMatch(smokeSource, /PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i, smokeScriptPath);
  assertNoMatch(smokeSource, /process\.env\.(?!SKR_PREVIEW_BASE_URL\b)/, smokeScriptPath);
  assert(!workflow.includes('npm run smoke:preview'), 'live smoke:preview must not run in CI.');
  assertIncludes(workflow, 'npm run validate:preview-smoke-harness', '.github/workflows/ci.yml');

  const missing = runSmokeFailClosed({});
  const missingOutput = `${missing.stdout}\n${missing.stderr}`;

  assert(missing.status !== 0, 'smoke:preview must fail without SKR_PREVIEW_BASE_URL.');
  assert(
    missingOutput.includes('SKR_PREVIEW_BASE_URL'),
    'missing-url failure must name SKR_PREVIEW_BASE_URL.',
  );

  const unsafe = runSmokeFailClosed({
    SKR_PREVIEW_BASE_URL: unsafeLocalPreview,
  });
  const unsafeOutput = `${unsafe.stdout}\n${unsafe.stderr}`;

  assert(unsafe.status !== 0, 'smoke:preview must reject unsafe local preview URLs.');
  assert(
    unsafeOutput.includes('unsafe_preview_base_url'),
    'unsafe-url failure must use the safe reason.',
  );
  assert(
    !unsafeOutput.includes('localhost:3000'),
    'unsafe-url failure must not print the supplied preview URL.',
  );
}

function assertRollbackDocs() {
  const docs = [
    readRepoFile(rollbackDrillPath),
    ...smokeTemplatePaths.map(readRepoFile),
  ].join('\n');

  assertTracked([rollbackDrillPath, ...smokeTemplatePaths], 'rollback drill docs/templates');

  for (const required of [
    'No deployment is performed by this PR.',
    'Do not commit filled preview or production evidence.',
    'Rollback is performed only after explicit operator approval.',
    'Abort Triggers',
    '<redacted>',
    '<reviewed externally>',
  ]) {
    assertIncludes(docs, required, 'rollback drill docs/templates');
  }

  assertNoMatch(docs, /https?:\/\/|www\./i, 'rollback drill docs/templates');
  assertNoMatch(
    docs,
    /\b(?:sk|pk|rk|gh[pousr]|xox[baprs])_[A-Za-z0-9_-]{8,}\b/i,
    'rollback drill docs/templates',
  );
  assertNoMatch(docs, /eyJ[A-Za-z0-9_-]{20,}/, 'rollback drill docs/templates');
}

function assertStatusDocs() {
  const status = readRepoFile('docs/PHASE-STATUS.md');
  const roadmap = readRepoFile('docs/PHASE-ROADMAP.md');
  const readiness = readRepoFile('docs/PHASE-2-READINESS-PLAN.md');
  const decisionLog = readRepoFile('docs/DECISION-LOG.md');
  const checklist = readRepoFile('docs/checklists/PHASE-2-ADMIN-OPS.md');

  assertIncludes(
    status,
    'Current phase: Phase 2P-A/B - external preview smoke harness and rollback drill package.',
    'phase status',
  );
  assertIncludes(
    status,
    'Latest completed capability: Phase 2O-A/B preview deployment approval package and operator evidence templates.',
    'phase status',
  );
  assertIncludes(status, 'Last merged capability PR: #120', 'phase status');
  assertIncludes(status, `Merge commit: \`${phase2oMergeCommit}\``, 'phase status');
  assertIncludes(
    roadmap.replace(/\s+/g, ' '),
    'Phase 2P-A/B adds an external preview smoke harness and rollback drill package',
    'phase roadmap',
  );
  assertIncludes(readiness, 'Current Phase 2P-A/B status', 'readiness plan');
  assertIncludes(
    decisionLog,
    'Decision: Phase 2P-A/B adds an operator-run external preview smoke harness and rollback drill package.',
    'decision log',
  );
  assertIncludes(
    checklist,
    '## Phase 2P-A/B External Preview Smoke Harness And Rollback Drill Package',
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

assertSmokeHarness();
assertRollbackDocs();
assertStatusDocs();
assertStaticScope();

console.log('Preview smoke harness validation passed. No deployment was performed. Live smoke was not run.');
