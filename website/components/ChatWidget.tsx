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
    reference?: string;
  };
  requestId?: string;
};

const chatErrorMessage =
  "An error occurred while sending the chat message. Please try again.";
const chatBodyFontSize = "1rem";
const chatBodyLineHeight = 1.55;

function formatChatErrorMessage(reference: string | undefined) {
  return reference
    ? `${chatErrorMessage} Support reference: ${reference}.`
    : chatErrorMessage;
}

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
  const [isOpen, setIsOpen] = useState(false);

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

    let failedChatReference: string | undefined;

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
        failedChatReference = body.error?.reference ?? body.requestId;
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
      setErrorMessage(formatChatErrorMessage(failedChatReference));
    } finally {
      setIsSending(false);
    }
  }

  if (!isOpen) {
    return (
      <div className="chat-widget-launcher" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <button
          className="premium-chat-pulse"
          onClick={() => setIsOpen(true)}
          style={{
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: '64px',
            height: '64px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: 0
          }}
          aria-label="Open chat"
        >
          <span className="chat-widget-launcher-mark" aria-hidden="true" style={{ fontSize: '14px', fontWeight: 800 }}>SK</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <aside
        aria-label="Rental questions"
        className="chat-widget-panel"
        style={{
          position: 'fixed', bottom: '24px', right: '24px', width: '380px', maxWidth: 'calc(100vw - 48px)',
          background: '#fcf9f5', borderRadius: '10px', border: '1px solid #dcd9d6',
          boxShadow: '0 22px 54px rgba(26,26,26,0.18)', display: 'flex', flexDirection: 'column',
          zIndex: 50, overflow: 'hidden'
        }}
      >
        <div style={{
          background: '#fcf9f5', borderBottom: '1px solid #dcd9d6', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a' }}>SpaceKonceptRental AI</span>
            <span style={{ fontSize: '14px', color: '#5f634f', lineHeight: 1.35 }}>Your event furniture helper</span>
          </div>
          <button className="chat-widget-collapse-button chat-widget-collapse-button--header" onClick={() => setIsOpen(false)} aria-label="Minimize chat">
            <span className="chat-widget-chevron" aria-hidden="true" />
          </button>
        </div>

        <div style={{ padding: '20px', maxHeight: '400px', height: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: '#f6f3f0' }} aria-live="polite">
          {messages.length === 0 && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#5f634f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>SK</div>
              <div style={{ background: '#fcf9f5', border: '1px solid #dcd9d6', color: '#1a1a1a', padding: '12px 16px', borderRadius: '0 12px 12px 12px', fontSize: chatBodyFontSize, lineHeight: chatBodyLineHeight }}>
                Hi! I can help you browse Home, Catalogue, Setups, About, and Request Quote. For item or event details, please use the Request Quote form.
              </div>
            </div>
          )}
          {messages.map((message) => (
            <div key={message.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexDirection: message.role === 'user' ? 'row-reverse' : 'row' }}>
              {message.role === 'assistant' && <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#5f634f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>SK</div>}
              <div
                style={{
                  background: message.role === 'user' ? '#5f634f' : '#fcf9f5',
                  border: message.role === 'user' ? 'none' : '1px solid #dcd9d6',
                  color: message.role === 'user' ? '#fff' : '#1a1a1a',
                  padding: '12px 16px',
                  borderRadius: message.role === 'user' ? '12px 0 12px 12px' : '0 12px 12px 12px',
                  maxWidth: '85%',
                  fontSize: chatBodyFontSize,
                  lineHeight: chatBodyLineHeight
                }}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>

        {errorMessage && (
          <div style={{ padding: '12px 20px', background: '#fff4f0', color: '#9b4f45', fontSize: chatBodyFontSize, lineHeight: chatBodyLineHeight, borderTop: '1px solid #d8c7bd' }} role="alert">
            {errorMessage}
          </div>
        )}

        <div style={{ padding: '0 20px', background: '#f6f3f0' }}>
          <p style={{ color: '#46473f', fontSize: chatBodyFontSize, lineHeight: chatBodyLineHeight, margin: 0 }}>
            Ask here for public site guidance. Item-specific or event-specific requests should go through{" "}
            <a href="/quote">Request Quote</a>. See our{" "}
            <a href="/privacy">Privacy Policy</a> and{" "}
            <a href="/terms">Terms of Use</a>.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '16px 20px', background: '#fcf9f5', borderTop: '1px solid #dcd9d6', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label className="sr-only" htmlFor="chat-message">Message</label>
          <input
            id="chat-message"
            name="message"
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type your question..."
            value={draft}
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: chatBodyFontSize, lineHeight: chatBodyLineHeight, outline: 'none', color: '#1a1a1a' }}
            autoComplete="off"
          />
          <button aria-label="Send" disabled={isSending || draft.trim().length === 0} type="submit" style={{ background: '#5f634f', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: (isSending || draft.trim().length === 0) ? 0.5 : 1, transition: 'opacity 0.2s', padding: 0 }}>
            <span aria-hidden="true" style={{ fontSize: '12px', fontWeight: 800 }}>Send</span>
          </button>
        </form>
      </aside>
      <button className="chat-widget-collapse-button chat-widget-collapse-button--floating" onClick={() => setIsOpen(false)} aria-label="Minimize chat">
        <span className="chat-widget-chevron" aria-hidden="true" />
      </button>
    </>
  );
}
