import { type NextRequest } from "next/server";

import { handleAdminQuoteRequestHubSpotManualImportOutcomeRoute } from "../../../../../../../lib/quote/admin-read/admin-quote-request-hubspot-manual-import-outcome-route";

export async function POST(request: NextRequest) {
  return handleAdminQuoteRequestHubSpotManualImportOutcomeRoute(request);
}
