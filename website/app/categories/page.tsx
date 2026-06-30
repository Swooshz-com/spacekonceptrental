import type { Metadata } from "next";
import { getPublicCatalogue } from "../../lib/catalogue/catalogue-repository";
import type { PublicCatalogue } from "../../lib/catalogue/types";
import { StitchCatalogueShell } from "../../components/PublicStitch";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Rental categories | SpaceKonceptRental", description: "Browse public furniture and event rental categories and send a quote enquiry to SpaceKonceptRental." };

export function CategoriesPageContent({ catalogue }: { catalogue: PublicCatalogue }) {
  return <StitchCatalogueShell catalogue={catalogue} />;
}

export default async function CategoriesPage() {
  const catalogue = await getPublicCatalogue();
  return <CategoriesPageContent catalogue={catalogue} />;
}
