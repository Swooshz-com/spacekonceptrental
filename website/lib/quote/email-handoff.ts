import "server-only";

import { createHmac } from "node:crypto";

import { getQuoteEmailHandoffRuntimeConfig } from "../server-runtime-config";
import type { QuoteSubmission } from "./types";

export type QuoteEmailProviderName = "n8n";
export type QuoteEmailDeliveryStatus =
  | "pending"
  | "delivered"
  | "failed"
  | "not_configured";


export type QuoteEnquiryEmailConfigStatus = {
  provider: QuoteEmailProviderName;
  handoffMode: "n8n";
  handoffConfigured: boolean;
  webhookConfigured: boolean;
  sharedSecretConfigured: boolean;
  timeoutMs: number;
  missingReason?: string;
};

export type QuoteEmailHandoffInput = {
  quote: QuoteSubmission;
  quoteRequestId: string;
  publicReference: string;
  requestId: string;
  request?: Request;
};

export type QuoteEmailHandoffResult =
  | {
      ok: true;
      status: "delivered" | "pending";
      provider: QuoteEmailProviderName;
      idempotencyKey: string;
      providerMessageId?: string;
    }
  | {
      ok: false;
      status: "failed" | "not_configured";
      provider: QuoteEmailProviderName;
      code: string;
      idempotencyKey: string;
    };

type QuoteEmailEnv = {
  [key: string]: string | null | undefined;
};

type N8nEnquiryHandoffFetch = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>;

type SendQuoteEnquiryEmailOptions = {
  env?: QuoteEmailEnv;
  fetch?: N8nEnquiryHandoffFetch;
  now?: () => Date;
};

type N8nEnquiryHandoffPayload = {
  schemaVersion: 1;
  event: "skr.enquiry.submitted";
  idempotencyKey: string;
  submittedAt: string;
  enquiry: {
    id: string;
    publicReference: string;
    source: "website";
    sourcePath?: string;
    listingSlug?: string;
  };
  contact: {
    name: string;
    email?: string;
    phone?: string;
  };
  eventContext: {
    date?: string;
    venue?: string;
    message?: string;
  };
  requestedItems: Array<{
    name: string;
    quantity: number;
    notes?: string;
  }>;
  request: {
    requestId: string;
    visitorSubmissionRequestId?: string;
  };
};

const provider: QuoteEmailProviderName = "n8n";
const maxProviderMessageIdLength = 120;
const maxErrorCodeLength = 80;

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : undefined;
}

function safeProviderMessageId(value: string | undefined) {
  const normalized = normalizeOptionalText(value);

  return normalized?.slice(0, maxProviderMessageIdLength);
}

function safeErrorCode(value: string | undefined) {
  const normalized = normalizeOptionalText(value)
    ?.toLowerCase()
    .replace(/[^a-z0-9_.:-]/g, "_")
    .slice(0, maxErrorCodeLength);

  return normalized || "n8n_handoff_failed";
}

function mapQuoteEmailConfigIssue(
  issue: ReturnType<typeof getQuoteEmailHandoffRuntimeConfig>["issues"][number]
) {
  if (issue.name === "N8N_ENQUIRY_HANDOFF_WEBHOOK_URL") {
    return issue.kind === "invalid"
      ? "n8n_webhook_invalid"
      : "n8n_webhook_not_configured";
  }

  if (issue.name === "N8N_ENQUIRY_HANDOFF_SHARED_SECRET") {
    return "n8n_shared_secret_not_configured";
  }

  if (issue.name === "N8N_ENQUIRY_HANDOFF_TIMEOUT_MS") {
    return "n8n_timeout_invalid";
  }

  return "n8n_handoff_not_configured";
}

