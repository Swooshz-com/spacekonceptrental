import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const bindingBoundaryPath =
  "website/lib/admin/authorization/server-admin-csrf-proof-session-workspace-binding.ts";
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

describe("Phase 2B-AI admin CSRF proof issuer session/workspace binding boundary", () => {
  it("records Phase 2B-AH as completed and Phase 2B-AI as current", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const projectContext = readRepoFile("docs/PROJECT-CONTEXT.md");
    const safety = readRepoFile("docs/SAFETY-BOUNDARIES.md");
    const authChecklist = readRepoFile(
      "docs/checklists/PHASE-2B-AUTH-IMPLEMENTATION.md"
    );

    expect(status).toContain(
      "Current phase: Phase 2B-AL - admin product persistence and protected write API routes."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2B-AK - admin CSRF proof issuer route implementation."
    );
    expect(status).toContain("Last merged phase PR: #78");
    expect(status).toContain(
      "Merge commit: `d862b5a6a75031146cac9e881296eacbeb26d414`"
    );
    expect(status).toContain(
      "This phase implements the first backend-only protected admin product-management write surface"
    );
    expect(status).toContain(
      "Product writes are approved only through the Phase 2B-AL backend API route boundary."
    );
    expect(status).toContain(
      "Phase 2B-AI implements only the server-only admin CSRF proof issuer session/workspace binding boundary."
    );
    expect(authChecklist).toContain(
      "- [x] Admin CSRF proof issuer session/workspace binding boundary."
    );
    expect(roadmap).toContain(
      "Phase 2B-AI adds only the server-only admin CSRF proof issuer session/workspace binding boundary."
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2B-AI adds only the server-only admin CSRF proof issuer session/workspace binding boundary"
    );
    expect(projectContext).toContain(
      "Phase 2B-AI adds only the server-only admin CSRF proof issuer session/workspace binding boundary."
    );
    expect(safety).toContain(
      "Phase 2B-AI adds only the server-only admin CSRF proof issuer session/workspace binding boundary"
    );
  });

  it("keeps the binding helper server-only, dependency-injected, and opaque", () => {
    const source = readRepoFile(bindingBoundaryPath);

    expect(source).toContain('import "server-only";');
    expect(source).toContain("createServerAdminAuthorizationAdapterSet");
    expect(source).toContain("deriveSessionWorkspaceBinding");
    expect(source).not.toContain("headers()");
    expect(source).not.toContain("cookies()");
    expect(source).not.toContain("@supabase/ssr");
    expect(source).not.toContain("@supabase/supabase-js");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("process.env");
    expect(source).not.toContain("chat-config");
    expect(source).not.toContain("issueServerAdminCsrfProof");
    expect(source).not.toContain("signServerAdminCsrfProof");
    expect(source).not.toContain("verifyServerAdminCsrfSignature");
  });

  it("keeps the admin CSRF route surface limited to auth-check and the Phase 2B-AK issuer", () => {
    expect(readTrackedFiles(["website/app/api/admin"])).toEqual([
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
    ]);
    expect(readTrackedFiles(["website/app/api/products"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/categories"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/product-images"])).toEqual([]);
  });

  it("preserves state-changing admin operations as CSRF-proof-required and deferred", () => {
    const preflight = readRepoFile(
      "website/lib/admin/authorization/server-admin-request-security-preflight.ts"
    );
    const productionSources = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const appSourceOutsideCsrfRoute = productionSources
      .filter(
        ({ filePath }) =>
          filePath.startsWith("website/app/") &&
          filePath !== "website/app/api/admin/csrf-proof/route.ts"
      )
      .map(({ source }) => source)
      .join("\n");
    const productionSource = productionSources
      .map(({ source }) => source)
      .join("\n");

    for (const operation of [
      "product.write",
      "category.write",
      "productImage.write",
      "membership.manage"
    ]) {
      expect(preflight).toContain(operation);
    }

    expect(preflight).toContain("csrf_proof_missing");
    expect(preflight).toContain("verifyCsrfProof");
    expect(appSourceOutsideCsrfRoute).not.toContain("issueServerAdminCsrfProof");
    expect(appSourceOutsideCsrfRoute).not.toContain("createServerAdminCsrfProofIssuer");
    expect(appSourceOutsideCsrfRoute).not.toContain("server-admin-csrf-proof-issuer");
    expect(productionSource).not.toMatch(
      /from\(["'](?:categories|products|product_images)["']\)\s*\.\s*(?:insert|update|upsert|delete)\s*\(/m
    );
  });
});
