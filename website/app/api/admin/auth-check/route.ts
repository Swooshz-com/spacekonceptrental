import { NextResponse, type NextRequest } from "next/server";
import { resolveServerAdminRuntimeRouteGateAdapter } from "../../../../lib/admin/authorization/server-admin-runtime-route-gate-adapter";
import { getAdminRouteRuntimeConfig } from "../../../../lib/server-runtime-config";

export async function GET(request: NextRequest) {
  const routeConfig = getAdminRouteRuntimeConfig();
  const result = await resolveServerAdminRuntimeRouteGateAdapter(
    {
      requestedOperation: "admin.auth.check",
      requestMethod: request.method,
      request
    },
    {
      requestMetadata: {
        expectedOrigin: routeConfig.expectedOrigin,
        expectedHost: routeConfig.expectedHost
      },
      gate: {
        decision: {
          workspace: {
            trustedServerWorkspaceId: routeConfig.trustedServerWorkspaceId
          }
        }
      }
    }
  );

  return NextResponse.json(
    {
      allowed: result.allowed,
      reason: result.reason,
      ...(result.requestId ? { requestId: result.requestId } : {})
    },
    { status: result.statusCode }
  );
}
