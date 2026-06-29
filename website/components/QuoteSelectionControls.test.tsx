import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  formatQuoteSelectionItems,
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

    const { container } = render(<QuoteSelectionSummary />);

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
    expect(container.querySelector(".stitch-selection-row__body")).toBeInTheDocument();
    expect(container.querySelector(".stitch-selection-row__main")).toBeInTheDocument();
    expect(container.querySelector(".stitch-selection-row__meta")).toBeInTheDocument();
  });

  it("separates setup directions from their included rental pieces", () => {
    window.localStorage.setItem(
      "skr.quoteSelection.v1",
      JSON.stringify([
        {
          slug: "botanical-wedding",
          name: "Botanical Wedding",
          category: "Setups",
          kind: "setup",
          imageSrc: "/images/botanical-wedding.jpg",
          quantity: 1
        },
        {
          slug: "aura-lounge-chair",
          name: "Aura Lounge Chair",
          category: "Seating",
          kind: "setup-included",
          imageSrc: "/images/aura-lounge-chair.jpg",
          quantity: 120,
          setupName: "Botanical Wedding",
          setupSlug: "botanical-wedding"
        }
      ])
    );

    render(<QuoteSelectionSummary />);

    expect(screen.queryByText("Selected Rental Items")).not.toBeInTheDocument();
    expect(screen.getByText("Setup Included Rental Pieces")).toBeInTheDocument();
    expect(screen.getByText("Selected Setup Directions")).toBeInTheDocument();
    expect(screen.getByText("Aura Lounge Chair")).toBeInTheDocument();
    expect(screen.getByText("Qty: 120")).toBeInTheDocument();
    expect(screen.getAllByText("Botanical Wedding").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /details/i })[0]).toHaveAttribute(
      "href",
      "/catalogue/aura-lounge-chair"
    );
  });

  it("lets quote page selection rows adjust item quantities", () => {
    window.localStorage.setItem(
      "skr.quoteSelection.v1",
      JSON.stringify([
        {
          slug: "slender-arch-floor-lamp",
          name: "Slender Arch Floor Lamp",
          category: "Lighting",
          kind: "rental",
          quantity: 3
        }
      ])
    );

    render(<QuoteSelectionSummary />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /decrease slender arch floor lamp quantity/i
      })
    );

    expect(screen.getByText("Qty: 2")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /increase slender arch floor lamp quantity/i
      })
    );

    expect(screen.getByText("Qty: 3")).toBeInTheDocument();
  });

  it("adjusts setup included selection rows one piece at a time", () => {
    window.localStorage.setItem(
      "skr.quoteSelection.v1",
      JSON.stringify([
        {
          slug: "botanical-wedding",
          name: "Botanical Wedding",
          category: "Setups",
          kind: "setup",
          quantity: 1
        },
        {
          slug: "aura-lounge-chair",
          name: "Aura Lounge Chair",
          category: "Seating",
          kind: "setup-included",
          quantity: 120,
          setupName: "Botanical Wedding",
          setupSlug: "botanical-wedding"
        }
      ])
    );

    render(<QuoteSelectionSummary />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /decrease aura lounge chair quantity/i
      })
    );

    expect(screen.getByText("Qty: 119")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /increase aura lounge chair quantity/i
      })
    );

    expect(screen.getByText("Qty: 120")).toBeInTheDocument();
  });

  it("formats setup selections separately from direct rental selections", () => {
    expect(
      formatQuoteSelectionItems([
        {
          slug: "aura-lounge-chair",
          name: "Aura Lounge Chair",
          category: "Seating",
          kind: "rental",
          quantity: 2
        },
        {
          slug: "kinetic-dining-table",
          name: "Kinetic Dining Table",
          category: "Tables",
          kind: "setup-included",
          quantity: 15,
          setupName: "Botanical Wedding",
          setupSlug: "botanical-wedding"
        },
        {
          slug: "botanical-wedding",
          name: "Botanical Wedding",
          category: "Setups",
          kind: "setup",
          quantity: 1
        }
      ])
    ).toBe(
      [
        "Selected rental items:",
        "Aura Lounge Chair x 2",
        "",
        "Setup included rental pieces:",
        "Kinetic Dining Table x 15",
        "",
        "Selected setup directions:",
        "Botanical Wedding"
      ].join("\n")
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

  it("refreshes stored selection thumbnails from listing cards", async () => {
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
          imageSrc: "/images/kinetic-dining-table.jpg",
          quantity: 1
        }}
      />
    );

    await waitFor(() =>
      expect(window.localStorage.getItem("skr.quoteSelection.v1")).toContain(
        "/images/kinetic-dining-table.jpg"
      )
    );

    cleanup();
    render(<QuoteSelectionSummary />);

    expect(await screen.findByAltText("Kinetic Dining Table thumbnail")).toHaveAttribute(
      "src",
      "/images/kinetic-dining-table.jpg"
    );
    expect(screen.getByText("Qty: 5")).toBeInTheDocument();
  });
});
