import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  buildQuoteAdmissionMessage,
  issueQuoteAdmissionProof,
  signaturesMatchForTests
} from "./quote-admission-proof";

const input = {
  workspaceId: "10000000-0000-4000-8000-000000000001",
  submissionRequestId: "submission-1",
  payloadDigest: "a".repeat(64)
};
const secret = "quote-admission-test-secret-32-characters";

describe("quote admission proof", () => {
  it("issues a short-lived purpose-separated proof bound to the durable payload digest", () => {
    const proof = issueQuoteAdmissionProof(input, {
      env: { QUOTE_SUBMISSION_ADMISSION_SECRET: secret },
      now: () => new Date("2026-07-21T00:00:00.000Z")
    });
    expect(proof).not.toBeNull();
    if (!proof) throw new Error("Expected proof.");
    const expected = createHmac("sha256", secret)
      .update(buildQuoteAdmissionMessage(input, proof.expiresAt))
      .digest("hex");
    expect(signaturesMatchForTests(proof.signature, expected)).toBe(true);
    expect(proof.expiresAt).toBe(1784592060);
  });

  it("fails closed for missing, weak, or malformed proof inputs", () => {
    expect(issueQuoteAdmissionProof(input, { env: {} })).toBeNull();
    expect(issueQuoteAdmissionProof(input, { env: { QUOTE_SUBMISSION_ADMISSION_SECRET: "weak" } })).toBeNull();
    expect(issueQuoteAdmissionProof({ ...input, payloadDigest: "not-a-digest" }, { env: { QUOTE_SUBMISSION_ADMISSION_SECRET: secret } })).toBeNull();
  });
});
