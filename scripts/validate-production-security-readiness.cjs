#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const {
  anonymousPublicSecurityDefinerAllowlist,
  authenticatedPublicSecurityDefinerAllowlist,
  finalPublicSecurityDefinerSignatures,
  platformManagedPublicSecurityDefinerSignatures,
} = require('./security-definer-privilege-contract.cjs');

const defaultMode = 'local';
const launchMode = 'launch';
const supportedModes = new Set([defaultMode, launchMode]);
const maxN8nTimeoutMs = 30000;
const textExtensions = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.mjs',
  '.md',
  '.mts',
  '.ts',
  '.tsx',
  '.txt',
  '.yml',
  '.yaml',
]);
const publicRuntimeExtensions = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.jsx',
  '.mjs',
  '.ts',
  '.tsx',
]);

const requiredEnvNames = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'CATALOGUE_WORKSPACE_ID',
  'QUOTE_WORKSPACE_ID',
  'QUOTE_SUBMISSION_ADMISSION_SECRET',
  'ADMIN_TRUSTED_WORKSPACE_ID',
  'ADMIN_EXPECTED_ORIGIN',
  'ADMIN_EXPECTED_HOST',
  'ADMIN_CSRF_PROOF_SECRET',
  'N8N_ENQUIRY_HANDOFF_WEBHOOK_URL',
  'N8N_ENQUIRY_HANDOFF_SHARED_SECRET',
];

const serverOnlyEnvNames = [
  ...requiredEnvNames,
  'N8N_ENQUIRY_HANDOFF_TIMEOUT_MS',
  'CHAT_PROVIDER',
  'CHAT_TRUSTED_CLIENT_IP_HEADER',
  'QUOTE_TRUSTED_CLIENT_IP_HEADER',
  'N8N_CHAT_WEBHOOK_URL',
  'N8N_CHAT_WEBHOOK_TIMEOUT_MS',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const removedPublicRuntimeEnvNames = [
  'NEXT_PUBLIC_SKR_DEMO_CONTENT',
];

const obviousSecretPatterns = [
  {
    label: 'GitHub token pattern',
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{30,}\b/g,
  },
  {
    label: 'GitHub fine-grained token pattern',
    pattern: /\bgithub_pat_[A-Za-z0-9_]{40,}\b/g,
  },
  {
    label: 'AWS access key pattern',
    pattern: /\bAKIA[0-9A-Z]{16}\b/g,
  },
  {
    label: 'Stripe secret key pattern',
    pattern: /\bsk_(?:live|test)_[A-Za-z0-9]{20,}\b/g,
  },
  {
    label: 'Email provider API key pattern',
    pattern: /\bre_[A-Za-z0-9]{24,}\b/g,
  },
  {
    label: 'SendGrid API key pattern',
    pattern: /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/g,
  },
];

function parseArgs(argv) {
  const args = {
    scanRoot: process.cwd(),
    trackedFiles: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--mode') {
      args.mode = argv[index + 1];
      index += 1;
    } else if (arg === '--launch') {
      args.mode = launchMode;
    } else if (arg === '--scan-root') {
      args.scanRoot = argv[index + 1];
      index += 1;
    } else if (arg === '--tracked-file-list') {
      args.trackedFiles = [];

      for (let fileIndex = index + 1; fileIndex < argv.length; fileIndex += 1) {
        if (argv[fileIndex].startsWith('--')) {
          break;
        }

        args.trackedFiles.push(argv[fileIndex]);
        index = fileIndex;
      }
    } else if (arg === '--public-security-definer-catalog') {
      args.publicSecurityDefinerCatalogPath = argv[index + 1];
      index += 1;
    }
  }

  return args;
}

function normalizeMode(env, cliMode) {
  const rawMode = (cliMode || env.SKR_PRODUCTION_READINESS_MODE || defaultMode)
    .trim()
    .toLowerCase();

  return supportedModes.has(rawMode) ? rawMode : defaultMode;
}

