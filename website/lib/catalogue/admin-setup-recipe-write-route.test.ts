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

function proofFor(operation: "admin.setupRecipe.read" | "admin.setupRecipe.write") {
  const payload = Buffer.from(JSON.stringify({
    operation,
    sessionBinding: "bound-session",
    nonce: "nonce",
    issuedAt: 1_700_000_000_000,
    expiresAt: 1_700_000_300_000
  })).toString("base64url");

  return `${payload}.signature`;
}

function request(body: Record<string, unknown>) {
  const operation = body.action === "read"
    ? "admin.setupRecipe.read"
    : "admin.setupRecipe.write";

  return new Request("https://admin.space.test/api/admin/setup-recipe", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: env.ADMIN_EXPECTED_ORIGIN,
      host: env.ADMIN_EXPECTED_HOST,
      "x-csrf-proof": proofFor(operation)
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
    expect(await json(response)).toMatchObject({
      error: "rpc-failure",
      reference: expect.any(String)
    });
  });

  it("keeps protected reads available when mutation capability is disabled", async () => {
    const dependencies = createDependencies(
      vi.fn(async () => ({
        ok: true as const,
        operation: "replace" as const,
        setupProductId: "44444444-4444-4444-8444-444444444444",
        revision: 4,
        itemCount: 1
      }))
    );
    dependencies.env = { ...env, ADMIN_MUTATIONS_ENABLED: "false" };
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
    expect(dependencies.resolveRouteGate).toHaveBeenCalledWith(
      expect.objectContaining({
        requestedOperation: "admin.setupRecipe.read",
        requiresMutationCapability: false
      }),
      expect.anything()
    );
  });

  it("keeps writes fail-closed when mutation capability is disabled", async () => {
    const executeWrite = vi.fn(async () => ({
      ok: true as const,
      operation: "remove",
      setupProductId: "44444444-4444-4444-8444-444444444444",
      revision: 2,
      itemCount: 0
    }));
    const dependencies = createDependencies(executeWrite);
    dependencies.env = { ...env, ADMIN_MUTATIONS_ENABLED: "false" };

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
    expect(executeWrite).not.toHaveBeenCalled();
  });

  it("denies a missing read session through route admission even when reads are enabled", async () => {
    const dependencies = createDependencies(vi.fn());
    dependencies.env = { ...env, ADMIN_MUTATIONS_ENABLED: "false" };
    dependencies.resolveSessionWorkspaceBinding = vi.fn(async () => ({
      bound: false as const,
      reason: "unauthenticated" as const,
      statusCode: 401 as const
    }));

    const response = await handleAdminSetupRecipeRoute(
      request({ action: "read", setupProductId: "setup-1" }),
      dependencies
    );

    expect(response.status).toBe(401);
    expect(await json(response)).toEqual({ error: "submission_not_allowed" });
  });

  it("maps a session expiry between route admission and recipe read to 401", async () => {
    const dependencies = createDependencies(vi.fn());
    dependencies.readRecipe = vi.fn(async () => ({
      ok: false as const,
      code: "not-authenticated" as const
    }));

    const response = await handleAdminSetupRecipeRoute(
      request({ action: "read", setupProductId: "setup-1" }),
      dependencies
    );

    expect(response.status).toBe(401);
    expect(await json(response)).toEqual({ error: "not-authenticated" });
  });

  it("denies a wrong workspace through route admission even when reads are enabled", async () => {
    const dependencies = createDependencies(vi.fn());
    dependencies.env = { ...env, ADMIN_MUTATIONS_ENABLED: "false" };
    dependencies.resolveRouteGate = vi.fn(async () => ({
      allowed: false as const,
      reason: "workspace_mismatch" as const,
      statusCode: 403 as const,
      requestId: "request-1"
    }));

    const response = await handleAdminSetupRecipeRoute(
      request({ action: "read", setupProductId: "setup-1" }),
      dependencies
    );

    expect(response.status).toBe(403);
    expect(await json(response)).toEqual({ error: "workspace_mismatch" });
  });

  it.each([
    ["not-authenticated", 401, false],
    ["unauthorized", 403, false],
    ["conflict", 409, false],
    ["validation-failure", 400, false],
    ["rpc-unavailable", 503, true],
    ["rpc-failure", 503, true],
    ["network-error", 503, true],
    ["unknown-error", 503, true]
  ] as const)("maps %s write results to the established status", async (code, status, operational) => {
    const dependencies = createDependencies(
      vi.fn(async () => ({ ok: false as const, code }))
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

    expect(response.status).toBe(status);
    if (operational) {
      expect(await json(response)).toMatchObject({
        error: code,
        reference: expect.any(String)
      });
    } else {
      expect(await json(response)).toEqual({ error: code });
    }
  });

  it.each([
    ["not-found", 404, false],
    ["not-authenticated", 401, false],
    ["unauthorized", 403, false],
    ["read-failure", 503, true],
    ["rpc-unavailable", 503, true],
    ["unknown-error", 503, true]
  ] as const)("maps %s read results to the established status", async (code, status, operational) => {
    const dependencies = createDependencies(vi.fn());
    dependencies.readRecipe = vi.fn(async () => ({ ok: false as const, code }));

    const response = await handleAdminSetupRecipeRoute(
      request({ action: "read", setupProductId: "setup-1" }),
      dependencies
    );

    expect(response.status).toBe(status);
    if (operational) {
      expect(await json(response)).toMatchObject({
        error: code,
        reference: expect.any(String)
      });
    } else {
      expect(await json(response)).toEqual({ error: code });
    }
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

describe("setup recipe route no-store and correlated failure references", () => {
  it.each([
    ["successful read", { action: "read", setupProductId: "44444444-4444-4444-8444-444444444444" }, 200, { ok: false }, { ok: true }],
    ["successful write", { action: "write", operation: "remove", setupProductId: "44444444-4444-4444-8444-444444444444", expectedRevision: 1, items: [] }, 200, { ok: false }, { ok: false }],
    ["validation failure", { action: "read", setupProductId: "" }, 400, { ok: false }, { ok: false }],
    ["unknown action", { action: "explode" }, 400, { ok: false }, { ok: false }],
    ["conflict write", { action: "write", operation: "remove", setupProductId: "44444444-4444-4444-8444-444444444444", expectedRevision: 1, items: [] }, 409, { ok: true, code: "conflict" }, { ok: false }],
    ["operational failure", { action: "read", setupProductId: "44444444-4444-4444-8444-444444444444" }, 503, { ok: true, code: "read-failure" }, { ok: false, code: "read-failure" }]
  ] as const)(
    "marks %s responses as no-store",
    async (label, body, status, outcome, readOutcome) => {
      const executeWrite = vi.fn(async () =>
        outcome.ok
          ? { ok: false as const, code: outcome.code as "conflict" | "read-failure" }
          : {
              ok: true as const,
              operation: "remove" as const,
              setupProductId: "44444444-4444-4444-8444-444444444444",
              revision: 2,
              itemCount: 0
            }
      );
      const dependencies = createDependencies(executeWrite);

      if (body.action === "read") {
        const readOutcomeAsWrite = readOutcome as {
          ok: boolean;
          code?: string;
        };
        dependencies.readRecipe = vi.fn(async () =>
          readOutcomeAsWrite.ok
            ? {
                ok: true as const,
                revision: 2,
                items: [
                  {
                    workspace_id: env.ADMIN_TRUSTED_WORKSPACE_ID,
                    setup_product_id: "44444444-4444-4444-8444-444444444444",
                    included_product_id: "55555555-5555-4555-8555-555555555555",
                    position: 0,
                    base_quantity: 1
                  }
                ]
              }
            : {
                ok: false as const,
                code: (readOutcomeAsWrite.code ?? "read-failure") as "read-failure"
              }
        );
      }

      const response = await handleAdminSetupRecipeRoute(
        request(body as Record<string, unknown>),
        dependencies
      );

      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.status).toBe(status);
    }
  );

  it("shares one support-safe reference between the response and the server event", async () => {
    const logEvent = vi.fn();
    const executeWrite = vi.fn(async () => ({
      ok: false as const,
      code: "rpc-failure" as const
    }));
    const dependencies = createDependencies(executeWrite);
    dependencies.logEvent = logEvent;
    dependencies.createRequestReference = () => "fixed-reference-1";

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
    expect(await json(response)).toEqual({
      error: "rpc-failure",
      reference: "fixed-reference-1"
    });
    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "ADMIN_SETUP_RECIPE_WRITE_FAILURE",
        reference: "fixed-reference-1",
        statusCode: 503
      })
    );
    expect(JSON.stringify(logEvent.mock.calls[0][0])).toContain(
      "fixed-reference-1"
    );
    expect(JSON.stringify(logEvent.mock.calls[0][0])).not.toContain(
      "x-csrf-proof"
    );
  });

  it("keeps client validation failures quiet without a reference or server event", async () => {
    const logEvent = vi.fn();
    const dependencies = createDependencies(vi.fn());
    dependencies.logEvent = logEvent;

    const response = await handleAdminSetupRecipeRoute(
      request({ action: "read", setupProductId: "" }),
      dependencies
    );

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ error: "setup_product_id_required" });
    expect(logEvent).not.toHaveBeenCalled();
  });

  it("traces authorization-gate unavailability with a correlated reference", async () => {
    const logEvent = vi.fn();
    const dependencies = createDependencies(vi.fn());
    dependencies.logEvent = logEvent;
    dependencies.createRequestReference = () => "fixed-reference-gate";
    dependencies.resolveRouteGate = vi.fn(async () => {
      throw new Error("gate unavailable");
    });

    const response = await handleAdminSetupRecipeRoute(
      request({ action: "read", setupProductId: "setup-1" }),
      dependencies
    );

    expect(response.status).toBe(503);
    expect(await json(response)).toEqual({
      error: "admin_authorization_gate_unavailable",
      reference: "fixed-reference-gate"
    });
    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "ADMIN_SETUP_RECIPE_GATE_UNAVAILABLE",
        reference: "fixed-reference-gate",
        statusCode: 503
      })
    );
  });

  it("does not emit a failure event for a successful request", async () => {
    const logEvent = vi.fn();
    const dependencies = createDependencies(
      vi.fn(async () => ({
        ok: true as const,
        operation: "remove" as const,
        setupProductId: "44444444-4444-4444-8444-444444444444",
        revision: 2,
        itemCount: 0
      }))
    );
    dependencies.logEvent = logEvent;

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

    expect(response.status).toBe(200);
    expect(logEvent).not.toHaveBeenCalled();
  });
});
