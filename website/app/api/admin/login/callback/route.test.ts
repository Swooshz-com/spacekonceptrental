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

const { mockEmitAdminLoginCallbackDenied } = vi.hoisted(() => ({
  mockEmitAdminLoginCallbackDenied: vi.fn(async () => ({ kind: "skipped" }))
}));

vi.mock(
  "../../../../../lib/application-events/app-operation-event-call-sites",
  () => ({
    emitAdminLoginCallbackDenied: mockEmitAdminLoginCallbackDenied
  })
);

describe("GET /api/admin/login/callback", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  function setTrustedAdminOrigin() {
    vi.stubEnv("ADMIN_EXPECTED_ORIGIN", "https://space.example");
    vi.stubEnv("ADMIN_EXPECTED_HOST", "space.example");
  }

  function createCallbackRequest(code: string, host = "space.example") {
    return new NextRequest(
      `https://localhost:3000/api/admin/login/callback?code=${code}`,
      {
        headers: {
          host
        }
      }
    );
  }

  it("exchanges the OAuth code server-side and redirects to protected admin", async () => {
    setTrustedAdminOrigin();
    vi.mocked(exchangeSupabaseAdminAuthCodeForSession).mockResolvedValueOnce({
      ok: true
    });
    const request = createCallbackRequest("auth-code");

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
    setTrustedAdminOrigin();
    vi.mocked(exchangeSupabaseAdminAuthCodeForSession).mockResolvedValueOnce({
      ok: false,
      reason: "auth_session_invalid"
    });
    const request = createCallbackRequest("bad-code");

    const response = await GET(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://space.example/admin/login?state=unauthenticated"
    );
  });

  it("rejects an unexpected public host before creating a session", async () => {
    setTrustedAdminOrigin();
    const response = await GET(createCallbackRequest("auth-code", "evil.example"));

    expect(exchangeSupabaseAdminAuthCodeForSession).not.toHaveBeenCalled();
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://space.example/admin/login?state=unauthenticated"
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("fails closed before creating a session when canonical route config is missing", async () => {
    const response = await GET(createCallbackRequest("auth-code"));

    expect(exchangeSupabaseAdminAuthCodeForSession).not.toHaveBeenCalled();
    expect(response.status).toBe(503);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mockEmitAdminLoginCallbackDenied).not.toHaveBeenCalled();
  });

  it("emits the callback denied event when the code exchange fails", async () => {
    setTrustedAdminOrigin();
    vi.mocked(exchangeSupabaseAdminAuthCodeForSession).mockResolvedValueOnce({
      ok: false,
      reason: "auth_session_invalid"
    });

    const response = await GET(createCallbackRequest("bad-code"));

    expect(mockEmitAdminLoginCallbackDenied).toHaveBeenCalledTimes(1);
    expect(mockEmitAdminLoginCallbackDenied).toHaveBeenCalledWith(
      "callback_unauthenticated",
      {}
    );
    expect(response.status).toBe(303);
  });

  it("emits the callback unavailable event when server auth env is missing", async () => {
    setTrustedAdminOrigin();
    vi.mocked(exchangeSupabaseAdminAuthCodeForSession).mockResolvedValueOnce({
      ok: false,
      reason: "supabase_server_env_missing"
    });

    await GET(createCallbackRequest("bad-code"));

    expect(mockEmitAdminLoginCallbackDenied).toHaveBeenCalledTimes(1);
    expect(mockEmitAdminLoginCallbackDenied).toHaveBeenCalledWith(
      "callback_unavailable",
      {}
    );
  });

  it("emits the callback denied event on an unexpected host before session creation", async () => {
    setTrustedAdminOrigin();

    await GET(createCallbackRequest("auth-code", "evil.example"));

    expect(exchangeSupabaseAdminAuthCodeForSession).not.toHaveBeenCalled();
    expect(mockEmitAdminLoginCallbackDenied).toHaveBeenCalledTimes(1);
    expect(mockEmitAdminLoginCallbackDenied).toHaveBeenCalledWith(
      "callback_unauthenticated",
      {}
    );
  });

  it("does not emit a callback denied event on a successful exchange", async () => {
    setTrustedAdminOrigin();
    vi.mocked(exchangeSupabaseAdminAuthCodeForSession).mockResolvedValueOnce({
      ok: true
    });

    const response = await GET(createCallbackRequest("auth-code"));

    expect(mockEmitAdminLoginCallbackDenied).not.toHaveBeenCalled();
    expect(response.status).toBe(303);
  });

  it("preserves the callback 303 redirect when the callback denied emitter throws", async () => {
    setTrustedAdminOrigin();
    vi.mocked(exchangeSupabaseAdminAuthCodeForSession).mockResolvedValueOnce({
      ok: false,
      reason: "auth_session_invalid"
    });
    mockEmitAdminLoginCallbackDenied.mockRejectedValueOnce(
      new Error("sink exploded")
    );

    const response = await GET(createCallbackRequest("bad-code"));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://space.example/admin/login?state=unauthenticated"
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mockEmitAdminLoginCallbackDenied).toHaveBeenCalledTimes(1);
  });

  it("preserves the callback unavailable redirect when the emitter throws", async () => {
    setTrustedAdminOrigin();
    vi.mocked(exchangeSupabaseAdminAuthCodeForSession).mockResolvedValueOnce({
      ok: false,
      reason: "supabase_server_env_missing"
    });
    mockEmitAdminLoginCallbackDenied.mockRejectedValueOnce(
      new Error("sink exploded")
    );

    const response = await GET(createCallbackRequest("bad-code"));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://space.example/admin/login?state=unavailable"
    );
    expect(mockEmitAdminLoginCallbackDenied).toHaveBeenCalledTimes(1);
  });
});
