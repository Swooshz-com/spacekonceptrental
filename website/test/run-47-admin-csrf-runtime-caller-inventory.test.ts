import { readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const websiteRoot = process.cwd();
const factoryName = "createServerAdminCsrfProofRuntimeDependencies";
const protectedRoutes = [
  "app/api/admin/admin-access/route.ts",
  "lib/catalogue/admin-setup-recipe-write-route.ts",
  "lib/hero/admin-homepage-hero-write-route.ts",
  "lib/page-media/admin-public-page-media-write-route.ts",
  "lib/products/media/admin-product-image-upload-route.ts",
  "lib/products/persistence/admin-product-write-route.ts",
  "lib/quote/admin-read/admin-quote-request-crm-handoff-lifecycle-reconciliation-route.ts",
  "lib/quote/admin-read/admin-quote-request-crm-handoff-packet-route.ts",
  "lib/quote/admin-read/admin-quote-request-hubspot-import-csv-preflight-route.ts",
  "lib/quote/admin-read/admin-quote-request-hubspot-import-csv-route.ts",
  "lib/quote/admin-read/admin-quote-request-hubspot-manual-import-outcome-route.ts",
  "lib/quote/admin-read/admin-quote-request-hubspot-sync-dry-run-contract-route.ts",
  "lib/quote/admin-write/admin-quote-request-crm-handoff-route.ts",
  "lib/quote/admin-write/admin-quote-request-status-route.ts"
] as const;

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = resolve(directory, name);

    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

describe("Run-47 production CSRF runtime caller inventory", () => {
  it("keeps the complete factory caller inventory explicit", () => {
    const callers = [resolve(websiteRoot, "app"), resolve(websiteRoot, "lib")]
      .flatMap(walk)
      .filter((path) => path.endsWith(".ts") && !path.endsWith(".test.ts"))
      .filter((path) => readFileSync(path, "utf8").includes(factoryName))
      .map((path) => relative(websiteRoot, path).replaceAll("\\", "/"))
      .sort();

    expect(callers).toEqual([
      "app/api/admin/csrf-proof/route.ts",
      "lib/admin/authorization/server-admin-csrf-proof-runtime-dependencies.ts",
      ...protectedRoutes
    ].sort());
  });

  it.each(protectedRoutes)("installs server workspace-bound durable replay in %s", (path) => {
    const source = readFileSync(resolve(websiteRoot, path), "utf8");

    expect(source).toContain(factoryName);
    expect(source).toContain(
      "expectedWorkspaceId: binding.adminContext.workspaceId"
    );
    expect(source).not.toMatch(/checkReplay\s*:\s*undefined/);
  });
});
