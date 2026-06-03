import "server-only";

import { createSessionBoundSupabaseAdminReadClient } from "../../admin/authorization/supabase-admin-auth-identity-adapter";

type QueryResult = {
  data: unknown;
  error: unknown;
};

type AdminQuoteRequestInboxReadFilter = {
  eq(column: string, value: string): AdminQuoteRequestInboxReadFilter;
  in(column: string, values: string[]): AdminQuoteRequestInboxReadFilter;
  order(
    column: string,
    options?: {
      ascending?: boolean;
    }
  ): AdminQuoteRequestInboxReadFilter;
  limit(count: number): Promise<QueryResult>;
};

export type AdminQuoteRequestInboxReadSupabaseClient = {
  from(table: "quote_requests" | "quote_request_items"): {
    select(columns: string): AdminQuoteRequestInboxReadFilter;
  };
};

export type AdminQuoteRequestInboxReadSupabaseClientResult =
  | {
      configured: true;
      client: AdminQuoteRequestInboxReadSupabaseClient;
      missingEnv: [];
    }
  | {
      configured: false;
      client: null;
      reason: "authenticated_admin_read_client_required";
    };

export type AdminQuoteRequestInboxItem = {
  id: string;
  quoteRequestId: string;
  productNameSnapshot: string;
  quantity: number;
  notes?: string;
  createdAt: string;
};

export type AdminQuoteRequestInboxQuoteRequest = {
  id: string;
  publicReference: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  eventDate?: string;
  venue?: string;
  status: "new" | "reviewing" | "quoted" | "closed" | "archived";
  source: "website" | "chat" | "admin";
  createdAt: string;
  items: AdminQuoteRequestInboxItem[];
};

export type AdminQuoteRequestInboxReadData = {
  quoteRequests: AdminQuoteRequestInboxQuoteRequest[];
};

export type AdminQuoteRequestInboxReadResult =
  | {
      status: "loaded";
      data: AdminQuoteRequestInboxReadData;
    }
  | {
      status: "unavailable";
    };

type AdminQuoteRequestInboxReadOptions = {
  supabase?: AdminQuoteRequestInboxReadSupabaseClientResult;
  env?: {
    ADMIN_TRUSTED_WORKSPACE_ID?: string | null;
  };
};

type QuoteRequestRow = {
  id?: unknown;
  public_reference?: unknown;
  customer_name?: unknown;
  customer_email?: unknown;
  customer_phone?: unknown;
  event_date?: unknown;
  venue?: unknown;
  status?: unknown;
  source?: unknown;
  created_at?: unknown;
};

