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
  from(table: string): {
    insert(row: unknown): ProductWriteInsertBuilder;
    update(row: unknown): ProductWriteUpdateBuilder;
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
  targetType: "category" | "product" | "product_image";
  mutate: (
    client: ProductWriteSupabaseClient
  ) => Promise<ProductWriteMutationResult>;
};

const productWriteTables = {
  auditLogs: "audit_logs",
  categories: "categories",
  productImages: "product_images",
  products: "products"
} as const;

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
  if (result.error || !isRecord(result.data)) {
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

function updateByWorkspace(
  client: ProductWriteSupabaseClient,
  table: string,
  row: Record<string, unknown>,
  id: string,
  workspaceId: string
) {
  return client
    .from(table)
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .select("id")
    .single();
}

async function insertAuditLog(
  client: ProductWriteSupabaseClient,
  admin: TrustedProductAdminContext,
  action: string,
  targetType: MutationConfig["targetType"],
  targetId: string
) {
  const result = await client.from(productWriteTables.auditLogs).insert({
    workspace_id: admin.workspaceId,
    actor_admin_user_id: admin.adminUserId,
    actor_type: "admin",
    action,
    target_type: targetType,
    target_id: targetId,
    metadata: {}
  });

  return !result.error;
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
    targetType,
    mutate
  }: MutationConfig): Promise<ProductPersistenceResult> {
    if (!validAdminContext(admin)) {
      return failure("PRODUCT_ADMIN_CONTEXT_INVALID");
    }

    const supabase = await this.getSupabase();

    if (!supabase.configured) {
      return failure("PRODUCT_PERSISTENCE_UNAVAILABLE");
    }

    try {
      const result = await mutate(supabase.client);
      const id = resultRecordId(result);

      if (!id) {
        return failure("PRODUCT_PERSISTENCE_FAILED");
      }

      const auditRecorded = await insertAuditLog(
        supabase.client,
        admin,
        action,
        targetType,
        id
      );

      return auditRecorded ? success(type, id) : failure("PRODUCT_PERSISTENCE_FAILED");
    } catch {
      return failure("PRODUCT_PERSISTENCE_FAILED");
    }
  }

  async createCategory(input: CreateCategoryInput): Promise<ProductPersistenceResult> {
    return this.persist({
      admin: input.admin,
      type: "category",
      action: "category.create",
      targetType: "category",
      mutate: (client) =>
        client
          .from(productWriteTables.categories)
          .insert(categoryInsertRow(input.admin, input.category))
          .select("id")
          .single()
    });
  }

  async updateCategory(input: UpdateCategoryInput): Promise<ProductPersistenceResult> {
    return this.persist({
      admin: input.admin,
      type: "category",
      action: "category.update",
      targetType: "category",
      mutate: (client) =>
        updateByWorkspace(
          client,
          productWriteTables.categories,
          categoryUpdateRow(input.updates),
          input.categoryId,
          input.admin.workspaceId
        )
    });
  }

  async archiveCategory(input: UpdateCategoryInput): Promise<ProductPersistenceResult> {
    return this.persist({
      admin: input.admin,
      type: "category",
      action: "category.archive",
      targetType: "category",
      mutate: (client) =>
        updateByWorkspace(
          client,
          productWriteTables.categories,
          { is_published: false },
          input.categoryId,
          input.admin.workspaceId
        )
    });
  }

  async createProduct(input: CreateProductInput): Promise<ProductPersistenceResult> {
    return this.persist({
      admin: input.admin,
      type: "product",
      action: "product.create",
      targetType: "product",
      mutate: (client) =>
        client
          .from(productWriteTables.products)
          .insert(productInsertRow(input.admin, input.product))
          .select("id")
          .single()
    });
  }

  async updateProduct(input: UpdateProductInput): Promise<ProductPersistenceResult> {
    return this.persist({
      admin: input.admin,
      type: "product",
      action: "product.update",
      targetType: "product",
      mutate: (client) =>
        updateByWorkspace(
          client,
          productWriteTables.products,
          productUpdateRow(input.updates),
          input.productId,
          input.admin.workspaceId
        )
    });
  }

  async archiveProduct(input: ArchiveProductInput): Promise<ProductPersistenceResult> {
    return this.persist({
      admin: input.admin,
      type: "product",
      action: "product.archive",
      targetType: "product",
      mutate: (client) =>
        updateByWorkspace(
          client,
          productWriteTables.products,
          productStatusRow("archived"),
          input.productId,
          input.admin.workspaceId
        )
    });
  }

  async publishProduct(input: PublishProductInput): Promise<ProductPersistenceResult> {
    return this.persist({
      admin: input.admin,
      type: "product",
      action: "product.publish",
      targetType: "product",
      mutate: (client) =>
        updateByWorkspace(
          client,
          productWriteTables.products,
          productStatusRow("published"),
          input.productId,
          input.admin.workspaceId
        )
    });
  }

  async createProductImage(
    input: CreateProductImageInput
  ): Promise<ProductPersistenceResult> {
    return this.persist({
      admin: input.admin,
      type: "productImage",
      action: "productImage.create",
      targetType: "product_image",
      mutate: (client) =>
        client
          .from(productWriteTables.productImages)
          .insert(productImageInsertRow(input.admin, input.image))
          .select("id")
          .single()
    });
  }

  async updateProductImage(
    input: UpdateProductImageInput
  ): Promise<ProductPersistenceResult> {
    return this.persist({
      admin: input.admin,
      type: "productImage",
      action: "productImage.update",
      targetType: "product_image",
      mutate: (client) =>
        updateByWorkspace(
          client,
          productWriteTables.productImages,
          productImageUpdateRow(input.updates),
          input.imageId,
          input.admin.workspaceId
        )
    });
  }

  async archiveProductImage(
    input: ArchiveProductImageInput
  ): Promise<ProductPersistenceResult> {
    return this.persist({
      admin: input.admin,
      type: "productImage",
      action: "productImage.archive",
      targetType: "product_image",
      mutate: (client) =>
        updateByWorkspace(
          client,
          productWriteTables.productImages,
          {
            status: "archived",
            is_primary: false
          },
          input.imageId,
          input.admin.workspaceId
        )
    });
  }
}

export const supabaseProductPersistence = new SupabaseProductPersistence();
