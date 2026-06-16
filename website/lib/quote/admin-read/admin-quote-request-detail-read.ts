import "server-only";

import { getAdminTrustedWorkspaceId } from "../../server-runtime-config";
import { createSessionBoundSupabaseAdminReadClient } from "../../admin/authorization/supabase-admin-auth-identity-adapter";
import type {
  AdminQuoteRequestInboxActivity,
  AdminQuoteRequestInboxItem,
  AdminQuoteRequestInboxQuoteRequest
} from "./admin-quote-request-dashboard-read";

type QueryResult = {
  data: unknown;
  error: unknown;
};

type AdminQuoteRequestDetailReadFilter = {
  eq(column: string, value: string): AdminQuoteRequestDetailReadFilter;
  order(
    column: string,
    options?: {
      ascending?: boolean;
    }
  ): AdminQuoteRequestDetailReadFilter;
  limit(count: number): Promise<QueryResult>;
};

export type AdminQuoteRequestDetailReadSupabaseClient = {
  from(
    table: "quote_requests" | "quote_request_items" | "quote_request_activity"
  ): {
    select(columns: string): AdminQuoteRequestDetailReadFilter;
  };
};

export type AdminQuoteRequestDetailReadSupabaseClientResult =
  | {
      configured: true;
      client: AdminQuoteRequestDetailReadSupabaseClient;
      missingEnv: [];
    }
  | {
      configured: false;
      client: null;
      reason: "authenticated_admin_read_client_required";
    };

export type AdminQuoteRequestDetailReadData = {
  quoteRequest: AdminQuoteRequestInboxQuoteRequest;
};

export type AdminQuoteRequestDetailReadResult =
  | {
      status: "loaded";
      data: AdminQuoteRequestDetailReadData;
    }
  | {
      status: "not_found";
    }
  | {
      status: "unavailable";
    };

type AdminQuoteRequestDetailReadOptions = {
  quoteRequestId: string;
  supabase?: AdminQuoteRequestDetailReadSupabaseClientResult;
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
  customer_message?: unknown;
  event_date?: unknown;
  venue?: unknown;
  status?: unknown;
  source?: unknown;
  source_page_path?: unknown;
  source_listing_slug?: unknown;
  crm_provider?: unknown;
  crm_sync_status?: unknown;
  crm_contact_id?: unknown;
  crm_deal_id?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
};

type QuoteRequestItemRow = {
  id?: unknown;
  quote_request_id?: unknown;
  product_name_snapshot?: unknown;
  quantity?: unknown;
  notes?: unknown;
  created_at?: unknown;
};

