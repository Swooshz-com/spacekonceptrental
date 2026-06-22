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

describe("public page shells", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders honest catalogue recovery when Supabase data is unavailable", async () => {
    render(await CataloguePage());

    expect(
      screen.getByRole("heading", {
        name: /furniture catalogue for event rentals/i
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no public rental items are available right now/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /submit enquiry/i })
    ).toHaveAttribute("href", "/quote");
    expect(
      screen.queryByRole("heading", { name: /lounge sofa package/i })
    ).not.toBeInTheDocument();
  });

  it("renders a conversion-focused rental homepage with quote and listing CTAs", async () => {
    render(await HomePage());

    const homepageSource = readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf8");

    expect(
      screen.getByRole("heading", {
        name: /curated rental pieces for intentional event spaces/i
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/browse individual furniture rentals or styled setups/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /browse catalogue/i })[0]
    ).toHaveAttribute("href", "/catalogue");
    expect(
      screen.getAllByRole("link", { name: /view setups/i })[0]
    ).toHaveAttribute("href", "/listings");
    expect(
      screen.getByRole("link", { name: /your selection/i })
    ).toHaveAttribute("href", "/quote");
    expect(
      screen.getByRole("heading", { name: /start with pieces or a complete setup/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /a quote request, then direct team review/i })
    ).toBeInTheDocument();
    for (const step of [/browse the catalogue/i, /share event details/i, /team follow-up/i]) {
      expect(screen.getByRole("heading", { name: step })).toBeInTheDocument();
    }
    expect(
      screen.getByText(/follows up directly to shape the proposal/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /quiet anchors for high-touch event environments/i })
    ).toBeInTheDocument();
    expect(homepageSource).not.toMatch(
      /cart|checkout|payment|purchase|customer account|customer dashboard|booking|reservation|stock reservation|order fulfilment|online ordering/i
    );
    expect(
      screen.getByText(/no public rental listings are available right now/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /submit enquiry/i })
    ).toHaveAttribute("href", "/quote");
    expect(
      screen.queryByAltText(/lounge sofa package furniture rental setup/i)
    ).not.toBeInTheDocument();
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

    expect(screen.getByRole("heading", { name: /shape your rental enquiry/i })).toBeInTheDocument();
    expect(screen.getByText(/review your selection, add contact and event details/i)).toBeInTheDocument();
    expect(screen.queryByText(/shell|mvp/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        /cart|checkout|payment|customer account|stock reservation|order fulfilment|online ordering|confirmed order/i
      )
    ).not.toBeInTheDocument();
    expect(rootMetadata.description).toMatch(/space koncept rental catalogue/i);
    expect(rootMetadata.description).toMatch(/manual team follow-up/i);
    expect(rootMetadata.description).not.toMatch(/shell|mvp|checkout|payment|online ordering/i);
  });

  it("renders practical public Privacy Policy and Terms of Use pages", () => {
    const layoutSource = readFileSync(resolve(process.cwd(), "app/layout.tsx"), "utf8");

    expect(layoutSource).toContain('href="/privacy"');
    expect(layoutSource).toContain('href="/terms"');
    expect(privacyMetadata.title).toMatch(/Privacy Policy/i);
    expect(termsMetadata.title).toMatch(/Terms of Use/i);

    render(<PrivacyPage />);

    expect(
      screen.getByRole("heading", { name: /Privacy Policy/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/manual follow-up/i)).toBeInTheDocument();
    expect(screen.getByText(/configured chat provider/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Terms of Use/i })
    ).toHaveAttribute("href", "/terms");
    expect(document.body.textContent).not.toMatch(
      /cart|checkout|payment|purchase|booking|reservation|fulfilment|fulfillment|stock reservation|customer account|dashboard/i
    );

    cleanup();
    render(<TermsPage />);

    expect(
      screen.getByRole("heading", { name: /Terms of Use/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/manual follow-up/i)).toBeInTheDocument();
    expect(screen.getByText(/does not finalise rental details online/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Privacy Policy/i })
    ).toHaveAttribute("href", "/privacy");
    expect(document.body.textContent).not.toMatch(
      /cart|checkout|payment|purchase|booking|reservation|fulfilment|fulfillment|stock reservation|customer account|dashboard/i
    );
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

    expect(homeMetadata.description).toMatch(/manual team follow-up/i);
    expect(homeMetadata.openGraph?.title).toMatch(/event furniture rental catalogue/i);
    expect(homeMetadata.openGraph?.description).toMatch(/quote request/i);
    expect(catalogueMetadata.openGraph?.url).toBe("/catalogue");
    expect(catalogueMetadata.openGraph?.description).toMatch(
      /public rental items/i
    );
    expect(listingMetadata.openGraph?.title).toMatch(/furniture listing/i);
    expect(listingMetadata.openGraph?.description).toMatch(/submit a rental enquiry/i);
    expect(fallbackListingMetadata.openGraph?.description).toMatch(
      /event furniture rental/i
    );
    expect(publicListingMetadata.openGraph?.title).toMatch(/rental setup/i);
    expect(publicListingMetadata.openGraph?.description).toMatch(/quote request/i);
    expect(quoteMetadata.openGraph?.title).toMatch(/request quote/i);
    expect(quoteMetadata.openGraph?.description).toMatch(/manual follow-up/i);
    expect(metadataPayload).not.toMatch(
      /cart|checkout|payment|purchase|customer account|customer dashboard|booking|reservation|stock reservation|order fulfilment|online ordering|readiness|governance|phase/i
    );
  });

  it("keeps the new public pages reachable from navigation and catalogue", async () => {
    const layoutSource = readFileSync(resolve(process.cwd(), "app/layout.tsx"), "utf8");

    expect(layoutSource).toContain('href="/events"');
    expect(layoutSource).toContain('href="/privacy"');
    expect(layoutSource).toContain('href="/terms"');

    render(
      <CataloguePageContent
        catalogue={{
          source: "supabase",
          categories: [
            {
              id: "category-lounge",
              slug: "lounge",
              name: "Lounge",
              sortOrder: 10
            }
          ],
          products: [
            {
              id: "listing-lounge-sofa-package",
              slug: "lounge-sofa-package",
              name: "Lounge Sofa Package",
              shortDescription: "Soft seating for receptions.",
              rentalUnit: "set",
              sortOrder: 10,
              categoryId: "category-lounge",
              categoryName: "Lounge",
              source: "supabase"
            }
          ]
        }}
      />
    );

    expect(
      screen.queryByRole("link", { name: /view rental listing shell/i })
    ).not.toBeInTheDocument();

    const catalogueLinks = screen.getAllByRole("link", { name: /view details for/i });
    expect(
      catalogueLinks.map((link) => link.getAttribute("href"))
    ).toContain("/catalogue/lounge-sofa-package");
    const quoteLinks = screen.getAllByRole("link", { name: /add lounge sofa package to quote/i });
    expect(quoteLinks.map((link) => link.getAttribute("href"))).toContain(
      "/quote?listing=lounge-sofa-package"
    );
    expect(
      catalogueLinks.some((link) => link.classList.contains("card-link--primary"))
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
    expect(screen.getByText(/no public rental items are available right now/i)).toBeInTheDocument();
    expect(
      screen.getByText(/real published records will appear here when catalogue data is configured/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /submit enquiry/i })
    ).toHaveAttribute("href", "/quote");
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
      screen.getByText(/Use the catalogue or listings to keep browsing public rental options/i)
    ).toBeInTheDocument();
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
      screen.getByText(/Use current listings or categories to keep browsing public rental options/i)
    ).toBeInTheDocument();
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
      screen.getByText(/1 item/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/published lounge set/i)).toBeInTheDocument();
    expect(
      screen.getByText("modular-lounge-set")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /add modular lounge set to quote/i
      })
    ).toHaveAttribute("href", "/quote?listing=modular-lounge-set");
    expect(
      screen.getByRole("link", { name: /view details for modular lounge set/i })
    ).toHaveAttribute("href", "/catalogue/modular-lounge-set");
    expect(screen.queryByText(/draft/i)).not.toBeInTheDocument();
  });

  it("renders listing search results with summary and reset affordances", async () => {
    render(
      <CataloguePageContent
        activeSearch="seminar"
        catalogue={{
          source: "supabase",
          categories: [],
          products: [
            {
              id: "listing-seminar-chair",
              slug: "dining-and-seminar-chairs",
              name: "Dining and seminar chairs",
              shortDescription: "Clean seating for seminars.",
              rentalUnit: "item",
              sortOrder: 10,
              source: "supabase"
            }
          ]
        }}
        detailBasePath="/listings"
        listingBasePath="/listings"
        title="Furniture rental listings"
      />
    );

    expect(
      screen.getByRole("heading", { name: /furniture rental listings/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/1 setup/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/showing results for seminar/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /dining and seminar chairs/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /lounge sofa package/i })
    ).not.toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: /all pieces/i })
        .map((link) => link.getAttribute("href"))
    ).toContain("/listings");
    expect(
      screen.getByRole("link", {
        name: /add dining and seminar chairs to quote/i
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
    expect(screen.getAllByText(/reference/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("modular-lounge-set").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /before you enquire/i })).toBeInTheDocument();
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

    render(
      <ProductPageContent
        product={{
          id: "product-published",
          slug: "modular-lounge-set",
          name: "Modular Lounge Set",
          shortDescription: "Published lounge set.",
          description: "Published details for a lounge set.",
          rentalUnit: "set",
          sortOrder: 10,
          source: "supabase"
        }}
      />
    );
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
    expect(
      screen.getByRole("link", { name: /view details for compact chair/i })
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: /add compact chair to quote/i })
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
      "Confirm the homepage explains the enquiry path: browse catalogue/listings, view listing details before requesting a quote, submit an editable quote request, and team manual follow-up",
      "Confirm quote-prep guidance names event date, venue or location, requested rental listings/items, approximate quantities, setup/access/timing notes, and alternates",
      "Confirm homepage trust cues explain that visitors share event/rental details for manual follow-up and that the site does not create an instant rental confirmation",
      "Confirm homepage guidance CTAs reach the catalogue, rental listings, and the quote request",
      "Browse catalogue/listing cards",
      "Submit a quote/enquiry request",
      "Confirm the success receipt",
      "Confirm chat unavailable/error behavior shows an error message and does not show a fake/canned assistant response",
      "Open protected admin quote requests",
      "Confirm the main quote card shows source context and a manual follow-up checklist",
      "Confirm the main quote card does not show old CRM handoff placeholder, provider, contact ID, deal ID, or per-enquiry queue-prep controls",
      "Update internal triage status",
      "Run a basic mobile smoke pass across homepage, catalogue cards, listing detail media, quote form, quote receipt, admin quote inbox, and admin listing/media management",
      "This checklist is for final MVP acceptance, not launch governance or provider readiness",
      "Confirm no cart, checkout, payment, order, booking, reservation, customer account, or provider-sync flow appears"
    ]) {
      expect(manualQaSource).toContain(requiredStep);
    }
    expect(manualQaSource).toContain("Supabase-backed quote persistence");
    expect(manualQaSource).not.toMatch(/owner-review|governance ladder|HubSpot sync/i);
  });

  it("keeps responsive smoke CSS safeguards for compact MVP screens", () => {
    const styles = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");

    expect(styles).toMatch(/overflow-wrap:\s*anywhere/i);
    expect(styles).toMatch(
      /@media\s*\(max-width:\s*560px\)[\s\S]*\.hero__actions[\s\S]*grid-template-columns:\s*1fr/i
    );
    expect(styles).toMatch(
      /@media\s*\(max-width:\s*560px\)[\s\S]*\.button[\s\S]*width:\s*100%/i
    );
    expect(styles).toMatch(
      /@media\s*\(max-width:\s*560px\)[\s\S]*\.chat-widget[\s\S]*max-height:\s*calc\(100vh - 24px\)/i
    );
  });

  it("keeps the chatbot fallback response removed from source and manual QA", () => {
    const chatWidgetSource = readFileSync(
      resolve(process.cwd(), "components/ChatWidget.tsx"),
      "utf8"
    );
    const chatRouteSource = readFileSync(
      resolve(process.cwd(), "app/api/chat/route.ts"),
      "utf8"
    );
    const manualQaSource = readFileSync(
      resolve(process.cwd(), "../docs/manual-qa/MVP-VISUAL-SLICE-QA.md"),
      "utf8"
    );

    expect(chatWidgetSource).toContain(
      "An error occurred while sending the chat message. Please try again."
    );
    expect(chatWidgetSource).not.toMatch(
      /Please leave your contact details|placeholder chatbot|fallback response/i
    );
    expect(chatRouteSource).not.toMatch(
      /PlaceholderChatProvider|Please leave your contact details|fake assistant|canned assistant/i
    );
    expect(manualQaSource).toContain("chat unavailable/error behavior");
  });
});
