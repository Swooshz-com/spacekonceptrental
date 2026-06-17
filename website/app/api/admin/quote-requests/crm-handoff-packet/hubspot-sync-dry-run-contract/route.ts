import type { NextRequest } from "next/server";

import { handleAdminQuoteRequestHubSpotSyncDryRunContractRoute } from "../../../../../../lib/quote/admin-read/admin-quote-request-hubspot-sync-dry-run-contract-route";

export async function POST(request: NextRequest) {
  return handleAdminQuoteRequestHubSpotSyncDryRunContractRoute(request);
}
