import "server-only";

import { createSessionBoundSupabaseAdminReadClient } from "../admin/authorization/supabase-admin-auth-identity-adapter";
import type {
  SearchIndexAdapter,
  SearchIndexDocumentAdapterResult,
  SearchIndexDocumentCommand,
  SearchIndexJobAdapterResult,
  SearchIndexJobCommand
} from "./types";

type SearchIndexRpcResult = {
  data: unknown;
  error: unknown;
};

type SearchIndexRpcClient = {
  rpc(
    fn: "enqueue_search_index_job",
    args: {
      p_workspace_id: string;
      p_source_type: string;
      p_source_id: string;
      p_visibility: string;
      p_operation: string;
      p_source_version: string | null;
      p_content_hash: string | null;
      p_metadata: Record<string, unknown>;
      p_status: string;
    }
  ): {
    single(): Promise<SearchIndexRpcResult>;
  };
};

export type SearchIndexSupabaseClientResult =
  | {
      configured: true;
      client: SearchIndexRpcClient;
      missingEnv: [];
    }
  | {
      configured: false;
      client: null;
      reason: "authenticated_search_index_client_required";
    };

export type SupabaseSearchIndexAdapterOptions = {
  supabase?: SearchIndexSupabaseClientResult;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function searchIndexJobId(result: SearchIndexRpcResult) {
  if (result.error || !isRecord(result.data)) {
    return null;
  }

  const id = result.data.searchIndexJobId;

  return typeof id === "string" && id.trim() ? id : null;
}

async function createDefaultSupabase(): Promise<SearchIndexSupabaseClientResult> {
  const supabase = await createSessionBoundSupabaseAdminReadClient();

  if (!supabase.configured) {
    return {
      configured: false,
      client: null,
      reason: "authenticated_search_index_client_required"
    };
  }

  return {
    configured: true,
    client: supabase.client as unknown as SearchIndexRpcClient,
    missingEnv: []
  };
}

export class SupabaseSearchIndexAdapter implements SearchIndexAdapter {
  constructor(private readonly options: SupabaseSearchIndexAdapterOptions = {}) {}

  private async getSupabase() {
    return this.options.supabase ?? createDefaultSupabase();
  }

  async recordJob(
    command: SearchIndexJobCommand
  ): Promise<SearchIndexJobAdapterResult> {
    const supabase = await this.getSupabase();

    if (!supabase.configured) {
      return {
        ok: false,
        reason: "adapter_unavailable"
      };
    }

    try {
      const result = await supabase.client
        .rpc("enqueue_search_index_job", {
          p_workspace_id: command.workspaceId,
          p_source_type: command.sourceType,
          p_source_id: command.sourceId,
          p_source_version: command.sourceVersion ?? null,
          p_visibility: command.visibility,
          p_operation: command.operation,
          p_status: command.status,
          p_content_hash: command.contentHash ?? null,
          p_metadata: command.metadata
        })
        .single();

      const id = searchIndexJobId(result);

      return id
        ? {
            ok: true,
            searchIndexJobId: id
          }
        : {
            ok: false,
            reason: "adapter_failed"
          };
    } catch {
      return {
        ok: false,
        reason: "adapter_failed"
      };
    }
  }

  async recordDocument(
    _command: SearchIndexDocumentCommand
  ): Promise<SearchIndexDocumentAdapterResult> {
    return {
      ok: false,
      reason: "adapter_unavailable"
    };
  }
}
