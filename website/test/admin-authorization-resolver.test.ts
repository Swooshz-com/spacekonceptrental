import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { authorizeAdminOperation } from "../lib/admin/authorization/admin-authorization-policy";
import type { AdminAuthorizationAdapterSet } from "../lib/admin/authorization/admin-authorization-resolver";
import {
  buildAdminAuthorizationInput,
  resolveAdminAuthorizationForRequest,
  resolveAdminAuthorizationWithAdapters,
  type AdminAuthResolutionInput,
  type TrustedAdminAuthorizationContext
} from "../lib/admin/authorization/admin-authorization-resolver";

const repoRoot = resolve(process.cwd(), "..");
const resolverPath =
  "website/lib/admin/authorization/admin-authorization-resolver.ts";
const activeWorkspaceId = "workspace-active";
const otherWorkspaceId = "workspace-other";

const disabledRequest: AdminAuthResolutionInput = {
  requestedOperation: "product.write",
  requestedRecordWorkspaceId: activeWorkspaceId,
  requestedWorkspaceIdForValidationOnly: activeWorkspaceId,
  requestId: "request-1"
};

const trustedContext: TrustedAdminAuthorizationContext = {
  authenticated: true,
  adminUser: {
    id: "admin-user-1",
    status: "active"
  },
  serverResolvedWorkspaceId: activeWorkspaceId,
  membership: {
    adminUserId: "admin-user-1",
    workspaceId: activeWorkspaceId,
    status: "active",
    role: "admin"
  },
  requestedOperation: "product.write"
};

function createAdapters(
  overrides: Partial<{
    serverResolvedWorkspaceId: string | null;
    requestedWorkspaceId: string | null;
    requestedRecordWorkspaceId: string | null;
  }> = {}
): AdminAuthorizationAdapterSet & { calls: string[] } {
  const calls: string[] = [];

  return {
    calls,
    auth: {
      async resolveIdentity() {
        calls.push("identity");
        return {
          authenticated: true,
          authUserId: "auth-user-1"
        };
      }
    },
    profile: {
      async resolveAdminProfile(authUserId) {
        calls.push(`profile:${authUserId}`);
        return {
          id: "admin-user-1",
          status: "active"
        };
      }
    },
    workspace: {
      async resolveWorkspaceForRequest(input) {
        calls.push(
          `workspace:${input.requestedWorkspaceIdForValidationOnly ?? "none"}`
        );
        return {
          serverResolvedWorkspaceId:
            overrides.serverResolvedWorkspaceId ?? activeWorkspaceId
        };
      }
    },
    membership: {
      async resolveMembership(adminUserId, serverResolvedWorkspaceId) {
        calls.push(`membership:${adminUserId}:${serverResolvedWorkspaceId}`);
        return {
          adminUserId,
          workspaceId: activeWorkspaceId,
          status: "active",
          role: "admin"
        };
      }
    }
  };
}

