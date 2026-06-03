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

type AdminQuoteRequestInboxQuoteRequest = {
  id: string;
  publicReference: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  eventDate?: string;
  venue?: string;
  status: AdminQuoteRequestStatus;
  source: "website" | "chat" | "admin";
  createdAt: string;
  items: AdminQuoteRequestInboxItem[];
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
    nextStatus: AdminQuoteRequestStatus
  ) {
    setStatus({
      kind: "pending",
      message: "Saving quote status..."
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
      </section>
    );
  }

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

      {inbox.data.quoteRequests.length === 0 ? (
        <section className="admin-dashboard__card admin-dashboard__card--summary">
          <p>No quote requests are visible yet.</p>
        </section>
      ) : (
        <div className="admin-dashboard__grid">
          {inbox.data.quoteRequests.map((quoteRequest) => (
            <article className="admin-dashboard__card" key={quoteRequest.id}>
              <div>
                <p className="eyebrow">{quoteRequest.publicReference}</p>
                <h3>{quoteRequest.customerName ?? "Unnamed customer"}</h3>
                <p>
                  {statusLabel(quoteRequest.status)} - {quoteRequest.source}
                </p>
              </div>
              <dl className="quote-inbox__details">
                <div>
                  <dt>Submitted</dt>
                  <dd>{quoteRequest.createdAt}</dd>
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
              {quoteRequest.items.length === 0 ? (
                <p>No requested item snapshots were captured.</p>
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
              <form
                aria-label={`Update quote status ${quoteRequest.publicReference}`}
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
                <button className="button" type="submit">
                  Save status for {quoteRequest.publicReference}
                </button>
              </form>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
