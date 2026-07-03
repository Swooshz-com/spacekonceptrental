import { describe, expect, it } from "vitest";

import {
  DEFAULT_HOMEPAGE_HERO_CONTENT,
  getPublicHomepageHeroContent
} from "./public-homepage-hero-repository";

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

describe("public homepage hero repository", () => {
  it("keeps the static public hero when Supabase env or workspace config is unavailable", async () => {
    const supabase = {
      configured: false as const,
      client: null,
      missingEnv: ["SUPABASE_URL", "SUPABASE_ANON_KEY"] as const
    };

    const hero = await getPublicHomepageHeroContent({ supabase });

    expect(hero).toEqual(DEFAULT_HOMEPAGE_HERO_CONTENT);
  });

  it("reads enabled managed hero content through the public RPC for the trusted workspace", async () => {
    const { calls, supabase } = createMockSupabase({
      eyebrow: "Owner managed",
      headline: "Stage the first impression",
      body: "Updated protected-admin homepage story.",
      primary_cta_label: "Request Quote",
      primary_cta_href: "/quote",
      secondary_cta_label: "Browse Catalogue",
      secondary_cta_href: "/catalogue",
      image_url: "https://cdn.example.test/hero.jpg",
      image_alt: "Owner selected lounge hero",
      updated_at: "2026-07-03T09:00:00.000Z",
      updated_by: "22222222-2222-4222-8222-222222222222",
      workspace_id: workspaceId
    });

    const hero = await getPublicHomepageHeroContent({
      supabase,
      env: {
        CATALOGUE_WORKSPACE_ID: workspaceId
      }
    });

    expect(calls).toEqual([
      {
        functionName: "get_public_homepage_hero",
        args: {
          expected_workspace_id: workspaceId
        }
      }
    ]);
    expect(hero).toMatchObject({
      source: "supabase",
      headline: "Stage the first impression",
      imageUrl: "https://cdn.example.test/hero.jpg"
    });
    expect(hero).not.toHaveProperty("updatedAt");
    expect(hero).not.toHaveProperty("updatedBy");
    expect(hero).not.toHaveProperty("workspaceId");
  });

  it("keeps the static public hero when no enabled managed content exists", async () => {
    const { supabase } = createMockSupabase(null);

    await expect(
      getPublicHomepageHeroContent({
        supabase,
        env: {
          CATALOGUE_WORKSPACE_ID: workspaceId
        }
      })
    ).resolves.toEqual(DEFAULT_HOMEPAGE_HERO_CONTENT);
  });

  it("accepts Supabase table-returning RPC rows when returned as an array", async () => {
    const { supabase } = createMockSupabase([
      {
        eyebrow: "Owner managed",
        headline: "Array-shaped managed hero",
        body: "Updated protected-admin homepage story.",
        primary_cta_label: "Request Quote",
        primary_cta_href: "/quote",
        secondary_cta_label: "Browse Catalogue",
        secondary_cta_href: "/catalogue",
        image_url: "https://cdn.example.test/hero.jpg",
        image_alt: "Owner selected lounge hero"
      }
    ]);

    await expect(
      getPublicHomepageHeroContent({
        supabase,
        env: {
          CATALOGUE_WORKSPACE_ID: workspaceId
        }
      })
    ).resolves.toMatchObject({
      source: "supabase",
      headline: "Array-shaped managed hero"
    });
  });
});
