import { describe, expect, it, vi } from "vitest";

import {
  buildQuoteEnquiryHandoffPayload,
  resolveQuoteEnquiryEmailConfigStatus,
  sendQuoteEnquiryEmailHandoff
} from "./email-handoff";
import type { QuoteSubmission } from "./types";

const quote: QuoteSubmission = {
  customerName: "Maya Tan",
  customerEmail: "maya@example.test",
  customerPhone: "+65 8123 4567",
  customerMessage:
    "Please recommend a warm lounge setup for a corporate reception.",
  eventDate: "2026-06-12",
  venue: "Marina Bay Sands",
  sourcePath:
    "/quote?listing=modular-lounge-set&callback=https://bad.example/cb?token=SECRET",
  listingSlug: "modular-lounge-set",
  requestId: "visitor-submission-20260612-001",
  items: [
    {
      productName: "Modular lounge set",
      quantity: 2,
      notes: "VIP reception area"
    },
    {
      productName: "Cocktail table",
      quantity: 4
    }
  ]
};

const baseInput = {
  quote,
  quoteRequestId: "70000000-0000-4000-8000-000000000001",
  publicReference: "QR-20260612-ABC12345",
  requestId: "route-request-1"
};

const configuredEnv = {
  N8N_ENQUIRY_HANDOFF_WEBHOOK_URL: "https://example.invalid/n8n/enquiry",
  N8N_ENQUIRY_HANDOFF_SHARED_SECRET: "test-n8n-shared-secret",
  N8N_ENQUIRY_HANDOFF_TIMEOUT_MS: "5000"
};

