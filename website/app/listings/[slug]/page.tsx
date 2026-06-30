import type { Metadata } from "next";
import { getPublicCatalogue, getPublicProductBySlug } from "../../../lib/catalogue/catalogue-repository";
import { getRelatedListings, ProductPageContent } from "../../catalogue/[slug]/page";
import { fallbackProductImage, getDemoProducts, getDemoSetupImageSrc, isDemoContentEnabled, productSummary, stitchImageSrc, StitchEmptyState } from "../../../components/PublicStitch";
import type { PublicCatalogueProduct } from "../../../lib/catalogue/types";

type ListingPageProps = { params?: Promise<{ slug?: string }> | { slug?: string } };
export const dynamic = "force-dynamic"; export const dynamicParams = true;
async function getSlug(params: ListingPageProps["params"]) { const resolved = params ? await params : undefined; return resolved?.slug ?? "the-metropolitan-gala"; }
function demoSetupForSlug(slug: string): PublicCatalogueProduct | null {
  if (!isDemoContentEnabled()) return null;
  const demoSetups: Record<string, { name: string; summary: string; sortOrder: number }> = {
    "the-metropolitan-gala": {
      name: "The Metropolitan Gala",
      summary: "Tonal layering, sculptural surfaces, and lounge pieces for elevated evening event settings.",
      sortOrder: 1
    },
    "botanical-wedding": {
      name: "Botanical Wedding",
      summary: "Organic silhouettes and soft seating cues for daylight celebrations and garden-led spaces.",
      sortOrder: 2
    },
    "executive-summit": {
      name: "Executive Summit",
      summary: "Structured furniture groupings for focused sessions, reception points, and calm networking areas.",
      sortOrder: 3
    },
    "intimate-nocturne": {
      name: "Intimate Nocturne",
      summary: "Warm low-light dining cues with layered surfaces, soft seating, and enclosed atmosphere.",
      sortOrder: 4
    },
    "terrace-lounge": {
      name: "Terrace Lounge",
      summary: "Low-profile lounge references for alfresco mingling, relaxed conversation, and sculptural accents.",
      sortOrder: 5
    },
    "gallery-exhibition": {
      name: "Gallery Exhibition",
      summary: "Minimal display-friendly layouts that leave room for launches, galleries, and product showcases.",
      sortOrder: 6
    },
    "atrium-showcase": {
      name: "Atrium Showcase",
      summary: "Open-plan reception zones with display plinths, counter support, and lounge pauses for showcase-led events.",
      sortOrder: 7
    },
    "press-preview-lounge": {
      name: "Press Preview Lounge",
      summary: "A compact editorial lounge direction for previews, interviews, and quiet brand hospitality.",
      sortOrder: 8
    }
  };
  const setup = demoSetups[slug];
  if (!setup) return null;
  const imageUrl = getDemoSetupImageSrc(slug);
  return {
    id: `demo-${slug}`,
    slug,
    name: setup.name,
    shortDescription: setup.summary,
    description: setup.summary,
    rentalUnit: "setup",
    sortOrder: setup.sortOrder,
    categoryId: "setups",
    categoryName: "Setups",
    primaryImage: imageUrl
      ? {
          id: `demo-${slug}-image`,
          storageBucket: "demo",
          storagePath: slug,
          publicUrl: imageUrl,
          altText: `${setup.name} event setup`,
          sortOrder: 1,
          isPrimary: true
        }
      : undefined,
    source: "fallback"
  };
}
function demoCatalogueProductForSetupSlug(slug: string): PublicCatalogueProduct | null {
  if (!isDemoContentEnabled()) return null;
  const product = getDemoProducts().find((item) => item.slug === slug);
  if (!product) return null;
  const imageUrl = stitchImageSrc(fallbackProductImage(product));
  return {
    id: `demo-setup-${product.slug}`,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    description: product.description,
    rentalUnit: "setup",
    sortOrder: product.sortOrder,
    categoryId: "setups",
    categoryName: "Setups",
    primaryImage: {
      id: `demo-setup-${product.slug}-image`,
      storageBucket: "demo",
      storagePath: product.slug,
      publicUrl: imageUrl,
      altText: `${product.name} setup reference`,
      sortOrder: 1,
      isPrimary: true
    },
    source: "fallback"
  };
}
async function resolveSetup(slug: string) {
  const directProduct = await getPublicProductBySlug(slug);
  if (directProduct) return directProduct;
  const catalogue = await getPublicCatalogue();
  return catalogue.products.find((product) => product.slug === slug) ?? demoSetupForSlug(slug) ?? demoCatalogueProductForSetupSlug(slug);
}
export async function generateMetadata({ params }: ListingPageProps = {}): Promise<Metadata> { const slug = await getSlug(params); const product = await resolveSetup(slug); return { title: product ? `${product.name} setup | SpaceKonceptRental` : "Setup detail | SpaceKonceptRental", description: product ? productSummary(product) : "Rental setup detail for quote request support.", openGraph: { title: product ? `${product.name} rental listing | SpaceKonceptRental` : "Rental listing setup | SpaceKonceptRental", description: product ? `${productSummary(product)} Start a quote request for this setup.` : "Rental listing setup details for a quote request.", siteName: "SpaceKonceptRental", type: "website", url: `/listings/${slug}` } }; }
export default async function ListingPage({ params }: ListingPageProps = {}) { const slug = await getSlug(params); const product = await resolveSetup(slug); if (!product) return <section className="stitch-section"><div className="stitch-container"><StitchEmptyState title="Listing unavailable" message="Use the catalogue or listings to keep browsing public rental options. This public setup record is not available to display right now." actionHref="/listings#setup-listings" actionLabel="View Setups" /></div></section>; const catalogue = await getPublicCatalogue(); return <ProductPageContent product={product} relatedListings={getRelatedListings(product, catalogue.products)} backHref="/listings#setup-listings" backLabel="Back to Setups" setup />; }
