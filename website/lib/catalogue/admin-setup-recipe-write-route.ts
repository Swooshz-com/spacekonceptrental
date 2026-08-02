import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { getAdminRouteRuntimeConfig } from "../server-runtime-config";
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
import { readServerAdminCsrfProofOperation } from "../admin/authorization/server-admin-csrf-proof-verifier";
import {
  executeAdminSetupRecipeWrite,
  readAdminSetupRecipe
} from "./setup-recipe-repository";
import type {
  AdminRecipeWriteRequest,
  AdminRecipeWriteResult
} from "./setup-recipe-types";
import { readBoundedJsonBody } from "../admin/api/bounded-json-body-reader";

type AdminSetupRecipeRouteEnv = {
  ADMIN_EXPECTED_ORIGIN?: string | null;
  ADMIN_EXPECTED_HOST?: string | null;
  ADMIN_TRUSTED_WORKSPACE_ID?: string | null;
  ADMIN_MUTATIONS_ENABLED?: string | null;
};

type CreateRuntimeDependencies = (
  verifierContext?: Parameters<typeof createServerAdminCsrfProofRuntimeDependencies>[0]
) => ServerAdminCsrfProofRuntimeDependencies;

type AdminSetupRecipeOperation =
  | "admin.setupRecipe.read"
  | "admin.setupRecipe.write";

const defaultProofMaxAgeMs = 5 * 60_000;

export type AdminSetupRecipeRouteDependencies = {
  env?: AdminSetupRecipeRouteEnv;
  createRuntimeDependencies?: CreateRuntimeDependencies;
  resolveSessionWorkspaceBinding?: typeof resolveServerAdminCsrfProofSessionWorkspaceBinding;
  resolveRouteGate?: typeof resolveServerAdminRuntimeRouteGateAdapter;
  bindingDependencies?: ServerAdminCsrfProofSessionWorkspaceBindingDependencies;
  readRecipe?: typeof readAdminSetupRecipe;
  executeWrite?: typeof executeAdminSetupRecipeWrite;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function safeJsonResponse(
  body: Record<string, unknown>,
  status: number
): NextResponse {
  return NextResponse.json(body, { status });
}

function getTimestampMs() {
  const now = Date.now();
  return Number.isFinite(now) && now >= 0 ? now : null;
}

async function adminAuthCheck(
  request: NextRequest,
  dependencies: AdminSetupRecipeRouteDependencies,
  requestedOperation: AdminSetupRecipeOperation
): Promise<{
  allowed: boolean;
  workspaceId: string;
  response?: NextResponse;
}> {
  const routeEnv = dependencies.env ?? process.env;
  const mutationCapability = resolveServerAdminMutationCapability(
    { ADMIN_MUTATIONS_ENABLED: routeEnv.ADMIN_MUTATIONS_ENABLED }
  );

  if (!mutationCapability.enabled) {
    return {
      allowed: false,
      workspaceId: "",
      response: safeJsonResponse(
        { error: mutationCapability.reason },
        mutationCapability.statusCode
      )
    };
  }

  const routeConfig = getAdminRouteRuntimeConfig(
    routeEnv
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
        requestedOperation
      },
      {
        ...(dependencies.bindingDependencies ?? {}),
        workspace: {
          trustedServerWorkspaceId:
            routeEnv.ADMIN_TRUSTED_WORKSPACE_ID ??
            routeConfig.trustedServerWorkspaceId
        },
        ...runtimeDependencies.sessionWorkspaceBindingDependencies
      }
    );
  } catch {
    return {
      allowed: false,
      workspaceId: "",
      response: safeJsonResponse(
        { error: "admin_csrf_session_workspace_binding_unavailable" },
        503
      )
    };
  }

  if (!binding.bound) {
    return {
      allowed: false,
      workspaceId: "",
      response: safeJsonResponse(
        { error: "submission_not_allowed" },
        403
      )
    };
  }

  const resolveRouteGate =
    dependencies.resolveRouteGate ??
    resolveServerAdminRuntimeRouteGateAdapter;
  const verifierContext = {
    expectedSessionBinding: binding.sessionBinding,
    expectedWorkspaceId: binding.adminContext.workspaceId,
    currentTimestampMs: getTimestampMs(),
    maxProofAgeMs: defaultProofMaxAgeMs
  };
  const verifierRuntimeDependencies = createRuntimeDependencies(verifierContext);
  let routeGate: ServerAdminRuntimeRouteGateAdapterResult;

  try {
    routeGate = await resolveRouteGate(
      {
        requestedOperation,
        requestMethod: request.method,
        request: { method: request.method },
        requiresMutationCapability: true
      },
      {
        requestMetadata: {
          expectedOrigin:
            routeEnv.ADMIN_EXPECTED_ORIGIN ?? routeConfig.expectedOrigin,
          expectedHost:
            routeEnv.ADMIN_EXPECTED_HOST ?? routeConfig.expectedHost
        },
        gate: {
          csrfVerifier: {
            ...verifierContext,
            ...verifierRuntimeDependencies.verifierDependencies
          },
          decision: {
            workspace: {
              trustedServerWorkspaceId:
                routeEnv.ADMIN_TRUSTED_WORKSPACE_ID ??
                routeConfig.trustedServerWorkspaceId
            }
          }
        }
      }
    );
  } catch {
    return {
      allowed: false,
      workspaceId: "",
      response: safeJsonResponse(
        { error: "admin_authorization_gate_unavailable" },
        503
      )
    };
  }

  if (!routeGate.allowed) {
    return {
      allowed: false,
      workspaceId: "",
      response: safeJsonResponse(
        { error: routeGate.reason ?? "submission_not_allowed" },
        routeGate.statusCode ?? 403
      )
    };
  }

  const workspaceId =
    routeEnv.ADMIN_TRUSTED_WORKSPACE_ID ??
    routeConfig.trustedServerWorkspaceId ??
    "";

  if (!workspaceId) {
    return {
      allowed: false,
      workspaceId: "",
      response: safeJsonResponse(
        { error: "workspace_not_configured" },
        503
      )
    };
  }

  return { allowed: true, workspaceId };
}

