import type { StaticImageData } from "next/image";
import Link from "next/link";
import chairImage from "../assets/images/product_chair.png";
import sofaImage from "../assets/images/product_sofa.png";
import corporateImage from "../assets/images/event_corporate.png";
import galaImage from "../assets/images/event_gala.png";
import exhibitionImage from "../assets/images/event_exhibition.png";
import heroImage from "../assets/images/hero_homepage.png";
import type { PublicCatalogue, PublicCatalogueProduct } from "../lib/catalogue/types";
import {
  DEFAULT_HOMEPAGE_HERO_CONTENT,
  type HomepageHeroContent
} from "../lib/hero/homepage-hero-content";
import {
  QuoteSelectionBadge,
  QuoteSelectionButton,
  type QuoteSelectionItem
} from "./QuoteSelectionControls";
import { SetupImageCarousel } from "./SetupImageCarousel";

export const stitchImages = { chairImage, sofaImage, corporateImage, galaImage, exhibitionImage, heroImage };

const aboutStoryImageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuCVRiKMpVS17P0POe4hgYLWJOqLZWHNBK0YGHw-bG4ETu7eWNw2o_RDNmsHhEgmEAfc1nWGlfVYJswBZRdLxn0pVc44lfcblgiNEyuHfr4APLO9MARpxHtb8kRWvMV7otaSDpU_tfoAPYGYbCMtj9DUnC49_anMv7E80cfYVCCK_uheLjc8ZiIEccgZUgjO8H3dhTXXY_cBGYInmYRilsvWVY_akz3twXUoGZotZr6SB4yHpefF4EcE8HJb4gp8pwrC_XR3IlH3bkkl";
const homeCategoryImageUrls = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAImhw0DRyJ87ykPAlGrIm3BrKMKXRpivv23Tdp1whVQ35E6fnIlhsbuUCUHPXF8ZUC8RUE5uHzPFkP7HoIINOXcung6zVL9x0yOMDzgkvKRXamMmq5FY9Rz7azxTqCNgaXA5Nr8c5UmQrlx_O8p_H_MYCWrfAHh4i0EdnLScgtT07-faMuNlDThQ0qur6BKi_mzgL7EjYya9TelJI_6Q2QYz1CnwE5sSNpajaODLu6PjolUwjUMLLGDzI7HBsoEWOc6cqR02wfs4KK",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCnKJvJ0T0vg0ALDdprS3us7Kdoe5oCpbRCxVZ2UaKI2x3lrav1Hww1aQN2YAP0XCAPzr1BuovrCPbkuCZW0O-M7JwkS2dBXmgOQxbIekL7mkIbO5C1XRtYXd0MGARo1jP47n66D_1ktKSFOHtRHDTJI3O-aXLeNN98Ho9vu8mkL-E-1YBCjyhh5y04iro3ty17SLHCgw6NI9rxTXrTUZAZw748x4ooPXNfmkeoWl1i3IHGnlYN08NAcxHfgHog43H9Ljxoj02uPBGo",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAlpUfC000VZu0JYJPneCV-VN2BqXnSaz9cCcJ_I4VlsbJ6pznqLZFVKfXxWG4VzMaTGi99F5p_bdzSBmtYtBCZuMmWfU6FyNRyQQcqSePFK8I-hDNUg9bat7bxz4qf9fSmYJIsC-SUXjszoPp7SUOansdXh20kfXMIkgh6C8Ba9WQCsnpFM2YDYXCDUHvgq5PrMyuVwR3OzLGJkYc7UIFJ611cBZfyblihi9JZvwB2AEML35ZAc1e8i__gKBn6izRcJbI2ovlDxGmF",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAYmGvnLNxjr_Qz3dHxk-CFHYzKK4A252rk6r7QoEgH4FcsoG599ev_OCCif9kDRH-kj9t4f_TuBOpJqSu1jB58gFjbxkL5gZvZQTFzF8q4xvq8btpEkOvznkuVdZ-SStna89cP3dzjjvXm-tlr9fxDTfMQq77FfV2g7abZKTndVutw5TySVGtlld-zxmaURlVfnArBxkIxEE4NId7gCNGWiMU-UeEJXpRZHwd5BQRf9mhJdgx7psRUT1YXv4TyQDuioUxLkKiPRrvC"
];

