import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import {
  handleAdminProductImageUploadRoute,
  type AdminProductImageUploadRouteDependencies
} from "./admin-product-image-upload-route";
import type { ProductPersistence, ProductPersistenceResult } from "../persistence/types";

const env = {
  ADMIN_EXPECTED_ORIGIN: "https://admin.space.test",
  ADMIN_EXPECTED_HOST: "admin.space.test",
  ADMIN_TRUSTED_WORKSPACE_ID: "11111111-1111-4111-8111-111111111111",
  SUPABASE_URL: "https://space.supabase.co"
};

const adminContext = {
  workspaceId: env.ADMIN_TRUSTED_WORKSPACE_ID,
  adminUserId: "22222222-2222-4222-8222-222222222222",
  membershipId: "33333333-3333-4333-8333-333333333333",
  resolution: "server-auth-membership" as const
};

const productId = "44444444-4444-4444-8444-444444444444";
const imageId = "55555555-5555-4555-8555-555555555555";

function imageFile(
  name = "lounge setup.webp",
  type = "image/webp",
  size = 12
) {
  return new File([new Uint8Array(size)], name, { type });
}

function formData(fields: {
  productId?: string;
  file?: File;
  altText?: string;
  sortOrder?: string;
  isPrimary?: string;
}) {
  const body = new FormData();

  if (fields.productId !== undefined) {
    body.set("productId", fields.productId);
  }

  if (fields.file) {
    body.set("imageFile", fields.file);
  }

  if (fields.altText !== undefined) {
    body.set("altText", fields.altText);
  }

  if (fields.sortOrder !== undefined) {
    body.set("sortOrder", fields.sortOrder);
  }

  if (fields.isPrimary !== undefined) {
    body.set("isPrimary", fields.isPrimary);
  }

  return body;
}

function request(body: FormData = formData({ productId, file: imageFile() })) {
  const input = new Request("https://admin.space.test/api/admin/product-images", {
    method: "POST",
    headers: {
      origin: env.ADMIN_EXPECTED_ORIGIN,
      host: env.ADMIN_EXPECTED_HOST,
      "x-csrf-proof": "proof"
    }
  }) as NextRequest;

  Object.defineProperty(input, "formData", {
    value: async () => body
  });

  return input;
}

