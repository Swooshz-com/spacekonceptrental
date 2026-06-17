import "server-only";

import {
  generateAdminQuoteRequestCrmHandoffLifecycleReconciliation,
  type AdminQuoteRequestCrmHandoffLifecycleReconciliationReport,
  type AdminQuoteRequestCrmHandoffLifecycleState
} from "./admin-quote-request-crm-handoff-lifecycle-reconciliation";
import type { AdminQuoteRequestCrmHandoffPacket } from "./admin-quote-request-crm-handoff-packet-read";
import type { AdminQuoteRequestCrmHandoffPacketManifestRecord } from "./admin-quote-request-crm-handoff-packet-manifest";
import type {
  AdminQuoteRequestHubSpotImportCsvPreflightIssueType,
  AdminQuoteRequestHubSpotImportCsvPreflightReport
} from "./admin-quote-request-hubspot-import-csv-preflight";
import type {
  AdminQuoteRequestHubSpotManualImportOutcomeRecord,
  AdminQuoteRequestHubSpotManualImportOutcomeStatus
} from "./admin-quote-request-hubspot-manual-import-outcome-ledger";

export const adminQuoteRequestHubSpotSyncDryRunStates = [
  "eligible_for_future_sync",
  "blocked_preflight_needs_review",
  "blocked_missing_required_contact_field",
  "blocked_rejected_needs_correction",
  "blocked_partial_needs_follow_up",
  "blocked_no_manual_outcome",
  "blocked_stale_manifest",
  "blocked_manifest_metadata_mismatch"
] as const;

export type AdminQuoteRequestHubSpotSyncDryRunState =
  (typeof adminQuoteRequestHubSpotSyncDryRunStates)[number];

export const adminQuoteRequestHubSpotSyncDryRunRecommendedActions = [
  "fix_preflight_issues",
  "record_manual_outcome",
  "review_reconciliation",
  "review_dry_run_payload",
  "ready_for_provider_credentials_design",
  "no_eligible_records"
] as const;

export type AdminQuoteRequestHubSpotSyncDryRunRecommendedAction =
  (typeof adminQuoteRequestHubSpotSyncDryRunRecommendedActions)[number];

export type AdminQuoteRequestHubSpotSyncDryRunPayloadPreview = {
  futureContactProperties: Record<string, "presence_only" | "mapped_without_value">;
  futureDealProperties: Record<
    string,
    "presence_only" | "mapped_without_value" | "future_credentials_design"
  >;
  futureAssociations: ["contact_to_deal"];
  futureIdempotencyKey: string;
};

export type AdminQuoteRequestHubSpotSyncDryRunRow = {
  quoteRequestId: string;
  publicReference?: string;
  createdAt?: string;
  localCrmSyncStatus: "queued";
  lifecycleState: AdminQuoteRequestCrmHandoffLifecycleState;
  dryRunState: AdminQuoteRequestHubSpotSyncDryRunState;
  relatedManifestId?: string;
  latestOutcomeStatus?: AdminQuoteRequestHubSpotManualImportOutcomeStatus;
  safeIssueCount: number;
  futureIdempotencyKey: string;
  recommendedNextAction: AdminQuoteRequestHubSpotSyncDryRunRecommendedAction;
  payloadPreview?: AdminQuoteRequestHubSpotSyncDryRunPayloadPreview;
};

export type AdminQuoteRequestHubSpotSyncDryRunContractReport = {
  generatedAt: string;
  provider: "hubspot";
  mode: "dry_run_only";
  localCrmSyncStatus: "queued";
  limit: number;
  totalCandidateCount: number;
  eligibleForFutureSyncCount: number;
  blockedCandidateCount: number;
  needsManualReviewCount: number;
  wouldCreateOrUpdateContactCount: number;
  wouldCreateOrUpdateDealCount: number;
  wouldAssociateDealToContactCount: number;
  idempotencyKeyCount: number;
  recommendedNextAction: AdminQuoteRequestHubSpotSyncDryRunRecommendedAction;
  rows: AdminQuoteRequestHubSpotSyncDryRunRow[];
};

