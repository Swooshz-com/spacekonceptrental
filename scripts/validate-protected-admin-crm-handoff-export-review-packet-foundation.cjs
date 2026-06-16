#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');

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
const packetReadPath =
  'website/lib/quote/admin-read/admin-quote-request-crm-handoff-packet-read.ts';
const packetRouteHelperPath =
  'website/lib/quote/admin-read/admin-quote-request-crm-handoff-packet-route.ts';
const packetRoutePath =
  'website/app/api/admin/quote-requests/crm-handoff-packet/route.ts';
const packetReadTestPath =
  'website/lib/quote/admin-read/admin-quote-request-crm-handoff-packet-read.test.ts';
const packetRouteTestPath =
  'website/lib/quote/admin-read/admin-quote-request-crm-handoff-packet-route.test.ts';
const inboxPanelTestPath =
  'website/components/admin/quote-request-inbox-panel.test.tsx';
const suitePath = 'scripts/validate-release-candidate-suite.cjs';
const packageScriptName =
  'validate:protected-admin-crm-handoff-export-review-packet-foundation';
const packageScriptCommand =
  'node scripts/validate-protected-admin-crm-handoff-export-review-packet-foundation.cjs';

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
  packetDocPath,
  queueDocPath,
  statusDocPath,
  inboxDocPath,
  publicDocPath,
  supabaseDocPath,
  architectureDocPath,
  cutDownDocPath,
  inboxPanelPath,
  packetReadPath,
  packetRouteHelperPath,
  packetRoutePath,
  packetReadTestPath,
  packetRouteTestPath,
  inboxPanelTestPath,
  suitePath,
]) {
  assert(exists(requiredPath), `Missing required file: ${requiredPath}`);
}

const packetDoc = read(packetDocPath);
const queueDoc = read(queueDocPath);
const statusDoc = read(statusDocPath);
const inboxDoc = read(inboxDocPath);
const publicDoc = read(publicDocPath);
const supabaseDoc = read(supabaseDocPath);
const architectureDoc = read(architectureDocPath);
const cutDownDoc = read(cutDownDocPath);
const inboxPanel = read(inboxPanelPath);
const packetRead = read(packetReadPath);
const packetRouteHelper = read(packetRouteHelperPath);
const packetRoute = read(packetRoutePath);
const packetReadTest = read(packetReadTestPath);
const packetRouteTest = read(packetRouteTestPath);
const inboxPanelTest = read(inboxPanelTestPath);
const packageJson = JSON.parse(read('package.json'));
const releaseSuite = read(suitePath);

for (const required of [
  'Admin users can review/export queued CRM handoff packets.',
  'This is manual review/export preparation only.',
  'This is not a CRM replacement.',
  'This does not contact the customer.',
  'This does not send email.',
  'This does not sync to HubSpot.',
  'This does not call or queue n8n.',
  'This does not make provider API calls.',
  'This does not create HubSpot contact/deal IDs.',
  'This does not mark records as synced.',
  'HubSpot CRM sync is still not implemented.',
  'n8n workflows are still not implemented.',
  'Email sending is still not implemented.',
  'Public customer accounts remain deferred.',
  'Public customer login remains unimplemented.',
  'Customer dashboard remains unimplemented.',
  'Custom CRM remains rejected/deferred.',
  'Google Workspace/domain email remains human/admin email first.',
  'Resend remains optional future transactional email only.',
  'Actual provider sync, n8n webhook trigger, retry worker, provider callback/reconciliation, assignment, reminders, sales notes/activity timeline, and outbound contact workflows remain future work unless explicitly implemented in a later PR.',
]) {
  includes(packetDoc, required, packetDocPath);
}

for (const [docPath, source] of [
  [queueDocPath, queueDoc],
  [statusDocPath, statusDoc],
  [inboxDocPath, inboxDoc],
  [publicDocPath, publicDoc],
  [supabaseDocPath, supabaseDoc],
  [architectureDocPath, architectureDoc],
  [cutDownDocPath, cutDownDoc],
]) {
  includes(source, packetDocPath, docPath);
  includes(source, 'Admin users can review/export queued CRM handoff packets', docPath);
  includes(source, 'HubSpot CRM sync is still not implemented', docPath);
  includes(source, 'n8n workflows are still not implemented', docPath);
  includes(source, 'Email sending is still not implemented', docPath);
  includes(source, 'Public customer accounts remain deferred', docPath);
  includes(source, 'Public customer login remains unimplemented', docPath);
  includes(source, 'Customer dashboard remains unimplemented', docPath);
  includes(source, 'Custom CRM remains rejected/deferred', docPath);
}

includes(architectureDoc, 'HubSpot is the future CRM/sales workflow owner', architectureDocPath);
includes(supabaseDoc, 'Supabase remains the SKR app database/auth/backend foundation', supabaseDocPath);

for (const trackerPath of trackerPaths) {
  const tracker = read(trackerPath);
  includes(tracker, packetDocPath, trackerPath);
  includes(tracker, 'Admin users can review/export queued CRM handoff packets', trackerPath);
  includes(tracker, 'This does not sync to HubSpot', trackerPath);
  includes(tracker, 'call or queue n8n', trackerPath);
  includes(tracker, 'Customer dashboard remains unimplemented', trackerPath);
}

