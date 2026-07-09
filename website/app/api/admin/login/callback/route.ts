import { NextResponse, type NextRequest } from "next/server";

import { exchangeSupabaseAdminAuthCodeForSession } from "../../../../../lib/admin/authorization/supabase-admin-auth-identity-adapter";

const noStoreHeaders = {
  "Cache-Control": "no-store"
};

function redirectTo(request: NextRequest, pathname: string, state?: string) {
  const url = new URL(pathname, request.url);

  if (state) {
    url.searchParams.set("state", state);
  }

  return NextResponse.redirect(url, {
    status: 303,
    headers: noStoreHeaders
  });
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const response = redirectTo(request, "/admin");
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
    request,
    "/admin/login",
    result.reason === "supabase_server_env_missing"
      ? "unavailable"
      : "unauthenticated"
  );
}
