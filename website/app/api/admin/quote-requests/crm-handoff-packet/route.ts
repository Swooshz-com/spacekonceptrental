import "server-only";

import type { NextRequest } from "next/server";
import { handleAdminQuoteRequestCrmHandoffPacketRoute } from "../../../../../lib/quote/admin-read/admin-quote-request-crm-handoff-packet-route";

export async function POST(request: NextRequest) {
  return handleAdminQuoteRequestCrmHandoffPacketRoute(request);
}
