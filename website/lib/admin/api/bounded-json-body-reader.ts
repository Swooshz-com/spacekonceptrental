import "server-only";

import type { NextRequest } from "next/server";

export type BoundedBodyParseResult =
  | {
      ok: true;
      body: Record<string, unknown>;
    }
  | {
      ok: false;
      error:
        | "request_content_type_invalid"
        | "request_body_too_large"
        | "request_body_missing"
        | "request_body_malformed";
      status: number;
    };

export const ADMIN_JSON_BODY_LIMIT_BYTES = 32 * 1024; // 32 KiB
export const ADMIN_FORM_BODY_LIMIT_BYTES = 12 * 1024; // 12 KiB

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function readBoundedJsonBody(
  request: NextRequest,
  limitBytes = ADMIN_JSON_BODY_LIMIT_BYTES
): Promise<BoundedBodyParseResult> {
  const contentType = request.headers.get("content-type")?.trim().toLowerCase();

  const isValidContentType = /^application\/(?:[a-z0-9_.-]+\+)?json(?:;.*)?$/i.test(
    contentType || ""
  );

  if (!isValidContentType) {
    return {
      ok: false,
      error: "request_content_type_invalid",
      status: 415
    };
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const length = parseInt(contentLength, 10);
    if (!Number.isNaN(length) && length > limitBytes) {
      return {
        ok: false,
        error: "request_body_too_large",
        status: 413
      };
    }
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return {
      ok: false,
      error: "request_body_missing",
      status: 400
    };
  }

  let totalBytes = 0;
  const chunks: Uint8Array[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value) {
        totalBytes += value.length;
        if (totalBytes > limitBytes) {
          // Exceeded limit while streaming
          await reader.cancel();
          return {
            ok: false,
            error: "request_body_too_large",
            status: 413
          };
        }
        chunks.push(value);
      }
    }
  } catch {
    return {
      ok: false,
      error: "request_body_malformed",
      status: 400
    };
  }

  if (totalBytes === 0) {
    return {
      ok: false,
      error: "request_body_missing",
      status: 400
    };
  }

  // concat chunks and decode
  const concatenated = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    concatenated.set(chunk, offset);
    offset += chunk.length;
  }
  
  const decoder = new TextDecoder();
  const bodyText = decoder.decode(concatenated);

  if (!bodyText.trim()) {
    return {
      ok: false,
      error: "request_body_missing",
      status: 400
    };
  }

  try {
    const parsed = JSON.parse(bodyText);

    if (!isRecord(parsed)) {
      return {
        ok: false,
        error: "request_body_malformed",
        status: 400
      };
    }

    return {
      ok: true,
      body: parsed
    };
  } catch {
    return {
      ok: false,
      error: "request_body_malformed",
      status: 400
    };
  }
}

export type BoundedFormBodyParseResult =
  | {
      ok: true;
      body: URLSearchParams;
    }
  | {
      ok: false;
      error:
        | "request_content_type_invalid"
        | "request_body_too_large"
        | "request_body_missing"
        | "request_body_malformed";
      status: number;
    };

function isValidUrlEncodedFormContentType(contentType: string | null) {
  return /^application\/x-www-form-urlencoded(?:;.*)?$/i.test(
    contentType?.trim() || ""
  );
}

async function readBoundedBodyText(
  request: NextRequest,
  limitBytes: number
): Promise<
  | {
      ok: true;
      bodyText: string;
    }
  | {
      ok: false;
      error:
        | "request_body_too_large"
        | "request_body_missing"
        | "request_body_malformed";
      status: number;
    }
> {
  const contentLength = request.headers.get("content-length");

  if (contentLength) {
    const length = parseInt(contentLength, 10);

    if (!Number.isFinite(length) || length < 0) {
      return {
        ok: false,
        error: "request_body_malformed",
        status: 400
      };
    }

    if (length > limitBytes) {
      return {
        ok: false,
        error: "request_body_too_large",
        status: 413
      };
    }
  }

  const reader = request.body?.getReader();

  if (!reader) {
    return {
      ok: false,
      error: "request_body_missing",
      status: 400
    };
  }

  let totalBytes = 0;
  const chunks: Uint8Array[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      if (value) {
        totalBytes += value.length;

        if (totalBytes > limitBytes) {
          await reader.cancel();

          return {
            ok: false,
            error: "request_body_too_large",
            status: 413
          };
        }

        chunks.push(value);
      }
    }
  } catch {
    return {
      ok: false,
      error: "request_body_malformed",
      status: 400
    };
  }

  if (totalBytes === 0) {
    return {
      ok: false,
      error: "request_body_missing",
      status: 400
    };
  }

  const concatenated = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    concatenated.set(chunk, offset);
    offset += chunk.length;
  }

  return {
    ok: true,
    bodyText: new TextDecoder().decode(concatenated)
  };
}

export async function readBoundedUrlEncodedFormBody(
  request: NextRequest,
  limitBytes = ADMIN_FORM_BODY_LIMIT_BYTES
): Promise<BoundedFormBodyParseResult> {
  const contentType = request.headers.get("content-type");

  if (!isValidUrlEncodedFormContentType(contentType)) {
    return {
      ok: false,
      error: "request_content_type_invalid",
      status: 415
    };
  }

  const bodyText = await readBoundedBodyText(request, limitBytes);

  if (!bodyText.ok) {
    return bodyText;
  }

  if (!bodyText.bodyText.trim()) {
    return {
      ok: false,
      error: "request_body_missing",
      status: 400
    };
  }

  try {
    return {
      ok: true,
      body: new URLSearchParams(bodyText.bodyText)
    };
  } catch {
    return {
      ok: false,
      error: "request_body_malformed",
      status: 400
    };
  }
}
