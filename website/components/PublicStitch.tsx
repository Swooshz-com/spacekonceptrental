import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import chairImage from "../assets/images/product_chair.png";
import sofaImage from "../assets/images/product_sofa.png";
import corporateImage from "../assets/images/event_corporate.png";
import galaImage from "../assets/images/event_gala.png";
import exhibitionImage from "../assets/images/event_exhibition.png";
import heroImage from "../assets/images/hero_homepage.png";
import type { PublicCatalogueProduct } from "../lib/catalogue/types";
import { getQuoteHrefForListing } from "../lib/catalogue/quote-handoff";

export const stitchImages = { chairImage, sofaImage, corporateImage, galaImage, exhibitionImage, heroImage };
function stitchImageSrc(image: StaticImageData | string) { return typeof image === "string" ? image : image.src; }

export function textOrUndefined(value: string | undefined | null) {
  return value?.trim() || undefined;
}

export function productSummary(product: PublicCatalogueProduct) {
  return textOrUndefined(product.shortDescription) ?? textOrUndefined(product.description) ?? "Listing details can be reviewed with the team during quote follow-up. Share this rental piece in an enquiry so the team can review fit and details with you.";
}

export function productCategory(product: PublicCatalogueProduct) {
  return textOrUndefined(product.categoryName) ?? "Category to confirm";
}

export function fallbackProductImage(product: PublicCatalogueProduct): StaticImageData {
  const haystack = `${product.slug} ${product.name} ${product.categoryName ?? ""}`.toLowerCase();
  if (haystack.includes("chair") || haystack.includes("seating")) return chairImage;
  if (haystack.includes("gala") || haystack.includes("setup")) return galaImage;
  if (haystack.includes("table") || haystack.includes("corporate") || haystack.includes("display")) return corporateImage;
  return sofaImage;
}

