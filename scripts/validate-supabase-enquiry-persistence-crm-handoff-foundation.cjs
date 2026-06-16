#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const foundationDocPath =
  'docs/architecture/SUPABASE-ENQUIRY-PERSISTENCE-CRM-HANDOFF-FOUNDATION.md';
const architectureDocPath =
  'docs/architecture/EXTERNAL-SERVICES-AUTH-CRM-EMAIL-ENQUIRY-ARCHITECTURE.md';
const cutDownDocPath =
  'docs/architecture/IMPLEMENTATION-PLAN-CUT-DOWN-EXTERNAL-SERVICES.md';
const migrationPath =
  'supabase/migrations/20260616100000_quote_enquiry_crm_handoff_foundation.sql';
const quoteTypesPath = 'website/lib/quote/types.ts';
const quoteValidationPath = 'website/lib/quote/validation.ts';
const quoteRepositoryPath = 'website/lib/quote/quote-repository.ts';
const packageScriptName =
  'validate:supabase-enquiry-persistence-crm-handoff-foundation';
const packageScriptCommand =
  'node scripts/validate-supabase-enquiry-persistence-crm-handoff-foundation.cjs';
const suitePath = 'scripts/validate-release-candidate-suite.cjs';

const trackerPaths = [
  'docs/PHASE-STATUS.md',
  'docs/PHASE-ROADMAP.md',
  'docs/OWNER-REVIEW-READINESS-PACKAGE.md',
  'docs/DECISION-LOG.md',
  'docs/checklists/PHASE-2-ADMIN-OPS.md',
];

const allowedChangedFiles = new Set([
  foundationDocPath,
  'docs/architecture/PROTECTED-ADMIN-ENQUIRY-INBOX-TRIAGE-FOUNDATION.md',
  'docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-QUEUE-PREPARATION-FOUNDATION.md',
  'docs/architecture/PROTECTED-ADMIN-ENQUIRY-TRIAGE-STATUS-UPDATE-FOUNDATION.md',
  'docs/architecture/PUBLIC-ENQUIRY-PERSISTENCE-INTEGRATION.md',
  architectureDocPath,
  cutDownDocPath,
  'docs/PHASE-STATUS.md',
  'docs/PHASE-ROADMAP.md',
  'docs/OWNER-REVIEW-READINESS-PACKAGE.md',
  'docs/DECISION-LOG.md',
  'docs/checklists/PHASE-2-ADMIN-OPS.md',
  migrationPath,
  'supabase/migrations/20260616120000_admin_enquiry_triage_status_update_foundation.sql',
  'supabase/migrations/20260616143000_admin_crm_handoff_queue_preparation_foundation.sql',
  quoteTypesPath,
  quoteValidationPath,
  'website/lib/quote/validation.test.ts',
  quoteRepositoryPath,
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
  'website/test/phase-2e-a-conversation-governance.test.ts',
  'website/test/phase-2e-b-conversation-schema-rls.test.ts',
  'website/test/phase-2e-c-transcript-persistence-contract.test.ts',
  'website/test/phase-2e-d-transcript-persistence-rpc-adapter.test.ts',
  'website/test/phase-2c-a-storage-backed-listing-media.test.ts',
  'website/test/phase-2c-c-admin-quote-operations.test.ts',
  'website/test/phase-2c-d-quote-workflow-atomicity.test.ts',
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
  suitePath,
]);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function includes(source, needle, label) {
  const compactSource = source.replace(/\s+/g, ' ');
  const compactNeedle = needle.replace(/\s+/g, ' ');
  assert(
    source.includes(needle) || compactSource.includes(compactNeedle),
    `${label} missing required text: ${needle}`,
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

  const mergeBase = git(['merge-base', 'HEAD', 'origin/main'], {
    allowFailure: true,
  });
  if (mergeBase.status === 0 && mergeBase.stdout.trim()) {
    const diff = git([
      'diff',
      '--name-only',
      '--diff-filter=ACMRT',
      mergeBase.stdout.trim(),
      'HEAD',
    ]).stdout;
    return diff
      .split(/\r?\n/)
      .filter(Boolean)
      .map((file) => file.replace(/\\/g, '/'))
      .sort();
  }

  return [];
}

function getAddedDiffText(changedFiles) {
  const trackedFiles = changedFiles.filter((file) => {
    const result = git(['ls-files', '--error-unmatch', file], {
      allowFailure: true,
    });
    return result.status === 0;
  });
  const untrackedFiles = changedFiles.filter((file) => !trackedFiles.includes(file));
  const addedLines = [];

  if (trackedFiles.length > 0) {
    const diff = git(['diff', '--unified=0', '--', ...trackedFiles]).stdout;
    for (const line of diff.split(/\r?\n/)) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        addedLines.push(line.slice(1));
      }
    }
  }

  for (const file of untrackedFiles) {
    if (exists(file)) {
      addedLines.push(read(file));
    }
  }

  return addedLines.join('\n');
}

