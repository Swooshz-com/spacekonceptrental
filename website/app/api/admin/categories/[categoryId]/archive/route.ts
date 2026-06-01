import "server-only";

import type { NextRequest } from "next/server";
import { handleAdminProductWriteRoute } from "../../../../../../lib/products/persistence/admin-product-write-route";

type CategoryRouteContext = {
  params: Promise<{
    categoryId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  context: CategoryRouteContext
) {
  const { categoryId } = await context.params;

  return handleAdminProductWriteRoute(request, {
    action: "archiveCategory",
    operation: "category.write",
    recordId: categoryId
  });
}
