import { describe, expect, it } from "vitest";
import {
  getQuoteHrefForListing,
  normalizePublicListingSlug,
  normalizePublicQuoteQuantity
} from "./quote-handoff";

describe("catalogue quote handoff", () => {
  it("creates only the bounded single-listing fallback", () => {
    expect(getQuoteHrefForListing("lounge-chair")).toBe(
      "/quote?listing=lounge-chair&qty=1"
    );
  });

  it.each(["1", "99"])("accepts quantity boundary %s", (quantity) => {
    expect(normalizePublicQuoteQuantity(quantity)).toBe(Number(quantity));
  });

  it.each(["0", "100", "1.5", "1e2", "Infinity", "NaN", "", " 1"])(
    "rejects malformed or forged quantity %s",
    (quantity) => {
      expect(normalizePublicQuoteQuantity(quantity)).toBeUndefined();
    }
  );

  it("rejects malformed listing references", () => {
    expect(normalizePublicListingSlug("../private")).toBeUndefined();
    expect(normalizePublicListingSlug("chair?workspace=forged")).toBeUndefined();
  });
});