type QuoteRequestItemRow = {
  id?: unknown;
  quote_request_id?: unknown;
  product_name_snapshot?: unknown;
  quantity?: unknown;
  notes?: unknown;
  created_at?: unknown;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const quoteRequestStatuses = new Set([
  "new",
  "reviewing",
  "quoted",
  "closed",
  "archived"
]);
const quoteRequestSources = new Set(["website", "chat", "admin"]);

function unavailable(): AdminQuoteRequestInboxReadResult {
  return {
    status: "unavailable"
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value.trim());
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getPositiveInteger(value: unknown) {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : undefined;
}

function getWorkspaceId(options: AdminQuoteRequestInboxReadOptions) {
  const workspaceId =
    options.env && "ADMIN_TRUSTED_WORKSPACE_ID" in options.env
      ? options.env.ADMIN_TRUSTED_WORKSPACE_ID
      : process.env.ADMIN_TRUSTED_WORKSPACE_ID;
  const trimmed = workspaceId?.trim();

  return trimmed && isUuid(trimmed) ? trimmed : null;
}

async function getSupabase(
  options: AdminQuoteRequestInboxReadOptions
): Promise<AdminQuoteRequestInboxReadSupabaseClientResult> {
  if (options.supabase) {
    return options.supabase;
  }

  const supabase = await createSessionBoundSupabaseAdminReadClient();

  return supabase.configured
    ? {
        configured: true,
        client: supabase.client as unknown as AdminQuoteRequestInboxReadSupabaseClient,
        missingEnv: []
      }
    : {
        configured: false,
        client: null,
        reason: "authenticated_admin_read_client_required"
      };
}

function requireRows(result: QueryResult) {
  if (result.error || !Array.isArray(result.data)) {
    return null;
  }

  return result.data.every(isRecord) ? result.data : null;
}

function toQuoteRequest(
  row: QuoteRequestRow
): AdminQuoteRequestInboxQuoteRequest | null {
  const id = isUuid(row.id) ? row.id.trim() : null;
  const publicReference = getString(row.public_reference);
  const status =
    typeof row.status === "string" && quoteRequestStatuses.has(row.status)
      ? row.status
      : null;
  const source =
    typeof row.source === "string" && quoteRequestSources.has(row.source)
      ? row.source
      : null;
  const createdAt = getString(row.created_at);

  if (!id || !publicReference || !status || !source || !createdAt) {
    return null;
  }

  return {
    id,
    publicReference,
    customerName: getString(row.customer_name),
    customerEmail: getString(row.customer_email),
    customerPhone: getString(row.customer_phone),
    eventDate: getString(row.event_date),
    venue: getString(row.venue),
    status: status as AdminQuoteRequestInboxQuoteRequest["status"],
    source: source as AdminQuoteRequestInboxQuoteRequest["source"],
    createdAt,
    items: []
  };
}

function toQuoteRequestItem(
  row: QuoteRequestItemRow
): AdminQuoteRequestInboxItem | null {
  const id = isUuid(row.id) ? row.id.trim() : null;
  const quoteRequestId = isUuid(row.quote_request_id)
    ? row.quote_request_id.trim()
    : null;
  const productNameSnapshot = getString(row.product_name_snapshot);
  const quantity = getPositiveInteger(row.quantity);
  const createdAt = getString(row.created_at);

  if (!id || !quoteRequestId || !productNameSnapshot || !quantity || !createdAt) {
    return null;
  }

  return {
    id,
    quoteRequestId,
    productNameSnapshot,
    quantity,
    notes: getString(row.notes),
    createdAt
  };
}

function mapData(
  quoteRequestRows: Record<string, unknown>[],
  itemRows: Record<string, unknown>[]
): AdminQuoteRequestInboxReadData | null {
  const quoteRequests = quoteRequestRows.map(toQuoteRequest);
  const items = itemRows.map(toQuoteRequestItem);

  if (
    quoteRequests.some((quoteRequest) => !quoteRequest) ||
    items.some((item) => !item)
  ) {
    return null;
  }

  const mappedQuoteRequests =
    quoteRequests as AdminQuoteRequestInboxQuoteRequest[];
  const mappedItems = items as AdminQuoteRequestInboxItem[];
  const quoteRequestById = new Map(
    mappedQuoteRequests.map((quoteRequest) => [quoteRequest.id, quoteRequest])
  );

  for (const item of mappedItems) {
    quoteRequestById.get(item.quoteRequestId)?.items.push(item);
  }

  return {
    quoteRequests: mappedQuoteRequests
  };
}

export async function resolveAdminQuoteRequestInboxRead(
  options: AdminQuoteRequestInboxReadOptions = {}
): Promise<AdminQuoteRequestInboxReadResult> {
  const workspaceId = getWorkspaceId(options);

  if (!workspaceId) {
    return unavailable();
  }

  const supabase = await getSupabase(options);

  if (!supabase.configured) {
    return unavailable();
  }

  try {
    const quoteRequestResult = await supabase.client
      .from("quote_requests")
      .select(
        "id, public_reference, customer_name, customer_email, customer_phone, event_date, venue, status, source, created_at"
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(25);
    const quoteRequestRows = requireRows(quoteRequestResult);

    if (!quoteRequestRows) {
      return unavailable();
    }

    if (quoteRequestRows.length === 0) {
      return {
        status: "loaded",
        data: {
          quoteRequests: []
        }
      };
    }

    const quoteRequestIds = quoteRequestRows
      .map((row) => row.id)
      .filter(isUuid)
      .map((id) => id.trim());

    if (quoteRequestIds.length !== quoteRequestRows.length) {
      return unavailable();
    }

    const itemResult = await supabase.client
      .from("quote_request_items")
      .select(
        "id, quote_request_id, product_name_snapshot, quantity, notes, created_at"
      )
      .eq("workspace_id", workspaceId)
      .in("quote_request_id", quoteRequestIds)
      .order("created_at", { ascending: true })
      .limit(250);
    const itemRows = requireRows(itemResult);

    if (!itemRows) {
      return unavailable();
    }

    const data = mapData(quoteRequestRows, itemRows);

    return data
      ? {
          status: "loaded",
          data
        }
      : unavailable();
  } catch {
    return unavailable();
  }
}
