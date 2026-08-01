import { describe, expect, it, vi } from "vitest";

import {
  executeAdminSetupRecipeWrite,
  readAdminSetupRecipe,
  type SetupRecipeRepositoryDependencies
} from "./setup-recipe-repository";

function createReadClient(
  itemResult: { data: unknown; error: unknown },
  headerResult: { data: unknown; error: unknown } = {
    data: { revision: 3 },
    error: null
  }
) {
  const headerBuilder = {
    select: vi.fn(() => headerBuilder),
    eq: vi.fn(() => headerBuilder),
    single: vi.fn(async () => headerResult)
  };
  const itemBuilder = {
    select: vi.fn(() => itemBuilder),
    eq: vi.fn(() => itemBuilder),
    order: vi.fn(async () => itemResult)
  };
  const client = {
    from: vi.fn((table: string) =>
      table === "setup_recipes" ? headerBuilder : itemBuilder
    )
  };
  return client;
}

function authenticatedDependencies(
  client: ReturnType<typeof createReadClient>
): SetupRecipeRepositoryDependencies {
  return {
    resolveAuthIdentity: vi.fn(async () => ({
      authenticated: true as const,
      authUserId: "auth-user-1",
      email: "admin@example.test",
      provider: "google" as const
    })),
    createReadClient: vi.fn(async () => ({
      configured: true as const,
      client: client as never,
      missingEnv: [] as []
    }))
  };
}

describe("setup recipe repository read authority", () => {
  it("returns a typed read failure when the item query fails after the header succeeds", async () => {
    const result = await readAdminSetupRecipe(
      "workspace-1",
      "setup-1",
      authenticatedDependencies(
        createReadClient({ data: null, error: new Error("private provider detail") })
      )
    );

    expect(result).toEqual({ ok: false, code: "read-failure" });
    expect(result).not.toEqual({ ok: true, revision: 3, items: [] });
  });

  it("does not treat a malformed item result as an authoritative empty recipe", async () => {
    await expect(
      readAdminSetupRecipe(
        "workspace-1",
        "setup-1",
        authenticatedDependencies(
          createReadClient({ data: "not-an-array", error: null })
        )
      )
    ).resolves.toEqual({ ok: false, code: "read-failure" });
  });

  it("denies a missing session before invoking the authenticated read client", async () => {
    const createReadClient = vi.fn();

    await expect(
      readAdminSetupRecipe("workspace-1", "setup-1", {
        resolveAuthIdentity: vi.fn(async () => ({
          authenticated: false as const,
          reason: "auth_session_missing" as const,
          statusCode: 401 as const
        })),
        createReadClient
      })
    ).resolves.toEqual({ ok: false, code: "unauthorized" });

    expect(createReadClient).not.toHaveBeenCalled();
  });

  it("allows an authenticated admin write through the session-bound server client", async () => {
    const rpc = vi.fn(async () => ({
      data: {
        operation: "replace",
        setup_product_id: "setup-1",
        revision: 4,
        item_count: 1
      },
      error: null
    }));
    const client = {
      rpc,
      from: vi.fn()
    };

    const result = await executeAdminSetupRecipeWrite(
      {
        operation: "replace",
        expectedWorkspaceId: "workspace-1",
        setupProductId: "setup-1",
        expectedRevision: 3,
        items: [
          {
            included_product_id: "child-1",
            position: 0,
            base_quantity: 1
          }
        ]
      },
      authenticatedDependencies(client as never)
    );

    expect(result).toMatchObject({ ok: true, revision: 4 });
    expect(rpc).toHaveBeenCalledWith(
      "execute_admin_setup_recipe_write",
      expect.objectContaining({
        p_expected_workspace_id: "workspace-1",
        p_setup_product_id: "setup-1"
      })
    );
  });

  it("denies an anonymous write and never attempts the RPC", async () => {
    const rpc = vi.fn();
    const createReadClient = vi.fn();

    const result = await executeAdminSetupRecipeWrite(
      {
        operation: "remove",
        expectedWorkspaceId: "workspace-1",
        setupProductId: "setup-1",
        expectedRevision: 3,
        items: []
      },
      {
        resolveAuthIdentity: vi.fn(async () => ({
          authenticated: false as const,
          reason: "auth_session_missing" as const,
          statusCode: 401 as const
        })),
        createReadClient
      }
    );

    expect(result).toEqual({ ok: false, code: "not-authenticated" });
    expect(createReadClient).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("keeps wrong-workspace reads fail-closed at the database boundary", async () => {
    const result = await readAdminSetupRecipe(
      "workspace-2",
      "setup-1",
      authenticatedDependencies(
        createReadClient(
          { data: [], error: null },
          { data: null, error: { message: "row not found" } }
        )
      )
    );

    expect(result).toEqual({ ok: false, code: "not-found" });
  });
});
