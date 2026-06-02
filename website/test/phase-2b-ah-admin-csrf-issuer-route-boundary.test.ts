import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");

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

describe("Phase 2B-AH Admin CSRF Proof Issuer Route Boundary", () => {
  it("must document that the actual route implementation is still deferred because safe server-side session/workspace binding cannot be derived", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const authChecklist = readRepoFile("docs/checklists/PHASE-2B-AUTH-IMPLEMENTATION.md");

    expect(status).toContain(
      "Furniture listing metadata writes currently use the existing Phase 2B-AL/AM backend API route boundary, whose internal technical names still reference product/product image tables and routes."
    );
    expect(status).toContain("safe server-side session/workspace binding cannot be derived from existing approved boundaries");
    expect(status).toContain("Phase 2B-AH is docs/checklist/static-guard approval only for the admin CSRF proof issuer route boundary, deferring the route because safe server-side session/workspace binding cannot be derived from existing approved boundaries.");

    expect(authChecklist).toContain("Admin CSRF proof issuer route deferred because of missing safe server-side session/workspace binding.");
  });

  it("keeps the route surface limited after safe workspace binding exists", () => {
    const apiAdminFiles = readTrackedFiles(["website/app/api/admin"]);

    // Only auth-check and the Phase 2B-AK csrf-proof route are allowed here.
    const allowedFiles = [
      "website/app/api/admin/auth-check/route.test.ts",
      "website/app/api/admin/auth-check/route.ts",
      "website/app/api/admin/categories/[categoryId]/archive/route.ts",
      "website/app/api/admin/categories/[categoryId]/route.ts",
      "website/app/api/admin/categories/route.ts",
      "website/app/api/admin/csrf-proof/route.test.ts",
      "website/app/api/admin/csrf-proof/route.ts",
      "website/app/api/admin/login/route.test.ts",
      "website/app/api/admin/login/route.ts",
      "website/app/api/admin/product-images/[imageId]/archive/route.ts",
      "website/app/api/admin/product-images/[imageId]/route.ts",
      "website/app/api/admin/product-images/route.ts",
      "website/app/api/admin/products/[productId]/archive/route.ts",
      "website/app/api/admin/products/[productId]/publish/route.ts",
      "website/app/api/admin/products/[productId]/route.ts",
      "website/app/api/admin/products/route.ts"
    ];
    
    for (const file of apiAdminFiles) {
      expect(allowedFiles).toContain(file);
    }
    
    expect(apiAdminFiles.length).toBeLessThanOrEqual(allowedFiles.length);
  });
});
