import "server-only";

import type { AppOperationEventOperationsRecord } from "./app-operation-event-operations-mapper";
import type {
  AppOperationEventCategory,
  AppOperationEventOutcome
} from "./app-operation-event-types";
import {
  appOperationEventCategories,
  appOperationEventOutcomes
} from "./app-operation-event-types";

export type AppOperationEventOperationsSummary = {
  total: number;
  byCategory: Record<AppOperationEventCategory, number>;
  byOutcome: Record<AppOperationEventOutcome, number>;
};

/**
 * Derives bounded counts only from the loaded (maximum-200) rows. No separate
 * count or aggregate query exists.
 */
export function summariseAppOperationEventOperations(
  records: AppOperationEventOperationsRecord[]
): AppOperationEventOperationsSummary {
  const byCategory = Object.fromEntries(
    appOperationEventCategories.map((category) => [category, 0])
  ) as Record<AppOperationEventCategory, number>;
  const byOutcome = Object.fromEntries(
    appOperationEventOutcomes.map((outcome) => [outcome, 0])
  ) as Record<AppOperationEventOutcome, number>;

  for (const record of records) {
    byCategory[record.category] += 1;
    byOutcome[record.outcome] += 1;
  }

  return {
    total: records.length,
    byCategory,
    byOutcome
  };
}
