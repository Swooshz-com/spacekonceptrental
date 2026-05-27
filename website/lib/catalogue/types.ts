export type PublicCatalogueSource = "fallback" | "supabase";

export type PublicCatalogueCategory = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  sortOrder: number;
};

export type PublicCatalogueImage = {
  id: string;
  storageBucket: string;
  storagePath: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
};

export type PublicCatalogueProduct = {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string;
  description?: string;
  rentalUnit: string;
  sortOrder: number;
  categoryId?: string;
  categoryName?: string;
  primaryImage?: PublicCatalogueImage;
  source: PublicCatalogueSource;
};

export type PublicCatalogue = {
  source: PublicCatalogueSource;
  categories: PublicCatalogueCategory[];
  products: PublicCatalogueProduct[];
};
