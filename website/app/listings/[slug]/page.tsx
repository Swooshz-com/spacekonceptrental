import type { Metadata } from "next";
import { getPublicCatalogue, getPublicProductBySlug } from "../../../lib/catalogue/catalogue-repository";
import { getRelatedListings, ProductPageContent } from "../../catalogue/[slug]/page";
import { productSummary, StitchEmptyState } from "../../../components/PublicStitch";

type ListingPageProps = { params?: Promise<{ slug?: string }> | { slug?: string } };
export const dynamic = "force-dynamic"; export const dynamicParams = true;
async function getSlug(params: ListingPageProps["params"]) { const resolved = params ? await params : undefined; return resolved?.slug ?? "lounge-sofa-package"; }
export async function generateMetadata({ params }: ListingPageProps = {}): Promise<Metadata> { const slug = await getSlug(params); const product = await getPublicProductBySlug(slug); return { title: product ? `${product.name} setup | SpaceKonceptRental` : "Setup detail | SpaceKonceptRental", description: product ? productSummary(product) : "Rental setup detail." }; }
export default async function ListingPage({ params }: ListingPageProps = {}) { const slug = await getSlug(params); const product = await getPublicProductBySlug(slug); if (!product) return <section className="stitch-section"><div className="stitch-container"><StitchEmptyState title="This setup is unavailable." message="This public setup record is not available to display right now. Explore current setup records or send a rental enquiry with your setup direction." actionHref="/listings" actionLabel="Back to Setups" /></div></section>; const catalogue = await getPublicCatalogue(); return <ProductPageContent product={product} relatedListings={getRelatedListings(product, catalogue.products)} backHref="/listings" backLabel="Back to Setups" setup />; }