export type AdminQuoteRequestHubSpotSyncDryRunContractInput = {
  generatedAt?: string;
  workspaceId: string;
  limit?: number;
  packet: AdminQuoteRequestCrmHandoffPacket;
  lifecycleReconciliation?: AdminQuoteRequestCrmHandoffLifecycleReconciliationReport;
  manifests?: AdminQuoteRequestCrmHandoffPacketManifestRecord[];
  manualImportOutcomes?: AdminQuoteRequestHubSpotManualImportOutcomeRecord[];
  preflight?: AdminQuoteRequestHubSpotImportCsvPreflightReport;
};

const maxLimit = 100;
const requiredContactIssueTypes = new Set<
  AdminQuoteRequestHubSpotImportCsvPreflightIssueType
>([
  "missing_customer_name",
  "missing_customer_email",
  "invalid_customer_email",
  "missing_customer_phone"
]);

function getLimit(input: AdminQuoteRequestHubSpotSyncDryRunContractInput) {
  if (Number.isInteger(input.limit) && Number(input.limit) > 0) {
    return Math.min(Number(input.limit), maxLimit);
  }

  if (Number.isInteger(input.packet.limit) && input.packet.limit > 0) {
    return Math.min(input.packet.limit, maxLimit);
  }

  return Math.min(input.packet.records.length, maxLimit);
}

export function createAdminQuoteRequestHubSpotSyncDryRunFutureIdempotencyKey({
  workspaceId,
  quoteRequestId
}: {
  workspaceId: string;
  quoteRequestId: string;
}) {
  return `skr_quote_request:${workspaceId}:${quoteRequestId}:hubspot`;
}

function hasRequiredContactIssue(
  issueTypes: AdminQuoteRequestHubSpotImportCsvPreflightIssueType[] | undefined
) {
  return Boolean(
    issueTypes?.some((issueType) => requiredContactIssueTypes.has(issueType))
  );
}

function dryRunStateForLifecycle(
  lifecycleState: AdminQuoteRequestCrmHandoffLifecycleState,
  issueTypes: AdminQuoteRequestHubSpotImportCsvPreflightIssueType[] | undefined
): AdminQuoteRequestHubSpotSyncDryRunState {
  if (lifecycleState === "manifest_metadata_mismatch") {
    return "blocked_manifest_metadata_mismatch";
  }

  if (lifecycleState === "stale_manifest_record_missing") {
    return "blocked_stale_manifest";
  }

  if (hasRequiredContactIssue(issueTypes)) {
    return "blocked_missing_required_contact_field";
  }

  switch (lifecycleState) {
    case "queued_preflight_needs_review":
      return "blocked_preflight_needs_review";
    case "queued_manual_import_rejected_needs_correction":
      return "blocked_rejected_needs_correction";
    case "queued_manual_import_partial_needs_follow_up":
      return "blocked_partial_needs_follow_up";
    case "queued_never_exported":
    case "queued_csv_exported_no_outcome":
      return "blocked_no_manual_outcome";
    case "queued_manual_import_reviewed":
    case "queued_manual_import_completed_outside_skr":
      return "eligible_for_future_sync";
  }
}

function actionForDryRunState(
  dryRunState: AdminQuoteRequestHubSpotSyncDryRunState
): AdminQuoteRequestHubSpotSyncDryRunRecommendedAction {
  switch (dryRunState) {
    case "eligible_for_future_sync":
      return "review_dry_run_payload";
    case "blocked_missing_required_contact_field":
    case "blocked_preflight_needs_review":
    case "blocked_rejected_needs_correction":
      return "fix_preflight_issues";
    case "blocked_no_manual_outcome":
      return "record_manual_outcome";
    case "blocked_partial_needs_follow_up":
    case "blocked_stale_manifest":
    case "blocked_manifest_metadata_mismatch":
      return "review_reconciliation";
  }
}

function payloadPreview(
  futureIdempotencyKey: string
): AdminQuoteRequestHubSpotSyncDryRunPayloadPreview {
  return {
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
    futureIdempotencyKey
  };
}

