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
  });

  it("ends the session through the server-only Supabase Auth boundary and redirects to login", async () => {
    vi.mocked(signOutSupabaseAdminAuthSession).mockResolvedValueOnce({
      ok: true
    });

    const request = new NextRequest("https://space.example/admin/logout", {
      method: "POST"
    });
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
    vi.mocked(signOutSupabaseAdminAuthSession).mockResolvedValueOnce({
      ok: false,
      reason: "auth_provider_error"
    });

    const request = new NextRequest("https://space.example/admin/logout", {
      method: "POST"
    });
    const response = await POST(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://space.example/admin/login?state=unauthenticated"
    );
  });
});
