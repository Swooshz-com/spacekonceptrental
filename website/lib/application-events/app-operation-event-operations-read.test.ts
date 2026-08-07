import { describe, expect, it, vi } from "vitest";

import {
  resolveAdminAppOperationEventOperationsRead,
  type AdminAppOperationEventOperationsReadOptions,
  type AdminAppOperationEventOperationsReadResult
} from "./app-operation-event-operations-read";
import type { AppOperationEventOperationsSupabaseClient } from "./app-operation-event-operations-repository";

type Call = { method: string; args: unknown[] };

function createFakeClient(rows: Record<string, unknown>[]) {
  const calls: Call[] = [];

  const filter = {
    eq: (column: string, value: string) => {
      calls.push({ method: "eq", args: [column, value] });
      return filter;
    },
    order: (column: string, options?: { ascending?: boolean }) => {
      calls.push({ method: "order", args: [column, options] });
      return filter;
    },
    limit: async (count: number) => {
      calls.push({ method: "limit", args: [count] });
      return { data: rows, error: null };
    }
  };

  const client: AppOperationEventOperationsSupabaseClient = {
    from(table: string) {
      calls.push({ method: "from", args: [table] });
      return {
        select(columns: string) {
          calls.push({ method: "select", args: [columns] });
          return filter;
        }
      };
    }
  };

  return { client, calls };
}

const workspaceId = "11111111-1111-4111-8111-111111111111";
const env = { ADMIN_TRUSTED_WORKSPACE_ID: workspaceId };

