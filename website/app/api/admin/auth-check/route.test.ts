import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveServerAdminRuntimeRouteGateAdapter } from "../../../../lib/admin/authorization/server-admin-runtime-route-gate-adapter";
import { GET } from "./route";

vi.mock(
  "../../../../lib/admin/authorization/server-admin-runtime-route-gate-adapter",
  () => ({
    resolveServerAdminRuntimeRouteGateAdapter: vi.fn()
  })
);

describe("GET /api/admin/auth-check", () => {
  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.ADMIN_EXPECTED_ORIGIN;
    delete process.env.ADMIN_EXPECTED_HOST;
    delete process.env.ADMIN_TRUSTED_WORKSPACE_ID;
  });

  it("calls resolveServerAdminRuntimeRouteGateAdapter with expected parameters and returns safe allowed JSON", async () => {
    process.env.ADMIN_EXPECTED_ORIGIN = "https://example.com";
    process.env.ADMIN_EXPECTED_HOST = "example.com";
    process.env.ADMIN_TRUSTED_WORKSPACE_ID = "ws-123";

    vi.mocked(resolveServerAdminRuntimeRouteGateAdapter).mockResolvedValueOnce({
      allowed: true,
      reason: "Allowed",
      requestId: "req-123",
      statusCode: 200,
      workspaceId: "ws-secret",
      providerUser: { id: "user-123" }
    } as any);

    const request = new Request(
      "https://example.com/api/admin/auth-check"
    ) as NextRequest;
    const response = await GET(request);

    expect(resolveServerAdminRuntimeRouteGateAdapter).toHaveBeenCalledWith(
      {
        requestedOperation: "admin.auth.check",
        requestMethod: "GET",
        request
      },
      {
        requestMetadata: {
          expectedOrigin: "https://example.com",
          expectedHost: "example.com"
        },
        gate: {
          decision: {
            workspace: {
              trustedServerWorkspaceId: "ws-123"
            }
          }
        }
      }
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toStrictEqual({
      allowed: true,
      reason: "Allowed",
      requestId: "req-123"
    });
  });

  it("returns safe deny JSON without leaking extra adapter fields", async () => {
    vi.mocked(resolveServerAdminRuntimeRouteGateAdapter).mockResolvedValueOnce({
      allowed: false,
      reason: "Access denied",
      statusCode: 403,
      workspaceId: "ws-secret",
      csrfSecret: "secret"
    } as any);

    const request = new Request(
      "https://example.com/api/admin/auth-check"
    ) as NextRequest;
    const response = await GET(request);

    expect(resolveServerAdminRuntimeRouteGateAdapter).toHaveBeenCalledWith(
      expect.anything(),
      {
        requestMetadata: {
          expectedOrigin: null,
          expectedHost: null
        },
        gate: {
          decision: {
            workspace: {
              trustedServerWorkspaceId: null
            }
          }
        }
      }
    );

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json).toStrictEqual({
      allowed: false,
      reason: "Access denied"
    });
  });

  it("returns safe unavailable JSON without leaking stack traces or SQL errors", async () => {
    vi.mocked(resolveServerAdminRuntimeRouteGateAdapter).mockResolvedValueOnce({
      allowed: false,
      reason: "Service unavailable",
      statusCode: 503,
      errorInfo: { message: "SQL connection failed", stack: "Error: ..." }
    } as any);

    const request = new Request(
      "https://example.com/api/admin/auth-check"
    ) as NextRequest;
    const response = await GET(request);

    expect(response.status).toBe(503);
    const json = await response.json();
    expect(json).toStrictEqual({
      allowed: false,
      reason: "Service unavailable"
    });
  });
});