type QuoteRequestActivityRow = {
  id?: unknown;
  quote_request_id?: unknown;
  activity_type?: unknown;
  status_from?: unknown;
  status_to?: unknown;
  note?: unknown;
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
const quoteRequestActivityTypes = new Set(["status_change", "internal_note"]);
const crmSyncStatuses = new Set(["not_queued", "queued", "synced", "failed"]);
const safeSourcePathPattern = /^\/[^\r\n]*$/;
const safeListingSlugPattern = /^[a-z0-9][a-z0-9-]*$/;

function unavailable(): AdminQuoteRequestDetailReadResult {
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

function getSafeSourcePath(value: unknown) {
  const sourcePath = getString(value);

  return sourcePath && safeSourcePathPattern.test(sourcePath)
    ? sourcePath
    : undefined;
}

function getSafeListingSlug(value: unknown) {
  const listingSlug = getString(value);

  return listingSlug && safeListingSlugPattern.test(listingSlug)
    ? listingSlug
    : undefined;
}

function getCrmProvider(value: unknown) {
  return value === "hubspot" ? value : undefined;
}

function getCrmSyncStatus(value: unknown) {
  return typeof value === "string" && crmSyncStatuses.has(value)
    ? (value as AdminQuoteRequestInboxQuoteRequest["crmSyncStatus"])
    : undefined;
}

function getPositiveInteger(value: unknown) {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : undefined;
}

function getWorkspaceId(options: AdminQuoteRequestDetailReadOptions) {
  return getAdminTrustedWorkspaceId(options.env ?? process.env);
}

async function getSupabase(
  options: AdminQuoteRequestDetailReadOptions
): Promise<AdminQuoteRequestDetailReadSupabaseClientResult> {
  if (options.supabase) {
    return options.supabase;
  }

  const supabase = await createSessionBoundSupabaseAdminReadClient();

  return supabase.configured
    ? {
        configured: true,
        client: supabase.client as unknown as AdminQuoteRequestDetailReadSupabaseClient,
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

function getQuoteRequestStatus(value: unknown) {
  return typeof value === "string" && quoteRequestStatuses.has(value)
    ? (value as AdminQuoteRequestInboxQuoteRequest["status"])
    : undefined;
}

function toQuoteRequest(
  row: QuoteRequestRow
): AdminQuoteRequestInboxQuoteRequest | null {
  const id = isUuid(row.id) ? row.id.trim() : null;
  const publicReference = getString(row.public_reference);
  const status = getQuoteRequestStatus(row.status);
  const source =
    typeof row.source === "string" && quoteRequestSources.has(row.source)
      ? row.source
      : null;
  const crmProvider = getCrmProvider(row.crm_provider);
  const crmSyncStatus = getCrmSyncStatus(row.crm_sync_status);
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
    customerMessage: getString(row.customer_message),
    eventDate: getString(row.event_date),
    venue: getString(row.venue),
    status,
    source: source as AdminQuoteRequestInboxQuoteRequest["source"],
    sourcePagePath: getSafeSourcePath(row.source_page_path),
    sourceListingSlug: getSafeListingSlug(row.source_listing_slug),
    crmProvider,
    crmSyncStatus,
    crmContactId: getString(row.crm_contact_id),
    crmDealId: getString(row.crm_deal_id),
    createdAt,
    updatedAt: getString(row.updated_at),
    items: [],
    activity: []
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

function toQuoteRequestActivity(
  row: QuoteRequestActivityRow
): AdminQuoteRequestInboxActivity | null {
  const id = isUuid(row.id) ? row.id.trim() : null;
  const quoteRequestId = isUuid(row.quote_request_id)
    ? row.quote_request_id.trim()
    : null;
  const activityType =
    typeof row.activity_type === "string" &&
    quoteRequestActivityTypes.has(row.activity_type)
      ? row.activity_type
      : null;
  const createdAt = getString(row.created_at);

  if (!id || !quoteRequestId || !activityType || !createdAt) {
    return null;
  }

  return {
    id,
    quoteRequestId,
    activityType: activityType as AdminQuoteRequestInboxActivity["activityType"],
    statusFrom: getQuoteRequestStatus(row.status_from),
    statusTo: getQuoteRequestStatus(row.status_to),
    note: getString(row.note),
    createdAt
  };
}

export async function resolveAdminQuoteRequestDetailRead(
  options: AdminQuoteRequestDetailReadOptions
): Promise<AdminQuoteRequestDetailReadResult> {
  const workspaceId = getWorkspaceId(options);
  const quoteRequestId = isUuid(options.quoteRequestId)
    ? options.quoteRequestId.trim()
    : null;

  if (!workspaceId || !quoteRequestId) {
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
        "id, public_reference, customer_name, customer_email, customer_phone, customer_message, event_date, venue, status, source, source_page_path, source_listing_slug, crm_provider, crm_sync_status, crm_contact_id, crm_deal_id, created_at, updated_at"
      )
      .eq("workspace_id", workspaceId)
      .eq("id", quoteRequestId)
      .limit(1);
    const quoteRequestRows = requireRows(quoteRequestResult);

    if (!quoteRequestRows) {
      return unavailable();
    }

    if (quoteRequestRows.length === 0) {
      return {
        status: "not_found"
      };
    }

    const [quoteRequestRow] = quoteRequestRows;
    const quoteRequest = toQuoteRequest(quoteRequestRow);

    if (!quoteRequest) {
      return unavailable();
    }

    const itemResult = await supabase.client
      .from("quote_request_items")
      .select(
        "id, quote_request_id, product_name_snapshot, quantity, notes, created_at"
      )
      .eq("workspace_id", workspaceId)
      .eq("quote_request_id", quoteRequestId)
      .order("created_at", { ascending: true })
      .limit(250);
    const itemRows = requireRows(itemResult);

    if (!itemRows) {
      return unavailable();
    }

    const activityResult = await supabase.client
      .from("quote_request_activity")
      .select(
        "id, quote_request_id, activity_type, status_from, status_to, note, created_at"
      )
      .eq("workspace_id", workspaceId)
      .eq("quote_request_id", quoteRequestId)
      .order("created_at", { ascending: false })
      .limit(250);
    const activityRows = requireRows(activityResult);

    if (!activityRows) {
      return unavailable();
    }

    const items = itemRows.map(toQuoteRequestItem);
    const activity = activityRows.map(toQuoteRequestActivity);

    if (
      items.some((item) => !item) ||
      activity.some((activityItem) => !activityItem)
    ) {
      return unavailable();
    }

    quoteRequest.items.push(...(items as AdminQuoteRequestInboxItem[]));
    quoteRequest.activity.push(
      ...(activity as AdminQuoteRequestInboxActivity[])
    );

    return {
      status: "loaded",
      data: {
        quoteRequest
      }
    };
  } catch {
    return unavailable();
  }
}
