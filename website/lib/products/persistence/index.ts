import "server-only";

import {
  disabledProductPersistence,
  DisabledProductPersistence
} from "./disabled-product-persistence";
import {
  supabaseProductPersistence,
  SupabaseProductPersistence,
  type ProductWriteSupabaseClientResult
} from "./supabase-product-persistence";
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
  ProductPersistenceFailureCode,
  ProductPersistenceRecord,
  ProductPersistenceRecordType,
  ProductPersistenceResult,
  ProductStatus,
  ProductUpdate,
  PublishProductInput,
  TrustedProductAdminContext,
  UpdateCategoryInput,
  UpdateProductImageInput,
  UpdateProductInput
} from "./types";

export {
  disabledProductPersistence,
  DisabledProductPersistence,
  supabaseProductPersistence,
  SupabaseProductPersistence
};
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
  ProductPersistenceFailureCode,
  ProductPersistenceRecord,
  ProductPersistenceRecordType,
  ProductPersistenceResult,
  ProductStatus,
  ProductWriteSupabaseClientResult,
  ProductUpdate,
  PublishProductInput,
  TrustedProductAdminContext,
  UpdateCategoryInput,
  UpdateProductImageInput,
  UpdateProductInput
};

export function getProductPersistence(): ProductPersistence {
  return supabaseProductPersistence;
}
