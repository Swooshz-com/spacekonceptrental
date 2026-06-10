import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import type { Metadata } from "next";
import { afterEach, describe, expect, it, vi } from "vitest";

import { metadata as rootMetadata } from "../app/layout";
import { metadata as homeMetadata } from "../app/page";
import HomePage from "../app/page";
import {
  CataloguePageContent,
  metadata as catalogueMetadata
} from "../app/catalogue/page";
import {
  generateMetadata as generateCatalogueDetailMetadata,
  ProductPageContent
} from "../app/catalogue/[slug]/page";
import CatalogueListingNotFound from "../app/catalogue/[slug]/not-found";
import {
  CategoriesPageContent,
  metadata as categoriesMetadata
} from "../app/categories/page";
import { metadata as eventsMetadata } from "../app/events/page";
import EventsPage from "../app/events/page";
import { metadata as listingsMetadata } from "../app/listings/page";
import {
  generateMetadata as generateListingDetailMetadata
} from "../app/listings/[slug]/page";
import ListingNotFound from "../app/listings/[slug]/not-found";
import { metadata as quoteMetadata } from "../app/quote/page";
import QuotePage from "../app/quote/page";
import type {
  PublicCatalogue,
  PublicCatalogueCategory,
  PublicCatalogueProduct
} from "../lib/catalogue/types";

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string | { src: string } }) => (
    <img alt={alt} src={typeof src === "string" ? src : src.src} />
  )
}));

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const phase3hMergeCommit = "09f92ede4b5d9f725d0df560838a12fef27940b9";
const phase3iMergeCommit = "0d2d40898c4e716032fdec130704117494c542d6";
const phase3jMergeCommit = "1c7dc0ac7c2532fa8a837cd46b0d1f0103d5ccfa";
const forbiddenCommercePattern =
  /cart|checkout|payments?|purchase|customer account|stock reservation|order fulfilment|confirmed booking|online ordering/i;
const forbiddenPublicAdminPattern =
  /operator qa|admin-only triage|internal quote notes|internal activity|admin management urls|protected admin routes|\/admin\/quotes/i;
const forbiddenProofClaimPattern =
  /testimonials?|client logos?|awards?|certifications?|certified|guaranteed|guarantees?/i;
const literalContactPattern =
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\+?\d[\d\s().-]{7,}\d/i;

const loungeCategory: PublicCatalogueCategory = {
  id: "category-lounge",
  slug: "lounge",
  name: "Lounge",
  description: "Soft seating for receptions and VIP areas.",
  sortOrder: 10
};

const tableCategory: PublicCatalogueCategory = {
  id: "category-tables",
  slug: "event-tables",
  name: "Event tables",
  description: "Tables for conferences, launches, and dining layouts.",
  sortOrder: 20
};

const loungeProduct: PublicCatalogueProduct = {
  id: "product-lounge",
  slug: "modular-lounge-set",
  name: "Modular Lounge Set",
  shortDescription: "Soft seating for reception spaces.",
  description: "Published lounge set details.",
  rentalUnit: "set",
  sortOrder: 10,
  categoryId: loungeCategory.id,
  categoryName: loungeCategory.name,
  source: "fallback"
};

const catalogue: PublicCatalogue = {
  source: "fallback",
  categories: [loungeCategory, tableCategory],
  products: [loungeProduct]
};

const publicRouteMetadata = [
  rootMetadata,
  homeMetadata,
  catalogueMetadata,
  listingsMetadata,
  categoriesMetadata,
  eventsMetadata,
  quoteMetadata
];

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

function metadataTitle(metadata: Metadata) {
  const title = metadata.title;

  if (typeof title === "string") {
    return title;
  }

  if (title && "default" in title) {
    return title.default;
  }

  if (title && "absolute" in title) {
    return title.absolute;
  }

  return "";
}

function metadataDescription(metadata: Metadata) {
  return typeof metadata.description === "string" ? metadata.description : "";
}

function collectInternalHrefs(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLAnchorElement>("a[href]"))
    .map((link) => link.getAttribute("href"))
    .filter((href): href is string => Boolean(href?.startsWith("/")));
}

