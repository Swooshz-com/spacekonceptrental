import "server-only";

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

export const adminQuoteRequestCrmHandoffLifecycleStates = [
  "queued_never_exported",
  "queued_preflight_needs_review",
  "queued_csv_exported_no_outcome",
  "queued_manual_import_reviewed",
  "queued_manual_import_completed_outside_skr",
  "queued_manual_import_rejected_needs_correction",
  "queued_manual_import_partial_needs_follow_up",
  "stale_manifest_record_missing",
  "manifest_metadata_mismatch"
] as const;

export type AdminQuoteRequestCrmHandoffLifecycleState =
  (typeof adminQuoteRequestCrmHandoffLifecycleStates)[number];

export const adminQuoteRequestCrmHandoffLifecycleRecommendedActions = [
  "run_preflight",
  "download_csv",
  "record_manual_outcome",
  "review_corrections",
  "follow_up_partial_import",
  "ready_for_future_sync_design",
  "no_queued_records"
] as const;

export type AdminQuoteRequestCrmHandoffLifecycleRecommendedAction =
  (typeof adminQuoteRequestCrmHandoffLifecycleRecommendedActions)[number];

export type AdminQuoteRequestCrmHandoffLifecycleReconciliationRow = {
  quoteRequestId: string;
  publicReference?: string;
  createdAt?: string;
  localCrmSyncStatus: "queued";
  lifecycleState: AdminQuoteRequestCrmHandoffLifecycleState;
  relatedManifestId?: string;
  latestOutcomeStatus?: AdminQuoteRequestHubSpotManualImportOutcomeStatus;
  safeIssueCount: number;
  recommendedNextAction: AdminQuoteRequestCrmHandoffLifecycleRecommendedAction;
};

export type AdminQuoteRequestCrmHandoffLifecycleReconciliationReport = {
  generatedAt: string;
  provider: "hubspot";
  localCrmSyncStatus: "queued";
  limit: number;
  queuedRecordCount: number;
  jsonReviewPacketManifestCount: number;
  hubspotCsvManifestCount: number;
  manualOutcomeCount: number;
  queuedNeverExportedCount: number;
  csvExportedNoOutcomeCount: number;
  csvExportedReviewedCount: number;
  csvCompletedOutsideSkrCount: number;
  csvRejectedNeedsCorrectionCount: number;
  csvPartialNeedsFollowUpCount: number;
  preflightNeedsReviewCount: number;
  staleManifestCount: number;
  mismatchedManifestCount: number;
  recommendedNextAction: AdminQuoteRequestCrmHandoffLifecycleRecommendedAction;
  rows: AdminQuoteRequestCrmHandoffLifecycleReconciliationRow[];
};

export type AdminQuoteRequestCrmHandoffLifecycleReconciliationInput = {
  generatedAt?: string;
  limit?: number;
  packet: AdminQuoteRequestCrmHandoffPacket;
  manifests?: AdminQuoteRequestCrmHandoffPacketManifestRecord[];
  manualImportOutcomes?: AdminQuoteRequestHubSpotManualImportOutcomeRecord[];
  preflight?: AdminQuoteRequestHubSpotImportCsvPreflightReport;
};

const maxLimit = 100;
const maxRecentMetadata = 25;

type RowDraft = AdminQuoteRequestCrmHandoffLifecycleReconciliationRow;

