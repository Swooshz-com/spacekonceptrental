import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import {
  createServerAdminCsrfProofRuntimeDependencies,
  type ServerAdminCsrfProofRuntimeDependencies
} from "../admin/authorization/server-admin-csrf-proof-runtime-dependencies";
import {
  resolveServerAdminCsrfProofSessionWorkspaceBinding,
  type ServerAdminCsrfProofSessionWorkspaceBindingDependencies,
  type ServerAdminCsrfProofSessionWorkspaceBindingResult
} from "../admin/authorization/server-admin-csrf-proof-session-workspace-binding";
import { resolveServerAdminMutationCapability } from "../admin/authorization/server-admin-mutation-capability";
import {
  resolveServerAdminRuntimeRouteGateAdapter,
  type ServerAdminRuntimeRouteGateAdapterResult
} from "../admin/authorization/server-admin-runtime-route-gate-adapter";
import { createSessionBoundSupabaseAdminReadClient } from "../admin/authorization/supabase-admin-auth-identity-adapter";
import { getAdminRouteRuntimeConfig } from "../server-runtime-config";
import {
  validateHomepageHeroImageInput,
  type HomepageHeroImageInput
} from "./homepage-hero-content";
import {
  supabaseAdminHomepageHeroPersistence,
  type AdminHomepageHeroPersistence,
  type AdminHomepageHeroPersistenceResult
} from "./admin-homepage-hero-write";

type AdminHomepageHeroWriteRouteEnv = {
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

type HomepageHeroStorageClient = {
  storage: {
    from(bucket: typeof heroMediaBucket): StorageBucketClient;
  };
};

type HomepageHeroStorageClientResult =
  | {
      configured: true;
      client: HomepageHeroStorageClient;
    }
  | {
      configured: false;
      client: null;
    };

export type AdminHomepageHeroWriteRouteDependencies = {
  env?: AdminHomepageHeroWriteRouteEnv;
  now?: () => number;
  generateId?: () => string;
  proofMaxAgeMs?: number;
  persistence?: AdminHomepageHeroPersistence;
  createRuntimeDependencies?: CreateRuntimeDependencies;
  resolveSessionWorkspaceBinding?: typeof resolveServerAdminCsrfProofSessionWorkspaceBinding;
  bindingDependencies?: ServerAdminCsrfProofSessionWorkspaceBindingDependencies;
  resolveRouteGate?: typeof resolveServerAdminRuntimeRouteGateAdapter;
  createStorageClient?: () => Promise<HomepageHeroStorageClientResult>;
};

type ParsedHeroImagePayload = {
  image: HomepageHeroImageInput;
  file?: {
    value: File;
    extension: string;
    contentType: string;
  };
};

type UploadedHeroImage = {
  storageBucket: typeof heroMediaBucket;
  storagePath: string;
  publicUrl?: string;
};

const heroWriteOperation = "hero.write";
const heroMediaBucket = "hero-media";
const defaultProofMaxAgeMs = 5 * 60_000;
const maxImageFileSizeBytes = 5 * 1024 * 1024;
const noStoreHeaders = {
  "Cache-Control": "no-store"
};
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

function formText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : undefined;
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

function successJson(
  result: AdminHomepageHeroPersistenceResult,
  uploadedImage?: UploadedHeroImage
) {
  if (!("ok" in result) || !result.ok) {
    return errorJson("hero_persistence_failed", 503);
  }

  return NextResponse.json(
    {
      ok: true,
      record: result.record,
      ...(uploadedImage ? { image: uploadedImage } : {})
    },
    {
      status: 200,
      headers: noStoreHeaders
    }
  );
}

function getProofMaxAgeMs(
  dependencies: AdminHomepageHeroWriteRouteDependencies
) {
  return typeof dependencies.proofMaxAgeMs === "number" &&
    Number.isFinite(dependencies.proofMaxAgeMs) &&
    dependencies.proofMaxAgeMs > 0
    ? dependencies.proofMaxAgeMs
    : defaultProofMaxAgeMs;
}

function getTimestampMs(dependencies: AdminHomepageHeroWriteRouteDependencies) {
  const now = dependencies.now?.() ?? Date.now();

  return Number.isFinite(now) && now >= 0 ? now : null;
}

function persistenceError(result: AdminHomepageHeroPersistenceResult) {
  if (!("ok" in result) || result.ok) {
    return "hero_persistence_failed";
  }

  switch (result.code) {
    case "HERO_ADMIN_CONTEXT_INVALID":
      return "hero_admin_context_invalid";
    case "HERO_PERSISTENCE_UNAVAILABLE":
      return "hero_persistence_unavailable";
    case "HERO_PERSISTENCE_FAILED":
      return "hero_persistence_failed";
  }
}

async function createDefaultStorageClient(): Promise<HomepageHeroStorageClientResult> {
  const supabase = await createSessionBoundSupabaseAdminReadClient();

  if (!supabase.configured) {
    return {
      configured: false,
      client: null
    };
  }

  return {
    configured: true,
    client: supabase.client as unknown as HomepageHeroStorageClient
  };
}

async function verifyAdminWriteBoundary(
  request: NextRequest,
  requestMethod: string,
  dependencies: AdminHomepageHeroWriteRouteDependencies
): Promise<
  | {
      ok: true;
      binding: Extract<
        ServerAdminCsrfProofSessionWorkspaceBindingResult,
        { bound: true }
      >;
    }
  | {
      ok: false;
      response: NextResponse;
    }
> {
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
      ok: false,
      response: errorJson(
        mutationCapability.reason,
        mutationCapability.statusCode
      )
    };
  }

  const routeEnv = getAdminRouteRuntimeConfig(
    dependencies.env ?? process.env
  );
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
        requestedOperation: heroWriteOperation
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
      ok: false,
      response: errorJson(
        "admin_csrf_session_workspace_binding_unavailable",
        503
      )
    };
  }

  if (!binding.bound) {
    return {
      ok: false,
      response: errorJson(binding.reason, binding.statusCode)
    };
  }

  const timestampMs = getTimestampMs(dependencies);

  if (timestampMs === null) {
    return {
      ok: false,
      response: errorJson("csrf_verification_failed", 403)
    };
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
        requestedOperation: heroWriteOperation,
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
      ok: false,
      response: errorJson("admin_authorization_gate_unavailable", 503)
    };
  }

  if (!routeGate.allowed) {
    return {
      ok: false,
      response: errorJson(routeGate.reason, routeGate.statusCode)
    };
  }

  return {
    ok: true,
    binding
  };
}

