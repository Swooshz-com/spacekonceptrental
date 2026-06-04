import "server-only";

import {
  disabledChatPersistence,
  DisabledChatPersistence
} from "./disabled-chat-persistence";
import {
  createTranscriptPersistenceCommand,
  persistTranscriptCommand
} from "./contract";
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
  TranscriptPersistenceResult,
  TranscriptPersistenceUnavailableResult
} from "./types";

export {
  createTranscriptPersistenceCommand,
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
  TranscriptPersistenceResult,
  TranscriptPersistenceUnavailableResult
};

export function getChatPersistence(): TranscriptPersistenceAdapter {
  return disabledChatPersistence;
}
