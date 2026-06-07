import type { Metadata } from "next";

import {
  CataloguePageContent
} from "../catalogue/page";
import { getPublicCatalogue } from "../../lib/catalogue/catalogue-repository";
import { normalizePublicListingSlug } from "../../lib/catalogue/quote-handoff";
import type { PublicCatalogue } from "../../lib/catalogue/types";

type ListingsPageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rental listings | Space Koncept Rentals",
  description:
    "Browse public furniture and event rental listings, then send a quote enquiry to Space Koncept Rentals."
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function resolveCategoryFilter(
  searchParams: ListingsPageProps["searchParams"]
) {
  if (!searchParams) {
    return undefined;
  }

  const resolvedSearchParams = await searchParams;

  return normalizePublicListingSlug(firstSearchParam(resolvedSearchParams.category));
}

function filterCatalogueByCategory(
  catalogue: PublicCatalogue,
  categorySlug: string | undefined
): PublicCatalogue {
  if (!categorySlug) {
    return catalogue;
  }

  const category = catalogue.categories.find(
    (item) => item.slug === categorySlug
  );

  if (!category) {
    return {
      ...catalogue,
      products: []
    };
  }

  return {
    ...catalogue,
    products: catalogue.products.filter(
      (product) => product.categoryId === category.id
    )
  };
}

export default async function ListingsPage({
  searchParams
}: ListingsPageProps = {}) {
  const [catalogue, categorySlug] = await Promise.all([
    getPublicCatalogue(),
    resolveCategoryFilter(searchParams)
  ]);
  const activeCategory = categorySlug
    ? catalogue.categories.find((category) => category.slug === categorySlug)
    : undefined;
  const filteredCatalogue = filterCatalogueByCategory(catalogue, categorySlug);

  return (
    <CataloguePageContent
      activeCategoryName={activeCategory?.name}
      activeCategorySlug={categorySlug}
      catalogue={filteredCatalogue}
      detailBasePath="/listings"
      emptyMessage={
        activeCategory
          ? `No public rental listings match ${activeCategory.name} right now. Please send a general enquiry and the team can help.`
          : "No public rental listings match this view right now. Please send a general enquiry and the team can help."
      }
      intro={
        activeCategory
          ? `Browse public-safe ${activeCategory.name} rental/event furniture listings, then send an enquiry for the pieces that fit your event.`
          : "Browse public-safe rental/event furniture listings, then send an enquiry for the pieces that fit your event."
      }
      listingBasePath="/listings"
      title={
        activeCategory
          ? `${activeCategory.name} rental listings`
          : "Rental listings"
      }
    />
  );
}
