import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type {
  ChatProviderRequest,
  ChatProviderResponse
} from "../provider";
import { getChatPersistence } from "./index";

const trustedWorkspace = {
  workspaceId: "11111111-1111-4111-8111-111111111111",
  resolution: "server-config" as const
};

const providerRequest: ChatProviderRequest = {
  requestId: "request-1",
  conversationId: "conversation-1",
  clientSessionId: "browser-session-1",
  clientMessageId: "client-message-1",
  message: {
    role: "user",
    content: "I need 20 stools for an event"
  },
  context: {
    pagePath: "/catalogue"
  },
  capabilities: {
    stream: false
  },
  locale: "en-SG",
  timezone: "Asia/Singapore"
};

const providerResponse: ChatProviderResponse = {
  conversationId: "conversation-1",
  assistantMessageId: "assistant-message-1",
  status: "completed",
  reply: {
    role: "assistant",
    content: "Thanks. Could you share the event date?",
    quickReplies: [],
    actions: []
  }
};

function readPersistenceSource() {
  return [
    "lib/chat/persistence/types.ts",
    "lib/chat/persistence/disabled-chat-persistence.ts",
    "lib/chat/persistence/index.ts"
  ]
    .map((filePath) => readFileSync(resolve(process.cwd(), filePath), "utf8"))
    .join("\n");
}

describe("disabled chat persistence scaffold", () => {
  it("returns explicit skipped results for user and assistant messages", async () => {
    const persistence = getChatPersistence();

    await expect(
      persistence.recordUserMessage({
        workspace: trustedWorkspace,
        providerRequest
      })
    ).resolves.toEqual({
      status: "skipped",
      reason: "CHAT_PERSISTENCE_DISABLED_PHASE_1I_A"
    });

    await expect(
      persistence.recordAssistantMessage({
        workspace: trustedWorkspace,
        providerRequest,
        providerResponse
      })
    ).resolves.toEqual({
      status: "skipped",
      reason: "CHAT_PERSISTENCE_DISABLED_PHASE_1I_A"
    });
  });

  it("keeps the scaffold server-only and unable to write chat data", () => {
    const source = readPersistenceSource();

    expect(source.match(/import "server-only";/g)).toHaveLength(3);
    expect(source).not.toContain("@supabase/");
    expect(source).not.toContain("createServerSupabaseClient");
    expect(source).not.toContain(".insert(");
    expect(source).not.toContain('from("conversations")');
    expect(source).not.toContain('from("messages")');
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("NEXT_PUBLIC_N8N");
    expect(source).not.toContain("chat-config");
  });
});
