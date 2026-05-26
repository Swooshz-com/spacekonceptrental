import "server-only";

import { getChatProvider } from "../../../lib/chat/placeholder-provider";
import {
  ChatProviderError,
  type ChatProvider,
  type ChatProviderRequest
} from "../../../lib/chat/provider";

const FALLBACK_MESSAGE =
  "The assistant is temporarily unavailable. Please leave your contact details and the team will follow up.";

type ValidationResult =
  | { ok: true; value: ChatProviderRequest }
  | { ok: false; message: string };

function createRequestId() {
  return crypto.randomUUID();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getString(
  source: Record<string, unknown>,
  key: string
): string | undefined {
  const value = source[key];
  return typeof value === "string" ? value.trim() : undefined;
}

function validatePayload(payload: unknown, requestId: string): ValidationResult {
  if (!isRecord(payload)) {
    return { ok: false, message: "Request body must be a JSON object." };
  }

  const clientSessionId = getString(payload, "clientSessionId");
  const clientMessageId = getString(payload, "clientMessageId");

  if (!clientSessionId) {
    return { ok: false, message: "clientSessionId is required." };
  }

  if (!clientMessageId) {
    return { ok: false, message: "clientMessageId is required." };
  }

  if (!isRecord(payload.message)) {
    return { ok: false, message: "message is required." };
  }

  const role = getString(payload.message, "role");
  const content = getString(payload.message, "content");

  if (role !== "user") {
    return { ok: false, message: "message.role must be user." };
  }

  if (!content) {
    return { ok: false, message: "message.content is required." };
  }

  const capabilities = isRecord(payload.capabilities)
    ? payload.capabilities
    : {};

  if (capabilities.stream === true) {
    return {
      ok: false,
      message: "Streaming chat is not supported in Phase 1."
    };
  }

  return {
    ok: true,
    value: {
      requestId,
      conversationId: getString(payload, "conversationId"),
      clientSessionId,
      clientMessageId,
      message: {
        role: "user",
        content
      },
      context: isRecord(payload.context) ? payload.context : undefined,
      capabilities: {
        stream: false
      },
      locale: getString(payload, "locale") ?? "en-SG",
      timezone: getString(payload, "timezone") ?? "Asia/Singapore"
    }
  };
}

function validationError(message: string, requestId: string) {
  return Response.json(
    {
      error: {
        code: "VALIDATION_FAILED",
        message
      },
      requestId
    },
    { status: 400 }
  );
}

function providerError(error: unknown, requestId: string) {
  const code =
    error instanceof ChatProviderError ? error.code : "CHAT_ERROR";
  const status = code === "PROVIDER_TIMEOUT" ? 504 : 503;

  return Response.json(
    {
      error: {
        code,
        message: FALLBACK_MESSAGE
      },
      requestId
    },
    { status }
  );
}

export async function handleChatPost(
  request: Request,
  provider: ChatProvider
): Promise<Response> {
  const requestId = createRequestId();
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return validationError("Request body must be valid JSON.", requestId);
  }

  const validation = validatePayload(payload, requestId);
  if (!validation.ok) {
    return validationError(validation.message, requestId);
  }

  try {
    const providerResponse = await provider.sendMessage(validation.value);

    return Response.json({
      ...providerResponse,
      rateLimit: {
        remaining: 5,
        resetAt: new Date(Date.now() + 60_000).toISOString()
      }
    });
  } catch (error) {
    return providerError(error, requestId);
  }
}

export async function POST(request: Request) {
  return handleChatPost(request, getChatProvider());
}
