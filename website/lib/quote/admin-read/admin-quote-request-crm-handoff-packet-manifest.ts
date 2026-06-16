import "server-only";

import { createSessionBoundSupabaseAdminReadClient } from "../../admin/authorization/supabase-admin-auth-identity-adapter";
import type { TrustedQuoteAdminContext } from "../admin-write/admin-quote-request-status-write";
import type { AdminQuoteRequestCrmHandoffPacket } from "./admin-quote-request-crm-handoff-packet-read";

type QueryResult = {
  data: unknown;
  error: unknown;
};

type ManifestInsert = {
  workspace_id: string;
  provider: "hubspot";
  packet_kind: AdminQuoteRequestCrmHandoffPacketManifestKind;
  status_filter: "queued";
  limit_requested: number;
  record_count: number;
  request_ids: string[];
  generated_by_admin_user_id: string;
  generated_at: string;
  source: "protected_admin";
};

type ManifestFilter = {
  eq(column: string, value: string): ManifestFilter;
  order(
    column: string,
    options?: {
      ascending?: boolean;
    }
  ): ManifestFilter;
  limit(count: number): Promise<QueryResult>;
};

type ManifestInsertBuilder = {
  select(columns: string): {
    single(): Promise<QueryResult>;
  };
};

export type AdminQuoteRequestCrmHandoffPacketManifestSupabaseClient = {
  from(table: "quote_crm_handoff_packet_manifests"): {
    insert(row: ManifestInsert): ManifestInsertBuilder;
    select(columns: string): ManifestFilter;
  };
};

export type AdminQuoteRequestCrmHandoffPacketManifestSupabaseClientResult =
  | {
      configured: true;
      client: AdminQuoteRequestCrmHandoffPacketManifestSupabaseClient;
      missingEnv: [];
    }
  | {
      configured: false;
      client: null;
      reason: "authenticated_admin_manifest_client_required";
    };

export type AdminQuoteRequestCrmHandoffPacketManifestRecord = {
  id: string;
  workspaceId: string;
  provider: "hubspot";
  packetKind: AdminQuoteRequestCrmHandoffPacketManifestKind;
  statusFilter: "queued";
  limitRequested: number;
  recordCount: number;
  requestIds: string[];
  requestIdCount: number;
  generatedByAdminUserId?: string;
  generatedAt: string;
  source: "protected_admin";
};

export type AdminQuoteRequestCrmHandoffPacketManifestCreateResult =
  | {
      status: "created";
      manifest: AdminQuoteRequestCrmHandoffPacketManifestRecord;
    }
  | {
      status: "invalid_admin_context" | "invalid_packet" | "unavailable";
    };

export type AdminQuoteRequestCrmHandoffPacketManifestReadResult =
  | {
      status: "loaded";
      manifests: AdminQuoteRequestCrmHandoffPacketManifestRecord[];
    }
  | {
      status: "invalid_admin_context" | "invalid_limit" | "unavailable";
    };

export type CreateAdminQuoteRequestCrmHandoffPacketManifestInput = {
  admin: TrustedQuoteAdminContext;
  packet: AdminQuoteRequestCrmHandoffPacket;
  packetKind?: AdminQuoteRequestCrmHandoffPacketManifestKind;
};

export type ReadRecentAdminQuoteRequestCrmHandoffPacketManifestsInput = {
  admin: TrustedQuoteAdminContext;
  limit?: number;
};

export type AdminQuoteRequestCrmHandoffPacketManifestPersistence = {
  createManifest: (
    input: CreateAdminQuoteRequestCrmHandoffPacketManifestInput
  ) => Promise<AdminQuoteRequestCrmHandoffPacketManifestCreateResult>;
  readRecentManifests: (
    input: ReadRecentAdminQuoteRequestCrmHandoffPacketManifestsInput
  ) => Promise<AdminQuoteRequestCrmHandoffPacketManifestReadResult>;
};

type ManifestRow = {
  id?: unknown;
  workspace_id?: unknown;
  provider?: unknown;
  packet_kind?: unknown;
  status_filter?: unknown;
  limit_requested?: unknown;
  record_count?: unknown;
  request_ids?: unknown;
  generated_by_admin_user_id?: unknown;
  generated_at?: unknown;
  source?: unknown;
};

