import "server-only";

import type { AdminWorkspaceResolutionInput } from "./admin-authorization-adapters";
import type {
  AdminAuthorizationDenyReason,
  AdminMembershipState,
  AdminOperation,
  AdminRole,
  AdminUserState
} from "./admin-authorization-policy";
import {
  authorizeAdminOperation,
  isSupportedAdminOperation
} from "./admin-authorization-policy";
import {
  createServerAdminAuthorizationAdapterSet,
  type ServerAdminAuthorizationAdapterSetDependencies,
  type ServerAdminAuthorizationAdapterSetResult
} from "./server-admin-authorization-adapter-set";

export type ServerAdminCsrfProofBindingOperation =
  | "product.write"
  | "category.write"
  | "productImage.write"
  | "membership.manage";

export type ServerAdminCsrfProofSessionWorkspaceBindingInput = {
  requestedOperation?: AdminOperation | string | null;
  requestedWorkspaceIdForValidationOnly?: string | null;
  requestId?: string;
};

export type ServerAdminCsrfProofSessionWorkspaceBindingDeriverInput = {
  requestedOperation: ServerAdminCsrfProofBindingOperation;
  authUserId: string;
  adminUserId: string;
  workspaceId: string;
  membershipRole: AdminRole;
  requestId?: string;
};

export type ServerAdminCsrfProofSessionWorkspaceBindingDependencies =
  ServerAdminAuthorizationAdapterSetDependencies & {
    createAdapterSet?: (
      dependencies?: ServerAdminAuthorizationAdapterSetDependencies
    ) => Promise<ServerAdminAuthorizationAdapterSetResult>;
    deriveSessionWorkspaceBinding?: (
      input: ServerAdminCsrfProofSessionWorkspaceBindingDeriverInput
    ) => string | null | undefined | Promise<string | null | undefined>;
  };

export type ServerAdminCsrfProofSessionWorkspaceBindingUnavailableReason =
  | "admin_csrf_session_workspace_binding_unavailable"
  | "session_workspace_binding_deriver_unavailable"
  | "session_workspace_binding_derivation_failed";

export type ServerAdminCsrfProofSessionWorkspaceBindingDenyReason =
  | AdminAuthorizationDenyReason
  | ServerAdminCsrfProofSessionWorkspaceBindingUnavailableReason;

export type ServerAdminCsrfProofSessionWorkspaceBindingResult =
  | {
      bound: true;
      sessionBinding: string;
      requestId?: string;
    }
  | {
      bound: false;
      reason: ServerAdminCsrfProofSessionWorkspaceBindingDenyReason;
      statusCode: 400 | 401 | 403 | 503;
      requestId?: string;
    };

const csrfProofBindingOperations = new Set<ServerAdminCsrfProofBindingOperation>(
  ["product.write", "category.write", "productImage.write", "membership.manage"]
);

