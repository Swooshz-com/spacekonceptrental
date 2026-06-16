#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');

const foundationDocPath =
  'docs/architecture/PROTECTED-ADMIN-ENQUIRY-INBOX-TRIAGE-FOUNDATION.md';
const publicDocPath =
  'docs/architecture/PUBLIC-ENQUIRY-PERSISTENCE-INTEGRATION.md';
const supabaseDocPath =
  'docs/architecture/SUPABASE-ENQUIRY-PERSISTENCE-CRM-HANDOFF-FOUNDATION.md';
const architectureDocPath =
  'docs/architecture/EXTERNAL-SERVICES-AUTH-CRM-EMAIL-ENQUIRY-ARCHITECTURE.md';
const cutDownDocPath =
  'docs/architecture/IMPLEMENTATION-PLAN-CUT-DOWN-EXTERNAL-SERVICES.md';
const protectedShellPath = 'website/app/admin/protected-admin-shell.tsx';
const quoteInboxPagePath = 'website/app/admin/quotes/page.tsx';
const quoteDetailPagePath = 'website/app/admin/quotes/[quoteRequestId]/page.tsx';
const inboxHelperPath =
  'website/lib/quote/admin-read/admin-quote-request-dashboard-read.ts';
const detailHelperPath =
  'website/lib/quote/admin-read/admin-quote-request-detail-read.ts';
const inboxHelperTestPath =
  'website/lib/quote/admin-read/admin-quote-request-dashboard-read.test.ts';
const detailHelperTestPath =
  'website/lib/quote/admin-read/admin-quote-request-detail-read.test.ts';
const inboxPanelPath = 'website/components/admin/quote-request-inbox-panel.tsx';
const inboxPanelTestPath =
  'website/components/admin/quote-request-inbox-panel.test.tsx';
const protectedShellTestPath = 'website/app/admin/protected-admin-shell.test.tsx';
const suitePath = 'scripts/validate-release-candidate-suite.cjs';
const packageScriptName =
  'validate:protected-admin-enquiry-inbox-triage-foundation';
const packageScriptCommand =
  'node scripts/validate-protected-admin-enquiry-inbox-triage-foundation.cjs';

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
    if (exists(file)) {
      addedLines.push(read(file));
    }
  }

  return addedLines.join('\n');
}

for (const requiredPath of [
  foundationDocPath,
  publicDocPath,
  supabaseDocPath,
  architectureDocPath,
  cutDownDocPath,
  protectedShellPath,
  quoteInboxPagePath,
  quoteDetailPagePath,
  inboxHelperPath,
  detailHelperPath,
  inboxHelperTestPath,
  detailHelperTestPath,
  inboxPanelPath,
  inboxPanelTestPath,
  protectedShellTestPath,
  suitePath,
]) {
  assert(exists(requiredPath), `Missing required file: ${requiredPath}`);
}

const foundationDoc = read(foundationDocPath);
const publicDoc = read(publicDocPath);
const supabaseDoc = read(supabaseDocPath);
const architectureDoc = read(architectureDocPath);
const cutDownDoc = read(cutDownDocPath);
const protectedShell = read(protectedShellPath);
const quoteInboxPage = read(quoteInboxPagePath);
const quoteDetailPage = read(quoteDetailPagePath);
const inboxHelper = read(inboxHelperPath);
const detailHelper = read(detailHelperPath);
const inboxHelperTest = read(inboxHelperTestPath);
const detailHelperTest = read(detailHelperTestPath);
const inboxPanel = read(inboxPanelPath);
const inboxPanelTest = read(inboxPanelTestPath);
const protectedShellTest = read(protectedShellTestPath);
const packageJson = JSON.parse(read('package.json'));
const releaseSuite = read(suitePath);

for (const required of [
  'Admin users can now view persisted public enquiries in a protected admin inbox foundation.',
  'This is not a CRM replacement.',
  'HubSpot CRM sync is still not implemented.',
  'n8n workflows are still not implemented.',
  'Email sending is still not implemented.',
  'Public customer accounts remain deferred.',
  'Public customer login remains unimplemented.',
  'Custom CRM remains rejected/deferred.',
  'Google Workspace/domain email remains human/admin email first.',
  'Resend remains optional future transactional email only.',
]) {
  includes(foundationDoc, required, foundationDocPath);
}

