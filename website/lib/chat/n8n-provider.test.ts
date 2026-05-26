import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatProviderError, type ChatProviderRequest } from "./provider";
import { N8nChatProvider } from "./n8n-provider";

const originalWebhookUrl = process.env.N8N_CHAT_WEBHOOK_URL;

const providerRequest: ChatProviderRequest = {
  requestId: "request-1",
  conversationId: "conversation-1",
  clientSessionId: "session-1",
  clientMessageId: "message-1",
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

function restoreEnv() {
  if (originalWebhookUrl === undefined) {
    delete process.env.N8N_CHAT_WEBHOOK_URL;
  } else {
    process.env.N8N_CHAT_WEBHOOK_URL = originalWebhookUrl;
  }
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    headers: { "content-type": "application/json" },
    status
  });
}

describe("N8nChatProvider", () => {
  afterEach(() => {
    restoreEnv();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("sends only the expected safe payload to the configured webhook", async () => {
    const fetchMock = vi.fn(
      async (_input: string | URL | Request, _init?: RequestInit) =>
        jsonResponse({
          conversationId: "conversation-1",
          assistantMessageId: "assistant-1",
          reply: {
            content: "Thanks. What date is your event?",
            quickReplies: ["Share event date"]
          }
        })
    );
    const provider = new N8nChatProvider({
      fetch: fetchMock,
      webhookUrl: "https://example.invalid/n8n-webhook",
      timeoutMs: 1000
    });

    await provider.sendMessage(providerRequest);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.invalid/n8n-webhook",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" }
      })
    );

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.body).toBe(JSON.stringify({
      requestId: "request-1",
      conversationId: "conversation-1",
      sessionId: "session-1",
      clientMessageId: "message-1",
      message: "I need 20 stools for an event",
      context: {
        pagePath: "/catalogue"
      },
      locale: "en-SG",
      timezone: "Asia/Singapore",
      capabilities: {
        stream: false
      }
    }));
  });

  it("normalizes a successful mocked n8n response", async () => {
    const provider = new N8nChatProvider({
      fetch: vi.fn(async () =>
        jsonResponse({
          conversationId: "conversation-n8n",
          assistantMessageId: "assistant-n8n",
          reply: {
            content: "Thanks. Could you share the venue?",
            quickReplies: ["Share venue"]
          }
        })
      ),
      webhookUrl: "https://example.invalid/n8n-webhook"
    });

    const response = await provider.sendMessage(providerRequest);

    expect(response).toEqual({
      conversationId: "conversation-n8n",
      assistantMessageId: "assistant-n8n",
      status: "completed",
      reply: {
        role: "assistant",
        content: "Thanks. Could you share the venue?",
        quickReplies: ["Share venue"],
        actions: []
      }
    });
  });

  it("maps non-2xx responses to safe provider errors", async () => {
    const provider = new N8nChatProvider({
      fetch: vi.fn(async () =>
        jsonResponse(
          {
            error: "failed at https://example.invalid/secret-webhook"
          },
          500
        )
      ),
      webhookUrl: "https://example.invalid/n8n-webhook"
    });

    await expect(provider.sendMessage(providerRequest)).rejects.toMatchObject({
      code: "PROVIDER_UNAVAILABLE"
    });

    await provider.sendMessage(providerRequest).catch((error) => {
      expect(error).toBeInstanceOf(ChatProviderError);
      expect(error.message).not.toContain("example.invalid");
      expect(error.message).not.toContain("secret-webhook");
    });
  });

  it("aborts timed out requests and returns a timeout error", async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn(
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        })
    );
    const provider = new N8nChatProvider({
      fetch: fetchMock,
      webhookUrl: "https://example.invalid/n8n-webhook",
      timeoutMs: 25
    });

    const responsePromise = provider.sendMessage(providerRequest);
    const expectation = expect(responsePromise).rejects.toMatchObject({
      code: "PROVIDER_TIMEOUT"
    });

    await vi.advanceTimersByTimeAsync(25);

    await expectation;
  });

  it("maps invalid JSON responses to safe provider errors", async () => {
    const provider = new N8nChatProvider({
      fetch: vi.fn(async () =>
        new Response("not json", {
          headers: { "content-type": "application/json" },
          status: 200
        })
      ),
      webhookUrl: "https://example.invalid/n8n-webhook"
    });

    await expect(provider.sendMessage(providerRequest)).rejects.toMatchObject({
      code: "PROVIDER_UNAVAILABLE"
    });
  });

  it("maps malformed provider payloads to safe provider errors", async () => {
    const provider = new N8nChatProvider({
      fetch: vi.fn(async () =>
        jsonResponse({
          conversationId: "conversation-n8n",
          reply: {
            quickReplies: ["Missing content"]
          }
        })
      ),
      webhookUrl: "https://example.invalid/n8n-webhook"
    });

    await expect(provider.sendMessage(providerRequest)).rejects.toMatchObject({
      code: "PROVIDER_UNAVAILABLE"
    });
  });

  it("uses a safe placeholder response when server-side n8n config is missing", async () => {
    delete process.env.N8N_CHAT_WEBHOOK_URL;
    const fetchMock = vi.fn();
    const provider = new N8nChatProvider({ fetch: fetchMock });

    const response = await provider.sendMessage(providerRequest);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(response).toMatchObject({
      conversationId: "conversation-1",
      status: "completed",
      reply: {
        role: "assistant",
        content:
          "Thanks. Could you share the event date, venue, rental duration, and the items or quantities you need?"
      }
    });
  });

  it("does not introduce browser-public n8n environment names", () => {
    const source = [
      "lib/chat/n8n-provider.ts",
      "lib/chat/provider-factory.ts",
      "app/api/chat/route.ts",
      "components/ChatWidget.tsx"
    ]
      .map((filePath) =>
        readFileSync(resolve(process.cwd(), filePath), "utf8")
      )
      .join("\n");
    const browserPublicPrefix = `${"NEXT"}_${"PUBLIC"}_`;

    expect(source).not.toContain(`${browserPublicPrefix}N8N`);
  });
});
