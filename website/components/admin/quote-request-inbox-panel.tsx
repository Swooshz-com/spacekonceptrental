"use client";

import { useState, type FormEvent } from "react";

type AdminQuoteRequestStatus =
  | "new"
  | "reviewing"
  | "follow_up_needed"
  | "quoted"
  | "closed"
  | "archived";

type AdminQuoteRequestInboxItem = {
  id: string;
  productNameSnapshot: string;
  quantity: number;
  notes?: string;
};

type AdminQuoteRequestInboxActivity = {
  id: string;
  quoteRequestId: string;
  activityType: "status_change" | "internal_note";
  statusFrom?: AdminQuoteRequestStatus;
  statusTo?: AdminQuoteRequestStatus;
  note?: string;
  createdAt: string;
};

type AdminQuoteRequestInboxQuoteRequest = {
  id: string;
  publicReference: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerMessage?: string;
  eventDate?: string;
  venue?: string;
  status: AdminQuoteRequestStatus;
  source: "website" | "chat" | "admin";
  sourcePagePath?: string;
  sourceListingSlug?: string;
  crmProvider?: "hubspot";
  crmSyncStatus?: "not_queued" | "queued" | "synced" | "failed";
  crmContactId?: string;
  crmDealId?: string;
  createdAt: string;
  updatedAt?: string;
  items: AdminQuoteRequestInboxItem[];
  activity: AdminQuoteRequestInboxActivity[];
};

type AdminQuoteRequestInboxReadResult =
  | {
      status: "loaded";
      data: {
        quoteRequests: AdminQuoteRequestInboxQuoteRequest[];
      };
    }
  | {
      status: "unavailable";
    };

type AdminQuoteRequestCrmHandoffPacketManifest = {
  id: string;
  provider: "hubspot";
  packetKind: "json_review_packet" | "hubspot_import_csv";
  statusFilter: "queued";
  limitRequested: number;
  recordCount: number;
  requestIds: string[];
  requestIdCount: number;
  generatedByAdminUserId?: string;
  generatedAt: string;
  source: "protected_admin";
};

const hubSpotManualImportOutcomeStatuses = [
  "manual_import_reviewed",
  "manual_import_completed_outside_skr",
  "manual_import_rejected_needs_correction",
  "manual_import_partial_needs_follow_up"
] as const;

type HubSpotManualImportOutcomeStatus =
  (typeof hubSpotManualImportOutcomeStatuses)[number];

type HubSpotManualImportOutcomeRecord = {
  id: string;
  workspaceId: string;
  manifestId: string;
  provider: "hubspot";
  packetKind: "hubspot_import_csv";
  outcomeStatus: HubSpotManualImportOutcomeStatus;
  recordCount: number;
  requestIds: string[];
  requestIdCount: number;
  recordedByAdminUserId: string;
  recordedAt: string;
  source: "protected_admin";
};

const hubSpotImportCsvPreflightIssueTypes = [
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
] as const;

type HubSpotImportCsvPreflightIssueType =
  (typeof hubSpotImportCsvPreflightIssueTypes)[number];

type HubSpotImportCsvPreflightRowIssue = {
  quoteRequestId: string;
  publicReference?: string;
  issueTypes: HubSpotImportCsvPreflightIssueType[];
  issueCount: number;
  exportable: boolean;
  formulaRiskCellCount: number;
};

type HubSpotImportCsvPreflightReport = {
  generatedAt: string;
  provider: "hubspot";
  localCrmSyncStatus: "queued";
  limit: number;
  totalRecordCount: number;
  exportableRecordCount: number;
  needsReviewRecordCount: number;
  duplicateEmailCount: number;
  duplicatePhoneCount: number;
  formulaRiskCellCount: number;
  issueCountsByType: Record<HubSpotImportCsvPreflightIssueType, number>;
  rowIssues: HubSpotImportCsvPreflightRowIssue[];
};

