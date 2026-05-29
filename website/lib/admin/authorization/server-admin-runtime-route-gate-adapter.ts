import "server-only";

import {
  resolveServerAdminRuntimeGateInvocation,
  type ServerAdminRuntimeGateInvocationDependencies,
  type ServerAdminRuntimeGateInvocationInput,
  type ServerAdminRuntimeGateInvocationResult
} from "./server-admin-runtime-gate-invocation";

export type ServerAdminRuntimeRouteGateRequestLike = {
  method?: string | null;
};

export type ServerAdminRuntimeRouteGateAdapterInput =
  ServerAdminRuntimeGateInvocationInput & {
    requestMethod?: string | null;
    request?: ServerAdminRuntimeRouteGateRequestLike | null;
  };

export type ServerAdminRuntimeRouteGateAdapterResult =
  ServerAdminRuntimeGateInvocationResult;

export type ServerAdminRuntimeRouteGateAdapterDependencies = Omit<
  ServerAdminRuntimeGateInvocationDependencies,
  "requestMetadata"
> & {
  requestMetadata: Omit<
    ServerAdminRuntimeGateInvocationDependencies["requestMetadata"],
    "requestMethod"
  >;
  resolveRuntimeGateInvocation?: (
    input: ServerAdminRuntimeGateInvocationInput,
    dependencies: ServerAdminRuntimeGateInvocationDependencies
  ) => Promise<ServerAdminRuntimeGateInvocationResult>;
};

function unavailable(): ServerAdminRuntimeRouteGateAdapterResult {
  return {
    allowed: false,
    reason: "admin_authorization_gate_unavailable",
    statusCode: 503
  };
}

function normalizeMethod(method: string | null | undefined): string | null {
  const normalized = method?.trim().toUpperCase();

  return normalized ? normalized : null;
}

function toInvocationInput(
  input: ServerAdminRuntimeRouteGateAdapterInput
): ServerAdminRuntimeGateInvocationInput {
  return {
    requestedOperation: input.requestedOperation,
    ...(input.requestedRecordWorkspaceId !== undefined
      ? { requestedRecordWorkspaceId: input.requestedRecordWorkspaceId }
      : {}),
    ...(input.requestedWorkspaceIdForValidationOnly !== undefined
      ? {
          requestedWorkspaceIdForValidationOnly:
            input.requestedWorkspaceIdForValidationOnly
        }
      : {})
  };
}

export async function resolveServerAdminRuntimeRouteGateAdapter(
  input: ServerAdminRuntimeRouteGateAdapterInput,
  dependencies: ServerAdminRuntimeRouteGateAdapterDependencies
): Promise<ServerAdminRuntimeRouteGateAdapterResult> {
  const requestMethod = normalizeMethod(
    input.requestMethod ?? input.request?.method
  );

  if (!requestMethod) {
    return unavailable();
  }

  const {
    requestMetadata,
    resolveRuntimeGateInvocation,
    ...runtimeGateDependencies
  } = dependencies;
  const resolveInvocation =
    resolveRuntimeGateInvocation ?? resolveServerAdminRuntimeGateInvocation;

  try {
    return await resolveInvocation(toInvocationInput(input), {
      ...runtimeGateDependencies,
      requestMetadata: {
        ...requestMetadata,
        requestMethod
      }
    });
  } catch {
    return unavailable();
  }
}
