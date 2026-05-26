import "server-only";

import { getChatProvider } from "../../../lib/chat/provider-factory";
import {
  ChatProviderError,
  type ChatProvider,
  type ChatProviderResponse,
  type ChatProviderRequest
} from "../../../lib/chat/provider";

const FALLBACK_MESSAGE =
  "The assistant is temporarily unavailable. Please leave your contact details and the team will follow up.";
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
// Configure only with a deployment header overwritten by a trusted proxy/CDN.
// User-supplied forwarding headers must not be trusted by default.
const TRUSTED_CLIENT_IP_HEADERS = new Set([
  "cf-connecting-ip",
  "fly-client-ip",
  "x-real-ip",
  "x-vercel-forwarded-for",
  "x-forwarded-for"
]);

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
type IdempotencyEntry = {
  expiresAt: number;
  fingerprint: string;
  rateLimit: RateLimitMetadata;
  promise?: Promise<ChatProviderResponse>;
  response?: ChatProviderResponse;
};
type IdempotencyLookup =
  | { status: "hit"; entry: IdempotencyEntry }
  | { status: "conflict" }
  | { status: "miss"; key: string; fingerprint: string };

const ipRateLimitBuckets = new Map<string, RateLimitBucket>();
const sessionRateLimitBuckets = new Map<string, RateLimitBucket>();
const idempotencyEntries = new Map<string, IdempotencyEntry>();

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
  const headerName = process.env.CHAT_TRUSTED_CLIENT_IP_HEADER
    ?.trim()
    .toLowerCase();

  if (!headerName || !TRUSTED_CLIENT_IP_HEADERS.has(headerName)) {
    return undefined;
  }

  return headerName;
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

  pruneRateLimitBuckets(ipRateLimitBuckets, MAX_IP_RATE_LIMIT_BUCKETS, now);
  pruneRateLimitBuckets(
    sessionRateLimitBuckets,
    MAX_SESSION_RATE_LIMIT_BUCKETS,
    now
  );

  const ipBucket = clientIp
    ? getRateLimitBucket(ipRateLimitBuckets, clientIp, now)
    : undefined;

  pruneRateLimitBuckets(ipRateLimitBuckets, MAX_IP_RATE_LIMIT_BUCKETS, now);

  if (ipBucket && ipBucket.count >= RATE_LIMIT_MAX_REQUESTS) {
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

  if (ipBucket) {
    ipBucket.count += 1;
  }

  sessionBucket.count += 1;

  return toRateLimitResult(
    ipBucket && ipBucket.count >= sessionBucket.count
      ? ipBucket
      : sessionBucket,
    true
  );
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

function pruneIdempotencyEntries(now: number) {
  if (idempotencyEntries.size <= MAX_IDEMPOTENCY_ENTRIES) {
    return;
  }

  for (const [key, entry] of idempotencyEntries) {
    if (entry.expiresAt <= now) {
      idempotencyEntries.delete(key);
    }
  }

  while (idempotencyEntries.size > MAX_IDEMPOTENCY_ENTRIES) {
    const oldestKey = idempotencyEntries.keys().next().value;

    if (!oldestKey) {
      break;
    }

    idempotencyEntries.delete(oldestKey);
  }
}

async function getIdempotencyLookup(
  providerRequest: ChatProviderRequest
): Promise<IdempotencyLookup> {
  const now = Date.now();
  const key = getIdempotencyKey(providerRequest);
  const fingerprint = await createRequestFingerprint(providerRequest);
  const cached = idempotencyEntries.get(key);

  pruneIdempotencyEntries(now);

  if (!cached) {
    return { status: "miss", key, fingerprint };
  }

  if (cached.expiresAt <= now) {
    idempotencyEntries.delete(key);
    return { status: "miss", key, fingerprint };
  }

  if (cached.fingerprint !== fingerprint) {
    return { status: "conflict" };
  }

  return { status: "hit", entry: cached };
}

async function sendMessageOnce(
  provider: ChatProvider,
  providerRequest: ChatProviderRequest,
  idempotency: Extract<IdempotencyLookup, { status: "miss" }>,
  rateLimit: RateLimitMetadata
): Promise<ChatProviderResponse> {
  const now = Date.now();
  const promise = provider.sendMessage(providerRequest);

  idempotencyEntries.set(idempotency.key, {
    expiresAt: now + IDEMPOTENCY_TTL_MS,
    fingerprint: idempotency.fingerprint,
    rateLimit,
    promise
  });

  try {
    const response = await promise;

    idempotencyEntries.set(idempotency.key, {
      expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
      fingerprint: idempotency.fingerprint,
      rateLimit,
      response
    });

    return response;
  } catch (error) {
    const current = idempotencyEntries.get(idempotency.key);

    if (current?.promise === promise) {
      idempotencyEntries.delete(idempotency.key);
    }

    throw error;
  }
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

  const idempotency = await getIdempotencyLookup(validation.value);

  if (idempotency.status === "hit") {
    const providerResponse =
      idempotency.entry.response ?? (await idempotency.entry.promise);

    if (!providerResponse) {
      return providerError(
        new Error("Missing idempotent chat response."),
        requestId
      );
    }

    return chatResponse(providerResponse, idempotency.entry.rateLimit);
  }

  const rateLimit = consumeRateLimit(request, validation.value);

  if (!rateLimit.allowed) {
    return rateLimitError(rateLimit, requestId);
  }

  if (idempotency.status === "conflict") {
    return idempotencyConflictError(rateLimit, requestId);
  }

  try {
    const rateLimitMetadata = toRateLimitMetadata(rateLimit);
    const providerResponse = await sendMessageOnce(
      provider,
      validation.value,
      idempotency,
      rateLimitMetadata
    );

    return chatResponse(providerResponse, rateLimitMetadata);
  } catch (error) {
    return providerError(error, requestId);
  }
}

export async function POST(request: Request) {
  try {
    return await handleChatPost(request, getChatProvider());
  } catch (error) {
    return providerError(error, createRequestId());
  }
}
