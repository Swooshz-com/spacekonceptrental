import { describe, expect, it, vi } from "vitest";
import {
  resolveServerAdminCsrfProofSessionWorkspaceBinding,
  type ServerAdminCsrfProofSessionWorkspaceBindingDeriverInput
} from "./server-admin-csrf-proof-session-workspace-binding";
import type { AdminAuthorizationAdapterSet } from "./admin-authorization-resolver";
import type { AdminRole } from "./admin-authorization-policy";

type BindingScenario = {
  authUserId?: string | null;
  authenticated?: boolean;
  adminUser?: {
    id: string;
    status: "active" | "inactive";
  } | null;
  workspaceId?: string | null;
  membership?: {
    adminUserId: string;
    workspaceId: string;
    status: "active" | "inactive";
    role: AdminRole;
  } | null;
};

function createAdapterSet({
  authUserId = "auth-user-1",
  authenticated = true,
  adminUser = {
    id: "admin-user-1",
    status: "active"
  },
  workspaceId = "workspace-1",
  membership = {
    adminUserId: "admin-user-1",
    workspaceId: "workspace-1",
    status: "active",
    role: "admin"
  }
}: BindingScenario = {}): AdminAuthorizationAdapterSet {
  return {
    auth: {
      resolveIdentity: vi.fn(async () => ({
        authenticated,
        ...(authUserId ? { authUserId } : {})
      }))
    },
    profile: {
      resolveAdminProfile: vi.fn(async () => adminUser)
    },
    workspace: {
      resolveWorkspaceForRequest: vi.fn(async () => ({
        serverResolvedWorkspaceId: workspaceId
      }))
    },
    membership: {
      resolveMembership: vi.fn(async () => membership)
    }
  };
}

function createConfiguredAdapters(scenario: BindingScenario = {}) {
  return vi.fn(async () => ({
    configured: true as const,
    adapters: createAdapterSet(scenario)
  }));
}

function createBindingDeriver(value = "opaque-session-workspace-binding") {
  return vi.fn(
    async (_input: ServerAdminCsrfProofSessionWorkspaceBindingDeriverInput) =>
      value
  );
}

