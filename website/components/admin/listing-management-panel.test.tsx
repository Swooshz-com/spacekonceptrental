import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ListingManagementPanel,
  type ListingManagementCategory,
  type ListingManagementProduct
} from "./listing-management-panel";

const sourcePath = resolve(
  process.cwd(),
  "components/admin/listing-management-panel.tsx"
);
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
  status: "draft",
  sortOrder: 10,
  imageCount: 0
};
const weakListing: ListingManagementProduct = {
  id: "33333333-3333-4333-8333-333333333333",
  slug: "draft-banquet-chair",
  name: "Draft Banquet Chair",
  rentalUnit: "",
  status: "draft",
  sortOrder: 20,
  imageCount: 0
};
const publishedImageWithoutAlt: ListingManagementProduct = {
  ...listing,
  status: "published",
  imageCount: 1,
  primaryImageAltText: ""
};
const publicReadyListing: ListingManagementProduct = {
  ...listing,
  id: "44444444-4444-4444-8444-444444444444",
  slug: "public-ready-lounge",
  name: "Public Ready Lounge",
  status: "published",
  imageCount: 2,
  primaryImageAltText: "Modular lounge arranged for an event rental setup"
};
const rawProof = "raw-product-proof-that-must-not-render";

function readSource() {
  return readFileSync(sourcePath, "utf8");
}

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body)
  } as unknown as Response;
}

function createSuccessfulFetchMock() {
  return vi
    .fn()
    .mockResolvedValueOnce(
      jsonResponse({
        ok: true,
        csrfProof: rawProof,
        expiresAt: Date.now() + 60_000
      })
    )
    .mockResolvedValueOnce(
      jsonResponse({
        ok: true,
        record: {
          id: listing.id
        }
      })
    );
}

function getLastRequestBody(fetcher: ReturnType<typeof createSuccessfulFetchMock>) {
  return JSON.parse(String(fetcher.mock.calls[1][1]?.body)) as Record<string, unknown>;
}