function safeSourcePath(sourcePath: string | undefined) {
  if (!sourcePath) {
    return undefined;
  }

  try {
    const parsed = new URL(sourcePath, "https://spacekoncept.local");

    return parsed.pathname.startsWith("/") ? parsed.pathname : undefined;
  } catch {
    return sourcePath.split(/[?#]/)[0] || undefined;
  }
}

function buildIdempotencyKey(input: QuoteEmailHandoffInput) {
  return `quote-enquiry:${input.quoteRequestId}`;
}

function signPayload({
  body,
  sharedSecret,
  timestamp
}: {
  body: string;
  sharedSecret: string;
  timestamp: string;
}) {
  const signature = createHmac("sha256", sharedSecret)
    .update(`${timestamp}.${body}`)
    .digest("hex");

  return `sha256=${signature}`;
}

function getSafeN8nResultCode(status: number) {
  if (status === 408 || status === 429) {
    return "n8n_temporarily_unavailable";
  }

  if (status >= 500) {
    return "n8n_unavailable";
  }

  return "n8n_rejected";
}

function getAbortErrorCode(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
    ? "n8n_timeout"
    : "n8n_unavailable";
}

async function postWithTimeout({
  body,
  fetchImpl,
  headers,
  timeoutMs,
  webhookUrl
}: {
  body: string;
  fetchImpl: N8nEnquiryHandoffFetch;
  headers: HeadersInit;
  timeoutMs: number;
  webhookUrl: string;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetchImpl(webhookUrl, {
      method: "POST",
      headers,
      body,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}


export function resolveQuoteEnquiryEmailConfigStatus(
  env: QuoteEmailEnv = process.env
): QuoteEnquiryEmailConfigStatus {
  const config = getQuoteEmailHandoffRuntimeConfig(env);
  const firstIssue = config.issues[0];

  return {
    provider,
    handoffMode: "n8n",
    handoffConfigured: config.configured,
    webhookConfigured: config.webhookConfigured,
    sharedSecretConfigured: config.sharedSecretConfigured,
    timeoutMs: config.timeoutMs,
    ...(firstIssue ? { missingReason: mapQuoteEmailConfigIssue(firstIssue) } : {})
  };
}

export function buildQuoteEnquiryHandoffPayload(
  input: QuoteEmailHandoffInput,
  submittedAt: Date
): N8nEnquiryHandoffPayload {
  const { quote } = input;

  return {
    schemaVersion: 1,
    event: "skr.enquiry.submitted",
    idempotencyKey: buildIdempotencyKey(input),
    submittedAt: submittedAt.toISOString(),
    enquiry: {
      id: input.quoteRequestId,
      publicReference: input.publicReference,
      source: "website",
      ...(safeSourcePath(quote.sourcePath)
        ? { sourcePath: safeSourcePath(quote.sourcePath) }
        : {}),
      ...(quote.listingSlug ? { listingSlug: quote.listingSlug } : {})
    },
    contact: {
      name: quote.customerName,
      ...(quote.customerEmail ? { email: quote.customerEmail } : {}),
      ...(quote.customerPhone ? { phone: quote.customerPhone } : {})
    },
    eventContext: {
      ...(quote.eventDate ? { date: quote.eventDate } : {}),
      ...(quote.venue ? { venue: quote.venue } : {}),
      ...(quote.customerMessage ? { message: quote.customerMessage } : {})
    },
    requestedItems: quote.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      ...(item.notes ? { notes: item.notes } : {})
    })),
    request: {
      requestId: input.requestId,
      ...(quote.requestId
        ? { visitorSubmissionRequestId: quote.requestId }
        : {})
    }
  };
}

export async function sendQuoteEnquiryEmailHandoff(
  input: QuoteEmailHandoffInput,
  options: SendQuoteEnquiryEmailOptions = {}
): Promise<QuoteEmailHandoffResult> {
  const config = getQuoteEmailHandoffRuntimeConfig(options.env ?? process.env);
  const idempotencyKey = buildIdempotencyKey(input);

  if (!config.configured || !config.webhookUrl || !config.sharedSecret) {
    const firstIssue = config.issues[0];
    const code = firstIssue
      ? mapQuoteEmailConfigIssue(firstIssue)
      : "n8n_handoff_not_configured";


    return {
      ok: false,
      status: "not_configured",
      provider,
      code,
      idempotencyKey
    };
  }

  const submittedAt = (options.now ?? (() => new Date()))();
  const payload = buildQuoteEnquiryHandoffPayload(input, submittedAt);
  const body = JSON.stringify(payload);
  const timestamp = submittedAt.toISOString();
  const signature = signPayload({
    body,
    sharedSecret: config.sharedSecret,
    timestamp
  });

  try {
    const response = await postWithTimeout({
      body,
      fetchImpl: options.fetch ?? fetch,
      headers: {
        "content-type": "application/json",
        "x-skr-event": "skr.enquiry.submitted",
        "x-skr-enquiry-reference": input.publicReference,
        "x-skr-idempotency-key": idempotencyKey,
        "x-skr-signature": signature,
        "x-skr-timestamp": timestamp
      },
      timeoutMs: config.timeoutMs,
      webhookUrl: config.webhookUrl
    });

    if (!response.ok) {
      const code = getSafeN8nResultCode(response.status);


      return {
        ok: false,
        status: "failed",
        provider,
        code,
        idempotencyKey
      };
    }

    const providerMessageId = safeProviderMessageId(
      response.headers.get("x-skr-handoff-id") ?? undefined
    );

    const status = response.status === 202 ? "pending" : "delivered";


    return {
      ok: true,
      status,
      provider,
      idempotencyKey,
      ...(providerMessageId ? { providerMessageId } : {})
    };
  } catch (error) {
    const code = safeErrorCode(getAbortErrorCode(error));


    return {
      ok: false,
      status: "failed",
      provider,
      code,
      idempotencyKey
    };
  }
}