for (const requiredUi of [
  'Queued CRM handoff packet review',
  'Eligible queued records',
  'Review queued CRM handoff packet',
  'Manual review/export only',
  'This does not sync to HubSpot or contact customers',
  'This does not call n8n, perform email delivery, create provider IDs, or mark records as synced',
  '/api/admin/quote-requests/crm-handoff-packet?limit=',
]) {
  includes(inboxPanel, requiredUi, inboxPanelPath);
}

for (const requiredHelper of [
  'import "server-only";',
  'createSessionBoundSupabaseAdminReadClient',
  '.eq("workspace_id", workspaceId)',
  '.eq("crm_provider", "hubspot")',
  '.eq("crm_sync_status", "queued")',
  '.order("created_at", { ascending: false })',
  'const defaultLimit = 25',
  'const maxLimit = 100',
  'selectColumns',
  'crm_contact_id',
  'crm_deal_id',
  'crm_last_sync_attempt_at',
]) {
  if (requiredHelper.startsWith('crm_')) {
    noMatch(packetRead, new RegExp(`${requiredHelper}\\s*[:,]`), packetReadPath);
  } else {
    includes(packetRead, requiredHelper, packetReadPath);
  }
}

for (const requiredRoute of [
  'requestedOperation: "quote.read"',
  'requestMethod !== "GET"',
  'request_filter_invalid',
  'request_limit_invalid',
  'quote_crm_handoff_packet_unavailable',
  'Cache-Control',
]) {
  includes(packetRouteHelper, requiredRoute, packetRouteHelperPath);
}
includes(packetRoute, 'handleAdminQuoteRequestCrmHandoffPacketRoute', packetRoutePath);

for (const requiredTest of [
  'generates a bounded newest-first JSON packet for queued HubSpot handoff records',
  'crm_provider',
  'crm_sync_status',
  'not_queued',
  'failed',
  'synced',
  'keeps the JSON packet allowlisted',
  'does not expose writable provider fields',
  'without mutating records',
  'crm_last_sync_attempt_at',
  'keeps packet generation server-only and separate from public routes',
]) {
  includes(packetReadTest, requiredTest, packetReadTestPath);
}

for (const requiredTest of [
  'returns a no-store queued packet after quote.read admin gate checks',
  'rejects public or unauthorised access before reading packet data',
  'maps packet read failures to generic errors without leaking provider details',
  'request_filter_invalid',
  'request_limit_invalid',
]) {
  includes(packetRouteTest, requiredTest, packetRouteTestPath);
}

for (const requiredTest of [
  'lets admins review a bounded queued CRM handoff packet without provider calls',
  'disables queued packet review while loading and shows generic failures',
  'Manual review\\/export only',
  'does not sync to HubSpot or contact customers',
  'does not call n8n, perform email delivery, create provider IDs, or mark records as synced',
  'hubapi',
  'crmContactId',
  'crmDealId',
  'crmLastSyncAttemptAt',
]) {
  includes(inboxPanelTest, requiredTest, inboxPanelTestPath);
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
      'scripts/validate-protected-admin-crm-handoff-export-review-packet-foundation.cjs',
  ),
);
const addedNonTestRuntimeText = getAddedDiffText(
  changedFiles.filter(
    (file) =>
      file !==
        'scripts/validate-protected-admin-crm-handoff-export-review-packet-foundation.cjs' &&
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
  /hubspot\/api-client|api[.]hubapi[.]com|new\s+HubSpot|hubspot\s*Client[.]/i,
  /n8n.*nodes.*base|\/webhook(?:-test)?\/|N8N.*CHAT.*WEBHOOK.*URL/i,
  /from ['"]resend['"]|new\s+Resend|resend[.]emails[.]send/i,
  /smtp[.]gmail|google\s*apis|gmail[.]users[.]messages|node\s*mailer/i,
  /NEXT_PUBLIC[_]SUPABASE|SUPABASE[_]SERVICE[_]ROLE[_]KEY/i,
  /\.update\s*\(|\.insert\s*\(|\.upsert\s*\(|\.delete\s*\(|\.rpc\s*\(/i,
]) {
  noMatch(addedNonTestRuntimeText, pattern, 'runtime added lines');
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
  /\bc[a]rt\b|\bcheck\s*out\b|\bord\s+er\b|\bpay\s*ment\b|\bpurch\s*ase\b/i,
  /\bb[o]oking\b|\breser\s*vation\b|\bfulfil\s*ment\b|\bfulfill\s*ment\b|stock-reser\s*vation/i,
  /notify customer|email sent|hubspot sync started|n8n workflow started/i,
]) {
  noMatch(addedRuntimeText, pattern, 'runtime added lines');
}

console.log(
  'Protected admin CRM handoff export review packet foundation validation passed. Admin-only queued packet preview/export, bounded JSON allowlist, docs, tests, package script, and release-candidate wiring are present without provider calls, credentials, public customer access, synced marking, sync timestamp updates, customer-flow creep, or Docker guard changes.',
);
