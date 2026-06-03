import type { AdminQuoteRequestInboxReadResult } from "../../lib/quote/admin-read/admin-quote-request-dashboard-read";

type QuoteRequestInboxPanelProps = {
  inbox: AdminQuoteRequestInboxReadResult;
};

function statusLabel(value: string) {
  return value.replace(/_/g, " ");
}

export function QuoteRequestInboxPanel({ inbox }: QuoteRequestInboxPanelProps) {
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
          <p className="eyebrow">Read-only enquiries</p>
          <h2>Quote request inbox</h2>
          <p>
            Review recent customer quote requests for this workspace. Status
            changes and follow-up workflows stay out of scope.
          </p>
        </div>
        <dl className="admin-dashboard__stats" aria-label="Quote request summary">
          <div>
            <dt>Recent requests</dt>
            <dd>{inbox.data.quoteRequests.length}</dd>
          </div>
        </dl>
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
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
