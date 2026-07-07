import { describe, expect, it } from "vitest";

import {
  DEFAULT_HOMEPAGE_HERO_CONTENT,
  mapAdminHomepageHeroRow,
  mapHomepageHeroRow,
  validateHomepageHeroContentInput,
  validateHomepageHeroImageInput
} from "./homepage-hero-content";

describe("homepage hero content contract", () => {
  it("keeps the existing static public hero as the default fallback", () => {
    expect(DEFAULT_HOMEPAGE_HERO_CONTENT).toMatchObject({
      source: "default",
      eyebrow: "Furniture and event rentals",
      headline: "Furnish Your Vision, Elevate Every Space",
      body: "Browse rental pieces, explore setup directions, and send an enquiry for manual team review.",
      primaryCtaLabel: "Request Quote",
      primaryCtaHref: "/quote",
      secondaryCtaLabel: "Browse Catalogue",
      secondaryCtaHref: "/catalogue",
      imageAlt: "Styled rental furniture event setting"
    });
  });

  it("maps enabled database rows into public hero content without admin metadata", () => {
    const publicRpcRow = {
      eyebrow: "Owner managed",
      headline: "Stage the first impression",
      body: "Updated protected-admin homepage story.",
      primary_cta_label: "Request Quote",
      primary_cta_href: "/quote",
      secondary_cta_label: "Browse Catalogue",
      secondary_cta_href: "/catalogue",
      image_url: "https://cdn.example.test/hero.jpg",
      image_alt: "Owner selected lounge hero",
      is_enabled: true,
      updated_at: "2026-07-03T09:00:00.000Z",
      workspace_id: "11111111-1111-4111-8111-111111111111",
      updated_by: "22222222-2222-4222-8222-222222222222"
    };

    const hero = mapHomepageHeroRow(publicRpcRow);

    expect(hero).toEqual({
      source: "supabase",
      eyebrow: DEFAULT_HOMEPAGE_HERO_CONTENT.eyebrow,
      headline: DEFAULT_HOMEPAGE_HERO_CONTENT.headline,
      body: DEFAULT_HOMEPAGE_HERO_CONTENT.body,
      primaryCtaLabel: "Request Quote",
      primaryCtaHref: "/quote",
      secondaryCtaLabel: "Browse Catalogue",
      secondaryCtaHref: "/catalogue",
      imageUrl: "https://cdn.example.test/hero.jpg",
      imageAlt: "Owner selected lounge hero",
      isEnabled: true
    });
    expect(hero).not.toHaveProperty("updatedAt");
    expect(hero).not.toHaveProperty("updatedBy");
    expect(hero).not.toHaveProperty("workspaceId");
  });

  it("keeps disabled managed rows editable for protected admin only", () => {
    const row = {
      eyebrow: "Draft owner content",
      headline: "Draft homepage story",
      body: "This draft should stay editable in protected admin.",
      primary_cta_label: "Request Quote",
      primary_cta_href: "/quote",
      secondary_cta_label: "Browse Catalogue",
      secondary_cta_href: "/catalogue",
      image_url: "https://cdn.example.test/draft-hero.jpg",
      image_alt: "Draft owner selected hero",
      is_enabled: false,
      updated_at: "2026-07-03T10:00:00.000Z",
      updated_by: "22222222-2222-4222-8222-222222222222"
    };

    expect(mapHomepageHeroRow(row)).toBeNull();
    expect(mapAdminHomepageHeroRow(row)).toMatchObject({
      source: "supabase",
      headline: DEFAULT_HOMEPAGE_HERO_CONTENT.headline,
      imageUrl: "https://cdn.example.test/draft-hero.jpg",
      isEnabled: false,
      updatedAt: "2026-07-03T10:00:00.000Z",
      updatedBy: "22222222-2222-4222-8222-222222222222"
    });
  });

  it.each([
    [{ headline: "" }, "headline_required"],
    [{ primaryCtaHref: "javascript:alert(1)" }, "primary_cta_href_invalid"],
    [{ secondaryCtaHref: "ftp://example.test/catalogue" }, "secondary_cta_href_invalid"],
    [{ imageUrl: "not-a-url" }, "image_url_invalid"],
    [{ imageUrl: "http://cdn.example.test/hero.jpg" }, "image_url_invalid"]
  ])("rejects unsafe hero input %#", (override, expectedError) => {
    const result = validateHomepageHeroContentInput({
      eyebrow: "Furniture and event rentals",
      headline: "Safe headline",
      body: "Safe body for protected admin review.",
      primaryCtaLabel: "Request Quote",
      primaryCtaHref: "/quote",
      secondaryCtaLabel: "Browse Catalogue",
      secondaryCtaHref: "/catalogue",
      imageUrl: "https://cdn.example.test/hero.jpg",
      imageAlt: "Lounge setup",
      isEnabled: true,
      ...override
    });

    expect(result).toEqual({
      ok: false,
      error: expectedError
    });
  });

  it("validates owner-managed hero image metadata without requiring a raw image URL", () => {
    expect(
      validateHomepageHeroImageInput(
        {
          imageAlt: "Uploaded lounge hero",
          isEnabled: true
        },
        {
          imageUrlRequired: false
        }
      )
    ).toEqual({
      ok: true,
      image: {
        imageAlt: "Uploaded lounge hero",
        isEnabled: true
      }
    });

    expect(
      validateHomepageHeroImageInput({
        imageUrl: "http://cdn.example.test/hero.jpg",
        imageAlt: "Uploaded lounge hero",
        isEnabled: true
      })
    ).toEqual({
      ok: false,
      error: "image_url_invalid"
    });
  });
});
