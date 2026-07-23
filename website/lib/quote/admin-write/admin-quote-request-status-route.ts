import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { readBoundedJsonBody } from "../../admin/api/bounded-json-body-reader";
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
import {
  adminQuoteRequestStatusWritePersistence,
  type AdminQuoteRequestStatus,
  type AdminQuoteRequestStatusWritePersistence,
  type AdminQuoteRequestStatusWriteResult
} from "./admin-quote-request-status-write";
import { getAdminRouteRuntimeConfig } from "../../server-runtime-config";

type AdminQuoteRequestStatusUpdateRouteEnv = {
  ADMIN_EXPECTED_ORIGIN?: string | null;
  ADMIN_EXPECTED_HOST?: string | null;
  ADMIN_TRUSTED_WORKSPACE_ID?: string | null;
};

type CreateRuntimeDependencies = (
  verifierContext?: Parameters<typeof createServerAdminCsrfProofRuntimeDependencies>[0]
) => ServerAdminCsrfProofRuntimeDependencies;

export type AdminQuoteRequestStatusUpdateRouteDependencies = {
  env?: AdminQuoteRequestStatusUpdateRouteEnv;
  now?: () => number;
  proofMaxAgeMs?: number;
  persistence?: AdminQuoteRequestStatusWritePersistence;
  createRuntimeDependencies?: CreateRuntimeDependencies;
  resolveSessionWorkspaceBinding?: typeof resolveServerAdminCsrfProofSessionWorkspaceBinding;
  bindingDependencies?: ServerAdminCsrfProofSessionWorkspaceBindingDependencies;
  resolveRouteGate?: typeof resolveServerAdminRuntimeRouteGateAdapter;
};

type AdminQuoteRequestStatusUpdateRouteConfig = {
  quoteRequestId: string;
};

type AdminQuoteRequestStatusUpdateRouteError = string;

type PayloadParseResult =
  | {
      ok: true;
      status: AdminQuoteRequestStatus;
    }
  | {
      ok: false;
    };

const noStoreHeaders = {
  "Cache-Control": "no-store"
};
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const quoteRequestStatuses = new Set<AdminQuoteRequestStatus>([
  "new",
  "reviewing",
  "follow_up_needed",
  "quoted",
  "closed"
]);
const defaultProofMaxAgeMs = 5 * 60_000;

function normalizeRequired(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value.trim());
}

function isQuoteRequestStatus(value: unknown): value is AdminQuoteRequestStatus {
  return (
    typeof value === "string" &&
    quoteRequestStatuses.has(value as AdminQuoteRequestStatus)
  );
}

function hasOnlyKeys(body: Record<string, unknown>, keys: string[]) {
  const allowed = new Set(keys);

  return Object.keys(body).every((key) => allowed.has(key));
}

function errorJson(
  error: AdminQuoteRequestStatusUpdateRouteError,
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

function successJson(result: AdminQuoteRequestStatusWriteResult) {
  if (!("ok" in result) || !result.ok) {
    return errorJson("quote_status_update_failed", 503);
  }

  return NextResponse.json(
    {
      ok: true,
      record: result.record
    },
    {
      status: 200,
      headers: noStoreHeaders
    }
  );
}

function parsePayload(body: Record<string, unknown>): PayloadParseResult {
  if (
    !hasOnlyKeys(body, ["status"]) ||
    !isQuoteRequestStatus(body.status)
  ) {
    return {
      ok: false
    };
  }

  return {
    ok: true,
    status: body.status
  };
}

function getRouteEnv(
  dependencies: AdminQuoteRequestStatusUpdateRouteDependencies
) {
  return getAdminRouteRuntimeConfig(dependencies.env ?? process.env);
}

function getProofMaxAgeMs(
  dependencies: AdminQuoteRequestStatusUpdateRouteDependencies
) {
  return typeof dependencies.proofMaxAgeMs === "number" &&
    Number.isFinite(dependencies.proofMaxAgeMs) &&
    dependencies.proofMaxAgeMs > 0
    ? dependencies.proofMaxAgeMs
    : defaultProofMaxAgeMs;
}

function getTimestampMs(
  dependencies: AdminQuoteRequestStatusUpdateRouteDependencies
) {
  const now = dependencies.now?.() ?? Date.now();

  return Number.isFinite(now) && now >= 0 ? now : null;
}

function persistenceError(result: AdminQuoteRequestStatusWriteResult) {
  if (!("ok" in result) || result.ok) {
    return "quote_status_update_failed";
  }

  switch (result.code) {
    case "QUOTE_STATUS_UPDATE_UNAVAILABLE":
      return "quote_status_update_unavailable";
    case "QUOTE_ADMIN_CONTEXT_INVALID":
      return "quote_admin_context_invalid";
    case "QUOTE_STATUS_UPDATE_FAILED":
      return "quote_status_update_failed";
  }
}

export async function handleAdminQuoteRequestStatusUpdateRoute(
  request: NextRequest,
  config: AdminQuoteRequestStatusUpdateRouteConfig,
  dependencies: AdminQuoteRequestStatusUpdateRouteDependencies = {}
): Promise<NextResponse> {
  const requestMethod = normalizeRequired(request.method)?.toUpperCase();

  if (requestMethod !== "POST") {
    return errorJson("request_method_not_allowed", 405);
  }

  if (!isUuid(config.quoteRequestId)) {
    return errorJson("quote_request_id_invalid", 400);
  }

  const body = await readBoundedJsonBody(request);

  if (!body.ok) {
    return errorJson(body.error, body.status);
  }

  const payload = parsePayload(body.body);

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
        requestedOperation: "quote.write"
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
  const verifierRuntimeDependencies =
    createRuntimeDependencies(verifierContext);
  let routeGate: ServerAdminRuntimeRouteGateAdapterResult;

  try {
    routeGate = await resolveRouteGate(
      {
        requestedOperation: "quote.write",
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

  const persistence =
    dependencies.persistence ?? adminQuoteRequestStatusWritePersistence;
  const result = await persistence.updateStatus({
    admin: binding.adminContext,
    quoteRequestId: config.quoteRequestId.trim(),
    status: payload.status
  });

  if (!("ok" in result) || !result.ok) {
    return errorJson(persistenceError(result), 503);
  }

  return successJson(result);
}
