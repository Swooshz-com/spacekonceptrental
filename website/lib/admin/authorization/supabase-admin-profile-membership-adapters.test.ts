import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  createSupabaseAdminMembershipAdapter,
  createSupabaseAdminProfileAdapter,
  resolveSupabaseAdminMembership,
  resolveSupabaseAdminProfile,
  type SupabaseAdminReadClientResult
} from "./supabase-admin-profile-membership-adapters";

type QueryCall = {
  table: string;
  columns: string;
  filters: Array<{
    column: string;
    value: string;
  }>;
  limit: number;
};

type MockTableResult = {
  data?: unknown;
  error?: unknown;
  throwOnLimit?: unknown;
};

const sourcePath = resolve(
  process.cwd(),
  "lib/admin/authorization/supabase-admin-profile-membership-adapters.ts"
);

function readSource() {
  return readFileSync(sourcePath, "utf8");
}

function createMockSupabase(
  tables: Record<string, MockTableResult>
): {
  calls: QueryCall[];
  supabase: SupabaseAdminReadClientResult;
} {
  const calls: QueryCall[] = [];

  return {
    calls,
    supabase: {
      configured: true,
      missingEnv: [],
      client: {
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

                  const result = tables[table] ?? { data: [] };

                  if (result.throwOnLimit) {
                    throw result.throwOnLimit;
                  }

                  return {
                    data: result.data ?? [],
                    error: result.error ?? null
                  };
                }
              };

              return query;
            }
          };
        }
      }
    }
  };
}

describe("Supabase admin profile adapter", () => {
  it("resolves an active exact admin profile into the safe adapter shape", async () => {
    const { calls, supabase } = createMockSupabase({
      admin_users: {
        data: [
          {
            id: " admin-user-1 ",
            auth_user_id: " auth-user-1 ",
            status: "active"
          }
        ]
      }
    });

    await expect(
      resolveSupabaseAdminProfile(" auth-user-1 ", { supabase })
    ).resolves.toEqual({
      id: "admin-user-1",
      status: "active"
    });
    expect(calls).toEqual([
      {
        table: "admin_users",
        columns: "id, auth_user_id, status",
        filters: [{ column: "auth_user_id", value: "auth-user-1" }],
        limit: 2
      }
    ]);

    const adapter = createSupabaseAdminProfileAdapter({ supabase });

    await expect(adapter.resolveAdminProfile("auth-user-1")).resolves.toEqual({
      id: "admin-user-1",
      status: "active"
    });
  });

  it("fails closed when the admin profile is missing", async () => {
    const { supabase } = createMockSupabase({
      admin_users: {
        data: []
      }
    });

    await expect(
      resolveSupabaseAdminProfile("auth-user-1", { supabase })
    ).resolves.toBeNull();
  });

  it("fails closed when the admin profile is inactive", async () => {
    const { supabase } = createMockSupabase({
      admin_users: {
        data: [
          {
            id: "admin-user-1",
            auth_user_id: "auth-user-1",
            status: "inactive"
          }
        ]
      }
    });

    await expect(
      resolveSupabaseAdminProfile("auth-user-1", { supabase })
    ).resolves.toBeNull();
  });

  it("fails closed for duplicate and non-exact admin profile results", async () => {
    const duplicate = createMockSupabase({
      admin_users: {
        data: [
          {
            id: "admin-user-1",
            auth_user_id: "auth-user-1",
            status: "active"
          },
          {
            id: "admin-user-duplicate",
            auth_user_id: "auth-user-1",
            status: "active"
          }
        ]
      }
    });
    const nonExact = createMockSupabase({
      admin_users: {
        data: [
          {
            id: "admin-user-2",
            auth_user_id: "auth-user-2",
            status: "active"
          }
        ]
      }
    });

    await expect(
      resolveSupabaseAdminProfile("auth-user-1", duplicate)
    ).resolves.toBeNull();
    await expect(
      resolveSupabaseAdminProfile("auth-user-1", nonExact)
    ).resolves.toBeNull();
  });

  it("fails closed without an explicitly injected authenticated admin-read client", async () => {
    await expect(
      resolveSupabaseAdminProfile("auth-user-1")
    ).resolves.toBeNull();
  });

  it("fails closed for query and provider errors without leaking internals", async () => {
    const leakyMessage =
      "select failed with SQL and SUPABASE_SERVICE_ROLE_KEY=secret";
    const queryError = createMockSupabase({
      admin_users: {
        error: {
          message: leakyMessage
        }
      }
    });
    const providerError = createMockSupabase({
      admin_users: {
        throwOnLimit: new Error(leakyMessage)
      }
    });

    const queryResult = await resolveSupabaseAdminProfile("auth-user-1", queryError);
    const providerResult = await resolveSupabaseAdminProfile(
      "auth-user-1",
      providerError
    );
    const serialized = JSON.stringify([queryResult, providerResult]);

    expect(queryResult).toBeNull();
    expect(providerResult).toBeNull();
    expect(serialized).not.toContain("SQL");
    expect(serialized).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(serialized).not.toContain("secret");
  });
});

