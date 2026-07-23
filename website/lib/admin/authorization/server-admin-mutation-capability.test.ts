import { describe, expect, it } from "vitest";

import { resolveServerAdminRuntimeRouteGateAdapter } from "./server-admin-runtime-route-gate-adapter";

const requestMetadata = {
  expectedOrigin: "https://admin.space.test",
  expectedHost: "admin.space.test"
};

describe("server admin mutation capability", () => {
  it.each([
    undefined,
    "",
    "false",
    "TRUE",
    "enabled",
    "1",
    " true ",
    "true\n"
  ])(
    "fails closed before the protected mutation invocation when the value is %s",
    async (value) => {
      let invocationReached = false;
      const result = await resolveServerAdminRuntimeRouteGateAdapter(
        {
          requestedOperation: "product.write",
          requestMethod: "POST",
          requiresMutationCapability: true
        },
        {
          requestMetadata,
          mutationCapability: {
            env: {
              ADMIN_MUTATIONS_ENABLED: value
            }
          },
          async resolveRuntimeGateInvocation() {
            invocationReached = true;

            return {
              allowed: true,
              reason: "allowed",
              statusCode: 200
            };
          }
        }
      );

      expect(invocationReached).toBe(false);
      expect(result).toEqual({
        allowed: false,
        reason: "admin_mutations_disabled",
        statusCode: 503
      });
    }
  );

  it("preserves existing authorization and CSRF controls after explicit enablement", async () => {
    let invocationReached = false;
    const result = await resolveServerAdminRuntimeRouteGateAdapter(
      {
        requestedOperation: "product.write",
        requestMethod: "POST",
        requiresMutationCapability: true
      },
      {
        requestMetadata,
        mutationCapability: {
          env: {
            ADMIN_MUTATIONS_ENABLED: "true"
          }
        },
        async resolveRuntimeGateInvocation() {
          invocationReached = true;

          return {
            allowed: false,
            reason: "csrf_proof_missing",
            statusCode: 403
          };
        }
      }
    );

    expect(invocationReached).toBe(true);
    expect(result).toEqual({
      allowed: false,
      reason: "csrf_proof_missing",
      statusCode: 403
    });
  });

  it("does not gate authentication or read-only admin operations", async () => {
    for (const requestedOperation of [
      "admin.auth.check",
      "admin.shell.access",
      "catalogue.read"
    ] as const) {
      let invocationReached = false;
      await resolveServerAdminRuntimeRouteGateAdapter(
        {
          requestedOperation,
          requestMethod: "GET"
        },
        {
          requestMetadata,
          mutationCapability: {
            env: {}
          },
          async resolveRuntimeGateInvocation() {
            invocationReached = true;

            return {
              allowed: true,
              reason: "allowed",
              statusCode: 200
            };
          }
        }
      );

      expect(invocationReached).toBe(true);
    }
  });
});
