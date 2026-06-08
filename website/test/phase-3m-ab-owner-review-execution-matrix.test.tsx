import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AdminShellContent } from "../app/admin/protected-admin-shell";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const phase3lMergeCommit = "be7fda99f25f73c86494e1ab323e0624dd917806";
const ownerReviewLedgerPath = "docs/content/OWNER-REVIEW-ISSUE-LEDGER.md";
const ownerReviewExecutionChecklistPath =
  "docs/content/OWNER-REVIEW-EXECUTION-CHECKLIST.md";
const ownerReviewRouteDecisionMatrixPath =
  "docs/content/OWNER-REVIEW-ROUTE-DECISION-MATRIX.md";
const contentReadinessRoutePath = "website/app/admin/content-readiness/page.tsx";
const protectedAdminShellPath = "website/app/admin/protected-admin-shell.tsx";

const forbiddenDeploymentCommandPattern =
  /\bvercel\s+(?:deploy|link|env|pull|promote)\b/i;
const forbiddenSupabaseCloudCommandPattern =
  /\bsupabase\s+(?:link|login|projects|secrets|functions|db\s+(?:push|pull|remote|reset))\b/i;
const forbiddenEnvInstructionPattern =
  /\b(?:create|copy|edit|fill|commit|configure|add)\s+(?:a\s+)?`?\.env/i;
const forbiddenBusinessFactPattern =
  /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy/i;
const forbiddenContactFactPattern =
  /\b(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i;
const forbiddenCommercePattern =
  /\b(?:cart|checkout|payments?|purchase|orders?|customer accounts?|stock reservation|order fulfilment|fulfilment|confirmed booking|online ordering)\b/i;
const ownerOnlyRouteReviewPattern =
  /Owner-review execution checklist|route decision matrix|Admin-only notes|Protected admin content readiness|\/admin\/content-readiness|owner decision needed/i;

function readRepoFile(relativePath: string) {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
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
    .map((filePath) => readRepoFile(filePath))
    .join("\n");
}

describe("Phase 3M-A/B owner review execution matrix", () => {
  afterEach(() => {
    cleanup();
  });

  it("records Phase 3M-A/B as current after Phase 3L completed in PR #134", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const currentStatus = normalizeWhitespace(
      status.split("## Remaining-work map")[0] ?? status
    );
    const roadmap = normalizeWhitespace(readRepoFile("docs/PHASE-ROADMAP.md"));
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const checklist = readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md");
    const ownerReview = readRepoFile("docs/OWNER-REVIEW-READINESS-PACKAGE.md");
    const manualQa = readRepoFile("docs/manual-qa/OWNER-REVIEW-MANUAL-QA.md");
    const handoff = readRepoFile("docs/PREVIEW-DEPLOYMENT-HANDOFF.md");
    const validator = readRepoFile("scripts/validate-preview-handoff.cjs");

    expect(currentStatus).toContain(
      "Current phase: Phase 3M-A/B - owner-review execution checklist, route-by-route decision matrix, and admin review snapshot."
    );
    expect(currentStatus).toContain(
      "Latest completed capability: Phase 3L-A/B protected content readiness workspace, owner-review issue ledger, and public copy fact-safety audit."
    );
    expect(currentStatus).toContain("Last merged capability PR: #134");
    expect(currentStatus).toContain(`Merge commit: \`${phase3lMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3L-A/B status");
    expect(roadmap).toContain(
      "Phase 3M-A/B adds an owner-review execution checklist, route-by-route decision matrix, and admin review snapshot"
    );
    expect(readiness).toContain("Current Phase 3M-A/B status");
    expect(readiness).toContain("Previous Current Phase 3L-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 3M-A/B adds an owner-review execution checklist, route-by-route decision matrix, and admin review snapshot."
    );
    expect(checklist).toContain(
      "## Phase 3M-A/B Owner-Review Execution Checklist Route-By-Route Decision Matrix And Admin Review Snapshot"
    );

    const combinedOwnerDocs = normalizeWhitespace([ownerReview, manualQa, handoff].join("\n"));
    expect(combinedOwnerDocs).toContain(ownerReviewExecutionChecklistPath);
    expect(combinedOwnerDocs).toContain(ownerReviewRouteDecisionMatrixPath);
    expect(combinedOwnerDocs).toContain("/admin/content-readiness");
    expect(combinedOwnerDocs).toContain("Owner-review execution checklist");
    expect(combinedOwnerDocs).toContain("Route-by-route decision matrix");
    expect(validator).toContain(phase3lMergeCommit);
    expect(validator).toContain(ownerReviewExecutionChecklistPath);
    expect(validator).toContain(ownerReviewRouteDecisionMatrixPath);
    expect(validator).toContain("Phase 3M-A/B");
  });

  it("adds a repo-local owner-review execution checklist for required review surfaces", () => {
    expect(existsSync(resolve(repoRoot, ownerReviewExecutionChecklistPath))).toBe(true);
    const executionChecklist = readRepoFile(ownerReviewExecutionChecklistPath);
    const normalizedChecklist = normalizeWhitespace(executionChecklist);

    for (const required of [
      "Public homepage",
      "Public catalogue/listings",
      "Public listing detail",
      "Public categories",
      "Public events/event-use guidance",
      "Public quote/enquiry request flow",
      "Public recovery/not-found states",
      "Protected admin overview",
      "Protected admin listings/categories/media",
      "Protected admin quote inbox/detail",
      "Protected admin content readiness workspace",
      "What to review",
      "Required owner decision",
      "Owner input required fields",
      "Launch/deployment blocker status",
      "Deferred/not-in-scope notes",
      "Public/admin visibility boundary",
      "Owner input required",
      "Blocks launch/deployment",
      "Not in scope by owner direction"
    ]) {
      expect(normalizedChecklist).toContain(required);
    }

    expect(executionChecklist).not.toMatch(forbiddenDeploymentCommandPattern);
    expect(executionChecklist).not.toMatch(forbiddenSupabaseCloudCommandPattern);
    expect(executionChecklist).not.toMatch(forbiddenEnvInstructionPattern);
    expect(executionChecklist).not.toMatch(forbiddenBusinessFactPattern);
    expect(executionChecklist).not.toMatch(forbiddenContactFactPattern);
  });

  it("adds a route-by-route owner decision matrix for public and protected route families", () => {
    expect(existsSync(resolve(repoRoot, ownerReviewRouteDecisionMatrixPath))).toBe(true);
    const routeMatrix = readRepoFile(ownerReviewRouteDecisionMatrixPath);
    const normalizedMatrix = normalizeWhitespace(routeMatrix);

    for (const required of [
      "Route",
      "Audience",
      "Review category",
      "Current readiness status",
      "Owner decision needed",
      "Blocks owner review?",
      "Blocks launch/deployment?",
      "Public-safe notes",
      "Admin-only notes",
      "`/`",
      "`/catalogue`",
      "`/listings`",
      "`/listings/[slug]`",
      "`/catalogue/[slug]`",
      "`/categories`",
      "`/categories/[slug]`",
      "`/events`",
      "`/quote`",
      "Public recovery/not-found",
      "`/admin`",
      "`/admin/listings`",
      "`/admin/categories`",
      "`/admin/media`",
      "`/admin/quotes`",
      "`/admin/quotes/[quoteRequestId]`",
      "`/admin/content-readiness`",
      "Owner input required",
      "Ready for owner review",
      "Blocks launch/deployment",
      "Deferred after launch",
      "Not in scope by owner direction"
    ]) {
      expect(normalizedMatrix).toContain(required);
    }

    expect(routeMatrix).not.toMatch(forbiddenDeploymentCommandPattern);
    expect(routeMatrix).not.toMatch(forbiddenSupabaseCloudCommandPattern);
    expect(routeMatrix).not.toMatch(forbiddenEnvInstructionPattern);
    expect(routeMatrix).not.toMatch(forbiddenBusinessFactPattern);
    expect(routeMatrix).not.toMatch(forbiddenContactFactPattern);
  });

  it("renders the owner-review execution snapshot only inside the protected admin shell", () => {
    expect(existsSync(resolve(repoRoot, contentReadinessRoutePath))).toBe(true);
    const routeSource = readRepoFile(contentReadinessRoutePath);
    const shellSource = readRepoFile(protectedAdminShellPath);

    expect(routeSource).toContain("resolveProtectedAdminShellState");
    expect(routeSource).toContain("AdminShellContent");
    expect(routeSource).toContain('view={{ kind: "content-readiness" }}');
    expect(shellSource).toContain(ownerReviewLedgerPath);
    expect(shellSource).toContain(ownerReviewExecutionChecklistPath);
    expect(shellSource).toContain(ownerReviewRouteDecisionMatrixPath);
    expect(shellSource).toContain("reviewSurfaceGroups");
    expect(shellSource).toContain("routeFamiliesCovered");
    expect(shellSource).toContain("ownerDecisionCategories");
    expect(shellSource).toContain("ownerInputRequiredCategories");
    expect(shellSource).toContain("launchBlockerCategories");

    render(
      <AdminShellContent
        state={{
          status: "authorised_admin",
          dashboard: {
            status: "unavailable"
          },
          quoteInbox: {
            status: "unavailable"
          }
        }}
        view={{ kind: "content-readiness" }}
      />
    );

    expect(
      screen.getByRole("heading", { name: /owner-review execution snapshot/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/review surface groups/i)).toBeInTheDocument();
    expect(screen.getByText(/route families covered/i)).toBeInTheDocument();
    expect(screen.getByText(/owner decision categories/i)).toBeInTheDocument();
    expect(screen.getByText(/owner input required categories/i)).toBeInTheDocument();
    expect(screen.getByText(/launch-blocker categories/i)).toBeInTheDocument();
    expect(screen.getByText(ownerReviewExecutionChecklistPath)).toBeInTheDocument();
    expect(screen.getByText(ownerReviewRouteDecisionMatrixPath)).toBeInTheDocument();
  });

  it("does not render owner-review execution details for blocked admin states", () => {
    for (const state of [
      { status: "unauthenticated" as const },
      { status: "authenticated_not_authorised" as const },
      { status: "unavailable" as const }
    ]) {
      const { unmount } = render(
        <AdminShellContent state={state} view={{ kind: "content-readiness" }} />
      );

      expect(
        screen.queryByText(/owner-review execution snapshot/i)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(ownerReviewRouteDecisionMatrixPath)
      ).not.toBeInTheDocument();
      unmount();
    }
  });

  it("keeps public copy free of fake business facts, ecommerce wording, and owner-only route review details", () => {
    const publicSource = readTrackedProductionSources([
      "website/app/layout.tsx",
      "website/app/page.tsx",
      "website/app/listings",
      "website/app/categories",
      "website/app/catalogue",
      "website/app/events",
      "website/app/quote",
      "website/components/QuoteRequestForm.tsx",
      "website/components/ChatWidget.tsx"
    ]);

    expect(publicSource).not.toMatch(forbiddenContactFactPattern);
    expect(publicSource).not.toMatch(forbiddenBusinessFactPattern);
    expect(publicSource).not.toMatch(forbiddenCommercePattern);
    expect(publicSource).not.toMatch(ownerOnlyRouteReviewPattern);
  });

  it("keeps Phase 3M inside repo-local no-provider, no-deploy, no-ecommerce scope", () => {
    const packageSource = [
      readRepoFile("package.json"),
      readRepoFile("website/package.json")
    ].join("\n");
    const appAndLibSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);

    expect(packageSource).not.toMatch(/@pinecone-database|pinecone/i);
    expect(appAndLibSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(appAndLibSource).not.toContain("NEXT_PUBLIC_N8N");
    expect(appAndLibSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(appAndLibSource).not.toMatch(/PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i);
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(readTrackedFiles(["vercel.json", "website/vercel.json", ".vercel"])).toEqual([]);
    expect(readTrackedFiles(["supabase/config.toml", "supabase/.branches"])).toEqual([]);
    expect(readTrackedFiles(["docs/evidence", "docs/production-evidence"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer-uploads"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public/uploads"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer-accounts"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/quote-tracking"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/quote-status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/quote/status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/notifications"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/crm"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/chat/retrieval"])).toEqual([]);
  });
});
