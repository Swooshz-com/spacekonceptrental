import type { Metadata } from "next";
import { getPublicCatalogue } from "../../lib/catalogue/catalogue-repository";
import type { PublicCatalogue } from "../../lib/catalogue/types";
import { StitchCatalogueShell } from "../../components/PublicStitch";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Catalogue | SpaceKonceptRental", description: "Browse individual rental furniture and item records.", openGraph: { title: "Furniture catalogue | SpaceKonceptRental", description: "Browse public rental listings and start a quote request.", siteName: "SpaceKonceptRental", type: "website", url: "/catalogue" } };

export function CataloguePageContent({ catalogue, detailBasePath = "/catalogue", emptyMessage, title, intro }: { catalogue: PublicCatalogue; detailBasePath?: string; emptyMessage?: string; title?: string; intro?: string; activeCategoryName?: string; activeCategorySlug?: string; activeEventLabel?: string; activeEventSlug?: string; activeSearch?: string; listingBasePath?: string }) {
  return <StitchCatalogueShell catalogue={catalogue} detailBasePath={detailBasePath} emptyMessage={emptyMessage} title={title} intro={intro} />;
}

export default async function CataloguePage() {
  const catalogue = await getPublicCatalogue();
  return <CataloguePageContent catalogue={catalogue} />;
}