export function textOrUndefined(value: string | undefined | null) {
  return value?.trim() || undefined;
}

export function productSummary(product: PublicCatalogueProduct) {
  return textOrUndefined(product.shortDescription) ?? textOrUndefined(product.description) ?? "Listing details can be reviewed with the team during quote follow-up. Share this rental piece in an enquiry so the team can review fit and details with you.";
}

export function productCategory(product: PublicCatalogueProduct) {
  return textOrUndefined(product.categoryName) ?? "Category to confirm";
}

export const stitchStyleFilters = [
  { slug: "mid-century-modern", label: "Mid-Century Modern", matchers: ["aura", "asymmetric", "velvet", "lounge chair"] },
  { slug: "minimalist", label: "Minimalist", matchers: ["kinetic", "monumental", "slender", "table", "lamp"] },
  { slug: "brutalist", label: "Brutalist", matchers: ["ribbed", "walnut", "credenza", "storage"] }
];

function productStyleHaystack(product: PublicCatalogueProduct) {
  return `${product.slug} ${product.name} ${productCategory(product)} ${productSummary(product)}`.toLowerCase();
}

function productMatchesStyleContext(product: PublicCatalogueProduct, style: typeof stitchStyleFilters[number]) {
  const haystack = productStyleHaystack(product);
  return style.matchers.some((matcher) => haystack.includes(matcher));
}

export function productStyleContext(product: PublicCatalogueProduct) {
  return stitchStyleFilters.find((style) => productMatchesStyleContext(product, style))?.label ?? "Style to confirm";
}

export function stitchImageSrc(image: StaticImageData | string) {
  return typeof image === "string" ? image : image.src;
}

export function fallbackProductImage(product: PublicCatalogueProduct): StaticImageData | string {
  const haystack = `${product.slug} ${product.name} ${product.categoryName ?? ""}`.toLowerCase();
  if (haystack.includes("chair") || haystack.includes("seating")) return chairImage;
  if (haystack.includes("gala") || haystack.includes("setup")) return galaImage;
  if (haystack.includes("table") || haystack.includes("corporate") || haystack.includes("display")) return corporateImage;
  return sofaImage;
}

function quoteSelectionItem(
  product: PublicCatalogueProduct,
  imageSrc: string,
  kind: QuoteSelectionItem["kind"] = "rental",
  includedItems?: QuoteSelectionItem[]
): QuoteSelectionItem {
  return {
    slug: product.slug,
    name: product.name,
    category: productCategory(product),
    kind,
    imageSrc,
    ...(includedItems?.length ? { includedItems } : {}),
    quantity: 1
  };
}

function setupQuoteSelectionItem(setup: {
  image: StaticImageData | string;
  slug: string;
  title: string;
}): QuoteSelectionItem {
  return {
    slug: setup.slug,
    name: setup.title,
    category: "Setups",
    kind: "setup",
    imageSrc: stitchImageSrc(setup.image),
    quantity: 1
  };
}

function setupIncludedQuoteItem(
  product: PublicCatalogueProduct,
  setup: PublicCatalogueProduct,
  quantity: number
): QuoteSelectionItem {
  return {
    slug: product.slug,
    name: product.name,
    category: productCategory(product),
    kind: "setup-included",
    imageSrc: stitchImageSrc(fallbackProductImage(product)),
    quantity,
    setupBaseQuantity: quantity,
    setupName: setup.name,
    setupSlug: setup.slug
  };
}

