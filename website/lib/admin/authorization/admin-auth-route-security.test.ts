import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createCanonicalAdminAuthUrl,
  getCanonicalAdminAuthRouteConfig,
  hasExpectedAdminAuthHost,
  isSameOriginAdminAuthRequest
} from "./admin-auth-route-security";

describe("admin auth route security", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function setCanonicalProductionConfig() {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_EXPECTED_ORIGIN", "https://spacekonceptrental.com");
    vi.stubEnv("ADMIN_EXPECTED_HOST", "spacekonceptrental.com");
  }

  it("builds the exact production callback from trusted configuration", () => {
    setCanonicalProductionConfig();
    const config = getCanonicalAdminAuthRouteConfig();

    expect(config).toEqual({
      origin: "https://spacekonceptrental.com",
      host: "spacekonceptrental.com"
    });
    expect(
      createCanonicalAdminAuthUrl(config!, "/api/admin/login/callback").toString()
    ).toBe("https://spacekonceptrental.com/api/admin/login/callback");
  });

  it("accepts an internal request URL only when public Origin and Host are canonical", () => {
    setCanonicalProductionConfig();
    const config = getCanonicalAdminAuthRouteConfig();
    const request = new NextRequest("https://localhost:3000/api/admin/login", {
      method: "POST",
      headers: {
        origin: "https://spacekonceptrental.com",
        host: "spacekonceptrental.com"
      }
    });

    expect(config).not.toBeNull();
    expect(hasExpectedAdminAuthHost(request, config!)).toBe(true);
    expect(isSameOriginAdminAuthRequest(request, config!)).toBe(true);
  });

  it("fails closed for inconsistent origin and host configuration", () => {
    setCanonicalProductionConfig();
    vi.stubEnv("ADMIN_EXPECTED_HOST", "www.spacekonceptrental.com");

    expect(getCanonicalAdminAuthRouteConfig()).toBeNull();
  });

  it("fails closed for a non-HTTPS canonical origin in production", () => {
    setCanonicalProductionConfig();
    vi.stubEnv("ADMIN_EXPECTED_ORIGIN", "http://spacekonceptrental.com");

    expect(getCanonicalAdminAuthRouteConfig()).toBeNull();
  });
});
