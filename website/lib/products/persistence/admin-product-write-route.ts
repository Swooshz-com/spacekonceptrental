import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import {
  createServerAdminCsrfProofRuntimeDependencies,
  type ServerAdminCsrfProofRuntimeDependencies
} from "../../admin/authorization/server-admin-csrf-proof-runtime-dependencies";
import {
  resolveServerAdminCsrfProofSessionWorkspaceBinding,
  type ServerAdminCsrfProofSessionWorkspaceBindingDependencies,
  type ServerAdminCsrfProofSessionWorkspaceBindingResult
} from "../../admin/authorization/server-admin-csrf-proof-session-workspace-binding";
import {
  resolveServerAdminRuntimeRouteGateAdapter,
  type ServerAdminRuntimeRouteGateAdapterResult
} from "../../admin/authorization/server-admin-runtime-route-gate-adapter";
import type {
  StateChangingAdminOperation
} from "../../admin/authorization/server-admin-request-security-preflight";
import { readBoundedJsonBody } from "../../admin/api/bounded-json-body-reader";
import { getAdminRouteRuntimeConfig } from "../../server-runtime-config";
import {
  getProductPersistence,
  type CategoryDraft,
  type CategoryUpdate,
  type ProductDraft,
  type ProductImageMetadataDraft,
  type ProductImageMetadataUpdate,
  type ProductPersistence,
  type ProductPersistenceResult,
  type ProductStatus,
  type ProductUpdate
} from "./index";

export type AdminProductWriteAction =
  | "createCategory"
  | "updateCategory"
  | "archiveCategory"
  | "createProduct"
  | "updateProduct"
  | "publishProduct"
  | "archiveProduct"
  | "createProductImage"
  | "updateProductImage"
  | "archiveProductImage";

export type AdminProductWriteRouteConfig = {
  action: AdminProductWriteAction;
  operation: Extract<
    StateChangingAdminOperation,
    "category.write" | "product.write" | "productImage.write"
  >;
  recordId?: string;
};

type AdminProductWriteRouteEnv = {
  ADMIN_EXPECTED_ORIGIN?: string | null;
  ADMIN_EXPECTED_HOST?: string | null;
  ADMIN_TRUSTED_WORKSPACE_ID?: string | null;
};

type CreateRuntimeDependencies = (
  verifierContext?: Parameters<typeof createServerAdminCsrfProofRuntimeDependencies>[0]
) => ServerAdminCsrfProofRuntimeDependencies;

export type AdminProductWriteRouteDependencies = {
  env?: AdminProductWriteRouteEnv;
  now?: () => number;
  proofMaxAgeMs?: number;
  persistence?: ProductPersistence;
  createRuntimeDependencies?: CreateRuntimeDependencies;
  resolveSessionWorkspaceBinding?: typeof resolveServerAdminCsrfProofSessionWorkspaceBinding;
  bindingDependencies?: ServerAdminCsrfProofSessionWorkspaceBindingDependencies;
  resolveRouteGate?: typeof resolveServerAdminRuntimeRouteGateAdapter;
};

type AdminProductWriteRouteError = string;

type PayloadParseResult =
  | {
      ok: true;
      payload: ParsedPayload;
    }
  | {
      ok: false;
    };

type ParsedPayload =
  | {
      category: CategoryDraft;
    }
  | {
      categoryUpdates: CategoryUpdate;
    }
  | {
      product: ProductDraft;
    }
  | {
      productUpdates: ProductUpdate;
    }
  | {
      image: ProductImageMetadataDraft;
    }
  | {
      imageUpdates: ProductImageMetadataUpdate;
    }
  | Record<string, never>;

const noStoreHeaders = {
  "Cache-Control": "no-store"
};
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9][a-z0-9-]{1,98}[a-z0-9]$/;
const productStatuses = new Set<ProductStatus>([
  "draft",
  "published",
  "archived"
]);
const defaultProofMaxAgeMs = 5 * 60_000;

