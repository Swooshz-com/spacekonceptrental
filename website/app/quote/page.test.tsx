import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import QuotePage from "./page";

const forbiddenPublicCopy =
  /cart|checkout|payment|book now|online ordering|customer account|dashboard|booking|reservation|stock|inventory|total|subtotal|fulfilment|fulfillment|purchase/i;

describe("QuotePage", () => {
  afterEach(() => {
    cleanup();
  });

  it("preserves validated public listing context as an enquiry starting point", async () => {
    const { container } = render(
      await QuotePage({
        searchParams: Promise.resolve({ listing: "lounge-sofa-package" })
      })
    );

    expect(screen.getByRole("heading", { name: /request a furniture rental quote/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /your selection/i })).toBeInTheDocument();
    expect(screen.getAllByText(/selected listing reference/i).length).toBeGreaterThan(0);
    expect(screen.getByText("lounge-sofa-package", { selector: "dd" })).toBeInTheDocument();
    expect(screen.getByText(/listing context is a starting point only/i)).toBeInTheDocument();
    expect(screen.getAllByText(/listing reference: lounge-sofa-package/i).length).toBeGreaterThan(0);
    expect(container.querySelector<HTMLInputElement>('input[name="items"]')).toHaveValue(
      "Listing reference: lounge-sofa-package"
    );
    expect(screen.queryByLabelText(/requested listings or items/i)).not.toBeInTheDocument();
    expect(screen.getByText(/use this guided enquiry to share selected rental items/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(forbiddenPublicCopy);
  });

  it("ignores unsafe or unknown listing context without changing the quote route contract", async () => {
    const { container } = render(
      await QuotePage({
        searchParams: Promise.resolve({ listing: "../draft-admin-listing" })
      })
    );

    expect(screen.queryByRole("heading", { name: /enquiry for/i })).not.toBeInTheDocument();
    expect(container.querySelector<HTMLInputElement>('input[name="items"]')).toHaveValue("");
    expect(screen.queryByLabelText(/requested listings or items/i)).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(forbiddenPublicCopy);
  });

  it("shows request-only recovery when a safe selected listing is unavailable", async () => {
    const { container } = render(
      await QuotePage({
        searchParams: Promise.resolve({ listing: "missing-listing" })
      })
    );

    expect(screen.queryByRole("heading", { name: /enquiry for/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /your selection/i })).toBeInTheDocument();
    expect(screen.getByText("missing-listing", { selector: "dd" })).toBeInTheDocument();
    expect(screen.getByText(/listing context is a starting point only/i)).toBeInTheDocument();
    expect(screen.getAllByText(/listing reference: missing-listing/i).length).toBeGreaterThan(0);
    expect(container.querySelector<HTMLInputElement>('input[name="items"]')).toHaveValue(
      "Listing reference: missing-listing"
    );
    expect(screen.queryByLabelText(/requested listings or items/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/rental assistant/i)).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(forbiddenPublicCopy);
  });
});
