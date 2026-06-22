import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getRelatedListings,
  ProductPageContent
} from "../../catalogue/[slug]/page";
import {
  getPublicCatalogue,
  getPublicProductBySlug
} from "../../../lib/catalogue/catalogue-repository";
import { getDemoPublicProductBySlug } from "../../../lib/catalogue/demo-public-catalogue";

type ListingPageProps = {
  params?: Promise<{ slug?: string }> | { slug?: string };
};

export const dynamic = "force-dynamic";
export const dynamicParams = true;

async function getSlug(params: ListingPageProps["params"]) {
  if (!params) {
    return "lounge-sofa-package";
  }

  const resolvedParams = await params;

  return resolvedParams.slug ?? "lounge-sofa-package";
}

export async function generateMetadata({
  params
}: ListingPageProps = {}): Promise<Metadata> {
  const slug = await getSlug(params);
  const product =
    (await getPublicProductBySlug(slug)) ??
    getDemoPublicProductBySlug(slug, "setups");

  if (!product) {
    const description =
      "Browse public furniture and event rental listing details and send a quote request.";

    return {
      title: "Rental setup | Space Koncept Rental",
      description,
      openGraph: {
        title: "Rental setup | Space Koncept Rental",
        description,
        siteName: "Space Koncept Rental",
        type: "website",
        url: "/listings"
      }
    };
  }

  const listingDescription =
    product.shortDescription ??
    product.description ??
    "Browse public furniture and event rental listing details and send a quote request.";
  const description = `${listingDescription} Send a quote request for manual follow-up with Space Koncept Rental.`;

  return {
    title: `${product.name} setup | Space Koncept Rental`,
    description,
    openGraph: {
      title: `${product.name} setup | Space Koncept Rental`,
      description,
      siteName: "Space Koncept Rental",
      type: "website",
      url: `/listings/${product.slug}`
    }
  };
}

export default async function ListingPage({
  params
}: ListingPageProps = {}) {
  const slug = await getSlug(params);
  const product =
    (await getPublicProductBySlug(slug)) ??
    getDemoPublicProductBySlug(slug, "setups");

  if (!product) {
    notFound();
  }

  const catalogue = await getPublicCatalogue();

  return (
    <ProductPageContent
      backHref="/listings"
      backLabel="Back to listings"
      product={product}
      relatedListings={getRelatedListings(product, catalogue.products)}
    />
  );
}
