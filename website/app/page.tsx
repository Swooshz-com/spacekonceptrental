import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { StaticImageData } from "next/image";
import heroImage from "../assets/images/hero_homepage.png";
import chairImage from "../assets/images/product_chair.png";
import sofaImage from "../assets/images/product_sofa.png";
import corporateImage from "../assets/images/event_corporate.png";
import { getPublicCatalogue } from "../lib/catalogue/catalogue-repository";
import { withDemoPublicCatalogue } from "../lib/catalogue/demo-public-catalogue";
import { getQuoteHrefForListing } from "../lib/catalogue/quote-handoff";
import type { PublicCatalogueProduct } from "../lib/catalogue/types";

export const metadata: Metadata = {
  title: "Space Koncept Rental | Event furniture rental catalogue",
  description:
    "Browse rental furniture and setup ideas, then submit a rental enquiry for manual team follow-up.",
  openGraph: {
    title: "Space Koncept Rental | Event furniture rental catalogue",
    description:
      "Browse rental furniture and setup ideas, then submit a quote request for manual team follow-up.",
    siteName: "Space Koncept Rental",
    type: "website",
    url: "/"
  }
};

const processSteps = [
  {
    title: "Browse the catalogue",
    text: "Review individual rental pieces and setup ideas before adding useful context to your selection."
  },
  {
    title: "Share event details",
    text: "Send one enquiry with event date, venue, requested items, quantities, and practical setup notes."
  },
  {
    title: "Team follow-up",
    text: "The Space Koncept Rental team reviews the request and follows up directly to shape the proposal."
  }
];

const editorialCards = [
  {
    title: "Individual Rentals",
    text: "Furniture pieces for planners who want to build a look item by item.",
    href: "/catalogue",
    label: "Browse Catalogue",
    image: chairImage
  },
  {
    title: "Curated Setups",
    text: "Prebuilt furniture groupings for lounges, showcases, dining moments, and reception flow.",
    href: "/listings",
    label: "View Setups",
    image: corporateImage
  }
];

function textOrUndefined(value: string | undefined) {
  return value?.trim() || undefined;
}

function productSummary(product: PublicCatalogueProduct) {
  return (
    textOrUndefined(product.shortDescription) ??
    textOrUndefined(product.description) ??
    "Add this rental listing to your quote request so the team can review fit."
  );
}

function productFallbackImage(product: PublicCatalogueProduct): StaticImageData {
  const searchText = `${product.slug} ${product.categoryName ?? ""}`.toLowerCase();

  if (searchText.includes("chair") || searchText.includes("seating")) {
    return chairImage;
  }

  if (
    searchText.includes("table") ||
    searchText.includes("surface") ||
    searchText.includes("setup")
  ) {
    return corporateImage;
  }

  return sofaImage;
}

function ProductImage({
  className,
  product
}: {
  className?: string;
  product: PublicCatalogueProduct;
}) {
  const altText =
    textOrUndefined(product.primaryImage?.altText) ??
    `${product.name} rental furniture`;

  if (product.primaryImage?.publicUrl) {
    return <img alt={altText} className={className} src={product.primaryImage.publicUrl} />;
  }

  return (
    <Image
      alt={altText}
      className={className}
      src={productFallbackImage(product)}
    />
  );
}

function FeaturedCard({
  product,
  wide
}: {
  product: PublicCatalogueProduct;
  wide?: boolean;
}) {
  return (
    <article className={`skr-card ${wide ? "skr-card--wide" : "skr-card--standard"}`}>
      <div className="skr-card__image">
        <ProductImage product={product} />
      </div>
      <div className="skr-card__body">
        <span className="skr-card__meta">
          {product.categoryName ?? "Rental item"}
        </span>
        <h3>{product.name}</h3>
        <p>{productSummary(product)}</p>
        <div className="skr-card__actions">
          <Link className="skr-button skr-button--outline" href={`/catalogue/${product.slug}`}>
            Details
          </Link>
          <Link className="skr-button skr-button--solid" href={getQuoteHrefForListing(product.slug)}>
            Add to Quote
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function HomePage() {
  const catalogue = withDemoPublicCatalogue(
    await getPublicCatalogue(),
    "individual"
  );
  const featuredListings = catalogue.products.slice(0, 3);

  return (
    <>
      <section className="skr-container skr-hero">
        <div className="skr-hero__copy">
          <p className="skr-eyebrow">Furniture and event rental catalogue</p>
          <h1 className="skr-title">
            Curated rental pieces for intentional event spaces.
          </h1>
          <p className="skr-copy">
            Browse individual furniture rentals or styled setups, add useful
            context to your selection, and submit one enquiry for manual team
            follow-up.
          </p>
          <div className="skr-hero__actions">
            <Link className="skr-button skr-button--solid" href="/catalogue">
              Browse Catalogue
            </Link>
            <Link className="skr-button skr-button--outline" href="/listings">
              View Setups
            </Link>
          </div>
        </div>
        <div className="skr-media-frame skr-hero__image">
          <Image
            alt="Styled event lounge with rental furniture"
            priority
            src={heroImage}
          />
        </div>
      </section>

      <section className="skr-section skr-section--soft">
        <div className="skr-container">
          <div className="skr-section-heading">
            <div>
              <p className="skr-eyebrow">Two ways to build the space</p>
              <h2 className="skr-title skr-title--medium">
                Start with pieces or a complete setup.
              </h2>
            </div>
            <Link className="skr-text-link" href="/quote">
              Your Selection
            </Link>
          </div>
          <div className="skr-card-grid">
            {editorialCards.map((card) => (
              <article className="skr-card skr-card--half" key={card.title}>
                <div className="skr-card__image">
                  <Image alt={`${card.title} rental composition`} src={card.image} />
                </div>
                <div className="skr-card__body">
                  <span className="skr-card__meta">Space planning</span>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                  <div className="skr-card__actions">
                    <Link className="skr-button skr-button--outline" href={card.href}>
                      {card.label}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="skr-section">
        <div className="skr-container">
          <div className="skr-section-heading">
            <div>
              <p className="skr-eyebrow">How it works</p>
              <h2 className="skr-title skr-title--medium">
                A quote request, then direct team review.
              </h2>
            </div>
          </div>
          <div className="skr-editorial-grid">
            {processSteps.map((step, index) => (
              <article
                className="skr-process-card"
                key={step.title}
                style={{ gridColumn: "span 4" }}
              >
                <span className="skr-process-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="skr-section skr-section--charcoal">
        <div className="skr-container">
          <div className="skr-section-heading">
            <div>
              <p className="skr-eyebrow">Featured rentals</p>
              <h2 className="skr-title skr-title--medium">
                Quiet anchors for high-touch event environments.
              </h2>
            </div>
            <Link className="skr-text-link" href="/catalogue">
              View Catalogue
            </Link>
          </div>
          {featuredListings.length === 0 ? (
            <div className="skr-empty-state">
              <p className="skr-eyebrow">Catalogue empty state</p>
              <h3>No public rental listings are available right now.</h3>
              <p>
                This page will show real published records when catalogue data
                is configured. You can still submit a general rental enquiry.
              </p>
              <Link className="skr-button skr-button--solid" href="/quote">
                Submit Enquiry
              </Link>
            </div>
          ) : (
            <div className="skr-card-grid">
              {featuredListings.map((product, index) => (
                <FeaturedCard
                  key={product.slug}
                  product={product}
                  wide={index === 0}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
