import { type NextRequest } from "next/server";

import { handleAdminSetupRecipeRoute } from "../../../../lib/catalogue/admin-setup-recipe-write-route";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return handleAdminSetupRecipeRoute(request);
}
