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
    expect(status).toContain("This phase resolves the limitation where product mutations and audit log insertions were not executed in one atomic transaction boundary. It migrates backend admin product writes to use a static `execute_admin_product_write` PL/pgSQL RPC, ensuring atomicity via implicit Postgres transaction blocks. The routes have also been upgraded to strictly require the POST HTTP method for all update and archive state changes. It does not add admin UI, login/logout routes, protected admin pages, Supabase Storage, binary uploads, browser Supabase, service-role runtime paths, deployment config, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.");
    
    expect(status).toContain("Phase 2B-AF is docs/checklist/static-guard approval only for the admin CSRF proof issuer route readiness, because the required runtime signer dependencies are not yet implemented.");

    expect(authChecklist).toContain("Admin CSRF proof issuer route readiness and route-if-safe boundary.");
  });

  it("keeps the route surface limited after the dependencies are approved", () => {
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
