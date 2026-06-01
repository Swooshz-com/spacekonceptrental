import "server-only";

export type TrustedProductAdminContext = {
  workspaceId: string;
  adminUserId: string;
  membershipId?: string;
  resolution: "server-auth-membership";
};

export type ProductPersistenceSkippedReason =
  "PRODUCT_PERSISTENCE_DISABLED_PHASE_1J_A";

export type ProductPersistenceFailureCode =
  | "PRODUCT_PERSISTENCE_UNAVAILABLE"
  | "PRODUCT_ADMIN_CONTEXT_INVALID"
  | "PRODUCT_PERSISTENCE_FAILED";

export type ProductPersistenceRecordType =
  | "category"
  | "product"
  | "productImage";

export type ProductPersistenceRecord = {
  id: string;
  type: ProductPersistenceRecordType;
};

export type ProductPersistenceResult =
  | {
      ok: true;
      record: ProductPersistenceRecord;
    }
  | {
      ok: false;
      code: ProductPersistenceFailureCode;
    }
  | {
      status: "skipped";
      reason: ProductPersistenceSkippedReason;
    };

export type ProductStatus = "draft" | "published" | "archived";

export type CategoryDraft = {
  slug: string;
  name: string;
  description?: string;
  sortOrder?: number;
  isPublished: boolean;
};

export type CategoryUpdate = Partial<CategoryDraft>;

export type ProductDraft = {
  categoryId?: string;
  slug: string;
  name: string;
  shortDescription?: string;
  description?: string;
  rentalUnit?: string;
  status: ProductStatus;
  sortOrder?: number;
};

export type ProductUpdate = Partial<ProductDraft>;

export type ProductImageMetadataDraft = {
  productId: string;
  storageBucket: string;
  storagePath: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
};

export type ProductImageMetadataUpdate =
  Partial<Omit<ProductImageMetadataDraft, "productId">>;

export type CreateCategoryInput = {
  admin: TrustedProductAdminContext;
  category: CategoryDraft;
};

export type UpdateCategoryInput = {
  admin: TrustedProductAdminContext;
  categoryId: string;
  updates: CategoryUpdate;
};

export type CreateProductInput = {
  admin: TrustedProductAdminContext;
  product: ProductDraft;
};

export type UpdateProductInput = {
  admin: TrustedProductAdminContext;
  productId: string;
  updates: ProductUpdate;
};

export type ArchiveProductInput = {
  admin: TrustedProductAdminContext;
  productId: string;
};

export type PublishProductInput = {
  admin: TrustedProductAdminContext;
  productId: string;
};

export type CreateProductImageInput = {
  admin: TrustedProductAdminContext;
  image: ProductImageMetadataDraft;
};

export type UpdateProductImageInput = {
  admin: TrustedProductAdminContext;
  imageId: string;
  updates: ProductImageMetadataUpdate;
};

export type ArchiveProductImageInput = {
  admin: TrustedProductAdminContext;
  imageId: string;
};

export interface ProductPersistence {
  createCategory: (
    input: CreateCategoryInput
  ) => Promise<ProductPersistenceResult>;
  updateCategory: (
    input: UpdateCategoryInput
  ) => Promise<ProductPersistenceResult>;
  archiveCategory: (
    input: UpdateCategoryInput
  ) => Promise<ProductPersistenceResult>;
  createProduct: (
    input: CreateProductInput
  ) => Promise<ProductPersistenceResult>;
  updateProduct: (
    input: UpdateProductInput
  ) => Promise<ProductPersistenceResult>;
  archiveProduct: (
    input: ArchiveProductInput
  ) => Promise<ProductPersistenceResult>;
  publishProduct: (
    input: PublishProductInput
  ) => Promise<ProductPersistenceResult>;
  createProductImage: (
    input: CreateProductImageInput
  ) => Promise<ProductPersistenceResult>;
  updateProductImage: (
    input: UpdateProductImageInput
  ) => Promise<ProductPersistenceResult>;
  archiveProductImage: (
    input: ArchiveProductImageInput
  ) => Promise<ProductPersistenceResult>;
}
