import "server-only";

import type {
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