async function parseHeroImagePayload(request: NextRequest) {
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

  const imageAlt = formText(formData, "imageAlt") ?? "";
  const isEnabled = formText(formData, "isEnabled") === "true";
  const validation = validateHomepageHeroImageInput(
    {
      imageAlt,
      isEnabled
    },
    {
      imageUrlRequired: false
    }
  );

  if (!validation.ok) {
    return {
      ok: false as const,
      error: validation.error,
      status: 400
    };
  }

  const file = formData.get("imageFile");

  if (file === null) {
    return {
      ok: true as const,
      payload: {
        image: validation.image
      } satisfies ParsedHeroImagePayload
    };
  }

  if (!isUploadedFile(file) || file.size <= 0) {
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
    payload: {
      image: validation.image,
      file: {
        value: file,
        extension,
        contentType
      }
    } satisfies ParsedHeroImagePayload
  };
}

function buildStoragePath(
  workspaceId: string,
  extension: string,
  dependencies: AdminHomepageHeroWriteRouteDependencies
) {
  const timestamp = getTimestampMs(dependencies) ?? Date.now();
  const uniqueId = dependencies.generateId?.() ?? crypto.randomUUID();

  return `${workspaceId}/homepage-hero/${timestamp}-${uniqueId}.${extension}`;
}

function publicUrlFromStorage(bucket: StorageBucketClient, storagePath: string) {
  const directUrl = bucket.getPublicUrl(storagePath).data?.publicUrl?.trim();

  return directUrl || undefined;
}

async function uploadHeroImage(
  payload: ParsedHeroImagePayload,
  workspaceId: string,
  dependencies: AdminHomepageHeroWriteRouteDependencies
) {
  if (!payload.file) {
    return {
      ok: true as const,
      image: payload.image,
      uploadedImage: undefined
    };
  }

  const createStorageClient =
    dependencies.createStorageClient ?? createDefaultStorageClient;
  const storageClient = await createStorageClient();

  if (!storageClient.configured) {
    return {
      ok: false as const,
      response: errorJson("image_storage_unavailable", 503)
    };
  }

  const storagePath = buildStoragePath(
    workspaceId,
    payload.file.extension,
    dependencies
  );
  const bucket = storageClient.client.storage.from(heroMediaBucket);
  const uploadResult = await bucket.upload(storagePath, payload.file.value, {
    contentType: payload.file.contentType,
    upsert: false
  });

  if (uploadResult.error) {
    return {
      ok: false as const,
      response: errorJson("image_storage_upload_failed", 503)
    };
  }

  const publicUrl = publicUrlFromStorage(bucket, storagePath);

  if (!publicUrl) {
    try {
      await bucket.remove([storagePath]);
    } catch {
      // Keep response generic; cleanup failure should not leak provider details.
    }

    return {
      ok: false as const,
      response: errorJson("image_storage_public_url_unavailable", 503)
    };
  }

  const uploadedImage = {
    storageBucket: heroMediaBucket,
    storagePath,
    publicUrl
  } satisfies UploadedHeroImage;

  return {
    ok: true as const,
    image: {
      ...payload.image,
      imageUrl: uploadedImage.publicUrl
    },
    uploadedImage,
    cleanup: async () => {
      try {
        await bucket.remove([storagePath]);
      } catch {
        // Keep response generic; cleanup failure should not leak provider details.
      }
    }
  };
}

export async function handleAdminHomepageHeroWriteRoute(
  request: NextRequest,
  dependencies: AdminHomepageHeroWriteRouteDependencies = {}
): Promise<NextResponse> {
  const requestMethod = normalizeRequired(request.method)?.toUpperCase();

  if (requestMethod !== "POST") {
    return errorJson("request_method_not_allowed", 405);
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return errorJson("request_content_type_unsupported", 415);
  }

  const gate = await verifyAdminWriteBoundary(
    request,
    requestMethod,
    dependencies
  );

  if (!gate.ok) {
    return gate.response;
  }

  const parsed = await parseHeroImagePayload(request);

  if (!parsed.ok) {
    return errorJson(parsed.error, parsed.status);
  }

  const upload = await uploadHeroImage(
    parsed.payload,
    gate.binding.adminContext.workspaceId,
    dependencies
  );

  if (!upload.ok) {
    return upload.response;
  }

  const persistence =
    dependencies.persistence ?? supabaseAdminHomepageHeroPersistence;
  const result = await persistence.upsertHomepageHeroImage({
    admin: gate.binding.adminContext,
    image: upload.image
  });

  if (!("ok" in result) || !result.ok) {
    if (upload.cleanup) {
      await upload.cleanup();
    }

    return errorJson(persistenceError(result), 503);
  }

  return successJson(result, upload.uploadedImage);
}
