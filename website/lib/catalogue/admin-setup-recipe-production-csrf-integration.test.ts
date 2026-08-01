import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdminAuthorizationAdapterSet } from "../admin/authorization/admin-authorization-resolver";
import { issueServerAdminCsrfProof } from "../admin/authorization/server-admin-csrf-proof-issuer";
import { createServerAdminCsrfProofRuntimeDependencies } from "../admin/authorization/server-admin-csrf-proof-runtime-dependencies";
import { resolveServerAdminCsrfProofSessionWorkspaceBinding } from "../admin/authorization/server-admin-csrf-proof-session-workspace-binding";
import { resolveServerAdminRuntimeRouteGateAdapter } from "../admin/authorization/server-admin-runtime-route-gate-adapter";
import type { ServerAdminCsrfReplayCheckInput } from "../admin/authorization/server-admin-csrf-proof-verifier";
import {
  handleAdminSetupRecipeRoute,
  type AdminSetupRecipeRouteDependencies
} from "./admin-setup-recipe-write-route";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const adminUserId = "22222222-2222-4222-8222-222222222222";
const authUserId = "33333333-3333-4333-8333-333333333333";
const setupProductId = "44444444-4444-4444-8444-444444444444";
const childProductId = "55555555-5555-4555-8555-555555555555";
const env = {
  ADMIN_EXPECTED_ORIGIN: "https://admin.space.test",
  ADMIN_EXPECTED_HOST: "admin.space.test",
  ADMIN_TRUSTED_WORKSPACE_ID: workspaceId,
  ADMIN_MUTATIONS_ENABLED: "true"
};

const adapters: AdminAuthorizationAdapterSet = {
  auth: {
    async resolveIdentity() {
      return {
        authenticated: true,
        authUserId,
        email: "admin@example.test",
        provider: "google"
      };
    }
  },
  profile: {
    async resolveAdminProfile() {
      return { id: adminUserId, status: "active" };
    }
  },
  membership: {
    async resolveMembership() {
      return {
        adminUserId,
        workspaceId,
        status: "active",
        role: "owner"
      };
    }
  },
  workspace: {
    async resolveWorkspaceForRequest() {
      return { serverResolvedWorkspaceId: workspaceId };
    }
  }
};

const createAdapterSet = async () => ({
  configured: true as const,
  adapters
});

function createReplayChecker() {
  const consumedKeys: string[] = [];

  return vi.fn(async (input: ServerAdminCsrfReplayCheckInput) => {
    const key = JSON.stringify(input);

    if (consumedKeys.includes(key)) return false;
    consumedKeys.push(key);
    return true;
  });
}

async function issueProof(
  operation: "admin.setupRecipe.read" | "admin.setupRecipe.write"
) {
  const runtime = createServerAdminCsrfProofRuntimeDependencies();
  const binding = await resolveServerAdminCsrfProofSessionWorkspaceBinding(
    { requestedOperation: operation },
    {
      createAdapterSet,
      ...runtime.sessionWorkspaceBindingDependencies
    }
  );

  if (!binding.bound) throw new Error("fixture binding failed");
  const issuedAt = Date.now();
  const proof = await issueServerAdminCsrfProof(
    {
      operation,
      sessionBinding: binding.sessionBinding,
      issuedAt,
      expiresAt: issuedAt + 5 * 60_000
    },
    runtime.issuerDependencies
  );

  if (!proof.issued) throw new Error("fixture proof issuance failed");
  return proof.csrfProof;
}

function request(proof: string, body: unknown) {
  return new NextRequest("https://admin.space.test/api/admin/setup-recipe", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: env.ADMIN_EXPECTED_ORIGIN,
      host: env.ADMIN_EXPECTED_HOST,
      "x-csrf-proof": proof
    },
    body: JSON.stringify(body)
  });
}

function createDependencies(
  routeRequest: NextRequest,
  consumeCsrfProof: (input: ServerAdminCsrfReplayCheckInput) => Promise<unknown>,
  overrides: Partial<AdminSetupRecipeRouteDependencies> = {}
): AdminSetupRecipeRouteDependencies {
  return {
    env,
    bindingDependencies: { createAdapterSet },
    createRuntimeDependencies: (verifierContext = {}) =>
      createServerAdminCsrfProofRuntimeDependencies(verifierContext, {
        consumeCsrfProof: consumeCsrfProof as never
      }),
    resolveRouteGate: (input, dependencies) =>
      resolveServerAdminRuntimeRouteGateAdapter(input, {
        ...dependencies,
        requestMetadata: {
          ...dependencies.requestMetadata,
          readHeaders: () => routeRequest.headers
        },
        gate: {
          ...dependencies.gate,
          decision: {
            ...dependencies.gate?.decision,
            createAdapterSet
          }
        }
      }),
    readRecipe: async () => ({
      ok: true,
      revision: 1,
      items: []
    }),
    executeWrite: async (input) => ({
      ok: true,
      operation: input.operation,
      setupProductId: input.setupProductId,
      revision: input.expectedRevision + 1,
      itemCount: input.items.length
    }),
    ...overrides
  };
}

