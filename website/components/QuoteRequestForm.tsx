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
    const payload = {
      customerName: String(formData.get("customerName") ?? "").trim(),
      customerEmail: String(formData.get("customerEmail") ?? "").trim(),
      customerPhone: String(formData.get("customerPhone") ?? "").trim(),
      eventDate: String(formData.get("eventDate") ?? "").trim(),
      venue: String(formData.get("venue") ?? "").trim(),
      items: itemsText
        ? [
            {
              productName: itemsText,
              quantity: 1
            }
          ]
        : []
    };

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
          "Quote requests are temporarily unavailable. Please try again later."
      });
    }
  }

  return (
    <form className="quote-form" onSubmit={handleSubmit}>
      <label>
        Name
        <input autoComplete="name" name="customerName" type="text" />
      </label>
      <label>
        Email
        <input autoComplete="email" name="customerEmail" type="email" />
      </label>
      <label>
        Phone
        <input autoComplete="tel" name="customerPhone" type="tel" />
      </label>
      <label>
        Event date
        <input name="eventDate" type="date" />
      </label>
      <label>
        Venue
        <input name="venue" placeholder="Singapore venue" type="text" />
      </label>
      <label>
        Items needed
        <textarea
          defaultValue={initialItemsText}
          name="items"
          placeholder="Example: 20 stools, 4 cocktail tables"
          rows={4}
        />
      </label>
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
          Quote request received
          {submitState.publicReference
            ? `: ${submitState.publicReference}`
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
