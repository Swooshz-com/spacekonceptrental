import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import {
  handleAdminHomepageHeroWriteRoute,
  type AdminHomepageHeroWriteRouteDependencies
} from "./admin-homepage-hero-write-route";
import type { AdminHomepageHeroPersistence } from "./admin-homepage-hero-write";

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

function imageFile(
  name = "hero image.webp",
  type = "image/webp",
  size = 12
) {
  return new File([new Uint8Array(size)], name, { type });
}

function formData(fields: {
  file?: File;
  imageAlt?: string;
  isEnabled?: string;
}) {
  const body = new FormData();

  if (fields.file) {
    body.set("imageFile", fields.file);
  }

  if (fields.imageAlt !== undefined) {
    body.set("imageAlt", fields.imageAlt);
  }

  if (fields.isEnabled !== undefined) {
    body.set("isEnabled", fields.isEnabled);
  }

  return body;
}

function request(
  body: FormData = formData({
    file: imageFile(),
    imageAlt: "Managed lounge setup",
    isEnabled: "true"
  }),
  init: RequestInit = {}
) {
  const input = new Request("https://admin.space.test/api/admin/hero", {
    method: "POST",
    ...init,
    headers: {
      "content-type": "multipart/form-data; boundary=test",
      origin: env.ADMIN_EXPECTED_ORIGIN,
      host: env.ADMIN_EXPECTED_HOST,
      "x-csrf-proof": "proof",
      ...((init.headers as Record<string, string>) || {})
    }
  }) as NextRequest;

  Object.defineProperty(input, "formData", {
    value: async () => body
  });

  return input;
}

