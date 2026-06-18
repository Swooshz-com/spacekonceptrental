import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AdminShellContent } from "../app/admin/protected-admin-shell";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const phase3oMergeCommit = "fd5614bb1e0a9e0e33f064ecaba7bc85dba36efb";
const ownerReviewClosurePacketPath =
  "docs/content/OWNER-REVIEW-CLOSURE-PACKET.md";
const ownerReviewClosureSignoffTemplatePath =
  "docs/content/OWNER-REVIEW-CLOSURE-SIGN-OFF-TEMPLATE.md";
const ownerReviewDeploymentApprovalSeparationPath =
  "docs/content/OWNER-REVIEW-DEPLOYMENT-APPROVAL-SEPARATION.md";
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
const forbiddenTransactionTermPattern = new RegExp(
  `\\b(?:${[
    "ecom" + "merce",
    "ca" + "rt",
    "check" + "out",
    "ord" + "er",
    "pay" + "ment",
    "pur" + "chase"
  ].join("|")})s?\\b`,
  "i"
);
const ownerOnlyClosurePattern =
  /Owner-review closure packet|Owner-review closure sign-off template|deployment approval separation|Closure readiness snapshot|Protected admin content readiness|\/admin\/content-readiness|Current owner-review closure state|Closure template only|Deployment approval status|DEPLOYMENT APPROVAL: NOT GRANTED/i;
const filledReviewEvidencePattern =
  /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|production evidence captured|preview evidence captured|actual owner decision|actual owner sign-off/i;

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

function extractRequiredSection(source: string, start: string, end?: string) {
  const startIndex = source.indexOf(start);
  expect(startIndex).toBeGreaterThanOrEqual(0);

  if (!end) {
    return source.slice(startIndex);
  }

  const endIndex = source.indexOf(end, startIndex + start.length);
  expect(endIndex).toBeGreaterThan(startIndex);
  return source.slice(startIndex, endIndex);
}

