"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import {
  QUOTE_MANUAL_DESCRIPTION_MAX_LENGTH,
  QUOTE_MANUAL_NOTES_MAX_LENGTH,
  QUOTE_SELECTION_MAX_QUANTITY,
  QUOTE_SELECTION_STORAGE_KEY,
  commitQuoteSelectionChange,
  createManualSelectionRow,
  emptyQuoteSelection,
  parseStoredQuoteSelection,
  selectionSatisfiesRequiredSelection,
  type CanonicalCatalogueIdentity,
  type QuoteSelection,
  type QuoteSelectionStorageAdapter
} from "../lib/quote/selection-model";

const quoteSelectionChangeEvent = "skr:quote-selection-change";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+()\d][+()\d\s.-]{5,39}$/;
const phoneDigitPattern = /\d/;

type FieldErrors = Partial<
  Record<
    | "customerName"
    | "customerEmail"
    | "customerPhone"
    | "selection"
    | "manualDescription"
    | "manualQuantity"
    | "storage",
    string
  >
>;

type ReadSelectionResult =
  | { ok: true; value: import("../lib/quote/selection-model").QuoteSelection }
  | { ok: false; code: "storage-unavailable" };

function readSelection(): ReadSelectionResult {
  if (typeof window === "undefined") {
    return { ok: true, value: emptyQuoteSelection() };
  }

  let raw: string | null;
  try {
    raw = window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY);
  } catch {
    return { ok: false, code: "storage-unavailable" };
  }

  const parsed = parseStoredQuoteSelection(raw);

  return parsed.ok
    ? { ok: true, value: parsed.value }
    : { ok: true, value: emptyQuoteSelection() };
}

function buildBrowserStorage(): QuoteSelectionStorageAdapter {
  return {
    read: () => window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY),
    write: (serialized) =>
      window.sessionStorage.setItem(QUOTE_SELECTION_STORAGE_KEY, serialized),
    remove: () =>
      window.sessionStorage.removeItem(QUOTE_SELECTION_STORAGE_KEY),
    dispatchSuccess: () =>
      window.dispatchEvent(new Event(quoteSelectionChangeEvent))
  };
}

function focusFirstError(form: HTMLFormElement, errors: FieldErrors) {
  const firstName = Object.keys(errors)[0];

  if (firstName === "selection") {
    const target = document.getElementById("quote-selection");

    if (target) {
      target.focus();
    }

    return;
  }

  const target = firstName
    ? form.elements.namedItem(firstName)
    : undefined;

  if (target instanceof HTMLElement) {
    target.focus();
  }
}

