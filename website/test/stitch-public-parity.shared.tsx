import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import HomePage from "../app/page";
import { CataloguePageContent } from "../app/catalogue/page";
import { ProductPageContent } from "../app/catalogue/[slug]/page";
import { CategoriesPageContent } from "../app/categories/page";
import EventsPage from "../app/events/page";
import QuotePage from "../app/quote/page";
import QuoteRequestForm from "../components/QuoteRequestForm";
import { StitchSetupsPage } from "../components/PublicStitch";

vi.mock("next/image", () => ({
  default: ({ alt = "", src, ...props }: { alt?: string; src: string | { src: string } }) => (
    <img alt={alt} src={typeof src === "string" ? src : src.src} {...props} />
  )
}));

const sampleCatalogue = {
  source: "fallback",
  categories: [
    {
      id: "cat-lounge",
      slug: "lounge",
      name: "Lounge",
      description: "Lounge grouping for rental planning."
    }
  ],
  products: [
    {
      id: "prod-lounge",
      slug: "modular-lounge-set",
      name: "Modular Lounge Set",
      description: "Soft seating for reception spaces.",
      summary: "Soft seating for reception spaces.",
      categoryId: "cat-lounge",
      categoryName: "Lounge",
      rentalUnit: "set",
      imageAlt: "Modular Lounge Set furniture rental setup",
      imageUrl: "/assets/images/product_sofa.png"
    }
  ]
} as any;

const sampleProduct = sampleCatalogue.products[0];

const forbiddenPublicTerms = /cart|bag|basket|checkout|payment|purchase|booking|reservation|availability|stock|inventory|pricing|subtotal|fulfilment|fulfillment|confirmed delivery|confirmed booking|customer account|customer dashboard/i;

function visibleText() {
  return document.body.textContent ?? "";
}

export function runStitchPublicParitySuite(label: string) {
  describe(label, () => {
    afterEach(() => cleanup());

    it("renders the Stitch public journey with current route-specific UI", async () => {
      render(await HomePage());
      expect(screen.getByRole("heading", { name: /furnish your vision/i })).toBeInTheDocument();
      expect(screen.getAllByRole("link", { name: /request quote/i })[0]).toHaveAttribute("href", "/quote");
      expect(screen.getAllByRole("link", { name: /browse catalogue/i })[0]).toHaveAttribute("href", "/catalogue");
      expect(visibleText()).not.toMatch(forbiddenPublicTerms);
      cleanup();

      render(<CataloguePageContent catalogue={sampleCatalogue} />);
      expect(screen.getByRole("heading", { name: /furniture catalogue/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /add modular lounge set to quote/i })).toHaveAttribute("href", "/quote?listing=modular-lounge-set");
      expect(screen.getByRole("link", { name: /view details for modular lounge set/i })).toHaveAttribute("href", "/catalogue/modular-lounge-set");
      expect(visibleText()).toMatch(/browsing does not set aside furniture/i);
      expect(visibleText()).not.toMatch(forbiddenPublicTerms);
      cleanup();

      render(<StitchSetupsPage catalogue={sampleCatalogue} />);
      expect(screen.getByRole("heading", { name: /curated scapes/i })).toBeInTheDocument();
      expect(screen.getAllByRole("link", { name: /request quote/i })[0]).toHaveAttribute("href", "/quote");
      expect(screen.getAllByRole("link", { name: /browse catalogue/i })[0]).toHaveAttribute("href", "/catalogue");
      expect(visibleText()).not.toMatch(forbiddenPublicTerms);
    });

    it("keeps detail, category, event, and quote paths public-safe", async () => {
      render(<ProductPageContent product={sampleProduct} relatedListings={[sampleProduct]} />);
      expect(screen.getByRole("heading", { name: /modular lounge set/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /request a quote/i })).toHaveAttribute("href", "/quote?listing=modular-lounge-set");
      expect(screen.getByRole("link", { name: /back to catalogue/i })).toHaveAttribute("href", "/catalogue");
      expect(visibleText()).toMatch(/add quantities and alternatives/i);
      expect(visibleText()).toMatch(/does not set aside furniture or finish rental details/i);
      expect(visibleText()).not.toMatch(forbiddenPublicTerms);
      cleanup();

      render(<CategoriesPageContent catalogue={sampleCatalogue} />);
      expect(screen.getByRole("heading", { name: /browse by category/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /compare/i })).toHaveAttribute("href", "/listings?category=lounge");
      expect(screen.getByRole("link", { name: /send an enquiry/i })).toHaveAttribute("href", "/quote");
      expect(visibleText()).not.toMatch(forbiddenPublicTerms);
      cleanup();

      render(<EventsPage />);
      expect(screen.getByRole("heading", { name: /plan an event setup/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /browse setups/i })).toHaveAttribute("href", "/listings");
      expect(screen.getByRole("link", { name: /start a rental enquiry/i })).toHaveAttribute("href", "/quote");
      expect(screen.getByAltText(/corporate reception event furniture setup/i)).toBeInTheDocument();
      expect(visibleText()).not.toMatch(forbiddenPublicTerms);
      cleanup();

      render(await QuotePage());
      expect(screen.getByRole("heading", { name: /request a rental quote/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /enquiry details/i })).toBeInTheDocument();
      expect(visibleText()).toMatch(/enquiry intake only/i);
      expect(visibleText()).not.toMatch(forbiddenPublicTerms);
    });

    it("preserves empty-state recovery and quote receipt safety", () => {
      render(<CataloguePageContent catalogue={{ source: "fallback", categories: [], products: [] } as any} />);
      expect(screen.getByRole("heading", { name: /no public rental listings are available right now/i })).toBeInTheDocument();
      expect(screen.getAllByRole("link", { name: /request quote/i })[0]).toHaveAttribute("href", "/quote");
      expect(visibleText()).not.toMatch(forbiddenPublicTerms);
      cleanup();

      render(<QuoteRequestForm initialItemsText="Modular Lounge Set" />);
      expect(screen.getByText(/rental fit is reviewed directly by the team/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /submit enquiry/i })).toBeInTheDocument();
      expect(visibleText()).not.toMatch(/track|status page|guaranteed|response time/i);
      expect(visibleText()).not.toMatch(forbiddenPublicTerms);
    });
  });
}
