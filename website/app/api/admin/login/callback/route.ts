import { NextResponse, type NextRequest } from "next/server";

import {
  createCanonicalAdminAuthUrl,
  getCanonicalAdminAuthRouteConfig,
  hasExpectedAdminAuthHost,
  type CanonicalAdminAuthRouteConfig
} from "../../../../../lib/admin/authorization/admin-auth-route-security";
import { exchangeSupabaseAdminAuthCodeForSession } from "../../../../../lib/admin/authorization/supabase-admin-auth-identity-adapter";

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

export async function GET(request: NextRequest) {
  const routeConfig = getCanonicalAdminAuthRouteConfig();

  if (!routeConfig) {
    return unavailable();
  }

  if (!hasExpectedAdminAuthHost(request, routeConfig)) {
    return redirectTo(routeConfig, "/admin/login", "unauthenticated");
  }

  const code = request.nextUrl.searchParams.get("code");
  const response = redirectTo(routeConfig, "/admin");
  const result = await exchangeSupabaseAdminAuthCodeForSession(
    {
      code: code ?? ""
    },
    {
      requestCookies: request.cookies,
      responseCookies: response.cookies
    }
  );

  if (result.ok) {
    return response;
  }

  return redirectTo(
    routeConfig,
    "/admin/login",
    result.reason === "supabase_server_env_missing"
      ? "unavailable"
      : "unauthenticated"
  );
}