describe("quote enquiry n8n handoff", () => {
  it("returns admin-facing config status without webhook or secret values", () => {
    const status = resolveQuoteEnquiryEmailConfigStatus(configuredEnv);
    const serialized = JSON.stringify(status);

    expect(status).toEqual({
      provider: "n8n",
      handoffMode: "n8n",
      handoffConfigured: true,
      webhookConfigured: true,
      sharedSecretConfigured: true,
      timeoutMs: 5000
    });
    expect(serialized).not.toContain(
      configuredEnv.N8N_ENQUIRY_HANDOFF_WEBHOOK_URL
    );
    expect(serialized).not.toContain(
      configuredEnv.N8N_ENQUIRY_HANDOFF_SHARED_SECRET
    );
    expect(serialized).not.toContain("N8N_ENQUIRY_HANDOFF_SHARED_SECRET");
  });

  it("builds the safe n8n payload with stable enquiry idempotency", () => {
    const payload = buildQuoteEnquiryHandoffPayload(
      baseInput,
      new Date("2026-06-12T09:30:00.000Z")
    );
    const serialized = JSON.stringify(payload);

    expect(payload).toEqual({
      schemaVersion: 1,
      event: "skr.enquiry.submitted",
      idempotencyKey:
        "quote-enquiry:70000000-0000-4000-8000-000000000001",
      submittedAt: "2026-06-12T09:30:00.000Z",
      enquiry: {
        id: "70000000-0000-4000-8000-000000000001",
        publicReference: "QR-20260612-ABC12345",
        source: "website",
        sourcePath: "/quote",
        listingSlug: "modular-lounge-set"
      },
      contact: {
        name: "Maya Tan",
        email: "maya@example.test",
        phone: "+65 8123 4567"
      },
      eventContext: {
        date: "2026-06-12",
        venue: "Marina Bay Sands",
        message:
          "Please recommend a warm lounge setup for a corporate reception."
      },
      requestedItems: [
        {
          name: "Modular lounge set",
          quantity: 2,
          notes: "VIP reception area"
        },
        {
          name: "Cocktail table",
          quantity: 4
        }
      ],
      request: {
        requestId: "route-request-1",
        visitorSubmissionRequestId: "visitor-submission-20260612-001"
      }
    });
    expect(serialized).not.toContain("callback=");
    expect(serialized).not.toContain("SECRET");
    expect(serialized).not.toContain("Cookie");
    expect(serialized).not.toContain("SUPABASE");
  });

  it("triggers n8n server-side and records a delivered handoff attempt", async () => {
    const fetchMock = vi.fn(
      async (_input: string | URL | Request, _init?: RequestInit) =>
        new Response(null, { status: 200 })
    );
    const deliveryLog = vi.fn(async () => ({ ok: true as const }));

    const result = await sendQuoteEnquiryEmailHandoff(baseInput, {
      deliveryLog,
      env: configuredEnv,
      fetch: fetchMock,
      now: () => new Date("2026-06-12T09:30:00.000Z")
    });

    expect(result).toEqual({
      ok: true,
      status: "delivered",
      provider: "n8n",
      idempotencyKey:
        "quote-enquiry:70000000-0000-4000-8000-000000000001"
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.invalid/n8n/enquiry",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "content-type": "application/json",
          "x-skr-event": "skr.enquiry.submitted",
          "x-skr-enquiry-reference": "QR-20260612-ABC12345",
          "x-skr-idempotency-key":
            "quote-enquiry:70000000-0000-4000-8000-000000000001",
          "x-skr-signature": expect.stringMatching(/^sha256=[a-f0-9]{64}$/),
          "x-skr-timestamp": "2026-06-12T09:30:00.000Z"
        })
      })
    );
    const firstFetchInit = fetchMock.mock.calls[0]?.[1] as
      | RequestInit
      | undefined;
    const body = JSON.parse(String(firstFetchInit?.body));

    expect(body.idempotencyKey).toBe(
      "quote-enquiry:70000000-0000-4000-8000-000000000001"
    );
    expect(deliveryLog).toHaveBeenCalledWith({
      quoteRequestId: "70000000-0000-4000-8000-000000000001",
      publicReference: "QR-20260612-ABC12345",
      recipientEmail: null,
      provider: "n8n",
      status: "delivered",
      errorCode: null,
      requestId: "route-request-1"
    });
    expect(JSON.stringify(deliveryLog.mock.calls)).not.toContain(
      configuredEnv.N8N_ENQUIRY_HANDOFF_SHARED_SECRET
    );
  });

  it("records accepted n8n responses as pending without faking final delivery", async () => {
    const fetchMock = vi.fn(
      async (_input: string | URL | Request, _init?: RequestInit) =>
        new Response(null, { status: 202 })
    );
    const deliveryLog = vi.fn(async () => ({ ok: true as const }));

    const result = await sendQuoteEnquiryEmailHandoff(baseInput, {
      deliveryLog,
      env: configuredEnv,
      fetch: fetchMock,
      now: () => new Date("2026-06-12T09:30:00.000Z")
    });

    expect(result).toEqual({
      ok: true,
      status: "pending",
      provider: "n8n",
      idempotencyKey:
        "quote-enquiry:70000000-0000-4000-8000-000000000001"
    });
    expect(deliveryLog).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "n8n",
        status: "pending",
        errorCode: null
      })
    );
  });

  it("does not fake success when the n8n handoff is not configured", async () => {
    const fetchMock = vi.fn();
    const deliveryLog = vi.fn(async () => ({ ok: true as const }));

    const result = await sendQuoteEnquiryEmailHandoff(baseInput, {
      deliveryLog,
      env: {},
      fetch: fetchMock
    });

    expect(result).toEqual({
      ok: false,
      status: "not_configured",
      provider: "n8n",
      code: "n8n_webhook_not_configured",
      idempotencyKey:
        "quote-enquiry:70000000-0000-4000-8000-000000000001"
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(deliveryLog).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: null,
        provider: "n8n",
        status: "not_configured",
        errorCode: "n8n_webhook_not_configured"
      })
    );
  });

  it("records safe failure categories without exposing raw n8n payloads", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response("401 SECRET raw n8n body", {
          status: 401
        })
    );
    const deliveryLog = vi.fn(async () => ({ ok: true as const }));

    const result = await sendQuoteEnquiryEmailHandoff(baseInput, {
      deliveryLog,
      env: configuredEnv,
      fetch: fetchMock
    });

    expect(result).toEqual({
      ok: false,
      status: "failed",
      provider: "n8n",
      code: "n8n_rejected",
      idempotencyKey:
        "quote-enquiry:70000000-0000-4000-8000-000000000001"
    });
    expect(JSON.stringify(result)).not.toContain("SECRET");
    expect(JSON.stringify(result)).not.toContain("raw n8n body");
    expect(deliveryLog).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        errorCode: "n8n_rejected"
      })
    );
    expect(JSON.stringify(deliveryLog.mock.calls)).not.toContain(
      "raw n8n body"
    );
  });
});
