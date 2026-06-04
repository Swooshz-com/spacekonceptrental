import "server-only";

import type {
  BatchTranscriptPersistenceCommand,
  MessagePersistenceCommand,
  TranscriptPersistenceAdapter,
  TranscriptPersistenceAdapterResult,
  TranscriptPersistenceRpcAdapterDependencies,
  TranscriptPersistenceRpcConversationPayload,
  TranscriptPersistenceRpcMessagePayload,
  TranscriptPersistenceRpcPayload
} from "./types";

const unavailableResult: TranscriptPersistenceAdapterResult = {
  ok: false,
  reason: "adapter_unavailable"
};

const failedResult: TranscriptPersistenceAdapterResult = {
  ok: false,
  reason: "adapter_failed"
};

function toRpcConversationPayload(
  command: BatchTranscriptPersistenceCommand
): TranscriptPersistenceRpcConversationPayload {
  return {
    id: command.conversation.id,
    workspace_id: command.conversation.workspaceId,
    public_reference: command.conversation.publicReference,
    client_session_hash: command.conversation.clientSessionHash ?? null,
    quote_request_id: command.conversation.quoteRequestId ?? null,
    status: command.conversation.status,
    retention_expires_at: command.conversation.retentionExpiresAt ?? null,
    metadata: command.conversation.metadata
  };
}

function toRpcMessagePayload(
  message: MessagePersistenceCommand
): TranscriptPersistenceRpcMessagePayload {
  return {
    id: message.id,
    workspace_id: message.workspaceId,
    conversation_id: message.conversationId,
    role: message.role,
    message_type: message.messageType,
    content: message.content,
    provider: message.provider ?? null,
    client_message_id: message.clientMessageId ?? null,
    request_id: message.requestId ?? null,
    sequence_number: message.sequenceNumber ?? null,
    retention_expires_at: message.retentionExpiresAt ?? null,
    metadata: message.metadata
  };
}

function toRpcPayload(
  command: BatchTranscriptPersistenceCommand
): TranscriptPersistenceRpcPayload {
  return {
    p_workspace_id: command.trustedWorkspaceId,
    p_conversation: toRpcConversationPayload(command),
    p_messages: command.messages.map(toRpcMessagePayload)
  };
}

export function createRpcTranscriptPersistenceAdapter(
  dependencies: TranscriptPersistenceRpcAdapterDependencies = {}
): TranscriptPersistenceAdapter {
  return {
    async persistTranscript(command) {
      if (!dependencies.executor) {
        return unavailableResult;
      }

      try {
        const result = await dependencies.executor.persistTranscriptBatch(
          toRpcPayload(command)
        );

        if (!result.ok) {
          return result.reason === "rpc_unavailable"
            ? unavailableResult
            : failedResult;
        }

        return {
          ok: true,
          conversationId: result.conversationId,
          messageIds: result.messageIds
        };
      } catch {
        return failedResult;
      }
    }
  };
}
