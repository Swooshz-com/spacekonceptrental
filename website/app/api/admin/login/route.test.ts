import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { signInSupabaseAdminAuthSession } from "../../../../lib/admin/authorization/supabase-admin-auth-identity-adapter";
import { POST } from "./route";

vi.mock(
  "../../../../lib/admin/authorization/supabase-admin-auth-identity-adapter",
  () => ({
    signInSupabaseAdminAuthSession: vi.fn()
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

  function createLoginRequest(
    body: BodyInit,
    headers: Record<string, string> = {}
  ) {
    return new NextRequest("https://space.example/api/admin/login", {
      method: "POST",
      headers: {
        origin: "https://space.example",
        host: "space.example",
        ...headers
      },
      body
    });
  }

  it("signs in through the server-only Supabase Auth boundary and redirects to the protected shell", async () => {
    setTrustedAdminOrigin();
    vi.mocked(signInSupabaseAdminAuthSession).mockResolvedValueOnce({
      ok: true
    });

    const request = createLoginRequest(
      new URLSearchParams({
        email: " admin@example.com ",
        password: "secret-password"
      })
    );
    const response = await POST(request);

    expect(signInSupabaseAdminAuthSession).toHaveBeenCalledWith(
      {
        email: "admin@example.com",
        password: "secret-password"
      },
      expect.objectContaining({
        requestCookies: request.cookies,
        responseCookies: expect.anything()
      })
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://space.example/admin");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("returns only a generic unauthenticated redirect for invalid credentials", async () => {
    setTrustedAdminOrigin();
    vi.mocked(signInSupabaseAdminAuthSession).mockResolvedValueOnce({
      ok: false,
      reason: "auth_session_invalid"
    });

    const request = createLoginRequest(
      new URLSearchParams({
        email: "admin@example.com",
        password: "wrong-password"
      })
    );
    const response = await POST(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://space.example/admin/login?state=unauthenticated"
    );
  });

  it("returns a generic unavailable redirect when auth dependencies are missing", async () => {
    setTrustedAdminOrigin();
    vi.mocked(signInSupabaseAdminAuthSession).mockResolvedValueOnce({
      ok: false,
      reason: "supabase_server_env_missing"
    });

    const request = createLoginRequest(
      new URLSearchParams({
        email: "admin@example.com",
        password: "secret-password"
      })
    );
    const response = await POST(request);

    expect(response.headers.get("location")).toBe(
      "https://space.example/admin/login?state=unavailable"
    );
  });

  it("rejects oversized content-length before session mutation with a generic redirect", async () => {
    setTrustedAdminOrigin();

    const request = createLoginRequest("email=a@example.com&password=secret", {
      "content-type": "application/x-www-form-urlencoded",
      "content-length": String(17 * 1024)
    });
    const response = await POST(request);

    expect(signInSupabaseAdminAuthSession).not.toHaveBeenCalled();
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://space.example/admin/login?state=unauthenticated"
    );
  });

  it("rejects streamed oversized bodies without content-length before session mutation", async () => {
    setTrustedAdminOrigin();

    const request = createLoginRequest(
      `email=admin@example.com&password=${"a".repeat(17 * 1024)}`,
      {
        "content-type": "application/x-www-form-urlencoded"
      }
    );
    request.headers.delete("content-length");
    const response = await POST(request);

    expect(signInSupabaseAdminAuthSession).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://space.example/admin/login?state=unauthenticated"
    );
  });

  it("rejects invalid content type before session mutation with a generic redirect", async () => {
    setTrustedAdminOrigin();

    const request = createLoginRequest(
      JSON.stringify({
        email: "admin@example.com",
        password: "secret-password"
      }),
      {
        "content-type": "application/json"
      }
    );
    const response = await POST(request);

    expect(signInSupabaseAdminAuthSession).not.toHaveBeenCalled();
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
      const request = new NextRequest("https://space.example/api/admin/login", {
        method: "POST",
        headers,
        body: new URLSearchParams({
          email: "admin@example.com",
          password: "secret-password"
        })
      });
      const response = await POST(request);

      expect(signInSupabaseAdminAuthSession).not.toHaveBeenCalled();
      expect(response.headers.get("location")).toBe(
        "https://space.example/admin/login?state=unauthenticated"
      );
    }
  });
});
