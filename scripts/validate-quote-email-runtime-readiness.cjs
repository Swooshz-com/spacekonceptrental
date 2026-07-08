#!/usr/bin/env node

const defaultTimeoutMs = 10000;
const maxTimeoutMs = 30000;

function readEnv(name) {
  const value = process.env[name]?.trim();

  return value || null;
}

function addIssue(issues, name, summary) {
  issues.push({ name, summary });
}

function validateHttpUrl(value) {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);

    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function validateTimeout(value) {
  if (!value) {
    return true;
  }

  const timeout = Number(value);

  return Number.isFinite(timeout) && timeout > 0 && timeout <= maxTimeoutMs;
}

function validateQuoteEmailRuntimeReadiness() {
  const issues = [];
  const webhookUrl = readEnv('N8N_ENQUIRY_HANDOFF_WEBHOOK_URL');
  const sharedSecret = readEnv('N8N_ENQUIRY_HANDOFF_SHARED_SECRET');
  const timeoutMs = readEnv('N8N_ENQUIRY_HANDOFF_TIMEOUT_MS');

  if (!webhookUrl) {
    addIssue(
      issues,
      'N8N_ENQUIRY_HANDOFF_WEBHOOK_URL',
      'missing server-side n8n webhook URL',
    );
  } else if (!validateHttpUrl(webhookUrl)) {
    addIssue(
      issues,
      'N8N_ENQUIRY_HANDOFF_WEBHOOK_URL',
      'invalid server-side n8n webhook URL',
    );
  }

  if (!sharedSecret) {
    addIssue(
      issues,
      'N8N_ENQUIRY_HANDOFF_SHARED_SECRET',
      'missing server-side shared secret',
    );
  }

  if (!validateTimeout(timeoutMs)) {
    addIssue(
      issues,
      'N8N_ENQUIRY_HANDOFF_TIMEOUT_MS',
      `timeout must be a positive number no greater than ${maxTimeoutMs}`,
    );
  }

  return {
    configured: issues.length === 0,
    provider: 'n8n',
    timeoutMs: Number(timeoutMs || defaultTimeoutMs),
    issues,
  };
}

const result = validateQuoteEmailRuntimeReadiness();

if (result.configured) {
  console.log('Quote enquiry n8n handoff runtime readiness: configured.');
  console.log(`Provider: ${result.provider}`);
  console.log('Webhook endpoint: configured');
  console.log('Shared secret: configured');
  console.log('Timeout: configured');
  process.exit(0);
}

console.error('Quote enquiry n8n handoff runtime readiness: not configured.');
console.error(`Provider: ${result.provider}`);

for (const issue of result.issues) {
  console.error(`- ${issue.name}: ${issue.summary}`);
}

process.exit(1);
