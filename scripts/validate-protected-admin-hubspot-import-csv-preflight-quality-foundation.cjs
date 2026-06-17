#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');

const docPath =
  'docs/architecture/PROTECTED-ADMIN-HUBSPOT-IMPORT-CSV-PREFLIGHT-QUALITY-FOUNDATION.md';
const csvDocPath =
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
const preflightHelperPath =
  'website/lib/quote/admin-read/admin-quote-request-hubspot-import-csv-preflight.ts';
const csvHelperPath =
  'website/lib/quote/admin-read/admin-quote-request-hubspot-import-csv.ts';
const preflightRouteHelperPath =
  'website/lib/quote/admin-read/admin-quote-request-hubspot-import-csv-preflight-route.ts';
const preflightRoutePath =
  'website/app/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv/preflight/route.ts';
const inboxPanelPath = 'website/components/admin/quote-request-inbox-panel.tsx';
const preflightHelperTestPath =
  'website/lib/quote/admin-read/admin-quote-request-hubspot-import-csv-preflight.test.ts';
const preflightRouteTestPath =
  'website/lib/quote/admin-read/admin-quote-request-hubspot-import-csv-preflight-route.test.ts';
const inboxPanelTestPath =
  'website/components/admin/quote-request-inbox-panel.test.tsx';
const suitePath = 'scripts/validate-release-candidate-suite.cjs';
const packageScriptName =
  'validate:protected-admin-hubspot-import-csv-preflight-quality-foundation';
const packageScriptCommand =
  'node scripts/validate-protected-admin-hubspot-import-csv-preflight-quality-foundation.cjs';

const trackerPaths = [
  'docs/PHASE-STATUS.md',
  'docs/PHASE-ROADMAP.md',
  'docs/OWNER-REVIEW-READINESS-PACKAGE.md',
  'docs/DECISION-LOG.md',
  'docs/checklists/PHASE-2-ADMIN-OPS.md',
];

const existingValidatorPaths = [
  'scripts/validate-protected-admin-hubspot-import-csv-handoff-foundation.cjs',
  'scripts/validate-protected-admin-crm-handoff-packet-audit-manifest-foundation.cjs',
  'scripts/validate-protected-admin-crm-handoff-export-review-packet-foundation.cjs',
  'scripts/validate-protected-admin-crm-handoff-queue-preparation-foundation.cjs',
  'scripts/validate-supabase-enquiry-persistence-crm-handoff-foundation.cjs',
  'scripts/validate-public-enquiry-persistence-integration.cjs',
];
const allowedManualOutcomeValidatorExtensionPath =
  'scripts/validate-supabase-enquiry-persistence-crm-handoff-foundation.cjs';

const issueTypes = [
  'missing_customer_name',
  'missing_customer_email',
  'invalid_customer_email',
  'missing_customer_phone',
  'duplicate_customer_email_in_batch',
  'duplicate_customer_phone_in_batch',
  'missing_message_details',
  'message_details_too_long',
  'missing_public_reference',
  'missing_created_at',
  'csv_formula_risk_sanitised',
  'missing_source_context',
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
  csvDocPath,
  auditDocPath,
  packetDocPath,
  queueDocPath,
  supabaseDocPath,
  architectureDocPath,
  cutDownDocPath,
  preflightHelperPath,
  csvHelperPath,
  preflightRouteHelperPath,
  preflightRoutePath,
  inboxPanelPath,
  preflightHelperTestPath,
  preflightRouteTestPath,
  inboxPanelTestPath,
  suitePath,
  ...trackerPaths,
  ...existingValidatorPaths,
]) {
  assert(exists(requiredPath), `Missing required file: ${requiredPath}`);
}

const doc = read(docPath);
const csvDoc = read(csvDocPath);
const auditDoc = read(auditDocPath);
const packetDoc = read(packetDocPath);
const queueDoc = read(queueDocPath);
const supabaseDoc = read(supabaseDocPath);
const architectureDoc = read(architectureDocPath);
const cutDownDoc = read(cutDownDocPath);
const preflightHelper = read(preflightHelperPath);
const csvHelper = read(csvHelperPath);
const preflightRouteHelper = read(preflightRouteHelperPath);
const preflightRoute = read(preflightRoutePath);
const inboxPanel = read(inboxPanelPath);
const preflightHelperTest = read(preflightHelperTestPath);
const preflightRouteTest = read(preflightRouteTestPath);
const inboxPanelTest = read(inboxPanelTestPath);
const packageJson = JSON.parse(read('package.json'));
const releaseSuite = read(suitePath);

for (const required of [
  'protected admin-only HubSpot import CSV preflight quality foundation',
  'manual HubSpot import readiness only',
  'Records remain queued.',
  'Preflight does not mutate quote/enquiry rows.',
  'Preflight does not mark records synced.',
  'Preflight does not set sync attempt timestamps.',
  'Preflight does not create provider IDs.',
  'Preflight does not create or update CRM contact IDs.',
  'Preflight does not create or update CRM deal IDs.',
  'Preflight does not create audit/manifest rows by default.',
  'Preflight report is bounded and allowlisted.',
  'CSV export remains formula-injection protected.',
  'No HubSpot API sync is implemented.',
  'No n8n workflow/runtime is implemented.',
  'No email sending is implemented.',
  'auth/session/header/cookie data',
  'provider tokens',
  'CRM API responses',
]) {
  includes(doc, required, docPath);
}

for (const [docLabel, source] of [
  [csvDocPath, csvDoc],
  [auditDocPath, auditDoc],
  [packetDocPath, packetDoc],
  [queueDocPath, queueDoc],
  [supabaseDocPath, supabaseDoc],
  [architectureDocPath, architectureDoc],
  [cutDownDocPath, cutDownDoc],
]) {
  includes(source, docPath, docLabel);
  includes(source, 'bounded and allowlisted', docLabel);
  includes(source, 'Records remain queued', docLabel);
}

