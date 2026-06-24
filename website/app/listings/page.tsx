import type { Metadata } from "next";
import { getPublicCatalogue } from "../../lib/catalogue/catalogue-repository";
import { CataloguePageContent } from "../catalogue/page";

export const dynamic = "force-dynamic";
const listingsEmptyStateCopy = "No public rental listings match this view";
export const metadata: Metadata = { title: "Setups | SpaceKonceptRental", description: "Explore furniture listing setups and request an enquiry.", openGraph: { title: "Furniture listing setups | SpaceKonceptRental", description: "Explore public setup listings and request an enquiry.", siteName: "SpaceKonceptRental", type: "website", url: "/listings" } };

export default async function ListingsPage() {
  const catalogue = await getPublicCatalogue();
  return <CataloguePageContent catalogue={catalogue} detailBasePath="/listings" title="Rental listings" intro="Use setup references to describe the rental mood, scale, and event context you want the team to review." />;
}
