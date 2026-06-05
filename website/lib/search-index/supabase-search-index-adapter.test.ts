import { describe, expect, it, vi } from "vitest";
import { SupabaseSearchIndexAdapter } from "./supabase-search-index-adapter";
import type {
  SearchIndexJobCommand,
  SearchIndexJobStatus
} from "./types";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const listingId = "22222222-2222-4222-8222-222222222222";
const jobId = "33333333-3333-4333-8333-333333333333";
const contentHash =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function jobCommand(
  overrides: Partial<SearchIndexJobCommand> = {}
): SearchIndexJobCommand {
  return {
    workspaceId,
    sourceType: "listing",
    sourceId: listingId,
    sourceVersion: "listing-v1",
    visibility: "public_chat",
    operation: "upsert",
    status: "queued",
    contentHash,
    metadata: {
      source: "adapter-test"
    },
    ...overrides
  };
}

function createSupabase(result: { data: unknown; error: unknown }) {
  const calls: Array<{ fn: string; args: Record<string, unknown> }> = [];
  const client = {
    rpc(fn: string, args: Record<string, unknown>) {
      calls.push({ fn, args });

      return {
        single: () => Promise.resolve(result)
      };
    }
  };

  return {
    calls,
    supabase: {
      configured: true as const,
      client,
      missingEnv: [] as []
    }
  };
}

describe("SupabaseSearchIndexAdapter", () => {
  it("is server-only and enqueues jobs through the approved RPC only", async () => {
    const { calls, supabase } = createSupabase({
      data: {
        ok: true,
        status: "queued" satisfies SearchIndexJobStatus,
        searchIndexJobId: jobId,
        reused: false
      },
      error: null
    });
    const adapter = new SupabaseSearchIndexAdapter({ supabase });

    await expect(adapter.recordJob(jobCommand())).resolves.toEqual({
      ok: true,
      searchIndexJobId: jobId
    });

    expect(calls).toEqual([
      {
        fn: "enqueue_search_index_job",
        args: {
          p_workspace_id: workspaceId,
          p_source_type: "listing",
          p_source_id: listingId,
          p_source_version: "listing-v1",
          p_visibility: "public_chat",
          p_operation: "upsert",
          p_status: "queued",
          p_content_hash: contentHash,
          p_metadata: {
            source: "adapter-test"
          }
        }
      }
    ]);
    expect(JSON.stringify(calls)).not.toContain("search_index_jobs");
    expect(JSON.stringify(calls)).not.toContain("search_index_documents");
  });

  it("fails safely without leaking RPC exception details", async () => {
    const { calls, supabase } = createSupabase({
      data: null,
      error: new Error("secret token provider payload")
    });
    const adapter = new SupabaseSearchIndexAdapter({ supabase });

    const result = await adapter.recordJob(jobCommand());

    expect(result).toEqual({
      ok: false,
      reason: "adapter_failed"
    });
    expect(JSON.stringify(result)).not.toContain("secret");
    expect(JSON.stringify(result)).not.toContain("provider");
    expect(calls).toHaveLength(1);
  });

  it("does not provide direct search document writes", async () => {
    const { calls, supabase } = createSupabase({
      data: null,
      error: null
    });
    const adapter = new SupabaseSearchIndexAdapter({ supabase });

    await expect(
      adapter.recordDocument({
        workspaceId,
        sourceType: "listing",
        sourceId: listingId,
        visibility: "public_chat",
        status: "queued",
        contentHash,
        chunkCount: 1,
        metadata: {}
      })
    ).resolves.toEqual({
      ok: false,
      reason: "adapter_unavailable"
    });
    expect(calls).toEqual([]);
  });

  it("fails closed when no authenticated Supabase client is configured", async () => {
    const adapter = new SupabaseSearchIndexAdapter({
      supabase: {
        configured: false,
        client: null,
        reason: "authenticated_search_index_client_required"
      }
    });

    await expect(adapter.recordJob(jobCommand())).resolves.toEqual({
      ok: false,
      reason: "adapter_unavailable"
    });
  });
});
