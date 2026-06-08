import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AdminShellContent } from "../app/admin/protected-admin-shell";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const phase3nMergeCommit = "98d62e9d6641d0d34770c76f156e914be5ba4edd";
const correctionIntakePath =
  "docs/content/OWNER-REVIEW-CORRECTION-INTAKE.md";
const launchBlockerFreezeGatePath =
  "docs/content/OWNER-REVIEW-LAUNCH-BLOCKER-FREEZE-GATE.md";
const correctionPrPlanPath =
  "docs/content/OWNER-REVIEW-CORRECTION-PR-PLAN.md";
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
const ownerOnlyCorrectionPattern =
  /Owner-review correction intake|launch-blocker freeze gate|correction PR plan|Correction\/freeze snapshot|Admin-only notes|Protected admin content readiness|\/admin\/content-readiness|owner-only statuses|Correction template only|Owner input required|Blocks owner review|Blocks launch\/deployment|Requires separate deployment approval/i;
const filledReviewEvidencePattern =
  /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|production evidence captured|preview evidence captured/i;

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

describe("Phase 3O-A/B owner review correction freeze gate", () => {
  afterEach(() => {
    cleanup();
  });

  it("records Phase 3O-A/B as current after Phase 3N completed in PR #136", () => {
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
      "Current phase: Phase 3O-A/B - owner-review correction intake, launch-blocker freeze gate, and admin triage snapshot."
    );
    expect(currentStatus).toContain(
      "Latest completed capability: Phase 3N-A/B owner-review dry-run packet, findings disposition workflow, and launch hold/approve rehearsal."
    );
    expect(currentStatus).toContain("Last merged capability PR: #136");
    expect(currentStatus).toContain(`Merge commit: \`${phase3nMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3N-A/B status");
    expect(roadmap).toContain(
      "Phase 3O-A/B adds owner-review correction intake, a launch-blocker freeze gate, and admin triage snapshot"
    );
    expect(readiness).toContain("Current Phase 3O-A/B status");
    expect(readiness).toContain("Previous Current Phase 3N-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 3O-A/B adds owner-review correction intake, a launch-blocker freeze gate, and admin triage snapshot."
    );
    expect(checklist).toContain(
      "## Phase 3O-A/B Owner-Review Correction Intake Launch-Blocker Freeze Gate And Admin Triage Snapshot"
    );

    const combinedOwnerDocs = normalizeWhitespace([ownerReview, manualQa, handoff].join("\n"));
    expect(combinedOwnerDocs).toContain(correctionIntakePath);
    expect(combinedOwnerDocs).toContain(launchBlockerFreezeGatePath);
    expect(combinedOwnerDocs).toContain(correctionPrPlanPath);
    expect(combinedOwnerDocs).toContain("Owner-review correction intake");
    expect(combinedOwnerDocs).toContain("launch-blocker freeze gate");
    expect(combinedOwnerDocs).toContain("correction PR plan");
    expect(validator).toContain(phase3nMergeCommit);
    expect(validator).toContain(correctionIntakePath);
    expect(validator).toContain(launchBlockerFreezeGatePath);
    expect(validator).toContain(correctionPrPlanPath);
    expect(validator).toContain("Phase 3O-A/B");
  });

  it("adds a template-only correction intake doc with safe categories and statuses", () => {
    expect(existsSync(resolve(repoRoot, correctionIntakePath))).toBe(true);
    const intake = readRepoFile(correctionIntakePath);
    const normalizedIntake = normalizeWhitespace(intake);

    for (const required of [
      "repo-local and template-only",
      "No actual owner corrections are recorded in this phase",
      "No owner sign-off is recorded",
      "No deployment approval is created",
      "Missing owner facts remain `Owner input required`",
      "Public homepage copy",
      "Public catalogue/listing summary copy",
      "Public listing detail copy",
      "Category/event-use wording",
      "Quote/enquiry expectation wording",
      "Image selection and alt text",
      "Protected admin listing/category/media workflow",
      "Protected admin quote workflow",
      "Legal/policy/contact/business-hour content",
      "Launch/deployment approval boundary",
      "Correction template only",
      "Owner input required",
      "Ready for local correction PR",
      "Blocks owner review",
      "Blocks launch/deployment",
      "Deferred after launch",
      "Not in scope by owner direction",
      "Requires separate deployment approval",
      "<correction category>",
      "<owner correction placeholder>",
      "<safe correction status>",
      "<future local PR placeholder>",
      "<evidence handling placeholder>"
    ]) {
      expect(normalizedIntake).toContain(required);
    }

    expect(intake).not.toMatch(forbiddenDeploymentCommandPattern);
    expect(intake).not.toMatch(forbiddenSupabaseCloudCommandPattern);
    expect(intake).not.toMatch(forbiddenEnvInstructionPattern);
    expect(intake).not.toMatch(forbiddenBusinessFactPattern);
    expect(intake).not.toMatch(forbiddenContactFactPattern);
    expect(intake).not.toMatch(filledReviewEvidencePattern);
  });

  it("adds a launch-blocker freeze gate with placeholder-only non-deployment boundaries", () => {
    expect(existsSync(resolve(repoRoot, launchBlockerFreezeGatePath))).toBe(true);
    const freezeGate = readRepoFile(launchBlockerFreezeGatePath);
    const normalizedFreezeGate = normalizeWhitespace(freezeGate);

    for (const required of [
      "repo-local gate",
      "does not approve launch or deployment",
      "Owner-review blockers",
      "Launch/deployment blockers",
      "Deferred after launch",
      "Not in scope by owner direction",
      "Requires separate deployment approval",
      "Not evaluated",
      "Owner input required",
      "Blocked before owner review closes",
      "Blocked before launch planning",
      "Ready for later planning, not deployment approval",
      "Public launch remains blocked until owner-required facts and explicit deployment approval both exist",
      "No production evidence is created",
      "No preview evidence is filled",
      "No provider config is changed",
      "No route, upload, account, notification, CRM, Pinecone, n8n, or RAG runtime is added",
      "<freeze area>",
      "<freeze state>",
      "<owner input placeholder>",
      "<local blocker placeholder>"
    ]) {
      expect(normalizedFreezeGate).toContain(required);
    }

    expect(freezeGate).not.toMatch(forbiddenDeploymentCommandPattern);
    expect(freezeGate).not.toMatch(forbiddenSupabaseCloudCommandPattern);
    expect(freezeGate).not.toMatch(forbiddenEnvInstructionPattern);
    expect(freezeGate).not.toMatch(forbiddenBusinessFactPattern);
    expect(freezeGate).not.toMatch(forbiddenContactFactPattern);
    expect(freezeGate).not.toMatch(filledReviewEvidencePattern);
  });

  it("adds a correction PR plan for future owner-supplied corrections without implementing them", () => {
    expect(existsSync(resolve(repoRoot, correctionPrPlanPath))).toBe(true);
    const plan = readRepoFile(correctionPrPlanPath);
    const normalizedPlan = normalizeWhitespace(plan);

    for (const required of [
      "does not implement actual owner corrections",
      "Public copy correction PR",
      "Listing/category content correction PR",
      "Image/alt-text correction PR",
      "Quote/enquiry wording correction PR",
      "Protected admin workflow wording correction PR",
      "Legal/policy/contact content PR",
      "only when owner supplies approved content",
      "Deployment planning PR",
      "only after separate explicit approval",
      "Allowed changes",
      "Forbidden changes",
      "Required validation",
      "Evidence handling",
      "repo-local and non-deployment"
    ]) {
      expect(normalizedPlan).toContain(required);
    }

    expect(plan).not.toMatch(forbiddenDeploymentCommandPattern);
    expect(plan).not.toMatch(forbiddenSupabaseCloudCommandPattern);
    expect(plan).not.toMatch(forbiddenEnvInstructionPattern);
    expect(plan).not.toMatch(forbiddenBusinessFactPattern);
    expect(plan).not.toMatch(forbiddenContactFactPattern);
    expect(plan).not.toMatch(filledReviewEvidencePattern);
  });

  it("renders the correction/freeze snapshot only inside the protected admin shell", () => {
    expect(existsSync(resolve(repoRoot, contentReadinessRoutePath))).toBe(true);
    const routeSource = readRepoFile(contentReadinessRoutePath);
    const shellSource = readRepoFile(protectedAdminShellPath);

    expect(routeSource).toContain("resolveProtectedAdminShellState");
    expect(routeSource).toContain("AdminShellContent");
    expect(routeSource).toContain('view={{ kind: "content-readiness" }}');
    expect(shellSource).toContain(correctionIntakePath);
    expect(shellSource).toContain(launchBlockerFreezeGatePath);
    expect(shellSource).toContain(correctionPrPlanPath);
    expect(shellSource).toContain("ownerCorrectionCategories");
    expect(shellSource).toContain("ownerCorrectionStatuses");
    expect(shellSource).toContain("launchBlockerFreezeStates");
    expect(shellSource).toContain("futureCorrectionPrTypes");
    expect(shellSource).toContain("correctionFreezeDeploymentBoundary");

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
      screen.getByRole("heading", { name: /correction\/freeze snapshot/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/correction categories/i)).toBeInTheDocument();
    expect(screen.getByText(/correction statuses/i)).toBeInTheDocument();
    expect(screen.getByText(/freeze states/i)).toBeInTheDocument();
    expect(screen.getByText(/future correction PR types/i)).toBeInTheDocument();
    expect(screen.getByText(/correction freeze boundary/i)).toBeInTheDocument();
    expect(screen.getByText(correctionIntakePath)).toBeInTheDocument();
    expect(screen.getByText(launchBlockerFreezeGatePath)).toBeInTheDocument();
    expect(screen.getByText(correctionPrPlanPath)).toBeInTheDocument();
  });

  it("does not render correction/freeze details for blocked admin states", () => {
    for (const state of [
      { status: "unauthenticated" as const },
      { status: "authenticated_not_authorised" as const },
      { status: "unavailable" as const }
    ]) {
      const { unmount } = render(
        <AdminShellContent state={state} view={{ kind: "content-readiness" }} />
      );

      expect(screen.queryByText(/correction\/freeze snapshot/i)).not.toBeInTheDocument();
      expect(screen.queryByText(correctionIntakePath)).not.toBeInTheDocument();
      expect(screen.queryByText(correctionPrPlanPath)).not.toBeInTheDocument();
      unmount();
    }
  });

  it("keeps public copy free of correction/freeze details, fake facts, ecommerce wording, and owner-only statuses", () => {
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
    expect(publicSource).not.toMatch(ownerOnlyCorrectionPattern);
  });

  it("keeps Phase 3O inside repo-local no-provider, no-deploy, no-evidence scope", () => {
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
      readRepoFile(correctionIntakePath),
      readRepoFile(launchBlockerFreezeGatePath),
      readRepoFile(correctionPrPlanPath)
    ].join("\n");

    expect(packageSource).not.toMatch(/@pinecone-database|pinecone/i);
    expect(appAndLibSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(appAndLibSource).not.toContain("NEXT_PUBLIC_N8N");
    expect(appAndLibSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(appAndLibSource).not.toMatch(/PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i);
    expect(newDocs).not.toMatch(filledReviewEvidencePattern);
    expect(
      readTrackedFiles([
        "website/chat-config.js",
        "vercel.json",
        "website/vercel.json",
        ".vercel",
        "supabase/config.toml",
        "supabase/.branches",
        "docs/evidence",
        "docs/production-evidence",
        "docs/owner-review-evidence",
        "docs/preview-evidence",
        "website/app/api/customer-uploads",
        "website/app/api/public/uploads",
        "website/app/api/customer-accounts",
        "website/app/api/quote-tracking",
        "website/app/api/quote-status",
        "website/app/quote/status",
        "website/app/api/notifications",
        "website/app/api/crm",
        "website/app/api/chat/retrieval"
      ])
    ).toEqual([]);
  });
});
