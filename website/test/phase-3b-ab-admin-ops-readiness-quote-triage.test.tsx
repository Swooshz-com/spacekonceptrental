import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  CategoryManagementPanel,
  type CategoryManagementCategory
} from "../components/admin/category-management-panel";
import {
  ListingImageMetadataManagementPanel,
  type ListingImageMetadataImage,
  type ListingImageMetadataProduct
} from "../components/admin/listing-image-metadata-management-panel";
import {
  ListingImageUploadPanel,
  type ListingImageUploadProduct
} from "../components/admin/listing-image-upload-panel";
import {
  ListingManagementPanel,
  type ListingManagementCategory,
  type ListingManagementProduct
} from "../components/admin/listing-management-panel";
import { QuoteRequestInboxPanel } from "../components/admin/quote-request-inbox-panel";

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const phase3aMergeCommit = "6e8bcf23bc8d7eef12b738613344764c0c1961e6";
const phase3bMergeCommit = "bfcf9916a0edd1b7133a1765719b9ddd73197dac";
const phase3cMergeCommit = "d031d7f47a6893f92d0b6739300d52147f6abfa4";
const phase3dMergeCommit = "de357ee234ed1d92ab27eb1f6d571c0c4f0ccd04";
const forbiddenCommercePattern =
  /cart|checkout|payments?|purchase|customer account|stock reservation|order fulfilment|confirmed booking|online ordering/i;

const category: ListingManagementCategory & CategoryManagementCategory = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "lounge",
  name: "Lounge",
  description: "Soft seating for reception spaces.",
  sortOrder: 20,
  isPublished: true,
  productCount: 1
};

const emptyCategory: CategoryManagementCategory = {
  id: "33333333-3333-4333-8333-333333333333",
  slug: "lighting",
  name: "Lighting",
  sortOrder: 40,
  isPublished: false,
  productCount: 0
};

const readyListing: ListingManagementProduct = {
  id: "22222222-2222-4222-8222-222222222222",
  categoryId: category.id,
  slug: "modular-lounge",
  name: "Modular Lounge",
  shortDescription: "Soft modular seating",
  description: "Existing full modular lounge listing description.",
  rentalUnit: "set",
  status: "published",
  sortOrder: 10,
  imageCount: 2,
  primaryImageAltText: "Modular lounge seating setup"
};

const incompleteListing: ListingManagementProduct = {
  id: "44444444-4444-4444-8444-444444444444",
  slug: "bare-plinth",
  name: "Bare Plinth",
  rentalUnit: "",
  status: "published",
  sortOrder: 30,
  imageCount: 0
};

const archivedPrimaryResolvedListing: ListingManagementProduct = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  categoryId: category.id,
  slug: "archived-primary-lounge",
  name: "Archived Primary Lounge",
  shortDescription: "Published listing with archived primary metadata",
  description: "Existing listing text with only archived primary image metadata.",
  rentalUnit: "set",
  status: "published",
  sortOrder: 20,
  imageCount: 1
};

const imageProduct: ListingImageMetadataProduct & ListingImageUploadProduct = {
  ...readyListing
};

const primaryImage: ListingImageMetadataImage = {
  id: "55555555-5555-4555-8555-555555555555",
  productId: readyListing.id,
  storageBucket: "catalogue-metadata",
  storagePath: "fixtures/lounge-main.jpg",
  altText: "Modular lounge seating setup",
  sortOrder: 1,
  isPrimary: true,
  status: "active"
};

const archivedPrimaryImageWithAlt: ListingImageMetadataImage = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  productId: readyListing.id,
  storageBucket: "catalogue-metadata",
  storagePath: "fixtures/lounge-archived-primary.jpg",
  altText: "Archived lounge hero",
  sortOrder: 2,
  isPrimary: true,
  status: "archived"
};

const archivedImageMissingAlt: ListingImageMetadataImage = {
  id: "66666666-6666-4666-8666-666666666666",
  productId: readyListing.id,
  storageBucket: "catalogue-metadata",
  storagePath: "fixtures/lounge-archived.jpg",
  sortOrder: 3,
  isPrimary: false,
  status: "archived"
};

const quoteRequestMissingTriageData = {
  id: "77777777-7777-4777-8777-777777777777",
  publicReference: "QR-20260607-MISSING",
  customerName: "Maya Tan",
  status: "new" as const,
  source: "website" as const,
  createdAt: "2026-06-07T10:30:00.000Z",
  items: [],
  activity: []
};