function normalizeRequired(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value.trim());
}

function isSlug(value: unknown): value is string {
  return typeof value === "string" && slugPattern.test(value.trim());
}

function isBoundedText(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim().length <= maxLength;
}

function isRequiredBoundedText(value: unknown, maxLength: number) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

function isSortOrder(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 1_000_000
  );
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isProductStatus(value: unknown): value is ProductStatus {
  return typeof value === "string" && productStatuses.has(value as ProductStatus);
}

function isSafeStoragePath(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();

  return (
    trimmed.length > 0 &&
    trimmed.length <= 512 &&
    !value.includes("..") &&
    !value.includes("\\") &&
    !value.startsWith("/")
  );
}

function hasOnlyKeys(body: Record<string, unknown>, keys: string[]) {
  const allowed = new Set(keys);

  return Object.keys(body).every((key) => allowed.has(key));
}

function hasAnyKey(body: Record<string, unknown>, keys: string[]) {
  return keys.some((key) => Object.hasOwn(body, key));
}

function errorJson(
  error: AdminProductWriteRouteError,
  status: number
): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error
    },
    {
      status,
      headers: noStoreHeaders
    }
  );
}

function successJson(result: ProductPersistenceResult, status: number) {
  if (!("ok" in result) || !result.ok) {
    return errorJson("product_persistence_failed", 503);
  }

  return NextResponse.json(
    {
      ok: true,
      record: result.record
    },
    {
      status,
      headers: noStoreHeaders
    }
  );
}

function parseCategoryDraft(body: Record<string, unknown>): PayloadParseResult {
  const allowedKeys = [
    "slug",
    "name",
    "description",
    "sortOrder",
    "isPublished"
  ];

  if (
    !hasOnlyKeys(body, allowedKeys) ||
    !isSlug(body.slug) ||
    !isRequiredBoundedText(body.name, 120) ||
    !isBoolean(body.isPublished) ||
    (Object.hasOwn(body, "description") &&
      !isBoundedText(body.description, 1_000)) ||
    (Object.hasOwn(body, "sortOrder") && !isSortOrder(body.sortOrder))
  ) {
    return {
      ok: false
    };
  }

  return {
    ok: true,
    payload: {
      category: {
        slug: body.slug.trim(),
        name: String(body.name).trim(),
        ...(typeof body.description === "string"
          ? { description: body.description.trim() }
          : {}),
        ...(typeof body.sortOrder === "number"
          ? { sortOrder: body.sortOrder }
          : {}),
        isPublished: body.isPublished
      }
    }
  };
}

function parseCategoryUpdate(body: Record<string, unknown>): PayloadParseResult {
  const allowedKeys = [
    "slug",
    "name",
    "description",
    "sortOrder",
    "isPublished"
  ];

  if (
    !hasOnlyKeys(body, allowedKeys) ||
    !hasAnyKey(body, allowedKeys) ||
    (Object.hasOwn(body, "slug") && !isSlug(body.slug)) ||
    (Object.hasOwn(body, "name") &&
      !isRequiredBoundedText(body.name, 120)) ||
    (Object.hasOwn(body, "description") &&
      !isBoundedText(body.description, 1_000)) ||
    (Object.hasOwn(body, "sortOrder") && !isSortOrder(body.sortOrder)) ||
    (Object.hasOwn(body, "isPublished") && !isBoolean(body.isPublished))
  ) {
    return {
      ok: false
    };
  }

  return {
    ok: true,
    payload: {
      categoryUpdates: {
        ...(typeof body.slug === "string" ? { slug: body.slug.trim() } : {}),
        ...(typeof body.name === "string" ? { name: body.name.trim() } : {}),
        ...(typeof body.description === "string"
          ? { description: body.description.trim() }
          : {}),
        ...(typeof body.sortOrder === "number"
          ? { sortOrder: body.sortOrder }
          : {}),
        ...(typeof body.isPublished === "boolean"
          ? { isPublished: body.isPublished }
          : {})
      }
    }
  };
}

