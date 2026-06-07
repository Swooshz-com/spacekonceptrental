import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import QuoteRequestForm from "./QuoteRequestForm";

describe("QuoteRequestForm", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("posts browser quote requests only to the first-party API route", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          status: "received",
          quoteRequestId: "70000000-0000-4000-8000-000000000001",
          publicReference: "QR-20260527-ABC12345"
        }),
        {
          headers: { "content-type": "application/json" },
          status: 201
        }
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<QuoteRequestForm />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Maya Tan" }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "maya@example.test" }
    });
    fireEvent.change(screen.getByLabelText(/phone/i), {
      target: { value: "+65 8123 4567" }
    });
    fireEvent.change(screen.getByLabelText(/event date/i), {
      target: { value: "2026-06-12" }
    });
    fireEvent.change(screen.getByLabelText(/venue/i), {
      target: { value: "Marina Bay Sands" }
    });
    fireEvent.change(screen.getByLabelText(/items needed/i), {
      target: { value: "2 modular lounge sets" }
    });
    fireEvent.change(screen.getByLabelText(/customer message/i), {
      target: {
        value: "Prefer a warm lounge setup for a corporate reception."
      }
    });
    fireEvent.change(screen.getByLabelText(/item-specific notes/i), {
      target: {
        value: "Place sofas near the registration zone."
      }
    });
    fireEvent.click(screen.getByRole("button", { name: /send quote request/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/quote",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customerName: "Maya Tan",
          customerEmail: "maya@example.test",
          customerPhone: "+65 8123 4567",
          customerMessage:
            "Prefer a warm lounge setup for a corporate reception.",
          eventDate: "2026-06-12",
          venue: "Marina Bay Sands",
          items: [
            {
              productName: "2 modular lounge sets",
              quantity: 1,
              notes: "Place sofas near the registration zone."
            }
          ]
        })
      })
    );
    expect(
      await screen.findByText(/quote request received/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /track|status/i })).not.toBeInTheDocument();
  });

  it("preserves a customer message when no item snapshots are provided", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          status: "received",
          quoteRequestId: "70000000-0000-4000-8000-000000000001",
          publicReference: "QR-20260527-ABC12345"
        }),
        {
          headers: { "content-type": "application/json" },
          status: 201
        }
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<QuoteRequestForm />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Maya Tan" }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "maya@example.test" }
    });
    fireEvent.change(screen.getByLabelText(/customer message/i), {
      target: {
        value: "We need help deciding quantities for a reception setup."
      }
    });
    fireEvent.click(screen.getByRole("button", { name: /send quote request/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/quote",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customerName: "Maya Tan",
          customerEmail: "maya@example.test",
          customerPhone: "",
          customerMessage:
            "We need help deciding quantities for a reception setup.",
          eventDate: "",
          venue: "",
          items: []
        })
      })
    );
    expect(
      await screen.findByText(/quote request received/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /track|status/i })).not.toBeInTheDocument();
  });

  it("submits a selected listing as one quote item and keeps success receipt-only", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          status: "received",
          quoteRequestId: "70000000-0000-4000-8000-000000000001",
          publicReference: "QR-20260527-ABC12345"
        }),
        {
          headers: { "content-type": "application/json" },
          status: 201
        }
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<QuoteRequestForm initialItemsText="Modular Lounge Set" />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Maya Tan" }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "maya@example.test" }
    });
    fireEvent.click(screen.getByRole("button", { name: /send quote request/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/quote",
      expect.objectContaining({
        body: JSON.stringify({
          customerName: "Maya Tan",
          customerEmail: "maya@example.test",
          customerPhone: "",
          eventDate: "",
          venue: "",
          items: [
            {
              productName: "Modular Lounge Set",
              quantity: 1
            }
          ]
        })
      })
    );
    expect(
      await screen.findByText(/quote request received/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /track|status/i })).not.toBeInTheDocument();
  });

  it("splits requested item lines, trims them, and ignores blanks", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          status: "received",
          quoteRequestId: "70000000-0000-4000-8000-000000000001",
          publicReference: "QR-20260527-ABC12345"
        }),
        {
          headers: { "content-type": "application/json" },
          status: 201
        }
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<QuoteRequestForm />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Maya Tan" }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "maya@example.test" }
    });
    fireEvent.change(screen.getByLabelText(/items needed/i), {
      target: {
        value:
          "  20 stools  \n\n4 cocktail tables\r\n   \nModular lounge setup  "
      }
    });
    fireEvent.change(screen.getByLabelText(/item-specific notes/i), {
      target: {
        value: "Place priority items near the reception zone."
      }
    });
    fireEvent.click(screen.getByRole("button", { name: /send quote request/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/quote",
      expect.objectContaining({
        body: JSON.stringify({
          customerName: "Maya Tan",
          customerEmail: "maya@example.test",
          customerPhone: "",
          eventDate: "",
          venue: "",
          items: [
            {
              productName: "20 stools",
              quantity: 1,
              notes: "Place priority items near the reception zone."
            },
            {
              productName: "4 cocktail tables",
              quantity: 1
            },
            {
              productName: "Modular lounge setup",
              quantity: 1
            }
          ]
        })
      })
    );
  });

  it("does not import Supabase or server-only quote persistence in browser-facing code", () => {
    const source = readFileSync(
      resolve(process.cwd(), "components/QuoteRequestForm.tsx"),
      "utf8"
    );

    expect(source).not.toContain("@supabase/");
    expect(source).not.toContain("lib/supabase");
    expect(source).not.toContain("createServerSupabaseClient");
    expect(source).not.toContain("SUPABASE_URL");
    expect(source).not.toContain("SUPABASE_ANON_KEY");
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
  });
});
