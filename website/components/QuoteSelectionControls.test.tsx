import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  QuoteSelectionBadge,
  QuoteSelectionButton,
  QuoteSelectionIndicator,
  QuoteSelectionSummary
} from "./QuoteSelectionControls";

describe("QuoteSelectionControls", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("adds quote selections without navigating and updates the request quote count", () => {
    render(
      <>
        <QuoteSelectionIndicator />
        <QuoteSelectionButton
          item={{
            slug: "aura-lounge-chair",
            name: "Aura Lounge Chair",
            category: "Seating",
            imageSrc: "/images/aura-lounge-chair.jpg",
            quantity: 1
          }}
        />
      </>
    );

    expect(screen.getByLabelText("0 selected")).toBeInTheDocument();
    const increaseButton = screen.getByRole("button", {
      name: /increase aura lounge chair quantity/i
    });
    const decreaseButton = screen.getByRole("button", {
      name: /decrease aura lounge chair quantity/i
    });
    const quantityValue = screen.getByLabelText(/aura lounge chair quantity selected/i);

    expect(quantityValue).toHaveTextContent("Qty 0");
    expect(decreaseButton).toBeDisabled();

    fireEvent.click(increaseButton);

    expect(quantityValue).toHaveTextContent("Qty 1");
    expect(screen.getByLabelText("1 selected")).toBeInTheDocument();

    fireEvent.click(increaseButton);

    expect(quantityValue).toHaveTextContent("Qty 2");
    expect(screen.getByLabelText("2 selected")).toBeInTheDocument();
    expect(window.localStorage.getItem("skr.quoteSelection.v1")).toContain(
      "aura-lounge-chair"
    );
    expect(window.localStorage.getItem("skr.quoteSelection.v1")).toContain(
      "/images/aura-lounge-chair.jpg"
    );

    fireEvent.click(decreaseButton);

    expect(quantityValue).toHaveTextContent("Qty 1");
    expect(screen.getByLabelText("1 selected")).toBeInTheDocument();

    fireEvent.click(decreaseButton);

    expect(quantityValue).toHaveTextContent("Qty 0");
    expect(decreaseButton).toBeDisabled();
    expect(screen.getByLabelText("0 selected")).toBeInTheDocument();
    expect(window.localStorage.getItem("skr.quoteSelection.v1")).toBe("[]");
  });

  it("renders stored selections in the quote page selection summary", () => {
    window.localStorage.setItem(
      "skr.quoteSelection.v1",
      JSON.stringify([
        {
          slug: "aura-lounge-chair",
          name: "Aura Lounge Chair",
          category: "Seating",
          imageSrc: "/images/aura-lounge-chair.jpg",
          quantity: 2
        }
      ])
    );

    render(<QuoteSelectionSummary />);

    expect(screen.getByText("Selected Rental Items")).toBeInTheDocument();
    expect(screen.getByText("Aura Lounge Chair")).toBeInTheDocument();
    expect(screen.getByText("Qty: 2")).toBeInTheDocument();
    expect(screen.getByText("Seating")).toBeInTheDocument();
    expect(screen.getByAltText("Aura Lounge Chair thumbnail")).toHaveAttribute(
      "src",
      "/images/aura-lounge-chair.jpg"
    );
    expect(screen.getByRole("link", { name: /details/i })).toHaveAttribute(
      "href",
      "/catalogue/aura-lounge-chair"
    );
  });

  it("shows a selected quantity badge for selected listing cards", () => {
    window.localStorage.setItem(
      "skr.quoteSelection.v1",
      JSON.stringify([
        {
          slug: "kinetic-dining-table",
          name: "Kinetic Dining Table",
          category: "Tables",
          quantity: 5
        }
      ])
    );

    render(
      <QuoteSelectionBadge
        item={{
          slug: "kinetic-dining-table",
          name: "Kinetic Dining Table",
          category: "Tables",
          quantity: 1
        }}
      />
    );

    expect(screen.getByLabelText("Kinetic Dining Table: 5 selected")).toHaveTextContent(
      "Qty 5"
    );
  });
});
