import { describe, expect, it } from "vitest";

import {
  ABOUT_STORY_MEDIA_SLOT,
  DEFAULT_PUBLIC_PAGE_MEDIA
} from "./public-page-media-content";
import { getPublicPageMedia } from "./public-page-media-repository";

const workspaceId = "11111111-1111-4111-8111-111111111111";

function createMockSupabase(data: unknown, error: unknown = null) {
  const calls: { functionName: string; args: Record<string, unknown> }[] = [];
  const client = {
    rpc(functionName: string, args: Record<string, unknown>) {
      calls.push({ functionName, args });
      return Promise.resolve({ data, error });
    }
  };

  return {
    calls,
    supabase: {
      configured: true as const,
      client,
      missingEnv: [] as []
    }
  };
}

describe("public page media repository", () => {
  it("keeps the default media when Supabase env or workspace config is unavailable", async () => {
    const supabase = {
      configured: false as const,
      client: null,
      missingEnv: ["SUPABASE_URL", "SUPABASE_ANON_KEY"] as const
    };

    await expect(
      getPublicPageMedia(ABOUT_STORY_MEDIA_SLOT, { supabase })
    ).resolves.toEqual(DEFAULT_PUBLIC_PAGE_MEDIA[ABOUT_STORY_MEDIA_SLOT]);
  });

  it("reads enabled managed media through the public RPC for the trusted workspace", async () => {
    const { calls, supabase } = createMockSupabase({
      slot: ABOUT_STORY_MEDIA_SLOT,
      image_url: "https://cdn.example.test/about-story.jpg",
      image_alt: "Owner selected About story lounge"
    });

    const media = await getPublicPageMedia(ABOUT_STORY_MEDIA_SLOT, {
      supabase,
      env: {
        CATALOGUE_WORKSPACE_ID: workspaceId
      }
    });

    expect(calls).toEqual([
      {
        functionName: "get_public_page_media",
        args: {
          expected_workspace_id: workspaceId,
          media_slot: ABOUT_STORY_MEDIA_SLOT
        }
      }
    ]);
    expect(media).toEqual({
      source: "supabase",
      slot: ABOUT_STORY_MEDIA_SLOT,
      imageUrl: "https://cdn.example.test/about-story.jpg",
      imageAlt: "Owner selected About story lounge",
      isEnabled: true
    });
  });

  it("keeps the default media when no enabled managed row exists", async () => {
    const { supabase } = createMockSupabase(null);

    await expect(
      getPublicPageMedia(ABOUT_STORY_MEDIA_SLOT, {
        supabase,
        env: {
          CATALOGUE_WORKSPACE_ID: workspaceId
        }
      })
    ).resolves.toEqual(DEFAULT_PUBLIC_PAGE_MEDIA[ABOUT_STORY_MEDIA_SLOT]);
  });

  it("accepts Supabase table-returning RPC rows when returned as an array", async () => {
    const { supabase } = createMockSupabase([
      {
        slot: ABOUT_STORY_MEDIA_SLOT,
        image_url: "https://cdn.example.test/about-story.jpg",
        image_alt: "Owner selected About story lounge"
      }
    ]);

    await expect(
      getPublicPageMedia(ABOUT_STORY_MEDIA_SLOT, {
        supabase,
        env: {
          CATALOGUE_WORKSPACE_ID: workspaceId
        }
      })
    ).resolves.toMatchObject({
      source: "supabase",
      imageUrl: "https://cdn.example.test/about-story.jpg"
    });
  });
});
