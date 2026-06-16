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
matches(quoteRoute, /persistenceError\(requestId\)/, quoteRoutePath);
matches(quoteForm, /sourcePath[\s\S]*listingSlug[\s\S]*requestId/, quoteFormPath);
matches(quoteForm, /fetch\("\/api\/quote"/, quoteFormPath);
matches(quoteForm, /disabled=\{submitState\.status === "submitting"\}/, quoteFormPath);
matches(quotePage, /initialListingSlug=\{listingContext\.requestedSlug\}/, quotePagePath);
matches(quoteValidation, /allowedTopLevelKeys[\s\S]*sourcePath[\s\S]*listingSlug[\s\S]*requestId/, quoteValidationPath);
matches(quoteValidation, /requestIdPattern[\s\S]*requestId must be a valid submission identifier/, quoteValidationPath);
matches(quoteValidation, /prepareQuoteForPersistence[\s\S]*crmProvider: "hubspot"[\s\S]*crmSyncStatus: "not_queued"[\s\S]*crmContactId: null[\s\S]*crmDealId: null[\s\S]*crmLastSyncAttemptAt: null[\s\S]*crmSyncError: null/, quoteValidationPath);
matches(quoteRepository, /prepareQuoteForPersistence[\s\S]*source_page_path[\s\S]*source_listing_slug[\s\S]*submission_request_id[\s\S]*crm_provider[\s\S]*crm_sync_status/, quoteRepositoryPath);

for (const requiredTest of [
  'omits unsafe browser source metadata before submitting',
  'sourcePath: "/quote?listing=modular-lounge-set"',
  'listingSlug: "modular-lounge-set"',
  'requestId: expect.any(String)',
]) {
  includes(quoteFormTest, requiredTest, quoteFormTestPath);
}

for (const requiredTest of [
  'persists safe public source metadata and blocks public CRM overrides',
  'Request body contains unknown field: crm_provider.',
  'customerEmail must be a valid email address.',
  'QUOTE_PERSISTENCE_UNAVAILABLE',
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

includes(quoteRepositoryTest, 'crm_provider: "hubspot"', quoteRepositoryTestPath);
includes(quoteRepositoryTest, 'crm_sync_status: "not_queued"', quoteRepositoryTestPath);

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
    (file) => file !== 'scripts/validate-public-enquiry-persistence-integration.cjs',
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
  /docker.*(?:skip|bypass)|(?:skip|bypass).*docker|SKIP_DOCKER|BYPASS_DOCKER/i,
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
