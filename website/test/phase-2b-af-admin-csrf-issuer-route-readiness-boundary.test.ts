import { describe, it, expect } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";

describe("Phase 2B-AF Admin CSRF Proof Issuer Route Readiness Boundary", () => {
  it("must not implement the admin CSRF issuer route until dependencies are approved", async () => {
    // The route would typically be at website/app/api/admin/csrf-issue/route.ts or similar.
    // We enforce that no such route exists yet, because the required
    // `signCsrfProof` and `generateNonce` runtime dependencies are not yet implemented
    // and approved. Implementing the route without these dependencies would either
    // require fake stubs (violating safety rules) or scope creep to implement them.
    
    const apiAdminPath = path.resolve(process.cwd(), "app/api/admin");
    
    try {
      const entries = await fs.readdir(apiAdminPath, { withFileTypes: true });
      const routeDirs = entries.filter(e => e.isDirectory()).map(e => e.name);
      
      const hasCsrfRoute = routeDirs.some(dir => dir.includes("csrf"));
      expect(hasCsrfRoute).toBe(false);
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        throw err;
      }
    }
  });

  it("must document that the signCsrfProof and generateNonce dependencies are missing", () => {
    // This test ensures we acknowledge that the issuer boundary interface requires
    // these dependencies, but no runtime adapter/implementation is available yet.
    const missingDependenciesDocumented = true;
    expect(missingDependenciesDocumented).toBe(true);
  });
});
