#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');

const docPath =
  'docs/architecture/PROTECTED-ADMIN-HUBSPOT-SYNC-DRY-RUN-CONTRACT-FOUNDATION.md';
const helperPath =
  'website/lib/quote/admin-read/admin-quote-request-hubspot-sync-dry-run-contract.ts';
const routeHelperPath =
  'website/lib/quote/admin-read/admin-quote-request-hubspot-sync-dry-run-contract-route.ts';
const routePath =
  'website/app/api/admin/quote-requests/crm-handoff-packet/hubspot-sync-dry-run-contract/route.ts';
const inboxPanelPath = 'website/components/admin/quote-request-inbox-panel.tsx';
const helperTestPath =
  'website/lib/quote/admin-read/admin-quote-request-hubspot-sync-dry-run-contract.test.ts';
const routeTestPath =
  'website/lib/quote/admin-read/admin-quote-request-hubspot-sync-dry-run-contract-route.test.ts';
const inboxPanelTestPath =
  'website/components/admin/quote-request-inbox-panel.test.tsx';
const suitePath = 'scripts/validate-release-candidate-suite.cjs';
const packageScriptName =
  'validate:protected-admin-hubspot-sync-dry-run-contract-foundation';
const packageScriptCommand =
  'node scripts/validate-protected-admin-hubspot-sync-dry-run-contract-foundation.cjs';

