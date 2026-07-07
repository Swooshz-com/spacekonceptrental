import { describe, expect, it, vi } from "vitest";

import { ABOUT_STORY_MEDIA_SLOT } from "./public-page-media-content";
import { resolveAdminPublicPageMediaRead } from "./admin-public-page-media-read";

const workspaceId = "11111111-1111-4111-8111-111111111111";

function createMockSupabase(data: unknown, error: unknown = null) {
  const maybeSingle = vi.fn(async () => ({ data, error }));
  const slotEq = vi.fn(() => ({ maybeSingle }));
  const workspaceEq = vi.fn(() => ({ eq: slotEq }));
  const select = vi.fn(() => ({ eq: workspaceEq }));
  const from = vi.fn(() => ({ select }));

  return {
    calls: {
      from,
      select,
      workspaceEq,
      slotEq,
      maybeSingle
    },
    supabase: {
      configured: true as const,
      client: { from },
      missingEnv: [] as []
    }
  };
}

describe("admin public page media read", () => {
  it("loads managed About story media for the trusted workspace", async () => {
    const { calls, supabase } = createMockSupabase({
      slot: ABOUT_STORY_MEDIA_SLOT,
      image_url: "https://cdn.example.test/about-story.jpg",
      image_alt: "Owner selected About story lounge",
      is_enabled: true,
      updated_at: "2026-07-07T09:00:00.000Z",
      updated_by: "22222222-2222-4222-8222-222222222222"
    });

    await expect(
      resolveAdminPublicPageMediaRead({
        supabase,
        env: {
          ADMIN_TRUSTED_WORKSPACE_ID: workspaceId
        }
      })
    ).resolves.toEqual({
      status: "loaded",
      media: {
        source: "supabase",
        slot: ABOUT_STORY_MEDIA_SLOT,
        imageUrl: "https://cdn.example.test/about-story.jpg",
        imageAlt: "Owner selected About story lounge",
        isEnabled: true,
        updatedAt: "2026-07-07T09:00:00.000Z",
        updatedBy: "22222222-2222-4222-8222-222222222222"
      }
    });

    expect(calls.from).toHaveBeenCalledWith("public_page_media");
    expect(calls.workspaceEq).toHaveBeenCalledWith("workspace_id", workspaceId);
    expect(calls.slotEq).toHaveBeenCalledWith("slot", ABOUT_STORY_MEDIA_SLOT);
  });

  it("returns a safe unavailable state when the read client is unavailable", async () => {
    await expect(
      resolveAdminPublicPageMediaRead({
        supabase: {
          configured: false,
          client: null,
          reason: "authenticated_admin_read_client_required"
        },
        env: {
          ADMIN_TRUSTED_WORKSPACE_ID: workspaceId
        }
      })
    ).resolves.toEqual({
      status: "unavailable"
    });
  });
});
