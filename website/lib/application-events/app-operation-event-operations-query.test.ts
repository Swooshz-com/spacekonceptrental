import { describe, expect, it } from "vitest";

import {
  APP_OPERATION_EVENT_OPERATIONS_MAX_ROWS,
  canonicaliseAppOperationEventReferenceValue,
  parseAppOperationEventOperationsSearchParams
} from "./app-operation-event-operations-query";

const validRequestId = "123e4567-e89b-42d3-a456-426614174000";
const validPublicReference = "QR-20260612-ABC12345";

describe("app operation event operations query parser", () => {
  it("accepts an absent filter set as the bounded default query", () => {
    const result = parseAppOperationEventOperationsSearchParams({});

    expect(result.kind).toBe("ok");

    if (result.kind === "ok") {
      expect(result.query.category).toBeUndefined();
      expect(result.query.outcome).toBeUndefined();
      expect(result.query.search).toBeUndefined();
    }
  });

  it("accepts exact allowlisted category and outcome filters", () => {
    const result = parseAppOperationEventOperationsSearchParams({
      category: "quote.handoff",
      outcome: "pending"
    });

    expect(result.kind).toBe("ok");

    if (result.kind === "ok") {
      expect(result.query.category).toBe("quote.handoff");
      expect(result.query.outcome).toBe("pending");
    }
  });

  it.each([
    ["category", "quote.refund"],
    ["category", "catalogue.read"],
    ["outcome", "succeeded"],
    ["outcome", "delivered"]
  ])("rejects unknown %s filter value %j", (key, value) => {
    expect(
      parseAppOperationEventOperationsSearchParams({ [key]: value }).kind
    ).toBe("invalid");
  });

  it("rejects repeated (array) filter values", () => {
    expect(
      parseAppOperationEventOperationsSearchParams({
        category: ["quote.handoff", "rate.limit"]
      }).kind
    ).toBe("invalid");
    expect(
      parseAppOperationEventOperationsSearchParams({
        outcome: ["failed", "denied"]
      }).kind
    ).toBe("invalid");
  });

  it.each([
    ["category", ""],
    ["category", "   "],
    ["outcome", ""],
    ["outcome", "\t\n"]
  ])("rejects explicitly supplied empty/whitespace %s", (key, value) => {
    expect(
      parseAppOperationEventOperationsSearchParams({ [key]: value }).kind
    ).toBe("invalid");
  });

  it("accepts a valid paired request_id exact search", () => {
    const result = parseAppOperationEventOperationsSearchParams({
      referenceType: "request_id",
      referenceValue: validRequestId
    });

    expect(result.kind).toBe("ok");

    if (result.kind === "ok") {
      expect(result.query.search).toEqual({
        referenceType: "request_id",
        referenceValue: validRequestId
      });
    }
  });

  it("accepts a valid paired public_reference exact search", () => {
    const result = parseAppOperationEventOperationsSearchParams({
      referenceType: "public_reference",
      referenceValue: validPublicReference
    });

    expect(result.kind).toBe("ok");

    if (result.kind === "ok") {
      expect(result.query.search).toEqual({
        referenceType: "public_reference",
        referenceValue: validPublicReference
      });
    }
  });

  it("canonicalises (trims) a valid padded reference value", () => {
    const result = parseAppOperationEventOperationsSearchParams({
      referenceType: "public_reference",
      referenceValue: `  ${validPublicReference}  `
    });

    expect(result.kind).toBe("ok");

    if (result.kind === "ok") {
      expect(result.query.search?.referenceValue).toBe(validPublicReference);
    }
  });

  it("rejects a search when only the reference type is supplied", () => {
    expect(
      parseAppOperationEventOperationsSearchParams({
        referenceType: "request_id"
      }).kind
    ).toBe("invalid");
  });

  it("rejects a search when only the reference value is supplied", () => {
    expect(
      parseAppOperationEventOperationsSearchParams({
        referenceValue: validRequestId
      }).kind
    ).toBe("invalid");
  });

  it("rejects reference type none as not searchable", () => {
    expect(
      parseAppOperationEventOperationsSearchParams({
        referenceType: "none",
        referenceValue: validRequestId
      }).kind
    ).toBe("invalid");
  });

  it("rejects unsupported reference types", () => {
    expect(
      parseAppOperationEventOperationsSearchParams({
        referenceType: "quote_request_id",
        referenceValue: validRequestId
      }).kind
    ).toBe("invalid");
  });

  it.each([
    [""],
    ["   "],
    ["has space"],
    ["percent%"],
    ["star*"],
    ["wildcard_%"],
    ["question?"],
    ["hash#"],
    ["unicode-✓"],
    ["quote;drop"],
    ["1".repeat(129)]
  ])("rejects malformed or overlong reference value %j", (value) => {
    expect(
      parseAppOperationEventOperationsSearchParams({
        referenceType: "request_id",
        referenceValue: value
      }).kind
    ).toBe("invalid");
  });

  it("accepts a 128-character boundary-safe reference value", () => {
    const boundary = "A1".repeat(64);

    expect(
      canonicaliseAppOperationEventReferenceValue(boundary)
    ).toBe(boundary);
    expect(
      parseAppOperationEventOperationsSearchParams({
        referenceType: "public_reference",
        referenceValue: boundary
      }).kind
    ).toBe("ok");
  });

  it("rejects a 129-character overlong reference value", () => {
    expect(
      canonicaliseAppOperationEventReferenceValue("A1".repeat(64) + "A")
    ).toBeNull();
  });

  it("combines category, outcome and search in one bounded query", () => {
    const result = parseAppOperationEventOperationsSearchParams({
      category: "quote.submission",
      outcome: "failed",
      referenceType: "request_id",
      referenceValue: validRequestId
    });

    expect(result.kind).toBe("ok");

    if (result.kind === "ok") {
      expect(result.query).toEqual({
        category: "quote.submission",
        outcome: "failed",
        search: {
          referenceType: "request_id",
          referenceValue: validRequestId
        }
      });
    }
  });

  it("exposes the locked maximum row bound", () => {
    expect(APP_OPERATION_EVENT_OPERATIONS_MAX_ROWS).toBe(200);
  });

  it("has no database imports so parsing can never execute a query", () => {
    const { readFileSync } = require("node:fs") as typeof import("node:fs");
    const { resolve } = require("node:path") as typeof import("node:path");
    const source = readFileSync(
      resolve(
        process.cwd(),
        "lib/application-events/app-operation-event-operations-query.ts"
      ),
      "utf8"
    );

    expect(source).not.toContain("supabase");
    expect(source).not.toContain(".from(");
    expect(source).not.toContain(".eq(");
  });
});
