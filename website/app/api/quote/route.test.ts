import { afterEach, describe, expect, it, vi } from "vitest";
import { handleQuotePost, POST, resetQuoteRouteStateForTests } from "./route";

const envKeys = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "QUOTE_WORKSPACE_ID",
  "QUOTE_TRUSTED_CLIENT_IP_HEADER",
  "QUOTE_ENQUIRY_EMAIL_PROVIDER",
  "QUOTE_ENQUIRY_EMAIL_RECIPIENT",
  "QUOTE_ENQUIRY_EMAIL_FROM",
  "RESEND_API_KEY"
] as const;
const originalEnv = new Map(
  envKeys.map((key) => [key, process.env[key]])
);

const validPayload = {
  customerName: "Maya Tan",
  customerEmail: "maya@example.test",
  customerPhone: "+65 8123 4567",
  customerMessage:
    "Please recommend a warm lounge setup for a corporate reception.",
  eventDate: "2026-06-12",
  venue: "Marina Bay Sands",
  items: [
    {
      productName: "Modular lounge set",
      quantity: 2,
      notes: "VIP reception area"
    }
  ]
};

function postJson(
  payload: unknown,
  headers: Record<string, string> = {}
) {
  return new Request("http://localhost/api/quote", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "content-type": "application/json", ...headers }
  });
}

function postRaw(body: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/quote", {
    method: "POST",
    body,
    headers
  });
}

function restoreEnv() {
  for (const key of envKeys) {
    const originalValue = originalEnv.get(key);

    if (originalValue === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalValue;
    }
  }
}

function successfulEmailHandoff() {
  return vi.fn(async () => ({
    ok: true as const,
    status: "sent" as const,
    provider: "resend" as const,
    providerMessageId: "resend-message-1"
  }));
}

function handleQuotePostWithEmail(
  request: Request,
  repository: Parameters<typeof handleQuotePost>[1]
) {
  return handleQuotePost(request, repository, successfulEmailHandoff());
}

