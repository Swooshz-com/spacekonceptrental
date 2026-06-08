import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminShellContent } from "../app/admin/protected-admin-shell";
import HomePage from "../app/page";
import QuotePage from "../app/quote/page";

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string | { src: string } }) => (
    <img alt={alt} src={typeof src === "string" ? src : src.src} />
  )
}));

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const phase3tMergeCommit = "66840d5d3bb77d39200a864bfcbecc29ee859f76";
const finalOwnerHandoffPackPath =
  "docs/content/FINAL-LOCAL-OWNER-HANDOFF-PACK.md";
const localAcceptanceTriageBoardPath =
  "docs/content/LOCAL-ACCEPTANCE-TRIAGE-BOARD.md";
const deploymentDecisionFirewallPath =
  "docs/content/DEPLOYMENT-DECISION-FIREWALL.md";
const localReleaseCandidateValidatorPath =
  "scripts/validate-local-release-candidate.cjs";
const previewHandoffValidatorPath = "scripts/validate-preview-handoff.cjs";
const protectedAdminShellPath = "website/app/admin/protected-admin-shell.tsx";

const forbiddenCustomerFlowTermPattern = new RegExp(
  `\\b(?:${[
    "ecom" + "merce",
    "ca" + "rt",
    "check" + "out",
    "ord" + "er",
    "pay" + "ment",
    "pur" + "chase",
    "trans" + "action",
    "ret" + "ail"
  ].join("|")})s?\\b`,
  "i"
);
const publicInternalLeakPattern =
  /Owner-demo|walkthrough|closure readiness|deployment approval|internal review|admin-only|protected content readiness|owner input required|issue backlog|route inventory|acceptance status|local release-candidate|command centre|owner handoff|handoff pack|deployment firewall|acceptance triage|final local owner handoff|\/admin\/content-readiness/i;
const forbiddenBusinessFactPattern =
  /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|proof claim/i;
