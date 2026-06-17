import { describe, expect, it } from "vitest";

import type {
  AdminQuoteRequestCrmHandoffPacket,
  AdminQuoteRequestCrmHandoffPacketRecord
} from "./admin-quote-request-crm-handoff-packet-read";
import type { AdminQuoteRequestCrmHandoffPacketManifestRecord } from "./admin-quote-request-crm-handoff-packet-manifest";
import type {
  AdminQuoteRequestHubSpotManualImportOutcomeRecord,
  AdminQuoteRequestHubSpotManualImportOutcomeStatus
} from "./admin-quote-request-hubspot-manual-import-outcome-ledger";
import type { AdminQuoteRequestHubSpotImportCsvPreflightReport } from "./admin-quote-request-hubspot-import-csv-preflight";
import { generateAdminQuoteRequestCrmHandoffLifecycleReconciliation } from "./admin-quote-request-crm-handoff-lifecycle-reconciliation";

const generatedAt = "2026-06-17T12:00:00.000Z";

const ids = {
  neverExported: "11111111-1111-4111-8111-111111111111",
  preflight: "22222222-2222-4222-8222-222222222222",
  csvNoOutcome: "33333333-3333-4333-8333-333333333333",
  reviewed: "44444444-4444-4444-8444-444444444444",
  completed: "55555555-5555-4555-8555-555555555555",
  rejected: "66666666-6666-4666-8666-666666666666",
  partial: "77777777-7777-4777-8777-777777777777",
  stale: "88888888-8888-4888-8888-888888888888",
  manifestJson: "99999999-9999-4999-8999-999999999999",
  manifestCsvNoOutcome: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  manifestReviewed: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  manifestCompleted: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  manifestRejected: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  manifestPartial: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  manifestStale: "ffffffff-ffff-4fff-8fff-ffffffffffff",
  outcomeReviewed: "12345678-1234-4234-8234-123456789abc",
  outcomeCompleted: "22345678-1234-4234-8234-123456789abc",
  outcomeRejected: "32345678-1234-4234-8234-123456789abc",
  outcomePartial: "42345678-1234-4234-8234-123456789abc",
  admin: "52345678-1234-4234-8234-123456789abc"
};

function record(
  id: string,
  publicReference: string
): AdminQuoteRequestCrmHandoffPacketRecord {
  return {
    id,
    publicReference,
    createdAt: "2026-06-17T09:00:00.000Z",
    status: "new",
    customerName: "Maya Tan",
    customerEmail: "maya@example.test",
    customerPhone: "+65 8123 4567",
    companyOrEventOrganisation: "Marina Bay Sands",
    messageDetails: "Please prepare a lounge setup.",
    sourcePagePath: "/quote",
    futureProvider: "hubspot",
    localCrmSyncStatus: "queued"
  };
}

function packet(
  records: AdminQuoteRequestCrmHandoffPacketRecord[],
  limit = 25
): AdminQuoteRequestCrmHandoffPacket {
  return {
    generatedAt,
    provider: "hubspot",
    localCrmSyncStatus: "queued",
    limit,
    recordCount: records.length,
    records
  };
}

function manifest(
  id: string,
  packetKind: "json_review_packet" | "hubspot_import_csv",
  requestIds: string[],
  overrides: Partial<AdminQuoteRequestCrmHandoffPacketManifestRecord> = {}
): AdminQuoteRequestCrmHandoffPacketManifestRecord {
  return {
    id,
    workspaceId: "92345678-1234-4234-8234-123456789abc",
    provider: "hubspot",
    packetKind,
    statusFilter: "queued",
    limitRequested: 25,
    recordCount: requestIds.length,
    requestIds,
    requestIdCount: requestIds.length,
    generatedByAdminUserId: ids.admin,
    generatedAt,
    source: "protected_admin",
    ...overrides
  };
}

function outcome(
  id: string,
  csvManifest: AdminQuoteRequestCrmHandoffPacketManifestRecord,
  outcomeStatus: AdminQuoteRequestHubSpotManualImportOutcomeStatus
): AdminQuoteRequestHubSpotManualImportOutcomeRecord {
  return {
    id,
    workspaceId: csvManifest.workspaceId,
    manifestId: csvManifest.id,
    provider: "hubspot",
    packetKind: "hubspot_import_csv",
    outcomeStatus,
    recordCount: csvManifest.recordCount,
    requestIds: csvManifest.requestIds,
    requestIdCount: csvManifest.requestIdCount,
    recordedByAdminUserId: ids.admin,
    recordedAt: "2026-06-17T12:30:00.000Z",
    source: "protected_admin"
  };
}

