import "server-only";

import { createSessionBoundSupabaseAdminReadClient } from "../../admin/authorization/supabase-admin-auth-identity-adapter";
import type { TrustedQuoteAdminContext } from "../admin-write/admin-quote-request-status-write";

type QueryResult = {
  data: unknown;
  error: unknown;
};

type ManualImportOutcomeInsert = {
  workspace_id: string;
  manifest_id: string;
  provider: "hubspot";
  packet_kind: "hubspot_import_csv";
  outcome_status: AdminQuoteRequestHubSpotManualImportOutcomeStatus;
  record_count: number;
  request_ids: string[];
  recorded_by_admin_user_id: string;
  recorded_at: string;
  source: "protected_admin";
};

type ManifestFilter = {
  eq(column: string, value: string): ManifestFilter;
  single(): Promise<QueryResult>;
};

type OutcomeFilter = {
  eq(column: string, value: string): OutcomeFilter;
  order(
    column: string,
    options?: {
      ascending?: boolean;
    }
  ): OutcomeFilter;
  limit(count: number): Promise<QueryResult>;
};

type OutcomeInsertBuilder = {
  select(columns: string): {
    single(): Promise<QueryResult>;
  };
};

export type AdminQuoteRequestHubSpotManualImportOutcomeSupabaseClient = {
  from(table: "quote_crm_handoff_packet_manifests"): {
    select(columns: string): ManifestFilter;
  };
  from(table: "quote_crm_handoff_manual_import_outcomes"): {
    insert(row: ManualImportOutcomeInsert): OutcomeInsertBuilder;
    select(columns: string): OutcomeFilter;
  };
};

export type AdminQuoteRequestHubSpotManualImportOutcomeSupabaseClientResult =
  | {
      configured: true;
      client: AdminQuoteRequestHubSpotManualImportOutcomeSupabaseClient;
      missingEnv: [];
    }
  | {
      configured: false;
      client: null;
      reason: "authenticated_admin_manual_import_outcome_client_required";
    };

export const adminQuoteRequestHubSpotManualImportOutcomeStatuses = [
  "manual_import_reviewed",
  "manual_import_completed_outside_skr",
  "manual_import_rejected_needs_correction",
  "manual_import_partial_needs_follow_up"
] as const;

export type AdminQuoteRequestHubSpotManualImportOutcomeStatus =
  (typeof adminQuoteRequestHubSpotManualImportOutcomeStatuses)[number];

export type AdminQuoteRequestHubSpotManualImportOutcomeRecord = {
  id: string;
  workspaceId: string;
  manifestId: string;
  provider: "hubspot";
  packetKind: "hubspot_import_csv";
  outcomeStatus: AdminQuoteRequestHubSpotManualImportOutcomeStatus;
  recordCount: number;
  requestIds: string[];
  requestIdCount: number;
  recordedByAdminUserId: string;
  recordedAt: string;
  source: "protected_admin";
};

export type AdminQuoteRequestHubSpotManualImportOutcomeRecordResult =
  | {
      status: "created";
      outcome: AdminQuoteRequestHubSpotManualImportOutcomeRecord;
    }
  | {
      status:
        | "invalid_admin_context"
        | "invalid_manifest_id"
        | "invalid_outcome_status"
        | "invalid_manifest"
        | "unavailable";
    };

export type AdminQuoteRequestHubSpotManualImportOutcomeReadResult =
  | {
      status: "loaded";
      outcomes: AdminQuoteRequestHubSpotManualImportOutcomeRecord[];
    }
  | {
      status: "invalid_admin_context" | "invalid_limit" | "unavailable";
    };

export type RecordAdminQuoteRequestHubSpotManualImportOutcomeInput = {
  admin: TrustedQuoteAdminContext;
  manifestId: string;
  outcomeStatus: AdminQuoteRequestHubSpotManualImportOutcomeStatus;
};

export type ReadRecentAdminQuoteRequestHubSpotManualImportOutcomesInput = {
  admin: TrustedQuoteAdminContext;
  limit?: number;
};

export type AdminQuoteRequestHubSpotManualImportOutcomeLedgerPersistence = {
  recordOutcome: (
    input: RecordAdminQuoteRequestHubSpotManualImportOutcomeInput
  ) => Promise<AdminQuoteRequestHubSpotManualImportOutcomeRecordResult>;
  readRecentOutcomes: (
    input: ReadRecentAdminQuoteRequestHubSpotManualImportOutcomesInput
  ) => Promise<AdminQuoteRequestHubSpotManualImportOutcomeReadResult>;
};

