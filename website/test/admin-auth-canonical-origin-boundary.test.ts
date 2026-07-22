import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const adminAuthRoutePaths = [
  "app/api/admin/login/route.ts",
  "app/api/admin/login/callback/route.ts",
  "app/admin/logout/route.ts",
  "lib/admin/authorization/admin-auth-route-security.ts"
];

const repoRoot = resolve(process.cwd(), "..");
const providerSessionDocumentPaths = [
  "docs/ADMIN-AUTH-PROVIDER-SESSION-DESIGN.md",
  "docs/HOSTED-DEPLOYMENT-EXECUTION-RUNBOOK.md"
];
const applicationCallback =
  "https://spacekonceptrental.com/api/admin/login/callback";
const providerCallbackTemplate =
  "https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback";
const concreteProviderCallbackPattern =
  /https:\/\/[a-z0-9][a-z0-9-]*\.supabase\.co\/auth\/v1\/callback/i;

describe("admin auth canonical origin boundary", () => {
  it("never treats the internal request URL or forwarded headers as redirect authority", () => {
    for (const routePath of adminAuthRoutePaths) {
      const source = readFileSync(resolve(process.cwd(), routePath), "utf8");

      expect(source).not.toContain("request.url");
      expect(source).not.toContain("x-forwarded-host");
      expect(source).not.toContain("x-forwarded-proto");
    }
  });

  it("documents distinct application and external provider callbacks without a provider identifier", () => {
    expect(applicationCallback).not.toBe(providerCallbackTemplate);

    for (const documentPath of providerSessionDocumentPaths) {
      const source = readFileSync(resolve(repoRoot, documentPath), "utf8");

      expect(source).toContain(applicationCallback);
      expect(source).toContain(providerCallbackTemplate);
    }
  });

  it("rejects concrete Supabase provider callbacks in every tracked repository file", () => {
    const trackedFiles = execFileSync("git", ["ls-files"], {
      cwd: repoRoot,
      encoding: "utf8"
    })
      .split(/\r?\n/)
      .filter(Boolean);
    const violations = trackedFiles.flatMap((filePath) => {
      const source = readFileSync(resolve(repoRoot, filePath), "utf8");

      return concreteProviderCallbackPattern.test(source) ? [filePath] : [];
    });

    expect(violations).toEqual([]);
  });
});
