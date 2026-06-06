import { NextResponse, type NextRequest } from "next/server";

import { readBoundedUrlEncodedFormBody } from "../../../../lib/admin/api/bounded-json-body-reader";
import { signInSupabaseAdminAuthSession } from "../../../../lib/admin/authorization/supabase-admin-auth-identity-adapter";
import { getAdminRouteRuntimeConfig } from "../../../../lib/server-runtime-config";

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

function normalizeHeaderValue(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeHost(value: string | null | undefined) {
  return normalizeHeaderValue(value)?.toLowerCase() ?? null;
}

function normalizeOrigin(value: string | null | undefined) {
  const normalized = normalizeHeaderValue(value);

  if (!normalized) {
    return null;
  }

  try {
    return new URL(normalized).origin.toLowerCase();
  } catch {
    return null;
  }
}

function isSameOriginAdminRequest(request: NextRequest) {
  const routeConfig = getAdminRouteRuntimeConfig();
  const expectedOrigin = routeConfig.expectedOrigin;
  const expectedHost = routeConfig.expectedHost;
  const requestOrigin = normalizeOrigin(request.headers.get("origin"));
  const requestHost = normalizeHost(request.headers.get("host"));

  return Boolean(
    expectedOrigin &&
      expectedHost &&
      requestOrigin &&
      requestHost &&
      requestOrigin === expectedOrigin &&
      requestHost === expectedHost &&
      new URL(requestOrigin).host.toLowerCase() === requestHost
  );
}

export async function POST(request: NextRequest) {
  if (!isSameOriginAdminRequest(request)) {
    return redirectTo(request, "/admin/login", "unauthenticated");
  }

  const formData = await readBoundedUrlEncodedFormBody(request);

  if (!formData.ok) {
    return redirectTo(request, "/admin/login", "unauthenticated");
  }

  const email = normalizeRequired(formData.body.get("email"));
  const password = normalizeRequired(formData.body.get("password"));

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
