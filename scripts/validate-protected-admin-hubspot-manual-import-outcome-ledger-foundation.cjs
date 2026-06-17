#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');

const docPath =
  'docs/architecture/PROTECTED-ADMIN-HUBSPOT-MANUAL-IMPORT-OUTCOME-LEDGER-FOUNDATION.md';
const migrationPath =
  'supabase/migrations/20260617113000_hubspot_manual_import_outcome_ledger_foundation.sql';
const helperPath =
  'website/lib/quote/admin-read/admin-quote-request-hubspot-manual-import-outcome-ledger.ts';
const routeHelperPath =
  'website/lib/quote/admin-read/admin-quote-request-hubspot-manual-import-outcome-route.ts';
const routePath =
  'website/app/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv/manual-import-outcome/route.ts';
const inboxPanelPath = 'website/components/admin/quote-request-inbox-panel.tsx';
const helperTestPath =
  'website/lib/quote/admin-read/admin-quote-request-hubspot-manual-import-outcome-ledger.test.ts';
const routeTestPath =
  'website/lib/quote/admin-read/admin-quote-request-hubspot-manual-import-outcome-route.test.ts';
const inboxPanelTestPath =
  'website/components/admin/quote-request-inbox-panel.test.tsx';
const migrationTestPath = 'scripts/validate-supabase-migrations.test.cjs';
const suitePath = 'scripts/validate-release-candidate-suite.cjs';
const packageScriptName =
  'validate:protected-admin-hubspot-manual-import-outcome-ledger-foundation';
const packageScriptCommand =
  'node scripts/validate-protected-admin-hubspot-manual-import-outcome-ledger-foundation.cjs';

