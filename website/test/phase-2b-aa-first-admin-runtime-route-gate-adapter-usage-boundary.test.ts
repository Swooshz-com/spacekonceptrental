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
const approvedRuntimeRouteGateAdapterBoundaryPath =
  "website/lib/admin/authorization/server-admin-runtime-route-gate-adapter.ts";
const approvedAdminProductWriteRouteBoundaryPath =
  "website/lib/products/persistence/admin-product-write-route.ts";
const approvedAdminQuoteStatusRouteBoundaryPath =
  "website/lib/quote/admin-write/admin-quote-request-status-route.ts";
const approvedAdminQuoteCrmHandoffRouteBoundaryPath =
  "website/lib/quote/admin-write/admin-quote-request-crm-handoff-route.ts";
const approvedAdminQuoteCrmHandoffPacketRouteBoundaryPath =
  "website/lib/quote/admin-read/admin-quote-request-crm-handoff-packet-route.ts";
const approvedAdminQuoteHubSpotImportCsvRouteBoundaryPath =
  "website/lib/quote/admin-read/admin-quote-request-hubspot-import-csv-route.ts";
const approvedAdminQuoteHubSpotImportCsvPreflightRouteBoundaryPath =
  "website/lib/quote/admin-read/admin-quote-request-hubspot-import-csv-preflight-route.ts";
const approvedAdminQuoteHubSpotManualImportOutcomeRouteBoundaryPath =
  "website/lib/quote/admin-read/admin-quote-request-hubspot-manual-import-outcome-route.ts";
const approvedMediaUploadRouteBoundaryPath =
  "website/lib/products/media/admin-product-image-upload-route.ts";
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

