import "server-only";

import type {
  AdminMembershipAdapter,
  AdminProfileAdapter,
  ResolvedAdminIdentity,
  ResolvedAdminMembership,
  ResolvedAdminProfile
} from "./admin-authorization-adapters";
import type { AdminRole } from "./admin-authorization-policy";

type SupabaseQueryResult = {
  data: unknown;
  error: unknown;
};

type SupabaseAdminReadFilter = {
  eq(column: string, value: string): SupabaseAdminReadFilter;
  limit(count: number): PromiseLike<SupabaseQueryResult>;
};

export type SupabaseAdminReadClient = {
  rpc?: {
    (
      fn: "ensure_admin_access_membership",
      args: {
        p_workspace_id: string;
      }
    ): PromiseLike<SupabaseQueryResult>;
    (
      fn: "get_admin_access_membership",
      args: {
        p_workspace_id: string;
        p_admin_user_id: string;
      }
    ): PromiseLike<SupabaseQueryResult>;
  };
  from(table: string): {
    select(columns: string): SupabaseAdminReadFilter;
  };
};

export type SupabaseAdminReadClientResult =
  | {
      configured: true;
      client: SupabaseAdminReadClient;
      missingEnv: [];
    }
  | {
      configured: false;
      client: null;
      reason: "authenticated_admin_read_client_required";
    };

export type SupabaseAdminReadDependencies = {
  supabase?: SupabaseAdminReadClientResult;
};

type AdminProfileRow = {
  id?: unknown;
  auth_user_id?: unknown;
  status?: unknown;
};

type AdminMembershipRow = {
  admin_user_id?: unknown;
  workspace_id?: unknown;
  status?: unknown;
  role?: unknown;
};

type AdminAccessRow = {
  normalized_email?: unknown;
  role?: unknown;
  status?: unknown;
};

