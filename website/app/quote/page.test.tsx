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
      screen.getByRole("heading", { name: /request quote/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /selected listing unavailable/i })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/selected listing reference/i).length
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(/listing reference: lounge-sofa-package starts this rental request/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/the listing link may be old or unavailable/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/review current rental listings or keep typing the requested items/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText("lounge-sofa-package", { selector: "dd" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/complete the required contact point first/i)
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


  it("renders the refreshed quote review flow in the required reading order", async () => {
    render(await QuotePage());

    const pageText = document.body.textContent ?? "";

    expect(screen.getByRole("heading", { name: /request quote/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /your selection/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /selected rental items/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /selected setups/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /quote request form/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /what happens next/i })).toBeInTheDocument();

    expect(pageText.indexOf("Request Quote")).toBeLessThan(pageText.indexOf("Your Selection"));
    expect(pageText.indexOf("Your Selection")).toBeLessThan(pageText.indexOf("Quote request form"));
    expect(pageText.indexOf("Quote request form")).toBeLessThan(pageText.indexOf("What happens next"));
    expect(document.body.textContent).not.toMatch(
      /cart|checkout|payment|order|purchase|booking|reservation|availability|stock|inventory|price|pricing|total|subtotal/i
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
      screen.getByText(/The listing link may be old or unavailable/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Review current rental listings or keep typing the requested items/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /review current rental listings/i })
    ).toHaveAttribute("href", "/listings");
    expect(
      screen.getByRole("link", { name: /start from the catalogue/i })
    ).toHaveAttribute("href", "/catalogue");
    expect(screen.getByLabelText(/requested listings or items/i)).toHaveValue(
      "Listing reference: missing-listing"
    );
    expect(screen.queryByText(/rental assistant/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/Use the catalogue, listing details, and event setup guidance/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/cart|checkout|payment|book now|online ordering/i)
    ).not.toBeInTheDocument();
  });
});
