import "server-only";

import { getAdminRouteRuntimeConfig } from "../../server-runtime-config";
import {
  createSessionBoundSupabaseAdminReadClient,
  resolveSupabaseAdminAuthIdentity
} from "../authorization/supabase-admin-auth-identity-adapter";

export type AdminAccessRole = "owner" | "admin";
export type AdminAccessStatus = "active" | "disabled" | "removed";
export type AdminAccessWriteAction =
  | "add_admin"
  | "disable_admin"
  | "remove_admin";

export type AdminAccessRecord = {
  email: string;
  role: AdminAccessRole;
  status: AdminAccessStatus;
  createdAt: string;
  updatedAt: string;
};

export type AdminAccessDashboardReadResult =
  | {
      status: "loaded";
      currentAdmin: {
        email: string;
        role: AdminAccessRole;
        canManageAccess: boolean;
      };
      records: AdminAccessRecord[];
    }
  | {
      status: "unavailable";
    };

export type AdminAccessMutationResult =
  | {
      ok: true;
      record: {
        email: string;
        role: AdminAccessRole;
        status: AdminAccessStatus;
      };
    }
  | {
      ok: false;
      code:
        | "access_management_unavailable"
        | "action_invalid"
        | "admin_not_found"
        | "email_invalid"
        | "owner_immutable"
        | "owner_required";
    };

type SupabaseQueryResult = {
  data: unknown;
  error: unknown;
};

type AdminAccessClient = {
  rpc(
    fn: "list_admin_access_records",
    args: {
      p_workspace_id: string;
    }
  ): PromiseLike<SupabaseQueryResult>;
  rpc(
    fn: "execute_admin_access_write",
    args: {
      p_workspace_id: string;
      p_action: AdminAccessWriteAction;
      p_email: string;
    }
  ): PromiseLike<SupabaseQueryResult>;
};

type AdminAccessRow = {
  normalized_email?: unknown;
  role?: unknown;
  status?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
};

type AdminAccessMutationRow = {
  ok?: unknown;
  code?: unknown;
  email?: unknown;
  role?: unknown;
  status?: unknown;
};

const adminAccessRoles = new Set<AdminAccessRole>(["owner", "admin"]);
const adminAccessStatuses = new Set<AdminAccessStatus>([
  "active",
  "disabled",
  "removed"
]);
const adminAccessWriteActions = new Set<AdminAccessWriteAction>([
  "add_admin",
  "disable_admin",
  "remove_admin"
]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toRows(value: unknown) {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" && emailPattern.test(value.trim())
    ? value.trim().toLowerCase()
    : null;
}

function isRole(value: unknown): value is AdminAccessRole {
  return typeof value === "string" && adminAccessRoles.has(value as AdminAccessRole);
}

function isStatus(value: unknown): value is AdminAccessStatus {
  return (
    typeof value === "string" &&
    adminAccessStatuses.has(value as AdminAccessStatus)
  );
}

function isAction(value: string): value is AdminAccessWriteAction {
  return adminAccessWriteActions.has(value as AdminAccessWriteAction);
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toRecord(row: AdminAccessRow): AdminAccessRecord | null {
  const email = normalizeEmail(row.normalized_email);
  const createdAt = text(row.created_at);
  const updatedAt = text(row.updated_at);

  if (!email || !isRole(row.role) || !isStatus(row.status) || !createdAt || !updatedAt) {
    return null;
  }

  return {
    email,
    role: row.role,
    status: row.status,
    createdAt,
    updatedAt
  };
}

function sortRecords(records: AdminAccessRecord[]) {
  return [...records].sort((left, right) => {
    if (left.role !== right.role) {
      return left.role === "owner" ? -1 : 1;
    }

    if (left.status !== right.status) {
      return left.status === "active" ? -1 : 1;
    }

    return left.email.localeCompare(right.email);
  });
}

function mutationFailure(
  code: Extract<AdminAccessMutationResult, { ok: false }>["code"]
) {
  return {
    ok: false as const,
    code
  };
}

function parseMutationResult(
  row: AdminAccessMutationRow
): AdminAccessMutationResult {
  const email = normalizeEmail(row.email);

  if (row.ok !== true) {
    const code = text(row.code);

    if (
      code === "action_invalid" ||
      code === "admin_not_found" ||
      code === "email_invalid" ||
      code === "owner_immutable" ||
      code === "owner_required"
    ) {
      return mutationFailure(code);
    }

    return mutationFailure("access_management_unavailable");
  }

  if (!email || !isRole(row.role) || !isStatus(row.status)) {
    return mutationFailure("access_management_unavailable");
  }

  return {
    ok: true,
    record: {
      email,
      role: row.role,
      status: row.status
    }
  };
}

export function parseAdminAccessWriteAction(
  value: unknown
): AdminAccessWriteAction | null {
  return typeof value === "string" && isAction(value) ? value : null;
}

export function normalizeAdminAccessEmail(value: unknown) {
  return normalizeEmail(value);
}

export async function resolveAdminAccessDashboardRead(): Promise<AdminAccessDashboardReadResult> {
  const routeConfig = getAdminRouteRuntimeConfig();
  const workspaceId = routeConfig.trustedServerWorkspaceId;

  if (!workspaceId) {
    return {
      status: "unavailable"
    };
  }

  const identity = await resolveSupabaseAdminAuthIdentity();
  const currentEmail = identity.authenticated
    ? normalizeEmail(identity.email)
    : null;

  if (!identity.authenticated || !currentEmail) {
    return {
      status: "unavailable"
    };
  }

  const supabase = await createSessionBoundSupabaseAdminReadClient();

  if (!supabase.configured) {
    return {
      status: "unavailable"
    };
  }

  try {
    const result = await (supabase.client as unknown as AdminAccessClient).rpc(
      "list_admin_access_records",
      {
        p_workspace_id: workspaceId
      }
    );
    const records = sortRecords(
      toRows(result.error ? [] : result.data)
        .map((row) => toRecord(row as AdminAccessRow))
        .filter((row): row is AdminAccessRecord => Boolean(row))
    );
    const currentRecord = records.find(
      (record) => record.email === currentEmail && record.status === "active"
    );

    if (!currentRecord) {
      return {
        status: "unavailable"
      };
    }

    return {
      status: "loaded",
      currentAdmin: {
        email: currentRecord.email,
        role: currentRecord.role,
        canManageAccess: currentRecord.role === "owner"
      },
      records
    };
  } catch {
    return {
      status: "unavailable"
    };
  }
}

export async function executeAdminAccessMutation(input: {
  action: AdminAccessWriteAction;
  email: string;
}): Promise<AdminAccessMutationResult> {
  const routeConfig = getAdminRouteRuntimeConfig();
  const workspaceId = routeConfig.trustedServerWorkspaceId;
  const email = normalizeAdminAccessEmail(input.email);

  if (!workspaceId || !email) {
    return mutationFailure("email_invalid");
  }

  const supabase = await createSessionBoundSupabaseAdminReadClient();

  if (!supabase.configured) {
    return mutationFailure("access_management_unavailable");
  }

  try {
    const result = await (supabase.client as unknown as AdminAccessClient).rpc(
      "execute_admin_access_write",
      {
        p_workspace_id: workspaceId,
        p_action: input.action,
        p_email: email
      }
    );

    if (result.error || !isRecord(result.data)) {
      return mutationFailure("access_management_unavailable");
    }

    return parseMutationResult(result.data);
  } catch {
    return mutationFailure("access_management_unavailable");
  }
}
