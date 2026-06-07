import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CataloguePageContent
} from "../app/catalogue/page";
import { ProductPageContent } from "../app/catalogue/[slug]/page";
import { CategoriesPageContent } from "../app/categories/page";
import EventsPage, { metadata as eventsMetadata } from "../app/events/page";
import HomePage, { metadata as homeMetadata } from "../app/page";
import QuotePage, { metadata as quoteMetadata } from "../app/quote/page";
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
const phase3cMergeCommit = "d031d7f47a6893f92d0b6739300d52147f6abfa4";
const phase3dMergeCommit = "de357ee234ed1d92ab27eb1f6d571c0c4f0ccd04";
const forbiddenCommercePattern =
  /cart|checkout|payments?|purchase|customer account|stock reservation|order fulfilment|online ordering/i;

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

describe("Phase 3D-A/B sitewide public journey, trust content, and route polish", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("records Phase 3D-A/B as completed after Phase 3E starts", () => {
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
    expect(status).toContain("No deployment is performed or approved");
    expect(roadmap).toContain(
      "Phase 3D-A/B adds sitewide public journey, trust content, and route polish"
    );
    expect(readiness).toContain("Current Phase 3E-A/B status");
    expect(readiness).toContain("Previous Current Phase 3D-A/B status");
    expect(readiness).toContain("Previous Current Phase 3C-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 3D-A/B adds sitewide public journey, trust content, and route polish."
    );
    expect(checklist).toContain(
      "## Phase 3D-A/B Sitewide Public Journey Trust Content And Route Polish"
    );
  });

  it("gives the homepage clear public journey CTAs and expectation-setting", async () => {
    render(await HomePage());

    expect(
      screen.getByRole("heading", { name: /how rental enquiries work/i })
    ).toBeInTheDocument();
    for (const step of [
      /browse public listings/i,
      /share event details/i,
      /team reviews availability and fit/i,
      /final quote follows directly/i
    ]) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }
    expect(
      screen.getByRole("link", { name: /browse categories/i })
    ).toHaveAttribute("href", "/categories");
    expect(
      screen.getByRole("link", { name: /plan event setups/i })
    ).toHaveAttribute("href", "/events");
    expect(
      screen.getByRole("link", { name: /start a quote request/i })
    ).toHaveAttribute("href", "/quote");
    expect(homeMetadata.title).toMatch(/event furniture rental/i);
    expect(homeMetadata.description).toMatch(/browse listings/i);
  });

  it("adds event-use-case guidance without inventing proof claims", () => {
    render(<EventsPage />);

    expect(
      screen.getByRole("heading", { name: /plan an event setup/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/match the setup type/i)).toBeInTheDocument();
    expect(screen.getByText(/capture quantities and placement notes/i)).toBeInTheDocument();
    expect(screen.getByText(/send one quote enquiry/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /browse rental listings/i })
    ).toHaveAttribute("href", "/listings");
    expect(
      screen.getByRole("link", { name: /send setup notes/i })
    ).toHaveAttribute("href", "/quote");
    expect(eventsMetadata.title).toMatch(/event setups/i);
    expect(eventsMetadata.description).toMatch(/quote request/i);
    expect(screen.queryByText(/testimonial|award|certified|guaranteed/i)).not.toBeInTheDocument();
  });

  it("keeps public route empty states connected to safe recovery paths", () => {
    render(
      <CataloguePageContent
        catalogue={{ source: "fallback", categories: [], products: [] }}
      />
    );

    expect(
      screen.getByRole("link", { name: /browse categories/i })
    ).toHaveAttribute("href", "/categories");
    expect(
      screen.getByRole("link", { name: /send a general enquiry/i })
    ).toHaveAttribute("href", "/quote");

    cleanup();
    render(
      <CategoriesPageContent
        catalogue={{ source: "fallback", categories: [], products: [] }}
      />
    );

    expect(
      screen.getByRole("link", { name: /browse catalogue/i })
    ).toHaveAttribute("href", "/catalogue");
    expect(
      screen.getByRole("link", { name: /request a quote/i })
    ).toHaveAttribute("href", "/quote");
  });

  it("sets quote expectations and keeps success receipt-only", async () => {
    render(await QuotePage());

    expect(
      screen.getByRole("heading", { name: /what happens after you enquire/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/submission starts an enquiry/i)).toBeInTheDocument();
    expect(screen.getByText(/does not reserve furniture/i)).toBeInTheDocument();
    expect(screen.getByText(/team reviews availability/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /track|status/i })).not.toBeInTheDocument();
    expect(quoteMetadata.title).toMatch(/quote request/i);
    expect(quoteMetadata.description).toMatch(/event date/i);
  });

  it("keeps listing detail trust copy and route links consistent", () => {
    render(<ProductPageContent product={loungeProduct} />);

    expect(screen.getByText(/quote request checklist/i)).toBeInTheDocument();
    expect(screen.getByText(/event date/i)).toBeInTheDocument();
    expect(screen.getByText(/venue or event location/i)).toBeInTheDocument();
    expect(screen.getByText(/quantities and alternates/i)).toBeInTheDocument();
    expect(screen.getByText(/setup notes/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /browse categories/i })
    ).toHaveAttribute("href", "/categories");
    expect(
      screen.getByRole("link", { name: /request this listing/i })
    ).toHaveAttribute("href", "/quote?listing=modular-lounge-set");
  });

  it("keeps Phase 3D inside repo-local public journey scope", () => {
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
    expect(productionSource).not.toMatch(/testimonial|client logo|certification|award/i);
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
