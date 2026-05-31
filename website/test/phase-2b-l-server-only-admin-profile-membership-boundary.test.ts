import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const approvedIdentityBoundaryPath =
  "website/lib/admin/authorization/supabase-admin-auth-identity-adapter.ts";
const approvedRequestMetadataBoundaryPath =
  "website/lib/admin/authorization/server-admin-request-metadata-adapter.ts";
const approvedProfileMembershipBoundaryPath =
  "website/lib/admin/authorization/supabase-admin-profile-membership-adapters.ts";
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

describe("Phase 2B-L server-only admin profile and membership read boundary", () => {
  it("records Phase 2B-L status, roadmap, decision-log, and project context scope", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const projectContext = readRepoFile("docs/PROJECT-CONTEXT.md");

    expect(status).toContain(
      "Current phase: Phase 2B-AC - admin auth-check trusted workspace dependency repair."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2B-AB - admin CSRF proof issuer runtime usage approval lane."
    );
    expect(status).toContain("Last merged phase PR: #69");
    expect(status).toContain(
      "Merge commit: `ca51fc792aa3c34e2b8df314ac7a41b2ebb3244f`"
    );
    expect(roadmap).toContain(
      "Phase 2B-L adds only the server-only Supabase-backed admin profile and membership read boundary"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2B-L adds only the server-only admin profile and membership read boundary"
    );
    expect(projectContext).toContain(
      "Phase 2B-L adds a server-only Supabase-backed admin profile and membership read boundary"
    );
  });

  it("documents the implemented profile and membership boundary and checklist state", () => {
    const design = readRepoFile("docs/ADMIN-AUTH-PROVIDER-SESSION-DESIGN.md");
    const authChecklist = readRepoFile(
      "docs/checklists/PHASE-2B-AUTH-IMPLEMENTATION.md"
    );
    const adminAuthChecklist = readRepoFile(
      "docs/checklists/PHASE-2B-ADMIN-AUTH.md"
    );

    expect(design).toContain(
      "## Phase 2B-L Implemented Profile And Membership Read Boundary"
    );
    expect(design).toContain(
      "`website/lib/admin/authorization/supabase-admin-profile-membership-adapters.ts` is the only approved module for Supabase `admin_users` and `memberships` table reads in this phase."
    );
    expect(design).toContain(
      "It implements the existing `AdminProfileAdapter` and `AdminMembershipAdapter` safe shapes only and is not wired into runtime routes, pages, or server actions."
    );
    expect(design).toContain(
      "It does not default to the plain anon-key Supabase helper."
    );
    expect(design).toContain(
      "Live authenticated read-client wiring remains deferred."
    );

    expectChecked(
      authChecklist,
      "Server-only Supabase admin profile/membership read boundary."
    );
    expectChecked(
      adminAuthChecklist,
      "Add server-only Supabase admin profile/membership read boundary."
    );

    for (const item of [
      "Real auth runtime wiring.",
      "Supabase Auth runtime wiring.",
      "Header reads outside the Phase 2B-V request metadata adapter.",
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

    expectUnchecked(
      adminAuthChecklist,
      "Cookie reads outside the Phase 2B-K server-only identity boundary."
    );
  });

  it("allows cookie reads and Supabase Auth calls only in the identity boundary", () => {
    const productionSources = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const approvedSource = readRepoFile(approvedIdentityBoundaryPath);
    const outsideIdentityBoundary = productionSources
      .filter(({ filePath }) => filePath !== approvedIdentityBoundaryPath &&
          filePath !== approvedRequestMetadataBoundaryPath)
      .map(({ source }) => source)
      .join("\n");

    expect(approvedSource).toContain('import "server-only";');
    expect(approvedSource).toContain('from "@supabase/ssr"');
    expect(approvedSource).toContain('from "next/headers"');
    expect(approvedSource).toContain("cookies()");
    expect(approvedSource).toContain("auth.getUser()");

    expect(outsideIdentityBoundary).not.toContain("@supabase/ssr");
    expect(outsideIdentityBoundary).not.toContain("next/headers");
    expect(outsideIdentityBoundary).not.toContain("cookies()");
    expect(outsideIdentityBoundary).not.toContain("headers()");
    expect(outsideIdentityBoundary).not.toMatch(
      /\.auth\.(?:getUser|getSession|signIn|signOut|setSession|exchangeCodeForSession)/m
    );
  });

  it("allows admin profile and membership table reads only in the Phase 2B-L boundary", () => {
    const productionSources = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const approvedSource = readRepoFile(approvedProfileMembershipBoundaryPath);
    const outsideProfileMembershipBoundary = productionSources
      .filter(
        ({ filePath }) => filePath !== approvedProfileMembershipBoundaryPath
      )
      .map(({ source }) => source)
      .join("\n");

    expect(approvedSource).toContain('import "server-only";');
    expect(approvedSource).not.toContain("createServerSupabaseClient");
    expect(approvedSource).not.toContain("lib/supabase/server");
    expect(approvedSource).toContain('from("admin_users")');
    expect(approvedSource).toContain('from("memberships")');
    expect(approvedSource).not.toContain("next/headers");
    expect(approvedSource).not.toContain("cookies()");
    expect(approvedSource).not.toContain("headers()");
    expect(approvedSource).not.toContain("auth.getUser()");
    expect(approvedSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(approvedSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(approvedSource).not.toContain("chat-config");

    expect(outsideProfileMembershipBoundary).not.toMatch(
      /\.from\(["']admin_users["']\)/m
    );
    expect(outsideProfileMembershipBoundary).not.toMatch(
      /\.from\(["']memberships["']\)/m
    );
  });

  it("keeps routes, protected pages, writes, storage, deployment, n8n, Pinecone, and chat-config out of scope", { timeout: 15000 }, () => {
    const productionSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ])
      .map(({ source }) => source)
      .join("\n");
    const browserSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ])
      .filter(
        ({ filePath }) =>
          !filePath.startsWith("website/app/api/") &&
          !filePath.startsWith("website/lib/supabase/") &&
          filePath !== approvedIdentityBoundaryPath &&
          filePath !== approvedRequestMetadataBoundaryPath &&
          filePath !== approvedProfileMembershipBoundaryPath
      )
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
    expect(readTrackedFiles(["website/lib/storage"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/pinecone"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/pinecone"])).toEqual([]);
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(readTrackedFiles(["vercel.json", ".vercel", "website/vercel.json"])).toEqual([]);

    expect(productionSource).not.toMatch(
      /from\(["'](?:categories|products|product_images)["']\)\s*\.\s*(?:insert|update|upsert|delete)\s*\(/m
    );
    expect(productionSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(productionSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(productionSource).not.toContain("PINECONE_API_KEY");
    expect(productionSource).not.toContain("@pinecone-database");
    expect(productionSource).not.toContain("chat-config");
    expect(browserSource).not.toContain("@supabase/");

    expect(readTrackedFiles(["n8n-workflows"]).sort()).toEqual([
      "n8n-workflows/spacekonceptrental-customer-support-agent.workflow.json",
      "n8n-workflows/spacekonceptrental-error-handler.workflow.json",
      "n8n-workflows/spacekonceptrental-rag-ingestion.workflow.json"
    ]);
  });
});