const crmHandoffLifecycleStates = [
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

type CrmHandoffLifecycleState = (typeof crmHandoffLifecycleStates)[number];

const crmHandoffLifecycleRecommendedActions = [
  "run_preflight",
  "download_csv",
  "record_manual_outcome",
  "review_corrections",
  "follow_up_partial_import",
  "ready_for_future_sync_design",
  "no_queued_records"
] as const;

type CrmHandoffLifecycleRecommendedAction =
  (typeof crmHandoffLifecycleRecommendedActions)[number];

type CrmHandoffLifecycleReconciliationRow = {
  quoteRequestId: string;
  publicReference?: string;
  createdAt?: string;
  localCrmSyncStatus: "queued";
  lifecycleState: CrmHandoffLifecycleState;
  relatedManifestId?: string;
  latestOutcomeStatus?: HubSpotManualImportOutcomeStatus;
  safeIssueCount: number;
  recommendedNextAction: CrmHandoffLifecycleRecommendedAction;
};

type CrmHandoffLifecycleReconciliationReport = {
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
  recommendedNextAction: CrmHandoffLifecycleRecommendedAction;
  rows: CrmHandoffLifecycleReconciliationRow[];
};

type QuoteRequestInboxPanelProps = {
  inbox: AdminQuoteRequestInboxReadResult;
  fetcher?: typeof fetch;
  onMutationComplete?: () => void | Promise<void>;
};

type PanelStatus =
  | {
      kind: "idle";
    }
  | {
      kind: "pending";
      message: string;
    }
  | {
      kind: "success";
      message: string;
    }
  | {
      kind: "error";
      message: string;
    };

const quoteWriteOperation = "quote.write";
const crmHandoffPacketLimit = 25;
const quoteStatuses: AdminQuoteRequestStatus[] = [
  "new",
  "reviewing",
  "follow_up_needed",
  "quoted",
  "closed"
];
const genericFailureMessage =
  "Internal triage status could not be saved. Keep the existing admin review state and try again.";
const genericCrmHandoffFailureMessage =
  "CRM handoff readiness could not be saved. Keep the existing local queue state and try again.";
const genericCrmHandoffPacketFailureMessage =
  "CRM handoff packet could not be prepared. Keep queued records unchanged and try again.";
const genericHubSpotImportCsvFailureMessage =
  "HubSpot import CSV could not be prepared. Keep queued records unchanged and try again.";
const genericHubSpotImportCsvPreflightFailureMessage =
  "HubSpot import CSV preflight could not be prepared. Keep queued records unchanged and try again.";
const genericHubSpotManualImportOutcomeFailureMessage =
  "HubSpot manual import outcome could not be recorded. Records remain queued and unchanged.";
const genericCrmHandoffLifecycleReconciliationFailureMessage =
  "CRM handoff lifecycle reconciliation could not be prepared. Keep queued records unchanged and try again.";
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function statusLabel(value: string) {
  const labels: Record<string, string> = {
    new: "New enquiry",
    reviewing: "Reviewing",
    follow_up_needed: "Follow-up needed",
    quoted: "Quoted",
    closed: "Closed locally",
    archived: "Archived locally"
  };

  return labels[value] ?? value.replace(/_/g, " ");
}

function hasContactMethod(quoteRequest: AdminQuoteRequestInboxQuoteRequest) {
  return Boolean(quoteRequest.customerEmail || quoteRequest.customerPhone);
}

function quoteStatusSummary(
  quoteRequests: AdminQuoteRequestInboxQuoteRequest[]
) {
  return {
    newRequests: quoteRequests.filter((quoteRequest) => quoteRequest.status === "new").length,
    inReview: quoteRequests.filter(
      (quoteRequest) => quoteRequest.status === "reviewing"
    ).length,
    followUpNeeded: quoteRequests.filter(
      (quoteRequest) => quoteRequest.status === "follow_up_needed"
    ).length,
    quoted: quoteRequests.filter((quoteRequest) => quoteRequest.status === "quoted").length,
    closed: quoteRequests.filter(
      (quoteRequest) => quoteRequest.status === "closed"
    ).length,
    missingContact: quoteRequests.filter(
      (quoteRequest) => !hasContactMethod(quoteRequest)
    ).length,
    missingEventDate: quoteRequests.filter(
      (quoteRequest) => !quoteRequest.eventDate
    ).length,
    missingVenue: quoteRequests.filter((quoteRequest) => !quoteRequest.venue)
      .length,
    missingItems: quoteRequests.filter(
      (quoteRequest) => quoteRequest.items.length === 0
    ).length,
    missingCustomerMessage: quoteRequests.filter(
      (quoteRequest) => !quoteRequest.customerMessage
    ).length,
    withoutInternalActivity: quoteRequests.filter(
      (quoteRequest) => quoteRequest.activity.length === 0
    ).length
  };
}

function queuedCrmHandoffCount(
  quoteRequests: AdminQuoteRequestInboxQuoteRequest[]
) {
  return quoteRequests.filter(
    (quoteRequest) =>
      (quoteRequest.crmProvider ?? "hubspot") === "hubspot" &&
      quoteRequest.crmSyncStatus === "queued"
  ).length;
}

function quoteTriageCues(quoteRequest: AdminQuoteRequestInboxQuoteRequest) {
  const hasContact = hasContactMethod(quoteRequest);

  return [
    quoteRequest.customerName ? "Customer name present" : "Missing customer name",
    hasContact ? "At least one contact method present" : "Missing contact method",
    quoteRequest.eventDate ? "Event date known" : "Missing event date",
    quoteRequest.venue ? "Venue or location known" : "Missing venue or location",
    quoteRequest.items.length > 0
      ? `${quoteRequest.items.length} requested ${
          quoteRequest.items.length === 1 ? "item" : "items"
        } - requested ${
          quoteRequest.items.length === 1 ? "listing/item" : "listings/items"
        } present`
      : "No requested items captured - Missing requested listings or items",
    quoteRequest.customerMessage
      ? "Customer message captured - Submitted notes available"
      : "No customer message - Missing setup, access, timing, quantity, or alternate notes",
    quoteRequest.activity.length > 0
      ? "Internal activity recorded"
      : "No internal activity yet"
  ];
}

function quoteResponseReadinessChecklist(
  quoteRequest: AdminQuoteRequestInboxQuoteRequest
) {
  const itemNotes = quoteRequest.items
    .map((item) => item.notes ?? "")
    .join(" ");
  const submittedContext = `${quoteRequest.customerMessage ?? ""} ${itemNotes}`;
  const hasSetupContext = /quantity|quantities|alternate|setup|access|timing|time|delivery|collect|pickup/i.test(
    submittedContext
  );

  return [
    quoteRequest.customerName ? "Ready: customer name present" : "Missing: customer name",
    hasContactMethod(quoteRequest)
      ? "Ready: email or phone contact present"
      : "Missing: email or phone contact",
    quoteRequest.eventDate ? "Ready: event date known" : "Missing: event date",
    quoteRequest.venue
      ? "Ready: venue or location known"
      : "Missing: venue or location",
    quoteRequest.items.length > 0
      ? "Ready: requested listings/items present"
      : "Missing: requested listings/items",
    hasSetupContext
      ? "Review: quantities, alternates, setup, access, or timing notes present"
      : "Missing: quantities, alternates, setup, access, or timing notes",
    "Missing: owner/business facts still need owner-supplied confirmation",
    "Reminder: do not promise availability or response time"
  ];
}

function quoteNextAction(quoteRequest: AdminQuoteRequestInboxQuoteRequest) {
  if (!hasContactMethod(quoteRequest)) {
    return "Next action: capture a contact method before follow-up.";
  }

  if (!quoteRequest.eventDate || !quoteRequest.venue) {
    return "Next action: confirm event date and venue before detailed quote work.";
  }

  if (quoteRequest.items.length === 0) {
    return "Next action: clarify requested items or setup needs with the customer.";
  }

  if (quoteRequest.status === "new") {
    return "Next action: confirm event basics and move to reviewing when triage starts.";
  }

  if (quoteRequest.status === "reviewing") {
    return "Next action: prepare human follow-up and mark follow-up needed when admin review needs direct contact.";
  }

  if (quoteRequest.status === "follow_up_needed") {
    return "Next action: follow up directly outside this app; this status does not contact the customer or sync to CRM.";
  }

  if (quoteRequest.status === "quoted") {
    return "Next action: keep reviewing admin-local context and close locally when no further internal action is needed.";
  }

  return "Next action: closed enquiry is retained for admin reference.";
}

function activityText(activity: AdminQuoteRequestInboxActivity) {
  if (activity.activityType === "internal_note") {
    return activity.note ?? "Internal note recorded.";
  }

  return `Status changed from ${activity.statusFrom ?? "unknown"} to ${activity.statusTo ?? "unknown"} (${statusLabel(activity.statusFrom ?? "unknown")} to ${statusLabel(activity.statusTo ?? "unknown")}).`;
}

function SourceAndCrmHandoffDetails({
  quoteRequest
}: {
  quoteRequest: AdminQuoteRequestInboxQuoteRequest;
}) {
  return (
    <dl className="quote-inbox__details">
      <div>
        <dt>Source path</dt>
        <dd>{quoteRequest.sourcePagePath ?? "No safe source path captured"}</dd>
      </div>
      <div>
        <dt>Requested listing slug</dt>
        <dd>
          {quoteRequest.sourceListingSlug ??
            "No requested listing slug captured"}
        </dd>
      </div>
      <div>
        <dt>CRM handoff placeholder</dt>
        <dd>
          Provider - {quoteRequest.crmProvider ?? "hubspot"}; Sync status -{" "}
          {quoteRequest.crmSyncStatus ?? "not_queued"}
        </dd>
      </div>
      <div>
        <dt>CRM contact ID</dt>
        <dd>{quoteRequest.crmContactId ?? "No CRM contact ID captured"}</dd>
      </div>
      <div>
        <dt>CRM deal ID</dt>
        <dd>{quoteRequest.crmDealId ?? "No CRM deal ID captured"}</dd>
      </div>
    </dl>
  );
}

function crmHandoffStatusLabel(
  status: AdminQuoteRequestInboxQuoteRequest["crmSyncStatus"]
) {
  const labels: Record<string, string> = {
    not_queued: "Not queued locally",
    queued: "Queued locally for future CRM handoff",
    synced: "Synced by a future provider path",
    failed: "Failed local handoff preparation"
  };

  return labels[status ?? "not_queued"] ?? "Not queued locally";
}

function crmHandoffAction(
  quoteRequest: AdminQuoteRequestInboxQuoteRequest
): {
  status: "not_queued" | "queued";
  label: string;
} | null {
  if (quoteRequest.crmSyncStatus === "synced") {
    return null;
  }

  if (quoteRequest.crmSyncStatus === "queued") {
    return {
      status: "not_queued",
      label: "Return to not queued"
    };
  }

  if (quoteRequest.crmSyncStatus === "failed") {
    return {
      status: "queued",
      label: "Prepare retry later"
    };
  }

  return {
    status: "queued",
    label: "Mark ready for CRM handoff"
  };
}

function LocalCrmHandoffPayloadPreview({
  quoteRequest
}: {
  quoteRequest: AdminQuoteRequestInboxQuoteRequest;
}) {
  return (
    <section
      aria-label={`Local CRM handoff payload preview ${quoteRequest.publicReference}`}
      className="quote-inbox__section"
    >
      <h4>Local CRM handoff payload preview</h4>
      <p className="category-management__hint">
        This preview is read-only and bounded. This does not sync to HubSpot or
        contact the customer, call n8n, email anyone, or create provider IDs.
      </p>
      <dl className="quote-inbox__details">
        <div>
          <dt>Future provider</dt>
          <dd>Future provider - hubspot</dd>
        </div>
        <div>
          <dt>Enquiry/request ID</dt>
          <dd>{quoteRequest.id}</dd>
        </div>
        <div>
          <dt>Public reference</dt>
          <dd>{quoteRequest.publicReference}</dd>
        </div>
        <div>
          <dt>Enquiry status</dt>
          <dd>{statusLabel(quoteRequest.status)}</dd>
        </div>
        <div>
          <dt>CRM handoff state</dt>
          <dd>{crmHandoffStatusLabel(quoteRequest.crmSyncStatus)}</dd>
        </div>
        <div>
          <dt>Customer name</dt>
          <dd>{quoteRequest.customerName ?? "No customer name submitted"}</dd>
        </div>
        <div>
          <dt>Customer email</dt>
          <dd>{quoteRequest.customerEmail ?? "No customer email submitted"}</dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>{quoteRequest.customerPhone ?? "No customer phone submitted"}</dd>
        </div>
        <div>
          <dt>Company/event organisation</dt>
          <dd>{quoteRequest.venue ?? "No organisation or venue submitted"}</dd>
        </div>
        <div>
          <dt>Requested listing/source metadata</dt>
          <dd>
            {quoteRequest.sourcePagePath ?? "No safe source path captured"};{" "}
            {quoteRequest.sourceListingSlug ??
              "No requested listing slug captured"}
          </dd>
        </div>
        <div>
          <dt>Created timestamp</dt>
          <dd>{quoteRequest.createdAt}</dd>
        </div>
      </dl>
      <p>
        {quoteRequest.customerMessage ??
          "No customer message was submitted for the future CRM preview."}
      </p>
    </section>
  );
}

async function readSafeJson(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value.trim());
}

function parseManifestRecord(
  value: unknown
): AdminQuoteRequestCrmHandoffPacketManifest | null {
  if (!isRecord(value)) {
    return null;
  }

  const requestIds = Array.isArray(value.requestIds)
    ? value.requestIds.filter(isUuid).map((requestId) => requestId.trim())
    : null;

  if (
    !isUuid(value.id) ||
    value.provider !== "hubspot" ||
    (value.packetKind !== "json_review_packet" &&
      value.packetKind !== "hubspot_import_csv") ||
    value.statusFilter !== "queued" ||
    !Number.isInteger(value.limitRequested) ||
    Number(value.limitRequested) <= 0 ||
    !Number.isInteger(value.recordCount) ||
    Number(value.recordCount) < 0 ||
    !requestIds ||
    !Number.isInteger(value.requestIdCount) ||
    Number(value.requestIdCount) !== requestIds.length ||
    typeof value.generatedAt !== "string" ||
    !value.generatedAt.trim() ||
    value.source !== "protected_admin" ||
    (value.generatedByAdminUserId !== undefined &&
      !isUuid(value.generatedByAdminUserId))
  ) {
    return null;
  }

  return {
    id: value.id.trim(),
    provider: "hubspot",
    packetKind: value.packetKind,
    statusFilter: "queued",
    limitRequested: Number(value.limitRequested),
    recordCount: Number(value.recordCount),
    requestIds,
    requestIdCount: requestIds.length,
    generatedByAdminUserId:
      typeof value.generatedByAdminUserId === "string"
        ? value.generatedByAdminUserId.trim()
        : undefined,
    generatedAt: value.generatedAt.trim(),
    source: "protected_admin"
  };
}

function parseManifestRecords(
  value: unknown
): AdminQuoteRequestCrmHandoffPacketManifest[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const manifests = value.map(parseManifestRecord);

  return manifests.every(Boolean)
    ? (manifests as AdminQuoteRequestCrmHandoffPacketManifest[])
    : null;
}

function isHubSpotManualImportOutcomeStatus(
  value: unknown
): value is HubSpotManualImportOutcomeStatus {
  return hubSpotManualImportOutcomeStatuses.includes(
    value as HubSpotManualImportOutcomeStatus
  );
}

