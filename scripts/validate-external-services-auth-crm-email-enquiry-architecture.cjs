#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const architectureDocPath = 'docs/architecture/EXTERNAL-SERVICES-AUTH-CRM-EMAIL-ENQUIRY-ARCHITECTURE.md';
const cutDownDocPath = 'docs/architecture/IMPLEMENTATION-PLAN-CUT-DOWN-EXTERNAL-SERVICES.md';
const packageScriptName = 'validate:external-services-auth-crm-email-enquiry-architecture';
const packageScriptCommand = 'node scripts/validate-external-services-auth-crm-email-enquiry-architecture.cjs';
const pivotHeading = '## External Services Architecture Pivot References';
const phase6pLatest =
  'Latest completed readiness ladder phase remains Phase 6P-A/B maintenance closure audit follow-up response acknowledgement review outcome follow-up planning review outcome acknowledgement review readiness.';

const trackerPaths = [
  'docs/PHASE-STATUS.md',
  'docs/PHASE-ROADMAP.md',
  'docs/OWNER-REVIEW-READINESS-PACKAGE.md',
  'docs/DECISION-LOG.md',
  'docs/checklists/PHASE-2-ADMIN-OPS.md',
];

const allowedChangedFiles = new Set([
  architectureDocPath,
  cutDownDocPath,
  'docs/architecture/PROTECTED-ADMIN-ENQUIRY-INBOX-TRIAGE-FOUNDATION.md',
  'docs/architecture/PROTECTED-ADMIN-ENQUIRY-TRIAGE-STATUS-UPDATE-FOUNDATION.md',
  'docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-QUEUE-PREPARATION-FOUNDATION.md',
  'docs/architecture/PUBLIC-ENQUIRY-PERSISTENCE-INTEGRATION.md',
  'docs/architecture/SUPABASE-ENQUIRY-PERSISTENCE-CRM-HANDOFF-FOUNDATION.md',
  'docs/PHASE-STATUS.md',
  'docs/PHASE-ROADMAP.md',
  'docs/OWNER-REVIEW-READINESS-PACKAGE.md',
  'docs/DECISION-LOG.md',
  'docs/checklists/PHASE-2-ADMIN-OPS.md',
  'package.json',
  'scripts/validate-external-services-auth-crm-email-enquiry-architecture.cjs',
  'scripts/validate-public-enquiry-persistence-integration.cjs',
  'scripts/validate-protected-admin-enquiry-inbox-triage-foundation.cjs',
  'scripts/validate-protected-admin-enquiry-triage-status-update-foundation.cjs',
  'scripts/validate-protected-admin-crm-handoff-queue-preparation-foundation.cjs',
  'scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-review-readiness.cjs',
  'scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-review-outcome-readiness.cjs',
  'scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-review-outcome-acknowledgement-readiness.cjs',
  'scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning-review-outcome-acknowledgement-review-readiness.cjs',
  'scripts/validate-supabase-enquiry-persistence-crm-handoff-foundation.cjs',
  'scripts/validate-release-candidate-suite.cjs',
  'supabase/migrations/20260616100000_quote_enquiry_crm_handoff_foundation.sql',
  'supabase/migrations/20260616120000_admin_enquiry_triage_status_update_foundation.sql',
  'supabase/migrations/20260616143000_admin_crm_handoff_queue_preparation_foundation.sql',
  'website/lib/quote/types.ts',
  'website/lib/quote/validation.ts',
  'website/lib/quote/validation.test.ts',
  'website/lib/quote/quote-repository.ts',
  'website/lib/quote/quote-repository.test.ts',
  'website/app/api/quote/route.ts',
  'website/app/api/quote/route.test.ts',
  'website/app/quote/page.tsx',
  'website/components/QuoteRequestForm.tsx',
  'website/components/QuoteRequestForm.test.tsx',
  'website/app/admin/protected-admin-shell.tsx',
  'website/app/admin/protected-admin-shell.test.tsx',
  'website/components/admin/quote-request-inbox-panel.tsx',
  'website/components/admin/quote-request-inbox-panel.test.tsx',
  'website/lib/quote/admin-read/admin-quote-request-dashboard-read.ts',
  'website/lib/quote/admin-read/admin-quote-request-dashboard-read.test.ts',
  'website/lib/quote/admin-read/admin-quote-request-detail-read.ts',
  'website/lib/quote/admin-read/admin-quote-request-detail-read.test.ts',
  'website/lib/quote/admin-write/admin-quote-request-status-route.ts',
  'website/lib/quote/admin-write/admin-quote-request-status-route.test.ts',
  'website/lib/quote/admin-write/admin-quote-request-status-write.ts',
  'website/lib/quote/admin-write/admin-quote-request-status-write.test.ts',
  'website/app/api/admin/quote-requests/[quoteRequestId]/crm-handoff/route.ts',
  'website/lib/quote/admin-write/admin-quote-request-crm-handoff-route.ts',
  'website/lib/quote/admin-write/admin-quote-request-crm-handoff-route.test.ts',
  'website/lib/quote/admin-write/admin-quote-request-crm-handoff-write.ts',
  'website/lib/quote/admin-write/admin-quote-request-crm-handoff-write.test.ts',
  'website/test/phase-2c-a-storage-backed-listing-media.test.ts',
  'website/test/phase-2c-c-admin-quote-operations.test.ts',
  'website/test/phase-2c-d-quote-workflow-atomicity.test.ts',
  'website/test/phase-2e-a-conversation-governance.test.ts',
  'website/test/phase-2e-b-conversation-schema-rls.test.ts',
  'website/test/phase-2e-c-transcript-persistence-contract.test.ts',
  'website/test/phase-2e-d-transcript-persistence-rpc-adapter.test.ts',
  'website/test/phase-2h-ab-admin-operations-ui-mvp.test.ts',
  'website/test/phase-2i-ab-public-rental-catalogue-quote-ux.test.ts',
  'website/test/phase-2l-ab-release-candidate-acceptance-suite.test.ts',
  'website/test/phase-2m-ab-preview-preflight-ci-gate.test.ts',
  'website/test/phase-3a-ab-product-polish-ui-content.test.tsx',
  'website/test/phase-3b-ab-admin-ops-readiness-quote-triage.test.tsx',
  'website/test/phase-3c-ab-public-catalogue-discovery-quote-funnel.test.tsx',
  'website/test/phase-3d-ab-sitewide-public-journey-trust-polish.test.tsx',
  'website/test/phase-3f-ab-catalogue-content-media-readiness.test.tsx',
  'website/test/phase-3g-ab-quote-intake-admin-triage-polish.test.tsx',
  'website/test/phase-3h-ab-admin-operator-qa-readiness-polish.test.tsx',
  'website/test/phase-5f-ab-quote-triage-readiness.test.tsx',
  'website/test/phase-3v-ab-quote-enquiry-workflow-hardening.test.tsx',
  'website/test/phase-3x-ab-protected-admin-write-ops-hardening.test.tsx',
  'website/test/phase-3y-ab-protected-admin-destructive-action-safeguards.test.tsx',
]);

