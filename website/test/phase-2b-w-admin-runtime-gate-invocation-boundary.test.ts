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
const approvedCsrfIssuerRoutePath =
  "website/app/api/admin/csrf-proof/route.ts";
const approvedCsrfSessionWorkspaceBindingBoundaryPath =
  "website/lib/admin/authorization/server-admin-csrf-proof-session-workspace-binding.ts";
const approvedGateBoundaryPath =
  "website/lib/admin/authorization/server-admin-authorization-gate.ts";
const approvedRequestMetadataBoundaryPath =
  "website/lib/admin/authorization/server-admin-request-metadata-adapter.ts";
const approvedRuntimeGateInvocationBoundaryPath =
  "website/lib/admin/authorization/server-admin-runtime-gate-invocation.ts";
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

describe("Phase 2B-W server-only admin runtime gate invocation boundary", () => {
  it("records Phase 2B-W status, roadmap, decision-log, and project context scope", () => {
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
    expect(status).toContain(
      "Merge commit: `c61fd3511daba3a950e650378eb98152ec6a3ff2`"
    );
    expect(roadmap).toContain(
      "Phase 2B-W adds only the server-only admin runtime gate invocation boundary"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2B-W adds only the server-only admin runtime gate invocation boundary"
    );
    expect(projectContext).toContain(
      "Phase 2B-W adds a server-only admin runtime gate invocation boundary"
    );
  });

  it("documents the invocation boundary and keeps runtime implementation unchecked", () => {
    const design = readRepoFile("docs/ADMIN-AUTH-PROVIDER-SESSION-DESIGN.md");
    const safety = readRepoFile("docs/SAFETY-BOUNDARIES.md");
    const authChecklist = readRepoFile(
      "docs/checklists/PHASE-2B-AUTH-IMPLEMENTATION.md"
    );
    const adminAuthChecklist = readRepoFile(
      "docs/checklists/PHASE-2B-ADMIN-AUTH.md"
    );

    expect(design).toContain(
      "## Phase 2B-W Implemented Admin Runtime Gate Invocation Boundary"
    );
    expect(design).toContain(
      "`website/lib/admin/authorization/server-admin-runtime-gate-invocation.ts` is the only approved module in this phase for composing the Phase 2B-V request metadata adapter with the Phase 2B-T admin authorization gate."
    );
    expect(design).toContain(
      "Creating this invocation helper does not approve using it from runtime routes, pages, server actions, protected admin pages, login/logout, admin UI, or product writes."
    );
    expect(safety).toContain(
      "Phase 2B-W server-only admin runtime gate invocation boundary is approved only as server-only invocation plumbing"
    );

    expectChecked(
      authChecklist,
      "Server-only admin runtime gate invocation boundary."
    );
    expectChecked(
      adminAuthChecklist,
      "Add server-only admin runtime gate invocation boundary."
    );

    for (const item of [
      "Real auth runtime wiring outside the Phase 2B-AN login/logout and protected shell boundary.",
      "Supabase Auth runtime wiring outside the Phase 2B-K/N/AN server-only auth session boundaries.",
      "Resolver/adapter runtime wiring into routes, pages, or server actions.",
      "Admin runtime gate invocation usage from runtime routes, pages, or server actions.",
      "Product-management admin UI.",
      "Product-management admin UI.",
      "Product-management admin UI.",
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

  it("keeps the invocation helper free of direct headers, cookies, providers, and writes", () => {
    const source = readRepoFile(approvedRuntimeGateInvocationBoundaryPath);

    expect(source).toContain('import "server-only";');
    expect(source).toContain("readServerAdminRequestMetadata");
    expect(source).toContain("resolveServerAdminAuthorizationGate");
    expect(source).not.toContain("next/headers");
    expect(source).not.toContain("headers()");
    expect(source).not.toContain("cookies()");
    expect(source).not.toContain("@supabase/ssr");
    expect(source).not.toContain("@supabase/supabase-js");
    expect(source).not.toContain("auth.getUser()");
    expect(source).not.toContain("admin_users");
    expect(source).not.toContain("memberships");
    expect(source).not.toContain("createServerAdminAuthorizationAdapterSet");
    expect(source).not.toContain("validateServerAdminRequestSecurityPreflight");
    expect(source).not.toContain("resolveServerAdminAuthorizationDecision");
    expect(source).not.toContain("issueServerAdminCsrfProof");
    expect(source).not.toContain("verifyServerAdminCsrfProof");
    expect(source).not.toContain("process.env");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("N8N");
    expect(source).not.toContain("PINECONE");
    expect(source).not.toContain("chat-config");
    expect(source).not.toContain(".insert(");
    expect(source).not.toContain(".update(");
    expect(source).not.toContain(".upsert(");
    expect(source).not.toContain(".delete(");
    expect(source).not.toContain('"use server"');
    expect(source).not.toMatch(/from ["'][^"']*app\//m);
  });

  it("keeps approved ownership boundaries narrow while allowing only the invocation helper to call the gate", () => {
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

    expect(
      combinedOutside([
        approvedIdentityBoundaryPath,
        approvedRequestMetadataBoundaryPath
      ])
    ).not.toContain("next/headers");
    expect(
      combinedOutside([
        approvedIdentityBoundaryPath,
        approvedRequestMetadataBoundaryPath
      ])
    ).not.toContain("headers()");
    expect(combinedOutside(approvedIdentityBoundaryPath)).not.toContain(
      "cookies()"
    );
    expect(combinedOutside(approvedProfileMembershipBoundaryPath)).not.toMatch(
      /\.from\(["']admin_users["']\)/m
    );
    expect(combinedOutside(approvedProfileMembershipBoundaryPath)).not.toMatch(
      /\.from\(["']memberships["']\)/m
    );
    expect(combinedOutside(approvedWorkspaceResolverBoundaryPath)).not.toContain(
      "resolveServerAdminWorkspaceForRequest"
    );
    expect(
      combinedOutside([
        approvedCompositionBoundaryPath,
        approvedDecisionBoundaryPath,
        approvedCsrfSessionWorkspaceBindingBoundaryPath
      ])
    ).not.toContain("createServerAdminAuthorizationAdapterSet");
    expect(
      combinedOutside([approvedDecisionBoundaryPath, approvedGateBoundaryPath])
    ).not.toContain("resolveServerAdminAuthorizationDecision");
    expect(
      combinedOutside([approvedPreflightBoundaryPath, approvedGateBoundaryPath])
    ).not.toContain("validateServerAdminRequestSecurityPreflight");
    expect(
      combinedOutside([approvedCsrfVerifierBoundaryPath, approvedGateBoundaryPath])
    ).not.toContain("verifyServerAdminCsrfProof");
    expect(combinedOutside([approvedCsrfIssuerBoundaryPath, approvedCsrfIssuerRoutePath])).not.toContain(
      "issueServerAdminCsrfProof"
    );
    expect(
      combinedOutside([
        approvedGateBoundaryPath,
        approvedRuntimeGateInvocationBoundaryPath
      ])
    ).not.toContain("resolveServerAdminAuthorizationGate");
    expect(
      combinedOutside([
        approvedRequestMetadataBoundaryPath,
        approvedRuntimeGateInvocationBoundaryPath
      ])
    ).not.toContain("readServerAdminRequestMetadata");
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
          filePath !== approvedProfileMembershipBoundaryPath &&
          filePath !== approvedWorkspaceResolverBoundaryPath &&
          filePath !== approvedCompositionBoundaryPath &&
          filePath !== approvedDecisionBoundaryPath &&
          filePath !== approvedPreflightBoundaryPath &&
          filePath !== approvedCsrfVerifierBoundaryPath &&
          filePath !== approvedCsrfIssuerBoundaryPath &&
          filePath !== approvedCsrfIssuerRoutePath &&
          filePath !== approvedCsrfSessionWorkspaceBindingBoundaryPath &&
          filePath !== approvedGateBoundaryPath &&
          filePath !== approvedRequestMetadataBoundaryPath &&
          filePath !== approvedRuntimeGateInvocationBoundaryPath
      )
      .map(({ source }) => source)
      .join("\n");

    expect(readTrackedFiles(["website/app/admin"])).toEqual(
      expect.arrayContaining([
        "website/app/admin/login/page.test.tsx",
        "website/app/admin/login/page.tsx",
        "website/app/admin/logout/route.test.ts",
        "website/app/admin/logout/route.ts",
        "website/app/admin/page.tsx",
        "website/app/admin/protected-admin-shell.test.tsx",
        "website/app/admin/protected-admin-shell.tsx"
      ])
    );
    expect(readTrackedFiles(["website/app/login"])).toEqual([]);
    expect(readTrackedFiles(["website/app/logout"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/auth"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/login"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/logout"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/admin"])).toEqual([
      "website/app/api/admin/admin-access/route.test.ts",
      "website/app/api/admin/admin-access/route.ts",
      "website/app/api/admin/auth-check/route.test.ts",
      "website/app/api/admin/auth-check/route.ts",
      "website/app/api/admin/categories/[categoryId]/archive/route.ts",
      "website/app/api/admin/categories/[categoryId]/route.ts",
      "website/app/api/admin/categories/route.ts",
      "website/app/api/admin/csrf-proof/route.test.ts",
      "website/app/api/admin/csrf-proof/route.ts",
      "website/app/api/admin/hero/route.ts",
      "website/app/api/admin/login/callback/route.test.ts",
      "website/app/api/admin/login/callback/route.ts",
      "website/app/api/admin/login/route.test.ts",
      "website/app/api/admin/login/route.ts",
      "website/app/api/admin/page-media/route.ts",
      "website/app/api/admin/product-images/[imageId]/archive/route.ts",
      "website/app/api/admin/product-images/[imageId]/route.ts",
      "website/app/api/admin/product-images/route.ts",
      "website/app/api/admin/products/[productId]/archive/route.ts",
      "website/app/api/admin/products/[productId]/publish/route.ts",
      "website/app/api/admin/products/[productId]/route.ts",
      "website/app/api/admin/products/route.ts",
      "website/app/api/admin/quote-requests/[quoteRequestId]/crm-handoff/route.ts",
      "website/app/api/admin/quote-requests/[quoteRequestId]/status/route.ts",
      "website/app/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv/manual-import-outcome/route.ts",
      "website/app/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv/preflight/route.ts",
      "website/app/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv/route.ts",
      "website/app/api/admin/quote-requests/crm-handoff-packet/hubspot-sync-dry-run-contract/route.ts",
      "website/app/api/admin/quote-requests/crm-handoff-packet/lifecycle-reconciliation/route.ts",
      "website/app/api/admin/quote-requests/crm-handoff-packet/route.ts"
    ]);
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
      "n8n-workflows/spacekonceptrental-enquiry-handoff.workflow.json",
      "n8n-workflows/spacekonceptrental-error-handler.workflow.json",
      "n8n-workflows/spacekonceptrental-rag-ingestion.workflow.json"
    ]);
  });
});
