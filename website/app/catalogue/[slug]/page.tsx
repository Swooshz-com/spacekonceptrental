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
      <section className="premium-page-header">
        <div className="premium-container">
          <Link href={backHref} style={{ color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', fontSize: '13px', letterSpacing: '0.5px', textDecoration: 'none', marginBottom: '16px', display: 'inline-block' }}>
            &larr; {backLabel}
          </Link>
          <h1 className="premium-title-hero">{product.name}</h1>
          <p className="premium-subtitle" style={{ color: '#cbd5e1', maxWidth: '800px', margin: '0 auto' }}>
            {publicListingSummary(product)}
          </p>
        </div>
      </section>

      <section className="premium-section">
        <div className="premium-container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '48px', alignItems: 'start' }}>
            {/* Visuals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', background: 'var(--background)', position: 'relative', aspectRatio: '4/3' }}>
                {product.primaryImage?.publicUrl ? (
                  <img
                    alt={imageAltText(product.primaryImage, product)}
                    src={product.primaryImage.publicUrl}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
              <div style={{ fontSize: '14px', color: 'var(--muted)', fontStyle: 'italic', padding: '0 8px' }}>
                {imageCaption(product.primaryImage?.publicUrl ? product.primaryImage : undefined, product)}
              </div>

              {publicImages.length > 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                  {galleryImages.map((image) => (
                    <div key={image.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '4/3', border: '1px solid var(--border)' }}>
                        <img alt={imageAltText(image, product)} src={image.publicUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quote Panel */}
            <div className="premium-form-card" style={{ position: 'sticky', top: '100px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Rental Details</div>
              <h2 className="premium-title-section" style={{ fontSize: '28px', marginBottom: '24px' }}>Request a Quote</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Reference</span>
                  <span style={{ fontWeight: 700, color: 'var(--surface-strong)' }}>{product.slug}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Category</span>
                  <span style={{ fontWeight: 700, color: 'var(--surface-strong)' }}>{publicCategoryLabel(product)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Rental Unit</span>
                  <span style={{ fontWeight: 700, color: 'var(--surface-strong)' }}>{publicRentalUnit(product)}</span>
                </div>
              </div>

              <div style={{ background: 'var(--background)', padding: '24px', borderRadius: 'var(--radius-md)', marginBottom: '32px' }}>
                <h3 className="premium-title-card" style={{ fontSize: '16px' }}>Preparing your enquiry</h3>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--muted)', fontSize: '15px', lineHeight: 1.6 }}>
                  <li style={{ marginBottom: '8px' }}>Share timing, venue, and delivery notes.</li>
                  <li style={{ marginBottom: '8px' }}>Add desired quantities and acceptable alternatives.</li>
                  <li>Our team will manually review and respond to confirm the fit.</li>
                </ul>
              </div>

              <Link className="premium-button premium-button--primary" style={{ width: '100%', marginBottom: '16px' }} href={getQuoteHrefForListing(product.slug)}>
                Start Enquiry for {product.name}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {relatedListings.length > 0 && (
        <section className="premium-section premium-section--alternate">
          <div className="premium-container">
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Related</div>
              <h2 className="premium-title-section">More like this</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
              {relatedListings.map((related) => (
                <Link key={related.slug} href={`/listings/${related.slug}`} style={{ display: 'block', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', transition: 'transform 0.2s', padding: '24px' }}>
                  <h3 className="premium-title-card" style={{ fontSize: '18px', marginBottom: '8px' }}>{related.name}</h3>
                  <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>View listing details</p>
                </Link>
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
