import "server-only";

import type { NextRequest } from "next/server";
import { handleAdminQuoteRequestCrmHandoffLifecycleReconciliationRoute } from "../../../../../../lib/quote/admin-read/admin-quote-request-crm-handoff-lifecycle-reconciliation-route";

export async function POST(request: NextRequest) {
  return handleAdminQuoteRequestCrmHandoffLifecycleReconciliationRoute(request);
}
