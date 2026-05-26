import { describe, expect, it } from "vitest";
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

function postJson(payload: unknown) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "content-type": "application/json" }
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
});
