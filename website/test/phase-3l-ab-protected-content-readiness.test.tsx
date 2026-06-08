import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AdminShellContent } from "../app/admin/protected-admin-shell";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const phase3kMergeCommit = "d4271ea6b181ee702dfe9d6f2b6003903b0c54dd";
const ownerReviewLedgerPath = "docs/content/OWNER-REVIEW-ISSUE-LEDGER.md";
const contentReadinessRoutePath = "website/app/admin/content-readiness/page.tsx";
const protectedAdminShellPath = "website/app/admin/protected-admin-shell.tsx";
const ownerContentIntakePath = "docs/content/OWNER-CONTENT-INTAKE.md";
const contentGapRegisterPath = "docs/content/CONTENT-GAP-REGISTER.md";

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
const ownerOnlyStatusPattern =
  /Owner input required|Ready for owner review|Blocks owner review|Blocks launch\/deployment|Deferred after launch|Not in scope by owner direction|Owner-review issue ledger|content readiness workspace|admin-only readiness/i;

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

describe("Phase 3L-A/B protected content readiness", () => {
  afterEach(() => {
    cleanup();
  });

  it("records Phase 3L-A/B as current after Phase 3K completed in PR #133", () => {
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
      "Current phase: Phase 3L-A/B - protected content readiness workspace, owner-review issue ledger, and public copy fact-safety audit."
    );
    expect(currentStatus).toContain(
      "Latest completed capability: Phase 3K-A/B owner content intake, content gap register, and launch-blocker governance."
    );
    expect(currentStatus).toContain("Last merged capability PR: #133");
    expect(currentStatus).toContain(`Merge commit: \`${phase3kMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3K-A/B status");
    expect(roadmap).toContain(
      "Phase 3L-A/B adds a protected content readiness workspace, owner-review issue ledger, and public copy fact-safety audit"
    );
    expect(readiness).toContain("Current Phase 3L-A/B status");
    expect(readiness).toContain("Previous Current Phase 3K-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 3L-A/B adds a protected content readiness workspace, owner-review issue ledger, and public copy fact-safety audit."
    );
    expect(checklist).toContain(
      "## Phase 3L-A/B Protected Content Readiness Workspace Owner-Review Issue Ledger And Public Copy Fact-Safety Audit"
    );

    const combinedOwnerDocs = normalizeWhitespace([ownerReview, manualQa, handoff].join("\n"));
    expect(combinedOwnerDocs).toContain(ownerReviewLedgerPath);
    expect(combinedOwnerDocs).toContain("/admin/content-readiness");
    expect(combinedOwnerDocs).toContain(
      "Protected content readiness workspace"
    );
    expect(validator).toContain(phase3kMergeCommit);
    expect(validator).toContain(ownerReviewLedgerPath);
    expect(validator).toContain(contentReadinessRoutePath);
    expect(validator).toContain("Phase 3L-A/B");
  });

  it("adds an owner-review issue ledger with safe categories and statuses", () => {
    expect(existsSync(resolve(repoRoot, ownerReviewLedgerPath))).toBe(true);
    const ledger = readRepoFile(ownerReviewLedgerPath);
    const normalizedLedger = normalizeWhitespace(ledger);

    for (const required of [
      "Public copy",
      "Listing/category/event content",
      "Images and alt text",
      "Quote/enquiry expectations",
      "Admin operator ownership",
      "Legal/policy/contact gaps",
      "Launch/deployment blockers",
      "Owner input required",
      "Ready for owner review",
      "Blocks owner review",
      "Blocks launch/deployment",
      "Deferred after launch",
      "Not in scope by owner direction"
    ]) {
      expect(normalizedLedger).toContain(required);
    }

    expect(ledger).not.toMatch(forbiddenDeploymentCommandPattern);
    expect(ledger).not.toMatch(forbiddenSupabaseCloudCommandPattern);
    expect(ledger).not.toMatch(forbiddenEnvInstructionPattern);
    expect(ledger).not.toMatch(forbiddenBusinessFactPattern);
    expect(ledger).not.toMatch(forbiddenContactFactPattern);
  });

  it("renders content readiness only through the protected admin shell", () => {
    expect(existsSync(resolve(repoRoot, contentReadinessRoutePath))).toBe(true);
    const routeSource = readRepoFile(contentReadinessRoutePath);
    const shellSource = readRepoFile(protectedAdminShellPath);

    expect(routeSource).toContain("resolveProtectedAdminShellState");
    expect(routeSource).toContain("AdminShellContent");
    expect(routeSource).toContain('view={{ kind: "content-readiness" }}');
    expect(routeSource).toContain('dynamic = "force-dynamic"');
    expect(routeSource).toContain("revalidate = 0");
    expect(shellSource).toContain('"content-readiness"');
    expect(shellSource).toContain(ownerContentIntakePath);
    expect(shellSource).toContain(contentGapRegisterPath);
    expect(shellSource).toContain(ownerReviewLedgerPath);

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
      screen.getByRole("heading", { name: /content readiness/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/owner input required/i)).toBeInTheDocument();
    expect(screen.getByText(/blocks owner review/i)).toBeInTheDocument();
    expect(screen.getByText(/blocks launch\/deployment/i)).toBeInTheDocument();
    expect(screen.getByText(/deferred after launch/i)).toBeInTheDocument();
    expect(
      screen.getByText(/not in scope by owner direction/i)
    ).toBeInTheDocument();
    expect(screen.getByText(ownerContentIntakePath)).toBeInTheDocument();
    expect(screen.getByText(contentGapRegisterPath)).toBeInTheDocument();
    expect(screen.getByText(ownerReviewLedgerPath)).toBeInTheDocument();
  });

  it("does not render owner-only readiness details for blocked admin states", () => {
    for (const state of [
      { status: "unauthenticated" as const },
      { status: "authenticated_not_authorised" as const },
      { status: "unavailable" as const }
    ]) {
      const { unmount } = render(
        <AdminShellContent state={state} view={{ kind: "content-readiness" }} />
      );

      expect(screen.queryByText(/owner input required/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/blocks owner review/i)).not.toBeInTheDocument();
      expect(
        screen.queryByText(/blocks launch\/deployment/i)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(ownerReviewLedgerPath)
      ).not.toBeInTheDocument();
      unmount();
    }
  });

  it("keeps public copy free of fake business facts, ecommerce wording, and owner-only readiness details", () => {
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
    expect(publicSource).not.toMatch(ownerOnlyStatusPattern);
    expect(publicSource).not.toMatch(/\/admin\/content-readiness|internal notes|admin issue ledger/i);
  });

  it("keeps Phase 3L inside repo-local no-provider, no-deploy, no-ecommerce scope", () => {
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
