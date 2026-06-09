import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AdminShellContent } from "../app/admin/protected-admin-shell";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const rehearsalPackPath = "docs/content/LOCAL-OWNER-REVIEW-REHEARSAL-PACK.md";
const blockerLedgerPath = "docs/content/LOCAL-BLOCKER-LEDGER-TEMPLATE.md";
const acceptanceDrillPath = "docs/content/LOCAL-ACCEPTANCE-DRILL.md";
const phase150MergeCommit = "baa076679756751a725ea65ac565545c6fe56d76";

const publicLeakPattern = new RegExp(
  [
    "Local owner-review rehearsal pack",
    "Local blocker ledger template",
    "Local acceptance drill",
    "Owner-input intake control",
    "Local correction queue",
    "Review-ready handoff closure",
    "Release-control internals",
    "Owner-review templates",
    "protected admin urls",
    "internal notes",
    "recovery lane statuses",
    "destructive-action safeguards",
    "status-transition matrix details",
    "\\/admin\\/"
  ].join("|"),
  "i"
);
const forbiddenPublicFlowPattern = new RegExp(
  `\\b(?:${[
    "ecom" + "merce",
    "ca" + "rt",
    "check" + "out",
    "ord" + "er",
    "pay" + "ment",
    "pur" + "chase",
    "book" + "ing",
    "reser" + "vation",
    "fulfil" + "ment",
    "stock-reser" + "vation"
  ].join("|")})s?\\b`,
  "i"
);
const forbiddenFakeFactPattern =
  /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i;
const forbiddenEvidencePattern =
  /owner approved|owner sign-?off complete|owner correction recorded|filled owner note|review completed on|signed off by|preview evidence captured|production evidence captured|actual owner decision|actual owner sign-off|manual QA completed|acceptance passed on/i;

const authorisedAdminState = {
  status: "authorised_admin" as const,
  dashboard: {
    status: "loaded" as const,
    data: {
      categories: [],
      products: [],
      images: [],
      imageSummary: { totalImages: 0, activeImages: 0, primaryImages: 0 }
    }
  },
  quoteInbox: { status: "loaded" as const, data: { quoteRequests: [] } }
};

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

