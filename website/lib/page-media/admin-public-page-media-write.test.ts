import { describe, expect, it, vi } from "vitest";

import {
  ABOUT_STORY_MEDIA_SLOT,
  type PublicPageMediaInput
} from "./public-page-media-content";
import {
  SupabaseAdminPublicPageMediaPersistence,
  type AdminPublicPageMediaWriteInput
} from "./admin-public-page-media-write";

const workspaceId = "11111111-1111-4111-8111-111111111111";

function mediaInput(
  override: Partial<PublicPageMediaInput> = {}
): PublicPageMediaInput {
  return {
    slot: ABOUT_STORY_MEDIA_SLOT,
    imageUrl: "https://cdn.example.test/about-story.jpg",
    imageAlt: "Owner selected About story lounge",
    isEnabled: true,
    ...override
  };
}

function writeInput(
  override: Partial<AdminPublicPageMediaWriteInput> = {}
): AdminPublicPageMediaWriteInput {
  return {
    admin: {
      resolution: "server-auth-membership",
      workspaceId,
      adminUserId: "22222222-2222-4222-8222-222222222222",
      membershipId: "33333333-3333-4333-8333-333333333333"
    },
    content: mediaInput(),
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

describe("admin public page media persistence", () => {
  it("persists valid About story media through the protected RPC boundary", async () => {
    const { supabase, rpc } = supabaseClient({
      data: {
        workspace_id: workspaceId,
        slot: ABOUT_STORY_MEDIA_SLOT,
        updated_at: "2026-07-07T09:00:00.000Z"
      },
      error: null
    });
    const persistence = new SupabaseAdminPublicPageMediaPersistence({
      supabase
    });

    await expect(
      persistence.upsertPublicPageMedia(writeInput())
    ).resolves.toEqual({
      ok: true,
      record: {
        workspaceId,
        slot: ABOUT_STORY_MEDIA_SLOT,
        updatedAt: "2026-07-07T09:00:00.000Z"
      }
    });
    expect(rpc).toHaveBeenCalledWith("execute_admin_public_page_media_write", {
      p_workspace_id: workspaceId,
      p_slot: ABOUT_STORY_MEDIA_SLOT,
      p_payload: {
        image_url: "https://cdn.example.test/about-story.jpg",
        image_alt: "Owner selected About story lounge",
        is_enabled: true
      }
    });
  });

  it("rejects untrusted admin context before calling Supabase", async () => {
    const { supabase, rpc } = supabaseClient({ data: null, error: null });
    const persistence = new SupabaseAdminPublicPageMediaPersistence({
      supabase
    });

    await expect(
      persistence.upsertPublicPageMedia(
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
      code: "PUBLIC_PAGE_MEDIA_ADMIN_CONTEXT_INVALID"
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("fails safely when the authenticated write client is unavailable", async () => {
    const persistence = new SupabaseAdminPublicPageMediaPersistence({
      supabase: {
        configured: false,
        client: null,
        reason: "authenticated_admin_write_client_required"
      }
    });

    await expect(
      persistence.upsertPublicPageMedia(writeInput())
    ).resolves.toEqual({
      ok: false,
      code: "PUBLIC_PAGE_MEDIA_PERSISTENCE_UNAVAILABLE"
    });
  });

  it("returns a generic failure without exposing provider details", async () => {
    const { supabase } = supabaseClient({
      data: null,
      error: {
        message: "permission denied for table public_page_media"
      }
    });
    const persistence = new SupabaseAdminPublicPageMediaPersistence({
      supabase
    });

    await expect(
      persistence.upsertPublicPageMedia(writeInput())
    ).resolves.toEqual({
      ok: false,
      code: "PUBLIC_PAGE_MEDIA_PERSISTENCE_FAILED"
    });
  });
});
