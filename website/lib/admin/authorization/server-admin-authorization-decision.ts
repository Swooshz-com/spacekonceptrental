import "server-only";

import type { AdminAuthorizationDecision } from "./admin-authorization-policy";
import type {
  AdminAuthResolutionInput,
  AdminAuthorizationAdapterSet
} from "./admin-authorization-resolver";
import {
  resolveAdminAuthorizationWithAdapters
} from "./admin-authorization-resolver";
import {
  createServerAdminAuthorizationAdapterSet,
  type ServerAdminAuthorizationAdapterSetDependencies,
  type ServerAdminAuthorizationAdapterSetResult
} from "./server-admin-authorization-adapter-set";

export type ServerAdminAuthorizationUnavailableReason =
  "admin_authorization_unavailable";

export type ServerAdminAuthorizationUnavailableResult = {
  resolved: false;
  allowed: false;
  reason: ServerAdminAuthorizationUnavailableReason;
  statusCode: 503;
  requestId?: string;
};

export type ServerAdminAuthorizationDecisionResult =
  | AdminAuthorizationDecision
  | ServerAdminAuthorizationUnavailableResult;

export type ServerAdminAuthorizationDecisionDependencies =
  ServerAdminAuthorizationAdapterSetDependencies & {
    createAdapterSet?: (
      dependencies?: ServerAdminAuthorizationAdapterSetDependencies
    ) => Promise<ServerAdminAuthorizationAdapterSetResult>;
    resolveWithAdapters?: (
      input: AdminAuthResolutionInput,
      adapters: AdminAuthorizationAdapterSet
    ) => Promise<AdminAuthorizationDecision>;
  };

function unavailable(
  input: AdminAuthResolutionInput = {}
): ServerAdminAuthorizationUnavailableResult {
  return {
    resolved: false,
    allowed: false,
    reason: "admin_authorization_unavailable",
    statusCode: 503,
    ...(input.requestId ? { requestId: input.requestId } : {})
  };
}

function getAdapterSetDependencies(
  dependencies: ServerAdminAuthorizationDecisionDependencies
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

export async function resolveServerAdminAuthorizationDecision(
  input: AdminAuthResolutionInput = {},
  dependencies: ServerAdminAuthorizationDecisionDependencies = {}
): Promise<ServerAdminAuthorizationDecisionResult> {
  try {
    const createAdapterSet =
      dependencies.createAdapterSet ?? createServerAdminAuthorizationAdapterSet;
    const adapterSet = await createAdapterSet(
      getAdapterSetDependencies(dependencies)
    );

    if (!adapterSet.configured) {
      return unavailable(input);
    }

    const resolveWithAdapters =
      dependencies.resolveWithAdapters ?? resolveAdminAuthorizationWithAdapters;

    return await resolveWithAdapters(input, adapterSet.adapters);
  } catch {
    return unavailable(input);
  }
}
