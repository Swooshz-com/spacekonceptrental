import { describe, expect, it } from "vitest";
import {
  buildCategorySearchIndexJob,
  buildListingImageAltTextSearchIndexJob,
  buildListingSearchIndexJob
} from "./search-index-builder";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const listingId = "22222222-2222-4222-8222-222222222222";
const categoryId = "33333333-3333-4333-8333-333333333333";
const imageId = "44444444-4444-4444-8444-444444444444";

describe("search-index builder", () => {
  it("builds stable listing jobs from safe public listing fields only", () => {
    const first = buildListingSearchIndexJob({
      workspaceId,
      listing: {
        id: listingId,
        categoryId,
        slug: "modular-lounge",
        title: "Modular Lounge",
        shortDescription: "Soft seating",
        details: "Public listing details",
        rentalUnit: "day",
        status: "active",
        sortOrder: 10,
        internalNotes: "do not index",
        customerContact: "do not index"
      } as never
    });
    const second = buildListingSearchIndexJob({
      workspaceId,
      listing: {
        id: listingId,
        categoryId,
        slug: "modular-lounge",
        title: "Modular Lounge",
        shortDescription: "Soft seating",
        details: "Public listing details",
        rentalUnit: "day",
        status: "active",
        sortOrder: 999,
        providerDebug: {
          traceDump: "ignored"
        }
      } as never
    });

    expect(first).toMatchObject({
      workspaceId,
      sourceType: "listing",
      sourceId: listingId,
      visibility: "public_chat",
      operation: "upsert",
      metadata: {
        source: "admin_listing_write",
        entity: "listing"
      }
    });
    expect(first.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.contentHash).toBe(second.contentHash);
    expect(JSON.stringify(first)).not.toMatch(
      /internalNotes|customerContact|providerDebug|traceDump|do not index/i
    );
  });

  it("maps archived or unpublished sources to blocked hide jobs", () => {
    expect(
      buildCategorySearchIndexJob({
        workspaceId,
        category: {
          id: categoryId,
          slug: "lounge",
          name: "Lounge",
          description: "Soft seating",
          isPublished: false
        }
      })
    ).toMatchObject({
      sourceType: "category",
      sourceId: categoryId,
      visibility: "blocked",
      operation: "hide"
    });

    expect(
      buildListingSearchIndexJob({
        workspaceId,
        listing: {
          id: listingId,
          slug: "archived-lounge",
          title: "Archived Lounge",
          status: "archived"
        }
      })
    ).toMatchObject({
      sourceType: "listing",
      sourceId: listingId,
      visibility: "blocked",
      operation: "hide"
    });
  });

  it("builds listing image alt text jobs without storing storage secrets or URLs", () => {
    const job = buildListingImageAltTextSearchIndexJob({
      workspaceId,
      image: {
        id: imageId,
        listingId,
        listingStatus: "active",
        status: "active",
        altText: "Ivory lounge chair beside greenery",
        storageBucket: "listing-media",
        storagePath: `${workspaceId}/${listingId}/chair.webp`,
        publicUrl: "https://storage.example/chair.webp"
      } as never
    });

    expect(job).toMatchObject({
      workspaceId,
      sourceType: "listing_image_alt_text",
      sourceId: imageId,
      visibility: "public_chat",
      operation: "upsert",
      metadata: {
        source: "admin_listing_write",
        entity: "listing_image_alt_text"
      }
    });
    expect(job.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(job)).not.toMatch(/storageBucket|storagePath|publicUrl|https/i);
  });
});
