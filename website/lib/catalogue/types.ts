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
  publicUrl?: string;
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
  images?: PublicCatalogueImage[];
  primaryImage?: PublicCatalogueImage;
  source: PublicCatalogueSource;
  productKind?: ProductKind;
  safeSetupComposition?: SafeSetupComposition | null;
};

export type ProductKind = "rental" | "setup";

export type SafeSetupCompositionItem = {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string;
  rentalUnit: string;
  images: PublicCatalogueImage[];
  position: number;
  baseQuantity: number;
};

export type SafeSetupComposition = SafeSetupCompositionItem[];

export type PublicCatalogue = {
  source: PublicCatalogueSource;
  categories: PublicCatalogueCategory[];
  products: PublicCatalogueProduct[];
};
