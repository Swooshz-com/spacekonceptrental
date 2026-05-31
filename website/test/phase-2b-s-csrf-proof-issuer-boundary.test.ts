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
const approvedWorkspaceResolverBoundaryPath =
  "website/lib/admin/authorization/server-admin-workspace-resolver.ts";
const approvedCompositionBoundaryPath =
  "website/lib/admin/authorization/server-admin-authorization-adapter-set.ts";
const approvedDecisionBoundaryPath =
  "website/lib/admin/authorization/server-admin-authorization-decision.ts";
const approvedPreflightBoundaryPath =
  "website/lib/admin/authorization/server-admin-request-security-preflight.ts";
const approvedCsrfVerifierBoundaryPath =
  "website/lib/admin/authorization/server-admin-csrf-proof-verifier.ts";
const approvedCsrfIssuerBoundaryPath =
  "website/lib/admin/authorization/server-admin-csrf-proof-issuer.ts";
const approvedGateBoundaryPath =
  "website/lib/admin/authorization/server-admin-authorization-gate.ts";
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

describe("Phase 2B-S server-only CSRF proof issuer boundary", () => {
  it("records Phase 2B-S status, roadmap, decision-log, and project context scope", () => {
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
      "Phase 2B-S adds only the server-only CSRF proof issuer boundary"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2B-S adds only the server-only CSRF proof issuer boundary"
    );
    expect(projectContext).toContain(
      "Phase 2B-S adds a server-only CSRF proof issuer boundary"
    );
  });

  it("documents the implemented CSRF issuer boundary and checklist state", () => {
    const design = readRepoFile("docs/ADMIN-AUTH-PROVIDER-SESSION-DESIGN.md");
    const membershipDesign = readRepoFile(
      "docs/ADMIN-AUTH-MEMBERSHIP-DESIGN.md"
    );
    const safety = readRepoFile("docs/SAFETY-BOUNDARIES.md");
    const authChecklist = readRepoFile(
      "docs/checklists/PHASE-2B-AUTH-IMPLEMENTATION.md"
    );
    const adminAuthChecklist = readRepoFile(
      "docs/checklists/PHASE-2B-ADMIN-AUTH.md"
    );

    expect(design).toContain(
      "## Phase 2B-S Implemented CSRF Proof Issuer Boundary"
    );
    expect(design).toContain(
      "`website/lib/admin/authorization/server-admin-csrf-proof-issuer.ts` is the only approved module for issuing structured CSRF proofs in this phase."
    );
    expect(design).toContain(
      "The issuer creates verifier-compatible proofs only from explicitly injected operation, session binding, nonce, timestamps, and signer dependencies."
    );
    expect(design).toContain(
      "Creating this CSRF issuer does not approve using it from runtime routes, pages, server actions, protected admin pages, login/logout, admin UI, or product writes."
    );
    expect(membershipDesign).toContain(
      "Phase 2B-S adds a server-only CSRF proof issuer boundary"
    );
    expect(safety).toContain(
      "Phase 2B-S server-only CSRF proof issuer boundary is approved only as a server-only issuer module"
    );

    expectChecked(authChecklist, "Server-only CSRF proof issuer boundary.");
    expectChecked(
      adminAuthChecklist,
      "Add server-only CSRF proof issuer boundary."
    );

    for (const item of [
      "Real auth runtime wiring.",
      "Supabase Auth runtime wiring.",
      "Resolver/adapter runtime wiring into routes, pages, or server actions.",
      "Session-bound admin read-client factory usage from runtime routes, pages, or server actions.",
      "Admin authorization adapter-set usage from runtime routes, pages, or server actions.",
      "Admin authorization decision boundary usage from runtime routes, pages, or server actions.",
      "Admin request security preflight usage from runtime routes, pages, or server actions.",
      "Admin CSRF proof verifier usage from runtime routes, pages, or server actions.",
      "Admin CSRF proof issuer usage from runtime routes, pages, or server actions.",
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
  });

  it("keeps @supabase/ssr, cookie reads, and Supabase Auth calls inside the identity boundary", () => {
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
    expect(approvedSource).toContain("createSessionBoundSupabaseAdminReadClient");

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

    expect(outsideProfileMembershipBoundary).not.toMatch(
      /\.from\(["']admin_users["']\)/m
    );
    expect(outsideProfileMembershipBoundary).not.toMatch(
      /\.from\(["']memberships["']\)/m
    );
  });

  it("keeps each server-only admin boundary in its approved module", () => {
    const productionSources = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const combinedOutside = (approvedPaths: string | string[]) => {
      const excludedPaths = Array.isArray(approvedPaths)
        ? approvedPaths
        : [approvedPaths];

      return productionSources
        .filter(({ filePath }) => !excludedPaths.includes(filePath))
        .map(({ source }) => source)
        .join("\n");
    };

    expect(readRepoFile(approvedWorkspaceResolverBoundaryPath)).toContain(
      "resolveServerAdminWorkspaceForRequest"
    );
    expect(
      combinedOutside(approvedWorkspaceResolverBoundaryPath)
    ).not.toContain("resolveServerAdminWorkspaceForRequest");

    expect(readRepoFile(approvedIdentityBoundaryPath)).toContain(
      "createSessionBoundSupabaseAdminReadClient"
    );
    expect(combinedOutside([approvedIdentityBoundaryPath, approvedRequestMetadataBoundaryPath])).not.toContain(
      "createSupabaseSsrAdminReadClient"
    );

    expect(readRepoFile(approvedCompositionBoundaryPath)).toContain(
      "createServerAdminAuthorizationAdapterSet"
    );
    expect(
      combinedOutside([
        approvedCompositionBoundaryPath,
        approvedDecisionBoundaryPath
      ])
    ).not.toContain("createServerAdminAuthorizationAdapterSet");

    expect(readRepoFile(approvedDecisionBoundaryPath)).toContain(
      "resolveServerAdminAuthorizationDecision"
    );
    expect(
      combinedOutside([approvedDecisionBoundaryPath, approvedGateBoundaryPath])
    ).not.toContain("resolveServerAdminAuthorizationDecision");

    expect(readRepoFile(approvedPreflightBoundaryPath)).toContain(
      "validateServerAdminRequestSecurityPreflight"
    );
    expect(
      combinedOutside([approvedPreflightBoundaryPath, approvedGateBoundaryPath])
    ).not.toContain("validateServerAdminRequestSecurityPreflight");

    expect(readRepoFile(approvedCsrfVerifierBoundaryPath)).toContain(
      "verifyServerAdminCsrfProof"
    );
    expect(combinedOutside(approvedCsrfVerifierBoundaryPath)).not.toContain(
      "verifyServerAdminCsrfProof"
    );
  });

  it("keeps CSRF proof issuance only in the Phase 2B-S issuer boundary", () => {
    const productionSources = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const approvedSource = readRepoFile(approvedCsrfIssuerBoundaryPath);
    const outsideIssuerBoundary = productionSources
      .filter(({ filePath }) => filePath !== approvedCsrfIssuerBoundaryPath)
      .map(({ source }) => source)
      .join("\n");

    expect(approvedSource).toContain('import "server-only";');
    expect(approvedSource).toContain("issueServerAdminCsrfProof");
    expect(approvedSource).toContain("createServerAdminCsrfProofIssuer");
    expect(approvedSource).not.toContain("next/headers");
    expect(approvedSource).not.toContain("headers()");
    expect(approvedSource).not.toContain("cookies()");
    expect(approvedSource).not.toContain("@supabase/ssr");
    expect(approvedSource).not.toContain("@supabase/supabase-js");
    expect(approvedSource).not.toContain("auth.getUser()");
    expect(approvedSource).not.toContain("admin_users");
    expect(approvedSource).not.toContain("memberships");
    expect(approvedSource).not.toContain("createSessionBoundSupabaseAdminReadClient");
    expect(approvedSource).not.toContain("createServerAdminAuthorizationAdapterSet");
    expect(approvedSource).not.toContain("resolveServerAdminAuthorizationDecision");
    expect(approvedSource).not.toContain("resolveAdminAuthorizationWithAdapters");
    expect(approvedSource).not.toContain("validateServerAdminRequestSecurityPreflight");
    expect(approvedSource).not.toContain("verifyServerAdminCsrfProof");
    expect(approvedSource).not.toContain("process.env");
    expect(approvedSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(approvedSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(approvedSource).not.toContain("N8N");
    expect(approvedSource).not.toContain("PINECONE");
    expect(approvedSource).not.toContain("chat-config");
    expect(approvedSource).not.toContain(".from(");
    expect(approvedSource).not.toContain(".insert(");
    expect(approvedSource).not.toContain(".update(");
    expect(approvedSource).not.toContain(".upsert(");
    expect(approvedSource).not.toContain(".delete(");
    expect(approvedSource).not.toContain('"use server"');
    expect(approvedSource).not.toMatch(/from ["'][^"']*app\//m);
    expect(outsideIssuerBoundary).not.toContain("issueServerAdminCsrfProof");
    expect(outsideIssuerBoundary).not.toContain("createServerAdminCsrfProofIssuer");
  });

  it("keeps routes, pages, server actions, writes, storage, deployment, n8n, Pinecone, and chat-config out of scope", { timeout: 15000 }, () => {
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
          filePath !== approvedProfileMembershipBoundaryPath &&
          filePath !== approvedWorkspaceResolverBoundaryPath &&
          filePath !== approvedCompositionBoundaryPath &&
          filePath !== approvedDecisionBoundaryPath &&
          filePath !== approvedPreflightBoundaryPath &&
          filePath !== approvedCsrfVerifierBoundaryPath &&
          filePath !== approvedCsrfIssuerBoundaryPath &&
          filePath !== approvedGateBoundaryPath
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
