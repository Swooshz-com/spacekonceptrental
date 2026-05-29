import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  readServerAdminRequestMetadata,
  type ServerAdminRequestMetadataResult
} from "./server-admin-request-metadata-adapter";

const sourcePath = resolve(
  process.cwd(),
  "lib/admin/authorization/server-admin-request-metadata-adapter.ts"
);

function readSource() {
  return readFileSync(sourcePath, "utf8");
}

function createHeaders(values: Record<string, string | null | undefined>) {
  const normalizedValues = new Map(
    Object.entries(values).map(([name, value]) => [name.toLowerCase(), value])
  );

  return {
    get(name: string) {
      return normalizedValues.get(name.toLowerCase()) ?? null;
    }
  };
}

function expectSafeFailureShape(result: ServerAdminRequestMetadataResult) {
  const serialized = JSON.stringify(result).toLowerCase();

  expect(result).toEqual(
    expect.objectContaining({
      configured: false,
      metadata: null
    })
  );

  for (const term of [
    "csrf-proof-secret",
    "signature",
    "token",
    "cookie",
    "env",
    "sql",
    "supabase",
    "provider",
    "stack",
    "session-1",
    "nonce-1",
    "workspace-1",
    "membership-1",
    "raw-header-map"
  ]) {
    expect(serialized).not.toContain(term);
  }
}

