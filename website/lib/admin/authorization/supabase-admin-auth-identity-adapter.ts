import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type {
  AdminAuthAdapter,
  ResolvedAdminIdentity
} from "./admin-authorization-adapters";
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

export type SupabaseAuthUserClient = {
  auth: {
    getUser(): Promise<{
      data?: {
        user?: {
          id?: string | null;
        } | null;
      } | null;
      error?: unknown;
    }>;
  };
};

export type SupabaseAdminAuthClientFactoryInput = {
  config: Extract<SupabaseServerConfig, { configured: true }>;
  cookies: SupabaseAuthCookie[];
};

export type SupabaseAdminAuthIdentityDependencies = {
  readConfig?: () => SupabaseServerConfig;
  readCookies?: () => Promise<SupabaseAuthCookie[]>;
  createAuthClient?: (
    input: SupabaseAdminAuthClientFactoryInput
  ) => SupabaseAuthUserClient;
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

    if (error || !authUserId) {
      return unauthenticated("auth_session_missing", 401);
    }

    return {
      authenticated: true,
      authUserId
    };
  } catch {
    return unauthenticated("auth_provider_error", 503);
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
