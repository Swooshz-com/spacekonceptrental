import { describe, expect, it, vi } from "vitest";
import type { ProductPersistence, ProductPersistenceResult } from "../../products/persistence";
import {
  createProductBackedRentalListingAdminAdapter,
  disabledRentalListingAdmin,
  type ListingImageMetadataDraft,
  type RentalListingDraft
} from "./index";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const adminUserId = "22222222-2222-4222-8222-222222222222";
const membershipId = "33333333-3333-4333-8333-333333333333";
const categoryId = "44444444-4444-4444-8444-444444444444";
const listingId = "55555555-5555-4555-8555-555555555555";
const imageId = "66666666-6666-4666-8666-666666666666";

const admin = {
  workspaceId,
  adminUserId,
  membershipId,
  resolution: "server-auth-membership" as const
};

function productResult(
  result: ProductPersistenceResult = {
    ok: true,
    record: {
      id: listingId,
      type: "product"
    }
  }
): ProductPersistence {
  return {
    createCategory: vi.fn(async () => result),
    updateCategory: vi.fn(async () => result),
    archiveCategory: vi.fn(async () => result),
    createProduct: vi.fn(async () => result),
    updateProduct: vi.fn(async () => result),
    archiveProduct: vi.fn(async () => result),
    publishProduct: vi.fn(async () => result),
    createProductImage: vi.fn(async () => result),
    updateProductImage: vi.fn(async () => result),
    archiveProductImage: vi.fn(async () => result)
  };
}

function validListing(
  overrides: Partial<RentalListingDraft> = {}
): RentalListingDraft {
  return {
    categoryId,
    slug: "modular-lounge-set",
    title: "Modular lounge set",
    shortDescription: "Soft seating for receptions and launches.",
    details: "Configurable lounge furniture for event enquiry requests.",
    rentalUnit: "set",
    status: "active",
    sortOrder: 12,
    ...overrides
  };
}

function validImage(
  overrides: Partial<ListingImageMetadataDraft> = {}
): ListingImageMetadataDraft {
  return {
    listingId,
    storageBucket: "listing-media",
    storagePath: `${workspaceId}/${listingId}/main.webp`,
    altText: "Modular lounge setup",
    sortOrder: 3,
    isPrimary: true,
    ...overrides
  };
}

describe("product-backed rental listing admin adapter", () => {
  it("maps listing-facing create/update commands into the existing product persistence boundary", async () => {
    const persistence = productResult();
    const adapter = createProductBackedRentalListingAdminAdapter({ persistence });

    await expect(
      adapter.createListing({
        admin,
        listing: validListing()
      })
    ).resolves.toEqual({
      ok: true,
      record: {
        id: listingId,
        type: "listing"
      }
    });

    expect(persistence.createProduct).toHaveBeenCalledWith({
      admin,
      product: {
        categoryId,
        slug: "modular-lounge-set",
        name: "Modular lounge set",
        shortDescription: "Soft seating for receptions and launches.",
        description: "Configurable lounge furniture for event enquiry requests.",
        rentalUnit: "set",
        status: "published",
        sortOrder: 12
      }
    });

    await expect(
      adapter.updateListing({
        admin,
        listingId,
        updates: {
          title: "Updated lounge set",
          status: "draft",
          sortOrder: 20
        }
      })
    ).resolves.toEqual({
      ok: true,
      record: {
        id: listingId,
        type: "listing"
      }
    });

    expect(persistence.updateProduct).toHaveBeenCalledWith({
      admin,
      productId: listingId,
      updates: {
        name: "Updated lounge set",
        status: "draft",
        sortOrder: 20
      }
    });
  });

  it("maps listing image metadata commands into the existing product image persistence boundary", async () => {
    const persistence = productResult({
      ok: true,
      record: {
        id: imageId,
        type: "productImage"
      }
    });
    const adapter = createProductBackedRentalListingAdminAdapter({ persistence });

    await expect(
      adapter.createListingImage({
        admin,
        image: validImage()
      })
    ).resolves.toEqual({
      ok: true,
      record: {
        id: imageId,
        type: "listingImage"
      }
    });

    expect(persistence.createProductImage).toHaveBeenCalledWith({
      admin,
      image: {
        productId: listingId,
        storageBucket: "listing-media",
        storagePath: `${workspaceId}/${listingId}/main.webp`,
        altText: "Modular lounge setup",
        sortOrder: 3,
        isPrimary: true
      }
    });

    await expect(
      adapter.updateListingImage({
        admin,
        imageId,
        updates: {
          altText: "Updated lounge setup",
          isPrimary: false
        }
      })
    ).resolves.toEqual({
      ok: true,
      record: {
        id: imageId,
        type: "listingImage"
      }
    });

    expect(persistence.updateProductImage).toHaveBeenCalledWith({
      admin,
      imageId,
      updates: {
        altText: "Updated lounge setup",
        isPrimary: false
      }
    });
  });

  it("rejects malformed, ecommerce, upload, and internal-note payloads before persistence calls", async () => {
    const persistence = productResult();
    const adapter = createProductBackedRentalListingAdminAdapter({ persistence });

    for (const testCase of [
      {
        name: "empty title",
        input: validListing({
          title: ""
        }),
        reason: "title_invalid"
      },
      {
        name: "checkout URL",
        input: {
          ...validListing(),
          checkoutUrl: "https://checkout.example"
        } as unknown as RentalListingDraft,
        reason: "payload_unsafe"
      },
      {
        name: "stock reservation",
        input: {
          ...validListing(),
          stockReservationCount: 4
        } as unknown as RentalListingDraft,
        reason: "payload_unsafe"
      },
      {
        name: "customer-visible internal notes",
        input: {
          ...validListing(),
          customerVisibleInternalNotes: "do not expose"
        } as unknown as RentalListingDraft,
        reason: "payload_unsafe"
      }
    ]) {
      await expect(
        adapter.createListing({
          admin,
          listing: testCase.input
        }),
        testCase.name
      ).resolves.toEqual({
        ok: false,
        status: "rejected",
        reason: testCase.reason
      });
    }

    for (const testCase of [
      {
        name: "unsafe storage path",
        input: validImage({
          storagePath: "../secret.webp"
        }),
        reason: "storage_path_invalid"
      },
      {
        name: "file upload payload",
        input: {
          ...validImage(),
          imageFile: new File([new Uint8Array(1)], "listing.webp", {
            type: "image/webp"
          })
        } as unknown as ListingImageMetadataDraft,
        reason: "payload_unsafe"
      }
    ]) {
      await expect(
        adapter.createListingImage({
          admin,
          image: testCase.input
        }),
        testCase.name
      ).resolves.toEqual({
        ok: false,
        status: "rejected",
        reason: testCase.reason
      });
    }

    expect(persistence.createProduct).not.toHaveBeenCalled();
    expect(persistence.createProductImage).not.toHaveBeenCalled();
  });

  it("stays unavailable without an injected product persistence boundary", async () => {
    await expect(
      disabledRentalListingAdmin.createListing({
        admin,
        listing: validListing()
      })
    ).resolves.toEqual({
      ok: false,
      status: "unavailable",
      reason: "listing_admin_unavailable"
    });

    await expect(
      createProductBackedRentalListingAdminAdapter().createListing({
        admin,
        listing: validListing()
      })
    ).resolves.toEqual({
      ok: false,
      status: "unavailable",
      reason: "listing_admin_unavailable"
    });
  });
});
