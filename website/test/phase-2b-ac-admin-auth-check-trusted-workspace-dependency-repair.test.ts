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

describe("Phase 2B-AC admin auth-check trusted workspace dependency repair", () => {
  it("records Phase 2B-AB as completed with PR #69 merge commit and Phase 2B-AC as current", () => {
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
    expect(status).toContain("Merge commit: `c61fd3511daba3a950e650378eb98152ec6a3ff2");
    expect(status).toContain(
      "This phase adds a minimal first-party admin login page, server-owned Supabase Auth login/logout routes, and a protected admin shell gated through the approved server-only route-gate path using `admin.shell.access`. It returns only safe unauthenticated, authenticated-but-not-authorised, authorised-admin, and unavailable/misconfigured states. It does not add product-management UI, product/category/product-image write forms, Supabase Storage, binary uploads, deployment config, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access."
    );
    expect(roadmap).toContain(
      "Phase 2B-AC repairs the Phase 2B-AA auth-check route by supplying the trusted"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2B-AC repairs the Phase 2B-AA auth-check route by supplying the trusted"
    );
    expect(projectContext).toContain(
      "Phase 2B-AC repairs the Phase 2B-AA auth-check route by supplying the trusted"
    );
  });

  it("documents repair scope and keeps further runtime usage unchecked", () => {
    const safety = readRepoFile("docs/SAFETY-BOUNDARIES.md");

    expect(safety).toContain(
      "Phase 2B-AC admin auth-check trusted workspace dependency repair remains fail-closed and does not add product writes"
    );

    const productionSources = readTrackedProductionSources(["website/app", "website/lib"]);
    const routeSource = productionSources.find(p => p.filePath === "website/app/api/admin/auth-check/route.ts")?.source || "";

    // The route doesn't call workspace resolver directly
    expect(routeSource).not.toContain("resolveServerAdminWorkspaceForRequest");
    // Doesn't import lower level directly
    expect(routeSource).not.toContain("../../../../lib/admin/authorization/server-admin-workspace-resolver");
    // Doesn't read chat config
    expect(routeSource).not.toContain("chat-config");

    // Only approved config names from env
    const envMatches = routeSource.match(/process\.env\.[A-Z_]+/g) || [];
    const allowedEnv = new Set(["process.env.ADMIN_EXPECTED_ORIGIN", "process.env.ADMIN_EXPECTED_HOST", "process.env.ADMIN_TRUSTED_WORKSPACE_ID"]);
    envMatches.forEach(env => {
      expect(allowedEnv.has(env)).toBe(true);
    });
  });
});
