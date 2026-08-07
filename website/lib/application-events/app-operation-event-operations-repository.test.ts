import { describe, expect, it } from "vitest";

import {
  APP_OPERATION_EVENT_OPERATIONS_SELECTED_COLUMNS,
  APP_OPERATION_EVENT_OPERATIONS_TABLE,
  readAppOperationEventOperationsRows,
  type AppOperationEventOperationsSupabaseClient
} from "./app-operation-event-operations-repository";
import { APP_OPERATION_EVENT_OPERATIONS_MAX_ROWS } from "./app-operation-event-operations-query";

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

function eqCalls(calls: Call[]) {
  return calls
    .filter(({ method }) => method === "eq")
    .map(({ args }) => ({ column: args[0], value: args[1] }));
}

function orderCalls(calls: Call[]) {
  return calls
    .filter(({ method }) => method === "order")
    .map(({ args }) => ({ column: args[0], ascending: (args[1] as { ascending?: boolean } | undefined)?.ascending }));
}

const workspaceId = "11111111-1111-4111-8111-111111111111";
const defaultQuery = {};

describe("app operation event operations repository", () => {
  it("selects an explicit allowlisted column set from the locked table", async () => {
    const { client, calls } = createFakeClient([]);

    await readAppOperationEventOperationsRows(client, { workspaceId, query: defaultQuery });

    const fromCall = calls.find(({ method }) => method === "from");
    const selectCall = calls.find(({ method }) => method === "select");

    expect(fromCall?.args[0]).toBe("app_operation_events");
    expect(selectCall?.args[0]).toBe(APP_OPERATION_EVENT_OPERATIONS_SELECTED_COLUMNS);
    expect(selectCall?.args[0]).toContain("event_id");
    expect(selectCall?.args[0]).toContain("category");
    expect(selectCall?.args[0]).toContain("outcome");
    expect(selectCall?.args[0]).toContain("reference_type");
    expect(selectCall?.args[0]).toContain("reference_value");
    expect(selectCall?.args[0]).toContain("error_code");
    expect(selectCall?.args[0]).toContain("route_key");
    expect(selectCall?.args[0]).toContain("http_status");
    expect(selectCall?.args[0]).toContain("actor_admin_user_id");
    expect(selectCall?.args[0]).toContain("occurred_at");
    expect(selectCall?.args[0]).toContain("created_at");
    expect(selectCall?.args[0]).toContain("retention_eligible_at");
  });

  it("always applies the trusted workspace equality filter first", async () => {
    const { client, calls } = createFakeClient([]);

    await readAppOperationEventOperationsRows(client, { workspaceId, query: defaultQuery });

    const eqs = eqCalls(calls);

    expect(eqs[0]).toEqual({ column: "workspace_id", value: workspaceId });
  });

  it("orders by created_at DESC then event_id DESC and limits to 200", async () => {
    const { client, calls } = createFakeClient([]);

    await readAppOperationEventOperationsRows(client, { workspaceId, query: defaultQuery });

    const orders = orderCalls(calls);
    const limitCall = calls.find(({ method }) => method === "limit");

    expect(orders).toEqual([
      { column: "created_at", ascending: false },
      { column: "event_id", ascending: false }
    ]);
    expect(limitCall?.args[0]).toBe(APP_OPERATION_EVENT_OPERATIONS_MAX_ROWS);
    expect(limitCall?.args[0]).toBe(200);
  });

  it("performs no count, range or unbounded pagination call", async () => {
    const { client, calls } = createFakeClient([]);

    await readAppOperationEventOperationsRows(client, { workspaceId, query: defaultQuery });

    expect(calls.some(({ method }) => method === "count")).toBe(false);
    expect(calls.some(({ method }) => method === "range")).toBe(false);
  });

  it("applies exact category and outcome filters when supplied", async () => {
    const { client, calls } = createFakeClient([]);

    await readAppOperationEventOperationsRows(client, {
      workspaceId,
      query: { category: "admin.auth", outcome: "denied" }
    });

    const eqs = eqCalls(calls);

    expect(eqs).toContainEqual({ column: "category", value: "admin.auth" });
    expect(eqs).toContainEqual({ column: "outcome", value: "denied" });
  });

  it("applies exact paired safe-reference equality filters when supplied", async () => {
    const { client, calls } = createFakeClient([]);

    await readAppOperationEventOperationsRows(client, {
      workspaceId,
      query: {
        search: {
          referenceType: "public_reference",
          referenceValue: "QR-20260612-ABC12345"
        }
      }
    });

    const eqs = eqCalls(calls);

    expect(eqs).toContainEqual({
      column: "reference_type",
      value: "public_reference"
    });
    expect(eqs).toContainEqual({
      column: "reference_value",
      value: "QR-20260612-ABC12345"
    });
  });

  it("returns null on a query error", async () => {
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
                return { data: null, error: { message: "boom" } };
              }
            };
          }
        };
      }
    } as unknown as AppOperationEventOperationsSupabaseClient;

    await expect(
      readAppOperationEventOperationsRows(client, { workspaceId, query: defaultQuery })
    ).resolves.toBeNull();
  });

  it("returns null when the result is not an array", async () => {
    const { client } = createFakeClient([] as unknown as Record<string, unknown>[]);
    const brokenClient = {
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
                return { data: { rows: [] }, error: null };
              }
            };
          }
        };
      }
    } as unknown as AppOperationEventOperationsSupabaseClient;

    await expect(
      readAppOperationEventOperationsRows(brokenClient, { workspaceId, query: defaultQuery })
    ).resolves.toBeNull();

    expect(client).toBeDefined();
  });

  it("returns null when a row is not a plain record", async () => {
    const { client } = createFakeClient([{ event_id: "x" }]);
    const arrayRowClient = {
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
                return { data: [[1, 2]], error: null };
              }
            };
          }
        };
      }
    } as unknown as AppOperationEventOperationsSupabaseClient;

    await expect(
      readAppOperationEventOperationsRows(arrayRowClient, { workspaceId, query: defaultQuery })
    ).resolves.toBeNull();

    expect(client).toBeDefined();
  });

  it("returns the rows on success", async () => {
    const rows = [{ event_id: "x" }];
    const { client } = createFakeClient(rows);

    await expect(
      readAppOperationEventOperationsRows(client, { workspaceId, query: defaultQuery })
    ).resolves.toEqual(rows);
  });

  it("has no wildcard, fuzzy, text-search or service-role path in source", () => {
    const { readFileSync } = require("node:fs") as typeof import("node:fs");
    const { resolve } = require("node:path") as typeof import("node:path");
    const source = readFileSync(
      resolve(
        process.cwd(),
        "lib/application-events/app-operation-event-operations-repository.ts"
      ),
      "utf8"
    );

    expect(source).not.toContain('select("*")');
    expect(source).not.toMatch(/[.]like\(/i);
    expect(source).not.toMatch(/[.]ilike\(/i);
    expect(source).not.toMatch(/[.]or\(/i);
    expect(source).not.toMatch(/textSearch|fts|match\(/i);
    expect(source).not.toContain("service_role");
    expect(source).not.toContain(".rpc(");
    expect(source).not.toContain(".count(");
    expect(source).not.toContain(".range(");
    expect(APP_OPERATION_EVENT_OPERATIONS_TABLE).toBe("app_operation_events");
  });
});
