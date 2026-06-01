import "server-only";

import type { NextRequest } from "next/server";
import { handleAdminProductWriteRoute } from "../../../../../../lib/products/persistence/admin-product-write-route";

type ProductImageRouteContext = {
  params: Promise<{
    imageId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  context: ProductImageRouteContext
) {
  const { imageId } = await context.params;

  return handleAdminProductWriteRoute(request, {
    action: "archiveProductImage",
    operation: "productImage.write",
    recordId: imageId
  });
}
