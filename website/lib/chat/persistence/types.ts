import "server-only";

import type {
  ChatProviderRequest,
  ChatProviderResponse
} from "../provider";

export type TrustedChatWorkspace = {
  workspaceId: string;
  resolution: "server-config" | "trusted-host-mapping";
};

export type ChatPersistenceSkippedReason =
  "CHAT_PERSISTENCE_DISABLED_PHASE_1I_A";

export type ChatPersistenceResult = {
  status: "skipped";
  reason: ChatPersistenceSkippedReason;
};

export type RecordUserMessageInput = {
  workspace: TrustedChatWorkspace;
  providerRequest: ChatProviderRequest;
};

export type RecordAssistantMessageInput = {
  workspace: TrustedChatWorkspace;
  providerRequest: ChatProviderRequest;
  providerResponse: ChatProviderResponse;
};

export interface ChatPersistence {
  recordUserMessage: (
    input: RecordUserMessageInput
  ) => Promise<ChatPersistenceResult>;
  recordAssistantMessage: (
    input: RecordAssistantMessageInput
  ) => Promise<ChatPersistenceResult>;
}
