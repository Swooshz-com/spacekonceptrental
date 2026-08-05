import { createHmac } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const nextHeadersState = vi.hoisted(() => ({
  headers: new Headers(),
  cookies: [] as Array<{ name: string; value: string }>
}));

vi.mock("next/headers", () => ({
  headers: async () => nextHeadersState.headers,
  cookies: async () => ({
    getAll: () => nextHeadersState.cookies
  })
}));

import { createSessionBoundSupabaseAdminReadClient } from "../lib/admin/authorization/supabase-admin-auth-identity-adapter";
import { issueAdminCsrfProofRoute } from "../app/api/admin/csrf-proof/route";
import { handleAdminSetupRecipeRoute } from "../lib/catalogue/admin-setup-recipe-write-route";
import { signServerAdminCsrfProof } from "../lib/admin/authorization/server-admin-csrf-proof-runtime-dependencies";
import type { ServerAdminCsrfProofSignerInput } from "../lib/admin/authorization/server-admin-csrf-proof-issuer";

const enabled = process.env.RUN49_JOINED === "1";
const supabaseUrl = process.env.RUN49_SUPABASE_URL ?? "http://127.0.0.1:9";
const fixtureControlUrl = process.env.RUN49_FIXTURE_CONTROL_URL ?? "";
const accessToken = process.env.RUN49_ACCESS_TOKEN ?? "";
const jwtSecret = process.env.RUN49_JWT_SECRET ?? "";
const workspaceId = process.env.RUN49_WORKSPACE_ID ?? "";
const setupProductId = process.env.RUN49_SETUP_PRODUCT_ID ?? "";
const childProductId = process.env.RUN49_CHILD_PRODUCT_ID ?? "";
const otherSetupProductId = process.env.RUN49_OTHER_SETUP_PRODUCT_ID ?? "";
const unauthorisedAuthUserId =
  process.env.RUN49_UNAUTHORISED_AUTH_USER_ID ?? "";
const unauthorisedAuthUserEmail =
  process.env.RUN49_UNAUTHORISED_AUTH_USER_EMAIL ?? "";
const expectedOrigin = process.env.ADMIN_EXPECTED_ORIGIN ?? "https://admin.space.test";
const expectedHost = process.env.ADMIN_EXPECTED_HOST ?? "admin.space.test";

const authCookieName = `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`;

function genericSessionClientFailure(): never {
  const error = new Error("session_client_state_failed");
  error.name = "SessionClientStateError";
  (error as Error & { code?: string }).code = "session_client_state_failed";
  throw error;
}

function recordSessionClientFailure(phase: string, category: string): never {
  const controlFile = process.env.RUN49_DIAGNOSTIC_CONTROL_FILE;
  if (!controlFile) return genericSessionClientFailure();

  let existing = "";
  try {
    existing = readFileSync(controlFile, "utf8");
  } catch {
    return genericSessionClientFailure();
  }
  if (existing.trim() !== "") return genericSessionClientFailure();

  const record = { schemaVersion: 1, phase, category };
  try {
    writeFileSync(controlFile, `${JSON.stringify(record)}\n`, { flag: "w" });
  } catch {
    return genericSessionClientFailure();
  }
  return genericSessionClientFailure();
}

function sessionCookieFor(sessionAccessToken: string) {
  const session = {
    access_token: sessionAccessToken,
    refresh_token: "run49-local-refresh-token",
    token_type: "bearer",
    expires_in: 900,
    expires_at: Math.floor(Date.now() / 1000) + 900
  };

  return {
    name: authCookieName,
    value: `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`
  };
}

function sessionCookie() {
  return sessionCookieFor(accessToken);
}

function sessionCookieHeaderFor(cookie: { name: string; value: string }) {
  return `${cookie.name}=${cookie.value}`;
}

function sessionCookieHeader() {
  return sessionCookieHeaderFor(sessionCookie());
}

