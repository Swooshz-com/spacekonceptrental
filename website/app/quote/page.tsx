import type { Metadata } from "next";
import QuoteRequestForm from "../../components/QuoteRequestForm";
import { QuoteSelectionDataBoundary, QuoteSelectionSummary } from "../../components/QuoteSelectionControls";
import { fallbackProductImage, productCategory, quoteCanonicalIdentities, quoteSelectionValidItemsForCatalogue, StitchPageIntro, stitchImageSrc } from "../../components/PublicStitch";
import { getPublicCatalogue, getPublicProductBySlug } from "../../lib/catalogue/catalogue-repository";
import { normalizePublicListingSlug, normalizePublicQuoteQuantity } from "../../lib/catalogue/quote-handoff";
import type { PublicCatalogueProduct } from "../../lib/catalogue/types";
import type { CanonicalCatalogueIdentity } from "../../lib/quote/selection-model";

type QuotePageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined> };

export const metadata: Metadata = { title: "Quote request | SpaceKonceptRental", description: "Submit an event furniture rental enquiry with event date, venue, requested listings, quantities, and setup notes for manual team follow-up.", openGraph: { title: "Quote request | SpaceKonceptRental", description: "Submit a rental enquiry for manual follow-up from the SpaceKonceptRental team.", siteName: "SpaceKonceptRental", type: "website", url: "/quote" } };

function firstSearchParam(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
async function resolveQuoteListingContext(searchParams: QuotePageProps["searchParams"]) {
  if (!searchParams) return { product:null, requestedSlug:undefined, quantity:undefined };
  const resolved = await searchParams;
  const slug = normalizePublicListingSlug(firstSearchParam(resolved.listing));
  const quantity = normalizePublicQuoteQuantity(firstSearchParam(resolved.qty));
  const hasValidFallback = Boolean(slug && quantity);
  const realProduct = hasValidFallback && slug ? await getPublicProductBySlug(slug) : null;
  return { product: realProduct, requestedSlug: slug, quantity: hasValidFallback ? quantity : undefined };
}
function quoteProductImageSrc(product: PublicCatalogueProduct) { const image = product.images?.[0]?.publicUrl; return image ?? stitchImageSrc(fallbackProductImage(product)); }

function SelectionPanel({ catalogueAvailable, product, quantity, requestedSlug, validItems }: { catalogueAvailable: boolean; product: PublicCatalogueProduct | null; quantity?: number; requestedSlug?: string; validItems: ReturnType<typeof quoteSelectionValidItemsForCatalogue> }) {
  const fallbackItems = product && quantity ? [{ slug: product.slug, name: product.name, category: productCategory(product), quantity, imageSrc: quoteProductImageSrc(product) }] : [];
  return <QuoteSelectionSummary catalogueAvailable={catalogueAvailable} fallbackItems={fallbackItems} requestedSlug={requestedSlug} validItems={validItems} />;
}

function NextStepsPanel() {
  return <section className="stitch-quote-card stitch-quote-next"><p className="stitch-eyebrow">What happens next?</p><h2>What happens next?</h2><ol><li>Enquiry</li><li>Selection review</li><li>Tailored proposal</li><li>Direct team follow-up</li></ol></section>;
}

export default async function QuotePage({ searchParams }: QuotePageProps = {}) {
  const [catalogue, context] = await Promise.all([
    getPublicCatalogue(),
    resolveQuoteListingContext(searchParams)
  ]);
  const validItems = quoteSelectionValidItemsForCatalogue(catalogue);
  const canonicalIdentities: CanonicalCatalogueIdentity[] = quoteCanonicalIdentities(catalogue);
  return <><QuoteSelectionDataBoundary validItems={validItems} /><section className="stitch-quote-hero"><div className="stitch-container"><StitchPageIntro eyebrow="Request Quote" title="Request a Rental Quote" intro="The form is enquiry intake only. The team will review your details and follow up with a tailored proposal. It does not set aside furniture or finish rental details. Submission remains unavailable during the current review." /></div></section><section className="stitch-section stitch-quote-page"><div className="stitch-container"><div className="stitch-quote-layout"><div className="stitch-quote-left"><SelectionPanel catalogueAvailable={catalogue.source !== "fallback"} product={context.product} quantity={context.quantity} requestedSlug={context.requestedSlug} validItems={validItems} /><NextStepsPanel /></div><section className="stitch-quote-form-panel"><h2>Enquiry Details</h2><QuoteRequestForm initialListingSlug={context.requestedSlug} validCanonicalIdentities={canonicalIdentities} /></section></div></div></section></>;
}
