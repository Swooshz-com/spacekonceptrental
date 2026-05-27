import "server-only";

import {
  disabledChatPersistence,
  DisabledChatPersistence
} from "./disabled-chat-persistence";
import type {
  ChatPersistence,
  ChatPersistenceResult,
  RecordAssistantMessageInput,
  RecordUserMessageInput,
  TrustedChatWorkspace
} from "./types";

export { disabledChatPersistence, DisabledChatPersistence };
export type {
  ChatPersistence,
  ChatPersistenceResult,
  RecordAssistantMessageInput,
  RecordUserMessageInput,
  TrustedChatWorkspace
};

export function getChatPersistence(): ChatPersistence {
  return disabledChatPersistence;
}