function readEnv(env, name) {
  const value = env[name]?.trim();

  return value || null;
}

function addIssue(issues, name, summary) {
  issues.push({
    name,
    summary,
  });
}

function validateHttpsUrl(value) {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);

    return parsed.protocol === 'https:' && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function validateAdminExpectedHost(value) {
  if (!value) {
    return false;
  }

  if (/^http:\/\//i.test(value)) {
    return false;
  }

  if (/^https:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);

      return parsed.protocol === 'https:' && Boolean(parsed.hostname);
    } catch {
      return false;
    }
  }

  return /^[A-Za-z0-9.-]+(?::\d+)?$/.test(value);
}

function validateCsrfSecret(value) {
  if (!value) {
    return {
      ok: false,
      summary: 'missing',
    };
  }

  if (value.length < 32) {
    return {
      ok: false,
      summary: 'too short; minimum length is 32 characters',
    };
  }

  const uniqueCharacters = new Set(value).size;
  const lower = value.toLowerCase();

  if (
    uniqueCharacters < 8 ||
    /^(.)\1+$/.test(value) ||
    lower.includes('changeme') ||
    lower === 'password' ||
    lower === 'secret'
  ) {
    return {
      ok: false,
      summary: 'insufficient entropy-like shape',
    };
  }

  return {
    ok: true,
    summary: 'configured',
  };
}

function validateOptionalTimeout(value) {
  if (!value) {
    return {
      ok: true,
      summary: 'configured',
    };
  }

  const timeout = Number(value);

  if (!Number.isFinite(timeout) || timeout <= 0 || timeout > maxN8nTimeoutMs) {
    return {
      ok: false,
      summary: `must be a positive number no greater than ${maxN8nTimeoutMs}`,
    };
  }

  return {
    ok: true,
    summary: 'configured',
  };
}

