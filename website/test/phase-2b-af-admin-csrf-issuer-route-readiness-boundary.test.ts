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
    expect(status).toContain("does not implement the actual CSRF proof issuer route");
    expect(status).toContain("This phase implements only the missing server-only runtime dependency boundary needed by the existing CSRF proof issuer/verifier contracts. It provides nonce generation, signing, and signature verification using Node server-only crypto. This phase does not implement the actual CSRF proof issuer route. This phase does not add product/category/product image writes, admin UI, pages, server actions, login/logout, protected admin pages, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n workflow changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access.");
    
    expect(status).toContain("Phase 2B-AF is docs/checklist/static-guard approval only for the admin CSRF proof issuer route readiness, because the required runtime signer dependencies are not yet implemented.");

    expect(authChecklist).toContain("Admin CSRF proof issuer route readiness and route-if-safe boundary.");
  });

  it("must not implement the admin CSRF issuer route until dependencies are approved", () => {
    // We enforce that no such route exists yet, because the required
    // `signCsrfProof` and `generateNonce` runtime dependencies are not yet implemented
    // and approved. Implementing the route without these dependencies would either
    // require fake stubs (violating safety rules) or scope creep to implement them.
    
    const apiAdminFiles = readTrackedFiles(["website/app/api/admin"]);
    
    // The only allowed route files in website/app/api/admin are for auth-check
    const allowedFiles = [
      "website/app/api/admin/auth-check/route.test.ts",
      "website/app/api/admin/auth-check/route.ts"
    ];
    
    for (const file of apiAdminFiles) {
      expect(allowedFiles).toContain(file);
    }
    
    expect(apiAdminFiles.length).toBeLessThanOrEqual(allowedFiles.length);
  });
});