function createPersistence(): AdminHomepageHeroPersistence {
  return {
    upsertHomepageHeroImage: vi.fn(async () => ({
      ok: true as const,
      record: {
        workspaceId: env.ADMIN_TRUSTED_WORKSPACE_ID,
        updatedAt: "2026-07-03T09:00:00.000Z"
      }
    }))
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
  const upload = vi.fn(
    async (path: string, body: unknown, options: Record<string, unknown>) => {
      uploads.push({ bucket: "hero-media", path, body, options });
      return { data: { path }, error: null };
    }
  );
  const remove = vi.fn(async (paths: string[]) => {
    removals.push({ bucket: "hero-media", paths });
    return { data: paths, error: null };
  });
  const client = {
    storage: {
      from(bucket: string) {
        expect(bucket).toBe("hero-media");
        return {
          upload,
          remove,
          getPublicUrl(path: string) {
            return {
              data: {
                publicUrl: `https://space.supabase.co/storage/v1/object/public/hero-media/${path}`
              }
            };
          }
        };
      }
    }
  };

  return { client, uploads, removals };
}

type TestDependencies = AdminHomepageHeroWriteRouteDependencies & {
  persistence: AdminHomepageHeroPersistence;
  resolveSessionWorkspaceBinding: NonNullable<
    AdminHomepageHeroWriteRouteDependencies["resolveSessionWorkspaceBinding"]
  >;
  resolveRouteGate: NonNullable<
    AdminHomepageHeroWriteRouteDependencies["resolveRouteGate"]
  >;
  storage: ReturnType<typeof createStorageClient>;
};

function createDependencies(
  persistence = createPersistence(),
  storage = createStorageClient()
): TestDependencies {
  return {
    env,
    now: () => 1_700_000_000_000,
    generateId: () => "99999999-9999-4999-8999-999999999999",
    persistence,
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
    storage
  } as TestDependencies;
}

async function json(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

describe("admin homepage hero image write route", () => {
  it("uploads a hero image to a workspace-scoped hero media path after hero.write authorization", async () => {
    const dependencies = createDependencies();
    const response = await handleAdminHomepageHeroWriteRoute(
      request(),
      dependencies
    );

    const storagePath = `${env.ADMIN_TRUSTED_WORKSPACE_ID}/homepage-hero/1700000000000-99999999-9999-4999-8999-999999999999.webp`;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(dependencies.resolveSessionWorkspaceBinding).toHaveBeenCalledWith(
      {
        requestedOperation: "hero.write"
      },
      expect.objectContaining({
        workspace: {
          trustedServerWorkspaceId: env.ADMIN_TRUSTED_WORKSPACE_ID
        }
      })
    );
    expect(dependencies.resolveRouteGate).toHaveBeenCalledWith(
      {
        requestedOperation: "hero.write",
        requestMethod: "POST",
        request: expect.any(Request),
        requiresMutationCapability: true
      },
      expect.objectContaining({
        gate: expect.objectContaining({
          csrfVerifier: expect.objectContaining({
            expectedSessionBinding: "bound-session"
          })
        })
      })
    );
    expect(dependencies.storage.uploads[0]).toMatchObject({
      bucket: "hero-media",
      path: storagePath,
      options: {
        contentType: "image/webp",
        upsert: false
      }
    });
    expect(dependencies.persistence.upsertHomepageHeroImage).toHaveBeenCalledWith({
      admin: adminContext,
      image: {
        imageUrl: `https://space.supabase.co/storage/v1/object/public/hero-media/${storagePath}`,
        imageAlt: "Managed lounge setup",
        isEnabled: true
      }
    });
    expect(await json(response)).toEqual({
      ok: true,
      record: {
        workspaceId: env.ADMIN_TRUSTED_WORKSPACE_ID,
        updatedAt: "2026-07-03T09:00:00.000Z"
      },
      image: {
        storageBucket: "hero-media",
        storagePath,
        publicUrl: `https://space.supabase.co/storage/v1/object/public/hero-media/${storagePath}`
      }
    });
    expect(JSON.stringify(dependencies.storage.uploads)).not.toContain(
      "hero image"
    );
  });

  it("saves alt text and publish state without requiring a product id or raw URL", async () => {
    const dependencies = createDependencies();
    const response = await handleAdminHomepageHeroWriteRoute(
      request(
        formData({
          imageAlt: "Existing homepage hero",
          isEnabled: "false"
        })
      ),
      dependencies
    );

    expect(response.status).toBe(200);
    expect(dependencies.createStorageClient).not.toHaveBeenCalled();
    expect(dependencies.persistence.upsertHomepageHeroImage).toHaveBeenCalledWith({
      admin: adminContext,
      image: {
        imageAlt: "Existing homepage hero",
        isEnabled: false
      }
    });
  });

  it.each([
    [
      request(
        formData({
          imageAlt: "Bad hero",
          isEnabled: "true",
          file: imageFile("bad.svg", "image/svg+xml")
        })
      ),
      "image_type_unsupported",
      400
    ],
    [
      request(
        formData({
          imageAlt: "Oversized hero",
          isEnabled: "true",
          file: imageFile("large.webp", "image/webp", 6 * 1024 * 1024)
        })
      ),
      "image_file_too_large",
      400
    ],
    [
      request(
        formData({
          imageAlt: "",
          isEnabled: "true"
        })
      ),
      "image_alt_required",
      400
    ],
    [request(undefined, { method: "PATCH" }), "request_method_not_allowed", 405],
    [
      request(formData({ imageAlt: "Hero", isEnabled: "true" }), {
        headers: {
          "content-type": "application/json"
        }
      }),
      "request_content_type_unsupported",
      415
    ]
  ])("rejects invalid requests before persistence", async (input, error, status) => {
    const dependencies = createDependencies();
    const response = await handleAdminHomepageHeroWriteRoute(input, dependencies);

    expect(response.status).toBe(status);
    expect(await json(response)).toEqual({
      ok: false,
      error
    });
    expect(dependencies.persistence.upsertHomepageHeroImage).not.toHaveBeenCalled();
    expect(dependencies.storage.uploads).toEqual([]);
  });

  it("returns safe no-store denial JSON for unauthenticated or untrusted writes", async () => {
    const dependencies = createDependencies();
    dependencies.resolveRouteGate = vi.fn(async () => ({
      allowed: false as const,
      reason: "unauthenticated" as const,
      statusCode: 401 as const,
      requestId: "request-1"
    }));

    const response = await handleAdminHomepageHeroWriteRoute(
      request(),
      dependencies
    );
    const body = await json(response);
    const serialized = JSON.stringify(body).toLowerCase();

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toEqual({
      ok: false,
      error: "unauthenticated"
    });
    expect(serialized).not.toContain("workspace-secret");
    expect(serialized).not.toContain("sql");
    expect(serialized).not.toContain("cookie");
    expect(serialized).not.toContain("token");
    expect(dependencies.persistence.upsertHomepageHeroImage).not.toHaveBeenCalled();
    expect(dependencies.storage.uploads).toEqual([]);
  });

  it("cleans up uploaded storage when hero metadata persistence fails", async () => {
    const persistence: AdminHomepageHeroPersistence = {
      upsertHomepageHeroImage: vi.fn(async () => ({
        ok: false as const,
        code: "HERO_PERSISTENCE_FAILED" as const
      }))
    };
    const dependencies = createDependencies(persistence);
    const response = await handleAdminHomepageHeroWriteRoute(
      request(),
      dependencies
    );

    expect(response.status).toBe(503);
    expect(await json(response)).toEqual({
      ok: false,
      error: "hero_persistence_failed"
    });
    expect(dependencies.storage.removals).toEqual([
      {
        bucket: "hero-media",
        paths: [
          `${env.ADMIN_TRUSTED_WORKSPACE_ID}/homepage-hero/1700000000000-99999999-9999-4999-8999-999999999999.webp`
        ]
      }
    ]);
  });
});
