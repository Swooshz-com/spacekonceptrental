import "server-only";

import type {
  ArchiveProductImageInput,
  ArchiveProductInput,
  CreateCategoryInput,
  CreateProductImageInput,
  CreateProductInput,
  ProductPersistence,
  ProductPersistenceResult,
  PublishProductInput,
  UpdateCategoryInput,
  UpdateProductImageInput,
  UpdateProductInput
} from "./types";

const disabledResult: ProductPersistenceResult = {
  status: "skipped",
  reason: "PRODUCT_PERSISTENCE_DISABLED_PHASE_1J_A"
};

export class DisabledProductPersistence implements ProductPersistence {
  async createCategory(
    _input: CreateCategoryInput
  ): Promise<ProductPersistenceResult> {
    return disabledResult;
  }

  async updateCategory(
    _input: UpdateCategoryInput
  ): Promise<ProductPersistenceResult> {
    return disabledResult;
  }

  async createProduct(
    _input: CreateProductInput
  ): Promise<ProductPersistenceResult> {
    return disabledResult;
  }

  async updateProduct(
    _input: UpdateProductInput
  ): Promise<ProductPersistenceResult> {
    return disabledResult;
  }

  async archiveProduct(
    _input: ArchiveProductInput
  ): Promise<ProductPersistenceResult> {
    return disabledResult;
  }

  async publishProduct(
    _input: PublishProductInput
  ): Promise<ProductPersistenceResult> {
    return disabledResult;
  }

  async createProductImage(
    _input: CreateProductImageInput
  ): Promise<ProductPersistenceResult> {
    return disabledResult;
  }

  async updateProductImage(
    _input: UpdateProductImageInput
  ): Promise<ProductPersistenceResult> {
    return disabledResult;
  }

  async archiveProductImage(
    _input: ArchiveProductImageInput
  ): Promise<ProductPersistenceResult> {
    return disabledResult;
  }
}

export const disabledProductPersistence = new DisabledProductPersistence();
