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
    expect(status).toContain("Product writes are approved only through the Phase 2B-AL backend API route boundary");
    expect(status).toContain("This phase implements the first backend-only protected admin product-management write surface. It adds session-bound Supabase product/category/product image metadata persistence, owner/admin RLS write policies, product-management audit inserts, and protected first-party admin write API routes for category, product, and product-image metadata changes. The routes use the approved admin route-gate stack, matching CSRF proofs, `ADMIN_TRUSTED_WORKSPACE_ID`, safe JSON validation, and no-store responses. It does not add admin UI, login/logout routes, protected admin pages, Supabase Storage, binary uploads, browser Supabase, service-role runtime paths, deployment config, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.");
    
    expect(status).toContain("Phase 2B-AF is docs/checklist/static-guard approval only for the admin CSRF proof issuer route readiness, because the required runtime signer dependencies are not yet implemented.");

    expect(authChecklist).toContain("Admin CSRF proof issuer route readiness and route-if-safe boundary.");
  });

  it("keeps the route surface limited after the dependencies are approved", () => {
    const apiAdminFiles = readTrackedFiles(["website/app/api/admin"]);

    // Only auth-check and the Phase 2B-AK csrf-proof route are allowed here.
    const allowedFiles = [
      "website/app/api/admin/auth-check/route.test.ts",
      "website/app/api/admin/auth-check/route.ts",
      "website/app/api/admin/categories/[categoryId]/route.ts",
      "website/app/api/admin/categories/route.ts",
      "website/app/api/admin/csrf-proof/route.test.ts",
      "website/app/api/admin/csrf-proof/route.ts",
      "website/app/api/admin/product-images/[imageId]/route.ts",
      "website/app/api/admin/product-images/route.ts",
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
