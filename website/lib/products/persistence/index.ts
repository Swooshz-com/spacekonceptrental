import "server-only";

import {
  disabledProductPersistence,
  DisabledProductPersistence
} from "./disabled-product-persistence";
import type {
  ArchiveProductImageInput,
  ArchiveProductInput,
  CategoryDraft,
  CategoryUpdate,
  CreateCategoryInput,
  CreateProductImageInput,
  CreateProductInput,
  ProductDraft,
  ProductImageMetadataDraft,
  ProductImageMetadataUpdate,
  ProductPersistence,
  ProductPersistenceResult,
  ProductStatus,
  ProductUpdate,
  PublishProductInput,
  TrustedProductAdminContext,
  UpdateCategoryInput,
  UpdateProductImageInput,
  UpdateProductInput
} from "./types";

export { disabledProductPersistence, DisabledProductPersistence };
export type {
  ArchiveProductImageInput,
  ArchiveProductInput,
  CategoryDraft,
  CategoryUpdate,
  CreateCategoryInput,
  CreateProductImageInput,
  CreateProductInput,
  ProductDraft,
  ProductImageMetadataDraft,
  ProductImageMetadataUpdate,
  ProductPersistence,
  ProductPersistenceResult,
  ProductStatus,
  ProductUpdate,
  PublishProductInput,
  TrustedProductAdminContext,
  UpdateCategoryInput,
  UpdateProductImageInput,
  UpdateProductInput
};

export function getProductPersistence(): ProductPersistence {
  return disabledProductPersistence;
}
