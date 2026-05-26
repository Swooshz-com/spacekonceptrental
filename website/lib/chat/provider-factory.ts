import "server-only";

import { N8nChatProvider } from "./n8n-provider";
import { ChatProviderError, type ChatProvider } from "./provider";

export function getChatProvider(): ChatProvider {
  const providerName = process.env.CHAT_PROVIDER?.trim().toLowerCase() || "n8n";

  if (providerName === "n8n") {
    return new N8nChatProvider();
  }

  throw new ChatProviderError(
    "PROVIDER_UNAVAILABLE",
    "Unsupported chat provider."
  );
}
