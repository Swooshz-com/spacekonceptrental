import "server-only";

import type {
  ProductDraft,
  ProductImageMetadataDraft,
  ProductImageMetadataUpdate,
  ProductPersistence,
  ProductPersistenceResult,
  ProductUpdate
} from "../../products/persistence";
import type {
  ArchiveListingImageMetadataInput,
  ArchiveRentalListingInput,
  CreateListingImageMetadataInput,
  CreateRentalListingInput,
  ListingImageMetadataDraft,
  ListingImageMetadataUpdate,
  ProductBackedRentalListingAdminDependencies,
  RentalListingAdminAdapter,
  RentalListingAdminRecordType,
  RentalListingAdminRejectReason,
  RentalListingAdminResult,
  RentalListingDraft,
  RentalListingStatus,
  RentalListingUpdate,
  TrustedRentalListingAdminContext,
  UpdateListingImageMetadataInput,
  UpdateRentalListingInput
} from "./types";

type ValidationResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      reason: RentalListingAdminRejectReason;
    };

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9][a-z0-9-]{1,98}[a-z0-9]$/;
const listingStatuses = new Set<RentalListingStatus>([
  "draft",
  "active",
  "archived"
]);
const unsafePayloadKeyPattern = new RegExp(
  [
    "ca" + "rts?",
    "check" + "out",
    "pay" + "ments?",
    "online[_ -]?" + "or" + "dering",
    "or" +
      "der[_ -]?(?:id|status|number|total|line|items?|flow|fulfil(?:l)?ment)",
    "stock[_ -]?" + "res" + "ervation",
    "res" + "ervation",
    "confirmed[_ -]?" + "book" + "ing",
    "book" + "ing",
    "fulfil(?:l)?ment",
    "customer[_ -]?visible[_ -]?internal[_ -]?notes",
    "internal[_ -]?notes",
    "up" + "load",
    "image[_ -]?file",
    "files?",
    "service[_ -]?" + "role",
    "api[_ -]?key",
    "tokens?",
    "cookie",
    "webhook",
    "credentials?",
    "secret",
    "password"
  ].join("|"),
  "i"
);

function rejected(reason: RentalListingAdminRejectReason): RentalListingAdminResult {
  return {
    ok: false,
    status: "rejected",
    reason
  };
}

