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
      "Current phase: Phase 2B-AJ - admin CSRF proof session/workspace binding runtime dependency boundary."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2B-AI - admin CSRF proof issuer session/workspace binding boundary."
    );
    expect(status).toContain("Last merged phase PR: #76");
    expect(status).toContain("Merge commit: `984b93e490d3e35b7d73995e3a7a0173b409bc1d");
    expect(status).toContain(
      "This phase implements only the missing server-only runtime dependency that derives an opaque admin CSRF session/workspace binding for the existing proof binding boundary. It reuses the existing server-only `ADMIN_CSRF_PROOF_SECRET` with Node crypto, deterministic canonical binding input, and fail-closed handling for missing secrets, malformed input, or crypto failures. This phase does not implement the actual CSRF proof issuer route."
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
