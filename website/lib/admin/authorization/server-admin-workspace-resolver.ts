import "server-only";

import type {
  AdminWorkspaceResolution,
  AdminWorkspaceResolutionInput,
  AdminWorkspaceResolver
} from "./admin-authorization-adapters";

type MaybePromise<T> = T | Promise<T>;

export type ServerAdminWorkspaceResolverDependencies = {
  trustedServerWorkspaceId?: string | null;
  getTrustedServerWorkspaceId?: () => MaybePromise<string | null | undefined>;
};

function closedWorkspaceResolution(): AdminWorkspaceResolution {
  return {
    serverResolvedWorkspaceId: null
  };
}

function normalizeWorkspaceId(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function readTrustedServerWorkspaceId(
  dependencies: ServerAdminWorkspaceResolverDependencies
) {
  if (dependencies.getTrustedServerWorkspaceId) {
    return dependencies.getTrustedServerWorkspaceId();
  }

  return dependencies.trustedServerWorkspaceId;
}

function hasValidationOnlyMismatch(
  input: AdminWorkspaceResolutionInput,
  serverResolvedWorkspaceId: string
) {
  if (input.requestedWorkspaceIdForValidationOnly == null) {
    return false;
  }

  return (
    normalizeWorkspaceId(input.requestedWorkspaceIdForValidationOnly) !==
    serverResolvedWorkspaceId
  );
}

export async function resolveServerAdminWorkspaceForRequest(
  input: AdminWorkspaceResolutionInput = {},
  dependencies: ServerAdminWorkspaceResolverDependencies = {}
): Promise<AdminWorkspaceResolution> {
  try {
    const serverResolvedWorkspaceId = normalizeWorkspaceId(
      await readTrustedServerWorkspaceId(dependencies)
    );

    if (
      !serverResolvedWorkspaceId ||
      hasValidationOnlyMismatch(input, serverResolvedWorkspaceId)
    ) {
      return closedWorkspaceResolution();
    }

    return {
      serverResolvedWorkspaceId
    };
  } catch {
    return closedWorkspaceResolution();
  }
}

export function createServerAdminWorkspaceResolver(
  dependencies: ServerAdminWorkspaceResolverDependencies = {}
): AdminWorkspaceResolver {
  return {
    resolveWorkspaceForRequest(input) {
      return resolveServerAdminWorkspaceForRequest(input, dependencies);
    }
  };
}
