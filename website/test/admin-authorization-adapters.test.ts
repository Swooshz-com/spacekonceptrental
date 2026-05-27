import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import type {
  AdminAuthAdapter,
  AdminMembershipAdapter,
  AdminProfileAdapter,
  AdminWorkspaceResolver,
  ResolvedAdminIdentity,
  ResolvedAdminMembership,
  ResolvedAdminProfile
} from "../lib/admin/authorization/admin-authorization-adapters";
import {
  resolveAdminAuthorizationWithAdapters,
  type AdminAuthorizationAdapterSet
} from "../lib/admin/authorization/admin-authorization-resolver";

const repoRoot = resolve(process.cwd(), "..");
const adapterPath =
  "website/lib/admin/authorization/admin-authorization-adapters.ts";
const resolverPath =
  "website/lib/admin/authorization/admin-authorization-resolver.ts";
const activeWorkspaceId = "workspace-active";
const otherWorkspaceId = "workspace-other";

type FakeAdapterState = {
  identity: ResolvedAdminIdentity;
  profile: ResolvedAdminProfile | null;
  workspaceId: string | null;
  membership: ResolvedAdminMembership | null;
};

function createFakeAdapters(
  state: FakeAdapterState
): AdminAuthorizationAdapterSet {
  const auth: AdminAuthAdapter = {
    async resolveIdentity() {
      return state.identity;
    }
  };

  const profile: AdminProfileAdapter = {
    async resolveAdminProfile(_authUserId) {
      return state.profile;
    }
  };

  const workspace: AdminWorkspaceResolver = {
    async resolveWorkspaceForRequest(_input) {
      return {
        serverResolvedWorkspaceId: state.workspaceId
      };
    }
  };

  const membership: AdminMembershipAdapter = {
    async resolveMembership(_adminUserId, _serverResolvedWorkspaceId) {
      return state.membership;
    }
  };

  return {
    auth,
    profile,
    workspace,
    membership
  };
}

function createResolvedAdapters(
  overrides: Partial<FakeAdapterState> = {}
): AdminAuthorizationAdapterSet {
  return createFakeAdapters({
    identity: {
      authenticated: true,
      authUserId: "auth-user-1"
    },
    profile: {
      id: "admin-user-1",
      status: "active"
    },
    workspaceId: activeWorkspaceId,
    membership: {
      adminUserId: "admin-user-1",
      workspaceId: activeWorkspaceId,
      status: "active",
      role: "admin"
    },
    ...overrides
  });
}

async function resolveWith(overrides: Partial<FakeAdapterState> = {}) {
  return resolveAdminAuthorizationWithAdapters(
    {
      requestedOperation: "product.write",
      requestedRecordWorkspaceId: activeWorkspaceId,
      requestedWorkspaceIdForValidationOnly: otherWorkspaceId,
      requestId: "request-1"
    },
    createResolvedAdapters(overrides)
  );
}

