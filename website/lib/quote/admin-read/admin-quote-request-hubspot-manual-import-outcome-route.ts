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
import { getAdminRouteRuntimeConfig } from "../../server-runtime-config";
import {
  adminQuoteRequestHubSpotManualImportOutcomeLedgerPersistence,
  adminQuoteRequestHubSpotManualImportOutcomeStatuses,
  type AdminQuoteRequestHubSpotManualImportOutcomeLedgerPersistence,
  type AdminQuoteRequestHubSpotManualImportOutcomeRecordResult,
  type AdminQuoteRequestHubSpotManualImportOutcomeStatus
} from "./admin-quote-request-hubspot-manual-import-outcome-ledger";

type AdminQuoteRequestHubSpotManualImportOutcomeRouteEnv = {
  ADMIN_EXPECTED_ORIGIN?: string | null;
  ADMIN_EXPECTED_HOST?: string | null;
  ADMIN_TRUSTED_WORKSPACE_ID?: string | null;
};

export type AdminQuoteRequestHubSpotManualImportOutcomeRouteDependencies = {
  env?: AdminQuoteRequestHubSpotManualImportOutcomeRouteEnv;
  now?: () => number;
  proofMaxAgeMs?: number;
  persistence?: AdminQuoteRequestHubSpotManualImportOutcomeLedgerPersistence;
  createRuntimeDependencies?: CreateRuntimeDependencies;
  resolveSessionWorkspaceBinding?: typeof resolveServerAdminCsrfProofSessionWorkspaceBinding;
  bindingDependencies?: ServerAdminCsrfProofSessionWorkspaceBindingDependencies;
  resolveRouteGate?: typeof resolveServerAdminRuntimeRouteGateAdapter;
};

const noStoreHeaders = {
  "Cache-Control": "no-store"
};
const defaultProofMaxAgeMs = 5 * 60_000;
const recentOutcomeLimit = 10;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CreateRuntimeDependencies = (
  verifierContext?: Parameters<typeof createServerAdminCsrfProofRuntimeDependencies>[0]
) => ServerAdminCsrfProofRuntimeDependencies;

function normalizeRequired(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value.trim());
}

function isOutcomeStatus(
  value: unknown
): value is AdminQuoteRequestHubSpotManualImportOutcomeStatus {
  return adminQuoteRequestHubSpotManualImportOutcomeStatuses.includes(
    value as AdminQuoteRequestHubSpotManualImportOutcomeStatus
  );
}

function getRouteEnv(
  dependencies: AdminQuoteRequestHubSpotManualImportOutcomeRouteDependencies
) {
  return getAdminRouteRuntimeConfig(dependencies.env ?? process.env);
}

function getProofMaxAgeMs(
  dependencies: AdminQuoteRequestHubSpotManualImportOutcomeRouteDependencies
) {
  return typeof dependencies.proofMaxAgeMs === "number" &&
    Number.isFinite(dependencies.proofMaxAgeMs) &&
    dependencies.proofMaxAgeMs > 0
    ? dependencies.proofMaxAgeMs
    : defaultProofMaxAgeMs;
}

function getTimestampMs(
  dependencies: AdminQuoteRequestHubSpotManualImportOutcomeRouteDependencies
) {
  const now = dependencies.now?.() ?? Date.now();

  return Number.isFinite(now) && now >= 0 ? now : null;
}

async function parseBody(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;

    if (
      !isRecord(body) ||
      !isUuid(body.manifestId) ||
      !isOutcomeStatus(body.outcomeStatus)
    ) {
      return null;
    }

    return {
      manifestId: body.manifestId.trim(),
      outcomeStatus: body.outcomeStatus
    };
  } catch {
    return null;
  }
}

function persistenceError(
  result: Exclude<
    AdminQuoteRequestHubSpotManualImportOutcomeRecordResult,
    { status: "created" }
  >
) {
  switch (result.status) {
    case "invalid_admin_context":
    case "invalid_manifest_id":
    case "invalid_outcome_status":
    case "invalid_manifest":
      return {
        error: "request_body_invalid",
        status: 400
      };
    case "unavailable":
      return {
        error: "quote_crm_handoff_manual_import_outcome_unavailable",
        status: 503
      };
  }
}

export async function handleAdminQuoteRequestHubSpotManualImportOutcomeRoute(
  request: NextRequest,
  dependencies: AdminQuoteRequestHubSpotManualImportOutcomeRouteDependencies = {}
): Promise<NextResponse> {
  const requestMethod = normalizeRequired(request.method)?.toUpperCase();

  if (requestMethod !== "POST") {
    return errorJson("request_method_not_allowed", 405);
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
        request
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

  const body = await parseBody(request);

  if (!body) {
    return errorJson("request_body_invalid", 400);
  }

  const persistence =
    dependencies.persistence ??
    adminQuoteRequestHubSpotManualImportOutcomeLedgerPersistence;
  const result = await persistence.recordOutcome({
    admin: binding.adminContext,
    manifestId: body.manifestId,
    outcomeStatus: body.outcomeStatus
  });

  if (result.status !== "created") {
    const mapped = persistenceError(result);

    return errorJson(mapped.error, mapped.status);
  }

  const recent = await persistence.readRecentOutcomes({
    admin: binding.adminContext,
    limit: recentOutcomeLimit
  });
  const recentOutcomes =
    recent.status === "loaded" ? recent.outcomes : [result.outcome];

  return NextResponse.json(
    {
      ok: true,
      outcome: result.outcome,
      recentOutcomes
    },
    {
      status: 200,
      headers: noStoreHeaders
    }
  );
}