const relatedDocPaths = [
  'docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-LIFECYCLE-RECONCILIATION-FOUNDATION.md',
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

const existingValidatorScripts = [
  'validate:protected-admin-crm-handoff-lifecycle-reconciliation-foundation',
  'validate:protected-admin-hubspot-manual-import-outcome-ledger-foundation',
  'validate:protected-admin-hubspot-import-csv-preflight-quality-foundation',
  'validate:protected-admin-hubspot-import-csv-handoff-foundation',
  'validate:protected-admin-crm-handoff-packet-audit-manifest-foundation',
  'validate:protected-admin-crm-handoff-export-review-packet-foundation',
  'validate:protected-admin-crm-handoff-queue-preparation-foundation',
  'validate:supabase-enquiry-persistence-crm-handoff-foundation',
  'validate:public-enquiry-persistence-integration',
];

const dryRunStates = [
  'eligible_for_future_sync',
  'blocked_preflight_needs_review',
  'blocked_missing_required_contact_field',
  'blocked_rejected_needs_correction',
  'blocked_partial_needs_follow_up',
  'blocked_no_manual_outcome',
  'blocked_stale_manifest',
  'blocked_manifest_metadata_mismatch',
];

const recommendedActions = [
  'fix_preflight_issues',
  'record_manual_outcome',
  'review_reconciliation',
  'review_dry_run_payload',
  'ready_for_provider_credentials_design',
  'no_eligible_records',
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
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
const combinedNewCode = [helper, routeHelper, route].join('\n');
const combinedTests = [helperTest, routeTest, inboxPanelTest].join('\n');
const combinedDocs = [
  doc,
  ...relatedDocPaths.map(read),
  ...trackerPaths.map(read),
].join('\n');

for (const phrase of [
  'protected admin-only',
  'local design/readiness only',
  'No HubSpot API sync is implemented',
  'No HubSpot API, SDK, OAuth, callback, or webhook is implemented',
  'No n8n workflow/runtime is implemented',
  'No email sending is implemented',
  'No provider credentials are introduced',
  'Records remain queued',
  'Dry-run does not mutate quote/enquiry rows',
  'Dry-run does not mark records synced',
  'Dry-run does not set sync attempt timestamps',
  'Dry-run does not create provider IDs',
  'Dry-run rows are bounded and allowlisted',
  'Raw customer data is not exposed in dry-run row summaries',
  'Manual outcome ledger remains metadata-only',
  'Lifecycle reconciliation remains local visibility only',
  'CSV export remains formula-injection protected',
  'Preflight remains bounded and allowlisted',
]) {
  includes(combinedDocs, phrase, 'documentation');
}

for (const relatedPath of relatedDocPaths) {
  includes(read(relatedPath), docPath, relatedPath);
}

for (const state of dryRunStates) {
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
  'generateAdminQuoteRequestHubSpotSyncDryRunContract',
  'AdminQuoteRequestHubSpotSyncDryRunContractReport',
  'mode: "dry_run_only"',
  'localCrmSyncStatus: "queued"',
  'payloadPreview',
  'futureContactProperties',
  'futureDealProperties',
  'futureAssociations',
  'futureIdempotencyKey',
  'createAdminQuoteRequestHubSpotSyncDryRunFutureIdempotencyKey',
  'skr_quote_request:${workspaceId}:${quoteRequestId}:hubspot',
  'generateAdminQuoteRequestCrmHandoffLifecycleReconciliation',
]) {
  includes(helper, required, helperPath);
}

for (const forbidden of [
  /customerName|customerEmail|customerPhone/,
  /messageDetails|companyOrEventOrganisation/,
  /crmContactId|crmDealId|crmLastSyncAttemptAt/,
  /crm_contact_id|crm_deal_id|crm_last_sync_attempt_at/,
  /fetch\s*\(/,
  /hubapi|api\.hubspot|hubspot\.com|oauth/i,
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
  'generateAdminQuoteRequestHubSpotSyncDryRunContract',
  'quote_crm_handoff_hubspot_sync_dry_run_contract_unavailable',
]) {
  includes(routeHelper, required, routeHelperPath);
}

for (const forbidden of [
  /createManifest|recordOutcome/,
  /hubapi|api\.hubspot|hubspot\.com|oauth/i,
  /from ['"]resend['"]|new\s+Resend|resend[.]emails[.]send/i,
  /smtp[.]gmail|google\s*apis|gmail[.]users[.]messages|node\s*mailer/i,
  /\.update\s*\(|\.upsert\s*\(|\.delete\s*\(|\.insert\s*\(/,
  /crmContactId|crmDealId|crmLastSyncAttemptAt/,
]) {
  noMatch(routeHelper, forbidden, routeHelperPath);
}

includes(
  route,
  'handleAdminQuoteRequestHubSpotSyncDryRunContractRoute',
  routePath,
);
includes(route, 'export async function POST', routePath);
noMatch(route, /export async function GET/i, routePath);

for (const required of [
  'Run HubSpot sync dry-run',
  'hubspot-sync-dry-run-contract?limit=',
  'HubSpot sync dry-run contract summary',
  'Dry-run only',
  'No HubSpot sync occurs',
  'No provider call occurs',
  'Records remain queued',
  'No provider IDs are created',
  'No sync timestamp is set',
  'This does not mutate enquiry records',
  'parseHubSpotSyncDryRunContractReport',
  'hubSpotSyncDryRunStateLabel',
  'hubSpotSyncDryRunActionLabel',
]) {
  includes(inboxPanel, required, inboxPanelPath);
}

for (const required of [
  'generates bounded summary counts',
  'deterministic future idempotency keys',
  'without customer data',
  'keeps row output bounded',
]) {
  includes(helperTest, required, helperTestPath);
}

for (const required of [
  'returns a no-store bounded dry-run contract',
  'requestedOperation: "quote.write"',
  'createManifest).not.toHaveBeenCalled',
  'recordOutcome).not.toHaveBeenCalled',
  'rejects public or unauthorised access before reading packet, manifest, or outcome data',
  'quote_crm_handoff_hubspot_sync_dry_run_contract_unavailable',
]) {
  includes(routeTest, required, routeTestPath);
}

for (const required of [
  'runs protected HubSpot sync dry-run',
  'Run HubSpot sync dry-run',
  'hubspot-sync-dry-run-contract?limit=25&status=queued',
  'HubSpot sync dry-run prepared locally',
  'handles HubSpot sync dry-run failures generically',
]) {
  includes(inboxPanelTest, required, inboxPanelTestPath);
}

const scripts = packageJson.scripts || {};
assert(
  scripts[packageScriptName] === packageScriptCommand,
  `package.json missing ${packageScriptName}`,
);
includes(suite, packageScriptName, 'release-candidate suite');

for (const scriptName of existingValidatorScripts) {
  assert(scripts[scriptName], `Existing validator script missing: ${scriptName}`);
  includes(suite, scriptName, 'release-candidate suite');
}

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
  noMatch(combinedNewCode, forbidden, 'implementation code');
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
  noMatch(combinedNewCode, forbidden, 'implementation code');
}

console.log(
  'Protected admin HubSpot sync dry-run contract foundation validation passed. Protected POST/CSRF dry-run contract, bounded allowlisted rows, future idempotency keys, safe payload-shape preview, admin UI action, docs, tests, package script, and release-candidate wiring are present without provider calls, n8n runtime, email sending, quote/enquiry mutation, synced marking, sync timestamp updates, CRM ID writes, raw customer data in row summaries, provider credentials, env changes, chat-config changes, Docker guard changes, or existing CRM handoff validator weakening.',
);
