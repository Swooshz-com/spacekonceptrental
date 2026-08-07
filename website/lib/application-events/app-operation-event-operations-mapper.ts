import "server-only";

import type {
  AppOperationEventCategory,
  AppOperationEventOutcome,
  AppOperationEventReferenceType
} from "./app-operation-event-types";
import {
  appOperationEventCategories,
  appOperationEventOutcomes,
  appOperationEventReferenceTypes
} from "./app-operation-event-types";

export type AppOperationEventOperationsRecord = {
  eventId: string;
  category: AppOperationEventCategory;
  outcome: AppOperationEventOutcome;
  referenceType: AppOperationEventReferenceType;
  referenceValue: string | null;
  errorCode: string | null;
  routeKey: string;
  httpStatus: number | null;
  occurredAt: string;
  createdAt: string;
  retentionEligibleAt: string;
  actorExists: boolean;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const safeReferencePattern = /^[A-Za-z0-9._:-]{1,128}$/;
const errorCodePattern = /^[a-z0-9_:-]{1,80}$/;
const routeKeyPattern = /^[A-Za-z0-9_./-]{1,160}$/;
const httpUrlPattern = /https?:\/\//;
const categorySet = new Set<string>(appOperationEventCategories);
const outcomeSet = new Set<string>(appOperationEventOutcomes);
const referenceTypeSet = new Set<string>(appOperationEventReferenceTypes);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function canonicalUuid(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return uuidPattern.test(trimmed) ? trimmed.toLowerCase() : null;
}

function isTimestampString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim() !== "" &&
    !Number.isNaN(Date.parse(value))
  );
}

/**
 * Strictly maps one stored row onto the allowlisted read model. Any malformed
 * selected value fails the row; the caller must fail the complete result
 * rather than dropping the row. The actor UUID is reduced to a boolean only
 * and never leaves this mapper.
 */
export function mapAppOperationEventOperationsRow(
  row: Record<string, unknown>,
  trustedWorkspaceId: string
): AppOperationEventOperationsRecord | null {
  if (!isRecord(row)) {
    return null;
  }

  const eventId = canonicalUuid(row.event_id);
  const workspaceId = canonicalUuid(row.workspace_id);
  const trustedWorkspaceIdCanonical = canonicalUuid(trustedWorkspaceId);

  if (!eventId || !workspaceId || !trustedWorkspaceIdCanonical) {
    return null;
  }

  if (workspaceId !== trustedWorkspaceIdCanonical) {
    return null;
  }

  const category =
    typeof row.category === "string" && categorySet.has(row.category)
      ? (row.category as AppOperationEventCategory)
      : null;
  const outcome =
    typeof row.outcome === "string" && outcomeSet.has(row.outcome)
      ? (row.outcome as AppOperationEventOutcome)
      : null;
  const referenceType =
    typeof row.reference_type === "string" &&
    referenceTypeSet.has(row.reference_type)
      ? (row.reference_type as AppOperationEventReferenceType)
      : null;

  if (!category || !outcome || !referenceType) {
    return null;
  }

  let referenceValue: string | null = null;

  if (referenceType === "none") {
    if (row.reference_value !== null && row.reference_value !== undefined) {
      return null;
    }
  } else {
    if (
      typeof row.reference_value !== "string" ||
      !safeReferencePattern.test(row.reference_value)
    ) {
      return null;
    }

    referenceValue = row.reference_value;
  }

  let errorCode: string | null = null;

  if (row.error_code !== null && row.error_code !== undefined) {
    if (
      typeof row.error_code !== "string" ||
      !errorCodePattern.test(row.error_code)
    ) {
      return null;
    }

    errorCode = row.error_code;
  }

  if (
    typeof row.route_key !== "string" ||
    !routeKeyPattern.test(row.route_key) ||
    httpUrlPattern.test(row.route_key)
  ) {
    return null;
  }

  let httpStatus: number | null = null;

  if (row.http_status !== null && row.http_status !== undefined) {
    if (
      typeof row.http_status !== "number" ||
      !Number.isInteger(row.http_status) ||
      row.http_status < 100 ||
      row.http_status > 599
    ) {
      return null;
    }

    httpStatus = row.http_status;
  }

  if (
    row.actor_admin_user_id !== null &&
    row.actor_admin_user_id !== undefined &&
    !canonicalUuid(row.actor_admin_user_id)
  ) {
    return null;
  }

  const occurredAt = isTimestampString(row.occurred_at)
    ? row.occurred_at
    : null;
  const createdAt = isTimestampString(row.created_at) ? row.created_at : null;
  const retentionEligibleAt = isTimestampString(row.retention_eligible_at)
    ? row.retention_eligible_at
    : null;

  if (!occurredAt || !createdAt || !retentionEligibleAt) {
    return null;
  }

  if (Date.parse(retentionEligibleAt) < Date.parse(createdAt)) {
    return null;
  }

  return {
    eventId,
    category,
    outcome,
    referenceType,
    referenceValue,
    errorCode,
    routeKey: row.route_key,
    httpStatus,
    occurredAt,
    createdAt,
    retentionEligibleAt,
    actorExists:
      row.actor_admin_user_id !== null && row.actor_admin_user_id !== undefined
  };
}

/**
 * Whole-result mapping: any malformed row fails the complete result. No
 * partial acceptance and no silent row dropping.
 */
export function mapAppOperationEventOperationsRows(
  rows: Record<string, unknown>[],
  trustedWorkspaceId: string
): AppOperationEventOperationsRecord[] | null {
  const mapped = rows.map((row) =>
    mapAppOperationEventOperationsRow(row, trustedWorkspaceId)
  );

  return mapped.some((record) => !record)
    ? null
    : (mapped as AppOperationEventOperationsRecord[]);
}
