import "server-only";

import type { NextRequest } from "next/server";
import { handleAdminProductWriteRoute } from "../../../../../../lib/products/persistence/admin-product-write-route";

type ProductPublishRouteContext = {
  params: Promise<{
    productId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  context: ProductPublishRouteContext
) {
  const { productId } = await context.params;

  return handleAdminProductWriteRoute(request, {
    action: "publishProduct",
    operation: "product.write",
    recordId: productId
  });
}