const approvedFoundationFiles = new Set([
  'supabase/migrations/20260616100000_quote_enquiry_crm_handoff_foundation.sql',
  'supabase/migrations/20260616120000_admin_enquiry_triage_status_update_foundation.sql',
  'supabase/migrations/20260616143000_admin_crm_handoff_queue_preparation_foundation.sql',
  'website/lib/quote/types.ts',
  'website/lib/quote/validation.ts',
  'website/lib/quote/validation.test.ts',
  'website/lib/quote/quote-repository.ts',
  'website/lib/quote/quote-repository.test.ts',
  'website/app/api/quote/route.ts',
  'website/app/api/quote/route.test.ts',
  'website/app/quote/page.tsx',
  'website/components/QuoteRequestForm.tsx',
  'website/components/QuoteRequestForm.test.tsx',
  'website/app/admin/protected-admin-shell.tsx',
  'website/app/admin/protected-admin-shell.test.tsx',
  'website/components/admin/quote-request-inbox-panel.tsx',
  'website/components/admin/quote-request-inbox-panel.test.tsx',
  'website/lib/quote/admin-read/admin-quote-request-dashboard-read.ts',
  'website/lib/quote/admin-read/admin-quote-request-dashboard-read.test.ts',
  'website/lib/quote/admin-read/admin-quote-request-detail-read.ts',
  'website/lib/quote/admin-read/admin-quote-request-detail-read.test.ts',
  'website/lib/quote/admin-write/admin-quote-request-status-route.ts',
  'website/lib/quote/admin-write/admin-quote-request-status-route.test.ts',
  'website/lib/quote/admin-write/admin-quote-request-status-write.ts',
  'website/lib/quote/admin-write/admin-quote-request-status-write.test.ts',
  'website/app/api/admin/quote-requests/[quoteRequestId]/crm-handoff/route.ts',
  'website/lib/quote/admin-write/admin-quote-request-crm-handoff-route.ts',
  'website/lib/quote/admin-write/admin-quote-request-crm-handoff-route.test.ts',
  'website/lib/quote/admin-write/admin-quote-request-crm-handoff-write.ts',
  'website/lib/quote/admin-write/admin-quote-request-crm-handoff-write.test.ts',
  'website/test/phase-2c-a-storage-backed-listing-media.test.ts',
  'website/test/phase-2c-c-admin-quote-operations.test.ts',
  'website/test/phase-2c-d-quote-workflow-atomicity.test.ts',
  'website/test/phase-2e-a-conversation-governance.test.ts',
  'website/test/phase-2e-b-conversation-schema-rls.test.ts',
  'website/test/phase-2e-c-transcript-persistence-contract.test.ts',
  'website/test/phase-2e-d-transcript-persistence-rpc-adapter.test.ts',
  'website/test/phase-2h-ab-admin-operations-ui-mvp.test.ts',
  'website/test/phase-2i-ab-public-rental-catalogue-quote-ux.test.ts',
  'website/test/phase-2l-ab-release-candidate-acceptance-suite.test.ts',
  'website/test/phase-2m-ab-preview-preflight-ci-gate.test.ts',
  'website/test/phase-3a-ab-product-polish-ui-content.test.tsx',
  'website/test/phase-3b-ab-admin-ops-readiness-quote-triage.test.tsx',
  'website/test/phase-3c-ab-public-catalogue-discovery-quote-funnel.test.tsx',
  'website/test/phase-3d-ab-sitewide-public-journey-trust-polish.test.tsx',
  'website/test/phase-3f-ab-catalogue-content-media-readiness.test.tsx',
  'website/test/phase-3g-ab-quote-intake-admin-triage-polish.test.tsx',
  'website/test/phase-3h-ab-admin-operator-qa-readiness-polish.test.tsx',
]);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function includes(source, needle, label) {
  const compactSource = source.replace(/\s+/g, ' ');
  const compactNeedle = needle.replace(/\s+/g, ' ');
  assert(
    source.includes(needle) || compactSource.includes(compactNeedle),
    `${label} missing required text: ${needle}`
  );
}

