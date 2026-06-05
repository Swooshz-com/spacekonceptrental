import "server-only";

export type SearchIndexSourceType =
  | "listing"
  | "category"
  | "policy"
  | "faq"
  | "document"
  | "listing_image_alt_text";

export type SearchIndexVisibility = "public_chat" | "admin_only" | "blocked";

export type SearchIndexOperation = "upsert" | "delete" | "hide" | "rebuild";

export type SearchIndexJobStatus =
  | "queued"
  | "processing"
  | "succeeded"
  | "failed"
  | "skipped"
  | "cancelled";

export type SearchIndexMetadataInput = Record<string, unknown>;

export type SearchIndexJobCommandInput = {
  workspaceId?: string | null;
  sourceType?: SearchIndexSourceType | string | null;
  sourceId?: string | null;
  sourceVersion?: string | null;
  visibility?: SearchIndexVisibility | string | null;
  operation?: SearchIndexOperation | string | null;
  status?: SearchIndexJobStatus | string | null;
  contentHash?: string | null;
  metadata?: SearchIndexMetadataInput | null;
};

export type SearchIndexDocumentCommandInput = {
  workspaceId?: string | null;
  sourceType?: SearchIndexSourceType | string | null;
  sourceId?: string | null;
  sourceVersion?: string | null;
  visibility?: SearchIndexVisibility | string | null;
  status?: SearchIndexJobStatus | string | null;
  title?: string | null;
  contentHash?: string | null;
  chunkCount?: number | null;
  lastIndexJobId?: string | null;
  indexedAt?: string | null;
  metadata?: SearchIndexMetadataInput | null;
};

export type SearchIndexJobCommand = {
  workspaceId: string;
  sourceType: SearchIndexSourceType;
  sourceId: string;
  visibility: SearchIndexVisibility;
  operation: SearchIndexOperation;
  status: SearchIndexJobStatus;
  metadata: SearchIndexMetadataInput;
  sourceVersion?: string;
  contentHash?: string;
};

export type SearchIndexDocumentCommand = {
  workspaceId: string;
  sourceType: SearchIndexSourceType;
  sourceId: string;
  visibility: SearchIndexVisibility;
  status: SearchIndexJobStatus;
  contentHash: string;
  chunkCount: number;
  metadata: SearchIndexMetadataInput;
  sourceVersion?: string;
  title?: string;
  lastIndexJobId?: string;
  indexedAt?: string;
};

export type SearchIndexRejectReason =
  | "input_invalid"
  | "workspace_id_invalid"
  | "source_id_invalid"
  | "source_type_invalid"
  | "source_version_invalid"
  | "visibility_invalid"
  | "operation_invalid"
  | "status_invalid"
  | "title_invalid"
  | "content_hash_invalid"
  | "chunk_count_invalid"
  | "last_index_job_id_invalid"
  | "indexed_at_invalid"
  | "metadata_invalid"
  | "metadata_too_large"
  | "metadata_unsafe_key";

export type SearchIndexCommandRejectedResult = {
  ok: false;
  status: "rejected";
  reason: SearchIndexRejectReason;
};

export type SearchIndexJobCommandResult =
  | {
      ok: true;
      command: SearchIndexJobCommand;
    }
  | SearchIndexCommandRejectedResult;

export type SearchIndexDocumentCommandResult =
  | {
      ok: true;
      command: SearchIndexDocumentCommand;
    }
  | SearchIndexCommandRejectedResult;

export type SearchIndexAdapterFailureReason =
  | "adapter_rejected"
  | "adapter_unavailable"
  | "adapter_failed";

export type SearchIndexJobAdapterResult =
  | {
      ok: true;
      searchIndexJobId: string;
    }
  | {
      ok: false;
      reason: SearchIndexAdapterFailureReason;
    };

export type SearchIndexDocumentAdapterResult =
  | {
      ok: true;
      searchIndexDocumentId: string;
    }
  | {
      ok: false;
      reason: SearchIndexAdapterFailureReason;
    };

export type SearchIndexAdapter = {
  recordJob(
    command: SearchIndexJobCommand
  ): SearchIndexJobAdapterResult | Promise<SearchIndexJobAdapterResult>;
  recordDocument(
    command: SearchIndexDocumentCommand
  ):
    | SearchIndexDocumentAdapterResult
    | Promise<SearchIndexDocumentAdapterResult>;
};

export type SearchIndexDependencies = {
  adapter?: SearchIndexAdapter;
};

export type SearchIndexUnavailableResult = {
  ok: false;
  status: "unavailable";
  reason: "search_index_unavailable";
};

export type SearchIndexJobRecordedResult = {
  ok: true;
  status: "recorded";
  searchIndexJobId: string;
};

export type SearchIndexDocumentRecordedResult = {
  ok: true;
  status: "recorded";
  searchIndexDocumentId: string;
};

export type SearchIndexJobRecordResult =
  | SearchIndexJobRecordedResult
  | SearchIndexUnavailableResult
  | SearchIndexCommandRejectedResult;

export type SearchIndexDocumentRecordResult =
  | SearchIndexDocumentRecordedResult
  | SearchIndexUnavailableResult
  | SearchIndexCommandRejectedResult;