export function StitchButton({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" }) {
  return <Link className={`stitch-button stitch-button--${variant}`} href={href}>{children}</Link>;
}

export function StitchActions({ children }: { children: React.ReactNode }) {
  return <div className="stitch-actions">{children}</div>;
}

export function StitchPageIntro({ eyebrow, title, intro, actions }: { eyebrow?: string; title: string; intro: string; actions?: React.ReactNode }) {
  return <div className="stitch-page-intro">{eyebrow ? <p className="stitch-eyebrow">{eyebrow}</p> : null}<h1>{title}</h1><p>{intro}</p>{actions ? <StitchActions>{actions}</StitchActions> : null}</div>;
}

function StitchHomeCatalogueAction({ featured = false }: { featured?: boolean }) {
  return <div className={`stitch-home-section-action${featured ? " stitch-home-featured-action" : ""}`}><StitchButton href="/catalogue" variant="secondary">View Full Catalogue</StitchButton></div>;
}

export { DEFAULT_HOMEPAGE_HERO_CONTENT };

export function StitchHomeHero({
  heroContent = DEFAULT_HOMEPAGE_HERO_CONTENT
}: {
  heroContent?: HomepageHeroContent;
}) {
  return <section className="stitch-home-hero"><div className="stitch-container stitch-home-hero__grid"><div className="stitch-home-hero__copy"><p className="stitch-eyebrow">{heroContent.eyebrow}</p><h1>{heroContent.headline}</h1><p>{heroContent.body}</p><StitchActions><StitchButton href={heroContent.primaryCtaHref}>{heroContent.primaryCtaLabel}</StitchButton><StitchButton href={heroContent.secondaryCtaHref} variant="secondary">{heroContent.secondaryCtaLabel}</StitchButton><StitchButton href="/listings" variant="secondary">Explore Setups</StitchButton></StitchActions></div><div className="stitch-home-hero__media"><picture><source media="(max-width: 639px)" srcSet={heroContent.imageUrl} /><img src={heroContent.imageUrl} alt={heroContent.imageAlt} /></picture></div></div></section>;
}

export function StitchAdvantageCards() {
  const items = [
    ["Superior Quality", "Curated rental pieces selected for considered event spaces and visual cohesion.", "diamond"],
    ["Expert Setup", "Share logistics and venue context so the team can review each setup direction.", "tools"],
    ["Customisable Solutions", "Tailored enquiry notes help the team understand your event vision and rental needs.", "layout"]
  ];
  return <section className="stitch-section stitch-home-advantage"><div className="stitch-container"><div className="stitch-section-heading stitch-section-heading--center"><h2>The SpaceKonceptRental Advantage</h2></div><div className="stitch-feature-grid">{items.map(([title, text, icon]) => <article className="stitch-feature" key={title}><span className={`stitch-feature__icon stitch-feature__icon--${icon}`} aria-hidden="true" /><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>;
}

export function StitchCategoryPreview({ catalogue }: { catalogue: PublicCatalogue }) {
  const categories = catalogue.categories.slice(0, 4);
  const imageMap = homeCategoryImageUrls;
  return <section className="stitch-section stitch-section--tonal stitch-home-categories"><div className="stitch-container"><div className="stitch-section-heading"><h2>Browse By Category</h2></div>{categories.length ? <><div className="stitch-home-category-mosaic">{categories.map((category, index) => <Link className={`stitch-home-category-card stitch-home-category-card--${index + 1}`} href={`/catalogue?category=${encodeURIComponent(category.slug)}`} key={category.id}><img src={imageMap[index % imageMap.length]} alt={`${category.name} rental category`} /><span>{category.name}</span></Link>)}</div><StitchHomeCatalogueAction /></> : <StitchEmptyState title="Catalogue categories are not published yet." message="Published category records will appear here once available. You can still send an enquiry with the pieces or setup direction you have in mind." />}</div></section>;
}

export function StitchItemCard({ product, detailBasePath = "/catalogue" }: { product: PublicCatalogueProduct; detailBasePath?: string }) {
  const image = "primaryImage" in product ? product.primaryImage : undefined;
  const alt = textOrUndefined(image?.altText) ?? `${product.name} furniture rental setup`;
  const imgSrc = image?.publicUrl ?? stitchImageSrc(fallbackProductImage(product));
  const quoteItem = quoteSelectionItem(product, imgSrc);
  return <article className="stitch-card stitch-product-card" aria-label={`Rental listing card for ${product.name}`}><Link className="stitch-card__image" href={`${detailBasePath}/${product.slug}`}><img alt={alt} src={imgSrc} /><QuoteSelectionBadge item={quoteItem} /></Link><div className="stitch-card__body"><p className="stitch-card__meta">{productCategory(product)}</p><h2>{product.name}</h2><p>{productSummary(product)}</p><div className="stitch-card__actions"><QuoteSelectionButton item={quoteItem} /><Link aria-label={`View details for ${product.name}`} className="stitch-link-button stitch-link-button--quiet" href={`${detailBasePath}/${product.slug}`}>View Details</Link></div></div></article>;
}

export function StitchFeaturedPieces({ catalogue }: { catalogue: PublicCatalogue }) {
  const products = catalogue.products.slice(0, 4);
  return <section className="stitch-section stitch-home-featured"><div className="stitch-container"><div className="stitch-section-heading"><h2>Featured Pieces</h2></div>{products.length ? <><div className="stitch-home-featured-grid">{products.map((product) => <Link className="stitch-home-feature-card" href={`/catalogue/${product.slug}`} key={product.id}><img alt={`${product.name} rental piece`} src={stitchImageSrc(fallbackProductImage(product))} /><strong>{product.name}</strong><small>{productCategory(product)}</small></Link>)}</div><StitchHomeCatalogueAction featured /></> : <StitchEmptyState title="Catalogue records are not published yet." message="The public catalogue will show real rental records when they are available. You can still send an enquiry with the pieces or setup you have in mind." />}</div></section>;
}

export function StitchEmptyState({ title, message, actionHref = "/quote", actionLabel = "Request Quote" }: { title: string; message: string; actionHref?: string; actionLabel?: string }) {
  return <section className="stitch-empty"><p className="stitch-eyebrow">Current selection</p><h2>{title}</h2><p>{message}</p><StitchButton href={actionHref}>{actionLabel}</StitchButton></section>;
}

export function StitchCatalogueShell({ catalogue, detailBasePath = "/catalogue", title = "Furniture Catalogue", intro = "Curated rental pieces for elevated event environments. Browse architectural seating, functional surfaces, and sculptural accents. Browsing does not set aside furniture or finalise rental details.", emptyTitle = "No public rental listings are available right now", emptyMessage = "Real catalogue records will appear here once published. Send a rental enquiry if you already know the pieces or setup direction you need.", activeCategorySlug, activeStyleSlug }: { catalogue: PublicCatalogue; detailBasePath?: string; title?: string; intro?: string; emptyTitle?: string; emptyMessage?: string; activeCategorySlug?: string; activeStyleSlug?: string }) {
  const allProducts = catalogue.products;
  const categoryFilters = catalogue.categories.length ? catalogue.categories : Array.from(new Map(allProducts.map((product) => [productCategory(product).toLowerCase(), { id: product.categoryId ?? productCategory(product), slug: product.categoryId ?? productCategory(product).toLowerCase().replaceAll(" ", "-"), name: productCategory(product) }])).values());
  const styleFilters = stitchStyleFilters.filter((style) =>
    allProducts.some((product) => productMatchesStyleContext(product, style))
  );
  const hasCategoryFilters = categoryFilters.length > 0;
  const hasStyleFilters = styleFilters.length > 0;
  const hasFilters = hasCategoryFilters || hasStyleFilters;
  const normalizedActiveCategorySlug = activeCategorySlug?.trim().toLowerCase();
  const normalizedActiveStyleSlug = activeStyleSlug?.trim().toLowerCase();
  const activeCategory = normalizedActiveCategorySlug ? categoryFilters.find((category) => category.slug.toLowerCase() === normalizedActiveCategorySlug) : undefined;
  const activeStyle = normalizedActiveStyleSlug ? styleFilters.find((style) => style.slug === normalizedActiveStyleSlug) : undefined;
  const categoryProducts = activeCategory ? allProducts.filter((product) => product.categoryId === activeCategory.id || productCategory(product) === activeCategory.name) : allProducts;
  const products = activeStyle ? categoryProducts.filter((product) => productMatchesStyleContext(product, activeStyle)) : categoryProducts;
  const activeFilterLabel = [activeCategory?.name, activeStyle?.label].filter(Boolean).join(" and ");
  const hasActiveFilter = Boolean(activeCategory || activeStyle);
  const activeEmptyTitle = hasActiveFilter ? `No ${activeFilterLabel.toLowerCase()} listings are available right now` : emptyTitle;
  const activeEmptyMessage = hasActiveFilter ? "Clear the filters or send a rental enquiry if you already know the pieces or setup direction you need." : emptyMessage;
  const emptyActionHref = hasActiveFilter ? detailBasePath : "/quote";
  const emptyActionLabel = hasActiveFilter ? "Clear filters" : "Request Quote";
  const buildFilterHref = ({ category, style }: { category?: string; style?: string }) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (style) params.set("style", style);
    const query = params.toString();
    return query ? `${detailBasePath}?${query}` : detailBasePath;
  };

  return <><section className="stitch-catalogue-hero"><div className="stitch-container"><StitchPageIntro eyebrow={detailBasePath === "/listings" ? "Setups" : "Catalogue"} title={title} intro={intro} /></div></section><section className="stitch-section stitch-catalogue-section"><div className={`stitch-container stitch-catalogue-layout${hasFilters ? "" : " stitch-catalogue-layout--no-filters"}`}>{hasFilters ? <aside className="stitch-filter-panel" aria-label="Catalogue filters">{hasCategoryFilters ? <div className="stitch-filter-group stitch-filter-group--categories"><h2>Categories</h2><Link className={!activeCategory ? "is-active" : undefined} href={buildFilterHref({ style: activeStyle?.slug })} scroll={false}>All Categories</Link>{categoryFilters.map((category) => <Link className={activeCategory?.id === category.id ? "is-active" : undefined} href={buildFilterHref({ category: category.slug, style: activeStyle?.slug })} key={category.id} scroll={false}>{category.name}</Link>)}</div> : null}{hasStyleFilters ? <div className="stitch-filter-group stitch-filter-group--styles"><h2>Style context</h2><Link className={!activeStyle ? "is-active" : undefined} href={buildFilterHref({ category: activeCategory?.slug })} scroll={false}>All Styles</Link>{styleFilters.map((style) => <Link className={activeStyle?.slug === style.slug ? "is-active" : undefined} href={buildFilterHref({ category: activeCategory?.slug, style: style.slug })} key={style.slug} scroll={false}>{style.label}</Link>)}</div> : null}</aside> : null}<div className="stitch-catalogue-results">{hasActiveFilter ? <p className="stitch-active-filter">Showing {activeFilterLabel} within the furniture catalogue. <Link href={detailBasePath} scroll={false}>Clear filter</Link></p> : null}{products.length ? <div className="stitch-card-grid">{products.map((product) => <StitchItemCard key={product.id} product={product} detailBasePath={detailBasePath} />)}</div> : <StitchEmptyState title={activeEmptyTitle} message={activeEmptyMessage} actionHref={emptyActionHref} actionLabel={emptyActionLabel} />}</div></div></section></>;
}

export function StitchSetupsPage({ catalogue, activeSetupSlug }: { catalogue: PublicCatalogue; activeSetupSlug?: string }) {
  const realSetups = catalogue.products.slice(0, 5).map((product, index) => ({ slug: product.slug, title: product.name, image: fallbackProductImage(product), summary: productSummary(product), featured: index === 0 }));
  const setupCards = realSetups;
  const featuredSetup = setupCards[0];
  const setupFilters = [
    { slug: "weddings", label: "Weddings", setupSlugs: ["botanical-wedding"] },
    { slug: "corporate-summits", label: "Corporate Summits", setupSlugs: ["the-metropolitan-gala", "executive-summit", "gallery-exhibition", "atrium-showcase"] },
    { slug: "intimate-dining", label: "Intimate Dining", setupSlugs: ["intimate-nocturne"] },
    { slug: "lounges", label: "Lounges", setupSlugs: ["terrace-lounge", "press-preview-lounge"] }
  ];
  const setupFiltersWithRecords = setupFilters.filter((filter) =>
    setupCards.some((setup) => filter.setupSlugs.includes(setup.slug))
  );
  const setupFilterSlugBySetupSlug = new Map<string, string>();
  setupCards.forEach((setup) => {
    const matchedFilter = setupFilters.find((filter) => filter.setupSlugs.includes(setup.slug));
    if (matchedFilter) {
      setupFilterSlugBySetupSlug.set(setup.slug, matchedFilter.slug);
    }
  });
  const normalizedActiveSetupSlug = activeSetupSlug?.trim().toLowerCase();
  const activeFilterSlug = normalizedActiveSetupSlug
    ? setupFiltersWithRecords.some((filter) => filter.slug === normalizedActiveSetupSlug)
      ? normalizedActiveSetupSlug
      : setupFilterSlugBySetupSlug.get(normalizedActiveSetupSlug)
    : undefined;
  const visibleSetups = activeFilterSlug ? setupCards.filter((setup) => setupFilterSlugBySetupSlug.get(setup.slug) === activeFilterSlug) : setupCards;
  const setupPillLinks = setupCards.length
    ? [
      { label: "All Setups", href: "/listings", active: !activeFilterSlug },
      ...setupFiltersWithRecords.map((filter) => ({
      label: filter.label,
      href: `/listings?setup=${encodeURIComponent(filter.slug)}`,
      active: activeFilterSlug === filter.slug
    }))
    ]
    : [];

  return <><section className="stitch-setups-hero"><div className="stitch-container"><StitchPageIntro eyebrow="Setups" title="Curated Scapes" intro="Explore styled environment directions that help describe rental mood, scale, and event context for team review." /></div></section>{featuredSetup ? <section className="stitch-setups-feature-section"><div className="stitch-container stitch-setups-feature-split"><Link className="stitch-setups-feature__image" href={`/listings/${featuredSetup.slug}`}><img src={stitchImageSrc(featuredSetup.image)} alt={`${featuredSetup.title} event furniture setup`} /></Link><div className="stitch-setups-feature__copy"><span>Featured Editorial</span><h2>{featuredSetup.title}</h2><p>{featuredSetup.summary}</p><Link className="stitch-link-button stitch-link-button--quiet" href={`/listings/${featuredSetup.slug}`}>Explore Collection</Link></div></div></section> : null}{setupPillLinks.length ? <section className="stitch-setups-filter-section" id="setup-listings"><div className="stitch-container"><div className="stitch-pill-row">{setupPillLinks.map((item) => <Link aria-current={item.active ? "page" : undefined} href={item.href} key={item.href} scroll={false}>{item.label}</Link>)}</div></div></section> : null}<section className="stitch-setups-grid-section"><div className="stitch-container">{visibleSetups.length ? <div className="stitch-setups-grid">{visibleSetups.map((setup, index) => <Link className={`stitch-setup-tile ${index === visibleSetups.length - 1 ? "stitch-setup-tile--wide" : ""}`} href={`/listings/${setup.slug}`} key={setup.slug}><span className="stitch-setup-tile__image"><img src={stitchImageSrc(setup.image)} alt={`${setup.title} event furniture setup`} /><QuoteSelectionBadge item={setupQuoteSelectionItem(setup)} /></span><span className="stitch-setup-tile__body"><strong>{setup.title}</strong><small>{setup.summary}</small><em>View Setup Details</em></span></Link>)}</div> : <StitchEmptyState title="No public setup records are available right now" message="Published setup directions will appear here once available. You can still send an enquiry with the event mood, furniture pieces, and setup context you have in mind." />}</div></section></>;
}

export function StitchDetail({ product, backHref, backLabel, setup = false, related = [] }: { product: PublicCatalogueProduct; backHref: string; backLabel: string; setup?: boolean; related?: PublicCatalogueProduct[] }) {
  const image = product.primaryImage;
  const alt = textOrUndefined(image?.altText) ?? `${product.name} furniture rental setup`;
  const imgSrc = image?.publicUrl ?? stitchImageSrc(setup ? galaImage : fallbackProductImage(product));
  const setupRelatedItems = setup ? related : [];
  const setupIncludedItems = setup
    ? setupRelatedItems.map((item, index) =>
        setupIncludedQuoteItem(
          item,
          product,
          index === 0 ? 120 : index === 1 ? 15 : 6
        )
      )
    : [];
  const quoteItem = quoteSelectionItem(
    product,
    imgSrc,
    setup ? "setup" : "rental",
    setupIncludedItems
  );
  const catalogueImageMap = new Map<string, { alt: string; src: string }>();
  catalogueImageMap.set(imgSrc, { alt, src: imgSrc });
  for (const productImage of [...(product.images ?? [])].sort(
    (firstImage, secondImage) => firstImage.sortOrder - secondImage.sortOrder
  )) {
    const src = productImage.publicUrl;
    if (src) {
      catalogueImageMap.set(src, {
        alt: textOrUndefined(productImage.altText) ?? `${product.name} rental piece`,
        src
      });
    }
  }
  const catalogueCarouselImages = Array.from(catalogueImageMap.values());
  const setupCarouselImages = setup
    ? [
        { alt, src: imgSrc },
        ...setupRelatedItems.map((item) => ({
          alt: `${item.name} rental piece`,
          src: stitchImageSrc(fallbackProductImage(item))
        }))
      ]
    : [{ alt, src: imgSrc }];
  const detailBackLabel = backLabel.toLowerCase().startsWith("back ")
    ? backLabel
    : `Back to ${backLabel}`;

  if (setup) {
    return (
      <section className="stitch-detail-page stitch-detail-page--setup">
        <div className="stitch-container">
          <div className="stitch-detail-open-grid stitch-detail-open-grid--setup">
            <div className="stitch-detail-open-media stitch-detail-open-media--carousel stitch-setup-media">
              <SetupImageCarousel
                images={setupCarouselImages}
                label={`${product.name} setup images`}
                nextLabel="Next setup image"
                previousLabel="Previous setup image"
              />
            </div>
            <div className="stitch-detail-open-copy stitch-setup-summary">
              <p className="stitch-eyebrow">Setups / Direction</p>
              <h2 className="stitch-detail-title">{product.name}</h2>
              <p>{productSummary(product)}</p>
              <div className="stitch-detail-spec-card stitch-detail-spec-card--setup">
                <h2>Setup details</h2>
                <dl>
                  <div>
                    <dt>Direction</dt>
                    <dd>Styled setup</dd>
                  </div>
                  <div>
                    <dt>Included rental pieces</dt>
                    <dd>{setupRelatedItems.length} pieces</dd>
                  </div>
                </dl>
              </div>
              <div className="stitch-detail-actions stitch-detail-actions--setup">
                <QuoteSelectionButton item={quoteItem} />
                <Link className="stitch-detail-button stitch-detail-button--back" href={backHref}>
                  {detailBackLabel}
                </Link>
                <Link className="stitch-detail-button stitch-detail-button--request" href="/quote">
                  Request Quote
                </Link>
              </div>
            </div>
          </div>
          <section className="stitch-included-open">
            <div className="stitch-included-open__header">
              <h3>Included rental pieces</h3>
            </div>
            <div className="stitch-included-open__grid">
              {setupRelatedItems.map((item, index) => (
                <article key={item.id}>
                  <img
                    alt={`${item.name} rental piece`}
                    src={stitchImageSrc(fallbackProductImage(item))}
                  />
                  <div>
                    <strong>{item.name}</strong>
                    <small>Qty: {index === 0 ? "120" : index === 1 ? "15" : "6"}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    );
  }

  return (
    <section className="stitch-detail-page stitch-detail-page--setup stitch-detail-page--catalogue-item">
      <div className="stitch-container">
        <div className="stitch-detail-open-grid stitch-detail-open-grid--setup">
          <div className="stitch-detail-open-media stitch-detail-open-media--carousel stitch-setup-media">
            <SetupImageCarousel
              images={catalogueCarouselImages}
              label={`${product.name} listing images`}
              nextLabel="Next listing image"
              previousLabel="Previous listing image"
            />
          </div>
          <div className="stitch-detail-open-copy stitch-setup-summary">
            <p className="stitch-eyebrow">Catalogue / {productCategory(product)}</p>
            <h2 className="stitch-detail-title">{product.name}</h2>
            <p>{productSummary(product)}</p>
            <div className="stitch-detail-spec-card stitch-detail-spec-card--setup">
              <h2>Listing details</h2>
              <dl>
                <div>
                  <dt>Category</dt>
                  <dd>{productCategory(product)}</dd>
                </div>
                <div>
                  <dt>Style</dt>
                  <dd>{productStyleContext(product)}</dd>
                </div>
                <div>
                  <dt>Rental unit</dt>
                  <dd>{product.rentalUnit}</dd>
                </div>
              </dl>
            </div>
            <div className="stitch-detail-actions stitch-detail-actions--setup">
              <QuoteSelectionButton item={quoteItem} />
              <Link className="stitch-detail-button stitch-detail-button--back" href={backHref}>
                {detailBackLabel}
              </Link>
              <Link className="stitch-detail-button stitch-detail-button--request" href="/quote">
                Request Quote
              </Link>
            </div>
            <p className="stitch-detail-guardrail-copy">
              Bring event details. Add quantities and alternatives in the enquiry notes. Share setup,
              access, and timing notes. This request does not set aside furniture or finish rental
              details.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function StitchAboutPage() {
  const principles = [["Form and function", "Rental pieces should support the room plan, not compete with it.", "diamond"], ["Material honesty", "Texture, proportion, and finish help each event setting feel considered.", "tools"], ["Timelessness", "Simple silhouettes leave space for different venues, moods, and guest flows.", "layout"]];
  const support = [["Brief review", "We review your event context and selected rental pieces.", "diamond"], ["Rental coordination", "We help align items, setups, and practical rental details.", "tools"], ["Proposal follow-up", "We follow up with a tailored proposal and next steps.", "layout"]];
  return <><section className="stitch-about-hero"><div className="stitch-container"><StitchPageIntro eyebrow="About" title="Curating spaces that breathe, inspire, and endure" intro="Furniture is the quiet architecture of an event. SpaceKonceptRental helps visitors browse rental pieces and setup directions, then share event context for manual team review." /></div></section><section className="stitch-section stitch-about-story"><div className="stitch-container stitch-about-story__grid"><div><p className="stitch-eyebrow">Our story</p><h2>Our Story</h2><p>Use public catalogue records and setup references to shape the enquiry. The team reviews submitted details before preparing a tailored proposal.</p><p>The website supports browsing and enquiry intake only; final rental details stay in direct team follow-up.</p></div><div className="stitch-about-story__image"><img src={aboutStoryImageUrl} alt="Curated lounge furniture setting" /></div></div></section><section className="stitch-section stitch-section--tonal stitch-about-principles"><div className="stitch-container"><div className="stitch-section-heading stitch-section-heading--center"><h2>Architecture-First Design</h2></div><div className="stitch-feature-grid">{principles.map(([title, text, icon]) => <article className="stitch-feature stitch-about-card" key={title}><span className={`stitch-feature__icon stitch-feature__icon--${icon}`} aria-hidden="true" /><h3>{title}</h3><p>{text}</p></article>)}</div></div></section><section className="stitch-section stitch-about-service"><div className="stitch-container"><div className="stitch-section-heading stitch-section-heading--center"><h2>Service-led rental support</h2></div><div className="stitch-feature-grid">{support.map(([title, text, icon]) => <article className="stitch-feature stitch-about-card" key={title}><span className={`stitch-feature__icon stitch-feature__icon--${icon}`} aria-hidden="true" /><h3>{title}</h3><p>{text}</p></article>)}</div></div></section><section className="stitch-section stitch-section--tonal"><div className="stitch-container stitch-cta-band"><h2>Ready to elevate your space?</h2><p>Explore the catalogue to find rental pieces that resonate with your vision.</p><StitchButton href="/catalogue">Browse Catalogue</StitchButton></div></section></>;
}

export function StitchContactPage() {
  const reviewSteps = [
    ["01", "Select pieces", "Choose catalogue items or a setup direction."],
    ["02", "Add context", "Include date, venue, access, quantities, and alternates."],
    ["03", "Team follow-up", "The rental team reviews details before preparing next steps."]
  ];

  return (
    <>
      <section className="stitch-contact-hero">
        <div className="stitch-container">
          <StitchPageIntro eyebrow="Contact" title="Get in Touch" intro="Share rental catalogue questions, setup context, or event notes through the enquiry path so the team can review everything in one place." />
        </div>
      </section>
      <section className="stitch-section stitch-section--tonal stitch-contact-section stitch-contact-process-section">
        <div className="stitch-container">
          <div className="stitch-section-heading stitch-section-heading--center">
            <h2>Enquiry review steps</h2>
          </div>
          <div className="stitch-feature-grid stitch-contact-step-grid" aria-label="Enquiry review steps">
            {reviewSteps.map(([number, title, text]) => (
              <article className="stitch-feature stitch-contact-step-card" key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="stitch-section stitch-contact-section stitch-contact-brief-section">
        <div className="stitch-container stitch-cta-band stitch-contact-brief-band">
          <p className="stitch-eyebrow">Rental enquiry path</p>
          <h2>Start with a rental brief</h2>
          <p>Share selected items, setup direction, event details, and timing notes so the rental team can review everything before follow-up.</p>
          <StitchActions>
            <StitchButton href="/quote">Request Quote</StitchButton>
            <StitchButton href="/catalogue" variant="secondary">Browse Catalogue</StitchButton>
          </StitchActions>
        </div>
      </section>
    </>
  );
}