describe("Phase 3I-A/B full-site acceptance SEO accessibility hardening", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("records Phase 3I-A/B as completed after Phase 3J starts", () => {
    const status = readRepoFile("docs/PHASE-STATUS.md");
    const currentStatus = normalizeWhitespace(
      status.split("## Remaining-work map")[0] ?? status
    );
    const roadmap = normalizeWhitespace(readRepoFile("docs/PHASE-ROADMAP.md"));
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const checklist = readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md");
    const validator = readRepoFile("scripts/validate-preview-handoff.cjs");

    expect(currentStatus).toContain(
      "Current phase: Phase 3K-A/B - owner content intake, content gap register, and launch-blocker governance."
    );
    expect(currentStatus).toContain(
      "Latest completed capability: Phase 3J-A/B owner review readiness package, manual QA runbook, and release-decision preparation."
    );
    expect(currentStatus).toContain("Last merged capability PR: #132");
    expect(currentStatus).toContain(`Merge commit: \`${phase3jMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3J-A/B status");
    expect(status).toContain("Previous Current Phase 3I-A/B status");
    expect(status).toContain("Previous Current Phase 3H-A/B status");
    expect(status).toContain("Previous Current Phase 3G-A/B status");
    expect(roadmap).toContain(
      "Phase 3I-A/B adds full-site acceptance QA, public SEO/accessibility polish, and non-deployment release hardening"
    );
    expect(readiness).toContain("Current Phase 3K-A/B status");
    expect(readiness).toContain("Previous Current Phase 3J-A/B status");
    expect(readiness).toContain("Previous Current Phase 3I-A/B status");
    expect(readiness).toContain("Previous Current Phase 3H-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 3I-A/B adds full-site acceptance QA, public SEO/accessibility polish, and non-deployment release hardening."
    );
    expect(checklist).toContain(
      "## Phase 3I-A/B Full-Site Acceptance QA Public SEO Accessibility Polish And Non-Deployment Release Hardening"
    );
    expect(validator).toContain(phase3hMergeCommit);
    expect(validator).toContain(phase3jMergeCommit);
    expect(validator).toContain("Phase 3K-A/B");
    expect(validator).toContain("Phase 3I-A/B");
    expect(validator).not.toMatch(/\bvercel\s+(?:deploy|link|env|pull|promote)\b/i);
  });

  it("keeps public metadata descriptive, rental-oriented, and claim-safe", async () => {
    const catalogueDetailMetadata = await generateCatalogueDetailMetadata({
      params: Promise.resolve({ slug: "lounge-sofa-package" })
    });
    const listingDetailMetadata = await generateListingDetailMetadata({
      params: Promise.resolve({ slug: "lounge-sofa-package" })
    });

    expect(metadataTitle(rootMetadata)).toBe(
      "Space Koncept Rentals | Event furniture rental"
    );
    expect(metadataDescription(rootMetadata)).toContain("quote enquiry");

    for (const metadata of [
      ...publicRouteMetadata,
      catalogueDetailMetadata,
      listingDetailMetadata
    ]) {
      const searchableMetadata = [
        metadataTitle(metadata),
        metadataDescription(metadata)
      ].join(" ");

      expect(searchableMetadata).toMatch(
        /rental|furniture|listing|catalogue|event|quote|enquiry/i
      );
      expect(searchableMetadata).not.toMatch(forbiddenCommercePattern);
      expect(searchableMetadata).not.toMatch(forbiddenProofClaimPattern);
      expect(searchableMetadata).not.toMatch(literalContactPattern);
    }
  });

  it("renders full public route headings, recovery, and public-only links", async () => {
    const hrefs: string[] = [];

    for (const element of [
      await HomePage(),
      <CataloguePageContent catalogue={catalogue} />,
      <CategoriesPageContent catalogue={catalogue} />,
      <ProductPageContent product={loungeProduct} />,
      <CatalogueListingNotFound />,
      <ListingNotFound />,
      <EventsPage />,
      await QuotePage({
        searchParams: Promise.resolve({ listing: "lounge-sofa-package" })
      })
    ]) {
      const { container, unmount } = render(element);
      hrefs.push(...collectInternalHrefs(container));
      unmount();
    }

    render(await HomePage());
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /event furniture rental for planned spaces/i
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/team reviews availability and fit/i)
    ).not.toBeInTheDocument();

    cleanup();
    render(await QuotePage());
    expect(
      screen.getByRole("heading", { level: 1, name: /request a rental quote/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: /quote request recovery/i })
    ).toBeInTheDocument();

    expect(hrefs.some((href) => href.startsWith("/admin"))).toBe(false);
    for (const requiredRoute of [
      "/catalogue",
      "/listings",
      "/categories",
      "/events",
      "/quote",
      "/quote?listing=modular-lounge-set"
    ]) {
      expect(hrefs).toContain(requiredRoute);
    }

    expect(readRepoFile("website/app/layout.tsx")).toMatch(
      />\s*Quote enquiry\s*</
    );
  });

  it("keeps public quote acceptance honest without reservations or tracking", async () => {
    render(
      await QuotePage({
        searchParams: Promise.resolve({ listing: "lounge-sofa-package" })
      })
    );

    expect(screen.getByText(/not a rental fit confirmation/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/does not set aside furniture or finalise rental details/i)
        .length
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("link", { name: /track|status|customer account/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(forbiddenPublicAdminPattern)).not.toBeInTheDocument();
  });

  it("keeps Phase 3I inside public QA and non-deployment hardening scope", () => {
    const publicSource = readTrackedProductionSources([
      "website/app/layout.tsx",
      "website/app/page.tsx",
      "website/app/listings",
      "website/app/categories",
      "website/app/catalogue",
      "website/app/events",
      "website/app/quote",
      "website/components/QuoteRequestForm.tsx"
    ]);
    const appAndLibSource = readTrackedProductionSources([
      "website/app",
      "website/components",
      "website/lib"
    ]);
    const packageSource = [
      readRepoFile("package.json"),
      readRepoFile("website/package.json")
    ].join("\n");

    expect(publicSource).toMatch(/rental/i);
    expect(publicSource).toMatch(/(?:listing|catalogue|event|quote|enquiry)/i);
    expect(publicSource).not.toMatch(forbiddenPublicAdminPattern);
    expect(publicSource).not.toMatch(forbiddenCommercePattern);
    expect(publicSource).not.toMatch(forbiddenProofClaimPattern);
    expect(publicSource).not.toMatch(literalContactPattern);
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
  });
});
