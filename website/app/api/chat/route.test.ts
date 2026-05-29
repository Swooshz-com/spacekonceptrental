import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatProviderError, type ChatProvider } from "../../../lib/chat/provider";
import { handleChatPost, POST, resetChatRouteStateForTests } from "./route";

const originalTrustedClientIpHeader =
  process.env.CHAT_TRUSTED_CLIENT_IP_HEADER;
const originalN8nWebhookUrl = process.env.N8N_CHAT_WEBHOOK_URL;

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

function restoreTrustedClientIpHeader() {
  if (originalTrustedClientIpHeader === undefined) {
    delete process.env.CHAT_TRUSTED_CLIENT_IP_HEADER;
    return;
  }

  process.env.CHAT_TRUSTED_CLIENT_IP_HEADER = originalTrustedClientIpHeader;
}

function restoreN8nWebhookUrl() {
  if (originalN8nWebhookUrl === undefined) {
    delete process.env.N8N_CHAT_WEBHOOK_URL;
    return;
  }

  process.env.N8N_CHAT_WEBHOOK_URL = originalN8nWebhookUrl;
}

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
  afterEach(() => {
    resetChatRouteStateForTests();
    restoreTrustedClientIpHeader();
    restoreN8nWebhookUrl();
    vi.restoreAllMocks();
  });

  it("continues to serve POST requests through the configured provider boundary", async () => {
    delete process.env.N8N_CHAT_WEBHOOK_URL;

    const response = await POST(
      postJson({
        ...validPayload,
        clientSessionId: "factory-boundary-session",
        clientMessageId: "factory-boundary-message"
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: "completed",
      reply: {
        role: "assistant",
        content:
          "Thanks. Could you share the event date, venue, rental duration, and the items or quantities you need?"
      }
    });
  });

  it("uses a fallback rate-limit bucket when no trusted client IP source is available", async () => {
    delete process.env.CHAT_TRUSTED_CLIENT_IP_HEADER;

    const provider: ChatProvider = {
      sendMessage: vi.fn(async () => ({
        conversationId: "conversation-no-shared-fallback",
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
            clientSessionId: `fallback-attacker-session-${index}`,
            clientMessageId: `fallback-attacker-message-${index}`
          },
          { "x-forwarded-for": `198.51.100.${index}` }
        ),
        provider
      );

      expect(response.status).toBe(200);
    }

    const blocked = await handleChatPost(
      postJson(
        {
          ...validPayload,
          clientSessionId: "fallback-rotated-session-blocked",
          clientMessageId: "fallback-rotated-message-blocked"
        },
        {
          "cf-connecting-ip": "203.0.113.220",
          "x-forwarded-for": "203.0.113.221"
        }
      ),
      provider
    );
    const body = await blocked.json();

    expect(blocked.status).toBe(429);
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(provider.sendMessage).toHaveBeenCalledTimes(5);
  });

  it("throttles untrusted session churn without evicting trusted IP buckets", { timeout: 15000 }, async () => {
    process.env.CHAT_TRUSTED_CLIENT_IP_HEADER = "cf-connecting-ip";

    const provider: ChatProvider = {
      sendMessage: vi.fn(async () => ({
        conversationId: "conversation-session-churn",
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
    const victimHeaders = { "cf-connecting-ip": "203.0.113.230" };

    for (let index = 0; index < 5; index += 1) {
      const response = await handleChatPost(
        postJson(
          {
            ...validPayload,
            clientSessionId: `trusted-ip-victim-session-${index}`,
            clientMessageId: `trusted-ip-victim-message-${index}`
          },
          victimHeaders
        ),
        provider
      );

      expect(response.status).toBe(200);
    }

    for (let index = 0; index < 1_050; index += 1) {
      const response = await handleChatPost(
        postJson(
          {
            ...validPayload,
            clientSessionId: `session-churn-${index}`,
            clientMessageId: `session-churn-message-${index}`
          },
          { "x-forwarded-for": `198.51.100.${index % 255}` }
        ),
        provider
      );

      expect(response.status).toBe(index < 5 ? 200 : 429);
    }

    const blocked = await handleChatPost(
      postJson(
        {
          ...validPayload,
          clientSessionId: "trusted-ip-victim-over-limit-session",
          clientMessageId: "trusted-ip-victim-over-limit-message"
        },
        victimHeaders
      ),
      provider
    );
    const body = await blocked.json();

    expect(blocked.status).toBe(429);
    expect(body.error.code).toBe("RATE_LIMITED");
  });

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

  it("rejects changed payloads that reuse the same client message id", async () => {
    const provider: ChatProvider = {
      sendMessage: vi.fn(async () => ({
        conversationId: "conversation-conflict",
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
      clientSessionId: "idempotency-conflict-session",
      clientMessageId: "idempotency-conflict-message",
      context: {
        pagePath: "/catalogue/chairs"
      }
    };

    const first = await handleChatPost(postJson(payload), provider);
    const conflict = await handleChatPost(
      postJson({
        ...payload,
        message: {
          role: "user",
          content: "Actually I need 40 stools"
        }
      }),
      provider
    );
    const body = await conflict.json();

    expect(first.status).toBe(200);
    expect(conflict.status).toBe(409);
    expect(body.error.code).toBe("IDEMPOTENCY_CONFLICT");
    expect(provider.sendMessage).toHaveBeenCalledTimes(1);
  });

  it("charges conflicting idempotency requests against rate limits", async () => {
    process.env.CHAT_TRUSTED_CLIENT_IP_HEADER = "cf-connecting-ip";

    const provider: ChatProvider = {
      sendMessage: vi.fn(async () => ({
        conversationId: "conversation-conflict-rate-limit",
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
      clientSessionId: "idempotency-conflict-rate-limit-session",
      clientMessageId: "idempotency-conflict-rate-limit-message"
    };
    const headers = { "cf-connecting-ip": "198.51.100.30" };

    const first = await handleChatPost(postJson(payload, headers), provider);
    expect(first.status).toBe(200);

    for (let index = 0; index < 4; index += 1) {
      const conflict = await handleChatPost(
        postJson(
          {
            ...payload,
            message: {
              role: "user",
              content: `Changed message ${index}`
            }
          },
          headers
        ),
        provider
      );

      expect(conflict.status).toBe(409);
    }

    const blocked = await handleChatPost(
      postJson(
        {
          ...payload,
          message: {
            role: "user",
            content: "Changed message after quota"
          }
        },
        headers
      ),
      provider
    );
    const body = await blocked.json();

    expect(blocked.status).toBe(429);
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(provider.sendMessage).toHaveBeenCalledTimes(1);
  });

  it("does not charge exact idempotent retries against rate limits", async () => {
    process.env.CHAT_TRUSTED_CLIENT_IP_HEADER = "cf-connecting-ip";

    const provider: ChatProvider = {
      sendMessage: vi.fn(async () => ({
        conversationId: "conversation-idempotent-retry",
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
    const clientSessionId = "idempotent-retry-session";
    const headers = { "cf-connecting-ip": "198.51.100.40" };
    const retryPayload = {
      ...validPayload,
      clientSessionId,
      clientMessageId: "idempotent-retry-message"
    };

    const first = await handleChatPost(postJson(retryPayload, headers), provider);
    expect(first.status).toBe(200);

    for (let index = 0; index < 7; index += 1) {
      const retry = await handleChatPost(postJson(retryPayload, headers), provider);
      expect(retry.status).toBe(200);
    }

    for (let index = 0; index < 4; index += 1) {
      const response = await handleChatPost(
        postJson(
          {
            ...validPayload,
            clientSessionId,
            clientMessageId: `idempotent-retry-new-message-${index}`,
            message: {
              role: "user",
              content: `New request ${index}`
            }
          },
          headers
        ),
        provider
      );

      expect(response.status).toBe(200);
    }

    const blocked = await handleChatPost(
      postJson(
        {
          ...validPayload,
          clientSessionId,
          clientMessageId: "idempotent-retry-blocked-message",
          message: {
            role: "user",
            content: "One too many new requests"
          }
        },
        headers
      ),
      provider
    );

    expect(blocked.status).toBe(429);
    expect(provider.sendMessage).toHaveBeenCalledTimes(5);
  });

  it("enforces per-IP rate limits before calling a provider", async () => {
    process.env.CHAT_TRUSTED_CLIENT_IP_HEADER = "cf-connecting-ip";

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
          { "cf-connecting-ip": "203.0.113.10" }
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
        { "cf-connecting-ip": "203.0.113.10" }
      ),
      provider
    );
    const body = await blocked.json();

    expect(blocked.status).toBe(429);
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(body.rateLimit.remaining).toBe(0);
    expect(provider.sendMessage).toHaveBeenCalledTimes(5);
  });

  it("uses the configured trusted client IP header instead of spoofed forwarded headers", async () => {
    process.env.CHAT_TRUSTED_CLIENT_IP_HEADER = "cf-connecting-ip";

    const provider: ChatProvider = {
      sendMessage: vi.fn(async () => ({
        conversationId: "conversation-trusted-ip",
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
            clientSessionId: `trusted-ip-session-${index}`,
            clientMessageId: `trusted-ip-message-${index}`
          },
          {
            "cf-connecting-ip": "203.0.113.77",
            "x-forwarded-for": `198.51.100.${index}`
          }
        ),
        provider
      );

      expect(response.status).toBe(200);
    }

    const blocked = await handleChatPost(
      postJson(
        {
          ...validPayload,
          clientSessionId: "trusted-ip-session-blocked",
          clientMessageId: "trusted-ip-message-blocked"
        },
        {
          "cf-connecting-ip": "203.0.113.77",
          "x-forwarded-for": "198.51.100.200"
        }
      ),
      provider
    );
    const body = await blocked.json();

    expect(blocked.status).toBe(429);
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(provider.sendMessage).toHaveBeenCalledTimes(5);
  });
});
