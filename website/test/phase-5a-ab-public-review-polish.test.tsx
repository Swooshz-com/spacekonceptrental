import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AdminShellContent } from "../app/admin/protected-admin-shell";
import QuoteRequestForm from "../components/QuoteRequestForm";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const publicSourceRoots = [
  "website/app/layout.tsx",
  "website/app/page.tsx",
  "website/app/listings",
  "website/app/categories",
  "website/app/catalogue",
  "website/app/events",
  "website/app/quote",
  "website/app/not-found.tsx",
  "website/components/QuoteRequestForm.tsx"
];
const forbiddenPublicFlowPattern = new RegExp(
  `\\b(?:${[
    "ca" + "rt",
    "check" + "out",
    "pay" + "ment",
    "pur" + "chase",
    "online ord" + "ering",
    "confirmed ord" + "er"
  ].join("|")})\\b`,
  "i"
);
const forbiddenRentalCompletionPattern = new RegExp(
  `\\b(?:${[
    "book" + "ing",
    "reser" + "vation",
    "fulfil" + "ment",
    "fulfill" + "ment",
    "stock reser" + "vation",
    "stock-reser" + "vation",
    "book now",
    "reserve now"
  ].join("|")})\\b`,
  "i"
);
const forbiddenFakeFactPattern =
  /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i;
const forbiddenPublicInternalPattern = new RegExp(
  [
    "owner handoff bundle",
    "owner-facing review brief",
    "owner approval issue template",
    "no-deploy preflight command center",
    "owner approval packet",
    "release-control internals",
    "admin urls?",
    "internal notes",
    "recovery lanes?",
    "destructive-action safeguards",
    "status-transition matrix",
    "\\/admin\\/"
  ].join("|"),
  "i"
);
const forbiddenPublicScopePattern = /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b/i;
const dockerBypassPattern = /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i;

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

function readPublicProductionSource() {
  return readTrackedFiles(publicSourceRoots)
    .filter(isProductionSource)
    .map((filePath) => `${filePath}\n${readRepoFile(filePath)}`)
    .join("\n");
}

describe("Phase 5A-A/B public review polish", () => {
  afterEach(() => cleanup());

  it("keeps public production source rental/enquiry-only for owner review", () => {
    const source = readPublicProductionSource();

    expect(source).toMatch(/\b(?:listing|listings)\b/i);
    expect(source).toMatch(/\b(?:rental|rentals)\b/i);
    expect(source).toMatch(/\b(?:quote|enquiry|request)\b/i);
    expect(source).not.toMatch(forbiddenPublicFlowPattern);
    expect(source).not.toMatch(forbiddenRentalCompletionPattern);
    expect(source).not.toMatch(forbiddenFakeFactPattern);
    expect(source).not.toMatch(forbiddenPublicInternalPattern);
    expect(source).not.toMatch(forbiddenPublicScopePattern);
  });

  it("keeps quote/enquiry form copy request-intake only and non-promissory", () => {
    render(<QuoteRequestForm initialItemsText="Modular Lounge Set" />);

    expect(screen.getByText(/included automatically when you submit/i)).toBeInTheDocument();
    expect(screen.getByText(/not a rental fit confirmation/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /review and send an enquiry/i })).toBeInTheDocument();
    expect(screen.getByText(/triage the rental enquiry/i)).toBeInTheDocument();
    expect(screen.queryByText(forbiddenPublicFlowPattern)).not.toBeInTheDocument();
    expect(screen.queryByText(forbiddenRentalCompletionPattern)).not.toBeInTheDocument();
  });

  it("renders the owner review checklist summary only for authorised admin state", () => {
    render(
      <AdminShellContent
        state={authorisedAdminState}
        view={{ kind: "content-readiness" }}
      />
    );

    expect(
      screen.getByRole("heading", { name: /owner review checklist summary/i })
    ).toBeInTheDocument();
    expect(screen.getByText("docs/OWNER-HANDOFF-BUNDLE.md")).toBeInTheDocument();
    expect(screen.getByText("docs/content/OWNER-FACING-REVIEW-BRIEF.md")).toBeInTheDocument();
    expect(screen.getByText(".github/ISSUE_TEMPLATE/owner-approval-request.md")).toBeInTheDocument();
    expect(screen.getByText("docs/content/NO-DEPLOY-PREFLIGHT-COMMAND-CENTER.md")).toBeInTheDocument();
  });

  it("does not render protected owner review helper for blocked admin states", () => {
    render(
      <AdminShellContent
        state={{ status: "unauthenticated" }}
        view={{ kind: "content-readiness" }}
      />
    );

    expect(
      screen.queryByRole("heading", { name: /owner review checklist summary/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("docs/OWNER-HANDOFF-BUNDLE.md")).not.toBeInTheDocument();
  });

  it("registers the public review polish validator in package.json", () => {
    const packageJson = JSON.parse(readRepoFile("package.json"));

    expect(packageJson.scripts["validate:public-review-polish"]).toBe(
      "node scripts/validate-public-review-polish.cjs"
    );
  });

  it("keeps release-candidate suite required and free of Docker bypass logic", () => {
    const suite = readRepoFile("scripts/validate-release-candidate-suite.cjs");

    expect(suite).toContain("args: ['run', 'validate:public-review-polish']");
    expect(suite).not.toMatch(dockerBypassPattern);
  });
});
