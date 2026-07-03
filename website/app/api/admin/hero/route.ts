import { type NextRequest } from "next/server";

import { handleAdminHomepageHeroWriteRoute } from "../../../../lib/hero/admin-homepage-hero-write-route";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return handleAdminHomepageHeroWriteRoute(request);
}
