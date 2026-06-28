"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

type QuoteApiResponse = {
  publicReference?: string;
  requestId?: string;
  error?: {
    message: string;
    reference?: string;
  };
};

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; publicReference?: string; requestId?: string }
  | { status: "error"; message: string };

type FieldErrors = {
  customerName?: string;
  contact?: string;
};

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

function formatQuoteSubmitError(reference: string | undefined) {
  const message =
    "Your quote request was not sent. Review your details and try again; your entered details should still be here, including any selected listing context.";

  return reference ? `${message} Support reference: ${reference}.` : message;
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submissionRequestId] = useState(createSubmissionRequestId);
  const [preferredContactMethod, setPreferredContactMethod] = useState("");
  const [customerMessageText, setCustomerMessageText] = useState("");
  const customerMessageInputMaxLength = getCustomerMessageMaxLength(
    preferredContactMethod
  );
  const safeInitialListingSlug = getSafeListingSlug(initialListingSlug);

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
    const listingSlug = safeInitialListingSlug;
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

    const nextFieldErrors: FieldErrors = {};

    if (!payload.customerName) {
      nextFieldErrors.customerName =
        "Name is required so the team knows who sent this quote request.";
    }

    if (!payload.customerEmail && !payload.customerPhone) {
      nextFieldErrors.contact =
        "Email address or phone number is required so the team can follow up directly about this quote request.";
    }

    if (nextFieldErrors.customerName || nextFieldErrors.contact) {
      const missingFieldSummary =
        nextFieldErrors.customerName && nextFieldErrors.contact
          ? "Add your name and share an email address or phone number."
          : nextFieldErrors.customerName
            ? "Add your name so the team can review this enquiry."
            : "Share an email address or phone number so the team can follow up on this enquiry.";

      setFieldErrors(nextFieldErrors);
      setSubmitState({
        status: "error",
        message: `${missingFieldSummary} Review the highlighted required fields before sending the enquiry.`
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

    setFieldErrors({});
    setSubmitState({ status: "submitting" });

    let failedSubmitReference: string | undefined;

    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = (await response.json()) as QuoteApiResponse;

      if (!response.ok) {
        failedSubmitReference = body.error?.reference ?? body.requestId;
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
        message: formatQuoteSubmitError(failedSubmitReference)
      });
    }
  }

  const receiptReference =
    submitState.status === "success"
      ? submitState.publicReference ?? submitState.requestId
      : undefined;

  useEffect(() => {
    if (submitState.status !== "success") {
      return;
    }

    window.scrollTo({ top: 0 });
  }, [submitState.status]);

  return (
    <form
      aria-busy={submitState.status === "submitting"}
      className={`quote-form${submitState.status === "success" ? " quote-form--success" : ""}`}
      noValidate
      onSubmit={handleSubmit}
    >
      <p className="quote-form__intro">
        Rental fit is reviewed directly by the team.{" "}
        Share contact details for direct manual follow-up. The team uses these
        details to triage the rental enquiry.{" "}
        Complete the required contact point first. Let us know what you need for your event. Share the date, venue, and requested items - our team will review the details and follow up with a tailored proposal.
      </p>
      {initialItemsText ? (
        <aside className="quote-form__selected" aria-label="Selected listing">
          <strong>Selected listing</strong>
          <span>
            Listing context is a starting point only and not a rental fit
            confirmation. Keep this listing, change it, or add more rental
            items before sending. Add quantities in the requested listings box
            or item notes. The team can review the request during manual
            follow-up. The team will use the requested listing/item context for
            manual follow-up.
          </span>
          <span>
            You've added <strong>{initialItemsText}</strong> to your request.
            This starts this rental request as editable request text; feel free
            to adjust quantities or add more items before submitting.
          </span>
        </aside>
      ) : null}
      <fieldset className="quote-form__field-grid">
        <legend>Contact details</legend>
        <label>
          Name
          <input
            aria-describedby={
              fieldErrors.customerName ? "quote-customer-name-error" : undefined
            }
            aria-invalid={fieldErrors.customerName ? "true" : undefined}
            autoComplete="name"
            name="customerName"
            required
            type="text"
          />
          {fieldErrors.customerName ? (
            <small
              className="quote-form__field-error"
              id="quote-customer-name-error"
            >
              {fieldErrors.customerName}
            </small>
          ) : (
            <small>Share your name so the team knows who sent the enquiry.</small>
          )}
        </label>
        <label>
          Email address
          <input
            aria-describedby={
              fieldErrors.contact ? "quote-contact-error" : undefined
            }
            aria-invalid={fieldErrors.contact ? "true" : undefined}
            autoComplete="email"
            name="customerEmail"
            type="email"
          />
        </label>
        <label>
          Phone number
          <input
            aria-describedby={
              fieldErrors.contact
                ? "quote-contact-helper quote-contact-error"
                : "quote-contact-helper"
            }
            aria-invalid={fieldErrors.contact ? "true" : undefined}
            autoComplete="tel"
            name="customerPhone"
            type="tel"
          />
          <small id="quote-contact-helper">
            Share email, phone, or both. Share one reliable contact method.
            Email or phone required. The team uses this only for direct quote
            follow-up.
          </small>
        </label>
        <small
          aria-hidden={fieldErrors.contact ? undefined : true}
          className={`quote-form__field-error quote-form__full-width quote-form__contact-error${
            fieldErrors.contact ? "" : " quote-form__field-error--reserved"
          }`}
          id={fieldErrors.contact ? "quote-contact-error" : undefined}
        >
          {fieldErrors.contact ?? "Contact validation message space."}
        </small>
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
            The team reviews rental fit directly.
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
        <legend>Rental details</legend>
        <label className="quote-form__full-width">
          Requested listings or items
          <textarea
            defaultValue={initialItemsText}
            name="items"
            placeholder="Example: 20 stools, 4 cocktail tables, or a lounge setup"
            rows={4}
          />
          <small>
            Use one line per requested listing or item. Add quantities here
            when you know them; this editable request text can keep listing,
            category, event-use, or search context as request notes.
          </small>
        </label>
      </fieldset>
      <fieldset className="quote-form__field-grid">
        <legend>Setup/access/timing notes</legend>
        <label className="quote-form__full-width">
          Event Vision
          <textarea
            aria-label="Customer message and event notes for the team"
            maxLength={customerMessageInputMaxLength}
            name="customerMessage"
            onChange={handleCustomerMessageChange}
            placeholder="Tell us about the atmosphere, theme, or specific requirements for your event..."
            rows={4}
            value={customerMessageText}
          />
          <small>
            Share the event style, setup and access timing notes, rental alternates,
            placement needs, or what the team should help you decide.
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
            notes for the requested rental listings/items.
          </small>
        </label>
      </fieldset>
      {submitState.status !== "success" ? (
        <>
          <div
            className={`quote-form__feedback-slot${
              submitState.status === "error"
                ? " quote-form__feedback-slot--active"
                : ""
            }`}
          >
            {submitState.status === "error" ? (
              <p
                className="quote-form__status quote-form__status--error"
                role="alert"
              >
                {submitState.message}
              </p>
            ) : (
              <p
                aria-hidden="true"
                className="quote-form__status quote-form__status--error quote-form__status--reserved"
              >
                Quote form feedback message space.
              </p>
            )}
          </div>
          <button
            className="button"
            disabled={submitState.status === "submitting"}
            type="submit"
          >
            {submitState.status === "submitting"
              ? "Sending enquiry..."
              : "Review and Send an Enquiry"}
          </button>
          <p className="quote-form__legal">
            By sending an enquiry, review the{" "}
            <a href="/privacy">Privacy Policy</a> and{" "}
            <a href="/terms">Terms of Use</a>. The team uses your details for
            manual follow-up.
          </p>
        </>
      ) : null}
      {submitState.status === "success" ? (
        <section
          aria-label="Quote enquiry receipt"
          className="quote-form__status quote-form__status--success quote-form__receipt"
          role="status"
        >
          <h3>Enquiry Received</h3>
          {receiptReference ? (
            <p className="quote-form__receipt-reference">
              {receiptReference}
            </p>
          ) : null}
          <p>
            This request does not confirm final rental details. Our team will
            review your selection and follow up with a tailored proposal.
          </p>
          <div className="quote-form__receipt-details">
            <div>
              <span>Rental enquiry</span>
              <strong>We received your rental enquiry.</strong>
            </div>
            <div>
              <span>Manual review</span>
              <strong>Our team will review your selection.</strong>
            </div>
            <div>
              <span>Follow-up</span>
              <strong>We will follow up after review.</strong>
            </div>
          </div>
          <div
            aria-label="After quote request"
            className="quote-form__receipt-actions"
          >
            <a className="button quote-form__receipt-primary" href="/">
              Return to Home
            </a>
            <a className="button button--secondary" href="/listings">
              Explore More Setups
            </a>
          </div>
        </section>
      ) : null}
    </form>
  );
}
