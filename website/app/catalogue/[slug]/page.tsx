import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { StaticImageData } from "next/image";
import { notFound } from "next/navigation";
import chairImage from "../../../assets/images/product_chair.png";
import sofaImage from "../../../assets/images/product_sofa.png";
import corporateImage from "../../../assets/images/event_corporate.png";
import {
  getPublicCatalogue,
  getPublicProductBySlug
} from "../../../lib/catalogue/catalogue-repository";
import { getDemoPublicProductBySlug } from "../../../lib/catalogue/demo-public-catalogue";
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

function textOrUndefined(value: string | undefined) {
  return value?.trim() || undefined;
}

function productSummary(product: PublicCatalogueProduct) {
  return (
    textOrUndefined(product.shortDescription) ??
    textOrUndefined(product.description) ??
    "Review this rental listing and add useful event context before submitting a quote request."
  );
}

function productCategory(product: PublicCatalogueProduct) {
  return textOrUndefined(product.categoryName) ?? "Rental item";
}

function productRentalUnit(product: PublicCatalogueProduct) {
  return textOrUndefined(product.rentalUnit) ?? "confirm with team";
}

function productFallbackImage(product: PublicCatalogueProduct): StaticImageData {
  const searchText = `${product.slug} ${product.categoryName ?? ""}`.toLowerCase();

  if (searchText.includes("chair") || searchText.includes("seating")) {
    return chairImage;
  }

  if (
    searchText.includes("setup") ||
    searchText.includes("table") ||
    searchText.includes("surface")
  ) {
    return corporateImage;
  }

  return sofaImage;
}

function imageAltText(
  image: PublicCatalogueImage | undefined,
  product: PublicCatalogueProduct
) {
  return textOrUndefined(image?.altText) ?? `${product.name} rental furniture`;
}

function ProductImage({
  image,
  product,
  priority
}: {
  image?: PublicCatalogueImage;
  product: PublicCatalogueProduct;
  priority?: boolean;
}) {
  if (image?.publicUrl) {
    return <img alt={imageAltText(image, product)} src={image.publicUrl} />;
  }

  return (
    <Image
      alt={imageAltText(image, product)}
      priority={priority}
      src={productFallbackImage(product)}
    />
  );
}

function getMetadataDescription(product: PublicCatalogueProduct | null) {
  const summary = product ? productSummary(product) : undefined;
  return summary
    ? `${summary} Submit a rental enquiry with Space Koncept Rental.`
    : "Browse event furniture rental listing details and submit a rental enquiry with Space Koncept Rental.";
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
        product.categoryName &&
          relatedProduct.categoryName === product.categoryName
      );
    })
    .slice(0, 3);
}

async function getSlug(params: ProductPageProps["params"]) {
  if (!params) return "lounge-sofa-package";
  const resolvedParams = await params;
  return resolvedParams.slug ?? "lounge-sofa-package";
}

async function getProductForSlug(
  slug: string,
  kind: "individual" | "setups" = "individual"
) {
  return (
    (await getPublicProductBySlug(slug)) ??
    getDemoPublicProductBySlug(slug, kind)
  );
}

export async function generateMetadata({
  params
}: ProductPageProps = {}): Promise<Metadata> {
  const slug = await getSlug(params);
  const product = await getProductForSlug(slug, "individual");
  const description = getMetadataDescription(product);

  if (!product) {
    return {
      title: "Furniture listing | Space Koncept Rental",
      description,
      openGraph: {
        title: "Furniture listing | Space Koncept Rental",
        description,
        siteName: "Space Koncept Rental",
        type: "website",
        url: "/catalogue"
      }
    };
  }

  return {
    title: `${product.name} | Space Koncept Rental`,
    description,
    openGraph: {
      title: `${product.name} rental listing | Space Koncept Rental`,
      description,
      siteName: "Space Koncept Rental",
      type: "website",
      url: `/catalogue/${product.slug}`
    }
  };
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
  const galleryImages =
    publicImages.length
      ? publicImages
      : [
          product.primaryImage ?? {
            id: "fallback-primary",
            storageBucket: "frontend",
            storagePath: product.slug,
            sortOrder: 0,
            isPrimary: true
          }
        ];
  const secondaryImages = galleryImages.slice(1, 4);

  return (
    <>
      <section className="skr-section">
        <div className="skr-container">
          <div className="skr-detail">
            <div className="skr-detail__gallery">
              <Link className="skr-text-link" href={backHref}>
                {backLabel}
              </Link>
              <div className="skr-media-frame skr-detail__primary detail-primary-image">
                <ProductImage
                  image={product.primaryImage ?? galleryImages[0]}
                  product={product}
                  priority
                />
              </div>
              {secondaryImages.length ? (
                <div className="skr-detail__thumbs">
                  {secondaryImages.map((image) => (
                    <div
                      className="skr-media-frame skr-detail__thumb"
                      key={image.id}
                    >
                      <ProductImage image={image} product={product} />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <aside className="skr-panel skr-detail__panel">
              <p className="skr-eyebrow">{productCategory(product)}</p>
              <h1 className="skr-title skr-title--medium">{product.name}</h1>
              <p className="skr-copy">{productSummary(product)}</p>
              {product.description &&
              product.description !== productSummary(product) ? (
                <p className="skr-copy">{product.description}</p>
              ) : null}

              <dl className="skr-spec-list">
                <div>
                  <dt>Reference</dt>
                  <dd>{product.slug}</dd>
                </div>
                <div>
                  <dt>Category</dt>
                  <dd>{productCategory(product)}</dd>
                </div>
                <div>
                  <dt>Rental unit</dt>
                  <dd>{productRentalUnit(product)}</dd>
                </div>
              </dl>

              <div className="skr-detail-note">
                <h2>Before you enquire</h2>
                <p>
                  Add quantities, event date, venue, access notes, and any
                  alternates to your quote request so the team can review fit.
                </p>
              </div>

              <div className="skr-actions">
                <Link
                  aria-label={`Add ${product.name} to quote`}
                  className="skr-button skr-button--solid"
                  href={getQuoteHrefForListing(product.slug)}
                >
                  Add to Quote
                </Link>
                <Link
                  className="skr-button skr-button--outline"
                  href={getQuoteHrefForListing(product.slug)}
                >
                  Request Quote
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {relatedListings.length ? (
        <section className="skr-section skr-section--soft">
          <div className="skr-container">
            <div className="skr-section-heading">
              <div>
                <p className="skr-eyebrow">Related rentals</p>
                <h2 className="skr-title skr-title--medium">
                  Continue reviewing similar pieces.
                </h2>
              </div>
            </div>
            <div className="skr-card-grid">
              {relatedListings.map((related) => (
                <article className="skr-card skr-card--standard" key={related.slug}>
                  <div className="skr-card__body">
                    <span className="skr-card__meta">
                      {productCategory(related)}
                    </span>
                    <h3>{related.name}</h3>
                    <p>{productSummary(related)}</p>
                    <div className="skr-card__actions">
                      <Link
                        className="skr-button skr-button--outline"
                        href={`/catalogue/${related.slug}`}
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

export default async function ProductPage({ params }: ProductPageProps = {}) {
  const slug = await getSlug(params);
  const product = await getProductForSlug(slug, "individual");

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