const quoteRequestReadyForFollowUp = {
  id: "88888888-8888-4888-8888-888888888888",
  publicReference: "QR-20260607-READY",
  customerName: "Darren Lee",
  customerEmail: "darren@example.test",
  customerMessage: "Need a warm lounge setup for a reception.",
  eventDate: "2026-06-20",
  venue: "Suntec Singapore",
  status: "reviewing" as const,
  source: "website" as const,
  createdAt: "2026-06-07T11:30:00.000Z",
  items: [
    {
      id: "99999999-9999-4999-8999-999999999999",
      quoteRequestId: "88888888-8888-4888-8888-888888888888",
      productNameSnapshot: "Modular lounge set",
      quantity: 2,
      createdAt: "2026-06-07T11:31:00.000Z"
    }
  ],
  activity: [
    {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      quoteRequestId: "88888888-8888-4888-8888-888888888888",
      activityType: "internal_note" as const,
      note: "Review requested quantities before follow-up.",
      createdAt: "2026-06-07T11:45:00.000Z"
    }
  ]
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

describe("Phase 3B-A/B admin operations readiness and quote triage polish", () => {
  afterEach(() => {
    cleanup();
  });

  it("records Phase 3B-A/B as completed after Phase 3E starts", () => {
    const status = normalizeWhitespace(readRepoFile("docs/PHASE-STATUS.md"));
    const roadmap = normalizeWhitespace(readRepoFile("docs/PHASE-ROADMAP.md"));
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const checklist = readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md");

    expect(status).toContain(
      "Current phase: Phase 3E-A/B - product readiness, navigation QA, and dead-end polish."
    );
    expect(status).toContain(
      "Latest completed capability: Phase 3D-A/B sitewide public journey, trust content, and route polish."
    );
    expect(status).toContain("Last merged capability PR: #126");
    expect(status).toContain(`Merge commit: \`${phase3dMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3D-A/B status");
    expect(status).toContain("Previous Current Phase 3C-A/B status");
    expect(status).toContain(`Merge commit: \`${phase3bMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3B-A/B status");
    expect(status).toContain(`Merge commit: \`${phase3aMergeCommit}\``);
    expect(status).toContain("No deployment is performed or approved");
    expect(roadmap).toContain(
      "Phase 3B-A/B adds admin operations readiness and quote triage polish"
    );
    expect(readiness).toContain("Current Phase 3E-A/B status");
    expect(readiness).toContain("Previous Current Phase 3D-A/B status");
    expect(readiness).toContain("Previous Current Phase 3C-A/B status");
    expect(readiness).toContain("Previous Current Phase 3B-A/B status");
    expect(readiness).toContain("Previous Current Phase 3A-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 3B-A/B adds admin operations readiness and quote triage polish."
    );
    expect(checklist).toContain(
      "## Phase 3B-A/B Admin Operations Readiness And Quote Triage Polish"
    );
  });

  it("shows listing publication readiness from existing admin listing data", () => {
    render(
      <ListingManagementPanel
        categories={[category]}
        products={[readyListing, archivedPrimaryResolvedListing, incompleteListing]}
      />
    );

    expect(screen.getByText(/publication readiness/i)).toBeInTheDocument();
    expect(screen.getByText(/1 ready for public browsing/i)).toBeInTheDocument();
    expect(screen.getByText(/2 needing attention/i)).toBeInTheDocument();
    expect(screen.getAllByText(/ready for public browsing/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/needs attention before publishing/i).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/category assigned/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/primary public image available/i)).toBeInTheDocument();
    expect(
      within(
        screen.getByLabelText(/publication readiness archived primary lounge/i)
      ).queryByText(/primary public image available/i)
    ).not.toBeInTheDocument();
    expect(
      within(
        screen.getByLabelText(/publication readiness archived primary lounge/i)
      ).getByText(/missing primary public image/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/missing category assignment/i)).toBeInTheDocument();
    expect(screen.getByText(/add image metadata before publishing/i)).toBeInTheDocument();
    expect(screen.getAllByText(/missing primary public image/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/missing rental unit/i)).toBeInTheDocument();
  });

  it("shows category and media readiness guidance without destructive flows", () => {
    render(<CategoryManagementPanel categories={[category, emptyCategory]} />);

    expect(screen.getByText(/category readiness/i)).toBeInTheDocument();
    expect(screen.getByText(/published grouping with 1 listing/i)).toBeInTheDocument();
    expect(
      screen.getByText(/add listings before this category helps public browsing/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/not published for public browsing/i)).toBeInTheDocument();

    cleanup();
    render(
      <ListingImageUploadPanel products={[imageProduct]} />
    );

    expect(
      screen.getByText(/use approved listing images only/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/primary uploaded images can lead the public catalogue display/i)
    ).toBeInTheDocument();

    cleanup();
    render(
      <ListingImageMetadataManagementPanel
        images={[primaryImage, archivedPrimaryImageWithAlt, archivedImageMissingAlt]}
        products={[imageProduct]}
      />
    );

    expect(screen.getByText(/media readiness/i)).toBeInTheDocument();
    expect(
      screen.getByText(/primary active image can lead the public catalogue display/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/missing alt text for public accessibility/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/primary selection is inactive while archived/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/archived image is hidden from active listing media/i)
        .length
    ).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });

  it("adds admin-only quote triage cues from existing quote data", () => {
    render(
      <QuoteRequestInboxPanel
        inbox={{
          status: "loaded",
          data: {
            quoteRequests: [
              quoteRequestMissingTriageData,
              quoteRequestReadyForFollowUp
            ]
          }
        }}
      />
    );

    expect(screen.getByText(/quote triage summary/i)).toBeInTheDocument();
    expect(screen.getByText(/new requests/i)).toBeInTheDocument();
    expect(screen.getByText(/in review/i)).toBeInTheDocument();
    expect(screen.getByText(/quoted\/contacted/i)).toBeInTheDocument();
    expect(screen.getByText(/closed requests/i)).toBeInTheDocument();
    expect(screen.getAllByText(/triage cues/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/missing contact method/i)).toBeInTheDocument();
    expect(screen.getByText(/missing event date/i)).toBeInTheDocument();
    expect(screen.getByText(/missing venue/i)).toBeInTheDocument();
    expect(screen.getByText(/no requested items captured/i)).toBeInTheDocument();
    expect(screen.getAllByText(/no customer message/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/no internal activity yet/i)).toBeInTheDocument();
    expect(screen.getByText(/1 requested item/i)).toBeInTheDocument();
    expect(screen.getByText(/customer message captured/i)).toBeInTheDocument();
    expect(screen.getByText(/internal activity recorded/i)).toBeInTheDocument();
    expect(
      screen.getByText(/internal triage cues stay inside this admin workspace/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /track|status/i })).not.toBeInTheDocument();
  });

  it("keeps Phase 3B inside repo-local admin and product scope", () => {
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
      "website/lib"
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
