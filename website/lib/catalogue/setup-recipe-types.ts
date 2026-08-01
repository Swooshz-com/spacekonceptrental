import type {
  PublicCatalogueImage,
  PublicCatalogueProduct,
  SafeSetupComposition
} from "./types";

export type ProductKind = "rental" | "setup";

export type SetupCompositionItem = {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string;
  rentalUnit: string;
  images: PublicCatalogueImage[];
  position: number;
  baseQuantity: number;
};

export type ValidSetupComposition = SetupCompositionItem[];

export type SetupCompositionResult =
  | { ok: true; kind: "setup"; composition: ValidSetupComposition }
  | { ok: true; kind: "rental" }
  | { ok: false; code: SetupCompositionErrorCode };

export type SetupCompositionErrorCode =
  | "fields-absent"
  | "unknown-kind"
  | "setup-null-composition"
  | "rental-non-null-composition"
  | "composition-not-array"
  | "empty-setup"
  | "too-many-items"
  | "duplicate-child"
  | "duplicate-position"
  | "position-gap"
  | "position-negative"
  | "position-non-integer"
  | "quantity-out-of-range"
  | "quantity-non-integer"
  | "missing-child-id"
  | "missing-child-fields"
  | "unexpected-child-payload"
  | "malformed-children";

export const SETUP_MAX_ITEMS = 20;
export const SETUP_MIN_ITEMS = 1;
export const SETUP_MIN_QUANTITY = 1;
export const SETUP_MAX_QUANTITY = 99;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getFiniteInteger(value: unknown): number | undefined {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value)
    ? value
    : undefined;
}

function toImages(value: unknown): PublicCatalogueImage[] {
  if (!Array.isArray(value)) return [];
  const result: PublicCatalogueImage[] = [];
  for (const row of value) {
    if (!isRecord(row)) continue;
    const id = getString(row.id);
    const storageBucket = getString(row.storage_bucket);
    const storagePath = getString(row.storage_path);
    if (!id || !storageBucket || !storagePath) continue;
    result.push({
      id,
      storageBucket,
      storagePath,
      altText: getString(row.alt_text),
      sortOrder: getFiniteInteger(row.sort_order) ?? 0,
      isPrimary: row.is_primary === true
    });
  }
  return result;
}

function normalizeCompositionItem(
  value: unknown,
  _index: number
): SetupCompositionItem | undefined {
  if (!isRecord(value)) return undefined;

  const allowedKeys = new Set([
    "id", "slug", "name", "short_description", "rental_unit",
    "product_images", "position", "base_quantity"
  ]);

  if (Object.keys(value).some((key) => !allowedKeys.has(key))) {
    return undefined;
  }

  const id = getString(value.id);
  const slug = getString(value.slug);
  const name = getString(value.name);

  if (!id || !slug || !name) return undefined;

  const rawPosition = value.position;
  if (typeof rawPosition !== "number" || !Number.isFinite(rawPosition) || !Number.isInteger(rawPosition)) {
    return undefined;
  }
  const position = rawPosition;

  const rawQty = value.base_quantity;
  if (typeof rawQty !== "number" || !Number.isFinite(rawQty) || !Number.isInteger(rawQty)) {
    return undefined;
  }
  const baseQuantity = rawQty;

  if (position < 0 || position >= SETUP_MAX_ITEMS) return undefined;
  if (baseQuantity < SETUP_MIN_QUANTITY || baseQuantity > SETUP_MAX_QUANTITY) return undefined;

  const shortDescription = getString(value.short_description);
  const rentalUnit = getString(value.rental_unit) ?? "item";
  const images = toImages(value.product_images);

  return {
    id,
    slug,
    name,
    shortDescription,
    rentalUnit,
    images,
    position,
    baseQuantity
  };
}

function isSafeImage(value: unknown): value is PublicCatalogueImage {
  if (!isRecord(value)) return false;

  const allowedKeys = new Set([
    "id", "storageBucket", "storagePath", "publicUrl", "altText",
    "sortOrder", "isPrimary"
  ]);

  if (Object.keys(value).some((key) => !allowedKeys.has(key))) return false;

  return (
    getString(value.id) !== undefined &&
    getString(value.storageBucket) !== undefined &&
    getString(value.storagePath) !== undefined &&
    (value.publicUrl === undefined || typeof value.publicUrl === "string") &&
    (value.altText === undefined || typeof value.altText === "string") &&
    getFiniteInteger(value.sortOrder) !== undefined &&
    typeof value.isPrimary === "boolean"
  );
}