function validRow(overrides: Record<string, unknown> = {}) {
  return {
    event_id: "22222222-2222-4222-8222-222222222222",
    workspace_id: workspaceId,
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

function configured(
  options: Omit<AdminAppOperationEventOperationsReadOptions, "supabase">,
  client: AppOperationEventOperationsSupabaseClient
): AdminAppOperationEventOperationsReadOptions {
  return {
    ...options,
    supabase: {
      configured: true,
      client,
      missingEnv: []
    }
  };
}

describe("admin app operation event operations read", () => {
  it("loads owner/admin same-workspace rows with a bounded summary", async () => {
    const rows = [
      validRow(),
      validRow({
        event_id: "22222222-2222-4222-8222-222222222223",
        category: "quote.submission",
        outcome: "failed"
      }),
      validRow({
        event_id: "22222222-2222-4222-8222-222222222224",
        category: "admin.auth",
        outcome: "denied"
      })
    ];
    const { client } = createFakeClient(rows);
    const result = await resolveAdminAppOperationEventOperationsRead(
      configured({ env }, client)
    );

    expect(result.status).toBe("loaded");

    if (result.status === "loaded") {
      expect(result.records).toHaveLength(3);
      expect(result.summary.total).toBe(3);
      expect(result.summary.byOutcome).toEqual({
        failed: 1,
        denied: 1,
        disabled: 0,
        pending: 1
      });
      expect(result.summary.byCategory).toEqual({
        "quote.submission": 1,
        "quote.handoff": 1,
        "admin.auth": 1,
        "rate.limit": 0
      });
    }
  });

  it("applies the explicit trusted workspace equality filter", async () => {
    const { client, calls } = createFakeClient([]);
    await resolveAdminAppOperationEventOperationsRead(
      configured({ env }, client)
    );

    const eqs = calls
      .filter(({ method }) => method === "eq")
      .map(({ args }) => ({ column: args[0], value: args[1] }));

    expect(eqs[0]).toEqual({ column: "workspace_id", value: workspaceId });
  });

  it("orders by created_at DESC then event_id DESC and limits to 200", async () => {
    const { client, calls } = createFakeClient([]);
    await resolveAdminAppOperationEventOperationsRead(
      configured({ env }, client)
    );

    const orders = calls
      .filter(({ method }) => method === "order")
      .map(({ args }) => ({ column: args[0], ascending: (args[1] as { ascending?: boolean } | undefined)?.ascending }));
    const limitCall = calls.find(({ method }) => method === "limit");

    expect(orders).toEqual([
      { column: "created_at", ascending: false },
      { column: "event_id", ascending: false }
    ]);
    expect(limitCall?.args[0]).toBe(200);
    expect(calls.some(({ method }) => method === "count")).toBe(false);
    expect(calls.some(({ method }) => method === "range")).toBe(false);
  });

  it("denies cross-workspace rows at the mapper backstop", async () => {
    const rows = [
      validRow(),
      validRow({ workspace_id: "99999999-9999-4999-8999-999999999999" })
    ];
    const { client } = createFakeClient(rows);
    const result = await resolveAdminAppOperationEventOperationsRead(
      configured({ env }, client)
    );

    expect(result.status).toBe("unavailable");
  });

  it("fails the complete result on a malformed row instead of partial acceptance", async () => {
    const rows = [validRow(), validRow({ outcome: "succeeded" })];
    const { client } = createFakeClient(rows);
    const result = await resolveAdminAppOperationEventOperationsRead(
      configured({ env }, client)
    );

    expect(result.status).toBe("unavailable");
  });

  it("returns unavailable when the trusted workspace is not configured and performs zero reads", async () => {
    const { client, calls } = createFakeClient([]);
    const result = await resolveAdminAppOperationEventOperationsRead(
      configured({ env: {} }, client)
    );

    expect(result.status).toBe("unavailable");
    expect(calls).toHaveLength(0);
  });

  it("returns unavailable when the session-bound read client is missing", async () => {
    const result = await resolveAdminAppOperationEventOperationsRead({
      env,
      supabase: {
        configured: false,
        client: null,
        reason: "authenticated_admin_read_client_required"
      }
    });

    expect(result.status).toBe("unavailable");
  });

  it("returns unavailable when the database result errors", async () => {
    const client = {
      from() {
        return {
          select() {
            return {
              eq() {
                return this;
              },
              order() {
                return this;
              },
              async limit() {
                return { data: null, error: { message: "denied" } };
              }
            };
          }
        };
      }
    } as unknown as AppOperationEventOperationsSupabaseClient;
    const result = await resolveAdminAppOperationEventOperationsRead(
      configured({ env }, client)
    );

    expect(result.status).toBe("unavailable");
  });

  it("returns a bounded invalid-filter result and executes zero database queries", async () => {
    const { client, calls } = createFakeClient([]);
    const result = await resolveAdminAppOperationEventOperationsRead(
      configured(
        { env, searchParams: { category: "not.locked" } },
        client
      )
    );

    expect(result.status).toBe("invalid_filter");
    expect(calls).toHaveLength(0);
  });

  it("executes zero database queries for a malformed paired search", async () => {
    const { client, calls } = createFakeClient([]);
    const result = await resolveAdminAppOperationEventOperationsRead(
      configured(
        { env, searchParams: { referenceType: "none", referenceValue: "x" } },
        client
      )
    );

    expect(result.status).toBe("invalid_filter");
    expect(calls).toHaveLength(0);
  });

  it("executes zero database queries for a supplied empty filter", async () => {
    const { client, calls } = createFakeClient([]);
    const result = await resolveAdminAppOperationEventOperationsRead(
      configured({ env, searchParams: { outcome: "  " } }, client)
    );

    expect(result.status).toBe("invalid_filter");
    expect(calls).toHaveLength(0);
  });

  it("does not include supplied invalid values in its result", async () => {
    const { client } = createFakeClient([]);
    const result = await resolveAdminAppOperationEventOperationsRead(
      configured(
        { env, searchParams: { category: "quote.refund" } },
        client
      )
    );
    const serialized = JSON.stringify(result);

    expect(result.status).toBe("invalid_filter");
    expect(serialized).not.toContain("quote.refund");
  });

  it("propagates exact filters and paired search into the query chain", async () => {
    const { client, calls } = createFakeClient([]);
    await resolveAdminAppOperationEventOperationsRead(
      configured(
        {
          env,
          searchParams: {
            category: "rate.limit",
            outcome: "denied",
            referenceType: "public_reference",
            referenceValue: "QR-20260612-ABC12345"
          }
        },
        client
      )
    );

    const eqs = calls
      .filter(({ method }) => method === "eq")
      .map(({ args }) => ({ column: args[0], value: args[1] }));

    expect(eqs).toEqual([
      { column: "workspace_id", value: workspaceId },
      { column: "category", value: "rate.limit" },
      { column: "outcome", value: "denied" },
      { column: "reference_type", value: "public_reference" },
      { column: "reference_value", value: "QR-20260612-ABC12345" }
    ]);
  });

  it("creates the session-bound admin read client only after parsing succeeds", async () => {
    const { client, calls } = createFakeClient([]);
    const supabaseFactory = vi.fn(() => ({
      configured: true as const,
      client,
      missingEnv: [] as never[]
    }));

    const result = await resolveAdminAppOperationEventOperationsRead({
      env,
      createSupabaseRead: supabaseFactory
    } as unknown as AdminAppOperationEventOperationsReadOptions);

    expect(result.status).toBe("loaded");
    expect(supabaseFactory).toHaveBeenCalledTimes(1);
  });

  it("keeps the loaded read model free of forbidden fields", async () => {
    const rows = [
      validRow({
        actor_admin_user_id: "33333333-3333-4333-8333-333333333333"
      })
    ];
    const { client } = createFakeClient(rows);
    const result = (await resolveAdminAppOperationEventOperationsRead(
      configured({ env }, client)
    )) as Extract<AdminAppOperationEventOperationsReadResult, { status: "loaded" }>;
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain("actor_admin_user_id");
    expect(serialized).not.toContain("33333333-3333-4333-8333-333333333333");
    expect(serialized).not.toContain("workspace_id");
    expect(serialized).not.toContain("customer");
    expect(serialized).not.toContain("email");
    expect(serialized).not.toContain("payload");
    expect(serialized).not.toContain("prompt");
    expect(serialized).not.toContain("secret");
  });
});
