import "server-only";

import { createQuoteRequest } from "../../../lib/quote/quote-repository";
import type {
  QuotePersistenceResult,
  QuoteSubmission
} from "../../../lib/quote/types";
import { validateQuoteSubmission } from "../../../lib/quote/validation";

type QuoteRepository = (
  quote: QuoteSubmission
) => Promise<QuotePersistenceResult>;

type BodyReadResult =
  | { ok: true; payload: unknown }
  | { ok: false; response: Response };

const MAX_REQUEST_BODY_BYTES = 16 * 1024;
const FALLBACK_MESSAGE =
  "Quote requests are temporarily unavailable. Please try again later.";

function createRequestId() {
  return crypto.randomUUID();
}

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

function persistenceError(requestId: string) {
  return Response.json(
    {
      error: {
        code: "QUOTE_PERSISTENCE_UNAVAILABLE",
        message: FALLBACK_MESSAGE
      },
      requestId
    },
    { status: 503 }
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

export async function handleQuotePost(
  request: Request,
  repository: QuoteRepository = createQuoteRequest
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

  try {
    const result = await repository(validation.value);

    if (!result.ok) {
      return persistenceError(requestId);
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
  } catch {
    return persistenceError(requestId);
  }
}

export async function POST(request: Request) {
  return handleQuotePost(request);
}
