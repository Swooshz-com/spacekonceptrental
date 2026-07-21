import "server-only";

import { logApplicationError } from "../../../lib/application-error-logging";
import { getTrustedClientIpHeader as getConfiguredTrustedClientIpHeader } from "../../../lib/server-runtime-config";
import { getChatProvider } from "../../../lib/chat/provider-factory";
import { applyChatbotLaunchBoundary } from "../../../lib/chat/launch-boundary";
import {
  ChatProviderError,
  type ChatProvider,
  type ChatProviderResponse,
  type ChatProviderRequest
} from "../../../lib/chat/provider";
import { IdempotentOperationStore } from "../../../lib/chat/idempotent-operation";

const CHAT_ERROR_MESSAGE =
  "An error occurred while sending the chat message. Please try again.";
const MAX_REQUEST_BODY_BYTES = 64 * 1024;
const MAX_ID_LENGTH = 128;
const MAX_MESSAGE_CONTENT_LENGTH = 4_000;
const MAX_CONTEXT_BYTES = 8 * 1024;
const MAX_LOCALE_LENGTH = 35;
const MAX_TIMEZONE_LENGTH = 64;
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;
const IDEMPOTENCY_TTL_MS = 10 * 60_000;
const MAX_IP_RATE_LIMIT_BUCKETS = 1_000;
const MAX_SESSION_RATE_LIMIT_BUCKETS = 1_000;
const MAX_IDEMPOTENCY_ENTRIES = 1_000;
const FALLBACK_RATE_LIMIT_BUCKET_KEY = "untrusted-client-ip";

type ValidationResult =
  | { ok: true; value: ChatProviderRequest }
  | { ok: false; message: string };
type BodyReadResult =
  | { ok: true; payload: unknown }
  | { ok: false; response: Response };
type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  resetAtTime: number;
};
type RateLimitBucket = {
  count: number;
  resetAt: number;
};
type RateLimitMetadata = {
  remaining: number;
  resetAt: string;
};

const ipRateLimitBuckets = new Map<string, RateLimitBucket>();
const sessionRateLimitBuckets = new Map<string, RateLimitBucket>();
const idempotencyOperations = new IdempotentOperationStore<
  ChatProviderResponse,
  RateLimitMetadata
>({ maxEntries: MAX_IDEMPOTENCY_ENTRIES, ttlMs: IDEMPOTENCY_TTL_MS });

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

function getJsonByteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

function validateMaxLength(
  value: string | undefined,
  fieldName: string,
  maxLength: number
): string | undefined {
  if (value && value.length > maxLength) {
    return `${fieldName} must be ${maxLength} characters or fewer.`;
  }

  return undefined;
}

function validatePayload(payload: unknown, requestId: string): ValidationResult {
  if (!isRecord(payload)) {
    return { ok: false, message: "Request body must be a JSON object." };
  }

  const conversationId = getString(payload, "conversationId");
  const clientSessionId = getString(payload, "clientSessionId");
  const clientMessageId = getString(payload, "clientMessageId");
  const idLengthError =
    validateMaxLength(conversationId, "conversationId", MAX_ID_LENGTH) ??
    validateMaxLength(clientSessionId, "clientSessionId", MAX_ID_LENGTH) ??
    validateMaxLength(clientMessageId, "clientMessageId", MAX_ID_LENGTH);

  if (idLengthError) {
    return { ok: false, message: idLengthError };
  }

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

  const contentLengthError = validateMaxLength(
    content,
    "message.content",
    MAX_MESSAGE_CONTENT_LENGTH
  );

  if (contentLengthError) {
    return { ok: false, message: contentLengthError };
  }

  const context = isRecord(payload.context) ? payload.context : undefined;

  if (context && getJsonByteLength(context) > MAX_CONTEXT_BYTES) {
    return {
      ok: false,
      message: `context must be ${MAX_CONTEXT_BYTES} bytes or fewer.`
    };
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

  const locale = getString(payload, "locale") ?? "en-SG";
  const timezone = getString(payload, "timezone") ?? "Asia/Singapore";
  const localeLengthError =
    validateMaxLength(locale, "locale", MAX_LOCALE_LENGTH) ??
    validateMaxLength(timezone, "timezone", MAX_TIMEZONE_LENGTH);

  if (localeLengthError) {
    return { ok: false, message: localeLengthError };
  }

  return {
    ok: true,
    value: {
      requestId,
      conversationId,
      clientSessionId,
      clientMessageId,
      message: {
        role: "user",
        content
      },
      context,
      capabilities: {
        stream: false
      },
      locale,
      timezone
    }
  };
}

async function parseBoundedJsonBody(
  request: Request,
  requestId: string
): Promise<BodyReadResult> {
  const contentLengthHeader = request.headers.get("content-length");

  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);

    if (!Number.isInteger(contentLength) || contentLength < 0) {
      return {
        ok: false,
        response: validationError(
          "Content-Length must be a non-negative integer.",
          requestId
        )
      };
    }

    if (contentLength > MAX_REQUEST_BODY_BYTES) {
      return {
        ok: false,
        response: requestTooLargeError(requestId)
      };
    }
  }

  const reader = request.body?.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let body = "";

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      bytesRead += value.byteLength;

      if (bytesRead > MAX_REQUEST_BODY_BYTES) {
        await reader.cancel();

        return {
          ok: false,
          response: requestTooLargeError(requestId)
        };
      }

      body += decoder.decode(value, { stream: true });
    }

    body += decoder.decode();
  }

  try {
    return { ok: true, payload: JSON.parse(body) };
  } catch {
    return {
      ok: false,
      response: validationError("Request body must be valid JSON.", requestId)
    };
  }
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

