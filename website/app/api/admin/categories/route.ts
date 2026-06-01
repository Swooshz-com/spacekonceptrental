import "server-only";

import type { NextRequest } from "next/server";
import { handleAdminProductWriteRoute } from "../../../../lib/products/persistence/admin-product-write-route";

export async function POST(request: NextRequest) {
  return handleAdminProductWriteRoute(request, {
    action: "createCategory",
    operation: "category.write"
  });
}
