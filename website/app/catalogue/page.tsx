import type { Metadata } from "next";
import { getPublicCatalogue } from "../../lib/catalogue/catalogue-repository";
import type { PublicCatalogue } from "../../lib/catalogue/types";
import { StitchCatalogueShell } from "../../components/PublicStitch";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Catalogue | SpaceKonceptRental", description: "Browse individual rental furniture and item records.", openGraph: { title: "Furniture catalogue | SpaceKonceptRental", description: "Browse public rental listings and start a quote request.", siteName: "SpaceKonceptRental", type: "website", url: "/catalogue" } };

type CataloguePageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined> };

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function CataloguePageContent({ catalogue, detailBasePath = "/catalogue", emptyMessage, title, intro, activeCategorySlug, activeStyleSlug }: { catalogue: PublicCatalogue; detailBasePath?: string; emptyMessage?: string; title?: string; intro?: string; activeCategoryName?: string; activeCategorySlug?: string; activeEventLabel?: string; activeEventSlug?: string; activeSearch?: string; activeStyleSlug?: string; listingBasePath?: string }) {
  return <StitchCatalogueShell catalogue={catalogue} detailBasePath={detailBasePath} emptyMessage={emptyMessage} title={title} intro={intro} activeCategorySlug={activeCategorySlug} activeStyleSlug={activeStyleSlug} />;
}

export default async function CataloguePage({ searchParams }: CataloguePageProps = {}) {
  const catalogue = await getPublicCatalogue();
  const params = searchParams ? await searchParams : {};
  return <CataloguePageContent catalogue={catalogue} activeCategorySlug={firstParam(params.category)} activeStyleSlug={firstParam(params.style)} />;
}
