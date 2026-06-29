import { cleanup, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PublicCatalogue, PublicCatalogueProduct } from "../lib/catalogue/types";
import AboutPage from "./about/page";
import {
  CataloguePageContent,
  default as CataloguePage,
  metadata as catalogueMetadata
} from "./catalogue/page";
import {
  generateMetadata as generateCatalogueListingMetadata,
  ProductPageContent
} from "./catalogue/[slug]/page";
import CatalogueListingNotFound from "./catalogue/[slug]/not-found";
import ContactPage from "./contact/page";
import EventsPage from "./events/page";
import ListingNotFound from "./listings/[slug]/not-found";
import { generateMetadata as generatePublicListingMetadata } from "./listings/[slug]/page";
import { metadata as rootMetadata } from "./layout";
import HomePage, { metadata as homeMetadata } from "./page";
import PrivacyPage, { metadata as privacyMetadata } from "./privacy/page";
import QuotePage, { metadata as quoteMetadata } from "./quote/page";
import TermsPage, { metadata as termsMetadata } from "./terms/page";
import {
  StitchCategoryPreview,
  StitchFeaturedPieces,
  StitchSetupsPage
} from "../components/PublicStitch";

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string | { src: string } }) => (
    <img alt={alt} src={typeof src === "string" ? src : src.src} />
  )
}));

const forbiddenPublicCopy =
  /cart|checkout|payment|purchase|customer account|customer dashboard|booking|reservation|stock reservation|order fulfilment|online ordering/i;

const modularLounge: PublicCatalogueProduct = {
  id: "product-published",
  slug: "modular-lounge-set",
  name: "Modular Lounge Set",
  shortDescription: "Published lounge set.",
  description: "Published details for a lounge set.",
  rentalUnit: "set",
  sortOrder: 10,
  categoryId: "category-published",
  categoryName: "Lounge Seating",
  primaryImage: {
    id: "image-published",
    storageBucket: "sample-catalogue-public",
    storagePath: "sample-fixtures/modular-lounge-set-main.jpg",
    altText: "Sample image metadata.",
    sortOrder: 10,
    isPrimary: true
  },
  source: "supabase"
};

const catalogueWithProduct: PublicCatalogue = {
  source: "supabase",
  categories: [
    {
      id: "category-published",
      slug: "lounge-seating",
      name: "Lounge Seating",
      description: "Published seating.",
      sortOrder: 10
    }
  ],
  products: [modularLounge]
};

function hrefsFor(name: RegExp) {
  return screen.getAllByRole("link", { name }).map((link) => link.getAttribute("href"));
}

