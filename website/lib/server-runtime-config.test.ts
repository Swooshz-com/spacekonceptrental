import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getChatProviderRuntimeConfig,
  getN8nChatRuntimeConfig,
  getPublicSafeServerRuntimeConfigSummary,
  getQuoteEmailHandoffRuntimeConfig,
  getSupabaseServerRuntimeConfig,
  parseServerRuntimeConfig,
  serverRuntimeEnvNames
} from "./server-runtime-config";

const workspaceA = "11111111-1111-4111-8111-111111111111";
const workspaceB = "22222222-2222-4222-8222-222222222222";
const workspaceC = "33333333-3333-4333-8333-333333333333";

const expectedServerRuntimeEnvNames = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "CATALOGUE_WORKSPACE_ID",
  "QUOTE_WORKSPACE_ID",
  "QUOTE_SUBMISSION_ADMISSION_SECRET",
  "ADMIN_TRUSTED_WORKSPACE_ID",
  "ADMIN_EXPECTED_ORIGIN",
  "ADMIN_EXPECTED_HOST",
  "ADMIN_CSRF_PROOF_SECRET",
  "CHAT_PROVIDER",
  "N8N_CHAT_WEBHOOK_URL",
  "N8N_CHAT_WEBHOOK_TIMEOUT_MS",
  "N8N_ENQUIRY_HANDOFF_WEBHOOK_URL",
  "N8N_ENQUIRY_HANDOFF_SHARED_SECRET",
  "N8N_ENQUIRY_HANDOFF_TIMEOUT_MS",
  "CHAT_TRUSTED_CLIENT_IP_HEADER",
  "QUOTE_TRUSTED_CLIENT_IP_HEADER"
] as const;

const validEnv = {
  SUPABASE_URL: "https://project-ref.supabase.co",
  SUPABASE_ANON_KEY: "anon-token-for-tests",
  CATALOGUE_WORKSPACE_ID: workspaceA,
  QUOTE_SUBMISSION_ADMISSION_SECRET: "quote-admission-signing-material-for-tests",
  QUOTE_WORKSPACE_ID: workspaceB,
  ADMIN_TRUSTED_WORKSPACE_ID: workspaceC,
  ADMIN_EXPECTED_ORIGIN: "https://admin.space.test",
  ADMIN_EXPECTED_HOST: "Admin.Space.Test",
  ADMIN_CSRF_PROOF_SECRET: "csrf-proof-signing-material-for-tests",
  CHAT_PROVIDER: " n8n ",
  N8N_CHAT_WEBHOOK_URL: "https://example.invalid/n8n-webhook",
  N8N_CHAT_WEBHOOK_TIMEOUT_MS: "45000",
  N8N_ENQUIRY_HANDOFF_WEBHOOK_URL: "https://example.invalid/enquiry-handoff",
  N8N_ENQUIRY_HANDOFF_SHARED_SECRET: "n8n-shared-secret-for-tests",
  N8N_ENQUIRY_HANDOFF_TIMEOUT_MS: "45000",
  CHAT_TRUSTED_CLIENT_IP_HEADER: "CF-Connecting-IP",
  QUOTE_TRUSTED_CLIENT_IP_HEADER: "X-Real-IP"
};

const quoteEmailEnv = {
  N8N_ENQUIRY_HANDOFF_WEBHOOK_URL: "https://example.invalid/enquiry-handoff",
  N8N_ENQUIRY_HANDOFF_SHARED_SECRET: "n8n-shared-secret-for-tests",
  N8N_ENQUIRY_HANDOFF_TIMEOUT_MS: "45000"
};

