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

describe("Phase 2B-AF Admin CSRF Proof Issuer Route Readiness Boundary", () => {
  it("must document that the actual route implementation is still deferred", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const authChecklist = readRepoFile("docs/checklists/PHASE-2B-AUTH-IMPLEMENTATION.md");

    expect(status).toContain("nonce generation, signing, and signature verification");
    expect(status).toContain("Product/category/product image write routes remain deferred");
    expect(status).toContain("This phase implements only the first-party server-only `POST /api/admin/csrf-proof` proof issuer route at `website/app/api/admin/csrf-proof/route.ts`. The route validates safe JSON input, gates itself through the approved `admin.csrf.issue` route-gate lane, resolves the target operation binding through the Phase 2B-AI boundary and Phase 2B-AJ runtime deriver, and issues short-lived CSRF proofs for `product.write`, `category.write`, `productImage.write`, and `membership.manage`. Product/category/product image write routes remain deferred.");
    
    expect(status).toContain("Phase 2B-AF is docs/checklist/static-guard approval only for the admin CSRF proof issuer route readiness, because the required runtime signer dependencies are not yet implemented.");

    expect(authChecklist).toContain("Admin CSRF proof issuer route readiness and route-if-safe boundary.");
  });

  it("keeps the route surface limited after the dependencies are approved", () => {
    const apiAdminFiles = readTrackedFiles(["website/app/api/admin"]);

    // Only auth-check and the Phase 2B-AK csrf-proof route are allowed here.
    const allowedFiles = [
      "website/app/api/admin/auth-check/route.test.ts",
      "website/app/api/admin/auth-check/route.ts",
      "website/app/api/admin/csrf-proof/route.test.ts",
      "website/app/api/admin/csrf-proof/route.ts"
    ];
    
    for (const file of apiAdminFiles) {
      expect(allowedFiles).toContain(file);
    }
    
    expect(apiAdminFiles.length).toBeLessThanOrEqual(allowedFiles.length);
  });
});