const relatedDocPaths = [
  'docs/architecture/PROTECTED-ADMIN-HUBSPOT-IMPORT-CSV-HANDOFF-FOUNDATION.md',
  'docs/architecture/PROTECTED-ADMIN-HUBSPOT-IMPORT-CSV-PREFLIGHT-QUALITY-FOUNDATION.md',
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

const existingValidatorPaths = [
  'scripts/validate-protected-admin-hubspot-import-csv-preflight-quality-foundation.cjs',
  'scripts/validate-protected-admin-hubspot-import-csv-handoff-foundation.cjs',
  'scripts/validate-protected-admin-crm-handoff-packet-audit-manifest-foundation.cjs',
  'scripts/validate-protected-admin-crm-handoff-export-review-packet-foundation.cjs',
  'scripts/validate-protected-admin-crm-handoff-queue-preparation-foundation.cjs',
  'scripts/validate-supabase-enquiry-persistence-crm-handoff-foundation.cjs',
  'scripts/validate-release-candidate-suite.cjs',
  'scripts/validate-supabase-migrations.cjs',
  'scripts/validate-supabase-migrations.test.cjs',
];

const outcomeStatuses = [
  'manual_import_reviewed',
  'manual_import_completed_outside_skr',
  'manual_import_rejected_needs_correction',
  'manual_import_partial_needs_follow_up',
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

  return [...new Set(parseStatusFiles(status))].sort();
}

for (const requiredPath of [
  docPath,
  migrationPath,
  helperPath,
  routeHelperPath,
  routePath,
  inboxPanelPath,
  helperTestPath,
  routeTestPath,
  inboxPanelTestPath,
  migrationTestPath,
  suitePath,
  ...relatedDocPaths,
  ...trackerPaths,
  ...existingValidatorPaths,
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
const migration = read(migrationPath);
const helper = read(helperPath);
const routeHelper = read(routeHelperPath);
const route = read(routePath);
const inboxPanel = read(inboxPanelPath);
const helperTest = read(helperTestPath);
const routeTest = read(routeTestPath);
const inboxPanelTest = read(inboxPanelTestPath);
const migrationTest = read(migrationTestPath);
const packageJson = JSON.parse(read('package.json'));
const suite = read(suitePath);
const combinedCode = [helper, routeHelper, route, inboxPanel].join('\n');
const combinedTests = [helperTest, routeTest, inboxPanelTest, migrationTest].join('\n');
const combinedDocs = [
  doc,
  ...relatedDocPaths.map(read),
  ...trackerPaths.map(read),
].join('\n');

for (const phrase of [
  'protected admin-only',
  'local audit/readiness only',
  'controlled outcome status only',
  'No freeform notes are stored',
  'No HubSpot API sync',
  'No n8n workflow/runtime',
  'No email sending',
  'Records remain queued',
  'Outcome logging does not mutate quote/enquiry rows',
  'Outcome logging does not mark records synced',
  'Outcome logging does not set sync attempt timestamps',
  'Outcome logging does not create provider IDs',
  'metadata-only and bounded',
  'CSV export remains formula-injection protected',
  'Preflight remains bounded and allowlisted',
]) {
  includes(combinedDocs, phrase, 'documentation');
}

for (const status of outcomeStatuses) {
  includes(migration, status, 'migration');
  includes(helper, status, 'helper');
  includes(inboxPanel, status, 'admin UI');
  includes(combinedTests, status, 'tests');
}

for (const required of [
  'create table if not exists public.quote_crm_handoff_manual_import_outcomes',
  'alter table public.quote_crm_handoff_manual_import_outcomes enable row level security',
  'revoke update, delete on table public.quote_crm_handoff_manual_import_outcomes from authenticated',
  'grant select, insert on public.quote_crm_handoff_manual_import_outcomes to authenticated',
  'public.is_workspace_quote_manager(workspace_id)',
  'recorded_by_admin_user_id = public.current_quote_admin_user_id(workspace_id)',
  "provider = 'hubspot'",
  "packet_kind = 'hubspot_import_csv'",
  "source = 'protected_admin'",
  'quote_crm_handoff_packet_manifests',
  'status_filter = \'queued\'',
  'manifest.record_count = record_count',
  'manifest.request_ids = request_ids',
]) {
  includes(migration, required, 'migration');
}

for (const forbidden of [
  /customer_(?:name|email|phone)/i,
  /message_details/i,
  /internal_notes/i,
  /freeform_notes/i,
  /operator_notes/i,
  /notes\s+(?:text|jsonb?)/i,
  /csv_content/i,
  /packet_json/i,
  /raw_payload/i,
  /hubspot_(?:contact|deal|import_job)_id/i,
  /provider_(?:response|token)/i,
  /crm_last_sync_attempt_at/i,
  /\bupdate\s+public\.quote_/i,
  /\bdelete\s+from\b/i,
]) {
  noMatch(migration, forbidden, 'migration');
}

for (const required of [
  'import "server-only"',
  'createSessionBoundSupabaseAdminReadClient',
  'quote_crm_handoff_packet_manifests',
  'quote_crm_handoff_manual_import_outcomes',
  'recordAdminQuoteRequestHubSpotManualImportOutcome',
  'readRecentAdminQuoteRequestHubSpotManualImportOutcomes',
  'maxRecentLimit = 10',
  'maxRequestIds = 100',
  'maxReturnedRequestIds = 25',
  'provider: "hubspot"',
  'packet_kind: "hubspot_import_csv"',
  'source: "protected_admin"',
]) {
  includes(helper, required, 'helper');
}

for (const forbidden of [
  /\.update\s*\(/,
  /\.upsert\s*\(/,
  /\.delete\s*\(/,
  /fetch\s*\(/,
  /hubapi|api\.hubspot|hubspot\.com|oauth|webhook|n8n|smtp|resend|google workspace/i,
  /SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE|NEXT_PUBLIC_N8N|N8N_CHAT_WEBHOOK_URL/,
  /freeform|operatorNote|notes/i,
  /crmContactId|crmDealId|crmLastSyncAttemptAt/,
]) {
  noMatch(helper, forbidden, 'helper');
}

for (const required of [
  'import "server-only"',
  'requestedOperation: "quote.write"',
  'resolveServerAdminCsrfProofSessionWorkspaceBinding',
  'resolveServerAdminRuntimeRouteGateAdapter',
  '"Cache-Control": "no-store"',
  'manifestId',
  'outcomeStatus',
  'recordOutcome',
  'readRecentOutcomes',
  'recentOutcomeLimit = 10',
  'request_body_invalid',
]) {
  includes(routeHelper, required, 'route helper');
}

for (const forbidden of [
  /fetch\s*\(/,
  /hubapi|api\.hubspot|hubspot\.com|oauth|webhook|n8n|smtp|resend|google workspace/i,
  /\.update\s*\(/,
  /\.upsert\s*\(/,
  /\.delete\s*\(/,
  /crmContactId|crmDealId|crmLastSyncAttemptAt/,
]) {
  noMatch(routeHelper, forbidden, 'route helper');
}

includes(
  route,
  'handleAdminQuoteRequestHubSpotManualImportOutcomeRoute',
  'app route',
);

for (const required of [
  '/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv/manual-import-outcome',
  'Mark manual import reviewed',
  'Mark manual import completed outside SKR',
  'Mark manual import rejected / needs correction',
  'Mark partial import / needs follow-up',
  'manifest.packetKind === "hubspot_import_csv"',
  'HubSpotManualImportOutcomeLedger',
  'No freeform notes are stored',
  'No HubSpot sync occurs',
  'No provider IDs are created',
  'No sync timestamp is set',
  'This does not mutate enquiry records',
  'Records remain queued',
]) {
  includes(inboxPanel, required, 'admin UI');
}

for (const forbidden of [
  /hubapi|api\.hubspot|hubspot\.com|oauth|webhook|smtp|resend|google workspace/i,
  /freeformNote|operatorNote|notes:/,
]) {
  noMatch(inboxPanel, forbidden, 'admin UI');
}

for (const required of [
  'metadata-only',
  'quote.write',
  'no-store',
  'request_body_invalid',
  'invalid_admin_context',
  'invalid_manifest',
  'No freeform notes are stored',
  'Records remain queued',
  'crmContactId',
  'crmDealId',
  'crmLastSyncAttemptAt',
  'hubapi',
  'webhook',
  'smtp',
  'freeform_operator_note',
]) {
  includes(combinedTests, required, 'tests');
}

includes(
  migrationTest,
  'real migrations add protected admin HubSpot manual import outcome ledger append-only metadata',
  'migration test',
);

for (const validatorPath of existingValidatorPaths) {
  const source = read(validatorPath);
  assert(source.length > 0, `Existing validator is unexpectedly empty: ${validatorPath}`);
}

const scripts = packageJson.scripts || {};
assert(
  scripts[packageScriptName] === packageScriptCommand,
  `package.json missing ${packageScriptName}`,
);
includes(suite, packageScriptName, 'release candidate suite');

for (const forbidden of [
  /website\/chat-config\.js/,
  /N8N_CHAT_WEBHOOK_URL/,
  /NEXT_PUBLIC_N8N/,
  /NEXT_PUBLIC_SUPABASE/,
  /SUPABASE_SERVICE_ROLE_KEY/,
]) {
  noMatch(combinedCode, forbidden, 'implementation code');
}

console.log('Protected admin HubSpot manual import outcome ledger foundation validation passed.');