function parseProductDraft(body: Record<string, unknown>): PayloadParseResult {
  const allowedKeys = [
    "categoryId",
    "slug",
    "name",
    "shortDescription",
    "description",
    "rentalUnit",
    "status",
    "sortOrder"
  ];

  if (
    !hasOnlyKeys(body, allowedKeys) ||
    !isSlug(body.slug) ||
    !isRequiredBoundedText(body.name, 160) ||
    !isProductStatus(body.status) ||
    (Object.hasOwn(body, "categoryId") && !isUuid(body.categoryId)) ||
    (Object.hasOwn(body, "shortDescription") &&
      !isBoundedText(body.shortDescription, 240)) ||
    (Object.hasOwn(body, "description") &&
      !isBoundedText(body.description, 2_000)) ||
    (Object.hasOwn(body, "rentalUnit") &&
      !isRequiredBoundedText(body.rentalUnit, 80)) ||
    (Object.hasOwn(body, "sortOrder") && !isSortOrder(body.sortOrder))
  ) {
    return {
      ok: false
    };
  }

  return {
    ok: true,
    payload: {
      product: {
        ...(typeof body.categoryId === "string"
          ? { categoryId: body.categoryId.trim() }
          : {}),
        slug: body.slug.trim(),
        name: String(body.name).trim(),
        ...(typeof body.shortDescription === "string"
          ? { shortDescription: body.shortDescription.trim() }
          : {}),
        ...(typeof body.description === "string"
          ? { description: body.description.trim() }
          : {}),
        ...(typeof body.rentalUnit === "string"
          ? { rentalUnit: body.rentalUnit.trim() }
          : {}),
        status: body.status,
        ...(typeof body.sortOrder === "number"
          ? { sortOrder: body.sortOrder }
          : {})
      }
    }
  };
}

function parseProductUpdate(body: Record<string, unknown>): PayloadParseResult {
  const allowedKeys = [
    "categoryId",
    "slug",
    "name",
    "shortDescription",
    "description",
    "rentalUnit",
    "status",
    "sortOrder"
  ];

  if (
    !hasOnlyKeys(body, allowedKeys) ||
    !hasAnyKey(body, allowedKeys) ||
    (Object.hasOwn(body, "categoryId") && !isUuid(body.categoryId)) ||
    (Object.hasOwn(body, "slug") && !isSlug(body.slug)) ||
    (Object.hasOwn(body, "name") &&
      !isRequiredBoundedText(body.name, 160)) ||
    (Object.hasOwn(body, "shortDescription") &&
      !isBoundedText(body.shortDescription, 240)) ||
    (Object.hasOwn(body, "description") &&
      !isBoundedText(body.description, 2_000)) ||
    (Object.hasOwn(body, "rentalUnit") &&
      !isRequiredBoundedText(body.rentalUnit, 80)) ||
    (Object.hasOwn(body, "status") && !isProductStatus(body.status)) ||
    (Object.hasOwn(body, "sortOrder") && !isSortOrder(body.sortOrder))
  ) {
    return {
      ok: false
    };
  }

  return {
    ok: true,
    payload: {
      productUpdates: {
        ...(typeof body.categoryId === "string"
          ? { categoryId: body.categoryId.trim() }
          : {}),
        ...(typeof body.slug === "string" ? { slug: body.slug.trim() } : {}),
        ...(typeof body.name === "string" ? { name: body.name.trim() } : {}),
        ...(typeof body.shortDescription === "string"
          ? { shortDescription: body.shortDescription.trim() }
          : {}),
        ...(typeof body.description === "string"
          ? { description: body.description.trim() }
          : {}),
        ...(typeof body.rentalUnit === "string"
          ? { rentalUnit: body.rentalUnit.trim() }
          : {}),
        ...(isProductStatus(body.status) ? { status: body.status } : {}),
        ...(typeof body.sortOrder === "number"
          ? { sortOrder: body.sortOrder }
          : {})
      }
    }
  };
}

