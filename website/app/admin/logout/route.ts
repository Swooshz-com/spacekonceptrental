import { NextResponse, type NextRequest } from "next/server";

import {
  createCanonicalAdminAuthUrl,
  getCanonicalAdminAuthRouteConfig,
  isSameOriginAdminAuthRequest
} from "../../../lib/admin/authorization/admin-auth-route-security";
import { signOutSupabaseAdminAuthSession } from "../../../lib/admin/authorization/supabase-admin-auth-identity-adapter";

const noStoreHeaders = {
  "Cache-Control": "no-store"
};

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

  const url = createCanonicalAdminAuthUrl(
    routeConfig,
    "/admin/login",
    "unauthenticated"
  );

  const response = NextResponse.redirect(url, {
    status: 303,
    headers: noStoreHeaders
  });

  if (!isSameOriginAdminAuthRequest(request, routeConfig)) {
    return response;
  }

  await signOutSupabaseAdminAuthSession({
    requestCookies: request.cookies,
    responseCookies: response.cookies
  });

  return response;
}