describe("resolveServerAdminCsrfProofSessionWorkspaceBinding", () => {
  it.each<AdminRole>(["owner", "admin"])(
    "binds a %s session to the trusted workspace with an opaque output",
    async (role) => {
      const deriveSessionWorkspaceBinding = createBindingDeriver();

      const result = await resolveServerAdminCsrfProofSessionWorkspaceBinding(
        {
          requestedOperation: "product.write",
          requestId: "request-1"
        },
        {
          createAdapterSet: createConfiguredAdapters({
            membership: {
              adminUserId: "admin-user-1",
              workspaceId: "workspace-1",
              status: "active",
              role
            }
          }),
          deriveSessionWorkspaceBinding
        }
      );

      expect(result).toStrictEqual({
        bound: true,
        sessionBinding: "opaque-session-workspace-binding",
        requestId: "request-1"
      });
      expect(result).not.toHaveProperty("authUserId");
      expect(result).not.toHaveProperty("adminUser");
      expect(result).not.toHaveProperty("workspaceId");
      expect(result).not.toHaveProperty("membership");
      expect(deriveSessionWorkspaceBinding).toHaveBeenCalledWith({
        requestedOperation: "product.write",
        authUserId: "auth-user-1",
        adminUserId: "admin-user-1",
        workspaceId: "workspace-1",
        membershipRole: role,
        requestId: "request-1"
      });
    }
  );

  it("denies viewer membership for state-changing proof binding", async () => {
    const result = await resolveServerAdminCsrfProofSessionWorkspaceBinding(
      {
        requestedOperation: "product.write"
      },
      {
        createAdapterSet: createConfiguredAdapters({
          membership: {
            adminUserId: "admin-user-1",
            workspaceId: "workspace-1",
            status: "active",
            role: "viewer"
          }
        }),
        deriveSessionWorkspaceBinding: createBindingDeriver()
      }
    );

    expect(result).toStrictEqual({
      bound: false,
      reason: "role_not_allowed",
      statusCode: 403
    });
  });

  it("denies missing session", async () => {
    const result = await resolveServerAdminCsrfProofSessionWorkspaceBinding(
      {
        requestedOperation: "product.write"
      },
      {
        createAdapterSet: createConfiguredAdapters({
          authenticated: false,
          authUserId: null
        }),
        deriveSessionWorkspaceBinding: createBindingDeriver()
      }
    );

    expect(result).toStrictEqual({
      bound: false,
      reason: "unauthenticated",
      statusCode: 401
    });
  });

  it("denies missing admin profile", async () => {
    const result = await resolveServerAdminCsrfProofSessionWorkspaceBinding(
      {
        requestedOperation: "product.write"
      },
      {
        createAdapterSet: createConfiguredAdapters({
          adminUser: null
        }),
        deriveSessionWorkspaceBinding: createBindingDeriver()
      }
    );

    expect(result).toStrictEqual({
      bound: false,
      reason: "admin_profile_missing",
      statusCode: 403
    });
  });

  it("denies inactive admin profile", async () => {
    const result = await resolveServerAdminCsrfProofSessionWorkspaceBinding(
      {
        requestedOperation: "product.write"
      },
      {
        createAdapterSet: createConfiguredAdapters({
          adminUser: {
            id: "admin-user-1",
            status: "inactive"
          }
        }),
        deriveSessionWorkspaceBinding: createBindingDeriver()
      }
    );

    expect(result).toStrictEqual({
      bound: false,
      reason: "admin_profile_inactive",
      statusCode: 403
    });
  });

  it("denies missing membership", async () => {
    const result = await resolveServerAdminCsrfProofSessionWorkspaceBinding(
      {
        requestedOperation: "product.write"
      },
      {
        createAdapterSet: createConfiguredAdapters({
          membership: null
        }),
        deriveSessionWorkspaceBinding: createBindingDeriver()
      }
    );

    expect(result).toStrictEqual({
      bound: false,
      reason: "membership_missing",
      statusCode: 403
    });
  });

  it("denies inactive membership", async () => {
    const result = await resolveServerAdminCsrfProofSessionWorkspaceBinding(
      {
        requestedOperation: "product.write"
      },
      {
        createAdapterSet: createConfiguredAdapters({
          membership: {
            adminUserId: "admin-user-1",
            workspaceId: "workspace-1",
            status: "inactive",
            role: "admin"
          }
        }),
        deriveSessionWorkspaceBinding: createBindingDeriver()
      }
    );

    expect(result).toStrictEqual({
      bound: false,
      reason: "membership_inactive",
      statusCode: 403
    });
  });

  it("denies wrong workspace", async () => {
    const result = await resolveServerAdminCsrfProofSessionWorkspaceBinding(
      {
        requestedOperation: "product.write"
      },
      {
        createAdapterSet: createConfiguredAdapters({
          membership: {
            adminUserId: "admin-user-1",
            workspaceId: "workspace-2",
            status: "active",
            role: "admin"
          }
        }),
        deriveSessionWorkspaceBinding: createBindingDeriver()
      }
    );

    expect(result).toStrictEqual({
      bound: false,
      reason: "workspace_mismatch",
      statusCode: 403
    });
  });

  it("denies missing trusted workspace", async () => {
    const result = await resolveServerAdminCsrfProofSessionWorkspaceBinding(
      {
        requestedOperation: "product.write"
      },
      {
        createAdapterSet: createConfiguredAdapters({
          workspaceId: null
        }),
        deriveSessionWorkspaceBinding: createBindingDeriver()
      }
    );

    expect(result).toStrictEqual({
      bound: false,
      reason: "workspace_missing",
      statusCode: 403
    });
  });

  it("denies unresolved workspace binding dependencies", async () => {
    const result = await resolveServerAdminCsrfProofSessionWorkspaceBinding(
      {
        requestedOperation: "product.write"
      },
      {
        createAdapterSet: vi.fn(async () => ({
          configured: false as const,
          adapters: null,
          reason: "admin_authorization_adapter_set_unavailable" as const
        })),
        deriveSessionWorkspaceBinding: createBindingDeriver()
      }
    );

    expect(result).toStrictEqual({
      bound: false,
      reason: "admin_csrf_session_workspace_binding_unavailable",
      statusCode: 503
    });
  });

  it("denies unsafe fallback binding when no deriver is injected", async () => {
    const result = await resolveServerAdminCsrfProofSessionWorkspaceBinding(
      {
        requestedOperation: "product.write"
      },
      {
        createAdapterSet: createConfiguredAdapters()
      }
    );

    expect(result).toStrictEqual({
      bound: false,
      reason: "session_workspace_binding_deriver_unavailable",
      statusCode: 503
    });
  });

  it("denies blank derived bindings instead of returning raw fallback values", async () => {
    const result = await resolveServerAdminCsrfProofSessionWorkspaceBinding(
      {
        requestedOperation: "product.write"
      },
      {
        createAdapterSet: createConfiguredAdapters(),
        deriveSessionWorkspaceBinding: createBindingDeriver("  ")
      }
    );

    expect(result).toStrictEqual({
      bound: false,
      reason: "session_workspace_binding_derivation_failed",
      statusCode: 503
    });
  });
});