function requestTooLargeError(requestId: string) {
  return Response.json(
    {
      error: {
        code: "REQUEST_TOO_LARGE",
        message: `Request body must be ${MAX_REQUEST_BODY_BYTES} bytes or fewer.`
      },
      requestId
    },
    { status: 413 }
  );
}

function rateLimitError(rateLimit: RateLimitResult, requestId: string) {
  return Response.json(
    {
      error: {
        code: "RATE_LIMITED",
        message: "Too many chat requests. Please try again soon."
      },
      requestId,
      rateLimit: {
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt
      }
    },
    {
      status: 429,
      headers: {
        "retry-after": Math.max(
          1,
          Math.ceil((rateLimit.resetAtTime - Date.now()) / 1_000)
        ).toString()
      }
    }
  );
}

function idempotencyConflictError(
  rateLimit: RateLimitResult,
  requestId: string
) {
  return Response.json(
    {
      error: {
        code: "IDEMPOTENCY_CONFLICT",
        message:
          "clientMessageId was already used for a different chat request."
      },
      requestId,
      rateLimit: toRateLimitMetadata(rateLimit)
    },
    { status: 409 }
  );
}

function providerError(error: unknown, requestId: string, request?: Request) {
  const code =
    error instanceof ChatProviderError ? error.code : "CHAT_ERROR";
  const status = code === "PROVIDER_TIMEOUT" ? 504 : 503;

  logApplicationError({
    category: code,
    reference: requestId,
    request,
    route: "POST /api/chat",
    statusCode: status
  });

  return Response.json(
    {
      error: {
        code,
        message: CHAT_ERROR_MESSAGE,
        reference: requestId
      },
      requestId
    },
    { status }
  );
}

function toRateLimitMetadata(rateLimit: RateLimitResult): RateLimitMetadata {
  return {
    remaining: rateLimit.remaining,
    resetAt: rateLimit.resetAt
  };
}

function chatResponse(
  providerResponse: ChatProviderResponse,
  rateLimit: RateLimitMetadata
) {
  return Response.json({
    ...providerResponse,
    rateLimit
  });
}

function getTrustedClientIpHeader() {
  return getConfiguredTrustedClientIpHeader("chat");
}

function getClientIpFromHeader(request: Request, headerName: string) {
  const headerValue = request.headers.get(headerName);

  if (!headerValue) {
    return undefined;
  }

  const [clientIp] = headerValue.split(",");
  const trimmed = clientIp?.trim();

  return trimmed || undefined;
}

function getClientIp(request: Request) {
  const trustedHeader = getTrustedClientIpHeader();

  if (!trustedHeader) {
    return undefined;
  }

  return getClientIpFromHeader(request, trustedHeader);
}

function pruneRateLimitBuckets(
  buckets: Map<string, RateLimitBucket>,
  maxBuckets: number,
  now: number
) {
  if (buckets.size <= maxBuckets) {
    return;
  }

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }

  while (buckets.size > maxBuckets) {
    const oldestKey = buckets.keys().next().value;

    if (!oldestKey) {
      break;
    }

    buckets.delete(oldestKey);
  }
}

function getRateLimitBucket(
  buckets: Map<string, RateLimitBucket>,
  key: string,
  now: number
): RateLimitBucket {
  let bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucket = {
      count: 0,
      resetAt: now + RATE_LIMIT_WINDOW_MS
    };
    buckets.set(key, bucket);
  }

  return bucket;
}

