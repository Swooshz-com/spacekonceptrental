import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import ChatWidget from "./ChatWidget";

const assistantResponse = {
  conversationId: "conversation-1",
  assistantMessageId: "assistant-1",
  status: "completed",
  reply: {
    role: "assistant",
    content: "Thanks. Could you share your event date and venue?",
    quickReplies: [],
    actions: []
  }
};

describe("ChatWidget", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts browser chat messages only to the first-party API route", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify(assistantResponse), {
        headers: { "content-type": "application/json" },
        status: 200
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ChatWidget />);

    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "I need 20 stools for a conference" }
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" }
      })
    );
  });

  it("does not render server-only webhook configuration into the client", () => {
    process.env.N8N_CHAT_WEBHOOK_URL = "https://example.invalid/internal-only";

    const { container } = render(<ChatWidget />);

    expect(container).not.toHaveTextContent("example.invalid");
    expect(container.innerHTML).not.toContain("N8N_CHAT_WEBHOOK_URL");
  });

  it("does not import the server-only n8n provider in browser-facing code", () => {
    const source = readFileSync(
      resolve(process.cwd(), "components/ChatWidget.tsx"),
      "utf8"
    );

    expect(source).not.toContain("n8n-provider");
    expect(source).not.toContain("N8N_CHAT_WEBHOOK_URL");
  });
});