describe("Phase 2B-AA first admin runtime route gate adapter usage boundary", () => {
  it("records Phase 2B-AA as completed and Phase 2B-Z as completed", () => {
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
    expect(status).toContain(
      "This phase adds a minimal first-party admin login page, server-owned Supabase Auth login/logout routes, and a protected admin shell gated through the approved server-only route-gate path using `admin.shell.access`. It returns only safe unauthenticated, authenticated-but-not-authorised, authorised-admin, and unavailable/misconfigured states. It does not add product-management UI, product/category/product-image write forms, Supabase Storage, binary uploads, deployment config, Supabase Cloud, browser Supabase, service-role runtime paths, n8n changes, Pinecone runtime code, SaaS chatbot work, or `website/chat-config.js` access."
    );
    expect(roadmap).toContain(
      "Phase 2B-AA adds the first admin runtime route gate adapter usage boundary"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2B-AA adds the first admin runtime route gate adapter usage boundary"
    );
    expect(projectContext).toContain(
      "Phase 2B-AA adds the first admin runtime route gate adapter usage boundary"
    );
  });

  it("documents the new usage boundary and keeps further runtime usage unchecked", () => {
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
      "## Phase 2B-AA Implemented First Admin Runtime Route Gate Adapter Usage Boundary"
    );
    expect(design).toContain(
      "Phase 2B-AA implemented the first admin runtime route gate adapter usage boundary, and the"
    );
    expect(design).toContain(
      "Future runtime usage must call only the Phase 2B-Y route gate adapter from the route/action boundary."
    );
    expect(design).toContain(
      "Header reads must remain inside the Phase 2B-V request metadata adapter."
    );
    expect(design).toContain(
      "Runtime gate invocation must remain inside the Phase 2B-W invocation boundary."
    );
    expect(design).toContain(
      "Creating this first runtime boundary does not approve adding or using other route handlers, pages, server actions, login/logout routes, protected admin pages, admin UI, product writes, Storage, deployment, Supabase Cloud, browser Supabase, service-role runtime paths, n8n workflow changes, Pinecone runtime code, SaaS chatbot app work, or `website/chat-config.js` access."
    );
    expect(membershipDesign).toContain(
      "Latest completed admin/auth boundary state: Phase 2B-AN admin auth login/logout"
    );
    expect(safety).toContain(
      "Phase 2B-AA first admin runtime route gate adapter usage boundary is approved only as exactly one harmless GET authorization probe/check route handler"
    );

    expectChecked(
      authChecklist,
      "First admin runtime route gate adapter usage boundary."
    );
    expectChecked(
      adminAuthChecklist,
      "Add first admin runtime route gate adapter usage boundary."
    );

    for (const item of [
      "Real auth runtime wiring outside the Phase 2B-AN login/logout and protected shell boundary.",
      "Supabase Auth runtime wiring outside the Phase 2B-K/N/AN server-only auth session boundaries.",
      "Resolver/adapter runtime wiring into routes, pages, or server actions.",
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

  it("restricts route gate adapter usage to exactly one approved route handler", { timeout: 15000 }, () => {
    const productionSources = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const appSourceOutsideAuthCheck = productionSources
      .filter(({ filePath }) => filePath.startsWith("website/app/") && filePath !== "website/app/api/admin/auth-check/route.ts" &&
          filePath !== "website/app/api/admin/login/route.ts" &&
          filePath !== "website/app/api/admin/csrf-proof/route.ts" &&
          filePath !== "website/app/api/admin/quote-requests/crm-handoff-packet/route.ts" &&
          filePath !== "website/app/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv/manual-import-outcome/route.ts" &&
          filePath !== "website/app/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv/preflight/route.ts" &&
          filePath !== "website/app/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv/route.ts" &&
          filePath !== "website/app/api/admin/quote-requests/[quoteRequestId]/crm-handoff/route.ts" &&
          filePath !== "website/app/api/admin/quote-requests/[quoteRequestId]/status/route.ts" &&
          filePath !== "website/app/admin/protected-admin-shell.tsx")
      .map(({ source }) => source)
      .join("\n");
    const productionOutsideRouteAdapterAndAuthCheck = productionSources
      .filter(
        ({ filePath }) =>
          filePath !== approvedRuntimeRouteGateAdapterBoundaryPath &&
          filePath !== approvedAdminProductWriteRouteBoundaryPath &&
          filePath !== approvedAdminQuoteStatusRouteBoundaryPath &&
          filePath !== approvedAdminQuoteCrmHandoffRouteBoundaryPath &&
          filePath !== approvedAdminQuoteCrmHandoffPacketRouteBoundaryPath &&
          filePath !== approvedAdminQuoteHubSpotImportCsvRouteBoundaryPath &&
          filePath !== approvedAdminQuoteHubSpotImportCsvPreflightRouteBoundaryPath &&
          filePath !== approvedAdminQuoteHubSpotManualImportOutcomeRouteBoundaryPath &&
          filePath !== approvedMediaUploadRouteBoundaryPath &&
          filePath !== "website/app/api/admin/auth-check/route.ts" &&
          filePath !== "website/app/api/admin/login/route.ts" &&
          filePath !== "website/app/api/admin/csrf-proof/route.ts" &&
          filePath !== "website/app/api/admin/quote-requests/crm-handoff-packet/route.ts" &&
          filePath !== "website/app/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv/manual-import-outcome/route.ts" &&
          filePath !== "website/app/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv/preflight/route.ts" &&
          filePath !== "website/app/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv/route.ts" &&
          filePath !== "website/app/api/admin/quote-requests/[quoteRequestId]/crm-handoff/route.ts" &&
          filePath !== "website/app/api/admin/quote-requests/[quoteRequestId]/status/route.ts" &&
          filePath !== "website/app/admin/protected-admin-shell.tsx"
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
      "website/app/api/admin/auth-check/route.test.ts",
      "website/app/api/admin/auth-check/route.ts",
      "website/app/api/admin/categories/[categoryId]/archive/route.ts",
      "website/app/api/admin/categories/[categoryId]/route.ts",
      "website/app/api/admin/categories/route.ts",
      "website/app/api/admin/csrf-proof/route.test.ts",
      "website/app/api/admin/csrf-proof/route.ts",
      "website/app/api/admin/login/route.test.ts",
      "website/app/api/admin/login/route.ts",
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
      "website/app/api/admin/quote-requests/crm-handoff-packet/route.ts"
    ]);
    expect(readTrackedFiles(["website/app/api/products"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/categories"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/product-images"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/catalogue"])).toEqual([]);

    expect(appSourceOutsideAuthCheck).not.toContain("server-admin-runtime-route-gate-adapter");
    expect(appSourceOutsideAuthCheck).not.toContain("resolveServerAdminRuntimeRouteGateAdapter");
    expect(productionOutsideRouteAdapterAndAuthCheck).not.toContain(
      "server-admin-runtime-route-gate-adapter"
    );
    expect(productionOutsideRouteAdapterAndAuthCheck).not.toContain(
      "resolveServerAdminRuntimeRouteGateAdapter"
    );
    expect(productionOutsideRouteAdapterAndAuthCheck).not.toContain('"use server"');
  });

  it("keeps lower-level ownership and forbidden runtime surfaces unchanged", { timeout: 15000 }, () => {
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
    const productionSource = productionSources
      .map(({ source }) => source)
      .join("\n");
    const browserSource = productionSources
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
          filePath !== approvedRuntimeGateInvocationBoundaryPath &&
          filePath !== approvedRuntimeRouteGateAdapterBoundaryPath &&
          filePath !== approvedAdminQuoteHubSpotImportCsvRouteBoundaryPath &&
          filePath !== approvedAdminQuoteHubSpotImportCsvPreflightRouteBoundaryPath &&
          filePath !== approvedAdminQuoteHubSpotManualImportOutcomeRouteBoundaryPath &&
          filePath !== approvedMediaUploadRouteBoundaryPath
      )
      .map(({ source }) => source)
      .join("\n");

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
    expect(
      combinedOutside([
        approvedRuntimeGateInvocationBoundaryPath,
        approvedRuntimeRouteGateAdapterBoundaryPath,
        approvedAdminQuoteHubSpotImportCsvRouteBoundaryPath,
        approvedAdminQuoteHubSpotImportCsvPreflightRouteBoundaryPath,
        approvedAdminQuoteHubSpotManualImportOutcomeRouteBoundaryPath
      ])
    ).not.toContain("resolveServerAdminRuntimeGateInvocation");

    expect(productionSource).not.toMatch(
      /from\(["'](?:categories|products|product_images)["']\)\s*\.\s*(?:insert|update|upsert|delete)\s*\(/m
    );
    expect(productionSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(productionSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(productionSource).not.toContain("PINECONE_API_KEY");
    expect(productionSource).not.toContain("@pinecone-database");
    expect(productionSource).not.toContain("chat-config");
    expect(browserSource).not.toContain("@supabase/");
    expect(readTrackedFiles(["website/lib/storage"])).toEqual([]);
    expect(readTrackedFiles(["website/lib/pinecone"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/pinecone"])).toEqual([]);
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(readTrackedFiles(["vercel.json", ".vercel", "website/vercel.json"])).toEqual([]);
    expect(readTrackedFiles(["n8n-workflows"]).sort()).toEqual([
      "n8n-workflows/spacekonceptrental-customer-support-agent.workflow.json",
      "n8n-workflows/spacekonceptrental-error-handler.workflow.json",
      "n8n-workflows/spacekonceptrental-rag-ingestion.workflow.json"
    ]);
  });

  it("keeps tracked Markdown docs and guard tests free of escaped-newline and identifier corruption", { timeout: 15000 }, () => {
    const scannedFiles = readTrackedFiles(["docs", "website/test"])
      .filter(
        (filePath) =>
          filePath.endsWith(".md") ||
          filePath.endsWith(".ts") ||
          filePath.endsWith(".tsx")
      );
    const failures: string[] = [];

    for (const filePath of scannedFiles) {
      const source = readRepoFile(filePath);
      const isMarkdown = filePath.endsWith(".md");
      const escapedTickNewline = "`" + "r`n";
      const mangledInvocation = "e" + "solveServerAdminRuntimeGateInvocation";
      const escapedInvocation =
        "\\" + "resolveServerAdminRuntimeGateInvocation";
      const mangledRouteGate =
        "e" + "solveServerAdminRuntimeRouteGateAdapter";
      const escapedRouteGate =
        "\\" + "resolveServerAdminRuntimeRouteGateAdapter";
      const mangledAdminUsers = "d" + "min_users";
      const escapedAdminUsers = "\\" + "admin_users";
      const checks: Array<[string, boolean]> = [
        ["literal escaped newline marker", source.includes(escapedTickNewline)],
        [
          "mangled resolveServerAdminRuntimeGateInvocation",
          new RegExp(`(^|[^r])${mangledInvocation}`).test(source) ||
            source.includes(escapedInvocation)
        ],
        [
          "mangled resolveServerAdminRuntimeRouteGateAdapter",
          new RegExp(`(^|[^r])${mangledRouteGate}`).test(source) ||
            source.includes(escapedRouteGate)
        ],
        [
          "mangled admin_users",
          new RegExp(`(^|[^a])${mangledAdminUsers}`).test(source) ||
            source.includes(escapedAdminUsers)
        ],
        [
          "control-character corruption",
          /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(source)
        ]
      ];

      if (isMarkdown) {
        checks.push(["raw escaped newline text", /\\[rn]/.test(source)]);
      }

      for (const [reason, failed] of checks) {
        if (failed) {
          failures.push(`${filePath}: ${reason}`);
        }
      }
    }

    expect(failures).toEqual([]);
  });
});
