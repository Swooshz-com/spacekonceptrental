import "server-only";

export type AdminRole = "owner" | "admin" | "viewer";

export type AdminOperation =
  | "catalogue.read"
  | "product.write"
  | "category.write"
  | "productImage.write"
  | "membership.manage";

export type AdminUserState = {
  id: string;
  status: "active" | "inactive";
};

export type AdminMembershipState = {
  workspaceId: string;
  status: "active" | "inactive";
  role: AdminRole;
};

export type AdminAuthorizationInput = {
  authenticated: boolean;
  adminUser?: AdminUserState | null;
  serverResolvedWorkspaceId?: string | null;
  membership?: AdminMembershipState | null;
  operation: AdminOperation | string;
  requestedRecordWorkspaceId?: string | null;
};

export type AdminAuthorizationDenyReason =
  | "unauthenticated"
  | "admin_profile_missing"
  | "admin_profile_inactive"
  | "workspace_missing"
  | "membership_missing"
  | "membership_inactive"
  | "workspace_mismatch"
  | "role_not_allowed"
  | "operation_not_supported";

export type AdminAuthorizationAllowReason = "allowed";

export type AdminAuthorizationDecision =
  | {
      allowed: true;
      reason: AdminAuthorizationAllowReason;
      statusCode: 200;
      workspaceId: string;
    }
  | {
      allowed: false;
      reason: AdminAuthorizationDenyReason;
      statusCode: 400 | 401 | 403;
    };

const roleOperationAccess: Record<AdminRole, Set<AdminOperation>> = {
  owner: new Set([
    "catalogue.read",
    "product.write",
    "category.write",
    "productImage.write",
    "membership.manage"
  ]),
  admin: new Set([
    "catalogue.read",
    "product.write",
    "category.write",
    "productImage.write"
  ]),
  viewer: new Set(["catalogue.read"])
};

const supportedOperations = new Set<AdminOperation>([
  "catalogue.read",
  "product.write",
  "category.write",
  "productImage.write",
  "membership.manage"
]);

function deny(
  reason: AdminAuthorizationDenyReason,
  statusCode: 400 | 401 | 403 = 403
): AdminAuthorizationDecision {
  return {
    allowed: false,
    reason,
    statusCode
  };
}

function isSupportedOperation(
  operation: string
): operation is AdminOperation {
  return supportedOperations.has(operation as AdminOperation);
}

export function authorizeAdminOperation(
  input: AdminAuthorizationInput
): AdminAuthorizationDecision {
  if (!input.authenticated) {
    return deny("unauthenticated", 401);
  }

  if (!input.adminUser) {
    return deny("admin_profile_missing");
  }

  if (input.adminUser.status !== "active") {
    return deny("admin_profile_inactive");
  }

  if (!isSupportedOperation(input.operation)) {
    return deny("operation_not_supported", 400);
  }

  const workspaceId = input.serverResolvedWorkspaceId?.trim();

  if (!workspaceId) {
    return deny("workspace_missing");
  }

  if (!input.membership) {
    return deny("membership_missing");
  }

  if (input.membership.status !== "active") {
    return deny("membership_inactive");
  }

  if (input.membership.workspaceId !== workspaceId) {
    return deny("workspace_mismatch");
  }

  if (
    input.requestedRecordWorkspaceId &&
    input.requestedRecordWorkspaceId !== workspaceId
  ) {
    return deny("workspace_mismatch");
  }

  if (!roleOperationAccess[input.membership.role]?.has(input.operation)) {
    return deny("role_not_allowed");
  }

  return {
    allowed: true,
    reason: "allowed",
    statusCode: 200,
    workspaceId
  };
}
