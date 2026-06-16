#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');

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
const statusWritePath =
  'website/lib/quote/admin-write/admin-quote-request-status-write.ts';
const statusRoutePath =
  'website/lib/quote/admin-write/admin-quote-request-status-route.ts';
const routePath =
  'website/app/api/admin/quote-requests/[quoteRequestId]/status/route.ts';
const statusWriteTestPath =
  'website/lib/quote/admin-write/admin-quote-request-status-write.test.ts';
const statusRouteTestPath =
  'website/lib/quote/admin-write/admin-quote-request-status-route.test.ts';
const inboxPanelTestPath =
  'website/components/admin/quote-request-inbox-panel.test.tsx';
const quoteRouteTestPath = 'website/app/api/quote/route.test.ts';
const quoteFormTestPath = 'website/components/QuoteRequestForm.test.tsx';
const migrationPath =
  'supabase/migrations/20260616120000_admin_enquiry_triage_status_update_foundation.sql';
const suitePath = 'scripts/validate-release-candidate-suite.cjs';
const packageScriptName =
  'validate:protected-admin-enquiry-triage-status-update-foundation';
const packageScriptCommand =
  'node scripts/validate-protected-admin-enquiry-triage-status-update-foundation.cjs';

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
  statusDocPath,
  inboxDocPath,
  publicDocPath,
  supabaseDocPath,
  architectureDocPath,
  cutDownDocPath,
  inboxPanelPath,
  statusWritePath,
  statusRoutePath,
  routePath,
  statusWriteTestPath,
  statusRouteTestPath,
  inboxPanelTestPath,
  quoteRouteTestPath,
  quoteFormTestPath,
  migrationPath,
  suitePath,
]) {
  assert(exists(requiredPath), `Missing required file: ${requiredPath}`);
}

const statusDoc = read(statusDocPath);
const inboxDoc = read(inboxDocPath);
const publicDoc = read(publicDocPath);
const supabaseDoc = read(supabaseDocPath);
const architectureDoc = read(architectureDocPath);
const cutDownDoc = read(cutDownDocPath);
const inboxPanel = read(inboxPanelPath);
const statusWrite = read(statusWritePath);
const statusRoute = read(statusRoutePath);
const route = read(routePath);
const statusWriteTest = read(statusWriteTestPath);
const statusRouteTest = read(statusRouteTestPath);
const inboxPanelTest = read(inboxPanelTestPath);
const quoteRouteTest = read(quoteRouteTestPath);
const quoteFormTest = read(quoteFormTestPath);
const migration = read(migrationPath);
const packageJson = JSON.parse(read('package.json'));
const releaseSuite = read(suitePath);

for (const required of [
  'Admin users can now update internal enquiry triage status inside protected admin surfaces.',
  'This is not a CRM replacement.',
  'This does not contact the customer.',
  'This does not send email.',
  'This does not sync to HubSpot.',
  'This does not queue n8n.',
  'HubSpot CRM sync is still not implemented.',
  'n8n workflows are still not implemented.',
  'Email sending is still not implemented.',
  'Public customer accounts remain deferred.',
  'Public customer login remains unimplemented.',
  'Customer dashboard remains unimplemented.',
  'Custom CRM remains rejected/deferred.',
  'Google Workspace/domain email remains human/admin email first.',
  'Resend remains optional future transactional email only.',
  'Assignment, reminders, sales notes/activity timeline, and outbound contact workflows remain future work unless explicitly implemented in a later PR.',
]) {
  includes(statusDoc, required, statusDocPath);
}

for (const [docPath, source] of [
  [inboxDocPath, inboxDoc],
  [publicDocPath, publicDoc],
  [supabaseDocPath, supabaseDoc],
  [architectureDocPath, architectureDoc],
  [cutDownDocPath, cutDownDoc],
]) {
  includes(source, statusDocPath, docPath);
  includes(
    source,
    'Admin users can now update internal enquiry triage status inside protected admin surfaces',
    docPath,
  );
  includes(source, 'HubSpot CRM sync is still not implemented', docPath);
  includes(source, 'n8n workflows are still not implemented', docPath);
  includes(source, 'Email sending is still not implemented', docPath);
  includes(source, 'Public customer accounts remain deferred', docPath);
  includes(source, 'Public customer login remains unimplemented', docPath);
  includes(source, 'Customer dashboard remains unimplemented', docPath);
  includes(source, 'Custom CRM remains rejected/deferred', docPath);
}

for (const trackerPath of trackerPaths) {
  const tracker = read(trackerPath);
  includes(tracker, statusDocPath, trackerPath);
  includes(
    tracker,
    'Admin users can now update internal enquiry triage status inside protected admin surfaces',
    trackerPath,
  );
  includes(tracker, 'This does not sync to HubSpot', trackerPath);
  includes(tracker, 'This does not queue n8n', trackerPath);
  includes(tracker, 'Customer dashboard remains unimplemented', trackerPath);
}

for (const source of [inboxPanel, statusWrite, statusRoute, migration]) {
  includes(source, 'follow_up_needed', 'protected admin status update source');
}