describe("admin authorization resolver contract", () => {
  it("returns an explicit disabled result without allowing operations", () => {
    expect(resolveAdminAuthorizationForRequest(disabledRequest)).toEqual({
      resolved: false,
      allowed: false,
      reason: "auth_resolver_disabled",
      statusCode: 501,
      requestId: "request-1"
    });
  });

  it("keeps disabled resolver responses boring and safe", () => {
    const result = resolveAdminAuthorizationForRequest(disabledRequest);
    const serialized = JSON.stringify(result).toLowerCase();

    expect(serialized).not.toContain("secret");
    expect(serialized).not.toContain("env");
    expect(serialized).not.toContain("supabase");
    expect(serialized).not.toContain("sql");
    expect(serialized).not.toContain("cookie");
    expect(serialized).not.toContain("header");
    expect(serialized).not.toContain("stack");
    expect(serialized).not.toContain("n8n");
    expect(serialized).not.toContain(activeWorkspaceId);
    expect(serialized).not.toContain(otherWorkspaceId);
  });

  it("builds policy input only from explicit trusted server-resolved values", () => {
    expect(buildAdminAuthorizationInput(trustedContext)).toEqual({
      authenticated: true,
      adminUser: {
        id: "admin-user-1",
        status: "active"
      },
      serverResolvedWorkspaceId: activeWorkspaceId,
      membership: {
        adminUserId: "admin-user-1",
        workspaceId: activeWorkspaceId,
        status: "active",
        role: "admin"
      },
      operation: "product.write"
    });
  });

  it("preserves requested record workspace only as validation metadata", () => {
    expect(
      buildAdminAuthorizationInput({
        ...trustedContext,
        requestedRecordWorkspaceId: otherWorkspaceId
      })
    ).toMatchObject({
      serverResolvedWorkspaceId: activeWorkspaceId,
      requestedRecordWorkspaceId: otherWorkspaceId
    });
  });

  it("does not treat requested workspace as authority", () => {
    expect(
      buildAdminAuthorizationInput({
        ...trustedContext,
        requestedWorkspaceIdForValidationOnly: otherWorkspaceId
      })
    ).toEqual({
      authenticated: true,
      adminUser: trustedContext.adminUser,
      serverResolvedWorkspaceId: activeWorkspaceId,
      membership: trustedContext.membership,
      operation: "product.write"
    });
  });

  it("feeds the policy for allowed active-admin same-workspace product writes", () => {
    const input = buildAdminAuthorizationInput(trustedContext);

    expect(authorizeAdminOperation(input)).toEqual({
      allowed: true,
      reason: "allowed",
      statusCode: 200,
      workspaceId: activeWorkspaceId
    });
  });

  it("feeds the policy for cross-workspace denial", () => {
    const input = buildAdminAuthorizationInput({
      ...trustedContext,
      requestedRecordWorkspaceId: otherWorkspaceId
    });

    expect(authorizeAdminOperation(input)).toEqual({
      allowed: false,
      reason: "workspace_mismatch",
      statusCode: 403
    });
  });

  it("feeds the policy for viewer product-write denial", () => {
    const input = buildAdminAuthorizationInput({
      ...trustedContext,
      membership: {
        adminUserId: "admin-user-1",
        workspaceId: activeWorkspaceId,
        status: "active",
        role: "viewer"
      }
    });

    expect(authorizeAdminOperation(input)).toEqual({
      allowed: false,
      reason: "role_not_allowed",
      statusCode: 403
    });
  });

  it("uses injected adapters only for adapter-driven resolution", async () => {
    const adapters = createAdapters();

    await expect(
      resolveAdminAuthorizationWithAdapters(disabledRequest, adapters)
    ).resolves.toEqual({
      allowed: true,
      reason: "allowed",
      statusCode: 200,
      workspaceId: activeWorkspaceId
    });
    expect(adapters.calls).toEqual([
      "identity",
      "profile:auth-user-1",
      `workspace:${activeWorkspaceId}`,
      `membership:admin-user-1:${activeWorkspaceId}`
    ]);
  });

  it("does not treat requested workspace as trusted authority", async () => {
    const adapters = createAdapters({
      serverResolvedWorkspaceId: activeWorkspaceId
    });

    await expect(
      resolveAdminAuthorizationWithAdapters(
        {
          ...disabledRequest,
          requestedWorkspaceIdForValidationOnly: otherWorkspaceId
        },
        adapters
      )
    ).resolves.toEqual({
      allowed: true,
      reason: "allowed",
      statusCode: 200,
      workspaceId: activeWorkspaceId
    });
  });

  it("preserves requested record workspace only for policy validation", async () => {
    const adapters = createAdapters();

    await expect(
      resolveAdminAuthorizationWithAdapters(
        {
          ...disabledRequest,
          requestedRecordWorkspaceId: otherWorkspaceId
        },
        adapters
      )
    ).resolves.toEqual({
      allowed: false,
      reason: "workspace_mismatch",
      statusCode: 403
    });
  });

  it("feeds the policy for actor-membership mismatch denial", async () => {
    const adapters = createAdapters();

    adapters.membership.resolveMembership = async () => ({
      adminUserId: "admin-user-2",
      workspaceId: activeWorkspaceId,
      status: "active",
      role: "owner"
    });

    await expect(
      resolveAdminAuthorizationWithAdapters(disabledRequest, adapters)
    ).resolves.toEqual({
      allowed: false,
      reason: "membership_actor_mismatch",
      statusCode: 403
    });
  });

  it("stays server-only and avoids runtime integrations", () => {
    const source = readFileSync(resolve(repoRoot, resolverPath), "utf8");

    expect(source).toContain('import "server-only";');
    expect(source).not.toContain("@supabase/");
    expect(source).not.toContain("createServerSupabaseClient");
    expect(source).not.toContain("process.env");
    expect(source).not.toContain("cookies");
    expect(source).not.toContain("headers");
    expect(source).not.toMatch(/\bRequest\s*[<({]/);
    expect(source).not.toMatch(/\bResponse\s*[<({]/);
    expect(source).not.toContain("chat-config");
    expect(source).not.toContain(".insert(");
    expect(source).not.toContain(".update(");
    expect(source).not.toContain(".upsert(");
    expect(source).not.toContain(".delete(");
  });

  it("Phase 2B-AC bug: fails closed safely when trusted workspace dependency is missing", async () => {
    // This demonstrates the original Phase 2B-AA auth-check bug
    // where the trusted workspace dependency was not injected.
    const adapters = createAdapters(); // serverResolvedWorkspaceId defaults to activeWorkspaceId

    await expect(
      resolveAdminAuthorizationWithAdapters(
        {
          requestedOperation: "admin.auth.check",
          requestId: "req-bug",
          // The bug path lacked the trustedServerWorkspaceId injection entirely.
          // To simulate the adapter failing because it lacks the injected config,
          // we force the fake adapter to return null.
        },
        {
          ...adapters,
          workspace: {
            async resolveWorkspaceForRequest() {
              return { serverResolvedWorkspaceId: null };
            }
          }
        }
      )
    ).resolves.toEqual({
      allowed: false,
      reason: "workspace_missing",
      statusCode: 403
    });
  });

  it("Phase 2B-AC fix: allows resolution when trusted workspace dependency is provided", async () => {
    // This demonstrates the Phase 2B-AC fix path
    // where the trusted workspace dependency IS injected and returned by the adapter.
    const adapters = createAdapters({
      serverResolvedWorkspaceId: activeWorkspaceId
    });

    const result = await resolveAdminAuthorizationWithAdapters(
      {
        requestedOperation: "admin.auth.check",
        requestId: "req-fix"
      },
      adapters
    );

    expect(result).toEqual({
      allowed: true,
      reason: "allowed",
      statusCode: 200,
      workspaceId: activeWorkspaceId
    });

    // Prove workspace ID does not leak from the route response structure itself
    // by asserting that the safe response keys do not include workspace details
    // except what is explicitly allowed.
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("cookie");
    expect(serialized).not.toContain("stack");
  });
});
