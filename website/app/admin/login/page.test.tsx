import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import AdminLoginPage from "./page";

describe("admin login page", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a first-party login form without exposing env or provider details", async () => {
    render(await AdminLoginPage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", { name: /admin sign in/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toHaveAttribute("name", "email");
    expect(screen.getByLabelText(/password/i)).toHaveAttribute(
      "name",
      "password"
    );
    expect(screen.getByRole("button", { name: /sign in/i })).toHaveAttribute(
      "formAction",
      "/api/admin/login"
    );
    expect(document.body.textContent).not.toContain("SUPABASE");
    expect(document.body.textContent).not.toContain("provider");
    expect(document.body.textContent).not.toContain("SQL");
    expect(document.body.textContent).not.toContain("stack");
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
