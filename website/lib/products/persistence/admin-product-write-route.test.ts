import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import type { ProductPersistence, ProductPersistenceResult } from "./types";
import {
  handleAdminProductWriteRoute,
  type AdminProductWriteRouteDependencies
} from "./admin-product-write-route";

const env = {
  ADMIN_EXPECTED_ORIGIN: "https://admin.space.test",
  ADMIN_EXPECTED_HOST: "admin.space.test",
  ADMIN_TRUSTED_WORKSPACE_ID: "11111111-1111-4111-8111-111111111111"
};

const adminContext = {
  workspaceId: env.ADMIN_TRUSTED_WORKSPACE_ID,
  adminUserId: "22222222-2222-4222-8222-222222222222",
  membershipId: "33333333-3333-4333-8333-333333333333",
  resolution: "server-auth-membership" as const
};

function request(body?: unknown, init: RequestInit = {}) {
  const requestInit: RequestInit = {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: env.ADMIN_EXPECTED_ORIGIN,
      host: env.ADMIN_EXPECTED_HOST,
      "x-csrf-proof": "proof"
    },
    ...init
  };

  if (body !== undefined) {
    requestInit.body =
      typeof body === "string" ? body : JSON.stringify(body);
  }

  return new Request("https://admin.space.test/api/admin/products", requestInit) as NextRequest;
}

function createPersistence(
  result: ProductPersistenceResult = {
    ok: true as const,
    record: {
      id: "55555555-5555-4555-8555-555555555555",
      type: "product" as const
    }
  }
): ProductPersistence {
  return {
    createCategory: vi.fn(async () => result),
    updateCategory: vi.fn(async () => result),
    archiveCategory: vi.fn(async () => result),
    createProduct: vi.fn(async () => result),
    updateProduct: vi.fn(async () => result),
    archiveProduct: vi.fn(async () => result),
    publishProduct: vi.fn(async () => result),
    createProductImage: vi.fn(async () => result),
    updateProductImage: vi.fn(async () => result),
    archiveProductImage: vi.fn(async () => result)
  };
}

type TestDependencies = AdminProductWriteRouteDependencies & {
  createRuntimeDependencies: NonNullable<
    AdminProductWriteRouteDependencies["createRuntimeDependencies"]
  >;
  resolveSessionWorkspaceBinding: NonNullable<
    AdminProductWriteRouteDependencies["resolveSessionWorkspaceBinding"]
  >;
  resolveRouteGate: NonNullable<
    AdminProductWriteRouteDependencies["resolveRouteGate"]
  >;
  persistence: ProductPersistence;
};

function createDependencies(persistence = createPersistence()): TestDependencies {
  return {
    env,
    now: () => 1_700_000_000_000,
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
    persistence
  } as TestDependencies;
}

