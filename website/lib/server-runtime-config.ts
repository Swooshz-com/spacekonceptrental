import "server-only";

export const serverRuntimeEnvNames = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "CATALOGUE_WORKSPACE_ID",
  "QUOTE_WORKSPACE_ID",
  "ADMIN_TRUSTED_WORKSPACE_ID",
  "ADMIN_EXPECTED_ORIGIN",
  "ADMIN_EXPECTED_HOST",
  "ADMIN_CSRF_PROOF_SECRET",
  "CHAT_PROVIDER",
  "N8N_CHAT_WEBHOOK_URL",
  "N8N_CHAT_WEBHOOK_TIMEOUT_MS",
  "CHAT_TRUSTED_CLIENT_IP_HEADER",
  "QUOTE_TRUSTED_CLIENT_IP_HEADER"
] as const;

export type ServerRuntimeEnvName = (typeof serverRuntimeEnvNames)[number];

type ServerRuntimeEnv = {
  [key: string]: string | null | undefined;
};

export type ServerRuntimeConfigIssue = {
  name: ServerRuntimeEnvName;
  kind: "missing" | "invalid";
  reason:
    | "required"
    | "invalid_url"
    | "invalid_uuid"
    | "invalid_origin"
    | "invalid_host"
    | "unsupported_provider"
    | "invalid_timeout"
    | "unsupported_header";
};

export type ServerRuntimeConfigValues = Partial<{
  supabaseUrl: string;
  supabaseAnonKey: string;
  catalogueWorkspaceId: string;
  quoteWorkspaceId: string;
  adminTrustedWorkspaceId: string;
  adminExpectedOrigin: string;
  adminExpectedHost: string;
  adminCsrfProofSecret: string;
  chatProvider: "n8n";
  n8nChatWebhookUrl: string;
  n8nChatWebhookTimeoutMs: number;
  chatTrustedClientIpHeader: TrustedClientIpHeader;
  quoteTrustedClientIpHeader: TrustedClientIpHeader;
}>;

export type ServerRuntimeConfig = {
  values: ServerRuntimeConfigValues;
  issues: ServerRuntimeConfigIssue[];
};

const defaultChatProvider = "n8n";
const defaultN8nTimeoutMs = 10_000;
const maxN8nTimeoutMs = 30_000;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const hostPattern = /^[a-z0-9.-]+(?::[0-9]{1,5})?$/i;
const trustedClientIpHeaders = new Set([
  "cf-connecting-ip",
  "fly-client-ip",
  "x-real-ip",
  "x-vercel-forwarded-for",
  "x-forwarded-for"
]);

export type TrustedClientIpHeader =
  | "cf-connecting-ip"
  | "fly-client-ip"
  | "x-real-ip"
  | "x-vercel-forwarded-for"
  | "x-forwarded-for";

function readOptionalServerRuntimeEnv(
  env: ServerRuntimeEnv,
  name: ServerRuntimeEnvName
) {
  const value = env[name]?.trim();

  return value ? value : null;
}

function addMissing(
  issues: ServerRuntimeConfigIssue[],
  name: ServerRuntimeEnvName
) {
  issues.push({
    name,
    kind: "missing",
    reason: "required"
  });
}

function addInvalid(
  issues: ServerRuntimeConfigIssue[],
  name: ServerRuntimeEnvName,
  reason: Exclude<ServerRuntimeConfigIssue["reason"], "required">
) {
  issues.push({
    name,
    kind: "invalid",
    reason
  });
}

function normalizeHttpUrlOrigin(value: string) {
  try {
    const parsed = new URL(value);

    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.origin.toLowerCase()
      : null;
  } catch {
    return null;
  }
}