describe("Supabase admin membership adapter", () => {
  it("resolves an active exact workspace membership into the safe adapter shape", async () => {
    const { calls, supabase } = createMockSupabase({
      memberships: {
        data: [
          {
            admin_user_id: " admin-user-1 ",
            workspace_id: " workspace-1 ",
            status: "active",
            role: "admin"
          }
        ]
      }
    });

    await expect(
      resolveSupabaseAdminMembership(" admin-user-1 ", " workspace-1 ", {
        supabase
      })
    ).resolves.toEqual({
      adminUserId: "admin-user-1",
      workspaceId: "workspace-1",
      status: "active",
      role: "admin"
    });
    expect(calls).toEqual([
      {
        table: "memberships",
        columns: "admin_user_id, workspace_id, status, role",
        filters: [
          { column: "admin_user_id", value: "admin-user-1" },
          { column: "workspace_id", value: "workspace-1" }
        ],
        limit: 2
      }
    ]);

    const adapter = createSupabaseAdminMembershipAdapter({ supabase });

    await expect(
      adapter.resolveMembership("admin-user-1", "workspace-1")
    ).resolves.toEqual({
      adminUserId: "admin-user-1",
      workspaceId: "workspace-1",
      status: "active",
      role: "admin"
    });
  });

  it("fails closed when the membership is missing", async () => {
    const { supabase } = createMockSupabase({
      memberships: {
        data: []
      }
    });

    await expect(
      resolveSupabaseAdminMembership("admin-user-1", "workspace-1", {
        supabase
      })
    ).resolves.toBeNull();
  });

  it("fails closed when the membership is inactive", async () => {
    const { supabase } = createMockSupabase({
      memberships: {
        data: [
          {
            admin_user_id: "admin-user-1",
            workspace_id: "workspace-1",
            status: "suspended",
            role: "admin"
          }
        ]
      }
    });

    await expect(
      resolveSupabaseAdminMembership("admin-user-1", "workspace-1", {
        supabase
      })
    ).resolves.toBeNull();
  });

  it("fails closed when the returned membership belongs to the wrong actor", async () => {
    const { supabase } = createMockSupabase({
      memberships: {
        data: [
          {
            admin_user_id: "admin-user-2",
            workspace_id: "workspace-1",
            status: "active",
            role: "owner"
          }
        ]
      }
    });

    await expect(
      resolveSupabaseAdminMembership("admin-user-1", "workspace-1", {
        supabase
      })
    ).resolves.toBeNull();
  });

  it("fails closed when the returned membership belongs to another workspace", async () => {
    const { supabase } = createMockSupabase({
      memberships: {
        data: [
          {
            admin_user_id: "admin-user-1",
            workspace_id: "workspace-2",
            status: "active",
            role: "owner"
          }
        ]
      }
    });

    await expect(
      resolveSupabaseAdminMembership("admin-user-1", "workspace-1", {
        supabase
      })
    ).resolves.toBeNull();
  });

  it("fails closed for duplicate membership results", async () => {
    const { supabase } = createMockSupabase({
      memberships: {
        data: [
          {
            admin_user_id: "admin-user-1",
            workspace_id: "workspace-1",
            status: "active",
            role: "admin"
          },
          {
            admin_user_id: "admin-user-1",
            workspace_id: "workspace-1",
            status: "active",
            role: "viewer"
          }
        ]
      }
    });

    await expect(
      resolveSupabaseAdminMembership("admin-user-1", "workspace-1", {
        supabase
      })
    ).resolves.toBeNull();
  });

  it("fails closed without an explicitly injected authenticated admin-read client", async () => {
    await expect(
      resolveSupabaseAdminMembership("admin-user-1", "workspace-1")
    ).resolves.toBeNull();
  });

  it("fails closed for query and provider errors without leaking internals", async () => {
    const leakyMessage =
      "membership select failed with SQL and provider stack secret";
    const queryError = createMockSupabase({
      memberships: {
        error: {
          message: leakyMessage
        }
      }
    });
    const providerError = createMockSupabase({
      memberships: {
        throwOnLimit: new Error(leakyMessage)
      }
    });

    const queryResult = await resolveSupabaseAdminMembership(
      "admin-user-1",
      "workspace-1",
      queryError
    );
    const providerResult = await resolveSupabaseAdminMembership(
      "admin-user-1",
      "workspace-1",
      providerError
    );
    const serialized = JSON.stringify([queryResult, providerResult]);

    expect(queryResult).toBeNull();
    expect(providerResult).toBeNull();
    expect(serialized).not.toContain("SQL");
    expect(serialized).not.toContain("provider stack");
    expect(serialized).not.toContain("secret");
  });

  it("keeps profile and membership reads inside a server-only Supabase boundary", () => {
    const source = readSource();

    expect(source).toContain('import "server-only";');
    expect(source).not.toContain("createServerSupabaseClient");
    expect(source).not.toContain("../supabase/server");
    expect(source).toContain('from("admin_users")');
    expect(source).toContain('from("memberships")');
    expect(source).toContain('select("id, auth_user_id, status")');
    expect(source).toContain(
      'select("admin_user_id, workspace_id, status, role")'
    );
    expect(source).not.toContain("next/headers");
    expect(source).not.toContain("cookies()");
    expect(source).not.toContain("headers()");
    expect(source).not.toContain("auth.getUser()");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("chat-config");
    expect(source).not.toContain(".insert(");
    expect(source).not.toContain(".update(");
    expect(source).not.toContain(".upsert(");
    expect(source).not.toContain(".delete(");
  });
});
