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
import { resolveServerAdminMutationCapability } from "../../admin/authorization/server-admin-mutation-capability";
import {
  resolveServerAdminRuntimeRouteGateAdapter,
  type ServerAdminRuntimeRouteGateAdapterResult
} from "../../admin/authorization/server-admin-runtime-route-gate-adapter";
import { createSessionBoundSupabaseAdminReadClient } from "../../admin/authorization/supabase-admin-auth-identity-adapter";
import {
  getProductPersistence,
  type ProductPersistence,
  type ProductPersistenceResult
} from "../persistence";
import { getAdminRouteRuntimeConfig } from "../../server-runtime-config";

type AdminProductImageUploadRouteEnv = {
  ADMIN_EXPECTED_ORIGIN?: string | null;
  ADMIN_EXPECTED_HOST?: string | null;
  ADMIN_TRUSTED_WORKSPACE_ID?: string | null;
  ADMIN_MUTATIONS_ENABLED?: string | null;
};

type CreateRuntimeDependencies = (
  verifierContext?: Parameters<typeof createServerAdminCsrfProofRuntimeDependencies>[0]
) => ServerAdminCsrfProofRuntimeDependencies;

type StorageUploadResult = {
  data: unknown;
  error: unknown;
};

type StorageBucketClient = {
  upload(
    path: string,
    body: File,
    options: {
      contentType: string;
      upsert: false;
    }
  ): Promise<StorageUploadResult>;
  remove(paths: string[]): Promise<StorageUploadResult>;
  getPublicUrl(path: string): {
    data?: {
      publicUrl?: string;
    };
  };
};

type ProductImageStorageClient = {
  from(table: "products"): {
    select(columns: "id, workspace_id"): {
      eq(column: "id" | "workspace_id", value: string): unknown;
    };
  };
  storage: {
    from(bucket: typeof listingMediaBucket): StorageBucketClient;
  };
};

type ProductImageStorageClientResult =
  | {
      configured: true;
      client: ProductImageStorageClient;
    }
  | {
      configured: false;
      client: null;
    };

export type AdminProductImageUploadRouteDependencies = {
  env?: AdminProductImageUploadRouteEnv;
  now?: () => number;
  generateId?: () => string;
  proofMaxAgeMs?: number;
  persistence?: ProductPersistence;
  createRuntimeDependencies?: CreateRuntimeDependencies;
  resolveSessionWorkspaceBinding?: typeof resolveServerAdminCsrfProofSessionWorkspaceBinding;
  bindingDependencies?: ServerAdminCsrfProofSessionWorkspaceBindingDependencies;
  resolveRouteGate?: typeof resolveServerAdminRuntimeRouteGateAdapter;
  createStorageClient?: () => Promise<ProductImageStorageClientResult>;
};

type ParsedUpload = {
  productId: string;
  file: File;
  extension: string;
  contentType: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
};

const listingMediaBucket = "listing-media";
const productImageWriteOperation = "productImage.write";
const defaultProofMaxAgeMs = 5 * 60_000;
const maxImageFileSizeBytes = 5 * 1024 * 1024;
const noStoreHeaders = {
  "Cache-Control": "no-store"
};
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"]
]);

function normalizeRequired(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value.trim());
}

function isSafeFilename(value: string) {
  const trimmed = value.trim();

  return (
    trimmed.length > 0 &&
    trimmed.length <= 180 &&
    !trimmed.includes("..") &&
    !trimmed.includes("/") &&
    !trimmed.includes("\\") &&
    !/[\u0000-\u001f]/.test(trimmed)
  );
}

function isOptionalText(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim().length <= maxLength;
}

function isUploadedFile(value: unknown): value is File {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as { name?: unknown }).name === "string" &&
    typeof (value as { type?: unknown }).type === "string" &&
    typeof (value as { size?: unknown }).size === "number"
  );
}

function parseOptionalSortOrder(value: FormDataEntryValue | null) {
  if (value === null || value === "") {
    return {
      ok: true as const
    };
  }

  if (typeof value !== "string") {
    return {
      ok: false as const
    };
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 1_000_000
    ? {
        ok: true as const,
        sortOrder: parsed
      }
    : {
        ok: false as const
      };
}

function formText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : undefined;
}

