import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const routePath = "website/app/api/admin/csrf-proof/route.ts";
const authCheckRoutePath = "website/app/api/admin/auth-check/route.ts";
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

describe("Phase 2B-AK admin CSRF proof issuer route implementation", () => {
  it("records Phase 2B-AJ as complete and Phase 2B-AK as current", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const projectContext = readRepoFile("docs/PROJECT-CONTEXT.md");
    const safety = readRepoFile("docs/SAFETY-BOUNDARIES.md");
    const authChecklist = readRepoFile(
      "docs/checklists/PHASE-2B-AUTH-IMPLEMENTATION.md"
    );
    const adminAuthChecklist = readRepoFile(
      "docs/checklists/PHASE-2B-ADMIN-AUTH.md"
    );

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
      "This phase adds a minimal first-party admin login page"
    );
    expect(status).toContain(
      "Furniture listing metadata writes currently use the existing Phase 2B-AL/AM backend API route boundary, whose internal technical names still reference product/product image tables and routes."
    );
    expect(authChecklist).toContain(
      "- [x] Admin CSRF proof issuer route implementation."
    );
    expect(adminAuthChecklist).toContain(
      "- [x] Add first-party server-only admin CSRF proof issuer route."
    );
    expect(roadmap).toContain(
      "Phase 2B-AK implements only the first-party server-only admin CSRF proof issuer route"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2B-AK adds only the first-party server-only admin CSRF proof issuer route"
    );
    expect(projectContext).toContain(
      "Phase 2B-AK implements only the first-party server-only admin CSRF proof issuer route"
    );
    expect(safety).toContain(
      "Phase 2B-AK adds only the first-party server-only admin CSRF proof issuer route"
    );
  });

  it("adds exactly the admin CSRF proof route beside the auth-check route", () => {
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
    expect(readTrackedFiles(["website/app/api/products"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/categories"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/product-images"])).toEqual([]);
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
  });

  it("keeps the issuer route server-only and on the approved gate/binding/issuer lanes", () => {
    const source = readRepoFile(routePath);

    expect(source).toContain('import "server-only";');
    expect(source).toContain("export async function POST");
    expect(source).not.toContain("export async function GET");
    expect(source).toContain("resolveServerAdminRuntimeRouteGateAdapter");
    expect(source).toContain('requestedOperation: "admin.csrf.issue"');
    expect(source).toContain(
      "resolveServerAdminCsrfProofSessionWorkspaceBinding"
    );
    expect(source).toContain("createServerAdminCsrfProofRuntimeDependencies");
    expect(source).toContain("issueServerAdminCsrfProof");
    expect(source).toContain("ADMIN_EXPECTED_ORIGIN");
    expect(source).toContain("ADMIN_EXPECTED_HOST");
    expect(source).toContain("ADMIN_TRUSTED_WORKSPACE_ID");
    expect(source).toContain("product.write");
    expect(source).toContain("category.write");
    expect(source).toContain("productImage.write");
    expect(source).toContain("membership.manage");
    expect(source).toContain("defaultCsrfProofTtlMs = 5 * 60_000");
  });

  it("does not let the route duplicate lower-level reads or forbidden runtime work", () => {
    const source = readRepoFile(routePath);

    expect(source).not.toContain("next/headers");
    expect(source).not.toContain("headers()");
    expect(source).not.toContain("cookies()");
    expect(source).not.toContain("@supabase/ssr");
    expect(source).not.toContain("@supabase/supabase-js");
    expect(source).not.toContain("auth.getUser()");
    expect(source).not.toContain("admin_users");
    expect(source).not.toContain("memberships");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("N8N");
    expect(source).not.toContain("PINECONE");
    expect(source).not.toContain("chat-config");
    expect(source).not.toContain(".from(");
    expect(source).not.toContain(".insert(");
    expect(source).not.toContain(".update(");
    expect(source).not.toContain(".upsert(");
    expect(source).not.toContain(".delete(");
    expect(source).not.toContain('"use server"');
  });

  it("keeps product write surfaces and auth-check behavior deferred or unchanged", () => {
    const authCheckSource = readRepoFile(authCheckRoutePath);
    const productionSources = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const productionSource = productionSources
      .map(({ source }) => source)
      .join("\n");

    expect(authCheckSource).toContain("export async function GET");
    expect(authCheckSource).toContain(
      'requestedOperation: "admin.auth.check"'
    );
    expect(authCheckSource).not.toContain("issueServerAdminCsrfProof");

    expect(productionSource).not.toMatch(
      /from\(["'](?:categories|products|product_images)["']\)\s*\.\s*(?:insert|update|upsert|delete)\s*\(/m
    );
    expect(readTrackedFiles(["website/lib/storage"])).toEqual([]);
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
  });
});