function validatePublicSecurityDefinerCatalog(catalog) {
  const issues = [];
  const warnings = [];
  const rowsBySignature = new Map();
  const anonAllowlist = new Set(anonymousPublicSecurityDefinerAllowlist);
  const authenticatedAllowlist = new Set(
    authenticatedPublicSecurityDefinerAllowlist,
  );
  const repositoryOwned = new Set(finalPublicSecurityDefinerSignatures);
  const platformManaged = new Set(
    platformManagedPublicSecurityDefinerSignatures,
  );
  const reviewed = new Set([...repositoryOwned, ...platformManaged]);
  const executionFields = [
    'public_execute',
    'anon_execute',
    'authenticated_execute',
    'service_role_execute',
    'postgres_execute',
  ];

  if (!Array.isArray(catalog)) {
    addIssue(
      issues,
      'PUBLIC_SECURITY_DEFINER_CATALOG',
      'must be a JSON array produced by the read-only catalog query',
    );
    return { issues, warnings };
  }

  for (const row of catalog) {
    const signature = row?.signature;

    if (typeof signature !== 'string' || !signature.startsWith('public.')) {
      addIssue(
        issues,
        'PUBLIC_SECURITY_DEFINER_CATALOG',
        'contains an invalid public function signature',
      );
      continue;
    }
    if (rowsBySignature.has(signature)) {
      addIssue(issues, signature, 'appears more than once in the live catalog');
      continue;
    }
    rowsBySignature.set(signature, row);

    if (row.security_definer !== true) {
      addIssue(issues, signature, 'catalog row must identify a SECURITY DEFINER function');
    }
    for (const field of executionFields) {
      if (typeof row[field] !== 'boolean') {
        addIssue(issues, signature, `catalog field ${field} must be boolean`);
      }
    }

    if (row.public_execute === true) {
      addIssue(issues, signature, 'PUBLIC EXECUTE is forbidden');
    }
    if (row.service_role_execute === true) {
      addIssue(issues, signature, 'service_role EXECUTE is not reviewed');
    }
    if (row.anon_execute === true && !anonAllowlist.has(signature)) {
      addIssue(issues, signature, 'anon EXECUTE is not reviewed');
    }
    if (
      row.authenticated_execute === true &&
      !authenticatedAllowlist.has(signature)
    ) {
      addIssue(issues, signature, 'authenticated EXECUTE is not reviewed');
    }

    const apiClientDenyOnly = [
      'public_execute',
      'anon_execute',
      'authenticated_execute',
      'service_role_execute',
    ].every((field) => row[field] === false);
    if (!reviewed.has(signature) && apiClientDenyOnly) {
      warnings.push({
        name: signature,
        summary: 'unreviewed live function is deny-only for API/client roles',
      });
    }
  }

  for (const signature of reviewed) {
    if (!rowsBySignature.has(signature)) {
      addIssue(issues, signature, 'reviewed function is missing from the live catalog');
    }
  }

  for (const signature of repositoryOwned) {
    const row = rowsBySignature.get(signature);
    if (!row) {
      continue;
    }
    if (row.anon_execute !== anonAllowlist.has(signature)) {
      addIssue(issues, signature, 'anon EXECUTE differs from the application contract');
    }
    if (
      row.authenticated_execute !== authenticatedAllowlist.has(signature)
    ) {
      addIssue(
        issues,
        signature,
        'authenticated EXECUTE differs from the application contract',
      );
    }
  }

  const [platformSignature] = platformManagedPublicSecurityDefinerSignatures;
  const platformHelper = rowsBySignature.get(platformSignature);
  if (platformHelper) {
    const expectedTags = ['CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO'];
    const actualTags = Array.isArray(platformHelper.tags)
      ? [...platformHelper.tags].sort()
      : [];

    for (const [field, expected] of Object.entries({
      owner: 'postgres',
      return_type: 'event_trigger',
      language: 'plpgsql',
      search_path: 'search_path=pg_catalog',
      event_trigger_name: 'ensure_rls',
      event: 'ddl_command_end',
      enabled: 'O',
    })) {
      if (platformHelper[field] !== expected) {
        addIssue(issues, platformSignature, `${field} differs from the platform contract`);
      }
    }
    if (JSON.stringify(actualTags) !== JSON.stringify(expectedTags.sort())) {
      addIssue(issues, platformSignature, 'event-trigger tags differ from the platform contract');
    }
    if (platformHelper.postgres_execute !== true) {
      addIssue(issues, platformSignature, 'postgres owner execution rights are missing');
    }
  }

  return { issues, warnings };
}