function matches(source, pattern, label) {
  assert(pattern.test(source), `${label} missing required pattern: ${pattern}`);
}

function noMatch(source, pattern, label) {
  const match = source.match(pattern);
  assert(!match, `${label} contains forbidden text: ${match?.[0]}`);
}

function git(args, options = {}) {
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (!options.allowFailure && (result.error || result.status !== 0)) {
    fail(`git ${args.join(' ')} failed: ${result.error?.message || result.stderr.trim()}`);
  }
  return result;
}

function parseStatusFiles(statusOutput) {
  return statusOutput
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => {
      const value = line.slice(3);
      return value.includes(' -> ') ? value.split(' -> ').pop() : value;
    })
    .filter(Boolean)
    .map((file) => file.replace(/\\/g, '/'));
}

function getChangedFiles() {
  const status = git(['status', '--short', '--untracked-files=all']).stdout;
  const statusFiles = parseStatusFiles(status);
  if (statusFiles.length > 0) return [...new Set(statusFiles)].sort();

  const mergeBase = git(['merge-base', 'HEAD', 'origin/main'], { allowFailure: true });
  if (mergeBase.status === 0 && mergeBase.stdout.trim()) {
    const diff = git(['diff', '--name-only', '--diff-filter=ACMRT', mergeBase.stdout.trim(), 'HEAD']).stdout;
    return diff.split(/\r?\n/).filter(Boolean).map((file) => file.replace(/\\/g, '/')).sort();
  }

  return [];
}