for (const requiredPath of [
  foundationDocPath,
  architectureDocPath,
  cutDownDocPath,
  migrationPath,
  quoteTypesPath,
  quoteValidationPath,
  quoteRepositoryPath,
]) {
  assert(exists(requiredPath), `Missing required file: ${requiredPath}`);
}

const foundationDoc = read(foundationDocPath);
const architectureDoc = read(architectureDocPath);
const cutDownDoc = read(cutDownDocPath);
const migration = read(migrationPath);
const quoteTypes = read(quoteTypesPath);
const quoteValidation = read(quoteValidationPath);
const quoteRepository = read(quoteRepositoryPath);
const packageJson = JSON.parse(read('package.json'));
const releaseSuite = read(suitePath);

for (const required of [
  'Supabase owns the canonical SKR enquiry submission record.',
  'HubSpot remains the future CRM and sales workflow owner.',
  'CRM sync is not implemented in this PR.',
  'n8n workflows are not implemented in this PR.',
  'Email sending is not implemented in this PR.',
  'Public customer accounts remain deferred.',
  'Custom CRM remains rejected/deferred.',
  'CRM fields are placeholders for later handoff tracking.',
]) {
  includes(foundationDoc, required, foundationDocPath);
}

for (const doc of [
  [architectureDocPath, architectureDoc],
  [cutDownDocPath, cutDownDoc],
]) {
  includes(
    doc[1],
    'Supabase enquiry persistence and CRM handoff foundation',
    doc[0],
  );
  includes(doc[1], 'CRM sync is not implemented in this PR.', doc[0]);
  includes(doc[1], 'n8n workflows are not implemented in this PR.', doc[0]);
  includes(doc[1], 'Email sending is not implemented in this PR.', doc[0]);
}

for (const trackerPath of trackerPaths) {
  const tracker = read(trackerPath);
  includes(
    tracker,
    'Supabase enquiry persistence and CRM handoff foundation',
    trackerPath,
  );
  includes(tracker, foundationDocPath, trackerPath);
  includes(
    tracker,
    'No HubSpot API calls, n8n workflows, email sending, public customer accounts, public login, or custom CRM are implemented.',
    trackerPath,
  );
}

for (const required of [
  'source_page_path',
  'source_listing_slug',
  'submission_request_id',
  'reviewed_at',
  'reviewed_by_admin_user_id',
  'crm_provider',
  'crm_sync_status',
  'crm_contact_id',
  'crm_deal_id',
  'crm_last_sync_attempt_at',
  'crm_sync_error',
  "check (crm_provider in ('hubspot'))",
  "check (crm_sync_status in ('not_queued', 'queued', 'synced', 'failed'))",
  'alter policy quote_requests_public_insert_website',
  'grant insert',
]) {
  includes(migration, required, migrationPath);
}

matches(quoteTypes, /export type CrmProvider = "hubspot"/, quoteTypesPath);
matches(quoteTypes, /export type CrmSyncStatus[\s\S]*not_queued[\s\S]*queued[\s\S]*synced[\s\S]*failed/, quoteTypesPath);
matches(quoteTypes, /QuotePersistencePayload[\s\S]*crmSyncStatus/, quoteTypesPath);
matches(quoteValidation, /normalizeCrmSyncError[\s\S]*slice\(0, MAX_CRM_SYNC_ERROR_LENGTH\)/, quoteValidationPath);
matches(quoteValidation, /prepareQuoteForPersistence[\s\S]*crmProvider: "hubspot"[\s\S]*crmSyncStatus: "not_queued"/, quoteValidationPath);
matches(quoteRepository, /source_page_path[\s\S]*source_listing_slug[\s\S]*submission_request_id/, quoteRepositoryPath);
matches(quoteRepository, /crm_provider[\s\S]*crm_sync_status[\s\S]*crm_contact_id[\s\S]*crm_deal_id/, quoteRepositoryPath);

