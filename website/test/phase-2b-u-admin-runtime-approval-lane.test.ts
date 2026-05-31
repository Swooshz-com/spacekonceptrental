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

describe("Phase 2B-U admin runtime wiring approval lane", () => {
  it("records Phase 2B-U as approval/design only in status, roadmap, decision-log, and project context", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const projectContext = readRepoFile("docs/PROJECT-CONTEXT.md");

    expect(status).toContain(
      "Current phase: Phase 2B-AH - admin CSRF proof issuer route runtime boundary."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2B-AG - admin CSRF proof signer and nonce runtime dependency boundary."
    );
    expect(status).toContain("Last merged phase PR: #73");
    expect(status).toContain(
      "Merge commit: `0c6edc05d8baed88ce1014cd9f9dd6c574dfef3d`"
    );
    expect(status).toContain(
      "This phase implements only the missing server-only runtime dependency boundary needed by the existing CSRF proof issuer/verifier contracts. It provides nonce generation, signing, and signature verification using Node server-only crypto. This phase does not implement the actual CSRF proof issuer route. This phase does not add product/category/product image writes, admin UI, pages, server actions, login/logout, protected admin pages, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n workflow changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access."
    );
    expect(roadmap).toContain(
      "Phase 2B-U adds only the admin runtime wiring approval lane"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2B-U adds only the admin runtime wiring approval lane"
    );
    expect(projectContext).toContain(
      "Phase 2B-U adds a docs/checklist-only admin runtime wiring approval lane"
    );
  });

  it("documents the future runtime gate lane and keeps runtime implementation unchecked", () => {
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
      "## Phase 2B-U Approved Future Admin Runtime Gate Usage Lane"
    );
    expect(design).toContain(
      "A future runtime PR may call `resolveServerAdminAuthorizationGate()` only from a first-party server-only route handler or server action after a reviewed request metadata adapter exists."
    );
    expect(design).toContain(
      "The future request metadata adapter is the only future place where real request headers may be read, and it must pass explicit method, Origin, Host, expected Origin, expected Host, request ID, operation, workspace validation, and CSRF proof metadata into the gate."
    );
    expect(design).toContain(
      "Phase 2B-U does not add that metadata adapter, route handler, page, server action, header read, login/logout route, protected admin page, admin UI, product write, Supabase Cloud connection, deployment config, or real env value."
    );
    expect(design).toContain(
      "CSRF proof plus Origin/Host validation must run before any state-changing admin route or server action reaches authorization."
    );
    expect(design).toContain(
      "Preflight-before-decision ordering must be preserved by using the Phase 2B-T gate."
    );
    expect(membershipDesign).toContain(
      "Phase 2B-U adds a docs/checklist-only admin runtime wiring approval lane"
    );
    expect(safety).toContain(
      "Phase 2B-U admin runtime wiring approval lane is docs/checklist approval only"
    );
    expect(safety).not.toContain("chatbot app code.- Future admin auth");
    expect(safety).not.toContain("`website/chat-config.js` access.- Future");

    expectChecked(
      authChecklist,
      "Admin runtime gate usage approval lane."
    );
    expectChecked(
      adminAuthChecklist,
      "Approve future server-only admin authorization gate runtime usage lane."
    );

    for (const item of [
      "Real auth runtime wiring.",
      "Supabase Auth runtime wiring.",
      "Resolver/adapter runtime wiring into routes, pages, or server actions.",
      "Admin authorization gate usage from runtime routes, pages, or server actions.",
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

  it("records required future runtime tests before runtime gate usage can be implemented", () => {
    const design = readRepoFile("docs/ADMIN-AUTH-PROVIDER-SESSION-DESIGN.md");

    for (const requiredTest of [
      "Anonymous denial.",
      "Expired session denial.",
      "Missing or inactive admin profile denial.",
      "Missing, inactive, or wrong-actor membership denial.",
      "Cross-workspace denial.",
      "Viewer write denial.",
      "Admin allowed access.",
      "Owner membership-management allowed access.",
      "Missing, invalid, stale, replayed, or mismatched CSRF proof denial.",
      "Origin/Host mismatch denial.",
      "Safe unavailable result on dependency failure.",
      "No browser Supabase.",
      "No service-role runtime path.",
      "No `website/chat-config.js` access."
    ]) {
      expect(design).toContain(requiredTest);
    }
  });

  it("does not add route handlers, pages, server actions, admin UI, or product write surfaces", { timeout: 15000 }, () => {
    expect(readTrackedFiles(["website/app/admin"])).toEqual([]);
    expect(readTrackedFiles(["website/app/login"])).toEqual([]);
    expect(readTrackedFiles(["website/app/logout"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/auth"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/login"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/logout"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/admin"])).toEqual(["website/app/api/admin/auth-check/route.test.ts", "website/app/api/admin/auth-check/route.ts"]);
    expect(readTrackedFiles(["website/app/api/products"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/categories"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/product-images"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/catalogue"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/storage"])).toEqual([]);
  });

  it("keeps request headers, cookies, provider reads, table reads, and gate runtime usage behind their approved boundaries", () => {
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
    const outsideIdentityBoundary = combinedOutside([approvedIdentityBoundaryPath, approvedRequestMetadataBoundaryPath]);
    const outsideProfileMembershipBoundary = combinedOutside(
      approvedProfileMembershipBoundaryPath
    );
    const outsideGateBoundary = combinedOutside([
      approvedGateBoundaryPath,
      approvedRuntimeGateInvocationBoundaryPath
    ]);

    expect(outsideIdentityBoundary).not.toContain("next/headers");
    expect(outsideIdentityBoundary).not.toContain("headers()");
    expect(outsideIdentityBoundary).not.toContain("cookies()");
    expect(outsideIdentityBoundary).not.toContain("@supabase/ssr");
    expect(outsideIdentityBoundary).not.toMatch(
      /\.auth\.(?:getUser|getSession|signIn|signOut|setSession|exchangeCodeForSession)/m
    );
    expect(outsideProfileMembershipBoundary).not.toMatch(
      /\.from\(["']admin_users["']\)/m
    );
    expect(outsideProfileMembershipBoundary).not.toMatch(
      /\.from\(["']memberships["']\)/m
    );
    expect(combinedOutside(approvedWorkspaceResolverBoundaryPath)).not.toContain(
      "resolveServerAdminWorkspaceForRequest"
    );
    expect(
      combinedOutside([
        approvedCompositionBoundaryPath,
        approvedDecisionBoundaryPath
      ])
    ).not.toContain("createServerAdminAuthorizationAdapterSet");
    expect(
      combinedOutside([approvedDecisionBoundaryPath, approvedGateBoundaryPath])
    ).not.toContain("resolveServerAdminAuthorizationDecision");
    expect(
      combinedOutside([approvedPreflightBoundaryPath, approvedGateBoundaryPath])
    ).not.toContain("validateServerAdminRequestSecurityPreflight");
    expect(combinedOutside(approvedCsrfVerifierBoundaryPath)).not.toContain(
      "verifyServerAdminCsrfProof"
    );
    expect(combinedOutside(approvedCsrfIssuerBoundaryPath)).not.toContain(
      "issueServerAdminCsrfProof"
    );
    expect(outsideGateBoundary).not.toContain(
      "resolveServerAdminAuthorizationGate"
    );
  });

  it("keeps service-role paths, browser Supabase, deployment, n8n, Pinecone, and chat-config out of scope", () => {
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
          filePath !== approvedGateBoundaryPath &&
          filePath !== approvedRuntimeGateInvocationBoundaryPath
      )
      .map(({ source }) => source)
      .join("\n");

    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/pinecone"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/pinecone"])).toEqual([]);
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
