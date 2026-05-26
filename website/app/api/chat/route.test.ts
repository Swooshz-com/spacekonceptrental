import { describe, expect, it, vi } from "vitest";
import { ChatProviderError, type ChatProvider } from "../../../lib/chat/provider";
import { handleChatPost } from "./route";

const validPayload = {
  clientSessionId: "browser-session-1",
  clientMessageId: "client-message-1",
  message: {
    role: "user",
    content: "I need 20 stools for an event"
  },
  capabilities: {
    stream: false
  },
  locale: "en-SG",
  timezone: "Asia/Singapore"
};

function postJson(
  payload: unknown,
  headers: Record<string, string> = {}
) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "content-type": "application/json", ...headers }
  });
}

function postRaw(body: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    body,
    headers: { "content-type": "application/json", ...headers }
  });
}

describe("POST /api/chat", () => {
  it("validates required chat fields before calling a provider", async () => {
    const provider: ChatProvider = {
      sendMessage: async () => {
        throw new Error("Provider should not be called for invalid payloads");
      }
    };

    const response = await handleChatPost(
      postJson({ ...validPayload, clientMessageId: "" }),
      provider
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_FAILED");
    expect(body.error.message).toContain("clientMessageId");
  });

  it("normalizes provider errors without exposing internals", async () => {
    const provider: ChatProvider = {
      sendMessage: async () => {
        throw new ChatProviderError(
          "PROVIDER_UNAVAILABLE",
          "upstream failed: https://example.invalid/internal-only"
        );
      }
    };

    const response = await handleChatPost(postJson(validPayload), provider);
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("PROVIDER_UNAVAILABLE");
    expect(body.error.message).toBe(
      "The assistant is temporarily unavailable. Please leave your contact details and the team will follow up."
    );
    expect(body.requestId).toEqual(expect.any(String));
    expect(serialized).not.toContain("example.invalid");
    expect(serialized).not.toContain("upstream failed");
  });

  it("rejects oversized request bodies before calling a provider", async () => {
    const provider: ChatProvider = {
      sendMessage: vi.fn()
    };
    const payload = {
      ...validPayload,
      clientSessionId: "oversized-body-session",
      clientMessageId: "oversized-body-message",
      message: {
        role: "user",
        content: "x".repeat(70_000)
      }
    };

    const response = await handleChatPost(postRaw(JSON.stringify(payload)), provider);
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body.error.code).toBe("REQUEST_TOO_LARGE");
    expect(provider.sendMessage).not.toHaveBeenCalled();
  });

  it("rejects overlong identifiers, message content, and context before calling a provider", async () => {
    const provider: ChatProvider = {
      sendMessage: vi.fn()
    };

    const cases = [
      {
        payload: {
          ...validPayload,
          clientSessionId: "x".repeat(129),
          clientMessageId: "long-session-message"
        },
        message: "clientSessionId"
      },
      {
        payload: {
          ...validPayload,
          clientSessionId: "long-content-session",
          clientMessageId: "long-content-message",
          message: {
            role: "user",
            content: "x".repeat(4_001)
          }
        },
        message: "message.content"
      },
      {
        payload: {
          ...validPayload,
          clientSessionId: "large-context-session",
          clientMessageId: "large-context-message",
          context: {
            note: "x".repeat(8_193)
          }
        },
        message: "context"
      }
    ];

    for (const testCase of cases) {
      const response = await handleChatPost(postJson(testCase.payload), provider);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_FAILED");
      expect(body.error.message).toContain(testCase.message);
    }

    expect(provider.sendMessage).not.toHaveBeenCalled();
  });

  it("returns cached responses for duplicate client message ids without calling the provider again", async () => {
    const provider: ChatProvider = {
      sendMessage: vi.fn(async () => ({
        conversationId: "conversation-dedupe",
        assistantMessageId: crypto.randomUUID(),
        status: "completed" as const,
        reply: {
          role: "assistant" as const,
          content: "What date is your event?",
          quickReplies: [],
          actions: []
        }
      }))
    };
    const payload = {
      ...validPayload,
      clientSessionId: "dedupe-session",
      clientMessageId: "dedupe-message"
    };

    const first = await handleChatPost(postJson(payload), provider);
    const second = await handleChatPost(postJson(payload), provider);
    const firstBody = await first.json();
    const secondBody = await second.json();

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(secondBody).toMatchObject({
      conversationId: firstBody.conversationId,
      assistantMessageId: firstBody.assistantMessageId,
      status: "completed",
      reply: firstBody.reply
    });
    expect(provider.sendMessage).toHaveBeenCalledTimes(1);
  });

  it("enforces per-IP rate limits before calling a provider", async () => {
    const provider: ChatProvider = {
      sendMessage: vi.fn(async () => ({
        conversationId: "conversation-rate-limit",
        assistantMessageId: crypto.randomUUID(),
        status: "completed" as const,
        reply: {
          role: "assistant" as const,
          content: "What date is your event?",
          quickReplies: [],
          actions: []
        }
      }))
    };

    for (let index = 0; index < 5; index += 1) {
      const response = await handleChatPost(
        postJson(
          {
            ...validPayload,
            clientSessionId: `rate-limit-session-${index}`,
            clientMessageId: `rate-limit-message-${index}`
          },
          { "x-forwarded-for": "203.0.113.10" }
        ),
        provider
      );

      expect(response.status).toBe(200);
    }

    const blocked = await handleChatPost(
      postJson(
        {
          ...validPayload,
          clientSessionId: "rate-limit-session-blocked",
          clientMessageId: "rate-limit-message-blocked"
        },
        { "x-forwarded-for": "203.0.113.10" }
      ),
      provider
    );
    const body = await blocked.json();

    expect(blocked.status).toBe(429);
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(body.rateLimit.remaining).toBe(0);
    expect(provider.sendMessage).toHaveBeenCalledTimes(5);
  });
});