describe("Phase 3P-A/B owner review closure package", () => {
  afterEach(() => {
    cleanup();
  });

  it("records Phase 3P-A/B as current after Phase 3O completed in PR #137", () => {
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
      "Current phase: Phase 3P-A/B - owner-review closure packet, readiness sign-off template, and deployment approval separation."
    );
    expect(currentStatus).toContain(
      "Latest completed capability: Phase 3O-A/B owner-review correction intake, launch-blocker freeze gate, and admin triage snapshot."
    );
    expect(currentStatus).toContain("Last merged capability PR: #137");
    expect(currentStatus).toContain(`Merge commit: \`${phase3oMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3O-A/B status");
    expect(roadmap).toContain(
      "Phase 3P-A/B adds an owner-review closure packet, readiness sign-off template, and deployment approval separation"
    );
    expect(readiness).toContain("Current Phase 3P-A/B status");
    expect(readiness).toContain("Previous Current Phase 3O-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 3P-A/B adds an owner-review closure packet, readiness sign-off template, and deployment approval separation."
    );
    expect(checklist).toContain(
      "## Phase 3P-A/B Owner-Review Closure Packet Readiness Sign-Off Template And Deployment Approval Separation"
    );

    const combinedOwnerDocs = normalizeWhitespace([ownerReview, manualQa, handoff].join("\n"));
    expect(combinedOwnerDocs).toContain(ownerReviewClosurePacketPath);
    expect(combinedOwnerDocs).toContain(ownerReviewClosureSignoffTemplatePath);
    expect(combinedOwnerDocs).toContain(ownerReviewDeploymentApprovalSeparationPath);
    expect(combinedOwnerDocs).toContain("Owner-review closure packet");
    expect(combinedOwnerDocs).toContain("readiness sign-off template");
    expect(combinedOwnerDocs).toContain("deployment approval separation");
    expect(validator).toContain(phase3oMergeCommit);
    expect(validator).toContain(ownerReviewClosurePacketPath);
    expect(validator).toContain(ownerReviewClosureSignoffTemplatePath);
    expect(validator).toContain(ownerReviewDeploymentApprovalSeparationPath);
    expect(validator).toContain("Phase 3P-A/B");
  });

  it("adds a template-only owner-review closure packet with required closure states", () => {
    expect(existsSync(resolve(repoRoot, ownerReviewClosurePacketPath))).toBe(true);
    const packet = readRepoFile(ownerReviewClosurePacketPath);
    const normalizedPacket = normalizeWhitespace(packet);

    for (const required of [
      "repo-local and template-only",
      "This is not deployment approval",
      "This is not owner sign-off",
      "This is not preview evidence",
      "Owner review can continue",
      "Owner review is blocked",
      "Owner review is locally ready to close",
      "Launch/deployment remains separately blocked unless explicitly approved",
      "Owner-review closure readiness",
      "Deployment approval",
      "Preview evidence",
      "Production launch",
      "Post-launch monitoring",
      "[OWNER NAME / ROLE]",
      "[REVIEW DATE]",
      "[ROUTE / AREA]",
      "[DECISION: CONTINUE / BLOCKED / READY TO CLOSE]",
      "[OPEN ITEM SUMMARY]",
      "[REQUIRED FOLLOW-UP]",
      "[DEPLOYMENT APPROVAL: NOT GRANTED]"
    ]) {
      expect(normalizedPacket).toContain(required);
    }

    expect(packet).not.toMatch(forbiddenDeploymentCommandPattern);
    expect(packet).not.toMatch(forbiddenSupabaseCloudCommandPattern);
    expect(packet).not.toMatch(forbiddenEnvInstructionPattern);
    expect(packet).not.toMatch(forbiddenBusinessFactPattern);
    expect(packet).not.toMatch(forbiddenContactFactPattern);
    expect(packet).not.toMatch(filledReviewEvidencePattern);
  });

  it("adds a safe readiness sign-off template without recording sign-off", () => {
    expect(existsSync(resolve(repoRoot, ownerReviewClosureSignoffTemplatePath))).toBe(true);
    const signoff = readRepoFile(ownerReviewClosureSignoffTemplatePath);
    const normalizedSignoff = normalizeWhitespace(signoff);

    for (const required of [
      "Owner-review closure readiness does not approve deployment, preview publication, production launch, provider configuration, or live smoke testing.",
      "Owner-review closure decision",
      "Remaining blockers",
      "Routes/areas reviewed",
      "Corrections still pending",
      "Corrections accepted as locally resolved",
      "Items explicitly deferred",
      "No deployment approval is implied",
      "launch/deployment remains separately blocked unless explicitly approved",
      "[OWNER NAME / ROLE]",
      "[REVIEW DATE]",
      "[ROUTE / AREA]",
      "[DECISION: CONTINUE / BLOCKED / READY TO CLOSE]",
      "[OPEN ITEM SUMMARY]",
      "[REQUIRED FOLLOW-UP]",
      "[DEPLOYMENT APPROVAL: NOT GRANTED]"
    ]) {
      expect(normalizedSignoff).toContain(required);
    }

    expect(signoff).not.toMatch(forbiddenDeploymentCommandPattern);
    expect(signoff).not.toMatch(forbiddenSupabaseCloudCommandPattern);
    expect(signoff).not.toMatch(forbiddenEnvInstructionPattern);
    expect(signoff).not.toMatch(forbiddenBusinessFactPattern);
    expect(signoff).not.toMatch(forbiddenContactFactPattern);
    expect(signoff).not.toMatch(filledReviewEvidencePattern);
  });

  it("adds deployment approval separation material with the required state table", () => {
    expect(existsSync(resolve(repoRoot, ownerReviewDeploymentApprovalSeparationPath))).toBe(true);
    const separation = readRepoFile(ownerReviewDeploymentApprovalSeparationPath);
    const normalizedSeparation = normalizeWhitespace(separation);

    for (const required of [
      "Owner review continues",
      "Review is still ongoing",
      "Update template placeholders and local docs only",
      "Deployment or filled evidence",
      "Owner review blocked",
      "Review cannot close because blockers remain",
      "Track blockers locally",
      "Pretend sign-off happened",
      "Owner review ready to close",
      "Local templates suggest review may be closable",
      "Prepare owner-facing closure packet",
      "Deploy or approve launch",
      "Deployment approved",
      "Explicit future owner approval only",
      "Future deployment workflow may begin",
      "Must not be assumed in Phase 3P",
      "[DEPLOYMENT APPROVAL: NOT GRANTED]"
    ]) {
      expect(normalizedSeparation).toContain(required);
    }

    expect(separation).not.toMatch(forbiddenDeploymentCommandPattern);
    expect(separation).not.toMatch(forbiddenSupabaseCloudCommandPattern);
    expect(separation).not.toMatch(forbiddenEnvInstructionPattern);
    expect(separation).not.toMatch(forbiddenBusinessFactPattern);
    expect(separation).not.toMatch(forbiddenContactFactPattern);
    expect(separation).not.toMatch(filledReviewEvidencePattern);
  });

  it("renders the closure readiness snapshot only inside the protected admin shell", () => {
    expect(existsSync(resolve(repoRoot, contentReadinessRoutePath))).toBe(true);
    const routeSource = readRepoFile(contentReadinessRoutePath);
    const shellSource = readRepoFile(protectedAdminShellPath);

    expect(routeSource).toContain("resolveProtectedAdminShellState");
    expect(routeSource).toContain("AdminShellContent");
    expect(routeSource).toContain('view={{ kind: "content-readiness" }}');
    expect(shellSource).toContain(ownerReviewClosurePacketPath);
    expect(shellSource).toContain(ownerReviewClosureSignoffTemplatePath);
    expect(shellSource).toContain(ownerReviewDeploymentApprovalSeparationPath);
    expect(shellSource).toContain("ownerReviewClosureStates");
    expect(shellSource).toContain("ownerReviewClosureTemplateFields");
    expect(shellSource).toContain("closureDeploymentApprovalStatus");
    expect(shellSource).toContain("closureSnapshotLastLocalPacketUpdate");

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
      screen.getByRole("heading", { name: /closure readiness snapshot/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/current owner-review closure state/i)).toBeInTheDocument();
    expect(screen.getByText(/\[CONTINUE \/ BLOCKED \/ READY TO CLOSE\]/i)).toBeInTheDocument();
    expect(screen.getByText(/open blockers/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\[TEMPLATE ONLY\]/i).length).toBeGreaterThan(1);
    expect(screen.getAllByText(/deployment approval status/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/not approved \/ separate explicit approval required/i)
        .length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/\[DATE PLACEHOLDER\]/i).length).toBeGreaterThan(0);
    expect(screen.getByText(ownerReviewClosurePacketPath)).toBeInTheDocument();
    expect(screen.getByText(ownerReviewClosureSignoffTemplatePath)).toBeInTheDocument();
    expect(screen.getByText(ownerReviewDeploymentApprovalSeparationPath)).toBeInTheDocument();
  });

  it("does not render closure details for blocked admin states", () => {
    for (const state of [
      { status: "unauthenticated" as const },
      { status: "authenticated_not_authorised" as const },
      { status: "unavailable" as const }
    ]) {
      const { unmount } = render(
        <AdminShellContent state={state} view={{ kind: "content-readiness" }} />
      );

      expect(screen.queryByText(/closure readiness snapshot/i)).not.toBeInTheDocument();
      expect(screen.queryByText(ownerReviewClosurePacketPath)).not.toBeInTheDocument();
      expect(screen.queryByText(ownerReviewClosureSignoffTemplatePath)).not.toBeInTheDocument();
      unmount();
    }
  });

  it("keeps public copy free of closure details, fake facts, transaction wording, and owner-only statuses", () => {
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
    expect(publicSource).not.toMatch(forbiddenTransactionTermPattern);
    expect(publicSource).not.toMatch(ownerOnlyClosurePattern);
  });

  it("keeps Phase 3P materials free of forbidden transaction labels", () => {
    const phase3pMaterials = [
      extractRequiredSection(
        readRepoFile("docs/DECISION-LOG.md"),
        "## 2026-06-08: Owner-Review Closure Packet, Readiness Sign-Off Template, And Deployment Approval Separation",
        "## 2026-06-08: Owner-Review Correction Intake, Launch-Blocker Freeze Gate, And Admin Triage Snapshot"
      ),
      extractRequiredSection(
        readRepoFile("docs/PHASE-ROADMAP.md"),
        "## Phase 3P: Owner-Review Closure Packet, Readiness Sign-Off Template, And Deployment Approval Separation"
      ),
      extractRequiredSection(
        readRepoFile("docs/PHASE-STATUS.md"),
        "Current phase: Phase 3P-A/B - owner-review closure packet, readiness sign-off template, and deployment approval separation.",
        "Previous Current Phase 3O-A/B status:"
      ),
      extractRequiredSection(
        readRepoFile("docs/PHASE-2-READINESS-PLAN.md"),
        "Current Phase 3P-A/B status:",
        "Previous Current Phase 3O-A/B status:"
      ),
      extractRequiredSection(
        readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md"),
        "## Phase 3P-A/B Owner-Review Closure Packet Readiness Sign-Off Template And Deployment Approval Separation",
        "## Phase 2D-A Deployment Readiness And Smoke-Test Runbook"
      ),
      readRepoFile(ownerReviewClosurePacketPath),
      readRepoFile(ownerReviewClosureSignoffTemplatePath),
      readRepoFile(ownerReviewDeploymentApprovalSeparationPath)
    ].join("\n");

    expect(phase3pMaterials).not.toMatch(forbiddenTransactionTermPattern);
  });

  it("keeps Phase 3P inside repo-local no-provider, no-deploy, no-evidence scope", () => {
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
      readRepoFile(ownerReviewClosurePacketPath),
      readRepoFile(ownerReviewClosureSignoffTemplatePath),
      readRepoFile(ownerReviewDeploymentApprovalSeparationPath)
    ].join("\n");

    expect(packageSource).not.toMatch(/@pinecone-database|pinecone/i);
    expect(appAndLibSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(appAndLibSource).not.toContain("NEXT_PUBLIC_N8N");
    expect(appAndLibSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(appAndLibSource).not.toMatch(/PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i);
    expect(newDocs).not.toMatch(filledReviewEvidencePattern);
    expect(newDocs).not.toMatch(forbiddenTransactionTermPattern);
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
