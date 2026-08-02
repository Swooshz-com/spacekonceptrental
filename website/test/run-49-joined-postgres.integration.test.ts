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

const enabled = process.env.RUN49_JOINED === "1";
const supabaseUrl = process.env.RUN49_SUPABASE_URL ?? "http://127.0.0.1:9";
const accessToken = process.env.RUN49_ACCESS_TOKEN ?? "";
const workspaceId = process.env.RUN49_WORKSPACE_ID ?? "";
const setupProductId = process.env.RUN49_SETUP_PRODUCT_ID ?? "";
const childProductId = process.env.RUN49_CHILD_PRODUCT_ID ?? "";
const expectedOrigin = process.env.ADMIN_EXPECTED_ORIGIN ?? "https://admin.space.test";
const expectedHost = process.env.ADMIN_EXPECTED_HOST ?? "admin.space.test";

const authCookieName = `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`;

function sessionCookie() {
  const session = {
    access_token: accessToken,
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

function setRequestContext(request: NextRequest) {
  nextHeadersState.headers = request.headers;
  nextHeadersState.cookies = [sessionCookie()];
}

function setupRequest(proof: string, body: string) {
  const request = new NextRequest(`${expectedOrigin}/api/admin/setup-recipe`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: expectedOrigin,
      host: expectedHost,
      "x-csrf-proof": proof
    },
    body
  });
  setRequestContext(request);
  return request;
}

async function json(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

async function issueProof(
  operation: "admin.setupRecipe.read" | "admin.setupRecipe.write"
) {
  const request = new NextRequest(`${expectedOrigin}/api/admin/csrf-proof`, {
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

describe.runIf(enabled)("Run-49 joined production Supabase/PostgreSQL integration", () => {
  beforeEach(() => {
    expect(accessToken).not.toBe("");
    expect(workspaceId).toMatch(/^[0-9a-f-]{36}$/);
    expect(setupProductId).toMatch(/^[0-9a-f-]{36}$/);
    expect(childProductId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("uses the real session-bound client and crosses the HTTP RPC transport", async () => {
    const clientResult = await createSessionBoundSupabaseAdminReadClient();
    expect(clientResult.configured).toBe(true);

    if (!clientResult.configured) {
      throw new Error("joined session-bound Supabase client was not configured");
    }
    const client = clientResult.client as unknown as {
      rpc(functionName: string, args: Record<string, unknown>): Promise<{
        data: unknown;
        error: unknown;
      }>;
    };
    const issuedAt = Date.now();
    const fingerprint = "a".repeat(64);
    const first = await client.rpc("consume_admin_csrf_proof", {
      p_operation: "product.write",
      p_expected_workspace_id: workspaceId,
      p_proof_fingerprint: fingerprint,
      p_issued_at_ms: issuedAt,
      p_expires_at_ms: issuedAt + 60_000
    });
    const duplicate = await client.rpc("consume_admin_csrf_proof", {
      p_operation: "product.write",
      p_expected_workspace_id: workspaceId,
      p_proof_fingerprint: fingerprint,
      p_issued_at_ms: issuedAt,
      p_expires_at_ms: issuedAt + 60_000
    });

    expect(first.error).toBeNull();
    expect(first.data).toBe(true);
    expect(duplicate.error).toBeNull();
    expect(duplicate.data).toBe(false);
  });

  it("consumes before malformed and oversized bodies, then accepts only a fresh proof", async () => {
    const malformedProof = await issueProof("admin.setupRecipe.read");
    const malformedRequest = setupRequest(malformedProof, "{");
    const malformed = await handleAdminSetupRecipeRoute(malformedRequest);
    expect(malformed.status).toBe(400);

    const replayRequest = setupRequest(malformedProof, validReadBody());
    const replay = await handleAdminSetupRecipeRoute(replayRequest);
    expect(replay.status).toBe(403);
    expect(await json(replay)).toEqual({ error: "csrf_proof_replayed" });

    const oversizedProof = await issueProof("admin.setupRecipe.read");
    const oversizedRequest = setupRequest(
      oversizedProof,
      JSON.stringify({ action: "read", setupProductId, padding: "x".repeat(70_000) })
    );
    const oversized = await handleAdminSetupRecipeRoute(oversizedRequest);
    expect(oversized.status).toBe(413);

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

  it("persists a setup write through the production repository and reloads it authoritatively", async () => {
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

  it("rejects a mismatched action only after consuming the signed operation", async () => {
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
    expect(responses.map((response) => response.status).sort()).toEqual([403, 200]);
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
});
