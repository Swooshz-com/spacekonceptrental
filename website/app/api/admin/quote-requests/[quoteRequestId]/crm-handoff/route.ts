import "server-only";

import type { NextRequest } from "next/server";
import { handleAdminQuoteRequestCrmHandoffStatusUpdateRoute } from "../../../../../../lib/quote/admin-write/admin-quote-request-crm-handoff-route";

type QuoteRequestCrmHandoffRouteContext = {
  params: Promise<{
    quoteRequestId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  context: QuoteRequestCrmHandoffRouteContext
) {
  const { quoteRequestId } = await context.params;

  return handleAdminQuoteRequestCrmHandoffStatusUpdateRoute(request, {
    quoteRequestId
  });
}