describe("server admin request metadata adapter", () => {
  it("returns configured metadata from injected headers and trusted expected origin and host", async () => {
    const result = await readServerAdminRequestMetadata({
      expectedOrigin: " https://admin.space.test ",
      expectedHost: " admin.space.test ",
      requestMethod: " POST ",
      readHeaders: async () =>
        createHeaders({
          origin: " https://admin.space.test ",
          host: " admin.space.test ",
          "x-request-id": " request-1 ",
          "x-csrf-proof": " csrf-proof-secret "
        })
    });

    expect(result).toEqual({
      configured: true,
      metadata: {
        requestMethod: "POST",
        requestOrigin: "https://admin.space.test",
        requestHost: "admin.space.test",
        expectedOrigin: "https://admin.space.test",
        expectedHost: "admin.space.test",
        requestId: "request-1",
        csrfProof: "csrf-proof-secret"
      }
    });
  });

  it("keeps the default Next header reader isolated behind the adapter function", () => {
    const source = readSource();

    expect(source).toContain('import "server-only";');
    expect(source).toContain('from "next/headers"');
    expect(source).toContain("headers()");
    expect(source).toContain("readServerAdminRequestMetadata");
    expect(source).not.toContain("resolveServerAdminAuthorizationGate");
    expect(source).not.toContain("validateServerAdminRequestSecurityPreflight");
    expect(source).not.toContain("resolveServerAdminAuthorizationDecision");
    expect(source).not.toContain("createServerAdminAuthorizationAdapterSet");
    expect(source).not.toContain("createSessionBoundSupabaseAdminReadClient");
    expect(source).not.toContain("createServerAdminCsrfProofIssuer");
    expect(source).not.toContain("issueServerAdminCsrfProof");
    expect(source).not.toContain("verifyServerAdminCsrfProof");
    expect(source).not.toContain("cookies()");
    expect(source).not.toContain("@supabase/ssr");
    expect(source).not.toContain("@supabase/supabase-js");
    expect(source).not.toContain("auth.getUser()");
    expect(source).not.toContain("admin_users");
    expect(source).not.toContain("memberships");
    expect(source).not.toContain("process.env");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("N8N");
    expect(source).not.toContain("PINECONE");
    expect(source).not.toContain("chat-config");
    expect(source).not.toContain(".from(");
    expect(source).not.toContain(".insert(");
    expect(source).not.toContain(".update(");
    expect(source).not.toContain(".upsert(");
    expect(source).not.toContain(".delete(");
    expect(source).not.toContain('"use server"');
    expect(source).not.toMatch(/from ["'][^"']*app\//m);
  });

  it("fails closed when trusted expected origin is missing", async () => {
    let readHeadersCalled = false;

    const result = await readServerAdminRequestMetadata({
      expectedOrigin: " ",
      expectedHost: "admin.space.test",
      requestMethod: "GET",
      readHeaders: async () => {
        readHeadersCalled = true;
        return createHeaders({ origin: "https://admin.space.test" });
      }
    });

    expect(readHeadersCalled).toBe(false);
    expect(result).toEqual({
      configured: false,
      metadata: null,
      reason: "expected_origin_missing"
    });
  });

  it("fails closed when trusted expected host is missing", async () => {
    let readHeadersCalled = false;

    const result = await readServerAdminRequestMetadata({
      expectedOrigin: "https://admin.space.test",
      expectedHost: "",
      requestMethod: "GET",
      readHeaders: async () => {
        readHeadersCalled = true;
        return createHeaders({ host: "admin.space.test" });
      }
    });

    expect(readHeadersCalled).toBe(false);
    expect(result).toEqual({
      configured: false,
      metadata: null,
      reason: "expected_host_missing"
    });
  });

  it("fails closed safely when the header reader is unavailable or throws", async () => {
    const result = await readServerAdminRequestMetadata({
      expectedOrigin: "https://admin.space.test",
      expectedHost: "admin.space.test",
      requestMethod: "POST",
      readHeaders: async () => {
        throw new Error(
          "csrf-proof-secret token cookie raw-header-map env SQL Supabase provider stack session-1 nonce-1 workspace-1 membership-1"
        );
      }
    });

    expect(result).toEqual({
      configured: false,
      metadata: null,
      reason: "request_headers_unavailable"
    });
    expectSafeFailureShape(result);
  });

  it("represents missing Origin and Host as untrusted absent metadata for later preflight denial", async () => {
    const result = await readServerAdminRequestMetadata({
      expectedOrigin: "https://admin.space.test",
      expectedHost: "admin.space.test",
      requestMethod: "GET",
      readHeaders: async () => createHeaders({})
    });

    expect(result).toEqual({
      configured: true,
      metadata: {
        requestMethod: "GET",
        requestOrigin: null,
        requestHost: null,
        expectedOrigin: "https://admin.space.test",
        expectedHost: "admin.space.test"
      }
    });
  });

  it("keeps request ID optional and safe", async () => {
    const withoutRequestId = await readServerAdminRequestMetadata({
      expectedOrigin: "https://admin.space.test",
      expectedHost: "admin.space.test",
      requestMethod: "GET",
      readHeaders: async () =>
        createHeaders({
          origin: "https://admin.space.test",
          host: "admin.space.test"
        })
    });
    const withCorrelationId = await readServerAdminRequestMetadata({
      expectedOrigin: "https://admin.space.test",
      expectedHost: "admin.space.test",
      requestMethod: "GET",
      readHeaders: async () =>
        createHeaders({
          origin: "https://admin.space.test",
          host: "admin.space.test",
          "x-correlation-id": " correlation-1 "
        })
    });

    expect(withoutRequestId).toEqual({
      configured: true,
      metadata: {
        requestMethod: "GET",
        requestOrigin: "https://admin.space.test",
        requestHost: "admin.space.test",
        expectedOrigin: "https://admin.space.test",
        expectedHost: "admin.space.test"
      }
    });
    expect(withCorrelationId).toEqual({
      configured: true,
      metadata: {
        requestMethod: "GET",
        requestOrigin: "https://admin.space.test",
        requestHost: "admin.space.test",
        expectedOrigin: "https://admin.space.test",
        expectedHost: "admin.space.test",
        requestId: "correlation-1"
      }
    });
  });

  it("passes CSRF proof only in success metadata and never leaks it in failure results", async () => {
    const success = await readServerAdminRequestMetadata({
      expectedOrigin: "https://admin.space.test",
      expectedHost: "admin.space.test",
      requestMethod: "POST",
      readHeaders: async () =>
        createHeaders({
          origin: "https://admin.space.test",
          host: "admin.space.test",
          "x-csrf-proof": "csrf-proof-secret"
        })
    });
    const failure = await readServerAdminRequestMetadata({
      expectedOrigin: null,
      expectedHost: "admin.space.test",
      requestMethod: "POST",
      readHeaders: async () =>
        createHeaders({
          "x-csrf-proof": "csrf-proof-secret"
        })
    });

    expect(success).toEqual({
      configured: true,
      metadata: {
        requestMethod: "POST",
        requestOrigin: "https://admin.space.test",
        requestHost: "admin.space.test",
        expectedOrigin: "https://admin.space.test",
        expectedHost: "admin.space.test",
        csrfProof: "csrf-proof-secret"
      }
    });
    expectSafeFailureShape(failure);
  });

  it("treats headers as untrusted validation metadata only", async () => {
    const result = await readServerAdminRequestMetadata({
      expectedOrigin: "https://admin.space.test",
      expectedHost: "admin.space.test",
      requestMethod: "POST",
      readHeaders: async () =>
        createHeaders({
          origin: "https://admin.space.test",
          host: "admin.space.test",
          "x-workspace-id": "workspace-1",
          "x-admin-user-id": "admin-1",
          "x-membership-id": "membership-1"
        })
    });

    expect(JSON.stringify(result)).not.toContain("workspace-1");
    expect(JSON.stringify(result)).not.toContain("admin-1");
    expect(JSON.stringify(result)).not.toContain("membership-1");
  });
});
