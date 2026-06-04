import "server-only";

import {
  disabledChatPersistence,
  DisabledChatPersistence
} from "./disabled-chat-persistence";
import {
  createTranscriptPersistenceCommand,
  persistTranscriptCommand
} from "./contract";
import { createRpcTranscriptPersistenceAdapter } from "./rpc-transcript-persistence-adapter";
import type {
  BatchTranscriptPersistenceCommand,
  ConversationPersistenceCommand,
  ConversationPersistenceCommandInput,
  MessagePersistenceCommand,
  MessagePersistenceCommandInput,
  TranscriptConversationStatus,
  TranscriptMetadataInput,
  TranscriptPersistenceAdapter,
  TranscriptPersistenceAdapterResult,
  TranscriptPersistenceCommandInput,
  TranscriptPersistenceCommandResult,
  TranscriptPersistenceDependencies,
  TranscriptPersistenceMessageRole,
  TranscriptPersistenceMessageType,
  TranscriptPersistencePersistedResult,
  TranscriptPersistenceRejectReason,
  TranscriptPersistenceRejectedResult,
  TranscriptPersistenceRpcAdapterDependencies,
  TranscriptPersistenceRpcConversationPayload,
  TranscriptPersistenceRpcExecutor,
  TranscriptPersistenceRpcExecutorResult,
  TranscriptPersistenceRpcMessagePayload,
  TranscriptPersistenceRpcPayload,
  TranscriptPersistenceResult,
  TranscriptPersistenceUnavailableResult
} from "./types";

export {
  createTranscriptPersistenceCommand,
  createRpcTranscriptPersistenceAdapter,
  disabledChatPersistence,
  DisabledChatPersistence,
  persistTranscriptCommand
};
export type {
  BatchTranscriptPersistenceCommand,
  ConversationPersistenceCommand,
  ConversationPersistenceCommandInput,
  MessagePersistenceCommand,
  MessagePersistenceCommandInput,
  TranscriptConversationStatus,
  TranscriptMetadataInput,
  TranscriptPersistenceAdapter,
  TranscriptPersistenceAdapterResult,
  TranscriptPersistenceCommandInput,
  TranscriptPersistenceCommandResult,
  TranscriptPersistenceDependencies,
  TranscriptPersistenceMessageRole,
  TranscriptPersistenceMessageType,
  TranscriptPersistencePersistedResult,
  TranscriptPersistenceRejectReason,
  TranscriptPersistenceRejectedResult,
  TranscriptPersistenceRpcAdapterDependencies,
  TranscriptPersistenceRpcConversationPayload,
  TranscriptPersistenceRpcExecutor,
  TranscriptPersistenceRpcExecutorResult,
  TranscriptPersistenceRpcMessagePayload,
  TranscriptPersistenceRpcPayload,
  TranscriptPersistenceResult,
  TranscriptPersistenceUnavailableResult
};

export function getChatPersistence(): TranscriptPersistenceAdapter {
  return disabledChatPersistence;
}