function preflightReport(
  packetValue: AdminQuoteRequestCrmHandoffPacket,
  issueRequestId: string
): AdminQuoteRequestHubSpotImportCsvPreflightReport {
  return {
    generatedAt,
    provider: "hubspot",
    localCrmSyncStatus: "queued",
    limit: packetValue.limit,
    totalRecordCount: packetValue.recordCount,
    exportableRecordCount: packetValue.recordCount - 1,
    needsReviewRecordCount: 1,
    duplicateEmailCount: 0,
    duplicatePhoneCount: 0,
    formulaRiskCellCount: 0,
    issueCountsByType: {
      missing_customer_name: 1,
      missing_customer_email: 0,
      invalid_customer_email: 0,
      missing_customer_phone: 0,
      duplicate_customer_email_in_batch: 0,
      duplicate_customer_phone_in_batch: 0,
      missing_message_details: 0,
      message_details_too_long: 0,
      missing_public_reference: 0,
      missing_created_at: 0,
      csv_formula_risk_sanitised: 0,
      missing_source_context: 0
    },
    rowIssues: [
      {
        quoteRequestId: issueRequestId,
        publicReference: "QR-PREFLIGHT",
        issueTypes: ["missing_customer_name"],
        issueCount: 1,
        exportable: false,
        formulaRiskCellCount: 0
      }
    ]
  };
}

