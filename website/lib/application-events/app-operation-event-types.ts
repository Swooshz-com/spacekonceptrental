import "server-only";

export const appOperationEventCategories = Object.freeze([
  "quote.submission",
  "quote.handoff",
  "admin.auth",
  "rate.limit"
] as const);

export type AppOperationEventCategory =
  (typeof appOperationEventCategories)[number];

export const appOperationEventOutcomes = Object.freeze([
  "failed",
  "denied",
  "disabled",
  "pending"
] as const);

export type AppOperationEventOutcome =
  (typeof appOperationEventOutcomes)[number];

export const appOperationEventReferenceTypes = Object.freeze([
  "none",
  "request_id",
  "public_reference"
] as const);

export type AppOperationEventReferenceType =
  (typeof appOperationEventReferenceTypes)[number];

export const appOperationEventSinkStates = Object.freeze([
  "disabled",
  "ready",
  "unconfigured",
  "temporarily_unavailable",
  "misconfigured"
] as const);

export type AppOperationEventSinkState =
  (typeof appOperationEventSinkStates)[number];

export type AppOperationEventFields = {
  eventId: string;
  workspaceId: string;
  category: AppOperationEventCategory;
  outcome: AppOperationEventOutcome;
  referenceType: AppOperationEventReferenceType;
  referenceValue: string | null;
  errorCode: string | null;
  routeKey: string;
  httpStatus: number | null;
  occurredAtMs: number;
};

export type AppOperationEventSigningFields = Omit<
  AppOperationEventFields,
  "eventId" | "workspaceId"
> & {
  eventId: string;
  workspaceId: string;
};

export type AppOperationEventRpcOutcome =
  | { kind: "inserted" }
  | { kind: "duplicate" }
  | { kind: "transient"; code?: string }
  | { kind: "fatal"; code?: string };

export type AppOperationEventEmitResult =
  | { kind: "emitted" }
  | { kind: "duplicate" }
  | {
      kind: "skipped";
      state: AppOperationEventSinkState;
      code?: string;
    };
