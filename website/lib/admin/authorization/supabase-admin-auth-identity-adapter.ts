import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import type {
  AdminAuthAdapter,
  ResolvedAdminIdentity
} from "./admin-authorization-adapters";
import type {
  SupabaseAdminReadClient,
  SupabaseAdminReadClientResult
} from "./supabase-admin-profile-membership-adapters";
import {
  getSupabaseServerConfig,
  type SupabaseServerConfig
} from "../../supabase/env";

export type SupabaseAdminAuthIdentityDenyReason =
  | "supabase_server_env_missing"
  | "auth_session_missing"
  | "auth_provider_error";

export type SupabaseAdminAuthIdentityResult =
  | {
      authenticated: true;
      authUserId: string;
      email: string;
      provider: "google";
    }
  | {
      authenticated: false;
      reason: SupabaseAdminAuthIdentityDenyReason;
      statusCode: 401 | 503;
    };

export type SupabaseAuthCookie = {
  name: string;
  value: string;
};

export type SupabaseAuthCookieReader = {
  getAll(): SupabaseAuthCookie[];
};

export type SupabaseAuthCookieWriter = {
  set(name: string, value: string, options?: CookieOptions): void;
};

export type SupabaseAuthUserClient = {
  auth: {
    getUser(): Promise<{
      data?: {
        user?: {
          id?: string | null;
          email?: string | null;
          app_metadata?: {
            provider?: string | null;
          } | null;
        } | null;
      } | null;
      error?: unknown;
    }>;
  };
};

export type SupabaseAdminAuthSessionClient = {
  auth: {
    signInWithOAuth(input: {
      provider: "google";
      options: {
        redirectTo: string;
      };
    }): Promise<{
      data?: {
        url?: string | null;
      } | null;
      error?: unknown;
    }>;
    exchangeCodeForSession(code: string): Promise<{
      error?: unknown;
    }>;
    signOut(): Promise<{
      error?: unknown;
    }>;
  };
};

export type SupabaseAdminAuthClientFactoryInput = {
  config: Extract<SupabaseServerConfig, { configured: true }>;
  cookies: SupabaseAuthCookie[];
};

export type SupabaseAdminReadClientFactoryInput = {
  config: Extract<SupabaseServerConfig, { configured: true }>;
  cookies: SupabaseAuthCookie[];
};

export type SupabaseAdminAuthSessionClientFactoryInput = {
  config: Extract<SupabaseServerConfig, { configured: true }>;
  requestCookies: SupabaseAuthCookieReader;
  responseCookies: SupabaseAuthCookieWriter;
};

export type SupabaseAdminGoogleAuthSessionInput = {
  redirectTo: string;
};

export type SupabaseAdminAuthCodeExchangeInput = {
  code: string;
};

export type SupabaseAdminAuthSessionFailureReason =
  | "supabase_server_env_missing"
  | "auth_session_invalid"
  | "auth_provider_error";

export type SupabaseAdminAuthSessionResult =
  | {
      ok: true;
      redirectUrl?: string;
    }
  | {
      ok: false;
      reason: SupabaseAdminAuthSessionFailureReason;
    };

export type SupabaseAdminAuthIdentityDependencies = {
  readConfig?: () => SupabaseServerConfig;
  readCookies?: () => Promise<SupabaseAuthCookie[]>;
  createAuthClient?: (
    input: SupabaseAdminAuthClientFactoryInput
  ) => SupabaseAuthUserClient;
};

export type SupabaseAdminReadClientFactoryDependencies = {
  readConfig?: () => SupabaseServerConfig;
  readCookies?: () => Promise<SupabaseAuthCookie[]>;
  createReadClient?: (
    input: SupabaseAdminReadClientFactoryInput
  ) => SupabaseAdminReadClient | null | undefined;
};

