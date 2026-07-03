import "server-only";

import { getQuoteEmailHandoffRuntimeConfig } from "../server-runtime-config";
import { recordQuoteEmailDeliveryAttempt } from "./quote-email-delivery-log-repository";
import type { QuoteSubmission } from "./types";

export type QuoteEmailProviderName = "resend";
export type QuoteEmailDeliveryStatus = "sent" | "failed" | "not_configured";

export type QuoteEmailMessage = {
  from: string;
  to: string;
  subject: string;
  text: string;
};

export type QuoteEmailProviderResult =
  | {
      ok: true;
      providerMessageId?: string;
    }
  | {
      ok: false;
      code: string;
      unsafeDetails?: unknown;
    };

export type QuoteEmailProvider = (
  message: QuoteEmailMessage
) => Promise<QuoteEmailProviderResult>;

export type QuoteEmailDeliveryLogInput = {
  quoteRequestId: string;
  publicReference: string;
  recipientEmail: string | null;
  provider: QuoteEmailProviderName;
  status: QuoteEmailDeliveryStatus;
  providerMessageId?: string;
  errorCode: string | null;
  requestId: string;
};

export type QuoteEmailDeliveryLogWriter = (
  input: QuoteEmailDeliveryLogInput
) => Promise<{ ok: true } | { ok: false; code: string }>;

export type QuoteEnquiryEmailConfigStatus = {
  provider: QuoteEmailProviderName;
  providerConfigured: boolean;
  recipientConfigured: boolean;
  recipientEmail?: string;
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
      status: "sent";
      provider: QuoteEmailProviderName;
      providerMessageId?: string;
    }
  | {
      ok: false;
      status: "failed" | "not_configured";
      provider: QuoteEmailProviderName;
      code: string;
    };

type QuoteEmailEnv = {
  [key: string]: string | null | undefined;
  QUOTE_ENQUIRY_EMAIL_PROVIDER?: string | null;
  QUOTE_ENQUIRY_EMAIL_RECIPIENT?: string | null;
  QUOTE_ENQUIRY_EMAIL_FROM?: string | null;
  RESEND_API_KEY?: string | null;
};

type ResolvedQuoteEmailConfig = QuoteEnquiryEmailConfigStatus & {
  fromEmail?: string;
  resendApiKey?: string;
  recipientEmailRaw?: string;
};

type SendQuoteEnquiryEmailOptions = {
  deliveryLog?: QuoteEmailDeliveryLogWriter;
  env?: QuoteEmailEnv;
  now?: () => Date;
  provider?: QuoteEmailProvider;
};

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

  return normalized || "email_provider_failed";
}

export function resolveQuoteEnquiryEmailConfigStatus(
  env: QuoteEmailEnv = process.env
): QuoteEnquiryEmailConfigStatus {
  const resolved = resolveQuoteEnquiryEmailConfig(env);

  return {
    provider: resolved.provider,
    providerConfigured: resolved.providerConfigured,
    recipientConfigured: resolved.recipientConfigured,
    ...(resolved.recipientEmail ? { recipientEmail: resolved.recipientEmail } : {}),
    ...(resolved.missingReason ? { missingReason: resolved.missingReason } : {})
  };
}

function resolveQuoteEnquiryEmailConfig(
  env: QuoteEmailEnv = process.env
): ResolvedQuoteEmailConfig {
  const config = getQuoteEmailHandoffRuntimeConfig(env);
  const firstIssue = config.issues[0];

  return {
    provider: config.provider,
    providerConfigured: config.providerConfigured,
    recipientConfigured: config.recipientConfigured,
    ...(config.recipientEmail ? { recipientEmail: config.recipientEmail } : {}),
    ...(config.recipientEmailRaw
      ? { recipientEmailRaw: config.recipientEmailRaw }
      : {}),
    ...(config.fromEmail ? { fromEmail: config.fromEmail } : {}),
    ...(config.resendApiKey ? { resendApiKey: config.resendApiKey } : {}),
    ...(firstIssue ? { missingReason: mapQuoteEmailConfigIssue(firstIssue) } : {})
  };
}

