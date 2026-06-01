import "server-only";

import type { NextRequest } from "next/server";
import { handleAdminProductWriteRoute } from "../../../../../../lib/products/persistence/admin-product-write-route";

type ProductRouteContext = {
  params: Promise<{
    productId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  context: ProductRouteContext
) {
  const { productId } = await context.params;

  return handleAdminProductWriteRoute(request, {
    action: "archiveProduct",
    operation: "product.write",
    recordId: productId
  });
}
