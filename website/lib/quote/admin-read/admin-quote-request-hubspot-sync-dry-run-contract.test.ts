import { describe, expect, it } from "vitest";

import type {
  AdminQuoteRequestCrmHandoffPacket,
  AdminQuoteRequestCrmHandoffPacketRecord
} from "./admin-quote-request-crm-handoff-packet-read";
import type { AdminQuoteRequestCrmHandoffPacketManifestRecord } from "./admin-quote-request-crm-handoff-packet-manifest";
import type { AdminQuoteRequestHubSpotImportCsvPreflightReport } from "./admin-quote-request-hubspot-import-csv-preflight";
import type {
  AdminQuoteRequestHubSpotManualImportOutcomeRecord,
  AdminQuoteRequestHubSpotManualImportOutcomeStatus
} from "./admin-quote-request-hubspot-manual-import-outcome-ledger";
import {
  adminQuoteRequestHubSpotSyncDryRunRecommendedActions,
  adminQuoteRequestHubSpotSyncDryRunStates,
  createAdminQuoteRequestHubSpotSyncDryRunFutureIdempotencyKey,
  generateAdminQuoteRequestHubSpotSyncDryRunContract
} from "./admin-quote-request-hubspot-sync-dry-run-contract";

const generatedAt = "2026-06-17T12:00:00.000Z";
const workspaceId = "99999999-9999-4999-8999-999999999999";