describe("server runtime config contract", () => {
  it("enumerates only the reviewed server-only runtime variables", () => {
    expect(serverRuntimeEnvNames).toEqual(expectedServerRuntimeEnvNames);

    const source = readFileSync(
      resolve(process.cwd(), "lib/server-runtime-config.ts"),
      "utf8"
    );

    expect(source).toContain('import "server-only";');

    for (const envName of expectedServerRuntimeEnvNames) {
      expect(source).toContain(envName);
    }

    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("NEXT_PUBLIC_N8N");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(source).not.toContain("chat-config");
  });

  it("normalizes valid server config without exposing raw values in issues", () => {
    const result = parseServerRuntimeConfig(validEnv);

    expect(result.issues).toEqual([]);
    expect(result.values).toMatchObject({
      supabaseUrl: "https://project-ref.supabase.co",
      supabaseAnonKey: "anon-token-for-tests",
      catalogueWorkspaceId: workspaceA,
      quoteWorkspaceId: workspaceB,
      adminTrustedWorkspaceId: workspaceC,
      adminExpectedOrigin: "https://admin.space.test",
      quoteSubmissionAdmissionSecret: "quote-admission-signing-material-for-tests",
      adminExpectedHost: "admin.space.test",
      adminCsrfProofSecret: "csrf-proof-signing-material-for-tests",
      chatProvider: "n8n",
      n8nChatWebhookUrl: "https://example.invalid/n8n-webhook",
      n8nChatWebhookTimeoutMs: 30000,
      n8nEnquiryHandoffWebhookUrl: "https://example.invalid/enquiry-handoff",
      n8nEnquiryHandoffSharedSecret: "n8n-shared-secret-for-tests",
      n8nEnquiryHandoffTimeoutMs: 30000,
      chatTrustedClientIpHeader: "cf-connecting-ip",
      quoteTrustedClientIpHeader: "x-real-ip"
    });

    expect(getSupabaseServerRuntimeConfig(validEnv)).toEqual({
      configured: true,
      supabaseUrl: "https://project-ref.supabase.co",
      supabaseAnonKey: "anon-token-for-tests",
      missingEnv: []
    });
    expect(getChatProviderRuntimeConfig(validEnv)).toEqual({
      configured: true,
      provider: "n8n"
    });
    expect(getN8nChatRuntimeConfig(validEnv)).toEqual({
      configured: true,
      webhookUrl: "https://example.invalid/n8n-webhook",
      timeoutMs: 30000,
      missingEnv: []
    });
  });

  it("reports missing and invalid config safely without leaking values", () => {
    const summary = getPublicSafeServerRuntimeConfigSummary({
      ...validEnv,
      SUPABASE_URL: "not a url",
      CATALOGUE_WORKSPACE_ID: "wrong-workspace",
      ADMIN_EXPECTED_ORIGIN: "javascript:alert(1)",
      ADMIN_EXPECTED_HOST: "https://admin.space.test/path",
      CHAT_PROVIDER: "legacy-browser-n8n",
      N8N_CHAT_WEBHOOK_URL: "ftp://example.invalid/n8n-webhook",
      N8N_CHAT_WEBHOOK_TIMEOUT_MS: "not a number",
      N8N_ENQUIRY_HANDOFF_WEBHOOK_URL: "ftp://example.invalid/enquiry-handoff",
      N8N_ENQUIRY_HANDOFF_TIMEOUT_MS: "not a number",
      CHAT_TRUSTED_CLIENT_IP_HEADER: "x-forwarded-host",
      QUOTE_TRUSTED_CLIENT_IP_HEADER: "x-forwarded-proto"
    });
    const serialized = JSON.stringify(summary);

    expect(summary.ok).toBe(false);
    expect(summary.issues.map((issue) => issue.name)).toEqual(
      expect.arrayContaining([
        "SUPABASE_URL",
        "CATALOGUE_WORKSPACE_ID",
        "ADMIN_EXPECTED_ORIGIN",
        "ADMIN_EXPECTED_HOST",
        "CHAT_PROVIDER",
        "N8N_CHAT_WEBHOOK_URL",
        "N8N_CHAT_WEBHOOK_TIMEOUT_MS",
        "N8N_ENQUIRY_HANDOFF_WEBHOOK_URL",
        "N8N_ENQUIRY_HANDOFF_TIMEOUT_MS",
        "CHAT_TRUSTED_CLIENT_IP_HEADER",
        "QUOTE_TRUSTED_CLIENT_IP_HEADER"
      ])
    );
    expect(serialized).not.toContain("legacy-browser-n8n");
    expect(serialized).not.toContain("ftp://example.invalid");
    expect(serialized).not.toContain("javascript:alert");
    expect(serialized).not.toContain("anon-token-for-tests");
    expect(serialized).not.toContain("csrf-proof-signing-material-for-tests");
    expect(serialized).not.toContain("quote-admission-signing-material-for-tests");
  });

  it("keeps feature helpers fail-closed when required runtime config is missing", () => {
    expect(getSupabaseServerRuntimeConfig({})).toEqual({
      configured: false,
      missingEnv: ["SUPABASE_URL", "SUPABASE_ANON_KEY"]
    });
    expect(getN8nChatRuntimeConfig({})).toEqual({
      configured: false,
      webhookUrl: null,
      timeoutMs: 10000,
      missingEnv: ["N8N_CHAT_WEBHOOK_URL"]
    });
    expect(getChatProviderRuntimeConfig({ CHAT_PROVIDER: "unknown" })).toEqual({
      configured: false,
      reason: "unsupported_provider"
    });
  });

  it("validates configured n8n enquiry handoff runtime env without leaking secrets", () => {
    const result = getQuoteEmailHandoffRuntimeConfig(quoteEmailEnv);

    expect(result).toEqual({
      configured: true,
      provider: "n8n",
      webhookConfigured: true,
      sharedSecretConfigured: true,
      webhookUrl: "https://example.invalid/enquiry-handoff",
      sharedSecret: "n8n-shared-secret-for-tests",
      timeoutMs: 30000,
      issues: []
    });
    expect(JSON.stringify(result.issues)).not.toContain(
      "n8n-shared-secret-for-tests"
    );
  });

  it("reports missing n8n enquiry handoff webhook safely", () => {
    const result = getQuoteEmailHandoffRuntimeConfig({
      ...quoteEmailEnv,
      N8N_ENQUIRY_HANDOFF_WEBHOOK_URL: " "
    });

    expect(result.configured).toBe(false);
    expect(result.webhookConfigured).toBe(false);
    expect(result.issues).toEqual([
      {
        name: "N8N_ENQUIRY_HANDOFF_WEBHOOK_URL",
        kind: "missing",
        reason: "required"
      }
    ]);
  });

  it("reports missing n8n shared secret and invalid timeout safely", () => {
    const result = getQuoteEmailHandoffRuntimeConfig({
      ...quoteEmailEnv,
      N8N_ENQUIRY_HANDOFF_SHARED_SECRET: "",
      N8N_ENQUIRY_HANDOFF_TIMEOUT_MS: "not-a-number"
    });
    const serializedIssues = JSON.stringify(result.issues);

    expect(result.configured).toBe(false);
    expect(result.sharedSecretConfigured).toBe(false);
    expect(result.issues).toEqual([
      {
        name: "N8N_ENQUIRY_HANDOFF_SHARED_SECRET",
        kind: "missing",
        reason: "required"
      },
      {
        name: "N8N_ENQUIRY_HANDOFF_TIMEOUT_MS",
        kind: "invalid",
        reason: "invalid_timeout"
      }
    ]);
    expect(serializedIssues).not.toContain("n8n-shared-secret-for-tests");
  });

  it("reports invalid n8n enquiry handoff webhook without echoing it", () => {
    const result = getQuoteEmailHandoffRuntimeConfig({
      ...quoteEmailEnv,
      N8N_ENQUIRY_HANDOFF_WEBHOOK_URL: "ftp://example.invalid/secret-webhook"
    });

    expect(result.configured).toBe(false);
    expect(result.webhookConfigured).toBe(false);
    expect(result.issues).toContainEqual({
      name: "N8N_ENQUIRY_HANDOFF_WEBHOOK_URL",
      kind: "invalid",
      reason: "invalid_url"
    });
    expect(JSON.stringify(result.issues)).not.toContain("secret-webhook");
  });
});
