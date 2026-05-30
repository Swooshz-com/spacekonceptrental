import { NextResponse, type NextRequest } from "next/server";
import { resolveServerAdminRuntimeRouteGateAdapter } from "../../../../lib/admin/authorization/server-admin-runtime-route-gate-adapter";

export async function GET(request: NextRequest) {
  const result = await resolveServerAdminRuntimeRouteGateAdapter(
    {
      requestedOperation: "admin.auth.check",
      requestMethod: request.method,
      request
    },
    {
      requestMetadata: {
        expectedOrigin: process.env.ADMIN_EXPECTED_ORIGIN ?? null,
        expectedHost: process.env.ADMIN_EXPECTED_HOST ?? null
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