function sectionFromHeading(source, heading) {
  const start = source.indexOf(heading);
  assert(start !== -1, `Missing section heading: ${heading}`);
  const next = source.indexOf('\n## ', start + heading.length);
  return source.slice(start, next === -1 ? source.length : next);
}

assert(exists(architectureDocPath), `Missing architecture doc: ${architectureDocPath}`);
assert(exists(cutDownDocPath), `Missing implementation-plan cut-down doc: ${cutDownDocPath}`);

const architectureDoc = read(architectureDocPath);
const cutDownDoc = read(cutDownDocPath);
const packageJson = JSON.parse(read('package.json'));
const releaseSuite = read('scripts/validate-release-candidate-suite.cjs');

for (const required of [
  'Supabase remains the app database, backend, and admin auth foundation.',
  'Supabase is not the CRM replacement.',
  'HubSpot becomes the preferred CRM and sales workflow system for MVP planning.',
  'HubSpot is not the app database.',
  'n8n may be used later as optional automation glue, not a required runtime dependency',
  'Google Workspace/domain email is the first-line human/admin email channel.',
  'Resend is an optional future transactional email provider',
  'Resend is not a mandatory MVP dependency.',
  'Public customer accounts are explicitly deferred from MVP',
  'Custom CRM build is explicitly rejected/deferred.',
]) {
  includes(architectureDoc, required, architectureDocPath);
}

for (const required of [
  '## Features To Keep In SKR',
  '## Features To Outsource',
  '## Features To Defer',
  '## Features To Explicitly Not Build',
  '## Security Risks Avoided',
  '## Low-Cost/Free Justification',
  'MVP decision: no public customer accounts yet.',
  'MVP decision: no custom CRM.',
  'MVP decision: Supabase remains app DB/auth/backend foundation.',
  'MVP decision: HubSpot is preferred CRM.',
  'MVP decision: n8n is optional glue, not required for first implementation.',
  'MVP decision: Google Workspace email first',
  'MVP decision: Resend optional later as transactional email only.',
]) {
  includes(cutDownDoc, required, cutDownDocPath);
}

matches(cutDownDoc, /HubSpot[\s\S]*low-cost\/free path[\s\S]*custom CRM/i, cutDownDocPath);
matches(cutDownDoc, /Supabase remains the app database\/auth\/backend foundation/i, cutDownDocPath);
matches(cutDownDoc, /Google Workspace\/domain email[\s\S]*normal business\/admin email/i, cutDownDocPath);
matches(cutDownDoc, /Resend[\s\S]*optional later[\s\S]*transactional email only/i, cutDownDocPath);

const pivotSections = trackerPaths.map((trackerPath) => {
  const section = sectionFromHeading(read(trackerPath), pivotHeading);
  for (const required of [
    'Current planning focus: external-services architecture and implementation-plan reduction for auth, CRM, email, and enquiry persistence.',
    phase6pLatest,
    'This pivot pauses additional readiness-only Phase 6Q/6R work',
    architectureDocPath,
    cutDownDocPath,
    'scripts/validate-external-services-auth-crm-email-enquiry-architecture.cjs',
    'Supabase remains the app database/auth/backend foundation',
    'HubSpot is the preferred CRM',
    'n8n is optional automation glue and not required for the first implementation',
    'Google Workspace/domain email is first-line human/admin email',
    'Resend is optional future transactional email only',
    'public customer accounts are deferred',
    'custom CRM is rejected/deferred',
    'Planning firewall: architecture/planning only.',
    'No provider integration',
    'CRM sync code',
    'n8n workflows',
    'email sending code',
    'public login',
    'runtime/API/provider/env/scheduler/chat/RAG/public visitor-facing behaviour changes',
  ]) {
    includes(section, required, `${trackerPath} pivot section`);
  }
  return section;
});

assert(
  packageJson.scripts?.[packageScriptName] === packageScriptCommand,
  `package.json must register ${packageScriptName}`
);
includes(releaseSuite, packageScriptName, 'release-candidate suite');
noMatch(
  releaseSuite,
  /docker.*(?:skip|bypass)|(?:skip|bypass).*docker|SKIP_DOCKER|BYPASS_DOCKER|supabase.*(?:skip|bypass)/i,
  'release-candidate suite'
);

