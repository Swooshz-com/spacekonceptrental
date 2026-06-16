import { describe, expect, it } from "vitest";

import type { AdminQuoteRequestCrmHandoffPacket } from "./admin-quote-request-crm-handoff-packet-read";
import { generateAdminQuoteRequestHubSpotImportCsv } from "./admin-quote-request-hubspot-import-csv";

const packet: AdminQuoteRequestCrmHandoffPacket = {
  generatedAt: "2026-06-17T09:30:45.000Z",
  provider: "hubspot",
  localCrmSyncStatus: "queued",
  limit: 25,
  recordCount: 2,
  records: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      publicReference: "QR-20260617-CSV",
      createdAt: "2026-06-17T09:00:00.000Z",
      status: "reviewing",
      customerName: "Maya, Tan",
      customerEmail: "maya@example.test",
      customerPhone: "+65 8123 4567",
      companyOrEventOrganisation: 'Marina "Event" Team',
      messageDetails: "Line one\nLine two, with comma",
      sourcePagePath: "/quote?listing=modular-lounge-set",
      sourceListingSlug: "modular-lounge-set",
      futureProvider: "hubspot",
      localCrmSyncStatus: "queued"
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      publicReference: "=QR-FORMULA",
      createdAt: "2026-06-17T09:01:00.000Z",
      status: "new",
      customerName: "+Name",
      customerEmail: "-email@example.test",
      customerPhone: "@phone",
      companyOrEventOrganisation: "\tTabbed org",
      messageDetails: "\rCarriage return message",
      sourcePagePath: "/quote",
      sourceListingSlug: "chiavari-chair",
      futureProvider: "hubspot",
      localCrmSyncStatus: "queued"
    }
  ]
};

describe("admin HubSpot import CSV generator", () => {
  it("generates expected headers and bounded rows for manual HubSpot import review", () => {
    const result = generateAdminQuoteRequestHubSpotImportCsv(packet);

    expect(result.status).toBe("generated");
    if (result.status !== "generated") return;

    expect(result.filename).toBe(
      "skr-hubspot-import-queued-enquiries-20260617-093045.csv"
    );
    expect(result.recordCount).toBe(2);
    expect(result.csv.split("\r\n")[0]).toBe(
      '"Quote Request ID","Public Reference","Created At","Status","Customer Name","Customer Email","Customer Phone","Company Or Event Organisation","Message Details","Source Page Path","Source Listing Slug","CRM Provider","Local CRM Sync Status"'
    );
    expect(result.csv).toContain('"Maya, Tan"');
    expect(result.csv).toContain('"Marina ""Event"" Team"');
    expect(result.csv).toContain('"Line one\nLine two, with comma"');
  });

  it("prevents CSV formula injection for risky leading characters", () => {
    const result = generateAdminQuoteRequestHubSpotImportCsv(packet);

    expect(result.status).toBe("generated");
    if (result.status !== "generated") return;

    expect(result.csv).toContain('"\'=QR-FORMULA"');
    expect(result.csv).toContain('"\' +Name"'.replace(" ", ""));
    expect(result.csv).toContain('"\'-email@example.test"');
    expect(result.csv).toContain('"\'@phone"');
    expect(result.csv).toContain('"\'\tTabbed org"');
    expect(result.csv).toContain('"\'\rCarriage return message"');
  });

  it("does not include secrets, auth/session/header/cookie fields, internal notes, CRM IDs, or sync timestamps", () => {
    const result = generateAdminQuoteRequestHubSpotImportCsv(packet);

    expect(result.status).toBe("generated");
    if (result.status !== "generated") return;

    expect(result.csv).not.toContain("secret");
    expect(result.csv).not.toContain("authorization");
    expect(result.csv).not.toContain("session");
    expect(result.csv).not.toContain("cookie");
    expect(result.csv).not.toContain("header");
    expect(result.csv).not.toContain("internal_note");
    expect(result.csv).not.toContain("crm_contact_id");
    expect(result.csv).not.toContain("crm_deal_id");
    expect(result.csv).not.toContain("crm_last_sync_attempt_at");
  });

  it("fails closed for invalid packet metadata", () => {
    expect(
      generateAdminQuoteRequestHubSpotImportCsv({
        ...packet,
        recordCount: 99
      })
    ).toStrictEqual({
      status: "invalid_packet"
    });
  });
});
