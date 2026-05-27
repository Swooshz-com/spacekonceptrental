import "server-only";

import type {
  ChatPersistence,
  ChatPersistenceResult,
  RecordAssistantMessageInput,
  RecordUserMessageInput
} from "./types";

const disabledResult: ChatPersistenceResult = {
  status: "skipped",
  reason: "CHAT_PERSISTENCE_DISABLED_PHASE_1I_A"
};

export class DisabledChatPersistence implements ChatPersistence {
  async recordUserMessage(
    _input: RecordUserMessageInput
  ): Promise<ChatPersistenceResult> {
    return disabledResult;
  }

  async recordAssistantMessage(
    _input: RecordAssistantMessageInput
  ): Promise<ChatPersistenceResult> {
    return disabledResult;
  }
}

export const disabledChatPersistence = new DisabledChatPersistence();
