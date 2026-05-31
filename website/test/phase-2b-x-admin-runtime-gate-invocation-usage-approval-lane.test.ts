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
const approvedGateBoundaryPath =
  "website/lib/admin/authorization/server-admin-authorization-gate.ts";
const approvedRequestMetadataBoundaryPath =
  "website/lib/admin/authorization/server-admin-request-metadata-adapter.ts";
const approvedRuntimeGateInvocationBoundaryPath =
  "website/lib/admin/authorization/server-admin-runtime-gate-invocation.ts";
const approvedRuntimeRouteGateAdapterBoundaryPath =
  "website/lib/admin/authorization/server-admin-runtime-route-gate-adapter.ts";
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

describe("Phase 2B-X admin runtime gate invocation usage approval lane", () => {
  it("records Phase 2B-X as approval-lane only and Phase 2B-W as completed", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const roadmap = readRepoFile("docs/PHASE-ROADMAP.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const projectContext = readRepoFile("docs/PROJECT-CONTEXT.md");

    expect(status).toContain(
      "Current phase: Phase 2B-AE - admin CSRF issue operation policy and preflight boundary."
    );
    expect(status).toContain(
      "Latest completed phase: Phase 2B-AD - admin CSRF proof issuer route operation approval boundary."
    );
    expect(status).toContain("Last merged phase PR: #71");
    expect(status).toContain(
      "Merge commit: `219026566257caa8bd87e4e56d6b92d48c1e437b`"
    );
    expect(status).toContain(
      "This phase adds only dedicated `admin.csrf.issue` operation policy/preflight support."
    );
    expect(roadmap).toContain(
      "Phase 2B-X adds only the admin runtime gate invocation usage approval lane"
    );
    expect(decisionLog).toContain(
      "Decision: Phase 2B-X adds only the admin runtime gate invocation usage approval lane"
    );
    expect(projectContext).toContain(
      "Phase 2B-X adds a docs/checklist/static-guard approval lane for future first-party server-only usage of the Phase 2B-W runtime gate invocation helper"
    );
  });

  it("documents the future usage lane and keeps runtime usage unchecked", () => {
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
      "## Phase 2B-X Approved Future Admin Runtime Gate Invocation Usage Lane"
    );
    expect(design).toContain(
      "A future runtime PR may call `resolveServerAdminRuntimeGateInvocation()` only from a first-party server-only route handler or server action."
    );
    expect(design).toContain(
      "Future runtime usage must call only the Phase 2B-W invocation helper from the route/action boundary."
    );
    expect(design).toContain(
      "Header reads must remain inside the Phase 2B-V request metadata adapter."
    );
    expect(design).toContain(
      "Cookie reads and Supabase Auth calls must remain inside the Phase 2B-K/N identity boundary."
    );
    expect(design).toContain(
      "CSRF issuance must remain inside the Phase 2B-S issuer boundary."
    );
    expect(design).toContain(
      "Phase 2B-X does not add route handlers, pages, server actions, runtime helper usage, login/logout, protected admin pages, admin UI, product writes, Storage, deployment, Supabase Cloud, browser Supabase, service-role paths, n8n changes, Pinecone runtime code, SaaS chatbot app work, or `website/chat-config.js` access."
    );
    expect(membershipDesign).toContain(
      "Phase 2B-X adds a docs/checklist/static-guard approval lane for future runtime usage of the Phase 2B-W invocation helper only."
    );
    expect(safety).toContain(
      "Phase 2B-X admin runtime gate invocation usage approval lane is docs/checklist/static-guard approval only"
    );

    expectChecked(
      authChecklist,
      "Admin runtime gate invocation usage approval lane."
    );
    expectChecked(
      adminAuthChecklist,
      "Approve future server-only admin runtime gate invocation usage lane."
    );

    for (const item of [
      "Real auth runtime wiring.",
      "Supabase Auth runtime wiring.",
      "Resolver/adapter runtime wiring into routes, pages, or server actions.",
      "Admin runtime gate invocation usage from runtime routes, pages, or server actions.",
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

  it("keeps runtime gate invocation usage out of routes, pages, and server actions", { timeout: 15000 }, () => {
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
    const appSource = productionSources
      .filter(({ filePath }) => filePath.startsWith("website/app/") && filePath !== "website/app/api/admin/auth-check/route.ts")
      .map(({ source }) => source)
      .join("\n");

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

    expect(appSource).not.toContain("resolveServerAdminRuntimeGateInvocation");
    expect(appSource).not.toContain(
      "server-admin-runtime-gate-invocation"
    );
    expect(combinedOutside([
        approvedRuntimeGateInvocationBoundaryPath,
        approvedRuntimeRouteGateAdapterBoundaryPath
      ])).not.toContain(
      "resolveServerAdminRuntimeGateInvocation"
    );
  });

  it("keeps approved boundary ownership and forbidden imports unchanged", { timeout: 15000 }, () => {
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
          filePath !== approvedGateBoundaryPath &&
          filePath !== approvedRequestMetadataBoundaryPath &&
          filePath !== approvedRuntimeGateInvocationBoundaryPath
      )
      .map(({ source }) => source)
      .join("\n");
    const productionSource = productionSources
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
        approvedDecisionBoundaryPath
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
    expect(combinedOutside(approvedCsrfIssuerBoundaryPath)).not.toContain(
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
      const mangledResolve = "e" + "solveServerAdminRuntimeGateInvocation";
      const escapedResolve = "\\" + "resolveServerAdminRuntimeGateInvocation";
      const mangledAdminUsers = "d" + "min_users";
      const escapedAdminUsers = "\\" + "admin_users";
      const checks: Array<[string, boolean]> = [
        ["literal escaped newline marker", source.includes(escapedTickNewline)],
        [
          "mangled resolveServerAdminRuntimeGateInvocation",
          new RegExp(`(^|[^r])${mangledResolve}`).test(source) ||
            source.includes(escapedResolve)
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
