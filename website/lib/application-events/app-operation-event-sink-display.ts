import "server-only";

import type { AppOperationEventSinkState } from "./app-operation-event-types";

export const appOperationEventSinkStateLabels: Record<
  AppOperationEventSinkState,
  string
> = Object.freeze({
  disabled: "Disabled",
  ready: "Ready",
  unconfigured: "Unconfigured",
  temporarily_unavailable: "Temporarily unavailable",
  misconfigured: "Misconfigured"
});

export function appOperationEventSinkStateLabel(
  state: AppOperationEventSinkState
): string {
  return appOperationEventSinkStateLabels[state];
}
