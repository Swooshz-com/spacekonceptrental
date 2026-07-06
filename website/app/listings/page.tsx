import type { Metadata } from "next";
import { QuoteSelectionDataBoundary } from "../../components/QuoteSelectionControls";
import { quoteSelectionValidItemsForCatalogue, StitchSetupsPage } from "../../components/PublicStitch";
import { getPublicCatalogue } from "../../lib/catalogue/catalogue-repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Setups | SpaceKonceptRental", description: "Explore furniture listing setups and request an enquiry.", openGraph: { title: "Furniture listing setups | SpaceKonceptRental", description: "Explore public setup listings and request an enquiry.", siteName: "SpaceKonceptRental", type: "website", url: "/listings" } };

type ListingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ListingsPage({ searchParams }: ListingsPageProps = {}) {
  const catalogue = await getPublicCatalogue();
  const params = searchParams ? await searchParams : {};
  return <><QuoteSelectionDataBoundary validItems={quoteSelectionValidItemsForCatalogue(catalogue)} /><StitchSetupsPage activeSetupSlug={firstParam(params.setup)} catalogue={catalogue} /></>;
}
