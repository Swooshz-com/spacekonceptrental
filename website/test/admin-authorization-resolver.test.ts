import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { authorizeAdminOperation } from "../lib/admin/authorization/admin-authorization-policy";
import {
  buildAdminAuthorizationInput,
  resolveAdminAuthorizationForRequest,
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
    workspaceId: activeWorkspaceId,
    status: "active",
    role: "admin"
  },
  requestedOperation: "product.write"
};

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
});
