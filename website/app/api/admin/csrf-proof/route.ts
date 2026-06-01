import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import {
  isSupportedAdminOperation,
  type AdminOperation
} from "../../../../lib/admin/authorization/admin-authorization-policy";
import {
  issueServerAdminCsrfProof,
  type ServerAdminCsrfProofIssuerDependencies,
  type ServerAdminCsrfProofIssuerFailureReason,
  type StateChangingAdminOperation
} from "../../../../lib/admin/authorization/server-admin-csrf-proof-issuer";
import { createServerAdminCsrfProofRuntimeDependencies } from "../../../../lib/admin/authorization/server-admin-csrf-proof-runtime-dependencies";
import {
  resolveServerAdminCsrfProofSessionWorkspaceBinding,
  type ServerAdminCsrfProofSessionWorkspaceBindingDependencies
} from "../../../../lib/admin/authorization/server-admin-csrf-proof-session-workspace-binding";
import {
  resolveServerAdminRuntimeRouteGateAdapter,
  type ServerAdminRuntimeRouteGateAdapterResult
} from "../../../../lib/admin/authorization/server-admin-runtime-route-gate-adapter";
import { readBoundedJsonBody } from "../../../../lib/admin/api/bounded-json-body-reader";

type AdminCsrfProofRouteEnv = {
  ADMIN_EXPECTED_ORIGIN?: string | null;
  ADMIN_EXPECTED_HOST?: string | null;
  ADMIN_TRUSTED_WORKSPACE_ID?: string | null;
};

type AdminCsrfProofRouteRuntimeDependencies = {
  issuerDependencies: ServerAdminCsrfProofIssuerDependencies;
  sessionWorkspaceBindingDependencies: Pick<
    ServerAdminCsrfProofSessionWorkspaceBindingDependencies,
    "deriveSessionWorkspaceBinding"
  >;
};

type AdminCsrfProofRouteDependencies = {
  env?: AdminCsrfProofRouteEnv;
  now?: () => number;
  proofTtlMs?: number;
  resolveRouteGate?: typeof resolveServerAdminRuntimeRouteGateAdapter;
  resolveSessionWorkspaceBinding?: typeof resolveServerAdminCsrfProofSessionWorkspaceBinding;
  issueCsrfProof?: typeof issueServerAdminCsrfProof;
  createRuntimeDependencies?: () => AdminCsrfProofRouteRuntimeDependencies;
  bindingDependencies?: ServerAdminCsrfProofSessionWorkspaceBindingDependencies;
};

type AdminCsrfProofRouteError =
  | "request_method_not_allowed"
  | "request_content_type_invalid"
  | "request_body_too_large"
  | "request_body_missing"
  | "request_body_malformed"
  | "requested_operation_missing"
  | "requested_workspace_invalid"
  | ServerAdminCsrfProofIssuerFailureReason
  | ServerAdminRuntimeRouteGateAdapterResult["reason"]
  | "admin_csrf_session_workspace_binding_unavailable"
  | "session_workspace_binding_deriver_unavailable"
  | "session_workspace_binding_derivation_failed";

type OperationParseResult =
  | {
      ok: true;
      operation: StateChangingAdminOperation;
    }
  | {
      ok: false;
      error:
        | "requested_operation_missing"
        | "operation_not_supported"
        | "operation_not_state_changing";
    };

type WorkspaceParseResult =
  | {
      ok: true;
      workspaceId?: string | null;
    }
  | {
      ok: false;
      error: "requested_workspace_invalid";
    };

const defaultCsrfProofTtlMs = 5 * 60_000;
const targetOperations = new Set<StateChangingAdminOperation>([
  "product.write",
  "category.write",
  "productImage.write",
  "membership.manage"
]);
const noStoreHeaders = {
  "Cache-Control": "no-store"
};

