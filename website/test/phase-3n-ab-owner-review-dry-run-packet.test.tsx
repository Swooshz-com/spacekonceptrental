import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AdminShellContent } from "../app/admin/protected-admin-shell";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const phase3mMergeCommit = "0528ad92ad756a68d2094a16cd204f1c404c99a3";
const ownerReviewDryRunPacketPath =
  "docs/content/OWNER-REVIEW-DRY-RUN-PACKET.md";
const ownerReviewFindingsDispositionPath =
  "docs/content/OWNER-REVIEW-FINDINGS-DISPOSITION.md";
const ownerReviewLaunchDecisionRehearsalPath =
  "docs/content/OWNER-REVIEW-LAUNCH-DECISION-REHEARSAL.md";
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
const ownerOnlyDryRunPattern =
  /Owner-review dry-run packet|findings disposition|launch decision rehearsal|Dry-run review snapshot|Admin-only notes|Protected admin content readiness|\/admin\/content-readiness|owner-only statuses|Owner input required|Blocks owner review|Blocks launch\/deployment|Requires separate deployment approval/i;
const filledEvidencePattern =
  /owner approved|owner sign-?off complete|actual finding|actual owner decision|review completed on|signed off by|production evidence captured|preview evidence captured/i;

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

describe("Phase 3N-A/B owner review dry-run packet", () => {
  afterEach(() => {
    cleanup();
  });

  it("records Phase 3N-A/B as current after Phase 3M completed in PR #135", () => {
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
      "Current phase: Phase 3N-A/B - owner-review dry-run packet, findings disposition workflow, and launch hold/approve rehearsal."
    );
    expect(currentStatus).toContain(
      "Latest completed capability: Phase 3M-A/B owner-review execution checklist, route-by-route decision matrix, and admin review snapshot."
    );
    expect(currentStatus).toContain("Last merged capability PR: #135");
    expect(currentStatus).toContain(`Merge commit: \`${phase3mMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3M-A/B status");
    expect(roadmap).toContain(
      "Phase 3N-A/B adds an owner-review dry-run packet, findings disposition workflow, and launch hold/approve rehearsal"
    );
    expect(readiness).toContain("Current Phase 3N-A/B status");
    expect(readiness).toContain("Previous Current Phase 3M-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 3N-A/B adds an owner-review dry-run packet, findings disposition workflow, and launch hold/approve rehearsal."
    );
    expect(checklist).toContain(
      "## Phase 3N-A/B Owner-Review Dry-Run Packet Findings Disposition Workflow And Launch Hold/Approve Rehearsal"
    );

    const combinedOwnerDocs = normalizeWhitespace([ownerReview, manualQa, handoff].join("\n"));
    expect(combinedOwnerDocs).toContain(ownerReviewDryRunPacketPath);
    expect(combinedOwnerDocs).toContain(ownerReviewFindingsDispositionPath);
    expect(combinedOwnerDocs).toContain(ownerReviewLaunchDecisionRehearsalPath);
    expect(combinedOwnerDocs).toContain("Owner-review dry-run packet");
    expect(combinedOwnerDocs).toContain("findings disposition workflow");
    expect(combinedOwnerDocs).toContain("launch hold/approve rehearsal");
    expect(validator).toContain(phase3mMergeCommit);
    expect(validator).toContain(ownerReviewDryRunPacketPath);
    expect(validator).toContain(ownerReviewFindingsDispositionPath);
    expect(validator).toContain(ownerReviewLaunchDecisionRehearsalPath);
    expect(validator).toContain("Phase 3N-A/B");
  });

  it("adds a dry-run packet template for required public and protected review areas", () => {
    expect(existsSync(resolve(repoRoot, ownerReviewDryRunPacketPath))).toBe(true);
    const packet = readRepoFile(ownerReviewDryRunPacketPath);
    const normalizedPacket = normalizeWhitespace(packet);

    for (const required of [
      "dry-run/template only",
      "does not claim owner review has happened",
      "does not include filled owner-review evidence",
      "Public homepage",
      "Public catalogue/listings",
      "Public listing detail routes",
      "Public categories",
      "Public events/event-use guidance",
      "Public quote/enquiry request flow",
      "Public recovery/not-found states",
      "Protected admin overview",
      "Protected admin listings/categories/media",
      "Protected admin quote inbox/detail",
      "Protected admin content readiness workspace",
      "Review objective",
      "Questions for the owner",
      "Safe outcome statuses",
      "Owner input required placeholders",
      "Blocks owner review?",
      "Blocks launch/deployment?",
      "Deferred/not-in-scope notes",
      "Public/admin visibility boundary",
      "Owner input required",
      "Requires separate deployment approval"
    ]) {
      expect(normalizedPacket).toContain(required);
    }

    expect(packet).not.toMatch(forbiddenDeploymentCommandPattern);
    expect(packet).not.toMatch(forbiddenSupabaseCloudCommandPattern);
    expect(packet).not.toMatch(forbiddenEnvInstructionPattern);
    expect(packet).not.toMatch(forbiddenBusinessFactPattern);
    expect(packet).not.toMatch(forbiddenContactFactPattern);
    expect(packet).not.toMatch(filledEvidencePattern);
  });

  it("adds a findings disposition workflow with safe placeholder-only rows", () => {
    expect(existsSync(resolve(repoRoot, ownerReviewFindingsDispositionPath))).toBe(true);
    const disposition = readRepoFile(ownerReviewFindingsDispositionPath);
    const normalizedDisposition = normalizeWhitespace(disposition);

    for (const required of [
      "No issue found",
      "Owner input required",
      "Change requested before owner review closes",
      "Blocks owner review",
      "Blocks launch/deployment",
      "Deferred after launch",
      "Not in scope by owner direction",
      "Requires separate deployment approval",
      "template table",
      "<review area>",
      "<finding summary placeholder>",
      "<safe status>",
      "<owner input placeholder>",
      "<next local action>",
      "Do not fill real findings in this PR",
      "does not claim real owner sign-off",
      "does not add production evidence",
      "does not add preview evidence"
    ]) {
      expect(normalizedDisposition).toContain(required);
    }

    expect(disposition).not.toMatch(forbiddenDeploymentCommandPattern);
    expect(disposition).not.toMatch(forbiddenSupabaseCloudCommandPattern);
    expect(disposition).not.toMatch(forbiddenEnvInstructionPattern);
    expect(disposition).not.toMatch(forbiddenBusinessFactPattern);
    expect(disposition).not.toMatch(forbiddenContactFactPattern);
    expect(disposition).not.toMatch(filledEvidencePattern);
  });

  it("adds launch hold/approve rehearsal language without recording decisions", () => {
    expect(existsSync(resolve(repoRoot, ownerReviewLaunchDecisionRehearsalPath))).toBe(true);
    const rehearsal = readRepoFile(ownerReviewLaunchDecisionRehearsalPath);
    const normalizedRehearsal = normalizeWhitespace(rehearsal);

    for (const required of [
      "Continue owner review",
      "Hold launch",
      "Ready for later deployment planning",
      "Approve future deployment separately",
      "This phase does not approve deployment",
      "Any future deployment approval must be explicit and separate",
      "Missing owner-required facts keep launch blocked",
      "No production evidence is created",
      "No provider config is changed",
      "template language only",
      "not real owner decisions",
      "Requires separate deployment approval"
    ]) {
      expect(normalizedRehearsal).toContain(required);
    }

    expect(rehearsal).not.toMatch(forbiddenDeploymentCommandPattern);
    expect(rehearsal).not.toMatch(forbiddenSupabaseCloudCommandPattern);
    expect(rehearsal).not.toMatch(forbiddenEnvInstructionPattern);
    expect(rehearsal).not.toMatch(forbiddenBusinessFactPattern);
    expect(rehearsal).not.toMatch(forbiddenContactFactPattern);
    expect(rehearsal).not.toMatch(filledEvidencePattern);
  });

  it("renders the dry-run snapshot only inside the protected admin shell", () => {
    expect(existsSync(resolve(repoRoot, contentReadinessRoutePath))).toBe(true);
    const routeSource = readRepoFile(contentReadinessRoutePath);
    const shellSource = readRepoFile(protectedAdminShellPath);

    expect(routeSource).toContain("resolveProtectedAdminShellState");
    expect(routeSource).toContain("AdminShellContent");
    expect(routeSource).toContain('view={{ kind: "content-readiness" }}');
    expect(shellSource).toContain(ownerReviewDryRunPacketPath);
    expect(shellSource).toContain(ownerReviewFindingsDispositionPath);
    expect(shellSource).toContain(ownerReviewLaunchDecisionRehearsalPath);
    expect(shellSource).toContain("dryRunReviewAreas");
    expect(shellSource).toContain("findingDispositionStatuses");
    expect(shellSource).toContain("launchDecisionRehearsalStates");
    expect(shellSource).toContain("dryRunOwnerInputRequiredCategories");
    expect(shellSource).toContain("explicitDeploymentApprovalBoundary");

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
      screen.getByRole("heading", { name: /dry-run review snapshot/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/dry-run review areas/i)).toBeInTheDocument();
    expect(screen.getByText(/finding disposition statuses/i)).toBeInTheDocument();
    expect(screen.getByText(/launch decision rehearsal states/i)).toBeInTheDocument();
    expect(screen.getAllByText(/owner input required categories/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/explicit deployment approval boundary/i)).toBeInTheDocument();
    expect(screen.getByText(ownerReviewDryRunPacketPath)).toBeInTheDocument();
    expect(screen.getByText(ownerReviewFindingsDispositionPath)).toBeInTheDocument();
    expect(screen.getByText(ownerReviewLaunchDecisionRehearsalPath)).toBeInTheDocument();
  });

  it("does not render dry-run review details for blocked admin states", () => {
    for (const state of [
      { status: "unauthenticated" as const },
      { status: "authenticated_not_authorised" as const },
      { status: "unavailable" as const }
    ]) {
      const { unmount } = render(
        <AdminShellContent state={state} view={{ kind: "content-readiness" }} />
      );

      expect(screen.queryByText(/dry-run review snapshot/i)).not.toBeInTheDocument();
      expect(screen.queryByText(ownerReviewDryRunPacketPath)).not.toBeInTheDocument();
      expect(
        screen.queryByText(ownerReviewLaunchDecisionRehearsalPath)
      ).not.toBeInTheDocument();
      unmount();
    }
  });

  it("keeps public copy free of dry-run details, fake facts, ecommerce wording, and owner-only statuses", () => {
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
    expect(publicSource).not.toMatch(ownerOnlyDryRunPattern);
  });

  it("keeps Phase 3N inside repo-local no-provider, no-deploy, no-evidence scope", () => {
    const packageSource = [
      readRepoFile("package.json"),
      readRepoFile("website/package.json")
    ].join("\n");
    const appAndLibSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const newDocs = [
      readRepoFile(ownerReviewDryRunPacketPath),
      readRepoFile(ownerReviewFindingsDispositionPath),
      readRepoFile(ownerReviewLaunchDecisionRehearsalPath)
    ].join("\n");

    expect(packageSource).not.toMatch(/@pinecone-database|pinecone/i);
    expect(appAndLibSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(appAndLibSource).not.toContain("NEXT_PUBLIC_N8N");
    expect(appAndLibSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(appAndLibSource).not.toMatch(/PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i);
    expect(newDocs).not.toMatch(filledEvidencePattern);
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(readTrackedFiles(["vercel.json", "website/vercel.json", ".vercel"])).toEqual([]);
    expect(readTrackedFiles(["supabase/config.toml", "supabase/.branches"])).toEqual([]);
    expect(readTrackedFiles(["docs/evidence", "docs/production-evidence"])).toEqual([]);
    expect(readTrackedFiles(["docs/owner-review-evidence"])).toEqual([]);
    expect(readTrackedFiles(["docs/preview-evidence"])).toEqual([]);
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
