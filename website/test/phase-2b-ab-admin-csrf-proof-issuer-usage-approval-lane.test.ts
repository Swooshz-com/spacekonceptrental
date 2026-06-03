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
      "Current phase: Phase 2B-AN - admin auth login logout protected shell."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2B-AM - admin product write audit atomicity boundary."
    );
    expect(status).toContain("Last merged phase PR: #80");
    expect(status).toContain(
      "Merge commit: `c61fd3511daba3a950e650378eb98152ec6a3ff2`"
    );
    expect(status).toContain(
      "This phase adds a minimal first-party admin login page, server-owned Supabase Auth login/logout routes, and a protected admin shell gated through the approved server-only route-gate path using `admin.shell.access`. It returns only safe unauthenticated, authenticated-but-not-authorised, authorised-admin, and unavailable/misconfigured states. It does not add product-management UI, product/category/product-image write forms, Supabase Storage, binary uploads, deployment config, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access."
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
      "Latest completed admin/auth boundary state: Phase 2B-AN admin auth login/logout"
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
      "Real auth runtime wiring outside the Phase 2B-AN login/logout and protected shell boundary.",
      "Supabase Auth runtime wiring outside the Phase 2B-K/N/AN server-only auth session boundaries.",
      "Resolver/adapter runtime wiring into routes, pages, or server actions.",
      "Product-management admin UI.",
      "Product-management admin UI.",
      "Product-management admin UI.",
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
          filePath !== "website/app/api/admin/login/route.ts" &&
          filePath !== "website/app/api/admin/csrf-proof/route.ts" &&
          filePath !== "website/app/admin/protected-admin-shell.tsx"
      )
      .map(({ source }) => source)
      .join("\n");

    expect(readTrackedFiles(["website/app/api/admin"])).toEqual([
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
      "website/app/api/admin/products/route.ts",
      "website/app/api/admin/quote-requests/[quoteRequestId]/status/route.ts"
    ]);

    // No login/logout/products/categories/admin pages
    expect(readTrackedFiles(["website/app/admin"])).toEqual([
      "website/app/admin/login/page.test.tsx",
      "website/app/admin/login/page.tsx",
      "website/app/admin/logout/route.test.ts",
      "website/app/admin/logout/route.ts",
      "website/app/admin/page.tsx",
      "website/app/admin/protected-admin-shell.test.tsx",
      "website/app/admin/protected-admin-shell.tsx"
    ]);
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