function normalizeRequired(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isTargetOperation(
  operation: AdminOperation
): operation is StateChangingAdminOperation {
  return targetOperations.has(operation as StateChangingAdminOperation);
}

function errorJson(
  error: AdminCsrfProofRouteError,
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

function successJson(csrfProof: string, expiresAt: number): NextResponse {
  return NextResponse.json(
    {
      ok: true,
      csrfProof,
      expiresAt
    },
    {
      headers: noStoreHeaders
    }
  );
}

function parseRequestedOperation(
  body: Record<string, unknown>
): OperationParseResult {
  const requestedOperation =
    typeof body.requestedOperation === "string"
      ? normalizeRequired(body.requestedOperation)
      : null;

  if (!requestedOperation) {
    return {
      ok: false,
      error: "requested_operation_missing"
    };
  }

  if (!isSupportedAdminOperation(requestedOperation)) {
    return {
      ok: false,
      error: "operation_not_supported"
    };
  }

  if (!isTargetOperation(requestedOperation)) {
    return {
      ok: false,
      error: "operation_not_state_changing"
    };
  }

  return {
    ok: true,
    operation: requestedOperation
  };
}

function parseRequestedWorkspaceId(
  body: Record<string, unknown>
): WorkspaceParseResult {
  if (!Object.hasOwn(body, "requestedWorkspaceIdForValidationOnly")) {
    return {
      ok: true
    };
  }

  const value = body.requestedWorkspaceIdForValidationOnly;

  if (value === null) {
    return {
      ok: true,
      workspaceId: null
    };
  }

  if (typeof value !== "string") {
    return {
      ok: false,
      error: "requested_workspace_invalid"
    };
  }

  return {
    ok: true,
    workspaceId: normalizeRequired(value)
  };
}

function getEnvValue(
  env: AdminCsrfProofRouteEnv | undefined,
  name: keyof AdminCsrfProofRouteEnv
) {
  return env && name in env ? env[name] ?? null : process.env[name] ?? null;
}

function getRouteEnv(dependencies: AdminCsrfProofRouteDependencies) {
  return {
    expectedOrigin: getEnvValue(dependencies.env, "ADMIN_EXPECTED_ORIGIN"),
    expectedHost: getEnvValue(dependencies.env, "ADMIN_EXPECTED_HOST"),
    trustedServerWorkspaceId: getEnvValue(
      dependencies.env,
      "ADMIN_TRUSTED_WORKSPACE_ID"
    )
  };
}

function getProofTtlMs(dependencies: AdminCsrfProofRouteDependencies) {
  return typeof dependencies.proofTtlMs === "number" &&
    Number.isFinite(dependencies.proofTtlMs) &&
    dependencies.proofTtlMs > 0
    ? dependencies.proofTtlMs
    : defaultCsrfProofTtlMs;
}

function getTimestampMs(dependencies: AdminCsrfProofRouteDependencies) {
  const now = dependencies.now?.() ?? Date.now();

  return Number.isFinite(now) && now >= 0 ? now : null;
}

function issueFailureStatus(reason: ServerAdminCsrfProofIssuerFailureReason) {
  return reason === "operation_not_supported" ||
    reason === "operation_not_state_changing" ||
    reason === "session_binding_missing" ||
    reason === "timestamp_invalid"
    ? 400
    : 503;
}

export async function issueAdminCsrfProofRoute(
  request: NextRequest,
  dependencies: AdminCsrfProofRouteDependencies = {}
): Promise<NextResponse> {
  const requestMethod = normalizeRequired(request.method)?.toUpperCase();

  if (requestMethod !== "POST") {
    return errorJson("request_method_not_allowed", 405);
  }

  const body = await readBoundedJsonBody(request);

  if (!body.ok) {
    return errorJson(body.error, body.status);
  }

  const operation = parseRequestedOperation(body.body);

  if (!operation.ok) {
    return errorJson(operation.error, 400);
  }

  const workspace = parseRequestedWorkspaceId(body.body);

  if (!workspace.ok) {
    return errorJson(workspace.error, 400);
  }

  const routeEnv = getRouteEnv(dependencies);
  const resolveRouteGate =
    dependencies.resolveRouteGate ?? resolveServerAdminRuntimeRouteGateAdapter;
  let routeGate: ServerAdminRuntimeRouteGateAdapterResult;

  try {
    routeGate = await resolveRouteGate(
      {
        requestedOperation: "admin.csrf.issue",
        requestMethod,
        request,
        ...(workspace.workspaceId !== undefined
          ? {
              requestedWorkspaceIdForValidationOnly: workspace.workspaceId
            }
          : {})
      },
      {
        requestMetadata: {
          expectedOrigin: routeEnv.expectedOrigin,
          expectedHost: routeEnv.expectedHost
        },
        gate: {
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

  const createRuntimeDependencies =
    dependencies.createRuntimeDependencies ??
    createServerAdminCsrfProofRuntimeDependencies;
  const runtimeDependencies = createRuntimeDependencies();
  const resolveSessionWorkspaceBinding =
    dependencies.resolveSessionWorkspaceBinding ??
    resolveServerAdminCsrfProofSessionWorkspaceBinding;
  const issueCsrfProof =
    dependencies.issueCsrfProof ?? issueServerAdminCsrfProof;
  const issuedAt = getTimestampMs(dependencies);

  if (issuedAt === null) {
    return errorJson("timestamp_invalid", 400);
  }

  let binding;

  try {
    binding = await resolveSessionWorkspaceBinding(
      {
        requestedOperation: operation.operation,
        ...(workspace.workspaceId !== undefined
          ? {
              requestedWorkspaceIdForValidationOnly: workspace.workspaceId
            }
          : {}),
        ...(routeGate.requestId ? { requestId: routeGate.requestId } : {})
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

  try {
    const issued = await issueCsrfProof(
      {
        operation: operation.operation,
        sessionBinding: binding.sessionBinding,
        issuedAt,
        expiresAt: issuedAt + getProofTtlMs(dependencies)
      },
      runtimeDependencies.issuerDependencies
    );

    if (!issued.issued) {
      return errorJson(issued.reason, issueFailureStatus(issued.reason));
    }

    return successJson(issued.csrfProof, issued.expiresAt);
  } catch {
    return errorJson("csrf_proof_issue_failed", 503);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return issueAdminCsrfProofRoute(request);
}