function parseHubSpotManualImportOutcomeRecord(
  value: unknown
): HubSpotManualImportOutcomeRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  const requestIds = Array.isArray(value.requestIds)
    ? value.requestIds.filter(isUuid).map((requestId) => requestId.trim())
    : null;

  if (
    !isUuid(value.id) ||
    !isUuid(value.workspaceId) ||
    !isUuid(value.manifestId) ||
    value.provider !== "hubspot" ||
    value.packetKind !== "hubspot_import_csv" ||
    !isHubSpotManualImportOutcomeStatus(value.outcomeStatus) ||
    !Number.isInteger(value.recordCount) ||
    Number(value.recordCount) < 0 ||
    !requestIds ||
    !Number.isInteger(value.requestIdCount) ||
    Number(value.requestIdCount) < requestIds.length ||
    !isUuid(value.recordedByAdminUserId) ||
    typeof value.recordedAt !== "string" ||
    !value.recordedAt.trim() ||
    value.source !== "protected_admin"
  ) {
    return null;
  }

  return {
    id: value.id.trim(),
    workspaceId: value.workspaceId.trim(),
    manifestId: value.manifestId.trim(),
    provider: "hubspot",
    packetKind: "hubspot_import_csv",
    outcomeStatus: value.outcomeStatus,
    recordCount: Number(value.recordCount),
    requestIds,
    requestIdCount: Number(value.requestIdCount),
    recordedByAdminUserId: value.recordedByAdminUserId.trim(),
    recordedAt: value.recordedAt.trim(),
    source: "protected_admin"
  };
}

function parseHubSpotManualImportOutcomeRecords(
  value: unknown
): HubSpotManualImportOutcomeRecord[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const outcomes = value.map(parseHubSpotManualImportOutcomeRecord);

  return outcomes.every(Boolean)
    ? (outcomes as HubSpotManualImportOutcomeRecord[])
    : null;
}

function isHubSpotImportCsvPreflightIssueType(
  value: unknown
): value is HubSpotImportCsvPreflightIssueType {
  return hubSpotImportCsvPreflightIssueTypes.includes(
    value as HubSpotImportCsvPreflightIssueType
  );
}

function parseNonNegativeInteger(value: unknown) {
  return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : null;
}

function parsePositiveInteger(value: unknown) {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : null;
}

function parseIssueCounts(
  value: unknown
): Record<HubSpotImportCsvPreflightIssueType, number> | null {
  if (!isRecord(value)) {
    return null;
  }

  const counts = {} as Record<HubSpotImportCsvPreflightIssueType, number>;

  for (const issueType of hubSpotImportCsvPreflightIssueTypes) {
    const count = parseNonNegativeInteger(value[issueType]);

    if (count === null) {
      return null;
    }

    counts[issueType] = count;
  }

  return counts;
}

function parsePreflightRowIssue(
  value: unknown
): HubSpotImportCsvPreflightRowIssue | null {
  if (!isRecord(value) || !isUuid(value.quoteRequestId)) {
    return null;
  }

  const rawIssueTypes = Array.isArray(value.issueTypes)
    ? value.issueTypes
    : null;
  const issueTypes = rawIssueTypes
    ? rawIssueTypes.filter(isHubSpotImportCsvPreflightIssueType)
    : null;
  const issueCount = parseNonNegativeInteger(value.issueCount);
  const formulaRiskCellCount = parseNonNegativeInteger(
    value.formulaRiskCellCount
  );

  if (
    !issueTypes ||
    issueTypes.length === 0 ||
    !rawIssueTypes ||
    issueTypes.length !== rawIssueTypes.length ||
    issueCount === null ||
    formulaRiskCellCount === null ||
    typeof value.exportable !== "boolean" ||
    (value.publicReference !== undefined &&
      (typeof value.publicReference !== "string" ||
        !value.publicReference.trim()))
  ) {
    return null;
  }

  return {
    quoteRequestId: value.quoteRequestId.trim(),
    ...(typeof value.publicReference === "string"
      ? { publicReference: value.publicReference.trim() }
      : {}),
    issueTypes,
    issueCount,
    exportable: value.exportable,
    formulaRiskCellCount
  };
}

function parseHubSpotImportCsvPreflightReport(
  value: unknown
): HubSpotImportCsvPreflightReport | null {
  if (!isRecord(value)) {
    return null;
  }

  const limit = parsePositiveInteger(value.limit);
  const totalRecordCount = parseNonNegativeInteger(value.totalRecordCount);
  const exportableRecordCount = parseNonNegativeInteger(
    value.exportableRecordCount
  );
  const needsReviewRecordCount = parseNonNegativeInteger(
    value.needsReviewRecordCount
  );
  const duplicateEmailCount = parseNonNegativeInteger(
    value.duplicateEmailCount
  );
  const duplicatePhoneCount = parseNonNegativeInteger(
    value.duplicatePhoneCount
  );
  const formulaRiskCellCount = parseNonNegativeInteger(
    value.formulaRiskCellCount
  );
  const issueCountsByType = parseIssueCounts(value.issueCountsByType);
  const rowIssues = Array.isArray(value.rowIssues)
    ? value.rowIssues.map(parsePreflightRowIssue)
    : null;

  if (
    typeof value.generatedAt !== "string" ||
    !value.generatedAt.trim() ||
    value.provider !== "hubspot" ||
    value.localCrmSyncStatus !== "queued" ||
    limit === null ||
    totalRecordCount === null ||
    exportableRecordCount === null ||
    needsReviewRecordCount === null ||
    duplicateEmailCount === null ||
    duplicatePhoneCount === null ||
    formulaRiskCellCount === null ||
    !issueCountsByType ||
    !rowIssues ||
    rowIssues.some((rowIssue) => !rowIssue) ||
    rowIssues.length > limit
  ) {
    return null;
  }

  return {
    generatedAt: value.generatedAt.trim(),
    provider: "hubspot",
    localCrmSyncStatus: "queued",
    limit,
    totalRecordCount,
    exportableRecordCount,
    needsReviewRecordCount,
    duplicateEmailCount,
    duplicatePhoneCount,
    formulaRiskCellCount,
    issueCountsByType,
    rowIssues: rowIssues as HubSpotImportCsvPreflightRowIssue[]
  };
}

function isCrmHandoffLifecycleState(
  value: unknown
): value is CrmHandoffLifecycleState {
  return crmHandoffLifecycleStates.includes(
    value as CrmHandoffLifecycleState
  );
}

function isCrmHandoffLifecycleRecommendedAction(
  value: unknown
): value is CrmHandoffLifecycleRecommendedAction {
  return crmHandoffLifecycleRecommendedActions.includes(
    value as CrmHandoffLifecycleRecommendedAction
  );
}

function parseOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

type ParsedCrmHandoffLifecycleCounts = Pick<
  CrmHandoffLifecycleReconciliationReport,
  | "queuedRecordCount"
  | "jsonReviewPacketManifestCount"
  | "hubspotCsvManifestCount"
  | "manualOutcomeCount"
  | "queuedNeverExportedCount"
  | "csvExportedNoOutcomeCount"
  | "csvExportedReviewedCount"
  | "csvCompletedOutsideSkrCount"
  | "csvRejectedNeedsCorrectionCount"
  | "csvPartialNeedsFollowUpCount"
  | "preflightNeedsReviewCount"
  | "staleManifestCount"
  | "mismatchedManifestCount"
>;

function hasParsedCrmHandoffLifecycleCounts(
  counts: Record<keyof ParsedCrmHandoffLifecycleCounts, number | null>
): counts is ParsedCrmHandoffLifecycleCounts {
  return Object.values(counts).every((count) => count !== null);
}

function parseCrmHandoffLifecycleReconciliationRow(
  value: unknown
): CrmHandoffLifecycleReconciliationRow | null {
  if (!isRecord(value)) {
    return null;
  }

  const safeIssueCount = parseNonNegativeInteger(value.safeIssueCount);

  if (
    !isUuid(value.quoteRequestId) ||
    value.localCrmSyncStatus !== "queued" ||
    !isCrmHandoffLifecycleState(value.lifecycleState) ||
    safeIssueCount === null ||
    !isCrmHandoffLifecycleRecommendedAction(value.recommendedNextAction) ||
    (value.relatedManifestId !== undefined &&
      !isUuid(value.relatedManifestId)) ||
    (value.latestOutcomeStatus !== undefined &&
      !isHubSpotManualImportOutcomeStatus(value.latestOutcomeStatus))
  ) {
    return null;
  }

  return {
    quoteRequestId: value.quoteRequestId.trim(),
    ...(parseOptionalString(value.publicReference)
      ? { publicReference: parseOptionalString(value.publicReference) }
      : {}),
    ...(parseOptionalString(value.createdAt)
      ? { createdAt: parseOptionalString(value.createdAt) }
      : {}),
    localCrmSyncStatus: "queued",
    lifecycleState: value.lifecycleState,
    ...(typeof value.relatedManifestId === "string"
      ? { relatedManifestId: value.relatedManifestId.trim() }
      : {}),
    ...(isHubSpotManualImportOutcomeStatus(value.latestOutcomeStatus)
      ? { latestOutcomeStatus: value.latestOutcomeStatus }
      : {}),
    safeIssueCount,
    recommendedNextAction: value.recommendedNextAction
  };
}

