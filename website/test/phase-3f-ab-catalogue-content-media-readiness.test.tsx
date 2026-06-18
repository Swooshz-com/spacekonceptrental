import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CategoryManagementPanel, type CategoryManagementCategory } from "../components/admin/category-management-panel";
import {
  ListingImageMetadataManagementPanel,
  type ListingImageMetadataImage,
  type ListingImageMetadataProduct
} from "../components/admin/listing-image-metadata-management-panel";
import {
  ListingManagementPanel,
  type ListingManagementCategory,
  type ListingManagementProduct
} from "../components/admin/listing-management-panel";
import { CataloguePageContent } from "../app/catalogue/page";
import { ProductPageContent } from "../app/catalogue/[slug]/page";
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
const phase3fMergeCommit = "69665bb241b1af5c05ad34ac1464cdaeece8b7f8";
const phase3gMergeCommit = "75fd104966e3e8c69a434f2325f6f79e4742a40f";
const phase3hMergeCommit = "09f92ede4b5d9f725d0df560838a12fef27940b9";
const phase3iMergeCommit = "0d2d40898c4e716032fdec130704117494c542d6";
const phase3jMergeCommit = "1c7dc0ac7c2532fa8a837cd46b0d1f0103d5ccfa";
const forbiddenCommercePattern =
  /cart|checkout|payments?|purchase|customer account|stock reservation|order fulfilment|confirmed booking|online ordering/i;

const loungeCategory: PublicCatalogueCategory = {
  id: "category-lounge",
  slug: "lounge",
  name: "Lounge",
  sortOrder: 10
};

const lightingCategory: PublicCatalogueCategory = {
  id: "category-lighting",
  slug: "lighting",
  name: "Lighting",
  sortOrder: 20
};

const incompletePublicListing: PublicCatalogueProduct = {
  id: "product-bare-plinth",
  slug: "bare-plinth",
  name: "Bare Plinth",
  rentalUnit: "",
  sortOrder: 10,
  images: [
    {
      id: "image-plinth",
      storageBucket: "listing-media",
      storagePath: "fixtures/plinth.jpg",
      publicUrl: "https://example.test/storage/plinth.jpg",
      altText: "",
      sortOrder: 1,
      isPrimary: true
    }
  ],
  primaryImage: {
    id: "image-plinth",
    storageBucket: "listing-media",
    storagePath: "fixtures/plinth.jpg",
    publicUrl: "https://example.test/storage/plinth.jpg",
    altText: "",
    sortOrder: 1,
    isPrimary: true
  },
  source: "supabase"
};

const incompleteCatalogue: PublicCatalogue = {
  source: "supabase",
  categories: [loungeCategory, lightingCategory],
  products: [incompletePublicListing]
};

const adminCategory: ListingManagementCategory & CategoryManagementCategory = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "lounge",
  name: "Lounge",
  sortOrder: 10,
  isPublished: true,
  productCount: 2
};

const emptyPublishedCategory: CategoryManagementCategory & {
  publishedProductCount: number;
} = {
  id: "33333333-3333-4333-8333-333333333333",
  slug: "lighting",
  name: "Lighting",
  sortOrder: 20,
  isPublished: true,
  productCount: 1,
  publishedProductCount: 0
};

const readyListing: ListingManagementProduct & ListingImageMetadataProduct = {
  id: "22222222-2222-4222-8222-222222222222",
  categoryId: adminCategory.id,
  slug: "modular-lounge",
  name: "Modular Lounge",
  shortDescription: "Soft modular seating",
  description: "Existing full modular lounge listing description.",
  rentalUnit: "set",
  status: "published",
  sortOrder: 10,
  imageCount: 2,
  primaryImageAltText: "Modular lounge setup"
};

const publishedListingMissingReadiness: ListingManagementProduct & ListingImageMetadataProduct = {
  id: "44444444-4444-4444-8444-444444444444",
  slug: "bare-plinth",
  name: "Bare Plinth",
  rentalUnit: "",
  status: "published",
  sortOrder: 20,
  imageCount: 0
};

const draftListing: ListingManagementProduct = {
  ...readyListing,
  id: "55555555-5555-4555-8555-555555555555",
  slug: "draft-lounge",
  name: "Draft Lounge",
  status: "draft"
};

const archivedListing: ListingManagementProduct = {
  ...readyListing,
  id: "66666666-6666-4666-8666-666666666666",
  slug: "archived-lounge",
  name: "Archived Lounge",
  status: "archived"
};

