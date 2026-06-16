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
  packetKind: "json_review_packet";
  statusFilter: "queued";
  limitRequested: number;
  recordCount: number;
  requestIds: string[];
  requestIdCount: number;
  generatedByAdminUserId?: string;
  generatedAt: string;
  source: "protected_admin";
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
    value.packetKind !== "json_review_packet" ||
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
    packetKind: "json_review_packet",
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
  manifests
}: {
  manifests: AdminQuoteRequestCrmHandoffPacketManifest[];
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
        create provider IDs, and do not mark records as synced.
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
        <CrmHandoffPacketManifestList
          manifests={crmHandoffPacketManifests}
        />
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
