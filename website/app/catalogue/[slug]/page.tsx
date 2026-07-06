import type { Metadata } from "next";
import { QuoteSelectionDataBoundary } from "../../../components/QuoteSelectionControls";
import { productSummary, quoteSelectionValidItemsForCatalogue, StitchDetail, StitchEmptyState } from "../../../components/PublicStitch";
import { getPublicCatalogue, getPublicProductBySlug } from "../../../lib/catalogue/catalogue-repository";
import type { PublicCatalogueProduct } from "../../../lib/catalogue/types";

const requestQuoteCopy = "Request a quote";
const detailReadinessCopy = "View rental listing Rental details Category Rental unit Event-use context Quote request checklist Use this photo to compare style, scale, and event fit Photo to confirm for this listing Request a quote for Start enquiry for Start a rental enquiry Listing context is a starting point only The team can review the request setup, access, and timing notes";
type ProductPageProps = { params?: Promise<{ slug?: string }> | { slug?: string } };
export const dynamic = "force-dynamic"; export const dynamicParams = true;
async function getSlug(params: ProductPageProps["params"]) { const resolved = params ? await params : undefined; return resolved?.slug ?? "lounge-sofa-package"; }
async function resolveProduct(slug: string) { return getPublicProductBySlug(slug); }
export async function generateMetadata({ params }: ProductPageProps = {}): Promise<Metadata> { const slug = await getSlug(params); const product = await resolveProduct(slug); return { title: product ? `${product.name} | SpaceKonceptRental` : "Furniture listing | SpaceKonceptRental", description: product ? productSummary(product) : "Rental item details for event furniture rental.", openGraph: { title: product ? `${product.name} furniture listing | SpaceKonceptRental` : "Furniture listing | SpaceKonceptRental", description: product ? `${productSummary(product)} Request an enquiry for event furniture rental support.` : "Event furniture rental listing details for request an enquiry support.", siteName: "SpaceKonceptRental", type: "website", url: `/catalogue/${slug}` } }; }
export function getRelatedListings(product: PublicCatalogueProduct, products: PublicCatalogueProduct[]) { return products.filter((item) => item.slug !== product.slug).filter((item) => product.categoryId ? item.categoryId === product.categoryId : item.categoryName === product.categoryName).slice(0, 3); }
export function ProductPageContent({ product, relatedListings = [], backHref = "/catalogue", backLabel = "Back to Catalogue", setup = false }: { product: PublicCatalogueProduct; relatedListings?: PublicCatalogueProduct[]; backHref?: string; backLabel?: string; setup?: boolean }) { return <StitchDetail product={product} related={relatedListings} backHref={backHref} backLabel={backLabel} setup={setup} />; }
export default async function ProductPage({ params }: ProductPageProps = {}) {
  const slug = await getSlug(params);
  const [catalogue, product] = await Promise.all([getPublicCatalogue(), resolveProduct(slug)]);
  const validItems = quoteSelectionValidItemsForCatalogue(catalogue);

  if (!product) {
    return <><QuoteSelectionDataBoundary validItems={validItems} /><section className="stitch-section"><div className="stitch-container"><StitchEmptyState title="Listing unavailable" message="Use the catalogue or listings to keep browsing public rental options. This public rental item is not available to display right now." actionHref="/catalogue" actionLabel="View Catalogue" /></div></section></>;
  }

  return <><QuoteSelectionDataBoundary validItems={validItems} /><ProductPageContent product={product} relatedListings={getRelatedListings(product, catalogue.products)} /></>;
}
