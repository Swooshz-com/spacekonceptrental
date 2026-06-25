import { cleanup, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PublicCatalogue, PublicCatalogueProduct } from "../lib/catalogue/types";
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
import EventsPage from "./events/page";
import ListingNotFound from "./listings/[slug]/not-found";
import { generateMetadata as generatePublicListingMetadata } from "./listings/[slug]/page";
import { metadata as rootMetadata } from "./layout";
import HomePage, { metadata as homeMetadata } from "./page";
import PrivacyPage, { metadata as privacyMetadata } from "./privacy/page";
import QuotePage, { metadata as quoteMetadata } from "./quote/page";
import TermsPage, { metadata as termsMetadata } from "./terms/page";

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
      screen.getByRole("heading", { name: /furnish your vision\. elevate every space/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/browse rental pieces, explore setup directions, and send an enquiry/i)
    ).toBeInTheDocument();
    expect(hrefsFor(/request quote/i)).toContain("/quote");
    expect(hrefsFor(/browse catalogue/i)).toContain("/catalogue");
    expect(hrefsFor(/explore setups/i)).toContain("/listings");
    expect(screen.getByRole("heading", { name: /furniture that shapes the room/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /start with the furniture type/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /rental pieces with room to adapt/i })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(forbiddenPublicCopy);
  });

  it("renders public events guidance without shell or MVP wording", () => {
    render(<EventsPage />);

    expect(document.body.textContent).toMatch(/event/i);
    expect(document.body.textContent).toMatch(/rental|setup/i);
    expect(document.body.textContent).not.toMatch(/shell|mvp/i);
    expect(document.body.textContent).not.toMatch(forbiddenPublicCopy);
  });

  it("keeps public quote copy request-only and preserves the real form entry point", async () => {
    render(await QuotePage());

    expect(screen.getByRole("heading", { name: /request a rental quote/i })).toBeInTheDocument();
    expect(screen.getAllByText(/this request does not confirm final rental details/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
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
    expect(screen.getByText(/manual follow-up/i)).toBeInTheDocument();
    expect(screen.getByText(/configured chat provider/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Terms of Use/i })).toHaveAttribute("href", "/terms");
    expect(document.body.textContent).not.toMatch(forbiddenPublicCopy);

    cleanup();
    render(<TermsPage />);

    expect(screen.getByRole("heading", { name: /Terms of Use/i })).toBeInTheDocument();
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
    expect(screen.getByRole("link", { name: /add modular lounge set to quote/i })).toHaveAttribute(
      "href",
      "/quote?listing=modular-lounge-set"
    );
    expect(screen.getByRole("link", { name: /view details for modular lounge set/i })).toHaveAttribute(
      "href",
      "/catalogue/modular-lounge-set"
    );
    expect(document.body.textContent).not.toMatch(forbiddenPublicCopy);
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

    expect(screen.getByRole("heading", { name: /modular lounge set/i })).toBeInTheDocument();
    expect(screen.getByText(/published lounge set/i)).toBeInTheDocument();
    expect(screen.getByText(/listing reference/i)).toBeInTheDocument();
    expect(screen.getByText("modular-lounge-set")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /add to quote/i })).toHaveAttribute(
      "href",
      "/quote?listing=modular-lounge-set"
    );
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
    expect(styles).toMatch(/@media\s*\(max-width:/i);
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
