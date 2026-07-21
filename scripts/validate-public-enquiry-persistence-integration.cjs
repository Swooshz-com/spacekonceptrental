#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');

const integrationDocPath =
  'docs/architecture/PUBLIC-ENQUIRY-PERSISTENCE-INTEGRATION.md';
const foundationDocPath =
  'docs/architecture/SUPABASE-ENQUIRY-PERSISTENCE-CRM-HANDOFF-FOUNDATION.md';
const architectureDocPath =
  'docs/architecture/EXTERNAL-SERVICES-AUTH-CRM-EMAIL-ENQUIRY-ARCHITECTURE.md';
const cutDownDocPath =
  'docs/architecture/IMPLEMENTATION-PLAN-CUT-DOWN-EXTERNAL-SERVICES.md';
const quoteRoutePath = 'website/app/api/quote/route.ts';
const quoteRouteTestPath = 'website/app/api/quote/route.test.ts';
const quoteFormPath = 'website/components/QuoteRequestForm.tsx';
const quoteFormTestPath = 'website/components/QuoteRequestForm.test.tsx';
const quotePagePath = 'website/app/quote/page.tsx';
const quoteValidationPath = 'website/lib/quote/validation.ts';
const quoteValidationTestPath = 'website/lib/quote/validation.test.ts';
const quoteRepositoryPath = 'website/lib/quote/quote-repository.ts';
const quoteRepositoryTestPath = 'website/lib/quote/quote-repository.test.ts';
const quoteHandoffRepositoryPath =
  'website/lib/quote/quote-handoff-repository.ts';
const quoteMigrationPath =
  'supabase/migrations/20260720090000_atomic_public_quote_submission.sql';
const suitePath = 'scripts/validate-release-candidate-suite.cjs';
const packageScriptName = 'validate:public-enquiry-persistence-integration';
const packageScriptCommand =
  'node scripts/validate-public-enquiry-persistence-integration.cjs';

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
  integrationDocPath,
  foundationDocPath,
  architectureDocPath,
  cutDownDocPath,
  quoteRoutePath,
  quoteRouteTestPath,
  quoteFormPath,
  quoteFormTestPath,
  quotePagePath,
  quoteValidationPath,
  quoteValidationTestPath,
  quoteRepositoryPath,
  quoteRepositoryTestPath,
  quoteHandoffRepositoryPath,
  quoteMigrationPath,
  suitePath,
]) {
  assert(exists(requiredPath), `Missing required file: ${requiredPath}`);
}

const integrationDoc = read(integrationDocPath);
const foundationDoc = read(foundationDocPath);
const architectureDoc = read(architectureDocPath);
const cutDownDoc = read(cutDownDocPath);
const quoteRoute = read(quoteRoutePath);
const quoteRouteTest = read(quoteRouteTestPath);
const quoteForm = read(quoteFormPath);
const quoteFormTest = read(quoteFormTestPath);
const quotePage = read(quotePagePath);
const quoteValidation = read(quoteValidationPath);
const quoteValidationTest = read(quoteValidationTestPath);
const quoteRepository = read(quoteRepositoryPath);
const quoteRepositoryTest = read(quoteRepositoryTestPath);
const quoteHandoffRepository = read(quoteHandoffRepositoryPath);
const quoteMigration = read(quoteMigrationPath);
const packageJson = JSON.parse(read('package.json'));
const releaseSuite = read(suitePath);

for (const required of [
  'Public enquiry submissions now use the Supabase persistence foundation.',
  'HubSpot CRM sync is not implemented.',
  'n8n workflows are not implemented.',
  'Email sending is not implemented.',
  'Public customer accounts remain deferred.',
  'Custom CRM remains rejected/deferred.',
  'Google Workspace/domain email remains human/admin email first.',
  'Resend remains optional future transactional email only.',
  'Public input cannot override CRM provider, CRM status, CRM IDs, sync timestamp, or sync error fields',
]) {
  includes(integrationDoc, required, integrationDocPath);
}

for (const [docPath, source] of [
  [foundationDocPath, foundationDoc],
  [architectureDocPath, architectureDoc],
  [cutDownDocPath, cutDownDoc],
]) {
  includes(source, integrationDocPath, docPath);
  includes(
    source,
    'Public enquiry submissions now use the Supabase persistence foundation',
    docPath,
  );
}

