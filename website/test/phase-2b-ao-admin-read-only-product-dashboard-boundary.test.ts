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

describe("Phase 2B-AO admin read-only product dashboard boundary", () => {
  it("records PR #81 as merged and Phase 2B-AO as the current narrow phase", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const adminAuthChecklist = readRepoFile(
      "docs/checklists/PHASE-2B-ADMIN-AUTH.md"
    );
    const authChecklist = readRepoFile(
      "docs/checklists/PHASE-2B-AUTH-IMPLEMENTATION.md"
    );
    const safety = readRepoFile("docs/SAFETY-BOUNDARIES.md");

    expect(status).toContain(
      "Current phase: Phase 2B-AO - admin read-only product dashboard boundary."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2B-AN - admin auth login logout protected shell."
    );
    expect(status).toContain("Last merged phase PR: #81");
    expect(status).toContain(
      "Merge commit: `f66a37644c51123780fee0944e584ab5e00d6f3e`"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2B-AO adds a read-only admin product dashboard inside the protected admin shell."
    );
    expect(adminAuthChecklist).toContain(
      "- [x] Add read-only admin product dashboard boundary."
    );
    expect(authChecklist).toContain(
      "- [x] Read-only admin product dashboard boundary."
    );
    expect(safety).toContain(
      "Phase 2B-AO adds only a read-only admin product dashboard inside the protected admin shell."
    );
  });

  it("keeps the admin dashboard under the protected shell and does not add product write UI routes", () => {
    expect(readTrackedFiles(["website/app/admin"])).toEqual([
      "website/app/admin/login/page.test.tsx",
      "website/app/admin/login/page.tsx",
      "website/app/admin/logout/route.test.ts",
      "website/app/admin/logout/route.ts",
      "website/app/admin/page.tsx",
      "website/app/admin/protected-admin-shell.test.tsx",
      "website/app/admin/protected-admin-shell.tsx"
    ]);
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
      "website/app/api/admin/products/route.ts"
    ]);
    expect(readTrackedFiles(["website/app/api/products"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/categories"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/product-images"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/catalogue"])).toEqual([]);
  });

  it("keeps the dashboard read-only and does not call product write persistence from UI", () => {
    const shellSource = readRepoFile("website/app/admin/protected-admin-shell.tsx");
    const readSource = readRepoFile(
      "website/lib/products/admin-read/admin-product-dashboard-read.ts"
    );
    const productionSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ])
      .map(({ source }) => source)
      .join("\n");

    expect(shellSource).toContain("resolveAdminProductDashboardRead");
    expect(shellSource).not.toContain("getProductPersistence");
    expect(shellSource).not.toContain("SupabaseProductPersistence");
    expect(shellSource).not.toMatch(/<form[^>]+(?:products|categories|product-images)/i);
    expect(shellSource).not.toMatch(/<button[^>]*>\s*(?:Create|Edit|Archive|Publish)/i);
    expect(readSource).toContain('import "server-only";');
    expect(readSource).toContain("createSessionBoundSupabaseAdminReadClient");
    expect(readSource).not.toContain(".insert(");
    expect(readSource).not.toContain(".update(");
    expect(readSource).not.toContain(".upsert(");
    expect(readSource).not.toContain(".delete(");
    expect(productionSource).not.toContain('"use server"');
  });

  it("keeps write routes backend-only and POST-gated", () => {
    const routeFiles = readTrackedFiles(["website/app/api/admin"]).filter(
      (filePath) =>
        /website\/app\/api\/admin\/(?:categories|products|product-images)\//.test(
          filePath.replaceAll("\\", "/")
        ) && filePath.endsWith("route.ts")
    );

    expect(routeFiles.length).toBeGreaterThan(0);
    for (const filePath of routeFiles) {
      const source = readRepoFile(filePath);

      expect(source).toContain('import "server-only";');
      expect(source).toContain("export async function POST");
      expect(source).not.toContain("export async function GET");
    }
  });

  it("does not add browser Supabase, service-role paths, storage, n8n, Pinecone, SaaS chatbot, deployment, or chat-config access", () => {
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
          !filePath.startsWith("website/lib/admin/authorization/") &&
          !filePath.startsWith("website/lib/products/admin-read/")
      )
      .map(({ source }) => source)
      .join("\n");

    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/storage"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/pinecone"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/pinecone"])).toEqual([]);
    expect(readTrackedFiles(["vercel.json", ".vercel", "website/vercel.json"])).toEqual([]);
    expect(productionSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(productionSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(productionSource).not.toContain("PINECONE_API_KEY");
    expect(productionSource).not.toContain("@pinecone-database");
    expect(productionSource).not.toContain("chat-config");
    expect(productionSource).not.toContain("InternalSaasChatProvider");
    expect(browserSource).not.toContain("@supabase/");
    expect(readTrackedFiles(["n8n-workflows"]).sort()).toEqual([
      "n8n-workflows/spacekonceptrental-customer-support-agent.workflow.json",
      "n8n-workflows/spacekonceptrental-error-handler.workflow.json",
      "n8n-workflows/spacekonceptrental-rag-ingestion.workflow.json"
    ]);
  });
});
