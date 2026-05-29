import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  createSessionBoundSupabaseAdminReadClient,
  createSupabaseAdminAuthIdentityAdapter,
  resolveSupabaseAdminAuthIdentity,
  type SupabaseAdminAuthClientFactoryInput,
  type SupabaseAdminReadClientFactoryInput
} from "./supabase-admin-auth-identity-adapter";
import {
  resolveSupabaseAdminMembership,
  resolveSupabaseAdminProfile,
  type SupabaseAdminReadClient
} from "./supabase-admin-profile-membership-adapters";

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

function createMockAdminReadClient(
  tables: Record<string, unknown[]>
): SupabaseAdminReadClient {
  return {
    from(table: string) {
      return {
        select() {
          const filters: Array<{ column: string; value: string }> = [];
          const query = {
            eq(column: string, value: string) {
              filters.push({ column, value });
              return query;
            },
            async limit() {
              const rows = (tables[table] ?? []).filter((row) => {
                if (!row || typeof row !== "object" || Array.isArray(row)) {
                  return false;
                }

                return filters.every(
                  ({ column, value }) =>
                    (row as Record<string, unknown>)[column] === value
                );
              });

              return {
                data: rows,
                error: null
              };
            }
          };

          return query;
        }
      };
    }
  };
}

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

  it("creates a session-bound admin read-client result from env, cookies, and an injected factory", async () => {
    const client = createMockAdminReadClient({});
    const seenCookies: SupabaseAdminReadClientFactoryInput["cookies"] = [];

    const result = await createSessionBoundSupabaseAdminReadClient({
      readConfig: () => configuredSupabase,
      readCookies: async () => [
        {
          name: "sb-project-auth-token",
          value: "cookie-value"
        }
      ],
      createReadClient: ({ config, cookies }) => {
        expect(config).toBe(configuredSupabase);
        seenCookies.push(...cookies);
        return client;
      }
    });

    expect(seenCookies).toEqual([
      {
        name: "sb-project-auth-token",
        value: "cookie-value"
      }
    ]);
    expect(result).toEqual({
      configured: true,
      client,
      missingEnv: []
    });
    expect(JSON.stringify(result)).not.toContain("cookie-value");
    expect(JSON.stringify(result)).not.toContain("anon-key");
  });

  it("fails closed without reading cookies or creating a read client when server env is missing", async () => {
    let readCookiesCalls = 0;
    let createReadClientCalls = 0;

    const result = await createSessionBoundSupabaseAdminReadClient({
      readConfig: () => ({
        configured: false as const,
        missingEnv: ["SUPABASE_URL"]
      }),
      readCookies: async () => {
        readCookiesCalls += 1;
        throw new Error("cookies should not be read before config exists");
      },
      createReadClient: () => {
        createReadClientCalls += 1;
        return createMockAdminReadClient({});
      }
    });

    expect(readCookiesCalls).toBe(0);
    expect(createReadClientCalls).toBe(0);
    expect(result).toEqual({
      configured: false,
      client: null,
      reason: "authenticated_admin_read_client_required"
    });
  });

  it("fails closed when cookie reading fails without leaking cookie internals", async () => {
    let createReadClientCalls = 0;

    const result = await createSessionBoundSupabaseAdminReadClient({
      readConfig: () => configuredSupabase,
      readCookies: async () => {
        throw new Error("cookie secret token stack provider details");
      },
      createReadClient: () => {
        createReadClientCalls += 1;
        return createMockAdminReadClient({});
      }
    });
    const serialized = JSON.stringify(result).toLowerCase();

    expect(createReadClientCalls).toBe(0);
    expect(result).toEqual({
      configured: false,
      client: null,
      reason: "authenticated_admin_read_client_required"
    });
    expect(serialized).not.toContain("cookie");
    expect(serialized).not.toContain("secret");
    expect(serialized).not.toContain("token");
    expect(serialized).not.toContain("stack");
    expect(serialized).not.toContain("provider");
  });

  it("fails closed when read-client creation fails without leaking provider internals", async () => {
    const result = await createSessionBoundSupabaseAdminReadClient({
      readConfig: () => configuredSupabase,
      readCookies: async () => [
        {
          name: "sb-project-auth-token",
          value: "cookie-value"
        }
      ],
      createReadClient: () => {
        throw new Error("SQL provider stack SUPABASE_SERVICE_ROLE_KEY secret");
      }
    });
    const serialized = JSON.stringify(result);

    expect(result).toEqual({
      configured: false,
      client: null,
      reason: "authenticated_admin_read_client_required"
    });
    expect(serialized).not.toContain("SQL");
    expect(serialized).not.toContain("provider");
    expect(serialized).not.toContain("stack");
    expect(serialized).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(serialized).not.toContain("secret");
    expect(serialized).not.toContain("cookie-value");
  });

  it("returns a result that can be injected into profile and membership adapter tests without runtime wiring", async () => {
    const supabase = await createSessionBoundSupabaseAdminReadClient({
      readConfig: () => configuredSupabase,
      readCookies: async () => [
        {
          name: "sb-project-auth-token",
          value: "cookie-value"
        }
      ],
      createReadClient: () =>
        createMockAdminReadClient({
          admin_users: [
            {
              id: "admin-user-1",
              auth_user_id: "auth-user-1",
              status: "active"
            }
          ],
          memberships: [
            {
              admin_user_id: "admin-user-1",
              workspace_id: "workspace-1",
              status: "active",
              role: "admin"
            }
          ]
        })
    });

    await expect(
      resolveSupabaseAdminProfile("auth-user-1", { supabase })
    ).resolves.toEqual({
      id: "admin-user-1",
      status: "active"
    });
    await expect(
      resolveSupabaseAdminMembership("admin-user-1", "workspace-1", {
        supabase
      })
    ).resolves.toEqual({
      adminUserId: "admin-user-1",
      workspaceId: "workspace-1",
      status: "active",
      role: "admin"
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