type ManifestRow = {
  id?: unknown;
  workspace_id?: unknown;
  provider?: unknown;
  packet_kind?: unknown;
  status_filter?: unknown;
  record_count?: unknown;
  request_ids?: unknown;
  source?: unknown;
};

type OutcomeRow = {
  id?: unknown;
  workspace_id?: unknown;
  manifest_id?: unknown;
  provider?: unknown;
  packet_kind?: unknown;
  outcome_status?: unknown;
  record_count?: unknown;
  request_ids?: unknown;
  recorded_by_admin_user_id?: unknown;
  recorded_at?: unknown;
  source?: unknown;
};

type SafeCsvManifest = {
  id: string;
  workspaceId: string;
  recordCount: number;
  requestIds: string[];
};

type ManualImportOutcomeOptions = {
  recordedAt?: () => string;
  supabase?: AdminQuoteRequestHubSpotManualImportOutcomeSupabaseClientResult;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const manifestSelectColumns =
  "id, workspace_id, provider, packet_kind, status_filter, record_count, request_ids, source";
const outcomeSelectColumns =
  "id, workspace_id, manifest_id, provider, packet_kind, outcome_status, record_count, request_ids, recorded_by_admin_user_id, recorded_at, source";
const defaultRecentLimit = 10;
const maxRecentLimit = 10;
const maxRequestIds = 100;
const maxReturnedRequestIds = 25;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value.trim());
}

function getUuid(value: unknown) {
  return isUuid(value) ? value.trim() : null;
}

function getDateString(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const dateString = value.trim();

  return Number.isNaN(Date.parse(dateString)) ? null : dateString;
}

function getNonNegativeInteger(value: unknown, max: number) {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= max
    ? Number(value)
    : null;
}

