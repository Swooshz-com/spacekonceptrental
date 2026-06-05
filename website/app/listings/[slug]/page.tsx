import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ProductPageContent
} from "../../catalogue/[slug]/page";
import { getPublicProductBySlug } from "../../../lib/catalogue/catalogue-repository";

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
  const product = await getPublicProductBySlug(slug);

  if (!product) {
    return {
      title: "Rental listing | Space Koncept Rentals",
      description:
        "Browse public furniture and event rental listing details and send a quote enquiry."
    };
  }

  return {
    title: `${product.name} rental listing | Space Koncept Rentals`,
    description:
      product.shortDescription ??
      product.description ??
      "Browse public furniture and event rental listing details and send a quote enquiry."
  };
}

export default async function ListingPage({
  params
}: ListingPageProps = {}) {
  const slug = await getSlug(params);
  const product = await getPublicProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <ProductPageContent
      backHref="/listings"
      backLabel="Back to listings"
      product={product}
    />
  );
}
