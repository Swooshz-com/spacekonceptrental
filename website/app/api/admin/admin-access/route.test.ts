import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { executeAdminAccessMutation } from "../../../../lib/admin/access/admin-access-management";
import { resolveServerAdminCsrfProofSessionWorkspaceBinding } from "../../../../lib/admin/authorization/server-admin-csrf-proof-session-workspace-binding";
import { resolveServerAdminRuntimeRouteGateAdapter } from "../../../../lib/admin/authorization/server-admin-runtime-route-gate-adapter";
import { POST } from "./route";

vi.mock("../../../../lib/admin/access/admin-access-management", async () => {
  const actual = await vi.importActual<
    typeof import("../../../../lib/admin/access/admin-access-management")
  >("../../../../lib/admin/access/admin-access-management");

  return {
    ...actual,
    executeAdminAccessMutation: vi.fn()
  };
});
vi.mock(
  "../../../../lib/admin/authorization/server-admin-csrf-proof-session-workspace-binding",
  () => ({
    resolveServerAdminCsrfProofSessionWorkspaceBinding: vi.fn()
  })
);
vi.mock(
  "../../../../lib/admin/authorization/server-admin-runtime-route-gate-adapter",
  () => ({
    resolveServerAdminRuntimeRouteGateAdapter: vi.fn()
  })
);
vi.mock(
  "../../../../lib/admin/authorization/server-admin-csrf-proof-runtime-dependencies",
  () => ({
    createServerAdminCsrfProofRuntimeDependencies: () => ({
      sessionWorkspaceBindingDependencies: {
        deriveSessionWorkspaceBinding: vi.fn(() => "session-binding")
      },
      verifierDependencies: {
        verifyCsrfProof: vi.fn(() => ({ verified: true }))
      },
      issuerDependencies: {}
    })
  })
);

describe("POST /api/admin/admin-access", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  function setAdminEnv() {
    vi.stubEnv("ADMIN_EXPECTED_ORIGIN", "https://space.example");
    vi.stubEnv("ADMIN_EXPECTED_HOST", "space.example");
    vi.stubEnv(
      "ADMIN_TRUSTED_WORKSPACE_ID",
      "99999999-9999-4999-8999-999999999999"
    );
  }

  function allowOwnerGate() {
    vi.mocked(
      resolveServerAdminCsrfProofSessionWorkspaceBinding
    ).mockResolvedValueOnce({
      bound: true,
      sessionBinding: "session-binding",
      adminContext: {
        workspaceId: "99999999-9999-4999-8999-999999999999",
        adminUserId: "admin-user-1",
        resolution: "server-auth-membership"
      }
    });
    vi.mocked(resolveServerAdminRuntimeRouteGateAdapter).mockResolvedValueOnce({
      allowed: true,
      reason: "allowed",
      statusCode: 200,
      workspaceId: "99999999-9999-4999-8999-999999999999"
    });
  }

  function createRequest(body: Record<string, unknown>) {
    return new NextRequest("https://space.example/api/admin/admin-access", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://space.example",
        host: "space.example",
        "x-csrf-proof": "proof"
      },
      body: JSON.stringify(body)
    });
  }

  it("normalizes add-admin email and uses the membership.manage gate", async () => {
    setAdminEnv();
    allowOwnerGate();
    vi.mocked(executeAdminAccessMutation).mockResolvedValueOnce({
      ok: true,
      record: {
        email: "admin@example.com",
        role: "admin",
        status: "active"
      }
    });

    const response = await POST(
      createRequest({
        action: "add_admin",
        email: " Admin@Example.com "
      })
    );

    expect(resolveServerAdminCsrfProofSessionWorkspaceBinding).toHaveBeenCalledWith(
      {
        requestedOperation: "membership.manage"
      },
      expect.objectContaining({
        workspace: {
          trustedServerWorkspaceId:
            "99999999-9999-4999-8999-999999999999"
        }
      })
    );
    expect(resolveServerAdminRuntimeRouteGateAdapter).toHaveBeenCalledWith(
      expect.objectContaining({
        requestedOperation: "membership.manage",
        requestMethod: "POST",
        requiresMutationCapability: true
      }),
      expect.anything()
    );
    expect(executeAdminAccessMutation).toHaveBeenCalledWith({
      action: "add_admin",
      email: "admin@example.com"
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toStrictEqual({
      ok: true,
      record: {
        email: "admin@example.com",
        role: "admin",
        status: "active"
      }
    });
  });

  it("rejects invalid emails before owner write boundaries are called", async () => {
    setAdminEnv();

    const response = await POST(
      createRequest({
        action: "add_admin",
        email: "not-an-email"
      })
    );

    expect(resolveServerAdminCsrfProofSessionWorkspaceBinding).not.toHaveBeenCalled();
    expect(resolveServerAdminRuntimeRouteGateAdapter).not.toHaveBeenCalled();
    expect(executeAdminAccessMutation).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });

  it("blocks non-owner admins through the membership.manage gate", async () => {
    setAdminEnv();
    vi.mocked(
      resolveServerAdminCsrfProofSessionWorkspaceBinding
    ).mockResolvedValueOnce({
      bound: false,
      reason: "role_not_allowed",
      statusCode: 403
    });

    const response = await POST(
      createRequest({
        action: "remove_admin",
        email: "owner@example.com"
      })
    );

    expect(executeAdminAccessMutation).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toStrictEqual({
      ok: false,
      error: "role_not_allowed"
    });
  });

  it("returns a safe owner immutable error without disabling the owner", async () => {
    setAdminEnv();
    allowOwnerGate();
    vi.mocked(executeAdminAccessMutation).mockResolvedValueOnce({
      ok: false,
      code: "owner_immutable"
    });

    const response = await POST(
      createRequest({
        action: "disable_admin",
        email: "owner@example.com"
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toStrictEqual({
      ok: false,
      error: "owner_immutable"
    });
  });
});
