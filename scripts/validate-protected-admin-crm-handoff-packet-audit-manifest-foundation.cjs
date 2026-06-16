#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');

const auditDocPath =
  'docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-PACKET-AUDIT-MANIFEST-FOUNDATION.md';
const packetDocPath =
  'docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-EXPORT-REVIEW-PACKET-FOUNDATION.md';
const queueDocPath =
  'docs/architecture/PROTECTED-ADMIN-CRM-HANDOFF-QUEUE-PREPARATION-FOUNDATION.md';
const statusDocPath =
  'docs/architecture/PROTECTED-ADMIN-ENQUIRY-TRIAGE-STATUS-UPDATE-FOUNDATION.md';
const inboxDocPath =
  'docs/architecture/PROTECTED-ADMIN-ENQUIRY-INBOX-TRIAGE-FOUNDATION.md';
const publicDocPath =
  'docs/architecture/PUBLIC-ENQUIRY-PERSISTENCE-INTEGRATION.md';
const supabaseDocPath =
  'docs/architecture/SUPABASE-ENQUIRY-PERSISTENCE-CRM-HANDOFF-FOUNDATION.md';
const architectureDocPath =
  'docs/architecture/EXTERNAL-SERVICES-AUTH-CRM-EMAIL-ENQUIRY-ARCHITECTURE.md';
const cutDownDocPath =
  'docs/architecture/IMPLEMENTATION-PLAN-CUT-DOWN-EXTERNAL-SERVICES.md';
const inboxPanelPath = 'website/components/admin/quote-request-inbox-panel.tsx';
const manifestHelperPath =
  'website/lib/quote/admin-read/admin-quote-request-crm-handoff-packet-manifest.ts';
const packetRouteHelperPath =
  'website/lib/quote/admin-read/admin-quote-request-crm-handoff-packet-route.ts';
const packetRoutePath =
  'website/app/api/admin/quote-requests/crm-handoff-packet/route.ts';
const manifestTestPath =
  'website/lib/quote/admin-read/admin-quote-request-crm-handoff-packet-manifest.test.ts';
const packetRouteTestPath =
  'website/lib/quote/admin-read/admin-quote-request-crm-handoff-packet-route.test.ts';
const inboxPanelTestPath =
  'website/components/admin/quote-request-inbox-panel.test.tsx';
const migrationPath =
  'supabase/migrations/20260616160000_quote_crm_handoff_packet_manifest_foundation.sql';
const suitePath = 'scripts/validate-release-candidate-suite.cjs';
const packageScriptName =
  'validate:protected-admin-crm-handoff-packet-audit-manifest-foundation';
const packageScriptCommand =
  'node scripts/validate-protected-admin-crm-handoff-packet-audit-manifest-foundation.cjs';

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
  auditDocPath,
  packetDocPath,
  queueDocPath,
  statusDocPath,
  inboxDocPath,
  publicDocPath,
  supabaseDocPath,
  architectureDocPath,
  cutDownDocPath,
  inboxPanelPath,
  manifestHelperPath,
  packetRouteHelperPath,
  packetRoutePath,
  manifestTestPath,
  packetRouteTestPath,
  inboxPanelTestPath,
  migrationPath,
  suitePath,
]) {
  assert(exists(requiredPath), `Missing required file: ${requiredPath}`);
}

const auditDoc = read(auditDocPath);
const packetDoc = read(packetDocPath);
const queueDoc = read(queueDocPath);
const statusDoc = read(statusDocPath);
const inboxDoc = read(inboxDocPath);
const publicDoc = read(publicDocPath);
const supabaseDoc = read(supabaseDocPath);
const architectureDoc = read(architectureDocPath);
const cutDownDoc = read(cutDownDocPath);
const inboxPanel = read(inboxPanelPath);
const manifestHelper = read(manifestHelperPath);
const packetRouteHelper = read(packetRouteHelperPath);
const packetRoute = read(packetRoutePath);
const manifestTest = read(manifestTestPath);
const packetRouteTest = read(packetRouteTestPath);
const inboxPanelTest = read(inboxPanelTestPath);
const migration = read(migrationPath);
const packageJson = JSON.parse(read('package.json'));
const releaseSuite = read(suitePath);

