#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const {
  scanStaticSecurity,
} = require('./validate-production-security-readiness.cjs');

const repoRoot = path.resolve(__dirname, '..');
const contractPath = path.join(
  repoRoot,
  'docs',
  'contracts',
  'server-env-contract.json',
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

const REQUIRED_STAGE_A_ENV = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'CATALOGUE_WORKSPACE_ID',
  'ADMIN_TRUSTED_WORKSPACE_ID',
  'ADMIN_EXPECTED_ORIGIN',
  'ADMIN_EXPECTED_HOST',
  'ADMIN_CSRF_PROOF_SECRET',
  'ADMIN_MUTATIONS_ENABLED',
];

const REQUIRED_STAGE_A_INVARIANTS = [
  'exact-sha-deployment',
  'quote-submission-disabled',
  'n8n-inactive',
  'no-customer-quote-submission',
  'anonymous-admin-denial',
  'admin-mutations-disabled',
  'provider-signup-admission-verified',
  'google-oauth-owner-uat',
];

const REQUIRED_STAGE_B_ENV = [
  ...REQUIRED_STAGE_A_ENV,
  'QUOTE_WORKSPACE_ID',
  'QUOTE_SUBMISSION_ADMISSION_SECRET',
  'N8N_ENQUIRY_HANDOFF_WEBHOOK_URL',
  'N8N_ENQUIRY_HANDOFF_SHARED_SECRET',
];

const REQUIRED_STAGE_B_INVARIANTS = [
  'reviewed-n8n-enquiry-workflow',
  'timestamped-hmac-verification',
  'timestamp-freshness-enforcement',
  'durable-idempotency',
  'delivery-evidence',
  'deliberate-quote-enablement',
  'admin-mutation-state-explicit',
  'quote-email-runtime-readiness',
];

const REQUIRED_PROVIDER_ADMISSION_FIELDS = [
  'admissionMechanism',
  'verificationStatus',
  'verifiedAt',
  'operatorApprovalReference',
  'requestedImmutableSha',
  'existingOwnerReadiness',
  'noPublicSignupResult',
];

const ALLOWED_PROVIDER_ADMISSION_MECHANISMS = [
  'new-user-signup-disabled',
  'before-user-created-admission-hook',
];
const PROVIDER_ADMISSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const canonicalEvidenceTimestampPattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const legacySupabaseJwtPattern =
  /^eyJ[A-Za-z0-9_-]{8,512}\.[A-Za-z0-9_-]{8,2048}\.[A-Za-z0-9_-]{20,512}$/;
const supabasePublishableKeyPattern =
  /^sb_publishable_[A-Za-z0-9_-]{16,}$/;
const approvalReferencePattern =
  /^https:\/\/github\.com\/Swooshz-com\/spacekonceptrental\/issues\/(?:291|301)#issuecomment-\d+$/;

function hasConfiguredValue(env, name) {
  return typeof env[name] === 'string' && env[name].trim().length > 0;
}

function isSafeHttpsUrl(value) {
  try {
    const parsed = new URL(value);
    const canonicalOrigin = `https://${parsed.hostname}`;

    return (
      parsed.protocol === 'https:' &&
      /^[a-z0-9]{20}\.supabase\.co$/.test(parsed.hostname) &&
      !parsed.username &&
      !parsed.password &&
      !parsed.port &&
      !parsed.search &&
      !parsed.hash &&
      parsed.pathname === '/' &&
      (value === canonicalOrigin || value === `${canonicalOrigin}/`)
    );
  } catch {
    return false;
  }
}

function hasSafeSecretShape(value) {
  if (typeof value !== 'string' || value.length < 32) {
    return false;
  }

  const lower = value.toLowerCase();

  return (
    new Set(value).size >= 8 &&
    !/^(.)\1+$/.test(value) &&
    !lower.includes('changeme') &&
    lower !== 'password' &&
    lower !== 'secret'
  );
}

function isSupportedSupabaseAnonKey(value) {
  if (typeof value !== 'string') {
    return false;
  }

  if (supabasePublishableKeyPattern.test(value)) {
    return true;
  }

  if (!legacySupabaseJwtPattern.test(value)) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(value.split('.')[1], 'base64url').toString('utf8'),
    );

    return payload?.iss === 'supabase' && payload?.role === 'anon';
  } catch {
    return false;
  }
}

function resolveCurrentRevision() {
  const revisionResult = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
  const statusResult = spawnSync(
    'git',
    ['status', '--porcelain', '--untracked-files=no'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      windowsHide: true,
    },
  );

  return revisionResult.status === 0 &&
    statusResult.status === 0 &&
    statusResult.stdout.length === 0
    ? revisionResult.stdout.trim()
    : null;
}

