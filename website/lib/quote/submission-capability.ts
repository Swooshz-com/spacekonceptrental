import "server-only";

export const QUOTE_SUBMISSION_ENABLED = false as const;

export function isQuoteSubmissionEnabled() {
  return QUOTE_SUBMISSION_ENABLED;
}