for (const trackerPath of trackerPaths) {
  const tracker = read(trackerPath);
  includes(tracker, integrationDocPath, trackerPath);
  includes(tracker, 'Public enquiry submissions now use the Supabase persistence foundation', trackerPath);
  includes(tracker, 'Google Workspace/domain email remains human/admin email first.', trackerPath);
  includes(tracker, 'Resend remains optional future transactional email only.', trackerPath);
}

matches(quoteRoute, /validateQuoteSubmission[\s\S]*createQuoteRequest/, quoteRoutePath);
matches(quoteRoute, /validationError\(validation\.message, requestId\)/, quoteRoutePath);
matches(quoteRoute, /persistenceError\(requestId, request\)/, quoteRoutePath);
matches(quoteForm, /sourcePath[\s\S]*listingSlug[\s\S]*requestId/, quoteFormPath);
matches(quoteForm, /globalThis\.crypto\?\.randomUUID\?\.\(\)/, quoteFormPath);
matches(quoteForm, /canonicalizeLogicalQuotePayload[\s\S]*submissionAttemptSnapshot/, quoteFormPath);
noMatch(quoteForm, /Math\.random|Date\.now\(\)\.toString\(requestIdFallbackRadix\)/, quoteFormPath);
matches(quoteForm, /fetch\("\/api\/quote"/, quoteFormPath);
matches(quoteForm, /disabled=\{submitState\.status === "submitting"\}/, quoteFormPath);
matches(quotePage, /initialListingSlug=\{context\.requestedSlug\}/, quotePagePath);
matches(quoteValidation, /allowedTopLevelKeys[\s\S]*sourcePath[\s\S]*listingSlug[\s\S]*requestId/, quoteValidationPath);
matches(quoteValidation, /requestIdPattern[\s\S]*requestId must be a valid submission identifier/, quoteValidationPath);
matches(quoteValidation, /prepareQuoteForPersistence[\s\S]*crmProvider: "hubspot"[\s\S]*crmSyncStatus: "not_queued"[\s\S]*crmContactId: null[\s\S]*crmDealId: null[\s\S]*crmLastSyncAttemptAt: null[\s\S]*crmSyncError: null/, quoteValidationPath);
matches(quoteRepository, /const rpcArgs = \{[\s\S]*p_source_page_path[\s\S]*p_source_listing_slug[\s\S]*p_submission_request_id[\s\S]*p_items[\s\S]*rpc\("submit_public_quote_request"[\s\S]*\.\.\.rpcArgs[\s\S]*p_admission_signature/, quoteRepositoryPath);
matches(quoteRepository, /typeof row\.was_created !== "boolean"/, quoteRepositoryPath);
matches(quoteRepository, /handoff_claim_status[\s\S]*handoff_claim_token/, quoteRepositoryPath);
matches(quoteHandoffRepository, /rpc\("finalize_public_quote_handoff"/, quoteHandoffRepositoryPath);
matches(quoteRoute, /handoffClaimStatus === "claimed"[\s\S]*emailHandoff[\s\S]*handoffFinalizer/, quoteRoutePath);
matches(quoteRoute, /handoffClaimStatus === "in_progress"[\s\S]*handoffPendingError/, quoteRoutePath);
noMatch(quoteRoute, /if \(result\.wasCreated\)/, quoteRoutePath);
matches(quoteMigration, /create table public\.quote_handoff_outbox/, quoteMigrationPath);
matches(quoteMigration, /create table public\.quote_public_workspace_config/, quoteMigrationPath);
matches(quoteMigration, /from public\.quote_public_workspace_config cfg/, quoteMigrationPath);
noMatch(quoteMigration, /from public\.catalogue_public_workspace_config cfg/, quoteMigrationPath);
matches(quoteMigration, /claim_expires_at = now\(\) \+ interval '5 minutes'/, quoteMigrationPath);
matches(quoteMigration, /revoke insert \([\s\S]*customer_message[\s\S]*crm_sync_error[\s\S]*\) on public\.quote_requests from anon;/, quoteMigrationPath);
matches(quoteMigration, /revoke insert \([\s\S]*product_name_snapshot[\s\S]*\) on public\.quote_request_items from anon;/, quoteMigrationPath);

for (const requiredTest of [
  'omits unsafe browser source metadata before submitting',
  'sourcePath: "/quote?listing=modular-lounge-set"',
  'listingSlug: "modular-lounge-set"',
  'requestId: expect.any(String)',
  'starts a new logical submission when customer details change after a pending handoff',
  'starts a new logical submission when selected quantities or notes change',
  'reuses the submission key after an uncertain network response when the payload is unchanged',
]) {
  includes(quoteFormTest, requiredTest, quoteFormTestPath);
}

for (const requiredTest of [
  'persists safe public source metadata and blocks public CRM overrides',
  'Request body contains unknown field: crm_provider.',
  'customerEmail must be a valid email address.',
  'QUOTE_PERSISTENCE_UNAVAILABLE',
  'resumes a pending handoff on an idempotent persistence replay',
  'does not send while another non-stale handoff claim is active',
]) {
  includes(quoteRouteTest, requiredTest, quoteRouteTestPath);
}

for (const requiredTest of [
  'rejects unsafe source metadata and public CRM handoff field overrides',
  'always prepares safe initial CRM placeholders',
  'request id with spaces',
  'crm_sync_status',
]) {
  includes(quoteValidationTest, requiredTest, quoteValidationTestPath);
}

includes(quoteRepositoryTest, '"submit_public_quote_request"', quoteRepositoryTestPath);
includes(quoteRepositoryTest, 'was_created: false', quoteRepositoryTestPath);
includes(quoteRepositoryTest, 'handoff_claim_status: "completed"', quoteRepositoryTestPath);

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
  assert(!/(^|\/)\.env(?:\.|$)|\.env\./i.test(file), `Do not add or change env files: ${file}`);
}

const addedText = getAddedDiffText(
  changedFiles.filter(
    (file) =>
      file !== 'scripts/validate-public-enquiry-persistence-integration.cjs' &&
      file !==
        'scripts/validate-protected-admin-enquiry-inbox-triage-foundation.cjs' &&
      file !==
        'scripts/validate-supabase-enquiry-persistence-crm-handoff-foundation.cjs' &&
      file !==
        'scripts/validate-protected-admin-enquiry-triage-status-update-foundation.cjs',
  ),
);

for (const pattern of [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /\b(?:ghp|github_pat|xox[baprs]-)[A-Za-z0-9_-]{20,}\b/i,
  /\bsk-[A-Za-z0-9_-]{24,}\b/i,
  /\b(?:HUBSPOT|SUPABASE|N8N|GOOGLE|RESEND|SMTP|GH|GITHUB|PINECONE)[A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|CLIENT_SECRET)\s*=\s*\S+/i,
  /@hubspot|hubspot\.com\/?api|api\.hubapi\.com|HubSpotClient|hubspotClient/i,
  /n8n-nodes-base|\/webhook(?:-test)?\/|N8N_CHAT_WEBHOOK_URL/i,
  /from ['"]resend['"]|new Resend|resend\.emails\.send/i,
  /smtp\.gmail|googleapis|gmail\.users\.messages|nodemailer/i,
  /NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE/i,
]) {
  noMatch(addedText, pattern, 'added lines');
}

const browserPublicSource = [quoteForm, quotePage].join('\n');
for (const pattern of [
  /@supabase\//,
  /createServerSupabaseClient/,
  /SUPABASE_SERVICE_ROLE/,
  /NEXT_PUBLIC_SUPABASE/,
  /\bcart\b|\bcheckout\b|\border\b|\bpayment\b|\bpurchase\b/i,
  /\bbooking\b|\breservation\b|\bfulfilment\b|\bfulfillment\b|stock-reservation/i,
]) {
  noMatch(browserPublicSource, pattern, 'browser public source');
}

console.log(
  'Public enquiry persistence integration validation passed. Public submissions use the existing quote persistence foundation with safe source metadata, server-owned CRM placeholders, failure-safe UX, docs, tests, and provider/customer-account firewalls.',
);
