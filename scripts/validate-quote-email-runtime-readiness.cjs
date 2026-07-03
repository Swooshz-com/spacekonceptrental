#!/usr/bin/env node

const defaultProvider = 'resend';
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readEnv(name) {
  const value = process.env[name]?.trim();

  return value || null;
}

function normalizeProvider(value) {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return defaultProvider;
  }

  return normalized === defaultProvider ? defaultProvider : null;
}

function normalizeEmail(value) {
  const normalized = value?.trim().toLowerCase();

  return normalized && emailPattern.test(normalized) ? normalized : null;
}

function addIssue(issues, name, summary) {
  issues.push({ name, summary });
}

function validateQuoteEmailRuntimeReadiness() {
  const issues = [];
  const providerValue = readEnv('QUOTE_ENQUIRY_EMAIL_PROVIDER');
  const provider = normalizeProvider(providerValue);
  const recipientValue = readEnv('QUOTE_ENQUIRY_EMAIL_RECIPIENT');
  const fromValue = readEnv('QUOTE_ENQUIRY_EMAIL_FROM');
  const resendApiKey = readEnv('RESEND_API_KEY');

  if (!provider) {
    addIssue(
      issues,
      'QUOTE_ENQUIRY_EMAIL_PROVIDER',
      'unsupported provider',
    );
  }

  if (!recipientValue) {
    addIssue(
      issues,
      'QUOTE_ENQUIRY_EMAIL_RECIPIENT',
      'missing recipient',
    );
  } else if (!normalizeEmail(recipientValue)) {
    addIssue(
      issues,
      'QUOTE_ENQUIRY_EMAIL_RECIPIENT',
      'invalid recipient email',
    );
  }

  if (!fromValue) {
    addIssue(
      issues,
      'QUOTE_ENQUIRY_EMAIL_FROM',
      'missing from address',
    );
  } else if (!normalizeEmail(fromValue)) {
    addIssue(
      issues,
      'QUOTE_ENQUIRY_EMAIL_FROM',
      'invalid from address',
    );
  }

  if (!resendApiKey) {
    addIssue(issues, 'RESEND_API_KEY', 'missing provider api key');
  }

  return {
    configured: issues.length === 0,
    provider: defaultProvider,
    issues,
  };
}

const result = validateQuoteEmailRuntimeReadiness();

if (result.configured) {
  console.log('Quote email handoff runtime readiness: configured.');
  console.log(`Provider: ${result.provider}`);
  console.log('Recipient: configured');
  console.log('From address: configured');
  console.log('Provider API key: configured');
  process.exit(0);
}

console.error('Quote email handoff runtime readiness: not configured.');
console.error(`Provider: ${result.provider}`);

for (const issue of result.issues) {
  console.error(`- ${issue.name}: ${issue.summary}`);
}

process.exit(1);
