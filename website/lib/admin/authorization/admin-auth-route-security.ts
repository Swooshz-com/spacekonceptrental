import "server-only";

import { getAdminRouteRuntimeConfig } from "../../server-runtime-config";

export type CanonicalAdminAuthRouteConfig = {
  origin: string;
  host: string;
};

type AdminAuthRequestMetadata = {
  headers: {
    get(name: string): string | null;
  };
};

function normalizeHeaderValue(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeHost(value: string | null | undefined) {
  return normalizeHeaderValue(value)?.toLowerCase() ?? null;
}

function parseOrigin(value: string | null | undefined) {
  const normalized = normalizeHeaderValue(value);

  if (!normalized) {
    return null;
  }

  try {
    const url = new URL(normalized);

    return {
      host: url.host.toLowerCase(),
      origin: url.origin.toLowerCase(),
      protocol: url.protocol
    };
  } catch {
    return null;
  }
}

export function getCanonicalAdminAuthRouteConfig(): CanonicalAdminAuthRouteConfig | null {
  const routeConfig = getAdminRouteRuntimeConfig();
  const expectedOrigin = parseOrigin(routeConfig.expectedOrigin);
  const expectedHost = normalizeHost(routeConfig.expectedHost);

  if (
    !expectedOrigin ||
    !expectedHost ||
    expectedOrigin.host !== expectedHost ||
    (process.env.NODE_ENV === "production" &&
      expectedOrigin.protocol !== "https:")
  ) {
    return null;
  }

  return {
    origin: expectedOrigin.origin,
    host: expectedHost
  };
}

export function createCanonicalAdminAuthUrl(
  config: CanonicalAdminAuthRouteConfig,
  pathname: string,
  state?: string
) {
  const url = new URL(pathname, `${config.origin}/`);

  if (state) {
    url.searchParams.set("state", state);
  }

  return url;
}

export function hasExpectedAdminAuthHost(
  request: AdminAuthRequestMetadata,
  config: CanonicalAdminAuthRouteConfig
) {
  return normalizeHost(request.headers.get("host")) === config.host;
}

export function isSameOriginAdminAuthRequest(
  request: AdminAuthRequestMetadata,
  config: CanonicalAdminAuthRouteConfig
) {
  const requestOrigin = parseOrigin(request.headers.get("origin"));

  return Boolean(
    requestOrigin &&
      requestOrigin.origin === config.origin &&
      requestOrigin.host === config.host &&
      hasExpectedAdminAuthHost(request, config)
  );
}
