import type { Metadata } from "next";
import { QuoteSelectionDataBoundary } from "../../../components/QuoteSelectionControls";
import { productSummary, quoteSelectionValidItemsForCatalogue, StitchEmptyState } from "../../../components/PublicStitch";
import { getPublicCatalogue, getPublicProductBySlug } from "../../../lib/catalogue/catalogue-repository";
import { getRelatedListings, ProductPageContent } from "../../catalogue/[slug]/page";

type ListingPageProps = { params?: Promise<{ slug?: string }> | { slug?: string } };
export const dynamic = "force-dynamic"; export const dynamicParams = true;
async function getSlug(params: ListingPageProps["params"]) { const resolved = params ? await params : undefined; return resolved?.slug ?? "the-metropolitan-gala"; }
async function resolveSetup(slug: string) {
  const directProduct = await getPublicProductBySlug(slug);
  if (directProduct) return directProduct;
  const catalogue = await getPublicCatalogue();
  return catalogue.products.find((product) => product.slug === slug) ?? null;
}
export async function generateMetadata({ params }: ListingPageProps = {}): Promise<Metadata> { const slug = await getSlug(params); const product = await resolveSetup(slug); return { title: product ? `${product.name} setup | SpaceKonceptRental` : "Setup detail | SpaceKonceptRental", description: product ? productSummary(product) : "Rental setup detail for quote request support.", openGraph: { title: product ? `${product.name} rental listing | SpaceKonceptRental` : "Rental listing setup | SpaceKonceptRental", description: product ? `${productSummary(product)} Start a quote request for this setup.` : "Rental listing setup details for a quote request.", siteName: "SpaceKonceptRental", type: "website", url: `/listings/${slug}` } }; }
export default async function ListingPage({ params }: ListingPageProps = {}) {
  const slug = await getSlug(params);
  const [catalogue, product] = await Promise.all([getPublicCatalogue(), resolveSetup(slug)]);
  const validItems = quoteSelectionValidItemsForCatalogue(catalogue);

  if (!product) {
    return <><QuoteSelectionDataBoundary validItems={validItems} /><section className="stitch-section"><div className="stitch-container"><StitchEmptyState title="Listing unavailable" message="Use the catalogue or listings to keep browsing public rental options. This public setup record is not available to display right now." actionHref="/listings#setup-listings" actionLabel="View Setups" /></div></section></>;
  }

  return <><QuoteSelectionDataBoundary validItems={validItems} /><ProductPageContent product={product} relatedListings={getRelatedListings(product, catalogue.products)} backHref="/listings#setup-listings" backLabel="Back to Setups" setup /></>;
}
