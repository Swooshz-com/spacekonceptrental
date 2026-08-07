import "server-only";

import {
  appOperationEventCategories,
  appOperationEventOutcomes,
  type AppOperationEventCategory,
  type AppOperationEventOutcome
} from "./app-operation-event-types";

export const APP_OPERATION_EVENT_OPERATIONS_MAX_ROWS = 200;

export const appOperationEventOperationsSearchableReferenceTypes = Object.freeze([
  "request_id",
  "public_reference"
] as const);

export type AppOperationEventOperationsReferenceType =
  (typeof appOperationEventOperationsSearchableReferenceTypes)[number];

export type AppOperationEventOperationsSearch = {
  referenceType: AppOperationEventOperationsReferenceType;
  referenceValue: string;
};

export type AppOperationEventOperationsQuery = {
  category?: AppOperationEventCategory;
  outcome?: AppOperationEventOutcome;
  search?: AppOperationEventOperationsSearch;
};

export type AppOperationEventOperationsSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type AppOperationEventOperationsParseResult =
  | { kind: "ok"; query: AppOperationEventOperationsQuery }
  | { kind: "invalid" };

const safeReferencePattern = /^[A-Za-z0-9._:-]+$/;
const MAX_SAFE_REFERENCE_LENGTH = 128;
const categorySet = new Set<string>(appOperationEventCategories);
const outcomeSet = new Set<string>(appOperationEventOutcomes);
const referenceTypeSet = new Set<string>(
  appOperationEventOperationsSearchableReferenceTypes
);

/**
 * Canonicalises a supplied safe-reference value against the existing
 * safe-reference contract: trimmed, 1..128 characters, and only the locked
 * safe character class. Returns null for malformed, empty, whitespace-only or
 * overlong values. Invalid values are never returned, logged or rendered.
 */
export function canonicaliseAppOperationEventReferenceValue(
  value: unknown
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed.length > MAX_SAFE_REFERENCE_LENGTH) {
    return null;
  }

  return safeReferencePattern.test(trimmed) ? trimmed : null;
}

function parseSingleString(
  params: AppOperationEventOperationsSearchParams,
  key: string
): { present: false } | { present: true; value: string } | "invalid" {
  const raw = params[key];

  if (raw === undefined) {
    return { present: false };
  }

  if (typeof raw !== "string") {
    return "invalid";
  }

  return { present: true, value: raw };
}

function parseExactFilter(
  params: AppOperationEventOperationsSearchParams,
  key: string,
  allowed: Set<string>
): string | null | undefined {
  const parsed = parseSingleString(params, key);

  if (parsed === "invalid") {
    return null;
  }

  if (!parsed.present) {
    return undefined;
  }

  const trimmed = parsed.value.trim();

  if (!trimmed || !allowed.has(trimmed)) {
    return null;
  }

  return trimmed;
}

export function parseAppOperationEventOperationsSearchParams(
  params: AppOperationEventOperationsSearchParams
): AppOperationEventOperationsParseResult {
  const category = parseExactFilter(params, "category", categorySet);
  const outcome = parseExactFilter(params, "outcome", outcomeSet);

  if (category === null || outcome === null) {
    return { kind: "invalid" };
  }

  const typeParsed = parseSingleString(params, "referenceType");
  const valueParsed = parseSingleString(params, "referenceValue");

  if (typeParsed === "invalid" || valueParsed === "invalid") {
    return { kind: "invalid" };
  }

  if (typeParsed.present !== valueParsed.present) {
    return { kind: "invalid" };
  }

  let search: AppOperationEventOperationsSearch | undefined;

  if (typeParsed.present && valueParsed.present) {
    const referenceType = typeParsed.value.trim();
    const referenceValue = canonicaliseAppOperationEventReferenceValue(
      valueParsed.value
    );

    if (!referenceTypeSet.has(referenceType) || !referenceValue) {
      return { kind: "invalid" };
    }

    search = {
      referenceType: referenceType as AppOperationEventOperationsReferenceType,
      referenceValue
    };
  }

  const query: AppOperationEventOperationsQuery = {};

  if (category !== undefined) {
    query.category = category as AppOperationEventCategory;
  }

  if (outcome !== undefined) {
    query.outcome = outcome as AppOperationEventOutcome;
  }

  if (search) {
    query.search = search;
  }

  return { kind: "ok", query };
}
