#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');

const docPath =
  'docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-LIFECYCLE-RECONCILIATION-FOUNDATION.md';
const helperPath =
  'website/lib/quote/admin-read/admin-quote-request-crm-handoff-lifecycle-reconciliation.ts';
const routeHelperPath =
  'website/lib/quote/admin-read/admin-quote-request-crm-handoff-lifecycle-reconciliation-route.ts';
const routePath =
  'website/app/api/admin/quote-requests/crm-handoff-packet/lifecycle-reconciliation/route.ts';
const inboxPanelPath = 'website/components/admin/quote-request-inbox-panel.tsx';
const helperTestPath =
  'website/lib/quote/admin-read/admin-quote-request-crm-handoff-lifecycle-reconciliation.test.ts';
const routeTestPath =
  'website/lib/quote/admin-read/admin-quote-request-crm-handoff-lifecycle-reconciliation-route.test.ts';
const inboxPanelTestPath =
  'website/components/admin/quote-request-inbox-panel.test.tsx';
const suitePath = 'scripts/validate-release-candidate-suite.cjs';
const packageScriptName =
  'validate:protected-admin-crm-handoff-lifecycle-reconciliation-foundation';
const packageScriptCommand =
  'node scripts/validate-protected-admin-crm-handoff-lifecycle-reconciliation-foundation.cjs';

const relatedDocPaths = [
  'docs/architecture/PROTECTED-ADMIN-HUBSPOT-MANUAL-IMPORT-OUTCOME-LEDGER-FOUNDATION.md',
  'docs/architecture/PROTECTED-ADMIN-HUBSPOT-IMPORT-CSV-PREFLIGHT-QUALITY-FOUNDATION.md',
  'docs/architecture/PROTECTED-ADMIN-HUBSPOT-IMPORT-CSV-HANDOFF-FOUNDATION.md',
  'docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-PACKET-AUDIT-MANIFEST-FOUNDATION.md',
  'docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-EXPORT-REVIEW-PACKET-FOUNDATION.md',
  'docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-QUEUE-PREPARATION-FOUNDATION.md',
  'docs/architecture/SUPABASE-ENQUIRY-PERSISTENCE-CRM-HANDOFF-FOUNDATION.md',
  'docs/architecture/EXTERNAL-SERVICES-AUTH-CRM-EMAIL-ENQUIRY-ARCHITECTURE.md',
  'docs/architecture/IMPLEMENTATION-PLAN-CUT-DOWN-EXTERNAL-SERVICES.md',
];

const trackerPaths = [
  'docs/PHASE-STATUS.md',
  'docs/PHASE-ROADMAP.md',
  'docs/OWNER-REVIEW-READINESS-PACKAGE.md',
  'docs/DECISION-LOG.md',
  'docs/checklists/PHASE-2-ADMIN-OPS.md',
];

const lifecycleStates = [
  'queued_never_exported',
  'queued_preflight_needs_review',
  'queued_csv_exported_no_outcome',
  'queued_manual_import_reviewed',
  'queued_manual_import_completed_outside_skr',
  'queued_manual_import_rejected_needs_correction',
  'queued_manual_import_partial_needs_follow_up',
  'stale_manifest_record_missing',
  'manifest_metadata_mismatch',
];

const recommendedActions = [
  'run_preflight',
  'download_csv',
  'record_manual_outcome',
  'review_corrections',
  'follow_up_partial_import',
  'ready_for_future_sync_design',
  'no_queued_records',
];

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

  return [...new Set(parseStatusFiles(status))].sort();
}

for (const requiredPath of [
  docPath,
  helperPath,
  routeHelperPath,
  routePath,
  inboxPanelPath,
  helperTestPath,
  routeTestPath,
  inboxPanelTestPath,
  suitePath,
  ...relatedDocPaths,
  ...trackerPaths,
]) {
  assert(exists(requiredPath), `Missing required file: ${requiredPath}`);
}

const changedFiles = getChangedFiles();
for (const forbiddenPath of [
  'website/chat-config.js',
  '.env',
  'website/.env',
  '.env.local',
  'website/.env.local',
]) {
  assert(
    !changedFiles.includes(forbiddenPath),
    `Forbidden local/runtime file is changed: ${forbiddenPath}`,
  );
}

