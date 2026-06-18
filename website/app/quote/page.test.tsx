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
      screen.getByRole("heading", { name: /request a rental quote/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /enquiry for lounge sofa package/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /selected rental listing: lounge sofa package/i
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/this listing starts the editable requested listings text/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/use this selected listing as a starting point/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/adjust quantities, alternates, event date or rental period notes, and venue details in the form/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/the selected listing starts the request, but you can edit quantities, alternates, and event notes before sending/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/complete the required contact point first/i)
    ).toBeInTheDocument();
    expect(screen.getAllByText("Lounge", { selector: "dd" }).length)
      .toBeGreaterThan(0);
    expect(screen.getAllByText("set", { selector: "dd" }).length)
      .toBeGreaterThan(0);
    expect(screen.getByLabelText(/requested listings or items/i)).toHaveValue(
      "Lounge sofa package"
    );
    const pageText = document.body.textContent ?? "";
    expect(pageText.indexOf("Selected rental listing: Lounge sofa package"))
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
});
