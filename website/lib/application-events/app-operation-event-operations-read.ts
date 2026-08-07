import "server-only";

import { createSessionBoundSupabaseAdminReadClient } from "../admin/authorization/supabase-admin-auth-identity-adapter";
import { getAdminTrustedWorkspaceId } from "../server-runtime-config";
import {
  parseAppOperationEventOperationsSearchParams,
  type AppOperationEventOperationsQuery,
  type AppOperationEventOperationsSearchParams
} from "./app-operation-event-operations-query";
import {
  readAppOperationEventOperationsRows,
  type AppOperationEventOperationsSupabaseClient
} from "./app-operation-event-operations-repository";
import {
  mapAppOperationEventOperationsRows,
  type AppOperationEventOperationsRecord
} from "./app-operation-event-operations-mapper";
import { summariseAppOperationEventOperations } from "./app-operation-event-operations-summary";

export type AdminAppOperationEventOperationsReadResult =
  | {
      status: "invalid_filter";
    }
  | {
      status: "unavailable";
    }
  | {
      status: "loaded";
      query: AppOperationEventOperationsQuery;
      records: AppOperationEventOperationsRecord[];
      summary: ReturnType<typeof summariseAppOperationEventOperations>;
    };

export type AdminAppOperationEventOperationsReadSupabaseClientResult =
  | {
      configured: true;
      client: AppOperationEventOperationsSupabaseClient;
      missingEnv: [];
    }
  | {
      configured: false;
      client: null;
      reason: "authenticated_admin_read_client_required";
    };

export type AdminAppOperationEventOperationsReadOptions = {
  supabase?: AdminAppOperationEventOperationsReadSupabaseClientResult;
  env?: {
    ADMIN_TRUSTED_WORKSPACE_ID?: string | null;
  };
  searchParams?: AppOperationEventOperationsSearchParams;
  createSupabaseRead?: () => Promise<
    | {
        configured: true;
        client: unknown;
        missingEnv: [];
      }
    | {
        configured: false;
        client: null;
        reason: "authenticated_admin_read_client_required";
      }
  >;
};

function unavailable(): AdminAppOperationEventOperationsReadResult {
  return {
    status: "unavailable"
  };
}

async function getSupabase(
  options: AdminAppOperationEventOperationsReadOptions
): Promise<AdminAppOperationEventOperationsReadSupabaseClientResult> {
  if (options.supabase) {
    return options.supabase;
  }

  const createRead =
    options.createSupabaseRead ?? createSessionBoundSupabaseAdminReadClient;
  const supabase = await createRead();

  return supabase.configured
    ? {
        configured: true,
        client: supabase.client as unknown as AppOperationEventOperationsSupabaseClient,
        missingEnv: []
      }
    : {
        configured: false,
        client: null,
        reason: "authenticated_admin_read_client_required"
      };
}

/**
 * Protected server-only operations read. Parses and validates the supplied
 * filters first: invalid input returns a bounded invalid-filter result and
 * executes zero database queries. Missing trusted-workspace configuration and
 * a missing session-bound read client both return unavailable with zero reads.
 */
export async function resolveAdminAppOperationEventOperationsRead(
  options: AdminAppOperationEventOperationsReadOptions = {}
): Promise<AdminAppOperationEventOperationsReadResult> {
  const parsed = parseAppOperationEventOperationsSearchParams(
    options.searchParams ?? {}
  );

  if (parsed.kind === "invalid") {
    return {
      status: "invalid_filter"
    };
  }

  const workspaceId = getAdminTrustedWorkspaceId(options.env ?? process.env);

  if (!workspaceId) {
    return unavailable();
  }

  const supabase = await getSupabase(options);

  if (!supabase.configured) {
    return unavailable();
  }

  try {
    const rows = await readAppOperationEventOperationsRows(supabase.client, {
      workspaceId,
      query: parsed.query
    });

    if (!rows) {
      return unavailable();
    }

    const records = mapAppOperationEventOperationsRows(rows, workspaceId);

    if (!records) {
      return unavailable();
    }

    return {
      status: "loaded",
      query: parsed.query,
      records,
      summary: summariseAppOperationEventOperations(records)
    };
  } catch {
    return unavailable();
  }
}
