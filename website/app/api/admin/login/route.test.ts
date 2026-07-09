import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { signInSupabaseAdminGoogleAuthSession } from "../../../../lib/admin/authorization/supabase-admin-auth-identity-adapter";
import { POST } from "./route";

vi.mock(
  "../../../../lib/admin/authorization/supabase-admin-auth-identity-adapter",
  () => ({
    signInSupabaseAdminGoogleAuthSession: vi.fn()
  })
);

describe("POST /api/admin/login", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  function setTrustedAdminOrigin() {
    vi.stubEnv("ADMIN_EXPECTED_ORIGIN", "https://space.example");
    vi.stubEnv("ADMIN_EXPECTED_HOST", "space.example");
  }

  function createLoginRequest(headers: Record<string, string> = {}) {
    return new NextRequest("https://space.example/api/admin/login", {
      method: "POST",
      headers: {
        origin: "https://space.example",
        host: "space.example",
        ...headers
      },
      body: new URLSearchParams({
        ignored: "no-password-login"
      })
    });
  }

  it("starts Google sign-in through the server-only Supabase Auth boundary", async () => {
    setTrustedAdminOrigin();
    vi.mocked(signInSupabaseAdminGoogleAuthSession).mockResolvedValueOnce({
      ok: true,
      redirectUrl: "https://accounts.google.example/o/oauth2/v2/auth"
    });

    const request = createLoginRequest();
    const response = await POST(request);

    expect(signInSupabaseAdminGoogleAuthSession).toHaveBeenCalledWith(
      {
        redirectTo: "https://space.example/api/admin/login/callback"
      },
      expect.objectContaining({
        requestCookies: request.cookies,
        responseCookies: expect.anything()
      })
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://accounts.google.example/o/oauth2/v2/auth"
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("does not submit password credentials to the auth boundary", async () => {
    setTrustedAdminOrigin();
    vi.mocked(signInSupabaseAdminGoogleAuthSession).mockResolvedValueOnce({
      ok: true,
      redirectUrl: "https://accounts.google.example/o/oauth2/v2/auth"
    });

    const request = new NextRequest("https://space.example/api/admin/login", {
      method: "POST",
      headers: {
        origin: "https://space.example",
        host: "space.example"
      },
      body: new URLSearchParams({
        email: "admin@example.com",
        password: "must-not-be-forwarded"
      })
    });
    await POST(request);

    expect(signInSupabaseAdminGoogleAuthSession).toHaveBeenCalledWith(
      expect.not.objectContaining({
        email: expect.anything(),
        password: expect.anything()
      }),
      expect.anything()
    );
  });

  it("returns only a generic unauthenticated redirect when Google auth cannot start", async () => {
    setTrustedAdminOrigin();
    vi.mocked(signInSupabaseAdminGoogleAuthSession).mockResolvedValueOnce({
      ok: false,
      reason: "auth_session_invalid"
    });

    const response = await POST(createLoginRequest());

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://space.example/admin/login?state=unauthenticated"
    );
  });

  it("returns a generic unavailable redirect when auth dependencies are missing", async () => {
    setTrustedAdminOrigin();
    vi.mocked(signInSupabaseAdminGoogleAuthSession).mockResolvedValueOnce({
      ok: false,
      reason: "supabase_server_env_missing"
    });

    const response = await POST(createLoginRequest());

    expect(response.headers.get("location")).toBe(
      "https://space.example/admin/login?state=unavailable"
    );
  });

  it("rejects missing or invalid origin and host before session mutation", async () => {
    setTrustedAdminOrigin();

    const deniedHeaders: Record<string, string>[] = [
      { host: "space.example" },
      { origin: "https://evil.example", host: "space.example" },
      { origin: "https://space.example", host: "evil.example" }
    ];

    for (const headers of deniedHeaders) {
      vi.clearAllMocks();
      const request = new NextRequest("https://space.example/api/admin/login", {
        method: "POST",
        headers
      });
      const response = await POST(request);

      expect(signInSupabaseAdminGoogleAuthSession).not.toHaveBeenCalled();
      expect(response.headers.get("location")).toBe(
        "https://space.example/admin/login?state=unauthenticated"
      );
    }
  });
});
