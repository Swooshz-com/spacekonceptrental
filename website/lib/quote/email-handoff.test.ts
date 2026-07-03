import { describe, expect, it, vi } from "vitest";

import {
  resolveQuoteEnquiryEmailConfigStatus,
  sendQuoteEnquiryEmailHandoff
} from "./email-handoff";
import type { QuoteEmailProvider } from "./email-handoff";
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
  QUOTE_ENQUIRY_EMAIL_PROVIDER: "resend",
  QUOTE_ENQUIRY_EMAIL_RECIPIENT: " Events@SpaceKoncept.example ",
  QUOTE_ENQUIRY_EMAIL_FROM: "quotes@spacekoncept.example",
  RESEND_API_KEY: "test-resend-key"
};

describe("quote enquiry email handoff", () => {
  it("returns admin-facing config status without provider secrets", () => {
    const status = resolveQuoteEnquiryEmailConfigStatus(configuredEnv);
    const serialized = JSON.stringify(status);

    expect(status).toEqual({
      provider: "resend",
      providerConfigured: true,
      recipientConfigured: true,
      recipientEmail: "ev***@spacekoncept.example"
    });
    expect(serialized).not.toContain(configuredEnv.RESEND_API_KEY);
    expect(serialized).not.toContain("RESEND_API_KEY");
    expect(serialized).not.toContain("events@spacekoncept.example");
  });

  it("sends all required enquiry details and records a sent delivery log", async () => {
    const provider = vi.fn<QuoteEmailProvider>(async () => ({
      ok: true as const,
      providerMessageId: "resend-message-1"
    }));
    const deliveryLog = vi.fn(async () => ({ ok: true as const }));

    const result = await sendQuoteEnquiryEmailHandoff(baseInput, {
      deliveryLog,
      env: configuredEnv,
      now: () => new Date("2026-06-12T09:30:00.000Z"),
      provider
    });

    expect(result).toEqual({
      ok: true,
      status: "sent",
      provider: "resend",
      providerMessageId: "resend-message-1"
    });
    expect(provider).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "quotes@spacekoncept.example",
        to: "events@spacekoncept.example",
        subject: expect.stringContaining("QR-20260612-ABC12345")
      })
    );
    const firstMessage = provider.mock.calls[0]?.[0];

    expect(firstMessage).toBeDefined();
    if (!firstMessage) {
      throw new Error("Expected quote email provider to receive a message.");
    }
    const email = firstMessage.text;
    expect(email).toContain("Public reference: QR-20260612-ABC12345");
    expect(email).toContain("Submitted timestamp: 2026-06-12T09:30:00.000Z");
    expect(email).toContain("Customer name: Maya Tan");
    expect(email).toContain("Customer email: maya@example.test");
    expect(email).toContain("Customer phone: +65 8123 4567");
    expect(email).toContain("Event date: 2026-06-12");
    expect(email).toContain("Venue: Marina Bay Sands");
    expect(email).toContain(
      "Customer message: Please recommend a warm lounge setup for a corporate reception."
    );
    expect(email).toContain("Source path: /quote");
    expect(email).toContain("Listing slug: modular-lounge-set");
    expect(email).toContain(
      "1. Modular lounge set - quantity 2 - notes: VIP reception area"
    );
    expect(email).toContain("2. Cocktail table - quantity 4");
    expect(email).toContain(
      "Safe request/reference id: route-request-1 / 70000000-0000-4000-8000-000000000001"
    );
    expect(email).not.toContain("callback=");
    expect(email).not.toContain("SECRET");
    expect(email).not.toContain("Cookie");
    expect(email).not.toContain("SUPABASE");
    expect(deliveryLog).toHaveBeenCalledWith({
      quoteRequestId: "70000000-0000-4000-8000-000000000001",
      publicReference: "QR-20260612-ABC12345",
      recipientEmail: "events@spacekoncept.example",
      provider: "resend",
      status: "sent",
      providerMessageId: "resend-message-1",
      errorCode: null,
      requestId: "route-request-1"
    });
  });

  it("does not fake success when recipient or provider config is missing", async () => {
    const provider = vi.fn();
    const deliveryLog = vi.fn(async () => ({ ok: true as const }));

    const result = await sendQuoteEnquiryEmailHandoff(baseInput, {
      deliveryLog,
      env: {
        QUOTE_ENQUIRY_EMAIL_PROVIDER: "resend",
        QUOTE_ENQUIRY_EMAIL_FROM: "quotes@spacekoncept.example"
      },
      provider
    });

    expect(result).toEqual({
      ok: false,
      status: "not_configured",
      provider: "resend",
      code: "email_recipient_not_configured"
    });
    expect(provider).not.toHaveBeenCalled();
    expect(deliveryLog).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: null,
        provider: "resend",
        status: "not_configured",
        errorCode: "email_recipient_not_configured"
      })
    );
  });

  it("does not fake success when the provider send fails", async () => {
    const provider = vi.fn(async () => ({
      ok: false as const,
      code: "provider_rejected",
      unsafeDetails: "401 SECRET raw provider body"
    }));
    const deliveryLog = vi.fn(async () => ({ ok: true as const }));

    const result = await sendQuoteEnquiryEmailHandoff(baseInput, {
      deliveryLog,
      env: configuredEnv,
      provider
    });

    expect(result).toEqual({
      ok: false,
      status: "failed",
      provider: "resend",
      code: "provider_rejected"
    });
    expect(JSON.stringify(result)).not.toContain("SECRET");
    expect(deliveryLog).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        errorCode: "provider_rejected"
      })
    );
    expect(JSON.stringify(deliveryLog.mock.calls)).not.toContain("raw provider body");
  });
});
