import "server-only";

import { emitAdminAuthDenied } from "../../application-events/app-operation-event-call-sites";
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
  emitAdminAuthDenied?: (input: {
    reason: string;
    statusCode: number;
  }) => Promise<unknown>;
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
      const result = unavailable();
      await emitDenied(dependencies, result.reason, result.statusCode);

      return result;
    }

    const gateInput: ServerAdminAuthorizationGateInput = {
      ...input,
      ...requestMetadata.metadata
    };

    try {
      const resolveGate =
        dependencies.resolveGate ?? resolveServerAdminAuthorizationGate;
      const result = await resolveGate(gateInput, dependencies.gate ?? {});

      if (!result.allowed) {
        await emitDenied(dependencies, result.reason, result.statusCode);
      }

      return result;
    } catch {
      const result = unavailable(requestMetadata.metadata.requestId);
      await emitDenied(dependencies, result.reason, result.statusCode);

      return result;
    }
  } catch {
    const result = unavailable();
    await emitDenied(dependencies, result.reason, result.statusCode);

    return result;
  }
}

async function emitDenied(
  dependencies: ServerAdminRuntimeGateInvocationDependencies,
  reason: string,
  statusCode: number
) {
  const emit = dependencies.emitAdminAuthDenied ?? defaultEmitAdminAuthDenied;

  try {
    await emit({ reason, statusCode });
  } catch {
    // Sink failures must never change the admin authorization decision.
  }
}

async function defaultEmitAdminAuthDenied(input: {
  reason: string;
  statusCode: number;
}) {
  await emitAdminAuthDenied(input.reason, input.statusCode, {});
}