function mapQuoteEmailConfigIssue(
  issue: ReturnType<typeof getQuoteEmailHandoffRuntimeConfig>["issues"][number]
) {
  if (issue.name === "QUOTE_ENQUIRY_EMAIL_RECIPIENT") {
    return "email_recipient_not_configured";
  }

  if (issue.name === "QUOTE_ENQUIRY_EMAIL_FROM") {
    return "email_from_not_configured";
  }

  if (issue.name === "RESEND_API_KEY") {
    return "email_provider_api_key_not_configured";
  }

  if (issue.reason === "unsupported_provider") {
    return "email_provider_unsupported";
  }

  return "email_provider_not_configured";
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

function formatOptionalLine(label: string, value: string | undefined) {
  return value ? [`${label}: ${value}`] : [];
}

function formatSelectedItems(items: QuoteSubmission["items"]) {
  if (items.length === 0) {
    return ["Selected rental items: None provided"];
  }

  return [
    "Selected rental items:",
    ...items.map((item, index) => {
      const base = `${index + 1}. ${item.productName} - quantity ${item.quantity}`;

      return item.notes ? `${base} - notes: ${item.notes}` : base;
    })
  ];
}

export function buildQuoteEnquiryEmailText(
  input: QuoteEmailHandoffInput,
  submittedAt: Date
) {
  const { quote } = input;

  return [
    "New SpaceKonceptRental rental enquiry",
    "",
    `Public reference: ${input.publicReference}`,
    `Submitted timestamp: ${submittedAt.toISOString()}`,
    `Customer name: ${quote.customerName}`,
    ...formatOptionalLine("Customer email", quote.customerEmail),
    ...formatOptionalLine("Customer phone", quote.customerPhone),
    ...formatOptionalLine("Event date", quote.eventDate),
    ...formatOptionalLine("Venue", quote.venue),
    ...formatOptionalLine("Customer message", quote.customerMessage),
    ...formatOptionalLine("Source path", safeSourcePath(quote.sourcePath)),
    ...formatOptionalLine("Listing slug", quote.listingSlug),
    "",
    ...formatSelectedItems(quote.items),
    "",
    `Safe request/reference id: ${input.requestId} / ${input.quoteRequestId}`
  ].join("\n");
}

async function sendResendEmail(
  apiKey: string,
  message: QuoteEmailMessage
): Promise<QuoteEmailProviderResult> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        from: message.from,
        to: message.to,
        subject: message.subject,
        text: message.text
      })
    });

    if (!response.ok) {
      return {
        ok: false,
        code: response.status >= 500 ? "provider_unavailable" : "provider_rejected"
      };
    }

    const payload = (await response.json().catch(() => null)) as
      | { id?: unknown }
      | null;
    const providerMessageId =
      typeof payload?.id === "string" ? safeProviderMessageId(payload.id) : undefined;

    return {
      ok: true,
      ...(providerMessageId ? { providerMessageId } : {})
    };
  } catch {
    return {
      ok: false,
      code: "provider_unavailable"
    };
  }
}

function buildDefaultProvider(config: ResolvedQuoteEmailConfig): QuoteEmailProvider {
  return (message) => sendResendEmail(config.resendApiKey ?? "", message);
}

async function recordDeliveryAttempt(
  deliveryLog: QuoteEmailDeliveryLogWriter,
  input: QuoteEmailHandoffInput,
  attempt: Omit<QuoteEmailDeliveryLogInput, "quoteRequestId" | "publicReference" | "requestId">
) {
  await deliveryLog({
    quoteRequestId: input.quoteRequestId,
    publicReference: input.publicReference,
    requestId: input.requestId,
    ...attempt
  }).catch(() => ({ ok: false as const, code: "delivery_log_unavailable" }));
}

export async function sendQuoteEnquiryEmailHandoff(
  input: QuoteEmailHandoffInput,
  options: SendQuoteEnquiryEmailOptions = {}
): Promise<QuoteEmailHandoffResult> {
  const config = resolveQuoteEnquiryEmailConfig(options.env ?? process.env);
  const deliveryLog = options.deliveryLog ?? recordQuoteEmailDeliveryAttempt;

  if (!config.recipientConfigured || !config.providerConfigured) {
    const code = config.missingReason ?? "email_provider_not_configured";

    await recordDeliveryAttempt(deliveryLog, input, {
      recipientEmail: config.recipientEmailRaw ?? null,
      provider: config.provider,
      status: "not_configured",
      errorCode: code
    });

    return {
      ok: false,
      status: "not_configured",
      provider: config.provider,
      code
    };
  }

  const message: QuoteEmailMessage = {
    from: config.fromEmail ?? "",
    to: config.recipientEmailRaw ?? "",
    subject: `New SKR quote request ${input.publicReference}`,
    text: buildQuoteEnquiryEmailText(input, (options.now ?? (() => new Date()))())
  };
  const provider = options.provider ?? buildDefaultProvider(config);
  const providerResult = await provider(message);

  if (!providerResult.ok) {
    const code = safeErrorCode(providerResult.code);

    await recordDeliveryAttempt(deliveryLog, input, {
      recipientEmail: config.recipientEmailRaw ?? null,
      provider: config.provider,
      status: "failed",
      errorCode: code
    });

    return {
      ok: false,
      status: "failed",
      provider: config.provider,
      code
    };
  }

  const providerMessageId = safeProviderMessageId(
    providerResult.providerMessageId
  );

  await recordDeliveryAttempt(deliveryLog, input, {
    recipientEmail: config.recipientEmailRaw ?? null,
    provider: config.provider,
    status: "sent",
    ...(providerMessageId ? { providerMessageId } : {}),
    errorCode: null
  });

  return {
    ok: true,
    status: "sent",
    provider: config.provider,
    ...(providerMessageId ? { providerMessageId } : {})
  };
}