function parseProductImageDraft(
  body: Record<string, unknown>
): PayloadParseResult {
  const allowedKeys = [
    "productId",
    "storageBucket",
    "storagePath",
    "altText",
    "sortOrder",
    "isPrimary"
  ];

  if (
    !hasOnlyKeys(body, allowedKeys) ||
    !isUuid(body.productId) ||
    !isRequiredBoundedText(body.storageBucket, 120) ||
    !isSafeStoragePath(body.storagePath) ||
    (Object.hasOwn(body, "altText") && !isBoundedText(body.altText, 240)) ||
    (Object.hasOwn(body, "sortOrder") && !isSortOrder(body.sortOrder)) ||
    (Object.hasOwn(body, "isPrimary") && !isBoolean(body.isPrimary))
  ) {
    return {
      ok: false
    };
  }

  return {
    ok: true,
    payload: {
      image: {
        productId: body.productId.trim(),
        storageBucket: String(body.storageBucket).trim(),
        storagePath: body.storagePath.trim(),
        ...(typeof body.altText === "string"
          ? { altText: body.altText.trim() }
          : {}),
        ...(typeof body.sortOrder === "number"
          ? { sortOrder: body.sortOrder }
          : {}),
        ...(typeof body.isPrimary === "boolean"
          ? { isPrimary: body.isPrimary }
          : {})
      }
    }
  };
}

function parseProductImageUpdate(
  body: Record<string, unknown>
): PayloadParseResult {
  const allowedKeys = [
    "storageBucket",
    "storagePath",
    "altText",
    "sortOrder",
    "isPrimary"
  ];

  if (
    !hasOnlyKeys(body, allowedKeys) ||
    !hasAnyKey(body, allowedKeys) ||
    (Object.hasOwn(body, "storageBucket") &&
      !isRequiredBoundedText(body.storageBucket, 120)) ||
    (Object.hasOwn(body, "storagePath") &&
      !isSafeStoragePath(body.storagePath)) ||
    (Object.hasOwn(body, "altText") && !isBoundedText(body.altText, 240)) ||
    (Object.hasOwn(body, "sortOrder") && !isSortOrder(body.sortOrder)) ||
    (Object.hasOwn(body, "isPrimary") && !isBoolean(body.isPrimary))
  ) {
    return {
      ok: false
    };
  }

  return {
    ok: true,
    payload: {
      imageUpdates: {
        ...(typeof body.storageBucket === "string"
          ? { storageBucket: body.storageBucket.trim() }
          : {}),
        ...(typeof body.storagePath === "string"
          ? { storagePath: body.storagePath.trim() }
          : {}),
        ...(typeof body.altText === "string"
          ? { altText: body.altText.trim() }
          : {}),
        ...(typeof body.sortOrder === "number"
          ? { sortOrder: body.sortOrder }
          : {}),
        ...(typeof body.isPrimary === "boolean"
          ? { isPrimary: body.isPrimary }
          : {})
      }
    }
  };
}

function parseEmptyBody(body: Record<string, unknown>): PayloadParseResult {
  return Object.keys(body).length === 0
    ? {
        ok: true,
        payload: {}
      }
    : {
        ok: false
      };
}

function parsePayload(
  config: AdminProductWriteRouteConfig,
  body: Record<string, unknown>
): PayloadParseResult {
  switch (config.action) {
    case "createCategory":
      return parseCategoryDraft(body);
    case "updateCategory":
      return parseCategoryUpdate(body);
    case "archiveCategory":
      return parseEmptyBody(body);
    case "createProduct":
      return parseProductDraft(body);
    case "updateProduct":
      return parseProductUpdate(body);
    case "publishProduct":
    case "archiveProduct":
      return parseEmptyBody(body);
    case "createProductImage":
      return parseProductImageDraft(body);
    case "updateProductImage":
      return parseProductImageUpdate(body);
    case "archiveProductImage":
      return parseEmptyBody(body);
  }
}