describe("admin authorization adapter boundary", () => {
  it("keeps the adapter contract server-only and free of runtime integrations", () => {
    const adapterSource = readFileSync(resolve(repoRoot, adapterPath), "utf8");
    const resolverSource = readFileSync(resolve(repoRoot, resolverPath), "utf8");

    expect(adapterSource).toContain('import "server-only";');
    expect(adapterSource).not.toContain("@supabase/");
    expect(adapterSource).not.toContain("createServerSupabaseClient");
    expect(adapterSource).not.toContain("process.env");
    expect(adapterSource).not.toContain("cookies");
    expect(adapterSource).not.toContain("headers");
    expect(adapterSource).not.toMatch(/\bRequest\s*[<({]/);
    expect(adapterSource).not.toMatch(/\bResponse\s*[<({]/);
    expect(adapterSource).not.toContain("chat-config");
    expect(adapterSource).not.toContain(".insert(");
    expect(adapterSource).not.toContain(".update(");
    expect(adapterSource).not.toContain(".upsert(");
    expect(adapterSource).not.toContain(".delete(");
    expect(resolverSource).toContain("resolveAdminAuthorizationWithAdapters");
  });

  it("denies anonymous identities from fake adapters", async () => {
    await expect(
      resolveWith({
        identity: {
          authenticated: false
        }
      })
    ).resolves.toEqual({
      allowed: false,
      reason: "unauthenticated",
      statusCode: 401
    });
  });

  it("denies missing admin profiles from fake adapters", async () => {
    await expect(resolveWith({ profile: null })).resolves.toEqual({
      allowed: false,
      reason: "admin_profile_missing",
      statusCode: 403
    });
  });

  it("denies inactive admin profiles from fake adapters", async () => {
    await expect(
      resolveWith({
        profile: {
          id: "admin-user-1",
          status: "inactive"
        }
      })
    ).resolves.toEqual({
      allowed: false,
      reason: "admin_profile_inactive",
      statusCode: 403
    });
  });

  it("denies missing workspace resolution from fake adapters", async () => {
    await expect(resolveWith({ workspaceId: null })).resolves.toEqual({
      allowed: false,
      reason: "workspace_missing",
      statusCode: 403
    });
  });

  it("denies missing memberships from fake adapters", async () => {
    await expect(resolveWith({ membership: null })).resolves.toEqual({
      allowed: false,
      reason: "membership_missing",
      statusCode: 403
    });
  });

  it("denies inactive memberships from fake adapters", async () => {
    await expect(
      resolveWith({
        membership: {
          adminUserId: "admin-user-1",
          workspaceId: activeWorkspaceId,
          status: "inactive",
          role: "admin"
        }
      })
    ).resolves.toEqual({
      allowed: false,
      reason: "membership_inactive",
      statusCode: 403
    });
  });

  it("denies cross-workspace memberships from fake adapters", async () => {
    await expect(
      resolveWith({
        membership: {
          adminUserId: "admin-user-1",
          workspaceId: otherWorkspaceId,
          status: "active",
          role: "admin"
        }
      })
    ).resolves.toEqual({
      allowed: false,
      reason: "workspace_mismatch",
      statusCode: 403
    });
  });

  it("denies memberships owned by another admin from fake adapters", async () => {
    await expect(
      resolveWith({
        membership: {
          adminUserId: "admin-user-2",
          workspaceId: activeWorkspaceId,
          status: "active",
          role: "owner"
        }
      })
    ).resolves.toEqual({
      allowed: false,
      reason: "membership_actor_mismatch",
      statusCode: 403
    });
  });

  it("denies viewers for product writes from fake adapters", async () => {
    await expect(
      resolveWith({
        membership: {
          adminUserId: "admin-user-1",
          workspaceId: activeWorkspaceId,
          status: "active",
          role: "viewer"
        }
      })
    ).resolves.toEqual({
      allowed: false,
      reason: "role_not_allowed",
      statusCode: 403
    });
  });

  it("allows admins for same-workspace product-write policy decisions from fake adapters", async () => {
    await expect(resolveWith()).resolves.toEqual({
      allowed: true,
      reason: "allowed",
      statusCode: 200,
      workspaceId: activeWorkspaceId
    });
  });

  it("allows owners for same-workspace membership-management policy decisions from fake adapters", async () => {
    await expect(
      resolveAdminAuthorizationWithAdapters(
        {
          requestedOperation: "membership.manage",
          requestedRecordWorkspaceId: activeWorkspaceId
        },
        createResolvedAdapters({
          membership: {
            adminUserId: "admin-user-1",
            workspaceId: activeWorkspaceId,
            status: "active",
            role: "owner"
          }
        })
      )
    ).resolves.toEqual({
      allowed: true,
      reason: "allowed",
      statusCode: 200,
      workspaceId: activeWorkspaceId
    });
  });

  it("denies unsupported operations closed from fake adapters", async () => {
    await expect(
      resolveAdminAuthorizationWithAdapters(
        {
          requestedOperation: "billing.manage",
          requestedRecordWorkspaceId: activeWorkspaceId
        },
        createResolvedAdapters()
      )
    ).resolves.toEqual({
      allowed: false,
      reason: "operation_not_supported",
      statusCode: 400
    });
  });

  it("keeps deny responses boring and safe", async () => {
    const decisions = await Promise.all([
      resolveWith({
        identity: {
          authenticated: false
        }
      }),
      resolveWith({ profile: null }),
      resolveWith({ membership: null }),
      resolveWith({
        membership: {
          adminUserId: "admin-user-1",
          workspaceId: otherWorkspaceId,
          status: "active",
          role: "admin"
        }
      }),
      resolveAdminAuthorizationWithAdapters(
        {
          requestedOperation: "billing.manage",
          requestedRecordWorkspaceId: activeWorkspaceId
        },
        createResolvedAdapters()
      )
    ]);
    const serialized = JSON.stringify(decisions).toLowerCase();

    expect(serialized).not.toContain("secret");
    expect(serialized).not.toContain("env");
    expect(serialized).not.toContain("supabase");
    expect(serialized).not.toContain("sql");
    expect(serialized).not.toContain("cookie");
    expect(serialized).not.toContain("header");
    expect(serialized).not.toContain("stack");
    expect(serialized).not.toContain("n8n");
    expect(serialized).not.toContain("customer");
    expect(serialized).not.toContain(activeWorkspaceId);
    expect(serialized).not.toContain(otherWorkspaceId);
  });
});
