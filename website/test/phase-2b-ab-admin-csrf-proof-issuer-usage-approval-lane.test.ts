import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
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

function expectChecked(markdown: string, item: string) {
  expect(markdown).toContain(`- [x] ${item}`);
}

function expectUnchecked(markdown: string, item: string) {
  expect(markdown).toContain(`- [ ] ${item}`);
}

describe("Phase 2B-AB admin CSRF proof issuer runtime usage approval lane", () => {
  it("records Phase 2B-AA as completed with PR #68 merge commit and Phase 2B-AB as current", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const projectContext = readRepoFile("docs/PROJECT-CONTEXT.md");

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
      "This phase implements the first backend-only protected admin product-management write surface. It adds session-bound Supabase product/category/product image metadata persistence, owner/admin RLS write policies, product-management audit inserts, and protected first-party admin write API routes for category, product, and product-image metadata changes. The routes use the approved admin route-gate stack, matching CSRF proofs, `ADMIN_TRUSTED_WORKSPACE_ID`, safe JSON validation, and no-store responses. It does not add admin UI, login/logout routes, protected admin pages, Supabase Storage, binary uploads, browser Supabase, service-role runtime paths, deployment config, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access."
    );
    expect(roadmap).toContain(
      "Phase 2B-AB adds only the admin CSRF proof issuer runtime usage approval lane"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2B-AB adds only the admin CSRF proof issuer runtime usage approval lane"
    );
    expect(projectContext).toContain(
      "Phase 2B-AB adds only the admin CSRF proof issuer runtime usage approval lane"
    );
  });

  it("documents approval lane scope and keeps further runtime usage unchecked", () => {
    const design = readRepoFile("docs/ADMIN-AUTH-PROVIDER-SESSION-DESIGN.md");
    const membershipDesign = readRepoFile(
      "docs/ADMIN-AUTH-MEMBERSHIP-DESIGN.md"
    );
    const safety = readRepoFile("docs/SAFETY-BOUNDARIES.md");
    const authChecklist = readRepoFile(
      "docs/checklists/PHASE-2B-AUTH-IMPLEMENTATION.md"
    );
    const adminAuthChecklist = readRepoFile(
      "docs/checklists/PHASE-2B-ADMIN-AUTH.md"
    );

    expect(design).toContain(
      "Phase 2B-AB approves the future first-party server-only CSRF proof issuer runtime usage lane."
    );
    expect(design).toContain(
      "The future route must remain server-only and must not bypass the Phase 2B-Y/AA route-gate authorization path."
    );
    expect(design).toContain(
      "The future route must not call lower-level auth/security boundaries directly except the approved CSRF issuer and session/workspace binding boundaries."
    );
    expect(membershipDesign).toContain(
      "Latest completed admin/auth boundary state: Phase 2B-AC admin auth-check trusted workspace dependency repair."
    );
    expect(safety).toContain(
      "Phase 2B-AB admin CSRF proof issuer runtime usage approval lane is docs/checklist/static-guard approval only"
    );

    expectChecked(
      authChecklist,
      "Admin CSRF proof issuer runtime usage approval lane."
    );
    expectChecked(
      adminAuthChecklist,
      "Approve future server-only admin CSRF proof issuer runtime usage lane."
    );

    for (const item of [
      "Real auth runtime wiring.",
      "Supabase Auth runtime wiring.",
      "Resolver/adapter runtime wiring into routes, pages, or server actions.",
      "Login/logout routes.",
      "Protected admin pages.",
      "Admin UI.",
      "Product writes.",
      "Category writes.",
      "Product image writes.",
      "Storage.",
      "Service-role runtime paths.",
      "Browser Supabase."
    ]) {
      expectUnchecked(authChecklist, item);
      expectUnchecked(adminAuthChecklist, item);
    }
  });

  it("keeps route usage scoped to auth-check plus the Phase 2B-AK csrf-proof route", { timeout: 15000 }, () => {
    const productionSources = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const appSourceOutsideApprovedRoutes = productionSources
      .filter(
        ({ filePath }) =>
          filePath.startsWith("website/app/") &&
          filePath !== "website/app/api/admin/auth-check/route.ts" &&
          filePath !== "website/app/api/admin/csrf-proof/route.ts"
      )
      .map(({ source }) => source)
      .join("\n");

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

    // No login/logout/products/categories/admin pages
    expect(readTrackedFiles(["website/app/admin"])).toEqual([]);
    expect(readTrackedFiles(["website/app/login"])).toEqual([]);
    expect(readTrackedFiles(["website/app/logout"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/auth"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/login"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/logout"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/products"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/categories"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/product-images"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/catalogue"])).toEqual([]);

    // No route gate adapter usage outside the two approved admin routes
    expect(appSourceOutsideApprovedRoutes).not.toContain(
      "server-admin-runtime-route-gate-adapter"
    );
    expect(appSourceOutsideApprovedRoutes).not.toContain(
      "resolveServerAdminRuntimeRouteGateAdapter"
    );

    const appSourceOutsideCsrfRoute = productionSources
      .filter(
        ({ filePath }) =>
          filePath.startsWith("website/app/") &&
          filePath !== "website/app/api/admin/csrf-proof/route.ts"
      )
      .map(({ source }) => source)
      .join("\n");

    // No CSRF proof issuer usage outside the approved csrf-proof route
    expect(appSourceOutsideCsrfRoute).not.toContain("issueServerAdminCsrfProof");
    expect(appSourceOutsideCsrfRoute).not.toContain("createServerAdminCsrfProofIssuer");
    expect(appSourceOutsideCsrfRoute).not.toContain("server-admin-csrf-proof-issuer");

    // No server actions
    expect(appSourceOutsideCsrfRoute).not.toContain('"use server"');
  });

  it("keeps lower-level ownership and forbidden runtime surfaces unchanged", { timeout: 15000 }, () => {
    const productionSources = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const productionSource = productionSources
      .map(({ source }) => source)
      .join("\n");
    const browserSource = productionSources
      .filter(
        ({ filePath }) =>
          !filePath.startsWith("website/app/api/") &&
          !filePath.startsWith("website/lib/supabase/") &&
          !filePath.startsWith("website/lib/admin/authorization/")
      )
      .map(({ source }) => source)
      .join("\n");

    // No forbidden patterns in production code
    expect(productionSource).not.toMatch(
      /from\(["'](?:categories|products|product_images)["']\)\s*\.\s*(?:insert|update|upsert|delete)\s*\(/m
    );
    expect(productionSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(productionSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(productionSource).not.toContain("PINECONE_API_KEY");
    expect(productionSource).not.toContain("@pinecone-database");
    expect(productionSource).not.toContain("chat-config");
    expect(browserSource).not.toContain("@supabase/");

    // No forbidden tracked file paths
    expect(readTrackedFiles(["website/lib/storage"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/pinecone"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/pinecone"])).toEqual([]);
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(
      readTrackedFiles(["vercel.json", ".vercel", "website/vercel.json"])
    ).toEqual([]);

    // n8n workflows unchanged
    expect(readTrackedFiles(["n8n-workflows"]).sort()).toEqual([
      "n8n-workflows/spacekonceptrental-customer-support-agent.workflow.json",
      "n8n-workflows/spacekonceptrental-error-handler.workflow.json",
      "n8n-workflows/spacekonceptrental-rag-ingestion.workflow.json"
    ]);
  });
});
