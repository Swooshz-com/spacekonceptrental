import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AdminShellContent } from "../app/admin/protected-admin-shell";
import { ProductPageContent } from "../app/catalogue/[slug]/page";
import QuoteRequestForm from "../components/QuoteRequestForm";
import type { PublicCatalogueProduct } from "../lib/catalogue/types";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const listingDetailSourceRoots = [
  "website/app/catalogue/[slug]",
  "website/app/listings/[slug]",
  "website/app/quote",
  "website/components/QuoteRequestForm.tsx"
];
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
const receiptPromisePattern = /guaranteed availability|response time|set aside furniture and finish|final rental details are ready|\bhold\b|booking|reservation|fulfilment|fulfillment/i;
const mediaPromisePattern = /owner-approved media|real inventory confirmation|final styling|final availability|guaranteed availability/i;
const dockerBypassPattern = /docker[^\n]*(?:skip|bypass)|(?:skip|bypass)[^\n]*docker/i;

const fallbackProduct: PublicCatalogueProduct = {
  id: "fallback-lounge-sofa-package",
  slug: "lounge-sofa-package",
  name: "Lounge sofa package",
  shortDescription: "Soft seating for receptions and event furniture planning.",
  description: "Sample lounge context for event furniture rental requests.",
  rentalUnit: "set",
  sortOrder: 20,
  categoryId: "fallback-lounge",
  categoryName: "Lounge",
  images: [],
  source: "fallback"
};

const relatedProduct: PublicCatalogueProduct = {
  ...fallbackProduct,
  id: "fallback-lounge-related",
  slug: "modular-lounge-set",
  name: "Modular lounge set",
  sortOrder: 30
};

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

function readProductionSource(paths: string[]) {
  return readTrackedFiles(paths)
    .filter(isProductionSource)
    .map((filePath) => `${filePath}\n${readRepoFile(filePath)}`)
    .join("\n");
}

describe("Phase 5D-A/B listing detail readiness", () => {
  afterEach(() => cleanup());

  it("keeps listing detail source on safe listing, media, rental, quote, enquiry, and request wording", () => {
    const source = readProductionSource(listingDetailSourceRoots);

    for (const required of [
      /View rental listing/i,
      /Rental details/i,
      /Category/i,
      /Rental unit/i,
      /Event-use context/i,
      /Quote request checklist/i,
      /public-safe alt text/i,
      /representative, review-safe rental image/i,
      /Request a quote/i,
      /Send an enquiry/i,
      /Start a rental enquiry/i,
      /Listing context is\s+a starting point only/i,
      /The team can review the request/i
    ]) {
      expect(source).toMatch(required);
    }
  });

  it("renders safe listing detail CTAs and related browsing continuity", () => {
    render(
      <ProductPageContent
        product={fallbackProduct}
        relatedListings={[relatedProduct]}
      />
    );

    expect(screen.getAllByText(/View rental listing/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Browse listings/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Browse categories/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Explore event-use ideas/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Request a quote/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Send an enquiry/i })).toBeInTheDocument();
    expect(screen.getByText(/Same-category links are local browsing cues only/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View rental listing: Modular lounge set/i })).toBeInTheDocument();
  });

  it("keeps media and fallback copy accessible and non-promissory", () => {
    render(<ProductPageContent product={fallbackProduct} />);

    expect(screen.getByAltText(/Lounge sofa package furniture rental setup/i)).toBeInTheDocument();
    expect(screen.getByText(/Representative, review-safe rental image/i)).toBeInTheDocument();
    expect(screen.getByText(/accessible browsing context/i)).toBeInTheDocument();
    expect(readProductionSource(listingDetailSourceRoots)).not.toMatch(mediaPromisePattern);
  });

  it("keeps selected listing context editable, request-only, and non-promissory", () => {
    render(
      <QuoteRequestForm
        initialItemsText={[
          "Lounge sofa package",
          "Category interest: lounge",
          "Event-use interest: reception-lounge",
          "Search interest: soft seating"
        ].join("\n")}
      />
    );

    expect(screen.getByText(/Listing context is a starting point only/i)).toBeInTheDocument();
    expect(screen.getByText(/the team can review the request/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Requested listings or items/i)).toHaveValue(
      [
        "Lounge sofa package",
        "Category interest: lounge",
        "Event-use interest: reception-lounge",
        "Search interest: soft seating"
      ].join("\n")
    );
    expect(screen.getByRole("button", { name: /send an enquiry/i })).toBeInTheDocument();
  });

  it("keeps success and receipt copy free of availability, hold, booking, response-time, or fulfilment promises", () => {
    const source = readProductionSource(publicSourceRoots);

    expect(source).toMatch(/Enquiry received/i);
    expect(source).toMatch(/receipt only/i);
    expect(source).toMatch(/review\s+your request/i);
    expect(source).not.toMatch(receiptPromisePattern);
  });

  it("keeps public listing detail source free of ecommerce, fake facts, internals, and public account scope creep", () => {
    const source = readProductionSource(publicSourceRoots);

    expect(source).not.toMatch(forbiddenPublicFlowPattern);
    expect(source).not.toMatch(forbiddenRentalCompletionPattern);
    expect(source).not.toMatch(forbiddenFakeFactPattern);
    expect(source).not.toMatch(forbiddenPublicInternalPattern);
    expect(source).not.toMatch(forbiddenPublicScopePattern);
  });

  it("renders protected listing-detail parity helper only for authorised admin state", () => {
    render(
      <AdminShellContent
        state={authorisedAdminState}
        view={{ kind: "public-parity" }}
      />
    );

    expect(
      screen.getByRole("heading", {
        name: /Phase 5D listing-detail parity summary/i
      })
    ).toBeInTheDocument();
    expect(screen.getByText("docs/OWNER-HANDOFF-BUNDLE.md")).toBeInTheDocument();
    expect(screen.getByText("docs/content/LOCAL-PUBLIC-JOURNEY-ACCEPTANCE.md")).toBeInTheDocument();
    expect(screen.getByText("docs/content/LOCAL-DISCOVERY-SEARCH-FILTER-ACCEPTANCE.md")).toBeInTheDocument();
    expect(screen.getByText("docs/content/LOCAL-LISTING-DETAIL-READINESS.md")).toBeInTheDocument();
    expect(screen.getByText(/Listing detail public layout coverage/i)).toBeInTheDocument();
  });

  it("does not render protected listing-detail parity helper for blocked admin states", () => {
    render(
      <AdminShellContent
        state={{ status: "authenticated_not_authorised" }}
        view={{ kind: "public-parity" }}
      />
    );

    expect(
      screen.queryByRole("heading", {
        name: /Phase 5D listing-detail parity summary/i
      })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("docs/content/LOCAL-LISTING-DETAIL-READINESS.md")).not.toBeInTheDocument();
  });

  it("registers the listing detail validator and keeps the release suite strict", () => {
    const packageJson = JSON.parse(readRepoFile("package.json"));
    const suite = readRepoFile("scripts/validate-release-candidate-suite.cjs");

    expect(packageJson.scripts["validate:listing-detail-readiness"]).toBe(
      "node scripts/validate-listing-detail-readiness.cjs"
    );
    expect(suite).toContain("args: ['run', 'validate:listing-detail-readiness']");
    expect(suite).not.toMatch(dockerBypassPattern);
  });
});