const forbiddenContactFactPattern =
  /\b(?!(?:\d{4}-\d{2}-\d{2})\b)(?:\+?\d[\d\s().-]{7,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main|Singapore\s+\d{6})\b/i;
const filledEvidencePattern =
  /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|production evidence captured|preview evidence captured|actual owner decision|actual owner sign-off|manual QA completed|acceptance passed on|suite passed on|owner feedback recorded/i;
const forbiddenRunnerPattern =
  /vercel\s+(?:deploy|link|env|pull|promote)|supabase\s+(?:link|login|secrets|projects|functions|db\s+(?:push|pull|remote|reset))|smoke:preview|curl\b|fetch\s*\(|https?:\/\/|www\.|docs\/(?:evidence|preview-evidence|production-evidence|owner-review-evidence)|(?:^|[\\/])\.env(?:\.|$)|website\/chat-config\.js/i;

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

describe("Phase 3U-A/B final local owner handoff pack", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("records Phase 3U-A/B as current after Phase 3T completed in PR #142", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const currentStatus = normalizeWhitespace(
      status.split("Previous Current Phase 3T-A/B status:")[0] ?? status
    );
    const roadmap = normalizeWhitespace(readRepoFile("docs/PHASE-ROADMAP.md"));
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const checklist = readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md");
    const ownerReview = readRepoFile("docs/OWNER-REVIEW-READINESS-PACKAGE.md");
    const manualQa = readRepoFile("docs/manual-qa/OWNER-REVIEW-MANUAL-QA.md");
    const handoff = readRepoFile("docs/PREVIEW-DEPLOYMENT-HANDOFF.md");
    const localValidator = readRepoFile(localReleaseCandidateValidatorPath);
    const previewValidator = readRepoFile(previewHandoffValidatorPath);

    expect(currentStatus).toContain(
      "Current phase: Phase 3U-A/B - final local owner handoff pack, acceptance triage board, and deployment decision firewall."
    );
    expect(currentStatus).toContain(
      "Latest completed capability: Phase 3T-A/B local release-candidate command centre, acceptance-suite orchestration, and no-deploy command allowlist."
    );
    expect(currentStatus).toContain("Last merged capability PR: #142");
    expect(currentStatus).toContain(`Merge commit: \`${phase3tMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3T-A/B status");
    expect(roadmap).toContain(
      "Phase 3U-A/B adds a final local owner handoff pack, acceptance triage board, and deployment decision firewall"
    );
    expect(readiness).toContain("Current Phase 3U-A/B status");
    expect(readiness).toContain("Previous Current Phase 3T-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 3U-A/B adds a final local owner handoff pack, acceptance triage board, and deployment decision firewall."
    );
    expect(checklist).toContain(
      "## Phase 3U-A/B Final Local Owner Handoff Pack Acceptance Triage Board And Deployment Decision Firewall"
    );

    const combinedOwnerDocs = normalizeWhitespace([ownerReview, manualQa, handoff].join("\n"));
    expect(combinedOwnerDocs).toContain(finalOwnerHandoffPackPath);
    expect(combinedOwnerDocs).toContain(localAcceptanceTriageBoardPath);
    expect(combinedOwnerDocs).toContain(deploymentDecisionFirewallPath);
    expect(localValidator).toContain(finalOwnerHandoffPackPath);
    expect(localValidator).toContain(localAcceptanceTriageBoardPath);
    expect(localValidator).toContain(deploymentDecisionFirewallPath);
    expect(previewValidator).toContain(finalOwnerHandoffPackPath);
    expect(previewValidator).toContain(localAcceptanceTriageBoardPath);
    expect(previewValidator).toContain(deploymentDecisionFirewallPath);
  });

  it("adds a template-only final local owner handoff pack", () => {
    expect(existsSync(resolve(repoRoot, finalOwnerHandoffPackPath))).toBe(true);
    expect(readTrackedFiles([finalOwnerHandoffPackPath])).toEqual([
      finalOwnerHandoffPackPath
    ]);

    const pack = readRepoFile(finalOwnerHandoffPackPath);
    const normalized = normalizeWhitespace(pack);

    for (const required of [
      "repo-local, template-only, non-live, and not evidence",
      "Current candidate purpose",
      "Public route review summary",
      "Protected admin review summary",
      "Local release-candidate suite summary",
      "Owner input still required",
      "Local follow-up categories",
      "Items blocked until explicit future approval",
      "Deployment decision firewall",
      "Failure reporting without evidence files",
      "[OWNER REVIEWER]",
      "[REVIEW DATE]",
      "[ROUTE / AREA]",
      "[PUBLIC / PROTECTED ADMIN]",
      "[LOCAL ACCEPTANCE STATE: NOT RUN / PASS / NEEDS FOLLOW-UP]",
      "[OWNER INPUT REQUIRED]",
      "[LOCAL FOLLOW-UP]",
      "[BLOCKER TYPE]",
      "[DEPLOYMENT APPROVAL: NOT GRANTED]"
    ]) {
      expect(normalized).toContain(required);
    }

    expect(pack).not.toMatch(filledEvidencePattern);
    expect(pack).not.toMatch(forbiddenBusinessFactPattern);
    expect(pack).not.toMatch(forbiddenContactFactPattern);
  });

  it("adds a template-only local acceptance triage board", () => {
    expect(existsSync(resolve(repoRoot, localAcceptanceTriageBoardPath))).toBe(true);
    expect(readTrackedFiles([localAcceptanceTriageBoardPath])).toEqual([
      localAcceptanceTriageBoardPath
    ]);

    const board = readRepoFile(localAcceptanceTriageBoardPath);
    const normalized = normalizeWhitespace(board);

    for (const required of [
      "template-only",
      "Public route polish",
      "Listing/category/media content",
      "Quote/enquiry flow",
      "Protected admin workflow",
      "Owner input required",
      "Local suite failure",
      "Future deployment blocker",
      "Deferred after launch",
      "Not in current scope",
      "Meaning",
      "Allowed local action",
      "Disallowed action",
      "Owner input requirement",
      "Deployment boundary",
      "[TRIAGE ID]",
      "[LANE]",
      "[ROUTE / AREA]",
      "[OBSERVED ITEM]",
      "[OWNER INPUT REQUIRED]",
      "[LOCAL FOLLOW-UP]",
      "[STATUS: OPEN / OWNER INPUT REQUIRED / LOCALLY RESOLVED / DEFERRED / OUT OF SCOPE]",
      "[DEPLOYMENT APPROVAL: NOT GRANTED]"
    ]) {
      expect(normalized).toContain(required);
    }

    expect(board).not.toMatch(filledEvidencePattern);
    expect(board).not.toMatch(forbiddenBusinessFactPattern);
    expect(board).not.toMatch(forbiddenContactFactPattern);
  });

  it("adds a template-only deployment decision firewall", () => {
    expect(existsSync(resolve(repoRoot, deploymentDecisionFirewallPath))).toBe(true);
    expect(readTrackedFiles([deploymentDecisionFirewallPath])).toEqual([
      deploymentDecisionFirewallPath
    ]);

    const firewall = readRepoFile(deploymentDecisionFirewallPath);
    const normalized = normalizeWhitespace(firewall);

    for (const required of [
      "Local acceptance readiness",
      "Owner review readiness",
      "Owner sign-off",
      "Deployment approval",
      "Provider configuration",
      "Preview publication",
      "Production launch",
      "Post-launch monitoring",
      "Local acceptance passing does not approve deployment",
      "Owner-review closure readiness does not approve deployment",
      "Handoff pack completion does not approve deployment",
      "Only a future explicit owner approval can open a separate deployment lane",
      "No current file in Phase 3U can be treated as filled evidence",
      "[DECISION OWNER]",
      "[DECISION DATE]",
      "[DECISION: NOT GRANTED / GRANTED IN FUTURE SEPARATE LANE]",
      "[SCOPE IF GRANTED]",
      "[DEPLOYMENT APPROVAL: NOT GRANTED]"
    ]) {
      expect(normalized).toContain(required);
    }

    expect(firewall).not.toMatch(filledEvidencePattern);
    expect(firewall).not.toMatch(forbiddenBusinessFactPattern);
    expect(firewall).not.toMatch(forbiddenContactFactPattern);
  });

  it("renders an admin-only final handoff snapshot for authorised admins", () => {
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

    const shellSource = readRepoFile(protectedAdminShellPath);
    expect(shellSource).toContain(finalOwnerHandoffPackPath);
    expect(shellSource).toContain(localAcceptanceTriageBoardPath);
    expect(shellSource).toContain(deploymentDecisionFirewallPath);
    expect(shellSource).toContain("finalOwnerHandoffSnapshot");
    expect(shellSource).toContain("finalOwnerHandoffLastLocalUpdate");

    const heading = screen.getByRole("heading", {
      name: /final local owner handoff snapshot/i
    });
    expect(heading).toBeInTheDocument();
    const card = heading.closest("section");
    expect(card).not.toBeNull();
    const snapshot = within(card as HTMLElement);

    expect(screen.getByText(finalOwnerHandoffPackPath)).toBeInTheDocument();
    expect(screen.getByText(localAcceptanceTriageBoardPath)).toBeInTheDocument();
    expect(screen.getByText(deploymentDecisionFirewallPath)).toBeInTheDocument();
    expect(snapshot.getAllByText(/^Template only$/i).length).toBeGreaterThanOrEqual(3);
    expect(snapshot.getByText(/public route handoff/i)).toBeInTheDocument();
    expect(snapshot.getByText(/protected admin handoff/i)).toBeInTheDocument();
    expect(snapshot.getByText(/owner input required/i)).toBeInTheDocument();
    expect(snapshot.getByText(/local follow-up/i)).toBeInTheDocument();
    expect(
      snapshot.getByText(/not approved \/ separate explicit approval required/i)
    ).toBeInTheDocument();
    expect(snapshot.getByText(/\[DATE PLACEHOLDER\]/i)).toBeInTheDocument();
  });

  it("does not render the final handoff snapshot for blocked admin states", () => {
    for (const state of [
      { status: "unauthenticated" as const },
      { status: "authenticated_not_authorised" as const },
      { status: "unavailable" as const }
    ]) {
      const { unmount } = render(
        <AdminShellContent state={state} view={{ kind: "content-readiness" }} />
      );

      expect(
        screen.queryByText(/final local owner handoff snapshot/i)
      ).not.toBeInTheDocument();
      expect(screen.queryByText(finalOwnerHandoffPackPath)).not.toBeInTheDocument();
      unmount();
    }
  });

  it("keeps public source customer-facing and free of handoff/firewall leakage", async () => {
    render(await HomePage());
    expect(screen.getByRole("heading", { name: /event furniture rental/i })).toBeInTheDocument();
    expect(screen.getByText(/request a rental quote/i)).toBeInTheDocument();

    cleanup();
    render(await QuotePage());
    expect(screen.getByRole("heading", { name: /request a rental quote/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /check your enquiry details/i })).toBeInTheDocument();

    const publicSource = readTrackedProductionSources([
      "website/app/layout.tsx",
      "website/app/page.tsx",
      "website/app/listings",
      "website/app/categories",
      "website/app/catalogue",
      "website/app/events",
      "website/app/quote",
      "website/app/not-found.tsx",
      "website/components/QuoteRequestForm.tsx"
    ]);

    expect(publicSource).toMatch(/listing/i);
    expect(publicSource).toMatch(/enquiry/i);
    expect(publicSource).toMatch(/quote/i);
    expect(publicSource).toMatch(/request/i);
    expect(publicSource).toMatch(/rental/i);
    expect(publicSource).toMatch(/event furniture/i);
    expect(publicSource).not.toMatch(publicInternalLeakPattern);
    expect(publicSource).not.toMatch(forbiddenCustomerFlowTermPattern);
    expect(publicSource).not.toMatch(forbiddenBusinessFactPattern);
    expect(publicSource).not.toMatch(forbiddenContactFactPattern);
  });

  it("keeps Phase 3U materials inside no-provider, no-deploy, no-evidence boundaries", () => {
    const phase3uDocs = [
      extractRequiredSection(
        readRepoFile("docs/DECISION-LOG.md"),
        "## 2026-06-09: Final Local Owner Handoff Pack, Acceptance Triage Board, And Deployment Decision Firewall",
        "## 2026-06-09: Local Release-Candidate Command Centre, Acceptance-Suite Orchestration, And No-Deploy Command Allowlist"
      ),
      extractRequiredSection(
        readRepoFile("docs/PHASE-ROADMAP.md"),
        "## Phase 3U: Final Local Owner Handoff Pack, Acceptance Triage Board, And Deployment Decision Firewall",
        "## Phase 3T: Local Release-Candidate Command Centre, Acceptance-Suite Orchestration, And No-Deploy Command Allowlist"
      ),
      extractRequiredSection(
        readRepoFile("docs/PHASE-STATUS.md"),
        "Current phase: Phase 3U-A/B - final local owner handoff pack, acceptance triage board, and deployment decision firewall.",
        "Previous Current Phase 3T-A/B status:"
      ),
      extractRequiredSection(
        readRepoFile("docs/PHASE-2-READINESS-PLAN.md"),
        "Current Phase 3U-A/B status:",
        "Previous Current Phase 3T-A/B status:"
      ),
      extractRequiredSection(
        readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md"),
        "## Phase 3U-A/B Final Local Owner Handoff Pack Acceptance Triage Board And Deployment Decision Firewall",
        "## Phase 3T-A/B Local Release-Candidate Command Centre Acceptance-Suite Orchestration And No-Deploy Command Allowlist"
      ),
      readRepoFile(finalOwnerHandoffPackPath),
      readRepoFile(localAcceptanceTriageBoardPath),
      readRepoFile(deploymentDecisionFirewallPath)
    ].join("\n");
    const runner = readRepoFile("scripts/validate-release-candidate-suite.cjs");
    const packageSource = [
      readRepoFile("package.json"),
      readRepoFile("website/package.json")
    ].join("\n");
    const appAndLibSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);

    expect(phase3uDocs).not.toMatch(filledEvidencePattern);
    expect(phase3uDocs).not.toMatch(forbiddenBusinessFactPattern);
    expect(phase3uDocs).not.toMatch(forbiddenContactFactPattern);
    expect(runner).not.toMatch(forbiddenRunnerPattern);
    expect(packageSource).not.toMatch(/@pinecone-database|pinecone/i);
    expect(appAndLibSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(appAndLibSource).not.toContain("NEXT_PUBLIC_N8N");
    expect(appAndLibSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(appAndLibSource).not.toMatch(/PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i);
    expect(
      readTrackedFiles([
        "website/chat-config.js",
        "vercel.json",
        "website/vercel.json",
        ".vercel",
        "supabase/config.toml",
        "supabase/.branches",
        ".env",
        ".env.local",
        ".env.development",
        ".env.production",
        ".env.test",
        "website/.env",
        "website/.env.local",
        "website/.env.development",
        "website/.env.production",
        "website/.env.test",
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
