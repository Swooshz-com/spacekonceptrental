import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export const QUOTE_ADMISSION_PROOF_TTL_SECONDS = 60;
const MIN_SECRET_LENGTH = 32;

type QuoteAdmissionProofInput = {
  workspaceId: string;
  submissionRequestId: string;
  payloadDigest: string;
};

type QuoteAdmissionProofOptions = {
  env?: { QUOTE_SUBMISSION_ADMISSION_SECRET?: string | null };
  now?: () => Date;
};

export type QuoteAdmissionProof = {
  expiresAt: number;
  payloadDigest: string;
  signature: string;
};

export function buildQuoteAdmissionMessage(
  input: QuoteAdmissionProofInput,
  expiresAt: number
) {
  return [
    "skr.quote.submit.v1",
    input.workspaceId,
    input.submissionRequestId,
    input.payloadDigest,
    expiresAt.toString()
  ].join("\n");
}

export function issueQuoteAdmissionProof(
  input: QuoteAdmissionProofInput,
  options: QuoteAdmissionProofOptions = {}
): QuoteAdmissionProof | null {
  const secret = (
    options.env ?? process.env
  ).QUOTE_SUBMISSION_ADMISSION_SECRET?.trim();

  if (
    !secret ||
    secret.length < MIN_SECRET_LENGTH ||
    !/^[a-f0-9]{64}$/.test(input.payloadDigest)
  ) {
    return null;
  }

  const now = options.now?.() ?? new Date();
  const expiresAt =
    Math.floor(now.getTime() / 1_000) + QUOTE_ADMISSION_PROOF_TTL_SECONDS;
  const signature = createHmac("sha256", secret)
    .update(buildQuoteAdmissionMessage(input, expiresAt))
    .digest("hex");

  return { expiresAt, payloadDigest: input.payloadDigest, signature };
}

export function signaturesMatchForTests(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}
