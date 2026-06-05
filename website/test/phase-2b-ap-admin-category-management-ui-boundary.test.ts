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

describe("Phase 2B-AP admin category management UI boundary", () => {
  it("records PR #83 as the previous merged phase snapshot and Phase 2B-AP as the current narrow phase", () => {
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
      "Current phase: Phase 2B-AP - admin category management UI boundary."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2B-AO - admin read-only product dashboard boundary."
    );
    expect(status).toContain("Last merged phase PR: #83");
    expect(status).toContain(
      "Merge commit: `110888f684f55fa55dc03bc4f26f71500e5d17ab`"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2B-AP adds category-only create, update, and archive controls inside the protected admin shell."
    );
    expect(adminAuthChecklist).toContain(
      "- [x] Add category management UI boundary."
    );
    expect(authChecklist).toContain(
      "- [x] Category management UI boundary."
    );
    expect(safety).toContain(
      "Phase 2B-AP adds only category create, update, and archive controls inside the protected admin shell."
    );
  });

  it("keeps category controls in the protected shell without changing admin route shape", () => {
    const shellSource = readRepoFile("website/app/admin/protected-admin-shell.tsx");
    const panelSource = readRepoFile(
      "website/components/admin/category-management-panel.tsx"
    );

    expect(readTrackedFiles(["website/app/admin"])).toEqual(
      expect.arrayContaining([
        "website/app/admin/login/page.test.tsx",
        "website/app/admin/login/page.tsx",
        "website/app/admin/logout/route.test.ts",
        "website/app/admin/logout/route.ts",
        "website/app/admin/page.tsx",
        "website/app/admin/protected-admin-shell.test.tsx",
        "website/app/admin/protected-admin-shell.tsx"
      ])
    );
    expect(shellSource).toContain("CategoryManagementPanel");
    expect(panelSource).toContain('"use client"');
    expect(panelSource).toContain("/api/admin/csrf-proof");
    expect(panelSource).toContain("requestedOperation: categoryWriteOperation");
    expect(panelSource).toContain("operation: categoryWriteOperation");
    expect(panelSource).toContain("/api/admin/categories");
    expect(panelSource).toContain("x-csrf-proof");
    expect(panelSource).not.toContain("/api/admin/products");
    expect(panelSource).not.toContain("/api/admin/product-images");
    expect(panelSource).not.toContain("@supabase/");
    expect(panelSource).not.toContain('"use server"');
  });

  it("keeps product write routes backend-only and POST-gated", () => {
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

  it("does not add browser Supabase, service-role paths, storage, deployment, n8n, Pinecone, SaaS chatbot, or chat-config drift", () => {
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
          !filePath.startsWith("website/lib/products/admin-read/") &&
          !filePath.startsWith("website/lib/products/persistence/")
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
