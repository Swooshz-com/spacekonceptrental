import { describe, expect, it, vi } from "vitest";

const createServerSupabaseClient = vi.hoisted(() => vi.fn());

vi.mock("../supabase/server", () => ({ createServerSupabaseClient }));

import { readAdminSetupRecipe } from "./setup-recipe-repository";

function createReadClient(itemResult: { data: unknown; error: unknown }) {
  const headerBuilder = {
    select: vi.fn(() => headerBuilder),
    eq: vi.fn(() => headerBuilder),
    single: vi.fn(async () => ({
      data: { revision: 3 },
      error: null
    }))
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

describe("setup recipe repository read authority", () => {
  it("returns a typed read failure when the item query fails after the header succeeds", async () => {
    createServerSupabaseClient.mockReturnValue({
      configured: true,
      client: createReadClient({ data: null, error: new Error("private provider detail") })
    });

    const result = await readAdminSetupRecipe("workspace-1", "setup-1");

    expect(result).toEqual({ ok: false, code: "read-failure" });
    expect(result).not.toEqual({ ok: true, revision: 3, items: [] });
  });

  it("does not treat a malformed item result as an authoritative empty recipe", async () => {
    createServerSupabaseClient.mockReturnValue({
      configured: true,
      client: createReadClient({ data: "not-an-array", error: null })
    });

    await expect(
      readAdminSetupRecipe("workspace-1", "setup-1")
    ).resolves.toEqual({ ok: false, code: "read-failure" });
  });
});
