import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import QuotePage from "./page";

const forbiddenPublicCopy =
  /cart|checkout|payment|book now|online ordering|customer account|dashboard|reservation|stock reservation|fulfilment|fulfillment|purchase/i;

describe("QuotePage", () => {
  afterEach(() => {
    cleanup();
    window.sessionStorage.clear();
  });

  it("renders a structured review-only quote draft when the catalogue is unavailable", async () => {
    render(await QuotePage());

    expect(
      screen.getByRole("heading", { name: /request a rental quote/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Catalogue unavailable right now")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /submission unavailable during review/i
      })
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(forbiddenPublicCopy);
  });

  it.each([
    { listing: "../draft-admin-listing", qty: "1" },
    { listing: "lounge-chair", qty: "0" },
    { listing: "lounge-chair", qty: "100" },
    { listing: "lounge-chair", qty: "1.5" },
    { listing: "lounge-chair", qty: "1e2" },
    { listing: "lounge-chair" }
  ])("rejects malformed or forged URL fallback %#", async (searchParams) => {
    render(await QuotePage({ searchParams: Promise.resolve(searchParams) }));

    expect(window.sessionStorage).toHaveLength(0);
    expect(
      screen.getByText("Catalogue unavailable right now")
    ).toBeInTheDocument();
  });

  it("does not turn discovery query parameters into selection rows", async () => {
    render(
      await QuotePage({
        searchParams: Promise.resolve({
          category: "seating",
          event: "gala",
          search: "chair"
        })
      })
    );

    expect(window.sessionStorage).toHaveLength(0);
    expect(screen.queryByText(/category interest|search interest/i)).not.toBeInTheDocument();
  });
});
