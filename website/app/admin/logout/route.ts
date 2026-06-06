import { NextResponse, type NextRequest } from "next/server";

import { signOutSupabaseAdminAuthSession } from "../../../lib/admin/authorization/supabase-admin-auth-identity-adapter";
import { getAdminRouteRuntimeConfig } from "../../../lib/server-runtime-config";

const noStoreHeaders = {
  "Cache-Control": "no-store"
};

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
  const url = new URL("/admin/login", request.url);
  url.searchParams.set("state", "unauthenticated");

  const response = NextResponse.redirect(url, {
    status: 303,
    headers: noStoreHeaders
  });

  if (!isSameOriginAdminRequest(request)) {
    return response;
  }

  await signOutSupabaseAdminAuthSession({
    requestCookies: request.cookies,
    responseCookies: response.cookies
  });

  return response;
}