function parseCrmHandoffLifecycleReconciliationReport(
  value: unknown
): CrmHandoffLifecycleReconciliationReport | null {
  if (!isRecord(value)) {
    return null;
  }

  const limit = parsePositiveInteger(value.limit);
  const rows = Array.isArray(value.rows)
    ? value.rows.map(parseCrmHandoffLifecycleReconciliationRow)
    : null;
  const counts = {
    queuedRecordCount: parseNonNegativeInteger(value.queuedRecordCount),
    jsonReviewPacketManifestCount: parseNonNegativeInteger(
      value.jsonReviewPacketManifestCount
    ),
    hubspotCsvManifestCount: parseNonNegativeInteger(
      value.hubspotCsvManifestCount
    ),
    manualOutcomeCount: parseNonNegativeInteger(value.manualOutcomeCount),
    queuedNeverExportedCount: parseNonNegativeInteger(
      value.queuedNeverExportedCount
    ),
    csvExportedNoOutcomeCount: parseNonNegativeInteger(
      value.csvExportedNoOutcomeCount
    ),
    csvExportedReviewedCount: parseNonNegativeInteger(
      value.csvExportedReviewedCount
    ),
    csvCompletedOutsideSkrCount: parseNonNegativeInteger(
      value.csvCompletedOutsideSkrCount
    ),
    csvRejectedNeedsCorrectionCount: parseNonNegativeInteger(
      value.csvRejectedNeedsCorrectionCount
    ),
    csvPartialNeedsFollowUpCount: parseNonNegativeInteger(
      value.csvPartialNeedsFollowUpCount
    ),
    preflightNeedsReviewCount: parseNonNegativeInteger(
      value.preflightNeedsReviewCount
    ),
    staleManifestCount: parseNonNegativeInteger(value.staleManifestCount),
    mismatchedManifestCount: parseNonNegativeInteger(
      value.mismatchedManifestCount
    )
  };

  if (
    typeof value.generatedAt !== "string" ||
    !value.generatedAt.trim() ||
    value.provider !== "hubspot" ||
    value.localCrmSyncStatus !== "queued" ||
    limit === null ||
    !rows ||
    rows.some((row) => !row) ||
    rows.length > limit ||
    !isCrmHandoffLifecycleRecommendedAction(value.recommendedNextAction) ||
    !hasParsedCrmHandoffLifecycleCounts(counts)
  ) {
    return null;
  }

  return {
    generatedAt: value.generatedAt.trim(),
    provider: "hubspot",
    localCrmSyncStatus: "queued",
    limit,
    queuedRecordCount: counts.queuedRecordCount,
    jsonReviewPacketManifestCount: counts.jsonReviewPacketManifestCount,
    hubspotCsvManifestCount: counts.hubspotCsvManifestCount,
    manualOutcomeCount: counts.manualOutcomeCount,
    queuedNeverExportedCount: counts.queuedNeverExportedCount,
    csvExportedNoOutcomeCount: counts.csvExportedNoOutcomeCount,
    csvExportedReviewedCount: counts.csvExportedReviewedCount,
    csvCompletedOutsideSkrCount: counts.csvCompletedOutsideSkrCount,
    csvRejectedNeedsCorrectionCount: counts.csvRejectedNeedsCorrectionCount,
    csvPartialNeedsFollowUpCount: counts.csvPartialNeedsFollowUpCount,
    preflightNeedsReviewCount: counts.preflightNeedsReviewCount,
    staleManifestCount: counts.staleManifestCount,
    mismatchedManifestCount: counts.mismatchedManifestCount,
    recommendedNextAction: value.recommendedNextAction,
    rows: rows as CrmHandoffLifecycleReconciliationRow[]
  };
}

function preflightIssueLabel(
  issueType: HubSpotImportCsvPreflightIssueType
) {
  const labels: Record<HubSpotImportCsvPreflightIssueType, string> = {
    missing_customer_name: "Missing customer name",
    missing_customer_email: "Missing customer email",
    invalid_customer_email: "Invalid customer email",
    missing_customer_phone: "Missing customer phone",
    duplicate_customer_email_in_batch: "Duplicate customer email in batch",
    duplicate_customer_phone_in_batch: "Duplicate customer phone in batch",
    missing_message_details: "Missing message details",
    message_details_too_long: "Message details too long",
    missing_public_reference: "Missing public reference",
    missing_created_at: "Missing created at",
    csv_formula_risk_sanitised: "CSV formula-risk sanitised",
    missing_source_context: "Missing source context"
  };

  return labels[issueType];
}

function manualImportOutcomeLabel(status: HubSpotManualImportOutcomeStatus) {
  const labels: Record<HubSpotManualImportOutcomeStatus, string> = {
    manual_import_reviewed: "Manual import reviewed",
    manual_import_completed_outside_skr:
      "Manual import completed outside SKR",
    manual_import_rejected_needs_correction:
      "Manual import rejected / needs correction",
    manual_import_partial_needs_follow_up:
      "Partial import / needs follow-up"
  };

  return labels[status];
}

function crmHandoffLifecycleStateLabel(state: CrmHandoffLifecycleState) {
  const labels: Record<CrmHandoffLifecycleState, string> = {
    queued_never_exported: "Queued - never exported",
    queued_preflight_needs_review: "Queued - preflight needs review",
    queued_csv_exported_no_outcome: "Queued - CSV exported, no outcome",
    queued_manual_import_reviewed: "Queued - manual import reviewed",
    queued_manual_import_completed_outside_skr:
      "Queued - completed outside SKR",
    queued_manual_import_rejected_needs_correction:
      "Queued - rejected / needs correction",
    queued_manual_import_partial_needs_follow_up:
      "Queued - partial / needs follow-up",
    stale_manifest_record_missing: "Stale manifest record missing",
    manifest_metadata_mismatch: "Manifest metadata mismatch"
  };

  return labels[state];
}

function crmHandoffLifecycleActionLabel(
  action: CrmHandoffLifecycleRecommendedAction
) {
  const labels: Record<CrmHandoffLifecycleRecommendedAction, string> = {
    run_preflight: "Run CSV preflight",
    download_csv: "Download CSV",
    record_manual_outcome: "Record manual outcome",
    review_corrections: "Review corrections",
    follow_up_partial_import: "Follow up partial import",
    ready_for_future_sync_design: "Ready for future sync design",
    no_queued_records: "No queued records"
  };

  return labels[action];
}

function parseQuoteStatus(value: string): AdminQuoteRequestStatus | null {
  return quoteStatuses.includes(value as AdminQuoteRequestStatus)
    ? (value as AdminQuoteRequestStatus)
    : null;
}

async function requestQuoteWriteProof(fetcher: typeof fetch) {
  const response = await fetcher("/api/admin/csrf-proof", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      requestedOperation: quoteWriteOperation,
      operation: quoteWriteOperation
    })
  });

  if (!response.ok) {
    return null;
  }

  const body = await readSafeJson(response);

  if (
    !isRecord(body) ||
    body.ok !== true ||
    typeof body.csrfProof !== "string" ||
    !body.csrfProof.trim()
  ) {
    return null;
  }

  return body.csrfProof;
}

function reloadDashboard() {
  if (typeof window !== "undefined") {
    window.location.reload();
  }
}

async function triggerCsvDownload(response: Response) {
  const csvText = await response.text();
  const contentDisposition = response.headers.get("content-disposition") ?? "";
  const filenameMatch = contentDisposition.match(/filename="([^"]+)"/i);
  const filename =
    filenameMatch?.[1] ?? "skr-hubspot-import-queued-enquiries.csv";

  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    typeof URL.createObjectURL !== "function"
  ) {
    return;
  }

  const href = URL.createObjectURL(
    new Blob([csvText], {
      type: "text/csv;charset=utf-8"
    })
  );
  const anchor = document.createElement("a");

  anchor.href = href;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();
  URL.revokeObjectURL(href);
}

function QuoteIntakeParityHelper() {
  const references = [
    "docs/OWNER-HANDOFF-BUNDLE.md",
    "docs/content/LOCAL-LISTING-DETAIL-READINESS.md",
    "docs/content/LOCAL-PUBLIC-JOURNEY-ACCEPTANCE.md",
    "docs/content/LOCAL-QUOTE-ENQUIRY-INTAKE-READINESS.md",
    "docs/content/LOCAL-QUOTE-TRIAGE-READINESS.md"
  ];

  return (
    <section
      aria-label="Protected quote intake parity helper"
      className="admin-dashboard__card admin-dashboard__card--summary"
    >
      <h3>Quote intake parity helper</h3>
      <p>
        Authorised admins can compare public quote/enquiry intake with protected
        triage expectations. This helper stays inside the admin workspace and
        records no owner approval, evidence, provider setup, or deployment
        approval.
      </p>
      <dl className="quote-inbox__details">
        <div>
          <dt>Public intake fields</dt>
          <dd>
            Name, email or phone, event date if known, venue if known,
            requested listings or items, quantities, alternates, setup, access,
            timing notes, and contact preference.
          </dd>
        </div>
        <div>
          <dt>Context handoff sources</dt>
          <dd>
            Listing, category, event-use, and search context may start editable
            request text only; admins should treat it as customer-submitted
            context to review.
          </dd>
        </div>
        <div>
          <dt>Receipt/reference boundary</dt>
          <dd>
            Public references are receipt-only. They are not public status
            lookup, accepted outcomes, rental-fit decisions, or response
            promises.
          </dd>
        </div>
        <div>
          <dt>Admin triage expectations</dt>
          <dd>
            Review contact, event, venue, requested item, quantity, alternate,
            setup, access, and timing gaps before direct follow-up. Do not
            promise availability, and do not treat the public reference as
            tracking.
          </dd>
        </div>
        <div>
          <dt>Owner inputs still missing</dt>
          <dd>
            Owner-supplied contact, service-area, legal, policy, operating,
            content, and launch facts remain absent until supplied separately.
          </dd>
        </div>
        <div>
          <dt>Claims still blocked</dt>
          <dd>
            No invented facts, fit promises, response promises, public status
            views, sales flows, sign-in areas, file intake, outbound automation,
            provider setup, or deployment evidence.
          </dd>
        </div>
      </dl>
      <ul className="admin-dashboard__list">
        {references.map((reference) => (
          <li key={reference}>{reference}</li>
        ))}
      </ul>
    </section>
  );
}

