import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const approvedAuthBoundaryPath =
  "website/lib/admin/authorization/supabase-admin-auth-identity-adapter.ts";
const approvedRequestMetadataBoundaryPath =
  "website/lib/admin/authorization/server-admin-request-metadata-adapter.ts";
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

describe("Phase 2B-K server-only Supabase Auth identity boundary", () => {
  it("records Phase 2B-K status, roadmap, and decision-log scope", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");

    expect(status).toContain(
      "Current phase: Phase 2B-AM - admin product write audit atomicity boundary."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2B-AL - admin product persistence and protected write API routes."
    );
    expect(status).toContain("Last merged phase PR: #79");
    expect(status).toContain(
      "Merge commit: `1c08d99b2ad11243578f6c57b1e8ff44d3379ccc`"
    );
    expect(roadmap).toContain(
      "Phase 2B-K adds only the server-only Supabase Auth identity/session-read boundary"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2B-K adds only the server-only Supabase Auth identity/session-read boundary"
    );
  });

  it("documents the implemented identity boundary and checklist state", () => {
    const design = readRepoFile("docs/ADMIN-AUTH-PROVIDER-SESSION-DESIGN.md");
    const authChecklist = readRepoFile(
      "docs/checklists/PHASE-2B-AUTH-IMPLEMENTATION.md"
    );
    const adminAuthChecklist = readRepoFile(
      "docs/checklists/PHASE-2B-ADMIN-AUTH.md"
    );

    expect(design).toContain("## Phase 2B-K Implemented Identity Boundary");
    expect(design).toContain(
      "`website/lib/admin/authorization/supabase-admin-auth-identity-adapter.ts` is the only approved module for reading Supabase Auth cookies and calling Supabase Auth server APIs in this phase."
    );
    expect(design).toContain(
      "It implements the existing `AdminAuthAdapter` identity shape only and is not wired into runtime routes, pages, or server actions."
    );
    expect(design).toContain(
      "Cookie reads and `auth.getUser()` are allowed only inside that server-only identity boundary."
    );

    expectChecked(authChecklist, "Server-only Supabase Auth identity boundary.");
    expectChecked(authChecklist, "Cookie reads.");
    expectChecked(
      authChecklist,
      "Server-only Supabase admin profile/membership read boundary."
    );
    expectUnchecked(authChecklist, "Real auth runtime wiring.");
    expectUnchecked(authChecklist, "Supabase Auth runtime wiring.");
    expectUnchecked(authChecklist, "Header reads outside the Phase 2B-V request metadata adapter.");
    expectUnchecked(authChecklist, "Login/logout routes.");
    expectUnchecked(authChecklist, "Protected admin pages.");
    expectUnchecked(authChecklist, "Admin UI.");
    expectUnchecked(authChecklist, "Product writes.");
    expectUnchecked(authChecklist, "Category writes.");
    expectUnchecked(authChecklist, "Product image writes.");
    expectUnchecked(authChecklist, "Storage.");
    expectUnchecked(authChecklist, "Service-role runtime paths.");
    expectUnchecked(authChecklist, "Browser Supabase.");
    expectChecked(
      adminAuthChecklist,
      "Add server-only Supabase Auth identity boundary."
    );
  });

  it("allows cookie reads and Supabase Auth calls only in the server-only identity boundary", () => {
    const packageJson = JSON.parse(readRepoFile("website/package.json"));
    const productionSources = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const approvedSource = readRepoFile(approvedAuthBoundaryPath);
    const outsideApprovedBoundary = productionSources
      .filter(({ filePath }) => filePath !== approvedAuthBoundaryPath &&
          filePath !== approvedRequestMetadataBoundaryPath)
      .map(({ source }) => source)
      .join("\n");
    const browserSource = productionSources
      .filter(
        ({ filePath }) =>
          filePath !== approvedAuthBoundaryPath &&
          filePath !== approvedRequestMetadataBoundaryPath &&
          !filePath.startsWith("website/app/api/") &&
          !filePath.startsWith("website/lib/supabase/")
      )
      .map(({ source }) => source)
      .join("\n");

    expect(readTrackedFiles([approvedAuthBoundaryPath])).toEqual([
      approvedAuthBoundaryPath
    ]);
    expect(packageJson.dependencies["@supabase/ssr"]).toBeDefined();
    expect(approvedSource).toContain('import "server-only";');
    expect(approvedSource).toContain('from "@supabase/ssr"');
    expect(approvedSource).toContain('from "next/headers"');
    expect(approvedSource).toContain("cookies()");
    expect(approvedSource).toContain("auth.getUser()");
    expect(approvedSource).not.toContain("headers()");
    expect(approvedSource).not.toContain("SUPABASE_SERVICE_ROLE");

    expect(outsideApprovedBoundary).not.toContain("@supabase/ssr");
    expect(outsideApprovedBoundary).not.toContain("next/headers");
    expect(outsideApprovedBoundary).not.toContain("cookies()");
    expect(outsideApprovedBoundary).not.toContain("headers()");
    expect(outsideApprovedBoundary).not.toMatch(
      /\.auth\.(?:getUser|getSession|signIn|signOut|setSession|exchangeCodeForSession)/m
    );
    expect(outsideApprovedBoundary).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(outsideApprovedBoundary).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(browserSource).not.toContain("@supabase/");
    expect(browserSource).not.toContain("lib/supabase");
    expect(browserSource).not.toContain("SUPABASE_URL");
    expect(browserSource).not.toContain("SUPABASE_ANON_KEY");
    expect(browserSource).not.toContain("chat-config");
  });

  it("keeps routes, protected pages, writes, deployment, n8n, Pinecone, and chat-config out of scope", { timeout: 15000 }, () => {
    const productionSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ])
      .map(({ source }) => source)
      .join("\n");

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
    expect(readTrackedFiles(["vercel.json", ".vercel", "website/vercel.json"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/pinecone"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/pinecone"])).toEqual([]);
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);

    expect(productionSource).not.toMatch(
      /from\(["'](?:categories|products|product_images)["']\)\s*\.\s*(?:insert|update|upsert|delete)\s*\(/m
    );
    expect(productionSource).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(productionSource).not.toContain("PINECONE_API_KEY");
    expect(productionSource).not.toContain("@pinecone-database");
    expect(productionSource).not.toContain("chat-config");
    expect(readTrackedFiles(["n8n-workflows"]).sort()).toEqual([
      "n8n-workflows/spacekonceptrental-customer-support-agent.workflow.json",
      "n8n-workflows/spacekonceptrental-error-handler.workflow.json",
      "n8n-workflows/spacekonceptrental-rag-ingestion.workflow.json"
    ]);
  });
});