describe("POST /api/quote", () => {
  afterEach(() => {
    restoreEnv();
    resetQuoteRouteStateForTests();
    vi.restoreAllMocks();
  });

  it("accepts a valid quote payload and calls the server quote repository", async () => {
    const repository = vi.fn(async () => ({
      ok: true as const,
      quoteRequestId: "70000000-0000-4000-8000-000000000001",
      publicReference: "QR-20260527-ABC12345"
    }));

    const emailHandoff = vi.fn(async () => ({
      ok: true as const,
      status: "sent" as const,
      provider: "resend" as const,
      providerMessageId: "resend-message-1"
    }));

    const response = await handleQuotePost(
      postJson(validPayload),
      repository,
      emailHandoff
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({
      status: "received",
      quoteRequestId: "70000000-0000-4000-8000-000000000001",
      publicReference: "QR-20260527-ABC12345",
      requestId: expect.any(String)
    });
    expect(repository).toHaveBeenCalledWith({
      customerName: "Maya Tan",
      customerEmail: "maya@example.test",
      customerPhone: "+65 8123 4567",
      customerMessage:
        "Please recommend a warm lounge setup for a corporate reception.",
      eventDate: "2026-06-12",
      venue: "Marina Bay Sands",
      items: [
        {
          productName: "Modular lounge set",
          quantity: 2,
          notes: "VIP reception area"
        }
      ]
    });
    expect(emailHandoff).toHaveBeenCalledWith(
      expect.objectContaining({
        quote: expect.objectContaining({
          customerName: "Maya Tan",
          customerEmail: "maya@example.test"
        }),
        quoteRequestId: "70000000-0000-4000-8000-000000000001",
        publicReference: "QR-20260527-ABC12345",
        requestId: body.requestId,
        request: expect.any(Request)
      })
    );
  });

  it("fails safely when enquiry email handoff is not configured", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const repository = vi.fn(async () => ({
      ok: true as const,
      quoteRequestId: "70000000-0000-4000-8000-000000000001",
      publicReference: "QR-20260527-ABC12345"
    }));
    const emailHandoff = vi.fn(async () => ({
      ok: false as const,
      status: "not_configured" as const,
      provider: "resend" as const,
      code: "email_recipient_not_configured"
    }));

    const response = await handleQuotePost(
      postJson(validPayload),
      repository,
      emailHandoff
    );
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(503);
    expect(body.error).toEqual({
      code: "QUOTE_EMAIL_HANDOFF_UNAVAILABLE",
      message: "Quote requests are temporarily unavailable. Please try again later.",
      reference: body.requestId
    });
    expect(repository).toHaveBeenCalledTimes(1);
    expect(emailHandoff).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      "application_error",
      expect.objectContaining({
        category: "QUOTE_EMAIL_HANDOFF_UNAVAILABLE",
        errorReference: body.requestId,
        method: "POST",
        path: "/api/quote",
        route: "POST /api/quote",
        statusCode: 503
      })
    );
    expect(serialized).not.toContain("email_recipient_not_configured");
    expect(serialized).not.toContain("RESEND_API_KEY");
    expect(serialized).not.toContain("Maya");
    expect(serialized).not.toContain("example.test");
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain("Maya");
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain("example.test");
  });

  it("fails safely when the enquiry email provider fails", async () => {
    const repository = vi.fn(async () => ({
      ok: true as const,
      quoteRequestId: "70000000-0000-4000-8000-000000000001",
      publicReference: "QR-20260527-ABC12345"
    }));
    const emailHandoff = vi.fn(async () => ({
      ok: false as const,
      status: "failed" as const,
      provider: "resend" as const,
      code: "provider_rejected",
      unsafeDetails: "401 SECRET raw provider body"
    }));

    const response = await handleQuotePost(
      postJson(validPayload),
      repository,
      emailHandoff
    );
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("QUOTE_EMAIL_HANDOFF_UNAVAILABLE");
    expect(body.error.reference).toBe(body.requestId);
    expect(serialized).not.toContain("provider_rejected");
    expect(serialized).not.toContain("SECRET");
    expect(serialized).not.toContain("raw provider body");
  });

  it("categorizes unexpected enquiry email handoff exceptions as email failures", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const repository = vi.fn(async () => ({
      ok: true as const,
      quoteRequestId: "70000000-0000-4000-8000-000000000001",
      publicReference: "QR-20260527-ABC12345"
    }));
    const emailHandoff = vi.fn(async () => {
      throw new Error("RESEND_API_KEY exploded with raw provider body");
    });

    const response = await handleQuotePost(
      postJson(validPayload),
      repository,
      emailHandoff
    );
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(503);
    expect(body.error).toEqual({
      code: "QUOTE_EMAIL_HANDOFF_UNAVAILABLE",
      message: "Quote requests are temporarily unavailable. Please try again later.",
      reference: body.requestId
    });
    expect(repository).toHaveBeenCalledTimes(1);
    expect(emailHandoff).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      "application_error",
      expect.objectContaining({
        category: "QUOTE_EMAIL_HANDOFF_UNAVAILABLE",
        errorReference: body.requestId,
        route: "POST /api/quote",
        statusCode: 503
      })
    );
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(
      "QUOTE_PERSISTENCE_UNAVAILABLE"
    );
    expect(serialized).not.toContain("RESEND_API_KEY");
    expect(serialized).not.toContain("raw provider body");
  });

  it("uses a fallback rate-limit bucket when no trusted client IP source is available", async () => {
    delete process.env.QUOTE_TRUSTED_CLIENT_IP_HEADER;

    const repository = vi.fn(async () => ({
      ok: true as const,
      quoteRequestId: "70000000-0000-4000-8000-000000000001",
      publicReference: "QR-20260527-ABC12345"
    }));

    for (let index = 0; index < 5; index += 1) {
      const response = await handleQuotePostWithEmail(
        postJson(
          {
            ...validPayload,
            customerEmail: `maya-${index}@example.test`
          },
          { "x-forwarded-for": `198.51.100.${index}` }
        ),
        repository
      );

      expect(response.status).toBe(201);
    }

    const blocked = await handleQuotePostWithEmail(
      postJson(
        {
          ...validPayload,
          customerEmail: "maya-blocked@example.test"
        },
        {
          "cf-connecting-ip": "203.0.113.220",
          "x-forwarded-for": "203.0.113.221"
        }
      ),
      repository
    );
    const body = await blocked.json();

    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toMatch(/^[1-9]\d*$/);
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(repository).toHaveBeenCalledTimes(5);
  });

  it("uses a configured trusted client IP header to separate buckets", async () => {
    process.env.QUOTE_TRUSTED_CLIENT_IP_HEADER = "cf-connecting-ip";

    const repository = vi.fn(async () => ({
      ok: true as const,
      quoteRequestId: crypto.randomUUID(),
      publicReference: "QR-20260527-ABC12345"
    }));

    for (let index = 0; index < 5; index += 1) {
      const response = await handleQuotePostWithEmail(
        postJson(
          {
            ...validPayload,
            customerEmail: `trusted-a-${index}@example.test`
          },
          { "cf-connecting-ip": "203.0.113.10" }
        ),
        repository
      );

      expect(response.status).toBe(201);
    }

    for (let index = 0; index < 5; index += 1) {
      const response = await handleQuotePostWithEmail(
        postJson(
          {
            ...validPayload,
            customerEmail: `trusted-b-${index}@example.test`
          },
          { "cf-connecting-ip": "203.0.113.11" }
        ),
        repository
      );

      expect(response.status).toBe(201);
    }

    const blocked = await handleQuotePostWithEmail(
      postJson(
        {
          ...validPayload,
          customerEmail: "trusted-a-blocked@example.test"
        },
        { "cf-connecting-ip": "203.0.113.10" }
      ),
      repository
    );

    expect(blocked.status).toBe(429);
    expect(repository).toHaveBeenCalledTimes(10);
  });

  it("ignores user-supplied forwarding headers unless explicitly configured as trusted", async () => {
    delete process.env.QUOTE_TRUSTED_CLIENT_IP_HEADER;

    const repository = vi.fn(async () => ({
      ok: true as const,
      quoteRequestId: crypto.randomUUID(),
      publicReference: "QR-20260527-ABC12345"
    }));

    for (let index = 0; index < 5; index += 1) {
      const response = await handleQuotePostWithEmail(
        postJson(
          {
            ...validPayload,
            customerEmail: `spoofed-${index}@example.test`
          },
          { "x-forwarded-for": `198.51.100.${index}` }
        ),
        repository
      );

      expect(response.status).toBe(201);
    }

    const blocked = await handleQuotePostWithEmail(
      postJson(
        {
          ...validPayload,
          customerEmail: "spoofed-blocked@example.test"
        },
        { "x-forwarded-for": "198.51.100.200" }
      ),
      repository
    );

    expect(blocked.status).toBe(429);
    expect(repository).toHaveBeenCalledTimes(5);
  });

  it("throttles repeated normalized email submissions across trusted client IP buckets", async () => {
    process.env.QUOTE_TRUSTED_CLIENT_IP_HEADER = "cf-connecting-ip";

    const repository = vi.fn(async () => ({
      ok: true as const,
      quoteRequestId: crypto.randomUUID(),
      publicReference: "QR-20260527-ABC12345"
    }));

    for (let index = 0; index < 5; index += 1) {
      const response = await handleQuotePostWithEmail(
        postJson(
          {
            ...validPayload,
            customerEmail: "  Maya.Repeated@Example.Test  "
          },
          { "cf-connecting-ip": `203.0.113.${index + 40}` }
        ),
        repository
      );

      expect(response.status).toBe(201);
    }

    const blocked = await handleQuotePostWithEmail(
      postJson(
        {
          ...validPayload,
          customerEmail: "maya.repeated@example.test"
        },
        { "cf-connecting-ip": "203.0.113.99" }
      ),
      repository
    );

    expect(blocked.status).toBe(429);
    expect(repository).toHaveBeenCalledTimes(5);
  });

  it("returns a safe 429 without leaking internal throttling details", async () => {
    process.env.QUOTE_TRUSTED_CLIENT_IP_HEADER = "cf-connecting-ip";

    const repository = vi.fn(async () => ({
      ok: true as const,
      quoteRequestId: crypto.randomUUID(),
      publicReference: "QR-20260527-ABC12345"
    }));
    const headers = {
      "cf-connecting-ip": "203.0.113.77",
      "x-forwarded-for": "198.51.100.77"
    };

    for (let index = 0; index < 5; index += 1) {
      const response = await handleQuotePostWithEmail(
        postJson(
          {
            ...validPayload,
            customerEmail: `safe-limit-${index}@example.test`
          },
          headers
        ),
        repository
      );

      expect(response.status).toBe(201);
    }

    const blocked = await handleQuotePostWithEmail(
      postJson(
        {
          ...validPayload,
          customerEmail: "safe-limit-blocked@example.test"
        },
        headers
      ),
      repository
    );
    const body = await blocked.json();
    const serialized = JSON.stringify(body);

    expect(blocked.status).toBe(429);
    expect(body).toEqual({
      error: {
        code: "RATE_LIMITED",
        message: "Too many quote requests. Please try again soon."
      },
      requestId: expect.any(String)
    });
    expect(serialized).not.toContain("203.0.113.77");
    expect(serialized).not.toContain("198.51.100.77");
    expect(serialized).not.toContain("cf-connecting-ip");
    expect(serialized).not.toContain("x-forwarded-for");
    expect(serialized).not.toContain("fallback");
    expect(serialized).not.toContain("bucket");
    expect(serialized).not.toContain("SUPABASE");
    expect(serialized).not.toContain("Supabase");
    expect(serialized).not.toContain("quote_requests");
    expect(serialized).not.toContain("stack");
    expect(repository).toHaveBeenCalledTimes(5);
  });

  it("rejects invalid payloads before calling the repository", async () => {
    const repository = vi.fn();

    const response = await handleQuotePostWithEmail(
      postJson({ ...validPayload, customerEmail: "not-an-email" }),
      repository
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_FAILED");
    expect(body.error.message).toBe(
      "customerEmail must be a valid email address."
    );
    expect(JSON.stringify(body)).not.toContain("not-an-email");
    expect(repository).not.toHaveBeenCalled();
  });

  it("persists safe public source metadata and blocks public CRM overrides", async () => {
    const repository = vi.fn(async () => ({
      ok: true as const,
      quoteRequestId: "70000000-0000-4000-8000-000000000001",
      publicReference: "QR-20260527-ABC12345"
    }));

    const response = await handleQuotePostWithEmail(
      postJson({
        ...validPayload,
        sourcePath: "/quote?listing=modular-lounge-set",
        listingSlug: "modular-lounge-set",
        requestId: "8f6d5b35-5827-4093-b59f-e683fa9f6fdb"
      }),
      repository
    );

    expect(response.status).toBe(201);
    expect(repository).toHaveBeenCalledWith(
      expect.objectContaining({
        sourcePath: "/quote?listing=modular-lounge-set",
        listingSlug: "modular-lounge-set",
        requestId: "8f6d5b35-5827-4093-b59f-e683fa9f6fdb"
      })
    );

    const override = await handleQuotePostWithEmail(
      postJson({
        ...validPayload,
        crm_provider: "hubspot",
        crm_sync_status: "synced",
        crm_contact_id: "contact-123"
      }),
      repository
    );
    const body = await override.json();

    expect(override.status).toBe(400);
    expect(body.error.message).toBe(
      "Request body contains unknown field: crm_provider."
    );
    expect(repository).toHaveBeenCalledTimes(1);
  });

  it("enforces JSON content type and bounded body size", async () => {
    const repository = vi.fn();

    const wrongType = await handleQuotePostWithEmail(
      postRaw(JSON.stringify(validPayload), { "content-type": "text/plain" }),
      repository
    );
    const oversized = await handleQuotePostWithEmail(
      postJson({
        ...validPayload,
        venue: "x".repeat(20_000)
      }),
      repository
    );

    expect(wrongType.status).toBe(415);
    expect((await wrongType.json()).error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
    expect(oversized.status).toBe(413);
    expect((await oversized.json()).error.code).toBe("REQUEST_TOO_LARGE");
    expect(repository).not.toHaveBeenCalled();
  });

  it("fails safely when quote persistence is not configured", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const repository = vi.fn(async () => ({
      ok: false as const,
      code: "SUPABASE_NOT_CONFIGURED" as const,
      missingEnv: ["SUPABASE_URL", "SUPABASE_ANON_KEY"] as const
    }));

    const response = await handleQuotePostWithEmail(postJson(validPayload), repository);
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("QUOTE_PERSISTENCE_UNAVAILABLE");
    expect(body.error.reference).toBe(body.requestId);
    expect(errorSpy).toHaveBeenCalledWith(
      "application_error",
      expect.objectContaining({
        category: "QUOTE_PERSISTENCE_UNAVAILABLE",
        errorReference: body.requestId,
        method: "POST",
        path: "/api/quote",
        route: "POST /api/quote",
        statusCode: 503,
        timestamp: expect.any(String)
      })
    );
    const serializedLog = JSON.stringify(errorSpy.mock.calls);
    expect(serialized).not.toContain("SUPABASE_URL");
    expect(serialized).not.toContain("SUPABASE_ANON_KEY");
    expect(serialized).not.toContain("Maya");
    expect(serialized).not.toContain("example.test");
    expect(serializedLog).not.toContain("SUPABASE_URL");
    expect(serializedLog).not.toContain("SUPABASE_ANON_KEY");
    expect(serializedLog).not.toContain("Maya");
    expect(serializedLog).not.toContain("example.test");
  });

  it("fails safely from the real route when Supabase server env is missing", async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    process.env.QUOTE_WORKSPACE_ID =
      "11111111-1111-4111-8111-111111111111";

    const response = await POST(postJson(validPayload));
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("QUOTE_PERSISTENCE_UNAVAILABLE");
    expect(serialized).not.toContain("SUPABASE_URL");
    expect(serialized).not.toContain("SUPABASE_ANON_KEY");
    expect(serialized).not.toContain("Maya");
    expect(serialized).not.toContain("example.test");
  });
});
