import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import {
  ABOUT_STORY_MEDIA_SLOT,
  type PublicPageMediaInput
} from "./public-page-media-content";
import type { AdminPublicPageMediaPersistence } from "./admin-public-page-media-write";
import {
  handleAdminPublicPageMediaWriteRoute,
  type AdminPublicPageMediaWriteRouteDependencies
} from "./admin-public-page-media-write-route";

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
    ...init,
    headers: {
      "content-type": "application/json",
      origin: env.ADMIN_EXPECTED_ORIGIN,
      host: env.ADMIN_EXPECTED_HOST,
      "x-csrf-proof": "proof",
      ...((init.headers as Record<string, string>) || {})
    }
  };

  if (body !== undefined) {
    requestInit.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  return new Request(
    "https://admin.space.test/api/admin/page-media",
    requestInit
  ) as NextRequest;
}

function validPayload(): PublicPageMediaInput {
  return {
    slot: ABOUT_STORY_MEDIA_SLOT,
    imageUrl: "https://cdn.example.test/about-story.jpg",
    imageAlt: "Owner selected About story lounge",
    isEnabled: true
  };
}

function createPersistence(): AdminPublicPageMediaPersistence {
  return {
    upsertPublicPageMedia: vi.fn(async () => ({
      ok: true as const,
      record: {
        workspaceId: env.ADMIN_TRUSTED_WORKSPACE_ID,
        slot: ABOUT_STORY_MEDIA_SLOT,
        updatedAt: "2026-07-07T09:00:00.000Z"
      }
    }))
  };
}

type TestDependencies = AdminPublicPageMediaWriteRouteDependencies & {
  persistence: AdminPublicPageMediaPersistence;
};

function createDependencies(
  persistence = createPersistence()
): TestDependencies {
  return {
    env,
    now: () => 1_700_000_000_000,
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
    }))
  } as TestDependencies;
}

async function json(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

describe("admin public page media write route", () => {
  it("updates About story media after hero.write CSRF and admin gate checks", async () => {
    const dependencies = createDependencies();
    const response = await handleAdminPublicPageMediaWriteRoute(
      request(validPayload()),
      dependencies
    );

    expect(response.status).toBe(200);
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
        request: expect.any(Request)
      },
      expect.objectContaining({
        gate: expect.objectContaining({
          csrfVerifier: expect.objectContaining({
            expectedSessionBinding: "bound-session"
          })
        })
      })
    );
    expect(dependencies.persistence.upsertPublicPageMedia).toHaveBeenCalledWith({
      admin: adminContext,
      content: validPayload()
    });
    expect(await json(response)).toEqual({
      ok: true,
      record: {
        workspaceId: env.ADMIN_TRUSTED_WORKSPACE_ID,
        slot: ABOUT_STORY_MEDIA_SLOT,
        updatedAt: "2026-07-07T09:00:00.000Z"
      }
    });
  });

  it.each([
    [
      request({ ...validPayload(), slot: "home.category.1" }),
      "slot_invalid",
      400
    ],
    [
      request({ ...validPayload(), imageUrl: "http://cdn.example.test/about.jpg" }),
      "image_url_invalid",
      400
    ],
    [request({ ...validPayload(), imageAlt: "" }), "image_alt_required", 400],
    [request(undefined), "request_body_missing", 400],
    [request(validPayload(), { method: "PATCH" }), "request_method_not_allowed", 405]
  ])("rejects invalid requests before persistence", async (input, error, status) => {
    const dependencies = createDependencies();
    const response = await handleAdminPublicPageMediaWriteRoute(
      input,
      dependencies
    );

    expect(response.status).toBe(status);
    expect(await json(response)).toEqual({
      ok: false,
      error
    });
    expect(
      dependencies.persistence.upsertPublicPageMedia
    ).not.toHaveBeenCalled();
  });

  it("returns safe no-store denial JSON for unauthenticated or untrusted writes", async () => {
    const dependencies = createDependencies();
    dependencies.resolveRouteGate = vi.fn(async () => ({
      allowed: false as const,
      reason: "unauthenticated" as const,
      statusCode: 401 as const,
      requestId: "request-1"
    }));

    const response = await handleAdminPublicPageMediaWriteRoute(
      request(validPayload()),
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
    expect(
      dependencies.persistence.upsertPublicPageMedia
    ).not.toHaveBeenCalled();
  });
});
