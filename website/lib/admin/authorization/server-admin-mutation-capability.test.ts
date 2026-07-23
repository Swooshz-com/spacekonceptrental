import { describe, expect, it, vi } from "vitest";

import { resolveServerAdminMutationCapability } from "./server-admin-mutation-capability";
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
    " false ",
    " true ",
    "TRUE",
    "enabled",
    "1",
    "true\n"
  ])(
    "prevents every provider and repository boundary when the raw value is %s",
    (value) => {
      const providerBoundaries = {
        createIdentityClient: vi.fn(),
        resolveSession: vi.fn(),
        resolveWorkspace: vi.fn(),
        resolveProfile: vi.fn(),
        resolveMembership: vi.fn()
      };
      const repositoryMutation = vi.fn();
      const auditPersistence = vi.fn();
      const capability = resolveServerAdminMutationCapability({
        ADMIN_MUTATIONS_ENABLED: value
      });

      if (capability.enabled) {
        providerBoundaries.createIdentityClient();
        providerBoundaries.resolveSession();
        providerBoundaries.resolveWorkspace();
        providerBoundaries.resolveProfile();
        providerBoundaries.resolveMembership();
        repositoryMutation();
        auditPersistence();
      }

      for (const boundary of Object.values(providerBoundaries)) {
        expect(boundary).not.toHaveBeenCalled();
      }
      expect(repositoryMutation).not.toHaveBeenCalled();
      expect(auditPersistence).not.toHaveBeenCalled();
      expect(capability).toEqual({
        enabled: false,
        reason: "admin_mutations_disabled",
        statusCode: 503
      });
    }
  );

  it("allows exact true to continue into every cumulative provider boundary", () => {
    const providerBoundaries = [
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn()
    ];
    const capability = resolveServerAdminMutationCapability({
      ADMIN_MUTATIONS_ENABLED: "true"
    });

    if (capability.enabled) {
      for (const boundary of providerBoundaries) {
        boundary();
      }
    }

    expect(capability).toEqual({ enabled: true });
    for (const boundary of providerBoundaries) {
      expect(boundary).toHaveBeenCalledOnce();
    }
  });

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
