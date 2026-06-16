#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');

const docPath =
  'docs/architecture/PROTECTED-ADMIN-HUBSPOT-IMPORT-CSV-HANDOFF-FOUNDATION.md';
const auditDocPath =
  'docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-PACKET-AUDIT-MANIFEST-FOUNDATION.md';
const packetDocPath =
  'docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-EXPORT-REVIEW-PACKET-FOUNDATION.md';
const queueDocPath =
  'docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-QUEUE-PREPARATION-FOUNDATION.md';
const supabaseDocPath =
  'docs/architecture/SUPABASE-ENQUIRY-PERSISTENCE-CRM-HANDOFF-FOUNDATION.md';
const architectureDocPath =
  'docs/architecture/EXTERNAL-SERVICES-AUTH-CRM-EMAIL-ENQUIRY-ARCHITECTURE.md';
const cutDownDocPath =
  'docs/architecture/IMPLEMENTATION-PLAN-CUT-DOWN-EXTERNAL-SERVICES.md';
const csvHelperPath =
  'website/lib/quote/admin-read/admin-quote-request-hubspot-import-csv.ts';
const csvRouteHelperPath =
  'website/lib/quote/admin-read/admin-quote-request-hubspot-import-csv-route.ts';
const csvRoutePath =
  'website/app/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv/route.ts';
const manifestHelperPath =
  'website/lib/quote/admin-read/admin-quote-request-crm-handoff-packet-manifest.ts';
const inboxPanelPath = 'website/components/admin/quote-request-inbox-panel.tsx';
const csvHelperTestPath =
  'website/lib/quote/admin-read/admin-quote-request-hubspot-import-csv.test.ts';
const csvRouteTestPath =
  'website/lib/quote/admin-read/admin-quote-request-hubspot-import-csv-route.test.ts';
const manifestTestPath =
  'website/lib/quote/admin-read/admin-quote-request-crm-handoff-packet-manifest.test.ts';
const inboxPanelTestPath =
  'website/components/admin/quote-request-inbox-panel.test.tsx';
const migrationPath =
  'supabase/migrations/20260617090000_hubspot_import_csv_handoff_manifest_kind.sql';
const suitePath = 'scripts/validate-release-candidate-suite.cjs';
const packageScriptName =
  'validate:protected-admin-hubspot-import-csv-handoff-foundation';
const packageScriptCommand =
  'node scripts/validate-protected-admin-hubspot-import-csv-handoff-foundation.cjs';

const trackerPaths = [
  'docs/PHASE-STATUS.md',
  'docs/PHASE-ROADMAP.md',
  'docs/OWNER-REVIEW-READINESS-PACKAGE.md',
  'docs/DECISION-LOG.md',
  'docs/checklists/PHASE-2-ADMIN-OPS.md',
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
  const statusFiles = parseStatusFiles(status);

  if (statusFiles.length > 0) {
    return [...new Set(statusFiles)].sort();
  }

  const mergeBase = git(['merge-base', 'HEAD', 'origin/main'], {
    allowFailure: true,
  });

  if (mergeBase.status === 0 && mergeBase.stdout.trim()) {
    return git([
      'diff',
      '--name-only',
      '--diff-filter=ACMRT',
      mergeBase.stdout.trim(),
      'HEAD',
    ])
      .stdout.split(/\r?\n/)
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
  const untrackedFiles = changedFiles.filter(
    (file) => !trackedFiles.includes(file),
  );
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
    if (exists(file)) addedLines.push(read(file));
  }

  return addedLines.join('\n');
}

for (const requiredPath of [
  docPath,
  auditDocPath,
  packetDocPath,
  queueDocPath,
  supabaseDocPath,
  architectureDocPath,
  cutDownDocPath,
  csvHelperPath,
  csvRouteHelperPath,
  csvRoutePath,
  manifestHelperPath,
  inboxPanelPath,
  csvHelperTestPath,
  csvRouteTestPath,
  manifestTestPath,
  inboxPanelTestPath,
  migrationPath,
  suitePath,
]) {
  assert(exists(requiredPath), `Missing required file: ${requiredPath}`);
}

const doc = read(docPath);
const auditDoc = read(auditDocPath);
const packetDoc = read(packetDocPath);
const queueDoc = read(queueDocPath);
const supabaseDoc = read(supabaseDocPath);
const architectureDoc = read(architectureDocPath);
const cutDownDoc = read(cutDownDocPath);
const csvHelper = read(csvHelperPath);
const csvRouteHelper = read(csvRouteHelperPath);
const csvRoute = read(csvRoutePath);
const manifestHelper = read(manifestHelperPath);
const inboxPanel = read(inboxPanelPath);
const csvHelperTest = read(csvHelperTestPath);
const csvRouteTest = read(csvRouteTestPath);
const manifestTest = read(manifestTestPath);
const inboxPanelTest = read(inboxPanelTestPath);
const migration = read(migrationPath);
const packageJson = JSON.parse(read('package.json'));
const releaseSuite = read(suitePath);