function expectedMethod(action: AdminProductWriteAction) {
  return "POST";
}

function successStatus(action: AdminProductWriteAction) {
  return action === "createCategory" ||
    action === "createProduct" ||
    action === "createProductImage"
    ? 201
    : 200;
}

function getRouteEnv(dependencies: AdminProductWriteRouteDependencies) {
  return getAdminRouteRuntimeConfig(dependencies.env ?? process.env);
}

function getProofMaxAgeMs(dependencies: AdminProductWriteRouteDependencies) {
  return typeof dependencies.proofMaxAgeMs === "number" &&
    Number.isFinite(dependencies.proofMaxAgeMs) &&
    dependencies.proofMaxAgeMs > 0
    ? dependencies.proofMaxAgeMs
    : defaultProofMaxAgeMs;
}

function getTimestampMs(dependencies: AdminProductWriteRouteDependencies) {
  const now = dependencies.now?.() ?? Date.now();

  return Number.isFinite(now) && now >= 0 ? now : null;
}

function persistenceError(result: ProductPersistenceResult) {
  if (!("ok" in result) || result.ok) {
    return "product_persistence_failed";
  }

  switch (result.code) {
    case "PRODUCT_PERSISTENCE_UNAVAILABLE":
      return "product_persistence_unavailable";
    case "PRODUCT_ADMIN_CONTEXT_INVALID":
      return "product_admin_context_invalid";
    case "PRODUCT_PERSISTENCE_FAILED":
      return "product_persistence_failed";
  }
}

async function executePersistence(
  persistence: ProductPersistence,
  config: AdminProductWriteRouteConfig,
  payload: ParsedPayload,
  binding: Extract<
    ServerAdminCsrfProofSessionWorkspaceBindingResult,
    { bound: true }
  >
) {
  switch (config.action) {
    case "createCategory":
      return "category" in payload
        ? persistence.createCategory({
            admin: binding.adminContext,
            category: payload.category
          })
        : failureResult();
    case "updateCategory":
      return "categoryUpdates" in payload && config.recordId
        ? persistence.updateCategory({
            admin: binding.adminContext,
            categoryId: config.recordId,
            updates: payload.categoryUpdates
          })
        : failureResult();
    case "archiveCategory":
      return config.recordId
        ? persistence.archiveCategory({
            admin: binding.adminContext,
            categoryId: config.recordId,
            updates: {
              isPublished: false
            }
          })
        : failureResult();
    case "createProduct":
      return "product" in payload
        ? persistence.createProduct({
            admin: binding.adminContext,
            product: payload.product
          })
        : failureResult();
    case "updateProduct":
      return "productUpdates" in payload && config.recordId
        ? persistence.updateProduct({
            admin: binding.adminContext,
            productId: config.recordId,
            updates: payload.productUpdates
          })
        : failureResult();
    case "publishProduct":
      return config.recordId
        ? persistence.publishProduct({
            admin: binding.adminContext,
            productId: config.recordId
          })
        : failureResult();
    case "archiveProduct":
      return config.recordId
        ? persistence.archiveProduct({
            admin: binding.adminContext,
            productId: config.recordId
          })
        : failureResult();
    case "createProductImage":
      return "image" in payload
        ? persistence.createProductImage({
            admin: binding.adminContext,
            image: payload.image
          })
        : failureResult();
    case "updateProductImage":
      return "imageUpdates" in payload && config.recordId
        ? persistence.updateProductImage({
            admin: binding.adminContext,
            imageId: config.recordId,
            updates: payload.imageUpdates
          })
        : failureResult();
    case "archiveProductImage":
      return config.recordId
        ? persistence.archiveProductImage({
            admin: binding.adminContext,
            imageId: config.recordId
          })
        : failureResult();
  }
}

