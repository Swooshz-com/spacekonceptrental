"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

type QuoteApiResponse = {
  publicReference?: string;
  requestId?: string;
  error?: {
    message: string;
  };
};

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; publicReference?: string; requestId?: string }
  | { status: "error"; message: string };

const customerMessageMaxLength = 1200;
const requestedItemsMaxCount = 20;
const requestedItemMaxLength = 180;
const sourcePathMaxLength = 500;
const requestIdMaxLength = 128;
const requestIdFallbackRadix = 36;
const listingSlugPattern = /^[a-z0-9][a-z0-9-]*$/;
const requestIdPattern = /^[A-Za-z0-9._:-]+$/;

function formatPreferredContactMethod(preferredContactMethod: string) {
  return preferredContactMethod
    ? `Preferred contact method: ${preferredContactMethod}`
    : "";
}

function getCustomerMessageMaxLength(preferredContactMethod: string) {
  const preferredContactPrefix = formatPreferredContactMethod(
    preferredContactMethod
  );

  return preferredContactPrefix
    ? customerMessageMaxLength - preferredContactPrefix.length - 2
    : customerMessageMaxLength;
}

function parseRequestedItems(itemsText: string, itemNotesText: string) {
  const itemLines = itemsText
    .split(/\r?\n|\r/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, requestedItemsMaxCount);

  return itemLines.map((productName, index) => ({
    productName: productName.slice(0, requestedItemMaxLength),
    quantity: 1,
    // Item notes are shared form context, so submit them once on the first item.
    ...(index === 0 && itemNotesText ? { notes: itemNotesText } : {})
  }));
}

function combineCustomerMessage(
  customerMessageText: string,
  preferredContactMethod: string
) {
  const details = [
    formatPreferredContactMethod(preferredContactMethod),
    customerMessageText
  ].filter(Boolean);

  return details.join("\n\n").trim();
}

function createSubmissionRequestId() {
  const requestId =
    globalThis.crypto?.randomUUID?.() ??
    `quote-${Date.now().toString(requestIdFallbackRadix)}-${Math.random()
      .toString(requestIdFallbackRadix)
      .slice(2, 12)}`;

  return requestIdPattern.test(requestId) &&
    requestId.length <= requestIdMaxLength
    ? requestId
    : undefined;
}

function getSafeSourcePath() {
  if (typeof window === "undefined") {
    return undefined;
  }

  const sourcePath = `${window.location.pathname}${window.location.search}`;

  if (
    sourcePath.length > sourcePathMaxLength ||
    !sourcePath.startsWith("/") ||
    sourcePath.startsWith("//") ||
    sourcePath.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(sourcePath)
  ) {
    return undefined;
  }

  return sourcePath;
}

function getSafeListingSlug(listingSlug: string | undefined) {
  const normalized = listingSlug?.trim().toLowerCase();

  return normalized && listingSlugPattern.test(normalized)
    ? normalized
    : undefined;
}