for (const required of [
  'protected admin-only HubSpot import CSV handoff export',
  'manual HubSpot import readiness only',
  'Records remain queued.',
  'This does not mutate quote/enquiry rows.',
  'This does not mark records as synced.',
  'This does not set CRM sync attempt timestamps.',
  'This does not create or update CRM contact IDs.',
  'This does not create or update CRM deal IDs.',
  'The manifest does not store full CSV content',
  'full packet JSON',
  'full customer messages',
  'headers, cookies, sessions',
  'provider tokens',
  'CSV cells that begin with `=`, `+`, `-`, `@`, tab, or carriage return',
  'HubSpot CRM sync is still not implemented.',
  'n8n workflows are still not implemented.',
  'Email sending is still not implemented.',
]) {
  includes(doc, required, docPath);
}

for (const [docLabel, source] of [
  [auditDocPath, auditDoc],
  [packetDocPath, packetDoc],
  [queueDocPath, queueDoc],
  [supabaseDocPath, supabaseDoc],
  [architectureDocPath, architectureDoc],
  [cutDownDocPath, cutDownDoc],
]) {
  includes(source, docPath, docLabel);
  includes(source, 'manual', docLabel);
  includes(source, 'does not', docLabel);
}

for (const trackerPath of trackerPaths) {
  const tracker = read(trackerPath);
  includes(tracker, docPath, trackerPath);
  includes(tracker, 'Records remain queued', trackerPath);
  includes(tracker, 'manifest stores metadata only', trackerPath);
}

for (const required of [
  'import "server-only";',
  'Quote Request ID',
  'Public Reference',
  'Customer Email',
  'Message Details',
  'CRM Provider',
  'Local CRM Sync Status',
  'formulaInjectionPattern',
  '/^[=+\\-@\\t\\r]/',
  "replace(/\"/g, '\"\"')",
  'skr-hubspot-import-queued-enquiries-',
]) {
  includes(csvHelper, required, csvHelperPath);
}
noMatch(
  csvHelper,
  /crmContactId|crmDealId|crm_last_sync_attempt_at|internal_note|authorization|cookie|session/i,
  csvHelperPath,
);