function buildRequest(
  pathname: string,
  init: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    cookie?: string;
  } = {}
) {
  return new NextRequest(`${expectedOrigin}${pathname}`, {
    method: init.method ?? "GET",
    headers: {
      origin: expectedOrigin,
      host: expectedHost,
      ...(init.cookie ? { cookie: init.cookie } : {}),
      ...init.headers
    },
    ...(init.body === undefined ? {} : { body: init.body })
  });
}

function authenticatedSessionRequest(
  pathname: string,
  init: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {}
) {
  return buildRequest(pathname, {
    method: init.method ?? "GET",
    headers: init.headers,
    body: init.body,
    cookie: sessionCookieHeader()
  });
}

function setRequestContext(request: NextRequest) {
  nextHeadersState.headers = request.headers;
  nextHeadersState.cookies = request.cookies.getAll().map(({ name, value }) => ({
    name,
    value
  }));
}

function assertRecoveredSessionCookie() {
  const cookie = nextHeadersState.cookies.find(({ name }) => name === authCookieName);
  if (!cookie) {
    recordSessionClientFailure(
      "session_cookie_recovery",
      "session_cookie_recovery_failed"
    );
  }

  try {
    const value = cookie.value;
    if (!value.startsWith("base64-")) throw new Error("invalid");
    const session = JSON.parse(
      Buffer.from(value.slice("base64-".length), "base64url").toString("utf8")
    ) as { access_token?: unknown; refresh_token?: unknown };
    if (
      session.access_token !== accessToken ||
      typeof session.refresh_token !== "string" ||
      session.refresh_token.trim() === ""
    ) {
      throw new Error("invalid");
    }
  } catch {
    recordSessionClientFailure(
      "session_cookie_recovery",
      "session_cookie_recovery_failed"
    );
  }
}

type JoinedRpcResponse = {
  data: unknown;
  error: { code?: unknown } | null;
  status?: unknown;
};

function assertRpcResponse(
  response: JoinedRpcResponse,
  expected: boolean
): asserts response is JoinedRpcResponse & { data: boolean; error: null } {
  if (response.error !== null) {
    if (response.status === 401) {
      recordSessionClientFailure(
        "postgrest_jwt_admission",
        "postgrest_jwt_admission_failed"
      );
    }
    if (response.status === 403) {
      recordSessionClientFailure(
        "authenticated_role_selection",
        "authenticated_role_selection_failed"
      );
    }
    if (response.status === 0) {
      recordSessionClientFailure(
        "authorization_transport",
        "authorization_transport_failed"
      );
    }
    recordSessionClientFailure("rpc_execution", "rpc_execution_denied");
  }

  if (response.data !== expected || typeof response.data !== "boolean") {
    recordSessionClientFailure("rpc_result", "rpc_result_invalid");
  }
}

function setupRequest(
  proof: string | null,
  body: string,
  options: { cookie?: string } = {}
) {
  const request = buildRequest("/api/admin/setup-recipe", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: expectedOrigin,
      host: expectedHost,
      ...(proof ? { "x-csrf-proof": proof } : {})
    },
    cookie: options.cookie ?? sessionCookieHeader(),
    body
  });
  setRequestContext(request);
  return request;
}

async function json(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

async function fixtureControl(action: "enable" | "restore") {
  if (!fixtureControlUrl) throw new Error("fixture control unavailable");
  const response = await fetch(`${fixtureControlUrl}/consume-rpc-failure/${action}`, {
    method: "POST"
  });
  if (response.status !== 200) {
    recordSessionClientFailure("rpc_execution", "rpc_execution_denied");
  }
  return json(response);
}

async function issueProof(
  operation: "admin.setupRecipe.read" | "admin.setupRecipe.write"
) {
  const request = authenticatedSessionRequest("/api/admin/csrf-proof", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: expectedOrigin,
      host: expectedHost
    },
    body: JSON.stringify({ requestedOperation: operation })
  });
  setRequestContext(request);
  const response = await issueAdminCsrfProofRoute(request);
  expect(response.status).toBe(200);
  const body = await json(response);
  expect(typeof body.csrfProof).toBe("string");
  return body.csrfProof as string;
}

function validReadBody() {
  return JSON.stringify({ action: "read", setupProductId });
}

