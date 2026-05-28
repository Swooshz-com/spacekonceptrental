import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const adminAuthorizationModulePaths = [
  "website/lib/admin/authorization/admin-authorization-policy.ts",
  "website/lib/admin/authorization/admin-authorization-resolver.ts",
  "website/lib/admin/authorization/admin-authorization-adapters.ts"
];
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

function readRepoFile(relativePath: string) {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

function readTrackedFiles(paths: string[]) {
  return execFileSync("git", ["ls-files", "--", ...paths], {
    cwd: repoRoot,
    encoding: "utf8"
  })
    .split(/\r?\n/)
    .filter(Boolean);
}

function isProductionSource(filePath: string) {
  return (
    sourceExtensions.has(extname(filePath)) &&
    !/\.(?:test|spec)\.[cm]?[tj]sx?$/.test(filePath) &&
    !filePath.startsWith("website/test/")
  );
}

function readTrackedProductionSources(paths: string[]) {
  return readTrackedFiles(paths)
    .filter(isProductionSource)
    .map((filePath) => ({
      filePath,
      source: readRepoFile(filePath)
    }));
}

describe("Phase 2B-H admin auth resolution boundary", () => {
  it("records this as reviewed server-side resolver boundary work, not runtime auth", () => {
    const phaseStatus = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const design = readRepoFile("docs/ADMIN-AUTH-MEMBERSHIP-DESIGN.md");
    const checklist = readRepoFile("docs/checklists/PHASE-2B-ADMIN-AUTH.md");

    expect(phaseStatus).toContain(
      "Latest completed phase: Phase 2B-H - reviewed server-side admin auth/membership resolution boundary."
    );
    expect(roadmap).toContain(
      "Phase 2B-H strengthens the reviewed server-side admin auth/membership"
    );
    expect(roadmap).toContain(
      "resolution boundary with dependency-injected fake adapters"
    );
    expect(design).toContain(
      "Phase 2B-H strengthened the reviewed server-side auth/membership resolution boundary with fake-adapter tests only."
    );
    expect(checklist).toContain(
      "- [x] Add reviewed server-side admin auth/membership resolution tests with fake adapters."
    );
    expect(checklist).toContain("- [ ] Real auth runtime wiring.");
    expect(checklist).toContain("- [ ] Supabase Auth runtime wiring.");
    expect(checklist).toContain("- [ ] Cookie reads.");
    expect(checklist).toContain("- [ ] Header reads.");
    expect(checklist).toContain("- [ ] Login/logout routes.");
    expect(checklist).toContain("- [ ] Protected admin pages.");
    expect(checklist).toContain("- [ ] Admin UI.");
    expect(checklist).toContain("- [ ] Product writes.");
    expect(checklist).toContain("- [ ] Category writes.");
    expect(checklist).toContain("- [ ] Product image writes.");
    expect(checklist).toContain("- [ ] Storage.");
    expect(checklist).toContain("- [ ] Service-role runtime paths.");
    expect(checklist).toContain("- [ ] Browser Supabase.");
  });

  it("keeps resolver and adapter code server-only without cookie, header, or Supabase runtime reads", () => {
    const combinedAdminAuthSource = adminAuthorizationModulePaths
      .map(readRepoFile)
      .join("\n");

    expect(combinedAdminAuthSource).toContain('import "server-only";');
    expect(combinedAdminAuthSource).not.toContain("@supabase/");
    expect(combinedAdminAuthSource).not.toContain("createServerSupabaseClient");
    expect(combinedAdminAuthSource).not.toContain("process.env");
    expect(combinedAdminAuthSource).not.toContain("cookies");
    expect(combinedAdminAuthSource).not.toContain("headers");
    expect(combinedAdminAuthSource).not.toMatch(/\bRequest\s*[<({]/);
    expect(combinedAdminAuthSource).not.toMatch(/\bResponse\s*[<({]/);
    expect(combinedAdminAuthSource).not.toContain("chat-config");
    expect(combinedAdminAuthSource).not.toContain(".insert(");
    expect(combinedAdminAuthSource).not.toContain(".update(");
    expect(combinedAdminAuthSource).not.toContain(".upsert(");
    expect(combinedAdminAuthSource).not.toContain(".delete(");
  });

  it("guards against runtime route, page, server-action, and mutation wiring", () => {
    const runtimeSources = readTrackedProductionSources([
      "website/app",
      "website/components"
    ]);
    const runtimeSource = runtimeSources.map(({ source }) => source).join("\n");
    const productionSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ])
      .map(({ source }) => source)
      .join("\n");
    const forbiddenRoutes = readTrackedFiles([
      "website/app/admin",
      "website/app/login",
      "website/app/logout",
      "website/app/api/auth",
      "website/app/api/login",
      "website/app/api/logout",
      "website/app/api/products",
      "website/app/api/categories",
      "website/app/api/product-images",
      "website/app/api/catalogue"
    ]);

    expect(runtimeSource).not.toContain("admin-authorization-resolver");
    expect(runtimeSource).not.toContain("admin-authorization-adapters");
    expect(runtimeSource).not.toContain("resolveAdminAuthorizationForRequest");
    expect(runtimeSource).not.toContain("resolveAdminAuthorizationWithAdapters");
    expect(runtimeSource).not.toContain("buildAdminAuthorizationInput");
    expect(forbiddenRoutes).toEqual([]);
    expect(productionSource).not.toMatch(
      /from\(["'](?:categories|products|product_images)["']\)\s*\.\s*(?:insert|update|upsert|delete)\s*\(/m
    );
    expect(productionSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(productionSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(productionSource).not.toContain("NEXT_PUBLIC_N8N");
    expect(productionSource).not.toContain("chat-config");
  });
});