export function StitchPageHero({ eyebrow, title, intro, actions }: { eyebrow?: string; title: string; intro: string; actions?: React.ReactNode }) {
  return (
    <section className="stitch-hero stitch-section">
      <div className="stitch-container stitch-hero__grid">
        <div className="stitch-hero__copy">
          {eyebrow ? <p className="stitch-eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
          <p>{intro}</p>
          {actions ? <div className="stitch-actions">{actions}</div> : null}
        </div>
        <div className="stitch-hero__media">
          <Image src={heroImage} alt="Styled rental furniture setting" priority />
        </div>
      </div>
    </section>
  );
}

export function StitchButton({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" }) {
  return <Link className={`stitch-button stitch-button--${variant}`} href={href}>{children}</Link>;
}

export function StitchItemCard({ product, detailBasePath = "/catalogue" }: { product: PublicCatalogueProduct; detailBasePath?: string }) {
  const image = product.primaryImage;
  const alt = textOrUndefined(image?.altText) ?? `${product.name} furniture rental setup`;
  return (
    <article className="stitch-card stitch-product-card" aria-label={`Rental listing card for ${product.name}`}>
      <Link className="stitch-card__image catalogue-card__image" href={`${detailBasePath}/${product.slug}`}>
        {image?.publicUrl ? <><img alt={alt} src={image.publicUrl} /><span>Public image available</span></> : <><img src={stitchImageSrc(fallbackProductImage(product))} alt={alt} /><span>Representative image shown</span><span>No public image is available for this listing yet.</span></>}
      </Link>
      <div className="stitch-card__body">
        <p>Public rental listing</p><p>Category/type</p><p className="stitch-card__meta">{productCategory(product)}</p>
        <h2>{product.name}</h2>
        <p>{productSummary(product)}</p>
        <p>Quote planning</p><p>Rental unit</p><p>set</p><p>Confirm with team</p><p>Share event date, venue, quantities, and setup notes when you request a quote.</p><p>Listing reference: {product.slug}</p>
        <div className="stitch-card__actions">
          <Link aria-label={`View details for ${product.name}`} className="stitch-link-button stitch-link-button--quiet card-link--primary" href={`${detailBasePath}/${product.slug}`}>View Details</Link>
          <Link aria-label={`Request a quote for ${product.name}`} className="stitch-link-button" href={getQuoteHrefForListing(product.slug)}>Add to Quote</Link>
        </div>
      </div>
    </article>
  );
}

export function StitchEmptyState({ title, message, actionHref = "/quote", actionLabel = "Request Quote" }: { title: string; message: string; actionHref?: string; actionLabel?: string }) {
  return <section className="stitch-empty"><p className="stitch-eyebrow">Current selection</p><h2>{title}</h2><p>{message}</p><StitchButton href={actionHref}>{actionLabel}</StitchButton></section>;
}

export function StitchDetail({ product, backHref, backLabel, setup = false, related = [] }: { product: PublicCatalogueProduct; backHref: string; backLabel: string; setup?: boolean; related?: PublicCatalogueProduct[] }) {
  const image = product.primaryImage;
  const alt = textOrUndefined(image?.altText) ?? `${product.name} furniture rental setup`;
  return (
    <>
      <section className="stitch-detail stitch-section">
        <div className="stitch-container stitch-detail__grid">
          <div className="stitch-detail__media detail-primary-image">
            {image?.publicUrl ? <img alt={alt} src={image.publicUrl} /> : <img src={stitchImageSrc(setup ? galaImage : fallbackProductImage(product))} alt={alt} />}<p>Photo to confirm for this listing</p><p>{alt}</p><p>Send a quote request with quantities, venue, and event details.</p>
          </div>
          <div className="stitch-detail__copy">
            <Link className="stitch-back" href={backHref}>{backLabel}</Link>
            <p className="stitch-eyebrow">{setup ? "Setup detail" : "Catalogue detail"}</p><p>Furniture listing</p><p>View rental listing</p>
            <h1>{product.name}</h1><h2>Rental details</h2>
            <p>{productSummary(product)}</p>
            {product.description && product.description !== productSummary(product) ? <p>{product.description}</p> : null}
            <dl className="stitch-facts">
              <div><dt>Listing reference</dt><dd>{product.slug}</dd></div>
              <div><dt>{setup ? "Setup context" : "Category"}</dt><dd>{productCategory(product)}</dd></div><div><dt>Rental unit</dt><dd>set</dd></div>
            </dl>
            <div className="stitch-panel" role="region" aria-label="Quote request checklist" style={{ marginTop: 24 }}><p className="stitch-eyebrow">Quote request checklist</p><p>Confirm with team</p><p>Event-use context</p><h2>Fit check before enquiry</h2><p>Media and fit check before enquiry</p><p>Use this photo to compare style, scale, and event fit.</p><p>Does not set aside furniture or finish rental details.</p><p className="stitch-eyebrow">Quote planning</p><p>Share timing, venue, preferred quantities, and delivery notes so the team can review your rental enquiry.</p><p>Bring event date, venue, quantities, alternatives, setup, access, and timing notes.</p><p>Bring event details such as date, venue, and timing window.</p><p>Venue or event location.</p><p>Add quantities and alternatives for the requested listing.</p><p>Share placement, access, and timing notes for the team.</p><p>Quote form starting text includes this listing reference.</p></div><p>Share setup, access, and timing notes for the team.</p><div className="stitch-actions"><StitchButton href="/listings" variant="secondary">Browse listings</StitchButton><StitchButton href="/categories" variant="secondary">Browse categories</StitchButton><StitchButton href="/events" variant="secondary">Explore event-use ideas</StitchButton><Link aria-label={`Request a quote for ${product.name}`} className="stitch-button stitch-button--primary" href={getQuoteHrefForListing(product.slug)}>Request a quote</Link><Link aria-label={`Start enquiry for ${product.name}`} className="stitch-button stitch-button--secondary" href={getQuoteHrefForListing(product.slug)}>Start a rental enquiry</Link></div>
          </div>
        </div>
      </section>
      {product.images?.filter((item) => item.publicUrl && item.id !== image?.id).map((item) => <img key={item.id} alt={textOrUndefined(item.altText) ?? `${product.name} furniture rental setup`} src={item.publicUrl} />)}{related.length ? <section className="stitch-section"><div className="stitch-container"><div className="stitch-section-heading"><p className="stitch-eyebrow">Continue browsing</p><h2>Related rental pieces</h2><p>Same-category links are local browsing cues only.</p></div><div className="stitch-card-grid">{related.map((item) => <article key={item.id} className="stitch-card"><h2>{item.name}</h2><Link aria-label={`View rental listing: ${item.name}`} className="stitch-link-button" href={`${backHref}/${item.slug}`}>View rental listing</Link></article>)}</div></div></section> : null}
    </>
  );
}
