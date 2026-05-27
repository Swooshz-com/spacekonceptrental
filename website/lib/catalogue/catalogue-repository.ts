import "server-only";

import { createServerSupabaseClient } from "../supabase/server";
import type { SupabaseServerEnvName } from "../supabase/env";
import type {
  PublicCatalogue,
  PublicCatalogueCategory,
  PublicCatalogueImage,
  PublicCatalogueProduct
} from "./types";

type SupabaseQueryResult = {
  data: unknown;
  error: unknown;
};

type PublicCatalogueSupabaseClient = {
  from: (table: string) => {
    select: (columns: string) => PublicCatalogueQueryBuilder;
  };
};

type PublicCatalogueQueryBuilder = PromiseLike<SupabaseQueryResult> & {
  eq: (column: string, value: unknown) => PublicCatalogueQueryBuilder;
  order: (
    column: string,
    options?: { ascending?: boolean }
  ) => PublicCatalogueQueryBuilder;
  maybeSingle: () => Promise<SupabaseQueryResult>;
};

type PublicCatalogueSupabaseResult =
  | {
      configured: true;
      client: PublicCatalogueSupabaseClient;
      missingEnv: [];
    }
  | {
      configured: false;
      client: null;
      missingEnv: SupabaseServerEnvName[];
    };

type PublicCatalogueRepositoryOptions = {
  supabase?: PublicCatalogueSupabaseResult;
};

type CategoryRow = {
  id?: unknown;
  slug?: unknown;
  name?: unknown;
  description?: unknown;
  sort_order?: unknown;
  is_published?: unknown;
};

type ImageRow = {
  id?: unknown;
  storage_bucket?: unknown;
  storage_path?: unknown;
  alt_text?: unknown;
  sort_order?: unknown;
  is_primary?: unknown;
};

type ProductRow = {
  id?: unknown;
  category_id?: unknown;
  slug?: unknown;
  name?: unknown;
  short_description?: unknown;
  description?: unknown;
  rental_unit?: unknown;
  status?: unknown;
  sort_order?: unknown;
  product_images?: unknown;
};

const categorySelect =
  "id, slug, name, description, sort_order, is_published";
const productSelect = [
  "id",
  "category_id",
  "slug",
  "name",
  "short_description",
  "description",
  "rental_unit",
  "status",
  "sort_order",
  "product_images(id, storage_bucket, storage_path, alt_text, sort_order, is_primary)"
].join(", ");

const fallbackCategories: PublicCatalogueCategory[] = [
  {
    id: "fallback-seating",
    slug: "seating",
    name: "Seating",
    description: "Clean seating options for conferences, dinners, and launches.",
    sortOrder: 10
  },
  {
    id: "fallback-lounge",
    slug: "lounge",
    name: "Lounge",
    description: "Soft seating for receptions, VIP areas, and activations.",
    sortOrder: 20
  },
  {
    id: "fallback-event-sets",
    slug: "event-sets",
    name: "Event Sets",
    description: "Prepared event looks that can be translated into quote items.",
    sortOrder: 30
  }
];

const fallbackProducts: PublicCatalogueProduct[] = [
  {
    id: "fallback-chair",
    slug: "dining-and-seminar-chairs",
    name: "Dining and seminar chairs",
    shortDescription:
      "Clean seating options for conferences, dinners, and launches.",
    description:
      "Clean seating options for conferences, dinners, and launches.",
    rentalUnit: "item",
    sortOrder: 10,
    categoryId: "fallback-seating",
    categoryName: "Seating",
    source: "fallback"
  },
  {
    id: "fallback-lounge-sofa-package",
    slug: "lounge-sofa-package",
    name: "Lounge sofa package",
    shortDescription:
      "Soft seating for receptions, VIP areas, and brand activations.",
    description:
      "Sample lounge package for receptions, launches, and VIP holding areas.",
    rentalUnit: "set",
    sortOrder: 20,
    categoryId: "fallback-lounge",
    categoryName: "Lounge",
    source: "fallback"
  },
  {
    id: "fallback-corporate-event-sets",
    slug: "corporate-event-sets",
    name: "Corporate event sets",
    shortDescription:
      "Prepared event looks that can be translated into quote items.",
    description:
      "Prepared event looks that can be translated into quote items.",
    rentalUnit: "set",
    sortOrder: 30,
    categoryId: "fallback-event-sets",
    categoryName: "Event Sets",
    source: "fallback"
  }
];

