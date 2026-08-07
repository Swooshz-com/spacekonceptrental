import { describe, expect, it } from "vitest";

import {
  mapAppOperationEventOperationsRow,
  mapAppOperationEventOperationsRows,
  type AppOperationEventOperationsRecord
} from "./app-operation-event-operations-mapper";

const trustedWorkspaceId = "11111111-1111-4111-8111-111111111111";
const eventId = "22222222-2222-4222-8222-222222222222";
const actorId = "33333333-3333-4333-8333-333333333333";

function validRow(overrides: Record<string, unknown> = {}) {
  return {
    event_id: eventId,
    workspace_id: trustedWorkspaceId,
    category: "quote.handoff",
    outcome: "pending",
    reference_type: "request_id",
    reference_value: "123e4567-e89b-42d3-a456-426614174000",
    error_code: "handoff_pending",
    route_key: "/api/quote",
    http_status: 503,
    actor_admin_user_id: null,
    occurred_at: "2026-08-07T01:02:03.000Z",
    created_at: "2026-08-07T01:02:03.500Z",
    retention_eligible_at: "2026-11-05T01:02:03.500Z",
    ...overrides
  };
}

function expectedRecord(
  overrides: Partial<AppOperationEventOperationsRecord> = {}
): AppOperationEventOperationsRecord {
  return {
    eventId,
    category: "quote.handoff",
    outcome: "pending",
    referenceType: "request_id",
    referenceValue: "123e4567-e89b-42d3-a456-426614174000",
    errorCode: "handoff_pending",
    routeKey: "/api/quote",
    httpStatus: 503,
    occurredAt: "2026-08-07T01:02:03.000Z",
    createdAt: "2026-08-07T01:02:03.500Z",
    retentionEligibleAt: "2026-11-05T01:02:03.500Z",
    actorExists: false,
    ...overrides
  };
}

describe("app operation event operations row mapper", () => {
  it("maps a valid row exactly onto the allowlisted read model", () => {
    expect(mapAppOperationEventOperationsRow(validRow(), trustedWorkspaceId))
      .toEqual(expectedRecord());
  });

  it("converts a database-derived actor UUID to a boolean only", () => {
    const record = mapAppOperationEventOperationsRow(
      validRow({ actor_admin_user_id: actorId }),
      trustedWorkspaceId
    );

    expect(record?.actorExists).toBe(true);
    expect(JSON.stringify(record)).not.toContain(actorId);
    expect(record).not.toHaveProperty("actor_admin_user_id");
  });

  it("maps a none reference with a null value", () => {
    const record = mapAppOperationEventOperationsRow(
      validRow({
        reference_type: "none",
        reference_value: null,
        error_code: null,
        http_status: null
      }),
      trustedWorkspaceId
    );

    expect(record?.referenceType).toBe("none");
    expect(record?.referenceValue).toBeNull();
    expect(record?.errorCode).toBeNull();
    expect(record?.httpStatus).toBeNull();
  });

  it("accepts timestamps in the PostgREST +00:00 offset form", () => {
    const record = mapAppOperationEventOperationsRow(
      validRow({
        occurred_at: "2026-08-07T01:02:03+00:00",
        created_at: "2026-08-07T01:02:04+00:00"
      }),
      trustedWorkspaceId
    );

    expect(record).not.toBeNull();
  });

  it("ignores unknown extra database fields by construction", () => {
    const record = mapAppOperationEventOperationsRow(
      validRow({
        payload: { secret: "value" },
        customer_email: "customer@example.com",
        provider_body: "raw"
      }),
      trustedWorkspaceId
    );

    expect(record).toEqual(expectedRecord());
  });

  it.each([
    ["malformed event_id", { event_id: "not-a-uuid" }],
    ["unknown category", { category: "quote.refund" }],
    ["unknown outcome", { outcome: "succeeded" }],
    ["unknown reference type", { reference_type: "quote_request_id" }],
    ["none with a value", { reference_type: "none", reference_value: "x" }],
    ["request_id without value", { reference_type: "request_id", reference_value: null }],
    ["bad reference value", { reference_value: "has space" }],
    ["overlong reference value", { reference_value: "A".repeat(129) }],
    ["bad error code", { error_code: "Has Upper" }],
    ["bad route key", { route_key: "https://example.com/evil" }],
    ["empty route key", { route_key: "" }],
    ["bad http status low", { http_status: 99 }],
    ["bad http status high", { http_status: 600 }],
    ["non-integer http status", { http_status: 503.5 }],
    ["invalid occurred_at", { occurred_at: "not-a-date" }],
    ["invalid created_at", { created_at: 42 }],
    ["invalid retention", { retention_eligible_at: "soon" }],
    ["retention before creation", {
      occurred_at: "2026-08-07T01:02:03.000Z",
      created_at: "2026-08-07T01:02:03.500Z",
      retention_eligible_at: "2026-08-07T01:02:03.000Z"
    }],
    ["malformed actor UUID", { actor_admin_user_id: "actor-123" }],
    ["actor non-uuid string", { actor_admin_user_id: "weijunswj" }]
  ])("fails the whole row for %s", (_label, overrides) => {
    expect(mapAppOperationEventOperationsRow(validRow(overrides), trustedWorkspaceId))
      .toBeNull();
  });

  it("fails when workspace_id differs from the trusted workspace", () => {
    const row = validRow({
      workspace_id: "99999999-9999-4999-8999-999999999999"
    });

    expect(mapAppOperationEventOperationsRow(row, trustedWorkspaceId))
      .toBeNull();
  });

  it("fails when the trusted workspace id itself is malformed", () => {
    expect(
      mapAppOperationEventOperationsRow(validRow(), "not-a-workspace")
    ).toBeNull();
  });

  it("fails the complete result when any row is malformed", () => {
    const rows = [validRow(), validRow({ category: "not.locked" }), validRow()];

    expect(mapAppOperationEventOperationsRows(rows, trustedWorkspaceId))
      .toBeNull();
  });

  it("never silently drops a malformed row", () => {
    const rows = [validRow(), validRow({ event_id: "bad" })];

    expect(mapAppOperationEventOperationsRows(rows, trustedWorkspaceId))
      .toBeNull();
  });

  it("maps all rows when every row is valid", () => {
    const rows = [validRow(), validRow({ outcome: "failed" })];

    expect(mapAppOperationEventOperationsRows(rows, trustedWorkspaceId))
      .toHaveLength(2);
  });

  it("never exposes the workspace id or actor id in mapped output", () => {
    const rows = [validRow({ actor_admin_user_id: actorId })];
    const mapped = mapAppOperationEventOperationsRows(rows, trustedWorkspaceId);
    const serialized = JSON.stringify(mapped);

    expect(serialized).not.toContain(trustedWorkspaceId);
    expect(serialized).not.toContain(actorId);
    expect(serialized).not.toContain("actor_admin_user_id");
    expect(serialized).not.toContain("workspace_id");
  });
});