function failureResult(): ProductPersistenceResult {
  return {
    ok: false,
    code: "PRODUCT_PERSISTENCE_FAILED"
  };
}

export async function handleAdminProductWriteRoute(
  request: NextRequest,
  config: AdminProductWriteRouteConfig,
  dependencies: AdminProductWriteRouteDependencies = {}
): Promise<NextResponse> {
  const requestMethod = normalizeRequired(request.method)?.toUpperCase();

  if (requestMethod !== expectedMethod(config.action)) {
    return errorJson("request_method_not_allowed", 405);
  }

  if (config.recordId !== undefined && !isUuid(config.recordId)) {
    return errorJson("request_payload_invalid", 400);
  }

  const body = await readBoundedJsonBody(request);

  if (!body.ok) {
    return errorJson(body.error, body.status);
  }

  const payload = parsePayload(config, body.body);

  if (!payload.ok) {
    return errorJson("request_payload_invalid", 400);
  }

  const routeEnv = getRouteEnv(dependencies);
  const createRuntimeDependencies =
    dependencies.createRuntimeDependencies ??
    createServerAdminCsrfProofRuntimeDependencies;
  const runtimeDependencies = createRuntimeDependencies();
  const resolveSessionWorkspaceBinding =
    dependencies.resolveSessionWorkspaceBinding ??
    resolveServerAdminCsrfProofSessionWorkspaceBinding;
  let binding: ServerAdminCsrfProofSessionWorkspaceBindingResult;

  try {
    binding = await resolveSessionWorkspaceBinding(
      {
        requestedOperation: config.operation
      },
      {
        ...(dependencies.bindingDependencies ?? {}),
        workspace: {
          trustedServerWorkspaceId: routeEnv.trustedServerWorkspaceId
        },
        ...runtimeDependencies.sessionWorkspaceBindingDependencies
      }
    );
  } catch {
    return errorJson("admin_csrf_session_workspace_binding_unavailable", 503);
  }

  if (!binding.bound) {
    return errorJson(binding.reason, binding.statusCode);
  }

  const timestampMs = getTimestampMs(dependencies);

  if (timestampMs === null) {
    return errorJson("csrf_verification_failed", 403);
  }

  const resolveRouteGate =
    dependencies.resolveRouteGate ?? resolveServerAdminRuntimeRouteGateAdapter;
  const verifierContext = {
    expectedSessionBinding: binding.sessionBinding,
    currentTimestampMs: timestampMs,
    maxProofAgeMs: getProofMaxAgeMs(dependencies)
  };
  const verifierRuntimeDependencies = createRuntimeDependencies(verifierContext);
  let routeGate: ServerAdminRuntimeRouteGateAdapterResult;

  try {
    routeGate = await resolveRouteGate(
      {
        requestedOperation: config.operation,
        requestMethod,
        request,
        requiresMutationCapability: true
      },
      {
        requestMetadata: {
          expectedOrigin: routeEnv.expectedOrigin,
          expectedHost: routeEnv.expectedHost
        },
        gate: {
          csrfVerifier: {
            ...verifierContext,
            ...verifierRuntimeDependencies.verifierDependencies
          },
          decision: {
            workspace: {
              trustedServerWorkspaceId: routeEnv.trustedServerWorkspaceId
            }
          }
        }
      }
    );
  } catch {
    return errorJson("admin_authorization_gate_unavailable", 503);
  }

  if (!routeGate.allowed) {
    return errorJson(routeGate.reason, routeGate.statusCode);
  }

  const persistence = dependencies.persistence ?? getProductPersistence();
  const result = await executePersistence(
    persistence,
    config,
    payload.payload,
    binding
  );

  if (!("ok" in result) || !result.ok) {
    return errorJson(persistenceError(result), 503);
  }

  return successJson(result, successStatus(config.action));
}
