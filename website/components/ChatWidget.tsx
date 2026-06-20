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
  const [isOpen, setIsOpen] = useState(true);

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
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
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
          <span aria-hidden="true" style={{ fontSize: '14px', fontWeight: 800 }}>SK</span>
          <span style={{
            position: 'absolute', top: '0', right: '0', background: '#0f172a', color: '#fff',
            fontSize: '12px', fontWeight: 700, width: '22px', height: '22px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--surface)'
          }}>1</span>
        </button>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Chat with us</span>
      </div>
    );
  }

  return (
    <aside
      aria-label="Rental questions"
      style={{
        position: 'fixed', bottom: '24px', right: '24px', width: '380px', maxWidth: 'calc(100vw - 48px)',
        background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column',
        zIndex: 50, overflow: 'hidden'
      }}
    >
      <div style={{
        background: '#0f172a', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>SpaceKonceptRental AI</span>
          <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Your event furniture helper</span>
        </div>
        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '4px' }} aria-label="Close chat">x</button>
      </div>

      <div style={{ padding: '20px', maxHeight: '400px', height: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: '#f8fafc' }} aria-live="polite">
        {messages.length === 0 && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>SK</div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#334155', padding: '12px 16px', borderRadius: '0 16px 16px 16px', fontSize: '14px', lineHeight: 1.5 }}>
              Hi! I can help with furniture listing questions and enquiry details. What event are you planning?
            </div>
          </div>
        )}
        {messages.map((message) => (
          <div key={message.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexDirection: message.role === 'user' ? 'row-reverse' : 'row' }}>
            {message.role === 'assistant' && <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>SK</div>}
            <div
              style={{
                background: message.role === 'user' ? 'var(--accent)' : '#fff',
                border: message.role === 'user' ? 'none' : '1px solid #e2e8f0',
                color: message.role === 'user' ? '#fff' : '#334155',
                padding: '12px 16px',
                borderRadius: message.role === 'user' ? '16px 0 16px 16px' : '0 16px 16px 16px',
                maxWidth: '85%',
                fontSize: '14px',
                lineHeight: 1.5
              }}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>

      {errorMessage && (
        <div style={{ padding: '12px 20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '12px', borderTop: '1px solid rgba(239, 68, 68, 0.2)' }} role="alert">
          {errorMessage}
        </div>
      )}

      <div style={{ padding: '0 20px', background: '#f8fafc' }}>
        <p style={{ color: '#475569', fontSize: '12px', lineHeight: 1.5, margin: '0 0 12px' }}>
          Ask here about listing details or enquiry preparation. See our{" "}
          <a href="/privacy">Privacy Policy</a> and{" "}
          <a href="/terms">Terms of Use</a>.
        </p>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' }}>
          <button onClick={() => setDraft("View Sofas")} style={{ whiteSpace: 'nowrap', padding: '6px 16px', borderRadius: '20px', border: '1px solid var(--accent)', background: '#fff', color: 'var(--accent)', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>View Sofas</button>
          <button onClick={() => setDraft("Quote details")} style={{ whiteSpace: 'nowrap', padding: '6px 16px', borderRadius: '20px', border: '1px solid var(--accent)', background: '#fff', color: 'var(--accent)', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>Quote details</button>
          <button onClick={() => setDraft("Setup notes")} style={{ whiteSpace: 'nowrap', padding: '6px 16px', borderRadius: '20px', border: '1px solid var(--accent)', background: '#fff', color: 'var(--accent)', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>Setup notes</button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '16px 20px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <label className="sr-only" htmlFor="chat-message">Message</label>
        <input
          id="chat-message"
          name="message"
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type your question..."
          value={draft}
          style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '15px', outline: 'none', color: '#0f172a' }}
          autoComplete="off"
        />
        <button aria-label="Send" disabled={isSending || draft.trim().length === 0} type="submit" style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: (isSending || draft.trim().length === 0) ? 0.5 : 1, transition: 'opacity 0.2s', padding: 0 }}>
          <span aria-hidden="true" style={{ fontSize: '12px', fontWeight: 800 }}>Send</span>
        </button>
      </form>
    </aside>
  );
}
