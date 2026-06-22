import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import QuotePage from "./page";

describe("QuotePage", () => {
  afterEach(() => {
    cleanup();
  });

  it("preserves validated public listing context as an enquiry starting point", async () => {
    render(
      await QuotePage({
        searchParams: Promise.resolve({ listing: "lounge-sofa-package" })
      })
    );

    expect(
      screen.getByRole("heading", { name: /shape your rental enquiry/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /review the request context/i })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/listing reference/i).length
    ).toBeGreaterThan(0);
    expect(
      screen.getByText("lounge-sofa-package")
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/requested listings or items/i)).toHaveValue(
      "Listing reference: lounge-sofa-package"
    );
    const pageText = document.body.textContent ?? "";
    expect(pageText.indexOf("Listing reference: lounge-sofa-package"))
      .toBeLessThan(pageText.indexOf("Contact details"));
    expect(
      screen.queryByText(/cart|checkout|payment|book now|online ordering/i)
    ).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(
      /customer account|dashboard|reservation|stock reservation|fulfilment|fulfillment|purchase/i
    );
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
    expect(screen.getByLabelText(/requested listings or items/i)).toHaveValue("");
    expect(
      screen.queryByText(/cart|checkout|payment|book now|online ordering/i)
    ).not.toBeInTheDocument();
  });

  it("shows recovery guidance when a safe selected listing is unavailable", async () => {
    render(
      await QuotePage({
        searchParams: Promise.resolve({ listing: "missing-listing" })
      })
    );

    expect(
      screen.queryByRole("heading", { name: /enquiry for/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /review the request context/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText("missing-listing")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /add rental items/i })
    ).toHaveAttribute("href", "/catalogue");
    expect(
      screen.getByRole("link", { name: /add setups/i })
    ).toHaveAttribute("href", "/listings");
    expect(screen.getByLabelText(/requested listings or items/i)).toHaveValue(
      "Listing reference: missing-listing"
    );
    expect(screen.queryByText(/rental assistant/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/manual team follow-up/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/cart|checkout|payment|book now|online ordering/i)
    ).not.toBeInTheDocument();
  });
});