function base64UrlJson(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function unverifiedProof(operation: string) {
  const payload = {
    operation,
    sessionBinding: "session-binding",
    nonce: "nonce",
    issuedAt: 1,
    expiresAt: 2
  };
  return `${base64UrlJson(payload)}.${"a".repeat(43)}`;
}

function mintJwt(sub: string, email: string) {
  const header = base64UrlJson({ alg: "HS256", typ: "JWT" });
  const payload = base64UrlJson({
    sub,
    email,
    iss: "run49-local",
    role: "authenticated",
    aud: "authenticated",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900
  });
  const signature = createHmac("sha256", jwtSecret)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

async function issueStaleProof(): Promise<string> {
  const fresh = await issueProof("admin.setupRecipe.read");
  const [payloadSegment] = fresh.split(".");
  const payload = JSON.parse(
    Buffer.from(payloadSegment, "base64url").toString("utf8")
  ) as Record<string, unknown>;
  const now = Date.now();
  const stalePayload = {
    ...payload,
    issuedAt: now - 600_000,
    expiresAt: now - 300_000
  } as ServerAdminCsrfProofSignerInput["payload"];
  const staleSegment = base64UrlJson(stalePayload);
  const signature = signServerAdminCsrfProof({
    payload: stalePayload,
    payloadJson: JSON.stringify(stalePayload),
    payloadSegment: staleSegment
  });
  return `${staleSegment}.${signature}`;
}

describe.runIf(enabled)("Run-49 joined production Supabase/PostgreSQL integration", () => {
  beforeEach(() => {
    setRequestContext(authenticatedSessionRequest("/api/admin/auth-check"));
    expect(accessToken).not.toBe("");
    expect(jwtSecret).not.toBe("");
    expect(workspaceId).toMatch(/^[0-9a-f-]{36}$/);
    expect(setupProductId).toMatch(/^[0-9a-f-]{36}$/);
    expect(childProductId).toMatch(/^[0-9a-f-]{36}$/);
    expect(otherSetupProductId).toMatch(/^[0-9a-f-]{36}$/);
    expect(unauthorisedAuthUserId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("uses the real session-bound client and crosses the HTTP RPC transport", async () => {
    assertRecoveredSessionCookie();
    const clientResult = await createSessionBoundSupabaseAdminReadClient();
    expect(clientResult.configured).toBe(true);

    if (!clientResult.configured) {
      throw new Error("joined session-bound Supabase client was not configured");
    }
    const client = clientResult.client as unknown as {
      auth: {
        getUser(): Promise<{
          data?: { user?: { id?: unknown; email?: unknown } | null } | null;
          error?: unknown;
        }>;
      };
      rpc(functionName: string, args: Record<string, unknown>): Promise<JoinedRpcResponse>;
    };
    let userResult: {
      data?: { user?: { id?: unknown; email?: unknown } | null } | null;
      error?: unknown;
    };
    try {
      userResult = await client.auth.getUser();
    } catch {
      recordSessionClientFailure(
        "authorization_transport",
        "authorization_transport_failed"
      );
    }
    if (userResult.error !== undefined && userResult.error !== null) {
      recordSessionClientFailure("auth_user_lookup", "auth_user_lookup_failed");
    }
    if (
      userResult.data?.user?.id !== "20000000-0000-4000-8000-000000000001" ||
      userResult.data.user.email !== "admin-a@example.test"
    ) {
      recordSessionClientFailure("auth_user_lookup", "auth_user_lookup_failed");
    }
    const issuedAt = Date.now();
    const fingerprint = "a".repeat(64);
    let first: JoinedRpcResponse;
    let duplicate: JoinedRpcResponse;
    try {
      first = await client.rpc("consume_admin_csrf_proof", {
        p_operation: "product.write",
        p_expected_workspace_id: workspaceId,
        p_proof_fingerprint: fingerprint,
        p_issued_at_ms: issuedAt,
        p_expires_at_ms: issuedAt + 60_000
      });
      duplicate = await client.rpc("consume_admin_csrf_proof", {
        p_operation: "product.write",
        p_expected_workspace_id: workspaceId,
        p_proof_fingerprint: fingerprint,
        p_issued_at_ms: issuedAt,
        p_expires_at_ms: issuedAt + 60_000
      });
    } catch {
      recordSessionClientFailure(
        "authorization_transport",
        "authorization_transport_failed"
      );
    }

    assertRpcResponse(first, true);
    assertRpcResponse(duplicate, false);
  });

  it("consumes before malformed JSON body failure, then denies the same proof and accepts a fresh proof", async () => {
    const proof = await issueProof("admin.setupRecipe.read");
    const failing = await handleAdminSetupRecipeRoute(setupRequest(proof, "{"));
    expect(failing.status).toBe(400);
    expect(await json(failing)).toEqual({ error: "request_body_malformed" });

    const replay = await handleAdminSetupRecipeRoute(
      setupRequest(proof, validReadBody())
    );
    expect(replay.status).toBe(403);
    expect(await json(replay)).toEqual({ error: "csrf_proof_replayed" });

    const replacementProof = await issueProof("admin.setupRecipe.read");
    const replacement = await handleAdminSetupRecipeRoute(
      setupRequest(replacementProof, validReadBody())
    );
    expect(replacement.status).toBe(200);
    expect(await json(replacement)).toEqual({
      revision: 1,
      items: [{
        included_product_id: childProductId,
        position: 0,
        base_quantity: 2
      }]
    });
  });

  it("consumes before oversized body failure, then denies the same proof and accepts a fresh proof", async () => {
    const proof = await issueProof("admin.setupRecipe.read");
    const oversizedBody = JSON.stringify({
      action: "read",
      setupProductId,
      padding: "x".repeat(70_000)
    });
    const failing = await handleAdminSetupRecipeRoute(
      setupRequest(proof, oversizedBody)
    );
    expect(failing.status).toBe(413);
    expect(await json(failing)).toEqual({ error: "request_body_too_large" });

    const replay = await handleAdminSetupRecipeRoute(
      setupRequest(proof, validReadBody())
    );
    expect(replay.status).toBe(403);
    expect(await json(replay)).toEqual({ error: "csrf_proof_replayed" });

    const replacementProof = await issueProof("admin.setupRecipe.read");
    const replacement = await handleAdminSetupRecipeRoute(
      setupRequest(replacementProof, validReadBody())
    );
    expect(replacement.status).toBe(200);
  });

  it("consumes before unknown-action failure, then denies the same proof and accepts a fresh proof", async () => {
    const proof = await issueProof("admin.setupRecipe.read");
    const failing = await handleAdminSetupRecipeRoute(
      setupRequest(proof, JSON.stringify({ action: "bogus", setupProductId }))
    );
    expect(failing.status).toBe(400);
    expect(await json(failing)).toEqual({ error: "unknown_action" });

    const replay = await handleAdminSetupRecipeRoute(
      setupRequest(proof, validReadBody())
    );
    expect(replay.status).toBe(403);
    expect(await json(replay)).toEqual({ error: "csrf_proof_replayed" });

    const replacementProof = await issueProof("admin.setupRecipe.read");
    const replacement = await handleAdminSetupRecipeRoute(
      setupRequest(replacementProof, validReadBody())
    );
    expect(replacement.status).toBe(200);
  });

  it("consumes before schema-rejection failure, then denies the same proof and accepts a fresh proof", async () => {
    const proof = await issueProof("admin.setupRecipe.read");
    const failing = await handleAdminSetupRecipeRoute(
      setupRequest(proof, JSON.stringify({ action: "read" }))
    );
    expect(failing.status).toBe(400);
    expect(await json(failing)).toEqual({ error: "setup_product_id_required" });

    const replay = await handleAdminSetupRecipeRoute(
      setupRequest(proof, validReadBody())
    );
    expect(replay.status).toBe(403);
    expect(await json(replay)).toEqual({ error: "csrf_proof_replayed" });

    const replacementProof = await issueProof("admin.setupRecipe.read");
    const replacement = await handleAdminSetupRecipeRoute(
      setupRequest(replacementProof, validReadBody())
    );
    expect(replacement.status).toBe(200);
  });

  it("accepts one valid authorised request through the durable joined authority", async () => {
    const writeProof = await issueProof("admin.setupRecipe.write");
    const write = await handleAdminSetupRecipeRoute(
      setupRequest(
        writeProof,
        JSON.stringify({
          action: "write",
          operation: "replace",
          setupProductId,
          expectedRevision: 1,
          items: [{
            included_product_id: childProductId,
            position: 0,
            base_quantity: 3
          }]
        })
      )
    );
    expect(write.status).toBe(200);
    expect(await json(write)).toMatchObject({
      ok: true,
      operation: "replace",
      setup_product_id: setupProductId,
      revision: 2,
      item_count: 1
    });

    const readProof = await issueProof("admin.setupRecipe.read");
    const read = await handleAdminSetupRecipeRoute(
      setupRequest(readProof, validReadBody())
    );
    expect(read.status).toBe(200);
    expect(await json(read)).toEqual({
      revision: 2,
      items: [{
        included_product_id: childProductId,
        position: 0,
        base_quantity: 3
      }]
    });
  });

  it("rejects a wrong-operation proof only after consuming the signed proof", async () => {
    const proof = await issueProof("admin.setupRecipe.write");
    const mismatched = await handleAdminSetupRecipeRoute(
      setupRequest(proof, JSON.stringify({ action: "read", setupProductId }))
    );
    expect(mismatched.status).toBe(403);
    expect(await json(mismatched)).toEqual({ error: "csrf_proof_mismatched" });

    const replay = await handleAdminSetupRecipeRoute(
      setupRequest(proof, JSON.stringify({
        action: "write",
        operation: "remove",
        setupProductId,
        expectedRevision: 1,
        items: []
      }))
    );
    expect(replay.status).toBe(403);
    expect(await json(replay)).toEqual({ error: "csrf_proof_replayed" });
  });

  it("allows exactly one concurrent identical route request through PostgreSQL", async () => {
    const proof = await issueProof("admin.setupRecipe.read");
    const responses = await Promise.all([
      handleAdminSetupRecipeRoute(setupRequest(proof, validReadBody())),
      handleAdminSetupRecipeRoute(setupRequest(proof, validReadBody()))
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 403]);
  });

  it("retains replay denial across separate Node processes", async () => {
    const fingerprint = "b".repeat(64);
    const issuedAt = Date.now();
    const script = `
      const response = await fetch(process.env.RUN49_SUPABASE_URL + '/rpc/consume_admin_csrf_proof', {
        method: 'POST',
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY,
          Authorization: 'Bearer ' + process.env.RUN49_ACCESS_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          p_operation: 'product.write',
          p_expected_workspace_id: process.env.RUN49_WORKSPACE_ID,
          p_proof_fingerprint: process.env.RUN49_FINGERPRINT,
          p_issued_at_ms: Number(process.env.RUN49_ISSUED_AT),
          p_expires_at_ms: Number(process.env.RUN49_EXPIRES_AT)
        })
      });
      if (!response.ok) process.exit(2);
      const body = await response.json();
      process.stdout.write(body === true ? 'true' : 'false');
    `;
    const runChild = async () => {
      const child = await import("node:child_process");
      return new Promise<string>((resolve, reject) => {
        const processChild = child.spawn(process.execPath, ["--input-type=module", "-e", script], {
          env: {
            ...process.env,
            RUN49_FINGERPRINT: fingerprint,
            RUN49_ISSUED_AT: String(issuedAt),
            RUN49_EXPIRES_AT: String(issuedAt + 60_000)
          },
          stdio: ["ignore", "pipe", "ignore"]
        });
        let output = "";
        processChild.stdout.setEncoding("utf8");
        processChild.stdout.on("data", (chunk) => { output += chunk; });
        processChild.on("error", reject);
        processChild.on("close", (code) => {
          if (code !== 0) reject(new Error("joined replay child failed"));
          else resolve(output.trim());
        });
      });
    };

    await expect(runChild()).resolves.toBe("true");
    await expect(runChild()).resolves.toBe("false");
  });

  it("denies direct replay-table access for the authenticated client", async () => {
    const headers = {
      apikey: process.env.SUPABASE_ANON_KEY ?? "",
      Authorization: `Bearer ${accessToken}`
    };
    const requests = [
      new Request(`${supabaseUrl}/rest/v1/admin_csrf_proof_consumptions?select=*`, {
        method: "GET",
        headers
      }),
      new Request(`${supabaseUrl}/rest/v1/admin_csrf_proof_consumptions`, {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({
          proof_fingerprint: "c".repeat(64),
          workspace_id: workspaceId,
          operation: "product.write",
          actor_admin_user_id: "30000000-0000-4000-8000-000000000001",
          issued_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 60_000).toISOString()
        })
      }),
      new Request(`${supabaseUrl}/rest/v1/admin_csrf_proof_consumptions`, {
        method: "PATCH",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ operation: "product.write" })
      }),
      new Request(`${supabaseUrl}/rest/v1/admin_csrf_proof_consumptions`, {
        method: "DELETE",
        headers
      })
    ];

    for (const request of requests) {
      const response = await fetch(request);
      expect(response.ok).toBe(false);
    }
  });

  it("rejects a missing CSRF proof through the production route", async () => {
    const request = setupRequest(null, validReadBody());
    const response = await handleAdminSetupRecipeRoute(request);
    expect(response.status).toBe(403);
    expect(await json(response)).toEqual({ error: "csrf_proof_invalid" });
  });

  it("rejects a malformed CSRF proof through the production route", async () => {
    const request = setupRequest("malformed-proof-value", validReadBody());
    const response = await handleAdminSetupRecipeRoute(request);
    expect(response.status).toBe(403);
    expect(await json(response)).toEqual({ error: "csrf_proof_invalid" });
  });

  it("rejects a stale CSRF proof without consuming the durable nonce", async () => {
    const staleProof = await issueStaleProof();
    const first = await handleAdminSetupRecipeRoute(
      setupRequest(staleProof, validReadBody())
    );
    expect(first.status).toBe(403);
    expect(await json(first)).toEqual({ error: "csrf_proof_stale" });

    const second = await handleAdminSetupRecipeRoute(
      setupRequest(staleProof, validReadBody())
    );
    expect(second.status).toBe(403);
    expect(await json(second)).toEqual({ error: "csrf_proof_stale" });
  });

  it("rejects an anonymous session through the production route", async () => {
    const request = setupRequest(
      unverifiedProof("admin.setupRecipe.read"),
      validReadBody(),
      { cookie: "" }
    );
    const response = await handleAdminSetupRecipeRoute(request);
    expect(response.status).toBe(401);
    expect(await json(response)).toEqual({ error: "submission_not_allowed" });
  });

  it("rejects an authenticated non-admin user through the production route", async () => {
    const unauthorisedToken = mintJwt(
      unauthorisedAuthUserId,
      unauthorisedAuthUserEmail
    );
    const cookie = sessionCookieFor(unauthorisedToken);
    const request = setupRequest(
      unverifiedProof("admin.setupRecipe.read"),
      validReadBody(),
      { cookie: sessionCookieHeaderFor(cookie) }
    );
    const response = await handleAdminSetupRecipeRoute(request);
    expect(response.status).toBe(403);
    expect(await json(response)).toEqual({ error: "submission_not_allowed" });
  });

  it("rejects a cross-workspace record request through the production route", async () => {
    const proof = await issueProof("admin.setupRecipe.read");
    const foreignBody = JSON.stringify({
      action: "read",
      setupProductId: otherSetupProductId
    });
    const response = await handleAdminSetupRecipeRoute(
      setupRequest(proof, foreignBody)
    );
    expect(response.status).toBe(404);
    expect(await json(response)).toEqual({ error: "not-found" });
  });

  it("fails closed when the real consume RPC fails operationally, restores the fixture, and accepts a replacement proof", async () => {
    const baselineProof = await issueProof("admin.setupRecipe.read");
    const baseline = await handleAdminSetupRecipeRoute(
      setupRequest(baselineProof, validReadBody())
    );
    const baselineBody = await json(baseline);
    if (baseline.status !== 200) {
      recordSessionClientFailure("rpc_result", "rpc_result_invalid");
    }

    let stage = "fixture_enable";
    try {
      await fixtureControl("enable");
      stage = "durable_rpc";
      try {
      const clientResult = await createSessionBoundSupabaseAdminReadClient();
      expect(clientResult.configured).toBe(true);
      if (!clientResult.configured) throw new Error("joined client unavailable");

      const client = clientResult.client as unknown as {
        rpc(functionName: string, args: Record<string, unknown>): Promise<JoinedRpcResponse>;
      };
      const issuedAt = Date.now();
      const rpcFailure = await client.rpc("consume_admin_csrf_proof", {
        p_operation: "admin.setupRecipe.read",
        p_expected_workspace_id: workspaceId,
        p_proof_fingerprint: "d".repeat(64),
        p_issued_at_ms: issuedAt,
        p_expires_at_ms: issuedAt + 60_000
      });
      if (rpcFailure.error === null) {
        recordSessionClientFailure("rpc_execution", "rpc_execution_denied");
      }
      expect(rpcFailure.error).not.toBeNull();

      stage = "malformed_route";
      const malformedProof = await issueProof("admin.setupRecipe.read");
      const malformed = await handleAdminSetupRecipeRoute(
        setupRequest(malformedProof, "{")
      );
      const malformedBody = await json(malformed);
      if (
        malformed.status !== 403 ||
        malformedBody.error !== "csrf_proof_replayed"
      ) {
        recordSessionClientFailure("rpc_result", "rpc_result_invalid");
      }

      stage = "write_route";
      const writeProof = await issueProof("admin.setupRecipe.write");
      const write = await handleAdminSetupRecipeRoute(
        setupRequest(
          writeProof,
          JSON.stringify({
            action: "write",
            operation: "replace",
            setupProductId,
            expectedRevision: 1,
            items: [{
              included_product_id: childProductId,
              position: 0,
              base_quantity: 9
            }]
          })
        )
      );
      const writeBody = await json(write);
      if (write.status !== 403 || writeBody.error !== "csrf_proof_replayed") {
        recordSessionClientFailure("rpc_execution", "rpc_execution_denied");
      }
      stage = "restore";
      } finally {
      const restored = await fixtureControl("restore");
      if (restored.ok !== true || restored.restored !== true) {
        recordSessionClientFailure("authorization_transport", "authorization_transport_failed");
      }
    }

    stage = "replacement_route";
    const replacementProof = await issueProof("admin.setupRecipe.read");
    const replacement = await handleAdminSetupRecipeRoute(
      setupRequest(replacementProof, validReadBody())
    );
    const replacementBody = await json(replacement);
    if (replacement.status !== 200) {
      if (replacement.status === 403) {
        recordSessionClientFailure("rpc_execution", "rpc_execution_denied");
      }
      if (replacement.status === 401) {
        recordSessionClientFailure("postgrest_jwt_admission", "postgrest_jwt_admission_failed");
      }
      recordSessionClientFailure("rpc_result", "rpc_result_invalid");
    }
    if (JSON.stringify(replacementBody) !== JSON.stringify(baselineBody)) {
      recordSessionClientFailure("rpc_result", "rpc_result_invalid");
    }
    } catch (error) {
      const diagnosticByStage: Record<string, [string, string]> = {
        fixture_enable: ["authorization_transport", "authorization_transport_failed"],
        durable_rpc: ["rpc_execution", "rpc_execution_denied"],
        malformed_route: ["rpc_result", "rpc_result_invalid"],
        write_route: ["rpc_result", "rpc_result_invalid"],
        restore: ["authorization_transport", "authorization_transport_failed"],
        replacement_route: ["rpc_result", "rpc_result_invalid"]
      };
      try {
        const [phase, category] = diagnosticByStage[stage] ?? diagnosticByStage.replacement_route;
        recordSessionClientFailure(phase, category);
      } catch {
        // Keep the original bounded case failure; the control file carries only the allowlisted state.
      }
      throw error;
    }
  });
});
