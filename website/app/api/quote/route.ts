import "server-only";

import { logApplicationError } from "../../../lib/application-error-logging";
import { getTrustedClientIpHeader as getConfiguredTrustedClientIpHeader } from "../../../lib/server-runtime-config";
import {
  sendQuoteEnquiryEmailHandoff,
  type QuoteEmailHandoffInput,
  type QuoteEmailHandoffResult
} from "../../../lib/quote/email-handoff";
import { createQuoteRequest } from "../../../lib/quote/quote-repository";
import {
  finalizeQuoteHandoff,
  type QuoteHandoffFinalizationInput
} from "../../../lib/quote/quote-handoff-repository";
import type {
  QuotePersistenceResult,
  QuoteSubmission
} from "../../../lib/quote/types";
import { validateQuoteSubmission } from "../../../lib/quote/validation";

type QuoteRepository = (
  quote: QuoteSubmission
) => Promise<QuotePersistenceResult>;
type QuoteEmailHandoff = (
  input: QuoteEmailHandoffInput
) => Promise<QuoteEmailHandoffResult>;
type QuoteHandoffFinalizer = (
  input: QuoteHandoffFinalizationInput
) => ReturnType<typeof finalizeQuoteHandoff>;

type BodyReadResult =
  | { ok: true; payload: unknown }
  | { ok: false; response: Response };

const MAX_REQUEST_BODY_BYTES = 16 * 1024;
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60_000;
const MAX_CLIENT_RATE_LIMIT_BUCKETS = 1_000;
const MAX_CONTACT_RATE_LIMIT_BUCKETS = 1_000;
const FALLBACK_RATE_LIMIT_BUCKET_KEY = "untrusted-client-ip";
const FALLBACK_MESSAGE =
  "Quote requests are temporarily unavailable. Please try again later.";

function createRequestId() {
  return crypto.randomUUID();
}

type RateLimitBucket = {
  count: number;
  resetAt: number;
};
type RateLimitResult = {
  allowed: boolean;
  resetAtTime: number;
};

const clientRateLimitBuckets = new Map<string, RateLimitBucket>();
const contactRateLimitBuckets = new Map<string, RateLimitBucket>();