const ids = {
  eligibleReviewed: "11111111-1111-4111-8111-111111111111",
  eligibleCompleted: "22222222-2222-4222-8222-222222222222",
  preflightRequired: "33333333-3333-4333-8333-333333333333",
  preflightGeneric: "44444444-4444-4444-8444-444444444444",
  rejected: "55555555-5555-4555-8555-555555555555",
  partial: "66666666-6666-4666-8666-666666666666",
  noOutcome: "77777777-7777-4777-8777-777777777777",
  mismatch: "88888888-8888-4888-8888-888888888888",
  stale: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  admin: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  manifestReviewed: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  manifestCompleted: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  manifestRejected: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  manifestPartial: "ffffffff-ffff-4fff-8fff-ffffffffffff",
  manifestNoOutcome: "12345678-1234-4234-8234-123456789abc",
  manifestMismatch: "22345678-1234-4234-8234-123456789abc",
  manifestStale: "32345678-1234-4234-8234-123456789abc",
  outcomeReviewed: "42345678-1234-4234-8234-123456789abc",
  outcomeCompleted: "52345678-1234-4234-8234-123456789abc",
  outcomeRejected: "62345678-1234-4234-8234-123456789abc",
  outcomePartial: "72345678-1234-4234-8234-123456789abc"
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
    messageDetails: "Please prepare a lounge setup with private notes.",
    sourcePagePath: "/quote",
    sourceListingSlug: "modular-lounge-set",
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
  requestIds: string[],
  overrides: Partial<AdminQuoteRequestCrmHandoffPacketManifestRecord> = {}
): AdminQuoteRequestCrmHandoffPacketManifestRecord {
  return {
    id,
    workspaceId,
    provider: "hubspot",
    packetKind: "hubspot_import_csv",
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
    workspaceId,
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
  packetValue: AdminQuoteRequestCrmHandoffPacket
): AdminQuoteRequestHubSpotImportCsvPreflightReport {
  return {
    generatedAt,
    provider: "hubspot",
    localCrmSyncStatus: "queued",
    limit: packetValue.limit,
    totalRecordCount: packetValue.recordCount,
    exportableRecordCount: packetValue.recordCount - 2,
    needsReviewRecordCount: 2,
    duplicateEmailCount: 0,
    duplicatePhoneCount: 0,
    formulaRiskCellCount: 0,
    issueCountsByType: {
      missing_customer_name: 0,
      missing_customer_email: 1,
      invalid_customer_email: 0,
      missing_customer_phone: 0,
      duplicate_customer_email_in_batch: 0,
      duplicate_customer_phone_in_batch: 0,
      missing_message_details: 0,
      message_details_too_long: 0,
      missing_public_reference: 0,
      missing_created_at: 0,
      csv_formula_risk_sanitised: 0,
      missing_source_context: 1
    },
    rowIssues: [
      {
        quoteRequestId: ids.preflightRequired,
        publicReference: "QR-MISSING-CONTACT",
        issueTypes: ["missing_customer_email"],
        issueCount: 1,
        exportable: false,
        formulaRiskCellCount: 0
      },
      {
        quoteRequestId: ids.preflightGeneric,
        publicReference: "QR-PREFLIGHT",
        issueTypes: ["missing_source_context"],
        issueCount: 1,
        exportable: true,
        formulaRiskCellCount: 0
      }
    ]
  };
}

describe("admin HubSpot sync dry-run contract helper", () => {
  it("generates bounded summary counts, dry-run states, and safe payload previews without raw customer data", () => {
    const records = [
      record(ids.eligibleReviewed, "QR-ELIGIBLE-REVIEWED"),
      record(ids.eligibleCompleted, "QR-ELIGIBLE-COMPLETED"),
      record(ids.preflightRequired, "QR-MISSING-CONTACT"),
      record(ids.preflightGeneric, "QR-PREFLIGHT"),
      record(ids.rejected, "QR-REJECTED"),
      record(ids.partial, "QR-PARTIAL"),
      record(ids.noOutcome, "QR-NO-OUTCOME"),
      record(ids.mismatch, "QR-MISMATCH")
    ];
    const packetValue = packet(records);
    const reviewed = manifest(ids.manifestReviewed, [ids.eligibleReviewed]);
    const completed = manifest(ids.manifestCompleted, [ids.eligibleCompleted]);
    const rejected = manifest(ids.manifestRejected, [ids.rejected]);
    const partial = manifest(ids.manifestPartial, [ids.partial]);
    const noOutcome = manifest(ids.manifestNoOutcome, [ids.noOutcome]);
    const mismatch = manifest(ids.manifestMismatch, [ids.mismatch], {
      recordCount: 2,
      requestIdCount: 1
    });

    const report = generateAdminQuoteRequestHubSpotSyncDryRunContract({
      generatedAt,
      workspaceId,
      packet: packetValue,
      manifests: [
        reviewed,
        completed,
        rejected,
        partial,
        noOutcome,
        mismatch,
        manifest(ids.manifestStale, [ids.stale])
      ],
      manualImportOutcomes: [
        outcome(ids.outcomeReviewed, reviewed, "manual_import_reviewed"),
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
      preflight: preflightReport(packetValue)
    });

    expect(report).toMatchObject({
      generatedAt,
      provider: "hubspot",
      mode: "dry_run_only",
      localCrmSyncStatus: "queued",
      limit: 25,
      totalCandidateCount: 9,
      eligibleForFutureSyncCount: 2,
      blockedCandidateCount: 7,
      needsManualReviewCount: 7,
      wouldCreateOrUpdateContactCount: 2,
      wouldCreateOrUpdateDealCount: 2,
      wouldAssociateDealToContactCount: 2,
      idempotencyKeyCount: 9,
      recommendedNextAction: "fix_preflight_issues"
    });
    expect(report.rows.map((row) => [row.quoteRequestId, row.dryRunState]))
      .toStrictEqual([
        [ids.eligibleReviewed, "eligible_for_future_sync"],
        [ids.eligibleCompleted, "eligible_for_future_sync"],
        [ids.preflightRequired, "blocked_missing_required_contact_field"],
        [ids.preflightGeneric, "blocked_preflight_needs_review"],
        [ids.rejected, "blocked_rejected_needs_correction"],
        [ids.partial, "blocked_partial_needs_follow_up"],
        [ids.noOutcome, "blocked_no_manual_outcome"],
        [ids.mismatch, "blocked_manifest_metadata_mismatch"],
        [ids.stale, "blocked_stale_manifest"]
      ]);
    const eligibleRow = report.rows.find(
      (row) => row.quoteRequestId === ids.eligibleReviewed
    );

    expect(eligibleRow).toMatchObject({
      publicReference: "QR-ELIGIBLE-REVIEWED",
      lifecycleState: "queued_manual_import_reviewed",
      latestOutcomeStatus: "manual_import_reviewed",
      safeIssueCount: 0,
      futureIdempotencyKey:
        `skr_quote_request:${workspaceId}:${ids.eligibleReviewed}:hubspot`,
      recommendedNextAction: "review_dry_run_payload",
      payloadPreview: {
        futureContactProperties: {
          email: "presence_only",
          phone: "presence_only",
          company: "presence_only"
        },
        futureDealProperties: {
          dealname: "mapped_without_value",
          pipeline: "future_credentials_design",
          dealstage: "future_credentials_design",
          skr_quote_reference: "presence_only"
        },
        futureAssociations: ["contact_to_deal"],
        futureIdempotencyKey:
          `skr_quote_request:${workspaceId}:${ids.eligibleReviewed}:hubspot`
      }
    });
    const serializedRows = JSON.stringify(report.rows);

    expect(serializedRows).not.toContain("Maya Tan");
    expect(serializedRows).not.toContain("maya@example.test");
    expect(serializedRows).not.toContain("+65 8123 4567");
    expect(serializedRows).not.toContain("Please prepare a lounge setup");
    expect(serializedRows).not.toContain("Marina Bay Sands");
    expect(serializedRows).not.toContain("Quote Request ID");
    expect(serializedRows).not.toContain("Customer Name");
    expect(serializedRows).not.toContain("messageDetails");
    expect(serializedRows).not.toContain("internal");
    expect(serializedRows).not.toContain("crm_contact_id");
    expect(serializedRows).not.toContain("crm_deal_id");
    expect(serializedRows).not.toContain("crm_last_sync_attempt_at");
  });

  it("uses controlled recommended actions for empty, manual-outcome, reconciliation, payload-review, and credential-readiness states", () => {
    const readyRecord = record(ids.eligibleReviewed, "QR-READY");
    const readyManifest = manifest(ids.manifestReviewed, [readyRecord.id]);

    expect(
      generateAdminQuoteRequestHubSpotSyncDryRunContract({
        generatedAt,
        workspaceId,
        packet: packet([], 25),
        manifests: [],
        manualImportOutcomes: []
      }).recommendedNextAction
    ).toBe("no_eligible_records");
    expect(
      generateAdminQuoteRequestHubSpotSyncDryRunContract({
        generatedAt,
        workspaceId,
        packet: packet([record(ids.noOutcome, "QR-NO-OUTCOME")]),
        manifests: [manifest(ids.manifestNoOutcome, [ids.noOutcome])],
        manualImportOutcomes: []
      }).recommendedNextAction
    ).toBe("record_manual_outcome");
    expect(
      generateAdminQuoteRequestHubSpotSyncDryRunContract({
        generatedAt,
        workspaceId,
        packet: packet([record(ids.partial, "QR-PARTIAL")]),
        manifests: [manifest(ids.manifestPartial, [ids.partial])],
        manualImportOutcomes: [
          outcome(
            ids.outcomePartial,
            manifest(ids.manifestPartial, [ids.partial]),
            "manual_import_partial_needs_follow_up"
          )
        ]
      }).recommendedNextAction
    ).toBe("review_reconciliation");
    expect(
      generateAdminQuoteRequestHubSpotSyncDryRunContract({
        generatedAt,
        workspaceId,
        packet: packet([readyRecord]),
        manifests: [readyManifest],
        manualImportOutcomes: [
          outcome(ids.outcomeReviewed, readyManifest, "manual_import_reviewed")
        ]
      }).recommendedNextAction
    ).toBe("ready_for_provider_credentials_design");
    expect(
      generateAdminQuoteRequestHubSpotSyncDryRunContract({
        generatedAt,
        workspaceId,
        packet: packet([readyRecord, record(ids.noOutcome, "QR-NEEDS")]),
        manifests: [
          readyManifest,
          manifest(ids.manifestNoOutcome, [ids.noOutcome])
        ],
        manualImportOutcomes: [
          outcome(ids.outcomeReviewed, readyManifest, "manual_import_reviewed")
        ]
      }).recommendedNextAction
    ).toBe("review_dry_run_payload");
  });

  it("generates deterministic future idempotency keys without customer data, provider IDs, secrets, or timestamps", () => {
    const first = createAdminQuoteRequestHubSpotSyncDryRunFutureIdempotencyKey({
      workspaceId,
      quoteRequestId: ids.eligibleReviewed
    });
    const second = createAdminQuoteRequestHubSpotSyncDryRunFutureIdempotencyKey({
      workspaceId,
      quoteRequestId: ids.eligibleReviewed
    });

    expect(first).toBe(second);
    expect(first).toBe(
      `skr_quote_request:${workspaceId}:${ids.eligibleReviewed}:hubspot`
    );
    expect(first).not.toContain("Maya");
    expect(first).not.toContain("maya@example.test");
    expect(first).not.toContain("+65");
    expect(first).not.toContain("hubspot-contact");
    expect(first).not.toContain("hubspot-deal");
    expect(first).not.toContain("secret");
    expect(first).not.toContain("token");
    expect(first).not.toContain(generatedAt);
  });

  it("keeps row output bounded and exposes only controlled states and actions", () => {
    const manyRecords = Array.from({ length: 105 }, (_, index) =>
      record(
        `00000000-0000-4${String(index).padStart(3, "0")}-8${String(
          index
        ).padStart(3, "0")}-000000000000`,
        `QR-${index}`
      )
    );

    const report = generateAdminQuoteRequestHubSpotSyncDryRunContract({
      generatedAt,
      workspaceId,
      limit: 3,
      packet: packet(manyRecords, 105),
      manifests: [],
      manualImportOutcomes: []
    });

    expect(adminQuoteRequestHubSpotSyncDryRunStates).toStrictEqual([
      "eligible_for_future_sync",
      "blocked_preflight_needs_review",
      "blocked_missing_required_contact_field",
      "blocked_rejected_needs_correction",
      "blocked_partial_needs_follow_up",
      "blocked_no_manual_outcome",
      "blocked_stale_manifest",
      "blocked_manifest_metadata_mismatch"
    ]);
    expect(adminQuoteRequestHubSpotSyncDryRunRecommendedActions).toStrictEqual([
      "fix_preflight_issues",
      "record_manual_outcome",
      "review_reconciliation",
      "review_dry_run_payload",
      "ready_for_provider_credentials_design",
      "no_eligible_records"
    ]);
    expect(report.limit).toBe(3);
    expect(report.rows).toHaveLength(3);
    expect(report.totalCandidateCount).toBe(3);
    expect(report.rows.every((row) => row.localCrmSyncStatus === "queued"))
      .toBe(true);
    expect(JSON.stringify(report.rows)).not.toContain("maya@example.test");
  });
});