function validateStageARuntimeEnv(issues, env) {
  for (const name of REQUIRED_STAGE_A_ENV) {
    if (!hasConfiguredValue(env, name)) {
      issues.push(`stage_a_runtime_env_missing:${name}`);
    }
  }

  if (
    hasConfiguredValue(env, 'SUPABASE_URL') &&
    !isSafeHttpsUrl(env.SUPABASE_URL)
  ) {
    issues.push('stage_a_runtime_env_invalid:SUPABASE_URL');
  }

  if (
    hasConfiguredValue(env, 'SUPABASE_ANON_KEY') &&
    !isSupportedSupabaseAnonKey(env.SUPABASE_ANON_KEY)
  ) {
    issues.push('stage_a_runtime_env_invalid:SUPABASE_ANON_KEY');
  }

  for (const name of ['CATALOGUE_WORKSPACE_ID', 'ADMIN_TRUSTED_WORKSPACE_ID']) {
    if (hasConfiguredValue(env, name) && !uuidPattern.test(env[name])) {
      issues.push(`stage_a_runtime_env_invalid:${name}`);
    }
  }

  if (
    hasConfiguredValue(env, 'ADMIN_EXPECTED_ORIGIN') &&
    env.ADMIN_EXPECTED_ORIGIN !== 'https://spacekonceptrental.com'
  ) {
    issues.push('stage_a_runtime_env_invalid:ADMIN_EXPECTED_ORIGIN');
  }

  if (
    hasConfiguredValue(env, 'ADMIN_EXPECTED_HOST') &&
    env.ADMIN_EXPECTED_HOST !== 'spacekonceptrental.com'
  ) {
    issues.push('stage_a_runtime_env_invalid:ADMIN_EXPECTED_HOST');
  }

  if (
    hasConfiguredValue(env, 'ADMIN_CSRF_PROOF_SECRET') &&
    !hasSafeSecretShape(env.ADMIN_CSRF_PROOF_SECRET)
  ) {
    issues.push('stage_a_runtime_env_invalid:ADMIN_CSRF_PROOF_SECRET');
  }
}

function validateExactSet(issues, label, actualValues, expectedValues) {
  const actual = new Set(actualValues ?? []);
  const expected = new Set(expectedValues);

  for (const value of expected) {
    if (!actual.has(value)) {
      issues.push(`${label}_missing:${value}`);
    }
  }

  for (const value of actual) {
    if (!expected.has(value)) {
      issues.push(`${label}_unexpected:${value}`);
    }
  }
}

