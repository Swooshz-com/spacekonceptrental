import { describe, expect, it } from "vitest";

import {
  applyChatbotLaunchBoundary,
  chatbotLaunchBoundaryAllowedPublicPaths,
  chatbotLaunchBoundaryFallbackReply,
  chatbotLaunchBoundaryInstructions,
  isChatbotLaunchSafeReply
} from "./launch-boundary";
import type { ChatProviderResponse } from "./provider";

function responseWith(content: string): ChatProviderResponse {
  return {
    conversationId: "conversation-1",
    assistantMessageId: "assistant-1",
    status: "completed",
    reply: {
      role: "assistant",
      content,
      quickReplies: ["Continue"],
      actions: []
    }
  };
}

describe("chatbot launch boundary", () => {
  it("documents the public visitor guidance scope for the provider", () => {
    expect(chatbotLaunchBoundaryAllowedPublicPaths).toEqual([
      "/",
      "/catalogue",
      "/setups",
      "/about",
      "/quote"
    ]);
    expect(chatbotLaunchBoundaryInstructions).toContain(
      "public visitor guidance only"
    );
    expect(chatbotLaunchBoundaryInstructions).toContain("Request Quote");
    expect(chatbotLaunchBoundaryInstructions).toContain(
      "Never instruct the browser to call n8n directly"
    );
    expect(chatbotLaunchBoundaryInstructions).toContain(
      "Do not expose admin or internal data"
    );
  });

  it("allows public browsing guidance and Request Quote handoff copy", () => {
    expect(
      isChatbotLaunchSafeReply(
        "You can browse Catalogue and Setups, then use Request Quote for item-specific details."
      )
    ).toBe(true);
  });

  it("replaces unsafe provider promises before they reach the browser", () => {
    const unsafe = responseWith(
      "Your booking is confirmed, stock is available now, and payment can be made at checkout."
    );
    const safe = applyChatbotLaunchBoundary(unsafe);

    expect(safe.reply.content).toBe(chatbotLaunchBoundaryFallbackReply);
    expect(safe.reply.quickReplies).toEqual([]);
    expect(safe.reply.actions).toEqual([]);
  });

  it("blocks internal/provider detail leakage from provider replies", () => {
    const unsafe = responseWith(
      "The n8n webhook succeeded and the Supabase storage path is visible in /admin."
    );

    expect(applyChatbotLaunchBoundary(unsafe).reply.content).toBe(
      chatbotLaunchBoundaryFallbackReply
    );
  });
});
