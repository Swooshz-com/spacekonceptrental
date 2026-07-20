import "server-only";

import type { QuoteItemSubmission, QuotePersistencePayload, QuoteSubmission } from "./types";

type ValidationResult =
  | { ok: true; value: QuoteSubmission }
  | { ok: false; message: string };
type ItemValidationResult =
  | { ok: true; value: QuoteItemSubmission }
  | { ok: false; message: string };

const allowedTopLevelKeys = new Set([
  "customerName",
  "customerEmail",
  "customerPhone",
  "customerMessage",
  "eventDate",
  "venue",
  "sourcePath",
  "listingSlug",
  "requestId",
  "items"
]);
const allowedItemKeys = new Set(["productName", "quantity", "notes"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 40;
const MAX_CUSTOMER_MESSAGE_LENGTH = 1200;
const MAX_VENUE_LENGTH = 180;
const MAX_SOURCE_PATH_LENGTH = 500;
const MAX_LISTING_SLUG_LENGTH = 120;
const MAX_REQUEST_ID_LENGTH = 128;
const MAX_CRM_SYNC_ERROR_LENGTH = 500;
const MAX_ITEM_NAME_LENGTH = 180;
const MAX_ITEM_NOTES_LENGTH = 500;
const MAX_ITEMS = 20;
const MAX_QUANTITY = 10_000;
const listingSlugPattern = /^[a-z0-9][a-z0-9-]*$/;
const requestIdPattern = /^[A-Za-z0-9._:-]+$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getString(source: Record<string, unknown>, key: string) {
  const value = source[key];

  return typeof value === "string" ? value.trim() : undefined;
}

function rejectUnknownKeys(
  source: Record<string, unknown>,
  allowedKeys: Set<string>,
  label: string
) {
  const unknownKey = Object.keys(source).find((key) => !allowedKeys.has(key));

  if (!unknownKey) {
    return undefined;
  }

  return `${label} contains unknown field: ${unknownKey}.`;
}

function validateLength(
  value: string | undefined,
  fieldName: string,
  maxLength: number
) {
  if (value && value.length > maxLength) {
    return `${fieldName} must be ${maxLength} characters or fewer.`;
  }

  return undefined;
}

function isValidDate(value: string) {
  if (!datePattern.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.valueOf()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function isSafeSiteRelativePath(value: string) {
  return (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

function validateItem(value: unknown, index: number): ItemValidationResult {
  if (!isRecord(value)) {
    return {
      ok: false,
      message: `items[${index}] must be a JSON object.`
    };
  }

  const unknownKeyError = rejectUnknownKeys(
    value,
    allowedItemKeys,
    `items[${index}]`
  );

  if (unknownKeyError) {
    return { ok: false, message: unknownKeyError };
  }

  const productName = getString(value, "productName");
  const notes = getString(value, "notes");
  const quantity = value.quantity;
  const lengthError =
    validateLength(productName, `items[${index}].productName`, MAX_ITEM_NAME_LENGTH) ??
    validateLength(notes, `items[${index}].notes`, MAX_ITEM_NOTES_LENGTH);

  if (!productName) {
    return {
      ok: false,
      message: `items[${index}].productName is required.`
    };
  }

  if (lengthError) {
    return { ok: false, message: lengthError };
  }

  if (
    typeof quantity !== "number" ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > MAX_QUANTITY
  ) {
    return {
      ok: false,
      message: `items[${index}].quantity must be a positive integer no greater than ${MAX_QUANTITY}.`
    };
  }

  return {
    ok: true,
    value: {
      productName,
      quantity,
      ...(notes ? { notes } : {})
    }
  };
}

export function validateQuoteSubmission(payload: unknown): ValidationResult {
  if (!isRecord(payload)) {
    return { ok: false, message: "Request body must be a JSON object." };
  }

  const unknownKeyError = rejectUnknownKeys(
    payload,
    allowedTopLevelKeys,
    "Request body"
  );

  if (unknownKeyError) {
    return { ok: false, message: unknownKeyError };
  }

  const customerName = getString(payload, "customerName");
  const customerEmail = getString(payload, "customerEmail");
  const customerPhone = getString(payload, "customerPhone");
  const customerMessage = getString(payload, "customerMessage");
  const eventDate = getString(payload, "eventDate");
  const venue = getString(payload, "venue");
  const sourcePath = getString(payload, "sourcePath");
  const listingSlug = getString(payload, "listingSlug");
  const requestId = getString(payload, "requestId");
  const lengthError =
    validateLength(customerName, "customerName", MAX_NAME_LENGTH) ??
    validateLength(customerEmail, "customerEmail", MAX_EMAIL_LENGTH) ??
    validateLength(customerPhone, "customerPhone", MAX_PHONE_LENGTH) ??
    validateLength(
      customerMessage,
      "customerMessage",
      MAX_CUSTOMER_MESSAGE_LENGTH
    ) ??
    validateLength(venue, "venue", MAX_VENUE_LENGTH) ??
    validateLength(sourcePath, "sourcePath", MAX_SOURCE_PATH_LENGTH) ??
    validateLength(listingSlug, "listingSlug", MAX_LISTING_SLUG_LENGTH) ??
    validateLength(requestId, "requestId", MAX_REQUEST_ID_LENGTH);

  if (!customerName) {
    return { ok: false, message: "customerName is required." };
  }

  if (!customerEmail && !customerPhone) {
    return {
      ok: false,
      message: "At least one contact method is required."
    };
  }

  if (lengthError) {
    return { ok: false, message: lengthError };
  }

  if (customerEmail && !emailPattern.test(customerEmail)) {
    return { ok: false, message: "customerEmail must be a valid email address." };
  }

  if (eventDate && !isValidDate(eventDate)) {
    return { ok: false, message: "eventDate must use YYYY-MM-DD format." };
  }

  if (sourcePath && !isSafeSiteRelativePath(sourcePath)) {
    return { ok: false, message: "sourcePath must be a site-relative path." };
  }

  if (listingSlug && !listingSlugPattern.test(listingSlug)) {
    return { ok: false, message: "listingSlug must be a valid listing slug." };
  }

  if (!requestId) {
    return { ok: false, message: "requestId is required." };
  }

  if (!requestIdPattern.test(requestId)) {
    return {
      ok: false,
      message: "requestId must be a valid submission identifier."
    };
  }

  const rawItems = payload.items;
  const items: QuoteItemSubmission[] = [];

  if (rawItems !== undefined) {
    if (!Array.isArray(rawItems)) {
      return { ok: false, message: "items must be an array." };
    }

    if (rawItems.length > MAX_ITEMS) {
      return {
        ok: false,
        message: `items must contain ${MAX_ITEMS} items or fewer.`
      };
    }

    for (let index = 0; index < rawItems.length; index += 1) {
      const itemResult = validateItem(rawItems[index], index);

      if (!itemResult.ok) {
        return itemResult;
      }

      items.push(itemResult.value);
    }
  }

  return {
    ok: true,
    value: {
      customerName,
      ...(customerEmail ? { customerEmail } : {}),
      ...(customerPhone ? { customerPhone } : {}),
      ...(customerMessage ? { customerMessage } : {}),
      ...(eventDate ? { eventDate } : {}),
      ...(venue ? { venue } : {}),
      ...(sourcePath ? { sourcePath } : {}),
      ...(listingSlug ? { listingSlug } : {}),
      requestId,
      items
    }
  };
}

export function normalizeCrmSyncError(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, MAX_CRM_SYNC_ERROR_LENGTH);
}

export function prepareQuoteForPersistence(
  quote: QuoteSubmission
): QuotePersistencePayload {
  return {
    ...quote,
    sourcePagePath: quote.sourcePath ?? null,
    sourceListingSlug: quote.listingSlug ?? null,
    submissionRequestId: quote.requestId ?? null,
    crmProvider: "hubspot",
    crmSyncStatus: "not_queued",
    crmContactId: null,
    crmDealId: null,
    crmLastSyncAttemptAt: null,
    crmSyncError: null
  };
}
