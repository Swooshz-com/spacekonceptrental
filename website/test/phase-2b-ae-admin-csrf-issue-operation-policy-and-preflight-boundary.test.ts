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

describe("Phase 2B-AE admin CSRF issue operation policy and preflight boundary", () => {
  it("records Phase 2B-AD as completed with PR #71 merge commit and Phase 2B-AE as current", () => {
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
    expect(status).toContain("Merge commit: `f8c5ceb77ef53243da700d6c76720814864ee770");
    
    expect(roadmap).toContain(
      "Phase 2B-AE adds only the admin CSRF issue operation policy and preflight boundary."
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2B-AE adds only the admin CSRF issue operation policy and preflight boundary."
    );
    expect(projectContext).toContain(
      "Phase 2B-AE adds only the admin CSRF issue operation policy and preflight boundary."
    );
  });

  it("documents issuer operation scope and keeps further runtime implementation unchecked", () => {
    const safety = readRepoFile("docs/SAFETY-BOUNDARIES.md");

    expect(safety).toContain(
      "Phase 2B-AE adds only the admin CSRF issue operation policy and preflight boundary."
    );
    expect(safety).toContain(
      "It does not implement the actual CSRF proof issuer route."
    );
    expect(safety).toContain(
      "It does not issue CSRF proofs from runtime."
    );

    const productionSources = readTrackedProductionSources(["website/app", "website/lib"]);
    
    // Ensure we did not actually implement admin.csrf.issue operation anywhere in production
    // except for policy and preflight boundaries
    productionSources.forEach(({ source, filePath }) => {
      if (
        filePath !== "website/lib/admin/authorization/admin-authorization-policy.ts" &&
        filePath !== "website/lib/admin/authorization/server-admin-request-security-preflight.ts"
      ) {
        expect(source).not.toContain("admin.csrf.issue");
      }
      if (filePath !== "website/lib/admin/authorization/server-admin-csrf-proof-issuer.ts") {
        expect(source).not.toContain("issueServerAdminCsrfProof");
        expect(source).not.toContain("createServerAdminCsrfProofIssuer");
      }
    });
  });
});
