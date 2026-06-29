"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  clearStoredQuoteSelection,
  formatQuoteSelectionItems,
  getStoredQuoteSelection
} from "./QuoteSelectionControls";

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
  customerEmail?: string;
  customerPhone?: string;
  submit?: string;
};

const customerMessageMaxLength = 1200;
const requestedItemsMaxCount = 20;
const requestedItemMaxLength = 180;
const sourcePathMaxLength = 500;
const requestIdMaxLength = 128;
const requestIdFallbackRadix = 36;
const listingSlugPattern = /^[a-z0-9][a-z0-9-]*$/;
const requestIdPattern = /^[A-Za-z0-9._:-]+$/;
const quoteSelectionChangeEvent = "skr:quote-selection-change";
const quoteSelectionGroupHeadingPattern =
  /^(selected rental items|setup included rental pieces|selected setup directions):$/i;

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
    .filter((line) => line && !quoteSelectionGroupHeadingPattern.test(line))
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

function scrollToFormControl(form: HTMLFormElement, fieldName: string) {
  const control = form.elements.namedItem(fieldName);

  if (!(control instanceof HTMLElement)) {
    return;
  }

  const scrollTarget = control.closest("label") ?? control;

  scrollTarget.scrollIntoView?.({ behavior: "smooth", block: "center" });
  control.focus({ preventScroll: true });
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
  const [preferredContactMethod, setPreferredContactMethod] = useState("email");
  const [customerMessageText, setCustomerMessageText] = useState("");
  const [itemsText, setItemsText] = useState(initialItemsText);
  const [showSelectedItemsSummary, setShowSelectedItemsSummary] = useState(Boolean(initialItemsText));
  const lastSyncedSelectionText = useRef("");
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

    const form = event.currentTarget;
    const formData = new FormData(form);
    const submittedItemsText = itemsText.trim();
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
      items: parseRequestedItems(submittedItemsText, itemNotesText)
    };

    const nextFieldErrors: FieldErrors = {};

    if (!payload.customerName) {
      nextFieldErrors.customerName =
        "Name is required so the team knows who sent this quote request.";
    }

    if (submittedPreferredContactMethod === "phone") {
      if (!payload.customerPhone) {
        nextFieldErrors.customerPhone =
          "Phone number is required so the team can follow up directly about this quote request.";
      }
    } else if (!payload.customerEmail) {
      nextFieldErrors.customerEmail =
        "Email address is required so the team can follow up directly about this quote request.";
    }

    if (
      nextFieldErrors.customerName ||
      nextFieldErrors.customerEmail ||
      nextFieldErrors.customerPhone
    ) {
      setFieldErrors(nextFieldErrors);
      setSubmitState({ status: "idle" });
      scrollToFormControl(
        form,
        nextFieldErrors.customerName
          ? "customerName"
          : nextFieldErrors.customerEmail
            ? "customerEmail"
            : "customerPhone"
      );
      return;
    }

    if (submittedItemsText && payload.items.length === 0) {
      setFieldErrors({
        submit:
          "Use short listing or item lines, or leave requested items blank and explain the setup in the notes."
      });
      setSubmitState({ status: "idle" });
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
      clearStoredQuoteSelection();
    } catch {
      const submitError = formatQuoteSubmitError(failedSubmitReference);

      setFieldErrors({ submit: submitError });
      setSubmitState({ status: "error", message: submitError });
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

  useEffect(() => {
    function syncStoredItemsText() {
      const storedItemsText = formatQuoteSelectionItems(getStoredQuoteSelection());
      const previousSelectionText = lastSyncedSelectionText.current;

      if (!storedItemsText) {
        if (previousSelectionText) {
          setItemsText((currentItemsText) =>
            currentItemsText.replace(previousSelectionText, "").trim()
          );
          lastSyncedSelectionText.current = "";
        }
        return;
      }

      setShowSelectedItemsSummary(true);
      setItemsText((currentItemsText) => {
        if (previousSelectionText && currentItemsText.includes(previousSelectionText)) {
          lastSyncedSelectionText.current = storedItemsText;
          return currentItemsText.replace(previousSelectionText, storedItemsText).trim();
        }

        const currentLines = currentItemsText
          .split(/\r?\n|\r/)
          .map((line) => line.trim())
          .filter(Boolean);
        const storedLines = storedItemsText
          .split(/\r?\n|\r/)
          .map((line) => line.trim())
          .filter(Boolean);
        const mergedLines = Array.from(new Set([...currentLines, ...storedLines]));

        lastSyncedSelectionText.current = storedItemsText;
        return mergedLines.join("\n");
      });
    }

    syncStoredItemsText();
    window.addEventListener(quoteSelectionChangeEvent, syncStoredItemsText);
    window.addEventListener("storage", syncStoredItemsText);

    return () => {
      window.removeEventListener(quoteSelectionChangeEvent, syncStoredItemsText);
      window.removeEventListener("storage", syncStoredItemsText);
    };
  }, []);

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
        Submitting does not confirm final rental details and does not set aside furniture or finish rental details. Complete the required contact point first. Let us know what you need for your event. Share the date, venue, and requested items - our team will review the details and follow up with a tailored proposal.
      </p>
      <input name="items" readOnly type="hidden" value={itemsText} />
      {showSelectedItemsSummary && itemsText.trim() ? (
        <aside className="quote-form__selected" aria-label="Selected listings">
          <strong>Selected listings</strong>
          <span>
            Listing context is a starting point only and not a rental fit
            confirmation. The selected listings and quantities are synced from
            the selection panel. Add alternates, access, setup, or timing notes
            below for manual follow-up.
          </span>
          <span>
            You've added <strong>{itemsText}</strong> to your request.
            This listing context will be included automatically when you submit.
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
              fieldErrors.customerEmail ? "quote-customer-email-error" : undefined
            }
            aria-invalid={fieldErrors.customerEmail ? "true" : undefined}
            autoComplete="email"
            name="customerEmail"
            type="email"
          />
          {fieldErrors.customerEmail ? (
            <small
              className="quote-form__field-error"
              id="quote-customer-email-error"
            >
              {fieldErrors.customerEmail}
            </small>
          ) : (
            <small>Email is the default contact method for quote follow-up.</small>
          )}
        </label>
        <label>
          Phone number
          <input
            aria-describedby={
              fieldErrors.customerPhone
                ? "quote-contact-helper quote-customer-phone-error"
                : "quote-contact-helper"
            }
            aria-invalid={fieldErrors.customerPhone ? "true" : undefined}
            autoComplete="tel"
            name="customerPhone"
            type="tel"
          />
          <small id="quote-contact-helper">
            Share a phone number if you prefer phone follow-up.
          </small>
          {fieldErrors.customerPhone ? (
            <small
              className="quote-form__field-error"
              id="quote-customer-phone-error"
            >
              {fieldErrors.customerPhone}
            </small>
          ) : null}
        </label>
        <label>
          Preferred contact method
          <select
            name="preferredContactMethod"
            onChange={handlePreferredContactMethodChange}
            value={preferredContactMethod}
          >
            <option value="email">Email</option>
            <option value="phone">Phone</option>
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
          Setup, access, and timing notes
          <textarea
            aria-label="Item-specific notes / setup, access, or timing notes"
            maxLength={500}
            name="itemNotes"
            placeholder="Example: delivery timing, venue access, placement notes, or alternates for the listed items"
            rows={4}
          />
          <small>
            Add alternates, dimensions, setup, access, and timing notes for the
            requested rental listings/items.
          </small>
        </label>
      </fieldset>
      {submitState.status !== "success" ? (
        <>
          {fieldErrors.submit ? (
            <small
              className="quote-form__field-error quote-form__submit-error"
              role="alert"
            >
              {fieldErrors.submit}
            </small>
          ) : null}
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
              <strong>
                We will follow up with a tailored proposal after review.
                Submitting does not confirm final rental details.
              </strong>
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
