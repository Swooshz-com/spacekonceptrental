import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
      screen.getByRole("button", { name: /save listing modular lounge/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /publish listing modular lounge/i })
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
      screen.getByRole("button", { name: /save listing modular lounge/i })
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
      screen.getByRole("button", { name: /publish listing modular lounge/i })
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
      screen.getByRole("button", { name: /unpublish listing modular lounge/i })
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
      screen.getByRole("button", { name: /save listing modular lounge/i })
    );

    expect(
      await screen.findByText(/listing change could not be saved/i)
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
    expect(source).not.toMatch(/cart|checkout|payment|customer account|stock reservation|order fulfilment|online ordering/i);
  });
});
