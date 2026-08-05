import * as crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

import {
  consumeServerAdminCsrfProof,
  createServerAdminCsrfReplayCanonicalPayload
} from "./server-admin-csrf-proof-replay-repository";

const input = {
  operation: "admin.setupRecipe.write" as const,
  expectedWorkspaceId: "11111111-1111-4111-8111-111111111111",
  sessionBinding: "opaque-session-binding",
  nonce: "opaque-nonce",
  issuedAt: 1_700_000_000_000,
  expiresAt: 1_700_000_300_000
};

function createDependencies(data: unknown, error: unknown = null) {
  const rpc = vi.fn(async () => ({ data, error }));

  return {
    rpc,
    dependencies: {
      readSecret: () => "unit-test-secret",
      createReadClient: async () => ({
        configured: true as const,
        client: { rpc }
      }) as never
    }
  };
}

describe("durable admin CSRF replay repository", () => {
  it("uses the exact ordered replay-v1 canonical JSON representation", () => {
    expect(createServerAdminCsrfReplayCanonicalPayload(input)).toBe(
      JSON.stringify([
        ["version", "csrf-replay-v1"],
        ["operation", "admin.setupRecipe.write"],
        ["workspaceId", "11111111-1111-4111-8111-111111111111"],
        ["sessionBinding", "opaque-session-binding"],
        ["nonce", "opaque-nonce"],
        ["issuedAt", 1_700_000_000_000],
        ["expiresAt", 1_700_000_300_000]
      ])
    );
  });

  it("sends only the lowercase hexadecimal HMAC fingerprint and bounded metadata", async () => {
    const { rpc, dependencies } = createDependencies(true);
    const canonicalPayload = createServerAdminCsrfReplayCanonicalPayload(input);
    const expectedFingerprint = crypto
      .createHmac("sha256", "unit-test-secret")
      .update(canonicalPayload ?? "")
      .digest("hex");

    await expect(
      consumeServerAdminCsrfProof(input, dependencies)
    ).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith("consume_admin_csrf_proof", {
      p_operation: input.operation,
      p_expected_workspace_id: input.expectedWorkspaceId,
      p_proof_fingerprint: expectedFingerprint,
      p_issued_at_ms: input.issuedAt,
      p_expires_at_ms: input.expiresAt
    });
    expect(expectedFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(rpc.mock.calls)).not.toContain(input.sessionBinding);
    expect(JSON.stringify(rpc.mock.calls)).not.toContain(input.nonce);
    expect(JSON.stringify(rpc.mock.calls)).not.toContain("unit-test-secret");
  });

  it.each([false, null, undefined, [], "true", 1, {}])(
    "denies a non-true RPC response %j",
    async (data) => {
      const { dependencies } = createDependencies(data);

      await expect(
        consumeServerAdminCsrfProof(input, dependencies)
      ).resolves.toBe(false);
    }
  );

  it("denies RPC errors", async () => {
    const { dependencies } = createDependencies(true, { code: "fixture" });

    await expect(
      consumeServerAdminCsrfProof(input, dependencies)
    ).resolves.toBe(false);
  });

  it("denies missing configuration, client construction failures, and exceptions", async () => {
    await expect(
      consumeServerAdminCsrfProof(input, {
        readSecret: () => null,
        createReadClient: vi.fn() as never
      })
    ).resolves.toBe(false);
    await expect(
      consumeServerAdminCsrfProof(input, {
        readSecret: () => "unit-test-secret",
        createReadClient: async () => ({ configured: false }) as never
      })
    ).resolves.toBe(false);
    await expect(
      consumeServerAdminCsrfProof(input, {
        readSecret: () => "unit-test-secret",
        createReadClient: async () => {
          throw new Error("fixture");
        }
      })
    ).resolves.toBe(false);
  });

  it("denies malformed canonical inputs before constructing a client", async () => {
    const createReadClient = vi.fn();

    await expect(
      consumeServerAdminCsrfProof(
        { ...input, expectedWorkspaceId: " " },
        {
          readSecret: () => "unit-test-secret",
          createReadClient: createReadClient as never
        }
      )
    ).resolves.toBe(false);
    expect(createReadClient).not.toHaveBeenCalled();
  });

  it("contains no service-role, process-local replay state, or logging path", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "lib/admin/authorization/server-admin-csrf-proof-replay-repository.ts"
      ),
      "utf8"
    );

    expect(source).toContain("createSessionBoundSupabaseAdminReadClient");
    expect(source).not.toMatch(/service.?role/i);
    expect(source).not.toMatch(/new\s+(Map|Set)\s*</);
    expect(source).not.toMatch(/console\.|logger\.|log\(/);
  });
});