function toRateLimitResult(
  bucket: RateLimitBucket,
  allowed: boolean
): RateLimitResult {
  return {
    allowed,
    remaining: allowed
      ? Math.max(0, RATE_LIMIT_MAX_REQUESTS - bucket.count)
      : 0,
    resetAt: new Date(bucket.resetAt).toISOString(),
    resetAtTime: bucket.resetAt
  };
}

function consumeRateLimit(
  request: Request,
  providerRequest: ChatProviderRequest
): RateLimitResult {
  const now = Date.now();
  const clientIp = getClientIp(request);
  const clientBucketKey = clientIp
    ? `ip:${clientIp}`
    : FALLBACK_RATE_LIMIT_BUCKET_KEY;

  pruneRateLimitBuckets(ipRateLimitBuckets, MAX_IP_RATE_LIMIT_BUCKETS, now);
  pruneRateLimitBuckets(
    sessionRateLimitBuckets,
    MAX_SESSION_RATE_LIMIT_BUCKETS,
    now
  );

  const ipBucket = getRateLimitBucket(ipRateLimitBuckets, clientBucketKey, now);

  pruneRateLimitBuckets(ipRateLimitBuckets, MAX_IP_RATE_LIMIT_BUCKETS, now);

  if (ipBucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return toRateLimitResult(ipBucket, false);
  }

  const sessionBucket = getRateLimitBucket(
    sessionRateLimitBuckets,
    providerRequest.clientSessionId,
    now
  );

  pruneRateLimitBuckets(
    sessionRateLimitBuckets,
    MAX_SESSION_RATE_LIMIT_BUCKETS,
    now
  );

  if (sessionBucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return toRateLimitResult(sessionBucket, false);
  }

  ipBucket.count += 1;
  sessionBucket.count += 1;

  return toRateLimitResult(
    ipBucket.count >= sessionBucket.count ? ipBucket : sessionBucket,
    true
  );
}

export function resetChatRouteStateForTests() {
  ipRateLimitBuckets.clear();
  sessionRateLimitBuckets.clear();
  idempotencyOperations.clear();
}

function getIdempotencyKey(request: ChatProviderRequest) {
  return [
    request.clientSessionId,
    request.conversationId ?? "new",
    request.clientMessageId
  ].join(":");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function getFingerprintPayload(request: ChatProviderRequest) {
  return {
    conversationId: request.conversationId ?? null,
    clientSessionId: request.clientSessionId,
    clientMessageId: request.clientMessageId,
    message: {
      role: request.message.role,
      content: request.message.content
    },
    context: request.context ?? null,
    locale: request.locale,
    timezone: request.timezone
  };
}

async function createRequestFingerprint(request: ChatProviderRequest) {
  const data = new TextEncoder().encode(
    stableStringify(getFingerprintPayload(request))
  );
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}


export async function handleChatPost(
  request: Request,
  provider: ChatProvider
): Promise<Response> {
  const requestId = createRequestId();
  const bodyRead = await parseBoundedJsonBody(request, requestId);

  if (!bodyRead.ok) {
    return bodyRead.response;
  }

  const payload = bodyRead.payload;
  const validation = validatePayload(payload, requestId);
  if (!validation.ok) {
    return validationError(validation.message, requestId);
  }

  const fingerprint = await createRequestFingerprint(validation.value);
  const idempotency = idempotencyOperations.start({
    key: getIdempotencyKey(validation.value),
    fingerprint,
    createMetadata: () => {
      const rateLimit = consumeRateLimit(request, validation.value);
      return rateLimit.allowed
        ? { ok: true as const, metadata: toRateLimitMetadata(rateLimit) }
        : { ok: false as const, reason: rateLimit };
    },
    execute: async () =>
      applyChatbotLaunchBoundary(await provider.sendMessage(validation.value))
  });

  if (idempotency.status === "conflict") {
    const rateLimit = consumeRateLimit(request, validation.value);
    return rateLimit.allowed
      ? idempotencyConflictError(rateLimit, requestId)
      : rateLimitError(rateLimit, requestId);
  }

  if (idempotency.status === "denied") {
    return rateLimitError(idempotency.reason, requestId);
  }

  if (idempotency.status === "capacity") {
    return providerError(
      new Error("Chat idempotency capacity is unavailable."),
      requestId,
      request
    );
  }

  try {
    const providerResponse = await idempotency.promise;
    return chatResponse(providerResponse, idempotency.metadata);
  } catch (error) {
    return providerError(error, requestId, request);
  }
}

export async function POST(request: Request) {
  try {
    return await handleChatPost(request, getChatProvider());
  } catch (error) {
    return providerError(error, createRequestId(), request);
  }
}
