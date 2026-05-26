import "server-only";

import { N8nChatProvider } from "./n8n-provider";
import type { ChatProvider } from "./provider";

export function getChatProvider(): ChatProvider {
  return new N8nChatProvider();
}
