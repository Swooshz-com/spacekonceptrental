import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import QuotePage from "./page";

describe("QuotePage", () => {
  afterEach(() => {
    cleanup();
  });

  it("uses validated public listing context as an enquiry starting point", async () => {
    render(
      await QuotePage({
        searchParams: Promise.resolve({ listing: "lounge-sofa-package" })
      })
    );

    expect(
      screen.getByRole("heading", { name: /enquiry for lounge sofa package/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Lounge", { selector: "dd" })).toBeInTheDocument();
    expect(screen.getByText("set", { selector: "dd" })).toBeInTheDocument();
    expect(screen.getByLabelText(/items needed/i)).toHaveValue(
      "Lounge sofa package"
    );
    expect(
      screen.queryByText(/cart|checkout|payment|book now|online ordering/i)
    ).not.toBeInTheDocument();
  });

  it("ignores unsafe or unknown listing context without changing the quote route contract", async () => {
    render(
      await QuotePage({
        searchParams: Promise.resolve({ listing: "../draft-admin-listing" })
      })
    );

    expect(
      screen.queryByRole("heading", { name: /enquiry for/i })
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/items needed/i)).toHaveValue("");
    expect(
      screen.queryByText(/cart|checkout|payment|book now|online ordering/i)
    ).not.toBeInTheDocument();
  });
});