function CrmHandoffPacketManifestList({
  manifests,
  onRecordManualImportOutcome,
  pending
}: {
  manifests: AdminQuoteRequestCrmHandoffPacketManifest[];
  onRecordManualImportOutcome: (
    manifestId: string,
    outcomeStatus: HubSpotManualImportOutcomeStatus
  ) => void;
  pending: boolean;
}) {
  return (
    <section
      aria-label="Recent CRM handoff packet manifests"
      className="quote-inbox__section"
    >
      <h4>Recent CRM handoff packet manifests</h4>
      <p className="category-management__hint">
        Audit/manifest only. These records describe prepared packet metadata
        and do not store full customer messages. They do not sync to HubSpot,
        do not call n8n, do not send email, do not contact customers, do not
        create provider IDs, do not mark records as synced, and do not set sync
        timestamps.
      </p>
      {manifests.length === 0 ? (
        <p>No CRM handoff packet manifests loaded yet.</p>
      ) : (
        <ul className="admin-dashboard__list">
          {manifests.map((manifest) => (
            <li key={manifest.id}>
              <dl className="quote-inbox__details">
                <div>
                  <dt>Generated timestamp</dt>
                  <dd>{manifest.generatedAt}</dd>
                </div>
                <div>
                  <dt>Provider</dt>
                  <dd>{manifest.provider}</dd>
                </div>
                <div>
                  <dt>Status filter</dt>
                  <dd>{manifest.statusFilter}</dd>
                </div>
                <div>
                  <dt>Record count</dt>
                  <dd>{manifest.recordCount}</dd>
                </div>
                <div>
                  <dt>Limit</dt>
                  <dd>{manifest.limitRequested}</dd>
                </div>
                <div>
                  <dt>Source/kind</dt>
                  <dd>
                    {manifest.source}; {manifest.packetKind}
                  </dd>
                </div>
                <div>
                  <dt>Request IDs</dt>
                  <dd>
                    Request IDs: {manifest.requestIdCount}
                    {manifest.requestIds.length > 0
                      ? ` - ${manifest.requestIds.join(", ")}`
                      : ""}
                  </dd>
                </div>
                <div>
                  <dt>Admin identity</dt>
                  <dd>
                    {manifest.generatedByAdminUserId
                      ? `Admin: ${manifest.generatedByAdminUserId}`
                      : "Admin identity unavailable"}
                  </dd>
                </div>
              </dl>
              {manifest.packetKind === "hubspot_import_csv" ? (
                <div className="hero__actions">
                  <button
                    aria-label={`Mark manual import reviewed for manifest ${manifest.id}`}
                    className="button button--secondary"
                    disabled={pending}
                    onClick={() =>
                      onRecordManualImportOutcome(
                        manifest.id,
                        "manual_import_reviewed"
                      )
                    }
                    type="button"
                  >
                    Mark manual import reviewed
                  </button>
                  <button
                    aria-label={`Mark manual import completed outside SKR for manifest ${manifest.id}`}
                    className="button button--secondary"
                    disabled={pending}
                    onClick={() =>
                      onRecordManualImportOutcome(
                        manifest.id,
                        "manual_import_completed_outside_skr"
                      )
                    }
                    type="button"
                  >
                    Mark manual import completed outside SKR
                  </button>
                  <button
                    aria-label={`Mark manual import rejected needs correction for manifest ${manifest.id}`}
                    className="button button--secondary"
                    disabled={pending}
                    onClick={() =>
                      onRecordManualImportOutcome(
                        manifest.id,
                        "manual_import_rejected_needs_correction"
                      )
                    }
                    type="button"
                  >
                    Mark manual import rejected / needs correction
                  </button>
                  <button
                    aria-label={`Mark partial import needs follow-up for manifest ${manifest.id}`}
                    className="button button--secondary"
                    disabled={pending}
                    onClick={() =>
                      onRecordManualImportOutcome(
                        manifest.id,
                        "manual_import_partial_needs_follow_up"
                      )
                    }
                    type="button"
                  >
                    Mark partial import / needs follow-up
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function HubSpotManualImportOutcomeLedger({
  outcomes
}: {
  outcomes: HubSpotManualImportOutcomeRecord[];
}) {
  return (
    <section
      aria-label="Recent HubSpot manual import outcomes"
      className="quote-inbox__section"
    >
      <h4>Recent HubSpot manual import outcomes</h4>
      <p className="category-management__hint">
        Local audit only. Records remain queued. No HubSpot sync occurs. No
        provider IDs are created. No sync timestamp is set. This does not
        mutate enquiry records. No freeform notes are stored.
      </p>
      {outcomes.length === 0 ? (
        <p>No HubSpot manual import outcomes recorded yet.</p>
      ) : (
        <ul className="admin-dashboard__list">
          {outcomes.map((outcome) => (
            <li key={outcome.id}>
              <dl className="quote-inbox__details">
                <div>
                  <dt>Recorded timestamp</dt>
                  <dd>{outcome.recordedAt}</dd>
                </div>
                <div>
                  <dt>Outcome status</dt>
                  <dd>{manualImportOutcomeLabel(outcome.outcomeStatus)}</dd>
                </div>
                <div>
                  <dt>Provider/kind</dt>
                  <dd>
                    {outcome.provider}; {outcome.packetKind}
                  </dd>
                </div>
                <div>
                  <dt>Record count</dt>
                  <dd>{outcome.recordCount}</dd>
                </div>
                <div>
                  <dt>Request IDs</dt>
                  <dd>
                    Request IDs: {outcome.requestIdCount}
                    {outcome.requestIds.length > 0
                      ? ` - ${outcome.requestIds.join(", ")}`
                      : ""}
                  </dd>
                </div>
                <div>
                  <dt>Manifest</dt>
                  <dd>{outcome.manifestId}</dd>
                </div>
                <div>
                  <dt>Recorded by</dt>
                  <dd>Admin: {outcome.recordedByAdminUserId}</dd>
                </div>
                <div>
                  <dt>Source</dt>
                  <dd>{outcome.source}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function HubSpotImportCsvPreflightSummary({
  report
}: {
  report: HubSpotImportCsvPreflightReport;
}) {
  return (
    <section
      aria-label="HubSpot import CSV preflight summary"
      className="quote-inbox__section"
    >
      <h4>HubSpot import CSV preflight summary</h4>
      <p className="category-management__hint">
        Manual import/export readiness only. Records remain queued. No HubSpot
        sync occurs. No provider IDs are created. No sync timestamp is set. CSV
        formula-risk cells are sanitised during export.
      </p>
      <dl className="admin-dashboard__stats">
        <div>
          <dt>Total queued records checked</dt>
          <dd>{report.totalRecordCount}</dd>
        </div>
        <div>
          <dt>Exportable records</dt>
          <dd>{report.exportableRecordCount}</dd>
        </div>
        <div>
          <dt>Needs review records</dt>
          <dd>{report.needsReviewRecordCount}</dd>
        </div>
        <div>
          <dt>Duplicate emails</dt>
          <dd>{report.duplicateEmailCount}</dd>
        </div>
        <div>
          <dt>Duplicate phones</dt>
          <dd>{report.duplicatePhoneCount}</dd>
        </div>
        <div>
          <dt>Formula-risk cells sanitised</dt>
          <dd>{report.formulaRiskCellCount}</dd>
        </div>
      </dl>
      {report.rowIssues.length === 0 ? (
        <p>No CSV preflight issues found for the checked queued records.</p>
      ) : (
        <ul className="admin-dashboard__list">
          {report.rowIssues.map((rowIssue) => (
            <li key={rowIssue.quoteRequestId}>
              <strong>
                {rowIssue.publicReference ??
                  `Quote request ${rowIssue.quoteRequestId}`}
              </strong>
              <span>
                {" "}
                - {rowIssue.exportable ? "Exportable with review" : "Needs admin review"}; issues:{" "}
                {rowIssue.issueTypes.map(preflightIssueLabel).join(", ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CrmHandoffLifecycleReconciliationSummary({
  report
}: {
  report: CrmHandoffLifecycleReconciliationReport;
}) {
  return (
    <section
      aria-label="CRM handoff lifecycle reconciliation summary"
      className="quote-inbox__section"
    >
      <h4>CRM handoff lifecycle reconciliation summary</h4>
      <p className="category-management__hint">
        Local reconciliation only. Records remain queued. No HubSpot sync
        occurs. No provider IDs are created. No sync timestamp is set. This
        does not mutate enquiry records.
      </p>
      <dl className="admin-dashboard__stats">
        <div>
          <dt>Queued records checked</dt>
          <dd>{report.queuedRecordCount}</dd>
        </div>
        <div>
          <dt>JSON packet manifests</dt>
          <dd>{report.jsonReviewPacketManifestCount}</dd>
        </div>
        <div>
          <dt>HubSpot CSV manifests</dt>
          <dd>{report.hubspotCsvManifestCount}</dd>
        </div>
        <div>
          <dt>Manual outcomes</dt>
          <dd>{report.manualOutcomeCount}</dd>
        </div>
        <div>
          <dt>Never exported</dt>
          <dd>{report.queuedNeverExportedCount}</dd>
        </div>
        <div>
          <dt>CSV exported, no outcome</dt>
          <dd>{report.csvExportedNoOutcomeCount}</dd>
        </div>
        <div>
          <dt>Reviewed/completed</dt>
          <dd>
            {report.csvExportedReviewedCount +
              report.csvCompletedOutsideSkrCount}
          </dd>
        </div>
        <div>
          <dt>Needs correction/follow-up</dt>
          <dd>
            {report.csvRejectedNeedsCorrectionCount +
              report.csvPartialNeedsFollowUpCount +
              report.preflightNeedsReviewCount}
          </dd>
        </div>
        <div>
          <dt>Stale/mismatched metadata</dt>
          <dd>
            {report.staleManifestCount + report.mismatchedManifestCount}
          </dd>
        </div>
        <div>
          <dt>Recommended next action</dt>
          <dd>
            {crmHandoffLifecycleActionLabel(report.recommendedNextAction)}
          </dd>
        </div>
      </dl>
      {report.rows.length === 0 ? (
        <p>No queued lifecycle rows need admin review.</p>
      ) : (
        <ul className="admin-dashboard__list">
          {report.rows.map((row) => (
            <li key={`${row.quoteRequestId}-${row.lifecycleState}`}>
              <strong>
                {row.publicReference ?? `Quote request ${row.quoteRequestId}`}
              </strong>
              <span>
                {" "}
                - {crmHandoffLifecycleStateLabel(row.lifecycleState)}; action:{" "}
                {crmHandoffLifecycleActionLabel(row.recommendedNextAction)}
              </span>
              <dl className="quote-inbox__details">
                <div>
                  <dt>Created at</dt>
                  <dd>{row.createdAt ?? "Not available in current queue"}</dd>
                </div>
                <div>
                  <dt>Local CRM sync status</dt>
                  <dd>{row.localCrmSyncStatus}</dd>
                </div>
                <div>
                  <dt>Related manifest</dt>
                  <dd>{row.relatedManifestId ?? "No manifest yet"}</dd>
                </div>
                <div>
                  <dt>Latest outcome</dt>
                  <dd>
                    {row.latestOutcomeStatus
                      ? manualImportOutcomeLabel(row.latestOutcomeStatus)
                      : "No manual outcome recorded"}
                  </dd>
                </div>
                <div>
                  <dt>Safe issue count</dt>
                  <dd>{row.safeIssueCount}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function QuoteRequestInboxPanel({
  inbox,
  fetcher = fetch,
  onMutationComplete = reloadDashboard
}: QuoteRequestInboxPanelProps) {
  const [status, setStatus] = useState<PanelStatus>({
    kind: "idle"
  });
  const [crmHandoffPacketPreview, setCrmHandoffPacketPreview] = useState<
    string | null
  >(null);
  const [crmHandoffPacketManifests, setCrmHandoffPacketManifests] = useState<
    AdminQuoteRequestCrmHandoffPacketManifest[]
  >([]);
  const [
    hubSpotImportCsvPreflightReport,
    setHubSpotImportCsvPreflightReport
  ] = useState<HubSpotImportCsvPreflightReport | null>(null);
  const [
    crmHandoffLifecycleReconciliationReport,
    setCrmHandoffLifecycleReconciliationReport
  ] = useState<CrmHandoffLifecycleReconciliationReport | null>(null);
  const [
    hubSpotManualImportOutcomes,
    setHubSpotManualImportOutcomes
  ] = useState<HubSpotManualImportOutcomeRecord[]>([]);

  async function submitStatusChange(
    quoteRequestId: string,
    nextStatus: AdminQuoteRequestStatus
  ) {
    setStatus({
      kind: "pending",
      message: "Updating internal triage status..."
    });

    try {
      const csrfProof = await requestQuoteWriteProof(fetcher);

      if (!csrfProof) {
        setStatus({
          kind: "error",
          message: genericFailureMessage
        });
        return;
      }

      const response = await fetcher(
        `/api/admin/quote-requests/${encodeURIComponent(quoteRequestId)}/status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-proof": csrfProof
          },
          body: JSON.stringify({
            status: nextStatus
          })
        }
      );
      const responseBody = await readSafeJson(response);

      if (!response.ok || !isRecord(responseBody) || responseBody.ok !== true) {
        setStatus({
          kind: "error",
          message: genericFailureMessage
        });
        return;
      }

      setStatus({
        kind: "success",
        message: "Status updated for admin review. Refreshing dashboard."
      });

      try {
        await onMutationComplete();
      } catch {
        // Keep the rendered result generic even if the refresh hook is unavailable.
      }
    } catch {
      setStatus({
        kind: "error",
        message: genericFailureMessage
      });
    }
  }

  async function submitCrmHandoffStatusChange(
    quoteRequestId: string,
    nextCrmSyncStatus: "not_queued" | "queued" | "failed"
  ) {
    setStatus({
      kind: "pending",
      message: "Updating local CRM handoff readiness..."
    });

    try {
      const csrfProof = await requestQuoteWriteProof(fetcher);

      if (!csrfProof) {
        setStatus({
          kind: "error",
          message: genericCrmHandoffFailureMessage
        });
        return;
      }

      const response = await fetcher(
        `/api/admin/quote-requests/${encodeURIComponent(quoteRequestId)}/crm-handoff`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-proof": csrfProof
          },
          body: JSON.stringify({
            crmSyncStatus: nextCrmSyncStatus
          })
        }
      );
      const responseBody = await readSafeJson(response);

      if (!response.ok || !isRecord(responseBody) || responseBody.ok !== true) {
        setStatus({
          kind: "error",
          message: genericCrmHandoffFailureMessage
        });
        return;
      }

      setStatus({
        kind: "success",
        message:
          nextCrmSyncStatus === "queued"
            ? "Queued locally for future CRM handoff. Refreshing dashboard."
            : "Returned to not queued for local CRM handoff. Refreshing dashboard."
      });

      try {
        await onMutationComplete();
      } catch {
        // Keep the rendered result generic even if the refresh hook is unavailable.
      }
    } catch {
      setStatus({
        kind: "error",
        message: genericCrmHandoffFailureMessage
      });
    }
  }

  async function reviewCrmHandoffPacket() {
    setStatus({
      kind: "pending",
      message: "Preparing queued CRM handoff packet..."
    });
    setCrmHandoffPacketPreview(null);

    try {
      const csrfProof = await requestQuoteWriteProof(fetcher);

      if (!csrfProof) {
        setStatus({
          kind: "error",
          message: genericCrmHandoffPacketFailureMessage
        });
        return;
      }

      const response = await fetcher(
        `/api/admin/quote-requests/crm-handoff-packet?limit=${crmHandoffPacketLimit}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "x-csrf-proof": csrfProof
          }
        }
      );
      const responseBody = await readSafeJson(response);
      const recentManifests = isRecord(responseBody)
        ? parseManifestRecords(responseBody.recentManifests)
        : null;

      if (
        !response.ok ||
        !isRecord(responseBody) ||
        responseBody.ok !== true ||
        !isRecord(responseBody.packet) ||
        !parseManifestRecord(responseBody.manifest) ||
        !recentManifests
      ) {
        setStatus({
          kind: "error",
          message: genericCrmHandoffPacketFailureMessage
        });
        return;
      }

      setCrmHandoffPacketPreview(
        JSON.stringify(responseBody.packet, null, 2)
      );
      setCrmHandoffPacketManifests(recentManifests);
      setStatus({
        kind: "success",
        message:
          "Queued CRM handoff packet prepared and manifest recorded for manual admin review only."
      });
    } catch {
      setStatus({
        kind: "error",
        message: genericCrmHandoffPacketFailureMessage
      });
    }
  }

  async function downloadHubSpotImportCsv() {
    setStatus({
      kind: "pending",
      message: "Preparing HubSpot import CSV..."
    });

    try {
      const csrfProof = await requestQuoteWriteProof(fetcher);

      if (!csrfProof) {
        setStatus({
          kind: "error",
          message: genericHubSpotImportCsvFailureMessage
        });
        return;
      }

      const response = await fetcher(
        `/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv?limit=${crmHandoffPacketLimit}&status=queued`,
        {
          method: "POST",
          headers: {
            Accept: "text/csv",
            "x-csrf-proof": csrfProof
          }
        }
      );

      if (!response.ok) {
        setStatus({
          kind: "error",
          message: genericHubSpotImportCsvFailureMessage
        });
        return;
      }

      await triggerCsvDownload(response);
      setStatus({
        kind: "success",
        message:
          "HubSpot import CSV prepared for manual admin export only. Queued records remain queued."
      });
    } catch {
      setStatus({
        kind: "error",
        message: genericHubSpotImportCsvFailureMessage
      });
    }
  }

  async function runHubSpotImportCsvPreflight() {
    setStatus({
      kind: "pending",
      message: "Preparing HubSpot import CSV preflight..."
    });
    setHubSpotImportCsvPreflightReport(null);

    try {
      const csrfProof = await requestQuoteWriteProof(fetcher);

      if (!csrfProof) {
        setStatus({
          kind: "error",
          message: genericHubSpotImportCsvPreflightFailureMessage
        });
        return;
      }

      const response = await fetcher(
        `/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv/preflight?limit=${crmHandoffPacketLimit}&status=queued`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "x-csrf-proof": csrfProof
          }
        }
      );
      const responseBody = await readSafeJson(response);
      const preflight = isRecord(responseBody)
        ? parseHubSpotImportCsvPreflightReport(responseBody.preflight)
        : null;

      if (
        !response.ok ||
        !isRecord(responseBody) ||
        responseBody.ok !== true ||
        !preflight
      ) {
        setStatus({
          kind: "error",
          message: genericHubSpotImportCsvPreflightFailureMessage
        });
        return;
      }

      setHubSpotImportCsvPreflightReport(preflight);
      setStatus({
        kind: "success",
        message:
          "HubSpot import CSV preflight prepared for manual admin review only. Queued records remain queued."
      });
    } catch {
      setStatus({
        kind: "error",
        message: genericHubSpotImportCsvPreflightFailureMessage
      });
    }
  }

  async function runCrmHandoffLifecycleReconciliation() {
    setStatus({
      kind: "pending",
      message: "Preparing CRM handoff lifecycle reconciliation..."
    });
    setCrmHandoffLifecycleReconciliationReport(null);

    try {
      const csrfProof = await requestQuoteWriteProof(fetcher);

      if (!csrfProof) {
        setStatus({
          kind: "error",
          message: genericCrmHandoffLifecycleReconciliationFailureMessage
        });
        return;
      }

      const response = await fetcher(
        `/api/admin/quote-requests/crm-handoff-packet/lifecycle-reconciliation?limit=${crmHandoffPacketLimit}&status=queued`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "x-csrf-proof": csrfProof
          }
        }
      );
      const responseBody = await readSafeJson(response);
      const reconciliation = isRecord(responseBody)
        ? parseCrmHandoffLifecycleReconciliationReport(
            responseBody.reconciliation
          )
        : null;

      if (
        !response.ok ||
        !isRecord(responseBody) ||
        responseBody.ok !== true ||
        !reconciliation
      ) {
        setStatus({
          kind: "error",
          message: genericCrmHandoffLifecycleReconciliationFailureMessage
        });
        return;
      }

      setCrmHandoffLifecycleReconciliationReport(reconciliation);
      setStatus({
        kind: "success",
        message:
          "CRM handoff lifecycle reconciliation prepared locally. Queued records remain queued."
      });
    } catch {
      setStatus({
        kind: "error",
        message: genericCrmHandoffLifecycleReconciliationFailureMessage
      });
    }
  }

  async function recordHubSpotManualImportOutcome(
    manifestId: string,
    outcomeStatus: HubSpotManualImportOutcomeStatus
  ) {
    setStatus({
      kind: "pending",
      message: "Recording HubSpot manual import outcome..."
    });

    try {
      const csrfProof = await requestQuoteWriteProof(fetcher);

      if (!csrfProof) {
        setStatus({
          kind: "error",
          message: genericHubSpotManualImportOutcomeFailureMessage
        });
        return;
      }

      const response = await fetcher(
        "/api/admin/quote-requests/crm-handoff-packet/hubspot-import-csv/manual-import-outcome",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "x-csrf-proof": csrfProof
          },
          body: JSON.stringify({
            manifestId,
            outcomeStatus
          })
        }
      );
      const responseBody = await readSafeJson(response);
      const outcome = isRecord(responseBody)
        ? parseHubSpotManualImportOutcomeRecord(responseBody.outcome)
        : null;
      const recentOutcomes = isRecord(responseBody)
        ? parseHubSpotManualImportOutcomeRecords(responseBody.recentOutcomes)
        : null;

      if (
        !response.ok ||
        !isRecord(responseBody) ||
        responseBody.ok !== true ||
        !outcome ||
        !recentOutcomes
      ) {
        setStatus({
          kind: "error",
          message: genericHubSpotManualImportOutcomeFailureMessage
        });
        return;
      }

      setHubSpotManualImportOutcomes(recentOutcomes);
      setStatus({
        kind: "success",
        message:
          "HubSpot manual import outcome recorded locally. Queued records remain queued."
      });
    } catch {
      setStatus({
        kind: "error",
        message: genericHubSpotManualImportOutcomeFailureMessage
      });
    }
  }

  async function handleStatusSubmit(
    event: FormEvent<HTMLFormElement>,
    quoteRequestId: string
  ) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const nextStatusValue = formData.get("status");
    const nextStatus =
      typeof nextStatusValue === "string"
        ? parseQuoteStatus(nextStatusValue)
        : null;
    if (!nextStatus) {
      setStatus({
        kind: "error",
        message: genericFailureMessage
      });
      return;
    }

    await submitStatusChange(quoteRequestId, nextStatus);
  }

  if (inbox.status === "unavailable") {
    return (
      <section
        aria-label="Quote request inbox"
        className="admin-dashboard admin-dashboard--unavailable"
      >
        <h2>Quote request inbox</h2>
        <p>Quote requests are temporarily unavailable.</p>
        <nav className="hero__actions" aria-label="Admin recovery">
          <a className="button button--secondary" href="/admin">
            Open admin overview
          </a>
          <a className="button button--secondary" href="/admin/listings">
            Open listings
          </a>
          <a className="button button--secondary" href="/admin/quotes">
            Open quote requests
          </a>
        </nav>
      </section>
    );
  }

  const summary = quoteStatusSummary(inbox.data.quoteRequests);
  const queuedCrmHandoffRecords = queuedCrmHandoffCount(
    inbox.data.quoteRequests
  );

  return (
    <section className="admin-dashboard" aria-label="Quote request inbox">
      <div className="admin-dashboard__header">
        <div>
          <p className="eyebrow">Admin follow-up</p>
          <h2>Quote request inbox</h2>
          <p>
            Review recent customer quote requests for this workspace and update
            internal triage status only. This does not contact the customer or
            sync to CRM, and it is not public status tracking.
          </p>
        </div>
        <dl className="admin-dashboard__stats" aria-label="Quote request summary">
          <div>
            <dt>Recent requests</dt>
            <dd>{inbox.data.quoteRequests.length}</dd>
          </div>
        </dl>
      </div>

      <div
        className={`category-management__status category-management__status--${status.kind}`}
        aria-live="polite"
      >
        {status.kind === "idle"
          ? "Quote status controls are ready."
          : status.message}
      </div>

      <section
        className="quote-inbox__triage-summary"
        aria-label="Quote triage summary"
      >
        <div>
          <h3>Quote triage summary</h3>
          <p className="category-management__hint">
            Internal triage cues stay inside this admin workspace and help the
            team prioritise follow-up from existing quote request details.
          </p>
        </div>
        <dl className="admin-dashboard__stats">
          <div>
            <dt>New requests</dt>
            <dd>{summary.newRequests}</dd>
          </div>
          <div>
            <dt>In review</dt>
            <dd>{summary.inReview}</dd>
          </div>
          <div>
            <dt>Follow-up needed</dt>
            <dd>{summary.followUpNeeded}</dd>
          </div>
          <div>
            <dt>Quoted</dt>
            <dd>{summary.quoted}</dd>
          </div>
          <div>
            <dt>Closed requests</dt>
            <dd>{summary.closed}</dd>
          </div>
          <div>
            <dt>Contact gaps</dt>
            <dd>{summary.missingContact}</dd>
          </div>
          <div>
            <dt>Missing event dates</dt>
            <dd>{summary.missingEventDate}</dd>
          </div>
          <div>
            <dt>Missing venues</dt>
            <dd>{summary.missingVenue}</dd>
          </div>
          <div>
            <dt>Missing requested items</dt>
            <dd>{summary.missingItems}</dd>
          </div>
          <div>
            <dt>Missing customer messages</dt>
            <dd>{summary.missingCustomerMessage}</dd>
          </div>
          <div>
            <dt>Without internal activity</dt>
            <dd>{summary.withoutInternalActivity}</dd>
          </div>
        </dl>
      </section>

      <section
        aria-label="Queued CRM handoff packet review"
        className="admin-dashboard__card admin-dashboard__card--summary"
      >
        <h3>Queued CRM handoff packet review</h3>
        <p className="category-management__hint">
          Manual review/export only. This does not sync to HubSpot or contact
          customers. This does not call n8n, does not send email, does not
          create provider IDs, and does not mark records as synced. Queued
          records remain queued until a future sync integration is implemented.
        </p>
        <p className="category-management__hint">
          HubSpot import CSV is a protected admin export for manual import
          review only. Records remain queued. No HubSpot sync occurs, no
          provider IDs are created, and no sync timestamp is set.
        </p>
        <p className="category-management__hint">
          Manual import/export readiness only. Run CSV preflight before manual
          import review when possible. No provider IDs are created. No sync
          timestamp is set. CSV formula-risk cells are sanitised during export.
        </p>
        <dl className="admin-dashboard__stats">
          <div>
            <dt>Eligible queued records</dt>
            <dd>{queuedCrmHandoffRecords}</dd>
          </div>
          <div>
            <dt>Packet limit</dt>
            <dd>{crmHandoffPacketLimit}</dd>
          </div>
        </dl>
        <button
          aria-label="Review queued CRM handoff packet"
          className="button button--secondary"
          disabled={status.kind === "pending"}
          onClick={() => void reviewCrmHandoffPacket()}
          type="button"
        >
          {status.kind === "pending"
            ? "Preparing queued CRM handoff packet"
            : "Review queued CRM handoff packet"}
        </button>
        <button
          aria-label="Run CSV import preflight"
          className="button button--secondary"
          disabled={status.kind === "pending"}
          onClick={() => void runHubSpotImportCsvPreflight()}
          type="button"
        >
          {status.kind === "pending"
            ? "Preparing CSV import preflight"
            : "Run CSV import preflight"}
        </button>
        <button
          aria-label="Run CRM handoff reconciliation"
          className="button button--secondary"
          disabled={status.kind === "pending"}
          onClick={() => void runCrmHandoffLifecycleReconciliation()}
          type="button"
        >
          {status.kind === "pending"
            ? "Preparing CRM handoff reconciliation"
            : "Run CRM handoff reconciliation"}
        </button>
        <button
          aria-label="Download HubSpot import CSV"
          className="button button--secondary"
          disabled={status.kind === "pending"}
          onClick={() => void downloadHubSpotImportCsv()}
          type="button"
        >
          {status.kind === "pending"
            ? "Preparing HubSpot import CSV"
            : "Download HubSpot import CSV"}
        </button>
        {hubSpotImportCsvPreflightReport?.needsReviewRecordCount ? (
          <p className="category-management__hint">
            Latest CSV import preflight found records needing admin review.
            Download remains available for manual export review, and queued
            records remain queued.
          </p>
        ) : null}
        <CrmHandoffPacketManifestList
          manifests={crmHandoffPacketManifests}
          onRecordManualImportOutcome={(manifestId, outcomeStatus) =>
            void recordHubSpotManualImportOutcome(manifestId, outcomeStatus)
          }
          pending={status.kind === "pending"}
        />
        <HubSpotManualImportOutcomeLedger
          outcomes={hubSpotManualImportOutcomes}
        />
        {hubSpotImportCsvPreflightReport ? (
          <HubSpotImportCsvPreflightSummary
            report={hubSpotImportCsvPreflightReport}
          />
        ) : null}
        {crmHandoffLifecycleReconciliationReport ? (
          <CrmHandoffLifecycleReconciliationSummary
            report={crmHandoffLifecycleReconciliationReport}
          />
        ) : null}
        {crmHandoffPacketPreview ? (
          <section
            aria-label="Queued CRM handoff packet JSON preview"
            className="quote-inbox__section"
          >
            <h4>Queued CRM handoff packet JSON preview</h4>
            <pre>{crmHandoffPacketPreview}</pre>
          </section>
        ) : null}
      </section>

      <QuoteIntakeParityHelper />

      <section
        aria-label="Quote request inbox operator guidance"
        className="admin-dashboard__card admin-dashboard__card--summary"
      >
        <h3>Operator QA summary</h3>
        <dl className="quote-inbox__details">
          <div>
            <dt>Read-only</dt>
            <dd>
              Quote request summaries, customer-submitted details, and triage
              counts are read-only operator QA cues.
            </dd>
          </div>
          <div>
            <dt>Write-enabled</dt>
            <dd>Write-enabled internal triage status only.</dd>
          </div>
          <div>
            <dt>Public-facing</dt>
            <dd>
              Public quote pages only show receipt-style enquiry confirmation; they do not expose admin status, notes, recovery states, or tracking.
            </dd>
          </div>
          <div>
            <dt>Admin-only</dt>
            <dd>Admin-only triage.</dd>
          </div>
        </dl>
        <p>
          Next safe action: capture contact, event, venue, and requested items
          before closing follow-up. If a status save fails, keep the prior
          protected state and retry locally without exposing internal details.
        </p>
      </section>

      {inbox.data.quoteRequests.length === 0 ? (
        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <p>
            No quote requests are visible yet. New website enquiries will appear here for internal follow-up when available.
          </p>
          <a className="button button--secondary" href="/admin/listings">
            Review listings
          </a>
        </section>
      ) : (
        <div className="admin-dashboard__grid">
          {inbox.data.quoteRequests.map((quoteRequest) => {
            const activity = quoteRequest.activity ?? [];
            const crmAction = crmHandoffAction(quoteRequest);

            return (
              <article className="admin-dashboard__card" key={quoteRequest.id}>
                <div>
                  <p className="eyebrow">{quoteRequest.publicReference}</p>
                  <h3>{quoteRequest.customerName ?? "Unnamed customer"}</h3>
                  <p>
                    {quoteRequest.status} - {quoteRequest.source}
                  </p>
                </div>
          <section
            aria-label={`Requested items summary ${quoteRequest.publicReference}`}
            className="quote-inbox__section"
          >
                  <h4>Intake completeness</h4>
                  <ul className="admin-readiness__list">
                    {quoteTriageCues(quoteRequest).map((cue) => (
                      <li key={cue}>{cue}</li>
                    ))}
                  </ul>
                </section>
                <section className="quote-inbox__section">
                  <h4>Quote/enquiry context summary</h4>
                  <p>
                    Public reference {quoteRequest.publicReference} is a receipt
                    reference only. It is not customer tracking, status lookup,
                    availability confirmation, or a rental outcome.
                  </p>
                  <p>{quoteNextAction(quoteRequest)}</p>
                </section>
                <section className="quote-inbox__section">
                  <h4>Source metadata and CRM handoff placeholder</h4>
                  <SourceAndCrmHandoffDetails quoteRequest={quoteRequest} />
                  <p className="category-management__hint">
                    CRM fields are read-only placeholders for future HubSpot
                    handoff visibility. This admin view does not start sync,
                    call providers, queue automation, or deliver outbound
                    messages.
                  </p>
                </section>
                <LocalCrmHandoffPayloadPreview quoteRequest={quoteRequest} />
                <section className="quote-inbox__section">
                  <h4>Local CRM handoff queue preparation</h4>
                  <p className="category-management__hint">
                    This marks local readiness for future CRM handoff only. This
                    does not sync to HubSpot, call n8n, email anyone, contact the
                    customer, or create CRM contact/deal IDs.
                  </p>
                  <dl className="quote-inbox__details">
                    <div>
                      <dt>CRM handoff readiness</dt>
                      <dd>{crmHandoffStatusLabel(quoteRequest.crmSyncStatus)}</dd>
                    </div>
                    <div>
                      <dt>CRM provider</dt>
                      <dd>{quoteRequest.crmProvider ?? "hubspot"}</dd>
                    </div>
                  </dl>
                  {crmAction ? (
                    <button
                      aria-label={`${crmAction.label} for ${quoteRequest.publicReference}`}
                      className="button button--secondary"
                      disabled={status.kind === "pending"}
                      onClick={() =>
                        void submitCrmHandoffStatusChange(
                          quoteRequest.id,
                          crmAction.status
                        )
                      }
                      type="button"
                    >
                      {status.kind === "pending"
                        ? `Updating CRM handoff readiness for ${quoteRequest.publicReference}`
                        : `${crmAction.label} for ${quoteRequest.publicReference}`}
                    </button>
                  ) : (
                    <p className="category-management__hint">
                      Synced CRM handoff state is read-only in this foundation.
                    </p>
                  )}
                </section>
                <section className="quote-inbox__section">
                  <h4>Response-readiness checklist</h4>
                  <ul className="admin-readiness__list">
                    {quoteResponseReadinessChecklist(quoteRequest).map((cue) => (
                      <li key={cue}>{cue}</li>
                    ))}
                  </ul>
                  <p className="category-management__hint">
                    Admin-only helper: prepare a human response from existing
                    request fields only. This does not send a response, create
                    public lookup, create sign-in areas, or start
                    automated alerts.
                  </p>
                </section>
                <section className="quote-inbox__section">
                  <h4>Contact and follow-up: customer/contact summary</h4>
                  <dl className="quote-inbox__details">
                    <div>
                      <dt>Submitted</dt>
                      <dd>{quoteRequest.createdAt}</dd>
                    </div>
                    {quoteRequest.updatedAt ? (
                      <div>
                        <dt>Updated</dt>
                        <dd>{quoteRequest.updatedAt}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt>Customer</dt>
                      <dd>{quoteRequest.customerName ? "Name shown in request heading" : "Missing customer name"}</dd>
                    </div>
                    <div>
                      <dt>Source/status</dt>
                      <dd>{quoteRequest.source} - {statusLabel(quoteRequest.status)}</dd>
                    </div>
                    {quoteRequest.customerEmail ? (
                      <div>
                        <dt>Email</dt>
                        <dd>{quoteRequest.customerEmail}</dd>
                      </div>
                    ) : null}
                    {quoteRequest.customerPhone ? (
                      <div>
                        <dt>Phone</dt>
                        <dd>{quoteRequest.customerPhone}</dd>
                      </div>
                    ) : null}
                  </dl>
                </section>
                <section className="quote-inbox__section">
                  <h4>Event and setup details: event date/venue summary and submitted notes</h4>
                  <dl className="quote-inbox__details">
                    {quoteRequest.eventDate ? (
                      <div>
                        <dt>Event date</dt>
                        <dd>{quoteRequest.eventDate}</dd>
                      </div>
                    ) : null}
                    {quoteRequest.venue ? (
                      <div>
                        <dt>Venue</dt>
                        <dd>{quoteRequest.venue}</dd>
                      </div>
                    ) : null}
                  </dl>
                  {quoteRequest.customerMessage ? (
                    <p>{quoteRequest.customerMessage}</p>
                  ) : (
                    <p>No customer message was submitted.</p>
                  )}
                </section>
                <a
                  className="button button--secondary"
                  href={`/admin/quotes/${encodeURIComponent(quoteRequest.id)}`}
                >
                  Open quote detail {quoteRequest.publicReference}
                </a>
                <section className="quote-inbox__section">
                  <h4>Requested listings and items: requested listing/item summary</h4>
                  {quoteRequest.items.length === 0 ? (
                    <p>No requested listing or item snapshots were captured.</p>
                  ) : (
                    <ul className="admin-dashboard__list">
                      {quoteRequest.items.map((item) => (
                        <li key={item.id}>
                          <strong>
                            {item.quantity} x {item.productNameSnapshot}
                          </strong>
                          {item.notes ? <small>{item.notes}</small> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
                <section className="quote-inbox__section">
                  <h4>Admin-only status history</h4>
                  <p>
                    Internal status history stays inside this
                    protected admin workspace and are not shown on public quote
                    pages or public status views.
                  </p>
                  {activity.length === 0 ? (
                    <p>No internal follow-up activity has been recorded yet.</p>
                  ) : (
                    <ul
                      className="admin-dashboard__list"
                      aria-label={`Internal activity ${quoteRequest.publicReference}`}
                    >
                      {activity.map((activityItem) => (
                        <li key={activityItem.id}>
                          <strong>{activityText(activityItem)}</strong>
                          <small>{activityItem.createdAt}</small>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
                <form
                  aria-label={`Update internal triage status ${quoteRequest.publicReference}`}
                  className="category-management__form"
                  onSubmit={(event) =>
                    void handleStatusSubmit(event, quoteRequest.id)
                  }
                >
                  <label htmlFor={`quote-status-${quoteRequest.id}`}>
                    Protected internal status for {quoteRequest.publicReference}
                    <select
                      defaultValue={quoteRequest.status}
                      id={`quote-status-${quoteRequest.id}`}
                      name="status"
                    >
                      {quoteStatuses.map((quoteStatus) => (
                        <option key={quoteStatus} value={quoteStatus}>
                          {statusLabel(quoteStatus)}
                        </option>
                      ))}
                    </select>
                    <small>Status is an admin-only triage control and is never shown as a public quote status view, confirmed outcome, or public tracking lane.</small>
                  </label>
                  <p className="category-management__hint">
                    Update internal triage status. This does not contact the
                    customer or sync to CRM, and it does not email customers or queue
                    automation.
                  </p>
                  <button
                    className="button"
                    disabled={status.kind === "pending"}
                    type="submit"
                  >
                    {status.kind === "pending"
                      ? `Updating internal triage status for ${quoteRequest.publicReference}`
                      : `Update internal triage status for ${quoteRequest.publicReference}`}
                  </button>
                </form>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
