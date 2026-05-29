import "server-only";

import { headers } from "next/headers";

export type ServerAdminRequestHeaders = {
  get(name: string): string | null;
};

export type ServerAdminRequestMetadata = {
  requestMethod: string | null;
  requestOrigin: string | null;
  requestHost: string | null;
  expectedOrigin: string;
  expectedHost: string;
  requestId?: string;
  csrfProof?: string;
};

export type ServerAdminRequestMetadataFailureReason =
  | "admin_request_metadata_unavailable"
  | "expected_origin_missing"
  | "expected_host_missing"
  | "request_headers_unavailable";

export type ServerAdminRequestMetadataResult =
  | {
      configured: true;
      metadata: ServerAdminRequestMetadata;
    }
  | {
      configured: false;
      metadata: null;
      reason: ServerAdminRequestMetadataFailureReason;
    };

export type ServerAdminRequestHeadersReader = () =>
  | ServerAdminRequestHeaders
  | Promise<ServerAdminRequestHeaders>;

export type ServerAdminRequestMetadataDependencies = {
  expectedOrigin?: string | null;
  expectedHost?: string | null;
  requestMethod?: string | null;
  readHeaders?: ServerAdminRequestHeadersReader;
};

function unavailable(
  reason: ServerAdminRequestMetadataFailureReason
): ServerAdminRequestMetadataResult {
  return {
    configured: false,
    metadata: null,
    reason
  };
}

function normalizeOptionalString(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

async function readDefaultServerAdminRequestHeaders() {
  return headers();
}

function readHeaderValue(
  requestHeaders: ServerAdminRequestHeaders,
  name: string
) {
  return normalizeOptionalString(requestHeaders.get(name));
}

export async function readServerAdminRequestMetadata(
  dependencies: ServerAdminRequestMetadataDependencies
): Promise<ServerAdminRequestMetadataResult> {
  const expectedOrigin = normalizeOptionalString(dependencies.expectedOrigin);

  if (!expectedOrigin) {
    return unavailable("expected_origin_missing");
  }

  const expectedHost = normalizeOptionalString(dependencies.expectedHost);

  if (!expectedHost) {
    return unavailable("expected_host_missing");
  }

  const readRequestHeaders =
    dependencies.readHeaders ?? readDefaultServerAdminRequestHeaders;

  try {
    const requestHeaders = await readRequestHeaders();

    if (!requestHeaders || typeof requestHeaders.get !== "function") {
      return unavailable("request_headers_unavailable");
    }

    const requestId =
      readHeaderValue(requestHeaders, "x-request-id") ??
      readHeaderValue(requestHeaders, "x-correlation-id");
    const csrfProof = readHeaderValue(requestHeaders, "x-csrf-proof");
    const metadata: ServerAdminRequestMetadata = {
      requestMethod: normalizeOptionalString(dependencies.requestMethod),
      requestOrigin: readHeaderValue(requestHeaders, "origin"),
      requestHost: readHeaderValue(requestHeaders, "host"),
      expectedOrigin,
      expectedHost,
      ...(requestId ? { requestId } : {}),
      ...(csrfProof ? { csrfProof } : {})
    };

    return {
      configured: true,
      metadata
    };
  } catch {
    return unavailable("request_headers_unavailable");
  }
}
