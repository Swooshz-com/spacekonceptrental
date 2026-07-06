import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  DEFAULT_HOMEPAGE_HERO_CONTENT,
  StitchHomeHero
} from "./PublicStitch";

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

    expect(
      screen.getByText("Furnish Your Vision,")
    ).toHaveClass("stitch-home-hero__headline-line");
    expect(
      screen.getByText("Elevate Every Space")
    ).toHaveClass("stitch-home-hero__headline-line");
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
    expect(
      hero?.querySelector(".stitch-home-hero__headline-line")
    ).not.toBeInTheDocument();
  });
});
