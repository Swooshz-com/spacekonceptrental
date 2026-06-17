import "server-only";

import type { NextRequest } from "next/server";
import { handleAdminQuoteRequestHubSpotImportCsvPreflightRoute } from "../../../../../../../lib/quote/admin-read/admin-quote-request-hubspot-import-csv-preflight-route";

export async function POST(request: NextRequest) {
  return handleAdminQuoteRequestHubSpotImportCsvPreflightRoute(request);
}
