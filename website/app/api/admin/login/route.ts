import { NextResponse, type NextRequest } from "next/server";

import {
  createCanonicalAdminAuthUrl,
  getCanonicalAdminAuthRouteConfig,
  isSameOriginAdminAuthRequest,
  type CanonicalAdminAuthRouteConfig
} from "../../../../lib/admin/authorization/admin-auth-route-security";
import { signInSupabaseAdminGoogleAuthSession } from "../../../../lib/admin/authorization/supabase-admin-auth-identity-adapter";

const noStoreHeaders = {
  "Cache-Control": "no-store"
};

function redirectTo(
  config: CanonicalAdminAuthRouteConfig,
  pathname: string,
  state?: string
) {
  return NextResponse.redirect(
    createCanonicalAdminAuthUrl(config, pathname, state),
    {
      status: 303,
      headers: noStoreHeaders
    }
  );
}

function unavailable() {
  return new NextResponse(null, {
    status: 503,
    headers: noStoreHeaders
  });
}

export async function POST(request: NextRequest) {
  const routeConfig = getCanonicalAdminAuthRouteConfig();

  if (!routeConfig) {
    return unavailable();
  }

  if (!isSameOriginAdminAuthRequest(request, routeConfig)) {
    return redirectTo(routeConfig, "/admin/login", "unauthenticated");
  }

  const response = redirectTo(
    routeConfig,
    "/admin/login",
    "unauthenticated"
  );
  const callbackUrl = createCanonicalAdminAuthUrl(
    routeConfig,
    "/api/admin/login/callback"
  );
  const result = await signInSupabaseAdminGoogleAuthSession(
    {
      redirectTo: callbackUrl.toString()
    },
    {
      requestCookies: request.cookies,
      responseCookies: response.cookies
    }
  );

  if (result.ok && result.redirectUrl) {
    response.headers.set("location", result.redirectUrl);
    return response;
  }

  const failureReason = result.ok ? "auth_session_invalid" : result.reason;

  return redirectTo(
    routeConfig,
    "/admin/login",
    failureReason === "supabase_server_env_missing"
      ? "unavailable"
      : "unauthenticated"
  );
}
