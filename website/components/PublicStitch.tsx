import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import chairImage from "../assets/images/product_chair.png";
import sofaImage from "../assets/images/product_sofa.png";
import corporateImage from "../assets/images/event_corporate.png";
import galaImage from "../assets/images/event_gala.png";
import exhibitionImage from "../assets/images/event_exhibition.png";
import heroImage from "../assets/images/hero_homepage.png";
import type { PublicCatalogue, PublicCatalogueProduct } from "../lib/catalogue/types";
import { getQuoteHrefForListing } from "../lib/catalogue/quote-handoff";

export const stitchImages = { chairImage, sofaImage, corporateImage, galaImage, exhibitionImage, heroImage };

type DemoProduct = Pick<PublicCatalogueProduct, "id" | "slug" | "name" | "shortDescription" | "description" | "rentalUnit" | "sortOrder" | "categoryId" | "categoryName" | "source"> & { image: StaticImageData };

const demoProducts: DemoProduct[] = [
  { id: "demo-aura", slug: "aura-lounge-chair", name: "Aura Lounge Chair", shortDescription: "Olive velvet seating with a warm timber frame for lounge-focused event settings.", description: "Olive velvet seating with a warm timber frame for lounge-focused event settings.", rentalUnit: "piece", sortOrder: 1, categoryId: "seating", categoryName: "Seating", source: "fallback", image: chairImage },
  { id: "demo-kinetic", slug: "kinetic-dining-table", name: "Kinetic Dining Table", shortDescription: "A light oak table suited to dining, registration, and editorial setup plans.", description: "A light oak table suited to dining, registration, and editorial setup plans.", rentalUnit: "piece", sortOrder: 2, categoryId: "tables", categoryName: "Tables", source: "fallback", image: corporateImage },
  { id: "demo-linen", slug: "linen-floor-cushion", name: "Linen Floor Cushion", shortDescription: "Soft neutral accent seating for relaxed event lounges and layered vignettes.", description: "Soft neutral accent seating for relaxed event lounges and layered vignettes.", rentalUnit: "piece", sortOrder: 3, categoryId: "accents", categoryName: "Accents", source: "fallback", image: sofaImage },
  { id: "demo-arch", slug: "slender-arch-floor-lamp", name: "Slender Arch Floor Lamp", shortDescription: "Ambient sculptural lighting for warm event corners and soft transitions.", description: "Ambient sculptural lighting for warm event corners and soft transitions.", rentalUnit: "piece", sortOrder: 4, categoryId: "lighting", categoryName: "Lighting", source: "fallback", image: exhibitionImage },
  { id: "demo-ribbed", slug: "ribbed-walnut-credenza", name: "Ribbed Walnut Credenza", shortDescription: "Textural storage and display support for reception or gallery-led settings.", description: "Textural storage and display support for reception or gallery-led settings.", rentalUnit: "piece", sortOrder: 5, categoryId: "storage", categoryName: "Storage", source: "fallback", image: galaImage },
  { id: "demo-monumental", slug: "monumental-oak-table", name: "Monumental Oak Table", shortDescription: "A grounded timber table for dining, display, or registration moments.", description: "A grounded timber table for dining, display, or registration moments.", rentalUnit: "piece", sortOrder: 6, categoryId: "tables", categoryName: "Tables", source: "fallback", image: sofaImage }
];

const demoSetups = [
  { slug: "the-metropolitan-gala", title: "The Metropolitan Gala", image: galaImage, summary: "Tonal layers, sculptural surfaces, and lounge pieces for elevated evening event settings." },
  { slug: "botanical-wedding", title: "Botanical Wedding", image: sofaImage, summary: "Organic silhouettes and soft seating cues for daylight celebrations and garden-led spaces." },
  { slug: "executive-summit", title: "Executive Summit", image: corporateImage, summary: "Structured furniture groupings for focused sessions, reception points, and calm networking areas." },
  { slug: "gallery-exhibition", title: "Gallery Exhibition", image: exhibitionImage, summary: "Minimal display-friendly layouts that leave room for launches, galleries, and product showcases." }
];

export function isDemoContentEnabled() {
  return process.env.NEXT_PUBLIC_SKR_DEMO_CONTENT === "true";
}

export function getDemoProducts() {
  return isDemoContentEnabled() ? demoProducts : [];
}

export function textOrUndefined(value: string | undefined | null) {
  return value?.trim() || undefined;
}

