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
const forbiddenPublicFlowPattern = /\b(?:cart|checkout|payment|purchase|online ordering|confirmed order)\b/i;
const forbiddenRentalCompletionPattern = /\b(?:booking|reservation|fulfilment|fulfillment|stock reservation|stock-reservation|book now|reserve now)\b/i;
const forbiddenFakeFactPattern =
  /award-winning|certified partner|trusted by|5-star|guaranteed availability|guaranteed delivery|licensed and insured|testimonial|client logo|case study|legal guarantee|production policy|service-area claim|Singapore\s+\d{6}|\+?\d[\d\s().-]{7,}|Mon(?:day)?\s*-\s*Fri|24\/7|123\s+Main/i;
const forbiddenPublicInternalPattern =
  /owner handoff bundle|owner-facing review brief|owner approval issue template|no-deploy preflight command center|owner approval packet|release-control internals|admin urls?|internal notes|recovery lanes?|destructive-action safeguards|status-transition matrix|\/admin\//i;
const forbiddenPublicScopePattern = /customer account|quote tracking|file upload|public upload|notifications?|\bCRM\b/i;
const dockerBypassPattern = /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i;
const receiptPromisePattern = /guaranteed availability|response time|set aside furniture and finalise|final rental details are ready|\bhold\b|booking|reservation|fulfilment|fulfillment/i;

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

describe("Phase 5C-A/B public discovery acceptance", () => {
  afterEach(() => cleanup());

  it("keeps public discovery source on safe rental listing and enquiry wording", () => {
    const source = readPublicProductionSource();

    for (const required of [
      /Search listings/i,
      /Filter rental listings/i,
      /Browse Catalogue/i,
      /Explore Setups/i,
      /Active filters/i,
      /Clear filters/i,
      /Browse listings/i,
      /View rental listing/i,
      /Request Quote/i,
      /Request Quote/i,
      /Request Quote/i,
      /rental/i,
      /listing/i,
      /quote|enquiry|request/i
    ]) {
      expect(source).toMatch(required);
    }

    expect(source).not.toMatch(forbiddenPublicFlowPattern);
    expect(source).not.toMatch(forbiddenRentalCompletionPattern);
    expect(source).not.toMatch(forbiddenFakeFactPattern);
    expect(source).not.toMatch(forbiddenPublicInternalPattern);
    expect(source).not.toMatch(forbiddenPublicScopePattern);
  });

  it("keeps search/filter empty states safe for browsing or enquiry recovery", () => {
    const source = readPublicProductionSource();

    expect(source).toMatch(/No matching public listings/i);
    expect(source).toMatch(/Browse all listings/i);
    expect(source).toMatch(/Browse Catalogue/i);
    expect(source).toMatch(/Explore event-use guidance|Explore Setups/i);
    expect(source).toMatch(/quote request for team review/i);
    expect(source).not.toMatch(forbiddenPublicInternalPattern);
  });

  it("keeps listing, category, event, and search context editable and request-only", () => {
    render(
      <QuoteRequestForm
        initialItemsText={[
          "Modular Lounge Set",
          "Category interest: lounge",
          "Event-use interest: reception-lounge",
          "Search interest: soft seating"
        ].join("\n")}
      />
    );

    expect(screen.getByText(/starts this rental request/i)).toBeInTheDocument();
    expect(screen.getByText(/starting point only/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Requested listings or items/i)).toHaveValue(
      [
        "Modular Lounge Set",
        "Category interest: lounge",
        "Event-use interest: reception-lounge",
        "Search interest: soft seating"
      ].join("\n")
    );
    expect(screen.getByRole("button", { name: /submit enquiry/i })).toBeInTheDocument();
    expect(screen.queryByText(forbiddenPublicFlowPattern)).not.toBeInTheDocument();
    expect(screen.queryByText(forbiddenRentalCompletionPattern)).not.toBeInTheDocument();
  });

  it("keeps success and receipt copy non-promissory", () => {
    const source = readPublicProductionSource();

    expect(source).toMatch(/Enquiry received/i);
    expect(source).toMatch(/receipt only/i);
    expect(source).toMatch(/review\s+your request/i);
    expect(source).toMatch(/follow up directly/i);
    expect(source).not.toMatch(receiptPromisePattern);
  });

  it("renders protected discovery parity helper only for authorised admin state", () => {
    render(
      <AdminShellContent
        state={authorisedAdminState}
        view={{ kind: "public-parity" }}
      />
    );

    expect(
      screen.getByRole("heading", {
        name: /public discovery-to-enquiry parity review/i
      })
    ).toBeInTheDocument();
    expect(screen.getByText("docs/OWNER-HANDOFF-BUNDLE.md")).toBeInTheDocument();
    expect(
      screen.getByText("docs/content/LOCAL-CONTENT-READINESS-CLEANUP.md")
    ).toBeInTheDocument();
    expect(
      screen.getByText("docs/content/LOCAL-PUBLIC-JOURNEY-ACCEPTANCE.md")
    ).toBeInTheDocument();
    expect(
      screen.getByText("docs/content/LOCAL-DISCOVERY-SEARCH-FILTER-ACCEPTANCE.md")
    ).toBeInTheDocument();
    expect(screen.getByText(/Search listings, category chips/i)).toBeInTheDocument();
  });

  it("does not render protected discovery parity helper for blocked admin states", () => {
    render(
      <AdminShellContent
        state={{ status: "authenticated_not_authorised" }}
        view={{ kind: "public-parity" }}
      />
    );

    expect(
      screen.queryByRole("heading", {
        name: /public discovery-to-enquiry parity review/i
      })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("docs/OWNER-HANDOFF-BUNDLE.md")).not.toBeInTheDocument();
  });

  it("registers the public discovery validator and keeps the release suite strict", () => {
    const packageJson = JSON.parse(readRepoFile("package.json"));
    const suite = readRepoFile("scripts/validate-release-candidate-suite.cjs");

    expect(packageJson.scripts["validate:public-discovery-acceptance"]).toBe(
      "node scripts/validate-public-discovery-acceptance.cjs"
    );
    expect(suite).toContain("args: ['run', 'validate:public-discovery-acceptance']");
    expect(suite).not.toMatch(dockerBypassPattern);
  });
});
