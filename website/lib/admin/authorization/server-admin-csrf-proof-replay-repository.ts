import "server-only";

import * as crypto from "node:crypto";

import { isCsrfProtectedAdminOperation } from "./admin-authorization-policy";
import { createSessionBoundSupabaseAdminReadClient } from "./supabase-admin-auth-identity-adapter";
import type { ServerAdminCsrfReplayCheckInput } from "./server-admin-csrf-proof-verifier";
import { getAdminCsrfProofSecret } from "../../server-runtime-config";

type ReplayRpcResult = {
  data: unknown;
  error: unknown;
};

type ReplayRpcClient = {
  rpc: (
    functionName: "consume_admin_csrf_proof",
    args: {
      p_operation: string;
      p_expected_workspace_id: string;
      p_proof_fingerprint: string;
      p_issued_at_ms: number;
      p_expires_at_ms: number;
    }
  ) => PromiseLike<ReplayRpcResult>;
};

export type ServerAdminCsrfReplayRepositoryDependencies = {
  createReadClient?: typeof createSessionBoundSupabaseAdminReadClient;
  readSecret?: () => string | null;
};

const replayVersion = "csrf-replay-v1";

function normalizeRequired(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isValidTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export function createServerAdminCsrfReplayCanonicalPayload(
  input: ServerAdminCsrfReplayCheckInput
): string | null {
  const operation = normalizeRequired(input.operation);
  const expectedWorkspaceId = normalizeRequired(input.expectedWorkspaceId);
  const sessionBinding = normalizeRequired(input.sessionBinding);
  const nonce = normalizeRequired(input.nonce);

  if (
    !operation ||
    !isCsrfProtectedAdminOperation(operation) ||
    !expectedWorkspaceId ||
    !sessionBinding ||
    !nonce ||
    !isValidTimestamp(input.issuedAt) ||
    !isValidTimestamp(input.expiresAt) ||
    input.expiresAt <= input.issuedAt ||
    input.expiresAt - input.issuedAt > 5 * 60_000
  ) {
    return null;
  }

  return JSON.stringify([
    ["version", replayVersion],
    ["operation", operation],
    ["workspaceId", expectedWorkspaceId],
    ["sessionBinding", sessionBinding],
    ["nonce", nonce],
    ["issuedAt", input.issuedAt],
    ["expiresAt", input.expiresAt]
  ]);
}

function createFingerprint(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export async function consumeServerAdminCsrfProof(
  input: ServerAdminCsrfReplayCheckInput,
  dependencies: ServerAdminCsrfReplayRepositoryDependencies = {}
): Promise<boolean> {
  try {
    const canonicalPayload = createServerAdminCsrfReplayCanonicalPayload(input);
    const readSecret = dependencies.readSecret ?? getAdminCsrfProofSecret;
    const secret = normalizeRequired(readSecret());

    if (!canonicalPayload || !secret) {
      return false;
    }

    const createReadClient =
      dependencies.createReadClient ?? createSessionBoundSupabaseAdminReadClient;
    const supabase = await createReadClient();

    if (!supabase.configured || !supabase.client?.rpc) {
      return false;
    }

    const fingerprint = createFingerprint(canonicalPayload, secret);
    const result = await (supabase.client as unknown as ReplayRpcClient).rpc(
      "consume_admin_csrf_proof",
      {
        p_operation: input.operation,
        p_expected_workspace_id: input.expectedWorkspaceId,
        p_proof_fingerprint: fingerprint,
        p_issued_at_ms: input.issuedAt,
        p_expires_at_ms: input.expiresAt
      }
    );

    return !result.error && result.data === true;
  } catch {
    return false;
  }
}
