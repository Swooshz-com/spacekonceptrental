import { cleanup, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProductPage from "./catalogue/[slug]/page";
import CataloguePage from "./catalogue/page";
import EventsPage from "./events/page";

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string | { src: string } }) => (
    <img alt={alt} src={typeof src === "string" ? src : src.src} />
  )
}));

describe("public page shells", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the static product detail shell", () => {
    render(<ProductPage />);

    expect(
      screen.getByRole("heading", { name: /lounge sofa package/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/rental details/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to catalogue/i })
    ).toHaveAttribute("href", "/catalogue");
    expect(
      screen.getByRole("link", { name: /start quote/i })
    ).toHaveAttribute("href", "/quote");
  });

  it("renders the static event rental shell", () => {
    render(<EventsPage />);

    expect(
      screen.getByRole("heading", { name: /event rental shells/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/corporate receptions/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /browse catalogue/i })
    ).toHaveAttribute("href", "/catalogue");
    expect(
      screen.getByRole("link", { name: /start quote/i })
    ).toHaveAttribute("href", "/quote");
  });

  it("keeps the new public pages reachable from navigation and catalogue", () => {
    const layoutSource = readFileSync(resolve(process.cwd(), "app/layout.tsx"), "utf8");

    expect(layoutSource).toContain('href="/events"');

    render(<CataloguePage />);

    expect(
      screen.getByRole("link", { name: /view product shell/i })
    ).toHaveAttribute("href", "/catalogue/lounge-sofa-package");
  });
});