function normalizeRequired(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function isCsrfProofBindingOperation(
  operation: AdminOperation
): operation is ServerAdminCsrfProofBindingOperation {
  return csrfProofBindingOperations.has(
    operation as ServerAdminCsrfProofBindingOperation
  );
}

function deny(
  input: ServerAdminCsrfProofSessionWorkspaceBindingInput,
  reason: ServerAdminCsrfProofSessionWorkspaceBindingDenyReason,
  statusCode: 400 | 401 | 403 | 503
): ServerAdminCsrfProofSessionWorkspaceBindingResult {
  return {
    bound: false,
    reason,
    statusCode,
    ...(input.requestId ? { requestId: input.requestId } : {})
  };
}

function unavailable(
  input: ServerAdminCsrfProofSessionWorkspaceBindingInput
): ServerAdminCsrfProofSessionWorkspaceBindingResult {
  return deny(
    input,
    "admin_csrf_session_workspace_binding_unavailable",
    503
  );
}

function getAdapterSetDependencies(
  dependencies: ServerAdminCsrfProofSessionWorkspaceBindingDependencies
): ServerAdminAuthorizationAdapterSetDependencies {
  const adapterSetDependencies: ServerAdminAuthorizationAdapterSetDependencies =
    {};

  if (dependencies.auth) {
    adapterSetDependencies.auth = dependencies.auth;
  }

  if (dependencies.readClient) {
    adapterSetDependencies.readClient = dependencies.readClient;
  }

  if (dependencies.workspace) {
    adapterSetDependencies.workspace = dependencies.workspace;
  }

  return adapterSetDependencies;
}

function toWorkspaceResolutionInput(
  input: ServerAdminCsrfProofSessionWorkspaceBindingInput,
  requestedOperation: ServerAdminCsrfProofBindingOperation
): AdminWorkspaceResolutionInput {
  return {
    requestedOperation,
    ...(input.requestedWorkspaceIdForValidationOnly !== undefined
      ? {
          requestedWorkspaceIdForValidationOnly:
            input.requestedWorkspaceIdForValidationOnly
        }
      : {}),
    ...(input.requestId ? { requestId: input.requestId } : {})
  };
}

function missingSessionDecision(
  input: ServerAdminCsrfProofSessionWorkspaceBindingInput
) {
  return deny(input, "unauthenticated", 401);
}

function workspaceDecision(
  input: ServerAdminCsrfProofSessionWorkspaceBindingInput,
  operation: ServerAdminCsrfProofBindingOperation,
  adminUser: AdminUserState,
  workspaceId: string | null,
  membership: AdminMembershipState | null
) {
  return authorizeAdminOperation({
    authenticated: true,
    adminUser,
    serverResolvedWorkspaceId: workspaceId,
    membership,
    operation
  });
}

async function deriveBinding(
  input: ServerAdminCsrfProofSessionWorkspaceBindingInput,
  dependencies: ServerAdminCsrfProofSessionWorkspaceBindingDependencies,
  deriverInput: ServerAdminCsrfProofSessionWorkspaceBindingDeriverInput
): Promise<ServerAdminCsrfProofSessionWorkspaceBindingResult> {
  if (!dependencies.deriveSessionWorkspaceBinding) {
    return deny(input, "session_workspace_binding_deriver_unavailable", 503);
  }

  try {
    const sessionBinding = normalizeRequired(
      await dependencies.deriveSessionWorkspaceBinding(deriverInput)
    );

    if (!sessionBinding) {
      return deny(input, "session_workspace_binding_derivation_failed", 503);
    }

    return {
      bound: true,
      sessionBinding,
      ...(input.requestId ? { requestId: input.requestId } : {})
    };
  } catch {
    return deny(input, "session_workspace_binding_derivation_failed", 503);
  }
}

export async function resolveServerAdminCsrfProofSessionWorkspaceBinding(
  input: ServerAdminCsrfProofSessionWorkspaceBindingInput,
  dependencies: ServerAdminCsrfProofSessionWorkspaceBindingDependencies = {}
): Promise<ServerAdminCsrfProofSessionWorkspaceBindingResult> {
  const requestedOperation = normalizeRequired(input.requestedOperation);

  if (
    !requestedOperation ||
    !isSupportedAdminOperation(requestedOperation) ||
    !isCsrfProofBindingOperation(requestedOperation)
  ) {
    return deny(input, "operation_not_supported", 400);
  }

  try {
    const createAdapterSet =
      dependencies.createAdapterSet ?? createServerAdminAuthorizationAdapterSet;
    const adapterSet = await createAdapterSet(
      getAdapterSetDependencies(dependencies)
    );

    if (!adapterSet.configured) {
      return unavailable(input);
    }

    const identity = await adapterSet.adapters.auth.resolveIdentity();
    const authUserId = normalizeRequired(identity.authUserId);

    if (!identity.authenticated || !authUserId) {
      return missingSessionDecision(input);
    }

    const adminUser = await adapterSet.adapters.profile.resolveAdminProfile(
      authUserId
    );

    if (!adminUser) {
      return deny(input, "admin_profile_missing", 403);
    }

    if (adminUser.status !== "active") {
      return deny(input, "admin_profile_inactive", 403);
    }

    const workspaceResolution =
      await adapterSet.adapters.workspace.resolveWorkspaceForRequest(
        toWorkspaceResolutionInput(input, requestedOperation)
      );
    const workspaceId = normalizeRequired(
      workspaceResolution.serverResolvedWorkspaceId
    );
    const membership = workspaceId
      ? await adapterSet.adapters.membership.resolveMembership(
          adminUser.id,
          workspaceId
        )
      : null;
    const workspaceAuthorization = workspaceDecision(
      input,
      requestedOperation,
      adminUser,
      workspaceId,
      membership
    );

    if (!workspaceAuthorization.allowed) {
      return deny(
        input,
        workspaceAuthorization.reason,
        workspaceAuthorization.statusCode
      );
    }

    if (!membership) {
      return unavailable(input);
    }

    return deriveBinding(input, dependencies, {
      requestedOperation,
      authUserId,
      adminUserId: adminUser.id,
      workspaceId: workspaceAuthorization.workspaceId,
      membershipRole: membership.role,
      ...(input.requestId ? { requestId: input.requestId } : {})
    });
  } catch {
    return unavailable(input);
  }
}
