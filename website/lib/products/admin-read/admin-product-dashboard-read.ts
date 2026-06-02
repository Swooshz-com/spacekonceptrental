import "server-only";

import { createSessionBoundSupabaseAdminReadClient } from "../../admin/authorization/supabase-admin-auth-identity-adapter";

type QueryResult = {
  data: unknown;
  error: unknown;
};

type AdminProductDashboardReadFilter = {
  eq(column: string, value: string): AdminProductDashboardReadFilter;
  order(
    column: string,
    options?: {
      ascending?: boolean;
    }
  ): AdminProductDashboardReadFilter;
  limit(count: number): Promise<QueryResult>;
};

export type AdminProductDashboardReadSupabaseClient = {
  from(table: "categories" | "products" | "product_images"): {
    select(columns: string): AdminProductDashboardReadFilter;
  };
};

export type AdminProductDashboardReadSupabaseClientResult =
  | {
      configured: true;
      client: AdminProductDashboardReadSupabaseClient;
      missingEnv: [];
    }
  | {
      configured: false;
      client: null;
      reason: "authenticated_admin_read_client_required";
    };

export type AdminProductDashboardCategory = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  sortOrder: number;
  isPublished: boolean;
  productCount: number;
};

export type AdminProductDashboardProduct = {
  id: string;
  categoryId?: string;
  slug: string;
  name: string;
  shortDescription?: string;
  rentalUnit: string;
  status: "draft" | "published" | "archived";
  sortOrder: number;
  imageCount: number;
  primaryImageAltText?: string;
};

export type AdminProductDashboardReadData = {
  categories: AdminProductDashboardCategory[];
  products: AdminProductDashboardProduct[];
  imageSummary: {
    totalImages: number;
    activeImages: number;
    primaryImages: number;
  };
};

export type AdminProductDashboardReadResult =
  | {
      status: "loaded";
      data: AdminProductDashboardReadData;
    }
  | {
      status: "unavailable";
    };

type AdminProductDashboardReadOptions = {
  supabase?: AdminProductDashboardReadSupabaseClientResult;
  env?: {
    ADMIN_TRUSTED_WORKSPACE_ID?: string | null;
  };
};

type CategoryRow = {
  id?: unknown;
  slug?: unknown;
  name?: unknown;
  description?: unknown;
  sort_order?: unknown;
  is_published?: unknown;
};

type ProductRow = {
  id?: unknown;
  category_id?: unknown;
  slug?: unknown;
  name?: unknown;
  short_description?: unknown;
  rental_unit?: unknown;
  status?: unknown;
  sort_order?: unknown;
};

