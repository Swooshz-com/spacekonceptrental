import "server-only";

import type { NextRequest } from "next/server";
import { handleAdminQuoteRequestHubSpotImportCsvRoute } from "../../../../../../lib/quote/admin-read/admin-quote-request-hubspot-import-csv-route";

export async function POST(request: NextRequest) {
  return handleAdminQuoteRequestHubSpotImportCsvRoute(request);
}
