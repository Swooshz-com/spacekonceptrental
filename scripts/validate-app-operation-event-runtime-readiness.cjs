#!/usr/bin/env node

const MIN_SECRET_UTF8_BYTES = 32;

const requiredEnabledEnvNames = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'QUOTE_WORKSPACE_ID',
  'ADMIN_TRUSTED_WORKSPACE_ID',
];

const disabledWarningCode =
  'APP_OPERATION_EVENT_ADMISSION_SECRET_PRESENT_WHILE_DISABLED';

function readRawEnv(env, name) {
  const value = env[name];

  return typeof value === 'string' ? value : null;
}

function readTrimmedEnv(env, name) {
  const value = readRawEnv(env, name);

  return value && value.trim() ? value.trim() : null;
}

function validateAppOperationEventRuntimeReadiness(env = process.env) {
  const enabled = readRawEnv(env, 'APP_OPERATION_EVENTS_ENABLED') === 'true';
  const secret = readRawEnv(env, 'APP_OPERATION_EVENT_ADMISSION_SECRET');
  const secretPresent =
    typeof secret === 'string' && secret.length > 0;
  const secretUtf8Bytes = secretPresent
    ? Buffer.byteLength(secret, 'utf8')
    : 0;
  const issues = [];
  const warnings = [];

  if (!enabled) {
    if (secretPresent) {
      warnings.push(disabledWarningCode);
    }

    return { ready: true, issues, warnings };
  }

  if (!secretPresent) {
    issues.push({
      name: 'APP_OPERATION_EVENT_ADMISSION_SECRET',
      summary: 'missing server admission secret',
    });
  } else if (secretUtf8Bytes < MIN_SECRET_UTF8_BYTES) {
    issues.push({
      name: 'APP_OPERATION_EVENT_ADMISSION_SECRET',
      summary: `admission secret must be at least ${MIN_SECRET_UTF8_BYTES} UTF-8 bytes`,
    });
  }

  for (const name of requiredEnabledEnvNames) {
    if (!readTrimmedEnv(env, name)) {
      issues.push({
        name,
        summary: 'missing required server configuration for enabled emission',
      });
    }
  }

  return { ready: issues.length === 0, issues, warnings };
}

const result = validateAppOperationEventRuntimeReadiness();

for (const warning of result.warnings) {
  console.warn(`App operation event runtime readiness warning: ${warning}`);
}

if (result.ready) {
  console.log('App operation event runtime readiness: pass.');
  process.exit(0);
}

console.error('App operation event runtime readiness: fail.');
for (const issue of result.issues) {
  console.error(`- ${issue.name}: ${issue.summary}`);
}

process.exit(1);
