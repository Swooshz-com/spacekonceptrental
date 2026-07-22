import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const adminAuthRoutePaths = [
  "app/api/admin/login/route.ts",
  "app/api/admin/login/callback/route.ts",
  "app/admin/logout/route.ts",
  "lib/admin/authorization/admin-auth-route-security.ts"
];

describe("admin auth canonical origin boundary", () => {
  it("never treats the internal request URL or forwarded headers as redirect authority", () => {
    for (const routePath of adminAuthRoutePaths) {
      const source = readFileSync(resolve(process.cwd(), routePath), "utf8");

      expect(source).not.toContain("request.url");
      expect(source).not.toContain("x-forwarded-host");
      expect(source).not.toContain("x-forwarded-proto");
    }
  });
});
