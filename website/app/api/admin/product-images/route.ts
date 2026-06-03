import "server-only";

import type { NextRequest } from "next/server";
import { handleAdminProductImageUploadRoute } from "../../../../lib/products/media/admin-product-image-upload-route";
import { handleAdminProductWriteRoute } from "../../../../lib/products/persistence/admin-product-write-route";

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("multipart/form-data")) {
    return handleAdminProductImageUploadRoute(request);
  }

  return handleAdminProductWriteRoute(request, {
    action: "createProductImage",
    operation: "productImage.write"
  });
}
