import { NextResponse, type NextRequest } from "next/server";

import { signInSupabaseAdminAuthSession } from "../../../../lib/admin/authorization/supabase-admin-auth-identity-adapter";

const noStoreHeaders = {
  "Cache-Control": "no-store"
};

function redirectTo(request: NextRequest, pathname: string, state?: string) {
  const url = new URL(pathname, request.url);

  if (state) {
    url.searchParams.set("state", state);
  }

  const response = NextResponse.redirect(url, {
    status: 303,
    headers: noStoreHeaders
  });

  return response;
}

function normalizeRequired(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return redirectTo(request, "/admin/login", "unauthenticated");
  }

  const email = normalizeRequired(formData.get("email"));
  const password = normalizeRequired(formData.get("password"));

  if (!email || !password) {
    return redirectTo(request, "/admin/login", "unauthenticated");
  }

  const response = redirectTo(request, "/admin");
  const result = await signInSupabaseAdminAuthSession(
    {
      email,
      password
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