function validateEnvContract(env) {
  const issues = [];

  for (const name of requiredEnvNames) {
    if (!readEnv(env, name)) {
      addIssue(issues, name, 'missing');
    }
  }

  const supabaseUrl = readEnv(env, 'SUPABASE_URL');

  if (supabaseUrl && !validateHttpsUrl(supabaseUrl)) {
    addIssue(issues, 'SUPABASE_URL', 'must be an HTTPS URL');
  }

  const adminExpectedOrigin = readEnv(env, 'ADMIN_EXPECTED_ORIGIN');

  if (adminExpectedOrigin && !validateHttpsUrl(adminExpectedOrigin)) {
    addIssue(issues, 'ADMIN_EXPECTED_ORIGIN', 'must be an HTTPS origin');
  }

  const adminExpectedHost = readEnv(env, 'ADMIN_EXPECTED_HOST');

  if (adminExpectedHost && !validateAdminExpectedHost(adminExpectedHost)) {
    addIssue(
      issues,
      'ADMIN_EXPECTED_HOST',
      'must be a host or HTTPS URL',
    );
  }

  const csrfSecretValue = readEnv(env, 'ADMIN_CSRF_PROOF_SECRET');
  const csrfSecret = validateCsrfSecret(csrfSecretValue);

  if (csrfSecretValue && !csrfSecret.ok) {
    addIssue(issues, 'ADMIN_CSRF_PROOF_SECRET', csrfSecret.summary);
  }
  const quoteAdmissionSecretValue = readEnv(
    env,
    'QUOTE_SUBMISSION_ADMISSION_SECRET',
  );
  const quoteAdmissionSecret = validateCsrfSecret(quoteAdmissionSecretValue);

  if (quoteAdmissionSecretValue && !quoteAdmissionSecret.ok) {
    addIssue(issues, 'QUOTE_SUBMISSION_ADMISSION_SECRET', quoteAdmissionSecret.summary);
  }


  const n8nEnquiryWebhookUrl = readEnv(env, 'N8N_ENQUIRY_HANDOFF_WEBHOOK_URL');

  if (n8nEnquiryWebhookUrl && !validateHttpsUrl(n8nEnquiryWebhookUrl)) {
    addIssue(
      issues,
      'N8N_ENQUIRY_HANDOFF_WEBHOOK_URL',
      'must be an HTTPS URL',
    );
  }

  const n8nSharedSecretValue = readEnv(env, 'N8N_ENQUIRY_HANDOFF_SHARED_SECRET');
  const n8nSharedSecret = validateCsrfSecret(n8nSharedSecretValue);

  if (n8nSharedSecretValue && !n8nSharedSecret.ok) {
    addIssue(
      issues,
      'N8N_ENQUIRY_HANDOFF_SHARED_SECRET',
      n8nSharedSecret.summary,
    );
  }

  const n8nTimeout = validateOptionalTimeout(
    readEnv(env, 'N8N_ENQUIRY_HANDOFF_TIMEOUT_MS'),
  );

  if (!n8nTimeout.ok) {
    addIssue(issues, 'N8N_ENQUIRY_HANDOFF_TIMEOUT_MS', n8nTimeout.summary);
  }

  for (const name of removedPublicRuntimeEnvNames) {
    if (readEnv(env, name)) {
      addIssue(issues, name, 'removed public demo content env is forbidden');
    }
  }

  return issues;
}

function toPosixPath(filePath) {
  return filePath.replace(/\\/g, '/');
}

function isTextFile(filePath) {
  return textExtensions.has(path.extname(filePath).toLowerCase());
}

function relativeDisplayPath(scanRoot, filePath) {
  const absolute = path.isAbsolute(filePath)
    ? filePath
    : path.join(scanRoot, filePath);
  const relative = path.relative(scanRoot, absolute);

  return toPosixPath(relative || filePath);
}

function listTrackedFiles(scanRoot, overrideFiles) {
  if (overrideFiles) {
    return overrideFiles.map((filePath) =>
      path.isAbsolute(filePath) ? filePath : path.join(scanRoot, filePath),
    );
  }

  const result = spawnSync('git', ['ls-files', '-z'], {
    cwd: scanRoot,
    encoding: 'buffer',
    windowsHide: true,
  });

  if (result.error || result.status !== 0) {
    throw new Error(
      `git ls-files failed: ${result.error?.message || result.stderr.toString('utf8').trim()}`,
    );
  }

  return result.stdout
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
    .map((filePath) => path.join(scanRoot, filePath));
}

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function isAllowedEnvReferenceFile(displayPath) {
  return (
    displayPath.startsWith('docs/') ||
    displayPath.includes('/test/') ||
    /\.test\.[cm]?[jt]sx?$/.test(displayPath) ||
    /\.spec\.[cm]?[jt]sx?$/.test(displayPath) ||
    displayPath.endsWith('server-env-contract.json')
  );
}