async function responseJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("production-layer setup recipe CSRF integration", () => {
  const originalSecret = process.env.ADMIN_CSRF_PROOF_SECRET;
  const originalMutationCapability = process.env.ADMIN_MUTATIONS_ENABLED;

  beforeEach(() => {
    process.env.ADMIN_CSRF_PROOF_SECRET = "run-47-integration-secret";
    process.env.ADMIN_MUTATIONS_ENABLED = "true";
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.ADMIN_CSRF_PROOF_SECRET;
    } else {
      process.env.ADMIN_CSRF_PROOF_SECRET = originalSecret;
    }
    if (originalMutationCapability === undefined) {
      delete process.env.ADMIN_MUTATIONS_ENABLED;
    } else {
      process.env.ADMIN_MUTATIONS_ENABLED = originalMutationCapability;
    }
  });

  it("joins issuer, binding, runtime factory, header preflight, authorization gate, and read route", async () => {
    const checker = createReplayChecker();
    const proof = await issueProof("admin.setupRecipe.read");
    const firstRequest = request(proof, { action: "read", setupProductId });
    const first = await handleAdminSetupRecipeRoute(
      firstRequest,
      createDependencies(firstRequest, checker)
    );
    const replayRequest = request(proof, { action: "read", setupProductId });
    const replay = await handleAdminSetupRecipeRoute(
      replayRequest,
      createDependencies(replayRequest, checker)
    );

    expect(await responseJson(first)).toEqual({ revision: 1, items: [] });
    expect(first.status).toBe(200);
    expect(replay.status).toBe(403);
    expect(await responseJson(replay)).toEqual({ error: "csrf_proof_replayed" });
    expect(checker).toHaveBeenCalledWith(expect.objectContaining({
      operation: "admin.setupRecipe.read",
      expectedWorkspaceId: workspaceId
    }));
  });

  it("allows exactly one of two concurrent identical write requests", async () => {
    const checker = createReplayChecker();
    const proof = await issueProof("admin.setupRecipe.write");
    const body = {
      action: "write",
      operation: "replace",
      setupProductId,
      expectedRevision: 0,
      items: [{
        included_product_id: childProductId,
        position: 0,
        base_quantity: 1
      }]
    };
    const requests = [request(proof, body), request(proof, body)];
    const responses = await Promise.all(
      requests.map((item) => handleAdminSetupRecipeRoute(
        item,
        createDependencies(item, checker)
      ))
    );

    expect(responses.map((response) => response.status).sort()).toEqual([
      200,
      403
    ]);
  });

  it("consumes before downstream validation and accepts a fresh replacement proof", async () => {
    const checker = createReplayChecker();
    const consumedProof = await issueProof("admin.setupRecipe.write");
    const invalidBody = {
      action: "write",
      operation: "replace",
      setupProductId,
      items: []
    };
    const firstRequest = request(consumedProof, invalidBody);
    const first = await handleAdminSetupRecipeRoute(
      firstRequest,
      createDependencies(firstRequest, checker)
    );
    const retryRequest = request(consumedProof, invalidBody);
    const retry = await handleAdminSetupRecipeRoute(
      retryRequest,
      createDependencies(retryRequest, checker)
    );
    const freshProof = await issueProof("admin.setupRecipe.write");
    const freshRequest = request(freshProof, {
      action: "write",
      operation: "remove",
      setupProductId,
      expectedRevision: 1,
      items: []
    });
    const fresh = await handleAdminSetupRecipeRoute(
      freshRequest,
      createDependencies(freshRequest, checker)
    );

    expect(first.status).toBe(400);
    expect(retry.status).toBe(403);
    expect(await responseJson(retry)).toEqual({ error: "csrf_proof_replayed" });
    expect(fresh.status).toBe(200);
  });

  it("keeps a proof consumed after repository failure", async () => {
    const checker = createReplayChecker();
    const proof = await issueProof("admin.setupRecipe.write");
    const body = {
      action: "write",
      operation: "remove",
      setupProductId,
      expectedRevision: 1,
      items: []
    };
    const firstRequest = request(proof, body);
    const first = await handleAdminSetupRecipeRoute(
      firstRequest,
      createDependencies(firstRequest, checker, {
        executeWrite: async () => ({ ok: false, code: "rpc-failure" })
      })
    );
    const retryRequest = request(proof, body);
    const retry = await handleAdminSetupRecipeRoute(
      retryRequest,
      createDependencies(retryRequest, checker)
    );

    expect(first.status).toBe(503);
    expect(retry.status).toBe(403);
    expect(await responseJson(retry)).toEqual({ error: "csrf_proof_replayed" });
  });
});