const duplicatePrimaryImage: ListingImageMetadataImage = {
  id: "77777777-7777-4777-8777-777777777777",
  productId: readyListing.id,
  storageBucket: "listing-media",
  storagePath: "fixtures/lounge-1.jpg",
  altText: "Modular lounge hero",
  sortOrder: 1,
  isPrimary: true,
  status: "active"
};

const duplicatePrimaryMissingAlt: ListingImageMetadataImage = {
  id: "88888888-8888-4888-8888-888888888888",
  productId: readyListing.id,
  storageBucket: "listing-media",
  storagePath: "fixtures/lounge-2.jpg",
  sortOrder: 2,
  isPrimary: true,
  status: "active"
};

const archivedImage: ListingImageMetadataImage = {
  id: "99999999-9999-4999-8999-999999999999",
  productId: readyListing.id,
  storageBucket: "listing-media",
  storagePath: "fixtures/lounge-archived.jpg",
  altText: "Archived lounge",
  sortOrder: 3,
  isPrimary: false,
  status: "archived"
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

describe("Phase 3F-A/B catalogue content quality, media readiness, and publication polish", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("records Phase 3F-A/B as completed after Phase 3J starts", () => {
    const status = normalizeWhitespace(readRepoFile("docs/PHASE-STATUS.md"));
    const roadmap = normalizeWhitespace(readRepoFile("docs/PHASE-ROADMAP.md"));
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const checklist = readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md");
    const validator = readRepoFile("scripts/validate-preview-handoff.cjs");

    expect(status).toContain(
      "Current phase: Phase 3K-A/B - owner content intake, content gap register, and launch-blocker governance."
    );
    expect(status).toContain(
      "Latest completed capability: Phase 3J-A/B owner review readiness package, manual QA runbook, and release-decision preparation."
    );
    expect(status).toContain("Last merged capability PR: #132");
    expect(status).toContain(`Merge commit: \`${phase3jMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3J-A/B status");
    expect(status).toContain("Previous Current Phase 3I-A/B status");
    expect(status).toContain("Previous Current Phase 3H-A/B status");
    expect(status).toContain("Previous Current Phase 3G-A/B status");
    expect(status).toContain("Previous Current Phase 3F-A/B status");
    expect(status).toContain("Previous Current Phase 3E-A/B status");
    expect(status).toContain("No deployment is performed or approved");
    expect(roadmap).toContain(
      "Phase 3F-A/B adds catalogue content quality, media readiness, and admin publication polish"
    );
    expect(readiness).toContain("Current Phase 3K-A/B status");
    expect(readiness).toContain("Previous Current Phase 3J-A/B status");
    expect(readiness).toContain("Previous Current Phase 3I-A/B status");
    expect(readiness).toContain("Previous Current Phase 3H-A/B status");
    expect(readiness).toContain("Previous Current Phase 3G-A/B status");
    expect(readiness).toContain("Previous Current Phase 3F-A/B status");
    expect(readiness).toContain("Previous Current Phase 3E-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 3F-A/B adds catalogue content quality, media readiness, and admin publication polish."
    );
    expect(checklist).toContain(
      "## Phase 3F-A/B Catalogue Content Quality Media Readiness And Admin Publication Polish"
    );
    expect(validator).toContain(phase3fMergeCommit);
    expect(validator).toContain(phase3gMergeCommit);
    expect(validator).toContain(phase3hMergeCommit);
    expect(validator).toContain(phase3jMergeCommit);
    expect(validator).toContain("Phase 3K-A/B");
    expect(validator).toContain("Phase 3I-A/B");
    expect(validator).toContain("Phase 3H-A/B");
    expect(validator).not.toMatch(/\bvercel\s+(?:deploy|link|env|pull|promote)\b/i);
  });

  it("keeps public catalogue cards readable with incomplete-but-safe listing data", () => {
    render(
      <CataloguePageContent
        catalogue={incompleteCatalogue}
        detailBasePath="/listings"
        title="Rental listings"
      />
    );

    expect(screen.getByRole("heading", { name: /bare plinth/i })).toBeInTheDocument();
    expect(screen.getByText(/category to confirm/i)).toBeInTheDocument();
    expect(screen.getAllByText(/rental unit/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/confirm with team/i)).toBeInTheDocument();
    expect(
      screen.getByText(/listing details can be reviewed with the team during quote follow-up/i)
    ).toBeInTheDocument();
    expect(screen.getByAltText(/bare plinth furniture rental setup/i)).toHaveAttribute(
      "src",
      "https://example.test/storage/plinth.jpg"
    );
    expect(
      screen.getByRole("link", { name: /request a quote/i })
    ).toHaveAttribute("href", "/quote?listing=bare-plinth");
    expect(screen.queryByText(/publication readiness|media readiness/i)).not.toBeInTheDocument();
  });

  it("keeps category cards and listing detail pages readable when descriptions and counts are missing", () => {
    render(
      <CategoriesPageContent
        catalogue={{
          source: "supabase",
          categories: [lightingCategory],
          products: []
        }}
      />
    );

    expect(screen.getByText(/0 public listings/i)).toBeInTheDocument();
    expect(
      screen.getByText(/category description can be reviewed with the team during quote follow-up/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no public listings are available in this category yet/i)
    ).toBeInTheDocument();

    cleanup();
    render(
      <ProductPageContent
        product={{
          ...incompletePublicListing,
          images: [],
          primaryImage: undefined
        }}
      />
    );

    expect(
      screen.getAllByText(/listing details can be reviewed with the team during quote follow-up/i)
        .length
    ).toBeGreaterThan(0);
    expect(screen.getByText(/category to confirm/i)).toBeInTheDocument();
    expect(screen.getByText(/confirm with team/i)).toBeInTheDocument();
    expect(screen.getByAltText(/bare plinth furniture rental setup/i)).toBeInTheDocument();
  });

  it("keeps quote handoff copy coherent when listing context is missing, invalid, or unavailable", async () => {
    render(
      await QuotePage({
        searchParams: Promise.resolve({
          listing: "not a valid slug"
        })
      })
    );

    expect(screen.getByRole("heading", { name: /general rental enquiry/i })).toBeInTheDocument();
    expect(
      screen.getByText(/share the requested listings or items/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/requested listings or items/i)).toHaveValue("");
    expect(screen.queryByRole("link", { name: /track|status/i })).not.toBeInTheDocument();
  });

  it("shows admin publication readiness summaries for listing and category fixes", () => {
    render(
      <ListingManagementPanel
        categories={[adminCategory]}
        products={[readyListing, publishedListingMissingReadiness, draftListing, archivedListing]}
      />
    );

    expect(screen.getByText(/published: 2/i)).toBeInTheDocument();
    expect(screen.getByText(/draft: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/archived: 1/i)).toBeInTheDocument();
    expect(
      screen.getByText(/1 published listing needs public-ready listing fixes before visitor browsing review/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/published listings needing fixes: bare plinth/i)).toBeInTheDocument();
    expect(
      within(screen.getByLabelText(/public-ready listing helper bare plinth/i)).getByText(
        /add quote-planning details before publication/i
      )
    ).toBeInTheDocument();

    cleanup();
    render(<CategoryManagementPanel categories={[adminCategory, emptyPublishedCategory]} />);

    expect(screen.getByText(/category visibility review/i)).toBeInTheDocument();
    expect(
      screen.getByText(/published categories without published listings: lighting/i)
    ).toBeInTheDocument();
    expect(
      within(screen.getByLabelText(/category visibility review lighting/i)).getByText(
        /published category has no published listings/i
      )
    ).toBeInTheDocument();
  });

  it("shows media readiness cues for missing alt text, duplicate primary state, inactive metadata, and listings without active media", () => {
    render(
      <ListingImageMetadataManagementPanel
        images={[duplicatePrimaryImage, duplicatePrimaryMissingAlt, archivedImage]}
        products={[readyListing, publishedListingMissingReadiness]}
      />
    );

    expect(screen.getByText(/media coverage by listing/i)).toBeInTheDocument();
    expect(
      screen.getByText(/modular lounge has 2 active primary images/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/keep one active primary image before publication/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/modular lounge has 1 active image missing alt text/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/bare plinth has no active public image metadata/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/archived image metadata stays hidden from public catalogue and listing galleries/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });

  it("keeps Phase 3F inside public catalogue/admin readiness scope", () => {
    const productionSource = readTrackedProductionSources([
      "website/app/page.tsx",
      "website/app/listings",
      "website/app/categories",
      "website/app/catalogue",
      "website/app/events",
      "website/app/quote",
      "website/app/admin",
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
    expect(productionSource).not.toMatch(/notification|hubspot api|api\.hubapi|crm sync job|crm integration/i);
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