matches(
  migration,
  /quote_requests_status_check[\s\S]*'archived'/,
  `${migrationPath} quote_requests legacy status constraint`,
);
matches(
  migration,
  /quote_request_activity_status_from_check[\s\S]*'archived'/,
  `${migrationPath} activity status_from legacy status constraint`,
);
matches(
  migration,
  /quote_request_activity_status_to_check[\s\S]*'archived'/,
  `${migrationPath} activity status_to legacy status constraint`,
);
matches(
  migration,
  /if p_status not in \('new', 'reviewing', 'follow_up_needed', 'quoted', 'closed'\) then[\s\S]*quote_workflow_status_invalid/,
  `${migrationPath} RPC status update allowlist`,
);
noMatch(
  migration,
  /if p_status not in \([^)]*'archived'[^)]*\) then/,
  `${migrationPath} RPC status update allowlist`,
);
matches(
  migration,
  /if nullif\(btrim\(coalesce\(p_internal_note, ''\)\), ''\) is not null then[\s\S]*quote_workflow_internal_note_not_supported/,
  `${migrationPath} p_internal_note compatibility rejection`,
);
noMatch(
  migration,
  /activity_type,[\s\S]*'internal_note'/,
  `${migrationPath} status-update foundation activity inserts`,
);

includes(inboxPanel, 'Update internal triage status', inboxPanelPath);
includes(inboxPanel, 'This does not contact the', inboxPanelPath);
includes(inboxPanel, 'sync to CRM', inboxPanelPath);
includes(inboxPanel, 'disabled={status.kind === "pending"}', inboxPanelPath);
includes(statusWrite, 'import "server-only";', statusWritePath);
includes(statusWrite, 'createSessionBoundSupabaseAdminReadClient', statusWritePath);
includes(statusWrite, 'p_internal_note: null', statusWritePath);
includes(statusRoute, 'hasOnlyKeys(body, ["status"])', statusRoutePath);
includes(route, 'handleAdminQuoteRequestStatusUpdateRoute', routePath);

for (const requiredTest of [
  'persists internal triage status through a single atomic RPC boundary',
  'follow_up_needed',
  'does not pass free-form notes through the triage status update foundation',
  'rejects archive and provider-style statuses',
  'crm_contact_id',
  'crm_sync_status',
]) {
  includes(statusWriteTest, requiredTest, statusWriteTestPath);
}

for (const requiredTest of [
  'updates quote request workflow after quote.write CSRF and admin gate checks',
  'follow_up_needed',
  'request_payload_invalid',
  'internalNote',
  'maps provider failures to generic no-store JSON',
]) {
  includes(statusRouteTest, requiredTest, statusRouteTestPath);
}

for (const requiredTest of [
  'renders internal enquiry triage status controls for authorised inbox data',
  'sends status-only triage update POST',
  'disables the triage status submit button while an update is pending',
  'shows generic errors without provider details',
  'does not imply ecommerce or customer-facing quote tracking',
]) {
  includes(inboxPanelTest, requiredTest, inboxPanelTestPath);
}

for (const requiredTest of [
  'blocks public CRM overrides',
  'track|status',
]) {
  includes(quoteRouteTest + quoteFormTest, requiredTest, 'public quote tests');
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
    (file) => file !== 'scripts/validate-protected-admin-enquiry-triage-status-update-foundation.cjs',
  ),
);

for (const pattern of [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /\b(?:ghp|github_pat|xox[baprs]-)[A-Za-z0-9_-]{20,}\b/i,
  /\bsk-[A-Za-z0-9_-]{24,}\b/i,
  /\b(?:HUBSPOT|SUPABASE|N8N|GOOGLE|RESEND|SMTP|GH|GITHUB|PINECONE)[A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|CLIENT_SECRET)\s*=\s*\S+/i,
  /@hubspot\/api-client|api\.hubapi\.com|new HubSpot|hubspotClient\./i,
  /n8n-nodes-base|\/webhook(?:-test)?\/|N8N_CHAT_WEBHOOK_URL/i,
  /from ['"]resend['"]|new Resend|resend\.emails\.send/i,
  /smtp\.gmail|googleapis|gmail\.users\.messages|nodemailer/i,
  /NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE_KEY/i,
]) {
  noMatch(addedTextWithoutThisValidator, pattern, 'added lines');
}

const addedRuntimeText = getAddedDiffText(
  changedFiles.filter(
    (file) =>
      !file.startsWith('docs/') &&
      !file.includes('.test.') &&
      !file.startsWith('scripts/validate-'),
  ),
);

for (const pattern of [
  /public customer account implementation|customer dashboard|public login implementation/i,
  /\bcart\b|\bcheckout\b|\bord\s+er\b|\bpayment\b|\bpurchase\b/i,
  /\bbooking\b|\breservation\b|\bfulfilment\b|\bfulfillment\b|stock-reservation/i,
  /notify customer|email sent|hubspot sync started|n8n workflow started/i,
]) {
  noMatch(addedRuntimeText, pattern, 'runtime added lines');
}

console.log(
  'Protected admin enquiry triage status update foundation validation passed. Admin-only status updates, docs, tests, package script, and release-candidate wiring are present without provider calls, credentials, public customer access, ecommerce/booking/payment/order flow creep, or Docker guard changes.',
);