for (const required of [
  'Admin packet generation/export records safe audit/manifest metadata',
  'Manifests are metadata only and do not store full sensitive payload dumps.',
  'This is audit/manifest preparation only.',
  'This is not a CRM replacement.',
  'This does not contact the customer.',
  'This does not send email.',
  'This does not sync to HubSpot.',
  'This does not call or queue n8n.',
  'This does not make provider API calls.',
  'This does not create HubSpot contact/deal IDs.',
  'This does not mark records as synced.',
  'This does not set CRM sync attempt timestamps.',
  'HubSpot CRM sync is still not implemented.',
  'n8n workflows are still not implemented.',
  'Email sending is still not implemented.',
  'Public customer accounts remain deferred.',
  'Public customer login remains unimplemented.',
  'Customer dashboard remains unimplemented.',
  'Custom CRM remains rejected/deferred.',
  'Google Workspace/domain email remains human/admin email first.',
  'Resend remains optional future transactional email only.',
  'Supabase remains the SKR app database/auth/backend foundation.',
  'HubSpot remains the future CRM/sales workflow owner',
]) {
  includes(auditDoc, required, auditDocPath);
}

for (const [docPath, source] of [
  [packetDocPath, packetDoc],
  [queueDocPath, queueDoc],
  [statusDocPath, statusDoc],
  [inboxDocPath, inboxDoc],
  [publicDocPath, publicDoc],
  [supabaseDocPath, supabaseDoc],
  [architectureDocPath, architectureDoc],
  [cutDownDocPath, cutDownDoc],
]) {
  includes(source, auditDocPath, docPath);
  includes(source, 'audit/manifest', docPath);
  includes(source, 'HubSpot CRM sync is still not implemented', docPath);
  includes(source, 'n8n workflows are still not implemented', docPath);
  includes(source, 'Email sending is still not implemented', docPath);
}

includes(
  supabaseDoc,
  'Supabase stores local packet manifest/audit metadata',
  supabaseDocPath,
);
includes(
  architectureDoc,
  'HubSpot is the future CRM/sales workflow owner',
  architectureDocPath,
);
includes(
  cutDownDoc,
  'HubSpot is the future CRM/sales workflow owner',
  cutDownDocPath,
);

for (const trackerPath of trackerPaths) {
  const tracker = read(trackerPath);
  includes(tracker, auditDocPath, trackerPath);
  includes(tracker, 'metadata only', trackerPath);
  includes(tracker, 'does not sync to HubSpot', trackerPath);
  includes(tracker, 'call or queue n8n', trackerPath);
  includes(tracker, 'Customer dashboard remains unimplemented', trackerPath);
}

