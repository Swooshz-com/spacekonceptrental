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
import {
  resolveServerAdminRuntimeRouteGateAdapter,
  type ServerAdminRuntimeRouteGateAdapterResult
} from "../admin/authorization/server-admin-runtime-route-gate-adapter";
import { readBoundedJsonBody } from "../admin/api/bounded-json-body-reader";
import { getAdminRouteRuntimeConfig } from "../server-runtime-config";
import {
  validateHomepageHeroContentInput,
  type HomepageHeroContentInput
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
};

type CreateRuntimeDependencies = (
  verifierContext?: Parameters<typeof createServerAdminCsrfProofRuntimeDependencies>[0]
) => ServerAdminCsrfProofRuntimeDependencies;

export type AdminHomepageHeroWriteRouteDependencies = {
  env?: AdminHomepageHeroWriteRouteEnv;
  now?: () => number;
  proofMaxAgeMs?: number;
  persistence?: AdminHomepageHeroPersistence;
  createRuntimeDependencies?: CreateRuntimeDependencies;
  resolveSessionWorkspaceBinding?: typeof resolveServerAdminCsrfProofSessionWorkspaceBinding;
  bindingDependencies?: ServerAdminCsrfProofSessionWorkspaceBindingDependencies;
  resolveRouteGate?: typeof resolveServerAdminRuntimeRouteGateAdapter;
};

const heroWriteOperation = "hero.write";
const noStoreHeaders = {
  "Cache-Control": "no-store"
};
const defaultProofMaxAgeMs = 5 * 60_000;

function normalizeRequired(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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

function successJson(result: AdminHomepageHeroPersistenceResult) {
  if (!("ok" in result) || !result.ok) {
    return errorJson("hero_persistence_failed", 503);
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

export async function handleAdminHomepageHeroWriteRoute(
  request: NextRequest,
  dependencies: AdminHomepageHeroWriteRouteDependencies = {}
): Promise<NextResponse> {
  const requestMethod = normalizeRequired(request.method)?.toUpperCase();

  if (requestMethod !== "POST") {
    return errorJson("request_method_not_allowed", 405);
  }

  const body = await readBoundedJsonBody(request);

  if (!body.ok) {
    return errorJson(body.error, body.status);
  }

  if (!isRecord(body.body)) {
    return errorJson("request_payload_invalid", 400);
  }

  const validation = validateHomepageHeroContentInput(body.body);

  if (!validation.ok) {
    return errorJson(validation.error, 400);
  }

  const gate = await verifyAdminWriteBoundary(
    request,
    requestMethod,
    dependencies
  );

  if (!gate.ok) {
    return gate.response;
  }

  const persistence =
    dependencies.persistence ?? supabaseAdminHomepageHeroPersistence;
  const result = await persistence.upsertHomepageHero({
    admin: gate.binding.adminContext,
    content: validation.content as HomepageHeroContentInput
  });

  if (!("ok" in result) || !result.ok) {
    return errorJson(persistenceError(result), 503);
  }

  return successJson(result);
}
