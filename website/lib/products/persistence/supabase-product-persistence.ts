import "server-only";

import { createSessionBoundSupabaseAdminReadClient } from "../../admin/authorization/supabase-admin-auth-identity-adapter";
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
  ProductPersistenceRecord,
  ProductPersistenceResult,
  ProductStatus,
  ProductUpdate,
  PublishProductInput,
  TrustedProductAdminContext,
  UpdateCategoryInput,
  UpdateProductImageInput,
  UpdateProductInput
} from "./types";

type ProductWriteMutationResult = {
  data: unknown;
  error: unknown;
};

type ProductWriteInsertBuilder = PromiseLike<ProductWriteMutationResult> & {
  select(columns: string): {
    single(): Promise<ProductWriteMutationResult>;
  };
};

type ProductWriteUpdateBuilder = {
  eq(column: string, value: string): ProductWriteUpdateBuilder;
  select(columns: string): {
    single(): Promise<ProductWriteMutationResult>;
  };
};

export type ProductWriteSupabaseClient = {
  rpc(
    fn: "execute_admin_product_write",
    args: {
      p_action: string;
      p_target_id: string | null;
      p_workspace_id: string;
      p_payload: Record<string, unknown>;
    }
  ): {
    single(): Promise<ProductWriteMutationResult>;
  };
};

export type ProductWriteSupabaseClientResult =
  | {
      configured: true;
      client: ProductWriteSupabaseClient;
      missingEnv: [];
    }
  | {
      configured: false;
      client: null;
      reason: "authenticated_admin_write_client_required";
    };

type SupabaseProductPersistenceOptions = {
  supabase?: ProductWriteSupabaseClientResult;
};

type MutationConfig = {
  admin: TrustedProductAdminContext;
  type: ProductPersistenceRecord["type"];
  action: string;
  targetId: string | null;
  payload: Record<string, unknown>;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined) {
  return typeof value === "string" && uuidPattern.test(value.trim());
}

function success(
  type: ProductPersistenceRecord["type"],
  id: string
): ProductPersistenceResult {
  return {
    ok: true,
    record: {
      id,
      type
    }
  };
}