export default function QuoteRequestForm({
  initialItemsText: _initialItemsText = "",
  initialListingSlug,
  validCanonicalIdentities = []
}: {
  initialItemsText?: string;
  initialListingSlug?: string;
  validCanonicalIdentities?: CanonicalCatalogueIdentity[];
}) {
  const errorSummaryId = useId();
  const [selection, setSelection] = useState<QuoteSelection>(
    emptyQuoteSelection
  );
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [preferredContactMethod, setPreferredContactMethod] = useState<
    "email" | "phone"
  >("email");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [manualDescription, setManualDescription] = useState("");
  const [manualQuantity, setManualQuantity] = useState("1");
  const [manualNotes, setManualNotes] = useState("");

  useEffect(() => {
    function syncSelection() {
      const result = readSelection();

      if (result.ok) {
        setSelection(result.value);
        setStorageUnavailable(false);
      } else {
        setStorageUnavailable(true);
      }
    }

    syncSelection();
    window.addEventListener(quoteSelectionChangeEvent, syncSelection);

    return () => {
      window.removeEventListener(quoteSelectionChangeEvent, syncSelection);
    };
  }, []);

  function addManualRequirement() {
    const quantity = Number(manualQuantity);
    const errors: FieldErrors = {};

    if (!manualDescription.trim()) {
      errors.manualDescription = "Describe the manual requirement.";
    }

    if (
      !/^(?:[1-9]|[1-9]\d)$/.test(manualQuantity) ||
      quantity > QUOTE_SELECTION_MAX_QUANTITY
    ) {
      errors.manualQuantity = "Quantity must be a whole number from 1 to 99.";
    }

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    const row = createManualSelectionRow({
      key: `manual-${crypto.randomUUID()}`,
      description: manualDescription,
      quantity,
      ...(manualNotes.trim() ? { notes: manualNotes } : {}),
      position: selection.rows.length
    });

    if (!row) {
      setFieldErrors({
        manualDescription:
          "This manual requirement could not be added. Check the limits and try again."
      });
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const result = commitQuoteSelectionChange(buildBrowserStorage(), {
      kind: "manual-add",
      row
    });

    if (!result.ok) {
      const resync = readSelection();
      setSelection(resync.ok ? resync.value : selection);
      setFieldErrors((prev) => ({
        ...prev,
        manualDescription:
          result.code === "restore-failed" || result.code === "read-back-mismatch" || result.code === "storage-exception"
            ? "Storage could not be updated. The current selection has been reloaded from this tab."
            : "This manual requirement could not be added. Check the limits and try again."
      }));
      return;
    }

    setSelection(result.value);
    setManualDescription("");
    setManualQuantity("1");
    setManualNotes("");
    setFieldErrors((prev) => {
      const { selection: _selection, manualDescription: _manualDescription, manualQuantity: _manualQuantity, ...rest } = prev;
      return rest;
    });
  }

  function removeManualRequirement(key: string) {
    if (typeof window === "undefined") {
      return;
    }

    const result = commitQuoteSelectionChange(buildBrowserStorage(), {
      kind: "manual-remove",
      key
    });

    if (result.ok) {
      setSelection(result.value);
      setFieldErrors((prev) => {
        const { selection: _selection, ...rest } = prev;
        return rest;
      });
    } else {
      const resync = readSelection();
      setSelection(resync.ok ? resync.value : selection);
      setFieldErrors((prev) => ({
        ...prev,
        selection:
          result.code === "restore-failed" ||
          result.code === "read-back-mismatch" ||
          result.code === "storage-exception"
            ? "Storage could not be updated. The current selection has been reloaded from this tab."
            : "This manual requirement could not be removed. Check the limits and try again."
      }));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("customerName") ?? "").trim();
    const email = String(data.get("customerEmail") ?? "").trim();
    const phone = String(data.get("customerPhone") ?? "").trim();
    const errors: FieldErrors = {};

    if (!name) {
      errors.customerName = "Name is required.";
    }

    if (email && !emailPattern.test(email)) {
      errors.customerEmail = "Enter a valid email address.";
    }

    if (phone && !phonePattern.test(phone)) {
      errors.customerPhone = "Enter a valid phone number.";
    } else if (phone && !phoneDigitPattern.test(phone)) {
      errors.customerPhone = "Phone number must contain at least one digit.";
    }

    if (preferredContactMethod === "email" && !email) {
      errors.customerEmail = "Email address is required for email follow-up.";
    }

    if (preferredContactMethod === "phone" && !phone) {
      errors.customerPhone = "Phone number is required for phone follow-up.";
    } else if (preferredContactMethod === "phone" && phone && !phoneDigitPattern.test(phone)) {
      errors.customerPhone = "Phone number must contain at least one digit.";
    }

    if (storageUnavailable) {
      errors.storage = "Selection storage is unavailable in this browser context.";
    }

    let storedSerialized: string | null = null;

    if (!storageUnavailable && typeof window !== "undefined") {
      try {
        storedSerialized = window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY);
      } catch {
        errors.storage = "Selection storage is unavailable in this browser context.";
      }
    }

    const hasAcceptedSelection = selectionSatisfiesRequiredSelection(
      storedSerialized,
      validCanonicalIdentities
    );

    if (!hasAcceptedSelection) {
      errors.selection =
        "Select a published catalogue listing or add a valid manual requirement.";
    }

    setFieldErrors(errors);
    focusFirstError(form, errors);
  }

  const errorEntries = Object.entries(fieldErrors);
  const manualRows = selection.rows.filter((row) => row.kind === "manual");

  return (
    <form
      aria-describedby={errorEntries.length ? errorSummaryId : undefined}
      className="quote-form"
      noValidate
      onSubmit={handleSubmit}
    >
      <p className="quote-form__intro">
        Rental fit is reviewed directly by the team. Build a structured
        request for review; this is not a rental fit confirmation. Email is the
        default contact method. Share a phone number if you prefer phone
        follow-up. Exact rental details and alternatives are confirmed only by
        the team.
      </p>

      {storageUnavailable ? (
        <section
          className="quote-form__status quote-form__status--error"
          role="alert"
        >
          <p>Selection storage is unavailable in this browser context. Existing catalogue selections cannot be read or updated.</p>
        </section>
      ) : null}

      {errorEntries.length ? (
        <section
          aria-labelledby={`${errorSummaryId}-title`}
          className="quote-form__status quote-form__status--error"
          id={errorSummaryId}
          role="alert"
          tabIndex={-1}
        >
          <h3 id={`${errorSummaryId}-title`}>Check your request</h3>
          <ul>
            {errorEntries.map(([field, message]) => (
              <li key={field}>
                <a href={`#quote-${field}`}>{message}</a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <fieldset>
        <legend>Contact details</legend>
        <div className="quote-form__field-grid">
          <label>
            Your name <span aria-hidden="true">*</span>
            <input
              aria-describedby={
                fieldErrors.customerName
                  ? "quote-customerName-error"
                  : undefined
              }
              aria-invalid={fieldErrors.customerName ? "true" : undefined}
              autoComplete="name"
              id="quote-customerName"
              maxLength={120}
              name="customerName"
              required
            />
            {fieldErrors.customerName ? (
              <small
                className="quote-form__field-error"
                id="quote-customerName-error"
              >
                {fieldErrors.customerName}
              </small>
            ) : null}
          </label>
          <label>
            Preferred contact method <span aria-hidden="true">*</span>
            <select
              name="preferredContactMethod"
              onChange={(event) =>
                setPreferredContactMethod(
                  event.target.value === "phone" ? "phone" : "email"
                )
              }
              required
              value={preferredContactMethod}
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
            </select>
          </label>
          <label>
            Email address
            <input
              aria-describedby={
                fieldErrors.customerEmail
                  ? "quote-customerEmail-error"
                  : undefined
              }
              aria-invalid={fieldErrors.customerEmail ? "true" : undefined}
              autoComplete="email"
              id="quote-customerEmail"
              maxLength={254}
              name="customerEmail"
              required={preferredContactMethod === "email"}
              type="email"
            />
            {fieldErrors.customerEmail ? (
              <small
                className="quote-form__field-error"
                id="quote-customerEmail-error"
              >
                {fieldErrors.customerEmail}
              </small>
            ) : null}
          </label>
          <label>
            Phone number
            <input
              aria-describedby={
                fieldErrors.customerPhone
                  ? "quote-customerPhone-error"
                  : undefined
              }
              aria-invalid={fieldErrors.customerPhone ? "true" : undefined}
              autoComplete="tel"
              id="quote-customerPhone"
              maxLength={40}
              name="customerPhone"
              required={preferredContactMethod === "phone"}
              type="tel"
            />
            {fieldErrors.customerPhone ? (
              <small
                className="quote-form__field-error"
                id="quote-customerPhone-error"
              >
                {fieldErrors.customerPhone}
              </small>
            ) : null}
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Event details</legend>
        <div className="quote-form__field-grid">
          <label>
            Event date
            <input name="eventDate" type="date" />
          </label>
          <label>
            Venue or location
            <input maxLength={180} name="venue" />
          </label>
          <label className="quote-form__full-width">
            Event vision
            <textarea maxLength={1200} name="customerMessage" rows={4} />
          </label>
        </div>
      </fieldset>

      <fieldset
        aria-describedby={
          fieldErrors.selection ? "quote-selection-error" : undefined
        }
        id="quote-selection"
        tabIndex={-1}
      >
        <legend>Manual requirements</legend>
        {fieldErrors.selection ? (
          <small
            className="quote-form__field-error"
            id="quote-selection-error"
          >
            {fieldErrors.selection}
          </small>
        ) : null}
        <p>
          Use a separate manual row only when the catalogue does not describe
          the item. It will be reviewed and does not create a catalogue item,
          rental promise or automatic substitute.
        </p>
        {manualRows.length ? (
          <ul className="quote-form__manual-list">
            {manualRows.map((row) => (
              <li key={row.key}>
                <span>
                  {row.description} - Qty {row.quantity}
                  {row.notes ? ` - ${row.notes}` : ""}
                </span>
                <button
                  aria-label={`Remove manual requirement ${row.description}`}
                  onClick={() => removeManualRequirement(row.key)}
                  type="button"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="quote-form__field-grid">
          <label className="quote-form__full-width">
            Manual item description
            <input
              aria-describedby={
                fieldErrors.manualDescription
                  ? "quote-manualDescription-error"
                  : undefined
              }
              aria-invalid={
                fieldErrors.manualDescription ? "true" : undefined
              }
              id="quote-manualDescription"
              maxLength={QUOTE_MANUAL_DESCRIPTION_MAX_LENGTH}
              name="manualDescription"
              onChange={(event) => setManualDescription(event.target.value)}
              value={manualDescription}
            />
            {fieldErrors.manualDescription ? (
              <small
                className="quote-form__field-error"
                id="quote-manualDescription-error"
              >
                {fieldErrors.manualDescription}
              </small>
            ) : null}
          </label>
          <label>
            Manual item quantity
            <input
              aria-describedby={
                fieldErrors.manualQuantity
                  ? "quote-manualQuantity-error"
                  : undefined
              }
              aria-invalid={fieldErrors.manualQuantity ? "true" : undefined}
              id="quote-manualQuantity"
              inputMode="numeric"
              max={QUOTE_SELECTION_MAX_QUANTITY}
              min={1}
              name="manualQuantity"
              onChange={(event) => setManualQuantity(event.target.value)}
              pattern="[1-9]|[1-9][0-9]"
              step={1}
              type="number"
              value={manualQuantity}
            />
            {fieldErrors.manualQuantity ? (
              <small
                className="quote-form__field-error"
                id="quote-manualQuantity-error"
              >
                {fieldErrors.manualQuantity}
              </small>
            ) : null}
          </label>
          <label>
            Manual item notes
            <textarea
              maxLength={QUOTE_MANUAL_NOTES_MAX_LENGTH}
              name="manualNotes"
              onChange={(event) => setManualNotes(event.target.value)}
              rows={3}
              value={manualNotes}
            />
          </label>
        </div>
        <button className="button button--secondary" onClick={addManualRequirement} type="button">
          Add manual requirement
        </button>
      </fieldset>

      <label className="quote-form__full-width">
        Item-specific notes
        <textarea maxLength={500} name="itemNotes" rows={3} />
      </label>

      <input
        name="listingSlug"
        type="hidden"
        value={initialListingSlug ?? ""}
      />

      <p className="quote-form__legal">
        Review our <Link href="/privacy">Privacy Policy</Link> and{" "}
        <Link href="/terms">Terms of Use</Link>.
      </p>

      <button
        aria-describedby="quote-submission-review-note"
        className="button quote-form__submit"
        type="submit"
      >
        <span className="quote-form__submit-text">
          Submission unavailable during review
        </span>
        <span aria-hidden="true" className="quote-form__submit-icon">
          →
        </span>
      </button>
      <p className="quote-form__status quote-form__status--info" id="quote-submission-review-note">
        You can prepare and keep this draft in this browser tab, but it cannot
        be sent while the submission capability is under review.
      </p>
    </form>
  );
}
