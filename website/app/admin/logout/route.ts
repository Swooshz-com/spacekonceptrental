import { NextResponse, type NextRequest } from "next/server";

import { signOutSupabaseAdminAuthSession } from "../../../lib/admin/authorization/supabase-admin-auth-identity-adapter";

const noStoreHeaders = {
  "Cache-Control": "no-store"
};

export async function POST(request: NextRequest) {
  const url = new URL("/admin/login", request.url);
  url.searchParams.set("state", "unauthenticated");

  const response = NextResponse.redirect(url, {
    status: 303,
    headers: noStoreHeaders
  });

  await signOutSupabaseAdminAuthSession({
    requestCookies: request.cookies,
    responseCookies: response.cookies
  });

  return response;
}