export async function handleAdminSetupRecipeRoute(
  request: NextRequest,
  dependencies: AdminSetupRecipeRouteDependencies = {}
): Promise<NextResponse> {
  const signedOperation = readServerAdminCsrfProofOperation(
    request.headers.get("x-csrf-proof")
  );
  const requestedOperation: AdminSetupRecipeOperation | null =
    signedOperation === "admin.setupRecipe.read" ||
    signedOperation === "admin.setupRecipe.write"
      ? signedOperation
      : null;

  if (!requestedOperation) {
    return safeJsonResponse({ error: "csrf_proof_invalid" }, 403);
  }

  const auth = await adminAuthCheck(
    request,
    dependencies,
    requestedOperation
  );
  if (!auth.allowed) {
    return auth.response!;
  }

  const parsed = await readBoundedJsonBody(request, 65536);

  if (!parsed.ok) {
    return safeJsonResponse({ error: parsed.error }, parsed.status);
  }

  const payload = parsed.body;
  const action = payload.action;
  const bodyOperation =
    action === "read"
      ? "admin.setupRecipe.read"
      : action === "write"
        ? "admin.setupRecipe.write"
        : null;

  if (!bodyOperation) {
    return safeJsonResponse({ error: "unknown_action" }, 400);
  }

  if (bodyOperation !== requestedOperation) {
    return safeJsonResponse({ error: "csrf_proof_mismatched" }, 403);
  }

  if (action === "read") {
    const setupProductId =
      typeof payload.setupProductId === "string"
        ? payload.setupProductId.trim()
        : "";

    if (!setupProductId) {
      return safeJsonResponse({ error: "setup_product_id_required" }, 400);
    }

    const readRecipe = dependencies.readRecipe ?? readAdminSetupRecipe;
    const readResult = await readRecipe(
      auth.workspaceId,
      setupProductId
    );

    if (!readResult.ok) {
      return safeJsonResponse(
        { error: readResult.code },
        readResult.code === "unauthorized"
          ? 403
          : readResult.code === "not-found"
            ? 404
            : 503
      );
    }

    return safeJsonResponse(
      {
        revision: readResult.revision,
        items: readResult.items.map((item) => ({
          included_product_id: item.included_product_id,
          position: item.position,
          base_quantity: item.base_quantity
        }))
      },
      200
    );
  }

  if (action === "write") {
    const operation = payload.operation;
    if (operation !== "replace" && operation !== "remove") {
      return safeJsonResponse({ error: "unsupported_operation" }, 400);
    }

    const setupProductId =
      typeof payload.setupProductId === "string"
        ? payload.setupProductId.trim()
        : "";

    if (!setupProductId) {
      return safeJsonResponse({ error: "setup_product_id_required" }, 400);
    }

    const expectedRevision =
      typeof payload.expectedRevision === "number"
        ? payload.expectedRevision
        : NaN;

    if (!Number.isFinite(expectedRevision)) {
      return safeJsonResponse({ error: "expected_revision_required" }, 400);
    }

    const rawItems = payload.items;

    if (operation === "remove") {
      const request: AdminRecipeWriteRequest = {
        operation: "remove",
        expectedWorkspaceId: auth.workspaceId,
        setupProductId,
        expectedRevision,
        items: []
      };

      const executeWrite = dependencies.executeWrite ?? executeAdminSetupRecipeWrite;
      const result = await executeWrite(request);

      return mapWriteResult(result);
    }

    if (!Array.isArray(rawItems)) {
      return safeJsonResponse({ error: "items_array_required" }, 400);
    }

    if (rawItems.length < 1 || rawItems.length > 20) {
      return safeJsonResponse({ error: "item_count_invalid" }, 400);
    }

    const items = rawItems.map((item, index) => {
      if (!isObject(item)) return null;
      const id =
        typeof item.included_product_id === "string"
          ? item.included_product_id.trim()
          : "";
      const pos = typeof item.position === "number" ? item.position : NaN;
      const qty =
        typeof item.base_quantity === "number" ? item.base_quantity : NaN;

      if (!id || !Number.isInteger(pos) || pos < 0 || pos > 19) return null;
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) return null;

      return {
        included_product_id: id,
        position: pos,
        base_quantity: qty
      };
    });

    if (items.some((item) => item === null)) {
      return safeJsonResponse({ error: "invalid_item" }, 400);
    }

    const validItems = items.filter(
      (item): item is NonNullable<typeof item> => item !== null
    );

    const ids = new Set(validItems.map((i) => i.included_product_id));
    if (ids.size !== validItems.length) {
      return safeJsonResponse({ error: "duplicate_child" }, 400);
    }

    const positions = new Set(validItems.map((i) => i.position));
    if (positions.size !== validItems.length) {
      return safeJsonResponse({ error: "duplicate_position" }, 400);
    }

    for (let p = 0; p < validItems.length; p++) {
      if (!positions.has(p)) {
        return safeJsonResponse({ error: "positions_not_contiguous" }, 400);
      }
    }

    const request: AdminRecipeWriteRequest = {
      operation: "replace",
      expectedWorkspaceId: auth.workspaceId,
      setupProductId,
      expectedRevision,
      items: validItems
    };

    const executeWrite = dependencies.executeWrite ?? executeAdminSetupRecipeWrite;
    const result = await executeWrite(request);

    return mapWriteResult(result);
  }

  return safeJsonResponse({ error: "unknown_action" }, 400);
}

function mapWriteResult(result: AdminRecipeWriteResult): NextResponse {
  if (result.ok) {
    return safeJsonResponse(
      {
        ok: true,
        operation: result.operation,
        setup_product_id: result.setupProductId,
        revision: result.revision,
        item_count: result.itemCount
      },
      200
    );
  }

  const status = result.code === "conflict"
    ? 409
    : result.code === "unauthorized"
      ? 403
      : result.code === "rpc-unavailable" ||
          result.code === "rpc-failure" ||
          result.code === "network-error" ||
          result.code === "unknown-error"
        ? 503
        : 400;

  return safeJsonResponse({ error: result.code }, status);
}