describe("listing management panel", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders metadata-only listing controls without ecommerce or image upload flows", () => {
    render(
      <ListingManagementPanel categories={[category]} products={[listing]} />
    );

    expect(
      screen.getByRole("heading", { name: /listing management/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/new listing category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/new listing slug/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create listing/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save listing metadata/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /set modular lounge to public visibility/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /archive listing modular lounge/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/cart|checkout|payment|customer account|stock reservation|order fulfilment|online ordering/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/image upload|storage path/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });

  it("shows scan-friendly public-ready listing cues and navigation links", () => {
    render(
      <ListingManagementPanel categories={[category]} products={[listing]} />
    );

    const listingCard = screen.getByRole("article", {
      name: /listing content modular lounge/i
    });
    const card = within(listingCard);

    expect(
      card.getByRole("heading", { name: /modular lounge/i })
    ).toBeInTheDocument();
    expect(card.getByText(/category\/type/i)).toBeInTheDocument();
    expect(card.getByText(/Lounge category/i)).toBeInTheDocument();
    expect(card.getByText(/public slug/i)).toBeInTheDocument();
    expect(card.getByText("modular-lounge")).toBeInTheDocument();
    expect(card.getByText(/^Visibility$/)).toBeInTheDocument();
    expect(card.getByText(/draft - protected/i)).toBeInTheDocument();
    expect(card.getByText(/^Rental unit$/)).toBeInTheDocument();
    expect(card.getByText("set")).toBeInTheDocument();
    expect(card.getByText(/image\/fallback/i)).toBeInTheDocument();
    expect(card.getAllByText(/missing image or fallback image/i).length)
      .toBeGreaterThan(0);
    expect(
      card.getByRole("heading", { name: /public-ready listing helper/i })
    ).toBeInTheDocument();
    expect(card.getByText(/missing primary public image/i)).toBeInTheDocument();
    expect(card.getByText(/short description present/i)).toBeInTheDocument();
    expect(
      card.getByRole("link", { name: /view public listing modular lounge/i })
    ).toHaveAttribute("href", "/listings/modular-lounge");
    expect(
      card.getByRole("link", { name: /edit listing modular lounge/i })
    ).toHaveAttribute("href", "#listing-form-22222222-2222-4222-8222-222222222222");
    expect(
      card.getByRole("link", { name: /return to catalogue admin/i })
    ).toHaveAttribute("href", "/admin/catalogue");
  });

  it("summarises missing public-ready content and the next admin action for weak listings", () => {
    render(
      <ListingManagementPanel categories={[category]} products={[weakListing]} />
    );

    const listingCard = screen.getByRole("article", {
      name: /listing content draft banquet chair/i
    });
    const card = within(listingCard);

    expect(card.getByText(/public-ready status/i)).toBeInTheDocument();
    expect(card.getByText(/needs admin fixes before public listing review/i)).toBeInTheDocument();
    expect(card.getByText(/listing is draft and not publicly visible/i)).toBeInTheDocument();
    expect(card.getByText(/missing category assignment/i)).toBeInTheDocument();
    expect(card.getByText(/missing short description/i)).toBeInTheDocument();
    expect(card.getByText(/missing rental details/i)).toBeInTheDocument();
    expect(card.getByText(/missing active public image/i)).toBeInTheDocument();
    expect(card.getByText(/missing primary public image/i)).toBeInTheDocument();
    expect(card.getByText(/missing primary image alt text/i)).toBeInTheDocument();
    expect(
      card.getByText(/next admin action: add public listing copy and public image coverage before setting public visibility/i)
    ).toBeInTheDocument();
    expect(
      card.getByRole("link", { name: /manage images draft banquet chair/i })
    ).toHaveAttribute(
      "href",
      "/admin/catalogue#update-listing-image-metadata"
    );
  });

  it("keeps Catalogue helper actions on six-page admin anchors only", () => {
    render(
      <ListingManagementPanel categories={[category]} products={[listing]} />
    );

    const body = document.body.textContent ?? "";

    expect(
      screen.getByRole("link", { name: /return to catalogue admin/i })
    ).toHaveAttribute("href", "/admin/catalogue");
    expect(
      screen.getByRole("link", { name: /manage images modular lounge/i })
    ).toHaveAttribute(
      "href",
      "/admin/catalogue#update-listing-image-metadata"
    );
    expect(body).not.toContain("/admin/media");
    expect(body).not.toContain("/admin/listings");
  });

  it("separates active image coverage from primary alt-text gaps for published listings", () => {
    render(
      <ListingManagementPanel
        categories={[category]}
        products={[publishedImageWithoutAlt, publicReadyListing]}
      />
    );

    const needsAltCard = within(
      screen.getAllByRole("article", {
        name: /listing content modular lounge/i
      })[0]
    );
    const readyCard = within(
      screen.getByRole("article", {
        name: /listing content public ready lounge/i
      })
    );

    expect(needsAltCard.getByText(/active public image present/i)).toBeInTheDocument();
    expect(needsAltCard.getByText(/missing primary public image/i)).toBeInTheDocument();
    expect(needsAltCard.getByText(/missing primary image alt text/i)).toBeInTheDocument();
    expect(
      needsAltCard.getByText(/next admin action: choose a primary public image and add public image alt text/i)
    ).toBeInTheDocument();
    expect(readyCard.getByText(/public-ready status/i)).toBeInTheDocument();
    expect(readyCard.getByText(/ready for public listing review/i)).toBeInTheDocument();
    expect(readyCard.getByText(/primary image alt text present/i)).toBeInTheDocument();
  });

  it("uses visible MVP listing guidance without old internal ladder wording", () => {
    render(
      <ListingManagementPanel categories={[category]} products={[listing]} />
    );

    expect(
      screen.getByRole("heading", { name: /public-ready listing summary/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This summary is based on existing listing metadata/i)
    ).toBeInTheDocument();
    expect(
      (document.body.textContent ?? "").match(/public-ready listings/g) ?? []
    ).toHaveLength(1);
    expect(document.body.textContent).not.toMatch(
      /readiness|phase|governance|provider handoff|CRM handoff|sync readiness|workflow readiness|future sync|future integration|provider sync|automation handoff|owner approval|evidence|deployment/i
    );
  });

  it("separates routine saves from visibility and archive actions", () => {
    render(
      <ListingManagementPanel categories={[category]} products={[listing]} />
    );

    expect(
      screen.getByRole("region", {
        name: /visibility and archive actions for modular lounge/i
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/visibility and archive actions change public browsing/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save listing metadata/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /set modular lounge to public visibility/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /archive listing modular lounge/i })
    ).toBeInTheDocument();
  });

  it("requests a product CSRF proof and creates listings through the product route with approved payload fields only", async () => {
    const fetcher = createSuccessfulFetchMock();
    const onMutationComplete = vi.fn();

    render(
      <ListingManagementPanel
        categories={[category]}
        products={[listing]}
        fetcher={fetcher}
        onMutationComplete={onMutationComplete}
      />
    );

    fireEvent.change(screen.getByLabelText(/new listing category/i), {
      target: {
        value: category.id
      }
    });
    fireEvent.change(screen.getByLabelText(/new listing slug/i), {
      target: {
        value: "cocktail-table"
      }
    });
    fireEvent.change(screen.getByLabelText(/new listing name/i), {
      target: {
        value: "Cocktail Table"
      }
    });
    fireEvent.change(screen.getByLabelText(/new listing short description/i), {
      target: {
        value: "Compact event table"
      }
    });
    fireEvent.change(screen.getByLabelText(/new listing description/i), {
      target: {
        value: "A metadata-only furniture listing."
      }
    });
    fireEvent.change(screen.getByLabelText(/new listing rental unit/i), {
      target: {
        value: "piece"
      }
    });
    fireEvent.change(screen.getByLabelText(/new listing status/i), {
      target: {
        value: "published"
      }
    });
    fireEvent.change(screen.getByLabelText(/new listing sort order/i), {
      target: {
        value: "30"
      }
    });
    fireEvent.click(screen.getByRole("button", { name: /create listing/i }));

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));

    expect(fetcher.mock.calls[0][0]).toBe("/api/admin/csrf-proof");
    expect(fetcher.mock.calls[0][1]).toMatchObject({
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toMatchObject({
      requestedOperation: "product.write",
      operation: "product.write"
    });
    expect(fetcher.mock.calls[1][0]).toBe("/api/admin/products");
    expect(fetcher.mock.calls[1][1]).toMatchObject({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-proof": rawProof
      }
    });
    expect(getLastRequestBody(fetcher)).toEqual({
      categoryId: category.id,
      slug: "cocktail-table",
      name: "Cocktail Table",
      shortDescription: "Compact event table",
      description: "A metadata-only furniture listing.",
      rentalUnit: "piece",
      status: "published",
      sortOrder: 30
    });
    expect(Object.keys(getLastRequestBody(fetcher)).sort()).toEqual([
      "categoryId",
      "description",
      "name",
      "rentalUnit",
      "shortDescription",
      "slug",
      "sortOrder",
      "status"
    ]);
    expect(onMutationComplete).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(rawProof)).not.toBeInTheDocument();
  });

  it("updates listings through the product id route with the proof header", async () => {
    const fetcher = createSuccessfulFetchMock();

    render(
      <ListingManagementPanel
        categories={[category]}
        products={[listing]}
        fetcher={fetcher}
        onMutationComplete={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/listing name for modular lounge/i), {
      target: {
        value: "Premium Modular Lounge"
      }
    });
    fireEvent.click(
      screen.getByRole("button", { name: /save listing metadata/i })
    );

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));

    expect(fetcher.mock.calls[1][0]).toBe(
      "/api/admin/products/22222222-2222-4222-8222-222222222222"
    );
    expect(fetcher.mock.calls[1][1]).toMatchObject({
      method: "POST",
      headers: {
        "x-csrf-proof": rawProof
      }
    });
    expect(getLastRequestBody(fetcher)).toMatchObject({
      categoryId: category.id,
      slug: "modular-lounge",
      name: "Premium Modular Lounge",
      shortDescription: "Soft modular seating",
      description: "Existing full modular lounge listing description.",
      rentalUnit: "set",
      status: "draft",
      sortOrder: 10
    });
  });

  it("publishes and unpublishes listings through status updates without ecommerce language", async () => {
    const publishFetcher = createSuccessfulFetchMock();
    const publishedListing: ListingManagementProduct = {
      ...listing,
      status: "published"
    };
    const unpublishFetcher = createSuccessfulFetchMock();
    const { rerender } = render(
      <ListingManagementPanel
        categories={[category]}
        products={[listing]}
        fetcher={publishFetcher}
        onMutationComplete={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /set modular lounge to public visibility/i })
    );
    await waitFor(() => expect(publishFetcher).toHaveBeenCalledTimes(2));
    expect(getLastRequestBody(publishFetcher)).toEqual({
      status: "published"
    });

    rerender(
      <ListingManagementPanel
        categories={[category]}
        products={[publishedListing]}
        fetcher={unpublishFetcher}
        onMutationComplete={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /set modular lounge to draft visibility/i })
    );
    await waitFor(() => expect(unpublishFetcher).toHaveBeenCalledTimes(2));
    expect(getLastRequestBody(unpublishFetcher)).toEqual({
      status: "draft"
    });
    expect(
      screen.queryByText(/cart|checkout|payment|customer account|stock reservation|order fulfilment|online ordering/i)
    ).not.toBeInTheDocument();
  });

  it("archives listings through the archive route without hard delete", async () => {
    const fetcher = createSuccessfulFetchMock();

    render(
      <ListingManagementPanel
        categories={[category]}
        products={[listing]}
        fetcher={fetcher}
        onMutationComplete={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /archive listing modular lounge/i })
    );

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));

    expect(fetcher.mock.calls[1][0]).toBe(
      "/api/admin/products/22222222-2222-4222-8222-222222222222/archive"
    );
    expect(fetcher.mock.calls[1][1]).toMatchObject({
      method: "POST",
      headers: {
        "x-csrf-proof": rawProof
      },
      body: "{}"
    });
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("DELETE");
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });

  it("renders only generic failures and never raw proof values", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          ok: true,
          csrfProof: rawProof
        })
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            ok: false,
            error: "sql provider stack token cookie"
          },
          false
        )
      );

    render(
      <ListingManagementPanel
        categories={[category]}
        products={[listing]}
        fetcher={fetcher}
        onMutationComplete={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /save listing metadata/i })
    );

    expect(
      await screen.findByText(/protected admin save could not be completed/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/sql provider stack token cookie/i)).not.toBeInTheDocument();
    expect(screen.queryByText(rawProof)).not.toBeInTheDocument();
  });

  it("keeps browser listing management source free of forbidden runtime paths", () => {
    const source = readSource();

    expect(source).toContain('"use client";');
    expect(source).not.toContain("@supabase/");
    expect(source).not.toContain("lib/supabase");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(source).not.toContain("service-role");
    expect(source).not.toMatch(/\bdelete\s*\(/i);
    expect(source).not.toContain('method: "DELETE"');
    expect(source).not.toMatch(/upload|storageBucket|storagePath|Storage/i);
    expect(source).not.toContain("/admin/media");
    expect(source).not.toContain("/admin/listings");
    expect(source).not.toMatch(/cart|checkout|payment|customer account|stock reservation|order fulfilment|online ordering/i);
  });
});