describe("admin CRM handoff lifecycle reconciliation helper", () => {
  it("summarises queued lifecycle states across manifests, preflight issues, and manual outcomes without raw customer data", () => {
    const records = [
      record(ids.neverExported, "QR-NEVER"),
      record(ids.preflight, "QR-PREFLIGHT"),
      record(ids.csvNoOutcome, "QR-CSV-NO-OUTCOME"),
      record(ids.reviewed, "QR-REVIEWED"),
      record(ids.completed, "QR-COMPLETED"),
      record(ids.rejected, "QR-REJECTED"),
      record(ids.partial, "QR-PARTIAL")
    ];
    const packetValue = packet(records);
    const csvNoOutcome = manifest(
      ids.manifestCsvNoOutcome,
      "hubspot_import_csv",
      [ids.csvNoOutcome]
    );
    const reviewed = manifest(ids.manifestReviewed, "hubspot_import_csv", [
      ids.reviewed
    ]);
    const completed = manifest(ids.manifestCompleted, "hubspot_import_csv", [
      ids.completed
    ]);
    const rejected = manifest(ids.manifestRejected, "hubspot_import_csv", [
      ids.rejected
    ]);
    const partial = manifest(ids.manifestPartial, "hubspot_import_csv", [
      ids.partial
    ]);

    const report = generateAdminQuoteRequestCrmHandoffLifecycleReconciliation({
      generatedAt,
      packet: packetValue,
      manifests: [
        manifest(ids.manifestJson, "json_review_packet", [ids.neverExported]),
        csvNoOutcome,
        reviewed,
        completed,
        rejected,
        partial
      ],
      manualImportOutcomes: [
        outcome(
          ids.outcomeReviewed,
          reviewed,
          "manual_import_reviewed"
        ),
        outcome(
          ids.outcomeCompleted,
          completed,
          "manual_import_completed_outside_skr"
        ),
        outcome(
          ids.outcomeRejected,
          rejected,
          "manual_import_rejected_needs_correction"
        ),
        outcome(
          ids.outcomePartial,
          partial,
          "manual_import_partial_needs_follow_up"
        )
      ],
      preflight: preflightReport(packetValue, ids.preflight)
    });

    expect(report).toMatchObject({
      generatedAt,
      provider: "hubspot",
      localCrmSyncStatus: "queued",
      limit: 25,
      queuedRecordCount: 7,
      jsonReviewPacketManifestCount: 1,
      hubspotCsvManifestCount: 5,
      manualOutcomeCount: 4,
      queuedNeverExportedCount: 1,
      csvExportedNoOutcomeCount: 1,
      csvExportedReviewedCount: 1,
      csvCompletedOutsideSkrCount: 1,
      csvRejectedNeedsCorrectionCount: 1,
      csvPartialNeedsFollowUpCount: 1,
      preflightNeedsReviewCount: 1,
      staleManifestCount: 0,
      mismatchedManifestCount: 0,
      recommendedNextAction: "review_corrections"
    });
    expect(
      report.rows.map((row) => [row.quoteRequestId, row.lifecycleState])
    ).toStrictEqual([
      [ids.neverExported, "queued_never_exported"],
      [ids.preflight, "queued_preflight_needs_review"],
      [ids.csvNoOutcome, "queued_csv_exported_no_outcome"],
      [ids.reviewed, "queued_manual_import_reviewed"],
      [ids.completed, "queued_manual_import_completed_outside_skr"],
      [ids.rejected, "queued_manual_import_rejected_needs_correction"],
      [ids.partial, "queued_manual_import_partial_needs_follow_up"]
    ]);
    expect(report.rows.find((row) => row.quoteRequestId === ids.preflight))
      .toMatchObject({
        publicReference: "QR-PREFLIGHT",
        safeIssueCount: 1,
        recommendedNextAction: "review_corrections"
      });
    const serialized = JSON.stringify(report);

    expect(serialized).not.toContain("Maya Tan");
    expect(serialized).not.toContain("maya@example.test");
    expect(serialized).not.toContain("+65 8123 4567");
    expect(serialized).not.toContain("Please prepare a lounge setup.");
    expect(serialized).not.toContain("crm_contact_id");
    expect(serialized).not.toContain("crm_deal_id");
    expect(serialized).not.toContain("crm_last_sync_attempt_at");
  });

  it("flags stale manifest records and metadata mismatches while keeping rows bounded", () => {
    const current = record(ids.neverExported, "QR-CURRENT");
    const mismatch = manifest(
      ids.manifestCsvNoOutcome,
      "hubspot_import_csv",
      [current.id],
      {
        recordCount: 2,
        requestIdCount: 1
      }
    );

    const report = generateAdminQuoteRequestCrmHandoffLifecycleReconciliation({
      generatedAt,
      limit: 2,
      packet: packet([current], 2),
      manifests: [
        mismatch,
        manifest(ids.manifestStale, "hubspot_import_csv", [ids.stale])
      ],
      manualImportOutcomes: [],
      preflight: undefined
    });

    expect(report.mismatchedManifestCount).toBe(1);
    expect(report.staleManifestCount).toBe(1);
    expect(report.recommendedNextAction).toBe("review_corrections");
    expect(report.rows).toHaveLength(2);
    expect(report.rows).toEqual([
      expect.objectContaining({
        quoteRequestId: ids.neverExported,
        lifecycleState: "manifest_metadata_mismatch",
        relatedManifestId: mismatch.id,
        safeIssueCount: 1,
        recommendedNextAction: "review_corrections"
      }),
      expect.objectContaining({
        quoteRequestId: ids.stale,
        lifecycleState: "stale_manifest_record_missing",
        relatedManifestId: ids.manifestStale,
        safeIssueCount: 1,
        recommendedNextAction: "review_corrections"
      })
    ]);
  });

  it("uses controlled recommended actions for empty, preflight, export, outcome, partial, and ready states", () => {
    const ready = record(ids.completed, "QR-READY");
    const readyCsv = manifest(ids.manifestCompleted, "hubspot_import_csv", [
      ready.id
    ]);

    expect(
      generateAdminQuoteRequestCrmHandoffLifecycleReconciliation({
        generatedAt,
        packet: packet([], 25),
        manifests: [],
        manualImportOutcomes: []
      }).recommendedNextAction
    ).toBe("no_queued_records");
    expect(
      generateAdminQuoteRequestCrmHandoffLifecycleReconciliation({
        generatedAt,
        packet: packet([record(ids.neverExported, "QR-RUN-PREFLIGHT")]),
        manifests: [],
        manualImportOutcomes: []
      }).recommendedNextAction
    ).toBe("run_preflight");
    expect(
      generateAdminQuoteRequestCrmHandoffLifecycleReconciliation({
        generatedAt,
        packet: packet([record(ids.neverExported, "QR-DOWNLOAD")]),
        manifests: [],
        manualImportOutcomes: [],
        preflight: {
          ...preflightReport(packet([record(ids.neverExported, "QR-DOWNLOAD")]), ids.preflight),
          needsReviewRecordCount: 0,
          rowIssues: []
        }
      }).recommendedNextAction
    ).toBe("download_csv");
    expect(
      generateAdminQuoteRequestCrmHandoffLifecycleReconciliation({
        generatedAt,
        packet: packet([record(ids.csvNoOutcome, "QR-OUTCOME")]),
        manifests: [
          manifest(ids.manifestCsvNoOutcome, "hubspot_import_csv", [
            ids.csvNoOutcome
          ])
        ],
        manualImportOutcomes: []
      }).recommendedNextAction
    ).toBe("record_manual_outcome");
    expect(
      generateAdminQuoteRequestCrmHandoffLifecycleReconciliation({
        generatedAt,
        packet: packet([record(ids.partial, "QR-PARTIAL")]),
        manifests: [
          manifest(ids.manifestPartial, "hubspot_import_csv", [ids.partial])
        ],
        manualImportOutcomes: [
          outcome(
            ids.outcomePartial,
            manifest(ids.manifestPartial, "hubspot_import_csv", [ids.partial]),
            "manual_import_partial_needs_follow_up"
          )
        ]
      }).recommendedNextAction
    ).toBe("follow_up_partial_import");
    expect(
      generateAdminQuoteRequestCrmHandoffLifecycleReconciliation({
        generatedAt,
        packet: packet([ready]),
        manifests: [readyCsv],
        manualImportOutcomes: [
          outcome(
            ids.outcomeCompleted,
            readyCsv,
            "manual_import_completed_outside_skr"
          )
        ]
      }).recommendedNextAction
    ).toBe("ready_for_future_sync_design");
  });
});
