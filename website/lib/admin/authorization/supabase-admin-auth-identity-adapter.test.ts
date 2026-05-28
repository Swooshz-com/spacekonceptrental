import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  createSupabaseAdminAuthIdentityAdapter,
  resolveSupabaseAdminAuthIdentity,
  type SupabaseAdminAuthClientFactoryInput
} from "./supabase-admin-auth-identity-adapter";

const sourcePath = resolve(
  process.cwd(),
  "lib/admin/authorization/supabase-admin-auth-identity-adapter.ts"
);

function readSource() {
  return readFileSync(sourcePath, "utf8");
}

const configuredSupabase: SupabaseAdminAuthClientFactoryInput["config"] = {
  configured: true as const,
  supabaseUrl: "https://example.supabase.co",
  supabaseAnonKey: "anon-key",
  missingEnv: []
};

describe("Supabase admin auth identity adapter", () => {
  it("maps a valid Supabase Auth user into the AdminAuthAdapter identity shape", async () => {
    const seenCookies: Array<{ name: string; value: string }> = [];

    const identity = await resolveSupabaseAdminAuthIdentity({
      readConfig: () => configuredSupabase,
      readCookies: async () => [
        { name: "sb-project-auth-token", value: "cookie-value" }
      ],
      createAuthClient: ({ config, cookies }) => {
        expect(config).toBe(configuredSupabase);
        seenCookies.push(...cookies);

        return {
          auth: {
            async getUser() {
              return {
                data: {
                  user: {
                    id: "auth-user-123"
                  }
                },
                error: null
              };
            }
          }
        };
      }
    });

    expect(seenCookies).toEqual([
      { name: "sb-project-auth-token", value: "cookie-value" }
    ]);
    expect(identity).toEqual({
      authenticated: true,
      authUserId: "auth-user-123"
    });
  });

  it("returns an unauthenticated safe denial when the session is missing or invalid", async () => {
    const identity = await resolveSupabaseAdminAuthIdentity({
      readConfig: () => configuredSupabase,
      readCookies: async () => [],
      createAuthClient: () => ({
        auth: {
          async getUser() {
            return {
              data: { user: null },
              error: {
                message: "JWT expired with provider-internal details"
              }
            };
          }
        }
      })
    });

    expect(identity).toEqual({
      authenticated: false,
      reason: "auth_session_missing",
      statusCode: 401
    });
    expect(JSON.stringify(identity)).not.toContain("JWT expired");
    expect(JSON.stringify(identity)).not.toContain("provider-internal");
  });

  it("returns a safe provider-error denial without leaking secrets or internals", async () => {
    const identity = await resolveSupabaseAdminAuthIdentity({
      readConfig: () => configuredSupabase,
      readCookies: async () => [],
      createAuthClient: () => ({
        auth: {
          async getUser() {
            throw new Error(
              "provider exploded with SUPABASE_SERVICE_ROLE_KEY=secret"
            );
          }
        }
      })
    });

    expect(identity).toEqual({
      authenticated: false,
      reason: "auth_provider_error",
      statusCode: 503
    });
    expect(JSON.stringify(identity)).not.toContain("secret");
    expect(JSON.stringify(identity)).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(JSON.stringify(identity)).not.toContain("provider exploded");
  });

  it("does not create a Supabase auth client when server env is missing", async () => {
    let createAuthClientCalls = 0;

    const identity = await resolveSupabaseAdminAuthIdentity({
      readConfig: () => ({
        configured: false as const,
        missingEnv: ["SUPABASE_URL"]
      }),
      readCookies: async () => {
        throw new Error("cookies should not be read before config exists");
      },
      createAuthClient: () => {
        createAuthClientCalls += 1;
        throw new Error("client should not be created");
      }
    });

    expect(createAuthClientCalls).toBe(0);
    expect(identity).toEqual({
      authenticated: false,
      reason: "supabase_server_env_missing",
      statusCode: 503
    });
  });

  it("creates an AdminAuthAdapter-compatible object", async () => {
    const adapter = createSupabaseAdminAuthIdentityAdapter({
      readConfig: () => configuredSupabase,
      readCookies: async () => [],
      createAuthClient: () => ({
        auth: {
          async getUser() {
            return {
              data: {
                user: {
                  id: "auth-user-adapter"
                }
              },
              error: null
            };
          }
        }
      })
    });

    await expect(adapter.resolveIdentity()).resolves.toEqual({
      authenticated: true,
      authUserId: "auth-user-adapter"
    });
  });

  it("keeps Supabase Auth and cookie reads inside a server-only boundary", () => {
    const source = readSource();

    expect(source).toContain('import "server-only";');
    expect(source).toContain('from "@supabase/ssr"');
    expect(source).toContain('from "next/headers"');
    expect(source).toContain("cookies()");
    expect(source).toContain("auth.getUser()");
    expect(source).not.toContain("headers()");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("chat-config");
  });
});
