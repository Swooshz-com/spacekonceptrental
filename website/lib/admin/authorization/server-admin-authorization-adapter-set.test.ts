import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import type { SupabaseAdminAuthClientFactoryInput } from "./supabase-admin-auth-identity-adapter";
import type {
  SupabaseAdminReadClient,
  SupabaseAdminReadClientResult
} from "./supabase-admin-profile-membership-adapters";
import {
  createServerAdminAuthorizationAdapterSet,
  type ServerAdminAuthorizationAdapterSetResult
} from "./server-admin-authorization-adapter-set";

type QueryCall = {
  table: string;
  columns: string;
  filters: Array<{
    column: string;
    value: string;
  }>;
  limit: number;
};

const sourcePath = resolve(
  process.cwd(),
  "lib/admin/authorization/server-admin-authorization-adapter-set.ts"
);

const configuredSupabase: SupabaseAdminAuthClientFactoryInput["config"] = {
  configured: true as const,
  supabaseUrl: "https://example.supabase.co",
  supabaseAnonKey: "anon-key",
  missingEnv: []
};

function readSource() {
  return readFileSync(sourcePath, "utf8");
}

function expectConfigured(
  result: ServerAdminAuthorizationAdapterSetResult
): asserts result is Extract<
  ServerAdminAuthorizationAdapterSetResult,
  { configured: true }
> {
  expect(result.configured).toBe(true);

  if (!result.configured) {
    throw new Error("expected configured admin authorization adapter set");
  }
}

function createMockAdminReadClient(
  tables: Record<string, unknown[]>
): {
  calls: QueryCall[];
  client: SupabaseAdminReadClient;
} {
  const calls: QueryCall[] = [];
  const client: SupabaseAdminReadClient = {
    from(table: string) {
      return {
        select(columns: string) {
          const filters: QueryCall["filters"] = [];
          const query = {
            eq(column: string, value: string) {
              filters.push({ column, value });
              return query;
            },
            async limit(limit: number) {
              calls.push({
                table,
                columns,
                filters: [...filters],
                limit
              });

              return {
                data: (tables[table] ?? []).filter(
                  (row): row is Record<string, unknown> =>
                    Boolean(row) &&
                    typeof row === "object" &&
                    !Array.isArray(row) &&
                    filters.every(
                      ({ column, value }) =>
                        (row as Record<string, unknown>)[column] === value
                    )
                ),
                error: null
              };
            }
          };

          return query;
        }
      };
    }
  };

  return {
    calls,
    client
  };
}

function createValidReadClientResult(
  client: SupabaseAdminReadClient
): SupabaseAdminReadClientResult {
  return {
    configured: true,
    client,
    missingEnv: []
  };
}

