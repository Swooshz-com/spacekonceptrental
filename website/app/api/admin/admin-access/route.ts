import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { readBoundedJsonBody } from "../../../../lib/admin/api/bounded-json-body-reader";
import {
  executeAdminAccessMutation,
  normalizeAdminAccessEmail,
  parseAdminAccessWriteAction
} from "../../../../lib/admin/access/admin-access-management";
import { createServerAdminCsrfProofRuntimeDependencies } from "../../../../lib/admin/authorization/server-admin-csrf-proof-runtime-dependencies";
import {
  resolveServerAdminCsrfProofSessionWorkspaceBinding,
  type ServerAdminCsrfProofSessionWorkspaceBindingResult
} from "../../../../lib/admin/authorization/server-admin-csrf-proof-session-workspace-binding";
import {
  resolveServerAdminRuntimeRouteGateAdapter,
  type ServerAdminRuntimeRouteGateAdapterResult
} from "../../../../lib/admin/authorization/server-admin-runtime-route-gate-adapter";
import { getAdminRouteRuntimeConfig } from "../../../../lib/server-runtime-config";

type AdminAccessRouteError =
  | "request_method_not_allowed"
  | "request_payload_invalid"
  | "csrf_verification_failed"
  | "admin_authorization_gate_unavailable"
  | "admin_csrf_session_workspace_binding_unavailable"
  | "access_management_unavailable"
  | "action_invalid"
  | "admin_not_found"
  | "email_invalid"
  | "owner_immutable"
  | "owner_required"
  | ServerAdminRuntimeRouteGateAdapterResult["reason"]
  | Extract<
      ServerAdminCsrfProofSessionWorkspaceBindingResult,
      { bound: false }
    >["reason"];

const noStoreHeaders = {
  "Cache-Control": "no-store"
};
const defaultProofMaxAgeMs = 5 * 60_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function errorJson(error: AdminAccessRouteError, status: number) {
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

function successJson(record: {
  email: string;
  role: "owner" | "admin";
  status: "active" | "disabled" | "removed";
}) {
  return NextResponse.json(
    {
      ok: true,
      record
    },
    {
      headers: noStoreHeaders
    }
  );
}

function getTimestampMs() {
  const now = Date.now();

  return Number.isFinite(now) && now >= 0 ? now : null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestMethod = request.method.trim().toUpperCase();

  if (requestMethod !== "POST") {
    return errorJson("request_method_not_allowed", 405);
  }

  const body = await readBoundedJsonBody(request);

  if (!body.ok || !isRecord(body.body)) {
    return errorJson("request_payload_invalid", body.ok ? 400 : body.status);
  }

  const action = parseAdminAccessWriteAction(body.body.action);
  const email = normalizeAdminAccessEmail(body.body.email);

  if (!action || !email) {
    return errorJson("request_payload_invalid", 400);
  }

  const routeConfig = getAdminRouteRuntimeConfig();
  const runtimeDependencies = createServerAdminCsrfProofRuntimeDependencies();
  let binding: ServerAdminCsrfProofSessionWorkspaceBindingResult;

  try {
    binding = await resolveServerAdminCsrfProofSessionWorkspaceBinding(
      {
        requestedOperation: "membership.manage"
      },
      {
        workspace: {
          trustedServerWorkspaceId: routeConfig.trustedServerWorkspaceId
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

  const timestampMs = getTimestampMs();

  if (timestampMs === null) {
    return errorJson("csrf_verification_failed", 403);
  }

  const verifierContext = {
    expectedSessionBinding: binding.sessionBinding,
    currentTimestampMs: timestampMs,
    maxProofAgeMs: defaultProofMaxAgeMs
  };
  const verifierRuntimeDependencies =
    createServerAdminCsrfProofRuntimeDependencies(verifierContext);
  let routeGate: ServerAdminRuntimeRouteGateAdapterResult;

  try {
    routeGate = await resolveServerAdminRuntimeRouteGateAdapter(
      {
        requestedOperation: "membership.manage",
        requestMethod,
        request,
        requiresMutationCapability: true
      },
      {
        requestMetadata: {
          expectedOrigin: routeConfig.expectedOrigin,
          expectedHost: routeConfig.expectedHost
        },
        gate: {
          csrfVerifier: {
            ...verifierContext,
            ...verifierRuntimeDependencies.verifierDependencies
          },
          decision: {
            workspace: {
              trustedServerWorkspaceId: routeConfig.trustedServerWorkspaceId
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

  const result = await executeAdminAccessMutation({
    action,
    email
  });

  if (!result.ok) {
    const status = result.code === "email_invalid" ? 400 : 403;

    return errorJson(result.code, status);
  }

  return successJson(result.record);
}
