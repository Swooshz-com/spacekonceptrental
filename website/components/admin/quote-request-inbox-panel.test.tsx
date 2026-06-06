import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { QuoteRequestInboxPanel } from "./quote-request-inbox-panel";

const quoteRequest = {
  id: "22222222-2222-4222-8222-222222222222",
  publicReference: "QR-20260603-NEWEST",
  customerName: "Maya Tan",
  customerEmail: "maya@example.test",
  customerPhone: "+65 8123 4567",
  customerMessage:
    "Please recommend a warm lounge setup for a corporate reception.",
  eventDate: "2026-06-20",
  venue: "Marina Bay Sands",
  status: "new" as const,
  source: "website" as const,
  createdAt: "2026-06-03T10:30:00.000Z",
  items: [
    {
      id: "33333333-3333-4333-8333-333333333333",
      quoteRequestId: "22222222-2222-4222-8222-222222222222",
      productNameSnapshot: "Modular lounge set",
      quantity: 2,
      notes: "VIP reception area",
      createdAt: "2026-06-03T10:31:00.000Z"
    }
  ],
  activity: [
    {
      id: "44444444-4444-4444-8444-444444444444",
      quoteRequestId: "22222222-2222-4222-8222-222222222222",
      activityType: "internal_note" as const,
      note: "Call Maya about sofa quantities.",
      createdAt: "2026-06-03T10:40:00.000Z"
    },
    {
      id: "55555555-5555-4555-8555-555555555555",
      quoteRequestId: "22222222-2222-4222-8222-222222222222",
      activityType: "status_change" as const,
      statusFrom: "new" as const,
      statusTo: "reviewing" as const,
      createdAt: "2026-06-03T10:35:00.000Z"
    }
  ]
};

function loadedInbox() {
  return {
    status: "loaded" as const,
    data: {
      quoteRequests: [quoteRequest]
    }
  };
}

function createJsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    },
    ...init
  });
}

describe("QuoteRequestInboxPanel", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders internal quote status controls for authorised inbox data", () => {
    render(<QuoteRequestInboxPanel inbox={loadedInbox()} />);

    expect(
      screen.getByRole("heading", { name: /quote request inbox/i })
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/internal status for QR-20260603-NEWEST/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /save follow-up for QR-20260603-NEWEST/i
      })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/internal note for QR-20260603-NEWEST/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /customer message/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/please recommend a warm lounge setup/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /requested items/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /admin-only internal activity/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/call maya about sofa quantities/i)).toBeInTheDocument();
    expect(screen.getByText(/status changed from new to reviewing/i)).toBeInTheDocument();
    expect(
      screen.getByText(/internal follow-up status only/i)
    ).toBeInTheDocument();
  });

  it("requests quote.write proof and sends status update POST with x-csrf-proof", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          csrfProof: "proof-secret"
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          record: {
            id: quoteRequest.id,
            type: "quoteRequest"
          }
        })
      );
    const onMutationComplete = vi.fn();

    render(
      <QuoteRequestInboxPanel
        fetcher={fetcher}
        inbox={loadedInbox()}
        onMutationComplete={onMutationComplete}
      />
    );

    fireEvent.change(
      screen.getByLabelText(/internal status for QR-20260603-NEWEST/i),
      {
        target: {
          value: "quoted"
        }
      }
    );
    fireEvent.change(
      screen.getByLabelText(/internal note for QR-20260603-NEWEST/i),
      {
        target: {
          value: "Call Maya about sofa quantities."
        }
      }
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: /save follow-up for QR-20260603-NEWEST/i
      })
    );

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    expect(fetcher).toHaveBeenNthCalledWith(1, "/api/admin/csrf-proof", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        requestedOperation: "quote.write",
        operation: "quote.write"
      })
    });
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      `/api/admin/quote-requests/${encodeURIComponent(quoteRequest.id)}/status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-proof": "proof-secret"
        },
        body: JSON.stringify({
          status: "quoted",
          internalNote: "Call Maya about sofa quantities."
        })
      }
    );
    expect(onMutationComplete).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText(/quote status updated. refreshing dashboard/i)
    ).toBeInTheDocument();
  });

  it("shows generic errors without provider details when proof or status update fails", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(
      createJsonResponse(
        {
          ok: false,
          error: "sql supabase stack token cookie workspace-secret"
        },
        {
          status: 403
        }
      )
    );

    render(<QuoteRequestInboxPanel fetcher={fetcher} inbox={loadedInbox()} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /save follow-up for QR-20260603-NEWEST/i
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/quote status could not be saved/i)
      ).toBeInTheDocument();
    });

    expect(screen.queryByText(/sql/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/supabase/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/stack/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/token/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/cookie/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/workspace-secret/i)).not.toBeInTheDocument();
  });

  it("does not render status controls for unavailable or empty inbox states", () => {
    const unavailable = render(
      <QuoteRequestInboxPanel inbox={{ status: "unavailable" }} />
    );

    expect(
      screen.queryByRole("button", { name: /save status/i })
    ).not.toBeInTheDocument();
    unavailable.unmount();

    render(
      <QuoteRequestInboxPanel
        inbox={{
          status: "loaded",
          data: {
            quoteRequests: []
          }
        }}
      />
    );

    expect(
      screen.queryByRole("button", { name: /save status/i })
    ).not.toBeInTheDocument();
  });

  it("does not imply ecommerce or customer-facing quote tracking", () => {
    render(<QuoteRequestInboxPanel inbox={loadedInbox()} />);

    expect(
      screen.queryByText(
        /cart|checkout|payment|customer account|stock reservation|order fulfilment|confirmed booking|online ordering|customer-facing quote status|quote tracking/i
      )
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /notify|email|send|crm|checkout|payment|book|reserve/i
      })
    ).not.toBeInTheDocument();
  });
});