describe("Phase 4C-A/B local owner-review rehearsal", () => {
  afterEach(() => cleanup());

  it("adds template-only rehearsal, blocker ledger, and acceptance drill docs", () => {
    expect(readTrackedFiles([rehearsalPackPath, blockerLedgerPath, acceptanceDrillPath]).sort()).toEqual(
      [rehearsalPackPath, blockerLedgerPath, acceptanceDrillPath].sort()
    );

    const combined = normalizeWhitespace(
      [readRepoFile(rehearsalPackPath), readRepoFile(blockerLedgerPath), readRepoFile(acceptanceDrillPath)].join("\n")
    );

    for (const required of [
      "repo-local, template-only, non-live, and not evidence",
      "Homepage",
      "Listings/catalogue/category route",
      "Listing detail",
      "Event-use browsing",
      "Quote/enquiry form",
      "Quote/enquiry receipt-style confirmation",
      "Protected admin listing/category/media workspace",
      "Protected admin quote inbox",
      "Protected admin release-control workspace",
      "Owner-input/correction queue snapshot",
      "What to show",
      "What to ask",
      "What must not be claimed",
      "Missing owner input placeholder",
      "Local correction placeholder",
      "Public exposure boundary",
      "Evidence status",
      "Deployment approval status",
      "[NOT EVIDENCE / NOT RECORDED]",
      "[DEPLOYMENT APPROVAL: NOT GRANTED]",
      "Owner input missing",
      "Local correction required",
      "Public visibility blocked",
      "Protected admin review required",
      "Fake-fact risk",
      "Public leakage risk",
      "Provider/runtime blocked",
      "Deployment planning blocked",
      "Requires separate deployment approval",
      "Confirm public route wording remains rental/enquiry-only",
      "Confirm quote/enquiry remains request/intake only",
      "Confirm no public account/tracking/upload/notification/CRM flow exists",
      "Confirm no ecommerce/cart/checkout/order/payment wording exists",
      "Confirm admin-only release-control and correction internals are protected",
      "Confirm fake facts remain absent",
      "Confirm no provider/runtime/deployment files or env reads were added",
      "Confirm release-candidate suite was not weakened"
    ]) {
      expect(combined).toContain(required);
    }

    expect(combined).not.toMatch(forbiddenEvidencePattern);
  });

  it("rolls status docs forward from PR #150", () => {
    const combined = normalizeWhitespace(
      [
        readRepoFile("docs/PHASE-STATUS.md"),
        readRepoFile("docs/PHASE-ROADMAP.md"),
        readRepoFile("docs/PHASE-2-READINESS-PLAN.md"),
        readRepoFile("docs/DECISION-LOG.md"),
        readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md"),
        readRepoFile("docs/OWNER-REVIEW-READINESS-PACKAGE.md"),
        readRepoFile("docs/manual-qa/OWNER-REVIEW-MANUAL-QA.md"),
        readRepoFile("docs/PREVIEW-DEPLOYMENT-HANDOFF.md")
      ].join("\n")
    );

    expect(combined).toContain("Current phase: Phase 4C-A/B local owner-review rehearsal pack, blocker ledger, and acceptance drill validator");
    expect(combined).toContain(
      "Latest completed capability: Phase 4B-A/B owner-input intake control, local correction queue, and review-ready handoff closure"
    );
    expect(combined).toContain("Last merged capability PR: #150");
    expect(combined).toContain(phase150MergeCommit);
    expect(combined).toContain(rehearsalPackPath);
    expect(combined).toContain(blockerLedgerPath);
    expect(combined).toContain(acceptanceDrillPath);
    expect(combined).toContain("validate:owner-review-rehearsal");
  });

  it("renders the Phase 4C rehearsal snapshot only for authorised admin state", () => {
    render(<AdminShellContent state={authorisedAdminState} view={{ kind: "release-control" }} />);
    expect(screen.getByRole("heading", { name: /phase 4c-a\/b local owner-review rehearsal/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /phase 4c rehearsal snapshot/i })).toBeInTheDocument();
    expect(screen.getByText("Phase 4C-A/B")).toBeInTheDocument();
    expect(screen.getByText("#150")).toBeInTheDocument();
    expect(screen.getByText(phase150MergeCommit)).toBeInTheDocument();
    expect(screen.getAllByText(rehearsalPackPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(blockerLedgerPath).length).toBeGreaterThan(0);
    expect(screen.getAllByText(acceptanceDrillPath).length).toBeGreaterThan(0);
    expect(screen.getByText("Owner input boundary")).toBeInTheDocument();
    expect(screen.getByText("Local correction boundary")).toBeInTheDocument();
    cleanup();

    for (const state of [
      { status: "unauthenticated" as const },
      { status: "authenticated_not_authorised" as const },
      { status: "unavailable" as const }
    ]) {
      render(<AdminShellContent state={state} view={{ kind: "release-control" }} />);
      expect(screen.queryByRole("heading", { name: /phase 4c rehearsal snapshot/i })).not.toBeInTheDocument();
      expect(screen.queryByText(rehearsalPackPath)).not.toBeInTheDocument();
      cleanup();
    }
  });

  it("keeps protected admin shell and route wired to Phase 4C docs", () => {
    const shell = readRepoFile("website/app/admin/protected-admin-shell.tsx");
    const route = readRepoFile("website/app/admin/release-control/page.tsx");

    expect(shell).toContain(rehearsalPackPath);
    expect(shell).toContain(blockerLedgerPath);
    expect(shell).toContain(acceptanceDrillPath);
    expect(shell).toContain("phase4cOwnerReviewRehearsalSnapshot");
    expect(shell).toContain("phase4cOwnerReviewRehearsalDocs");
    expect(shell).toContain("Phase 4C rehearsal snapshot");
    expect(route).toContain('view={{ kind: "release-control" }}');
  });

  it("keeps public source free of rehearsal internals and blocked public wording", () => {
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

    for (const required of ["listing", "enquiry", "quote", "request", "rental", "event furniture"]) {
      expect(publicSource).toMatch(new RegExp(required, "i"));
    }

    expect(publicSource).not.toMatch(publicLeakPattern);
    expect(publicSource).not.toMatch(forbiddenPublicFlowPattern);
    expect(publicSource).not.toMatch(forbiddenFakeFactPattern);
    expect(publicSource).not.toMatch(/public quote tracking|customer account|customer upload|CRM|notification/i);
  });

  it("keeps forbidden runtime/provider/deployment files, env reads, and suite bypasses absent", () => {
    expect(existsSync(resolve(repoRoot, "website/chat-config.js"))).toBe(false);
    expect(readTrackedFiles([
      "website/chat-config.js",
      "website/app/api/customer-uploads",
      "website/app/api/public/uploads",
      "website/app/api/customer-accounts",
      "website/app/api/quote-tracking",
      "website/app/quote/status",
      "website/app/api/notifications",
      "website/app/api/crm",
      "website/app/api/chat/retrieval",
      "vercel.json",
      "website/vercel.json",
      ".vercel",
      "supabase/config.toml",
      "supabase/.branches",
      "docs/evidence",
      "docs/preview-evidence",
      "docs/production-evidence",
      "docs/owner-review-evidence"
    ])).toEqual([]);

    const appAndLibSource = readTrackedProductionSources(["website/app", "website/components", "website/lib"]);
    const packageSource = readRepoFile("package.json") + readRepoFile("website/package.json");
    const suiteRunner = readRepoFile("scripts/validate-release-candidate-suite.cjs");
    expect(packageSource).not.toMatch(/@pinecone-database|pinecone/i);
    expect(appAndLibSource).not.toMatch(/NEXT_PUBLIC_SUPABASE|NEXT_PUBLIC_N8N|SUPABASE_SERVICE_ROLE|PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i);
    expect(suiteRunner).not.toMatch(/docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i);
  });
});
