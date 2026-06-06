import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import sofaImage from "../../../assets/images/product_sofa.png";
import { getPublicProductBySlug } from "../../../lib/catalogue/catalogue-repository";
import { getQuoteHrefForListing } from "../../../lib/catalogue/quote-handoff";
import type {
  PublicCatalogueImage,
  PublicCatalogueProduct
} from "../../../lib/catalogue/types";

type ProductPageProps = {
  params?: Promise<{ slug?: string }> | { slug?: string };
};

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export function generateStaticParams() {
  return [{ slug: "lounge-sofa-package" }];
}

function getMetadataDescription(product: PublicCatalogueProduct | null) {
  const productDescription =
    product?.shortDescription ?? product?.description ?? undefined;

  return productDescription
    ? `${productDescription} Request an event furniture rental quote with Space Koncept Rentals.`
    : "Browse event furniture rental listing details and request an enquiry with Space Koncept Rentals.";
}

function imageAltText(
  image: PublicCatalogueImage | undefined,
  product: PublicCatalogueProduct
) {
  return image?.altText ?? `${product.name} furniture rental setup`;
}

export async function generateMetadata({
  params
}: ProductPageProps = {}): Promise<Metadata> {
  const slug = await getSlug(params);
  const product = await getPublicProductBySlug(slug);

  if (!product) {
    return {
      title: "Furniture listing | Space Koncept Rentals",
      description: getMetadataDescription(null)
    };
  }

  return {
    title: `${product.name} | Space Koncept Rentals`,
    description: getMetadataDescription(product)
  };
}

async function getSlug(params: ProductPageProps["params"]) {
  if (!params) {
    return "lounge-sofa-package";
  }

  const resolvedParams = await params;

  return resolvedParams.slug ?? "lounge-sofa-package";
}

export function ProductPageContent({
  backHref = "/catalogue",
  backLabel = "Back to catalogue",
  product
}: {
  backHref?: string;
  backLabel?: string;
  product: PublicCatalogueProduct;
}) {
  const publicImages = (product.images ?? []).filter((image) => image.publicUrl);
  const galleryImages = publicImages.filter(
    (image) => image.id !== product.primaryImage?.id
  );

  return (
    <section className="section">
      <div className="page-title">
        <p className="eyebrow">Furniture listing</p>
        <h1>{product.name}</h1>
        <p>{product.shortDescription ?? product.description}</p>
      </div>

      <div className="detail-layout">
        <div className="detail-visual">
          <div className="detail-primary-image">
            {product.primaryImage?.publicUrl ? (
              <img
                alt={imageAltText(product.primaryImage, product)}
                src={product.primaryImage.publicUrl}
              />
            ) : (
              <Image
                alt={product.primaryImage?.altText ?? `${product.name} furniture rental setup`}
                priority
                src={sofaImage}
              />
            )}
          </div>
          {publicImages.length > 1 ? (
            <div className="detail-gallery" aria-label="Additional listing images">
              {galleryImages.map((image) => (
                <img
                  alt={imageAltText(image, product)}
                  key={image.id}
                  src={image.publicUrl}
                />
              ))}
            </div>
          ) : null}
        </div>

        <article className="quote-panel">
          <h2>Rental details</h2>
          <p>{product.description ?? product.shortDescription}</p>
          <dl className="detail-list">
            {product.categoryName ? (
              <div>
                <dt>Category</dt>
                <dd>{product.categoryName}</dd>
              </div>
            ) : null}
            <div>
              <dt>Rental unit</dt>
              <dd>{product.rentalUnit}</dd>
            </div>
            <div>
              <dt>Follow-up</dt>
              <dd>
                Final availability, delivery, and styling details are confirmed
                by the team.
              </dd>
            </div>
            <div>
              <dt>Quote planning</dt>
              <dd>
                Share event date, venue, preferred quantities, and delivery
                notes so the team can confirm the right rental fit.
              </dd>
            </div>
          </dl>

          <div className="hero__actions">
            <Link className="button button--secondary" href={backHref}>
              {backLabel}
            </Link>
            <Link className="button" href={getQuoteHrefForListing(product.slug)}>
              Request this listing
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}

export default async function ProductPage({ params }: ProductPageProps = {}) {
  const slug = await getSlug(params);
  const product = await getPublicProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return <ProductPageContent product={product} />;
}