export default function QuoteRequestForm({
  initialItemsText = "",
  initialListingSlug
}: {
  initialItemsText?: string;
  initialListingSlug?: string;
}) {
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle"
  });
  const [submissionRequestId] = useState(createSubmissionRequestId);
  const [preferredContactMethod, setPreferredContactMethod] = useState("");
  const [customerMessageText, setCustomerMessageText] = useState("");
  const customerMessageInputMaxLength = getCustomerMessageMaxLength(
    preferredContactMethod
  );

  function handlePreferredContactMethodChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    const nextPreferredContactMethod = event.target.value;
    const nextMaxLength = getCustomerMessageMaxLength(
      nextPreferredContactMethod
    );

    setPreferredContactMethod(nextPreferredContactMethod);
    setCustomerMessageText((currentMessage) =>
      currentMessage.length > nextMaxLength
        ? currentMessage.slice(0, nextMaxLength)
        : currentMessage
    );
  }

  function handleCustomerMessageChange(
    event: ChangeEvent<HTMLTextAreaElement>
  ) {
    setCustomerMessageText(
      event.target.value.slice(0, customerMessageInputMaxLength)
    );
  }

  function handleStartAnotherEnquiry() {
    setSubmitState({ status: "idle" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitState.status === "submitting") {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const itemsText = String(formData.get("items") ?? "").trim();
    const submittedCustomerMessageText = customerMessageText.trim();
    const submittedPreferredContactMethod = preferredContactMethod.trim();
    const itemNotesText = String(formData.get("itemNotes") ?? "").trim();
    const sourcePath = getSafeSourcePath();
    const listingSlug = getSafeListingSlug(initialListingSlug);
    const combinedCustomerMessage = combineCustomerMessage(
      submittedCustomerMessageText,
      submittedPreferredContactMethod
    );
    const payload = {
      customerName: String(formData.get("customerName") ?? "").trim(),
      customerEmail: String(formData.get("customerEmail") ?? "").trim(),
      customerPhone: String(formData.get("customerPhone") ?? "").trim(),
      ...(combinedCustomerMessage
        ? { customerMessage: combinedCustomerMessage }
        : {}),
      eventDate: String(formData.get("eventDate") ?? "").trim(),
      venue: String(formData.get("venue") ?? "").trim(),
      ...(sourcePath ? { sourcePath } : {}),
      ...(listingSlug ? { listingSlug } : {}),
      ...(submissionRequestId ? { requestId: submissionRequestId } : {}),
      items: parseRequestedItems(itemsText, itemNotesText)
    };

    if (!payload.customerName) {
      setSubmitState({
        status: "error",
        message:
          "Add your name so the team can review this enquiry with the right contact details."
      });
      return;
    }

    if (!payload.customerEmail && !payload.customerPhone) {
      setSubmitState({
        status: "error",
        message:
          "Share an email address or phone number so the team can follow up on this enquiry."
      });
      return;
    }

    if (itemsText && payload.items.length === 0) {
      setSubmitState({
        status: "error",
        message:
          "Use short listing or item lines, or leave requested items blank and explain the setup in the notes."
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
        publicReference: body.publicReference,
        requestId: body.requestId
      });
    } catch {
      setSubmitState({
        status: "error",
        message:
          "Quote requests are temporarily unavailable. Please try again later with the same event details."
      });
    }
  }

  const receiptReference =
    submitState.status === "success"
      ? submitState.publicReference ?? submitState.requestId
      : undefined;

  return (
    <form className="quote-form" noValidate onSubmit={handleSubmit}>
      <p className="quote-form__intro">
        Share your name. Share one reliable contact method, event date if known,
        venue or location, requested listings or items, quantities, alternates,
        setup, access, and timing notes so the team can triage the rental
        enquiry.
      </p>
      {initialItemsText ? (
        <aside className="quote-form__selected" aria-label="Selected listing">
          <strong>Selected listing</strong>
          <span>
            {initialItemsText} starts this rental request. Listing context is
            a starting point only and remains editable request text, not a
            rental fit confirmation. Add quantities, alternates, dimensions,
            setup, access, or timing notes before sending; the team can review
            the request.
          </span>
        </aside>
      ) : null}
      <fieldset className="quote-form__field-grid">
        <legend>Contact details</legend>
        <label>
          Your name (required)
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
            Share email, phone, or both. Email or phone required. The team uses
            this only for direct quote follow-up.
          </small>
        </label>
        <label>
          Preferred contact method
          <select
            name="preferredContactMethod"
            onChange={handlePreferredContactMethodChange}
            value={preferredContactMethod}
          >
            <option value="">No preference</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="either email or phone">Either email or phone</option>
          </select>
          <small>
            Pick the easiest way for the team to ask questions or share more
            details about the enquiry.
          </small>
        </label>
      </fieldset>
      <fieldset className="quote-form__field-grid">
        <legend>Event details</legend>
        <label>
          Event date (if known)
          <input name="eventDate" type="date" />
          <small>
            Event date helps the team understand timing and setup context.
            Rental fit is reviewed directly by the team.
          </small>
        </label>
        <label>
          Venue or location (if known)
          <input name="venue" placeholder="Venue or event location" type="text" />
          <small>
            Venue or event location helps the team plan delivery, access, and
            layout fit.
          </small>
        </label>
      </fieldset>
      <fieldset className="quote-form__field-grid">
        <legend>Requested items</legend>
        <label className="quote-form__full-width">
          Requested listings or items
          <textarea
            defaultValue={initialItemsText}
            name="items"
            placeholder="Example: 20 stools, 4 cocktail tables, or a lounge setup"
            rows={4}
          />
          <small>
            Use one line per requested listing or item. This editable text can
            keep listing, category, event-use, or search context as request notes.
          </small>
        </label>
        <label className="quote-form__full-width">
          Event goals or customer message
          <textarea
            aria-label="Customer message / event notes for the team"
            maxLength={customerMessageInputMaxLength}
            name="customerMessage"
            onChange={handleCustomerMessageChange}
            placeholder="Example: event context, preferred setup style, alternates, or what you need help deciding"
            rows={4}
            value={customerMessageText}
          />
          <small>
            Use this area to share more details, alternates, and practical
            setup/access/timing notes.
          </small>
        </label>
        <label className="quote-form__full-width">
          Quantity, setup, access, and timing notes
          <textarea
            aria-label="Item-specific notes / quantity or setup notes"
            maxLength={500}
            name="itemNotes"
            placeholder="Example: delivery timing, venue access, placement notes, or alternates for the listed items"
            rows={4}
          />
          <small>
            Add quantities, alternates, dimensions, setup, access, and timing
            notes for the requested rental items.
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
          : "Send an enquiry"}
      </button>
      {submitState.status === "success" ? (
        <section
          aria-label="Quote enquiry receipt"
          className="quote-form__status quote-form__status--success quote-form__receipt"
          role="status"
        >
          <p className="eyebrow">Enquiry received</p>
          <h3>Quote request received</h3>
          <p>
            The team can review your request and follow up directly with next
            questions or quote details.
          </p>
          <dl className="quote-form__receipt-details">
            <div>
              <dt>Public reference receipt</dt>
              <dd>
                {receiptReference ??
                  "Reference will be shared during follow-up"}
              </dd>
            </div>
            <div>
              <dt>Next team action</dt>
              <dd>
                Review contact details, event timing, venue or location,
                requested listings, and setup notes.
              </dd>
            </div>
          </dl>
          <p>
            This is a receipt only. It does not set aside furniture and does not
            finalise rental details or create an online follow-up page.
          </p>
          <div
            aria-label="After quote request"
            className="quote-form__receipt-actions"
          >
            <a className="button button--secondary" href="/listings">
              Browse rental listings
            </a>
            <a className="button button--secondary" href="/catalogue">
              Browse catalogue
            </a>
            <button
              className="button button--secondary"
              onClick={handleStartAnotherEnquiry}
              type="button"
            >
              Submit another enquiry
            </button>
          </div>
        </section>
      ) : null}
      {submitState.status === "error" ? (
        <p
          className="quote-form__status quote-form__status--error"
          role="alert"
        >
          {submitState.message}
        </p>
      ) : null}
    </form>
  );
}
