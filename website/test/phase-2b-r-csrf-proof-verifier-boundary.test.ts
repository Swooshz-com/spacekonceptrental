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

describe("Phase 2B-R server-only CSRF proof verifier boundary", () => {
  it("records Phase 2B-R status, roadmap, decision-log, and project context scope", () => {
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
    expect(status).toContain(
      "Merge commit: `f8c5ceb77ef53243da700d6c76720814864ee770`"
    );
    expect(roadmap).toContain(
      "Phase 2B-R adds only the server-only CSRF proof verifier boundary"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2B-R adds only the server-only CSRF proof verifier boundary"
    );
    expect(projectContext).toContain(
      "Phase 2B-R adds a server-only CSRF proof verifier boundary"
    );
  });

  it("documents the implemented CSRF verifier boundary and checklist state", () => {
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
      "## Phase 2B-R Implemented CSRF Proof Verifier Boundary"
    );
    expect(design).toContain(
      "`website/lib/admin/authorization/server-admin-csrf-proof-verifier.ts` is the only approved module for validating structured CSRF proofs in this phase."
    );
    expect(design).toContain(
      "The verifier validates only explicitly injected proof material and dependency-injected signature or replay checks."
    );
    expect(design).toContain(
      "Creating this CSRF verifier does not approve using it from runtime routes, pages, server actions, protected admin pages, login/logout, admin UI, or product writes."
    );
    expect(membershipDesign).toContain(
      "Phase 2B-R adds a server-only CSRF proof verifier boundary"
    );
    expect(safety).toContain(
      "Phase 2B-R server-only CSRF proof verifier boundary is approved only as a server-only verifier module"
    );

    expectChecked(authChecklist, "Server-only CSRF proof verifier boundary.");
    expectChecked(
      adminAuthChecklist,
      "Add server-only CSRF proof verifier boundary."
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

  it("keeps workspace resolver implementation only in the Phase 2B-M boundary", () => {
    const productionSources = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const approvedSource = readRepoFile(approvedWorkspaceResolverBoundaryPath);
    const outsideWorkspaceImplementation = productionSources
      .filter(({ filePath }) => filePath !== approvedWorkspaceResolverBoundaryPath)
      .map(({ source }) => source)
      .join("\n");

    expect(approvedSource).toContain("createServerAdminWorkspaceResolver");
    expect(approvedSource).toContain("resolveServerAdminWorkspaceForRequest");
    expect(approvedSource).toContain("trustedServerWorkspaceId");

    expect(outsideWorkspaceImplementation).not.toContain(
      "resolveServerAdminWorkspaceForRequest"
    );
    expect(outsideWorkspaceImplementation).not.toContain(
      "function normalizeWorkspaceId"
    );
    expect(outsideWorkspaceImplementation).not.toContain(
      "catalogue_public_workspace_config"
    );
  });

  it("keeps session-bound read-client creation implementation only in the Phase 2B-N identity boundary", () => {
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

    expect(approvedSource).toContain("createSessionBoundSupabaseAdminReadClient");
    expect(approvedSource).toContain("createSupabaseSsrAdminReadClient");

    expect(outsideIdentityBoundary).not.toContain("createSupabaseSsrAdminReadClient");
    expect(outsideIdentityBoundary).not.toContain("createServerClient");
    expect(outsideIdentityBoundary).not.toContain("@supabase/ssr");
  });

  it("keeps adapter-set composition implementation only in the Phase 2B-O boundary", () => {
    const productionSources = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const approvedSource = readRepoFile(approvedCompositionBoundaryPath);
    const outsideCompositionImplementation = productionSources
      .filter(
        ({ filePath }) =>
          filePath !== approvedCompositionBoundaryPath &&
          filePath !== approvedDecisionBoundaryPath &&
          filePath !== approvedIdentityBoundaryPath &&
          filePath !== approvedRequestMetadataBoundaryPath &&
          filePath !== approvedProfileMembershipBoundaryPath &&
          filePath !== approvedWorkspaceResolverBoundaryPath
      )
      .map(({ source }) => source)
      .join("\n");

    expect(approvedSource).toContain("createSupabaseAdminAuthIdentityAdapter");
    expect(approvedSource).toContain("createSupabaseAdminProfileAdapter");
    expect(approvedSource).toContain("createSupabaseAdminMembershipAdapter");
    expect(approvedSource).toContain("createServerAdminWorkspaceResolver");

    expect(outsideCompositionImplementation).not.toContain(
      "createSupabaseAdminProfileAdapter"
    );
    expect(outsideCompositionImplementation).not.toContain(
      "createSupabaseAdminMembershipAdapter"
    );
    expect(outsideCompositionImplementation).not.toContain(
      "createSupabaseAdminAuthIdentityAdapter"
    );
    expect(outsideCompositionImplementation).not.toContain(
      "createServerAdminWorkspaceResolver"
    );
  });

  it("keeps composed decision resolution only in the Phase 2B-P decision boundary", () => {
    const productionSources = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const approvedSource = readRepoFile(approvedDecisionBoundaryPath);
    const outsideDecisionBoundary = productionSources
      .filter(
        ({ filePath }) =>
          filePath !== approvedDecisionBoundaryPath &&
          filePath !== approvedGateBoundaryPath
      )
      .map(({ source }) => source)
      .join("\n");

    expect(approvedSource).toContain("resolveServerAdminAuthorizationDecision");
    expect(approvedSource).toContain("createServerAdminAuthorizationAdapterSet");
    expect(approvedSource).toContain("resolveAdminAuthorizationWithAdapters");

    expect(outsideDecisionBoundary).not.toContain(
      "resolveServerAdminAuthorizationDecision"
    );
  });

  it("keeps request-security preflight validation only in the Phase 2B-Q preflight boundary", () => {
    const productionSources = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const approvedSource = readRepoFile(approvedPreflightBoundaryPath);
    const outsidePreflightBoundary = productionSources
      .filter(
        ({ filePath }) =>
          filePath !== approvedPreflightBoundaryPath &&
          filePath !== approvedGateBoundaryPath
      )
      .map(({ source }) => source)
      .join("\n");

    expect(approvedSource).toContain("validateServerAdminRequestSecurityPreflight");
    expect(approvedSource).toContain("ServerAdminCsrfProofVerifierInput");

    expect(outsidePreflightBoundary).not.toContain(
      "validateServerAdminRequestSecurityPreflight"
    );
  });

  it("keeps the CSRF proof verifier module server-only and free of direct runtime/provider shortcuts", () => {
    const source = readRepoFile(approvedCsrfVerifierBoundaryPath);

    expect(source).toContain('import "server-only";');
    expect(source).toContain("createServerAdminCsrfProofVerifier");
    expect(source).toContain("verifyServerAdminCsrfProof");
    expect(source).not.toContain("next/headers");
    expect(source).not.toContain("headers()");
    expect(source).not.toContain("cookies()");
    expect(source).not.toContain("@supabase/ssr");
    expect(source).not.toContain("@supabase/supabase-js");
    expect(source).not.toContain("auth.getUser()");
    expect(source).not.toContain("admin_users");
    expect(source).not.toContain("memberships");
    expect(source).not.toContain("createSessionBoundSupabaseAdminReadClient");
    expect(source).not.toContain("createServerAdminAuthorizationAdapterSet");
    expect(source).not.toContain("resolveServerAdminAuthorizationDecision");
    expect(source).not.toContain("resolveAdminAuthorizationWithAdapters");
    expect(source).not.toContain("process.env");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("N8N");
    expect(source).not.toContain("PINECONE");
    expect(source).not.toContain("chat-config");
    expect(source).not.toContain(".from(");
    expect(source).not.toContain(".insert(");
    expect(source).not.toContain(".update(");
    expect(source).not.toContain(".upsert(");
    expect(source).not.toContain(".delete(");
    expect(source).not.toContain('"use server"');
    expect(source).not.toMatch(/from ["'][^"']*app\//m);
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
