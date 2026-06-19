import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AdminShellContent } from "../app/admin/protected-admin-shell";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const ownerInputIntakePath = "docs/content/OWNER-INPUT-INTAKE-CONTROL.md";
const localCorrectionQueuePath = "docs/content/LOCAL-CORRECTION-QUEUE.md";
const reviewReadyHandoffPath = "docs/content/REVIEW-READY-HANDOFF-CLOSURE.md";
const phase4aGatePath = "docs/release/PHASE-4A-LOCAL-RELEASE-CONTROL-GATE.md";
const phase150MergeCommit = "baa076679756751a725ea65ac565545c6fe56d76";

const publicLeakPattern = new RegExp(
  [
    "Owner-input intake control",
    "Local correction queue",
    "Review-ready handoff closure",
    "release-control details",
    "owner-review templates",
    "protected admin urls",
    "internal notes",
    "recovery lane statuses",
    "destructive-action safeguards",
    "status-transition matrix details",
    "owner-input and local correction snapshot",
    "\/admin\/release-control",
    "\/admin\/content-readiness",
    "\/admin\/"
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

describe("Phase 4C-A/B owner-input correction queue", () => {
  afterEach(() => cleanup());

  it("adds template-only owner-input, correction queue, and handoff closure docs", () => {
    expect(readTrackedFiles([ownerInputIntakePath, localCorrectionQueuePath, reviewReadyHandoffPath]).sort()).toEqual(
      [ownerInputIntakePath, localCorrectionQueuePath, reviewReadyHandoffPath].sort()
    );

    const combined = normalizeWhitespace(
      [readRepoFile(ownerInputIntakePath), readRepoFile(localCorrectionQueuePath), readRepoFile(reviewReadyHandoffPath)].join("\n")
    );

    for (const required of [
      "repo-local, template-only, non-live, and not evidence",
      "Public homepage wording",
      "Public listing/category/event-use wording",
      "Listing detail facts",
      "Image selection and alt text",
      "Quote/enquiry expectation wording",
      "Contact/business-hour/service-area facts",
      "Legal/policy/guarantee wording",
      "Protected admin operator ownership",
      "Deployment approval",
      "Owner input needed",
      "Current safe placeholder",
      "Public exposure boundary",
      "Admin-only handling",
      "Local correction lane",
      "Deployment approval boundary",
      "Not evaluated",
      "Owner input required",
      "Ready for local correction",
      "Local correction in progress",
      "Local correction complete",
      "Blocked before public visibility",
      "Blocked before deployment planning",
      "Requires separate deployment approval",
      "Public copy",
      "Listing/category content",
      "Media/alt text",
      "Protected admin helper text",
      "Admin workflow privacy",
      "Fake-fact removal",
      "Public leakage removal",
      "Provider/deployment boundary",
      "Local review ready",
      "Local correction required",
      "Protected admin review required",
      "Public visibility blocked",
      "Deployment planning blocked",
      "No owner feedback recorded",
      "No owner sign-off recorded",
      "No preview evidence created",
      "No production evidence created",
      "No deployment approval granted",
      "[NOT EVIDENCE / NOT RECORDED]"
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

    expect(combined).toContain("Current phase: Phase 4C-A/B");
    expect(combined).toContain(
      "Latest completed capability: Phase 4B-A/B owner-input intake control, local correction queue, and review-ready handoff closure"
    );
    expect(combined).toContain("Last merged capability PR: #150");
    expect(combined).toContain(phase150MergeCommit);
    expect(combined).toContain(ownerInputIntakePath);
    expect(combined).toContain(localCorrectionQueuePath);
    expect(combined).toContain(reviewReadyHandoffPath);
  });

  it("renders the owner-input correction snapshot only for authorised admin state", () => {
    render(<AdminShellContent state={authorisedAdminState} view={{ kind: "release-control" }} />);
    expect(screen.getByRole("heading", { name: /phase 4d-a\/b local release-candidate freeze/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /owner-input and local correction snapshot/i })).toBeInTheDocument();
    expect(screen.getByText("Current phase")).toBeInTheDocument();
    expect(screen.getByText("Phase 4C-A/B")).toBeInTheDocument();
    expect(screen.getByText("#150")).toBeInTheDocument();
    expect(screen.getByText(phase150MergeCommit)).toBeInTheDocument();
    expect(screen.getByText(ownerInputIntakePath)).toBeInTheDocument();
    expect(screen.getByText(localCorrectionQueuePath)).toBeInTheDocument();
    expect(screen.getByText(reviewReadyHandoffPath)).toBeInTheDocument();
    expect(screen.getByText("Owner-input intake categories")).toBeInTheDocument();
    expect(screen.getByText("Local correction queue statuses")).toBeInTheDocument();
    expect(screen.getByText("Review-ready handoff closure states")).toBeInTheDocument();
    cleanup();

    for (const state of [
      { status: "unauthenticated" as const },
      { status: "authenticated_not_authorised" as const },
      { status: "unavailable" as const }
    ]) {
      render(<AdminShellContent state={state} view={{ kind: "release-control" }} />);
      expect(screen.queryByRole("heading", { name: /owner-input and local correction snapshot/i })).not.toBeInTheDocument();
      expect(screen.queryByText(ownerInputIntakePath)).not.toBeInTheDocument();
      cleanup();
    }
  });

  it("keeps protected admin shell and route wired to Phase 4B docs", () => {
    const shell = readRepoFile("website/app/admin/protected-admin-shell.tsx");
    const route = readRepoFile("website/app/admin/release-control/page.tsx");

    expect(shell).toContain(phase4aGatePath);
    expect(shell).toContain(ownerInputIntakePath);
    expect(shell).toContain(localCorrectionQueuePath);
    expect(shell).toContain(reviewReadyHandoffPath);
    expect(shell).toContain("phase4bOwnerInputCorrectionSnapshot");
    expect(shell).toContain("ownerInputIntakeCategories");
    expect(shell).toContain("localCorrectionQueueStatuses");
    expect(shell).toContain("reviewReadyHandoffClosureStates");
    expect(shell).toContain('view.kind === "release-control"');
    expect(route).toContain('view={{ kind: "release-control" }}');
  });

  it("keeps public source free of protected owner-input/correction internals and blocked public wording", () => {
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

  it("keeps forbidden runtime/provider/deployment files untracked and env reads absent", () => {
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
    expect(packageSource).not.toMatch(/@pinecone-database|pinecone/i);
    expect(appAndLibSource).not.toMatch(/NEXT_PUBLIC_SUPABASE|NEXT_PUBLIC_N8N|SUPABASE_SERVICE_ROLE|PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i);
  });
});
