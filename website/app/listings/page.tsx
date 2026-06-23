import type { Metadata } from "next";

import {
  CataloguePageContent
} from "../catalogue/page";
import { getPublicCatalogue } from "../../lib/catalogue/catalogue-repository";
import { normalizePublicDiscoveryContext, normalizePublicListingSlug } from "../../lib/catalogue/quote-handoff";
import { eventUseFilters } from "../catalogue/page";
import type { PublicCatalogue } from "../../lib/catalogue/types";

type ListingsPageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Setups | Space Koncept Rental",
  description:
    "Browse public furniture and event rental setups, then send a quote enquiry to Space Koncept Rental."
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function resolveDiscoveryFilters(
  searchParams: ListingsPageProps["searchParams"]
) {
  if (!searchParams) {
    return {
      categorySlug: undefined,
      eventSlug: undefined,
      search: undefined
    };
  }

  const resolvedSearchParams = await searchParams;

  return {
    categorySlug: normalizePublicListingSlug(
      firstSearchParam(resolvedSearchParams.category)
    ),
    eventSlug: normalizePublicListingSlug(
      firstSearchParam(resolvedSearchParams.event)
    ),
    search: normalizePublicDiscoveryContext(
      firstSearchParam(resolvedSearchParams.search)
    )
  };
}


function listingSearchText(product: PublicCatalogue["products"][number]) {
  return [
    product.name,
    product.slug,
    product.shortDescription,
    product.description,
    product.categoryName,
    product.rentalUnit
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function filterCatalogueByDiscovery(
  catalogue: PublicCatalogue,
  filters: { categorySlug?: string; eventSlug?: string; search?: string }
): PublicCatalogue {
  const category = filters.categorySlug
    ? catalogue.categories.find((item) => item.slug === filters.categorySlug)
    : undefined;
  const eventUse = filters.eventSlug
    ? eventUseFilters.find((item) => item.slug === filters.eventSlug)
    : undefined;

  if ((filters.categorySlug && !category) || (filters.eventSlug && !eventUse)) {
    return {
      ...catalogue,
      products: []
    };
  }

  const searchTerms = filters.search?.split(/\s+/).filter(Boolean) ?? [];

  return {
    ...catalogue,
    products: catalogue.products.filter((product) => {
      const text = listingSearchText(product);
      const matchesCategory = category ? product.categoryId === category.id : true;
      const matchesEvent = eventUse
        ? eventUse.terms.some((term) => text.includes(term))
        : true;
      const matchesSearch = searchTerms.every((term) => text.includes(term));

      return matchesCategory && matchesEvent && matchesSearch;
    })
  };
}

export default async function ListingsPage({
  searchParams
}: ListingsPageProps = {}) {
  const [catalogue, filters] = await Promise.all([
    getPublicCatalogue(),
    resolveDiscoveryFilters(searchParams)
  ]);
  const activeCategory = filters.categorySlug
    ? catalogue.categories.find((category) => category.slug === filters.categorySlug)
    : undefined;
  const activeEventUse = filters.eventSlug
    ? eventUseFilters.find((eventUse) => eventUse.slug === filters.eventSlug)
    : undefined;
  const filteredCatalogue = filterCatalogueByDiscovery(catalogue, filters);

  return (
    <CataloguePageContent
      activeCategoryName={activeCategory?.name}
      activeCategorySlug={filters.categorySlug}
      activeEventLabel={activeEventUse?.label}
      activeEventSlug={filters.eventSlug}
      activeSearch={filters.search}
      catalogue={filteredCatalogue}
      detailBasePath="/listings"
      emptyMessage={
        activeCategory || activeEventUse || filters.search
          ? "No public rental listings match these local filters right now. Browse all setups, adjust the search/filter context, or send a quote request for team review."
          : "No public rental listings match this view right now. Browse catalogue filters, explore setup ideas, or send a quote request for team review."
      }
      intro={
        activeCategory || activeEventUse || filters.search
          ? "Browse filtered public-safe rental/event furniture setups. Search, category, and event-use context stays editable before you send a quote request."
          : "Browse public furniture and event rental setups, then send a quote request for the pieces that fit your event."
      }
      listingBasePath="/listings"
      title={
        activeCategory
          ? `${activeCategory.name} setups`
          : "Setups"
      }
    />
  );
}
