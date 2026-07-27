import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  QUOTE_SUBMISSION_ENABLED,
  isQuoteSubmissionEnabled
} from "./submission-capability";

describe("quote submission capability", () => {
  it("is compile-time fixed to disabled and ignores environment configuration", () => {
    const source = readFileSync(
      resolve(process.cwd(), "lib/quote/submission-capability.ts"),
      "utf8"
    );

    expect(QUOTE_SUBMISSION_ENABLED).toBe(false);
    expect(isQuoteSubmissionEnabled()).toBe(false);
    expect(source).not.toContain("process.env");
  });
});