function isJsonRequest(request: Request) {
  const contentType = request.headers.get("content-type");

  return (
    contentType
      ?.toLowerCase()
      .split(";")[0]
      ?.trim() === "application/json"
  );
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

function unsupportedMediaTypeError(requestId: string) {
  return Response.json(
    {
      error: {
        code: "UNSUPPORTED_MEDIA_TYPE",
        message: "Request content type must be application/json."
      },
      requestId
    },
    { status: 415 }
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

function persistenceError(requestId: string, request: Request) {
  logApplicationError({
    category: "QUOTE_PERSISTENCE_UNAVAILABLE",
    reference: requestId,
    request,
    route: "POST /api/quote",
    statusCode: 503
  });

  return Response.json(
    {
      error: {
        code: "QUOTE_PERSISTENCE_UNAVAILABLE",
        message: FALLBACK_MESSAGE,
        reference: requestId
      },
      requestId
    },
    { status: 503 }
  );
}

function recordEmailHandoffApplicationError(requestId: string, request: Request) {
  logApplicationError({
    category: "QUOTE_ENQUIRY_HANDOFF_ATTEMPT_UNAVAILABLE",
    reference: requestId,
    request,
    route: "POST /api/quote",
    statusCode: 503
  });
}

function handoffPendingError(requestId: string, retryAfterSeconds = 5) {
  return Response.json(
    {
      error: {
        code: "QUOTE_HANDOFF_PENDING",
        message: FALLBACK_MESSAGE,
        reference: requestId
      },
      requestId
    },
    {
      status: 503,
      headers: { "retry-after": retryAfterSeconds.toString() }
    }
  );
}

function rateLimitError(rateLimit: RateLimitResult, requestId: string) {
  return Response.json(
    {
      error: {
        code: "RATE_LIMITED",
        message: "Too many quote requests. Please try again soon."
      },
      requestId
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

async function parseBoundedJsonBody(
  request: Request,
  requestId: string
): Promise<BodyReadResult> {
  if (!isJsonRequest(request)) {
    return {
      ok: false,
      response: unsupportedMediaTypeError(requestId)
    };
  }

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

function getTrustedClientIpHeader() {
  return getConfiguredTrustedClientIpHeader("quote");
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

function getClientBucketKey(request: Request) {
  const clientIp = getClientIp(request);

  return clientIp ? `ip:${clientIp}` : FALLBACK_RATE_LIMIT_BUCKET_KEY;
}

function getContactBucketKey(quote: QuoteSubmission) {
  return quote.customerEmail
    ? `email:${quote.customerEmail.toLowerCase()}`
    : undefined;
}

function consumeQuoteRateLimit(
  request: Request,
  quote: QuoteSubmission
): RateLimitResult {
  const now = Date.now();
  const clientBucketKey = getClientBucketKey(request);
  const contactBucketKey = getContactBucketKey(quote);

  pruneRateLimitBuckets(
    clientRateLimitBuckets,
    MAX_CLIENT_RATE_LIMIT_BUCKETS,
    now
  );
  pruneRateLimitBuckets(
    contactRateLimitBuckets,
    MAX_CONTACT_RATE_LIMIT_BUCKETS,
    now
  );

  const clientBucket = getRateLimitBucket(
    clientRateLimitBuckets,
    clientBucketKey,
    now
  );
  const contactBucket = contactBucketKey
    ? getRateLimitBucket(contactRateLimitBuckets, contactBucketKey, now)
    : undefined;

  pruneRateLimitBuckets(
    clientRateLimitBuckets,
    MAX_CLIENT_RATE_LIMIT_BUCKETS,
    now
  );
  pruneRateLimitBuckets(
    contactRateLimitBuckets,
    MAX_CONTACT_RATE_LIMIT_BUCKETS,
    now
  );

  if (clientBucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      resetAtTime: clientBucket.resetAt
    };
  }

  if (contactBucket && contactBucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      resetAtTime: contactBucket.resetAt
    };
  }

  clientBucket.count += 1;

  if (contactBucket) {
    contactBucket.count += 1;
  }

  return {
    allowed: true,
    resetAtTime: Math.min(
      clientBucket.resetAt,
      contactBucket?.resetAt ?? clientBucket.resetAt
    )
  };
}

export function resetQuoteRouteStateForTests() {
  clientRateLimitBuckets.clear();
  contactRateLimitBuckets.clear();
}

export async function handleQuotePost(
  request: Request,
  repository: QuoteRepository = createQuoteRequest,
  emailHandoff: QuoteEmailHandoff = sendQuoteEnquiryEmailHandoff,
  handoffFinalizer: QuoteHandoffFinalizer = finalizeQuoteHandoff
): Promise<Response> {
  const requestId = createRequestId();
  const bodyRead = await parseBoundedJsonBody(request, requestId);

  if (!bodyRead.ok) {
    return bodyRead.response;
  }

  const validation = validateQuoteSubmission(bodyRead.payload);

  if (!validation.ok) {
    return validationError(validation.message, requestId);
  }

  const rateLimit = consumeQuoteRateLimit(request, validation.value);

  if (!rateLimit.allowed) {
    return rateLimitError(rateLimit, requestId);
  }

  let result: QuotePersistenceResult;

  try {
    result = await repository(validation.value);
  } catch {
    return persistenceError(requestId, request);
  }

  if (!result.ok) {
    return persistenceError(requestId, request);
  }

  if (result.handoffClaimStatus === "in_progress") {
    return handoffPendingError(requestId, 300);
  }

  if (result.handoffClaimStatus === "claimed") {
    if (!result.handoffClaimToken) {
      return persistenceError(requestId, request);
    }

    let handoffResult: QuoteEmailHandoffResult;

    try {
      handoffResult = await emailHandoff({
        quote: validation.value,
        quoteRequestId: result.quoteRequestId,
        publicReference: result.publicReference,
        requestId,
        request
      });
    } catch {
      recordEmailHandoffApplicationError(requestId, request);
      await handoffFinalizer({
        quoteRequestId: result.quoteRequestId,
        submissionRequestId: validation.value.requestId,
        claimToken: result.handoffClaimToken,
        delivery: {
          status: "failed",
          requestId,
          errorCode: "handoff_exception"
        }
      }).catch(() => ({ ok: false as const }));
      return handoffPendingError(requestId);
    }

    const finalization = await handoffFinalizer({
      quoteRequestId: result.quoteRequestId,
      submissionRequestId: validation.value.requestId,
      claimToken: result.handoffClaimToken,
      delivery: handoffResult.ok
        ? {
            status: handoffResult.status,
            requestId,
            ...(handoffResult.providerMessageId
              ? { providerMessageId: handoffResult.providerMessageId }
              : {})
          }
        : {
            status: handoffResult.status,
            requestId,
            errorCode: handoffResult.code
          }
    }).catch(() => ({ ok: false as const }));

    if (!handoffResult.ok || !finalization.ok) {
      recordEmailHandoffApplicationError(requestId, request);
      return handoffPendingError(requestId);
    }
  }

  return Response.json(
    {
      status: "received",
      quoteRequestId: result.quoteRequestId,
      publicReference: result.publicReference,
      requestId
    },
    { status: 201 }
  );
}

export async function POST(request: Request) {
  return handleQuotePost(request);
}
