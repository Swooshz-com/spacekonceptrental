"use client";

import { FormEvent, useState } from "react";

type QuoteApiResponse = {
  publicReference?: string;
  error?: {
    message: string;
  };
};

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; publicReference?: string }
  | { status: "error"; message: string };

function parseRequestedItems(itemsText: string, itemNotesText: string) {
  const itemLines = itemsText
    .split(/\r?\n|\r/)
    .map((line) => line.trim())
    .filter(Boolean);

  return itemLines.map((productName, index) => ({
    productName,
    quantity: 1,
    // Item notes are shared form context, so submit them once on the first item.
    ...(index === 0 && itemNotesText ? { notes: itemNotesText } : {})
  }));
}

export default function QuoteRequestForm({
  initialItemsText = ""
}: {
  initialItemsText?: string;
}) {
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle"
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitState.status === "submitting") {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const itemsText = String(formData.get("items") ?? "").trim();
    const customerMessageText = String(
      formData.get("customerMessage") ?? ""
    ).trim();
    const itemNotesText = String(formData.get("itemNotes") ?? "").trim();
    const payload = {
      customerName: String(formData.get("customerName") ?? "").trim(),
      customerEmail: String(formData.get("customerEmail") ?? "").trim(),
      customerPhone: String(formData.get("customerPhone") ?? "").trim(),
      ...(customerMessageText
        ? { customerMessage: customerMessageText }
        : {}),
      eventDate: String(formData.get("eventDate") ?? "").trim(),
      venue: String(formData.get("venue") ?? "").trim(),
      items: parseRequestedItems(itemsText, itemNotesText)
    };

    if (!payload.customerEmail && !payload.customerPhone) {
      setSubmitState({
        status: "error",
        message:
          "Share an email address or phone number so the team can follow up on this enquiry."
      });
      return;
    }

    setSubmitState({ status: "submitting" });

    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = (await response.json()) as QuoteApiResponse;

      if (!response.ok) {
        throw new Error(body.error?.message ?? "Quote request failed");
      }

      setSubmitState({
        status: "success",
        publicReference: body.publicReference
      });
    } catch {
      setSubmitState({
        status: "error",
        message:
          "Quote requests are temporarily unavailable. Please try again later. You can retry with the same event details."
      });
    }
  }

  return (
    <form className="quote-form" onSubmit={handleSubmit}>
      <p className="quote-form__intro">
        Share one reliable contact method, event timing, venue or access notes,
        and any listing or setup ideas so the team can triage the rental
        enquiry.
      </p>
      {initialItemsText ? (
        <aside className="quote-form__selected" aria-label="Selected listing">
          <strong>Selected listing</strong>
          <span>
            {initialItemsText} starts this rental request. Selected listing is
            a starting point only, not a reservation or availability
            confirmation.
            Add quantities, alternates, dimensions, or placement notes before
            sending.
          </span>
        </aside>
      ) : null}
      <fieldset>
        <legend>Contact details</legend>
        <label>
          Your name
          <input autoComplete="name" name="customerName" required type="text" />
        </label>
        <label>
          Email address
          <input autoComplete="email" name="customerEmail" type="email" />
        </label>
        <label>
          Phone number
          <input autoComplete="tel" name="customerPhone" type="tel" />
          <small>
            Share email, phone, or both. The team uses this only for direct
            quote follow-up.
          </small>
        </label>
      </fieldset>
      <fieldset>
        <legend>Event details</legend>
        <label>
          Event date
          <input name="eventDate" type="date" />
          <small>
            Event date helps the team understand timing, delivery windows, and
            setup priority. Final availability is confirmed directly by the
            team.
          </small>
        </label>
        <label>
          Venue or location
          <input name="venue" placeholder="Singapore venue or event location" type="text" />
          <small>
            Venue or event location helps the team plan delivery, access, and
            layout fit.
          </small>
        </label>
      </fieldset>
      <fieldset>
        <legend>Requested items</legend>
        <label>
          Listings or items needed
          <textarea
            defaultValue={initialItemsText}
            name="items"
            placeholder="Example: 20 stools, 4 cocktail tables, or a lounge setup"
            rows={4}
          />
          <small>
            Use one line per requested item. Leave this blank if you need help
            deciding quantities.
          </small>
        </label>
        <label>
          Event goals or customer message
          <textarea
            aria-label="Customer message / event notes for the team"
            maxLength={1200}
            name="customerMessage"
            placeholder="Example: event context, preferred setup style, or what you need help deciding"
            rows={4}
          />
        </label>
        <label>
          Quantity or setup notes
          <textarea
            aria-label="Item-specific notes / quantity or setup notes"
            maxLength={500}
            name="itemNotes"
            placeholder="Example: delivery timing or placement notes for the listed items"
            rows={4}
          />
          <small>
            Add quantities, alternates, dimensions, or placement notes for the
            requested items.
          </small>
        </label>
      </fieldset>
      <button
        className="button"
        disabled={submitState.status === "submitting"}
        type="submit"
      >
        {submitState.status === "submitting"
          ? "Sending"
          : "Send quote request"}
      </button>
      {submitState.status === "success" ? (
        <p className="quote-form__status" role="status">
          Quote request received. This is a receipt only; the team will review
          your enquiry and follow up directly
          {submitState.publicReference
            ? `. Reference: ${submitState.publicReference}`
            : "."}
        </p>
      ) : null}
      {submitState.status === "error" ? (
        <p className="quote-form__status" role="alert">
          {submitState.message}
        </p>
      ) : null}
    </form>
  );
}
