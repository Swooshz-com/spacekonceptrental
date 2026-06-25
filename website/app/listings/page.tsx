import type { Metadata } from "next";
import { getPublicCatalogue } from "../../lib/catalogue/catalogue-repository";
import { StitchSetupsPage } from "../../components/PublicStitch";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Setups | SpaceKonceptRental", description: "Explore furniture listing setups and request an enquiry.", openGraph: { title: "Furniture listing setups | SpaceKonceptRental", description: "Explore public setup listings and request an enquiry.", siteName: "SpaceKonceptRental", type: "website", url: "/listings" } };

export default async function ListingsPage() {
  const catalogue = await getPublicCatalogue();
  return <StitchSetupsPage catalogue={catalogue} />;
}
