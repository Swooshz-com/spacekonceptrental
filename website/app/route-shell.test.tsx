import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import RouteShell from "./route-shell";

let mockedPathname = "/";

const matchMediaStub = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  dispatchEvent: vi.fn()
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockedPathname
}));

describe("RouteShell", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: matchMediaStub
    });
    Object.defineProperty(window, "scrollTo", {
      writable: true,
      value: vi.fn()
    });
  });

  afterEach(() => {
    cleanup();
    matchMediaStub.mockClear();
  });

  it("renders public chrome and chat on public routes", () => {
    mockedPathname = "/catalogue";

    render(
      <RouteShell>
        <div>Public catalogue content</div>
      </RouteShell>
    );

    expect(screen.getByText("Public catalogue content")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /open chat/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it.each([
    "/admin",
    "/admin/hero",
    "/admin/catalogue",
    "/admin/setups",
    "/admin/enquiry-email",
    "/admin/delivery-log",
    "/admin/login",
    "/admin/logout"
  ])("does not render public chat on %s", (pathname) => {
    mockedPathname = pathname;

    render(
      <RouteShell>
        <div>Protected admin content</div>
      </RouteShell>
    );

    expect(screen.getByText("Protected admin content")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /open chat/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
  });
});
