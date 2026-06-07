import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CataloguePageContent
} from "../app/catalogue/page";
import { CategoriesPageContent } from "../app/categories/page";
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
const phase3bMergeCommit = "bfcf9916a0edd1b7133a1765719b9ddd73197dac";
const phase3cMergeCommit = "d031d7f47a6893f92d0b6739300d52147f6abfa4";
const phase3fMergeCommit = "f369b81ee939d21813af1c94c1d9702a14a8e43b";
const forbiddenCommercePattern =
  /cart|checkout|payments?|purchase|customer account|stock reservation|order fulfilment|confirmed booking|online ordering/i;

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

const emptyCategory: PublicCatalogueCategory = {
  id: "category-lighting",
  slug: "lighting",
  name: "Lighting",
  description: "Lighting notes for future rental setups.",
  sortOrder: 30
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

const tableProduct: PublicCatalogueProduct = {
  id: "product-table",
  slug: "cocktail-table-cluster",
  name: "Cocktail Table Cluster",
  shortDescription: "Small table groupings for networking areas.",
  description: "Published table setup details.",
  rentalUnit: "cluster",
  sortOrder: 20,
  categoryId: tableCategory.id,
  categoryName: tableCategory.name,
  source: "fallback"
};

const catalogue: PublicCatalogue = {
  source: "fallback",
  categories: [loungeCategory, tableCategory, emptyCategory],
  products: [loungeProduct, tableProduct]
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

describe("Phase 3C-A/B public catalogue discovery and quote funnel polish", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("records Phase 3C-A/B as completed after Phase 3G starts", () => {
    const status = normalizeWhitespace(readRepoFile("docs/PHASE-STATUS.md"));
    const roadmap = normalizeWhitespace(readRepoFile("docs/PHASE-ROADMAP.md"));
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const checklist = readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md");

    expect(status).toContain(
      "Current phase: Phase 3G-A/B - quote intake quality, admin triage depth, and enquiry workflow polish."
    );
    expect(status).toContain(
      "Latest completed capability: Phase 3F-A/B catalogue content quality, media readiness, and admin publication polish."
    );
    expect(status).toContain("Last merged capability PR: #128");
    expect(status).toContain(`Merge commit: \`${phase3fMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3F-A/B status");
    expect(status).toContain("Previous Current Phase 3E-A/B status");
    expect(status).toContain("Previous Current Phase 3D-A/B status");
    expect(status).toContain("Previous Current Phase 3C-A/B status");
    expect(status).toContain(`Merge commit: \`${phase3bMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3B-A/B status");
    expect(status).toContain("No deployment is performed or approved");
    expect(roadmap).toContain(
      "Phase 3C-A/B adds public catalogue discovery and quote funnel polish"
    );
    expect(readiness).toContain("Current Phase 3G-A/B status");
    expect(readiness).toContain("Previous Current Phase 3F-A/B status");
    expect(readiness).toContain("Previous Current Phase 3E-A/B status");
    expect(readiness).toContain("Previous Current Phase 3D-A/B status");
    expect(readiness).toContain("Previous Current Phase 3C-A/B status");
    expect(readiness).toContain("Previous Current Phase 3B-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 3C-A/B adds public catalogue discovery and quote funnel polish."
    );
    expect(checklist).toContain(
      "## Phase 3C-A/B Public Catalogue Discovery And Quote Funnel Polish"
    );
  });

  it("adds category discovery and event setup guidance from public catalogue data", () => {
    render(
      <CataloguePageContent
        catalogue={catalogue}
        detailBasePath="/listings"
        title="Rental listings"
      />
    );

    expect(screen.getByLabelText(/catalogue discovery/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /explore by category/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /all rental listings/i })
    ).toHaveAttribute("href", "/listings");
    expect(
      screen.getByRole("link", { name: /lounge 1 listing/i })
    ).toHaveAttribute("href", "/listings?category=lounge");
    expect(
      screen.getByRole("link", { name: /event tables 1 listing/i })
    ).toHaveAttribute("href", "/listings?category=event-tables");
    expect(screen.getByText(/popular event setups/i)).toBeInTheDocument();
    expect(screen.getByText(/reception lounge/i)).toBeInTheDocument();
    expect(screen.getByText(/conference seating/i)).toBeInTheDocument();
    expect(screen.getByText(/brand activation setup/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /send a quote enquiry/i })
    ).toHaveAttribute("href", "/quote");
  });

  it("gives filtered and empty catalogue states safe recovery paths", () => {
    render(
      <CataloguePageContent
        activeCategoryName="Lighting"
        activeCategorySlug="lighting"
        catalogue={{ ...catalogue, products: [] }}
        detailBasePath="/listings"
        emptyMessage="No public rental listings match Lighting right now."
        title="Lighting rental listings"
      />
    );

    expect(screen.getByText(/no public rental listings match lighting/i)).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /browse all listings/i })[0]
    ).toHaveAttribute("href", "/listings");
    expect(
      screen.getByRole("link", { name: /send a general enquiry/i })
    ).toHaveAttribute("href", "/quote");
    expect(
      screen.getByRole("link", { name: /lighting 0 listings/i })
    ).toHaveAttribute("aria-current", "page");
  });

  it("improves category browse empty states and quote CTAs", () => {
    render(
      <CategoriesPageContent
        catalogue={{
          source: "fallback",
          categories: [emptyCategory],
          products: []
        }}
      />
    );

    expect(
      screen.getByText(/no public listings are available in this category yet/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /browse all listings/i })[0]
    ).toHaveAttribute("href", "/listings");
    expect(
      screen.getByRole("link", { name: /start a quote request/i })
    ).toHaveAttribute("href", "/quote");

    cleanup();
    render(
      <CategoriesPageContent
        catalogue={{ source: "fallback", categories: [], products: [] }}
      />
    );

    expect(screen.getByText(/no public categories are available right now/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /browse all listings/i })
    ).toHaveAttribute("href", "/listings");
    expect(
      screen.getByRole("link", { name: /request a quote/i })
    ).toHaveAttribute("href", "/quote");
  });

  it("makes listing-to-quote handoff and requested item context clearer", async () => {
    render(
      await QuotePage({
        searchParams: Promise.resolve({ listing: "lounge-sofa-package" })
      })
    );

    expect(screen.getAllByText(/selected listing/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/requested item/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/lounge sofa package starts this rental request/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/event date helps the team understand timing/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/venue or event location helps the team plan delivery/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/add quantities, alternates, dimensions, or placement notes/i)
        .length
    ).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: /track|status/i })).not.toBeInTheDocument();
  });

  it("keeps Phase 3C inside repo-local public catalogue and quote scope", () => {
    const productionSource = readTrackedProductionSources([
      "website/app/page.tsx",
      "website/app/listings",
      "website/app/categories",
      "website/app/catalogue",
      "website/app/events",
      "website/app/quote",
      "website/app/api",
      "website/components",
      "website/lib/catalogue",
      "website/lib/quote"
    ]);
    const packageSource = [
      readRepoFile("package.json"),
      readRepoFile("website/package.json")
    ].join("\n");

    expect(productionSource).not.toMatch(forbiddenCommercePattern);
    expect(productionSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(productionSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(productionSource).not.toMatch(/service-role/i);
    expect(productionSource).not.toMatch(/notification|crm/i);
    expect(packageSource).not.toMatch(/@pinecone-database|pinecone/i);
    expect(productionSource).not.toMatch(/PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i);
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
