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
  });

  it("signs in through the server-only Supabase Auth boundary and redirects to the protected shell", async () => {
    vi.mocked(signInSupabaseAdminAuthSession).mockResolvedValueOnce({
      ok: true
    });

    const request = new NextRequest("https://space.example/api/admin/login", {
      method: "POST",
      body: new URLSearchParams({
        email: " admin@example.com ",
        password: "secret-password"
      })
    });
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
    vi.mocked(signInSupabaseAdminAuthSession).mockResolvedValueOnce({
      ok: false,
      reason: "auth_session_invalid"
    });

    const request = new NextRequest("https://space.example/api/admin/login", {
      method: "POST",
      body: new URLSearchParams({
        email: "admin@example.com",
        password: "wrong-password"
      })
    });
    const response = await POST(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://space.example/admin/login?state=unauthenticated"
    );
  });

  it("returns a generic unavailable redirect when auth dependencies are missing", async () => {
    vi.mocked(signInSupabaseAdminAuthSession).mockResolvedValueOnce({
      ok: false,
      reason: "supabase_server_env_missing"
    });

    const request = new NextRequest("https://space.example/api/admin/login", {
      method: "POST",
      body: new URLSearchParams({
        email: "admin@example.com",
        password: "secret-password"
      })
    });
    const response = await POST(request);

    expect(response.headers.get("location")).toBe(
      "https://space.example/admin/login?state=unavailable"
    );
  });
});
