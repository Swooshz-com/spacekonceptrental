import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import {
  handleAdminSetupRecipeRoute,
  type AdminSetupRecipeRouteDependencies
} from "./admin-setup-recipe-write-route";
import type { AdminRecipeWriteRequest } from "./setup-recipe-types";

const env = {
  ADMIN_EXPECTED_ORIGIN: "https://admin.space.test",
  ADMIN_EXPECTED_HOST: "admin.space.test",
  ADMIN_TRUSTED_WORKSPACE_ID: "11111111-1111-4111-8111-111111111111",
  ADMIN_MUTATIONS_ENABLED: "true"
};

const adminContext = {
  workspaceId: env.ADMIN_TRUSTED_WORKSPACE_ID,
  adminUserId: "22222222-2222-4222-8222-222222222222",
  membershipId: "33333333-3333-4333-8333-333333333333",
  resolution: "server-auth-membership" as const
};

function request(body: unknown) {
  return new Request("https://admin.space.test/api/admin/setup-recipe", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: env.ADMIN_EXPECTED_ORIGIN,
      host: env.ADMIN_EXPECTED_HOST,
      "x-csrf-proof": "proof"
    },
    body: JSON.stringify(body)
  }) as NextRequest;
}

function createDependencies(
  executeWrite: (input: AdminRecipeWriteRequest) => Promise<unknown>
) {
  return {
    env,
    createRuntimeDependencies: vi.fn(() => ({
      issuerDependencies: {
        generateNonce: vi.fn(async () => "nonce"),
        signCsrfProof: vi.fn(async () => "signature")
      },
      sessionWorkspaceBindingDependencies: {
        deriveSessionWorkspaceBinding: vi.fn(() => "bound-session")
      },
      verifierDependencies: {
        verifySignature: vi.fn(async () => true)
      }
    })),
    resolveSessionWorkspaceBinding: vi.fn(async () => ({
      bound: true as const,
      sessionBinding: "bound-session",
      adminContext,
      requestId: "request-1"
    })),
    resolveRouteGate: vi.fn(async () => ({
      allowed: true as const,
      reason: "allowed" as const,
      statusCode: 200 as const,
      workspaceId: env.ADMIN_TRUSTED_WORKSPACE_ID,
      requestId: "request-1"
    })),
    executeWrite
  } as AdminSetupRecipeRouteDependencies & {
    executeWrite: typeof executeWrite;
  };
}

async function json(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

describe("admin setup recipe route write response contract", () => {
  it.each([
    ["replace", 0, 1],
    ["replace", 7, 8],
    ["remove", 8, 9]
  ] as const)(
    "returns ok true for %s at expected revision %d",
    async (operation, expectedRevision, revision) => {
      const executeWrite = vi.fn(async (input: AdminRecipeWriteRequest) => ({
        ok: true as const,
        operation: input.operation,
        setupProductId: input.setupProductId,
        revision,
        itemCount: input.items.length
      }));
      const dependencies = createDependencies(executeWrite);
      const response = await handleAdminSetupRecipeRoute(
        request({
          action: "write",
          operation,
          setupProductId: "44444444-4444-4444-8444-444444444444",
          expectedRevision,
          items:
            operation === "remove"
              ? []
              : [{ included_product_id: "55555555-5555-4555-8555-555555555555", position: 0, base_quantity: 1 }]
        }),
        dependencies
      );

      expect(response.status).toBe(200);
      expect(await json(response)).toMatchObject({
        ok: true,
        operation,
        revision,
        setup_product_id: "44444444-4444-4444-8444-444444444444"
      });
      expect(executeWrite).toHaveBeenCalledWith(
        expect.objectContaining({ expectedRevision })
      );
    }
  );

  it("keeps write errors public-safe and fail-closed", async () => {
    const dependencies = createDependencies(
      vi.fn(async () => ({ ok: false as const, code: "rpc-failure" as const }))
    );

    const response = await handleAdminSetupRecipeRoute(
      request({
        action: "write",
        operation: "remove",
        setupProductId: "44444444-4444-4444-8444-444444444444",
        expectedRevision: 1,
        items: []
      }),
      dependencies
    );

    expect(response.status).toBe(503);
    expect(await json(response)).toEqual({ error: "rpc-failure" });
  });

  it("binds protected recipe reads to the read operation", async () => {
    const dependencies = createDependencies(
      vi.fn(async () => ({ ok: true as const, operation: "replace", setupProductId: "setup-1", revision: 4, itemCount: 1 }))
    );
    dependencies.readRecipe = vi.fn(async () => ({
      ok: true as const,
      revision: 3,
      items: [
        {
          workspace_id: env.ADMIN_TRUSTED_WORKSPACE_ID,
          setup_product_id: "44444444-4444-4444-8444-444444444444",
          included_product_id: "55555555-5555-4555-8555-555555555555",
          position: 0,
          base_quantity: 1
        }
      ]
    }));

    const response = await handleAdminSetupRecipeRoute(
      request({
        action: "read",
        setupProductId: "44444444-4444-4444-8444-444444444444"
      }),
      dependencies
    );

    expect(response.status).toBe(200);
    expect(dependencies.resolveSessionWorkspaceBinding).toHaveBeenCalledWith(
      expect.objectContaining({ requestedOperation: "admin.setupRecipe.read" }),
      expect.anything()
    );
    expect(dependencies.resolveRouteGate).toHaveBeenCalledWith(
      expect.objectContaining({ requestedOperation: "admin.setupRecipe.read" }),
      expect.anything()
    );
  });
});
