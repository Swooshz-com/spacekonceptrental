import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CataloguePageContent
} from "../app/catalogue/page";
import { ProductPageContent } from "../app/catalogue/[slug]/page";
import EventsPage from "../app/events/page";
import QuoteRequestForm from "../components/QuoteRequestForm";
import {
  ListingManagementPanel,
  type ListingManagementCategory,
  type ListingManagementProduct
} from "../components/admin/listing-management-panel";
import { QuoteRequestInboxPanel } from "../components/admin/quote-request-inbox-panel";
import type { PublicCatalogueProduct } from "../lib/catalogue/types";

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string | { src: string } }) => (
    <img alt={alt} src={typeof src === "string" ? src : src.src} />
  )
}));

const repoRoot = resolve(process.cwd(), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const phase2qMergeCommit = "62c2b11b6b15192434eb4035ba0a66a44cd6f763";
const phase3aMergeCommit = "6e8bcf23bc8d7eef12b738613344764c0c1961e6";
const phase3bMergeCommit = "bfcf9916a0edd1b7133a1765719b9ddd73197dac";
const phase3cMergeCommit = "d031d7f47a6893f92d0b6739300d52147f6abfa4";
const forbiddenCommercePattern =
  /cart|checkout|payments?|customer account|stock reservation|order fulfilment|confirmed booking|online ordering/i;

const category: ListingManagementCategory = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "lounge",
  name: "Lounge",
  sortOrder: 20,
  isPublished: true,
  productCount: 1
};

const listing: ListingManagementProduct = {
  id: "22222222-2222-4222-8222-222222222222",
  categoryId: category.id,
  slug: "modular-lounge",
  name: "Modular Lounge",
  shortDescription: "Soft modular seating",
  description: "Existing full modular lounge listing description.",
  rentalUnit: "set",
  status: "published",
  sortOrder: 10,
  imageCount: 0
};

