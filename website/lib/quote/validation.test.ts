import { describe, expect, it } from "vitest";
import {
  normalizeCrmSyncError,
  prepareQuoteForPersistence,
  validateQuoteSubmission
} from "./validation";

const validPayload = {
  requestId: "visitor-submission-20260612-001",
  customerName: "Maya Tan",
  customerEmail: "maya@example.test",
  customerPhone: "+65 8123 4567",
  eventDate: "2026-06-12",
  venue: "Marina Bay Sands",
  items: [
    {
      productName: "Modular lounge set",
      quantity: 2,
      notes: "VIP reception area"
    }
  ]
};

describe("quote request validation", () => {
  it("accepts and normalizes a valid public quote request", () => {
    const result = validateQuoteSubmission({
      ...validPayload,
      customerMessage:
        "  Please recommend lounge seating that works for a reception.  ",
      customerName: "  Maya Tan  ",
      venue: "  Marina Bay Sands  ",
      sourcePath: "  /catalogue/modular-lounge-set  ",
      listingSlug: "  modular-lounge-set  "
    });

    expect(result).toEqual({
      ok: true,
      value: {
        customerName: "Maya Tan",
        customerEmail: "maya@example.test",
        customerPhone: "+65 8123 4567",
        customerMessage:
          "Please recommend lounge seating that works for a reception.",
        eventDate: "2026-06-12",
        venue: "Marina Bay Sands",
        requestId: "visitor-submission-20260612-001",
        sourcePath: "/catalogue/modular-lounge-set",
        listingSlug: "modular-lounge-set",
        items: [
          {
            productName: "Modular lounge set",
            quantity: 2,
            notes: "VIP reception area"
          }
        ]
      }
    });
  });

  it("accepts a top-level customer message even when no item snapshots are provided", () => {
    const result = validateQuoteSubmission({
      customerName: "Maya Tan",
      customerEmail: "maya@example.test",
      customerMessage:
        "We are still deciding quantities but need a warm reception setup.",
      requestId: "visitor-submission-20260612-001",
      items: []
    });

    expect(result).toEqual({
      ok: true,
      value: {
        customerName: "Maya Tan",
        customerEmail: "maya@example.test",
        customerMessage:
          "We are still deciding quantities but need a warm reception setup.",
        requestId: "visitor-submission-20260612-001",
        items: []
      }
    });
  });

  it("normalizes safe source metadata and CRM handoff placeholders for persistence", () => {
    const validation = validateQuoteSubmission({
      ...validPayload,
      sourcePath: " /catalogue/modular-lounge-set?utm_source=owner-review ",
      listingSlug: " modular-lounge-set ",
      requestId: "  visitor-submission-20260612-001  "
    });

    expect(validation).toMatchObject({
      ok: true,
      value: {
        sourcePath: "/catalogue/modular-lounge-set?utm_source=owner-review",
        listingSlug: "modular-lounge-set",
        requestId: "visitor-submission-20260612-001"
      }
    });

    if (!validation.ok) {
      throw new Error("Expected valid quote submission");
    }

    expect(prepareQuoteForPersistence(validation.value)).toMatchObject({
      sourcePagePath: "/catalogue/modular-lounge-set?utm_source=owner-review",
      sourceListingSlug: "modular-lounge-set",
      submissionRequestId: "visitor-submission-20260612-001",
      crmProvider: "hubspot",
      crmSyncStatus: "not_queued",
      crmContactId: null,
      crmDealId: null,
      crmLastSyncAttemptAt: null,
      crmSyncError: null
    });
  });

  it("rejects unsafe source metadata and public CRM handoff field overrides", () => {
    const cases = [
      {
        payload: { ...validPayload, sourcePath: "https://example.test/quote" },
        field: "sourcePath"
      },
      {
        payload: { ...validPayload, sourcePath: "//example.test/quote" },
        field: "sourcePath"
      },
      {
        payload: { ...validPayload, sourcePath: "/quote\nx-debug=true" },
        field: "sourcePath"
      },
      {
        payload: { ...validPayload, listingSlug: "../admin" },
        field: "listingSlug"
      },
      {
        payload: { ...validPayload, requestId: "x".repeat(129) },
        field: "requestId"
      },
      {
        payload: { ...validPayload, requestId: "request id with spaces" },
        field: "requestId"
      },
      {
        payload: { ...validPayload, crm_sync_status: "synced" },
        field: "unknown"
      },
      {
        payload: { ...validPayload, crm_provider: "hubspot" },
        field: "unknown"
      },
      {
        payload: { ...validPayload, crm_contact_id: "contact-123" },
        field: "unknown"
      },
      {
        payload: { ...validPayload, crm_deal_id: "deal-456" },
        field: "unknown"
      },
      {
        payload: {
          ...validPayload,
          crm_last_sync_attempt_at: "2026-06-16T00:00:00.000Z"
        },
        field: "unknown"
      },
      {
        payload: { ...validPayload, crm_sync_error: "provider failed" },
        field: "unknown"
      }
    ];

    for (const testCase of cases) {
      expect(validateQuoteSubmission(testCase.payload)).toMatchObject({
        ok: false,
        message: expect.stringContaining(testCase.field)
      });
    }
  });

  it("always prepares safe initial CRM placeholders regardless of public-like input shape", () => {
    const validation = validateQuoteSubmission({
      ...validPayload,
      sourcePath: "/quote?listing=modular-lounge-set",
      listingSlug: "modular-lounge-set",
      requestId: "8f6d5b35-5827-4093-b59f-e683fa9f6fdb"
    });

    if (!validation.ok) {
      throw new Error("Expected valid quote submission");
    }

    expect(prepareQuoteForPersistence(validation.value)).toMatchObject({
      crmProvider: "hubspot",
      crmSyncStatus: "not_queued",
      crmContactId: null,
      crmDealId: null,
      crmLastSyncAttemptAt: null,
      crmSyncError: null
    });
  });

  it("bounds CRM sync errors before storing future handoff diagnostics", () => {
    const rawError = `  ${"Sensitive customer detail ".repeat(40)}  `;
    const normalized = normalizeCrmSyncError(rawError);

    expect(normalized).toHaveLength(500);
    expect(normalized).not.toMatch(/\s{2,}/);
  });

  it("requires a customer name and at least one contact method", () => {
    expect(
      validateQuoteSubmission({
        ...validPayload,
        customerName: "",
        customerEmail: "",
        customerPhone: ""
      })
    ).toMatchObject({
      ok: false,
      message: expect.stringContaining("customerName")
    });

    expect(
      validateQuoteSubmission({
        ...validPayload,
        customerEmail: "",
        customerPhone: ""
      })
    ).toMatchObject({
      ok: false,
      message: expect.stringContaining("contact")
    });
  });

  it("requires a submission identifier for retry-safe persistence", () => {
    const { requestId: _requestId, ...payloadWithoutRequestId } = validPayload;

    expect(validateQuoteSubmission(payloadWithoutRequestId)).toEqual({
      ok: false,
      message: "requestId is required."
    });
  });


  it("rejects unsafe field shapes before persistence", () => {
    const cases = [
      {
        payload: { ...validPayload, customerEmail: "not-an-email" },
        field: "customerEmail"
      },
      {
        payload: { ...validPayload, eventDate: "12/06/2026" },
        field: "eventDate"
      },
      {
        payload: {
          ...validPayload,
          customerMessage: "x".repeat(1201)
        },
        field: "customerMessage"
      },
      {
        payload: {
          ...validPayload,
          items: [{ productName: "Chairs", quantity: 0 }]
        },
        field: "quantity"
      },
      {
        payload: {
          ...validPayload,
          items: [{ productName: "", quantity: 1 }]
        },
        field: "productName"
      },
      {
        payload: {
          ...validPayload,
          unexpected: "large unknown payload surface"
        },
        field: "unknown"
      }
    ];

    for (const testCase of cases) {
      expect(validateQuoteSubmission(testCase.payload)).toMatchObject({
        ok: false,
        message: expect.stringContaining(testCase.field)
      });
    }
  });
});
