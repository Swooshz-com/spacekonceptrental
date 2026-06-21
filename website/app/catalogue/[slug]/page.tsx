import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import sofaImage from "../../../assets/images/product_sofa.png";
import {
  getPublicCatalogue,
  getPublicProductBySlug
} from "../../../lib/catalogue/catalogue-repository";
import type {
  PublicCatalogueImage,
  PublicCatalogueProduct
} from "../../../lib/catalogue/types";
import AddToQuoteButton from "../../../components/AddToQuoteButton";

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
    ? `${productDescription} Send an event furniture rental quote request with Space Koncept Rentals.`
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
    const description = getMetadataDescription(null);
    return {
      title: "Furniture listing | Space Koncept Rentals",
      description,
      openGraph: {
        title: "Furniture listing | Space Koncept Rentals",
        description,
        siteName: "Space Koncept Rentals",
        type: "website",
        url: "/catalogue"
      }
    };
  }

  const description = getMetadataDescription(product);
  return {
    title: `${product.name} | Space Koncept Rentals`,
    description,
    openGraph: {
      title: `${product.name} rental listing | Space Koncept Rentals`,
      description,
      siteName: "Space Koncept Rentals",
      type: "website",
      url: `/catalogue/${product.slug}`
    }
  };
}

async function getSlug(params: ProductPageProps["params"]) {
  if (!params) return "lounge-sofa-package";
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
    <>
      <section className="section-padding" style={{ paddingBottom: '40px' }}>
        <div className="container">
          <Link href={backHref} style={{ fontSize: '0.875rem', color: 'var(--muted)', display: 'inline-block', marginBottom: '32px' }}>
            &larr; {backLabel}
          </Link>

          <div className="v3-detail">
            {/* Gallery */}
            <div className="v3-detail__gallery">
              <div className="v3-detail__hero-img">
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
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>

              {publicImages.length > 1 && (
                <div className="v3-detail__thumbs">
                  {galleryImages.map((image) => (
                    <div key={image.id}>
                      <img alt={imageAltText(image, product)} src={image.publicUrl} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="v3-detail__content">
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--warm)', marginBottom: '8px' }}>
                {publicCategoryLabel(product)}
              </div>
              <h1>{product.name}</h1>
              <p className="v3-detail__subtitle">
                {publicListingSummary(product)}
              </p>

              <div className="v3-detail__specs">
                <h3>Specifications</h3>
                <dl>
                  <div>
                    <dt>Category</dt>
                    <dd>{publicCategoryLabel(product)}</dd>
                  </div>
                  <div>
                    <dt>Rental Unit</dt>
                    <dd>{publicRentalUnit(product)}</dd>
                  </div>
                  <div>
                    <dt>Listing Reference</dt>
                    <dd style={{ color: 'var(--muted)', fontWeight: 'normal' }}>{product.slug}</dd>
                  </div>
                </dl>
              </div>

              <div className="v3-detail__note">
                <h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  Quote Request Guide
                </h3>
                <p>
                  This item is available for event rental. Add it to your Quote List to submit an enquiry. Our team will review your event details, location, and dates to ensure availability and provide a comprehensive proposal including delivery and setup.
                </p>
              </div>

              <div className="v3-detail__actions">
                <AddToQuoteButton
                  listing={product}
                  className="v3-btn v3-btn--primary"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {relatedListings.length > 0 && (
        <section className="section-padding" style={{ background: 'var(--surface-strong)' }}>
          <div className="container">
            <h2 style={{ fontSize: '2rem', marginBottom: '40px' }}>Similar Items</h2>
            <div className="v3-catalogue-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              {relatedListings.map((related) => (
                <div key={related.slug} className="v3-catalogue-card">
                  <div className="v3-catalogue-card__image-wrapper" style={{ aspectRatio: '1', marginBottom: '16px' }}>
                    {related.primaryImage?.publicUrl ? (
                      <img alt={related.name} src={related.primaryImage.publicUrl} />
                    ) : (
                      <Image alt={related.name} src={sofaImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.25rem' }}>{related.name}</h3>
                  <div className="v3-catalogue-card__footer" style={{ marginTop: 'auto' }}>
                    <Link href={`/catalogue/${related.slug}`} className="v3-catalogue-card__link">
                      View details
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
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
