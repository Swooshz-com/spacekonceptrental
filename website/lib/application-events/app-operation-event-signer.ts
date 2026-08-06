import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import type { AppOperationEventSigningFields } from "./app-operation-event-types";

export const APP_OPERATION_EVENT_PROOF_TTL_SECONDS = 60;
const MIN_SECRET_BYTES = 32;
const DIGEST_PATTERN = /^[a-f0-9]{64}$/;

export type AppOperationEventProof = {
  payloadDigest: string;
  expiresAt: number;
  signature: string;
};

export type AppOperationEventSignerOptions = {
  env?: { APP_OPERATION_EVENT_ADMISSION_SECRET?: string | null };
  now?: () => Date;
};

// PostgreSQL 17 jsonb_build_object(...)::text emits object keys in the
// internal jsonb storage order of the helper call, not sorted order. This
// exact order is locked through the disposable PostgreSQL-17 RLS harness
// fixture vectors (scripts/test-supabase-rls.cjs).
const canonicalKeyOrder = Object.freeze([
  "outcome",
  "category",
  "event_id",
  "route_key",
  "error_code",
  "http_status",
  "workspace_id",
  "occurred_at_ms",
  "reference_type",
  "reference_value"
]);

type CanonicalFieldBag = Record<(typeof canonicalKeyOrder)[number], unknown>;

function serializeJsonbValue(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      return String(value);
    }

    return JSON.stringify(value);
  }

  throw new Error("unsupported canonical field value");
}

function toCanonicalFieldBag(
  fields: AppOperationEventSigningFields
): CanonicalFieldBag {
  return {
    category: fields.category,
    error_code: fields.errorCode,
    event_id: fields.eventId.toLowerCase(),
    http_status: fields.httpStatus,
    occurred_at_ms: fields.occurredAtMs,
    outcome: fields.outcome,
    reference_type: fields.referenceType,
    reference_value: fields.referenceValue,
    route_key: fields.routeKey,
    workspace_id: fields.workspaceId.toLowerCase()
  };
}

export function buildAppOperationEventCanonicalJsonbText(
  fields: AppOperationEventSigningFields
): string {
  const bag = toCanonicalFieldBag(fields);

  return (
    "{" +
    canonicalKeyOrder
      .map((key) => `"${key}": ${serializeJsonbValue(bag[key])}`)
      .join(", ") +
    "}"
  );
}

export function computeAppOperationEventPayloadDigest(
  fields: AppOperationEventSigningFields
): string {
  return createHash("sha256")
    .update(
      Buffer.from(buildAppOperationEventCanonicalJsonbText(fields), "utf8")
    )
    .digest("hex");
}

export function buildAppOperationEventAdmissionMessage(
  workspaceId: string,
  eventId: string,
  payloadDigest: string,
  expiresAt: number
): string {
  return [
    "skr.app_operation_event.v1",
    workspaceId.toLowerCase(),
    eventId.toLowerCase(),
    payloadDigest.toLowerCase(),
    String(Math.floor(expiresAt))
  ].join("\n");
}

export function issueAppOperationEventAdmissionProof(
  fields: AppOperationEventSigningFields,
  options: AppOperationEventSignerOptions = {}
): AppOperationEventProof | null {
  const secret = (
    options.env ?? process.env
  ).APP_OPERATION_EVENT_ADMISSION_SECRET;

  if (
    typeof secret !== "string" ||
    secret.length === 0 ||
    Buffer.byteLength(secret, "utf8") < MIN_SECRET_BYTES
  ) {
    return null;
  }

  const payloadDigest = computeAppOperationEventPayloadDigest(fields);

  if (!DIGEST_PATTERN.test(payloadDigest)) {
    return null;
  }

  const now = options.now?.() ?? new Date();
  const expiresAt =
    Math.floor(now.getTime() / 1_000) + APP_OPERATION_EVENT_PROOF_TTL_SECONDS;
  const signature = createHmac("sha256", secret)
    .update(
      Buffer.from(
        buildAppOperationEventAdmissionMessage(
          fields.workspaceId,
          fields.eventId,
          payloadDigest,
          expiresAt
        ),
        "utf8"
      )
    )
    .digest("hex");

  return { payloadDigest, expiresAt, signature };
}

export function appOperationEventSignaturesMatchForTests(
  left: string,
  right: string
): boolean {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  return (
    leftBuffer.length === rightBuffer.length &&
    leftBuffer.length > 0 &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}