export type SupabaseAdminAuthSessionDependencies = {
  readConfig?: () => SupabaseServerConfig;
  requestCookies: SupabaseAuthCookieReader;
  responseCookies: SupabaseAuthCookieWriter;
  createSessionClient?: (
    input: SupabaseAdminAuthSessionClientFactoryInput
  ) => SupabaseAdminAuthSessionClient;
};

function unauthenticated(
  reason: SupabaseAdminAuthIdentityDenyReason,
  statusCode: 401 | 503
): SupabaseAdminAuthIdentityResult {
  return {
    authenticated: false,
    reason,
    statusCode
  };
}

function adminReadClientUnavailable(): SupabaseAdminReadClientResult {
  return {
    configured: false,
    client: null,
    reason: "authenticated_admin_read_client_required"
  };
}

function normalizeRequired(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeIdentityEmail(value: string | null | undefined) {
  const normalized = normalizeRequired(value)?.toLowerCase();

  return normalized && normalized.includes("@") ? normalized : null;
}

function normalizeProvider(value: string | null | undefined) {
  return normalizeRequired(value)?.toLowerCase() ?? null;
}

async function readNextRequestCookies(): Promise<SupabaseAuthCookie[]> {
  const requestCookies = await cookies();

  return requestCookies.getAll().map(({ name, value }) => ({
    name,
    value
  }));
}

function createSupabaseSsrAuthClient({
  config,
  cookies: requestCookies
}: SupabaseAdminAuthClientFactoryInput): SupabaseAuthUserClient {
  return createServerClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    },
    cookies: {
      getAll() {
        return requestCookies;
      }
    }
  }) as unknown as SupabaseAuthUserClient;
}

function createSupabaseSsrAdminReadClient({
  config,
  cookies: requestCookies
}: SupabaseAdminReadClientFactoryInput): SupabaseAdminReadClient {
  return createServerClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    },
    cookies: {
      getAll() {
        return requestCookies;
      }
    }
  }) as unknown as SupabaseAdminReadClient;
}

function createSupabaseSsrAuthSessionClient({
  config,
  requestCookies,
  responseCookies
}: SupabaseAdminAuthSessionClientFactoryInput): SupabaseAdminAuthSessionClient {
  return createServerClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    },
    cookies: {
      getAll() {
        return requestCookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          responseCookies.set(name, value, options);
        });
      }
    }
  }) as unknown as SupabaseAdminAuthSessionClient;
}

export async function resolveSupabaseAdminAuthIdentity(
  dependencies: SupabaseAdminAuthIdentityDependencies = {}
): Promise<SupabaseAdminAuthIdentityResult> {
  const readConfig = dependencies.readConfig ?? getSupabaseServerConfig;
  const config = readConfig();

  if (!config.configured) {
    return unauthenticated("supabase_server_env_missing", 503);
  }

  const readCookies = dependencies.readCookies ?? readNextRequestCookies;
  const createAuthClient =
    dependencies.createAuthClient ?? createSupabaseSsrAuthClient;

  try {
    const requestCookies = await readCookies();
    const client = createAuthClient({
      config,
      cookies: requestCookies
    });
    const { data, error } = await client.auth.getUser();
    const authUserId = data?.user?.id?.trim();
    const email = normalizeIdentityEmail(data?.user?.email);
    const provider = normalizeProvider(data?.user?.app_metadata?.provider);

    if (error || !authUserId || !email || provider !== "google") {
      return unauthenticated("auth_session_missing", 401);
    }

    return {
      authenticated: true,
      authUserId,
      email,
      provider
    };
  } catch {
    return unauthenticated("auth_provider_error", 503);
  }
}

export async function createSessionBoundSupabaseAdminReadClient(
  dependencies: SupabaseAdminReadClientFactoryDependencies = {}
): Promise<SupabaseAdminReadClientResult> {
  const readConfig = dependencies.readConfig ?? getSupabaseServerConfig;
  const readCookies = dependencies.readCookies ?? readNextRequestCookies;
  const createReadClient =
    dependencies.createReadClient ?? createSupabaseSsrAdminReadClient;

  try {
    const config = readConfig();

    if (!config.configured) {
      return adminReadClientUnavailable();
    }

    const requestCookies = await readCookies();
    const client = createReadClient({
      config,
      cookies: requestCookies
    });

    if (!client) {
      return adminReadClientUnavailable();
    }

    return {
      configured: true,
      client,
      missingEnv: []
    };
  } catch {
    return adminReadClientUnavailable();
  }
}

