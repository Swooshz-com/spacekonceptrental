import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    cleanup();
    vi.restoreAllMocks();
  });

  it("starts without a canned assistant response before a provider reply", () => {
    render(<ChatWidget />);

    expect(screen.getByRole("button", { name: /open chat/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/message/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/hi, i can help with event furniture availability/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/online/i)).not.toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("button", { name: /open chat/i }));

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

  it("shows an error instead of an assistant fallback response when chat fails", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          error: {
            code: "PROVIDER_UNAVAILABLE",
            reference: "chat-error-ref-123",
            message: "An error occurred while sending the chat message."
          },
          requestId: "chat-error-ref-123"
        }),
        {
          headers: { "content-type": "application/json" },
          status: 503
        }
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ChatWidget />);
    fireEvent.click(screen.getByRole("button", { name: /open chat/i }));

    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "Do you have lounge seating?" }
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent(/an error occurred while sending the chat message/i);
    expect(alert).toHaveTextContent(/please try again/i);
    expect(alert).toHaveTextContent(/support reference: chat-error-ref-123/i);
    expect(
      screen.queryByText(/please leave your contact details and the team will follow up/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/could you share your event date and venue/i)
    ).not.toBeInTheDocument();
  });

  it("shows legal links near chat guidance without exposing provider details", () => {
    render(<ChatWidget />);
    fireEvent.click(screen.getByRole("button", { name: /open chat/i }));

    expect(
      screen.getByRole("link", { name: /Privacy Policy/i })
    ).toHaveAttribute("href", "/privacy");
    expect(
      screen.getByRole("link", { name: /Terms of Use/i })
    ).toHaveAttribute("href", "/terms");
    expect(document.body.textContent).not.toMatch(/n8n|webhook|provider url/i);
  });

  it("does not show suggested prompt buttons in the chat panel", () => {
    render(<ChatWidget />);
    fireEvent.click(screen.getByRole("button", { name: /open chat/i }));

    expect(screen.queryByRole("button", { name: /View Sofas/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Quote details/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Setup notes/i })).not.toBeInTheDocument();
  });

  it("keeps chat body copy at the contact panel body text size", () => {
    render(<ChatWidget />);
    fireEvent.click(screen.getByRole("button", { name: /open chat/i }));

    expect(screen.getByText(/Hi! I can help you browse Home, Catalogue, Setups, About, and Request Quote/i)).toHaveStyle({
      fontSize: "1rem"
    });
    expect(screen.getByText(/Ask here for public site guidance/i)).toHaveStyle({
      fontSize: "1rem"
    });
    expect(screen.getByLabelText(/message/i)).toHaveStyle({
      fontSize: "1rem"
    });
  });

  it("does not render server-only webhook configuration into the client", () => {
    process.env.N8N_CHAT_WEBHOOK_URL = "https://example.invalid/internal-only";

    const { container } = render(<ChatWidget />);
    fireEvent.click(screen.getByRole("button", { name: /open chat/i }));

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

  it("frames item and event specific requests as Request Quote form work", () => {
    render(<ChatWidget />);
    fireEvent.click(screen.getByRole("button", { name: /open chat/i }));

    expect(
      screen.getByText(/For item or event details, please use the Request Quote form/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Request Quote/i })
    ).toHaveAttribute("href", "/quote");
    expect(document.body.textContent).not.toMatch(
      /\b(?:cart|checkout|payment|order|booking|reservation|stock|inventory|customer account|crm pipeline)\b/i
    );
  });
});
