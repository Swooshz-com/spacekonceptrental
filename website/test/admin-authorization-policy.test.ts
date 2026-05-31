import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  authorizeAdminOperation,
  isSupportedAdminOperation,
  type AdminAuthorizationInput,
  type AdminOperation
} from "../lib/admin/authorization/admin-authorization-policy";

const repoRoot = resolve(process.cwd(), "..");
const policyPath =
  "website/lib/admin/authorization/admin-authorization-policy.ts";
const activeWorkspaceId = "workspace-active";
const otherWorkspaceId = "workspace-other";

const baseInput: AdminAuthorizationInput = {
  authenticated: true,
  adminUser: {
    id: "admin-user-1",
    status: "active"
  },
  serverResolvedWorkspaceId: activeWorkspaceId,
  membership: {
    adminUserId: "admin-user-1",
    workspaceId: activeWorkspaceId,
    status: "active",
    role: "admin"
  },
  operation: "catalogue.read"
};

function authorize(overrides: Partial<AdminAuthorizationInput>) {
  return authorizeAdminOperation({
    ...baseInput,
    ...overrides
  });
}

describe("admin authorization policy", () => {
  it("denies anonymous requests", () => {
    expect(authorize({ authenticated: false })).toEqual({
      allowed: false,
      reason: "unauthenticated",
      statusCode: 401
    });
  });

  it("denies missing admin profiles", () => {
    expect(authorize({ adminUser: null })).toEqual({
      allowed: false,
      reason: "admin_profile_missing",
      statusCode: 403
    });
  });

  it("denies inactive admin profiles", () => {
    expect(
      authorize({
        adminUser: {
          id: "admin-user-1",
          status: "inactive"
        }
      })
    ).toEqual({
      allowed: false,
      reason: "admin_profile_inactive",
      statusCode: 403
    });
  });

  it("denies missing memberships", () => {
    expect(authorize({ membership: null })).toEqual({
      allowed: false,
      reason: "membership_missing",
      statusCode: 403
    });
  });

  it("denies inactive memberships", () => {
    expect(
      authorize({
        membership: {
          adminUserId: "admin-user-1",
          workspaceId: activeWorkspaceId,
          status: "inactive",
          role: "admin"
        }
      })
    ).toEqual({
      allowed: false,
      reason: "membership_inactive",
      statusCode: 403
    });
  });

  it("denies cross-workspace requests", () => {
    expect(
      authorize({
        membership: {
          adminUserId: "admin-user-1",
          workspaceId: otherWorkspaceId,
          status: "active",
          role: "admin"
        }
      })
    ).toEqual({
      allowed: false,
      reason: "workspace_mismatch",
      statusCode: 403
    });
  });

  it("denies memberships without an admin user binding", () => {
    const unboundMembership = {
      workspaceId: activeWorkspaceId,
      status: "active" as const,
      role: "owner" as const
    };

    expect(
      authorize({
        operation: "membership.manage",
        membership: unboundMembership as AdminAuthorizationInput["membership"]
      })
    ).toEqual({
      allowed: false,
      reason: "membership_actor_mismatch",
      statusCode: 403
    });
  });

  it("denies memberships that are not owned by the active admin user", () => {
    const anotherUsersMembership = {
      adminUserId: "admin-user-2",
      workspaceId: activeWorkspaceId,
      status: "active" as const,
      role: "owner" as const
    };

    expect(
      authorize({
        operation: "membership.manage",
        membership: anotherUsersMembership
      })
    ).toEqual({
      allowed: false,
      reason: "membership_actor_mismatch",
      statusCode: 403
    });
  });

  it("denies requested record workspace mismatches", () => {
    expect(
      authorize({
        requestedRecordWorkspaceId: otherWorkspaceId
      })
    ).toEqual({
      allowed: false,
      reason: "workspace_mismatch",
      statusCode: 403
    });
  });

  it("allows viewers only for catalogue reads", () => {
    expect(
      authorize({
        membership: {
          adminUserId: "admin-user-1",
          workspaceId: activeWorkspaceId,
          status: "active",
          role: "viewer"
        },
        operation: "catalogue.read"
      })
    ).toEqual({
      allowed: true,
      reason: "allowed",
      statusCode: 200,
      workspaceId: activeWorkspaceId
    });

    expect(
      authorize({
        membership: {
          adminUserId: "admin-user-1",
          workspaceId: activeWorkspaceId,
          status: "active",
          role: "viewer"
        },
        operation: "product.write"
      })
    ).toEqual({
      allowed: false,
      reason: "role_not_allowed",
      statusCode: 403
    });
  });

  it.each<AdminOperation>([
    "product.write",
    "category.write",
    "productImage.write"
  ])(
    "allows admins to pass future %s policy only with active same-workspace membership",
    (operation) => {
      expect(
        authorize({
          operation,
          membership: {
            adminUserId: "admin-user-1",
            workspaceId: activeWorkspaceId,
            status: "active",
            role: "admin"
          }
        })
      ).toEqual({
        allowed: true,
        reason: "allowed",
        statusCode: 200,
        workspaceId: activeWorkspaceId
      });
    }
  );

  it("denies admins for membership management", () => {
    expect(
      authorize({
        operation: "membership.manage",
        membership: {
          adminUserId: "admin-user-1",
          workspaceId: activeWorkspaceId,
          status: "active",
          role: "admin"
        }
      })
    ).toEqual({
      allowed: false,
      reason: "role_not_allowed",
      statusCode: 403
    });
  });

  it("allows owners to manage membership only with active same-workspace membership", () => {
    expect(
      authorize({
        operation: "membership.manage",
        membership: {
          adminUserId: "admin-user-1",
          workspaceId: activeWorkspaceId,
          status: "active",
          role: "owner"
        }
      })
    ).toEqual({
      allowed: true,
      reason: "allowed",
      statusCode: 200,
      workspaceId: activeWorkspaceId
    });
  });

  describe("admin.csrf.issue", () => {
    it("is a supported admin operation", () => {
      expect(isSupportedAdminOperation("admin.csrf.issue")).toBe(true);
    });

    it.each(["owner", "admin"] as const)(
      "allows active %s membership",
      (role) => {
        expect(
          authorize({
            operation: "admin.csrf.issue",
            membership: {
              adminUserId: "admin-user-1",
              workspaceId: activeWorkspaceId,
              status: "active",
              role
            }
          })
        ).toEqual({
          allowed: true,
          reason: "allowed",
          statusCode: 200,
          workspaceId: activeWorkspaceId
        });
      }
    );

    it("denies viewer membership", () => {
      expect(
        authorize({
          operation: "admin.csrf.issue",
          membership: {
            adminUserId: "admin-user-1",
            workspaceId: activeWorkspaceId,
            status: "active",
            role: "viewer"
          }
        })
      ).toEqual({
        allowed: false,
        reason: "role_not_allowed",
        statusCode: 403
      });
    });
  });

  describe("admin.auth.check", () => {
    it("is a supported admin operation", () => {
      expect(isSupportedAdminOperation("admin.auth.check")).toBe(true);
    });

    it.each(["owner", "admin", "viewer"] as const)(
      "allows active %s membership",
      (role) => {
        expect(
          authorize({
            operation: "admin.auth.check",
            membership: {
              adminUserId: "admin-user-1",
              workspaceId: activeWorkspaceId,
              status: "active",
              role
            }
          })
        ).toEqual({
          allowed: true,
          reason: "allowed",
          statusCode: 200,
          workspaceId: activeWorkspaceId
        });
      }
    );

    it("denies unauthenticated user", () => {
      expect(
        authorize({ operation: "admin.auth.check", authenticated: false })
      ).toEqual({
        allowed: false,
        reason: "unauthenticated",
        statusCode: 401
      });
    });

    it("denies missing admin profile", () => {
      expect(
        authorize({ operation: "admin.auth.check", adminUser: null })
      ).toEqual({
        allowed: false,
        reason: "admin_profile_missing",
        statusCode: 403
      });
    });

    it("denies inactive admin profile", () => {
      expect(
        authorize({
          operation: "admin.auth.check",
          adminUser: { id: "admin-user-1", status: "inactive" }
        })
      ).toEqual({
        allowed: false,
        reason: "admin_profile_inactive",
        statusCode: 403
      });
    });

    it("denies missing workspace", () => {
      expect(
        authorize({
          operation: "admin.auth.check",
          serverResolvedWorkspaceId: undefined
        })
      ).toEqual({
        allowed: false,
        reason: "workspace_missing",
        statusCode: 403
      });
    });

    it("denies missing membership", () => {
      expect(
        authorize({ operation: "admin.auth.check", membership: null })
      ).toEqual({
        allowed: false,
        reason: "membership_missing",
        statusCode: 403
      });
    });

    it("denies inactive membership", () => {
      expect(
        authorize({
          operation: "admin.auth.check",
          membership: {
            adminUserId: "admin-user-1",
            workspaceId: activeWorkspaceId,
            status: "inactive",
            role: "owner"
          }
        })
      ).toEqual({
        allowed: false,
        reason: "membership_inactive",
        statusCode: 403
      });
    });

    it("denies membership actor mismatch", () => {
      expect(
        authorize({
          operation: "admin.auth.check",
          membership: {
            adminUserId: "admin-user-2",
            workspaceId: activeWorkspaceId,
            status: "active",
            role: "owner"
          }
        })
      ).toEqual({
        allowed: false,
        reason: "membership_actor_mismatch",
        statusCode: 403
      });
    });

    it("denies workspace mismatch", () => {
      expect(
        authorize({
          operation: "admin.auth.check",
          membership: {
            adminUserId: "admin-user-1",
            workspaceId: otherWorkspaceId,
            status: "active",
            role: "owner"
          }
        })
      ).toEqual({
        allowed: false,
        reason: "workspace_mismatch",
        statusCode: 403
      });
    });
  });

  it("denies unsupported operations closed", () => {
    expect(
      authorize({
        operation: "billing.manage"
      })
    ).toEqual({
      allowed: false,
      reason: "operation_not_supported",
      statusCode: 400
    });
  });

  it("keeps deny responses boring and safe", () => {
    const decisions = [
      authorize({ authenticated: false }),
      authorize({ adminUser: null }),
      authorize({ membership: null }),
      authorize({ requestedRecordWorkspaceId: otherWorkspaceId }),
      authorize({ operation: "billing.manage" })
    ];
    const serialized = JSON.stringify(decisions).toLowerCase();

    expect(serialized).not.toContain("secret");
    expect(serialized).not.toContain("env");
    expect(serialized).not.toContain("supabase");
    expect(serialized).not.toContain("sql");
    expect(serialized).not.toContain("cookie");
    expect(serialized).not.toContain("stack");
    expect(serialized).not.toContain("n8n");
    expect(serialized).not.toContain(activeWorkspaceId);
    expect(serialized).not.toContain(otherWorkspaceId);
  });

  it("stays pure server-only policy code without runtime integrations", () => {
    const source = readFileSync(resolve(repoRoot, policyPath), "utf8");

    expect(source).toContain('import "server-only";');
    expect(source).not.toContain("@supabase/");
    expect(source).not.toContain("createServerSupabaseClient");
    expect(source).not.toContain("process.env");
    expect(source).not.toContain("cookies");
    expect(source).not.toContain("headers");
    expect(source).not.toContain("Request");
    expect(source).not.toContain("Response");
    expect(source).not.toContain("chat-config");
  });
});
