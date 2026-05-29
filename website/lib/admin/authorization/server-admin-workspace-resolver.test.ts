import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import type { AdminWorkspaceResolver } from "./admin-authorization-adapters";
import {
  createServerAdminWorkspaceResolver,
  resolveServerAdminWorkspaceForRequest
} from "./server-admin-workspace-resolver";

const sourcePath = resolve(
  process.cwd(),
  "lib/admin/authorization/server-admin-workspace-resolver.ts"
);

function readSource() {
  return readFileSync(sourcePath, "utf8");
}

describe("server admin workspace resolver", () => {
  it("resolves a trusted server-side workspace ID into the existing safe shape", async () => {
    const resolver: AdminWorkspaceResolver = createServerAdminWorkspaceResolver({
      trustedServerWorkspaceId: " workspace-1 "
    });

    await expect(
      resolver.resolveWorkspaceForRequest({
        requestedOperation: "product.write"
      })
    ).resolves.toEqual({
      serverResolvedWorkspaceId: "workspace-1"
    });
  });

  it("fails closed when no trusted server-side workspace ID is injected", async () => {
    await expect(resolveServerAdminWorkspaceForRequest()).resolves.toEqual({
      serverResolvedWorkspaceId: null
    });
  });

  it("fails closed for empty or whitespace trusted server-side workspace IDs", async () => {
    await expect(
      resolveServerAdminWorkspaceForRequest(
        {},
        {
          trustedServerWorkspaceId: ""
        }
      )
    ).resolves.toEqual({
      serverResolvedWorkspaceId: null
    });
    await expect(
      resolveServerAdminWorkspaceForRequest(
        {},
        {
          trustedServerWorkspaceId: "   "
        }
      )
    ).resolves.toEqual({
      serverResolvedWorkspaceId: null
    });
  });

  it("never treats a validation-only workspace ID as authority by itself", async () => {
    await expect(
      resolveServerAdminWorkspaceForRequest({
        requestedWorkspaceIdForValidationOnly: "workspace-1"
      })
    ).resolves.toEqual({
      serverResolvedWorkspaceId: null
    });
  });

  it("fails closed when validation-only workspace ID mismatches the trusted server workspace", async () => {
    await expect(
      resolveServerAdminWorkspaceForRequest(
        {
          requestedWorkspaceIdForValidationOnly: "workspace-2"
        },
        {
          trustedServerWorkspaceId: "workspace-1"
        }
      )
    ).resolves.toEqual({
      serverResolvedWorkspaceId: null
    });
  });

  it("allows matching validation-only workspace ID only after trusted server workspace is present", async () => {
    await expect(
      resolveServerAdminWorkspaceForRequest(
        {
          requestedWorkspaceIdForValidationOnly: " workspace-1 "
        },
        {
          trustedServerWorkspaceId: " workspace-1 "
        }
      )
    ).resolves.toEqual({
      serverResolvedWorkspaceId: "workspace-1"
    });
  });

  it("fails closed for empty validation-only workspace IDs when they are supplied", async () => {
    await expect(
      resolveServerAdminWorkspaceForRequest(
        {
          requestedWorkspaceIdForValidationOnly: "  "
        },
        {
          trustedServerWorkspaceId: "workspace-1"
        }
      )
    ).resolves.toEqual({
      serverResolvedWorkspaceId: null
    });
  });

  it("keeps provider failures in the same safe response shape", async () => {
    const result = await resolveServerAdminWorkspaceForRequest(
      {
        requestedWorkspaceIdForValidationOnly: "workspace-1"
      },
      {
        getTrustedServerWorkspaceId() {
          throw new Error(
            "provider stack SQL cookie header token env SUPABASE_SERVICE_ROLE_KEY"
          );
        }
      }
    );
    const serialized = JSON.stringify(result).toLowerCase();

    expect(result).toEqual({
      serverResolvedWorkspaceId: null
    });
    expect(Object.keys(result)).toEqual(["serverResolvedWorkspaceId"]);
    expect(serialized).not.toContain("token");
    expect(serialized).not.toContain("cookie");
    expect(serialized).not.toContain("header");
    expect(serialized).not.toContain("env");
    expect(serialized).not.toContain("sql");
    expect(serialized).not.toContain("provider");
    expect(serialized).not.toContain("stack");
  });

  it("keeps workspace resolution inside a server-only injected dependency boundary", () => {
    const source = readSource();

    expect(source).toContain('import "server-only";');
    expect(source).not.toContain("@supabase/");
    expect(source).not.toContain("createServerSupabaseClient");
    expect(source).not.toContain("next/headers");
    expect(source).not.toContain("cookies()");
    expect(source).not.toContain("headers()");
    expect(source).not.toContain("auth.getUser()");
    expect(source).not.toContain("process.env");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("N8N_CHAT_WEBHOOK_URL");
    expect(source).not.toContain("PINECONE");
    expect(source).not.toContain("chat-config");
    expect(source).not.toContain("catalogue_public_workspace_config");
    expect(source).not.toContain("CATALOGUE_WORKSPACE_ID");
    expect(source).not.toContain(".from(");
    expect(source).not.toContain(".insert(");
    expect(source).not.toContain(".update(");
    expect(source).not.toContain(".upsert(");
    expect(source).not.toContain(".delete(");
  });
});