export function productSummary(product: PublicCatalogueProduct | DemoProduct) {
  return textOrUndefined(product.shortDescription) ?? textOrUndefined(product.description) ?? "Listing details can be reviewed with the team during quote follow-up. Share this rental piece in an enquiry so the team can review fit and details with you.";
}

export function productCategory(product: PublicCatalogueProduct | DemoProduct) {
  return textOrUndefined(product.categoryName) ?? "Category to confirm";
}

export function stitchImageSrc(image: StaticImageData | string) {
  return typeof image === "string" ? image : image.src;
}

export function fallbackProductImage(product: PublicCatalogueProduct | DemoProduct): StaticImageData {
  if ("image" in product) return product.image;
  const haystack = `${product.slug} ${product.name} ${product.categoryName ?? ""}`.toLowerCase();
  if (haystack.includes("chair") || haystack.includes("seating")) return chairImage;
  if (haystack.includes("gala") || haystack.includes("setup")) return galaImage;
  if (haystack.includes("table") || haystack.includes("corporate") || haystack.includes("display")) return corporateImage;
  return sofaImage;
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

export function StitchHomeHero() {
  return <section className="stitch-home-hero"><div className="stitch-container stitch-home-hero__grid"><div className="stitch-home-hero__copy"><p className="stitch-eyebrow">Furniture and event rentals</p><h1>Furnish your vision. Elevate every space.</h1><p>Browse rental pieces, explore setup directions, and send an enquiry for manual team review.</p><StitchActions><StitchButton href="/quote">Request Quote</StitchButton><StitchButton href="/catalogue" variant="secondary">Browse Catalogue</StitchButton><StitchButton href="/listings" variant="secondary">Explore Setups</StitchButton></StitchActions></div><div className="stitch-home-hero__media"><Image src={heroImage} alt="Styled rental furniture setting" priority /></div></div></section>;
}

export function StitchAdvantageCards() {
  const items = [
    ["Superior quality", "Curated rental pieces selected for considered event spaces and visual cohesion."],
    ["Setup-aware planning", "Share venue, timing, quantities, and access notes so the team can review fit."],
    ["Flexible enquiry path", "Use catalogue records, setup references, or a general request to start the conversation."]
  ];
  return <section className="stitch-section"><div className="stitch-container"><div className="stitch-section-heading"><p className="stitch-eyebrow">The Space Koncept advantage</p><h2>Furniture that shapes the room before the event begins.</h2></div><div className="stitch-feature-grid">{items.map(([title, text]) => <article className="stitch-feature" key={title}><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>;
}

export function StitchCategoryPreview({ catalogue }: { catalogue: PublicCatalogue }) {
  const categories = catalogue.categories.length ? catalogue.categories.slice(0, 4) : [
    { id: "seating", slug: "seating", name: "Seating", description: "Chairs, sofas, and lounge pieces for event spaces.", sortOrder: 1 },
    { id: "tables", slug: "tables", name: "Tables", description: "Surfaces for dining, display, registration, and gathering.", sortOrder: 2 },
    { id: "lighting", slug: "lighting", name: "Lighting", description: "Ambient pieces to support the overall setting.", sortOrder: 3 },
    { id: "accents", slug: "accents", name: "Decor and accents", description: "Texture, shape, and finishing details for the room.", sortOrder: 4 }
  ];
  const imageMap = [chairImage, corporateImage, exhibitionImage, galaImage];
  return <section className="stitch-section stitch-section--tonal stitch-home-categories"><div className="stitch-container"><div className="stitch-section-heading stitch-section-heading--row"><div><p className="stitch-eyebrow">Browse by category</p><h2>Start with the furniture type, then refine the setup.</h2></div><StitchButton href="/categories" variant="secondary">View All Categories</StitchButton></div><div className="stitch-home-category-mosaic">{categories.map((category, index) => <Link className={`stitch-home-category-card stitch-home-category-card--${index + 1}`} href="/categories" key={category.id}><Image src={imageMap[index % imageMap.length]} alt={`${category.name} rental category`} /><span>{category.name}</span></Link>)}</div></div></section>;
}

export function StitchItemCard({ product, detailBasePath = "/catalogue" }: { product: PublicCatalogueProduct | DemoProduct; detailBasePath?: string }) {
  const image = "primaryImage" in product ? product.primaryImage : undefined;
  const alt = textOrUndefined(image?.altText) ?? `${product.name} furniture rental setup`;
  const imgSrc = image?.publicUrl ?? stitchImageSrc(fallbackProductImage(product));
  return <article className="stitch-card stitch-product-card" aria-label={`Rental listing card for ${product.name}`}><Link className="stitch-card__image" href={`${detailBasePath}/${product.slug}`}><img alt={alt} src={imgSrc} /></Link><div className="stitch-card__body"><p className="stitch-card__meta">{productCategory(product)}</p><h2>{product.name}</h2><p>{productSummary(product)}</p><div className="stitch-card__actions"><Link aria-label={`Add ${product.name} to quote`} className="stitch-link-button" href={getQuoteHrefForListing(product.slug)}>Add to Quote</Link><Link aria-label={`View details for ${product.name}`} className="stitch-link-button stitch-link-button--quiet" href={`${detailBasePath}/${product.slug}`}>View Details</Link></div></div></article>;
}

export function StitchFeaturedPieces({ catalogue }: { catalogue: PublicCatalogue }) {
  const products = catalogue.products.length ? catalogue.products.slice(0, 4) : getDemoProducts().slice(0, 4);
  return <section className="stitch-section stitch-home-featured"><div className="stitch-container"><div className="stitch-section-heading stitch-section-heading--center"><p className="stitch-eyebrow">Featured pieces</p><h2>Rental pieces with room to adapt.</h2></div>{products.length ? <><div className="stitch-home-featured-grid">{products.map((product) => <Link className="stitch-home-feature-card" href={`/catalogue/${product.slug}`} key={product.id}><img alt={`${product.name} rental piece`} src={stitchImageSrc(fallbackProductImage(product))} /><strong>{product.name}</strong><small>{productCategory(product)}</small></Link>)}</div><div className="stitch-home-featured-action"><StitchButton href="/catalogue" variant="secondary">View Full Catalogue</StitchButton></div></> : <StitchEmptyState title="Catalogue records are not published yet." message="The public catalogue will show real rental records when they are available. You can still send an enquiry with the pieces or setup you have in mind." />}</div></section>;
}

export function StitchSetupCard({ setup }: { setup: typeof demoSetups[number] }) {
  return <article className="stitch-setup-card"><Link className="stitch-setup-card__image" href={`/listings/${setup.slug}`}><Image src={setup.image} alt={`${setup.title} event furniture setup`} /></Link><div><h2>{setup.title}</h2><p>{setup.summary}</p><Link className="stitch-link-button stitch-link-button--quiet" href={`/listings/${setup.slug}`}>View Setup Details</Link></div></article>;
}

export function StitchEmptyState({ title, message, actionHref = "/quote", actionLabel = "Request Quote" }: { title: string; message: string; actionHref?: string; actionLabel?: string }) {
  return <section className="stitch-empty"><p className="stitch-eyebrow">Current selection</p><h2>{title}</h2><p>{message}</p><StitchButton href={actionHref}>{actionLabel}</StitchButton></section>;
}

export function StitchCatalogueShell({ catalogue, detailBasePath = "/catalogue", title = "Furniture catalogue", intro = "Curated rental pieces for elevated event environments.", emptyTitle = "No public rental listings are available right now", emptyMessage = "Real catalogue records will appear here once published. Send a rental enquiry if you already know the pieces or setup direction you need." }: { catalogue: PublicCatalogue; detailBasePath?: string; title?: string; intro?: string; emptyTitle?: string; emptyMessage?: string }) {
  const demo = getDemoProducts();
  const products = catalogue.products.length ? catalogue.products : demo;
  const categoryFilters = catalogue.categories.length ? catalogue.categories : Array.from(new Map(products.map((product) => [productCategory(product).toLowerCase(), { id: product.categoryId ?? productCategory(product), slug: product.categoryId ?? productCategory(product).toLowerCase().replaceAll(" ", "-"), name: productCategory(product) }])).values());
  return <><section className="stitch-catalogue-hero"><div className="stitch-container"><StitchPageIntro eyebrow={detailBasePath === "/listings" ? "Setups" : "Catalogue"} title={title} intro={intro} /></div></section><section className="stitch-section stitch-catalogue-section"><div className="stitch-container stitch-catalogue-layout"><aside className="stitch-filter-panel" aria-label="Catalogue filters"><h2>Categories</h2><Link href={detailBasePath}>All Items</Link>{categoryFilters.map((category) => <Link href={detailBasePath === "/catalogue" ? "/categories" : `${detailBasePath}?category=${category.slug}`} key={category.id}>{category.name}</Link>)}<h2>Style context</h2><span>Mid-Century Modern</span><span>Minimalist</span><span>Brutalist</span></aside><div className="stitch-catalogue-results">{products.length ? <div className="stitch-card-grid">{products.map((product) => <StitchItemCard key={product.id} product={product} detailBasePath={detailBasePath} />)}</div> : <StitchEmptyState title={emptyTitle} message={emptyMessage} />}</div></div></section></>;
}

export function StitchSetupsPage({ catalogue }: { catalogue: PublicCatalogue }) {
  const products = catalogue.products.length ? catalogue.products.slice(0, 4) : [];
  return <><section className="stitch-setups-hero"><div className="stitch-container stitch-setups-hero__grid"><div><p className="stitch-eyebrow">Setups</p><h1>Curated scapes.</h1><p>Explore styled environment directions that help describe rental mood, scale, and event context for team review.</p><StitchActions><StitchButton href="/quote">Request Quote</StitchButton><StitchButton href="/catalogue" variant="secondary">Browse Catalogue</StitchButton></StitchActions></div><div className="stitch-setups-feature"><Image src={galaImage} alt="Metropolitan gala furniture setup" /><div><h2>The Metropolitan Gala</h2><p>Tonal layering, sculptural furniture, and soft seating references for high-impact event settings.</p><Link className="stitch-link-button" href="/listings/the-metropolitan-gala">Explore Collection</Link></div></div></div></section><section className="stitch-section"><div className="stitch-container"><div className="stitch-pill-row"><span>All Setups</span><span>Weddings</span><span>Corporate Summits</span><span>Intimate Dining</span><span>Lounges</span></div>{products.length ? <div className="stitch-card-grid">{products.map((product) => <StitchItemCard key={product.id} product={product} detailBasePath="/listings" />)}</div> : <div className="stitch-setup-list">{demoSetups.map((setup) => <StitchSetupCard key={setup.slug} setup={setup} />)}</div>}</div></section></>;
}

export function StitchDetail({ product, backHref, backLabel, setup = false, related = [] }: { product: PublicCatalogueProduct; backHref: string; backLabel: string; setup?: boolean; related?: Array<PublicCatalogueProduct | DemoProduct> }) {
  const image = product.primaryImage;
  const alt = textOrUndefined(image?.altText) ?? `${product.name} furniture rental setup`;
  const imgSrc = image?.publicUrl ?? stitchImageSrc(setup ? galaImage : fallbackProductImage(product));
  const fallbackRelated = setup ? getDemoProducts().slice(0, 4) : getDemoProducts().filter((item) => item.slug !== product.slug).slice(0, 3);
  const relatedItems = related.length ? related : fallbackRelated;
  return <><section className={setup ? "stitch-detail-page stitch-detail-page--setup" : "stitch-detail-page"}><div className="stitch-container">{setup ? <p className="stitch-detail-breadcrumb">Setups / {product.name}</p> : null}<div className="stitch-detail-open-grid"><div className="stitch-detail-open-media"><img alt={alt} src={imgSrc} /></div><div className="stitch-detail-open-copy"><Link className="stitch-back" href={backHref}>{setup ? "Setups" : "Catalogue"} / {setup ? product.name : productCategory(product)}</Link><h1>{product.name}</h1><p>{productSummary(product)}</p>{setup ? <div className="stitch-detail-context"><p className="stitch-eyebrow">Setup context</p><h2>Our team will prepare a custom proposal based on your event requirements.</h2></div> : <dl className="stitch-detail-rows"><div><dt>{productCategory(product) === "Category to confirm" ? "Category" : productCategory(product)}</dt><dd>{product.rentalUnit}</dd></div><div><dt>Listing reference</dt><dd>{product.slug}</dd></div></dl>}<div className="stitch-detail-actions"><Link className="stitch-detail-button stitch-detail-button--primary" href={getQuoteHrefForListing(product.slug)}>{setup ? "Request Quote for this Setup" : "Add to Quote"}</Link><Link className="stitch-detail-button" href={backHref}>{setup ? "Back to Setups" : "Back to Catalogue"}</Link></div></div></div>{setup ? <div className="stitch-setup-lower"><div><h2>{product.name}</h2><p>{productSummary(product)}</p><div className="stitch-detail-context"><p className="stitch-eyebrow">Setup context</p><h2>Our team will prepare a custom proposal based on your event requirements.</h2></div><Link className="stitch-detail-button stitch-detail-button--primary stitch-detail-button--compact" href={getQuoteHrefForListing(product.slug)}>Request Quote for this Setup</Link></div><section className="stitch-included-open"><h2>Included rental pieces</h2><div>{fallbackRelated.map((item, index) => <article key={item.id}><img alt={`${item.name} rental piece`} src={stitchImageSrc(fallbackProductImage(item))} /><div><strong>{item.name}</strong><small>Qty: {index === 0 ? "120" : index === 1 ? "15" : "6"}</small></div></article>)}</div></section></div> : null}</div></section>{!setup && relatedItems.length ? <section className="stitch-section stitch-detail-related"><div className="stitch-container"><div className="stitch-section-heading stitch-section-heading--center"><h2>Complementary Pieces</h2></div><div className="stitch-detail-related-grid">{relatedItems.map((item) => <Link className="stitch-detail-related-card" href={`/catalogue/${item.slug}`} key={item.id}><img alt={`${item.name} rental piece`} src={stitchImageSrc(fallbackProductImage(item))} /><strong>{item.name}</strong></Link>)}</div></div></section> : null}</>;
}

export function StitchAboutPage() {
  const principles = [["Form and function", "Rental pieces should support the room plan, not compete with it."], ["Material honesty", "Texture, proportion, and finish help each event setting feel considered."], ["Timelessness", "Simple silhouettes leave space for different venues, moods, and guest flows."]];
  const support = [["Brief review", "We review your event context and selected rental pieces."], ["Rental coordination", "We help align items, setups, and practical rental details."], ["Proposal follow-up", "We follow up with a tailored proposal and next steps."]];
  return <><section className="stitch-about-hero"><div className="stitch-container"><p className="stitch-eyebrow">About</p><h1>Curating spaces for memorable moments.</h1><p>Furniture is the quiet architecture of an event. SpaceKonceptRental helps visitors browse rental pieces and setup directions, then share event context for manual team review.</p></div></section><section className="stitch-section stitch-about-story"><div className="stitch-container stitch-about-story__grid"><div><p className="stitch-eyebrow">Our story</p><h2>Practical rental planning with a design-aware lens.</h2><p>Use public catalogue records and setup references to shape the enquiry. The team reviews submitted details before preparing a tailored proposal.</p><p>The website supports browsing and enquiry intake only; final rental details stay in direct team follow-up.</p></div><div className="stitch-about-story__image"><Image src={sofaImage} alt="Curated lounge furniture setting" /></div></div></section><section className="stitch-section stitch-section--tonal stitch-about-principles"><div className="stitch-container"><div className="stitch-section-heading stitch-section-heading--center"><h2>Architecture-first design</h2></div><div className="stitch-feature-grid">{principles.map(([title, text]) => <article className="stitch-about-card" key={title}><h3>{title}</h3><p>{text}</p></article>)}</div></div></section><section className="stitch-section stitch-about-service"><div className="stitch-container"><div className="stitch-section-heading"><h2>Service-led rental support</h2><p>A practical team flow for enquiry review and tailored proposal follow-up.</p></div><div className="stitch-feature-grid">{support.map(([title, text]) => <article className="stitch-about-card stitch-about-card--large" key={title}><h3>{title}</h3><p>{text}</p></article>)}</div></div></section><section className="stitch-section stitch-section--tonal"><div className="stitch-container stitch-cta-band"><h2>Ready to shape your event setting?</h2><p>Send the pieces, setup notes, timing, and venue context you have.</p><StitchButton href="/quote">Use the enquiry form</StitchButton></div></section></>;
}

export function StitchContactPage() {
  return <><section className="stitch-contact-hero"><div className="stitch-container"><StitchPageIntro eyebrow="Contact" title="Get in Touch" intro="Share rental catalogue questions, setup context, or event notes through the enquiry path so the team can review the details and follow up." /></div></section><section className="stitch-section stitch-contact-section"><div className="stitch-container stitch-contact-grid"><aside className="stitch-contact-panel stitch-contact-copy"><h2>Contact Us</h2><p>Have a question about the rental catalogue or need a custom setup? Use the enquiry form path with the pieces, date, venue context, and notes you have.</p><dl><div><dt>Enquiry support</dt><dd>Use the enquiry form</dd></div><div><dt>Catalogue review</dt><dd>Share selected rental pieces</dd></div></dl></aside><div className="stitch-contact-form-panel" aria-label="Inquiry form preview"><h2>Inquiry Form</h2><div className="stitch-contact-form-grid"><span>First Name</span><span>Last Name</span><span>Email Address</span><span>Phone Number (Optional)</span></div><p className="stitch-contact-form-label">Interest (optional)</p><div className="stitch-contact-chip-row"><span>Catalogue</span><span>Setups</span><span>Rental enquiry</span></div><div className="stitch-contact-message">Your Message</div><Link className="stitch-link-button" href="/quote">Use the enquiry form</Link></div></div></section></>;
}