export function isValidSafeSetupComposition(
  value: unknown,
  parentProductId?: string
): value is SafeSetupComposition {
  if (!Array.isArray(value) || value.length < SETUP_MIN_ITEMS || value.length > SETUP_MAX_ITEMS) {
    return false;
  }

  const childIds = new Set<string>();

  for (const [index, rawItem] of value.entries()) {
    if (!isRecord(rawItem)) return false;

    const allowedKeys = new Set([
      "id", "slug", "name", "shortDescription", "rentalUnit", "images",
      "position", "baseQuantity"
    ]);
    if (Object.keys(rawItem).some((key) => !allowedKeys.has(key))) return false;

    const id = getString(rawItem.id);
    const slug = getString(rawItem.slug);
    const name = getString(rawItem.name);
    const rentalUnit = getString(rawItem.rentalUnit);

    if (!id || !slug || !name || !rentalUnit) return false;
    if (parentProductId && id === parentProductId) return false;
    if (childIds.has(id)) return false;
    childIds.add(id);

    if (
      rawItem.shortDescription !== undefined &&
      typeof rawItem.shortDescription !== "string"
    ) {
      return false;
    }

    if (!Array.isArray(rawItem.images) || !rawItem.images.every(isSafeImage)) {
      return false;
    }

    if (rawItem.position !== index) return false;
    const baseQuantity = getFiniteInteger(rawItem.baseQuantity);
    if (
      getFiniteInteger(rawItem.position) === undefined ||
      baseQuantity === undefined ||
      baseQuantity < SETUP_MIN_QUANTITY ||
      baseQuantity > SETUP_MAX_QUANTITY
    ) {
      return false;
    }
  }

  return true;
}

export function classifySetupComposition(
  rawKind: unknown,
  rawComposition: unknown
): SetupCompositionResult {
  if (rawKind === undefined && rawComposition === undefined) {
    return { ok: false, code: "fields-absent" };
  }

  if (rawKind === undefined || rawComposition === undefined) {
    return { ok: false, code: "fields-absent" };
  }

  if (typeof rawKind !== "string") {
    return { ok: false, code: "unknown-kind" };
  }

  if (rawKind === "rental") {
    if (rawComposition !== null) {
      return { ok: false, code: "rental-non-null-composition" };
    }
    return { ok: true, kind: "rental" };
  }

  if (rawKind === "setup") {
    if (rawComposition === null) {
      return { ok: false, code: "setup-null-composition" };
    }

    if (!Array.isArray(rawComposition)) {
      return { ok: false, code: "composition-not-array" };
    }

    const count = rawComposition.length;
    if (count < SETUP_MIN_ITEMS) {
      return { ok: false, code: "empty-setup" };
    }
    if (count > SETUP_MAX_ITEMS) {
      return { ok: false, code: "too-many-items" };
    }

    const items: SetupCompositionItem[] = [];
    for (let i = 0; i < rawComposition.length; i++) {
      const item = normalizeCompositionItem(rawComposition[i], i);
      if (!item) {
        return { ok: false, code: "malformed-children" };
      }
      items.push(item);
    }

    const childIds = new Set<string>();
    for (const item of items) {
      if (childIds.has(item.id)) {
        return { ok: false, code: "duplicate-child" };
      }
      childIds.add(item.id);
    }

    const positions = new Set<number>();
    for (const item of items) {
      if (positions.has(item.position)) {
        return { ok: false, code: "duplicate-position" };
      }
      positions.add(item.position);
    }

    for (let p = 0; p < items.length; p++) {
      if (!positions.has(p)) {
        return { ok: false, code: "position-gap" };
      }
    }

    const sorted = [...items].sort((a, b) => a.position - b.position);

    return { ok: true, kind: "setup", composition: sorted };
  }

  return { ok: false, code: "unknown-kind" };
}

export function isAuthoritativeSetupProduct(product: PublicCatalogueProduct): boolean {
  if (!("productKind" in product)) return false;
  const kind = (product as Record<string, unknown>).productKind;
  return kind === "setup";
}

export function getSafeSetupComposition(
  product: PublicCatalogueProduct
): SetupCompositionItem[] | null {
  if (!("safeSetupComposition" in product)) return null;
  const comp = (product as Record<string, unknown>).safeSetupComposition;
  return isValidSafeSetupComposition(comp, product.id)
    ? comp
    : null;
}

export type AdminRecipeOperation = "replace" | "remove";

export type AdminRecipeWriteItem = {
  included_product_id: string;
  position: number;
  base_quantity: number;
};

export type AdminRecipeWriteRequest = {
  operation: AdminRecipeOperation;
  expectedWorkspaceId: string;
  setupProductId: string;
  expectedRevision: number;
  items: AdminRecipeWriteItem[];
};

export type AdminRecipeWriteResult =
  | {
      ok: true;
      operation: string;
      setupProductId: string;
      revision: number;
      itemCount: number;
    }
  | {
      ok: false;
      code: AdminRecipeWriteErrorCode;
    };

export type AdminRecipeWriteErrorCode =
  | "not-authenticated"
  | "unauthorized"
  | "rpc-unavailable"
  | "rpc-failure"
  | "conflict"
  | "validation-failure"
  | "network-error"
  | "unknown-error";

export type AdminRecipeReadItem = {
  workspace_id: string;
  setup_product_id: string;
  included_product_id: string;
  position: number;
  base_quantity: number;
};

export type AdminRecipeReadResult =
  | {
      ok: true;
      revision: number;
      items: AdminRecipeReadItem[];
    }
  | {
      ok: false;
      code: "not-found" | "rpc-unavailable" | "unauthorized" | "unknown-error";
    };