function unavailable(): RentalListingAdminResult {
  return {
    ok: false,
    status: "unavailable",
    reason: "listing_admin_unavailable"
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isUuidString(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value.trim());
}

function hasUnsafePayloadKey(
  value: unknown,
  seen = new WeakSet<object>()
): boolean {
  if (Array.isArray(value)) {
    if (seen.has(value)) {
      return false;
    }

    seen.add(value);
    return value.some((item) => hasUnsafePayloadKey(item, seen));
  }

  if (!isRecord(value)) {
    return false;
  }

  if (seen.has(value)) {
    return false;
  }

  seen.add(value);
  return Object.entries(value).some(
    ([key, nestedValue]) =>
      unsafePayloadKeyPattern.test(key) ||
      hasUnsafePayloadKey(nestedValue, seen)
  );
}

function hasOnlyKeys(value: Record<string, unknown>, keys: string[]) {
  const allowed = new Set(keys);

  return Object.keys(value).every((key) => allowed.has(key));
}

function hasAnyKey(value: Record<string, unknown>, keys: string[]) {
  return keys.some((key) => Object.hasOwn(value, key));
}

function normalizeUuid(
  value: unknown,
  reason: RentalListingAdminRejectReason
): ValidationResult<string> {
  if (typeof value !== "string") {
    return {
      ok: false,
      reason
    };
  }

  const normalized = value.trim().toLowerCase();

  return uuidPattern.test(normalized)
    ? {
        ok: true,
        value: normalized
      }
    : {
        ok: false,
        reason
      };
}

function normalizeOptionalUuid(
  value: unknown,
  reason: RentalListingAdminRejectReason
): ValidationResult<string | undefined> {
  if (value === undefined) {
    return {
      ok: true,
      value: undefined
    };
  }

  return normalizeUuid(value, reason);
}

function normalizeSlug(value: unknown): ValidationResult<string> {
  if (typeof value !== "string") {
    return {
      ok: false,
      reason: "slug_invalid"
    };
  }

  const normalized = value.trim();

  return slugPattern.test(normalized)
    ? {
        ok: true,
        value: normalized
      }
    : {
        ok: false,
        reason: "slug_invalid"
      };
}

function normalizeRequiredText(
  value: unknown,
  maxLength: number,
  reason: RentalListingAdminRejectReason
): ValidationResult<string> {
  if (typeof value !== "string") {
    return {
      ok: false,
      reason
    };
  }

  const normalized = value.trim();

  return normalized && normalized.length <= maxLength
    ? {
        ok: true,
        value: normalized
      }
    : {
        ok: false,
        reason
      };
}

function normalizeOptionalText(
  value: unknown,
  maxLength: number,
  reason: RentalListingAdminRejectReason,
  requireWhenPresent = false
): ValidationResult<string | undefined> {
  if (value === undefined) {
    return {
      ok: true,
      value: undefined
    };
  }

  if (typeof value !== "string") {
    return {
      ok: false,
      reason
    };
  }

  const normalized = value.trim();

  if (normalized.length > maxLength || (requireWhenPresent && !normalized)) {
    return {
      ok: false,
      reason
    };
  }

  return {
    ok: true,
    value: normalized || undefined
  };
}

function normalizeSortOrder(value: unknown): ValidationResult<number | undefined> {
  if (value === undefined) {
    return {
      ok: true,
      value: undefined
    };
  }

  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 1_000_000
    ? {
        ok: true,
        value
      }
    : {
        ok: false,
        reason: "sort_order_invalid"
      };
}

function normalizeOptionalBoolean(
  value: unknown
): ValidationResult<boolean | undefined> {
  if (value === undefined) {
    return {
      ok: true,
      value: undefined
    };
  }

  return typeof value === "boolean"
    ? {
        ok: true,
        value
      }
    : {
        ok: false,
        reason: "input_invalid"
      };
}

function normalizeStatus(value: unknown): ValidationResult<RentalListingStatus> {
  return typeof value === "string" &&
    listingStatuses.has(value as RentalListingStatus)
    ? {
        ok: true,
        value: value as RentalListingStatus
      }
    : {
        ok: false,
        reason: "status_invalid"
      };
}

function normalizeOptionalStatus(
  value: unknown
): ValidationResult<RentalListingStatus | undefined> {
  if (value === undefined) {
    return {
      ok: true,
      value: undefined
    };
  }

  return normalizeStatus(value);
}

function normalizeStoragePath(value: unknown): ValidationResult<string> {
  if (typeof value !== "string") {
    return {
      ok: false,
      reason: "storage_path_invalid"
    };
  }

  const normalized = value.trim();

  return normalized.length > 0 &&
    normalized.length <= 512 &&
    !normalized.includes("..") &&
    !normalized.includes("\\") &&
    !normalized.startsWith("/")
    ? {
        ok: true,
        value: normalized
      }
    : {
        ok: false,
        reason: "storage_path_invalid"
      };
}

function validAdminContext(admin: TrustedRentalListingAdminContext) {
  if (!isRecord(admin)) {
    return false;
  }

  return (
    admin.resolution === "server-auth-membership" &&
    isUuidString(admin.workspaceId) &&
    isUuidString(admin.adminUserId) &&
    (admin.membershipId === undefined || isUuidString(admin.membershipId))
  );
}

function productStatus(status: RentalListingStatus) {
  return status === "active" ? "published" : status;
}

function mapProductResult(
  result: ProductPersistenceResult,
  type: RentalListingAdminRecordType
): RentalListingAdminResult {
  if (!("ok" in result) || !result.ok) {
    return unavailable();
  }

  return {
    ok: true,
    record: {
      id: result.record.id,
      type
    }
  };
}

function validateListingDraft(value: unknown): ValidationResult<RentalListingDraft> {
  const keys = [
    "categoryId",
    "slug",
    "title",
    "shortDescription",
    "details",
    "rentalUnit",
    "status",
    "sortOrder"
  ];

  if (!isRecord(value) || hasUnsafePayloadKey(value) || !hasOnlyKeys(value, keys)) {
    return {
      ok: false,
      reason: hasUnsafePayloadKey(value) ? "payload_unsafe" : "input_invalid"
    };
  }

  const categoryId = normalizeOptionalUuid(value.categoryId, "category_id_invalid");
  const slug = normalizeSlug(value.slug);
  const title = normalizeRequiredText(value.title, 160, "title_invalid");
  const shortDescription = normalizeOptionalText(
    value.shortDescription,
    240,
    "short_description_invalid"
  );
  const details = normalizeOptionalText(value.details, 2_000, "details_invalid");
  const rentalUnit = normalizeOptionalText(
    value.rentalUnit,
    80,
    "rental_unit_invalid",
    true
  );
  const status = normalizeStatus(value.status);
  const sortOrder = normalizeSortOrder(value.sortOrder);

  if (!categoryId.ok) {
    return categoryId;
  }
  if (!slug.ok) {
    return slug;
  }
  if (!title.ok) {
    return title;
  }
  if (!shortDescription.ok) {
    return shortDescription;
  }
  if (!details.ok) {
    return details;
  }
  if (!rentalUnit.ok) {
    return rentalUnit;
  }
  if (!status.ok) {
    return status;
  }
  if (!sortOrder.ok) {
    return sortOrder;
  }

  return {
    ok: true,
    value: {
      ...(categoryId.value ? { categoryId: categoryId.value } : {}),
      slug: slug.value,
      title: title.value,
      ...(shortDescription.value
        ? { shortDescription: shortDescription.value }
        : {}),
      ...(details.value ? { details: details.value } : {}),
      ...(rentalUnit.value ? { rentalUnit: rentalUnit.value } : {}),
      status: status.value,
      ...(sortOrder.value !== undefined ? { sortOrder: sortOrder.value } : {})
    }
  };
}

function validateListingUpdate(
  value: unknown
): ValidationResult<RentalListingUpdate> {
  const keys = [
    "categoryId",
    "slug",
    "title",
    "shortDescription",
    "details",
    "rentalUnit",
    "status",
    "sortOrder"
  ];

  if (
    !isRecord(value) ||
    hasUnsafePayloadKey(value) ||
    !hasOnlyKeys(value, keys) ||
    !hasAnyKey(value, keys)
  ) {
    return {
      ok: false,
      reason: hasUnsafePayloadKey(value) ? "payload_unsafe" : "input_invalid"
    };
  }

  const categoryId = normalizeOptionalUuid(value.categoryId, "category_id_invalid");
  const slug =
    value.slug === undefined
      ? ({ ok: true, value: undefined } as const)
      : normalizeSlug(value.slug);
  const title =
    value.title === undefined
      ? ({ ok: true, value: undefined } as const)
      : normalizeRequiredText(value.title, 160, "title_invalid");
  const shortDescription = normalizeOptionalText(
    value.shortDescription,
    240,
    "short_description_invalid"
  );
  const details = normalizeOptionalText(value.details, 2_000, "details_invalid");
  const rentalUnit = normalizeOptionalText(
    value.rentalUnit,
    80,
    "rental_unit_invalid",
    true
  );
  const status = normalizeOptionalStatus(value.status);
  const sortOrder = normalizeSortOrder(value.sortOrder);

  if (!categoryId.ok) {
    return categoryId;
  }
  if (!slug.ok) {
    return slug;
  }
  if (!title.ok) {
    return title;
  }
  if (!shortDescription.ok) {
    return shortDescription;
  }
  if (!details.ok) {
    return details;
  }
  if (!rentalUnit.ok) {
    return rentalUnit;
  }
  if (!status.ok) {
    return status;
  }
  if (!sortOrder.ok) {
    return sortOrder;
  }

  return {
    ok: true,
    value: {
      ...(categoryId.value ? { categoryId: categoryId.value } : {}),
      ...(slug.value ? { slug: slug.value } : {}),
      ...(title.value ? { title: title.value } : {}),
      ...(shortDescription.value
        ? { shortDescription: shortDescription.value }
        : {}),
      ...(details.value ? { details: details.value } : {}),
      ...(rentalUnit.value ? { rentalUnit: rentalUnit.value } : {}),
      ...(status.value ? { status: status.value } : {}),
      ...(sortOrder.value !== undefined ? { sortOrder: sortOrder.value } : {})
    }
  };
}

function validateImageDraft(
  value: unknown
): ValidationResult<ListingImageMetadataDraft> {
  const keys = [
    "listingId",
    "storageBucket",
    "storagePath",
    "altText",
    "sortOrder",
    "isPrimary"
  ];

  if (!isRecord(value) || hasUnsafePayloadKey(value) || !hasOnlyKeys(value, keys)) {
    return {
      ok: false,
      reason: hasUnsafePayloadKey(value) ? "payload_unsafe" : "input_invalid"
    };
  }

  const listingId = normalizeUuid(value.listingId, "listing_id_invalid");
  const storageBucket = normalizeRequiredText(
    value.storageBucket,
    120,
    "storage_bucket_invalid"
  );
  const storagePath = normalizeStoragePath(value.storagePath);
  const altText = normalizeOptionalText(value.altText, 240, "alt_text_invalid");
  const sortOrder = normalizeSortOrder(value.sortOrder);
  const isPrimary = normalizeOptionalBoolean(value.isPrimary);

  if (!listingId.ok) {
    return listingId;
  }
  if (!storageBucket.ok) {
    return storageBucket;
  }
  if (!storagePath.ok) {
    return storagePath;
  }
  if (!altText.ok) {
    return altText;
  }
  if (!sortOrder.ok) {
    return sortOrder;
  }
  if (!isPrimary.ok) {
    return isPrimary;
  }

  return {
    ok: true,
    value: {
      listingId: listingId.value,
      storageBucket: storageBucket.value,
      storagePath: storagePath.value,
      ...(altText.value ? { altText: altText.value } : {}),
      ...(sortOrder.value !== undefined ? { sortOrder: sortOrder.value } : {}),
      ...(isPrimary.value !== undefined ? { isPrimary: isPrimary.value } : {})
    }
  };
}

function validateImageUpdate(
  value: unknown
): ValidationResult<ListingImageMetadataUpdate> {
  const keys = [
    "storageBucket",
    "storagePath",
    "altText",
    "sortOrder",
    "isPrimary"
  ];

  if (
    !isRecord(value) ||
    hasUnsafePayloadKey(value) ||
    !hasOnlyKeys(value, keys) ||
    !hasAnyKey(value, keys)
  ) {
    return {
      ok: false,
      reason: hasUnsafePayloadKey(value) ? "payload_unsafe" : "input_invalid"
    };
  }

  const storageBucket =
    value.storageBucket === undefined
      ? ({ ok: true, value: undefined } as const)
      : normalizeRequiredText(value.storageBucket, 120, "storage_bucket_invalid");
  const storagePath =
    value.storagePath === undefined
      ? ({ ok: true, value: undefined } as const)
      : normalizeStoragePath(value.storagePath);
  const altText = normalizeOptionalText(value.altText, 240, "alt_text_invalid");
  const sortOrder = normalizeSortOrder(value.sortOrder);
  const isPrimary = normalizeOptionalBoolean(value.isPrimary);

  if (!storageBucket.ok) {
    return storageBucket;
  }
  if (!storagePath.ok) {
    return storagePath;
  }
  if (!altText.ok) {
    return altText;
  }
  if (!sortOrder.ok) {
    return sortOrder;
  }
  if (!isPrimary.ok) {
    return isPrimary;
  }

  return {
    ok: true,
    value: {
      ...(storageBucket.value ? { storageBucket: storageBucket.value } : {}),
      ...(storagePath.value ? { storagePath: storagePath.value } : {}),
      ...(altText.value ? { altText: altText.value } : {}),
      ...(sortOrder.value !== undefined ? { sortOrder: sortOrder.value } : {}),
      ...(isPrimary.value !== undefined ? { isPrimary: isPrimary.value } : {})
    }
  };
}

function productDraft(listing: RentalListingDraft): ProductDraft {
  return {
    ...(listing.categoryId ? { categoryId: listing.categoryId } : {}),
    slug: listing.slug,
    name: listing.title,
    ...(listing.shortDescription
      ? { shortDescription: listing.shortDescription }
      : {}),
    ...(listing.details ? { description: listing.details } : {}),
    ...(listing.rentalUnit ? { rentalUnit: listing.rentalUnit } : {}),
    status: productStatus(listing.status),
    ...(listing.sortOrder !== undefined ? { sortOrder: listing.sortOrder } : {})
  };
}

function productUpdate(updates: RentalListingUpdate): ProductUpdate {
  return {
    ...(updates.categoryId ? { categoryId: updates.categoryId } : {}),
    ...(updates.slug ? { slug: updates.slug } : {}),
    ...(updates.title ? { name: updates.title } : {}),
    ...(updates.shortDescription
      ? { shortDescription: updates.shortDescription }
      : {}),
    ...(updates.details ? { description: updates.details } : {}),
    ...(updates.rentalUnit ? { rentalUnit: updates.rentalUnit } : {}),
    ...(updates.status ? { status: productStatus(updates.status) } : {}),
    ...(updates.sortOrder !== undefined ? { sortOrder: updates.sortOrder } : {})
  };
}

function imageDraft(image: ListingImageMetadataDraft): ProductImageMetadataDraft {
  return {
    productId: image.listingId,
    storageBucket: image.storageBucket,
    storagePath: image.storagePath,
    ...(image.altText ? { altText: image.altText } : {}),
    ...(image.sortOrder !== undefined ? { sortOrder: image.sortOrder } : {}),
    ...(image.isPrimary !== undefined ? { isPrimary: image.isPrimary } : {})
  };
}

function imageUpdate(
  updates: ListingImageMetadataUpdate
): ProductImageMetadataUpdate {
  return {
    ...(updates.storageBucket ? { storageBucket: updates.storageBucket } : {}),
    ...(updates.storagePath ? { storagePath: updates.storagePath } : {}),
    ...(updates.altText ? { altText: updates.altText } : {}),
    ...(updates.sortOrder !== undefined ? { sortOrder: updates.sortOrder } : {}),
    ...(updates.isPrimary !== undefined ? { isPrimary: updates.isPrimary } : {})
  };
}

function getPersistence(
  dependencies: ProductBackedRentalListingAdminDependencies
): ProductPersistence | null {
  return dependencies.persistence ?? null;
}

function validateAdmin(
  admin: TrustedRentalListingAdminContext
): RentalListingAdminResult | null {
  return validAdminContext(admin) ? null : rejected("admin_context_invalid");
}

export function createProductBackedRentalListingAdminAdapter(
  dependencies: ProductBackedRentalListingAdminDependencies = {}
): RentalListingAdminAdapter {
  return {
    async createListing(input: CreateRentalListingInput) {
      const adminError = validateAdmin(input.admin);
      const listing = validateListingDraft(input.listing);

      if (adminError) {
        return adminError;
      }

      if (!listing.ok) {
        return rejected(listing.reason);
      }

      const persistence = getPersistence(dependencies);

      if (!persistence) {
        return unavailable();
      }

      try {
        return mapProductResult(
          await persistence.createProduct({
            admin: input.admin,
            product: productDraft(listing.value)
          }),
          "listing"
        );
      } catch {
        return unavailable();
      }
    },

    async updateListing(input: UpdateRentalListingInput) {
      const adminError = validateAdmin(input.admin);
      const listingId = normalizeUuid(input.listingId, "listing_id_invalid");
      const updates = validateListingUpdate(input.updates);

      if (adminError) {
        return adminError;
      }

      if (!listingId.ok) {
        return rejected(listingId.reason);
      }

      if (!updates.ok) {
        return rejected(updates.reason);
      }

      const persistence = getPersistence(dependencies);

      if (!persistence) {
        return unavailable();
      }

      try {
        return mapProductResult(
          await persistence.updateProduct({
            admin: input.admin,
            productId: listingId.value,
            updates: productUpdate(updates.value)
          }),
          "listing"
        );
      } catch {
        return unavailable();
      }
    },

    async archiveListing(input: ArchiveRentalListingInput) {
      const adminError = validateAdmin(input.admin);
      const listingId = normalizeUuid(input.listingId, "listing_id_invalid");

      if (adminError) {
        return adminError;
      }

      if (!listingId.ok) {
        return rejected(listingId.reason);
      }

      const persistence = getPersistence(dependencies);

      if (!persistence) {
        return unavailable();
      }

      try {
        return mapProductResult(
          await persistence.archiveProduct({
            admin: input.admin,
            productId: listingId.value
          }),
          "listing"
        );
      } catch {
        return unavailable();
      }
    },

    async createListingImage(input: CreateListingImageMetadataInput) {
      const adminError = validateAdmin(input.admin);
      const image = validateImageDraft(input.image);

      if (adminError) {
        return adminError;
      }

      if (!image.ok) {
        return rejected(image.reason);
      }

      const persistence = getPersistence(dependencies);

      if (!persistence) {
        return unavailable();
      }

      try {
        return mapProductResult(
          await persistence.createProductImage({
            admin: input.admin,
            image: imageDraft(image.value)
          }),
          "listingImage"
        );
      } catch {
        return unavailable();
      }
    },

    async updateListingImage(input: UpdateListingImageMetadataInput) {
      const adminError = validateAdmin(input.admin);
      const imageId = normalizeUuid(input.imageId, "image_id_invalid");
      const updates = validateImageUpdate(input.updates);

      if (adminError) {
        return adminError;
      }

      if (!imageId.ok) {
        return rejected(imageId.reason);
      }

      if (!updates.ok) {
        return rejected(updates.reason);
      }

      const persistence = getPersistence(dependencies);

      if (!persistence) {
        return unavailable();
      }

      try {
        return mapProductResult(
          await persistence.updateProductImage({
            admin: input.admin,
            imageId: imageId.value,
            updates: imageUpdate(updates.value)
          }),
          "listingImage"
        );
      } catch {
        return unavailable();
      }
    },

    async archiveListingImage(input: ArchiveListingImageMetadataInput) {
      const adminError = validateAdmin(input.admin);
      const imageId = normalizeUuid(input.imageId, "image_id_invalid");

      if (adminError) {
        return adminError;
      }

      if (!imageId.ok) {
        return rejected(imageId.reason);
      }

      const persistence = getPersistence(dependencies);

      if (!persistence) {
        return unavailable();
      }

      try {
        return mapProductResult(
          await persistence.archiveProductImage({
            admin: input.admin,
            imageId: imageId.value
          }),
          "listingImage"
        );
      } catch {
        return unavailable();
      }
    }
  };
}
