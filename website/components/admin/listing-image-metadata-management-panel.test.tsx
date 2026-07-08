import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ListingImageMetadataManagementPanel,
  type ListingImageMetadataImage,
  type ListingImageMetadataProduct
} from "./listing-image-metadata-management-panel";

const sourcePath = resolve(
  process.cwd(),
  "components/admin/listing-image-metadata-management-panel.tsx"
);
const product: ListingImageMetadataProduct = {
  id: "22222222-2222-4222-8222-222222222222",
  slug: "modular-lounge",
  name: "Modular Lounge",
  status: "published",
  sortOrder: 10,
  rentalUnit: "set",
  imageCount: 1
};
const image: ListingImageMetadataImage = {
  id: "33333333-3333-4333-8333-333333333333",
  productId: product.id,
  storageBucket: "catalogue-metadata",
  storagePath: "fixtures/lounge-main.jpg",
  altText: "Lounge set",
  sortOrder: 1,
  isPrimary: true,
  status: "active"
};
const rawProof = "raw-product-image-proof-that-must-not-render";

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
          id: image.id
        }
      })
    );
}

function getLastRequestBody(fetcher: ReturnType<typeof createSuccessfulFetchMock>) {
  return JSON.parse(String(fetcher.mock.calls[1][1]?.body)) as Record<string, unknown>;
}