function failure(
  code: Extract<ProductPersistenceResult, { ok: false }>["code"]
): ProductPersistenceResult {
  return {
    ok: false,
    code
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function resultRecordId(result: ProductWriteMutationResult) {
  if (result.error) {
    return null;
  }

  if (typeof result.data === "string") {
    return isUuid(result.data) ? result.data : null;
  }

  if (!isRecord(result.data)) {
    return null;
  }

  const id = result.data.id;

  return typeof id === "string" && isUuid(id) ? id : null;
}

function validAdminContext(admin: TrustedProductAdminContext) {
  return (
    admin.resolution === "server-auth-membership" &&
    isUuid(admin.workspaceId) &&
    isUuid(admin.adminUserId) &&
    (admin.membershipId === undefined || isUuid(admin.membershipId))
  );
}

async function createDefaultSupabase(): Promise<ProductWriteSupabaseClientResult> {
  const supabase = await createSessionBoundSupabaseAdminReadClient();

  if (!supabase.configured) {
    return {
      configured: false,
      client: null,
      reason: "authenticated_admin_write_client_required"
    };
  }

  return {
    configured: true,
    client: supabase.client as unknown as ProductWriteSupabaseClient,
    missingEnv: []
  };
}

function optionalText(value: string | undefined) {
  return value === undefined ? undefined : value;
}

function categoryInsertRow(admin: TrustedProductAdminContext, category: CategoryDraft) {
  return {
    workspace_id: admin.workspaceId,
    slug: category.slug,
    name: category.name,
    ...(category.description !== undefined
      ? { description: optionalText(category.description) }
      : {}),
    ...(category.sortOrder !== undefined
      ? { sort_order: category.sortOrder }
      : {}),
    is_published: category.isPublished
  };
}

function categoryUpdateRow(updates: CategoryUpdate) {
  return {
    ...(updates.slug !== undefined ? { slug: updates.slug } : {}),
    ...(updates.name !== undefined ? { name: updates.name } : {}),
    ...(updates.description !== undefined
      ? { description: optionalText(updates.description) }
      : {}),
    ...(updates.sortOrder !== undefined
      ? { sort_order: updates.sortOrder }
      : {}),
    ...(updates.isPublished !== undefined
      ? { is_published: updates.isPublished }
      : {})
  };
}

function productInsertRow(admin: TrustedProductAdminContext, product: ProductDraft) {
  return {
    workspace_id: admin.workspaceId,
    ...(product.categoryId !== undefined
      ? { category_id: product.categoryId }
      : {}),
    slug: product.slug,
    name: product.name,
    ...(product.shortDescription !== undefined
      ? { short_description: optionalText(product.shortDescription) }
      : {}),
    ...(product.description !== undefined
      ? { description: optionalText(product.description) }
      : {}),
    ...(product.rentalUnit !== undefined
      ? { rental_unit: product.rentalUnit }
      : {}),
    status: product.status,
    ...(product.sortOrder !== undefined ? { sort_order: product.sortOrder } : {})
  };
}

function productUpdateRow(updates: ProductUpdate) {
  return {
    ...(updates.categoryId !== undefined ? { category_id: updates.categoryId } : {}),
    ...(updates.slug !== undefined ? { slug: updates.slug } : {}),
    ...(updates.name !== undefined ? { name: updates.name } : {}),
    ...(updates.shortDescription !== undefined
      ? { short_description: optionalText(updates.shortDescription) }
      : {}),
    ...(updates.description !== undefined
      ? { description: optionalText(updates.description) }
      : {}),
    ...(updates.rentalUnit !== undefined
      ? { rental_unit: updates.rentalUnit }
      : {}),
    ...(updates.status !== undefined ? { status: updates.status } : {}),
    ...(updates.sortOrder !== undefined ? { sort_order: updates.sortOrder } : {})
  };
}

function productStatusRow(status: ProductStatus) {
  return {
    status
  };
}

function productImageInsertRow(
  admin: TrustedProductAdminContext,
  image: ProductImageMetadataDraft
) {
  return {
    workspace_id: admin.workspaceId,
    product_id: image.productId,
    storage_bucket: image.storageBucket,
    storage_path: image.storagePath,
    ...(image.altText !== undefined ? { alt_text: optionalText(image.altText) } : {}),
    ...(image.sortOrder !== undefined ? { sort_order: image.sortOrder } : {}),
    ...(image.isPrimary !== undefined ? { is_primary: image.isPrimary } : {}),
    status: "active"
  };
}

function productImageUpdateRow(updates: ProductImageMetadataUpdate) {
  return {
    ...(updates.storageBucket !== undefined
      ? { storage_bucket: updates.storageBucket }
      : {}),
    ...(updates.storagePath !== undefined
      ? { storage_path: updates.storagePath }
      : {}),
    ...(updates.altText !== undefined ? { alt_text: optionalText(updates.altText) } : {}),
    ...(updates.sortOrder !== undefined ? { sort_order: updates.sortOrder } : {}),
    ...(updates.isPrimary !== undefined ? { is_primary: updates.isPrimary } : {})
  };
}



export class SupabaseProductPersistence implements ProductPersistence {
  constructor(private readonly options: SupabaseProductPersistenceOptions = {}) {}

  private async getSupabase() {
    return this.options.supabase ?? createDefaultSupabase();
  }

  private async persist({
    admin,
    type,
    action,
    targetId,
    payload
  }: MutationConfig): Promise<ProductPersistenceResult> {
    if (!validAdminContext(admin)) {
      return failure("PRODUCT_ADMIN_CONTEXT_INVALID");
    }

    const supabase = await this.getSupabase();

    if (!supabase.configured) {
      return failure("PRODUCT_PERSISTENCE_UNAVAILABLE");
    }

    try {
      const result = await supabase.client
        .rpc("execute_admin_product_write", {
          p_action: action,
          p_target_id: targetId,
          p_workspace_id: admin.workspaceId,
          p_payload: payload
        })
        .single();

      const id = resultRecordId(result);

      if (!id) {
        return failure("PRODUCT_PERSISTENCE_FAILED");
      }

      return success(type, id);
    } catch {
      return failure("PRODUCT_PERSISTENCE_FAILED");
    }
  }

  async createCategory(input: CreateCategoryInput): Promise<ProductPersistenceResult> {
    return this.persist({
      admin: input.admin,
      type: "category",
      action: "category.create",
      targetId: null,
      payload: categoryInsertRow(input.admin, input.category)
    });
  }

  async updateCategory(input: UpdateCategoryInput): Promise<ProductPersistenceResult> {
    return this.persist({
      admin: input.admin,
      type: "category",
      action: "category.update",
      targetId: input.categoryId,
      payload: categoryUpdateRow(input.updates)
    });
  }

  async archiveCategory(input: UpdateCategoryInput): Promise<ProductPersistenceResult> {
    return this.persist({
      admin: input.admin,
      type: "category",
      action: "category.archive",
      targetId: input.categoryId,
      payload: {}
    });
  }

  async createProduct(input: CreateProductInput): Promise<ProductPersistenceResult> {
    return this.persist({
      admin: input.admin,
      type: "product",
      action: "product.create",
      targetId: null,
      payload: productInsertRow(input.admin, input.product)
    });
  }

  async updateProduct(input: UpdateProductInput): Promise<ProductPersistenceResult> {
    return this.persist({
      admin: input.admin,
      type: "product",
      action: "product.update",
      targetId: input.productId,
      payload: productUpdateRow(input.updates)
    });
  }

  async archiveProduct(input: ArchiveProductInput): Promise<ProductPersistenceResult> {
    return this.persist({
      admin: input.admin,
      type: "product",
      action: "product.archive",
      targetId: input.productId,
      payload: {}
    });
  }

  async publishProduct(input: PublishProductInput): Promise<ProductPersistenceResult> {
    return this.persist({
      admin: input.admin,
      type: "product",
      action: "product.publish",
      targetId: input.productId,
      payload: {}
    });
  }

  async createProductImage(
    input: CreateProductImageInput
  ): Promise<ProductPersistenceResult> {
    return this.persist({
      admin: input.admin,
      type: "productImage",
      action: "productImage.create",
      targetId: null,
      payload: productImageInsertRow(input.admin, input.image)
    });
  }

  async updateProductImage(
    input: UpdateProductImageInput
  ): Promise<ProductPersistenceResult> {
    return this.persist({
      admin: input.admin,
      type: "productImage",
      action: "productImage.update",
      targetId: input.imageId,
      payload: productImageUpdateRow(input.updates)
    });
  }

  async archiveProductImage(
    input: ArchiveProductImageInput
  ): Promise<ProductPersistenceResult> {
    return this.persist({
      admin: input.admin,
      type: "productImage",
      action: "productImage.archive",
      targetId: input.imageId,
      payload: {}
    });
  }
}

export const supabaseProductPersistence = new SupabaseProductPersistence();
