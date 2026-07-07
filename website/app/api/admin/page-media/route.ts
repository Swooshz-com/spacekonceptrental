import { type NextRequest } from "next/server";

import { handleAdminPublicPageMediaWriteRoute } from "../../../../lib/page-media/admin-public-page-media-write-route";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return handleAdminPublicPageMediaWriteRoute(request);
}
