import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveServerAdminRuntimeRouteGateAdapter } from "../../lib/admin/authorization/server-admin-runtime-route-gate-adapter";
import {
  AdminShellContent,
  resolveProtectedAdminShellState
} from "./protected-admin-shell";

vi.mock("../../lib/admin/authorization/server-admin-runtime-route-gate-adapter", () => ({
  resolveServerAdminRuntimeRouteGateAdapter: vi.fn()
}));

describe("protected admin shell", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    delete process.env.ADMIN_EXPECTED_ORIGIN;
    delete process.env.ADMIN_EXPECTED_HOST;
    delete process.env.ADMIN_TRUSTED_WORKSPACE_ID;
  });

  it("uses the approved route-gate adapter for admin shell access", async () => {
    process.env.ADMIN_EXPECTED_ORIGIN = "https://space.example";
    process.env.ADMIN_EXPECTED_HOST = "space.example";
    process.env.ADMIN_TRUSTED_WORKSPACE_ID = "workspace-admin";

    vi.mocked(resolveServerAdminRuntimeRouteGateAdapter).mockResolvedValueOnce({
      allowed: true,
      reason: "allowed",
      statusCode: 200,
      workspaceId: "workspace-secret"
    });

    await expect(resolveProtectedAdminShellState()).resolves.toEqual({
      status: "authorised_admin"
    });

    expect(resolveServerAdminRuntimeRouteGateAdapter).toHaveBeenCalledWith(
      {
        requestedOperation: "admin.shell.access",
        requestMethod: "GET"
      },
      {
        requestMetadata: {
          expectedOrigin: "https://space.example",
          expectedHost: "space.example"
        },
        gate: {
          decision: {
            workspace: {
              trustedServerWorkspaceId: "workspace-admin"
            }
          }
        }
      }
    );
  });

  it("maps unauthenticated users to a safe login-required state", async () => {
    vi.mocked(resolveServerAdminRuntimeRouteGateAdapter).mockResolvedValueOnce({
      allowed: false,
      reason: "unauthenticated",
      statusCode: 401
    });

    await expect(resolveProtectedAdminShellState()).resolves.toEqual({
      status: "unauthenticated"
    });
  });

  it("maps authenticated viewers to a safe not-authorised state", async () => {
    vi.mocked(resolveServerAdminRuntimeRouteGateAdapter).mockResolvedValueOnce({
      allowed: false,
      reason: "role_not_allowed",
      statusCode: 403
    });

    await expect(resolveProtectedAdminShellState()).resolves.toEqual({
      status: "authenticated_not_authorised"
    });
  });

  it("maps missing env or dependency failures to a safe unavailable state", async () => {
    vi.mocked(resolveServerAdminRuntimeRouteGateAdapter).mockResolvedValueOnce({
      allowed: false,
      reason: "admin_authorization_gate_unavailable",
      statusCode: 503
    });

    await expect(resolveProtectedAdminShellState()).resolves.toEqual({
      status: "unavailable"
    });
  });

  it("renders only safe state copy and no admin product-management UI", () => {
    render(<AdminShellContent state={{ status: "authorised_admin" }} />);

    expect(
      screen.getByRole("heading", { name: /admin workspace/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign out/i })
    ).toBeInTheDocument();
    expect(screen.queryByText(/product editor/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/category editor/i)).not.toBeInTheDocument();
  });
});
