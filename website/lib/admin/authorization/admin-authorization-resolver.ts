import "server-only";

import type {
  AdminAuthAdapter,
  AdminMembershipAdapter,
  AdminProfileAdapter,
  AdminWorkspaceResolver
} from "./admin-authorization-adapters";
import {
  authorizeAdminOperation,
  isSupportedAdminOperation
} from "./admin-authorization-policy";
import type {
  AdminAuthorizationDecision,
  AdminAuthorizationInput,
  AdminMembershipState,
  AdminOperation,
  AdminUserState
} from "./admin-authorization-policy";

export type AdminAuthResolutionInput = {
  requestedOperation?: AdminOperation | string;
  requestedRecordWorkspaceId?: string | null;
  requestedWorkspaceIdForValidationOnly?: string | null;
  requestId?: string;
};

export type AdminAuthResolverUnavailableReason =
  | "auth_resolver_disabled"
  | "auth_not_implemented"
  | "membership_resolution_not_implemented"
  | "policy_input_not_available";

export type AdminAuthResolutionResult =
  | {
      resolved: false;
      allowed: false;
      reason: AdminAuthResolverUnavailableReason;
      statusCode: 501;
      requestId?: string;
    }
  | {
      resolved: true;
      authorizationInput: AdminAuthorizationInput;
    };

export type AdminAuthorizationAdapterSet = {
  auth: AdminAuthAdapter;
  profile: AdminProfileAdapter;
  workspace: AdminWorkspaceResolver;
  membership: AdminMembershipAdapter;
};

export type TrustedAdminAuthorizationContext = {
  authenticated: boolean;
  adminUser: AdminUserState | null;
  serverResolvedWorkspaceId: string;
  membership: AdminMembershipState | null;
  requestedOperation: AdminOperation | string;
  requestedRecordWorkspaceId?: string | null;
  requestedWorkspaceIdForValidationOnly?: string | null;
};

export function resolveAdminAuthorizationForRequest(
  input: AdminAuthResolutionInput = {}
): AdminAuthResolutionResult {
  return {
    resolved: false,
    allowed: false,
    reason: "auth_resolver_disabled",
    statusCode: 501,
    ...(input.requestId ? { requestId: input.requestId } : {})
  };
}

export function buildAdminAuthorizationInput(
  context: TrustedAdminAuthorizationContext
): AdminAuthorizationInput {
  const authorizationInput: AdminAuthorizationInput = {
    authenticated: context.authenticated,
    adminUser: context.adminUser,
    serverResolvedWorkspaceId: context.serverResolvedWorkspaceId,
    membership: context.membership,
    operation: context.requestedOperation
  };

  if (context.requestedRecordWorkspaceId) {
    authorizationInput.requestedRecordWorkspaceId =
      context.requestedRecordWorkspaceId;
  }

  return authorizationInput;
}

export async function resolveAdminAuthorizationWithAdapters(
  input: AdminAuthResolutionInput,
  adapters: AdminAuthorizationAdapterSet
): Promise<AdminAuthorizationDecision> {
  const operation = input.requestedOperation ?? "";
  const identity = await adapters.auth.resolveIdentity();

  if (!identity.authenticated || !identity.authUserId) {
    return authorizeAdminOperation({
      authenticated: false,
      operation
    });
  }

  const adminUser = await adapters.profile.resolveAdminProfile(
    identity.authUserId
  );

  if (!adminUser) {
    return authorizeAdminOperation({
      authenticated: true,
      adminUser: null,
      operation
    });
  }

  if (adminUser.status !== "active") {
    return authorizeAdminOperation({
      authenticated: true,
      adminUser,
      operation
    });
  }

  if (!isSupportedAdminOperation(operation)) {
    return authorizeAdminOperation({
      authenticated: true,
      adminUser,
      operation
    });
  }

  const { serverResolvedWorkspaceId } =
    await adapters.workspace.resolveWorkspaceForRequest(input);
  const normalizedWorkspaceId = serverResolvedWorkspaceId?.trim() ?? "";
  const membership = normalizedWorkspaceId
    ? await adapters.membership.resolveMembership(
        adminUser.id,
        normalizedWorkspaceId
      )
    : null;

  return authorizeAdminOperation(
    buildAdminAuthorizationInput({
      authenticated: true,
      adminUser,
      serverResolvedWorkspaceId: normalizedWorkspaceId,
      membership,
      requestedOperation: operation,
      requestedRecordWorkspaceId: input.requestedRecordWorkspaceId,
      requestedWorkspaceIdForValidationOnly:
        input.requestedWorkspaceIdForValidationOnly
    })
  );
}
