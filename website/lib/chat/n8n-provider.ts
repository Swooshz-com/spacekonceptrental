import "server-only";

import { getN8nChatRuntimeConfig } from "../server-runtime-config";
import { PlaceholderChatProvider } from "./placeholder-provider";
import {
  ChatProviderError,
  type ChatProvider,
  type ChatProviderRequest,
  type ChatProviderResponse
} from "./provider";

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_TIMEOUT_MS = 30_000;

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>;

type N8nChatProviderOptions = {
  fetch?: FetchLike;
  webhookUrl?: string;
  timeoutMs?: number;
  fallbackProvider?: ChatProvider;
};

function createId() {
  return crypto.randomUUID();
}

function normalizeWebhookUrl(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function normalizeTimeoutMs(value: number | string | undefined) {
  const timeout =
    typeof value === "number" ? value : Number(value ?? DEFAULT_TIMEOUT_MS);

  if (!Number.isFinite(timeout) || timeout <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }

  return Math.min(Math.floor(timeout), MAX_TIMEOUT_MS);
}

function getDefaultN8nRuntimeOptions() {
  const config = getN8nChatRuntimeConfig();

  return {
    webhookUrl: config.configured ? config.webhookUrl : undefined,
    timeoutMs: config.timeoutMs
  };
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getString(
  source: Record<string, unknown>,
  key: string
): string | undefined {
  const value = source[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getReplyContent(payload: Record<string, unknown>) {
  const reply = payload.reply;

  if (typeof reply === "string" && reply.trim()) {
    return reply.trim();
  }

  if (isRecord(reply)) {
    const replyContent = getString(reply, "content");

    if (replyContent) {
      return replyContent;
    }
  }

  return (
    getString(payload, "output") ??
    getString(payload, "message") ??
    getString(payload, "text")
  );
}

function getQuickReplies(payload: Record<string, unknown>) {
  const reply = payload.reply;
  const quickReplies = isRecord(reply)
    ? reply.quickReplies
    : payload.quickReplies;

  if (
    Array.isArray(quickReplies) &&
    quickReplies.every((item) => typeof item === "string")
  ) {
    return quickReplies;
  }

  return [];
}

function createN8nPayload(request: ChatProviderRequest) {
  return {
    requestId: request.requestId,
    conversationId: request.conversationId,
    sessionId: request.clientSessionId,
    clientMessageId: request.clientMessageId,
    message: request.message.content,
    context: request.context ?? {},
    locale: request.locale,
    timezone: request.timezone,
    capabilities: {
      stream: false
    }
  };
}

function normalizeN8nResponse(
  payload: unknown,
  request: ChatProviderRequest
): ChatProviderResponse {
  if (!isRecord(payload)) {
    throw new ChatProviderError(
      "PROVIDER_UNAVAILABLE",
      "Provider response was malformed."
    );
  }

  const content = getReplyContent(payload);

  if (!content) {
    throw new ChatProviderError(
      "PROVIDER_UNAVAILABLE",
      "Provider response was malformed."
    );
  }

  return {
    conversationId:
      getString(payload, "conversationId") ?? request.conversationId ?? createId(),
    assistantMessageId: getString(payload, "assistantMessageId") ?? createId(),
    status: "completed",
    reply: {
      role: "assistant",
      content,
      quickReplies: getQuickReplies(payload),
      actions: []
    }
  };
}

export class N8nChatProvider implements ChatProvider {
  private readonly fallbackProvider: ChatProvider;
  private readonly fetch: FetchLike;
  private readonly timeoutMs: number;
  private readonly webhookUrl?: string;

  constructor(options: N8nChatProviderOptions = {}) {
    this.fallbackProvider =
      options.fallbackProvider ?? new PlaceholderChatProvider();
    this.fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
    const runtimeOptions = getDefaultN8nRuntimeOptions();

    this.timeoutMs = normalizeTimeoutMs(
      options.timeoutMs ?? runtimeOptions.timeoutMs
    );
    this.webhookUrl = normalizeWebhookUrl(
      options.webhookUrl ?? runtimeOptions.webhookUrl
    );
  }

  async sendMessage(
    request: ChatProviderRequest
  ): Promise<ChatProviderResponse> {
    if (!this.webhookUrl) {
      return this.fallbackProvider.sendMessage(request);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetch(this.webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(createN8nPayload(request)),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new ChatProviderError(
          "PROVIDER_UNAVAILABLE",
          "Provider returned an unsuccessful status."
        );
      }

      let payload: unknown;

      try {
        payload = await response.json();
      } catch {
        throw new ChatProviderError(
          "PROVIDER_UNAVAILABLE",
          "Provider response was not valid JSON."
        );
      }

      return normalizeN8nResponse(payload, request);
    } catch (error) {
      if (error instanceof ChatProviderError) {
        throw error;
      }

      if (controller.signal.aborted || isAbortError(error)) {
        throw new ChatProviderError(
          "PROVIDER_TIMEOUT",
          "Provider request timed out."
        );
      }

      throw new ChatProviderError(
        "PROVIDER_UNAVAILABLE",
        "Provider request failed."
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