describe("listing image metadata management panel", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders authorised metadata-only listing image controls without upload or ecommerce flows", () => {
    render(
      <ListingImageMetadataManagementPanel
        images={[image]}
        products={[product]}
      />
    );

    expect(
      screen.getByRole("heading", { name: /listing image metadata management/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/new image listing/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/new image bucket/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/new image path/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/image path for lounge set/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create listing image metadata/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save image metadata/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /archive image metadata lounge set/i })
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/image upload|file upload/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/cart|checkout|payment|customer account|stock reservation|order fulfilment|online ordering/i)
    ).not.toBeInTheDocument();
  });

  it("uses visible MVP media guidance without old internal ladder wording", () => {
    render(
      <ListingImageMetadataManagementPanel
        images={[image]}
        products={[product]}
      />
    );

    expect(
      screen.getByRole("heading", { name: /^media coverage$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Public-ready media needs an active image/i)
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(
      /readiness|phase|governance|provider handoff|CRM handoff|sync readiness|workflow readiness|future sync|future integration|provider sync|automation handoff|owner approval|evidence|deployment/i
    );
  });

  it("shows scan-friendly listing media coverage and navigation actions", () => {
    const draftWithoutAlt: ListingImageMetadataProduct = {
      ...product,
      id: "44444444-4444-4444-8444-444444444444",
      slug: "draft-banquet-chair",
      name: "Draft Banquet Chair",
      status: "draft",
      imageCount: 1
    };
    const imageWithoutAlt: ListingImageMetadataImage = {
      id: "55555555-5555-4555-8555-555555555555",
      productId: draftWithoutAlt.id,
      storageBucket: "catalogue-metadata",
      storagePath: "fixtures/chair-side.jpg",
      sortOrder: 2,
      isPrimary: false,
      status: "active"
    };

    render(
      <ListingImageMetadataManagementPanel
        images={[image, imageWithoutAlt]}
        products={[product, draftWithoutAlt]}
      />
    );

    const coverage = screen.getByRole("region", {
      name: /listing media coverage checklist/i
    });
    const productCard = within(
      within(coverage).getByRole("article", {
        name: /media coverage modular lounge/i
      })
    );
    const draftCard = within(
      within(coverage).getByRole("article", {
        name: /media coverage draft banquet chair/i
      })
    );

    expect(productCard.getByText(/listing slug/i)).toBeInTheDocument();
    expect(productCard.getByText("modular-lounge")).toBeInTheDocument();
    expect(productCard.getByText(/published - visible in public catalogue/i)).toBeInTheDocument();
    expect(productCard.getByText(/1 active image/i)).toBeInTheDocument();
    expect(productCard.getByText(/primary public image selected/i)).toBeInTheDocument();
    expect(productCard.getByText(/public image text is present/i)).toBeInTheDocument();
    expect(
      productCard.getByRole("link", { name: /view public listing modular lounge/i })
    ).toHaveAttribute("href", "/listings/modular-lounge");
    expect(
      productCard.getByRole("link", { name: /edit listing modular lounge/i })
    ).toHaveAttribute(
      "href",
      "/admin/catalogue#listing-form-22222222-2222-4222-8222-222222222222"
    );
    expect(
      productCard.getByRole("link", { name: /manage images modular lounge/i })
    ).toHaveAttribute("href", "#update-listing-image-metadata");

    expect(draftCard.getByText(/draft - protected/i)).toBeInTheDocument();
    expect(draftCard.getAllByText(/missing primary public image/i).length).toBeGreaterThan(0);
    expect(draftCard.getByText(/missing alt text/i)).toBeInTheDocument();
    expect(draftCard.getByText(/image exists while listing is draft/i)).toBeInTheDocument();
  });

  it("keeps media helper actions on Catalogue anchors instead of removed admin routes", () => {
    render(
      <ListingImageMetadataManagementPanel
        images={[image]}
        products={[product]}
      />
    );

    expect(
      screen.getByRole("link", { name: /edit listing modular lounge/i })
    ).toHaveAttribute(
      "href",
      "/admin/catalogue#listing-form-22222222-2222-4222-8222-222222222222"
    );
    expect(readSource()).not.toContain("/admin/listings");
    expect(readSource()).not.toContain("/admin/media");
  });

  it("requests a productImage CSRF proof and creates image metadata with approved fields only", async () => {
    const fetcher = createSuccessfulFetchMock();
    const onMutationComplete = vi.fn();

    render(
      <ListingImageMetadataManagementPanel
        images={[image]}
        products={[product]}
        fetcher={fetcher}
        onMutationComplete={onMutationComplete}
      />
    );

    fireEvent.change(screen.getByLabelText(/new image listing/i), {
      target: {
        value: product.id
      }
    });
    fireEvent.change(screen.getByLabelText(/new image bucket/i), {
      target: {
        value: "catalogue-metadata"
      }
    });
    fireEvent.change(screen.getByLabelText(/new image path/i), {
      target: {
        value: "fixtures/new-lounge.jpg"
      }
    });
    fireEvent.change(screen.getByLabelText(/new image alt text/i), {
      target: {
        value: "New lounge setup"
      }
    });
    fireEvent.change(screen.getByLabelText(/new image display position/i), {
      target: {
        value: "4"
      }
    });
    fireEvent.click(screen.getByLabelText(/mark new image as primary/i));
    fireEvent.click(
      screen.getByRole("button", { name: /create listing image metadata/i })
    );

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));

    expect(fetcher.mock.calls[0][0]).toBe("/api/admin/csrf-proof");
    expect(fetcher.mock.calls[0][1]).toMatchObject({
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toMatchObject({
      requestedOperation: "productImage.write",
      operation: "productImage.write"
    });
    expect(fetcher.mock.calls[1][0]).toBe("/api/admin/product-images");
    expect(fetcher.mock.calls[1][1]).toMatchObject({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-proof": rawProof
      }
    });
    expect(getLastRequestBody(fetcher)).toEqual({
      productId: product.id,
      storageBucket: "catalogue-metadata",
      storagePath: "fixtures/new-lounge.jpg",
      altText: "New lounge setup",
      sortOrder: 4,
      isPrimary: true
    });
    expect(Object.keys(getLastRequestBody(fetcher)).sort()).toEqual([
      "altText",
      "isPrimary",
      "productId",
      "sortOrder",
      "storageBucket",
      "storagePath"
    ]);
    expect(onMutationComplete).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(rawProof)).not.toBeInTheDocument();
  });

  it("requests a productImage CSRF proof and updates image metadata with approved fields only", async () => {
    const fetcher = createSuccessfulFetchMock();

    render(
      <ListingImageMetadataManagementPanel
        images={[image]}
        products={[product]}
        fetcher={fetcher}
        onMutationComplete={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/image alt text for lounge set/i), {
      target: {
        value: "Updated lounge setup"
      }
    });
    fireEvent.click(
      screen.getByRole("button", { name: /save image metadata/i })
    );

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));

    expect(fetcher.mock.calls[0][0]).toBe("/api/admin/csrf-proof");
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toMatchObject({
      requestedOperation: "productImage.write",
      operation: "productImage.write"
    });
    expect(fetcher.mock.calls[1][0]).toBe(
      "/api/admin/product-images/33333333-3333-4333-8333-333333333333"
    );
    expect(getLastRequestBody(fetcher)).toEqual({
      storageBucket: "catalogue-metadata",
      storagePath: "fixtures/lounge-main.jpg",
      altText: "Updated lounge setup",
      sortOrder: 1,
      isPrimary: true
    });
    expect(Object.keys(getLastRequestBody(fetcher)).sort()).toEqual([
      "altText",
      "isPrimary",
      "sortOrder",
      "storageBucket",
      "storagePath"
    ]);
  });

  it("requests a productImage CSRF proof and archives image metadata without hard delete", async () => {
    const fetcher = createSuccessfulFetchMock();

    render(
      <ListingImageMetadataManagementPanel
        images={[image]}
        products={[product]}
        fetcher={fetcher}
        onMutationComplete={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /archive image metadata lounge set/i })
    );

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));

    expect(fetcher.mock.calls[0][0]).toBe("/api/admin/csrf-proof");
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toMatchObject({
      requestedOperation: "productImage.write",
      operation: "productImage.write"
    });
    expect(fetcher.mock.calls[1][0]).toBe(
      "/api/admin/product-images/33333333-3333-4333-8333-333333333333/archive"
    );
    expect(fetcher.mock.calls[1][1]).toMatchObject({
      method: "POST",
      headers: {
        "x-csrf-proof": rawProof
      },
      body: "{}"
    });
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("DELETE");
  });

  it("renders only generic failures without raw provider, proof, or workspace details", async () => {
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
            error: "sql supabase stack env token cookie workspace provider"
          },
          false
        )
      );

    render(
      <ListingImageMetadataManagementPanel
        images={[image]}
        products={[product]}
        fetcher={fetcher}
        onMutationComplete={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /save image metadata/i })
    );

    expect(
      await screen.findByText(/protected admin save could not be completed/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/sql|supabase|stack|env|token|cookie|workspace|provider/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(rawProof)).not.toBeInTheDocument();
  });

  it("keeps browser image metadata source free of upload and forbidden runtime paths", () => {
    const source = readSource();

    expect(source).toContain('"use client";');
    expect(source).not.toContain('type="file"');
    expect(source).not.toContain("multipart/form-data");
    expect(source).not.toContain("@supabase/");
    expect(source).not.toContain("lib/supabase");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(source).not.toContain("service-role");
    expect(source).not.toMatch(/\bdelete\s*\(/i);
    expect(source).not.toContain('method: "DELETE"');
    expect(source).not.toMatch(/upload|createBucket|getPublicUrl|\.storage\b/i);
    expect(source).not.toContain("/admin/listings");
    expect(source).not.toContain("/admin/media");
    expect(source).not.toMatch(/cart|checkout|payment|customer account|stock reservation|order fulfilment|online ordering/i);
  });
});
