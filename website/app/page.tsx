import type { Metadata } from "next";
import { getPublicCatalogue } from "../lib/catalogue/catalogue-repository";
import { getPublicHomepageHeroContent } from "../lib/hero/public-homepage-hero-repository";
import { QuoteSelectionDataBoundary } from "../components/QuoteSelectionControls";
import {
  quoteSelectionValidItemsForCatalogue,
  StitchAdvantageCards,
  StitchCategoryPreview,
  StitchFeaturedPieces,
  StitchHomeHero
} from "../components/PublicStitch";

export const metadata: Metadata = {
  title: "SpaceKonceptRental | Event furniture rental",
  description:
    "Browse listings for rental furniture, explore curated setups, and submit a rental enquiry for manual follow-up.",
  openGraph: {
    title: "Event furniture rental catalogue | SpaceKonceptRental",
    description: "Browse rental listings and send a quote request for manual follow-up.",
    siteName: "SpaceKonceptRental",
    type: "website",
    url: "/"
  }
};

export default async function HomePage() {
  const [catalogue, heroContent] = await Promise.all([
    getPublicCatalogue(),
    getPublicHomepageHeroContent()
  ]);

  return (
    <>
      <QuoteSelectionDataBoundary validItems={quoteSelectionValidItemsForCatalogue(catalogue)} />
      <StitchHomeHero heroContent={heroContent} />
      <StitchAdvantageCards />
      <StitchCategoryPreview catalogue={catalogue} />
      <StitchFeaturedPieces catalogue={catalogue} />
    </>
  );
}
