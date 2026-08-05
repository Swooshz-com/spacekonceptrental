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
export const SETUP_MAX_RECONSTRUCTED_QUANTITY =
  SETUP_MAX_QUANTITY * SETUP_MAX_QUANTITY;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getFiniteInteger(value: unknown): number | undefined {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isSafeInteger(value)
    ? value
    : undefined;
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actualKeys = Object.keys(value);

  return (
    actualKeys.length === keys.length &&
    keys.every((key) => Object.prototype.hasOwnProperty.call(value, key))
  );
}

function getNullableString(value: unknown) {
  return value === null || typeof value === "string" ? value : undefined;
}

export function reconstructSetupQuantity(
  parentQuantity: unknown,
  baseQuantity: unknown
): number | undefined {
  const parent = getFiniteInteger(parentQuantity);
  const base = getFiniteInteger(baseQuantity);

  if (
    parent === undefined ||
    base === undefined ||
    parent < SETUP_MIN_QUANTITY ||
    parent > SETUP_MAX_QUANTITY ||
    base < SETUP_MIN_QUANTITY ||
    base > SETUP_MAX_QUANTITY
  ) {
    return undefined;
  }

  const reconstructed = parent * base;
  return Number.isSafeInteger(reconstructed) &&
    reconstructed <= SETUP_MAX_RECONSTRUCTED_QUANTITY
    ? reconstructed
    : undefined;
}

function toImages(value: unknown): PublicCatalogueImage[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const result: PublicCatalogueImage[] = [];
  for (const row of value) {
    if (
      !isRecord(row) ||
      !hasExactKeys(row, [
        "id",
        "storage_bucket",
        "storage_path",
        "alt_text",
        "sort_order",
        "is_primary"
      ])
    ) {
      return undefined;
    }

    const id = getString(row.id);
    const storageBucket = getString(row.storage_bucket);
    const storagePath = getString(row.storage_path);
    const altText = getNullableString(row.alt_text);
    const sortOrder = getFiniteInteger(row.sort_order);

    if (
      !id ||
      !storageBucket ||
      !storagePath ||
      altText === undefined ||
      sortOrder === undefined ||
      sortOrder < 0 ||
      typeof row.is_primary !== "boolean"
    ) {
      return undefined;
    }

    result.push({
      id,
      storageBucket,
      storagePath,
      altText: altText === null ? undefined : altText,
      sortOrder,
      isPrimary: row.is_primary
    });
  }
  return result;
}