const fallbackCatalogue: PublicCatalogue = {
  source: "fallback",
  categories: fallbackCategories,
  products: fallbackProducts
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

function toRows(value: unknown) {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function toImage(row: ImageRow): PublicCatalogueImage | undefined {
  const id = getString(row.id);
  const storageBucket = getString(row.storage_bucket);
  const storagePath = getString(row.storage_path);

  if (!id || !storageBucket || !storagePath) {
    return undefined;
  }

  return {
    id,
    storageBucket,
    storagePath,
    altText: getString(row.alt_text),
    sortOrder: getNumber(row.sort_order),
    isPrimary: row.is_primary === true
  };
}

function toCategory(row: CategoryRow): PublicCatalogueCategory | undefined {
  if (row.is_published !== true) {
    return undefined;
  }

  const id = getString(row.id);
  const slug = getString(row.slug);
  const name = getString(row.name);

  if (!id || !slug || !name) {
    return undefined;
  }

  return {
    id,
    slug,
    name,
    description: getString(row.description),
    sortOrder: getNumber(row.sort_order)
  };
}

function toProduct(
  row: ProductRow,
  categoryById: Map<string, PublicCatalogueCategory>
): PublicCatalogueProduct | undefined {
  if (row.status !== "published") {
    return undefined;
  }

  const id = getString(row.id);
  const slug = getString(row.slug);
  const name = getString(row.name);

  if (!id || !slug || !name) {
    return undefined;
  }

  const images = toRows(row.product_images)
    .map((imageRow) => toImage(imageRow))
    .filter((image): image is PublicCatalogueImage => Boolean(image))
    .sort((first, second) => first.sortOrder - second.sortOrder);
  const primaryImage =
    images.find((image) => image.isPrimary) ?? images[0] ?? undefined;
  const categoryId = getString(row.category_id);
  const category = categoryId ? categoryById.get(categoryId) : undefined;

  return {
    id,
    slug,
    name,
    shortDescription: getString(row.short_description),
    description: getString(row.description),
    rentalUnit: getString(row.rental_unit) ?? "item",
    sortOrder: getNumber(row.sort_order),
    categoryId,
    categoryName: category?.name,
    primaryImage,
    source: "supabase"
  };
}

function getSupabase(options: PublicCatalogueRepositoryOptions = {}) {
  return (
    options.supabase ??
    (createServerSupabaseClient() as PublicCatalogueSupabaseResult)
  );
}

export function getFallbackCatalogue(): PublicCatalogue {
  return fallbackCatalogue;
}

export function getFallbackProductBySlug(slug: string) {
  return fallbackProducts.find((product) => product.slug === slug) ?? null;
}

export async function getPublicCatalogue(
  options: PublicCatalogueRepositoryOptions = {}
): Promise<PublicCatalogue> {
  const supabase = getSupabase(options);

  if (!supabase.configured) {
    return fallbackCatalogue;
  }

  const client = supabase.client;
  const categoriesQuery = client
    .from("categories")
    .select(categorySelect)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  const productsQuery = client
    .from("products")
    .select(productSelect)
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  const [categoriesResult, productsResult] = await Promise.all([
    categoriesQuery,
    productsQuery
  ]);

  if (categoriesResult.error || productsResult.error) {
    return fallbackCatalogue;
  }

  const categories = toRows(categoriesResult.data)
    .map((row) => toCategory(row))
    .filter((category): category is PublicCatalogueCategory =>
      Boolean(category)
    );
  const categoryById = new Map(
    categories.map((category) => [category.id, category])
  );
  const products = toRows(productsResult.data)
    .map((row) => toProduct(row, categoryById))
    .filter((product): product is PublicCatalogueProduct => Boolean(product));

  return {
    source: "supabase",
    categories,
    products
  };
}

export async function getPublicProductBySlug(
  slug: string,
  options: PublicCatalogueRepositoryOptions = {}
): Promise<PublicCatalogueProduct | null> {
  const fallbackProduct = getFallbackProductBySlug(slug);
  const supabase = getSupabase(options);

  if (!supabase.configured) {
    return fallbackProduct;
  }

  const client = supabase.client;
  const productResult = await client
    .from("products")
    .select(productSelect)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (productResult.error || !isRecord(productResult.data)) {
    return fallbackProduct;
  }

  return toProduct(productResult.data, new Map()) ?? fallbackProduct;
}