type ProductImageRow = {
  id?: unknown;
  product_id?: unknown;
  alt_text?: unknown;
  sort_order?: unknown;
  is_primary?: unknown;
  status?: unknown;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const productStatuses = new Set(["draft", "published", "archived"]);
const productImageStatuses = new Set(["active", "archived"]);

function unavailable(): AdminProductDashboardReadResult {
  return {
    status: "unavailable"
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value.trim());
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getWorkspaceId(options: AdminProductDashboardReadOptions) {
  const workspaceId =
    options.env && "ADMIN_TRUSTED_WORKSPACE_ID" in options.env
      ? options.env.ADMIN_TRUSTED_WORKSPACE_ID
      : process.env.ADMIN_TRUSTED_WORKSPACE_ID;
  const trimmed = workspaceId?.trim();

  return trimmed && isUuid(trimmed) ? trimmed : null;
}

async function getSupabase(
  options: AdminProductDashboardReadOptions
): Promise<AdminProductDashboardReadSupabaseClientResult> {
  if (options.supabase) {
    return options.supabase;
  }

  const supabase = await createSessionBoundSupabaseAdminReadClient();

  return supabase.configured
    ? {
        configured: true,
        client: supabase.client as unknown as AdminProductDashboardReadSupabaseClient,
        missingEnv: []
      }
    : {
        configured: false,
        client: null,
        reason: "authenticated_admin_read_client_required"
      };
}

function requireRows(result: QueryResult) {
  if (result.error || !Array.isArray(result.data)) {
    return null;
  }

  return result.data.every(isRecord) ? result.data : null;
}

function toCategory(row: CategoryRow): AdminProductDashboardCategory | null {
  const id = isUuid(row.id) ? row.id.trim() : null;
  const slug = getString(row.slug);
  const name = getString(row.name);
  const sortOrder = getNumber(row.sort_order);

  if (!id || !slug || !name || sortOrder === undefined) {
    return null;
  }

  return {
    id,
    slug,
    name,
    description: getString(row.description),
    sortOrder,
    isPublished: row.is_published === true,
    productCount: 0
  };
}

function toProduct(row: ProductRow): AdminProductDashboardProduct | null {
  const id = isUuid(row.id) ? row.id.trim() : null;
  const categoryId = isUuid(row.category_id) ? row.category_id.trim() : undefined;
  const slug = getString(row.slug);
  const name = getString(row.name);
  const status =
    typeof row.status === "string" && productStatuses.has(row.status)
      ? row.status
      : null;
  const sortOrder = getNumber(row.sort_order);

  if (!id || !slug || !name || !status || sortOrder === undefined) {
    return null;
  }

  return {
    id,
    categoryId,
    slug,
    name,
    shortDescription: getString(row.short_description),
    rentalUnit: getString(row.rental_unit) ?? "item",
    status: status as AdminProductDashboardProduct["status"],
    sortOrder,
    imageCount: 0
  };
}

function toProductImage(row: ProductImageRow) {
  const id = isUuid(row.id) ? row.id.trim() : null;
  const productId = isUuid(row.product_id) ? row.product_id.trim() : null;
  const status =
    typeof row.status === "string" && productImageStatuses.has(row.status)
      ? row.status
      : null;
  const sortOrder = getNumber(row.sort_order);

  if (!id || !productId || !status || sortOrder === undefined) {
    return null;
  }

  return {
    id,
    productId,
    altText: getString(row.alt_text),
    sortOrder,
    isPrimary: row.is_primary === true,
    status: status as "active" | "archived"
  };
}

function mapDashboardData(
  categoryRows: Record<string, unknown>[],
  productRows: Record<string, unknown>[],
  imageRows: Record<string, unknown>[]
): AdminProductDashboardReadData | null {
  const categories = categoryRows.map(toCategory);
  const products = productRows.map(toProduct);
  const images = imageRows.map(toProductImage);

  if (
    categories.some((category) => !category) ||
    products.some((product) => !product) ||
    images.some((image) => !image)
  ) {
    return null;
  }

  const mappedCategories = categories as AdminProductDashboardCategory[];
  const mappedProducts = products as AdminProductDashboardProduct[];
  const mappedImages = images as NonNullable<ReturnType<typeof toProductImage>>[];
  const categoryById = new Map(
    mappedCategories.map((category) => [category.id, category])
  );
  const productById = new Map(mappedProducts.map((product) => [product.id, product]));

  for (const product of mappedProducts) {
    if (product.categoryId) {
      const category = categoryById.get(product.categoryId);

      if (category) {
        category.productCount += 1;
      }
    }
  }

  for (const image of mappedImages) {
    const product = productById.get(image.productId);

    if (product) {
      product.imageCount += 1;

      if (image.isPrimary && image.altText && !product.primaryImageAltText) {
        product.primaryImageAltText = image.altText;
      }
    }
  }

  return {
    categories: mappedCategories.sort((first, second) =>
      first.sortOrder === second.sortOrder
        ? first.name.localeCompare(second.name)
        : first.sortOrder - second.sortOrder
    ),
    products: mappedProducts.sort((first, second) =>
      first.sortOrder === second.sortOrder
        ? first.name.localeCompare(second.name)
        : first.sortOrder - second.sortOrder
    ),
    imageSummary: {
      totalImages: mappedImages.length,
      activeImages: mappedImages.filter((image) => image.status === "active").length,
      primaryImages: mappedImages.filter((image) => image.isPrimary).length
    }
  };
}

export async function resolveAdminProductDashboardRead(
  options: AdminProductDashboardReadOptions = {}
): Promise<AdminProductDashboardReadResult> {
  const workspaceId = getWorkspaceId(options);

  if (!workspaceId) {
    return unavailable();
  }

  const supabase = await getSupabase(options);

  if (!supabase.configured) {
    return unavailable();
  }

  try {
    const [categoryResult, productResult, imageResult] = await Promise.all([
      supabase.client
        .from("categories")
        .select("id, slug, name, description, sort_order, is_published")
        .eq("workspace_id", workspaceId)
        .order("sort_order", { ascending: true })
        .limit(200),
      supabase.client
        .from("products")
        .select(
          "id, category_id, slug, name, short_description, rental_unit, status, sort_order"
        )
        .eq("workspace_id", workspaceId)
        .order("sort_order", { ascending: true })
        .limit(500),
      supabase.client
        .from("product_images")
        .select("id, product_id, alt_text, sort_order, is_primary, status")
        .eq("workspace_id", workspaceId)
        .order("sort_order", { ascending: true })
        .limit(1_000)
    ]);
    const categoryRows = requireRows(categoryResult);
    const productRows = requireRows(productResult);
    const imageRows = requireRows(imageResult);

    if (!categoryRows || !productRows || !imageRows) {
      return unavailable();
    }

    const data = mapDashboardData(categoryRows, productRows, imageRows);

    return data
      ? {
          status: "loaded",
          data
        }
      : unavailable();
  } catch {
    return unavailable();
  }
}
