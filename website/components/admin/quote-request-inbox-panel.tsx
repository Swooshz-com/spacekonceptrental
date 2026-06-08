"use client";

import { useState, type FormEvent } from "react";

type AdminQuoteRequestStatus =
  | "new"
  | "reviewing"
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
const quoteStatuses: AdminQuoteRequestStatus[] = [
  "new",
  "reviewing",
  "quoted",
  "closed",
  "archived"
];
const genericFailureMessage =
  "Quote status could not be saved. Try again or refresh the page.";

function statusLabel(value: string) {
  return value.replace(/_/g, " ");
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
    quoted: quoteRequests.filter((quoteRequest) => quoteRequest.status === "quoted").length,
    closed: quoteRequests.filter(
      (quoteRequest) => quoteRequest.status === "closed"
    ).length,
    archived: quoteRequests.filter(
      (quoteRequest) => quoteRequest.status === "archived"
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

function quoteTriageCues(quoteRequest: AdminQuoteRequestInboxQuoteRequest) {
  const hasContact = hasContactMethod(quoteRequest);

  return [
    hasContact ? "Contact method available" : "Missing contact method",
    quoteRequest.eventDate ? "Event date captured" : "Missing event date",
    quoteRequest.venue ? "Venue captured" : "Missing venue",
    quoteRequest.items.length > 0
      ? `${quoteRequest.items.length} requested ${
          quoteRequest.items.length === 1 ? "item" : "items"
        }`
      : "No requested items captured",
    quoteRequest.customerMessage
      ? "Customer message captured"
      : "No customer message",
    quoteRequest.activity.length > 0
      ? "Internal activity recorded"
      : "No internal activity yet"
  ];
}

function quoteNextAction(quoteRequest: AdminQuoteRequestInboxQuoteRequest) {
  if (!hasContactMethod(quoteRequest)) {
    return "Next action: capture a contact method before follow-up.";
  }

  if (quoteRequest.status === "archived") {
    return "Next action: archived enquiry is retained for admin reference.";
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
    return "Next action: prepare quote response or move to quoted after direct follow-up.";
  }

  if (quoteRequest.status === "quoted") {
    return "Next action: monitor direct follow-up and close when the enquiry is resolved.";
  }

  return "Next action: closed enquiry is retained for admin reference.";
}

function activityText(activity: AdminQuoteRequestInboxActivity) {
  if (activity.activityType === "internal_note") {
    return activity.note ?? "Internal note recorded.";
  }

  return `Status changed from ${statusLabel(activity.statusFrom ?? "unknown")} to ${statusLabel(activity.statusTo ?? "unknown")}.`;
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

export function QuoteRequestInboxPanel({
  inbox,
  fetcher = fetch,
  onMutationComplete = reloadDashboard
}: QuoteRequestInboxPanelProps) {
  const [status, setStatus] = useState<PanelStatus>({
    kind: "idle"
  });

  async function submitStatusChange(
    quoteRequestId: string,
    nextStatus: AdminQuoteRequestStatus,
    internalNote?: string
  ) {
    setStatus({
      kind: "pending",
      message: "Saving follow-up..."
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
            status: nextStatus,
            ...(internalNote ? { internalNote } : {})
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
        message: "Quote status updated. Refreshing dashboard."
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
    const internalNoteValue = formData.get("internalNote");
    const internalNote =
      typeof internalNoteValue === "string"
        ? internalNoteValue.trim()
        : undefined;

    if (!nextStatus) {
      setStatus({
        kind: "error",
        message: genericFailureMessage
      });
      return;
    }

    await submitStatusChange(quoteRequestId, nextStatus, internalNote);
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

  return (
    <section className="admin-dashboard" aria-label="Quote request inbox">
      <div className="admin-dashboard__header">
        <div>
          <p className="eyebrow">Admin follow-up</p>
          <h2>Quote request inbox</h2>
          <p>
            Review recent customer quote requests for this workspace and update
            internal follow-up status only.
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
            <dt>Quoted/contacted</dt>
            <dd>{summary.quoted}</dd>
          </div>
          <div>
            <dt>Closed requests</dt>
            <dd>{summary.closed}</dd>
          </div>
          <div>
            <dt>Archived requests</dt>
            <dd>{summary.archived}</dd>
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
            <dd>Write-enabled internal quote follow-up.</dd>
          </div>
          <div>
            <dt>Public-facing</dt>
            <dd>
              Public quote pages only show receipt-style enquiry confirmation.
            </dd>
          </div>
          <div>
            <dt>Admin-only</dt>
            <dd>Admin-only triage.</dd>
          </div>
        </dl>
        <p>
          Next safe action: capture contact, event, venue, and requested items
          before closing follow-up.
        </p>
      </section>

      {inbox.data.quoteRequests.length === 0 ? (
        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <p>
            No quote requests are visible yet. New website enquiries will
            appear here for internal follow-up.
          </p>
          <a className="button button--secondary" href="/admin/listings">
            Review listings
          </a>
        </section>
      ) : (
        <div className="admin-dashboard__grid">
          {inbox.data.quoteRequests.map((quoteRequest) => {
            const activity = quoteRequest.activity ?? [];

            return (
              <article className="admin-dashboard__card" key={quoteRequest.id}>
                <div>
                  <p className="eyebrow">{quoteRequest.publicReference}</p>
                  <h3>{quoteRequest.customerName ?? "Unnamed customer"}</h3>
                  <p>
                    {statusLabel(quoteRequest.status)} - {quoteRequest.source}
                  </p>
                </div>
          <section
            aria-label={`Requested items summary ${quoteRequest.publicReference}`}
            className="quote-inbox__section"
          >
                  <h4>Triage cues</h4>
                  <ul className="admin-readiness__list">
                    {quoteTriageCues(quoteRequest).map((cue) => (
                      <li key={cue}>{cue}</li>
                    ))}
                  </ul>
                </section>
                <section className="quote-inbox__section">
                  <h4>Next action</h4>
                  <p>{quoteNextAction(quoteRequest)}</p>
                </section>
                <section className="quote-inbox__section">
                  <h4>Contact and follow-up</h4>
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
                  <h4>Event and setup details</h4>
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
                  <h4>Requested listings and items</h4>
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
                  <h4>Admin-only status and notes</h4>
                  <p>
                    Internal notes and status history stay inside this
                    protected admin workspace and are not shown on public quote
                    pages.
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
                  aria-label={`Update quote follow-up ${quoteRequest.publicReference}`}
                  className="category-management__form"
                  onSubmit={(event) =>
                    void handleStatusSubmit(event, quoteRequest.id)
                  }
                >
                  <label htmlFor={`quote-status-${quoteRequest.id}`}>
                    Internal status for {quoteRequest.publicReference}
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
                  </label>
                  <label htmlFor={`quote-note-${quoteRequest.id}`}>
                    Internal note for {quoteRequest.publicReference}
                    <textarea
                      id={`quote-note-${quoteRequest.id}`}
                      maxLength={1200}
                      name="internalNote"
                      placeholder="Add internal follow-up context for the team"
                      rows={3}
                    />
                  </label>
                  <p className="category-management__hint">
                    Internal status changes stay inside this admin workspace
                    and are used for team follow-up.
                  </p>
                  <button className="button" type="submit">
                    Save follow-up for {quoteRequest.publicReference}
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
