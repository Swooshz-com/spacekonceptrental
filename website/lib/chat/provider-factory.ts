import "server-only";

import { getChatProviderRuntimeConfig } from "../server-runtime-config";
import { N8nChatProvider } from "./n8n-provider";
import { ChatProviderError, type ChatProvider } from "./provider";

export function getChatProvider(): ChatProvider {
  const providerConfig = getChatProviderRuntimeConfig();

  if (providerConfig.configured && providerConfig.provider === "n8n") {
    return new N8nChatProvider();
  }

  throw new ChatProviderError(
    "PROVIDER_UNAVAILABLE",
    "Unsupported chat provider."
  );
}
