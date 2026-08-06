import { createHash, createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  APP_OPERATION_EVENT_PROOF_TTL_SECONDS,
  appOperationEventSignaturesMatchForTests,
  buildAppOperationEventAdmissionMessage,
  buildAppOperationEventCanonicalJsonbText,
  computeAppOperationEventPayloadDigest,
  issueAppOperationEventAdmissionProof,
  type AppOperationEventProof
} from "./app-operation-event-signer";
import type { AppOperationEventSigningFields } from "./app-operation-event-types";

const workspaceA = "10000000-0000-4000-8000-000000000001";
const testSecret = "app-operation-event-test-secret-0123456789abcdef";

const eventA: AppOperationEventSigningFields = {
  eventId: "c0000000-0000-4000-8000-000000000100",
  workspaceId: workspaceA,
  category: "quote.submission",
  outcome: "failed",
  referenceType: "request_id",
  referenceValue: "app-op-request-a",
  errorCode: "provider_unavailable",
  routeKey: "/api/quote",
  httpStatus: 502,
  occurredAtMs: 1712345678000
};

const eventB: AppOperationEventSigningFields = {
  eventId: "c0000000-0000-4000-8000-000000000101",
  workspaceId: workspaceA,
  category: "admin.auth",
  outcome: "denied",
  referenceType: "none",
  referenceValue: null,
  errorCode: null,
  routeKey: "admin.gate",
  httpStatus: 403,
  occurredAtMs: 1712345678123
};

const eventC: AppOperationEventSigningFields = {
  eventId: "c0000000-0000-4000-8000-000000000102",
  workspaceId: workspaceA,
  category: "quote.submission",
  outcome: "denied",
  referenceType: "request_id",
  referenceValue: "app-op-request-c",
  errorCode: "validation_failed",
  routeKey: "/api/quote",
  httpStatus: null,
  occurredAtMs: 1712345678900
};

// Fixed PostgreSQL-17 jsonb_build_object(...)::text vectors locked through the
// disposable RLS harness (scripts/test-supabase-rls.cjs). A test that derives
// both sides from one implementation cannot pass vacuously.
const expectedCanonicalTextA =
  '{"outcome": "failed", "category": "quote.submission", ' +
  '"event_id": "c0000000-0000-4000-8000-000000000100", ' +
  '"route_key": "/api/quote", "error_code": "provider_unavailable", ' +
  '"http_status": 502, ' +
  '"workspace_id": "10000000-0000-4000-8000-000000000001", ' +
  '"occurred_at_ms": 1712345678000, "reference_type": "request_id", ' +
  '"reference_value": "app-op-request-a"}';

const expectedDigestA =
  "fd95ff0da574293e492fbfe0dd5e3920c1d4c49b90a7f716d482480178884b00";
const expectedDigestB =
  "30fc2f5956abc1d30de7f1b0add81d91ab49904c8e9b91e7fd28aca917e89208";
const expectedDigestC =
  "4b42338bfd9cd89a5f4e5eac1c56375c1cc0ce3a51ad1236d1a31ab9035146ed";

const expectedMessage =
  "skr.app_operation_event.v1\n" +
  "10000000-0000-4000-8000-000000000001\n" +
  "c0000000-0000-4000-8000-000000000100\n" +
  "fd95ff0da574293e492fbfe0dd5e3920c1d4c49b90a7f716d482480178884b00\n" +
  "1750000000";

const expectedSignature =
  "fcb5e9bac1980a40f65ccf57a8acbb1f99bf70e034555b09c0780558cf0fc8af";

function proofFor(
  fields: AppOperationEventSigningFields,
  options: { secret?: string; now?: Date } = {}
): AppOperationEventProof | null {
  return issueAppOperationEventAdmissionProof(fields, {
    env: { APP_OPERATION_EVENT_ADMISSION_SECRET: options.secret ?? testSecret },
    ...(options.now ? { now: () => options.now! } : {})
  });
}