function validateStageARepositoryReadiness({
  contract: contractOverride,
  env = process.env,
  providerAdmissionEvidence,
  repositoryOnly = false,
  nowMs = Date.now(),
  expectedRevision = resolveCurrentRevision(),
} = {}) {
  const issues = [];
  const contract = contractOverride ?? readJson(contractPath);
  const stages = contract.launchReadiness?.stages;
  const stageA = stages?.stageAControlledOAuthDeployment;
  const stageB = stages?.stageBFullEnquiryLaunch;

  if (!stageA || !stageB) {
    issues.push('stage_contract_missing');
    return issues;
  }

  validateExactSet(
    issues,
    'stage_a_required_env',
    stageA.requiredEnvNames,
    REQUIRED_STAGE_A_ENV,
  );
  validateExactSet(
    issues,
    'stage_a_required_invariant',
    stageA.requiredInvariants,
    REQUIRED_STAGE_A_INVARIANTS,
  );

  if (stageA.n8nRequired !== false || stageA.quoteEnablementAllowed !== false) {
    issues.push('stage_a_safety_invariants_invalid');
  }

  if (stageA.adminMutationsRequiredState !== 'disabled') {
    issues.push('stage_a_admin_mutation_contract_invalid');
  }

  const providerContract = stageA.providerAdmissionEvidence;
  if (
    providerContract?.requiredStatus !== 'PASS' ||
    providerContract?.holdStatus !== 'HOLD - NOT VERIFIED' ||
    providerContract?.repositoryTestsCanSatisfy !== false ||
    providerContract?.maximumEvidenceAgeHours !== 24 ||
    providerContract?.timestampFormat !==
      'canonical-utc-iso-8601-milliseconds' ||
    providerContract?.approvalReferenceFormat !== 'canonical-issue-comment-url'
  ) {
    issues.push('stage_a_provider_admission_contract_invalid');
  }
  validateExactSet(
    issues,
    'stage_a_provider_admission_field',
    providerContract?.requiredFields,
    REQUIRED_PROVIDER_ADMISSION_FIELDS,
  );
  validateExactSet(
    issues,
    'stage_a_provider_admission_mechanism',
    providerContract?.allowedMechanisms,
    ALLOWED_PROVIDER_ADMISSION_MECHANISMS,
  );

  if (!repositoryOnly) {
    validateStageARuntimeEnv(issues, env);
    const adminMutationState = env.ADMIN_MUTATIONS_ENABLED;

    if (adminMutationState === 'true') {
      issues.push('stage_a_admin_mutations_not_disabled');
    } else if (adminMutationState !== 'false') {
      issues.push('stage_a_admin_mutations_not_proven_disabled');
    }

    if (expectedRevision === null) {
      issues.push('stage_a_repository_revision_not_clean');
    }
  }

  if (!repositoryOnly) {
    const evidence = providerAdmissionEvidence;
    const verifiedAtMs =
      typeof evidence?.verifiedAt === 'string'
        ? Date.parse(evidence.verifiedAt)
        : Number.NaN;
    const canonicalTimestamp =
      typeof evidence?.verifiedAt === 'string' &&
      canonicalEvidenceTimestampPattern.test(evidence.verifiedAt) &&
      Number.isFinite(verifiedAtMs) &&
      new Date(verifiedAtMs).toISOString() === evidence.verifiedAt;
    const evidenceComplete =
      evidence?.verificationStatus === 'PASS' &&
      evidence?.existingOwnerReadiness === 'PASS' &&
      evidence?.noPublicSignupResult === 'PASS' &&
      ALLOWED_PROVIDER_ADMISSION_MECHANISMS.includes(
        evidence?.admissionMechanism,
      ) &&
      canonicalTimestamp &&
      Number.isFinite(nowMs) &&
      verifiedAtMs <= nowMs &&
      nowMs - verifiedAtMs <= PROVIDER_ADMISSION_MAX_AGE_MS &&
      typeof evidence?.operatorApprovalReference === 'string' &&
      approvalReferencePattern.test(evidence.operatorApprovalReference) &&
      typeof expectedRevision === 'string' &&
      /^[0-9a-f]{40}$/.test(expectedRevision) &&
      evidence?.requestedImmutableSha === expectedRevision;

    if (!evidenceComplete) {
      issues.push('stage_a_provider_admission_not_verified');
    }
  }

  validateExactSet(
    issues,
    'stage_b_required_env',
    stageB.requiredEnvNames,
    REQUIRED_STAGE_B_ENV,
  );
  validateExactSet(
    issues,
    'stage_b_required_invariant',
    stageB.requiredInvariants,
    REQUIRED_STAGE_B_INVARIANTS,
  );
  validateExactSet(
    issues,
    'launch_required_env',
    contract.launchReadiness.requiredEnvNames,
    REQUIRED_STAGE_B_ENV,
  );

  if (stageB.n8nRequired !== true || stageB.quoteEnablementAllowed !== true) {
    issues.push('stage_b_launch_invariants_invalid');
  }

  const rootPackage = readJson(path.join(repoRoot, 'package.json'));
  const websitePackage = readJson(path.join(repoRoot, 'website', 'package.json'));
  const nvmrc = readText('.nvmrc').trim();
  const ci = readText('.github/workflows/ci.yml');

  if (rootPackage.engines?.node !== '>=24 <25') {
    issues.push('root_node_24_contract_missing');
  }
  if (websitePackage.engines?.node !== '>=24 <25') {
    issues.push('website_node_24_contract_missing');
  }
  if (nvmrc !== '24') {
    issues.push('nvmrc_node_24_contract_missing');
  }
  if (!/node-version:\s*24\b/.test(ci)) {
    issues.push('ci_node_24_contract_missing');
  }

  const staticIssues = scanStaticSecurity(repoRoot);

  for (const issue of staticIssues) {
    issues.push(`static_security:${issue.name}:${issue.summary}`);
  }

  return issues;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const repositoryOnly = args.includes('--repository-only');
  const evidenceIndex = args.indexOf('--provider-admission-evidence');
  let providerAdmissionEvidence;

  if (evidenceIndex >= 0 && args[evidenceIndex + 1]) {
    try {
      providerAdmissionEvidence = readJson(
        path.resolve(process.cwd(), args[evidenceIndex + 1]),
      );
    } catch {
      providerAdmissionEvidence = null;
    }
  }

  const issues = validateStageARepositoryReadiness({
    repositoryOnly,
    providerAdmissionEvidence,
  });

  if (issues.length > 0) {
    console.error('Stage A OAuth deployment readiness: failed or held.');
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exitCode = 1;
  } else {
    console.log(
      repositoryOnly
        ? 'Stage A repository contract readiness: passed.'
        : 'Stage A OAuth deployment readiness: passed.',
    );
    console.log('Repository static security checks: passed.');
    console.log('Node runtime contract: Node 24.');
    console.log('Quote enablement required: no.');
    console.log('Active n8n configuration required: no.');
    console.log('Admin mutations required state: disabled.');
    console.log(
      repositoryOnly
        ? 'Provider admission completion evidence evaluated: no.'
        : 'Provider admission completion evidence: passed.',
    );
    console.log('Provider or production operation performed: no.');
  }
}

module.exports = {
  validateStageARepositoryReadiness,
};
