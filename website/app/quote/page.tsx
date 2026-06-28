import type { Metadata } from "next";
import QuoteRequestForm from "../../components/QuoteRequestForm";
import { QuoteSelectionSummary } from "../../components/QuoteSelectionControls";
import { getPublicProductBySlug } from "../../lib/catalogue/catalogue-repository";
import { normalizePublicDiscoveryContext, normalizePublicListingSlug } from "../../lib/catalogue/quote-handoff";
import type { PublicCatalogueProduct } from "../../lib/catalogue/types";
import { fallbackProductImage, getDemoProducts, isDemoContentEnabled, productCategory, stitchImageSrc } from "../../components/PublicStitch";

type QuotePageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined> };
type QuoteSelectionProduct = PublicCatalogueProduct | ReturnType<typeof getDemoProducts>[number];

export const metadata: Metadata = { title: "Quote request | SpaceKonceptRental", description: "Submit an event furniture rental enquiry with event date, venue, requested listings, quantities, and setup notes for manual team follow-up.", openGraph: { title: "Quote request | SpaceKonceptRental", description: "Submit a rental enquiry for manual follow-up from the SpaceKonceptRental team.", siteName: "SpaceKonceptRental", type: "website", url: "/quote" } };

function firstSearchParam(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
async function resolveQuoteListingContext(searchParams: QuotePageProps["searchParams"]) {
  if (!searchParams) return { product:null, requestedSlug:undefined, category:undefined, event:undefined, search:undefined };
  const resolved = await searchParams;
  const slug = normalizePublicListingSlug(firstSearchParam(resolved.listing));
  const realProduct = slug ? await getPublicProductBySlug(slug) : null;
  const demoProduct = slug && isDemoContentEnabled() ? getDemoProducts().find((product) => product.slug === slug) ?? null : null;
  return { product: realProduct ?? demoProduct, requestedSlug: slug, category: normalizePublicListingSlug(firstSearchParam(resolved.category)), event: normalizePublicListingSlug(firstSearchParam(resolved.event)), search: normalizePublicDiscoveryContext(firstSearchParam(resolved.search)) };
}
function buildInitialItemsText({ category, event, product, requestedSlug, search }: { category?: string; event?: string; product: QuoteSelectionProduct | null; requestedSlug?: string; search?: string }) { return [product?.name ?? (requestedSlug ? `Listing reference: ${requestedSlug}` : undefined), category ? `Category interest: ${category}` : undefined, event ? `Event-use interest: ${event}` : undefined, search ? `Search interest: ${search}` : undefined].filter(Boolean).join("\n"); }
function quoteProductImageSrc(product: QuoteSelectionProduct) { const image = "images" in product ? product.images?.[0]?.publicUrl : undefined; return image ?? stitchImageSrc(fallbackProductImage(product)); }

function SelectionPanel({ product, requestedSlug, category, event, search }: { product: QuoteSelectionProduct | null; requestedSlug?: string; category?: string; event?: string; search?: string }) {
  const fallbackItems = product ? [{ slug: product.slug, name: product.name, category: productCategory(product), quantity: 1, imageSrc: quoteProductImageSrc(product) }] : [];
  return <QuoteSelectionSummary fallbackItems={fallbackItems} requestedSlug={requestedSlug} category={category} event={event} search={search} />;
}

function NextStepsPanel() {
  return <section className="stitch-quote-card stitch-quote-next"><p className="stitch-eyebrow">What happens next?</p><h2>What happens next?</h2><ol><li>Enquiry</li><li>Selection review</li><li>Tailored proposal</li><li>Direct team follow-up</li></ol><p>This request does not confirm final rental details. It does not set aside furniture or finish rental details.</p></section>;
}

export default async function QuotePage({ searchParams }: QuotePageProps = {}) {
  const context = await resolveQuoteListingContext(searchParams);
  const initialItemsText = buildInitialItemsText({ category: context.category, event: context.event, product: context.product, requestedSlug: context.requestedSlug, search: context.search });
  return <section className="stitch-quote-page"><div className="stitch-container"><div className="stitch-quote-intro"><p className="stitch-eyebrow">Request Quote</p><h1>Request a Rental Quote</h1><p>The form is enquiry intake only. Submit your selection for manual review. The team will review your details and follow up with a tailored proposal.</p></div><div className="stitch-quote-layout"><div className="stitch-quote-left"><SelectionPanel product={context.product} requestedSlug={context.requestedSlug} category={context.category} event={context.event} search={context.search} /><NextStepsPanel /></div><section className="stitch-quote-form-panel"><h2>Enquiry Details</h2><QuoteRequestForm initialItemsText={initialItemsText} initialListingSlug={context.requestedSlug} /></section></div></div></section>;
}