describe("server admin authorization adapter-set composition", () => {
  it("returns an adapter-set-compatible object when injected dependencies are valid", async () => {
    const { client } = createMockAdminReadClient({});
    const result = await createServerAdminAuthorizationAdapterSet({
      readClient: {
        readConfig: () => configuredSupabase,
        readCookies: async () => [],
        createReadClient: () => client
      },
      workspace: {
        trustedServerWorkspaceId: "workspace-1"
      }
    });

    expectConfigured(result);
    expect(result.adapters).toEqual({
      auth: expect.objectContaining({
        resolveIdentity: expect.any(Function)
      }),
      profile: expect.objectContaining({
        resolveAdminProfile: expect.any(Function)
      }),
      membership: expect.objectContaining({
        resolveMembership: expect.any(Function)
      }),
      workspace: expect.objectContaining({
        resolveWorkspaceForRequest: expect.any(Function)
      })
    });
  });

  it("composes an auth adapter that resolves identity through the existing identity path", async () => {
    let authClientFactoryCalls = 0;
    const { client } = createMockAdminReadClient({});
    const result = await createServerAdminAuthorizationAdapterSet({
      auth: {
        readConfig: () => configuredSupabase,
        readCookies: async () => [
          {
            name: "sb-project-auth-token",
            value: "cookie-token-value"
          }
        ],
        createAuthClient: ({ config, cookies }) => {
          authClientFactoryCalls += 1;
          expect(config).toBe(configuredSupabase);
          expect(cookies).toEqual([
            {
              name: "sb-project-auth-token",
              value: "cookie-token-value"
            }
          ]);

          return {
            auth: {
              async getUser() {
                return {
                  data: {
                    user: {
                      id: "auth-user-1"
                    }
                  },
                  error: null
                };
              }
            }
          };
        }
      },
      readClient: {
        readConfig: () => configuredSupabase,
        readCookies: async () => [],
        createReadClient: () => client
      },
      workspace: {
        trustedServerWorkspaceId: "workspace-1"
      }
    });

    expectConfigured(result);
    await expect(result.adapters.auth.resolveIdentity()).resolves.toEqual({
      authenticated: true,
      authUserId: "auth-user-1"
    });
    expect(authClientFactoryCalls).toBe(1);
    expect(JSON.stringify(result)).not.toContain("cookie-token-value");
  });

  it("composes profile and membership adapters with the same session-bound read-client result", async () => {
    const { calls, client } = createMockAdminReadClient({
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
    });
    let readClientFactoryCalls = 0;
    const result = await createServerAdminAuthorizationAdapterSet({
      readClient: {
        readConfig: () => configuredSupabase,
        readCookies: async () => [],
        createReadClient: () => {
          readClientFactoryCalls += 1;
          return client;
        }
      },
      workspace: {
        trustedServerWorkspaceId: "workspace-1"
      }
    });

    expectConfigured(result);
    expect(readClientFactoryCalls).toBe(1);
    await expect(
      result.adapters.profile.resolveAdminProfile("auth-user-1")
    ).resolves.toEqual({
      id: "admin-user-1",
      status: "active"
    });
    await expect(
      result.adapters.membership.resolveMembership(
        "admin-user-1",
        "workspace-1"
      )
    ).resolves.toEqual({
      adminUserId: "admin-user-1",
      workspaceId: "workspace-1",
      status: "active",
      role: "admin"
    });
    expect(calls.map(({ table }) => table)).toEqual([
      "admin_users",
      "memberships"
    ]);
  });

  it("composes a workspace resolver that resolves only trusted server-side workspace input", async () => {
    const { client } = createMockAdminReadClient({});
    const result = await createServerAdminAuthorizationAdapterSet({
      readClient: {
        readConfig: () => configuredSupabase,
        readCookies: async () => [],
        createReadClient: () => client
      },
      workspace: {
        trustedServerWorkspaceId: " workspace-1 "
      }
    });

    expectConfigured(result);
    await expect(
      result.adapters.workspace.resolveWorkspaceForRequest({
        requestedWorkspaceIdForValidationOnly: " workspace-1 "
      })
    ).resolves.toEqual({
      serverResolvedWorkspaceId: "workspace-1"
    });
    await expect(
      result.adapters.workspace.resolveWorkspaceForRequest({
        requestedWorkspaceIdForValidationOnly: "workspace-2"
      })
    ).resolves.toEqual({
      serverResolvedWorkspaceId: null
    });
  });

  it("fails closed when the session-bound read client is unavailable", async () => {
    let readCookiesCalls = 0;
    let createReadClientCalls = 0;
    const result = await createServerAdminAuthorizationAdapterSet({
      readClient: {
        readConfig: () => ({
          configured: false as const,
          missingEnv: ["SUPABASE_URL"]
        }),
        readCookies: async () => {
          readCookiesCalls += 1;
          throw new Error("cookies should not be read");
        },
        createReadClient: () => {
          createReadClientCalls += 1;
          return null;
        }
      },
      workspace: {
        trustedServerWorkspaceId: "workspace-1"
      }
    });

    expect(readCookiesCalls).toBe(0);
    expect(createReadClientCalls).toBe(0);
    expect(result).toEqual({
      configured: false,
      adapters: null,
      reason: "admin_authorization_adapter_set_unavailable"
    });
  });

  it("fails closed when trusted server-side workspace input is missing", async () => {
    const { client } = createMockAdminReadClient({});
    const result = await createServerAdminAuthorizationAdapterSet({
      readClient: {
        readConfig: () => configuredSupabase,
        readCookies: async () => [],
        createReadClient: () => client
      }
    });

    expect(result).toEqual({
      configured: false,
      adapters: null,
      reason: "admin_authorization_adapter_set_unavailable"
    });
  });

  it("returns only a safe unavailable shape when composition dependencies fail", async () => {
    const { client } = createMockAdminReadClient({});
    const result = await createServerAdminAuthorizationAdapterSet({
      readClient: {
        readConfig: () => configuredSupabase,
        readCookies: async () => [],
        createReadClient: () => client
      },
      workspace: {
        getTrustedServerWorkspaceId() {
          throw new Error(
            "cookie token env SQL provider stack SUPABASE_SERVICE_ROLE_KEY anon-key"
          );
        }
      }
    });
    const serialized = JSON.stringify(result).toLowerCase();

    expect(result).toEqual({
      configured: false,
      adapters: null,
      reason: "admin_authorization_adapter_set_unavailable"
    });
    for (const term of [
      "cookie",
      "token",
      "env",
      "sql",
      "provider",
      "stack",
      "supabase",
      "service_role",
      "anon-key"
    ]) {
      expect(serialized).not.toContain(term);
    }
  });

  it("keeps composition server-only and free of direct provider/runtime shortcuts", () => {
    const source = readSource();

    expect(source).toContain('import "server-only";');
    expect(source).toContain("createSupabaseAdminAuthIdentityAdapter");
    expect(source).toContain("createSessionBoundSupabaseAdminReadClient");
    expect(source).toContain("createSupabaseAdminProfileAdapter");
    expect(source).toContain("createSupabaseAdminMembershipAdapter");
    expect(source).toContain("createServerAdminWorkspaceResolver");
    expect(source).not.toContain("@supabase/ssr");
    expect(source).not.toContain("@supabase/supabase-js");
    expect(source).not.toContain("next/headers");
    expect(source).not.toContain("cookies()");
    expect(source).not.toContain("headers()");
    expect(source).not.toContain("auth.getUser()");
    expect(source).not.toContain("process.env");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("catalogue_public_workspace_config");
    expect(source).not.toContain("CATALOGUE_WORKSPACE_ID");
    expect(source).not.toContain("N8N");
    expect(source).not.toContain("PINECONE");
    expect(source).not.toContain("chat-config");
    expect(source).not.toContain(".from(");
    expect(source).not.toContain(".insert(");
    expect(source).not.toContain(".update(");
    expect(source).not.toContain(".upsert(");
    expect(source).not.toContain(".delete(");
    expect(source).not.toContain('"use server"');
    expect(source).not.toContain("resolveAdminAuthorizationWithAdapters");
  });

  it("can receive a prebuilt read-client result in tests without runtime wiring", async () => {
    const { calls, client } = createMockAdminReadClient({
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
          role: "owner"
        }
      ]
    });
    const supabase = createValidReadClientResult(client);
    const result = await createServerAdminAuthorizationAdapterSet({
      readClient: {
        readConfig: () => configuredSupabase,
        readCookies: async () => [],
        createReadClient: () => supabase.client
      },
      workspace: {
        trustedServerWorkspaceId: "workspace-1"
      }
    });

    expectConfigured(result);
    await expect(
      result.adapters.profile.resolveAdminProfile("auth-user-1")
    ).resolves.toEqual({
      id: "admin-user-1",
      status: "active"
    });
    await expect(
      result.adapters.membership.resolveMembership(
        "admin-user-1",
        "workspace-1"
      )
    ).resolves.toEqual({
      adminUserId: "admin-user-1",
      workspaceId: "workspace-1",
      status: "active",
      role: "owner"
    });
    expect(calls.map(({ table }) => table)).toEqual([
      "admin_users",
      "memberships"
    ]);
  });
});
