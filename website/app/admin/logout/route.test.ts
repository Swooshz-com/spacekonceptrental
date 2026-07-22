import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { signOutSupabaseAdminAuthSession } from "../../../lib/admin/authorization/supabase-admin-auth-identity-adapter";
import { POST } from "./route";

vi.mock(
  "../../../lib/admin/authorization/supabase-admin-auth-identity-adapter",
  () => ({
    signOutSupabaseAdminAuthSession: vi.fn()
  })
);

describe("POST /admin/logout", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  function setTrustedAdminOrigin() {
    vi.stubEnv("ADMIN_EXPECTED_ORIGIN", "https://space.example");
    vi.stubEnv("ADMIN_EXPECTED_HOST", "space.example");
  }

  function createLogoutRequest(headers: Record<string, string> = {}) {
    return new NextRequest("https://localhost:3000/admin/logout", {
      method: "POST",
      headers: {
        origin: "https://space.example",
        host: "space.example",
        ...headers
      }
    });
  }

  it("ends the session through the server-only Supabase Auth boundary and redirects to login", async () => {
    setTrustedAdminOrigin();
    vi.mocked(signOutSupabaseAdminAuthSession).mockResolvedValueOnce({
      ok: true
    });

    const request = createLogoutRequest();
    const response = await POST(request);

    expect(signOutSupabaseAdminAuthSession).toHaveBeenCalledWith(
      expect.objectContaining({
        requestCookies: request.cookies,
        responseCookies: expect.anything()
      })
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://space.example/admin/login?state=unauthenticated"
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("keeps logout safe and generic even when the auth provider is unavailable", async () => {
    setTrustedAdminOrigin();
    vi.mocked(signOutSupabaseAdminAuthSession).mockResolvedValueOnce({
      ok: false,
      reason: "auth_provider_error"
    });

    const request = createLogoutRequest();
    const response = await POST(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://space.example/admin/login?state=unauthenticated"
    );
  });

  it("rejects missing or invalid origin and host before session mutation with a generic redirect", async () => {
    setTrustedAdminOrigin();

    const deniedHeaders: Record<string, string>[] = [
      { host: "space.example" },
      { origin: "https://evil.example", host: "space.example" },
      { origin: "https://space.example", host: "evil.example" }
    ];

    for (const headers of deniedHeaders) {
      vi.clearAllMocks();
      const request = new NextRequest("https://localhost:3000/admin/logout", {
        method: "POST",
        headers
      });
      const response = await POST(request);

      expect(signOutSupabaseAdminAuthSession).not.toHaveBeenCalled();
      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toBe(
        "https://space.example/admin/login?state=unauthenticated"
      );
    }
  });

  it("fails closed before sign-out when canonical route config is missing", async () => {
    const response = await POST(createLogoutRequest());

    expect(signOutSupabaseAdminAuthSession).not.toHaveBeenCalled();
    expect(response.status).toBe(503);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
