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
          <form className="quote-form">
            <label>
              Event date
              <input name="eventDate" placeholder="DD/MM/YYYY" type="text" />
            </label>
            <label>
              Venue
              <input name="venue" placeholder="Singapore venue" type="text" />
            </label>
            <label>
              Items needed
              <textarea
                name="items"
                placeholder="Example: 20 stools, 4 cocktail tables"
                rows={4}
              />
            </label>
            <button className="button" disabled type="button">
              Send quote request
            </button>
          </form>
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
