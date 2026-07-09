import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import RootLayout from "../../layout";
import AdminLoginPage from "./page";

const navigationMock = vi.hoisted(() => ({
  pathname: "/admin/login"
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMock.pathname
}));

describe("admin login page", () => {
  afterEach(() => {
    cleanup();
    navigationMock.pathname = "/admin/login";
  });

  it("renders a first-party login form without exposing env or provider details", async () => {
    render(await AdminLoginPage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", { name: /admin sign in/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue with google/i })
    ).toHaveAttribute("formAction", "/api/admin/login");
    expect(
      screen.getByText(/google email that has been added to admin access/i)
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^email$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/sign up|create account/i)).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain("SUPABASE");
    expect(document.body.textContent).not.toContain("SQL");
    expect(document.body.textContent).not.toContain("stack");
  });

  it("renders the admin login route without the public site shell", async () => {
    navigationMock.pathname = "/admin/login";

    const html = renderToStaticMarkup(
      <RootLayout>
        {await AdminLoginPage({ searchParams: Promise.resolve({}) })}
      </RootLayout>
    );

    expect(html).toContain("Admin sign in");
    expect(html).not.toContain("stitch-site-header");
    expect(html).not.toContain("stitch-footer");
    expect(html).not.toContain("stitch-bottom-nav");
    expect(html).not.toContain("chat-widget");
    expect(html).not.toContain("Request Quote");
  });

  it("renders safe unauthenticated and unavailable states", async () => {
    const unauthenticated = await AdminLoginPage({
      searchParams: Promise.resolve({ state: "unauthenticated" })
    });
    const unavailable = await AdminLoginPage({
      searchParams: Promise.resolve({ state: "unavailable" })
    });

    render(unauthenticated);
    expect(screen.getByText(/sign in to continue/i)).toBeInTheDocument();
    cleanup();

    render(unavailable);
    expect(screen.getByText(/admin access is temporarily unavailable/i)).toBeInTheDocument();
  });
});
