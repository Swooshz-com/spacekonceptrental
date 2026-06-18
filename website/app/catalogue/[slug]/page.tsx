import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import sofaImage from "../../../assets/images/product_sofa.png";
import {
  getPublicCatalogue,
  getPublicProductBySlug
} from "../../../lib/catalogue/catalogue-repository";
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
    "Listing details can be reviewed with the team during quote follow-up."
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
  return (
    textOrUndefined(image?.altText) ??
    `${product.name} furniture rental setup`
  );
}

function imageCaption(
  image: PublicCatalogueImage | undefined,
  product: PublicCatalogueProduct
) {
  const altText = textOrUndefined(image?.altText);

  if (altText) {
    return `${altText}. Use this photo to compare style, scale, and event fit before sending a quote request.`;
  }

  return `Photo to confirm for this listing. You can still send a quote request with quantities, venue, and event details for ${product.name}.`;
}

export function getRelatedListings(
  product: PublicCatalogueProduct,
  products: PublicCatalogueProduct[]
) {
  return products
    .filter((relatedProduct) => relatedProduct.slug !== product.slug)
    .filter((relatedProduct) => {
      if (product.categoryId && relatedProduct.categoryId) {
        return relatedProduct.categoryId === product.categoryId;
      }

      return Boolean(
        product.categoryName && relatedProduct.categoryName === product.categoryName
      );
    })
    .slice(0, 3);
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
  product,
  relatedListings = []
}: {
  backHref?: string;
  backLabel?: string;
  product: PublicCatalogueProduct;
  relatedListings?: PublicCatalogueProduct[];
}) {
  const publicImages = (product.images ?? []).filter((image) => image.publicUrl);
  const galleryImages = publicImages.filter(
    (image) => image.id !== product.primaryImage?.id
  );

  return (
    <section className="section">
      <div className="page-title">
        <p className="eyebrow">View rental listing</p>
        <h1>{product.name}</h1>
        <p>{publicListingSummary(product)}</p>
      </div>

      <div className="detail-layout">
        <div className="detail-visual">
          <figure className="detail-primary-image">
            {product.primaryImage?.publicUrl ? (
              <img
                alt={imageAltText(product.primaryImage, product)}
                src={product.primaryImage.publicUrl}
              />
            ) : (
              <Image
                alt={imageAltText(product.primaryImage, product)}
                height={400}
                priority
                src={sofaImage}
                width={600}
              />
            )}
            <figcaption>
              {imageCaption(
                product.primaryImage?.publicUrl ? product.primaryImage : undefined,
                product
              )}
            </figcaption>
          </figure>
          {publicImages.length > 1 ? (
            <div
              className="detail-gallery"
              aria-label="Additional listing photos"
            >
              {galleryImages.map((image) => (
                <figure key={image.id}>
                  <img
                    alt={imageAltText(image, product)}
                    src={image.publicUrl}
                  />
                  <figcaption>{imageCaption(image, product)}</figcaption>
                </figure>
              ))}
            </div>
          ) : null}
        </div>

        <article className="quote-panel">
          <h2>Rental details</h2>
          <p>
            {textOrUndefined(product.description) ??
              textOrUndefined(product.shortDescription) ??
              "Listing details can be reviewed with the team during quote follow-up."}
          </p>
          <section
            aria-label="Selected listing enquiry handoff"
            className="listing-enquiry-panel"
          >
            <p className="eyebrow">Quote request</p>
            <h3>This listing carries into the enquiry form</h3>
            <p>
              Use the quote action below to send the listing slug into editable
              requested-items text. Add quantities, alternates, venue, access,
              and timing notes before sending the enquiry.
            </p>
            <dl className="listing-enquiry-panel__facts">
              <div>
                <dt>Listing reference</dt>
                <dd>{product.slug}</dd>
              </div>
              <div>
                <dt>Quote form starting text</dt>
                <dd>{product.name}</dd>
              </div>
              <div>
                <dt>Continue browsing</dt>
                <dd>
                  Compare details here, then request a quote or return to the
                  catalogue/listings view.
                </dd>
              </div>
            </dl>
          </section>
          <dl className="detail-list">
            <div>
              <dt>Listing reference</dt>
              <dd>{product.slug}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{publicCategoryLabel(product)}</dd>
            </div>
            <div>
              <dt>Rental unit</dt>
              <dd>{publicRentalUnit(product)}</dd>
            </div>
            <div>
              <dt>Event-use context</dt>
              <dd>
                Listing context is a starting point only for event furniture
                rental planning. The team reviews the enquiry against the
                event notes you share.
              </dd>
            </div>
            <div>
              <dt>Quote planning</dt>
              <dd>
                Share timing, venue, preferred quantities, and delivery
                notes so the team can review the request. Include alternatives
                and setup notes if helpful; this page does not set aside
                furniture or finish rental details.
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

          <section className="listing-checklist" aria-label="Media and quote request preparation">
            <h3>Media and fit check before enquiry</h3>
            <ul className="journey-list">
              <li>Check the listing details and rental unit.</li>
              <li>Compare the category and rental unit for your setup.</li>
              <li>Use listing photos or the fallback image as browsing context.</li>
              <li>
                Bring event date, venue, quantities, alternatives, setup,
                access, and timing notes before sending the listing for
                follow-up.
              </li>
            </ul>
          </section>

          <div className="hero__actions">
            <Link className="button" href={getQuoteHrefForListing(product.slug)}>
              Request a quote for {product.name}
            </Link>
            <Link className="button button--secondary" href={backHref}>
              {backLabel}
            </Link>
            <Link className="button button--secondary" href="/listings">
              Browse listings
            </Link>
            <Link className="button button--secondary" href="/categories">
              Browse categories
            </Link>
            <Link className="button button--secondary" href="/events">
              Explore event-use ideas
            </Link>
            <Link className="button button--secondary" href={getQuoteHrefForListing(product.slug)}>
              Start enquiry for {product.name}
            </Link>
          </div>
        </article>
      </div>

      <section className="route-card" aria-label="Related rental browsing">
        <p className="eyebrow">Continue browsing</p>
        <h2>Related rental listing context</h2>
        <p>
          Same-category links are local browsing cues only. They do not imply
          availability or rental fit.
        </p>
        {relatedListings.length > 0 ? (
          <ul className="journey-list">
            {relatedListings.map((relatedListing) => (
              <li key={relatedListing.slug}>
                <Link href={`/listings/${relatedListing.slug}`}>
                  View rental listing: {relatedListing.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            Browse all listings, browse categories, explore event-use ideas, or
            start a rental enquiry if you need help shaping the request.
          </p>
        )}
      </section>
    </section>
  );
}

export default async function ProductPage({ params }: ProductPageProps = {}) {
  const slug = await getSlug(params);
  const product = await getPublicProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const catalogue = await getPublicCatalogue();

  return (
    <ProductPageContent
      product={product}
      relatedListings={getRelatedListings(product, catalogue.products)}
    />
  );
}
