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

describe("Phase 2B-AD admin CSRF proof issuer route operation approval boundary", () => {
  it("records Phase 2B-AC as completed with PR #70 merge commit and Phase 2B-AD as current", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const projectContext = readRepoFile("docs/PROJECT-CONTEXT.md");

    expect(status).toContain(
      "Current phase: Phase 2B-AD - admin CSRF proof issuer route operation approval boundary."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2B-AC - admin auth-check trusted workspace dependency repair."
    );
    expect(status).toContain("Last merged phase PR: #70");
    expect(status).toContain("Merge commit: `a3514995eaa6f33e70bcb98161aec1e81d63820d");
    expect(status).toContain(
      "This phase adds a narrow docs/checklist/static-guard approval boundary for the future first-party server-only admin CSRF proof issuer route operation model."
    );
    expect(roadmap).toContain(
      "Phase 2B-AD adds only the admin CSRF proof issuer route operation approval boundary."
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2B-AD adds only the admin CSRF proof issuer route operation approval boundary."
    );
    expect(projectContext).toContain(
      "Phase 2B-AD adds a docs/checklist/static-guard approval boundary for the future first-party server-only admin CSRF proof issuer route operation model."
    );
  });

  it("documents issuer operation scope and keeps further runtime implementation unchecked", () => {
    const safety = readRepoFile("docs/SAFETY-BOUNDARIES.md");

    expect(safety).toContain(
      "Phase 2B-AD admin CSRF proof issuer route operation approval boundary is docs/checklist/static-guard approval only."
    );
    expect(safety).toContain(
      "The future route must not route-gate itself as a state-changing operation (like `product.write`)"
    );
    expect(safety).toContain(
      "It must also not loosely use `admin.auth.check` as a substitute."
    );

    const productionSources = readTrackedProductionSources(["website/app", "website/lib"]);
    const authCheckRoute = productionSources.find(p => p.filePath === "website/app/api/admin/auth-check/route.ts")?.source || "";
    
    // Auth-check route still exists and uses auth-check
    expect(authCheckRoute).toContain("requestedOperation: \"admin.auth.check\"");

    // Ensure we did not actually implement admin.csrf.issue operation anywhere in production
    productionSources.forEach(({ source }) => {
      expect(source).not.toContain("admin.csrf.issue");
      expect(source).not.toContain("resolveServerAdminCsrfProofIssuer");
    });
  });
});