const adminRoles = new Set<AdminRole>(["owner", "admin", "viewer"]);
const launchAdminRoles = new Set<AdminRole>(["owner", "admin"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getSupabase(
  dependencies: SupabaseAdminReadDependencies = {}
): SupabaseAdminReadClientResult {
  return (
    dependencies.supabase ?? {
      configured: false,
      client: null,
      reason: "authenticated_admin_read_client_required"
    }
  );
}

function toRows(value: unknown) {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && adminRoles.has(value as AdminRole);
}

function isLaunchAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && launchAdminRoles.has(value as AdminRole);
}

function normalizedEmail(value: unknown) {
  return typeof value === "string" && value.trim().includes("@")
    ? value.trim().toLowerCase()
    : undefined;
}

function toResolvedAdminProfile(
  row: AdminProfileRow,
  authUserId: string
): ResolvedAdminProfile | null {
  const id = getString(row.id);
  const rowAuthUserId = getString(row.auth_user_id);

  if (!id || rowAuthUserId !== authUserId || row.status !== "active") {
    return null;
  }

  return {
    id,
    status: "active"
  };
}

function toResolvedAdminMembership(
  row: AdminMembershipRow,
  adminUserId: string,
  serverResolvedWorkspaceId: string,
  access: AdminAccessRow
): ResolvedAdminMembership | null {
  const rowAdminUserId = getString(row.admin_user_id);
  const rowWorkspaceId = getString(row.workspace_id);

  if (
    rowAdminUserId !== adminUserId ||
    rowWorkspaceId !== serverResolvedWorkspaceId ||
    row.status !== "active" ||
    !isAdminRole(row.role) ||
    access.status !== "active" ||
    !isLaunchAdminRole(access.role) ||
    access.role !== row.role
  ) {
    return null;
  }

  return {
    adminUserId: rowAdminUserId,
    workspaceId: rowWorkspaceId,
    status: "active",
    role: row.role
  };
}

async function ensureAdminAccessMembership(
  authUserId: string,
  serverResolvedWorkspaceId: string,
  identity: ResolvedAdminIdentity | undefined,
  dependencies: SupabaseAdminReadDependencies
) {
  const supabase = getSupabase(dependencies);

  if (
    !supabase.configured ||
    !supabase.client.rpc ||
    identity?.provider !== "google" ||
    normalizedEmail(identity.email) === undefined ||
    !getString(authUserId) ||
    !getString(serverResolvedWorkspaceId)
  ) {
    return false;
  }

  try {
    const result = await supabase.client.rpc("ensure_admin_access_membership", {
      p_workspace_id: serverResolvedWorkspaceId
    });

    return !result.error;
  } catch {
    return false;
  }
}

export async function resolveSupabaseAdminProfile(
  authUserId: string,
  serverResolvedWorkspaceId?: string | null,
  identity?: ResolvedAdminIdentity,
  dependencies: SupabaseAdminReadDependencies = {}
): Promise<ResolvedAdminProfile | null> {
  const normalizedAuthUserId = getString(authUserId);
  const normalizedWorkspaceId = getString(serverResolvedWorkspaceId ?? undefined);

  if (!normalizedAuthUserId) {
    return null;
  }

  const supabase = getSupabase(dependencies);

  if (!supabase.configured) {
    return null;
  }

  if (normalizedWorkspaceId) {
    const ensured = await ensureAdminAccessMembership(
      normalizedAuthUserId,
      normalizedWorkspaceId,
      identity,
      dependencies
    );

    if (!ensured) {
      return null;
    }
  }

  try {
    const result = await supabase.client
      .from("admin_users")
      .select("id, auth_user_id, status")
      .eq("auth_user_id", normalizedAuthUserId)
      .limit(2);
    const rows = result.error ? [] : toRows(result.data);
    const profile = rows[0] as AdminProfileRow | undefined;

    return rows.length === 1 && profile
      ? toResolvedAdminProfile(profile, normalizedAuthUserId)
      : null;
  } catch {
    return null;
  }
}

export async function resolveSupabaseAdminMembership(
  adminUserId: string,
  serverResolvedWorkspaceId: string,
  dependencies: SupabaseAdminReadDependencies = {}
): Promise<ResolvedAdminMembership | null> {
  const normalizedAdminUserId = getString(adminUserId);
  const normalizedWorkspaceId = getString(serverResolvedWorkspaceId);

  if (!normalizedAdminUserId || !normalizedWorkspaceId) {
    return null;
  }

  const supabase = getSupabase(dependencies);

  if (!supabase.configured) {
    return null;
  }

  try {
    if (!supabase.client.rpc) {
      return null;
    }

    const accessResult = await supabase.client.rpc(
      "get_admin_access_membership",
      {
        p_workspace_id: normalizedWorkspaceId,
        p_admin_user_id: normalizedAdminUserId
      }
    );
    const accessRows = accessResult.error ? [] : toRows(accessResult.data);
    const access = accessRows[0] as AdminAccessRow | undefined;

    if (accessRows.length !== 1 || !access) {
      return null;
    }

    const result = await supabase.client
      .from("memberships")
      .select("admin_user_id, workspace_id, status, role")
      .eq("admin_user_id", normalizedAdminUserId)
      .eq("workspace_id", normalizedWorkspaceId)
      .limit(2);
    const rows = result.error ? [] : toRows(result.data);
    const membership = rows[0] as AdminMembershipRow | undefined;

    return rows.length === 1 && membership
      ? toResolvedAdminMembership(
          membership,
          normalizedAdminUserId,
          normalizedWorkspaceId,
          access
        )
      : null;
  } catch {
    return null;
  }
}

export function createSupabaseAdminProfileAdapter(
  dependencies: SupabaseAdminReadDependencies = {}
): AdminProfileAdapter {
  return {
    resolveAdminProfile(authUserId, serverResolvedWorkspaceId, identity) {
      return resolveSupabaseAdminProfile(
        authUserId,
        serverResolvedWorkspaceId,
        identity,
        dependencies
      );
    }
  };
}

export function createSupabaseAdminMembershipAdapter(
  dependencies: SupabaseAdminReadDependencies = {}
): AdminMembershipAdapter {
  return {
    resolveMembership(adminUserId, serverResolvedWorkspaceId) {
      return resolveSupabaseAdminMembership(
        adminUserId,
        serverResolvedWorkspaceId,
        dependencies
      );
    }
  };
}