describe("app operation event canonical signing", () => {
  it("reproduces the exact PostgreSQL-17 jsonb_build_object text bytes", () => {
    expect(buildAppOperationEventCanonicalJsonbText(eventA)).toBe(
      expectedCanonicalTextA
    );
    expect(
      Buffer.byteLength(
        buildAppOperationEventCanonicalJsonbText(eventA),
        "utf8"
      )
    ).toBe(Buffer.byteLength(expectedCanonicalTextA, "utf8"));
  });

  it("computes the locked SHA-256 digests for all-non-null, null, and status-null fields", () => {
    expect(computeAppOperationEventPayloadDigest(eventA)).toBe(expectedDigestA);
    expect(computeAppOperationEventPayloadDigest(eventB)).toBe(expectedDigestB);
    expect(computeAppOperationEventPayloadDigest(eventC)).toBe(expectedDigestC);
  });

  it("matches the PostgreSQL helper across every nullable field as null", () => {
    expect(computeAppOperationEventPayloadDigest(eventB)).toBe(expectedDigestB);
    expect(computeAppOperationEventPayloadDigest(eventC)).toBe(expectedDigestC);
  });

  it("canonicalises UUIDs to lowercase text", () => {
    const upperCaseEvent: AppOperationEventSigningFields = {
      ...eventA,
      eventId: eventA.eventId.toUpperCase(),
      workspaceId: eventA.workspaceId.toUpperCase()
    };

    expect(computeAppOperationEventPayloadDigest(upperCaseEvent)).toBe(
      expectedDigestA
    );
  });

  it("handles millisecond integers without scientific notation or loss", () => {
    const text = buildAppOperationEventCanonicalJsonbText(eventA);

    expect(text).toContain('"occurred_at_ms": 1712345678000');
    expect(text).not.toContain("e+");
    expect(text).not.toContain("E+");
  });

  it("fails when field order is mutated", () => {
    const mutated: AppOperationEventSigningFields = {
      ...eventA,
      routeKey: "mutated-route",
      errorCode: eventA.routeKey
    };

    expect(computeAppOperationEventPayloadDigest(mutated)).not.toBe(
      expectedDigestA
    );
  });

  it("fails when seconds are used instead of milliseconds", () => {
    const secondsEvent: AppOperationEventSigningFields = {
      ...eventA,
      occurredAtMs: 1712345678
    };

    expect(computeAppOperationEventPayloadDigest(secondsEvent)).not.toBe(
      expectedDigestA
    );
  });

  it("fails when a single payload field is mutated", () => {
    const mutations: Array<
      (fields: AppOperationEventSigningFields) => AppOperationEventSigningFields
    > = [
      (fields) => ({ ...fields, category: "admin.auth" as const }),
      (fields) => ({ ...fields, outcome: "denied" as const }),
      (fields) => ({ ...fields, referenceValue: "other-reference" }),
      (fields) => ({ ...fields, httpStatus: 503 })
    ];

    for (const mutate of mutations) {
      expect(computeAppOperationEventPayloadDigest(mutate(eventA))).not.toBe(
        expectedDigestA
      );
    }
  });

  it("builds the exact HMAC admission message", () => {
    expect(
      buildAppOperationEventAdmissionMessage(
        eventA.workspaceId,
        eventA.eventId,
        expectedDigestA,
        1750000000
      )
    ).toBe(expectedMessage);
  });

  it("signs a valid proof with a 60-second lifetime and the locked signature", () => {
    const now = new Date(1_749_999_940_000);
    const proof = proofFor(eventA, { now });

    expect(proof).not.toBeNull();
    expect(proof!.payloadDigest).toBe(expectedDigestA);
    expect(proof!.expiresAt).toBe(1_750_000_000);
    expect(proof!.signature).toBe(expectedSignature);
    expect(APP_OPERATION_EVENT_PROOF_TTL_SECONDS).toBe(60);
  });

  it("fails closed with a wrong key", () => {
    const proof = proofFor(eventA, {
      secret: "another-test-secret-that-is-long-enough-0123456789"
    });

    expect(proof).not.toBeNull();
    expect(proof!.signature).not.toBe(expectedSignature);
  });

  it("fails closed when the secret is missing or shorter than 32 UTF-8 bytes", () => {
    expect(
      issueAppOperationEventAdmissionProof(eventA, { env: {} })
    ).toBeNull();
    expect(
      issueAppOperationEventAdmissionProof(eventA, {
        env: { APP_OPERATION_EVENT_ADMISSION_SECRET: undefined }
      })
    ).toBeNull();
    expect(
      issueAppOperationEventAdmissionProof(eventA, {
        env: { APP_OPERATION_EVENT_ADMISSION_SECRET: null }
      })
    ).toBeNull();
    expect(
      proofFor(eventA, { secret: "short-secret" })
    ).toBeNull();
    expect(
      proofFor(eventA, { secret: "x".repeat(31) })
    ).toBeNull();
  });

  it("never includes the secret value in proof output", () => {
    const proof = proofFor(eventA);

    const serialized = JSON.stringify(proof);

    expect(serialized).not.toContain(testSecret);
    expect(serialized).not.toContain("app-operation-event");
  });

  it("compares signatures in constant time over decoded hex buffers", () => {
    const proof = proofFor(eventA)!;

    expect(
      appOperationEventSignaturesMatchForTests(proof.signature, proof.signature)
    ).toBe(true);
    expect(
      appOperationEventSignaturesMatchForTests(
        proof.signature,
        "0".repeat(64)
      )
    ).toBe(false);
    expect(
      appOperationEventSignaturesMatchForTests(proof.signature, "a")
    ).toBe(false);
  });

  it("keeps independent digest recomputation identical for the locked vectors", () => {
    const independentDigest = createHash("sha256")
      .update(expectedCanonicalTextA, "utf8")
      .digest("hex");

    expect(independentDigest).toBe(expectedDigestA);
    const independentSignature = createHmac("sha256", testSecret)
      .update(expectedMessage, "utf8")
      .digest("hex");

    expect(independentSignature).toBe(expectedSignature);
  });
});
