import { describe, expect, it } from "vitest";

import {
  authorizeAdminOperation,
  isSupportedAdminOperation,
  type AdminRole
} from "./admin-authorization-policy";

const workspaceId = "11111111-1111-4111-8111-111111111111";

function decisionFor(role: AdminRole) {
  return authorizeAdminOperation({
    authenticated: true,
    adminUser: {
      id: "22222222-2222-4222-8222-222222222222",
      status: "active"
    },
    serverResolvedWorkspaceId: workspaceId,
    membership: {
      adminUserId: "22222222-2222-4222-8222-222222222222",
      workspaceId,
      status: "active",
      role
    },
    operation: "quote.write"
  });
}

describe("admin authorization policy", () => {
  it.each<AdminRole>(["owner", "admin"])(
    "allows %s to update quote request status",
    (role) => {
      expect(isSupportedAdminOperation("quote.write")).toBe(true);
      expect(decisionFor(role)).toStrictEqual({
        allowed: true,
        reason: "allowed",
        statusCode: 200,
        workspaceId
      });
    }
  );

  it("denies viewers from quote status writes", () => {
    expect(decisionFor("viewer")).toStrictEqual({
      allowed: false,
      reason: "role_not_allowed",
      statusCode: 403
    });
  });

  it("keeps unsupported operation behavior intact", () => {
    expect(isSupportedAdminOperation("quote.delete")).toBe(false);
    expect(
      authorizeAdminOperation({
        authenticated: true,
        adminUser: {
          id: "22222222-2222-4222-8222-222222222222",
          status: "active"
        },
        serverResolvedWorkspaceId: workspaceId,
        membership: {
          adminUserId: "22222222-2222-4222-8222-222222222222",
          workspaceId,
          status: "active",
          role: "owner"
        },
        operation: "quote.delete"
      })
    ).toStrictEqual({
      allowed: false,
      reason: "operation_not_supported",
      statusCode: 400
    });
  });
});
