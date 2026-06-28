import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  QuoteSelectionButton,
  QuoteSelectionIndicator
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
            quantity: 1
          }}
        />
      </>
    );

    expect(screen.getByLabelText("0 selected")).toBeInTheDocument();
    const addLink = screen.getByRole("link", { name: /add to quote/i });

    fireEvent.click(addLink);

    expect(addLink).toHaveTextContent("Added (1)");
    expect(screen.getByLabelText("1 selected")).toBeInTheDocument();

    fireEvent.click(addLink);

    expect(addLink).toHaveTextContent("Added (2)");
    expect(screen.getByLabelText("2 selected")).toBeInTheDocument();
    expect(window.localStorage.getItem("skr.quoteSelection.v1")).toContain(
      "aura-lounge-chair"
    );
  });
});
