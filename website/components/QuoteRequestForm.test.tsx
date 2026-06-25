import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import QuoteRequestForm from "./QuoteRequestForm";

function getSubmittedPayload(fetchMock: ReturnType<typeof vi.fn>) {
  const request = (fetchMock.mock.calls as unknown as [
    string,
    RequestInit
  ][])[0][1];

  return JSON.parse(String(request.body));
}

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
          publicReference: "QR-20260527-ABC12345",
          requestId: "browser-safe-request-001"
        }),
        {
          headers: { "content-type": "application/json" },
          status: 201
        }
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    window.history.pushState(null, "", "/quote?listing=modular-lounge-set");

    render(<QuoteRequestForm initialListingSlug="modular-lounge-set" />);

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
    fireEvent.change(screen.getByLabelText(/requested listings or items/i), {
      target: { value: "2 modular lounge sets" }
    });
    fireEvent.change(screen.getByLabelText(/preferred contact method/i), {
      target: { value: "email" }
    });
    fireEvent.change(screen.getByLabelText(/event vision/i), {
      target: {
        value: "Prefer a warm lounge setup for a corporate reception."
      }
    });
    fireEvent.change(screen.getByLabelText(/item-specific notes/i), {
      target: {
        value: "Place sofas near the registration zone."
      }
    });
    fireEvent.click(screen.getByRole("button", { name: /submit enquiry/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/quote",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" }
      })
    );
    expect(getSubmittedPayload(fetchMock)).toEqual({
      customerName: "Maya Tan",
      customerEmail: "maya@example.test",
      customerPhone: "+65 8123 4567",
      customerMessage:
        "Preferred contact method: email\n\nPrefer a warm lounge setup for a corporate reception.",
      eventDate: "2026-06-12",
      venue: "Marina Bay Sands",
      sourcePath: "/quote?listing=modular-lounge-set",
      listingSlug: "modular-lounge-set",
      requestId: expect.any(String),
      items: [
        {
          productName: "2 modular lounge sets",
          quantity: 1,
          notes: "Place sofas near the registration zone."
        }
      ]
    });
    const receipt = await screen.findByRole("status");
    expect(receipt).toBeInTheDocument();
    expect(receipt).toBeInTheDocument();
    expect(
      within(receipt).getByRole("heading", { name: /enquiry received/i })
    ).toBeInTheDocument();
    expect(within(receipt).getByText(/QR-20260527-ABC12345/)).toBeInTheDocument();
    expect(within(receipt).getByText(/tailored proposal/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /return to home/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /explore more setups/i })).toHaveAttribute("href", "/listings");
    expect(screen.queryByRole("link", { name: /track|status/i })).not.toBeInTheDocument();
  });

  it("preserves a event vision when no item snapshots are provided", async () => {
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
    fireEvent.change(screen.getByLabelText(/event vision/i), {
      target: {
        value: "We need help deciding quantities for a reception setup."
      }
    });
    fireEvent.click(screen.getByRole("button", { name: /submit enquiry/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/quote",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" }
      })
    );
    expect(getSubmittedPayload(fetchMock)).toMatchObject({
      customerName: "Maya Tan",
      customerEmail: "maya@example.test",
      customerPhone: "",
      customerMessage:
        "We need help deciding quantities for a reception setup.",
      eventDate: "",
      venue: "",
      items: []
    });
    expect(getSubmittedPayload(fetchMock).requestId).toEqual(expect.any(String));
    expect(
      await screen.findByText(/enquiry received/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /track|status/i })).not.toBeInTheDocument();
  });

  it("shows the safe request id receipt fallback without exposing the internal quote id", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          status: "received",
          quoteRequestId: "70000000-0000-4000-8000-000000000001",
          requestId: "safe-public-request-123"
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
    fireEvent.click(screen.getByRole("button", { name: /submit enquiry/i }));

    const receipt = await screen.findByRole("status");

    expect(within(receipt).getByText(/safe-public-request-123/)).toBeInTheDocument();
    expect(receipt).not.toHaveTextContent(
      "70000000-0000-4000-8000-000000000001"
    );
    expect(screen.queryByRole("link", { name: /track|status/i })).not.toBeInTheDocument();
  });

  it("shows a generic submit failure without leaking server details", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          error: {
            reference: "quote-error-ref-123",
            message: "sql supabase stack token cookie provider secret"
          },
          requestId: "quote-error-ref-123"
        }),
        {
          headers: { "content-type": "application/json" },
          status: 500
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
    fireEvent.click(screen.getByRole("button", { name: /submit enquiry/i }));

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent(/quote request was not sent/i);
    expect(alert).toHaveTextContent(/review your details and try again/i);
    expect(alert).toHaveTextContent(/support reference: quote-error-ref-123/i);
    expect(alert).not.toHaveTextContent(/sql/i);
    expect(alert).not.toHaveTextContent(/supabase/i);
    expect(alert).not.toHaveTextContent(/stack/i);
    expect(alert).not.toHaveTextContent(/token/i);
    expect(alert).not.toHaveTextContent(/cookie/i);
    expect(alert).not.toHaveTextContent(/provider/i);
    expect(alert).not.toHaveTextContent(/secret/i);
  });

  it("shows legal links near the quote request data-handling flow", () => {
    render(<QuoteRequestForm />);

    expect(
      screen.getByRole("link", { name: /Privacy Policy/i })
    ).toHaveAttribute("href", "/privacy");
    expect(
      screen.getByRole("link", { name: /Terms of Use/i })
    ).toHaveAttribute("href", "/terms");
  });

  it("explains failed-submit recovery while preserving entered details and listing context", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          error: {
            message: "database unavailable for Maya Tan"
          }
        }),
        {
          headers: { "content-type": "application/json" },
          status: 503
        }
      );
    });

    vi.stubGlobal("fetch", fetchMock);
    window.history.pushState(null, "", "/quote?listing=modular-lounge-set");

    render(
      <QuoteRequestForm
        initialItemsText="Modular Lounge Set"
        initialListingSlug="modular-lounge-set"
      />
    );

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
      target: { value: "2026-07-18" }
    });
    fireEvent.change(screen.getByLabelText(/venue/i), {
      target: { value: "National Gallery Singapore" }
    });
    fireEvent.change(screen.getByLabelText(/requested listings or items/i), {
      target: { value: "Modular Lounge Set\n4 cocktail tables" }
    });
    fireEvent.change(screen.getByLabelText(/event vision/i), {
      target: {
        value: "Warm reception setup with alternates if the sofa colour changes."
      }
    });
    fireEvent.change(screen.getByLabelText(/item-specific notes/i), {
      target: {
        value: "Use the lounge set near the registration area."
      }
    });
    fireEvent.click(screen.getByRole("button", { name: /submit enquiry/i }));

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent(/quote request was not sent/i);
    expect(alert).toHaveTextContent(/review your details and try again/i);
    expect(alert).toHaveTextContent(/your entered details should still be here/i);
    expect(alert).not.toHaveTextContent(/database|maya tan/i);
    expect(screen.getByLabelText(/selected listing/i)).toHaveTextContent(
      /modular lounge set/i
    );
    expect(screen.getByLabelText(/name/i)).toHaveValue("Maya Tan");
    expect(screen.getByLabelText(/email address/i)).toHaveValue(
      "maya@example.test"
    );
    expect(screen.getByLabelText(/phone/i)).toHaveValue("+65 8123 4567");
    expect(screen.getByLabelText(/event date/i)).toHaveValue("2026-07-18");
    expect(screen.getByLabelText(/venue/i)).toHaveValue(
      "National Gallery Singapore"
    );
    expect(screen.getByLabelText(/requested listings or items/i)).toHaveValue(
      "Modular Lounge Set\n4 cocktail tables"
    );
    expect(screen.getByLabelText(/event vision/i)).toHaveValue(
      "Warm reception setup with alternates if the sofa colour changes."
    );
    expect(screen.getByLabelText(/item-specific notes/i)).toHaveValue(
      "Use the lounge set near the registration area."
    );
    expect(getSubmittedPayload(fetchMock)).toMatchObject({
      sourcePath: "/quote?listing=modular-lounge-set",
      listingSlug: "modular-lounge-set",
      items: [
        {
          productName: "Modular Lounge Set",
          quantity: 1,
          notes: "Use the lounge set near the registration area."
        },
        {
          productName: "4 cocktail tables",
          quantity: 1
        }
      ]
    });
  });

  it("shows inline required guidance and preserves entered rental details", async () => {
    const fetchMock = vi.fn();

    vi.stubGlobal("fetch", fetchMock);

    render(<QuoteRequestForm initialItemsText="Lounge sofa package" />);

    fireEvent.change(screen.getByLabelText(/venue/i), {
      target: { value: "National Gallery Singapore" }
    });
    fireEvent.change(screen.getByLabelText(/requested listings or items/i), {
      target: { value: "Lounge sofa package\n4 cocktail tables" }
    });
    fireEvent.change(screen.getByLabelText(/event vision/i), {
      target: {
        value: "Warm reception setup with alternates if the sofa colour changes."
      }
    });

    fireEvent.click(
      screen.getByRole("button", { name: /submit enquiry/i })
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /review the highlighted required fields/i
    );
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(
      screen.getByText(/email address or phone number is required/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    expect(screen.getByRole("textbox", { name: /^email address$/i }))
      .toHaveAttribute(
      "aria-invalid",
      "true"
    );
    expect(screen.getByRole("textbox", { name: /^phone number/i }))
      .toHaveAttribute(
      "aria-invalid",
      "true"
    );
    expect(screen.getByLabelText(/venue/i)).toHaveValue(
      "National Gallery Singapore"
    );
    expect(screen.getByLabelText(/requested listings or items/i)).toHaveValue(
      "Lounge sofa package\n4 cocktail tables"
    );
    expect(screen.getByLabelText(/event vision/i)).toHaveValue(
      "Warm reception setup with alternates if the sofa colour changes."
    );
  });

  it("uses a clear submitting state and prevents duplicate submits", async () => {
    let resolveSubmit: ((value: Response) => void) | undefined;
    const submitPromise = new Promise<Response>((resolve) => {
      resolveSubmit = resolve;
    });
    const fetchMock = vi.fn().mockReturnValue(submitPromise);

    vi.stubGlobal("fetch", fetchMock);

    render(<QuoteRequestForm />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Maya Tan" }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "maya@example.test" }
    });
    fireEvent.click(
      screen.getByRole("button", { name: /submit enquiry/i })
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /sending enquiry/i })
      ).toBeDisabled();
    });
    fireEvent.click(
      screen.getByRole("button", { name: /sending enquiry/i })
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveSubmit?.(
      new Response(
        JSON.stringify({
          status: "received",
          quoteRequestId: "70000000-0000-4000-8000-000000000001",
          publicReference: "QR-20260527-ABC12345"
        }),
        {
          headers: { "content-type": "application/json" },
          status: 201
        }
      )
    );

    expect(await screen.findByText(/enquiry received/i)).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("button", { name: /submit enquiry/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    expect(getSubmittedPayload(fetchMock)).toMatchObject({
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
    });
    expect(getSubmittedPayload(fetchMock).requestId).toEqual(expect.any(String));
    expect(
      await screen.findByText(/enquiry received/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /track|status/i })).not.toBeInTheDocument();
  });

  it("explains editable listing context and submits adjusted requested items for admin triage", async () => {
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
    window.history.pushState(null, "", "/quote?listing=modular-lounge-set");

    render(
      <QuoteRequestForm
        initialItemsText="Modular Lounge Set"
        initialListingSlug="modular-lounge-set"
      />
    );

    const selectedListing = screen.getByLabelText(/selected listing/i);

    expect(selectedListing).toHaveTextContent(
      /keep this listing, change it, or add more rental items before sending/i
    );
    expect(selectedListing).toHaveTextContent(
      /add quantities in the requested listings box or item notes/i
    );
    expect(
      screen.getByText(/the team will use the requested listing\/item context for manual follow-up/i)
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Maya Tan" }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "maya@example.test" }
    });
    fireEvent.change(screen.getByLabelText(/event date/i), {
      target: { value: "2026-07-18" }
    });
    fireEvent.change(screen.getByLabelText(/venue/i), {
      target: { value: "National Gallery Singapore" }
    });
    fireEvent.change(screen.getByLabelText(/requested listings or items/i), {
      target: {
        value: "Modular Lounge Set - 2 sets\nCocktail tables - 4 pieces"
      }
    });
    fireEvent.change(screen.getByLabelText(/item-specific notes/i), {
      target: {
        value: "Need rental period guidance for a same-day event setup."
      }
    });
    fireEvent.click(screen.getByRole("button", { name: /submit enquiry/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    expect(getSubmittedPayload(fetchMock)).toMatchObject({
      customerName: "Maya Tan",
      customerEmail: "maya@example.test",
      eventDate: "2026-07-18",
      venue: "National Gallery Singapore",
      sourcePath: "/quote?listing=modular-lounge-set",
      listingSlug: "modular-lounge-set",
      items: [
        {
          productName: "Modular Lounge Set - 2 sets",
          quantity: 1,
          notes: "Need rental period guidance for a same-day event setup."
        },
        {
          productName: "Cocktail tables - 4 pieces",
          quantity: 1
        }
      ]
    });

    const receipt = await screen.findByRole("status");

    expect(receipt).toHaveTextContent(/tailored proposal/i);
    expect(document.body.textContent).not.toMatch(
      /cart|checkout|order|payment|purchase|booking|reservation|fulfilment|fulfillment|stock reservation|customer account|dashboard/i
    );
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
    fireEvent.change(screen.getByLabelText(/requested listings or items/i), {
      target: {
        value: "  20 stools  \n\n4 cocktail tables\r\n   \nModular lounge setup  "
      }
    });
    fireEvent.change(screen.getByLabelText(/item-specific notes/i), {
      target: {
        value: "Place priority items near the reception zone."
      }
    });
    fireEvent.click(screen.getByRole("button", { name: /submit enquiry/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    expect(getSubmittedPayload(fetchMock)).toMatchObject({
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
    });
    expect(getSubmittedPayload(fetchMock).requestId).toEqual(expect.any(String));
  });

  it("keeps preferred contact prefix within the server event vision limit", async () => {
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

    const messageInput = screen.getByLabelText(
      /event vision/i
    ) as HTMLTextAreaElement;
    const preferredContactPrefix =
      "Preferred contact method: either email or phone\n\n";
    const allowedMessageLength = 1200 - preferredContactPrefix.length;

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Maya Tan" }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "maya@example.test" }
    });
    fireEvent.change(messageInput, {
      target: { value: "x".repeat(1200) }
    });
    fireEvent.change(screen.getByLabelText(/preferred contact method/i), {
      target: { value: "either email or phone" }
    });

    expect(messageInput.maxLength).toBe(allowedMessageLength);
    expect(messageInput.value).toHaveLength(allowedMessageLength);

    fireEvent.click(screen.getByRole("button", { name: /submit enquiry/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const request = (fetchMock.mock.calls as unknown as [
      string,
      RequestInit
    ][])[0][1];
    const payload = JSON.parse(String(request.body));

    expect(payload.customerMessage).toBe(
      `${preferredContactPrefix}${"x".repeat(allowedMessageLength)}`
    );
    expect(payload.customerMessage).toHaveLength(1200);
    expect(
      await screen.findByText(/enquiry received/i)
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

  it("omits unsafe browser source metadata before submitting", async () => {
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
    window.history.pushState(null, "", "/quote?listing=modular-lounge-set");

    render(<QuoteRequestForm initialListingSlug="../admin" />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Maya Tan" }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "maya@example.test" }
    });
    fireEvent.click(screen.getByRole("button", { name: /submit enquiry/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const request = (fetchMock.mock.calls as unknown as [
      string,
      RequestInit
    ][])[0][1];
    const payload = JSON.parse(String(request.body));

    expect(payload.sourcePath).toBe("/quote?listing=modular-lounge-set");
    expect(payload.listingSlug).toBeUndefined();
    expect(payload.requestId).toEqual(expect.any(String));
    expect(payload.requestId.split("-")).toHaveLength(5);
  });
});
