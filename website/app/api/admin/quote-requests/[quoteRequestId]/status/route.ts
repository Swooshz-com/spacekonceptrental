import "server-only";

import type { NextRequest } from "next/server";
import { handleAdminQuoteRequestStatusUpdateRoute } from "../../../../../../lib/quote/admin-write/admin-quote-request-status-route";

type QuoteRequestStatusRouteContext = {
  params: Promise<{
    quoteRequestId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  context: QuoteRequestStatusRouteContext
) {
  const { quoteRequestId } = await context.params;

  return handleAdminQuoteRequestStatusUpdateRoute(request, {
    quoteRequestId
  });
}
