import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { exchangeSupabaseAdminAuthCodeForSession } from "../../../../../lib/admin/authorization/supabase-admin-auth-identity-adapter";
import { GET } from "./route";

vi.mock(
  "../../../../../lib/admin/authorization/supabase-admin-auth-identity-adapter",
  () => ({
    exchangeSupabaseAdminAuthCodeForSession: vi.fn()
  })
);

describe("GET /api/admin/login/callback", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("exchanges the OAuth code server-side and redirects to protected admin", async () => {
    vi.mocked(exchangeSupabaseAdminAuthCodeForSession).mockResolvedValueOnce({
      ok: true
    });
    const request = new NextRequest(
      "https://space.example/api/admin/login/callback?code=auth-code"
    );

    const response = await GET(request);

    expect(exchangeSupabaseAdminAuthCodeForSession).toHaveBeenCalledWith(
      {
        code: "auth-code"
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

  it("returns a generic login state when the code exchange fails", async () => {
    vi.mocked(exchangeSupabaseAdminAuthCodeForSession).mockResolvedValueOnce({
      ok: false,
      reason: "auth_session_invalid"
    });
    const request = new NextRequest(
      "https://space.example/api/admin/login/callback?code=bad-code"
    );

    const response = await GET(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://space.example/admin/login?state=unauthenticated"
    );
  });
});