function normalizeCompositionItem(
  value: unknown
): SetupCompositionItem | undefined {
  if (!isRecord(value)) return undefined;

  if (
    !hasExactKeys(value, [
      "id",
      "slug",
      "name",
      "short_description",
      "rental_unit",
      "product_images",
      "position",
      "base_quantity"
    ])
  ) {
    return undefined;
  }

  const id = getString(value.id);
  const slug = getString(value.slug);
  const name = getString(value.name);
  const rentalUnit = getString(value.rental_unit);
  const shortDescription = getNullableString(value.short_description);

  if (!id || !slug || !name || !rentalUnit || shortDescription === undefined) {
    return undefined;
  }

  const rawPosition = value.position;
  if (typeof rawPosition !== "number" || !Number.isFinite(rawPosition) || !Number.isSafeInteger(rawPosition)) {
    return undefined;
  }
  const position = rawPosition;

  const rawQty = value.base_quantity;
  if (typeof rawQty !== "number" || !Number.isFinite(rawQty) || !Number.isSafeInteger(rawQty)) {
    return undefined;
  }
  const baseQuantity = rawQty;

  if (position < 0 || position >= SETUP_MAX_ITEMS) return undefined;
  if (baseQuantity < SETUP_MIN_QUANTITY || baseQuantity > SETUP_MAX_QUANTITY) return undefined;

  const images = toImages(value.product_images);

  if (!images) return undefined;

  return {
    id,
    slug,
    name,
    shortDescription:
      shortDescription === null ? undefined : shortDescription,
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
      const item = normalizeCompositionItem(rawComposition[i]);
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

export function canonicalizeUuid(value: string): string {
  return value.trim().toLowerCase();
}

const SETUP_READ_RPC_KEYS = Object.freeze(["revision", "items"]);
const SETUP_READ_RPC_ITEM_KEYS = Object.freeze([
  "workspace_id",
  "setup_product_id",
  "included_product_id",
  "position",
  "base_quantity"
]);

export type AdminRecipeReadRpcResult = {
  revision: number;
  items: AdminRecipeReadItem[];
};

export type AdminRecipeReadRpcResultParse =
  | { ok: true; value: AdminRecipeReadRpcResult }
  | { ok: false; code: "rpc-failure" };

function hasExactReadItemKeys(value: Record<string, unknown>): boolean {
  const keys = Object.keys(value);
  if (keys.length !== SETUP_READ_RPC_ITEM_KEYS.length) return false;
  const keySet = new Set(keys);
  return SETUP_READ_RPC_ITEM_KEYS.every((key) => keySet.has(key));
}

export function parseAdminRecipeReadRpcResult(
  data: unknown,
  expected: { workspaceId: string; setupProductId: string }
): AdminRecipeReadRpcResultParse {
  if (!isRecord(data)) return { ok: false, code: "rpc-failure" };

  const keys = Object.keys(data);
  if (keys.length !== SETUP_READ_RPC_KEYS.length) {
    return { ok: false, code: "rpc-failure" };
  }
  const keySet = new Set(keys);
  if (SETUP_READ_RPC_KEYS.some((key) => !keySet.has(key))) {
    return { ok: false, code: "rpc-failure" };
  }

  const revision = data.revision;
  const rawItems = data.items;

  if (
    typeof revision !== "number" ||
    !Number.isSafeInteger(revision) ||
    revision <= 0 ||
    !Array.isArray(rawItems) ||
    rawItems.length < SETUP_MIN_ITEMS ||
    rawItems.length > SETUP_MAX_ITEMS
  ) {
    return { ok: false, code: "rpc-failure" };
  }

  const canonicalWorkspaceId = canonicalizeUuid(expected.workspaceId);
  const canonicalSetupProductId = canonicalizeUuid(expected.setupProductId);

  const items: AdminRecipeReadItem[] = [];
  for (const row of rawItems) {
    if (!isRecord(row) || !hasExactReadItemKeys(row)) {
      return { ok: false, code: "rpc-failure" };
    }

    const workspace = getString(row.workspace_id);
    const setupProduct = getString(row.setup_product_id);
    const includedProduct = getString(row.included_product_id);
    const position = row.position;
    const baseQuantity = row.base_quantity;

    if (
      !workspace ||
      !setupProduct ||
      !includedProduct ||
      canonicalizeUuid(workspace) !== canonicalWorkspaceId ||
      canonicalizeUuid(setupProduct) !== canonicalSetupProductId ||
      typeof position !== "number" ||
      !Number.isSafeInteger(position) ||
      position < 0 ||
      position > 19 ||
      typeof baseQuantity !== "number" ||
      !Number.isSafeInteger(baseQuantity) ||
      baseQuantity < SETUP_MIN_QUANTITY ||
      baseQuantity > SETUP_MAX_QUANTITY
    ) {
      return { ok: false, code: "rpc-failure" };
    }

    items.push({
      workspace_id: workspace,
      setup_product_id: setupProduct,
      included_product_id: includedProduct,
      position,
      base_quantity: baseQuantity
    });
  }

  const positions = new Set(items.map((item) => item.position));
  const childIds = new Set(items.map((item) => item.included_product_id));
  if (
    positions.size !== items.length ||
    childIds.size !== items.length ||
    items.some((item, index) => item.position !== index)
  ) {
    return { ok: false, code: "rpc-failure" };
  }

  return {
    ok: true,
    value: {
      revision,
      items
    }
  };
}

export type AdminRecipeReadResult =
  | {
      ok: true;
      revision: number;
      items: AdminRecipeReadItem[];
    }
  | {
      ok: false;
      code:
        | "not-found"
        | "not-authenticated"
        | "rpc-unavailable"
        | "unauthorized"
        | "read-failure"
        | "unknown-error";
    };

const SETUP_WRITE_RPC_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SETUP_WRITE_RPC_KEYS = Object.freeze([
  "operation",
  "setup_product_id",
  "revision",
  "item_count"
]);

export type AdminRecipeWriteRpcResult = {
  operation: AdminRecipeOperation;
  setupProductId: string;
  revision: number;
  itemCount: number;
};

export type AdminRecipeWriteRpcResultParse =
  | { ok: true; value: AdminRecipeWriteRpcResult }
  | { ok: false; code: "rpc-failure" };

export function parseAdminRecipeWriteRpcResult(
  data: unknown,
  expected: { operation: AdminRecipeOperation; setupProductId: string }
): AdminRecipeWriteRpcResultParse {
  if (!isRecord(data)) return { ok: false, code: "rpc-failure" };

  const keys = Object.keys(data);
  if (keys.length !== SETUP_WRITE_RPC_KEYS.length) {
    return { ok: false, code: "rpc-failure" };
  }
  const keySet = new Set(keys);
  if (SETUP_WRITE_RPC_KEYS.some((key) => !keySet.has(key))) {
    return { ok: false, code: "rpc-failure" };
  }

  const operation = data.operation;
  const setupProductId = data.setup_product_id;
  const revision = data.revision;
  const itemCount = data.item_count;

  if (typeof operation !== "string" || typeof setupProductId !== "string") {
    return { ok: false, code: "rpc-failure" };
  }

  const normalizedOperation = operation.trim();
  const normalizedSetupProductId = setupProductId.trim();

  if (
    normalizedOperation !== "replace" &&
    normalizedOperation !== "remove"
  ) {
    return { ok: false, code: "rpc-failure" };
  }
  if (normalizedOperation !== expected.operation) {
    return { ok: false, code: "rpc-failure" };
  }

  if (
    !normalizedSetupProductId ||
    !SETUP_WRITE_RPC_UUID_PATTERN.test(normalizedSetupProductId)
  ) {
    return { ok: false, code: "rpc-failure" };
  }
  if (canonicalizeUuid(normalizedSetupProductId) !== canonicalizeUuid(expected.setupProductId)) {
    return { ok: false, code: "rpc-failure" };
  }

  if (
    typeof revision !== "number" ||
    typeof itemCount !== "number" ||
    !Number.isSafeInteger(revision) ||
    !Number.isSafeInteger(itemCount) ||
    revision < 1 ||
    itemCount < 1 ||
    itemCount > SETUP_MAX_ITEMS
  ) {
    return { ok: false, code: "rpc-failure" };
  }

  return {
    ok: true,
    value: {
      operation: normalizedOperation,
      setupProductId: normalizedSetupProductId,
      revision,
      itemCount
    }
  };
}
