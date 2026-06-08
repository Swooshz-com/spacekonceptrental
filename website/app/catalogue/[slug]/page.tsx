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
    textOrUndefined(product?.shortDescription) ??
    textOrUndefined(product?.description);

  return productDescription
    ? `${productDescription} Request an event furniture rental quote with Space Koncept Rentals.`
    : "Browse event furniture rental listing details and request an enquiry with Space Koncept Rentals.";
}

function textOrUndefined(value: string | undefined) {
  return value?.trim() || undefined;
}

function publicListingSummary(product: PublicCatalogueProduct) {
  return (
    textOrUndefined(product.shortDescription) ??
    textOrUndefined(product.description) ??
    "Listing details can be confirmed with the team during quote follow-up."
  );
}

function publicCategoryLabel(product: PublicCatalogueProduct) {
  return textOrUndefined(product.categoryName) ?? "Category to confirm";
}

function publicRentalUnit(product: PublicCatalogueProduct) {
  return textOrUndefined(product.rentalUnit) ?? "confirm with team";
}

function imageAltText(
  image: PublicCatalogueImage | undefined,
  product: PublicCatalogueProduct
) {
  return textOrUndefined(image?.altText) ?? `${product.name} furniture rental setup`;
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
        <p>{publicListingSummary(product)}</p>
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
                alt={imageAltText(product.primaryImage, product)}
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
          <p>
            {textOrUndefined(product.description) ??
              textOrUndefined(product.shortDescription) ??
              "Listing details can be confirmed with the team during quote follow-up."}
          </p>
          <dl className="detail-list">
            <div>
              <dt>Category</dt>
              <dd>{publicCategoryLabel(product)}</dd>
            </div>
            <div>
              <dt>Rental unit</dt>
              <dd>{publicRentalUnit(product)}</dd>
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
                Share timing, venue, preferred quantities, and delivery
                notes so the team can confirm the right rental fit.
              </dd>
            </div>
          </dl>

          <section className="listing-checklist" aria-label="Quote request checklist">
            <h3>Quote request checklist</h3>
            <ul className="journey-list">
              <li>Bring event details such as date, venue, and timing window.</li>
              <li>Venue or event location.</li>
              <li>Add quantities and alternatives for the requested listing.</li>
              <li>Share setup, access, and timing notes for the team.</li>
            </ul>
          </section>

          <section className="listing-checklist" aria-label="Quote request preparation">
            <h3>Fit check before enquiry</h3>
            <ul className="journey-list">
              <li>Check the listing details and rental unit.</li>
              <li>Compare the category and rental unit for your setup.</li>
              <li>
                Bring event date, venue, quantities, alternatives, setup,
                access, and timing notes before sending the listing for
                follow-up.
              </li>
            </ul>
          </section>

          <div className="hero__actions">
            <Link className="button button--secondary" href={backHref}>
              {backLabel}
            </Link>
            <Link className="button button--secondary" href="/categories">
              Browse categories
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
