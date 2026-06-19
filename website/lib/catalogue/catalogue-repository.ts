import "server-only";

import {
  getCatalogueWorkspaceId,
  getSupabasePublicStorageBaseUrl
} from "../server-runtime-config";
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
  rpc: (
    functionName: string,
    args: Record<string, unknown>
  ) => PromiseLike<SupabaseQueryResult>;
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
  workspaceId?: string;
  supabase?: PublicCatalogueSupabaseResult;
  env?: {
    CATALOGUE_WORKSPACE_ID?: string;
    SUPABASE_URL?: string;
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
  category_name?: unknown;
  slug?: unknown;
  name?: unknown;
  short_description?: unknown;
  description?: unknown;
  rental_unit?: unknown;
  status?: unknown;
  sort_order?: unknown;
  product_images?: unknown;
};

type CatalogueRpcPayload = {
  categories?: unknown;
  products?: unknown;
};

const fallbackCatalogue: PublicCatalogue = {
  source: "fallback",
  categories: [],
  products: []
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

function toCataloguePayload(value: unknown): CatalogueRpcPayload | undefined {
  return isRecord(value) ? value : undefined;
}

function isSafeStoragePath(value: string) {
  return (
    value.length > 0 &&
    value.length <= 512 &&
    !value.includes("..") &&
    !value.includes("\\") &&
    !value.startsWith("/")
  );
}

function buildPublicImageUrl(
  storageBucket: string,
  storagePath: string,
  options: PublicCatalogueRepositoryOptions
) {
  if (!isSafeStoragePath(storagePath)) {
    return undefined;
  }

  const base = getSupabasePublicStorageBaseUrl(options.env ?? process.env);

  if (!base) {
    return undefined;
  }

  const encodedPath = storagePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${base}/${encodeURIComponent(storageBucket)}/${encodedPath}`;
}

function toImage(
  row: ImageRow,
  options: PublicCatalogueRepositoryOptions
): PublicCatalogueImage | undefined {
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
    publicUrl: buildPublicImageUrl(storageBucket, storagePath, options),
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
  categoryById: Map<string, PublicCatalogueCategory>,
  options: PublicCatalogueRepositoryOptions
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
    .map((imageRow) => toImage(imageRow, options))
    .filter((image): image is PublicCatalogueImage => Boolean(image))
    .sort((first, second) => first.sortOrder - second.sortOrder);
  const primaryImage =
    images.find((image) => image.isPrimary) ?? images[0] ?? undefined;
  const categoryId = getString(row.category_id);
  const category = categoryId ? categoryById.get(categoryId) : undefined;
  const categoryName = getString(row.category_name) ?? category?.name;

  return {
    id,
    slug,
    name,
    shortDescription: getString(row.short_description),
    description: getString(row.description),
    rentalUnit: getString(row.rental_unit) ?? "item",
    sortOrder: getNumber(row.sort_order),
    categoryId,
    categoryName,
    images,
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

function readCatalogueWorkspaceId(options: PublicCatalogueRepositoryOptions) {
  if (options.workspaceId !== undefined) {
    return (
      getCatalogueWorkspaceId({
        CATALOGUE_WORKSPACE_ID: options.workspaceId
      }) ?? undefined
    );
  }

  return getCatalogueWorkspaceId(options.env ?? process.env) ?? undefined;
}

async function readCatalogueRpcPayload(
  client: PublicCatalogueSupabaseClient,
  workspaceId: string,
  productSlug: string | null
) {
  const result = await client.rpc("get_public_catalogue", {
    expected_workspace_id: workspaceId,
    product_slug: productSlug
  });

  if (result.error) {
    return undefined;
  }

  return toCataloguePayload(result.data);
}

function mapCataloguePayload(
  payload: CatalogueRpcPayload,
  options: PublicCatalogueRepositoryOptions
): PublicCatalogue {
  const categories = toRows(payload.categories)
    .map((row) => toCategory(row))
    .filter((category): category is PublicCatalogueCategory =>
      Boolean(category)
    );
  const categoryById = new Map(
    categories.map((category) => [category.id, category])
  );
  const products = toRows(payload.products)
    .map((row) => toProduct(row, categoryById, options))
    .filter((product): product is PublicCatalogueProduct => Boolean(product));

  return {
    source: "supabase",
    categories,
    products
  };
}

export function getFallbackCatalogue(): PublicCatalogue {
  return fallbackCatalogue;
}

export function getFallbackProductBySlug(_slug: string) {
  return null;
}

export async function getPublicCatalogue(
  options: PublicCatalogueRepositoryOptions = {}
): Promise<PublicCatalogue> {
  const supabase = getSupabase(options);

  if (!supabase.configured) {
    return fallbackCatalogue;
  }

  const workspaceId = readCatalogueWorkspaceId(options);

  if (!workspaceId) {
    return fallbackCatalogue;
  }

  const payload = await readCatalogueRpcPayload(
    supabase.client,
    workspaceId,
    null
  );

  return payload ? mapCataloguePayload(payload, options) : fallbackCatalogue;
}

export async function getPublicProductBySlug(
  slug: string,
  options: PublicCatalogueRepositoryOptions = {}
): Promise<PublicCatalogueProduct | null> {
  const supabase = getSupabase(options);

  if (!supabase.configured) {
    return null;
  }

  const workspaceId = readCatalogueWorkspaceId(options);

  if (!workspaceId) {
    return null;
  }

  const payload = await readCatalogueRpcPayload(supabase.client, workspaceId, slug);

  if (!payload) {
    return null;
  }

  const catalogue = mapCataloguePayload(payload, options);

  return catalogue.products.find((product) => product.slug === slug) ?? null;
}
