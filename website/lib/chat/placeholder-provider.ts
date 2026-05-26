import "server-only";

import {
  type ChatProvider,
  type ChatProviderRequest,
  type ChatProviderResponse
} from "./provider";

function createId() {
  return crypto.randomUUID();
}

export class PlaceholderChatProvider implements ChatProvider {
  async sendMessage(
    request: ChatProviderRequest
  ): Promise<ChatProviderResponse> {
    return {
      conversationId: request.conversationId ?? createId(),
      assistantMessageId: createId(),
      status: "completed",
      reply: {
        role: "assistant",
        content:
          "Thanks. Could you share the event date, venue, rental duration, and the items or quantities you need?",
        quickReplies: [],
        actions: []
      }
    };
  }
}
