import "server-only";

import type { AppOperationEventOperationsQuery } from "./app-operation-event-operations-query";
import { APP_OPERATION_EVENT_OPERATIONS_MAX_ROWS } from "./app-operation-event-operations-query";

export const APP_OPERATION_EVENT_OPERATIONS_TABLE = "app_operation_events";

export const APP_OPERATION_EVENT_OPERATIONS_SELECTED_COLUMNS =
  "event_id, workspace_id, category, outcome, reference_type, reference_value, error_code, route_key, http_status, actor_admin_user_id, occurred_at, created_at, retention_eligible_at";

export type AppOperationEventOperationsQueryResult = {
  data: unknown;
  error: unknown;
};

export type AppOperationEventOperationsReadFilter = {
  eq(column: string, value: string): AppOperationEventOperationsReadFilter;
  order(
    column: string,
    options?: {
      ascending?: boolean;
    }
  ): AppOperationEventOperationsReadFilter;
  limit(count: number): Promise<AppOperationEventOperationsQueryResult>;
};

export type AppOperationEventOperationsSupabaseClient = {
  from(table: typeof APP_OPERATION_EVENT_OPERATIONS_TABLE): {
    select(columns: string): AppOperationEventOperationsReadFilter;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Reads at most 200 rows from the locked table through the authenticated
 * session-bound client. The trusted workspace equality filter is mandatory
 * defence in depth below the RLS backstop. Exact filters and paired
 * safe-reference search are applied as equality only; no wildcard, fuzzy,
 * text-search, count, range or unbounded pagination exists.
 */
export async function readAppOperationEventOperationsRows(
  client: AppOperationEventOperationsSupabaseClient,
  options: {
    workspaceId: string;
    query: AppOperationEventOperationsQuery;
  }
): Promise<Record<string, unknown>[] | null> {
  let filter = client
    .from(APP_OPERATION_EVENT_OPERATIONS_TABLE)
    .select(APP_OPERATION_EVENT_OPERATIONS_SELECTED_COLUMNS);

  filter = filter.eq("workspace_id", options.workspaceId);

  if (options.query.category) {
    filter = filter.eq("category", options.query.category);
  }

  if (options.query.outcome) {
    filter = filter.eq("outcome", options.query.outcome);
  }

  if (options.query.search) {
    filter = filter.eq("reference_type", options.query.search.referenceType);
    filter = filter.eq("reference_value", options.query.search.referenceValue);
  }

  const result = await filter
    .order("created_at", { ascending: false })
    .order("event_id", { ascending: false })
    .limit(APP_OPERATION_EVENT_OPERATIONS_MAX_ROWS);

  if (result.error || !Array.isArray(result.data)) {
    return null;
  }

  return result.data.every(isRecord)
    ? (result.data as Record<string, unknown>[])
    : null;
}
