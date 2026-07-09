import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import type { AdminAuthorizationAdapterSet } from "./admin-authorization-resolver";
import type { SupabaseAdminAuthClientFactoryInput } from "./supabase-admin-auth-identity-adapter";
import type { SupabaseAdminReadClient } from "./supabase-admin-profile-membership-adapters";
import {
  resolveServerAdminAuthorizationDecision,
  type ServerAdminAuthorizationDecisionResult
} from "./server-admin-authorization-decision";

type QueryCall = {
  table: string;
  filters: Array<{
    column: string;
    value: string;
  }>;
};

const sourcePath = resolve(
  process.cwd(),
  "lib/admin/authorization/server-admin-authorization-decision.ts"
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

function createFakeAdapterSet(): AdminAuthorizationAdapterSet {
  return {
    auth: {
      async resolveIdentity() {
        return {
          authenticated: false
        };
      }
    },
    profile: {
      async resolveAdminProfile() {
        return null;
      }
    },
    workspace: {
      async resolveWorkspaceForRequest() {
        return {
          serverResolvedWorkspaceId: null
        };
      }
    },
    membership: {
      async resolveMembership() {
        return null;
      }
    }
  };
}

function createMockAdminReadClient(
  tables: Record<string, unknown[]>
): {
  calls: QueryCall[];
  client: SupabaseAdminReadClient;
} {
  const calls: QueryCall[] = [];
  const client: SupabaseAdminReadClient = {
    async rpc(fn, args) {
      if (fn === "get_admin_access_membership") {
        const rpcArgs = args as {
          p_workspace_id: string;
          p_admin_user_id: string;
        };
        const rows = (tables.admin_access ?? []).filter(
          (row): row is Record<string, unknown> => {
            if (!row || typeof row !== "object" || Array.isArray(row)) {
              return false;
            }

            const record = row as Record<string, unknown>;

            return (
              record.linked_admin_user_id === rpcArgs.p_admin_user_id &&
              record.workspace_id === rpcArgs.p_workspace_id
            );
          }
        );

        return {
          data: rows,
          error: null
        };
      }

      return {
        data: {
          ok: true
        },
        error: null
      };
    },
    from(table: string) {
      return {
        select() {
          const filters: QueryCall["filters"] = [];
          const query = {
            eq(column: string, value: string) {
              filters.push({ column, value });
              return query;
            },
            async limit() {
              calls.push({
                table,
                filters: [...filters]
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

function createDecisionDependencies({
  authUserId = "auth-user-1",
  role = "admin",
  trustedWorkspaceId = "workspace-1"
}: {
  authUserId?: string | null;
  role?: "owner" | "admin" | "viewer";
  trustedWorkspaceId?: string | null;
} = {}) {
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
        role
      }
    ],
    admin_access: [
      {
        linked_admin_user_id: "admin-user-1",
        workspace_id: "workspace-1",
        normalized_email: "owner@example.com",
        status: "active",
        role: role === "viewer" ? "admin" : role
      }
    ]
  });

  return {
    calls,
    dependencies: {
      auth: {
        readConfig: () => configuredSupabase,
        readCookies: async () => [
          {
            name: "sb-project-auth-token",
            value: "cookie-token-value"
          }
        ],
        createAuthClient: () => ({
          auth: {
            async getUser() {
              return authUserId
                ? {
                    data: {
                      user: {
                        id: authUserId,
                        email: "owner@example.com",
                        app_metadata: {
                          provider: "google"
                        }
                      }
                    },
                    error: null
                  }
                : {
                    data: {
                      user: null
                    },
                    error: null
                  };
            }
          }
        })
      },
      readClient: {
        readConfig: () => configuredSupabase,
        readCookies: async () => [
          {
            name: "sb-project-auth-token",
            value: "cookie-token-value"
          }
        ],
        createReadClient: () => client
      },
      workspace: {
        trustedServerWorkspaceId: trustedWorkspaceId
      }
    }
  };
}

function expectUnavailable(result: ServerAdminAuthorizationDecisionResult) {
  expect(result).toEqual({
    resolved: false,
    allowed: false,
    reason: "admin_authorization_unavailable",
    statusCode: 503,
    requestId: "request-1"
  });
}

describe("server admin authorization decision boundary", () => {
  it("calls adapter-set composition and then resolveAdminAuthorizationWithAdapters", async () => {
    const calls: string[] = [];
    const adapters = createFakeAdapterSet();

    const result = await resolveServerAdminAuthorizationDecision(
      {
        requestedOperation: "product.write",
        requestId: "request-1"
      },
      {
        async createAdapterSet(adapterDependencies) {
          calls.push("compose");
          expect(adapterDependencies).toEqual({});

          return {
            configured: true,
            adapters
          };
        },
        async resolveWithAdapters(input, receivedAdapters) {
          calls.push("decision");
          expect(input).toEqual({
            requestedOperation: "product.write",
            requestId: "request-1"
          });
          expect(receivedAdapters).toBe(adapters);

          return {
            allowed: false,
            reason: "unauthenticated",
            statusCode: 401
          };
        }
      }
    );

    expect(calls).toEqual(["compose", "decision"]);
    expect(result).toEqual({
      allowed: false,
      reason: "unauthenticated",
      statusCode: 401
    });
  });

  it("fails closed safely when adapter-set composition is unavailable", async () => {
    const result = await resolveServerAdminAuthorizationDecision(
      {
        requestedOperation: "product.write",
        requestId: "request-1"
      },
      {
        async createAdapterSet() {
          return {
            configured: false,
            adapters: null,
            reason: "admin_authorization_adapter_set_unavailable"
          };
        }
      }
    );

    expectUnavailable(result);
  });

  it("denies anonymous or missing auth safely through the composed resolver path", async () => {
    const { dependencies } = createDecisionDependencies({
      authUserId: null
    });

    await expect(
      resolveServerAdminAuthorizationDecision(
        {
          requestedOperation: "product.write"
        },
        dependencies
      )
    ).resolves.toEqual({
      allowed: false,
      reason: "unauthenticated",
      statusCode: 401
    });
  });

  it("allows active admin membership for allowed admin operations", async () => {
    const { calls, dependencies } = createDecisionDependencies();

    await expect(
      resolveServerAdminAuthorizationDecision(
        {
          requestedOperation: "product.write",
          requestedRecordWorkspaceId: "workspace-1"
        },
        dependencies
      )
    ).resolves.toEqual({
      allowed: true,
      reason: "allowed",
      statusCode: 200,
      workspaceId: "workspace-1"
    });
    expect(calls.map(({ table }) => table)).toEqual([
      "admin_users",
      "memberships"
    ]);
  });

  it("blocks viewer memberships from launch admin access", async () => {
    const { dependencies } = createDecisionDependencies({
      role: "viewer"
    });

    await expect(
      resolveServerAdminAuthorizationDecision(
        {
          requestedOperation: "product.write",
          requestedRecordWorkspaceId: "workspace-1"
        },
        dependencies
      )
    ).resolves.toEqual({
      allowed: false,
      reason: "membership_missing",
      statusCode: 403
    });
  });

  it("allows owners for membership management through the existing policy path", async () => {
    const { dependencies } = createDecisionDependencies({
      role: "owner"
    });

    await expect(
      resolveServerAdminAuthorizationDecision(
        {
          requestedOperation: "membership.manage",
          requestedRecordWorkspaceId: "workspace-1"
        },
        dependencies
      )
    ).resolves.toEqual({
      allowed: true,
      reason: "allowed",
      statusCode: 200,
      workspaceId: "workspace-1"
    });
  });

  it("denies cross-workspace requested record mismatches", async () => {
    const { dependencies } = createDecisionDependencies();

    await expect(
      resolveServerAdminAuthorizationDecision(
        {
          requestedOperation: "product.write",
          requestedRecordWorkspaceId: "workspace-2"
        },
        dependencies
      )
    ).resolves.toEqual({
      allowed: false,
      reason: "workspace_mismatch",
      statusCode: 403
    });
  });

  it("fails closed safely when trusted server-side workspace input is missing", async () => {
    const { dependencies } = createDecisionDependencies({
      trustedWorkspaceId: null
    });

    const result = await resolveServerAdminAuthorizationDecision(
      {
        requestedOperation: "product.write",
        requestId: "request-1"
      },
      dependencies
    );

    expectUnavailable(result);
  });

  it("returns only a safe shape when provider dependencies throw", async () => {
    const result = await resolveServerAdminAuthorizationDecision(
      {
        requestedOperation: "product.write",
        requestId: "request-1"
      },
      {
        readClient: {
          readConfig: () => configuredSupabase,
          readCookies() {
            throw new Error(
              "cookie token env SQL provider stack membership admin-user-1 workspace-1"
            );
          },
          createReadClient: () => {
            throw new Error("read client should not be created");
          }
        },
        workspace: {
          trustedServerWorkspaceId: "workspace-1"
        }
      }
    );
    const serialized = JSON.stringify(result).toLowerCase();

    expectUnavailable(result);
    for (const term of [
      "cookie",
      "token",
      "env",
      "sql",
      "provider",
      "stack",
      "membership",
      "admin-user-1",
      "workspace-1"
    ]) {
      expect(serialized).not.toContain(term);
    }
  });

  it("returns only a safe shape when resolver dependencies throw", async () => {
    const result = await resolveServerAdminAuthorizationDecision(
      {
        requestedOperation: "product.write",
        requestId: "request-1"
      },
      {
        async createAdapterSet() {
          return {
            configured: true,
            adapters: createFakeAdapterSet()
          };
        },
        async resolveWithAdapters() {
          throw new Error(
            "Supabase SQL provider stack cookie token membership workspace-1"
          );
        }
      }
    );
    const serialized = JSON.stringify(result).toLowerCase();

    expectUnavailable(result);
    for (const term of [
      "supabase",
      "sql",
      "provider",
      "stack",
      "cookie",
      "token",
      "membership",
      "workspace-1"
    ]) {
      expect(serialized).not.toContain(term);
    }
  });

  it("keeps the decision boundary server-only and free of direct provider/runtime shortcuts", () => {
    const source = readSource();

    expect(source).toContain('import "server-only";');
    expect(source).toContain("createServerAdminAuthorizationAdapterSet");
    expect(source).toContain("resolveAdminAuthorizationWithAdapters");
    expect(source).not.toContain("authorizeAdminOperation");
    expect(source).not.toContain("roleOperationAccess");
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
    expect(source).not.toMatch(/from ["'][^"']*app\//m);
  });
});