type ManifestOptions = {
  supabase?: AdminQuoteRequestCrmHandoffPacketManifestSupabaseClientResult;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const selectColumns =
  "id, workspace_id, provider, packet_kind, status_filter, limit_requested, record_count, request_ids, generated_by_admin_user_id, generated_at, source";
const defaultRecentLimit = 10;
const maxRecentLimit = 25;
const maxPacketLimit = 100;

export type AdminQuoteRequestCrmHandoffPacketManifestKind =
  | "json_review_packet"
  | "hubspot_import_csv";

function getPacketKind(
  value: unknown
): AdminQuoteRequestCrmHandoffPacketManifestKind | null {
  return value === "json_review_packet" || value === "hubspot_import_csv"
    ? value
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value.trim());
}

function getUuid(value: unknown) {
  return isUuid(value) ? value.trim() : null;
}

function getOptionalUuid(value: unknown) {
  return value === null || value === undefined ? undefined : getUuid(value);
}

function getPositiveInteger(value: unknown, max: number) {
  return Number.isInteger(value) && Number(value) > 0 && Number(value) <= max
    ? Number(value)
    : null;
}

function getNonNegativeInteger(value: unknown, max: number) {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= max
    ? Number(value)
    : null;
}

function getGeneratedAt(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const generatedAt = value.trim();

  return Number.isNaN(Date.parse(generatedAt)) ? null : generatedAt;
}

function getRequestIds(value: unknown) {
  if (!Array.isArray(value) || value.length > maxPacketLimit) {
    return null;
  }

  const requestIds = value.map(getUuid);

  return requestIds.every(Boolean) ? (requestIds as string[]) : null;
}

function validAdminContext(admin: TrustedQuoteAdminContext) {
  return (
    admin.resolution === "server-auth-membership" &&
    isUuid(admin.workspaceId) &&
    isUuid(admin.adminUserId) &&
    (admin.membershipId === undefined || isUuid(admin.membershipId))
  );
}

function packetToManifestInsert(
  input: CreateAdminQuoteRequestCrmHandoffPacketManifestInput
): ManifestInsert | null {
  const limit = getPositiveInteger(input.packet.limit, maxPacketLimit);
  const generatedAt = getGeneratedAt(input.packet.generatedAt);
  const requestIds = input.packet.records.map((record) => record.id.trim());

  if (
    input.packet.provider !== "hubspot" ||
    input.packet.localCrmSyncStatus !== "queued" ||
    !limit ||
    !generatedAt ||
    input.packet.recordCount !== input.packet.records.length ||
    requestIds.length > maxPacketLimit ||
    !requestIds.every(isUuid)
  ) {
    return null;
  }

  return {
    workspace_id: input.admin.workspaceId,
    provider: "hubspot",
    packet_kind: input.packetKind ?? "json_review_packet",
    status_filter: "queued",
    limit_requested: limit,
    record_count: requestIds.length,
    request_ids: requestIds,
    generated_by_admin_user_id: input.admin.adminUserId,
    generated_at: generatedAt,
    source: "protected_admin"
  };
}

function toManifestRecord(
  row: ManifestRow
): AdminQuoteRequestCrmHandoffPacketManifestRecord | null {
  const id = getUuid(row.id);
  const workspaceId = getUuid(row.workspace_id);
  const limitRequested = getPositiveInteger(row.limit_requested, maxPacketLimit);
  const recordCount = getNonNegativeInteger(row.record_count, maxPacketLimit);
  const requestIds = getRequestIds(row.request_ids);
  const generatedAt = getGeneratedAt(row.generated_at);
  const generatedByAdminUserId = getOptionalUuid(row.generated_by_admin_user_id);
  const packetKind = getPacketKind(row.packet_kind);

  if (
    !id ||
    !workspaceId ||
    row.provider !== "hubspot" ||
    !packetKind ||
    row.status_filter !== "queued" ||
    !limitRequested ||
    recordCount === null ||
    !requestIds ||
    requestIds.length !== recordCount ||
    !generatedAt ||
    row.source !== "protected_admin" ||
    generatedByAdminUserId === null
  ) {
    return null;
  }

  return {
    id,
    workspaceId,
    provider: "hubspot",
    packetKind,
    statusFilter: "queued",
    limitRequested,
    recordCount,
    requestIds,
    requestIdCount: requestIds.length,
    generatedByAdminUserId,
    generatedAt,
    source: "protected_admin"
  };
}

