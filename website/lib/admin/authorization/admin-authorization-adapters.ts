import "server-only";

import type { AdminOperation, AdminRole } from "./admin-authorization-policy";

export type ResolvedAdminIdentity = {
  authenticated: boolean;
  authUserId?: string;
};

export type ResolvedAdminProfile = {
  id: string;
  status: "active" | "inactive";
};

export type ResolvedAdminMembership = {
  adminUserId: string;
  workspaceId: string;
  status: "active" | "inactive";
  role: AdminRole;
};

export type AdminWorkspaceResolutionInput = {
  requestedOperation?: AdminOperation | string;
  requestedRecordWorkspaceId?: string | null;
  requestedWorkspaceIdForValidationOnly?: string | null;
  requestId?: string;
};

export type AdminWorkspaceResolution = {
  serverResolvedWorkspaceId: string | null;
};

export type AdminAuthAdapter = {
  resolveIdentity(): Promise<ResolvedAdminIdentity>;
};

export type AdminProfileAdapter = {
  resolveAdminProfile(
    authUserId: string
  ): Promise<ResolvedAdminProfile | null>;
};

export type AdminMembershipAdapter = {
  resolveMembership(
    adminUserId: string,
    serverResolvedWorkspaceId: string
  ): Promise<ResolvedAdminMembership | null>;
};

export type AdminWorkspaceResolver = {
  resolveWorkspaceForRequest(
    input: AdminWorkspaceResolutionInput
  ): Promise<AdminWorkspaceResolution>;
};
