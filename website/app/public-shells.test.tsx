import { cleanup, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  PublicCatalogue,
  PublicCatalogueProduct
} from "../lib/catalogue/types";
import {
  CataloguePageContent,
  default as CataloguePage
} from "./catalogue/page";
import {
  ProductPageContent,
  default as ProductPage
} from "./catalogue/[slug]/page";
import CatalogueListingNotFound from "./catalogue/[slug]/not-found";
import EventsPage from "./events/page";
import ListingNotFound from "./listings/[slug]/not-found";
import ListingsPage from "./listings/page";
import { metadata } from "./layout";
import HomePage from "./page";
import QuotePage from "./quote/page";

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string | { src: string } }) => (
    <img alt={alt} src={typeof src === "string" ? src : src.src} />
  )
}));

describe("public page shells", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the static product detail copy when Supabase env is missing", async () => {
    render(await ProductPage());

    expect(
      screen.getByRole("heading", { name: /lounge sofa package/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /rental details/i })).toBeInTheDocument();
    expect(screen.getByText(/view rental listing/i)).toBeInTheDocument();
    expect(
      screen.getByText(/this listing carries into the enquiry form/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to catalogue/i })
    ).toHaveAttribute("href", "/catalogue");
    expect(
      screen.getByRole("link", { name: /request a quote/i })
    ).toHaveAttribute("href", "/quote?listing=lounge-sofa-package");
  });

  it("renders a conversion-focused rental homepage with quote and listing CTAs", async () => {
    render(await HomePage());

    const homepageSource = readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf8");

    expect(
      screen.getByRole("heading", {
        name: /event furniture rental for planned spaces/i
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/browse rental listings, choose useful catalogue details, and send one enquiry for team follow-up/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /request a quote/i })[0]
    ).toHaveAttribute("href", "/quote");
    expect(
      screen.getAllByRole("link", { name: /browse listings/i })[0]
    ).toHaveAttribute("href", "/listings");
    expect(
      screen.getByRole("heading", { name: /how rental enquiries work/i })
    ).toBeInTheDocument();
    for (const step of [
      /browse catalogue and listings/i,
      /view rental listing details/i,
      /submit an editable quote request/i,
      /team reviews event details/i
    ]) {
      expect(screen.getByRole("heading", { name: step })).toBeInTheDocument();
    }
    expect(
      screen.getByText(/team follows up directly using the contact details you share/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /what to prepare before you enquire/i })
    ).toBeInTheDocument();
    for (const guidance of [
      /event date if known/i,
      /venue or location/i,
      /requested rental listings or items/i,
      /approximate quantities/i,
      /setup, access, and timing notes/i,
      /alternates if flexible/i
    ]) {
      expect(screen.getByText(guidance)).toBeInTheDocument();
    }
    expect(
      screen
        .getAllByRole("link", { name: /browse rental listings/i })
        .map((link) => link.getAttribute("href"))
    ).toContain("/listings");
    expect(
      screen
        .getAllByRole("link", { name: /start a quote request/i })
        .map((link) => link.getAttribute("href"))
    ).toContain("/quote");
    expect(homepageSource).not.toMatch(
      /cart|checkout|payment|purchase|customer account|customer dashboard|booking|reservation|stock reservation|order fulfilment|online ordering/i
    );
    for (const useCase of [
      /corporate events/i,
      /weddings/i,
      /exhibitions/i,
      /gala lounges/i
    ]) {
      expect(screen.getByRole("heading", { name: useCase })).toBeInTheDocument();
    }
    expect(
      screen.getByRole("heading", { name: /featured rental listings/i })
    ).toBeInTheDocument();
    expect(
      screen.getByAltText(/lounge sofa package furniture rental setup/i)
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: /view rental listing/i })
        .map((link) => link.getAttribute("href"))
    ).toContain("/listings/lounge-sofa-package");
    expect(
      screen.queryByText(
        /cart|checkout|payment|customer account|stock reservation|order fulfilment|online ordering/i
      )
    ).not.toBeInTheDocument();
  });

  it("renders public events copy with event and furniture rental language", () => {
    render(<EventsPage />);

    expect(
      screen.getByRole("heading", { name: /events/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/event rentals/i)).toBeInTheDocument();
    expect(screen.getByText(/furniture rentals/i)).toBeInTheDocument();
    expect(screen.getByText(/styled setups/i)).toBeInTheDocument();
    expect(screen.getByText(/corporate receptions/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /compare event setup guidance/i })
    ).toHaveAttribute("href", "/catalogue");
    expect(
      screen.getByRole("link", { name: /start a rental enquiry/i })
    ).toHaveAttribute("href", "/quote");
  });

  it("keeps public events copy free from shell and MVP wording", () => {
    render(<EventsPage />);

    expect(screen.queryByText(/shell/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/mvp/i)).not.toBeInTheDocument();
  });

  it("keeps public quote copy from implying ecommerce or online ordering", async () => {
    render(await QuotePage());

    expect(screen.getByRole("heading", { name: /request a rental quote/i })).toBeInTheDocument();
    expect(screen.getByText(/share contact details, event date, venue, requested listings, quantities, and setup notes/i)).toBeInTheDocument();
    expect(screen.queryByText(/shell|mvp/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        /cart|checkout|payment|customer account|stock reservation|order fulfilment|online ordering|confirmed order/i
      )
    ).not.toBeInTheDocument();
    expect(metadata.description).toMatch(/event furniture rental catalogue/i);
    expect(metadata.description).not.toMatch(/shell|mvp|checkout|payment|online ordering/i);
  });

  it("keeps the new public pages reachable from navigation and catalogue", async () => {
    const layoutSource = readFileSync(resolve(process.cwd(), "app/layout.tsx"), "utf8");

    expect(layoutSource).toContain('href="/events"');

    render(await CataloguePage());

    expect(
      screen.queryByRole("link", { name: /view rental listing shell/i })
    ).not.toBeInTheDocument();

    const catalogueLinks = screen.getAllByRole("link", { name: /view rental listing/i });
    expect(
      catalogueLinks.map((link) => link.getAttribute("href"))
    ).toContain("/catalogue/lounge-sofa-package");
    const quoteLinks = screen.getAllByRole("link", { name: /request a quote/i });
    expect(quoteLinks.map((link) => link.getAttribute("href"))).toContain(
      "/quote?listing=lounge-sofa-package"
    );
    expect(
      quoteLinks.some((link) => link.classList.contains("card-link--primary"))
    ).toBe(true);
  });

  it("renders a clean empty state when no public listings are available", () => {
    render(
      <CataloguePageContent
        catalogue={{
          source: "fallback",
          categories: [],
          products: []
        }}
      />
    );

    expect(
      screen.getByRole("heading", {
        name: /furniture catalogue for event rentals/i
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/no public rental listings are available right now/i)).toBeInTheDocument();
  });

  it("renders safe rental listing not-found states", () => {
    render(<CatalogueListingNotFound />);

    expect(
      screen.getByRole("heading", { name: /listing unavailable/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /view catalogue/i })
    ).toHaveAttribute("href", "/catalogue");
    expect(
      screen.getByRole("link", { name: /send an enquiry/i })
    ).toHaveAttribute("href", "/quote");
    expect(
      screen.queryByText(/draft|archived|internal note|workflow status/i)
    ).not.toBeInTheDocument();

    cleanup();
    render(<ListingNotFound />);

    expect(
      screen.getByRole("heading", { name: /listing unavailable/i })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /browse listings/i })[0]
    ).toHaveAttribute("href", "/listings");
    expect(
      screen.getByRole("link", { name: /send an enquiry/i })
    ).toHaveAttribute("href", "/quote");
  });

  it("renders published catalogue data supplied by the server read layer", () => {
    const catalogue: PublicCatalogue = {
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
      products: [
        {
          id: "product-published",
          slug: "modular-lounge-set",
          name: "Modular Lounge Set",
          shortDescription: "Published lounge set.",
          description: "Published details.",
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
        }
      ]
    };

    render(<CataloguePageContent catalogue={catalogue} />);

    expect(
      screen.getByRole("heading", { name: /modular lounge set/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /1 listing/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/published lounge set/i)).toBeInTheDocument();
    expect(
      screen.getByText(/listing reference: modular-lounge-set/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /request a quote for modular lounge set/i
      })
    ).toHaveAttribute("href", "/quote?listing=modular-lounge-set");
    expect(
      screen.getByRole("link", { name: /view rental listing details/i })
    ).toHaveAttribute("href", "/catalogue/modular-lounge-set");
    expect(screen.queryByText(/draft/i)).not.toBeInTheDocument();
  });

  it("renders listing search results with summary and reset affordances", async () => {
    render(
      await ListingsPage({
        searchParams: Promise.resolve({ search: "seminar" })
      })
    );

    expect(
      screen.getByRole("heading", { name: /furniture rental listings/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /1 listing/i })
    ).toBeInTheDocument();
    expect(screen.getByText("seminar", { selector: "dd" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /dining and seminar chairs/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /lounge sofa package/i })
    ).not.toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: /reset filters/i })
        .map((link) => link.getAttribute("href"))
    ).toContain("/listings");
    expect(
      screen.getByRole("link", {
        name: /request a quote for dining and seminar chairs/i
      })
    ).toHaveAttribute("href", "/quote?listing=dining-and-seminar-chairs");
  });

  it("renders published product detail data supplied by the server read layer", () => {
    const product: PublicCatalogueProduct = {
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

    render(<ProductPageContent product={product} />);

    expect(
      screen.getByRole("heading", { name: /modular lounge set/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/published details for a lounge set/i)).toBeInTheDocument();
    expect(screen.getAllByText(/listing reference/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("modular-lounge-set").length).toBeGreaterThan(0);
    expect(screen.getByText(/quote form starting text/i)).toBeInTheDocument();
    expect(screen.queryByText(/concept backdrop frame/i)).not.toBeInTheDocument();
  });

  it("keeps public listing pages free from shell and ecommerce-only copy", async () => {
    const catalogueSource = readFileSync(
      resolve(process.cwd(), "app/catalogue/page.tsx"),
      "utf8"
    );
    const detailSource = readFileSync(
      resolve(process.cwd(), "app/catalogue/[slug]/page.tsx"),
      "utf8"
    );

    expect(catalogueSource).not.toMatch(/listing shell/i);
    expect(detailSource).not.toMatch(/listing shell/i);
    expect(catalogueSource).not.toMatch(/supabase service role/i);
    expect(detailSource).not.toMatch(/supabase service role/i);
    expect(catalogueSource).not.toMatch(/createBrowserClient|supabaseBrowserClient/i);
    expect(detailSource).not.toMatch(/createBrowserClient|supabaseBrowserClient/i);

    render(await ProductPage());
    expect(
      screen.queryByText(/shell/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        /cart|checkout|payment|customer account|stock reservation|order fulfilment|online ordering/i
      )
    ).not.toBeInTheDocument();

    render(
      <CataloguePageContent
        catalogue={{
          source: "fallback",
          categories: [],
          products: [
            {
              id: "product-published",
              slug: "compact-chair",
              name: "Compact Chair",
              shortDescription: "Compact event chair.",
              rentalUnit: "item",
              sortOrder: 10,
              source: "fallback"
            }
          ]
        }}
      />
    );
    expect(screen.getByRole("link", { name: /view rental listing/i })).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: /request a quote/i })
        .map((link) => link.getAttribute("href"))
    ).toContain("/quote?listing=compact-chair");
    expect(screen.queryByText(/shell/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        /cart|checkout|payment|customer account|stock reservation|order fulfilment|online ordering/i
      )
    ).not.toBeInTheDocument();
  });

  it("documents a concise manual QA path for the visible public catalogue enquiry slice", () => {
    const manualQaSource = readFileSync(
      resolve(process.cwd(), "../docs/manual-qa/MVP-VISUAL-SLICE-QA.md"),
      "utf8"
    );

    for (const requiredStep of [
      "Open the homepage",
      "Confirm the homepage explains the enquiry path: browse catalogue/listings, view listing details, submit an editable quote request, and team follow-up",
      "Confirm quote-prep guidance names event date, venue or location, requested rental listings/items, approximate quantities, setup/access/timing notes, and alternates",
      "Confirm homepage guidance CTAs reach rental listings and the quote request",
      "Browse catalogue/listing cards",
      "Submit a quote/enquiry request",
      "Confirm the success receipt",
      "Open protected admin quote requests",
      "Confirm the main quote card shows source context and a manual follow-up checklist",
      "Confirm the main quote card does not show old CRM handoff placeholder, provider, contact ID, deal ID, or per-enquiry queue-prep controls",
      "Update internal triage status",
      "Confirm no cart, checkout, payment, order, booking, reservation, customer account, or provider-sync flow appears"
    ]) {
      expect(manualQaSource).toContain(requiredStep);
    }
    expect(manualQaSource).toContain("Supabase-backed quote persistence");
    expect(manualQaSource).not.toMatch(/owner-review|governance ladder|HubSpot sync/i);
  });
});