async function createDefaultSupabase(): Promise<AdminQuoteRequestCrmHandoffPacketManifestSupabaseClientResult> {
  const supabase = await createSessionBoundSupabaseAdminReadClient();

  return supabase.configured
    ? {
        configured: true,
        client: supabase.client as unknown as AdminQuoteRequestCrmHandoffPacketManifestSupabaseClient,
        missingEnv: []
      }
    : {
        configured: false,
        client: null,
        reason: "authenticated_admin_manifest_client_required"
      };
}

function requireRows(result: QueryResult) {
  if (result.error || !Array.isArray(result.data)) {
    return null;
  }

  return result.data.every(isRecord) ? result.data : null;
}

export async function createAdminQuoteRequestCrmHandoffPacketManifest(
  input: CreateAdminQuoteRequestCrmHandoffPacketManifestInput,
  options: ManifestOptions = {}
): Promise<AdminQuoteRequestCrmHandoffPacketManifestCreateResult> {
  if (!validAdminContext(input.admin)) {
    return {
      status: "invalid_admin_context"
    };
  }

  const insert = packetToManifestInsert(input);

  if (!insert) {
    return {
      status: "invalid_packet"
    };
  }

  const supabase = options.supabase ?? (await createDefaultSupabase());

  if (!supabase.configured) {
    return {
      status: "unavailable"
    };
  }

  try {
    const result = await supabase.client
      .from("quote_crm_handoff_packet_manifests")
      .insert(insert)
      .select(selectColumns)
      .single();

    if (result.error || !isRecord(result.data)) {
      return {
        status: "unavailable"
      };
    }

    const manifest = toManifestRecord(result.data);

    return manifest
      ? {
          status: "created",
          manifest
        }
      : {
          status: "unavailable"
        };
  } catch {
    return {
      status: "unavailable"
    };
  }
}

function getRecentLimit(value: unknown) {
  if (value === undefined) {
    return defaultRecentLimit;
  }

  if (!Number.isInteger(value) || Number(value) <= 0) {
    return null;
  }

  return Math.min(Number(value), maxRecentLimit);
}

export async function readRecentAdminQuoteRequestCrmHandoffPacketManifests(
  input: ReadRecentAdminQuoteRequestCrmHandoffPacketManifestsInput,
  options: ManifestOptions = {}
): Promise<AdminQuoteRequestCrmHandoffPacketManifestReadResult> {
  if (!validAdminContext(input.admin)) {
    return {
      status: "invalid_admin_context"
    };
  }

  const limit = getRecentLimit(input.limit);

  if (!limit) {
    return {
      status: "invalid_limit"
    };
  }

  const supabase = options.supabase ?? (await createDefaultSupabase());

  if (!supabase.configured) {
    return {
      status: "unavailable"
    };
  }

  try {
    const result = await supabase.client
      .from("quote_crm_handoff_packet_manifests")
      .select(selectColumns)
      .eq("workspace_id", input.admin.workspaceId)
      .eq("provider", "hubspot")
      .eq("status_filter", "queued")
      .order("generated_at", { ascending: false })
      .limit(limit);
    const rows = requireRows(result);

    if (!rows) {
      return {
        status: "unavailable"
      };
    }

    return {
      status: "loaded",
      manifests: rows.map(toManifestRecord).filter(
        (
          manifest
        ): manifest is AdminQuoteRequestCrmHandoffPacketManifestRecord =>
          Boolean(manifest)
      )
    };
  } catch {
    return {
      status: "unavailable"
    };
  }
}

export const adminQuoteRequestCrmHandoffPacketManifestPersistence: AdminQuoteRequestCrmHandoffPacketManifestPersistence = {
  createManifest: createAdminQuoteRequestCrmHandoffPacketManifest,
  readRecentManifests: readRecentAdminQuoteRequestCrmHandoffPacketManifests
};