function getTimestamp(value: string | undefined) {
  const timestamp = value ? Date.parse(value) : Number.NaN;

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getLimit(input: AdminQuoteRequestCrmHandoffLifecycleReconciliationInput) {
  if (
    Number.isInteger(input.limit) &&
    Number(input.limit) > 0
  ) {
    return Math.min(Number(input.limit), maxLimit);
  }

  if (
    Number.isInteger(input.packet.limit) &&
    Number(input.packet.limit) > 0
  ) {
    return Math.min(Number(input.packet.limit), maxLimit);
  }

  return Math.min(input.packet.records.length, maxLimit);
}

function isManifestMismatch(
  manifest: AdminQuoteRequestCrmHandoffPacketManifestRecord
) {
  return (
    manifest.provider !== "hubspot" ||
    manifest.statusFilter !== "queued" ||
    !Number.isInteger(manifest.recordCount) ||
    !Number.isInteger(manifest.requestIdCount) ||
    manifest.recordCount < 0 ||
    manifest.requestIdCount < 0 ||
    manifest.recordCount !== manifest.requestIds.length ||
    manifest.requestIdCount !== manifest.requestIds.length
  );
}

function isOutcomeMismatch(
  outcome: AdminQuoteRequestHubSpotManualImportOutcomeRecord,
  manifest: AdminQuoteRequestCrmHandoffPacketManifestRecord | undefined
) {
  if (!manifest) {
    return true;
  }

  return (
    outcome.provider !== "hubspot" ||
    outcome.packetKind !== "hubspot_import_csv" ||
    outcome.recordCount !== manifest.recordCount ||
    outcome.requestIdCount !== manifest.requestIdCount ||
    outcome.requestIds.length !== manifest.requestIds.length ||
    outcome.requestIds.some((requestId) => !manifest.requestIds.includes(requestId))
  );
}

function latestByDate<T>(
  values: T[],
  getDate: (value: T) => string | undefined
) {
  return [...values].sort(
    (left, right) => getTimestamp(getDate(right)) - getTimestamp(getDate(left))
  );
}

function actionForState(
  lifecycleState: AdminQuoteRequestCrmHandoffLifecycleState,
  hasPreflight: boolean
): AdminQuoteRequestCrmHandoffLifecycleRecommendedAction {
  switch (lifecycleState) {
    case "queued_never_exported":
      return hasPreflight ? "download_csv" : "run_preflight";
    case "queued_preflight_needs_review":
    case "queued_manual_import_rejected_needs_correction":
    case "stale_manifest_record_missing":
    case "manifest_metadata_mismatch":
      return "review_corrections";
    case "queued_csv_exported_no_outcome":
      return "record_manual_outcome";
    case "queued_manual_import_partial_needs_follow_up":
      return "follow_up_partial_import";
    case "queued_manual_import_reviewed":
    case "queued_manual_import_completed_outside_skr":
      return "ready_for_future_sync_design";
  }
}

function stateForOutcome(
  outcomeStatus: AdminQuoteRequestHubSpotManualImportOutcomeStatus
): AdminQuoteRequestCrmHandoffLifecycleState {
  switch (outcomeStatus) {
    case "manual_import_reviewed":
      return "queued_manual_import_reviewed";
    case "manual_import_completed_outside_skr":
      return "queued_manual_import_completed_outside_skr";
    case "manual_import_rejected_needs_correction":
      return "queued_manual_import_rejected_needs_correction";
    case "manual_import_partial_needs_follow_up":
      return "queued_manual_import_partial_needs_follow_up";
  }
}

function getGlobalRecommendedAction({
  queuedRecordCount,
  queuedNeverExportedCount,
  csvExportedNoOutcomeCount,
  csvRejectedNeedsCorrectionCount,
  csvPartialNeedsFollowUpCount,
  preflightNeedsReviewCount,
  staleManifestCount,
  mismatchedManifestCount,
  hasPreflight
}: {
  queuedRecordCount: number;
  queuedNeverExportedCount: number;
  csvExportedNoOutcomeCount: number;
  csvRejectedNeedsCorrectionCount: number;
  csvPartialNeedsFollowUpCount: number;
  preflightNeedsReviewCount: number;
  staleManifestCount: number;
  mismatchedManifestCount: number;
  hasPreflight: boolean;
}): AdminQuoteRequestCrmHandoffLifecycleRecommendedAction {
  if (queuedRecordCount === 0) {
    return "no_queued_records";
  }

  if (
    mismatchedManifestCount > 0 ||
    staleManifestCount > 0 ||
    csvRejectedNeedsCorrectionCount > 0 ||
    preflightNeedsReviewCount > 0
  ) {
    return "review_corrections";
  }

  if (csvPartialNeedsFollowUpCount > 0) {
    return "follow_up_partial_import";
  }

  if (csvExportedNoOutcomeCount > 0) {
    return "record_manual_outcome";
  }

  if (queuedNeverExportedCount > 0) {
    return hasPreflight ? "download_csv" : "run_preflight";
  }

  return "ready_for_future_sync_design";
}

function countRows(
  rows: RowDraft[],
  lifecycleState: AdminQuoteRequestCrmHandoffLifecycleState
) {
  return rows.filter((row) => row.lifecycleState === lifecycleState).length;
}

export function generateAdminQuoteRequestCrmHandoffLifecycleReconciliation(
  input: AdminQuoteRequestCrmHandoffLifecycleReconciliationInput
): AdminQuoteRequestCrmHandoffLifecycleReconciliationReport {
  const limit = getLimit(input);
  const records = input.packet.records.slice(0, limit);
  const currentRecordById = new Map(
    records.map((record) => [record.id, record])
  );
  const currentRecordIds = new Set(currentRecordById.keys());
  const manifests = latestByDate(
    (input.manifests ?? []).slice(0, maxRecentMetadata),
    (manifest) => manifest.generatedAt
  );
  const jsonReviewManifests = manifests.filter(
    (manifest) => manifest.packetKind === "json_review_packet"
  );
  const csvManifests = manifests.filter(
    (manifest) => manifest.packetKind === "hubspot_import_csv"
  );
  const outcomes = latestByDate(
    (input.manualImportOutcomes ?? []).slice(0, maxRecentMetadata),
    (outcome) => outcome.recordedAt
  );
  const manifestById = new Map(manifests.map((manifest) => [manifest.id, manifest]));
  const mismatchedManifestIds = new Set(
    manifests.filter(isManifestMismatch).map((manifest) => manifest.id)
  );

  for (const outcome of outcomes) {
    if (isOutcomeMismatch(outcome, manifestById.get(outcome.manifestId))) {
      mismatchedManifestIds.add(outcome.manifestId);
    }
  }

  const latestJsonManifestByRecordId = new Map<
    string,
    AdminQuoteRequestCrmHandoffPacketManifestRecord
  >();
  const latestCsvManifestByRecordId = new Map<
    string,
    AdminQuoteRequestCrmHandoffPacketManifestRecord
  >();

  for (const manifest of manifests) {
    for (const requestId of manifest.requestIds) {
      if (!latestJsonManifestByRecordId.has(requestId) && manifest.packetKind === "json_review_packet") {
        latestJsonManifestByRecordId.set(requestId, manifest);
      }

      if (!latestCsvManifestByRecordId.has(requestId) && manifest.packetKind === "hubspot_import_csv") {
        latestCsvManifestByRecordId.set(requestId, manifest);
      }
    }
  }

  const preflightIssueByRecordId = new Map(
    (input.preflight?.rowIssues ?? []).map((rowIssue) => [
      rowIssue.quoteRequestId,
      rowIssue
    ])
  );
  const latestOutcomeByRecordId = new Map<
    string,
    AdminQuoteRequestHubSpotManualImportOutcomeRecord
  >();

  for (const outcomeRecord of outcomes) {
    for (const requestId of outcomeRecord.requestIds) {
      if (!latestOutcomeByRecordId.has(requestId)) {
        latestOutcomeByRecordId.set(requestId, outcomeRecord);
      }
    }
  }

  const currentRows: RowDraft[] = records.map((record) => {
    const relatedManifest =
      latestCsvManifestByRecordId.get(record.id) ??
      latestJsonManifestByRecordId.get(record.id);
    const latestOutcome = latestOutcomeByRecordId.get(record.id);
    const hasRelatedMismatch =
      Boolean(relatedManifest && mismatchedManifestIds.has(relatedManifest.id)) ||
      Boolean(latestOutcome && mismatchedManifestIds.has(latestOutcome.manifestId));
    const preflightIssue = preflightIssueByRecordId.get(record.id);
    let lifecycleState: AdminQuoteRequestCrmHandoffLifecycleState;
    let safeIssueCount = 0;

    if (hasRelatedMismatch) {
      lifecycleState = "manifest_metadata_mismatch";
      safeIssueCount = 1;
    } else if (latestOutcome) {
      lifecycleState = stateForOutcome(latestOutcome.outcomeStatus);
    } else if (latestCsvManifestByRecordId.has(record.id)) {
      lifecycleState = "queued_csv_exported_no_outcome";
    } else if (preflightIssue) {
      lifecycleState = "queued_preflight_needs_review";
      safeIssueCount = preflightIssue.issueCount;
    } else {
      lifecycleState = "queued_never_exported";
    }

    return {
      quoteRequestId: record.id,
      publicReference: record.publicReference,
      createdAt: record.createdAt,
      localCrmSyncStatus: "queued",
      lifecycleState,
      ...(relatedManifest ? { relatedManifestId: relatedManifest.id } : {}),
      ...(latestOutcome
        ? { latestOutcomeStatus: latestOutcome.outcomeStatus }
        : {}),
      safeIssueCount,
      recommendedNextAction: actionForState(
        lifecycleState,
        Boolean(input.preflight)
      )
    };
  });
  const staleRows: RowDraft[] = [];
  const staleKeys = new Set<string>();

  for (const manifest of manifests) {
    for (const requestId of manifest.requestIds) {
      if (currentRecordIds.has(requestId)) {
        continue;
      }

      const key = `${requestId}:${manifest.id}`;

      if (staleKeys.has(key)) {
        continue;
      }

      staleKeys.add(key);
      staleRows.push({
        quoteRequestId: requestId,
        localCrmSyncStatus: "queued",
        lifecycleState: "stale_manifest_record_missing",
        relatedManifestId: manifest.id,
        safeIssueCount: 1,
        recommendedNextAction: "review_corrections"
      });
    }
  }

  const rows = [...currentRows, ...staleRows].slice(0, limit);
  const queuedNeverExportedCount = countRows(
    currentRows,
    "queued_never_exported"
  );
  const csvExportedNoOutcomeCount = countRows(
    currentRows,
    "queued_csv_exported_no_outcome"
  );
  const csvExportedReviewedCount = countRows(
    currentRows,
    "queued_manual_import_reviewed"
  );
  const csvCompletedOutsideSkrCount = countRows(
    currentRows,
    "queued_manual_import_completed_outside_skr"
  );
  const csvRejectedNeedsCorrectionCount = countRows(
    currentRows,
    "queued_manual_import_rejected_needs_correction"
  );
  const csvPartialNeedsFollowUpCount = countRows(
    currentRows,
    "queued_manual_import_partial_needs_follow_up"
  );
  const preflightNeedsReviewCount = countRows(
    currentRows,
    "queued_preflight_needs_review"
  );
  const staleManifestCount = staleRows.length;
  const mismatchedManifestCount = mismatchedManifestIds.size;

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    provider: "hubspot",
    localCrmSyncStatus: "queued",
    limit,
    queuedRecordCount: records.length,
    jsonReviewPacketManifestCount: jsonReviewManifests.length,
    hubspotCsvManifestCount: csvManifests.length,
    manualOutcomeCount: outcomes.length,
    queuedNeverExportedCount,
    csvExportedNoOutcomeCount,
    csvExportedReviewedCount,
    csvCompletedOutsideSkrCount,
    csvRejectedNeedsCorrectionCount,
    csvPartialNeedsFollowUpCount,
    preflightNeedsReviewCount,
    staleManifestCount,
    mismatchedManifestCount,
    recommendedNextAction: getGlobalRecommendedAction({
      queuedRecordCount: records.length,
      queuedNeverExportedCount,
      csvExportedNoOutcomeCount,
      csvRejectedNeedsCorrectionCount,
      csvPartialNeedsFollowUpCount,
      preflightNeedsReviewCount,
      staleManifestCount,
      mismatchedManifestCount,
      hasPreflight: Boolean(input.preflight)
    }),
    rows
  };
}
