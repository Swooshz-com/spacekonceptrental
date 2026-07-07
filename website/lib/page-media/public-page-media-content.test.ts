import { describe, expect, it } from "vitest";

import {
  ABOUT_STORY_MEDIA_SLOT,
  DEFAULT_PUBLIC_PAGE_MEDIA,
  mapAdminPublicPageMediaRow,
  mapPublicPageMediaRow,
  validatePublicPageMediaInput
} from "./public-page-media-content";

describe("public page media content", () => {
  it("keeps the current About story image as the default fallback", () => {
    expect(DEFAULT_PUBLIC_PAGE_MEDIA[ABOUT_STORY_MEDIA_SLOT]).toMatchObject({
      source: "default",
      slot: ABOUT_STORY_MEDIA_SLOT,
      imageAlt: "Curated lounge furniture setting",
      isEnabled: true
    });
  });

  it("maps enabled public rows without exposing admin metadata", () => {
    const media = mapPublicPageMediaRow({
      slot: ABOUT_STORY_MEDIA_SLOT,
      image_url: "https://cdn.example.test/about-story.jpg",
      image_alt: "Owner selected About story lounge",
      updated_at: "2026-07-07T09:00:00.000Z",
      updated_by: "22222222-2222-4222-8222-222222222222"
    });

    expect(media).toEqual({
      source: "supabase",
      slot: ABOUT_STORY_MEDIA_SLOT,
      imageUrl: "https://cdn.example.test/about-story.jpg",
      imageAlt: "Owner selected About story lounge",
      isEnabled: true
    });
    expect(media).not.toHaveProperty("updatedAt");
    expect(media).not.toHaveProperty("updatedBy");
  });

  it("keeps disabled media editable for admins but hidden publicly", () => {
    const row = {
      slot: ABOUT_STORY_MEDIA_SLOT,
      image_url: "https://cdn.example.test/about-story.jpg",
      image_alt: "Owner selected About story lounge",
      is_enabled: false,
      updated_at: "2026-07-07T09:00:00.000Z",
      updated_by: "22222222-2222-4222-8222-222222222222"
    };

    expect(mapPublicPageMediaRow(row)).toBeNull();
    expect(mapAdminPublicPageMediaRow(row)).toMatchObject({
      source: "supabase",
      slot: ABOUT_STORY_MEDIA_SLOT,
      imageUrl: "https://cdn.example.test/about-story.jpg",
      imageAlt: "Owner selected About story lounge",
      isEnabled: false,
      updatedAt: "2026-07-07T09:00:00.000Z"
    });
  });

  it.each([
    [
      {
        slot: "home.category.1",
        imageUrl: "https://cdn.example.test/about-story.jpg",
        imageAlt: "Owner selected About story lounge",
        isEnabled: true
      },
      "slot_invalid"
    ],
    [
      {
        slot: ABOUT_STORY_MEDIA_SLOT,
        imageUrl: "http://cdn.example.test/about-story.jpg",
        imageAlt: "Owner selected About story lounge",
        isEnabled: true
      },
      "image_url_invalid"
    ],
    [
      {
        slot: ABOUT_STORY_MEDIA_SLOT,
        imageUrl: "https://cdn.example.test/about-story.jpg",
        imageAlt: "",
        isEnabled: true
      },
      "image_alt_required"
    ],
    [
      {
        slot: ABOUT_STORY_MEDIA_SLOT,
        imageUrl: "https://cdn.example.test/about-story.jpg",
        imageAlt: "Owner selected About story lounge",
        isEnabled: "true"
      },
      "is_enabled_invalid"
    ]
  ])("rejects unsafe media input with %s", (input, error) => {
    expect(validatePublicPageMediaInput(input)).toEqual({
      ok: false,
      error
    });
  });
});
