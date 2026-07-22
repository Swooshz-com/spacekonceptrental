#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
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
];

const REQUIRED_STAGE_A_INVARIANTS = [
  'exact-sha-deployment',
  'quote-submission-disabled',
  'n8n-inactive',
  'no-customer-quote-submission',
  'anonymous-admin-denial',
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
  'quote-email-runtime-readiness',
];

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

function validateStageARepositoryReadiness({ contract: contractOverride } = {}) {
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
  const issues = validateStageARepositoryReadiness();

  if (issues.length > 0) {
    console.error('Stage A OAuth deployment readiness: failed.');
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exitCode = 1;
  } else {
    console.log('Stage A OAuth deployment readiness: passed.');
    console.log('Repository static security checks: passed.');
    console.log('Node runtime contract: Node 24.');
    console.log('Quote enablement required: no.');
    console.log('Active n8n configuration required: no.');
    console.log('Provider or production operation performed: no.');
  }
}

module.exports = {
  validateStageARepositoryReadiness,
};