function createPersistence(
  result: ProductPersistenceResult = {
    ok: true,
    record: {
      id: imageId,
      type: "productImage"
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

function createStorageClient() {
  const uploads: Array<{
    bucket: string;
    path: string;
    body: unknown;
    options: Record<string, unknown>;
  }> = [];
  const removals: Array<{ bucket: string; paths: string[] }> = [];
  const productFilters: Array<{ column: string; value: string }> = [];
  const upload = vi.fn(
    async (path: string, body: unknown, options: Record<string, unknown>) => {
      uploads.push({ bucket: "listing-media", path, body, options });
      return { data: { path }, error: null };
    }
  );
  const remove = vi.fn(async (paths: string[]) => {
    removals.push({ bucket: "listing-media", paths });
    return { data: paths, error: null };
  });
  const client: any = {
    from(table: string) {
      expect(table).toBe("products");
      return {
        select(columns: string) {
          expect(columns).toBe("id, workspace_id");
          const query = {
            eq(column: string, value: string) {
              productFilters.push({ column, value });
              return query;
            },
            async limit(count: number) {
              expect(count).toBe(1);
              return {
                data: [
                  {
                    id: productId,
                    workspace_id: env.ADMIN_TRUSTED_WORKSPACE_ID
                  }
                ],
                error: null
              };
            }
          };

          return query;
        }
      };
    },
    storage: {
      from(bucket: string) {
        expect(bucket).toBe("listing-media");
        return {
          upload,
          remove,
          getPublicUrl(path: string) {
            return {
              data: {
                publicUrl: `https://space.supabase.co/storage/v1/object/public/listing-media/${path}`
              }
            };
          }
        };
      }
    }
  };

  return { client, uploads, removals, productFilters };
}

type TestDependencies = AdminProductImageUploadRouteDependencies & {
  resolveSessionWorkspaceBinding: NonNullable<
    AdminProductImageUploadRouteDependencies["resolveSessionWorkspaceBinding"]
  >;
  resolveRouteGate: NonNullable<
    AdminProductImageUploadRouteDependencies["resolveRouteGate"]
  >;
  persistence: ProductPersistence;
};

function createDependencies(
  persistence = createPersistence(),
  storage = createStorageClient()
): TestDependencies & { storage: ReturnType<typeof createStorageClient> } {
  const dependencies: TestDependencies & {
    storage: ReturnType<typeof createStorageClient>;
  } = {
    env,
    now: () => 1_700_000_000_000,
    generateId: () => "99999999-9999-4999-8999-999999999999",
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
    createStorageClient: vi.fn(async () => ({
      configured: true as const,
      client: storage.client
    })),
    persistence,
    storage
  };

  return dependencies;
}

async function json(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

describe("admin product image upload route", () => {
  it("requires productImage.write authorization and uploads to a server-controlled listing media path", async () => {
    const persistence = createPersistence();
    const dependencies = createDependencies(persistence);

    const response = await handleAdminProductImageUploadRoute(
      request(
        formData({
          productId,
          file: imageFile(),
          altText: "Styled lounge setup",
          sortOrder: "7",
          isPrimary: "true"
        })
      ),
      dependencies
    );

    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(dependencies.resolveSessionWorkspaceBinding).toHaveBeenCalledWith(
      { requestedOperation: "productImage.write" },
      expect.objectContaining({
        workspace: {
          trustedServerWorkspaceId: env.ADMIN_TRUSTED_WORKSPACE_ID
        }
      })
    );
    expect(dependencies.resolveRouteGate).toHaveBeenCalledWith(
      {
        requestedOperation: "productImage.write",
        requestMethod: "POST",
        request: expect.any(Request),
        requiresMutationCapability: true
      },
      expect.objectContaining({
        gate: expect.objectContaining({
          csrfVerifier: expect.objectContaining({
            expectedSessionBinding: "bound-session",
            currentTimestampMs: 1_700_000_000_000
          })
        })
      })
    );
    expect(dependencies.storage.productFilters).toEqual([
      { column: "id", value: productId },
      { column: "workspace_id", value: env.ADMIN_TRUSTED_WORKSPACE_ID }
    ]);
    expect(dependencies.storage.uploads[0]).toMatchObject({
      bucket: "listing-media",
      path: `${env.ADMIN_TRUSTED_WORKSPACE_ID}/${productId}/1700000000000-99999999-9999-4999-8999-999999999999.webp`,
      options: {
        contentType: "image/webp",
        upsert: false
      }
    });
    expect(persistence.createProductImage).toHaveBeenCalledWith({
      admin: adminContext,
      image: {
        productId,
        storageBucket: "listing-media",
        storagePath: `${env.ADMIN_TRUSTED_WORKSPACE_ID}/${productId}/1700000000000-99999999-9999-4999-8999-999999999999.webp`,
        altText: "Styled lounge setup",
        sortOrder: 7,
        isPrimary: true
      }
    });
    expect(await json(response)).toEqual({
      ok: true,
      record: {
        id: imageId,
        type: "productImage"
      },
      image: {
        storageBucket: "listing-media",
        storagePath: `${env.ADMIN_TRUSTED_WORKSPACE_ID}/${productId}/1700000000000-99999999-9999-4999-8999-999999999999.webp`,
        publicUrl:
          `https://space.supabase.co/storage/v1/object/public/listing-media/${env.ADMIN_TRUSTED_WORKSPACE_ID}/${productId}/1700000000000-99999999-9999-4999-8999-999999999999.webp`
      }
    });
    expect(JSON.stringify(dependencies.storage.uploads)).not.toContain(
      "lounge setup"
    );
  });

  it.each([
    ["unauthenticated", 401],
    ["role_not_allowed", 403],
    ["csrf_proof_missing", 403],
    ["origin_host_mismatch", 400]
  ] as const)("returns safe no-store denial JSON for %s", async (reason, status) => {
    const persistence = createPersistence();
    const dependencies = createDependencies(persistence);
    dependencies.resolveRouteGate = vi.fn(async () => ({
      allowed: false as const,
      reason,
      statusCode: status,
      workspaceId: "workspace-secret",
      rawError: "sql storage stack token cookie provider"
    })) as TestDependencies["resolveRouteGate"];

    const response = await handleAdminProductImageUploadRoute(
      request(),
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
    expect(serialized).not.toContain("storage stack");
    expect(serialized).not.toContain("token");
    expect(persistence.createProductImage).not.toHaveBeenCalled();
    expect(dependencies.storage.uploads).toEqual([]);
  });

  it.each([
    [
      () => formData({ file: imageFile() }),
      "request_payload_invalid",
      "missing product id"
    ],
    [
      () => formData({ productId: "not-a-uuid", file: imageFile() }),
      "request_payload_invalid",
      "invalid product id"
    ],
    [
      () => formData({ productId, file: imageFile("bad.svg", "image/svg+xml") }),
      "image_type_unsupported",
      "unsupported MIME type"
    ],
    [
      () => formData({ productId, file: imageFile("../bad.webp", "image/webp") }),
      "image_filename_invalid",
      "unsafe filename"
    ],
    [
      () =>
        formData({
          productId,
          file: imageFile("large.webp", "image/webp", 6 * 1024 * 1024)
        }),
      "image_file_too_large",
      "oversized file"
    ]
  ])("rejects %s before storage upload", async (bodyFactory, expectedError) => {
    const persistence = createPersistence();
    const dependencies = createDependencies(persistence);

    const response = await handleAdminProductImageUploadRoute(
      request(bodyFactory()),
      dependencies
    );

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({
      ok: false,
      error: expectedError
    });
    expect(dependencies.storage.uploads).toEqual([]);
    expect(persistence.createProductImage).not.toHaveBeenCalled();
  });

  it("rejects unknown listing ids before storage upload", async () => {
    const persistence = createPersistence();
    const storage = createStorageClient();
    storage.client.from = () =>
      ({
        select: () => {
          const query = {
            eq: () => query,
            limit: async () => ({ data: [], error: null })
          };

          return query;
        }
      });
    const dependencies = createDependencies(persistence, storage);

    const response = await handleAdminProductImageUploadRoute(
      request(),
      dependencies
    );

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({
      ok: false,
      error: "request_payload_invalid"
    });
    expect(storage.uploads).toEqual([]);
    expect(persistence.createProductImage).not.toHaveBeenCalled();
  });

  it("cleans up uploaded storage object when metadata persistence fails", async () => {
    const persistence = createPersistence({
      ok: false,
      code: "PRODUCT_PERSISTENCE_FAILED"
    });
    const dependencies = createDependencies(persistence);

    const response = await handleAdminProductImageUploadRoute(
      request(),
      dependencies
    );

    expect(response.status).toBe(503);
    expect(await json(response)).toEqual({
      ok: false,
      error: "product_persistence_failed"
    });
    expect(dependencies.storage.removals).toEqual([
      {
        bucket: "listing-media",
        paths: [
          `${env.ADMIN_TRUSTED_WORKSPACE_ID}/${productId}/1700000000000-99999999-9999-4999-8999-999999999999.webp`
        ]
      }
    ]);
  });
});
