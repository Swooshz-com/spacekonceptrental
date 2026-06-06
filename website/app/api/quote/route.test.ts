import { afterEach, describe, expect, it, vi } from "vitest";
import { handleQuotePost, POST, resetQuoteRouteStateForTests } from "./route";

const envKeys = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "QUOTE_WORKSPACE_ID",
  "QUOTE_TRUSTED_CLIENT_IP_HEADER"
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

    const response = await handleQuotePost(postJson(validPayload), repository);
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
  });

  it("uses a fallback rate-limit bucket when no trusted client IP source is available", async () => {
    delete process.env.QUOTE_TRUSTED_CLIENT_IP_HEADER;

    const repository = vi.fn(async () => ({
      ok: true as const,
      quoteRequestId: "70000000-0000-4000-8000-000000000001",
      publicReference: "QR-20260527-ABC12345"
    }));

    for (let index = 0; index < 5; index += 1) {
      const response = await handleQuotePost(
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

    const blocked = await handleQuotePost(
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
      const response = await handleQuotePost(
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
      const response = await handleQuotePost(
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

    const blocked = await handleQuotePost(
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
      const response = await handleQuotePost(
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

    const blocked = await handleQuotePost(
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
      const response = await handleQuotePost(
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

    const blocked = await handleQuotePost(
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
      const response = await handleQuotePost(
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

    const blocked = await handleQuotePost(
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

    const response = await handleQuotePost(
      postJson({ ...validPayload, customerEmail: "not-an-email" }),
      repository
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_FAILED");
    expect(body.error.message).toContain("customerEmail");
    expect(repository).not.toHaveBeenCalled();
  });

  it("enforces JSON content type and bounded body size", async () => {
    const repository = vi.fn();

    const wrongType = await handleQuotePost(
      postRaw(JSON.stringify(validPayload), { "content-type": "text/plain" }),
      repository
    );
    const oversized = await handleQuotePost(
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
    const repository = vi.fn(async () => ({
      ok: false as const,
      code: "SUPABASE_NOT_CONFIGURED" as const,
      missingEnv: ["SUPABASE_URL", "SUPABASE_ANON_KEY"] as const
    }));

    const response = await handleQuotePost(postJson(validPayload), repository);
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("QUOTE_PERSISTENCE_UNAVAILABLE");
    expect(serialized).not.toContain("SUPABASE_URL");
    expect(serialized).not.toContain("SUPABASE_ANON_KEY");
    expect(serialized).not.toContain("Maya");
    expect(serialized).not.toContain("example.test");
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