for (const [docPath, source] of [
  [publicDocPath, publicDoc],
  [supabaseDocPath, supabaseDoc],
  [architectureDocPath, architectureDoc],
  [cutDownDocPath, cutDownDoc],
]) {
  includes(source, foundationDocPath, docPath);
  includes(
    source,
    'Admin users can now view persisted public enquiries in a protected admin inbox foundation',
    docPath,
  );
}

for (const trackerPath of trackerPaths) {
  const tracker = read(trackerPath);
  includes(tracker, foundationDocPath, trackerPath);
  includes(
    tracker,
    'Admin users can now view persisted public enquiries in a protected admin inbox foundation',
    trackerPath,
  );
  includes(tracker, 'HubSpot CRM sync is still not implemented.', trackerPath);
  includes(tracker, 'n8n workflows are still not implemented.', trackerPath);
  includes(tracker, 'Email sending is still not implemented.', trackerPath);
  includes(tracker, 'Public customer accounts remain deferred.', trackerPath);
  includes(tracker, 'Public customer login remains unimplemented.', trackerPath);
  includes(tracker, 'Custom CRM remains rejected/deferred.', trackerPath);
}

matches(protectedShell, /view\.kind === "quotes"[\s\S]*QuoteRequestInboxPanel/, protectedShellPath);
matches(protectedShell, /view\.kind === "quote-detail"[\s\S]*AdminQuoteDetail/, protectedShellPath);
matches(quoteInboxPage, /resolveProtectedAdminShellState[\s\S]*kind: "quotes"/, quoteInboxPagePath);
matches(quoteDetailPage, /resolveProtectedAdminShellState[\s\S]*quoteDetailId[\s\S]*kind: "quote-detail"/, quoteDetailPagePath);

for (const [helperPath, helper] of [
  [inboxHelperPath, inboxHelper],
  [detailHelperPath, detailHelper],
]) {
  includes(helper, 'import "server-only";', helperPath);
  includes(helper, 'createSessionBoundSupabaseAdminReadClient', helperPath);
  includes(helper, 'source_page_path', helperPath);
  includes(helper, 'source_listing_slug', helperPath);
  includes(helper, 'crm_provider', helperPath);
  includes(helper, 'crm_sync_status', helperPath);
  includes(helper, 'crm_contact_id', helperPath);
  includes(helper, 'crm_deal_id', helperPath);
  noMatch(helper, /SUPABASE_SERVICE_ROLE/, helperPath);
  noMatch(helper, /NEXT_PUBLIC_SUPABASE/, helperPath);
}

for (const requiredTest of [
  'reads recent quote requests scoped to the trusted workspace newest first',
  'maps provider errors to a generic unavailable result',
  'source_page_path',
  'crm_provider',
  'crm_sync_status',
]) {
  includes(inboxHelperTest, requiredTest, inboxHelperTestPath);
}

for (const requiredTest of [
  'reads exactly one quote request detail scoped to the trusted workspace',
  'fails closed for invalid IDs, missing workspace, and provider errors',
  'source_page_path',
  'crm_contact_id',
  'crm_deal_id',
]) {
  includes(detailHelperTest, requiredTest, detailHelperTestPath);
}

for (const requiredTest of [
  'renders internal quote status controls for authorised inbox data',
  'does not render status controls for unavailable or empty inbox states',
  'does not imply ecommerce or customer-facing quote tracking',
  'CRM handoff placeholder',
  'No CRM contact ID captured',
  'No CRM deal ID captured',
]) {
  includes(inboxPanelTest, requiredTest, inboxPanelTestPath);
}

for (const requiredTest of [
  'maps unauthenticated users to a safe login-required state',
  'renders an empty quote request inbox state for authorised admins',
  'renders quote detail from the dedicated detail read state',
  'Provider - hubspot; Sync status - not_queued',
]) {
  includes(protectedShellTest, requiredTest, protectedShellTestPath);
}

for (const source of [protectedShell, inboxPanel]) {
  includes(source, 'CRM handoff placeholder', 'protected admin source');
  includes(source, 'Provider -', 'protected admin source');
  includes(source, 'Sync status -', 'protected admin source');
  includes(source, 'No CRM contact ID captured', 'protected admin source');
  includes(source, 'No CRM deal ID captured', 'protected admin source');
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
      !file.startsWith('scripts/validate-'),
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
]) {
  noMatch(addedRuntimeText, pattern, 'runtime added lines');
}

console.log(
  'Protected admin enquiry inbox triage foundation validation passed. Protected admin visibility, source metadata, CRM placeholders, docs, tests, and release-candidate wiring are present without provider calls, credentials, or public customer access; Docker-dependent checks remain intact.',
);