assert(
  packageJson.scripts?.[packageScriptName] === packageScriptCommand,
  `package.json must register ${packageScriptName}`,
);
includes(releaseSuite, packageScriptName, 'release-candidate suite');
noMatch(
  releaseSuite,
  /docker.*(?:skip|bypass)|(?:skip|bypass).*docker|SKIP_DOCKER|BYPASS_DOCKER|supabase.*(?:skip|bypass)/i,
  'release-candidate suite',
);

const changedFiles = getChangedFiles();
const unexpectedChangedFiles = changedFiles.filter(
  (file) => !allowedChangedFiles.has(file),
);
assert(
  unexpectedChangedFiles.length === 0,
  `Unexpected changed files: ${unexpectedChangedFiles.join(', ')}`,
);

for (const file of changedFiles) {
  const normalized = file.replace(/\\/g, '/');
  assert(!/(^|\/)\.env(?:\.|$)|\.env\./i.test(normalized), `Do not add or change env files: ${file}`);
}

const changedContents = changedFiles
  .filter((file) => exists(file))
  .map((file) => `${file}\n${read(file)}`)
  .join('\n');

const validatorFilesExcludedFromAddedText = new Set([
  'scripts/validate-supabase-enquiry-persistence-crm-handoff-foundation.cjs',
  'scripts/validate-public-enquiry-persistence-integration.cjs',
  'scripts/validate-protected-admin-enquiry-inbox-triage-foundation.cjs',
  'scripts/validate-protected-admin-enquiry-triage-status-update-foundation.cjs',
]);
const changedContentsWithoutValidator = changedFiles
  .filter(
    (file) =>
      !validatorFilesExcludedFromAddedText.has(file) &&
      !file.startsWith('scripts/validate-'),
  )
  .filter((file) => exists(file))
  .map((file) => `${file}\n${read(file)}`)
  .join('\n');
const addedContents = getAddedDiffText(changedFiles);
const addedContentsWithoutValidator = getAddedDiffText(
  changedFiles.filter(
    (file) =>
      !validatorFilesExcludedFromAddedText.has(file) &&
      !file.startsWith('scripts/validate-'),
  ),
);

for (const pattern of [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /\b(?:ghp|github_pat|xox[baprs]-)[A-Za-z0-9_-]{20,}\b/i,
  /\bsk-[A-Za-z0-9_-]{24,}\b/i,
  /\b(?:HUBSPOT|SUPABASE|N8N|GOOGLE|RESEND|SMTP|GH|GITHUB|PINECONE)[A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|CLIENT_SECRET)\s*=\s*\S+/i,
  /\b(?:https?:\/\/)[^\s"'`]*(?:webhook|hooks|token|secret|password|apikey)[^\s"'`]*/i,
]) {
  noMatch(addedContents, pattern, 'added lines');
}

for (const pattern of [
  /\b(?:ecommerce|cart|checkout|order|payment|purchase)\b/i,
  /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation)\b/i,
]) {
  noMatch(addedContentsWithoutValidator, pattern, 'added lines');
}

for (const pattern of [
  /@hubspot|hubspot\.com\/?api|api\.hubapi\.com|HubSpotClient|hubspotClient/i,
  /n8n-nodes-base|\/webhook(?:-test)?\/|N8N_CHAT_WEBHOOK_URL/i,
  /from ['"]resend['"]|new Resend|resend\.emails\.send/i,
  /smtp\.gmail|googleapis|gmail\.users\.messages|nodemailer/i,
  /NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE/i,
  /public customer account implementation|customer dashboard implementation|public login implementation/i,
]) {
  noMatch(addedContentsWithoutValidator, pattern, 'added lines');
}

console.log(
  'Supabase enquiry persistence and CRM handoff foundation validation passed. Schema, contracts, docs, and release-candidate wiring are present; no provider credentials, runtime provider calls, email sending, n8n workflow implementation, public customer account runtime, public login, or retail/transaction flow expansion was added; Docker-dependent checks remain intact.',
);
