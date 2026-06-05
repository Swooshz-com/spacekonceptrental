import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import QuoteRequestForm from "./QuoteRequestForm";

describe("QuoteRequestForm", () => {
  afterEach(() => {
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
    fireEvent.change(screen.getByLabelText(/email/i), {
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
    fireEvent.change(screen.getByLabelText(/message or notes/i), {
      target: {
        value: "Prefer a warm lounge setup for a corporate reception."
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
          eventDate: "2026-06-12",
          venue: "Marina Bay Sands",
          items: [
          {
            productName: "2 modular lounge sets",
            quantity: 1,
            notes: "Prefer a warm lounge setup for a corporate reception."
          }
        ]
      })
      })
    );
    expect(
      await screen.findByText(/quote request received/i)
    ).toBeInTheDocument();
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
