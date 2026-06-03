import { describe, expect, it } from "vitest";

function headersByKey(routeConfig) {
  return new Map(routeConfig.headers.map(({ key, value }) => [key, value]));
}

describe("Phase 2B-AV admin anti-framing header hardening", () => {
  it("exports anti-framing headers for the protected admin UI routes", async () => {
    const { default: nextConfig } = await import("../next.config.mjs");

    expect(nextConfig).toHaveProperty("headers");

    const headersConfig = await nextConfig.headers();
    const adminSources = headersConfig
      .filter(({ source }) => source === "/admin" || source === "/admin/:path*")
      .map((routeConfig) => ({
        source: routeConfig.source,
        headers: headersByKey(routeConfig)
      }));

    expect(adminSources).toHaveLength(2);

    for (const routeConfig of adminSources) {
      expect(routeConfig.headers.get("Content-Security-Policy")).toBe(
        "frame-ancestors 'none'"
      );
      expect(routeConfig.headers.get("X-Frame-Options")).toBe("DENY");
    }
  });

  it("keeps the frame policy scoped to admin pages without a broad public CSP", async () => {
    const { default: nextConfig } = await import("../next.config.mjs");

    const headersConfig = await nextConfig.headers();

    expect(headersConfig.map(({ source }) => source).sort()).toEqual([
      "/admin",
      "/admin/:path*"
    ]);

    for (const routeConfig of headersConfig) {
      const csp = headersByKey(routeConfig).get("Content-Security-Policy");

      expect(csp).not.toMatch(/\bdefault-src\b/);
      expect(csp).not.toMatch(/\bscript-src\b/);
      expect(csp).not.toMatch(/\bstyle-src\b/);
    }
  });
});
