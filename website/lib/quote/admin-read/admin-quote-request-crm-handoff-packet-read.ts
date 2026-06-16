import "server-only";

import { createSessionBoundSupabaseAdminReadClient } from "../../admin/authorization/supabase-admin-auth-identity-adapter";
import { getAdminTrustedWorkspaceId } from "../../server-runtime-config";

type QueryResult = {
  data: unknown;
  error: unknown;
};

type AdminQuoteRequestCrmHandoffPacketFilter = {
  eq(column: string, value: string): AdminQuoteRequestCrmHandoffPacketFilter;
  order(
    column: string,
    options?: {
      ascending?: boolean;
    }
  ): AdminQuoteRequestCrmHandoffPacketFilter;
  limit(count: number): Promise<QueryResult>;
};

export type AdminQuoteRequestCrmHandoffPacketReadSupabaseClient = {
  from(table: "quote_requests"): {
    select(columns: string): AdminQuoteRequestCrmHandoffPacketFilter;
  };
};

export type AdminQuoteRequestCrmHandoffPacketReadSupabaseClientResult =
  | {
      configured: true;
      client: AdminQuoteRequestCrmHandoffPacketReadSupabaseClient;
      missingEnv: [];
    }
  | {
      configured: false;
      client: null;
      reason: "authenticated_admin_read_client_required";
    };

export type AdminQuoteRequestCrmHandoffPacketRecord = {
  id: string;
  publicReference: string;
  createdAt: string;
  status:
    | "new"
    | "reviewing"
    | "follow_up_needed"
    | "quoted"
    | "closed"
    | "archived";
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  companyOrEventOrganisation?: string;
  messageDetails?: string;
  sourcePagePath?: string;
  sourceListingSlug?: string;
  futureProvider: "hubspot";
  localCrmSyncStatus: "queued";
};

export type AdminQuoteRequestCrmHandoffPacket = {
  generatedAt: string;
  provider: "hubspot";
  localCrmSyncStatus: "queued";
  limit: number;
  recordCount: number;
  records: AdminQuoteRequestCrmHandoffPacketRecord[];
};

export type AdminQuoteRequestCrmHandoffPacketReadResult =
  | {
      status: "loaded";
      packet: AdminQuoteRequestCrmHandoffPacket;
    }
  | {
      status: "unavailable";
    }
  | {
      status: "invalid_limit";
    };

export type AdminQuoteRequestCrmHandoffPacketReadInput = {
  generatedAt?: string;
  limit?: number;
  env?: {
    ADMIN_TRUSTED_WORKSPACE_ID?: string | null;
  };
  supabase?: AdminQuoteRequestCrmHandoffPacketReadSupabaseClientResult;
};

export type AdminQuoteRequestCrmHandoffPacketReadPersistence = {
  readPacket: (
    input: AdminQuoteRequestCrmHandoffPacketReadInput
  ) => Promise<AdminQuoteRequestCrmHandoffPacketReadResult>;
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
  source_page_path?: unknown;
  source_listing_slug?: unknown;
  crm_provider?: unknown;
  crm_sync_status?: unknown;
  created_at?: unknown;
};

