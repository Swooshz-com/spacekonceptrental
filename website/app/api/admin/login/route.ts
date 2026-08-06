import { NextResponse, type NextRequest } from "next/server";

import { emitAdminLoginDenied } from "../../../../lib/application-events/app-operation-event-call-sites";
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

async function safeEmitLoginDenied(emit: () => Promise<unknown>) {
  try {
    await emit();
  } catch {
    // Observability emission failures must never change the login redirect.
  }
}

export async function POST(request: NextRequest) {
  const routeConfig = getCanonicalAdminAuthRouteConfig();

  if (!routeConfig) {
    return unavailable();
  }

  if (!isSameOriginAdminAuthRequest(request, routeConfig)) {
    await safeEmitLoginDenied(() => emitAdminLoginDenied("login_unauthenticated", {}));

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

  if (failureReason === "supabase_server_env_missing") {
    await safeEmitLoginDenied(() => emitAdminLoginDenied("login_unavailable", {}));
  } else {
    await safeEmitLoginDenied(
      () => emitAdminLoginDenied("login_unauthenticated", {})
    );
  }

  return redirectTo(
    routeConfig,
    "/admin/login",
    failureReason === "supabase_server_env_missing"
      ? "unavailable"
      : "unauthenticated"
  );
}