export function createSupabaseAdminAuthIdentityAdapter(
  dependencies: SupabaseAdminAuthIdentityDependencies = {}
): AdminAuthAdapter {
  return {
    async resolveIdentity(): Promise<ResolvedAdminIdentity> {
      return resolveSupabaseAdminAuthIdentity(dependencies);
    }
  };
}

export async function signInSupabaseAdminGoogleAuthSession(
  input: SupabaseAdminGoogleAuthSessionInput,
  dependencies: SupabaseAdminAuthSessionDependencies
): Promise<SupabaseAdminAuthSessionResult> {
  const readConfig = dependencies.readConfig ?? getSupabaseServerConfig;
  const config = readConfig();

  if (!config.configured) {
    return {
      ok: false,
      reason: "supabase_server_env_missing"
    };
  }

  const createSessionClient =
    dependencies.createSessionClient ?? createSupabaseSsrAuthSessionClient;

  try {
    const client = createSessionClient({
      config,
      requestCookies: dependencies.requestCookies,
      responseCookies: dependencies.responseCookies
    });
    const { data, error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: input.redirectTo
      }
    });
    const redirectUrl = normalizeRequired(data?.url);

    return error || !redirectUrl
      ? {
          ok: false,
          reason: "auth_session_invalid"
        }
      : {
          ok: true,
          redirectUrl
        };
  } catch {
    return {
      ok: false,
      reason: "auth_provider_error"
    };
  }
}

export async function exchangeSupabaseAdminAuthCodeForSession(
  input: SupabaseAdminAuthCodeExchangeInput,
  dependencies: SupabaseAdminAuthSessionDependencies
): Promise<SupabaseAdminAuthSessionResult> {
  const readConfig = dependencies.readConfig ?? getSupabaseServerConfig;
  const config = readConfig();
  const code = normalizeRequired(input.code);

  if (!code) {
    return {
      ok: false,
      reason: "auth_session_invalid"
    };
  }

  if (!config.configured) {
    return {
      ok: false,
      reason: "supabase_server_env_missing"
    };
  }

  const createSessionClient =
    dependencies.createSessionClient ?? createSupabaseSsrAuthSessionClient;

  try {
    const client = createSessionClient({
      config,
      requestCookies: dependencies.requestCookies,
      responseCookies: dependencies.responseCookies
    });
    const { error } = await client.auth.exchangeCodeForSession(code);

    return error
      ? {
          ok: false,
          reason: "auth_session_invalid"
        }
      : {
          ok: true
        };
  } catch {
    return {
      ok: false,
      reason: "auth_provider_error"
    };
  }
}

export async function signOutSupabaseAdminAuthSession(
  dependencies: SupabaseAdminAuthSessionDependencies
): Promise<SupabaseAdminAuthSessionResult> {
  const readConfig = dependencies.readConfig ?? getSupabaseServerConfig;
  const config = readConfig();

  if (!config.configured) {
    return {
      ok: false,
      reason: "supabase_server_env_missing"
    };
  }

  const createSessionClient =
    dependencies.createSessionClient ?? createSupabaseSsrAuthSessionClient;

  try {
    const client = createSessionClient({
      config,
      requestCookies: dependencies.requestCookies,
      responseCookies: dependencies.responseCookies
    });
    const { error } = await client.auth.signOut();

    return error
      ? {
          ok: false,
          reason: "auth_session_invalid"
        }
      : {
          ok: true
        };
  } catch {
    return {
      ok: false,
      reason: "auth_provider_error"
    };
  }
}
