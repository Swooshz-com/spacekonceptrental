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
      "Current phase: Phase 2B-AK - admin CSRF proof issuer route implementation."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2B-AJ - admin CSRF proof session/workspace binding runtime dependency boundary."
    );
    expect(status).toContain("Last merged phase PR: #77");
    expect(status).toContain("Merge commit: `75b9ea7b3dea43b5160fc7d0ad9a98ed5a22f0d7");
    expect(status).toContain(
      "This phase implements only the first-party server-only `POST /api/admin/csrf-proof` proof issuer route at `website/app/api/admin/csrf-proof/route.ts`. The route validates safe JSON input, gates itself through the approved `admin.csrf.issue` route-gate lane, resolves the target operation binding through the Phase 2B-AI boundary and Phase 2B-AJ runtime deriver, and issues short-lived CSRF proofs for `product.write`, `category.write`, `productImage.write`, and `membership.manage`. Product/category/product image write routes remain deferred."
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

    // The Phase 2B-AK issuer route is the only approved runtime use of admin.csrf.issue.
    productionSources.forEach(({ source, filePath }) => {
      if (
        filePath !== "website/lib/admin/authorization/admin-authorization-policy.ts" &&
        filePath !== "website/lib/admin/authorization/server-admin-request-security-preflight.ts" &&
        filePath !== "website/app/api/admin/csrf-proof/route.ts"
      ) {
        expect(source).not.toContain("admin.csrf.issue");
      }
      if (
        filePath !== "website/lib/admin/authorization/server-admin-csrf-proof-issuer.ts" &&
        filePath !== "website/app/api/admin/csrf-proof/route.ts"
      ) {
        expect(source).not.toContain("issueServerAdminCsrfProof");
        expect(source).not.toContain("createServerAdminCsrfProofIssuer");
      }
    });
  });

  it("protects Phase 2B-Y/Z/AA ladder wording in the admin auth checklist", () => {
    const adminAuthChecklist = readRepoFile("docs/checklists/PHASE-2B-ADMIN-AUTH.md");
    expect(adminAuthChecklist).toContain("Phase 2B-Y adds only the server-only admin runtime route gate adapter");
    expect(adminAuthChecklist).toContain("boundary. Phase 2B-Z approves only the future admin runtime route gate adapter");
    expect(adminAuthChecklist).toContain("Phase 2B-AA adds the first admin runtime route gate adapter usage");
    expect(adminAuthChecklist).toContain("boundary as exactly one harmless GET authorization probe/check route handler.");
  });
});