for (const changedFile of changedFiles) {
  assert(
    !changedFile.startsWith('.agent-toolkit-backups/'),
    `Forbidden backup path is changed: ${changedFile}`,
  );
}

const doc = read(docPath);
const helper = read(helperPath);
const routeHelper = read(routeHelperPath);
const route = read(routePath);
const inboxPanel = read(inboxPanelPath);
const helperTest = read(helperTestPath);
const routeTest = read(routeTestPath);
const inboxPanelTest = read(inboxPanelTestPath);
const packageJson = JSON.parse(read('package.json'));
const suite = read(suitePath);
const combinedCode = [helper, routeHelper, route, inboxPanel].join('\n');
const combinedTests = [helperTest, routeTest, inboxPanelTest].join('\n');
const combinedDocs = [
  doc,
  ...relatedDocPaths.map(read),
  ...trackerPaths.map(read),
].join('\n');

for (const phrase of [
  'protected admin-only',
  'local visibility/readiness only',
  'lifecycle reconciliation',
  'Records remain queued',
  'No HubSpot sync occurs',
  'No n8n workflow/runtime',
  'No email sending',
  'No provider IDs are created',
  'No sync timestamp is set',
  'does not mutate quote/enquiry rows',
  'rows are bounded and allowlisted',
  'manual outcome ledger remains metadata-only',
  'CSV formula-injection protected',
  'preflight remains bounded and allowlisted',
]) {
  includes(combinedDocs, phrase, 'documentation');
}

for (const state of lifecycleStates) {
  includes(helper, state, helperPath);
  includes(inboxPanel, state, inboxPanelPath);
  includes(combinedTests, state, 'tests');
}

for (const action of recommendedActions) {
  includes(helper, action, helperPath);
  includes(inboxPanel, action, inboxPanelPath);
  includes(combinedTests, action, 'tests');
}

for (const required of [
  'import "server-only"',
  'generateAdminQuoteRequestCrmHandoffLifecycleReconciliation',
  'AdminQuoteRequestCrmHandoffLifecycleReconciliationReport',
  'queuedRecordCount',
  'jsonReviewPacketManifestCount',
  'hubspotCsvManifestCount',
  'manualOutcomeCount',
  'staleManifestCount',
  'mismatchedManifestCount',
  'safeIssueCount',
  'latestOutcomeStatus',
]) {
  includes(helper, required, helperPath);
}

