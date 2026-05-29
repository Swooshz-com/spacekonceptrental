import "server-only";

import {
  resolveServerAdminAuthorizationGate,
  type ServerAdminAuthorizationGateDependencies,
  type ServerAdminAuthorizationGateInput,
  type ServerAdminAuthorizationGateResult
} from "./server-admin-authorization-gate";
import {
  readServerAdminRequestMetadata,
  type ServerAdminRequestMetadataDependencies,
  type ServerAdminRequestMetadataResult
} from "./server-admin-request-metadata-adapter";

export type ServerAdminRuntimeGateInvocationInput = Pick<
  ServerAdminAuthorizationGateInput,
  | "requestedOperation"
  | "requestedRecordWorkspaceId"
  | "requestedWorkspaceIdForValidationOnly"
>;

export type ServerAdminRuntimeGateInvocationResult =
  ServerAdminAuthorizationGateResult;

export type ServerAdminRuntimeGateInvocationDependencies = {
  requestMetadata: ServerAdminRequestMetadataDependencies;
  gate?: ServerAdminAuthorizationGateDependencies;
  readRequestMetadata?: (
    dependencies: ServerAdminRequestMetadataDependencies
  ) => Promise<ServerAdminRequestMetadataResult>;
  resolveGate?: (
    input: ServerAdminAuthorizationGateInput,
    dependencies?: ServerAdminAuthorizationGateDependencies
  ) => Promise<ServerAdminAuthorizationGateResult>;
};

function unavailable(
  requestId?: string
): ServerAdminRuntimeGateInvocationResult {
  return {
    allowed: false,
    reason: "admin_authorization_gate_unavailable",
    statusCode: 503,
    ...(requestId ? { requestId } : {})
  };
}

export async function resolveServerAdminRuntimeGateInvocation(
  input: ServerAdminRuntimeGateInvocationInput,
  dependencies: ServerAdminRuntimeGateInvocationDependencies
): Promise<ServerAdminRuntimeGateInvocationResult> {
  try {
    const readRequestMetadata =
      dependencies.readRequestMetadata ?? readServerAdminRequestMetadata;
    const requestMetadata = await readRequestMetadata(
      dependencies.requestMetadata
    );

    if (!requestMetadata.configured) {
      return unavailable();
    }

    const gateInput: ServerAdminAuthorizationGateInput = {
      ...input,
      ...requestMetadata.metadata
    };

    try {
      const resolveGate =
        dependencies.resolveGate ?? resolveServerAdminAuthorizationGate;

      return await resolveGate(gateInput, dependencies.gate ?? {});
    } catch {
      return unavailable(requestMetadata.metadata.requestId);
    }
  } catch {
    return unavailable();
  }
}