const catalogueProduct: PublicCatalogueProduct = {
  id: "product-published",
  slug: "modular-lounge-set",
  name: "Modular Lounge Set",
  shortDescription: "Soft seating for reception spaces.",
  description: "Published lounge set details.",
  rentalUnit: "set",
  sortOrder: 10,
  categoryId: category.id,
  categoryName: "Lounge",
  source: "fallback"
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

describe("Phase 3A-A/B product polish and rental UI copy", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("records Phase 3A-A/B as completed after Phase 3D starts", () => {
    const status = normalizeWhitespace(readRepoFile("docs/PHASE-STATUS.md"));
    const roadmap = normalizeWhitespace(readRepoFile("docs/PHASE-ROADMAP.md"));
    const readiness = readRepoFile("docs/PHASE-2-READINESS-PLAN.md");
    const decisionLog = readRepoFile("docs/DECISION-LOG.md");
    const checklist = readRepoFile("docs/checklists/PHASE-2-ADMIN-OPS.md");

    expect(status).toContain(
      "Current phase: Phase 3D-A/B - sitewide public journey, trust content, and route polish."
    );
    expect(status).toContain(
      "Latest completed capability: Phase 3C-A/B public catalogue discovery and quote funnel polish."
    );
    expect(status).toContain("Last merged capability PR: #125");
    expect(status).toContain(`Merge commit: \`${phase3cMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3C-A/B status");
    expect(status).toContain("Previous Current Phase 3B-A/B status");
    expect(status).toContain(`Merge commit: \`${phase3bMergeCommit}\``);
    expect(status).toContain("Previous Current Phase 3A-A/B status");
    expect(status).toContain(`Merge commit: \`${phase3aMergeCommit}\``);
    expect(status).toContain(`Merge commit: \`${phase2qMergeCommit}\``);
    expect(status).toContain("No deployment is performed or approved");
    expect(roadmap).toContain(
      "Phase 3A-A/B adds product-facing polish for the public rental catalogue, quote/enquiry flow, and protected admin usability"
    );
    expect(readiness).toContain("Current Phase 3D-A/B status");
    expect(readiness).toContain("Previous Current Phase 3C-A/B status");
    expect(readiness).toContain("Previous Current Phase 3B-A/B status");
    expect(readiness).toContain("Previous Current Phase 3A-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 3A-A/B adds product polish, content, and rental UI iteration."
    );
    expect(checklist).toContain(
      "## Phase 3A-A/B Product Polish Content And Rental UI Iteration"
    );
  });

  it("makes public catalogue cards more useful for quote-intent visitors", () => {
    render(
      <CataloguePageContent
        catalogue={{
          source: "fallback",
          categories: [category],
          products: [catalogueProduct]
        }}
      />
    );

    expect(
      screen.getByRole("heading", { name: /modular lounge set/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: /modular lounge set furniture rental setup/i
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/quote planning/i)).toBeInTheDocument();
    expect(screen.getByText(/rental unit: set/i)).toBeInTheDocument();
    expect(
      screen.getByText(/share event date, venue, quantities, and setup notes/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /request this listing/i })
    ).toHaveAttribute("href", "/quote?listing=modular-lounge-set");
  });

  it("gives empty public catalogue states a safe enquiry recovery path", () => {
    render(
      <CataloguePageContent
        catalogue={{
          source: "fallback",
          categories: [],
          products: []
        }}
      />
    );

    expect(screen.getByText(/send a general enquiry/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /send a general enquiry/i })
    ).toHaveAttribute("href", "/quote");
  });

  it("adds listing detail and events accessibility polish", () => {
    render(<ProductPageContent product={catalogueProduct} />);

    expect(screen.getByText(/quote planning/i)).toBeInTheDocument();
    expect(
      screen.getByText(/share timing, venue, preferred quantities, and delivery notes/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /request this listing/i })
    ).toHaveAttribute("href", "/quote?listing=modular-lounge-set");

    cleanup();
    render(<EventsPage />);

    expect(
      screen.getByRole("img", {
        name: /corporate receptions event furniture setup/i
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: /exhibitions event furniture setup/i
      })
    ).toBeInTheDocument();
  });

  it("improves public quote helper, validation, and receipt copy without public tracking", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          status: "received",
          quoteRequestId: "70000000-0000-4000-8000-000000000001",
          publicReference: "QR-20260607-ABC12345"
        }),
        {
          headers: { "content-type": "application/json" },
          status: 201
        }
      );
    });

    vi.stubGlobal("fetch", fetchMock);
    render(<QuoteRequestForm initialItemsText="Modular Lounge Set" />);

    expect(screen.getByText(/email or phone is required for follow-up/i)).toBeInTheDocument();
    expect(
      screen.getByText(/include event date, venue, listing interest, quantities, and setup notes/i)
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "Maya Tan" }
    });
    fireEvent.click(screen.getByRole("button", { name: /send quote request/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      screen.getByText(/please share an email or phone number so the team can follow up/i)
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "maya@example.test" }
    });
    fireEvent.change(screen.getByLabelText(/event notes for the team/i), {
      target: {
        value: "Reception lounge near the entrance."
      }
    });
    fireEvent.click(screen.getByRole("button", { name: /send quote request/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(
      await screen.findByText(/the team will review your event details and follow up directly/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /track|status/i })).not.toBeInTheDocument();
  });

  it("improves admin empty states and destructive-action clarity", () => {
    render(<ListingManagementPanel categories={[category]} products={[]} />);

    expect(
      screen.getByText(/create a draft listing above before adding media or publishing/i)
    ).toBeInTheDocument();

    cleanup();
    render(<ListingManagementPanel categories={[category]} products={[listing]} />);

    expect(
      screen.getByText(/archive hides this listing from public browsing and active admin work; it does not delete it/i)
    ).toBeInTheDocument();

    cleanup();
    render(
      <QuoteRequestInboxPanel
        inbox={{
          status: "loaded",
          data: {
            quoteRequests: []
          }
        }}
      />
    );

    expect(
      screen.getByText(/new website enquiries will appear here for internal follow-up/i)
    ).toBeInTheDocument();
  });

  it("keeps the polished surfaces free from forbidden runtime and commerce expansion", () => {
    const source = readTrackedProductionSources([
      "website/app/page.tsx",
      "website/app/listings",
      "website/app/categories",
      "website/app/catalogue",
      "website/app/events",
      "website/app/quote",
      "website/app/admin",
      "website/components"
    ]);

    expect(source).not.toMatch(forbiddenCommercePattern);
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(source).not.toContain("@pinecone-database");
    expect(source).not.toMatch(/PINECONE_API_KEY|PINECONE_ENV|PINECONE_INDEX/i);
    expect(source).not.toMatch(/notification|crm/i);
    expect(readTrackedFiles(["website/chat-config.js"])).toEqual([]);
    expect(readTrackedFiles(["vercel.json", "website/vercel.json", ".vercel"])).toEqual([]);
    expect(readTrackedFiles(["supabase/config.toml", "supabase/.branches"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/customer-uploads"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/public/uploads"])).toEqual([]);
    expect(readTrackedFiles(["website/app/api/quote-status"])).toEqual([]);
    expect(readTrackedFiles(["website/app/quote/status"])).toEqual([]);
  });
});