const defaultLimit = 25;
const maxLimit = 100;
const messageLimit = 1000;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const quoteRequestStatuses = new Set([
  "new",
  "reviewing",
  "follow_up_needed",
  "quoted",
  "closed",
  "archived"
]);
const safeSourcePathPattern = /^\/[^\r\n]*$/;
const safeListingSlugPattern = /^[a-z0-9][a-z0-9-]*$/;
const selectColumns =
  "id, public_reference, customer_name, customer_email, customer_phone, customer_message, event_date, venue, status, source_page_path, source_listing_slug, crm_provider, crm_sync_status, created_at";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value.trim());
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getBoundedString(value: unknown, limit: number) {
  const normalized = getString(value);

  return normalized ? normalized.slice(0, limit) : undefined;
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

function getStatus(value: unknown) {
  return typeof value === "string" && quoteRequestStatuses.has(value)
    ? (value as AdminQuoteRequestCrmHandoffPacketRecord["status"])
    : null;
}

function getLimit(value: unknown) {
  if (value === undefined) {
    return defaultLimit;
  }

  if (!Number.isInteger(value) || Number(value) <= 0) {
    return null;
  }

  return Math.min(Number(value), maxLimit);
}

function requireRows(result: QueryResult) {
  if (result.error || !Array.isArray(result.data)) {
    return null;
  }

  return result.data.every(isRecord) ? result.data : null;
}

function toPacketRecord(
  row: QuoteRequestRow
): AdminQuoteRequestCrmHandoffPacketRecord | null {
  const id = isUuid(row.id) ? row.id.trim() : null;
  const publicReference = getString(row.public_reference);
  const createdAt = getString(row.created_at);
  const status = getStatus(row.status);

  if (
    !id ||
    !publicReference ||
    !createdAt ||
    !status ||
    row.crm_provider !== "hubspot" ||
    row.crm_sync_status !== "queued"
  ) {
    return null;
  }

  return {
    id,
    publicReference,
    createdAt,
    status,
    customerName: getBoundedString(row.customer_name, 250),
    customerEmail: getBoundedString(row.customer_email, 320),
    customerPhone: getBoundedString(row.customer_phone, 80),
    companyOrEventOrganisation: getBoundedString(row.venue, 250),
    messageDetails: getBoundedString(row.customer_message, messageLimit),
    sourcePagePath: getSafeSourcePath(row.source_page_path),
    sourceListingSlug: getSafeListingSlug(row.source_listing_slug),
    futureProvider: "hubspot",
    localCrmSyncStatus: "queued"
  };
}

function unavailable(): AdminQuoteRequestCrmHandoffPacketReadResult {
  return {
    status: "unavailable"
  };
}

async function getSupabase(
  options: AdminQuoteRequestCrmHandoffPacketReadInput
): Promise<AdminQuoteRequestCrmHandoffPacketReadSupabaseClientResult> {
  if (options.supabase) {
    return options.supabase;
  }

  const supabase = await createSessionBoundSupabaseAdminReadClient();

  return supabase.configured
    ? {
        configured: true,
        client: supabase.client as unknown as AdminQuoteRequestCrmHandoffPacketReadSupabaseClient,
        missingEnv: []
      }
    : {
        configured: false,
        client: null,
        reason: "authenticated_admin_read_client_required"
      };
}

export async function resolveAdminQuoteRequestCrmHandoffPacketRead(
  options: AdminQuoteRequestCrmHandoffPacketReadInput = {}
): Promise<AdminQuoteRequestCrmHandoffPacketReadResult> {
  const workspaceId = getAdminTrustedWorkspaceId(options.env ?? process.env);
  const limit = getLimit(options.limit);

  if (!workspaceId) {
    return unavailable();
  }

  if (!limit) {
    return {
      status: "invalid_limit"
    };
  }

  const supabase = await getSupabase(options);

  if (!supabase.configured) {
    return unavailable();
  }

  try {
    const result = await supabase.client
      .from("quote_requests")
      .select(selectColumns)
      .eq("workspace_id", workspaceId)
      .eq("crm_provider", "hubspot")
      .eq("crm_sync_status", "queued")
      .order("created_at", { ascending: false })
      .limit(limit);
    const rows = requireRows(result);

    if (!rows) {
      return unavailable();
    }

    const records = rows
      .map(toPacketRecord)
      .filter(
        (
          record
        ): record is AdminQuoteRequestCrmHandoffPacketRecord => Boolean(record)
      );

    return {
      status: "loaded",
      packet: {
        generatedAt: options.generatedAt ?? new Date().toISOString(),
        provider: "hubspot",
        localCrmSyncStatus: "queued",
        limit,
        recordCount: records.length,
        records
      }
    };
  } catch {
    return unavailable();
  }
}

export const adminQuoteRequestCrmHandoffPacketReadPersistence: AdminQuoteRequestCrmHandoffPacketReadPersistence = {
  readPacket: resolveAdminQuoteRequestCrmHandoffPacketRead
};