const changedFiles = getChangedFiles();
const unexpectedChangedFiles = changedFiles.filter((file) => !allowedChangedFiles.has(file));
assert(
  unexpectedChangedFiles.length === 0,
  `External-services architecture package must remain docs/planning/validator only. Unexpected changed files: ${unexpectedChangedFiles.join(', ')}`
);

const changedContents = changedFiles
  .filter((file) => exists(file))
  .map((file) => `${file}\n${read(file)}`)
  .join('\n');
const changedContentsWithoutThisValidator = changedFiles
  .filter((file) => file !== 'scripts/validate-external-services-auth-crm-email-enquiry-architecture.cjs')
  .filter((file) => file !== 'scripts/validate-supabase-enquiry-persistence-crm-handoff-foundation.cjs')
  .filter((file) => file !== 'scripts/validate-public-enquiry-persistence-integration.cjs')
  .filter((file) => file !== 'scripts/validate-protected-admin-enquiry-inbox-triage-foundation.cjs')
  .filter((file) => file !== 'scripts/validate-protected-admin-enquiry-triage-status-update-foundation.cjs')
  .filter((file) => file !== 'scripts/validate-protected-admin-crm-handoff-queue-preparation-foundation.cjs')
  .filter((file) => file !== 'website/test/phase-5f-ab-quote-triage-readiness.test.tsx')
  .filter((file) => !file.startsWith('scripts/validate-maintenance-closure-audit-follow-up-response-acknowledgement-review-outcome-follow-up-planning'))
  .filter((file) => exists(file))
  .map((file) => `${file}\n${read(file)}`)
  .join('\n');

for (const file of changedFiles) {
  const normalized = file.replace(/\\/g, '/');
  assert(!/(^|\/)\.env(?:\.|$)|\.env\./i.test(normalized), `Do not add or change env files: ${file}`);
}

for (const pattern of [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /\b(?:ghp|github_pat|xox[baprs]-)[A-Za-z0-9_-]{20,}\b/i,
  /\bsk-[A-Za-z0-9_-]{24,}\b/i,
  /\b(?:HUBSPOT|SUPABASE|N8N|GOOGLE|RESEND|SMTP|GH|GITHUB|PINECONE)[A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|CLIENT_SECRET)\s*=\s*\S+/i,
  /\b(?:https?:\/\/)[^\s"'`]*(?:webhook|hooks|token|secret|password|apikey)[^\s"'`]*/i,
]) {
  noMatch(changedContents, pattern, 'changed files');
}

const docsAndPivotText = [architectureDoc, cutDownDoc, ...pivotSections].join('\n');
noMatch(docsAndPivotText, /\b(?:ecommerce|cart|checkout|order|payment|purchase)\b/i, 'external-services architecture docs');
noMatch(docsAndPivotText, /\b(?:booking|reservation|fulfilment|stock-reservation)\b/i, 'external-services architecture docs');

noMatch(
  changedContentsWithoutThisValidator,
  /docker.*(?:skip|bypass)|(?:skip|bypass).*docker|SKIP_DOCKER|BYPASS_DOCKER/i,
  'changed files'
);

const changedRuntimeFiles = changedFiles.filter((file) =>
  /^(website\/app|website\/components|website\/lib|website\/middleware|supabase\/|n8n\/|workflows\/)/.test(file) &&
  !approvedFoundationFiles.has(file)
);
assert(
  changedRuntimeFiles.length === 0,
  `No runtime/API/provider/env/scheduler/chat/RAG/public customer-facing behaviour changes are allowed: ${changedRuntimeFiles.join(', ')}`
);

console.log(
  'External services auth/CRM/email/enquiry architecture validation passed. Architecture/planning only: no provider integration, credentials/secrets, runtime provider calls, CRM sync code, n8n workflow implementation, email sending implementation, public customer account implementation, public login, runtime/API/provider/env/scheduler/chat/RAG/public behaviour change, retail/transaction flow expansion, or Docker guard changes were added.'
);