async function json(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

describe("admin product write route helper", () => {
  it.each([
    [request(undefined), "request_body_missing"],
    [request("{"), "request_body_malformed"],
    [request({ slug: "valid", name: "Valid", isPublished: true, extra: "nope" }), "request_payload_invalid"],
    [request({ slug: "Bad Slug", name: "Valid", isPublished: true }), "request_payload_invalid"],
    [request({ slug: "valid", name: "", isPublished: true }), "request_payload_invalid"]
  ])("rejects invalid category create requests before auth or persistence", async (
    input,
    expectedError
  ) => {
    const dependencies = createDependencies();

    const response = await handleAdminProductWriteRoute(
      input,
      {
        action: "createCategory",
        operation: "category.write"
      },
      dependencies
    );

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await json(response)).toEqual({
      ok: false,
      error: expectedError
    });
    expect(dependencies.resolveSessionWorkspaceBinding).not.toHaveBeenCalled();
    expect(dependencies.resolveRouteGate).not.toHaveBeenCalled();
  });

  it("verifies the CSRF proof with the expected current session/workspace binding before writing", async () => {
    const persistence = createPersistence();
    const dependencies = createDependencies(persistence);

    const response = await handleAdminProductWriteRoute(
      request({
        slug: "modular-lounge",
        name: "Modular Lounge",
        status: "draft"
      }),
      {
        action: "createProduct",
        operation: "product.write"
      },
      dependencies
    );

    expect(response.status).toBe(201);
    expect(dependencies.resolveSessionWorkspaceBinding).toHaveBeenCalledWith(
      {
        requestedOperation: "product.write"
      },
      expect.objectContaining({
        workspace: {
          trustedServerWorkspaceId: env.ADMIN_TRUSTED_WORKSPACE_ID
        }
      })
    );
    expect(dependencies.resolveRouteGate).toHaveBeenCalledWith(
      {
        requestedOperation: "product.write",
        requestMethod: "POST",
        request: expect.any(Request)
      },
      expect.objectContaining({
        gate: expect.objectContaining({
          csrfVerifier: expect.objectContaining({
            expectedSessionBinding: "bound-session",
            currentTimestampMs: 1_700_000_000_000,
            maxProofAgeMs: 300_000
          }),
          decision: {
            workspace: {
              trustedServerWorkspaceId: env.ADMIN_TRUSTED_WORKSPACE_ID
            }
          }
        })
      })
    );
    expect(persistence.createProduct).toHaveBeenCalledWith({
      admin: adminContext,
      product: {
        slug: "modular-lounge",
        name: "Modular Lounge",
        status: "draft"
      }
    });
    expect(await json(response)).toEqual({
      ok: true,
      record: {
        id: "55555555-5555-4555-8555-555555555555",
        type: "product"
      }
    });
  });

  it.each([
    ["csrf_proof_missing", 403],
    ["csrf_proof_invalid", 403],
    ["csrf_proof_mismatched", 403],
    ["role_not_allowed", 403],
    ["unauthenticated", 401],
    ["admin_profile_missing", 403],
    ["admin_profile_inactive", 403],
    ["membership_missing", 403],
    ["membership_inactive", 403],
    ["workspace_mismatch", 403],
    ["workspace_missing", 403],
    ["admin_authorization_gate_unavailable", 503]
  ] as const)("returns safe no-store denial JSON for %s", async (
    reason,
    status
  ) => {
    const persistence = createPersistence();
    const dependencies = createDependencies(persistence);
    dependencies.resolveRouteGate = vi.fn(async () => ({
      allowed: false as const,
      reason,
      statusCode: status,
      requestId: "request-1",
      workspaceId: "workspace-secret",
      rawError: "sql stack cookie header token"
    })) as TestDependencies["resolveRouteGate"];

    const response = await handleAdminProductWriteRoute(
      request({
        productId: "55555555-5555-4555-8555-555555555555",
        storageBucket: "product-images",
        storagePath: "products/modular-lounge/main.jpg"
      }),
      {
        action: "createProductImage",
        operation: "productImage.write"
      },
      dependencies
    );
    const body = await json(response);
    const serialized = JSON.stringify(body).toLowerCase();

    expect(response.status).toBe(status);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toEqual({
      ok: false,
      error: reason
    });
    expect(serialized).not.toContain("workspace-secret");
    expect(serialized).not.toContain("sql");
    expect(serialized).not.toContain("cookie");
    expect(serialized).not.toContain("token");
    expect(persistence.createProductImage).not.toHaveBeenCalled();
  });

  it("maps persistence failures to safe JSON without exposing payload or database details", async () => {
    const persistence = createPersistence({
      ok: false as const,
      code: "PRODUCT_PERSISTENCE_FAILED" as const
    });
    const dependencies = createDependencies(persistence);

    const response = await handleAdminProductWriteRoute(
      request({
        name: "Sensitive Product Name",
        status: "draft"
      }, { method: "PATCH" }),
      {
        action: "updateProduct",
        operation: "product.write",
        recordId: "55555555-5555-4555-8555-555555555555"
      },
      dependencies
    );
    const body = await json(response);
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(503);
    expect(body).toEqual({
      ok: false,
      error: "product_persistence_failed"
    });
    expect(serialized).not.toContain("Sensitive Product Name");
    expect(serialized).not.toContain(env.ADMIN_TRUSTED_WORKSPACE_ID);
    expect(serialized).not.toContain(adminContext.adminUserId);
  });
});
