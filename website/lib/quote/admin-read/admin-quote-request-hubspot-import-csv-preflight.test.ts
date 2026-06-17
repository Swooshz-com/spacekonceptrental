import { describe, expect, it } from "vitest";

import type { AdminQuoteRequestCrmHandoffPacket } from "./admin-quote-request-crm-handoff-packet-read";
import {
  adminQuoteRequestHubSpotImportCsvPreflightIssueTypes,
  generateAdminQuoteRequestHubSpotImportCsvPreflight
} from "./admin-quote-request-hubspot-import-csv-preflight";

const basePacket: AdminQuoteRequestCrmHandoffPacket = {
  generatedAt: "2026-06-17T10:00:00.000Z",
  provider: "hubspot",
  localCrmSyncStatus: "queued",
  limit: 25,
  recordCount: 5,
  records: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      publicReference: "QR-READY",
      createdAt: "2026-06-17T09:00:00.000Z",
      status: "new",
      customerName: "Maya Tan",
      customerEmail: "maya@example.test",
      customerPhone: "+65 8123 4567",
      companyOrEventOrganisation: "Marina Bay Sands",
      messageDetails: "Please prepare a lounge setup.",
      sourcePagePath: "/quote?listing=modular-lounge-set",
      sourceListingSlug: "modular-lounge-set",
      futureProvider: "hubspot",
      localCrmSyncStatus: "queued"
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      publicReference: "",
      createdAt: "",
      status: "reviewing",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      messageDetails: "",
      futureProvider: "hubspot",
      localCrmSyncStatus: "queued"
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      publicReference: "QR-INVALID",
      createdAt: "2026-06-17T09:10:00.000Z",
      status: "new",
      customerName: "Invalid Email",
      customerEmail: "not-an-email",
      customerPhone: "+65 8888 0000",
      messageDetails: "x".repeat(1001),
      futureProvider: "hubspot",
      localCrmSyncStatus: "queued"
    },
    {
      id: "44444444-4444-4444-8444-444444444444",
      publicReference: "QR-DUP-1",
      createdAt: "2026-06-17T09:20:00.000Z",
      status: "new",
      customerName: "+Formula Name",
      customerEmail: "duplicate@example.test",
      customerPhone: "+65 8888 0000",
      messageDetails: "\tTabbed message",
      sourcePagePath: "/quote",
      sourceListingSlug: "chiavari-chair",
      futureProvider: "hubspot",
      localCrmSyncStatus: "queued"
    },
    {
      id: "55555555-5555-4555-8555-555555555555",
      publicReference: "QR-DUP-2",
      createdAt: "2026-06-17T09:30:00.000Z",
      status: "new",
      customerName: "Duplicate Email",
      customerEmail: "duplicate@example.test",
      customerPhone: "+65 8999 0000",
      messageDetails: "Needs a second review.",
      sourcePagePath: "/quote",
      futureProvider: "hubspot",
      localCrmSyncStatus: "queued"
    }
  ]
};

describe("admin HubSpot import CSV preflight", () => {
  it("generates bounded preflight summary counts for queued manual HubSpot import readiness", () => {
    const result =
      generateAdminQuoteRequestHubSpotImportCsvPreflight(basePacket);

    expect(result).toStrictEqual(
      expect.objectContaining({
        generatedAt: "2026-06-17T10:00:00.000Z",
        provider: "hubspot",
        localCrmSyncStatus: "queued",
        limit: 25,
        totalRecordCount: 5,
        exportableRecordCount: 1,
        needsReviewRecordCount: 5,
        duplicateEmailCount: 2,
        duplicatePhoneCount: 2,
        formulaRiskCellCount: 6
      })
    );
    expect(result.rowIssues).toHaveLength(5);
    expect(result.rowIssues.map((row) => row.publicReference)).toStrictEqual([
      "QR-READY",
      "QR-INVALID",
      "QR-DUP-1",
      "QR-DUP-2",
      undefined
    ]);
    expect(result.rowIssues.every((row) => row.issueTypes.length > 0)).toBe(
      true
    );
    expect(result.rowIssues.length).toBeLessThanOrEqual(result.limit);
  });

  it.each([
    ["missing_customer_name", 1],
    ["missing_customer_email", 1],
    ["invalid_customer_email", 1],
    ["missing_customer_phone", 1],
    ["duplicate_customer_email_in_batch", 2],
    ["duplicate_customer_phone_in_batch", 2],
    ["missing_message_details", 1],
    ["message_details_too_long", 1],
    ["missing_public_reference", 1],
    ["missing_created_at", 1],
    ["csv_formula_risk_sanitised", 6],
    ["missing_source_context", 2]
  ] as const)("counts %s issues", (issueType, expectedCount) => {
    const result =
      generateAdminQuoteRequestHubSpotImportCsvPreflight(basePacket);

    expect(result.issueCountsByType[issueType]).toBe(expectedCount);
  });

  it("exposes the complete allowlisted issue type set", () => {
    expect(adminQuoteRequestHubSpotImportCsvPreflightIssueTypes).toStrictEqual([
      "missing_customer_name",
      "missing_customer_email",
      "invalid_customer_email",
      "missing_customer_phone",
      "duplicate_customer_email_in_batch",
      "duplicate_customer_phone_in_batch",
      "missing_message_details",
      "message_details_too_long",
      "missing_public_reference",
      "missing_created_at",
      "csv_formula_risk_sanitised",
      "missing_source_context"
    ]);
  });

  it("does not include secrets, auth/session/header/cookie fields, internal notes, CRM IDs, or sync timestamps", () => {
    const packet = {
      ...basePacket,
      recordCount: 1,
      records: [
        {
          ...basePacket.records[0],
          internalNotes: "keep this admin-only",
          authorization: "Bearer secret",
          session: "session-secret",
          cookie: "cookie-secret",
          header: "header-secret",
          crmContactId: "contact-secret",
          crmDealId: "deal-secret",
          crmLastSyncAttemptAt: "2026-06-17T09:40:00.000Z"
        }
      ]
    } as unknown as AdminQuoteRequestCrmHandoffPacket;

    const result = generateAdminQuoteRequestHubSpotImportCsvPreflight(packet);
    const json = JSON.stringify(result);

    expect(json).not.toContain("secret");
    expect(json).not.toContain("authorization");
    expect(json).not.toContain("session");
    expect(json).not.toContain("cookie");
    expect(json).not.toContain("header");
    expect(json).not.toContain("internalNotes");
    expect(json).not.toContain("crmContactId");
    expect(json).not.toContain("crmDealId");
    expect(json).not.toContain("crmLastSyncAttemptAt");
  });

  it("handles empty queued packets safely", () => {
    const result = generateAdminQuoteRequestHubSpotImportCsvPreflight({
      generatedAt: "2026-06-17T10:00:00.000Z",
      provider: "hubspot",
      localCrmSyncStatus: "queued",
      limit: 25,
      recordCount: 0,
      records: []
    });

    expect(result).toStrictEqual({
      generatedAt: "2026-06-17T10:00:00.000Z",
      provider: "hubspot",
      localCrmSyncStatus: "queued",
      limit: 25,
      totalRecordCount: 0,
      exportableRecordCount: 0,
      needsReviewRecordCount: 0,
      duplicateEmailCount: 0,
      duplicatePhoneCount: 0,
      formulaRiskCellCount: 0,
      issueCountsByType:
        adminQuoteRequestHubSpotImportCsvPreflightIssueTypes.reduce(
          (counts, issueType) => ({
            ...counts,
            [issueType]: 0
          }),
          {}
        ),
      rowIssues: []
    });
  });
});
