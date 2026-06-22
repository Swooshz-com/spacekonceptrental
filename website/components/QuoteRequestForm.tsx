"use client";

import { useState, useEffect, useMemo } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useQuoteList } from "./QuoteListContext";

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

  const { items } = useQuoteList();
  const [itemsText, setItemsText] = useState(initialItemsText);
  const [hasMergedList, setHasMergedList] = useState(false);

  useEffect(() => {
    if (!hasMergedList && items.length > 0) {
      // Append items to itemsText if they are not already in it
      const newItemsText = [
        itemsText,
        itemsText ? "\n--- From Quote List ---" : "",
        ...items.map(item => `1x ${item.name} (${item.slug})`)
      ].filter(Boolean).join('\n');

      setItemsText(newItemsText);
      setHasMergedList(true);
    }
  }, [items, hasMergedList, itemsText]);

  function handleItemsTextChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setItemsText(event.target.value);
  }

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
  const selectedListingDetailHref = safeInitialListingSlug
    ? `/catalogue/${encodeURIComponent(safeInitialListingSlug)}`
    : undefined;

  return (
    <form
      aria-busy={submitState.status === "submitting"}
      style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
      noValidate
      onSubmit={handleSubmit}
    >
      {initialItemsText ? (
        <aside style={{ padding: '16px', backgroundColor: 'var(--surface-strong)', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--muted)' }}>
          <strong>Requested Items:</strong> You've added {initialItemsText}. Our team will review these details.
        </aside>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', margin: 0 }}>Contact Details</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          <div>
            <label className="sr-only" htmlFor="customerName">Your name (required)</label>
            <input
              id="customerName"
              className="input-material"
              aria-describedby={fieldErrors.customerName ? "quote-customer-name-error" : undefined}
              aria-invalid={fieldErrors.customerName ? "true" : undefined}
              autoComplete="name"
              name="customerName"
              placeholder="First & Last Name"
              required
              type="text"
            />
            {fieldErrors.customerName && (
              <small style={{ color: '#ba1a1a', display: 'block', marginTop: '4px' }} id="quote-customer-name-error">
                {fieldErrors.customerName}
              </small>
            )}
          </div>

          <div>
            <label className="sr-only" htmlFor="customerEmail">Email address</label>
            <input
              id="customerEmail"
              className="input-material"
              aria-describedby={fieldErrors.contact ? "quote-contact-error" : undefined}
              aria-invalid={fieldErrors.contact ? "true" : undefined}
              autoComplete="email"
              name="customerEmail"
              placeholder="Email Address"
              type="email"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          <div>
            <label className="sr-only" htmlFor="customerPhone">Phone number</label>
            <input
              id="customerPhone"
              className="input-material"
              aria-describedby={fieldErrors.contact ? "quote-contact-error" : undefined}
              aria-invalid={fieldErrors.contact ? "true" : undefined}
              autoComplete="tel"
              name="customerPhone"
              placeholder="Phone Number"
              type="tel"
            />
            {fieldErrors.contact && (
              <small style={{ color: '#ba1a1a', display: 'block', marginTop: '4px' }} id="quote-contact-error">
                {fieldErrors.contact}
              </small>
            )}
          </div>

          <div>
            <label className="sr-only" htmlFor="preferredContactMethod">Preferred contact method</label>
            <select
              id="preferredContactMethod"
              className="input-material"
              name="preferredContactMethod"
              onChange={handlePreferredContactMethodChange}
              value={preferredContactMethod}
              style={{ color: preferredContactMethod ? 'var(--text)' : 'var(--muted)' }}
            >
              <option value="">Preferred Contact Method: None</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="either email or phone">Either email or phone</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '8px' }}>
        <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', margin: 0 }}>Event Context</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          <div>
            <label className="sr-only" htmlFor="eventDate">Event date (if known)</label>
            <input
              id="eventDate"
              className="input-material"
              name="eventDate"
              type="date"
              style={{ color: 'inherit' }}
            />
            <small style={{ color: 'var(--muted)', display: 'block', marginTop: '4px', fontSize: '0.75rem' }}>
              Event date (if known)
            </small>
          </div>

          <div>
            <label className="sr-only" htmlFor="venue">Venue or location</label>
            <input
              id="venue"
              className="input-material"
              name="venue"
              placeholder="Venue or event location"
              type="text"
            />
          </div>
        </div>

        <div>
          <label className="sr-only" htmlFor="items">Requested listings or items</label>
          <textarea
            id="items"
            className="input-material"
            style={{ resize: 'none', borderRadius: '4px' }}
            value={itemsText}
            onChange={handleItemsTextChange}
            name="items"
            placeholder="Items (e.g. 20 stools, 4 cocktail tables...)"
            rows={2}
          />
        </div>

        <div>
          <label className="sr-only" htmlFor="customerMessage">Additional Notes</label>
          <textarea
            id="customerMessage"
            className="input-material"
            style={{ resize: 'none', borderRadius: '4px' }}
            aria-label="Customer message / event notes for the team"
            maxLength={customerMessageInputMaxLength}
            name="customerMessage"
            onChange={handleCustomerMessageChange}
            placeholder="Additional details about your vision, setup notes, or alternates..."
            rows={3}
            value={customerMessageText}
          />
        </div>
      </div>

      <div style={{ paddingTop: '16px' }}>
        <button
          style={{ width: '100%', backgroundColor: 'var(--accent)', color: '#fff', fontSize: '0.875rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600, padding: '16px 32px', borderRadius: '8px', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background-color 0.2s' }}
          disabled={submitState.status === "submitting"}
          type="submit"
        >
          {submitState.status === "submitting"
            ? "Sending quote request..."
            : "Submit Quote Request"}
          <svg width="20" height="20" viewBox={["0","0","24","24"].join(" ")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points={["12", "5", "19", "12", "12", "19"].join(" ")}></polyline>
          </svg>
        </button>
        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--muted)', marginTop: '16px' }}>
          No commitment required. Await our manual review.
        </p>
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'center' }}>
        By sending an enquiry, review the{" "}
        <a href="/privacy" style={{ textDecoration: 'underline' }}>Privacy Policy</a> and{" "}
        <a href="/terms" style={{ textDecoration: 'underline' }}>Terms of Use</a>. The team uses your details for
        manual follow-up.
      </p>

      {submitState.status === "success" ? (
        <section
          aria-label="Quote enquiry receipt"
          style={{ padding: '24px', backgroundColor: 'var(--surface-strong)', borderRadius: '8px', marginTop: '32px' }}
          role="status"
        >
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Enquiry received</p>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', fontFamily: 'var(--font-serif)' }}>Quote request received</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
            The team can review your request and follow up directly with next
            questions or quote details.
          </p>
          <div style={{ marginBottom: '16px', fontSize: '0.875rem' }}>
            <strong style={{ display: 'block', color: 'var(--text)' }}>Public reference receipt</strong>
            <span style={{ color: 'var(--muted)' }}>{receiptReference ?? "Reference will be shared during follow-up"}</span>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '24px' }}>
            This is a receipt only. It does not set aside furniture and does not
            finalise rental details or create an online follow-up page.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a className="v3-btn v3-btn--outline" href="/listings">
              Browse setups
            </a>
            <a className="v3-btn v3-btn--outline" href="/catalogue">
              Browse catalogue
            </a>
            <button
              className="v3-btn v3-btn--outline"
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
          style={{ padding: '16px', backgroundColor: '#ffdad6', color: '#93000a', borderRadius: '8px', fontSize: '0.875rem' }}
          role="alert"
        >
          {submitState.message}
        </p>
      ) : null}
    </form>
  );
}