for (const trackerPath of trackerPaths) {
  const tracker = read(trackerPath);
  includes(tracker, docPath, trackerPath);
  includes(tracker, 'bounded and allowlisted', trackerPath);
  includes(tracker, 'Records remain queued', trackerPath);
}

for (const required of [
  'import "server-only";',
  'adminQuoteRequestHubSpotImportCsvPreflightIssueTypes',
  'generateAdminQuoteRequestHubSpotImportCsvPreflight',
  'isAdminQuoteRequestHubSpotImportCsvFormulaRisk',
  'formulaRiskCellCount',
  'issueCountsByType',
  'rowIssues',
  'exportableRecordCount',
  'needsReviewRecordCount',
]) {
  includes(preflightHelper, required, preflightHelperPath);
}

for (const issueType of issueTypes) {
  includes(preflightHelper, issueType, preflightHelperPath);
  includes(preflightHelperTest, issueType, preflightHelperTestPath);
  includes(inboxPanel, issueType, inboxPanelPath);
}

for (const required of [
  'formulaInjectionPattern',
  'adminQuoteRequestHubSpotImportCsvFormulaInjectionPattern',
  'isAdminQuoteRequestHubSpotImportCsvFormulaRisk',
  '/^[=+\\-@\\t\\r]/',
]) {
  includes(csvHelper, required, csvHelperPath);
}

noMatch(
  preflightHelper,
  /authorization|cookie|session|header|internalNotes|internal_note|crmContactId|crmDealId|crmLastSyncAttemptAt|crm_contact_id|crm_deal_id|crm_last_sync_attempt_at/i,
  preflightHelperPath,
);

for (const required of [
  'createServerAdminCsrfProofRuntimeDependencies',
  'resolveServerAdminCsrfProofSessionWorkspaceBinding',
  'requestedOperation: "quote.write"',
  'requestMethod !== "POST"',
  'status === null || status === "queued"',
  'generateAdminQuoteRequestHubSpotImportCsvPreflight',
  'quote_crm_handoff_preflight_unavailable',
]) {
  includes(preflightRouteHelper, required, preflightRouteHelperPath);
}
noMatch(
  preflightRouteHelper,
  /createManifest|readRecentManifests|packetKind|hubspot_import_csv|\.update\s*\(|\.upsert\s*\(|\.delete\s*\(|\.rpc\s*\(/i,
  preflightRouteHelperPath,
);
includes(preflightRoute, 'export async function POST', preflightRoutePath);
noMatch(preflightRoute, /export async function GET/i, preflightRoutePath);

for (const required of [
  'Run CSV import preflight',
  'hubspot-import-csv/preflight?limit=',
  'parseHubSpotImportCsvPreflightReport',
  'Manual import/export readiness only',
  'Records remain queued',
  'No HubSpot sync occurs',
  'No provider IDs are created',
  'No sync timestamp is set',
  'CSV formula-risk cells are sanitised during export',
  'Latest CSV import preflight found records needing admin review',
]) {
  includes(inboxPanel, required, inboxPanelPath);
}

for (const required of [
  'generates bounded preflight summary counts',
  'missing_customer_name',
  'formulaRiskCellCount',
  'does not include secrets',
  'handles empty queued packets safely',
]) {
  includes(preflightHelperTest, required, preflightHelperTestPath);
}

for (const required of [
  'returns a no-store bounded preflight report',
  'requestedOperation: "quote.write"',
  'rejects public or unauthorised access before reading packet data',
  'quote_crm_handoff_preflight_unavailable',
  'crm_last_sync_attempt_at',
]) {
  includes(preflightRouteTest, required, preflightRouteTestPath);
}

for (const required of [
  'runs protected HubSpot import CSV preflight',
  'Run CSV import preflight',
  'hubspot-import-csv/preflight?limit=25&status=queued',
  'Manual import',
  'CSV formula-risk cells are sanitised during export',
  'handles protected HubSpot import CSV preflight failures generically',
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
  if (
    existingValidatorPaths.includes(normalized) &&
    normalized !== 'scripts/validate-protected-admin-hubspot-import-csv-preflight-quality-foundation.cjs'
  ) {
    const source = read(normalized);
    const allowedManualOutcomeExtension =
      normalized === allowedManualOutcomeValidatorExtensionPath &&
      source.includes('manual-import-outcome/route.ts') &&
      source.includes(
        'validate-protected-admin-hubspot-manual-import-outcome-ledger-foundation.cjs',
      ) &&
      source.includes('.env') &&
      /docker.*(?:skip|bypass)|(?:skip|bypass).*docker|SKIP_DOCKER|BYPASS_DOCKER/i.test(
        source,
      );

    if (!allowedManualOutcomeExtension) {
      fail(`Do not weaken existing CRM handoff validators in this PR: ${normalized}`);
    }
  }
}

const addedTextWithoutThisValidator = getAddedDiffText(
  changedFiles.filter(
    (file) =>
      file !==
      'scripts/validate-protected-admin-hubspot-import-csv-preflight-quality-foundation.cjs',
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
  'Protected admin HubSpot import CSV preflight quality foundation validation passed. Protected POST/CSRF preflight, bounded allowlisted report, issue types, CSV formula-risk alignment, admin UI action, docs, tests, package script, and release-candidate wiring are present without provider calls, n8n, email sending, customer accounts, synced marking, sync timestamp updates, CRM IDs, customer-flow creep, chat-config changes, env changes, Docker guard changes, manifest creation, quote/enquiry row mutation, or existing CRM handoff validator weakening.',
);
