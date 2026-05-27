import QuoteRequestForm from "../../components/QuoteRequestForm";

export default function QuotePage() {
  return (
    <section className="section">
      <div className="page-title">
        <h1>Quote</h1>
        <p>
          Organize the event details the team will need for a furniture rental
          follow-up.
        </p>
      </div>

      <div className="route-grid">
        <article className="quote-panel">
          <h2>Event basics</h2>
          <QuoteRequestForm />
        </article>

        <article className="route-card">
          <h2>Need guidance?</h2>
          <p>
            The rental assistant can help clarify quantities, event dates, and
            product categories before the team follows up.
          </p>
        </article>
      </div>
    </section>
  );
}
