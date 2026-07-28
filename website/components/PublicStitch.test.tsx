import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  DEFAULT_PUBLIC_PAGE_MEDIA,
  DEFAULT_HOMEPAGE_HERO_CONTENT,
  StitchAboutPage,
  StitchDetail,
  StitchHomeHero
} from "./PublicStitch";
import { ABOUT_STORY_MEDIA_SLOT } from "../lib/page-media/public-page-media-content";
import type { PublicCatalogueProduct } from "../lib/catalogue/types";

function mockSetupProduct(): PublicCatalogueProduct {
  return {
    id: "setup-1",
    slug: "botanical-wedding",
    name: "Botanical Wedding",
    shortDescription: "Styled setup direction",
    description: "A curated setup direction for review.",
    rentalUnit: "per event",
    sortOrder: 0,
    categoryId: "cat-setups",
    categoryName: "Setups",
    source: "fallback",
    primaryImage: {
      id: "img-1",
      storageBucket: "listing-media",
      storagePath: "hero.jpg",
      publicUrl: "/hero.jpg",
      sortOrder: 0,
      isPrimary: true
    }
  };
}

afterEach(() => {
  cleanup();
});

describe("StitchHomeHero", () => {
  it("keeps existing static hero behavior when no managed content is supplied", () => {
    render(<StitchHomeHero />);

    expect(
      screen.getByRole("heading", {
        name: DEFAULT_HOMEPAGE_HERO_CONTENT.headline
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: DEFAULT_HOMEPAGE_HERO_CONTENT.imageAlt
      })
    ).toBeInTheDocument();
  });

  it("uses managed enabled hero content without changing the public hero layout hooks", () => {
    render(
      <StitchHomeHero
        heroContent={{
          source: "supabase",
          eyebrow: "Owner managed",
          headline: "Stage the first impression",
          body: "Updated protected-admin homepage story.",
          primaryCtaLabel: "Request Quote",
          primaryCtaHref: "/quote",
          secondaryCtaLabel: "Browse Catalogue",
          secondaryCtaHref: "/catalogue",
          imageUrl: "https://cdn.example.test/hero.jpg",
          imageAlt: "Owner selected lounge hero",
          isEnabled: true
        }}
      />
    );

    const hero = screen.getByRole("heading", {
      name: "Stage the first impression"
    }).closest("section");

    expect(hero).toHaveClass("stitch-home-hero");
    expect(
      hero?.querySelector(".stitch-home-hero__copy")
    ).toBeInTheDocument();
    expect(
      hero?.querySelector(".stitch-home-hero__media img")
    ).toHaveAttribute("src", "https://cdn.example.test/hero.jpg");
  });
});

describe("StitchAboutPage", () => {
  it("keeps the current Our Story image as the default fallback", () => {
    render(<StitchAboutPage />);

    const fallback = DEFAULT_PUBLIC_PAGE_MEDIA[ABOUT_STORY_MEDIA_SLOT];
    const story = screen.getByRole("heading", {
      name: "Our Story"
    }).closest("section");

    expect(story).toHaveClass("stitch-about-story");
    expect(
      screen.getByRole("img", {
        name: fallback.imageAlt
      })
    ).toHaveAttribute("src", fallback.imageUrl);
  });

  it("uses managed About story media without changing the public layout hook", () => {
    render(
      <StitchAboutPage
        storyMedia={{
          source: "supabase",
          slot: ABOUT_STORY_MEDIA_SLOT,
          imageUrl: "https://cdn.example.test/about-story.jpg",
          imageAlt: "Owner selected About story lounge",
          isEnabled: true
        }}
      />
    );

    const story = screen.getByRole("heading", {
      name: "Our Story"
    }).closest("section");

    expect(story).toHaveClass("stitch-about-story");
    expect(
      story?.querySelector(".stitch-about-story__image img")
    ).toHaveAttribute("src", "https://cdn.example.test/about-story.jpg");
    expect(
      screen.getByRole("img", {
        name: "Owner selected About story lounge"
      })
    ).toBeInTheDocument();
  });
});

describe("StitchDetail setup deferral", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the manual review deferral instead of a fabricated piece count for setups", () => {
    const setup = mockSetupProduct();
    render(
      <StitchDetail
        product={setup}
        backHref="/listings"
        backLabel="Back to setups"
        setup
        related={[]}
      />
    );

    expect(
      screen.getByText("Included rental pieces will be confirmed during manual review.")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("0 pieces")
    ).not.toBeInTheDocument();
  });

  it("does not render an included pieces section for setups", () => {
    const setup = mockSetupProduct();
    render(
      <StitchDetail
        product={setup}
        backHref="/listings"
        backLabel="Back to setups"
        setup
        related={[]}
      />
    );

    expect(
      screen.queryByRole("heading", { name: /^Included rental pieces$/ })
    ).not.toBeInTheDocument();
  });
});
