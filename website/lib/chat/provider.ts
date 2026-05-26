import "server-only";

export type ChatRequestMessage = {
  role: "user";
  content: string;
};

export type ChatReply = {
  role: "assistant";
  content: string;
  quickReplies: string[];
  actions: unknown[];
};

export type ChatProviderRequest = {
  requestId: string;
  conversationId?: string;
  clientSessionId: string;
  clientMessageId: string;
  message: ChatRequestMessage;
  context?: Record<string, unknown>;
  capabilities: {
    stream: false;
  };
  locale: string;
  timezone: string;
};

export type ChatProviderResponse = {
  conversationId: string;
  assistantMessageId: string;
  status: "completed";
  reply: ChatReply;
};

export type ChatProviderErrorCode =
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_UNAVAILABLE"
  | "CHAT_ERROR";

export class ChatProviderError extends Error {
  constructor(
    public readonly code: ChatProviderErrorCode,
    message: string
  ) {
    super(message);
    this.name = "ChatProviderError";
  }
}

export interface ChatProvider {
  sendMessage: (
    request: ChatProviderRequest
  ) => Promise<ChatProviderResponse>;
}