for (const required of [
  'createServerAdminCsrfProofRuntimeDependencies',
  'resolveServerAdminCsrfProofSessionWorkspaceBinding',
  'requestedOperation: "quote.write"',
  'requestMethod !== "POST"',
  'status === null || status === "queued"',
  'generateAdminQuoteRequestHubSpotImportCsv',
  'packetKind: "hubspot_import_csv"',
  '"Content-Type": "text/csv; charset=utf-8"',
  '"Content-Disposition"',
  '"X-Content-Type-Options": "nosniff"',
  'quote_crm_handoff_csv_unavailable',
]) {
  includes(csvRouteHelper, required, csvRouteHelperPath);
}
noMatch(csvRouteHelper, /\.update\s*\(|\.upsert\s*\(|\.delete\s*\(|\.rpc\s*\(/i, csvRouteHelperPath);
includes(csvRoute, 'export async function POST', csvRoutePath);
noMatch(csvRoute, /export async function GET/i, csvRoutePath);

for (const required of [
  'hubspot_import_csv',
  'json_review_packet',
  'AdminQuoteRequestCrmHandoffPacketManifestKind',
  'packetKind?: AdminQuoteRequestCrmHandoffPacketManifestKind',
]) {
  includes(manifestHelper, required, manifestHelperPath);
}
noMatch(
  manifestHelper,
  /csv\s*content|customerName|customerEmail|messageDetails|crmContactId|crmDealId|crmLastSyncAttemptAt/i,
  manifestHelperPath,
);

for (const required of [
  'drop constraint if exists quote_crm_handoff_packet_manifests_packet_kind_check',
  "packet_kind in ('json_review_packet', 'hubspot_import_csv')",
  'quote_crm_handoff_packet_manifests_quote_admin_csv_insert',
  'public.is_workspace_quote_manager(workspace_id)',
  'generated_by_admin_user_id = public.current_quote_admin_user_id(workspace_id)',
  "packet_kind = 'hubspot_import_csv'",
]) {
  includes(migration, required, migrationPath);
}
noMatch(
  migration,
  /customer_name|customer_email|customer_phone|customer_message|message_details|crm_contact_id|crm_deal_id|crm_last_sync_attempt_at/i,
  migrationPath,
);

for (const required of [
  'Download HubSpot import CSV',
  'requestQuoteWriteProof(fetcher)',
  'hubspot-import-csv?limit=',
  'method: "POST"',
  'Accept: "text/csv"',
  'Records remain queued',
  'No HubSpot sync occurs',
  'no provider IDs are created',
  'no sync timestamp is set',
]) {
  includes(inboxPanel, required, inboxPanelPath);
}

for (const required of [
  'Generates expected headers'.toLowerCase(),
  'formula injection',
  '=QR-FORMULA',
  'crm_contact_id',
  'crm_deal_id',
  'crm_last_sync_attempt_at',
]) {
  includes(csvHelperTest.toLowerCase(), required.toLowerCase(), csvHelperTestPath);
}

for (const required of [
  'returns no-store CSV',
  'requestedOperation: "quote.write"',
  'request_filter_invalid',
  'rejects public or unauthorised access before reading packet data',
  'packetKind: "hubspot_import_csv"',
  'quote_crm_handoff_csv_unavailable',
  'crm_last_sync_attempt_at',
]) {
  includes(csvRouteTest, required, csvRouteTestPath);
}

for (const required of [
  'creates a metadata-only HubSpot import CSV manifest without storing CSV contents',
  'packetKind: "hubspot_import_csv"',
  'not.toContain("Quote Request ID")',
  'not.toContain("Maya Tan")',
  'not.toContain("crm_contact_id")',
]) {
  includes(manifestTest, required, manifestTestPath);
}

for (const required of [
  'downloads a protected HubSpot import CSV after quote.write proof without provider calls',
  'download HubSpot import CSV',
  'hubspot-import-csv?limit=25&status=queued',
  'Accept: "text/csv"',
  'No HubSpot sync occurs',
  'no sync timestamp is set',
  'not.toContain("hubapi")',
]) {
  includes(inboxPanelTest.toLowerCase(), required.toLowerCase(), inboxPanelTestPath);
}

assert(
  packageJson.scripts?.[packageScriptName] === packageScriptCommand,
  `package.json must register ${packageScriptName}`,
);
includes(releaseSuite, packageScriptName, suitePath);
noMatch(
  releaseSuite,
  /docker.*(?:skip|bypass)|(?:skip|bypass).*docker|SKIP_DOCKER|BYPASS_DOCKER/i,
  suitePath,
);

const changedFiles = getChangedFiles();
for (const file of changedFiles) {
  const normalized = file.replace(/\\/g, '/');
  assert(normalized !== 'website/chat-config.js', 'Do not change website/chat-config.js');
  assert(!/(^|\/)\.env(?:\.|$)|\.env\./i.test(normalized), `Do not add or change env files: ${file}`);
}

const addedTextWithoutThisValidator = getAddedDiffText(
  changedFiles.filter(
    (file) =>
      file !==
      'scripts/validate-protected-admin-hubspot-import-csv-handoff-foundation.cjs',
  ),
);
const addedRuntimeText = getAddedDiffText(
  changedFiles.filter(
    (file) =>
      !file.startsWith('docs/') &&
      !file.includes('.test.') &&
      !file.startsWith('scripts/validate-'),
  ),
);

for (const pattern of [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /\b(?:ghp|github_pat|xox[baprs]-)[A-Za-z0-9_-]{20,}\b/i,
  /\bsk-[A-Za-z0-9_-]{24,}\b/i,
  /\b(?:HUBSPOT|SUPABASE|N8N|GOOGLE|RESEND|SMTP|GH|GITHUB|PINECONE)[A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|CLIENT_SECRET)\s*=\s*\S+/i,
]) {
  noMatch(addedTextWithoutThisValidator, pattern, 'added lines');
}

for (const pattern of [
  /hubspot\/api-client|api[.]hubapi[.]com|new\s+HubSpot|hubspot\s*Client[.]|oauth.*hubspot/i,
  /n8n.*nodes.*base|\/webhook(?:-test)?\/|N8N.*CHAT.*WEBHOOK.*URL/i,
  /from ['"]resend['"]|new\s+Resend|resend[.]emails[.]send/i,
  /smtp[.]gmail|google\s*apis|gmail[.]users[.]messages|node\s*mailer/i,
  /NEXT_PUBLIC[_]SUPABASE|SUPABASE[_]SERVICE[_]ROLE[_]KEY/i,
  /\.update\s*\(|\.upsert\s*\(|\.delete\s*\(|\.rpc\s*\(/i,
  /from\(["']quote_requests["']\)[\s\S]{0,240}\.insert\s*\(/i,
  /\bc[a]rt\b|\bcheck\s*out\b|\bord\s+er\b|\bpay\s*ment\b|\bpurch\s*ase\b/i,
  /\bb[o]oking\b|\breser\s*vation\b|\bfulfil\s*ment\b|\bfulfill\s*ment\b|stock-reser\s*vation/i,
]) {
  noMatch(addedRuntimeText, pattern, 'runtime added lines');
}

console.log(
  'Protected admin HubSpot import CSV handoff foundation validation passed. Protected POST/CSRF CSV export, formula-injection protection, metadata-only CSV manifests, admin UI action, docs, tests, package script, and release-candidate wiring are present without provider calls, n8n, email sending, customer accounts, synced marking, sync timestamp updates, CRM IDs, customer-flow creep, chat-config changes, env changes, Docker guard changes, or existing CRM handoff validator weakening.',
);
