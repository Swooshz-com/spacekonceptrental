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
      "Current phase: Phase 2B-AF - admin CSRF proof issuer route readiness and route-if-safe boundary."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2B-AE - admin CSRF issue operation policy and preflight boundary."
    );
    expect(status).toContain("Last merged phase PR: #72");
    expect(status).toContain("Merge commit: `f8c5ceb77ef53243da700d6c76720814864ee770");
    expect(status).toContain(
      "This phase implements only docs/checklist/static-guard approval for the admin CSRF proof issuer route readiness. The actual route implementation is intentionally deferred because the required runtime `signCsrfProof` and `generateNonce` dependencies are not yet implemented or approved. This phase preserves the existing `admin.csrf.issue` operation policy and preflight boundaries. This phase does not add product/category/product image writes, admin UI, pages, server actions, login/logout, protected admin pages, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n workflow changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access."
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

  it("protects Phase 2B-Y/Z/AA ladder wording in the admin auth checklist", () => {
    const adminAuthChecklist = readRepoFile("docs/checklists/PHASE-2B-ADMIN-AUTH.md");
    expect(adminAuthChecklist).toContain("Phase 2B-Y adds only the server-only admin runtime route gate adapter boundary.");
    expect(adminAuthChecklist).toContain("Phase 2B-Z approves only the future admin runtime route gate adapter usage lane.");
    expect(adminAuthChecklist).toContain("Phase 2B-AA adds the first admin runtime route gate adapter usage boundary as exactly one harmless GET authorization probe/check route handler.");
  });
});