matches(
  migration,
  /create table if not exists public[.]quote_crm_handoff_packet_manifests/i,
  `${migrationPath} manifest table`,
);
matches(
  migration,
  /request_ids uuid\[\] not null/i,
  `${migrationPath} bounded request ids`,
);
matches(
  migration,
  /alter table public[.]quote_crm_handoff_packet_manifests enable row level security/i,
  `${migrationPath} RLS enabled`,
);
matches(
  migration,
  /revoke all on table public[.]quote_crm_handoff_packet_manifests from public/i,
  `${migrationPath} public revoke`,
);
matches(
  migration,
  /revoke all on table public[.]quote_crm_handoff_packet_manifests from anon/i,
  `${migrationPath} anon revoke`,
);
matches(
  migration,
  /grant select, insert on public[.]quote_crm_handoff_packet_manifests to authenticated/i,
  `${migrationPath} authenticated access`,
);
matches(
  migration,
  /for select[\s\S]*using \(public[.]is_workspace_quote_manager\(workspace_id\)\)/i,
  `${migrationPath} admin select policy`,
);
matches(
  migration,
  /for insert[\s\S]*with check \([\s\S]*public[.]is_workspace_quote_manager\(workspace_id\)[\s\S]*generated_by_admin_user_id = public[.]current_quote_admin_user_id\(workspace_id\)/i,
  `${migrationPath} admin insert policy`,
);
noMatch(
  migration,
  /customer_name|customer_email|customer_phone|message_details|customer_message|crm_contact_id|crm_deal_id|crm_last_sync_attempt_at/i,
  `${migrationPath} metadata-only columns`,
);

for (const requiredHelper of [
  'import "server-only";',
  'createSessionBoundSupabaseAdminReadClient',
  'quote_crm_handoff_packet_manifests',
  'selectColumns',
  'workspace_id',
  'provider',
  'packet_kind',
  'status_filter',
  'limit_requested',
  'record_count',
  'request_ids',
  'generated_by_admin_user_id',
  'generated_at',
  'source',
  '.insert(insert)',
  '.select(selectColumns)',
  '.eq("workspace_id", input.admin.workspaceId)',
  '.eq("provider", "hubspot")',
  '.eq("status_filter", "queued")',
  '.order("generated_at", { ascending: false })',
]) {
  includes(manifestHelper, requiredHelper, manifestHelperPath);
}
for (const forbiddenHelperPattern of [
  /\.update\s*\(/i,
  /\.upsert\s*\(/i,
  /\.delete\s*\(/i,
  /\.rpc\s*\(/i,
  /from\(["']quote_requests["']\)/i,
  /customerName|customerEmail|customerPhone|messageDetails|crmContactId|crmDealId|crmLastSyncAttemptAt/i,
]) {
  noMatch(manifestHelper, forbiddenHelperPattern, manifestHelperPath);
}

for (const requiredRoute of [
  'createServerAdminCsrfProofRuntimeDependencies',
  'resolveServerAdminCsrfProofSessionWorkspaceBinding',
  'requestedOperation: "quote.write"',
  'requestMethod !== "POST"',
  'manifestPersistence.createManifest',
  'manifestPersistence.readRecentManifests',
  'quote_crm_handoff_packet_manifest_unavailable',
]) {
  includes(packetRouteHelper, requiredRoute, packetRouteHelperPath);
}
includes(packetRoute, 'export async function POST', packetRoutePath);
noMatch(packetRoute, /export async function GET/i, packetRoutePath);

for (const requiredUi of [
  'Recent CRM handoff packet manifests',
  'Audit/manifest only',
  'No CRM handoff packet manifests loaded yet',
  'requestQuoteWriteProof(fetcher)',
  'method: "POST"',
  '"x-csrf-proof": csrfProof',
  'manifest',
  'recentManifests',
  'does not call n8n, does not send email',
  'does not create provider IDs',
  'does not mark records as synced',
]) {
  includes(inboxPanel, requiredUi, inboxPanelPath);
}

for (const requiredTest of [
  'creates a metadata-only manifest after packet generation without storing payload details',
  'reads recent bounded metadata-only manifests for the admin workspace',
  'fails closed on invalid admin context, invalid limits, and persistence errors',
  'quote_crm_handoff_packet_manifests',
  'not.toContain("Maya Tan")',
  'not.toContain("maya@example.test")',
  'not.toContain("Please prepare")',
  'not.toContain("crm_contact_id")',
  'not.toContain("crm_deal_id")',
  'not.toContain("crm_last_sync_attempt_at")',
  'not.toContain("update")',
  'not.toContain("quote_requests")',
  'not.toContain("synced")',
]) {
  includes(manifestTest, requiredTest, manifestTestPath);
}

for (const requiredRouteTest of [
  'returns a no-store queued packet and records a safe manifest after quote.write admin gate checks',
  'requestedOperation: "quote.write"',
  'rejects public or unauthorised access before reading packet data',
  'maps packet read failures to generic errors without leaking provider details',
  'maps manifest write/read failures to generic errors after successful packet generation',
  'quote_crm_handoff_packet_manifest_unavailable',
  'Please prepare a lounge setup.',
]) {
  includes(packetRouteTest, requiredRouteTest, packetRouteTestPath);
}

for (const requiredUiTest of [
  'lets admins review a bounded queued CRM handoff packet without provider calls',
  'recent CRM handoff packet manifests',
  'audit\\/manifest only',
  'No CRM handoff packet manifests loaded yet',
  'does not call n8n, does not send email, does not create provider IDs, and does not mark records as synced',
  'Request IDs: 1',
  'protected_admin',
  'json_review_packet',
  'crmContactId',
  'crmDealId',
  'crmLastSyncAttemptAt',
]) {
  includes(inboxPanelTest, requiredUiTest, inboxPanelTestPath);
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
  assert(!/(^|\/)\.env(?:\.|$)|\.env\./i.test(normalized), `Do not add or change env files: ${file}`);
}

const addedTextWithoutThisValidator = getAddedDiffText(
  changedFiles.filter(
    (file) =>
      file !==
      'scripts/validate-protected-admin-crm-handoff-packet-audit-manifest-foundation.cjs',
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
]) {
  noMatch(addedRuntimeText, pattern, 'runtime added lines');
}

for (const pattern of [
  /public customer account implementation|customer dashboard|public login implementation/i,
  /\bc[a]rt\b|\bcheck\s*out\b|\bord\s+er\b|\bpay\s*ment\b|\bpurch\s*ase\b/i,
  /\bb[o]oking\b|\breser\s*vation\b|\bfulfil\s*ment\b|\bfulfill\s*ment\b|stock-reser\s*vation/i,
  /notify customer|email sent|hubspot sync started|n8n workflow started/i,
]) {
  noMatch(addedRuntimeText, pattern, 'runtime added lines');
}

console.log(
  'Protected admin CRM handoff packet audit manifest foundation validation passed. Metadata-only manifest table, RLS, protected POST/CSRF route, admin UI visibility, docs, tests, package script, and release-candidate wiring are present without full payload dumps, provider calls, credentials, n8n, email sending, customer accounts, synced marking, sync timestamp updates, customer-flow creep, or Docker guard changes.',
);
