import { describe, expect, it } from "vitest";

import {
  appOperationEventSinkStateLabel,
  appOperationEventSinkStateLabels
} from "./app-operation-event-sink-display";

describe("app operation event sink state display", () => {
  it("covers exactly the five locked sink states", () => {
    expect(Object.keys(appOperationEventSinkStateLabels).sort()).toEqual([
      "disabled",
      "misconfigured",
      "ready",
      "temporarily_unavailable",
      "unconfigured"
    ]);
  });

  it.each([
    ["disabled", "Disabled"],
    ["ready", "Ready"],
    ["unconfigured", "Unconfigured"],
    ["temporarily_unavailable", "Temporarily unavailable"],
    ["misconfigured", "Misconfigured"]
  ])("renders a public-safe bounded label for %s", (state, label) => {
    expect(appOperationEventSinkStateLabel(state as never)).toBe(label);
  });

  it("keeps all labels public-safe and free of configuration values", () => {
    for (const label of Object.values(appOperationEventSinkStateLabels)) {
      expect(label).not.toMatch(/secret|token|key|webhook|url|hmac/i);
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    }
  });
});
