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

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Hi, I can help with event furniture availability and quote details."
  }
];

function createBrowserId(prefix: string) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function ChatWidget() {
  const clientSessionId = useMemo(() => createBrowserId("session"), []);
  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

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
      setMessages((current) => [
        ...current,
        {
          id: createBrowserId("assistant-error"),
          role: "assistant",
          content:
            "The assistant is temporarily unavailable. Please leave your contact details and the team will follow up."
        }
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <aside className="chat-widget" aria-label="Rental assistant">
      <div className="chat-widget__header">
        <span>Rental assistant</span>
        <span className="chat-widget__status">Online</span>
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