function getRequestIds(value: unknown) {
  if (!Array.isArray(value) || value.length > maxRequestIds) {
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

function isOutcomeStatus(
  value: unknown
): value is AdminQuoteRequestHubSpotManualImportOutcomeStatus {
  return adminQuoteRequestHubSpotManualImportOutcomeStatuses.includes(
    value as AdminQuoteRequestHubSpotManualImportOutcomeStatus
  );
}

function toCsvManifest(row: ManifestRow): SafeCsvManifest | null {
  const id = getUuid(row.id);
  const workspaceId = getUuid(row.workspace_id);
  const recordCount = getNonNegativeInteger(row.record_count, maxRequestIds);
  const requestIds = getRequestIds(row.request_ids);

  if (
    !id ||
    !workspaceId ||
    row.provider !== "hubspot" ||
    row.packet_kind !== "hubspot_import_csv" ||
    row.status_filter !== "queued" ||
    recordCount === null ||
    !requestIds ||
    requestIds.length !== recordCount ||
    row.source !== "protected_admin"
  ) {
    return null;
  }

  return {
    id,
    workspaceId,
    recordCount,
    requestIds
  };
}

function toOutcomeRecord(
  row: OutcomeRow
): AdminQuoteRequestHubSpotManualImportOutcomeRecord | null {
  const id = getUuid(row.id);
  const workspaceId = getUuid(row.workspace_id);
  const manifestId = getUuid(row.manifest_id);
  const recordCount = getNonNegativeInteger(row.record_count, maxRequestIds);
  const requestIds = getRequestIds(row.request_ids);
  const recordedByAdminUserId = getUuid(row.recorded_by_admin_user_id);
  const recordedAt = getDateString(row.recorded_at);

  if (
    !id ||
    !workspaceId ||
    !manifestId ||
    row.provider !== "hubspot" ||
    row.packet_kind !== "hubspot_import_csv" ||
    !isOutcomeStatus(row.outcome_status) ||
    recordCount === null ||
    !requestIds ||
    requestIds.length !== recordCount ||
    !recordedByAdminUserId ||
    !recordedAt ||
    row.source !== "protected_admin"
  ) {
    return null;
  }

  return {
    id,
    workspaceId,
    manifestId,
    provider: "hubspot",
    packetKind: "hubspot_import_csv",
    outcomeStatus: row.outcome_status,
    recordCount,
    requestIds: requestIds.slice(0, maxReturnedRequestIds),
    requestIdCount: requestIds.length,
    recordedByAdminUserId,
    recordedAt,
    source: "protected_admin"
  };
}

async function createDefaultSupabase(): Promise<AdminQuoteRequestHubSpotManualImportOutcomeSupabaseClientResult> {
  const supabase = await createSessionBoundSupabaseAdminReadClient();

  return supabase.configured
    ? {
        configured: true,
        client: supabase.client as unknown as AdminQuoteRequestHubSpotManualImportOutcomeSupabaseClient,
        missingEnv: []
      }
    : {
        configured: false,
        client: null,
        reason: "authenticated_admin_manual_import_outcome_client_required"
      };
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

function requireRows(result: QueryResult) {
  if (result.error || !Array.isArray(result.data)) {
    return null;
  }

  return result.data.every(isRecord) ? result.data : null;
}

function getRecordedAt(
  options: ManualImportOutcomeOptions
) {
  const configured = options.recordedAt?.();
  const recordedAt = configured ?? new Date().toISOString();

  return getDateString(recordedAt);
}

export async function recordAdminQuoteRequestHubSpotManualImportOutcome(
  input: RecordAdminQuoteRequestHubSpotManualImportOutcomeInput,
  options: ManualImportOutcomeOptions = {}
): Promise<AdminQuoteRequestHubSpotManualImportOutcomeRecordResult> {
  if (!validAdminContext(input.admin)) {
    return {
      status: "invalid_admin_context"
    };
  }

  const manifestId = getUuid(input.manifestId);

  if (!manifestId) {
    return {
      status: "invalid_manifest_id"
    };
  }

  if (!isOutcomeStatus(input.outcomeStatus)) {
    return {
      status: "invalid_outcome_status"
    };
  }

  const recordedAt = getRecordedAt(options);

  if (!recordedAt) {
    return {
      status: "unavailable"
    };
  }

  const supabase = options.supabase ?? (await createDefaultSupabase());

  if (!supabase.configured) {
    return {
      status: "unavailable"
    };
  }

  try {
    const manifestResult = await supabase.client
      .from("quote_crm_handoff_packet_manifests")
      .select(manifestSelectColumns)
      .eq("workspace_id", input.admin.workspaceId)
      .eq("id", manifestId)
      .eq("provider", "hubspot")
      .eq("packet_kind", "hubspot_import_csv")
      .eq("status_filter", "queued")
      .single();

    if (manifestResult.error || !isRecord(manifestResult.data)) {
      return {
        status: "unavailable"
      };
    }

    const manifest = toCsvManifest(manifestResult.data);

    if (!manifest || manifest.workspaceId !== input.admin.workspaceId) {
      return {
        status: "invalid_manifest"
      };
    }

    const insert: ManualImportOutcomeInsert = {
      workspace_id: input.admin.workspaceId,
      manifest_id: manifest.id,
      provider: "hubspot",
      packet_kind: "hubspot_import_csv",
      outcome_status: input.outcomeStatus,
      record_count: manifest.recordCount,
      request_ids: manifest.requestIds,
      recorded_by_admin_user_id: input.admin.adminUserId,
      recorded_at: recordedAt,
      source: "protected_admin"
    };
    const insertResult = await supabase.client
      .from("quote_crm_handoff_manual_import_outcomes")
      .insert(insert)
      .select(outcomeSelectColumns)
      .single();

    if (insertResult.error || !isRecord(insertResult.data)) {
      return {
        status: "unavailable"
      };
    }

    const outcome = toOutcomeRecord(insertResult.data);

    return outcome
      ? {
          status: "created",
          outcome
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

export async function readRecentAdminQuoteRequestHubSpotManualImportOutcomes(
  input: ReadRecentAdminQuoteRequestHubSpotManualImportOutcomesInput,
  options: ManualImportOutcomeOptions = {}
): Promise<AdminQuoteRequestHubSpotManualImportOutcomeReadResult> {
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
      .from("quote_crm_handoff_manual_import_outcomes")
      .select(outcomeSelectColumns)
      .eq("workspace_id", input.admin.workspaceId)
      .eq("provider", "hubspot")
      .eq("packet_kind", "hubspot_import_csv")
      .order("recorded_at", { ascending: false })
      .limit(limit);
    const rows = requireRows(result);

    if (!rows) {
      return {
        status: "unavailable"
      };
    }

    return {
      status: "loaded",
      outcomes: rows
        .map(toOutcomeRecord)
        .filter(
          (
            outcome
          ): outcome is AdminQuoteRequestHubSpotManualImportOutcomeRecord =>
            Boolean(outcome)
        )
    };
  } catch {
    return {
      status: "unavailable"
    };
  }
}

export const adminQuoteRequestHubSpotManualImportOutcomeLedgerPersistence: AdminQuoteRequestHubSpotManualImportOutcomeLedgerPersistence = {
  recordOutcome: recordAdminQuoteRequestHubSpotManualImportOutcome,
  readRecentOutcomes: readRecentAdminQuoteRequestHubSpotManualImportOutcomes
};
