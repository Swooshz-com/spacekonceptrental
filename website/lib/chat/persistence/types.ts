import "server-only";

export type TranscriptPersistenceMessageRole =
  | "user"
  | "assistant"
  | "system";

export type TranscriptPersistenceMessageType = "chat" | "system_notice";

export type TranscriptConversationStatus = "open" | "closed" | "archived";

export type TranscriptMetadataInput = Record<string, unknown>;

export type ConversationPersistenceCommandInput = {
  id?: string | null;
  publicReference?: string | null;
  clientSessionHash?: string | null;
  quoteRequestId?: string | null;
  status?: TranscriptConversationStatus | string | null;
  retentionExpiresAt?: Date | string | null;
  metadata?: TranscriptMetadataInput | null;
};

export type MessagePersistenceCommandInput = {
  id?: string | null;
  role?: TranscriptPersistenceMessageRole | string | null;
  messageType?: TranscriptPersistenceMessageType | string | null;
  content?: string | null;
  provider?: string | null;
  clientMessageId?: string | null;
  requestId?: string | null;
  sequenceNumber?: number | null;
  retentionExpiresAt?: Date | string | null;
  metadata?: TranscriptMetadataInput | null;
};

export type TranscriptPersistenceCommandInput = {
  trustedWorkspaceId?: string | null;
  conversation: ConversationPersistenceCommandInput;
  messages: MessagePersistenceCommandInput[];
};

export type ConversationPersistenceCommand = {
  id: string;
  workspaceId: string;
  publicReference: string;
  status: TranscriptConversationStatus;
  clientSessionHash?: string;
  clientSessionHashPurpose?: "anonymous_correlation_only";
  quoteRequestId?: string;
  retentionExpiresAt?: string;
  metadata: TranscriptMetadataInput;
};

export type MessagePersistenceCommand = {
  id: string;
  workspaceId: string;
  conversationId: string;
  role: TranscriptPersistenceMessageRole;
  messageType: TranscriptPersistenceMessageType;
  content: string;
  provider?: string;
  clientMessageId?: string;
  clientMessageIdPurpose?: "idempotency_only";
  requestId?: string;
  sequenceNumber?: number;
  retentionExpiresAt?: string;
  metadata: TranscriptMetadataInput;
};

export type BatchTranscriptPersistenceCommand = {
  trustedWorkspaceId: string;
  conversation: ConversationPersistenceCommand;
  messages: MessagePersistenceCommand[];
};

export type TranscriptPersistenceRpcConversationPayload = {
  id: string;
  workspace_id: string;
  public_reference: string;
  client_session_hash: string | null;
  quote_request_id: string | null;
  status: TranscriptConversationStatus;
  retention_expires_at: string | null;
  metadata: TranscriptMetadataInput;
};

export type TranscriptPersistenceRpcMessagePayload = {
  id: string;
  workspace_id: string;
  conversation_id: string;
  role: TranscriptPersistenceMessageRole;
  message_type: TranscriptPersistenceMessageType;
  content: string;
  provider: string | null;
  client_message_id: string | null;
  request_id: string | null;
  sequence_number: number | null;
  retention_expires_at: string | null;
  metadata: TranscriptMetadataInput;
};

export type TranscriptPersistenceRpcPayload = {
  p_workspace_id: string;
  p_conversation: TranscriptPersistenceRpcConversationPayload;
  p_messages: TranscriptPersistenceRpcMessagePayload[];
};

export type TranscriptPersistenceRpcExecutorResult =
  | {
      ok: true;
      conversationId: string;
      messageIds: string[];
    }
  | {
      ok: false;
      reason: "rpc_rejected" | "rpc_unavailable" | "rpc_failed";
    };

export type TranscriptPersistenceRpcExecutor = {
  persistTranscriptBatch(
    payload: TranscriptPersistenceRpcPayload
  ):
    | TranscriptPersistenceRpcExecutorResult
    | Promise<TranscriptPersistenceRpcExecutorResult>;
};

export type TranscriptPersistenceRpcAdapterDependencies = {
  executor?: TranscriptPersistenceRpcExecutor;
};

export type TranscriptPersistenceRejectReason =
  | "trusted_workspace_missing"
  | "conversation_id_invalid"
  | "conversation_public_reference_invalid"
  | "conversation_status_invalid"
  | "quote_request_id_invalid"
  | "anonymous_session_hash_invalid"
  | "message_id_invalid"
  | "messages_missing"
  | "message_role_type_invalid"
  | "message_content_missing"
  | "message_content_too_large"
  | "provider_invalid"
  | "client_message_id_invalid"
  | "request_id_invalid"
  | "sequence_number_invalid"
  | "retention_expires_at_invalid"
  | "metadata_invalid"
  | "metadata_too_large"
  | "metadata_unsafe_key";

export type TranscriptPersistenceCommandResult =
  | {
      ok: true;
      command: BatchTranscriptPersistenceCommand;
    }
  | {
      ok: false;
      status: "rejected";
      reason: TranscriptPersistenceRejectReason;
    };

export type TranscriptPersistenceAdapterResult =
  | {
      ok: true;
      conversationId: string;
      messageIds: string[];
    }
  | {
      ok: false;
      reason: "adapter_rejected" | "adapter_unavailable" | "adapter_failed";
    };

export type TranscriptPersistenceAdapter = {
  persistTranscript(
    command: BatchTranscriptPersistenceCommand
  ): TranscriptPersistenceAdapterResult | Promise<TranscriptPersistenceAdapterResult>;
};

export type TranscriptPersistenceDependencies = {
  adapter?: TranscriptPersistenceAdapter;
};

export type TranscriptPersistencePersistedResult = {
  ok: true;
  status: "persisted";
  conversationId: string;
  messageIds: string[];
};

export type TranscriptPersistenceUnavailableResult = {
  ok: false;
  status: "unavailable";
  reason: "transcript_persistence_unavailable";
};

export type TranscriptPersistenceRejectedResult = Extract<
  TranscriptPersistenceCommandResult,
  { ok: false }
>;

export type TranscriptPersistenceResult =
  | TranscriptPersistencePersistedResult
  | TranscriptPersistenceUnavailableResult
  | TranscriptPersistenceRejectedResult;
