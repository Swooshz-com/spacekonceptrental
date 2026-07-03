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
    "https://admin.space.test/api/admin/hero",
    requestInit
  ) as NextRequest;
}

function validPayload() {
  return {
    eyebrow: "Furniture and event rentals",
    headline: "Managed homepage hero",
    body: "Owner-managed public homepage content.",
    primaryCtaLabel: "Request Quote",
    primaryCtaHref: "/quote",
    secondaryCtaLabel: "Browse Catalogue",
    secondaryCtaHref: "/catalogue",
    imageUrl: "https://cdn.example.test/hero.jpg",
    imageAlt: "Managed lounge setup",
    isEnabled: true
  };
}

function createPersistence(): AdminHomepageHeroPersistence {
  return {
    upsertHomepageHero: vi.fn(async () => ({
      ok: true as const,
      record: {
        workspaceId: env.ADMIN_TRUSTED_WORKSPACE_ID,
        updatedAt: "2026-07-03T09:00:00.000Z"
      }
    }))
  };
}

type TestDependencies = AdminHomepageHeroWriteRouteDependencies & {
  persistence: AdminHomepageHeroPersistence;
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

describe("admin homepage hero write route", () => {
  it("updates hero content after hero.write CSRF and admin gate checks", async () => {
    const dependencies = createDependencies();
    const response = await handleAdminHomepageHeroWriteRoute(
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
    expect(dependencies.persistence.upsertHomepageHero).toHaveBeenCalledWith({
      admin: adminContext,
      content: validPayload()
    });
    expect(await json(response)).toEqual({
      ok: true,
      record: {
        workspaceId: env.ADMIN_TRUSTED_WORKSPACE_ID,
        updatedAt: "2026-07-03T09:00:00.000Z"
      }
    });
  });

  it.each([
    [request({ ...validPayload(), headline: "" }), "headline_required", 400],
    [
      request({ ...validPayload(), primaryCtaHref: "javascript:alert(1)" }),
      "primary_cta_href_invalid",
      400
    ],
    [
      request({ ...validPayload(), imageUrl: "http://cdn.example.test/hero.jpg" }),
      "image_url_invalid",
      400
    ],
    [request(undefined), "request_body_missing", 400],
    [request(validPayload(), { method: "PATCH" }), "request_method_not_allowed", 405]
  ])("rejects invalid requests before persistence", async (input, error, status) => {
    const dependencies = createDependencies();
    const response = await handleAdminHomepageHeroWriteRoute(input, dependencies);

    expect(response.status).toBe(status);
    expect(await json(response)).toEqual({
      ok: false,
      error
    });
    expect(dependencies.persistence.upsertHomepageHero).not.toHaveBeenCalled();
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
    expect(dependencies.persistence.upsertHomepageHero).not.toHaveBeenCalled();
  });
});
