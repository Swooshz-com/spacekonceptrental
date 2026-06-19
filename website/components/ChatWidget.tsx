"use client";

import { FormEvent, useMemo, useState } from "react";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

type ChatApiResponse = {
  conversationId?: string;
  reply?: {
    role: "assistant";
    content: string;
  };
  error?: {
    message: string;
  };
};

const chatErrorMessage =
  "An error occurred while sending the chat message. Please try again.";

function createBrowserId(prefix: string) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function ChatWidget() {
  const clientSessionId = useMemo(() => createBrowserId("session"), []);
  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = draft.trim();
    if (!content || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createBrowserId("user-message"),
      role: "user",
      content
    };

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setErrorMessage(undefined);
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          conversationId,
          clientSessionId,
          clientMessageId: userMessage.id,
          message: {
            role: "user",
            content
          },
          context: {
            pagePath: globalThis.location?.pathname ?? "/"
          },
          capabilities: {
            stream: false
          },
          locale: "en-SG",
          timezone:
            Intl.DateTimeFormat().resolvedOptions().timeZone ??
            "Asia/Singapore"
        })
      });

      const body = (await response.json()) as ChatApiResponse;

      if (!response.ok || !body.reply) {
        throw new Error(body.error?.message ?? "Chat request failed");
      }

      const reply = body.reply;
      setConversationId(body.conversationId);
      setMessages((current) => [
        ...current,
        {
          id: createBrowserId("assistant-message"),
          role: "assistant",
          content: reply.content
        }
      ]);
    } catch {
      setErrorMessage(chatErrorMessage);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <aside className="chat-widget" aria-label="Rental questions">
      <div className="chat-widget__header">
        <span>Rental questions</span>
        <span className="chat-widget__status">Ask here</span>
      </div>
      <div className="chat-widget__messages" aria-live="polite">
        {messages.map((message) => (
          <p
            className={`chat-widget__message chat-widget__message--${message.role}`}
            key={message.id}
          >
            {message.content}
          </p>
        ))}
      </div>
      {errorMessage ? (
        <p className="chat-widget__error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <form className="chat-widget__form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="chat-message">
          Message
        </label>
        <textarea
          id="chat-message"
          name="message"
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about rentals or quote details"
          rows={2}
          value={draft}
        />
        <button disabled={isSending || draft.trim().length === 0} type="submit">
          {isSending ? "Sending" : "Send"}
        </button>
      </form>
    </aside>
  );
}
