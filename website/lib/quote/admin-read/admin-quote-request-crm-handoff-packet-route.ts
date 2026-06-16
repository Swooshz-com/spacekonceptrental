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
  adminQuoteRequestCrmHandoffPacketReadPersistence,
  type AdminQuoteRequestCrmHandoffPacketReadPersistence,
  type AdminQuoteRequestCrmHandoffPacketReadResult
} from "./admin-quote-request-crm-handoff-packet-read";
import {
  adminQuoteRequestCrmHandoffPacketManifestPersistence,
  type AdminQuoteRequestCrmHandoffPacketManifestPersistence,
  type AdminQuoteRequestCrmHandoffPacketManifestReadResult
} from "./admin-quote-request-crm-handoff-packet-manifest";

type AdminQuoteRequestCrmHandoffPacketRouteEnv = {
  ADMIN_EXPECTED_ORIGIN?: string | null;
  ADMIN_EXPECTED_HOST?: string | null;
  ADMIN_TRUSTED_WORKSPACE_ID?: string | null;
};

export type AdminQuoteRequestCrmHandoffPacketRouteDependencies = {
  env?: AdminQuoteRequestCrmHandoffPacketRouteEnv;
  generatedAt?: () => string;
  now?: () => number;
  proofMaxAgeMs?: number;
  persistence?: AdminQuoteRequestCrmHandoffPacketReadPersistence;
  manifestPersistence?: AdminQuoteRequestCrmHandoffPacketManifestPersistence;
  createRuntimeDependencies?: CreateRuntimeDependencies;
  resolveSessionWorkspaceBinding?: typeof resolveServerAdminCsrfProofSessionWorkspaceBinding;
  bindingDependencies?: ServerAdminCsrfProofSessionWorkspaceBindingDependencies;
  resolveRouteGate?: typeof resolveServerAdminRuntimeRouteGateAdapter;
};

const noStoreHeaders = {
  "Cache-Control": "no-store"
};
const defaultProofMaxAgeMs = 5 * 60_000;

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

function successJson(
  result: AdminQuoteRequestCrmHandoffPacketReadResult,
  manifestResult: Awaited<
    ReturnType<AdminQuoteRequestCrmHandoffPacketManifestPersistence["createManifest"]>
  >,
  recentManifestResult: AdminQuoteRequestCrmHandoffPacketManifestReadResult
) {
  if (!("status" in result) || result.status !== "loaded") {
    return errorJson("quote_crm_handoff_packet_unavailable", 503);
  }

  if (manifestResult.status !== "created") {
    return errorJson("quote_crm_handoff_packet_manifest_unavailable", 503);
  }

  if (recentManifestResult.status !== "loaded") {
    return errorJson("quote_crm_handoff_packet_manifest_unavailable", 503);
  }

  return NextResponse.json(
    {
      ok: true,
      packet: result.packet,
      manifest: manifestResult.manifest,
      recentManifests: recentManifestResult.manifests
    },
    {
      status: 200,
      headers: noStoreHeaders
    }
  );
}

function getSearchParams(request: NextRequest) {
  return new URL(request.url).searchParams;
}

function parseLimit(request: NextRequest) {
  const rawLimit = getSearchParams(request).get("limit");

  if (rawLimit === null) {
    return 25;
  }

  if (!/^[0-9]+$/.test(rawLimit)) {
    return null;
  }

  const limit = Number(rawLimit);

  return Number.isInteger(limit) && limit > 0 ? limit : null;
}

function hasSupportedFilters(request: NextRequest) {
  const status = getSearchParams(request).get("status");

  return status === null || status === "queued";
}

function getRouteEnv(
  dependencies: AdminQuoteRequestCrmHandoffPacketRouteDependencies
) {
  return getAdminRouteRuntimeConfig(dependencies.env ?? process.env);
}

function getProofMaxAgeMs(
  dependencies: AdminQuoteRequestCrmHandoffPacketRouteDependencies
) {
  return typeof dependencies.proofMaxAgeMs === "number" &&
    Number.isFinite(dependencies.proofMaxAgeMs) &&
    dependencies.proofMaxAgeMs > 0
    ? dependencies.proofMaxAgeMs
    : defaultProofMaxAgeMs;
}

function getTimestampMs(
  dependencies: AdminQuoteRequestCrmHandoffPacketRouteDependencies
) {
  const now = dependencies.now?.() ?? Date.now();

  return Number.isFinite(now) && now >= 0 ? now : null;
}

function persistenceError(result: AdminQuoteRequestCrmHandoffPacketReadResult) {
  switch (result.status) {
    case "invalid_limit":
      return {
        error: "request_limit_invalid",
        status: 400
      };
    case "unavailable":
    case "loaded":
      return {
        error: "quote_crm_handoff_packet_unavailable",
        status: 503
      };
  }
}

export async function handleAdminQuoteRequestCrmHandoffPacketRoute(
  request: NextRequest,
  dependencies: AdminQuoteRequestCrmHandoffPacketRouteDependencies = {}
): Promise<NextResponse> {
  const requestMethod = normalizeRequired(request.method)?.toUpperCase();

  if (requestMethod !== "POST") {
    return errorJson("request_method_not_allowed", 405);
  }

  if (!hasSupportedFilters(request)) {
    return errorJson("request_filter_invalid", 400);
  }

  const limit = parseLimit(request);

  if (!limit) {
    return errorJson("request_limit_invalid", 400);
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

  const persistence =
    dependencies.persistence ?? adminQuoteRequestCrmHandoffPacketReadPersistence;
  const result = await persistence.readPacket({
    generatedAt: dependencies.generatedAt?.(),
    limit,
    env: {
      ADMIN_TRUSTED_WORKSPACE_ID: routeEnv.trustedServerWorkspaceId
    }
  });

  if (result.status !== "loaded") {
    const mapped = persistenceError(result);

    return errorJson(mapped.error, mapped.status);
  }

  const manifestPersistence =
    dependencies.manifestPersistence ??
    adminQuoteRequestCrmHandoffPacketManifestPersistence;
  const manifestResult = await manifestPersistence.createManifest({
    admin: binding.adminContext,
    packet: result.packet
  });

  if (manifestResult.status !== "created") {
    return errorJson("quote_crm_handoff_packet_manifest_unavailable", 503);
  }

  const recentManifestResult = await manifestPersistence.readRecentManifests({
    admin: binding.adminContext,
    limit: 10
  });

  return successJson(result, manifestResult, recentManifestResult);
}
