import { describe, expect, it, vi } from "vitest";

import {
  SupabaseAdminHomepageHeroPersistence,
  type AdminHomepageHeroWriteInput
} from "./admin-homepage-hero-write";

const workspaceId = "11111111-1111-4111-8111-111111111111";

function writeInput(
  override: Partial<AdminHomepageHeroWriteInput> = {}
): AdminHomepageHeroWriteInput {
  return {
    admin: {
      resolution: "server-auth-membership",
      workspaceId,
      adminUserId: "22222222-2222-4222-8222-222222222222",
      membershipId: "33333333-3333-4333-8333-333333333333"
    },
    image: {
      imageUrl: "https://cdn.example.test/hero.jpg",
      imageAlt: "Managed lounge setup",
      isEnabled: true
    },
    ...override
  };
}

function supabaseClient(result: { data: unknown; error: unknown }) {
  const single = vi.fn(async () => result);
  const rpc = vi.fn(() => ({ single }));

  return {
    supabase: {
      configured: true as const,
      client: { rpc },
      missingEnv: [] as []
    },
    rpc,
    single
  };
}

describe("admin homepage hero image persistence", () => {
  it("persists valid admin hero image updates through the protected RPC boundary", async () => {
    const { supabase, rpc } = supabaseClient({
      data: {
        workspace_id: workspaceId,
        updated_at: "2026-07-03T09:00:00.000Z"
      },
      error: null
    });
    const persistence = new SupabaseAdminHomepageHeroPersistence({
      supabase
    });

    await expect(persistence.upsertHomepageHeroImage(writeInput())).resolves.toEqual({
      ok: true,
      record: {
        workspaceId,
        updatedAt: "2026-07-03T09:00:00.000Z"
      }
    });
    expect(rpc).toHaveBeenCalledWith("execute_admin_homepage_hero_image_write", {
      p_workspace_id: workspaceId,
      p_payload: {
        image_url: "https://cdn.example.test/hero.jpg",
        image_alt: "Managed lounge setup",
        is_enabled: true
      }
    });
  });

  it("persists alt and publish changes without a browser-submitted raw image URL", async () => {
    const { supabase, rpc } = supabaseClient({
      data: {
        workspace_id: workspaceId,
        updated_at: "2026-07-03T09:00:00.000Z"
      },
      error: null
    });
    const persistence = new SupabaseAdminHomepageHeroPersistence({
      supabase
    });

    await expect(
      persistence.upsertHomepageHeroImage(
        writeInput({
          image: {
            imageAlt: "Existing hero image alt",
            isEnabled: false
          }
        })
      )
    ).resolves.toMatchObject({
      ok: true
    });
    expect(rpc).toHaveBeenCalledWith("execute_admin_homepage_hero_image_write", {
      p_workspace_id: workspaceId,
      p_payload: {
        image_alt: "Existing hero image alt",
        is_enabled: false
      }
    });
  });

  it("rejects untrusted admin context before calling Supabase", async () => {
    const { supabase, rpc } = supabaseClient({ data: null, error: null });
    const persistence = new SupabaseAdminHomepageHeroPersistence({
      supabase
    });

    await expect(
      persistence.upsertHomepageHeroImage(
        writeInput({
          admin: {
            resolution: "server-auth-membership",
            workspaceId: "not-a-uuid",
            adminUserId: "22222222-2222-4222-8222-222222222222"
          }
        })
      )
    ).resolves.toEqual({
      ok: false,
      code: "HERO_ADMIN_CONTEXT_INVALID"
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("fails safely when the authenticated write client is unavailable", async () => {
    const persistence = new SupabaseAdminHomepageHeroPersistence({
      supabase: {
        configured: false,
        client: null,
        reason: "authenticated_admin_write_client_required"
      }
    });

    await expect(persistence.upsertHomepageHeroImage(writeInput())).resolves.toEqual({
      ok: false,
      code: "HERO_PERSISTENCE_UNAVAILABLE"
    });
  });

  it("returns a generic failure without exposing provider details", async () => {
    const { supabase } = supabaseClient({
      data: null,
      error: {
        message: "permission denied for table homepage_hero_content"
      }
    });
    const persistence = new SupabaseAdminHomepageHeroPersistence({
      supabase
    });

    await expect(persistence.upsertHomepageHeroImage(writeInput())).resolves.toEqual({
      ok: false,
      code: "HERO_PERSISTENCE_FAILED"
    });
  });
});