function normalizeHttpUrl(value: string) {
  try {
    const parsed = new URL(value);

    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

function normalizeUuid(value: string) {
  return uuidPattern.test(value.trim()) ? value.trim() : null;
}

function normalizeHost(value: string) {
  const normalized = value.trim().toLowerCase();

  if (
    !normalized ||
    normalized.includes("/") ||
    normalized.includes("\\") ||
    normalized.includes("@") ||
    normalized.includes(" ")
  ) {
    return null;
  }

  if (!hostPattern.test(normalized)) {
    return null;
  }

  const portSeparator = normalized.lastIndexOf(":");

  if (portSeparator !== -1) {
    const port = Number(normalized.slice(portSeparator + 1));

    if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
      return null;
    }
  }

  return normalized;
}

function normalizeProvider(value: string) {
  const normalized = value.trim().toLowerCase();

  return normalized === defaultChatProvider ? defaultChatProvider : null;
}

function normalizeTimeoutMs(value: string | null) {
  const timeout = Number(value ?? defaultN8nTimeoutMs);

  if (!Number.isFinite(timeout) || timeout <= 0) {
    return null;
  }

  return Math.min(Math.floor(timeout), maxN8nTimeoutMs);
}

function normalizeTrustedClientIpHeader(
  value: string
): TrustedClientIpHeader | null {
  const normalized = value.trim().toLowerCase();

  return trustedClientIpHeaders.has(normalized)
    ? (normalized as TrustedClientIpHeader)
    : null;
}

function parseRequiredText(
  env: ServerRuntimeEnv,
  name: ServerRuntimeEnvName,
  issues: ServerRuntimeConfigIssue[]
) {
  const value = readOptionalServerRuntimeEnv(env, name);

  if (!value) {
    addMissing(issues, name);
    return null;
  }

  return value;
}

function parseRequiredUuid(
  env: ServerRuntimeEnv,
  name: ServerRuntimeEnvName,
  issues: ServerRuntimeConfigIssue[]
) {
  const value = parseRequiredText(env, name, issues);

  if (!value) {
    return null;
  }

  const uuid = normalizeUuid(value);

  if (!uuid) {
    addInvalid(issues, name, "invalid_uuid");
  }

  return uuid;
}

export function parseServerRuntimeConfig(
  env: ServerRuntimeEnv = process.env
): ServerRuntimeConfig {
  const values: ServerRuntimeConfigValues = {
    chatProvider: defaultChatProvider,
    n8nChatWebhookTimeoutMs: defaultN8nTimeoutMs
  };
  const issues: ServerRuntimeConfigIssue[] = [];
  const supabaseUrl = parseRequiredText(env, "SUPABASE_URL", issues);
  const supabaseAnonKey = parseRequiredText(env, "SUPABASE_ANON_KEY", issues);
  const catalogueWorkspaceId = parseRequiredUuid(
    env,
    "CATALOGUE_WORKSPACE_ID",
    issues
  );
  const quoteWorkspaceId = parseRequiredUuid(
    env,
    "QUOTE_WORKSPACE_ID",
    issues
  );
  const adminTrustedWorkspaceId = parseRequiredUuid(
    env,
    "ADMIN_TRUSTED_WORKSPACE_ID",
    issues
  );
  const adminExpectedOrigin = parseRequiredText(
    env,
    "ADMIN_EXPECTED_ORIGIN",
    issues
  );
  const adminExpectedHost = parseRequiredText(
    env,
    "ADMIN_EXPECTED_HOST",
    issues
  );
  const adminCsrfProofSecret = parseRequiredText(
    env,
    "ADMIN_CSRF_PROOF_SECRET",
    issues
  );
  const n8nChatWebhookUrl = parseRequiredText(
    env,
    "N8N_CHAT_WEBHOOK_URL",
    issues
  );
  const chatProvider = readOptionalServerRuntimeEnv(env, "CHAT_PROVIDER");
  const n8nChatWebhookTimeout = readOptionalServerRuntimeEnv(
    env,
    "N8N_CHAT_WEBHOOK_TIMEOUT_MS"
  );
  const chatTrustedClientIpHeader = readOptionalServerRuntimeEnv(
    env,
    "CHAT_TRUSTED_CLIENT_IP_HEADER"
  );
  const quoteTrustedClientIpHeader = readOptionalServerRuntimeEnv(
    env,
    "QUOTE_TRUSTED_CLIENT_IP_HEADER"
  );

  if (supabaseUrl) {
    const normalized = normalizeHttpUrlOrigin(supabaseUrl);

    if (normalized) {
      values.supabaseUrl = normalized;
    } else {
      addInvalid(issues, "SUPABASE_URL", "invalid_url");
    }
  }

  if (supabaseAnonKey) {
    values.supabaseAnonKey = supabaseAnonKey;
  }

  if (catalogueWorkspaceId) {
    values.catalogueWorkspaceId = catalogueWorkspaceId;
  }

  if (quoteWorkspaceId) {
    values.quoteWorkspaceId = quoteWorkspaceId;
  }

  if (adminTrustedWorkspaceId) {
    values.adminTrustedWorkspaceId = adminTrustedWorkspaceId;
  }

  if (adminExpectedOrigin) {
    const normalized = normalizeHttpUrlOrigin(adminExpectedOrigin);

    if (normalized) {
      values.adminExpectedOrigin = normalized;
    } else {
      addInvalid(issues, "ADMIN_EXPECTED_ORIGIN", "invalid_origin");
    }
  }

  if (adminExpectedHost) {
    const normalized = normalizeHost(adminExpectedHost);

    if (normalized) {
      values.adminExpectedHost = normalized;
    } else {
      addInvalid(issues, "ADMIN_EXPECTED_HOST", "invalid_host");
    }
  }

  if (adminCsrfProofSecret) {
    values.adminCsrfProofSecret = adminCsrfProofSecret;
  }

  if (chatProvider) {
    const normalized = normalizeProvider(chatProvider);

    if (normalized) {
      values.chatProvider = normalized;
    } else {
      delete values.chatProvider;
      addInvalid(issues, "CHAT_PROVIDER", "unsupported_provider");
    }
  }

  if (n8nChatWebhookUrl) {
    const normalized = normalizeHttpUrl(n8nChatWebhookUrl);

    if (normalized) {
      values.n8nChatWebhookUrl = normalized;
    } else {
      addInvalid(issues, "N8N_CHAT_WEBHOOK_URL", "invalid_url");
    }
  }

  if (n8nChatWebhookTimeout) {
    const normalized = normalizeTimeoutMs(n8nChatWebhookTimeout);

    if (normalized === null) {
      addInvalid(issues, "N8N_CHAT_WEBHOOK_TIMEOUT_MS", "invalid_timeout");
    } else {
      values.n8nChatWebhookTimeoutMs = normalized;
    }
  }

  if (chatTrustedClientIpHeader) {
    const normalized = normalizeTrustedClientIpHeader(chatTrustedClientIpHeader);

    if (normalized) {
      values.chatTrustedClientIpHeader = normalized;
    } else {
      addInvalid(issues, "CHAT_TRUSTED_CLIENT_IP_HEADER", "unsupported_header");
    }
  }

  if (quoteTrustedClientIpHeader) {
    const normalized = normalizeTrustedClientIpHeader(
      quoteTrustedClientIpHeader
    );

    if (normalized) {
      values.quoteTrustedClientIpHeader = normalized;
    } else {
      addInvalid(issues, "QUOTE_TRUSTED_CLIENT_IP_HEADER", "unsupported_header");
    }
  }

  return {
    values,
    issues
  };
}

export type SupabaseServerRuntimeConfig =
  | {
      configured: true;
      supabaseUrl: string;
      supabaseAnonKey: string;
      missingEnv: [];
    }
  | {
      configured: false;
      missingEnv: ("SUPABASE_URL" | "SUPABASE_ANON_KEY")[];
    };

export function getSupabaseServerRuntimeConfig(
  env: ServerRuntimeEnv = process.env
): SupabaseServerRuntimeConfig {
  const config = parseServerRuntimeConfig(env);
  const supabaseUrl = config.values.supabaseUrl;
  const supabaseAnonKey = config.values.supabaseAnonKey;
  const missingEnv: ("SUPABASE_URL" | "SUPABASE_ANON_KEY")[] = [];

  if (!supabaseUrl) {
    missingEnv.push("SUPABASE_URL");
  }

  if (!supabaseAnonKey) {
    missingEnv.push("SUPABASE_ANON_KEY");
  }

  if (missingEnv.length || !supabaseUrl || !supabaseAnonKey) {
    return {
      configured: false,
      missingEnv
    };
  }

  return {
    configured: true,
    supabaseUrl,
    supabaseAnonKey,
    missingEnv: []
  };
}

export function getCatalogueWorkspaceId(
  env: ServerRuntimeEnv = process.env
) {
  return parseServerRuntimeConfig(env).values.catalogueWorkspaceId ?? null;
}

export function getQuoteWorkspaceId(env: ServerRuntimeEnv = process.env) {
  return parseServerRuntimeConfig(env).values.quoteWorkspaceId ?? null;
}

export function getAdminTrustedWorkspaceId(
  env: ServerRuntimeEnv = process.env
) {
  return parseServerRuntimeConfig(env).values.adminTrustedWorkspaceId ?? null;
}

export function getSupabasePublicStorageBaseUrl(
  env: ServerRuntimeEnv = process.env
) {
  const supabaseUrl = parseServerRuntimeConfig(env).values.supabaseUrl;

  return supabaseUrl ? `${supabaseUrl}/storage/v1/object/public` : null;
}

export function getAdminRouteRuntimeConfig(
  env: ServerRuntimeEnv = process.env
) {
  const values = parseServerRuntimeConfig(env).values;

  return {
    expectedOrigin: values.adminExpectedOrigin ?? null,
    expectedHost: values.adminExpectedHost ?? null,
    trustedServerWorkspaceId: values.adminTrustedWorkspaceId ?? null
  };
}

export function getAdminCsrfProofSecret(
  env: ServerRuntimeEnv = process.env
) {
  return parseServerRuntimeConfig(env).values.adminCsrfProofSecret ?? null;
}

export function getTrustedClientIpHeader(
  kind: "chat" | "quote",
  env: ServerRuntimeEnv = process.env
) {
  const values = parseServerRuntimeConfig(env).values;

  return kind === "chat"
    ? values.chatTrustedClientIpHeader
    : values.quoteTrustedClientIpHeader;
}

export type ChatProviderRuntimeConfig =
  | {
      configured: true;
      provider: "n8n";
    }
  | {
      configured: false;
      reason: "unsupported_provider";
    };

export function getChatProviderRuntimeConfig(
  env: ServerRuntimeEnv = process.env
): ChatProviderRuntimeConfig {
  const provider = parseServerRuntimeConfig(env).values.chatProvider;

  return provider
    ? {
        configured: true,
        provider
      }
    : {
        configured: false,
        reason: "unsupported_provider"
      };
}

export type N8nChatRuntimeConfig =
  | {
      configured: true;
      webhookUrl: string;
      timeoutMs: number;
      missingEnv: [];
    }
  | {
      configured: false;
      webhookUrl: null;
      timeoutMs: number;
      missingEnv: ["N8N_CHAT_WEBHOOK_URL"];
    };

export function getN8nChatRuntimeConfig(
  env: ServerRuntimeEnv = process.env
): N8nChatRuntimeConfig {
  const values = parseServerRuntimeConfig(env).values;

  return values.n8nChatWebhookUrl
    ? {
        configured: true,
        webhookUrl: values.n8nChatWebhookUrl,
        timeoutMs: values.n8nChatWebhookTimeoutMs ?? defaultN8nTimeoutMs,
        missingEnv: []
      }
    : {
        configured: false,
        webhookUrl: null,
        timeoutMs: values.n8nChatWebhookTimeoutMs ?? defaultN8nTimeoutMs,
        missingEnv: ["N8N_CHAT_WEBHOOK_URL"]
      };
}

export function getPublicSafeServerRuntimeConfigSummary(
  env: ServerRuntimeEnv = process.env
) {
  const config = parseServerRuntimeConfig(env);

  return {
    ok: config.issues.length === 0,
    issues: config.issues.map((issue) => ({
      name: issue.name,
      kind: issue.kind,
      reason: issue.reason
    }))
  };
}
