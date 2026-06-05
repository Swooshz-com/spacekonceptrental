import "server-only";

import { createHash } from "node:crypto";
import type {
  SearchIndexJobCommandInput,
  SearchIndexOperation,
  SearchIndexVisibility
} from "./types";

type ListingStatus = "active" | "draft" | "archived" | "published";
type ListingImageStatus = "active" | "archived";

export type SearchIndexListingInput = {
  id: string;
  categoryId?: string | null;
  slug: string;
  title: string;
  shortDescription?: string | null;
  details?: string | null;
  rentalUnit?: string | null;
  status: ListingStatus;
};

export type SearchIndexCategoryInput = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  isPublished: boolean;
};

export type SearchIndexListingImageInput = {
  id: string;
  listingId: string;
  listingStatus: ListingStatus;
  status: ListingImageStatus;
  altText?: string | null;
  isPrimary?: boolean | null;
};

type BuildListingInput = {
  workspaceId: string;
  listing: SearchIndexListingInput;
};

type BuildCategoryInput = {
  workspaceId: string;
  category: SearchIndexCategoryInput;
};

type BuildListingImageInput = {
  workspaceId: string;
  image: SearchIndexListingImageInput;
};

type StableJsonValue =
  | null
  | boolean
  | number
  | string
  | StableJsonValue[]
  | { [key: string]: StableJsonValue };

function cleanText(value: string | null | undefined) {
  const trimmed = value?.trim();

  return trimmed || null;
}

function stableJson(value: StableJsonValue): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
    .join(",")}}`;
}

function hashSafePayload(payload: StableJsonValue) {
  return createHash("sha256").update(stableJson(payload)).digest("hex");
}

function sourceVersion(entity: string, contentHash: string) {
  return `${entity}-v1-${contentHash.slice(0, 16)}`;
}

function metadata(entity: string) {
  return {
    source: "admin_listing_write",
    entity
  };
}

function visibilityForListing(status: ListingStatus): SearchIndexVisibility {
  if (status === "active" || status === "published") {
    return "public_chat";
  }

  return status === "archived" ? "blocked" : "admin_only";
}

function operationForVisibility(
  visibility: SearchIndexVisibility
): SearchIndexOperation {
  return visibility === "blocked" ? "hide" : "upsert";
}

export function buildListingSearchIndexJob({
  workspaceId,
  listing
}: BuildListingInput): SearchIndexJobCommandInput {
  const safePayload = {
    entity: "listing",
    id: listing.id,
    categoryId: listing.categoryId ?? null,
    slug: listing.slug.trim(),
    title: listing.title.trim(),
    shortDescription: cleanText(listing.shortDescription),
    details: cleanText(listing.details),
    rentalUnit: cleanText(listing.rentalUnit),
    status: listing.status
  };
  const contentHash = hashSafePayload(safePayload);
  const visibility = visibilityForListing(listing.status);

  return {
    workspaceId,
    sourceType: "listing",
    sourceId: listing.id,
    sourceVersion: sourceVersion("listing", contentHash),
    visibility,
    operation: operationForVisibility(visibility),
    status: "queued",
    contentHash,
    metadata: metadata("listing")
  };
}

export function buildCategorySearchIndexJob({
  workspaceId,
  category
}: BuildCategoryInput): SearchIndexJobCommandInput {
  const safePayload = {
    entity: "category",
    id: category.id,
    slug: category.slug.trim(),
    name: category.name.trim(),
    description: cleanText(category.description),
    isPublished: category.isPublished
  };
  const contentHash = hashSafePayload(safePayload);
  const visibility: SearchIndexVisibility = category.isPublished
    ? "public_chat"
    : "blocked";

  return {
    workspaceId,
    sourceType: "category",
    sourceId: category.id,
    sourceVersion: sourceVersion("category", contentHash),
    visibility,
    operation: operationForVisibility(visibility),
    status: "queued",
    contentHash,
    metadata: metadata("category")
  };
}

export function buildListingImageAltTextSearchIndexJob({
  workspaceId,
  image
}: BuildListingImageInput): SearchIndexJobCommandInput {
  const safePayload = {
    entity: "listing_image_alt_text",
    id: image.id,
    listingId: image.listingId,
    listingStatus: image.listingStatus,
    status: image.status,
    altText: cleanText(image.altText),
    isPrimary: image.isPrimary ?? null
  };
  const contentHash = hashSafePayload(safePayload);
  const visibility: SearchIndexVisibility =
    image.status === "archived" || image.listingStatus === "archived"
      ? "blocked"
      : visibilityForListing(image.listingStatus);

  return {
    workspaceId,
    sourceType: "listing_image_alt_text",
    sourceId: image.id,
    sourceVersion: sourceVersion("listing-image-alt-text", contentHash),
    visibility,
    operation: operationForVisibility(visibility),
    status: "queued",
    contentHash,
    metadata: metadata("listing_image_alt_text")
  };
}
