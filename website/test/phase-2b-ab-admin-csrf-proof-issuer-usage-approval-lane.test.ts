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
      "Current phase: Phase 2B-AF - admin CSRF proof issuer route readiness and route-if-safe boundary."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2B-AE - admin CSRF issue operation policy and preflight boundary."
    );
    expect(status).toContain("Last merged phase PR: #72");
    expect(status).toContain(
      "Merge commit: `f8c5ceb77ef53243da700d6c76720814864ee770`"
    );
    expect(status).toContain(
      "This phase implements only docs/checklist/static-guard approval for the admin CSRF proof issuer route readiness. The actual route implementation is intentionally deferred because the required runtime `signCsrfProof` and `generateNonce` dependencies are not yet implemented or approved. This phase preserves the existing `admin.csrf.issue` operation policy and preflight boundaries. This phase does not add product/category/product image writes, admin UI, pages, server actions, login/logout, protected admin pages, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n workflow changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access."
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
      "The future route must not call lower-level auth/security boundaries directly except the approved CSRF issuer boundary."
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

  it("does not add any new route handlers beyond existing Phase 2B-AA auth-check route", { timeout: 15000 }, () => {
    const productionSources = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const appSourceOutsideAuthCheck = productionSources
      .filter(({ filePath }) => filePath.startsWith("website/app/") && filePath !== "website/app/api/admin/auth-check/route.ts")
      .map(({ source }) => source)
      .join("\n");

    // Only auth-check should exist under app/api/admin
    expect(readTrackedFiles(["website/app/api/admin"])).toEqual([
      "website/app/api/admin/auth-check/route.test.ts",
      "website/app/api/admin/auth-check/route.ts"
    ]);

    // No csrf-proof route yet
    expect(readTrackedFiles(["website/app/api/admin/csrf-proof"])).toEqual([]);

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

    // No route gate adapter usage outside auth-check
    expect(appSourceOutsideAuthCheck).not.toContain(
      "server-admin-runtime-route-gate-adapter"
    );
    expect(appSourceOutsideAuthCheck).not.toContain(
      "resolveServerAdminRuntimeRouteGateAdapter"
    );

    const allAppSources = productionSources
      .filter(({ filePath }) => filePath.startsWith("website/app/"))
      .map(({ source }) => source)
      .join("\n");

    // No CSRF proof issuer usage in any app route or page
    expect(allAppSources).not.toContain("issueServerAdminCsrfProof");
    expect(allAppSources).not.toContain("createServerAdminCsrfProofIssuer");
    expect(allAppSources).not.toContain("server-admin-csrf-proof-issuer");

    // No server actions
    expect(allAppSources).not.toContain('"use server"');
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