for (const forbidden of [
  /customer(Name|Email|Phone)|customer_(?:name|email|phone)/,
  /messageDetails|message_details|companyOrEventOrganisation/,
  /crmContactId|crmDealId|crmLastSyncAttemptAt/,
  /crm_contact_id|crm_deal_id|crm_last_sync_attempt_at/,
  /fetch\s*\(/,
  /hubapi|api\.hubspot|hubspot\.com|oauth|webhook|smtp|resend/i,
  /\.update\s*\(|\.upsert\s*\(|\.delete\s*\(|\.insert\s*\(/,
]) {
  noMatch(helper, forbidden, helperPath);
}

for (const required of [
  'resolveServerAdminCsrfProofSessionWorkspaceBinding',
  'resolveServerAdminRuntimeRouteGateAdapter',
  'requestedOperation: "quote.write"',
  '"Cache-Control": "no-store"',
  'readPacket',
  'readRecentManifests',
  'readRecentOutcomes',
  'generateAdminQuoteRequestHubSpotImportCsvPreflight',
  'quote_crm_handoff_lifecycle_reconciliation_unavailable',
]) {
  includes(routeHelper, required, routeHelperPath);
}

for (const forbidden of [
  /createManifest|recordOutcome/,
  /hubapi|api\.hubspot|hubspot\.com|oauth|webhook|smtp|resend/i,
  /\.update\s*\(|\.upsert\s*\(|\.delete\s*\(|\.insert\s*\(/,
  /crmContactId|crmDealId|crmLastSyncAttemptAt/,
]) {
  noMatch(routeHelper, forbidden, routeHelperPath);
}

includes(
  route,
  'handleAdminQuoteRequestCrmHandoffLifecycleReconciliationRoute',
  routePath,
);
includes(route, 'export async function POST', routePath);
noMatch(route, /export async function GET/i, routePath);

for (const required of [
  'Run CRM handoff reconciliation',
  'lifecycle-reconciliation?limit=',
  'CRM handoff lifecycle reconciliation summary',
  'Local reconciliation only',
  'Records remain queued',
  'No HubSpot sync occurs',
  'No provider IDs are created',
  'No sync timestamp is set',
  'This does not mutate enquiry records',
  'crmHandoffLifecycleActionLabel',
  'crmHandoffLifecycleStateLabel',
]) {
  includes(inboxPanel, required, inboxPanelPath);
}

for (const required of [
  'summarises queued lifecycle states',
  'flags stale manifest records and metadata mismatches',
  'uses controlled recommended actions',
  'without raw customer data',
]) {
  includes(helperTest, required, helperTestPath);
}

for (const required of [
  'returns a no-store bounded read-only reconciliation report',
  'requestedOperation: "quote.write"',
  'createManifest).not.toHaveBeenCalled',
  'recordOutcome).not.toHaveBeenCalled',
  'rejects public or unauthorised access before reading packet, manifest, or outcome data',
  'quote_crm_handoff_lifecycle_reconciliation_unavailable',
]) {
  includes(routeTest, required, routeTestPath);
}

for (const required of [
  'runs protected CRM handoff lifecycle reconciliation',
  'Run CRM handoff reconciliation',
  'lifecycle-reconciliation?limit=25&status=queued',
  'CRM handoff lifecycle reconciliation prepared locally',
  'handles CRM handoff lifecycle reconciliation failures generically',
]) {
  includes(inboxPanelTest, required, inboxPanelTestPath);
}

const scripts = packageJson.scripts || {};
assert(
  scripts[packageScriptName] === packageScriptCommand,
  `package.json missing ${packageScriptName}`,
);
includes(suite, packageScriptName, 'release-candidate suite');
noMatch(
  suite,
  /docker.*(?:skip|bypass)|(?:skip|bypass).*docker|SKIP_DOCKER|BYPASS_DOCKER/i,
  'release-candidate suite',
);

for (const forbidden of [
  /website\/chat-config\.js/,
  new RegExp('N8N' + '_CHAT_' + 'WEBHOOK_' + 'URL'),
  new RegExp('NEXT_PUBLIC_' + 'N8N'),
  new RegExp('NEXT_PUBLIC_' + 'SUPABASE'),
  new RegExp('SUPABASE_' + 'SERVICE_' + 'ROLE_' + 'KEY'),
]) {
  noMatch(combinedCode, forbidden, 'implementation code');
}

for (const forbidden of [
  /hubspot\/api-client|api[.]hubapi[.]com|new\s+HubSpot|oauth.*hubspot/i,
  /\/webhook(?:-test)?\/|N8N.*CHAT.*WEBHOOK.*URL/i,
  /from ['"]resend['"]|new\s+Resend|resend[.]emails[.]send/i,
  /smtp[.]gmail|google\s*apis|gmail[.]users[.]messages|node\s*mailer/i,
  /\.update\s*\(|\.upsert\s*\(|\.delete\s*\(/i,
  /\bcart\b|\bcheckout\b|\border\b|\bpayment\b|\bpurchase\b/i,
  /\bbooking\b|\breservation\b|\bfulfilment\b|\bfulfillment\b|stock-reservation/i,
]) {
  noMatch(combinedCode, forbidden, 'implementation code');
}

console.log(
  'Protected admin CRM handoff lifecycle reconciliation foundation validation passed. Protected POST/CSRF reconciliation, bounded allowlisted lifecycle report, admin UI action, docs, tests, package script, and release-candidate wiring are present without provider calls, n8n runtime, email sending, quote/enquiry mutation, synced marking, sync timestamp updates, CRM IDs, freeform notes, chat-config changes, env changes, Docker guard changes, or existing CRM handoff/CSV/preflight/manifest validator weakening.',
);
