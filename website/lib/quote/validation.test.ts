import { describe, expect, it } from "vitest";
import { validateQuoteSubmission } from "./validation";

const validPayload = {
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
      venue: "  Marina Bay Sands  "
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
      items: []
    });

    expect(result).toEqual({
      ok: true,
      value: {
        customerName: "Maya Tan",
        customerEmail: "maya@example.test",
        customerMessage:
          "We are still deciding quantities but need a warm reception setup.",
        items: []
      }
    });
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