function isClientOrPublicRuntimeFile(displayPath, source) {
  const extension = path.posix.extname(displayPath).toLowerCase();

  if (
    (displayPath.startsWith('website/public/') ||
      displayPath.startsWith('website/assets/web_design/')) &&
    publicRuntimeExtensions.has(extension)
  ) {
    return true;
  }

  if (!displayPath.startsWith('website/')) {
    return false;
  }

  return /^\s*['"]use client['"];?/m.test(source);
}

function isProductionWebsiteSource(displayPath) {
  return (
    displayPath.startsWith('website/app/') ||
    displayPath.startsWith('website/components/') ||
    displayPath.startsWith('website/lib/')
  );
}

function isEnvFile(displayPath) {
  const basename = path.posix.basename(displayPath);

  if (basename === '.env.example') {
    return false;
  }

  return basename === '.env' || basename.startsWith('.env.');
}

function scanStaticSecurity(scanRoot, trackedFiles) {
  const issues = [];
  const files = listTrackedFiles(scanRoot, trackedFiles);
  const deliveryLogDoc = 'docs/architecture/QUOTE-ENQUIRY-EMAIL-HANDOFF-DELIVERY-LOG-FOUNDATION.md';
  const currentStateAudit = 'docs/SKR-OWNER-MVP-CURRENT-STATE-AUDIT.md';
  let deliveryLogDocText = '';
  let currentStateAuditText = '';

  for (const absolutePath of files) {
    const displayPath = relativeDisplayPath(scanRoot, absolutePath);

    if (isEnvFile(displayPath)) {
      addIssue(issues, displayPath, 'tracked env file is not allowed');
      continue;
    }

    if (displayPath === 'website/chat-config.js') {
      addIssue(
        issues,
        displayPath,
        'tracked local chat config is not allowed',
      );
      continue;
    }

    if (!isTextFile(displayPath)) {
      continue;
    }

    const source = readFileSafe(absolutePath);

    if (displayPath === deliveryLogDoc) {
      deliveryLogDocText = source;
    }

    if (displayPath === currentStateAudit) {
      currentStateAuditText = source;
    }

    if (
      isProductionWebsiteSource(displayPath) &&
      !isAllowedEnvReferenceFile(displayPath) &&
      /chat-config(?:\.js)?/i.test(source)
    ) {
      addIssue(
        issues,
        displayPath,
        'runtime source must not import or read website/chat-config.js',
      );
    }

    if (isProductionWebsiteSource(displayPath) && !isAllowedEnvReferenceFile(displayPath)) {
      for (const envName of removedPublicRuntimeEnvNames) {
        if (source.includes(envName)) {
          addIssue(
            issues,
            displayPath,
            `removed public runtime env ${envName} appears in production source`,
          );
        }
      }
    }

    if (isClientOrPublicRuntimeFile(displayPath, source)) {
      for (const envName of serverOnlyEnvNames) {
        if (source.includes(envName)) {
          addIssue(
            issues,
            displayPath,
            `server-only env name ${envName} appears in client/public runtime file`,
          );
        }
      }
    }

    if (!isAllowedEnvReferenceFile(displayPath)) {
      for (const secretPattern of obviousSecretPatterns) {
        if (secretPattern.pattern.test(source)) {
          addIssue(issues, displayPath, secretPattern.label);
        }

        secretPattern.pattern.lastIndex = 0;
      }
    }
  }

  if (
    deliveryLogDocText &&
    !/technical metadata only/i.test(deliveryLogDocText)
  ) {
    addIssue(
      issues,
      deliveryLogDoc,
      'Delivery Log documentation must describe technical metadata only',
    );
  }

  if (
    currentStateAuditText &&
    !/technical visibility surfaces/i.test(currentStateAuditText)
  ) {
    addIssue(
      issues,
      currentStateAudit,
      'current-state audit must keep Delivery Log as technical visibility only',
    );
  }

  return issues;
}

function validateProductionSecurityReadiness(options = {}) {
  const env = options.env ?? process.env;
  const mode = normalizeMode(env, options.mode);
  const envIssues = validateEnvContract(env);
  const staticIssues = scanStaticSecurity(
    options.scanRoot ?? process.cwd(),
    options.trackedFiles ?? null,
  );
  const databaseIssues = [...(options.publicSecurityDefinerCatalogIssues ?? [])];
  const databaseWarnings = [];

  if (options.publicSecurityDefinerCatalog === undefined) {
    const missing = {
      name: 'PUBLIC_SECURITY_DEFINER_CATALOG',
      summary: 'live read-only public SECURITY DEFINER catalog was not supplied',
    };
    if (mode === launchMode) {
      databaseIssues.push(missing);
    } else {
      databaseWarnings.push(missing);
    }
  } else {
    const catalogResult = validatePublicSecurityDefinerCatalog(
      options.publicSecurityDefinerCatalog,
    );
    databaseIssues.push(...catalogResult.issues);
    databaseWarnings.push(...catalogResult.warnings);
  }

  const ok =
    staticIssues.length === 0 &&
    databaseIssues.length === 0 &&
    (mode !== launchMode || envIssues.length === 0);

  return {
    databaseIssues,
    databaseWarnings,
    envIssues,
    mode,
    ok,
    staticIssues,
  };
}

function printIssues(print, issues) {
  for (const issue of issues) {
    print(`- ${issue.name}: ${issue.summary}`);
  }
}

function printResult(result, output = console) {
  const inLaunchMode = result.mode === launchMode;

  output.log(
    `Production security readiness: ${inLaunchMode ? 'launch mode' : 'local/dev mode'}.`,
  );
  output.log(
    inLaunchMode
      ? 'Launch-required env checks are enforced.'
      : 'Launch-required env checks are warnings only.',
  );

  if (result.envIssues.length === 0) {
    output.log('Launch env contract: configured.');
  } else if (inLaunchMode) {
    output.error('Launch env contract: failed.');
    printIssues(output.error, result.envIssues);
  } else {
    output.log('Launch env contract: warning.');
    printIssues(output.log, result.envIssues);
  }

  if (result.staticIssues.length === 0) {
    output.log('Static security checks: passed.');
  } else {
    output.error('Static security checks: failed.');
    printIssues(output.error, result.staticIssues);
  }

  if (
    result.databaseIssues.length === 0 &&
    result.databaseWarnings.length === 0
  ) {
    output.log('Live public SECURITY DEFINER catalog: passed.');
  } else if (result.databaseIssues.length > 0) {
    output.error('Live public SECURITY DEFINER catalog: failed.');
    printIssues(output.error, result.databaseIssues);
  }
  if (result.databaseWarnings.length > 0) {
    output.log('Live public SECURITY DEFINER catalog: warning.');
    printIssues(output.log, result.databaseWarnings);
  }
  output.log(
    `Intentional application RPC execution remains: ${anonymousPublicSecurityDefinerAllowlist.length} anon and ${authenticatedPublicSecurityDefinerAllowlist.length} authenticated.`,
  );

  output.log('No website/chat-config.js runtime dependency is required for launch.');
  output.log('n8n enquiry handoff env is server-only; no browser n8n env is allowed.');
  output.log('No Pinecone/HubSpot runtime env is required for this launch slice.');

  if (result.ok) {
    output.log('Production security readiness gate passed.');
  } else {
    output.error('Production security readiness gate failed.');
  }
}

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  let publicSecurityDefinerCatalog;
  const publicSecurityDefinerCatalogIssues = [];

  if (args.publicSecurityDefinerCatalogPath) {
    try {
      const catalogJson = fs.readFileSync(
        path.resolve(args.scanRoot, args.publicSecurityDefinerCatalogPath),
        'utf8',
      );
      publicSecurityDefinerCatalog = JSON.parse(
        catalogJson.replace(/^\uFEFF/, ''),
      );
    } catch {
      addIssue(
        publicSecurityDefinerCatalogIssues,
        'PUBLIC_SECURITY_DEFINER_CATALOG',
        'could not read valid JSON from the supplied catalog file',
      );
      publicSecurityDefinerCatalog = [];
    }
  }
  const result = validateProductionSecurityReadiness({
    mode: args.mode,
    publicSecurityDefinerCatalog,
    publicSecurityDefinerCatalogIssues,
    scanRoot: args.scanRoot,
    trackedFiles: args.trackedFiles,
  });

  printResult(result);
  process.exit(result.ok ? 0 : 1);
}

module.exports = {
  scanStaticSecurity,
  validateEnvContract,
  validatePublicSecurityDefinerCatalog,
  validateProductionSecurityReadiness,
};
