import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "..");
const approvedIdentityBoundaryPath =
  "website/lib/admin/authorization/supabase-admin-auth-identity-adapter.ts";
const approvedProfileMembershipBoundaryPath =
  "website/lib/admin/authorization/supabase-admin-profile-membership-adapters.ts";
const approvedWorkspaceResolverBoundaryPath =
  "website/lib/admin/authorization/server-admin-workspace-resolver.ts";
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

describe("Phase 2B-M server-only admin workspace resolution boundary", () => {
  it("records Phase 2B-M status, roadmap, decision-log, and project context scope", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const projectContext = readRepoFile("docs/PROJECT-CONTEXT.md");

    expect(status).toContain(
      "Current phase: Phase 2B-U - admin runtime wiring approval lane."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2B-T - server-only admin authorization gate composition boundary."
    );
    expect(status).toContain("Last merged phase PR: #60");
    expect(status).toContain(
      "Merge commit: `2052f33a68f4c4d141821264bfa8d757e5b23159`"
    );
    expect(roadmap).toContain(
      "Phase 2B-M adds only the server-only admin workspace resolution boundary"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2B-M adds only the server-only admin workspace resolution boundary"
    );
    expect(projectContext).toContain(
      "Phase 2B-M adds a server-only admin workspace resolution boundary"
    );
  });

  it("documents the implemented workspace resolver boundary and checklist state", () => {
    const design = readRepoFile("docs/ADMIN-AUTH-PROVIDER-SESSION-DESIGN.md");
    const authChecklist = readRepoFile(
      "docs/checklists/PHASE-2B-AUTH-IMPLEMENTATION.md"
    );
    const adminAuthChecklist = readRepoFile(
      "docs/checklists/PHASE-2B-ADMIN-AUTH.md"
    );

    expect(design).toContain(
      "## Phase 2B-M Implemented Workspace Resolution Boundary"
    );
    expect(design).toContain(
      "`website/lib/admin/authorization/server-admin-workspace-resolver.ts` is the only approved module for admin workspace resolution in this phase."
    );
    expect(design).toContain(
      "It implements the existing `AdminWorkspaceResolver` safe shape only and is not wired into runtime routes, pages, or server actions."
    );
    expect(design).toContain(
      "Browser/request workspace IDs are validation-only and never become authority."
    );
    expect(design).toContain(
      "The boundary fails closed with `{ serverResolvedWorkspaceId: null }` without an explicitly injected trusted server-side workspace ID."
    );

    expectChecked(
      authChecklist,
      "Server-only admin workspace resolution boundary."
    );
    expectChecked(
      adminAuthChecklist,
      "Add server-only admin workspace resolution boundary."
    );

    for (const item of [
      "Real auth runtime wiring.",
      "Supabase Auth runtime wiring.",
      "Resolver/adapter runtime wiring into routes, pages, or server actions.",
      "Header reads.",
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
    expectUnchecked(
      authChecklist,
      "Admin workspace resolution outside the Phase 2B-M server-only workspace boundary."
    );
    expectUnchecked(
      adminAuthChecklist,
      "Admin workspace resolution outside the Phase 2B-M server-only workspace boundary."
    );
  });

  it("keeps cookie reads and Supabase Auth calls only in the identity boundary", () => {
    const productionSources = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const approvedSource = readRepoFile(approvedIdentityBoundaryPath);
    const outsideIdentityBoundary = productionSources
      .filter(({ filePath }) => filePath !== approvedIdentityBoundaryPath)
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

  it("keeps admin profile and membership table reads only in the Phase 2B-L boundary", () => {
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

  it("keeps the Phase 2B-M workspace resolver free of runtime and provider shortcuts", () => {
    const source = readRepoFile(approvedWorkspaceResolverBoundaryPath);

    expect(source).toContain('import "server-only";');
    expect(source).toContain("AdminWorkspaceResolver");
    expect(source).toContain("serverResolvedWorkspaceId");
    expect(source).not.toContain("@supabase/");
    expect(source).not.toContain("createServerSupabaseClient");
    expect(source).not.toContain("next/headers");
    expect(source).not.toContain("cookies()");
    expect(source).not.toContain("headers()");
    expect(source).not.toContain("auth.getUser()");
    expect(source).not.toContain("process.env");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("N8N_CHAT_WEBHOOK_URL");
    expect(source).not.toContain("@n8n/chat");
    expect(source).not.toContain("PINECONE");
    expect(source).not.toContain("@pinecone-database");
    expect(source).not.toContain("chat-config");
    expect(source).not.toContain("catalogue_public_workspace_config");
    expect(source).not.toContain("CATALOGUE_WORKSPACE_ID");
    expect(source).not.toContain(".from(");
    expect(source).not.toContain(".insert(");
    expect(source).not.toContain(".update(");
    expect(source).not.toContain(".upsert(");
    expect(source).not.toContain(".delete(");
  });

  it("keeps routes, pages, server actions, writes, storage, deployment, n8n, Pinecone, and chat-config out of scope", () => {
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
          filePath !== approvedProfileMembershipBoundaryPath &&
          filePath !== approvedWorkspaceResolverBoundaryPath
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

    expect(productionSource).not.toContain('"use server"');
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
