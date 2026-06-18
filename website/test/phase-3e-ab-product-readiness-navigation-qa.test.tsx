import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AdminShellContent,
  type ProtectedAdminShellState
} from "../app/admin/protected-admin-shell";
import {
  CataloguePageContent
} from "../app/catalogue/page";
import { ProductPageContent } from "../app/catalogue/[slug]/page";
import CatalogueListingNotFound from "../app/catalogue/[slug]/not-found";
import { CategoriesPageContent } from "../app/categories/page";
import EventsPage from "../app/events/page";
import ListingNotFound from "../app/listings/[slug]/not-found";
import HomePage from "../app/page";
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
const phase3dMergeCommit = "de357ee234ed1d92ab27eb1f6d571c0c4f0ccd04";
const phase3fMergeCommit = "69665bb241b1af5c05ad34ac1464cdaeece8b7f8";
const phase3gMergeCommit = "75fd104966e3e8c69a434f2325f6f79e4742a40f";
const phase3hMergeCommit = "09f92ede4b5d9f725d0df560838a12fef27940b9";
const phase3iMergeCommit = "0d2d40898c4e716032fdec130704117494c542d6";
const phase3jMergeCommit = "1c7dc0ac7c2532fa8a837cd46b0d1f0103d5ccfa";
const forbiddenCommercePattern =
  /cart|checkout|payments?|purchase|customer account|stock reservation|order fulfilment|online ordering|(?<![.\w])(?<!sort[- ])\border(?:s)?\b(?!\s*[:(])/i;
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

const emptyCatalogue: PublicCatalogue = {
  source: "fallback",
  categories: [],
  products: []
};

const adminState: Extract<ProtectedAdminShellState, { status: "authorised_admin" }> = {
  status: "authorised_admin",
  dashboard: {
    status: "loaded",
    data: {
      categories: [
        {
          id: loungeCategory.id,
          slug: loungeCategory.slug,
          name: loungeCategory.name,
          description: loungeCategory.description,
          sortOrder: 10,
          isPublished: true,
          productCount: 1,
          publishedProductCount: 1
        }
      ],
      products: [
        {
          id: loungeProduct.id,
          categoryId: loungeCategory.id,
          slug: loungeProduct.slug,
          name: loungeProduct.name,
          shortDescription: loungeProduct.shortDescription,
          description: loungeProduct.description,
          rentalUnit: loungeProduct.rentalUnit,
          status: "published",
          sortOrder: 10,
          imageCount: 1,
          primaryImageAltText: "Modular lounge setup"
        }
      ],
      images: [
        {
          id: "image-lounge",
          productId: loungeProduct.id,
          storageBucket: "catalogue-metadata",
          storagePath: "fixtures/lounge-main.jpg",
          altText: "Modular lounge setup",
          sortOrder: 1,
          isPrimary: true,
          status: "active"
        }
      ],
      imageSummary: {
        totalImages: 1,
        activeImages: 1,
        primaryImages: 1
      }
    }
  },
  quoteInbox: {
    status: "loaded",
    data: {
      quoteRequests: [
        {
          id: "quote-1",
          publicReference: "QR-20260607-READY",
          customerName: "Maya Tan",
          status: "new",
          source: "website",
          createdAt: "2026-06-07T10:30:00.000Z",
          items: [],
          activity: []
        }
      ]
    }
  },
  quoteDetail: {
    status: "not_found"
  }
};

const internalRouteAllowlist = [
  /^\/$/,
  /^\/catalogue$/,
  /^\/catalogue\/[a-z0-9-]+$/,
  /^\/listings$/,
  /^\/listings\/[a-z0-9-]+$/,
  /^\/listings\?category=[a-z0-9-]+$/,
  /^\/listings\?event=[a-z0-9-]+$/,
  /^\/listings\?search=[a-z0-9-]+$/,
  /^\/listings\?category=[a-z0-9-]+&event=[a-z0-9-]+$/,
  /^\/listings\?event=[a-z0-9-]+&search=[a-z0-9-+]+$/,
  /^\/categories$/,
  /^\/events$/,
  /^\/quote$/,
  /^\/quote\?listing=[a-z0-9-]+$/,
  /^\/quote\?(?:category|event|search)=[a-z0-9-+]+(?:&(?:category|event|search)=[a-z0-9-+]+)*$/,
  /^\/admin$/,
  /^\/admin\/login$/,
  /^\/admin\/listings$/,
  /^\/admin\/categories$/,
  /^\/admin\/media$/,
  /^\/admin\/content-readiness$/,
  /^\/admin\/public-parity$/,
  /^\/admin\/release-control$/,
  /^\/admin\/quotes$/,
  /^\/admin\/quotes\/[A-Za-z0-9-]+$/
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

function collectInternalHrefs(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLAnchorElement>("a[href]"))
    .map((link) => link.getAttribute("href"))
    .filter((href): href is string => Boolean(href?.startsWith("/")));
}

function expectAllowedInternalRoutes(hrefs: string[]) {
  for (const href of hrefs) {
    expect(
      internalRouteAllowlist.some((pattern) => pattern.test(href)),
      `Unexpected internal route: ${href}`
    ).toBe(true);
  }
}

describe("Phase 3E-A/B product readiness, navigation QA, and dead-end polish", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("records Phase 3E-A/B as completed after Phase 3J starts", () => {
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
    expect(status).toContain("Previous Current Phase 3D-A/B status");
    expect(status).toContain(`Merge commit: \`${phase3dMergeCommit}\``);
    expect(status).toContain("No deployment is performed or approved");
    expect(roadmap).toContain(
      "Phase 3E-A/B adds product readiness, navigation QA, and public/admin dead-end polish"
    );
    expect(readiness).toContain("Current Phase 3K-A/B status");
    expect(readiness).toContain("Previous Current Phase 3J-A/B status");
    expect(readiness).toContain("Previous Current Phase 3I-A/B status");
    expect(readiness).toContain("Previous Current Phase 3H-A/B status");
    expect(readiness).toContain("Previous Current Phase 3G-A/B status");
    expect(readiness).toContain("Previous Current Phase 3F-A/B status");
    expect(readiness).toContain("Previous Current Phase 3E-A/B status");
    expect(readiness).toContain("Previous Current Phase 3D-A/B status");
    expect(decisionLog).toContain(
      "Decision: Phase 3E-A/B adds product readiness, navigation QA, and public/admin dead-end polish."
    );
    expect(checklist).toContain(
      "## Phase 3E-A/B Product Readiness Navigation QA And Public Admin Dead-End Polish"
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

  it("keeps key public route links internal, allowlisted, and away from admin surfaces", async () => {
    const hrefs: string[] = [];

    for (const element of [
      await HomePage(),
      <CataloguePageContent catalogue={catalogue} />,
      <CataloguePageContent catalogue={emptyCatalogue} />,
      <CategoriesPageContent catalogue={catalogue} />,
      <CategoriesPageContent catalogue={emptyCatalogue} />,
      <ProductPageContent product={loungeProduct} />,
      <CatalogueListingNotFound />,
      <ListingNotFound />,
      <EventsPage />,
      await QuotePage()
    ]) {
      const { container, unmount } = render(element);
      hrefs.push(...collectInternalHrefs(container));
      unmount();
    }

    expectAllowedInternalRoutes(hrefs);
    expect(hrefs.some((href) => href.startsWith("/admin"))).toBe(false);
    for (const requiredRoute of [
      "/catalogue",
      "/catalogue/modular-lounge-set",
      "/listings",
      "/listings/modular-lounge-set",
      "/categories",
      "/events",
      "/quote",
      "/quote?listing=modular-lounge-set"
    ]) {
      expect(hrefs).toContain(requiredRoute);
    }
  });

  it("keeps protected admin route links internal, allowlisted, and away from public quote/catalogue paths", () => {
    const hrefs: string[] = [];

    for (const view of [
      { kind: "home" as const },
      { kind: "listings" as const },
      { kind: "categories" as const },
      { kind: "media" as const },
      { kind: "quotes" as const },
      { kind: "content-readiness" as const },
      {
        kind: "quote-detail" as const,
        quoteRequestId: "quote-1"
      }
    ]) {
      const { container, unmount } = render(
        <AdminShellContent state={adminState} view={view} />
      );
      hrefs.push(...collectInternalHrefs(container));
      unmount();
    }

    expectAllowedInternalRoutes(hrefs);
    expect(hrefs.some((href) => /^\/(?:catalogue|categories|events|quote)\b/.test(href))).toBe(false);
    for (const requiredRoute of [
      "/admin",
      "/admin/listings",
      "/admin/categories",
      "/admin/media",
      "/admin/content-readiness",
      "/admin/public-parity",
      "/admin/quotes",
      "/admin/quotes/quote-1",
      "/listings/modular-lounge-set"
    ]) {
      expect(hrefs).toContain(requiredRoute);
    }
  });

  it("adds semantic public recovery states for empty, filtered, missing, and quote-start routes", async () => {
    render(<CataloguePageContent catalogue={emptyCatalogue} />);

    expect(
      screen.getByRole("heading", { name: /no matching public listings/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /browse categories/i })
    ).toHaveAttribute("href", "/categories");
    expect(
      screen.getByRole("link", { name: /send an enquiry/i })
    ).toHaveAttribute("href", "/quote");

    cleanup();
    render(
      <CataloguePageContent
        activeCategoryName="Lounge"
        activeCategorySlug="lounge"
        catalogue={{ ...catalogue, products: [] }}
      />
    );

    expect(screen.getByText(/spans more than lounge/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /browse listings/i })
    ).toHaveAttribute("href", "/listings");

    cleanup();
    render(<ListingNotFound />);
    expect(
      screen.getByRole("link", { name: /browse categories/i })
    ).toHaveAttribute("href", "/categories");

    cleanup();
    render(await QuotePage());
    expect(
      screen.getByRole("navigation", { name: /quote request recovery/i })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /browse listings/i })[0]
    ).toHaveAttribute("href", "/listings");
    expect(
      screen.getByRole("link", { name: /plan event setups/i })
    ).toHaveAttribute("href", "/events");
  });

  it("adds admin-safe recovery links for blocked, unavailable, empty, and missing admin states", () => {
    render(
      <AdminShellContent
        state={{ status: "authenticated_not_authorised" }}
        view={{ kind: "listings" }}
      />
    );

    expect(
      screen.getByRole("link", { name: /return to admin sign in/i })
    ).toHaveAttribute("href", "/admin/login");
    expect(screen.queryByRole("link", { name: /browse listings|request a quote/i })).not.toBeInTheDocument();

    cleanup();
    render(
      <AdminShellContent
        state={{
          status: "authorised_admin",
          dashboard: { status: "unavailable" },
          quoteInbox: { status: "unavailable" },
          quoteDetail: { status: "not_found" }
        }}
        view={{ kind: "quote-detail", quoteRequestId: "missing-quote" }}
      />
    );

    expect(
      screen.getByRole("link", { name: /back to quote requests/i })
    ).toHaveAttribute("href", "/admin/quotes");

    cleanup();
    render(
      <AdminShellContent
        state={{
          status: "authorised_admin",
          dashboard: { status: "unavailable" },
          quoteInbox: { status: "unavailable" }
        }}
        view={{ kind: "listings" }}
      />
    );

    expect(
      screen.getByRole("navigation", { name: /admin recovery/i })
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("navigation", { name: /admin recovery/i })).getByRole("link", {
        name: /open quote requests/i
      })
    ).toHaveAttribute("href", "/admin/quotes");

    cleanup();
    render(
      <AdminShellContent
        state={{
          ...adminState,
          quoteInbox: {
            status: "loaded",
            data: {
              quoteRequests: []
            }
          }
        }}
        view={{ kind: "quotes" }}
      />
    );

    expect(
      screen.getByRole("link", { name: /review listings/i })
    ).toHaveAttribute("href", "/admin/listings");
  });

  it("keeps production readiness surfaces aligned to rental wording and forbidden proof scope", () => {
    const productionSource = readTrackedProductionSources([
      "website/app/page.tsx",
      "website/app/listings",
      "website/app/categories",
      "website/app/catalogue",
      "website/app/events",
      "website/app/quote",
      "website/app/admin",
      "website/components",
      "website/lib/catalogue",
      "website/lib/quote"
    ]);
    const packageSource = [
      readRepoFile("package.json"),
      readRepoFile("website/package.json")
    ].join("\n");

    expect(productionSource).toMatch(/listings?/i);
    expect(productionSource).toMatch(/(?:enquiry|quote request|rental request|requested items?)/i);
    expect(productionSource).not.toMatch(forbiddenCommercePattern);
    expect(productionSource).not.toMatch(forbiddenProofClaimPattern);
    expect(productionSource).not.toMatch(literalContactPattern);
    expect(productionSource).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(productionSource).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(productionSource).not.toMatch(/service-role/i);
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