function errorJson(error: string, status: number): NextResponse {
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

function getRouteEnv(dependencies: AdminProductImageUploadRouteDependencies) {
  return getAdminRouteRuntimeConfig(dependencies.env ?? process.env);
}

function getProofMaxAgeMs(dependencies: AdminProductImageUploadRouteDependencies) {
  return typeof dependencies.proofMaxAgeMs === "number" &&
    Number.isFinite(dependencies.proofMaxAgeMs) &&
    dependencies.proofMaxAgeMs > 0
    ? dependencies.proofMaxAgeMs
    : defaultProofMaxAgeMs;
}

function getTimestampMs(dependencies: AdminProductImageUploadRouteDependencies) {
  const now = dependencies.now?.() ?? Date.now();

  return Number.isFinite(now) && now >= 0 ? now : null;
}

async function createDefaultStorageClient(): Promise<ProductImageStorageClientResult> {
  const supabase = await createSessionBoundSupabaseAdminReadClient();

  if (!supabase.configured) {
    return {
      configured: false,
      client: null
    };
  }

  return {
    configured: true,
    client: supabase.client as unknown as ProductImageStorageClient
  };
}

async function authorizeUpload(
  request: NextRequest,
  requestMethod: string,
  dependencies: AdminProductImageUploadRouteDependencies
) {
  const mutationCapability = resolveServerAdminMutationCapability(
    {
      ADMIN_MUTATIONS_ENABLED:
        dependencies.env === undefined
          ? process.env.ADMIN_MUTATIONS_ENABLED
          : dependencies.env.ADMIN_MUTATIONS_ENABLED
    }
  );

  if (!mutationCapability.enabled) {
    return {
      ok: false as const,
      response: errorJson(
        mutationCapability.reason,
        mutationCapability.statusCode
      )
    };
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
        requestedOperation: productImageWriteOperation
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
    return {
      ok: false as const,
      response: errorJson("admin_csrf_session_workspace_binding_unavailable", 503)
    };
  }

  if (!binding.bound) {
    return {
      ok: false as const,
      response: errorJson(binding.reason, binding.statusCode)
    };
  }

  const timestampMs = getTimestampMs(dependencies);

  if (timestampMs === null) {
    return {
      ok: false as const,
      response: errorJson("csrf_verification_failed", 403)
    };
  }

  const verifierContext = {
    expectedSessionBinding: binding.sessionBinding,
    currentTimestampMs: timestampMs,
    maxProofAgeMs: getProofMaxAgeMs(dependencies)
  };
  const verifierRuntimeDependencies = createRuntimeDependencies(verifierContext);
  const resolveRouteGate =
    dependencies.resolveRouteGate ?? resolveServerAdminRuntimeRouteGateAdapter;
  let routeGate: ServerAdminRuntimeRouteGateAdapterResult;

  try {
    routeGate = await resolveRouteGate(
      {
        requestedOperation: productImageWriteOperation,
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
    return {
      ok: false as const,
      response: errorJson("admin_authorization_gate_unavailable", 503)
    };
  }

  if (!routeGate.allowed) {
    return {
      ok: false as const,
      response: errorJson(routeGate.reason, routeGate.statusCode)
    };
  }

  return {
    ok: true as const,
    binding: binding as Extract<
      ServerAdminCsrfProofSessionWorkspaceBindingResult,
      { bound: true }
    >,
    routeEnv
  };
}

async function parseUploadPayload(request: NextRequest) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return {
      ok: false as const,
      error: "request_payload_invalid",
      status: 400
    };
  }

  const productId = formText(formData, "productId");
  const file = formData.get("imageFile");
  const altText = formText(formData, "altText");
  const sortOrder = parseOptionalSortOrder(formData.get("sortOrder"));
  const isPrimary = formText(formData, "isPrimary") === "true";

  if (
    !isUuid(productId) ||
    !isUploadedFile(file) ||
    file.size <= 0 ||
    !sortOrder.ok ||
    (altText !== undefined && !isOptionalText(altText, 240))
  ) {
    return {
      ok: false as const,
      error: "request_payload_invalid",
      status: 400
    };
  }

  if (!isSafeFilename(file.name)) {
    return {
      ok: false as const,
      error: "image_filename_invalid",
      status: 400
    };
  }

  if (file.size > maxImageFileSizeBytes) {
    return {
      ok: false as const,
      error: "image_file_too_large",
      status: 400
    };
  }

  const contentType = file.type.toLowerCase();
  const extension = allowedImageTypes.get(contentType);

  if (!extension) {
    return {
      ok: false as const,
      error: "image_type_unsupported",
      status: 400
    };
  }

  return {
    ok: true as const,
    upload: {
      productId: productId.trim(),
      file,
      extension,
      contentType,
      ...(altText !== undefined ? { altText } : {}),
      ...(sortOrder.sortOrder !== undefined
        ? { sortOrder: sortOrder.sortOrder }
        : {}),
      isPrimary
    } satisfies ParsedUpload
  };
}

async function productExistsInWorkspace(
  client: ProductImageStorageClient,
  productId: string,
  workspaceId: string
) {
  try {
    const query = (client
      .from("products")
      .select("id, workspace_id")
      .eq("id", productId) as {
        eq(column: "workspace_id", value: string): {
          limit(count: 1): Promise<{
            data: unknown;
            error: unknown;
          }>;
        };
      });
    const result = await query.eq("workspace_id", workspaceId).limit(1);

    return !result.error && Array.isArray(result.data) && result.data.length === 1;
  } catch {
    return false;
  }
}

function buildStoragePath(
  workspaceId: string,
  productId: string,
  extension: string,
  dependencies: AdminProductImageUploadRouteDependencies
) {
  const timestamp = getTimestampMs(dependencies) ?? Date.now();
  const uniqueId = dependencies.generateId?.() ?? crypto.randomUUID();

  return `${workspaceId}/${productId}/${timestamp}-${uniqueId}.${extension}`;
}

function publicUrlFromStorage(bucket: StorageBucketClient, storagePath: string) {
  const directUrl = bucket.getPublicUrl(storagePath).data?.publicUrl?.trim();

  if (directUrl) {
    return directUrl;
  }

  return undefined;
}

export async function handleAdminProductImageUploadRoute(
  request: NextRequest,
  dependencies: AdminProductImageUploadRouteDependencies = {}
): Promise<NextResponse> {
  const requestMethod = normalizeRequired(request.method)?.toUpperCase();

  if (requestMethod !== "POST") {
    return errorJson("request_method_not_allowed", 405);
  }

  const authorization = await authorizeUpload(request, requestMethod, dependencies);

  if (!authorization.ok) {
    return authorization.response;
  }

  const parsed = await parseUploadPayload(request);

  if (!parsed.ok) {
    return errorJson(parsed.error, parsed.status);
  }

  const createStorageClient =
    dependencies.createStorageClient ?? createDefaultStorageClient;
  const storageClient = await createStorageClient();

  if (!storageClient.configured) {
    return errorJson("image_storage_unavailable", 503);
  }

  const workspaceId = authorization.binding.adminContext.workspaceId;
  const exists = await productExistsInWorkspace(
    storageClient.client,
    parsed.upload.productId,
    workspaceId
  );

  if (!exists) {
    return errorJson("request_payload_invalid", 400);
  }

  const storagePath = buildStoragePath(
    workspaceId,
    parsed.upload.productId,
    parsed.upload.extension,
    dependencies
  );
  const bucket = storageClient.client.storage.from(listingMediaBucket);
  const uploadResult = await bucket.upload(storagePath, parsed.upload.file, {
    contentType: parsed.upload.contentType,
    upsert: false
  });

  if (uploadResult.error) {
    return errorJson("image_storage_upload_failed", 503);
  }

  const persistence = dependencies.persistence ?? getProductPersistence();
  const result = await persistence.createProductImage({
    admin: authorization.binding.adminContext,
    image: {
      productId: parsed.upload.productId,
      storageBucket: listingMediaBucket,
      storagePath,
      ...(parsed.upload.altText !== undefined
        ? { altText: parsed.upload.altText }
        : {}),
      ...(parsed.upload.sortOrder !== undefined
        ? { sortOrder: parsed.upload.sortOrder }
        : {}),
      isPrimary: parsed.upload.isPrimary
    }
  });

  if (!("ok" in result) || !result.ok) {
    try {
      await bucket.remove([storagePath]);
    } catch {
      // Keep response generic; cleanup failure should not leak provider details.
    }

    return errorJson(persistenceError(result), 503);
  }

  return NextResponse.json(
    {
      ok: true,
      record: result.record,
      image: {
        storageBucket: listingMediaBucket,
        storagePath,
        publicUrl: publicUrlFromStorage(bucket, storagePath)
      }
    },
    {
      status: 201,
      headers: noStoreHeaders
    }
  );
}