function recommendedActionForReport(
  rows: AdminQuoteRequestHubSpotSyncDryRunRow[]
): AdminQuoteRequestHubSpotSyncDryRunRecommendedAction {
  const eligibleCount = rows.filter(
    (row) => row.dryRunState === "eligible_for_future_sync"
  ).length;

  if (rows.length === 0) {
    return "no_eligible_records";
  }

  if (
    rows.some((row) =>
      [
        "blocked_missing_required_contact_field",
        "blocked_preflight_needs_review",
        "blocked_rejected_needs_correction"
      ].includes(row.dryRunState)
    )
  ) {
    return "fix_preflight_issues";
  }

  if (
    rows.some((row) =>
      [
        "blocked_partial_needs_follow_up",
        "blocked_stale_manifest",
        "blocked_manifest_metadata_mismatch"
      ].includes(row.dryRunState)
    )
  ) {
    return "review_reconciliation";
  }

  if (rows.some((row) => row.dryRunState === "blocked_no_manual_outcome")) {
    return eligibleCount > 0 ? "review_dry_run_payload" : "record_manual_outcome";
  }

  return "ready_for_provider_credentials_design";
}

export function generateAdminQuoteRequestHubSpotSyncDryRunContract(
  input: AdminQuoteRequestHubSpotSyncDryRunContractInput
): AdminQuoteRequestHubSpotSyncDryRunContractReport {
  const limit = getLimit(input);
  const lifecycleReconciliation =
    input.lifecycleReconciliation ??
    generateAdminQuoteRequestCrmHandoffLifecycleReconciliation({
      generatedAt: input.generatedAt,
      limit,
      packet: input.packet,
      manifests: input.manifests,
      manualImportOutcomes: input.manualImportOutcomes,
      preflight: input.preflight
    });
  const preflightIssueByRecordId = new Map(
    (input.preflight?.rowIssues ?? []).map((rowIssue) => [
      rowIssue.quoteRequestId,
      rowIssue.issueTypes
    ])
  );
  const rows = lifecycleReconciliation.rows.slice(0, limit).map((row) => {
    const futureIdempotencyKey =
      createAdminQuoteRequestHubSpotSyncDryRunFutureIdempotencyKey({
        workspaceId: input.workspaceId,
        quoteRequestId: row.quoteRequestId
      });
    const dryRunState = dryRunStateForLifecycle(
      row.lifecycleState,
      preflightIssueByRecordId.get(row.quoteRequestId)
    );
    const recommendedNextAction = actionForDryRunState(dryRunState);
    const baseRow: AdminQuoteRequestHubSpotSyncDryRunRow = {
      quoteRequestId: row.quoteRequestId,
      ...(row.publicReference ? { publicReference: row.publicReference } : {}),
      ...(row.createdAt ? { createdAt: row.createdAt } : {}),
      localCrmSyncStatus: "queued",
      lifecycleState: row.lifecycleState,
      dryRunState,
      ...(row.relatedManifestId
        ? { relatedManifestId: row.relatedManifestId }
        : {}),
      ...(row.latestOutcomeStatus
        ? { latestOutcomeStatus: row.latestOutcomeStatus }
        : {}),
      safeIssueCount: row.safeIssueCount,
      futureIdempotencyKey,
      recommendedNextAction
    };

    return dryRunState === "eligible_for_future_sync"
      ? {
          ...baseRow,
          payloadPreview: payloadPreview(futureIdempotencyKey)
        }
      : baseRow;
  });
  const eligibleForFutureSyncCount = rows.filter(
    (row) => row.dryRunState === "eligible_for_future_sync"
  ).length;
  const blockedCandidateCount = rows.length - eligibleForFutureSyncCount;

  return {
    generatedAt:
      input.generatedAt ??
      lifecycleReconciliation.generatedAt ??
      new Date().toISOString(),
    provider: "hubspot",
    mode: "dry_run_only",
    localCrmSyncStatus: "queued",
    limit,
    totalCandidateCount: rows.length,
    eligibleForFutureSyncCount,
    blockedCandidateCount,
    needsManualReviewCount: blockedCandidateCount,
    wouldCreateOrUpdateContactCount: eligibleForFutureSyncCount,
    wouldCreateOrUpdateDealCount: eligibleForFutureSyncCount,
    wouldAssociateDealToContactCount: eligibleForFutureSyncCount,
    idempotencyKeyCount: rows.length,
    recommendedNextAction: recommendedActionForReport(rows),
    rows
  };
}