describe("public page shells", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders honest catalogue recovery when Supabase data is unavailable", async () => {
    render(await CataloguePage());

    expect(document.body.textContent).toMatch(/catalogue/i);
    expect(document.body.textContent).toMatch(/no public rental listings are available right now/i);
    expect(screen.queryByRole("heading", { name: /lounge sofa package/i })).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(forbiddenPublicCopy);
  });

  it("renders a Stitch-style rental homepage with quote, catalogue, and setup CTAs", async () => {
    render(await HomePage());

    expect(
      screen.getByRole("heading", { name: /furnish your vision, elevate every space/i })
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByText(/browse rental pieces, explore setup directions, and send an enquiry/i)
    ).toBeInTheDocument();
    expect(hrefsFor(/request quote/i)).toContain("/quote");
    expect(hrefsFor(/browse catalogue/i)).toContain("/catalogue");
    expect(hrefsFor(/explore setups/i)).toContain("/listings");
    expect(screen.getByRole("heading", { name: /the spacekonceptrental advantage/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /browse by category/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /featured pieces/i })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(forbiddenPublicCopy);
  });

  it("uses the same catalogue CTA treatment for category and featured homepage sections", async () => {
    render(
      <>
        <StitchCategoryPreview catalogue={catalogueWithProduct} />
        <StitchFeaturedPieces catalogue={catalogueWithProduct} />
      </>
    );

    const categorySection = document.querySelector(".stitch-home-categories");
    const featuredSection = document.querySelector(".stitch-home-featured");
    const categoryHeading = categorySection?.querySelector(".stitch-section-heading");
    const categoryAction = categorySection?.querySelector(".stitch-home-section-action");
    const featuredAction = featuredSection?.querySelector(".stitch-home-section-action");
    const viewFullCatalogueLinks = screen.getAllByRole("link", {
      name: /view full catalogue/i
    });

    expect(categorySection).not.toBeNull();
    expect(featuredSection).not.toBeNull();
    expect(categoryHeading?.querySelector("a")).toBeNull();
    expect(categoryAction?.querySelector("a")?.getAttribute("href")).toBe("/catalogue");
    expect(featuredAction?.querySelector("a")?.getAttribute("href")).toBe("/catalogue");
    expect(viewFullCatalogueLinks).toHaveLength(2);
    expect(viewFullCatalogueLinks.every((link) => link.closest(".stitch-home-section-action"))).toBe(true);
  });

  it("renders public events guidance without shell or MVP wording", () => {
    render(<EventsPage />);

    expect(document.body.textContent).toMatch(/event/i);
    expect(document.body.textContent).toMatch(/rental|setup/i);
    expect(document.body.textContent).not.toMatch(/shell|mvp/i);
    expect(document.body.textContent).not.toMatch(forbiddenPublicCopy);
  });

  it("keeps public quote copy request-only and preserves the real form entry point", async () => {
    const { container } = render(await QuotePage());

    expect(screen.getByRole("heading", { name: /request a rental quote/i })).toBeInTheDocument();
    expect(container.querySelector(".stitch-quote-hero .stitch-page-intro h1")).toHaveTextContent(
      /request a rental quote/i
    );
    expect(container.querySelector(".stitch-quote-intro")).toBeNull();
    expect(screen.getAllByText(/this request does not confirm final rental details/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/requested listings or items/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /review and send an enquiry/i })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/confirmed order|online ordering|checkout|payment/i);
    expect(JSON.stringify(rootMetadata)).toMatch(/SpaceKonceptRental/);
    expect(JSON.stringify(rootMetadata)).not.toMatch(/Space Koncept Rentals|shell|mvp|checkout|payment|online ordering/i);
  });

  it("renders practical public Privacy Policy and Terms of Use pages", () => {
    const layoutSource = readFileSync(resolve(process.cwd(), "app/layout.tsx"), "utf8");

    expect(layoutSource).toContain('href="/privacy"');
    expect(layoutSource).toContain('href="/terms"');
    expect(privacyMetadata.title).toMatch(/Privacy Policy/i);
    expect(termsMetadata.title).toMatch(/Terms of Use/i);

    render(<PrivacyPage />);

    expect(screen.getByRole("heading", { name: /Privacy Policy/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: /What you share/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: /What you share/i })).toBeInTheDocument();
    expect(screen.getByText(/manual follow-up/i)).toBeInTheDocument();
    expect(screen.getByText(/configured chat provider/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Terms of Use/i })).toHaveAttribute("href", "/terms");
    expect(document.body.textContent).not.toMatch(forbiddenPublicCopy);

    cleanup();
    render(<TermsPage />);

    expect(screen.getByRole("heading", { name: /Terms of Use/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: /Browsing listings/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: /Browsing listings/i })).toBeInTheDocument();
    expect(screen.getByText(/manual follow-up/i)).toBeInTheDocument();
    expect(screen.getByText(/does not finalise rental details online/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Privacy Policy/i })).toHaveAttribute("href", "/privacy");
    expect(document.body.textContent).not.toMatch(forbiddenPublicCopy);
  });

  it("defines truthful public metadata for catalogue browsing and quote enquiries", async () => {
    const listingMetadata = await generateCatalogueListingMetadata({
      params: Promise.resolve({ slug: "lounge-sofa-package" })
    });
    const fallbackListingMetadata = await generateCatalogueListingMetadata({
      params: Promise.resolve({ slug: "missing-listing" })
    });
    const publicListingMetadata = await generatePublicListingMetadata({
      params: Promise.resolve({ slug: "lounge-sofa-package" })
    });
    const metadataPayload = JSON.stringify({
      homeMetadata,
      catalogueMetadata,
      listingMetadata,
      fallbackListingMetadata,
      publicListingMetadata,
      quoteMetadata
    });

    expect(metadataPayload).toMatch(/SpaceKonceptRental/);
    expect(catalogueMetadata.openGraph?.url).toBe("/catalogue");
    expect(listingMetadata.openGraph?.title).toMatch(/furniture listing/i);
    expect(fallbackListingMetadata.openGraph?.description).toMatch(/event furniture rental/i);
    expect(publicListingMetadata.openGraph?.title).toMatch(/rental listing/i);
    expect(quoteMetadata.openGraph?.description).toMatch(/manual follow-up/i);
    expect(metadataPayload).not.toMatch(
      /Space Koncept Rentals|Curated Sanctuary|cart|checkout|payment|purchase|customer account|customer dashboard|booking|reservation|stock reservation|order fulfilment|online ordering|readiness|governance|phase/i
    );
  });

  it("keeps the public catalogue reachable and wires item cards to details and quote intake", () => {
    render(<CataloguePageContent catalogue={catalogueWithProduct} />);

    expect(screen.getByRole("heading", { name: /modular lounge set/i })).toBeInTheDocument();
    expect(screen.getByText(/published lounge set/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /increase modular lounge set quantity/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/modular lounge set quantity selected/i)).toHaveTextContent("Qty 0");
    expect(screen.getByRole("link", { name: /view details for modular lounge set/i })).toHaveAttribute(
      "href",
      "/catalogue/modular-lounge-set"
    );
    expect(document.body.textContent).not.toMatch(forbiddenPublicCopy);
  });

  it("keeps catalogue category and style all filters independent", () => {
    render(
      <CataloguePageContent
        activeCategorySlug="lounge-seating"
        activeStyleSlug="brutalist"
        catalogue={catalogueWithProduct}
      />
    );

    const allCategoriesLink = screen.getByRole("link", { name: /all categories/i });
    const allStylesLink = screen.getByRole("link", { name: /all styles/i });

    expect(allCategoriesLink).toHaveAttribute("href", "/catalogue?style=brutalist");
    expect(allCategoriesLink).not.toHaveClass("is-active");
    expect(allStylesLink).toHaveAttribute("href", "/catalogue?category=lounge-seating");
    expect(allStylesLink).not.toHaveClass("is-active");
    expect(screen.getByRole("link", { name: /lounge seating/i })).toHaveClass("is-active");
    expect(screen.getByRole("link", { name: /brutalist/i })).toHaveClass("is-active");
  });

  it("keeps setup pills as grouped filters and includes the featured editorial in the setup listings", () => {
    const previousDemoContentFlag = process.env.NEXT_PUBLIC_SKR_DEMO_CONTENT;
    const publicStitchSource = readFileSync(resolve(process.cwd(), "components/PublicStitch.tsx"), "utf8");
    process.env.NEXT_PUBLIC_SKR_DEMO_CONTENT = "true";

    try {
      render(<StitchSetupsPage catalogue={{ source: "fallback", categories: [], products: [] }} />);

      expect(screen.getByRole("link", { name: /all setups/i })).toHaveAttribute("href", "/listings");
      expect(screen.queryByRole("link", { name: /featured editorial/i })).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: /weddings/i })).toHaveAttribute(
        "href",
        "/listings?setup=weddings"
      );
      expect(screen.getByRole("link", { name: /corporate summits/i })).toHaveAttribute(
        "href",
        "/listings?setup=corporate-summits"
      );
      expect(publicStitchSource).toContain('href={item.href} key={item.href} scroll={false}');
      expect(screen.getAllByText("The Metropolitan Gala").length).toBeGreaterThan(1);
      expect(screen.getAllByRole("link", { name: /view setup details/i }).length).toBeGreaterThan(1);
    } finally {
      if (previousDemoContentFlag === undefined) {
        delete process.env.NEXT_PUBLIC_SKR_DEMO_CONTENT;
      } else {
        process.env.NEXT_PUBLIC_SKR_DEMO_CONTENT = previousDemoContentFlag;
      }
    }
  });

  it("filters setup listings from the pill query without turning pills into detail links", () => {
    const previousDemoContentFlag = process.env.NEXT_PUBLIC_SKR_DEMO_CONTENT;
    process.env.NEXT_PUBLIC_SKR_DEMO_CONTENT = "true";

    try {
      render(
        <StitchSetupsPage
          activeSetupSlug="botanical-wedding"
          catalogue={{ source: "fallback", categories: [], products: [] }}
        />
      );

      expect(screen.getByRole("link", { name: /all setups/i })).not.toHaveAttribute("aria-current", "page");
      expect(screen.getByRole("link", { name: /weddings/i })).toHaveAttribute("aria-current", "page");
      expect(screen.getByRole("link", { name: /weddings/i })).toHaveAttribute(
        "href",
        "/listings?setup=weddings"
      );
      expect(screen.getByText("Botanical Wedding")).toBeInTheDocument();
      expect(screen.queryByText("Executive Summit")).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: /view setup details/i })).toHaveAttribute(
        "href",
        "/listings/botanical-wedding"
      );
    } finally {
      if (previousDemoContentFlag === undefined) {
        delete process.env.NEXT_PUBLIC_SKR_DEMO_CONTENT;
      } else {
        process.env.NEXT_PUBLIC_SKR_DEMO_CONTENT = previousDemoContentFlag;
      }
    }
  });

  it("assigns the Metropolitan Gala editorial listing to Corporate Summits instead of a Featured Editorial filter", () => {
    const previousDemoContentFlag = process.env.NEXT_PUBLIC_SKR_DEMO_CONTENT;
    process.env.NEXT_PUBLIC_SKR_DEMO_CONTENT = "true";

    try {
      render(
        <StitchSetupsPage
          activeSetupSlug="corporate-summits"
          catalogue={{ source: "fallback", categories: [], products: [] }}
        />
      );

      expect(screen.getByRole("link", { name: /all setups/i })).not.toHaveAttribute("aria-current", "page");
      expect(screen.getByRole("link", { name: /corporate summits/i })).toHaveAttribute("aria-current", "page");
      expect(screen.queryByRole("link", { name: /featured editorial/i })).not.toBeInTheDocument();
      expect(screen.getAllByText("The Metropolitan Gala").length).toBeGreaterThan(1);
      expect(screen.getByText("Executive Summit")).toBeInTheDocument();
      expect(screen.queryByText("Botanical Wedding")).not.toBeInTheDocument();
    } finally {
      if (previousDemoContentFlag === undefined) {
        delete process.env.NEXT_PUBLIC_SKR_DEMO_CONTENT;
      } else {
        process.env.NEXT_PUBLIC_SKR_DEMO_CONTENT = previousDemoContentFlag;
      }
    }
  });

  it("renders a clean empty catalogue state inside the Stitch catalogue shell", () => {
    render(
      <CataloguePageContent
        catalogue={{
          source: "fallback",
          categories: [],
          products: []
        }}
      />
    );

    expect(document.body.textContent).toMatch(/no public rental listings are available right now/i);
    expect(document.body.textContent).toMatch(/catalogue records will appear here once published/i);
    expect(document.body.textContent).not.toMatch(forbiddenPublicCopy);
  });

  it("renders safe rental listing not-found states", () => {
    render(<CatalogueListingNotFound />);

    expect(screen.getByRole("heading", { name: /listing unavailable/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view catalogue/i })).toHaveAttribute("href", "/catalogue");
    expect(screen.getByRole("link", { name: /send an enquiry/i })).toHaveAttribute("href", "/quote");
    expect(screen.queryByText(/draft|archived|internal note|workflow status/i)).not.toBeInTheDocument();

    cleanup();
    render(<ListingNotFound />);

    expect(screen.getByRole("heading", { name: /listing unavailable/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /browse listings/i })[0]).toHaveAttribute("href", "/listings");
    expect(screen.getByRole("link", { name: /send an enquiry/i })).toHaveAttribute("href", "/quote");
  });

  it("renders published product detail data supplied by the server read layer", () => {
    render(<ProductPageContent product={modularLounge} />);

    expect(screen.queryByRole("heading", { level: 1, name: /modular lounge set/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /modular lounge set/i })).toBeInTheDocument();
    expect(screen.getByText(/published lounge set/i)).toBeInTheDocument();
    expect(screen.getByText("Style")).toBeInTheDocument();
    expect(screen.getByText(/style to confirm/i)).toBeInTheDocument();
    expect(screen.getByText(/listing reference/i)).toBeInTheDocument();
    expect(screen.getByText("modular-lounge-set")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /increase modular lounge set quantity/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/modular lounge set quantity selected/i)).toHaveTextContent("Qty 0");
    expect(screen.getByRole("link", { name: /request quote/i })).toHaveAttribute("href", "/quote");
    expect(screen.getByRole("link", { name: /back to catalogue/i })).toHaveAttribute("href", "/catalogue");
  });

  it("keeps public listing source free from shell, ecommerce-only copy, and browser Supabase", () => {
    const catalogueSource = readFileSync(resolve(process.cwd(), "app/catalogue/page.tsx"), "utf8");
    const detailSource = readFileSync(resolve(process.cwd(), "app/catalogue/[slug]/page.tsx"), "utf8");

    expect(catalogueSource).not.toMatch(/listing shell/i);
    expect(detailSource).not.toMatch(/listing shell/i);
    expect(catalogueSource).not.toMatch(/supabase service role|createBrowserClient|supabaseBrowserClient/i);
    expect(detailSource).not.toMatch(/supabase service role|createBrowserClient|supabaseBrowserClient/i);
    expect(`${catalogueSource}\n${detailSource}`).not.toMatch(forbiddenPublicCopy);
  });

  it("documents a concise manual QA path for the visible public catalogue enquiry slice", () => {
    const manualQaSource = readFileSync(resolve(process.cwd(), "../docs/manual-qa/MVP-VISUAL-SLICE-QA.md"), "utf8");

    for (const requiredStep of [
      "Open the homepage",
      "Browse catalogue/listing cards",
      "Submit a quote/enquiry request",
      "Confirm the success receipt",
      "Confirm chat unavailable/error behavior shows an error message and does not show a fake/canned assistant response",
      "Open protected admin quote requests",
      "Update internal triage status",
      "Confirm no cart, checkout, payment, order, booking, reservation, customer account, or provider-sync flow appears"
    ]) {
      expect(manualQaSource).toContain(requiredStep);
    }
    expect(manualQaSource).toContain("Supabase-backed quote persistence");
    expect(manualQaSource).not.toMatch(/owner-review|governance ladder|HubSpot sync/i);
  });

  it("keeps responsive smoke CSS safeguards for compact Stitch screens", () => {
    const styles = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");

    expect(styles).toMatch(/overflow-wrap:\s*anywhere/i);
    expect(styles).toMatch(/\.stitch-mobile-menu/i);
    expect(styles).toMatch(/\.stitch-quote-layout/i);
    expect(styles).toMatch(/\.stitch-home-category-mosaic/i);
    const categoryCtaClearanceBlock = styles.slice(
      styles.indexOf("/* Final public design-system consolidation:")
    );
    const categoryActionRule = categoryCtaClearanceBlock.match(
      /body:has\(\.stitch-home-hero\)\s+\.site-main\s+:is\([\s\S]*?\.stitch-home-section-action[\s\S]*?\.stitch-home-featured-action[\s\S]*?\)\s*\{[\s\S]*?\}/
    )?.[0];

    expect(categoryCtaClearanceBlock).toContain("Final public design-system consolidation");
    expect(categoryActionRule).toBeDefined();
    expect(categoryActionRule).toMatch(/justify-content:\s*center\s*!important;/);
    expect(categoryActionRule).toMatch(/margin:\s*clamp\(1rem,\s*1\.6vw,\s*1\.35rem\)\s+0\s+0\s*!important;/);
    expect(categoryActionRule).toMatch(/position:\s*relative\s*!important;/);
    expect(styles).toMatch(/@media\s*\(max-width:/i);
  });

  it("keeps public hero titles on the thin Furniture Catalogue serif weight", () => {
    const styles = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const finalCorrectionBlock = styles.slice(
      styles.indexOf("/* Final correction: keep public title rails and quote columns stable. */")
    );
    const publicHeroTitleRule = finalCorrectionBlock.match(
      /body:has\(\.stitch-site-header\)\s+\.site-main\s+:is\([\s\S]*?\.stitch-page-intro h1[\s\S]*?\)\s*\{[\s\S]*?\}/
    )?.[0];

    expect(finalCorrectionBlock).toContain("Final correction");
    expect(publicHeroTitleRule).toBeDefined();
    expect(publicHeroTitleRule).toMatch(/\.stitch-catalogue-hero \.stitch-page-intro h1/);
    expect(publicHeroTitleRule).toMatch(/\.stitch-about-hero h1/);
    expect(publicHeroTitleRule).toMatch(/\.stitch-setups-hero h1/);
    expect(publicHeroTitleRule).toMatch(/\.stitch-page-intro h1/);
    expect(publicHeroTitleRule).toMatch(/font-family:\s*var\(--stitch-serif\)\s*!important;/);
    expect(publicHeroTitleRule).toMatch(/font-weight:\s*400\s*!important;/);
    expect(publicHeroTitleRule).not.toMatch(/font-weight:\s*700\s*!important;/);
    const finalRhythmBlock = styles.slice(
      styles.indexOf("/* Final public page rhythm: shared interior-title padding and calmer H1 scale. */")
    );
    const finalHeroTitleRule = finalRhythmBlock.match(
      /body:has\(\.stitch-site-header\)\s+\.site-main\s+:is\([\s\S]*?\.stitch-catalogue-hero \.stitch-page-intro h1[\s\S]*?\.stitch-quote-hero \.stitch-page-intro h1[\s\S]*?\)\s*\{[\s\S]*?\}/
    )?.[0];

    expect(finalRhythmBlock).toContain("Final public page rhythm");
    expect(finalHeroTitleRule).toBeDefined();
    expect(finalHeroTitleRule).toMatch(/font-weight:\s*400\s*!important;/);
    expect(finalHeroTitleRule).toMatch(/font-size:\s*clamp\(2\.55rem,\s*3\.15vw,\s*3\.1rem\)\s*!important;/);
    expect(finalHeroTitleRule).not.toMatch(/font-weight:\s*700\s*!important;/);
    expect(finalHeroTitleRule).not.toMatch(/font-size:\s*clamp\(3\.05rem,\s*4\.2vw,\s*3\.95rem\)\s*!important;/);
    expect(finalRhythmBlock).not.toMatch(/font-size:\s*clamp\(3\.45rem,\s*5vw,\s*4\.55rem\)\s*!important;/);
  });

  it("keeps the public typography system on the approved Advantage-inspired scale", () => {
    const styles = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const typographyBlock = styles.slice(
      styles.indexOf("/* Final public design-system consolidation:")
    );
    const h1Rule = typographyBlock.match(
      /body:has\(\.stitch-site-header\)\s+\.site-main\s+:is\([\s\S]*?\.stitch-page-intro h1[\s\S]*?\)\s*\{[\s\S]*?\}/
    )?.[0];
    const h2Rule = typographyBlock.match(
      /body:has\(\.stitch-site-header\)\s+\.site-main\s+:is\([\s\S]*?\.stitch-section-heading h2[\s\S]*?\.stitch-quote-card h2[\s\S]*?\)\s*\{[\s\S]*?\}/
    )?.[0];
    const h3Rule = typographyBlock.match(
      /body:has\(\.stitch-site-header\)\s+\.site-main\s+:is\([\s\S]*?\.stitch-feature h3[\s\S]*?\.stitch-legal-card h3[\s\S]*?\.stitch-setup-card h2[\s\S]*?\)\s*\{[\s\S]*?\}/
    )?.[0];
    const itemNameRule = typographyBlock.match(
      /body:has\(\.stitch-site-header\)\s+\.site-main\s+:is\([\s\S]*?\.stitch-card__body h2[\s\S]*?\.stitch-home-feature-card strong[\s\S]*?\)\s*\{[\s\S]*?\}/
    )?.[0];
    const labelRule = typographyBlock.match(
      /body:has\(\.stitch-site-header\)\s+:is\([\s\S]*?\.stitch-button[\s\S]*?\.stitch-mobile-menu a[\s\S]*?\)\s*\{[\s\S]*?\}/
    )?.[0];

    expect(typographyBlock).toContain("Final public design-system consolidation");
    expect(h1Rule).toBeDefined();
    expect(h1Rule).toMatch(/\.stitch-page-intro h1/);
    expect(h1Rule).toMatch(/font-family:\s*var\(--stitch-serif\)\s*!important;/);
    expect(h1Rule).toMatch(/font-size:\s*clamp\(2\.55rem,\s*3\.15vw,\s*3\.1rem\)\s*!important;/);
    expect(h1Rule).toMatch(/font-weight:\s*400\s*!important;/);
    expect(h2Rule).toBeDefined();
    expect(h2Rule).toMatch(/font-size:\s*clamp\(1\.7rem,\s*2\.05vw,\s*2\.2rem\)\s*!important;/);
    expect(h2Rule).not.toMatch(/\.stitch-legal-card h2/);
    expect(h3Rule).toBeDefined();
    expect(h3Rule).toMatch(/\.stitch-legal-card h3/);
    expect(h3Rule).toMatch(/font-size:\s*clamp\(1\.15rem,\s*1\.45vw,\s*1\.42rem\)\s*!important;/);
    expect(itemNameRule).toBeDefined();
    expect(itemNameRule).toMatch(/font-size:\s*clamp\(0\.98rem,\s*1\.05vw,\s*1\.12rem\)\s*!important;/);
    expect(itemNameRule).toMatch(/line-height:\s*1\.16\s*!important;/);
    expect(labelRule).toBeDefined();
    expect(labelRule).toMatch(/font-size:\s*clamp\(0\.86rem,\s*0\.18vw \+ 0\.82rem,\s*0\.94rem\)\s*!important;/);
    expect(labelRule).toMatch(/text-transform:\s*uppercase\s*!important;/);

    const quoteSelectionMetaRule = typographyBlock.match(
      /body:has\(\.stitch-site-header\)\s+\.site-main\s+:is\([\s\S]*?\.stitch-home-feature-card small[\s\S]*?\.stitch-selection-row__meta small[\s\S]*?\)\s*\{[\s\S]*?\}/
    )?.[0];

    expect(itemNameRule).toMatch(/\.stitch-selection-row strong/);
    expect(quoteSelectionMetaRule).toBeDefined();
    expect(quoteSelectionMetaRule).toMatch(/font-size:\s*0\.86rem\s*!important;/);
    expect(quoteSelectionMetaRule).toMatch(/letter-spacing:\s*0\s*!important;/);
  });

  it("keeps public section padding on the shared Category-to-Featured rhythm", () => {
    const styles = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const rhythmBlock = styles.slice(
      styles.indexOf("/* Final public design-system consolidation:")
    );
    const sectionRule = rhythmBlock.match(
      /body:has\(\.stitch-site-header\)\s+\.site-main\s+>\s+:is\([\s\S]*?\.stitch-home-categories[\s\S]*?\.stitch-home-featured[\s\S]*?\.stitch-detail-related[\s\S]*?\)\s*\{[\s\S]*?\}/
    )?.[0];
    const heroRailRule = rhythmBlock.match(
      /body:has\(\.stitch-site-header\)\s+\.site-main\s+>\s+:is\([\s\S]*?\.stitch-catalogue-hero[\s\S]*?\.stitch-quote-hero[\s\S]*?\)\s*\{\s*background:[\s\S]*?\}/
    )?.[0];

    expect(rhythmBlock).toContain("Final public design-system consolidation");
    expect(rhythmBlock).toMatch(/--stitch-public-section-y:\s*clamp\(1\.55rem,\s*2\.75vw,\s*2\.25rem\);/);
    expect(sectionRule).toBeDefined();
    expect(sectionRule).toMatch(/padding-bottom:\s*var\(--stitch-public-section-y\)\s*!important;/);
    expect(sectionRule).toMatch(/padding-top:\s*var\(--stitch-public-section-y\)\s*!important;/);
    expect(heroRailRule).toBeDefined();
    expect(heroRailRule).toMatch(/border-bottom:\s*1px solid var\(--stitch-line\)\s*!important;/);
  });

  it("keeps catalogue card quantity and details controls on the same height", () => {
    const styles = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const actionSizingBlock = styles.slice(
      styles.indexOf("/* Final public design-system consolidation:")
    );
    const quantityControlsRule = actionSizingBlock.match(
      /body:has\(\.stitch-catalogue-hero\)\s+\.site-main\s+\.stitch-product-card\s+\.stitch-card__actions\s+\.stitch-quote-select-controls\s*\{[\s\S]*?\}/
    )?.[0];
    const detailsButtonRule = actionSizingBlock.match(
      /body:has\(\.stitch-catalogue-hero\)\s+\.site-main\s+\.stitch-product-card\s+\.stitch-card__actions\s+\.stitch-link-button--quiet\s*\{[\s\S]*?\}/
    )?.[0];

    expect(actionSizingBlock).toContain("Final public design-system consolidation");
    expect(actionSizingBlock).toMatch(/--stitch-catalogue-card-action-height:\s*2\.95rem;/);
    expect(quantityControlsRule).toBeDefined();
    expect(quantityControlsRule).toMatch(/height:\s*var\(--stitch-catalogue-card-action-height\)\s*!important;/);
    expect(quantityControlsRule).toMatch(/order:\s*1\s*!important;/);
    expect(detailsButtonRule).toBeDefined();
    expect(detailsButtonRule).toMatch(/height:\s*var\(--stitch-catalogue-card-action-height\)\s*!important;/);
    expect(detailsButtonRule).toMatch(/order:\s*2\s*!important;/);
    expect(detailsButtonRule).toMatch(/padding:\s*0\.72rem\s*0\.9rem\s*0\.88rem\s*!important;/);
  });

  it("keeps public hero intros complete and aligned to the Furniture Catalogue rail", () => {
    const styles = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const finalHeroRailBlock = styles.slice(
      styles.indexOf("/* Final public design-system consolidation:")
    );
    const heroContainerRule = finalHeroRailBlock.match(
      /body:has\(\.stitch-site-header\)\s+\.site-main\s+>\s+:is\([\s\S]*?\.stitch-catalogue-hero[\s\S]*?\.stitch-quote-hero[\s\S]*?\)\s*>\s*\.stitch-container,[\s\S]*?\{[\s\S]*?\}/
    )?.[0];
    const wrappedHeroCopyRule = finalHeroRailBlock.match(
      /body:has\(\.stitch-site-header\)\s+\.site-main\s+>\s+:is\([\s\S]*?\.stitch-catalogue-hero[\s\S]*?\.stitch-quote-hero[\s\S]*?\)\s+>\s+\.stitch-container\s+>\s+\.stitch-page-intro\s*\{[\s\S]*?\}/
    )?.[0];
    expect(finalHeroRailBlock).toContain("Final public design-system consolidation");
    expect(heroContainerRule).toBeDefined();
    expect(heroContainerRule).toMatch(/max-width:\s*1312px\s*!important;/);
    expect(heroContainerRule).toMatch(/width:\s*var\(--stitch-public-container\)\s*!important;/);
    expect(heroContainerRule).not.toMatch(/max-width:\s*48rem\s*!important;/);
    expect(heroContainerRule).toMatch(/\.stitch-catalogue-hero/);
    expect(heroContainerRule).toMatch(/\.stitch-about-hero/);
    expect(heroContainerRule).toMatch(/\.stitch-contact-hero/);
    expect(heroContainerRule).toMatch(/\.stitch-setups-hero/);
    expect(heroContainerRule).toMatch(/\.stitch-legal-hero/);
    expect(heroContainerRule).toMatch(/\.stitch-quote-hero/);
    expect(wrappedHeroCopyRule).toBeDefined();
    expect(wrappedHeroCopyRule).toMatch(/max-width:\s*48rem\s*!important;/);
    expect(wrappedHeroCopyRule).toMatch(/text-align:\s*left\s*!important;/);
    render(<CataloguePageContent catalogue={catalogueWithProduct} />);
    expect(document.querySelector(".stitch-catalogue-hero > .stitch-container > .stitch-page-intro")).not.toBeNull();
    expect(document.querySelector(".stitch-catalogue-hero")?.textContent).toMatch(
      /Catalogue.*Furniture Catalogue.*Curated rental pieces/s
    );

    cleanup();
    render(<ContactPage />);
    expect(document.querySelector(".stitch-contact-hero > .stitch-container > .stitch-page-intro")).not.toBeNull();
    expect(document.querySelector(".stitch-contact-hero")?.textContent).toMatch(
      /Contact.*Get in Touch.*Share rental catalogue questions/s
    );

    cleanup();
    render(<AboutPage />);
    expect(document.querySelector(".stitch-about-hero > .stitch-container > .stitch-page-intro")).not.toBeNull();
    expect(document.querySelector(".stitch-about-hero")?.textContent).toMatch(
      /About.*Curating spaces that breathe, inspire, and endure.*Furniture is the quiet architecture/s
    );

    cleanup();
    render(<PrivacyPage />);
    expect(document.querySelector(".stitch-legal-hero > .stitch-container > .stitch-page-intro")).not.toBeNull();
    expect(document.querySelector(".stitch-legal-hero")?.textContent).toMatch(
      /Legal.*Privacy Policy.*practical MVP privacy posture/s
    );

    cleanup();
    render(<TermsPage />);
    expect(document.querySelector(".stitch-legal-hero > .stitch-container > .stitch-page-intro")).not.toBeNull();
    expect(document.querySelector(".stitch-legal-hero")?.textContent).toMatch(
      /Legal.*Terms of Use.*current MVP website experience/s
    );

    cleanup();
    render(<StitchSetupsPage catalogue={{ source: "fallback", categories: [], products: [] }} />);
    expect(document.querySelector(".stitch-setups-hero > .stitch-container > .stitch-page-intro")).not.toBeNull();
    expect(document.querySelector(".stitch-setups-hero")?.textContent).toMatch(
      /Setups.*Curated Scapes.*Explore styled environment directions/s
    );
  });

  it("keeps Catalogue, About, and Contact page-name eyebrows visible above hero titles", () => {
    const styles = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const publicStitchSource = readFileSync(resolve(process.cwd(), "components/PublicStitch.tsx"), "utf8");
    const eyebrowBlock = styles.slice(
      styles.indexOf("/* Final page eyebrow restoration: keep page names visible above non-home hero titles. */")
    );
    const eyebrowRule = eyebrowBlock.match(
      /body:has\(\.stitch-site-header\):not\(:has\(\.stitch-home-hero\)\)\s+\.site-main\s+:is\([\s\S]*?\.stitch-contact-hero[\s\S]*?\)\s+\.stitch-eyebrow\s*\{[\s\S]*?\}/
    )?.[0];

    expect(publicStitchSource).toContain('eyebrow={detailBasePath === "/listings" ? "Setups" : "Catalogue"}');
    expect(publicStitchSource).toContain('StitchPageIntro eyebrow="About"');
    expect(publicStitchSource).toContain('StitchPageIntro eyebrow="Contact"');
    expect(publicStitchSource).toContain('StitchPageIntro eyebrow="Setups"');
    expect(eyebrowRule).toBeDefined();
    expect(eyebrowRule).toMatch(/\.stitch-catalogue-hero/);
    expect(eyebrowRule).toMatch(/\.stitch-about-hero/);
    expect(eyebrowRule).toMatch(/\.stitch-contact-hero/);
    expect(eyebrowRule).toMatch(/display:\s*block\s*!important;/);
    expect(eyebrowRule).toMatch(/visibility:\s*visible\s*!important;/);
    expect(eyebrowRule).toMatch(/text-transform:\s*uppercase\s*!important;/);
  });

  it("keeps page intro eyebrows lighter than button and filter labels", () => {
    const styles = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const typographyBlock = styles.slice(
      styles.indexOf("/* Final public design-system consolidation:")
    );
    const labelRule = typographyBlock.match(
      /body:has\(\.stitch-site-header\)\s+:is\([\s\S]*?\.site-main \.stitch-eyebrow[\s\S]*?\.stitch-mobile-menu a[\s\S]*?\)\s*\{[\s\S]*?\}/
    )?.[0];
    const pageIntroEyebrowSelectorIndex = typographyBlock.indexOf(") .stitch-page-intro > .stitch-eyebrow");
    const pageIntroEyebrowRuleStart = typographyBlock.lastIndexOf(
      "body:has(.stitch-site-header)",
      pageIntroEyebrowSelectorIndex
    );
    const pageIntroEyebrowRuleEnd = typographyBlock.indexOf("}", pageIntroEyebrowSelectorIndex);
    const pageIntroEyebrowRule =
      pageIntroEyebrowSelectorIndex >= 0 && pageIntroEyebrowRuleStart >= 0 && pageIntroEyebrowRuleEnd >= 0
        ? typographyBlock.slice(pageIntroEyebrowRuleStart, pageIntroEyebrowRuleEnd + 1)
        : undefined;

    expect(labelRule).toBeDefined();
    expect(labelRule).toMatch(/font-weight:\s*800\s*!important;/);
    expect(pageIntroEyebrowRule).toBeDefined();
    expect(pageIntroEyebrowRule).toMatch(/\.stitch-setups-hero/);
    expect(pageIntroEyebrowRule).toMatch(/\.stitch-legal-hero/);
    expect(pageIntroEyebrowRule).toMatch(/font-size:\s*0\.76rem\s*!important;/);
    expect(pageIntroEyebrowRule).toMatch(/font-weight:\s*500\s*!important;/);
    expect(pageIntroEyebrowRule).not.toMatch(/font-weight:\s*800\s*!important;/);
  });

  it("keeps public section headings compact enough to avoid premature wrapping", () => {
    const styles = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const finalDesktopBlock = styles.slice(
      styles.indexOf("@media (min-width: 901px)")
    );
    const homeSectionHeadingRule = finalDesktopBlock.match(
      /body:has\(\.stitch-home-hero\)\s+\.site-main\s+:is\([\s\S]*?\.stitch-home-featured[\s\S]*?\)\s+\.stitch-section-heading h2\s*\{[\s\S]*?\}/
    )?.[0];

    expect(homeSectionHeadingRule).toBeDefined();
    expect(homeSectionHeadingRule).toMatch(/font-size:\s*clamp\(1\.7rem,\s*2\.05vw,\s*2\.2rem\)\s*!important;/);
    expect(homeSectionHeadingRule).toMatch(/font-weight:\s*400\s*!important;/);
    expect(homeSectionHeadingRule).not.toMatch(/font-size:\s*clamp\(2\.25rem,\s*2\.8vw,\s*2\.9rem\)\s*!important;/);
  });

  it("keeps SpaceKonceptRental Advantage card content vertically centered", () => {
    const styles = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const advantageCenteringBlock = styles.slice(
      styles.indexOf("/* Final Advantage card centering: keep card contents centered top-to-bottom. */")
    );
    const advantageCardRule = advantageCenteringBlock.match(
      /body:has\(\.stitch-home-hero\)\s+\.site-main\s+\.stitch-home-advantage\s+\.stitch-feature\s*\{[\s\S]*?\}/
    )?.[0];

    expect(advantageCenteringBlock).toContain("Final Advantage card centering");
    expect(advantageCardRule).toBeDefined();
    expect(advantageCardRule).toMatch(/display:\s*flex\s*!important;/);
    expect(advantageCardRule).toMatch(/flex-direction:\s*column\s*!important;/);
    expect(advantageCardRule).toMatch(/align-items:\s*center\s*!important;/);
    expect(advantageCardRule).toMatch(/justify-content:\s*center\s*!important;/);
    expect(advantageCardRule).toMatch(/text-align:\s*center\s*!important;/);
  });

  it("keeps quote selection rows readable in the side panel", () => {
    const styles = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const quoteSelectionBlock = styles.slice(
      styles.indexOf("/* Final public design-system consolidation:")
    );
    const rowRule = quoteSelectionBlock.match(
      /body:has\(\.stitch-quote-page\):not\(:has\(\.quote-form--success\)\)\s+\.site-main\s+\.stitch-selection-row\s*\{[\s\S]*?\}/
    )?.[0];
    const bodyRule = quoteSelectionBlock.match(
      /body:has\(\.stitch-quote-page\):not\(:has\(\.quote-form--success\)\)\s+\.site-main\s+\.stitch-selection-row__body\s*\{[\s\S]*?\}/
    )?.[0];
    const controlsRule = quoteSelectionBlock.match(
      /body:has\(\.stitch-quote-page\):not\(:has\(\.quote-form--success\)\)\s+\.site-main\s+\.stitch-selection-row\s+\.stitch-quote-select-controls\s*\{[\s\S]*?\}/
    )?.[0];

    expect(quoteSelectionBlock).toContain("Final public design-system consolidation");
    expect(rowRule).toBeDefined();
    expect(rowRule).toMatch(/grid-template-columns:\s*6\.25rem minmax\(0,\s*1fr\)\s*!important;/);
    expect(bodyRule).toBeDefined();
    expect(bodyRule).toMatch(/column-gap:\s*1\.05rem\s*!important;/);
    expect(bodyRule).toMatch(/row-gap:\s*0\.5rem\s*!important;/);
    expect(controlsRule).toBeDefined();
    expect(controlsRule).toMatch(/max-width:\s*10\.75rem\s*!important;/);
  });

  it("keeps About page feature sections aligned to the Advantage card system", () => {
    const styles = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const aboutParityBlock = styles.slice(
      styles.indexOf("/* Final About parity: match the SpaceKonceptRental Advantage section system. */")
    );
    const aboutCardRule = aboutParityBlock.match(
      /body:has\(\.stitch-about-hero\)\s+\.site-main\s+:is\([\s\S]*?\.stitch-about-service[\s\S]*?\)\s+\.stitch-about-card\s*\{[\s\S]*?\}/
    )?.[0];
    const aboutHeadingRule = aboutParityBlock.match(
      /body:has\(\.stitch-about-hero\)\s+\.site-main\s+:is\([\s\S]*?\.stitch-about-service[\s\S]*?\)\s+\.stitch-section-heading h2\s*\{[\s\S]*?\}/
    )?.[0];

    expect(aboutParityBlock).toContain("Final About parity");
    expect(aboutHeadingRule).toBeDefined();
    expect(aboutHeadingRule).toMatch(/font-size:\s*clamp\(1\.7rem,\s*2\.05vw,\s*2\.2rem\)\s*!important;/);
    expect(aboutHeadingRule).toMatch(/text-align:\s*center\s*!important;/);
    expect(aboutCardRule).toBeDefined();
    expect(aboutCardRule).toMatch(/background:\s*var\(--stitch-surface\)\s*!important;/);
    expect(aboutCardRule).toMatch(/min-height:\s*15\.4rem\s*!important;/);
    expect(aboutCardRule).toMatch(/text-align:\s*center\s*!important;/);
  });

  it("keeps catalogue results inside the shared public container width", () => {
    const styles = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const finalCatalogueBlock = styles.slice(
      styles.indexOf("body:has(.stitch-catalogue-hero) .site-main .stitch-catalogue-section .stitch-container")
    );
    const catalogueContainerRule = finalCatalogueBlock.match(
      /body:has\(\.stitch-catalogue-hero\)\s+\.site-main\s+\.stitch-catalogue-section\s+\.stitch-container\s*\{[\s\S]*?\}/
    )?.[0];

    expect(catalogueContainerRule).toBeDefined();
    expect(catalogueContainerRule).toMatch(/max-width:\s*1312px\s*!important;/);
    expect(catalogueContainerRule).toMatch(/width:\s*min\(calc\(100%\s*-\s*clamp\(2rem,\s*7vw,\s*6rem\)\),\s*1312px\)\s*!important;/);
    expect(catalogueContainerRule).not.toMatch(/1440px/);
  });

  it("keeps final public UI parity for catalogue rails, mobile hero CTAs, and form errors", () => {
    const styles = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const parityBlock = styles.slice(
      styles.lastIndexOf("/* Final public design-system consolidation:")
    );
    const catalogueLayoutRule = parityBlock.match(
      /body:has\(\.stitch-catalogue-hero\)\s+\.site-main\s+\.stitch-catalogue-layout\s*\{[\s\S]*?\}/
    )?.[0];
    const catalogueResultRule = parityBlock.match(
      /body:has\(\.stitch-catalogue-hero\)\s+\.site-main\s+\.stitch-catalogue-results,[\s\S]*?body:has\(\.stitch-catalogue-hero\)\s+\.site-main\s+\.stitch-empty\s*\{[\s\S]*?\}/
    )?.[0];
    const catalogueGridRule = parityBlock.match(
      /body:has\(\.stitch-catalogue-hero\)\s+\.site-main\s+\.stitch-card-grid\s*\{[\s\S]*?\}/
    )?.[0];
    const mobileHeroCopyRule = parityBlock.match(
      /body:has\(\.stitch-home-hero\)\s+\.site-main\s+\.stitch-home-hero__copy\s*\{[\s\S]*?\}/
    )?.[0];
    const mobileHeroSubtextRule = parityBlock.match(
      /body:has\(\.stitch-home-hero\)\s+\.site-main\s+\.stitch-home-hero__copy p:not\(\.stitch-eyebrow\)\s*\{[\s\S]*?\}/
    )?.[0];
    const mobileHeroButtonRule = parityBlock.match(
      /body:has\(\.stitch-home-hero\)\s+\.site-main\s+\.stitch-home-hero\s+\.stitch-button,[\s\S]*?body:has\(\.stitch-home-hero\)\s+\.site-main\s+\.stitch-home-hero\s+\.stitch-button--secondary\s*\{[\s\S]*?\}/
    )?.[0];
    const formErrorRule = parityBlock.match(
      /body:has\(\.stitch-quote-page\):not\(:has\(\.quote-form--success\)\)\s+\.site-main\s+\.stitch-quote-form-panel\s+\.quote-form__field-error\s*\{[\s\S]*?\}/
    )?.[0];

    expect(parityBlock).toContain("Final public design-system consolidation");
    expect(parityBlock).toMatch(/font-size:\s*max\(0\.86rem,\s*1em\)\s*!important;/);
    expect(parityBlock).toMatch(/font-family:\s*var\(--stitch-sans\)\s*!important;/);
    expect(catalogueLayoutRule).toBeDefined();
    expect(catalogueLayoutRule).toMatch(/gap:\s*clamp\(0\.9rem,\s*1\.25vw,\s*1\.35rem\)\s*!important;/);
    expect(catalogueLayoutRule).toMatch(/grid-template-columns:\s*minmax\(15\.5rem,\s*16\.5rem\)\s+minmax\(0,\s*1fr\)\s*!important;/);
    expect(catalogueResultRule).toBeDefined();
    expect(catalogueResultRule).toMatch(/max-width:\s*none\s*!important;/);
    expect(catalogueResultRule).toMatch(/width:\s*100%\s*!important;/);
    expect(catalogueGridRule).toBeDefined();
    expect(catalogueGridRule).toMatch(/grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)\s*!important;/);
    expect(mobileHeroCopyRule).toBeDefined();
    expect(mobileHeroCopyRule).toMatch(/flex-direction:\s*column\s*!important;/);
    expect(mobileHeroSubtextRule).toBeDefined();
    expect(mobileHeroSubtextRule).toMatch(/display:\s*block\s*!important;/);
    expect(mobileHeroButtonRule).toBeDefined();
    expect(mobileHeroButtonRule).toMatch(/display:\s*inline-flex\s*!important;/);
    expect(formErrorRule).toBeDefined();
    expect(formErrorRule).toMatch(/background:\s*transparent\s*!important;/);
    expect(formErrorRule).toMatch(/border:\s*0\s*!important;/);
    expect(formErrorRule).toMatch(/font-size:\s*0\.86rem\s*!important;/);
  });

  it("keeps catalogue filter filled styling scoped to selected links only", () => {
    const styles = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const finalDesktopFilterBlock = styles.slice(
      styles.indexOf("body:has(.stitch-catalogue-hero) .site-main .stitch-filter-panel a,")
    );
    const activeFilterRule = finalDesktopFilterBlock.match(
      /body:has\(\.stitch-catalogue-hero\)\s+\.site-main\s+\.stitch-filter-panel\s+a\.is-active,[\s\S]*?body:has\(\.stitch-catalogue-hero\)\s+\.site-main\s+\.stitch-filter-panel\s+\[aria-current="page"\]\s*\{[\s\S]*?\}/
    )?.[0];

    expect(activeFilterRule).toBeDefined();
    expect(activeFilterRule).toMatch(/background:\s*var\(--stitch-primary\)\s*!important;/);
    expect(finalDesktopFilterBlock).not.toMatch(
      /body:has\(\.stitch-catalogue-hero\)\s+\.site-main\s+\.stitch-filter-panel\s+a:first-of-type,[\s\S]*?background:\s*var\(--stitch-primary\)\s*!important;/
    );
  });

  it("keeps mobile catalogue filter groups split and the menu drawer unclipped", () => {
    const styles = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const consolidationIndex = styles.indexOf("/* Final public design-system consolidation:");
    const mobileCorrectionBlock = styles.slice(
      styles.indexOf("@media (max-width: 900px)", consolidationIndex)
    );
    const menuCorrectionBlock = styles.slice(
      styles.indexOf("/* Final mobile catalogue/menu correction: keep filter groups and drawer chrome distinct. */")
    );
    const publicStitchSource = readFileSync(resolve(process.cwd(), "components/PublicStitch.tsx"), "utf8");
    const filterPanelRule = mobileCorrectionBlock.match(
      /body:has\(\.stitch-catalogue-hero\)\s+\.site-main\s+\.stitch-filter-panel\s*\{[\s\S]*?\}/
    )?.[0];
    const filterGroupRule = mobileCorrectionBlock.match(
      /body:has\(\.stitch-catalogue-hero\)\s+\.site-main\s+\.stitch-filter-group\s*\{[\s\S]*?\}/
    )?.[0];
    const menuOverflowRule = menuCorrectionBlock.match(
      /body:has\(\.stitch-mobile-menu--open\)\s+\.stitch-site-header,[\s\S]*?body:has\(\.stitch-mobile-menu--open\)\s+\.stitch-header-actions\s*\{[\s\S]*?\}/
    )?.[0];
    const openMenuRule = menuCorrectionBlock.match(
      /body:has\(\.stitch-mobile-menu--open\)\s+\.stitch-mobile-menu\s*\{[\s\S]*?\}/
    )?.[0];

    expect(styles.slice(consolidationIndex)).toContain("Final public design-system consolidation");
    expect(publicStitchSource).toContain("stitch-filter-group--categories");
    expect(publicStitchSource).toContain("stitch-filter-group--styles");
    expect(filterPanelRule).toBeDefined();
    expect(filterPanelRule).toMatch(/display:\s*grid\s*!important;/);
    expect(filterPanelRule).toMatch(/gap:\s*1\.05rem\s*!important;/);
    expect(filterGroupRule).toBeDefined();
    expect(filterGroupRule).toMatch(/display:\s*grid\s*!important;/);
    expect(filterGroupRule).toMatch(/gap:\s*0\.5rem\s*!important;/);
    expect(mobileCorrectionBlock).toMatch(/stitch-filter-group--styles[\s\S]*?border-top:\s*1px\s+solid\s+var\(--stitch-line\)\s*!important;/);
    expect(mobileCorrectionBlock).toMatch(/stitch-filter-panel h2[\s\S]*?display:\s*block\s*!important;/);
    expect(menuOverflowRule).toBeDefined();
    expect(menuOverflowRule).toMatch(/overflow:\s*visible\s*!important;/);
    expect(openMenuRule).toBeDefined();
    expect(openMenuRule).toMatch(/position:\s*fixed\s*!important;/);
    expect(openMenuRule).toMatch(/left:\s*auto\s*!important;/);
    expect(openMenuRule).toMatch(/right:\s*0\s*!important;/);
    expect(openMenuRule).toMatch(/height:\s*100dvh\s*!important;/);
  });

  it("keeps mobile catalogue card actions inline instead of overlaying images", () => {
    const styles = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const consolidationIndex = styles.indexOf("/* Final public design-system consolidation:");
    const mobileCorrectionBlock = styles.slice(
      styles.indexOf("@media (max-width: 900px)", consolidationIndex)
    );
    const cardActionsRule = mobileCorrectionBlock.match(
      /body:has\(\.stitch-catalogue-hero\)\s+\.site-main\s+\.stitch-product-card\s+\.stitch-card__actions\s*\{[\s\S]*?\}/
    )?.[0];
    const quantityRule = mobileCorrectionBlock.match(
      /body:has\(\.stitch-catalogue-hero\)\s+\.site-main\s+\.stitch-product-card\s+\.stitch-quote-select-controls,[\s\S]*?body:has\(\.stitch-catalogue-hero\)\s+\.site-main\s+\.stitch-product-card\s+\.stitch-quote-select-controls\[data-selected="false"\]\s*\{[\s\S]*?\}/
    )?.[0];

    expect(cardActionsRule).toBeDefined();
    expect(cardActionsRule).toMatch(/position:\s*static\s*!important;/);
    expect(cardActionsRule).toMatch(/opacity:\s*1\s*!important;/);
    expect(cardActionsRule).toMatch(/transform:\s*none\s*!important;/);
    expect(cardActionsRule).toMatch(/margin-top:\s*0\.55rem\s*!important;/);
    expect(quantityRule).toBeDefined();
    expect(quantityRule).toMatch(/grid-template-columns:\s*2\.6rem\s+minmax\(0,\s*1fr\)\s+2\.6rem\s*!important;/);
  });

  it("shows style metadata on listing details without the doubled category divider", () => {
    const styles = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const detailCorrectionBlock = styles.slice(
      styles.indexOf("/* Final public design-system consolidation:")
    );
    const specCardRule = detailCorrectionBlock.match(
      /body:has\(\.stitch-detail-page:not\(\.stitch-detail-page--setup\)\)\s+\.site-main\s+\.stitch-detail-spec-card\s*\{[\s\S]*?\}/
    )?.[0];
    const firstRowRule = detailCorrectionBlock.match(
      /body:has\(\.stitch-detail-page:not\(\.stitch-detail-page--setup\)\)\s+\.site-main\s+\.stitch-detail-spec-card\s+dl\s+>\s+div:first-child\s*\{[\s\S]*?\}/
    )?.[0];

    expect(detailCorrectionBlock).toMatch(/stitch-detail-spec-card dl > div\s*\{[\s\S]*?display:\s*flex\s*!important;/);
    expect(detailCorrectionBlock).not.toMatch(/stitch-detail-spec-card dl > div:nth-child\(n \+ 2\)[\s\S]*?display:\s*none\s*!important;/);
    expect(specCardRule).toBeDefined();
    expect(specCardRule).toMatch(/margin:\s*0\s+0\s+clamp\(1rem,\s*2vw,\s*1\.45rem\)\s*!important;/);
    expect(specCardRule).not.toMatch(/border-top/);
    expect(firstRowRule).toBeDefined();
    expect(firstRowRule).toMatch(/border-top:\s*0\s*!important;/);
  });

  it("keeps the chat launcher and collapse controls on the IC-style right edge", () => {
    const styles = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const chatWidgetSource = readFileSync(resolve(process.cwd(), "components/ChatWidget.tsx"), "utf8");
    const chatSizingBlock = styles.slice(
      styles.indexOf("/* Final chat sizing: IC-style launcher, collapse controls, and shared right edge. */")
    );
    const launcherRule = chatSizingBlock.match(
      /\.chat-widget-launcher\s*\{[\s\S]*?\}/
    )?.[0];
    const launcherButtonRule = chatSizingBlock.match(
      /\.chat-widget-launcher\s+\.premium-chat-pulse\s*\{[\s\S]*?\}/
    )?.[0];
    const panelRule = chatSizingBlock.match(
      /\.chat-widget-panel\s*\{[\s\S]*?\}/
    )?.[0];
    const panelMessagesRule = chatSizingBlock.match(
      /\.chat-widget-panel\s+>\s+div\[aria-live="polite"\]\s*\{[\s\S]*?\}/
    )?.[0];
    const floatingCollapseRule = chatSizingBlock.match(
      /\.chat-widget-collapse-button--floating\s*\{[\s\S]*?\}/
    )?.[0];
    const chevronRule = chatSizingBlock.match(
      /\.chat-widget-chevron\s*\{[\s\S]*?\}/
    )?.[0];

    expect(chatSizingBlock).toContain("Final chat sizing");
    expect(chatWidgetSource).toContain("chat-widget-collapse-button--header");
    expect(chatWidgetSource).toContain("chat-widget-collapse-button--floating");
    expect(chatWidgetSource).toContain("chat-widget-chevron");
    expect(launcherRule).toBeDefined();
    expect(launcherRule).toMatch(/bottom:\s*18px\s*!important;/);
    expect(launcherRule).toMatch(/--chat-edge:\s*clamp\(14px,\s*4\.4vw,\s*22px\);/);
    expect(launcherRule).toMatch(/right:\s*var\(--chat-edge\)\s*!important;/);
    expect(launcherRule).toMatch(/transform:\s*none\s*!important;/);
    expect(launcherButtonRule).toBeDefined();
    expect(launcherButtonRule).toMatch(/background:\s*#050505\s*!important;/);
    expect(launcherButtonRule).toMatch(/height:\s*64px\s*!important;/);
    expect(launcherButtonRule).toMatch(/width:\s*64px\s*!important;/);
    expect(panelRule).toBeDefined();
    expect(panelRule).toMatch(/bottom:\s*94px\s*!important;/);
    expect(panelRule).toMatch(/right:\s*var\(--chat-edge\)\s*!important;/);
    expect(panelRule).toMatch(/width:\s*min\(464px,\s*calc\(100vw\s*-\s*32px\)\)\s*!important;/);
    expect(floatingCollapseRule).toBeDefined();
    expect(floatingCollapseRule).toMatch(/background:\s*#050505\s*!important;/);
    expect(floatingCollapseRule).toMatch(/bottom:\s*18px\s*!important;/);
    expect(floatingCollapseRule).toMatch(/right:\s*var\(--chat-edge\)\s*!important;/);
    expect(floatingCollapseRule).toMatch(/height:\s*64px\s*!important;/);
    expect(floatingCollapseRule).toMatch(/width:\s*64px\s*!important;/);
    expect(chevronRule).toBeDefined();
    expect(chevronRule).toMatch(/transform:\s*translateY\(-2px\)\s*rotate\(45deg\)\s*!important;/);
    expect(panelMessagesRule).toBeDefined();
    expect(panelMessagesRule).toMatch(/height:\s*auto\s*!important;/);
  });

  it("keeps the chatbot fallback response removed from source and manual QA", () => {
    const chatWidgetSource = readFileSync(resolve(process.cwd(), "components/ChatWidget.tsx"), "utf8");
    const chatRouteSource = readFileSync(resolve(process.cwd(), "app/api/chat/route.ts"), "utf8");
    const manualQaSource = readFileSync(resolve(process.cwd(), "../docs/manual-qa/MVP-VISUAL-SLICE-QA.md"), "utf8");

    expect(chatWidgetSource).toContain("An error occurred while sending the chat message. Please try again.");
    expect(chatWidgetSource).not.toMatch(/Please leave your contact details|placeholder chatbot|fallback response/i);
    expect(chatRouteSource).not.toMatch(/PlaceholderChatProvider|Please leave your contact details|fake assistant|canned assistant/i);
    expect(manualQaSource).toContain("chat unavailable/error behavior");
  });
});
