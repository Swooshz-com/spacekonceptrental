import { afterEach, describe, expect, it, vi } from "vitest";
import { handleQuotePost, POST } from "./route";

const envKeys = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "QUOTE_WORKSPACE_ID"
] as const;
const originalEnv = new Map(
  envKeys.map((key) => [key, process.env[key]])
);

const validPayload = {
  customerName: "Maya Tan",
  customerEmail: "maya@example.test",
  customerPhone: "+65 8123 4567",
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
