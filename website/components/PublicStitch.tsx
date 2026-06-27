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

type DemoProduct = Pick<PublicCatalogueProduct, "id" | "slug" | "name" | "shortDescription" | "description" | "rentalUnit" | "sortOrder" | "categoryId" | "categoryName" | "source"> & { image: StaticImageData | string };

const homeHeroImageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuBMIAb-s3hFM7-rX6NqHe8HjNDVJ-VnaBLOlppG1oQtolnRXq__CGiW5eTsqbMyrs8ZVHafSQazQ5CU1RkOP6nNPfgWFrcyJk2H9T4u4S-EWRUUIb6F0l1vSCMvF62-NnKWfJCkrUGT8FV19LAyjqfjRNO9JuxEOz1O9tHH4CltNllxzsgL6FPoXzet1gGu4OBt4B0R5N5rlRfckyw_7uYkQJRpxq0C6VgsDFaKgDqQ_B2F-LEbezRSgIVzDRwO9irCS47fQkgQqMsb";
const aboutStoryImageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuCVRiKMpVS17P0POe4hgYLWJOqLZWHNBK0YGHw-bG4ETu7eWNw2o_RDNmsHhEgmEAfc1nWGlfVYJswBZRdLxn0pVc44lfcblgiNEyuHfr4APLO9MARpxHtb8kRWvMV7otaSDpU_tfoAPYGYbCMtj9DUnC49_anMv7E80cfYVCCK_uheLjc8ZiIEccgZUgjO8H3dhTXXY_cBGYInmYRilsvWVY_akz3twXUoGZotZr6SB4yHpefF4EcE8HJb4gp8pwrC_XR3IlH3bkkl";
const homeCategoryImageUrls = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAImhw0DRyJ87ykPAlGrIm3BrKMKXRpivv23Tdp1whVQ35E6fnIlhsbuUCUHPXF8ZUC8RUE5uHzPFkP7HoIINOXcung6zVL9x0yOMDzgkvKRXamMmq5FY9Rz7azxTqCNgaXA5Nr8c5UmQrlx_O8p_H_MYCWrfAHh4i0EdnLScgtT07-faMuNlDThQ0qur6BKi_mzgL7EjYya9TelJI_6Q2QYz1CnwE5sSNpajaODLu6PjolUwjUMLLGDzI7HBsoEWOc6cqR02wfs4KK",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCnKJvJ0T0vg0ALDdprS3us7Kdoe5oCpbRCxVZ2UaKI2x3lrav1Hww1aQN2YAP0XCAPzr1BuovrCPbkuCZW0O-M7JwkS2dBXmgOQxbIekL7mkIbO5C1XRtYXd0MGARo1jP47n66D_1ktKSFOHtRHDTJI3O-aXLeNN98Ho9vu8mkL-E-1YBCjyhh5y04iro3ty17SLHCgw6NI9rxTXrTUZAZw748x4ooPXNfmkeoWl1i3IHGnlYN08NAcxHfgHog43H9Ljxoj02uPBGo",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAlpUfC000VZu0JYJPneCV-VN2BqXnSaz9cCcJ_I4VlsbJ6pznqLZFVKfXxWG4VzMaTGi99F5p_bdzSBmtYtBCZuMmWfU6FyNRyQQcqSePFK8I-hDNUg9bat7bxz4qf9fSmYJIsC-SUXjszoPp7SUOansdXh20kfXMIkgh6C8Ba9WQCsnpFM2YDYXCDUHvgq5PrMyuVwR3OzLGJkYc7UIFJ611cBZfyblihi9JZvwB2AEML35ZAc1e8i__gKBn6izRcJbI2ovlDxGmF",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAYmGvnLNxjr_Qz3dHxk-CFHYzKK4A252rk6r7QoEgH4FcsoG599ev_OCCif9kDRH-kj9t4f_TuBOpJqSu1jB58gFjbxkL5gZvZQTFzF8q4xvq8btpEkOvznkuVdZ-SStna89cP3dzjjvXm-tlr9fxDTfMQq77FfV2g7abZKTndVutw5TySVGtlld-zxmaURlVfnArBxkIxEE4NId7gCNGWiMU-UeEJXpRZHwd5BQRf9mhJdgx7psRUT1YXv4TyQDuioUxLkKiPRrvC"
];

const demoProducts: DemoProduct[] = [
  { id: "demo-aura", slug: "aura-lounge-chair", name: "Aura Lounge Chair", shortDescription: "Olive velvet seating with a warm timber frame for lounge-focused event settings.", description: "Olive velvet seating with a warm timber frame for lounge-focused event settings.", rentalUnit: "piece", sortOrder: 1, categoryId: "seating", categoryName: "Seating", source: "fallback", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAImhw0DRyJ87ykPAlGrIm3BrKMKXRpivv23Tdp1whVQ35E6fnIlhsbuUCUHPXF8ZUC8RUE5uHzPFkP7HoIINOXcung6zVL9x0yOMDzgkvKRXamMmq5FY9Rz7azxTqCNgaXA5Nr8c5UmQrlx_O8p_H_MYCWrfAHh4i0EdnLScgtT07-faMuNlDThQ0qur6BKi_mzgL7EjYya9TelJI_6Q2QYz1CnwE5sSNpajaODLu6PjolUwjUMLLGDzI7HBsoEWOc6cqR02wfs4KK" },
  { id: "demo-kinetic", slug: "kinetic-dining-table", name: "Kinetic Dining Table", shortDescription: "A light oak table suited to dining, registration, and editorial setup plans.", description: "A light oak table suited to dining, registration, and editorial setup plans.", rentalUnit: "piece", sortOrder: 2, categoryId: "tables", categoryName: "Tables", source: "fallback", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBySE2F1_2J95qMsecqsIG9T6w51jQmD4NhABeyd-5OU3t9QQ5mqEtVKIzPGO90_B3knnGPsA5kzreSFZ7NmzxftT-ypwr2rLYX-vAiQcUviigLSrSbwkJQTNlI9yxuv_uU6ZfiimZwsRD-8MXOOfeNwEm-G-BDAAKAz3B-tVgflNw_AjvlhBWql3cl1-jN58uK6Nh0hbf0O3lyrCzrkR5lVRKXKv3LdOqEEGBPXVpFrEGa4OHkB48av3MflsDtHaVBKMHv4mbfXPdg" },
  { id: "demo-arch", slug: "slender-arch-floor-lamp", name: "Slender Arch Floor Lamp", shortDescription: "Ambient sculptural lighting for warm event corners and soft transitions.", description: "Ambient sculptural lighting for warm event corners and soft transitions.", rentalUnit: "piece", sortOrder: 3, categoryId: "lighting", categoryName: "Lighting", source: "fallback", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBerT9S8ujxmbed3uJlqweCh5RIPkhW9lujCCRFP_qYiTB0dj6pLyFcZtUwa2-EeOHYyWVEvGGd-_fl_6R5N98GK6Kp4K5TljfuWEMyVn4YZHZcV9RSoclm-xc94Xv0OCa7QJUy5JehipA74al0_26kV4X-JwPiYg_0e7xHVjTRaBMeahYQTGbIioj0MmsWwy6p_WezUdLmEabCIXFYWKBByavj_tHtJm051d3hdbbZ3JFYpZ8zvmEPcPG3PDNdKIiBd780YfBmu-t5" },
  { id: "demo-ribbed", slug: "ribbed-walnut-credenza", name: "Ribbed Walnut Credenza", shortDescription: "Textural storage and display support for reception or gallery-led settings.", description: "Textural storage and display support for reception or gallery-led settings.", rentalUnit: "piece", sortOrder: 4, categoryId: "storage", categoryName: "Storage", source: "fallback", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBD4OvwNaiByrB08KEm10qflQt-IyMNIxYCWofTS4HwvuHNgghiKO1gJB5PvUlxkhWYmZ8zb6g4WAis7aifNh_LoXTO1mRK-sRc4Ql1BfbK1bg5TQsdNWz6aRU7RLJIpi6QK-sxkqgRiybJCbKyTGfIzl7EIZ6qM6_kL-MokbchCfHmiP9pKRp6bEQviF_nZEr2fvhpjccPcjNLy_4Q317xYJ61EuxIz8OPEsEX-s5oJRai15IatfQZnd9YODAFd0cbcoJvwyjlehcZ" },
  { id: "demo-linen", slug: "linen-floor-cushion", name: "Linen Floor Cushion", shortDescription: "Soft neutral accent seating for relaxed event lounges and layered vignettes.", description: "Soft neutral accent seating for relaxed event lounges and layered vignettes.", rentalUnit: "piece", sortOrder: 5, categoryId: "accents", categoryName: "Accents", source: "fallback", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC7zSvIZ5HD9QijJ6Ae_MMlX5igiDKo2KYEPYhOrfm9OPp9rI7ziuUGpKtOvLC30W202bLkCfmsaIhDCwiM17LtwQK8UZtzckNst-N4oYgwYgI2UhuhWmGynqjUetMBXaHvIO7YEpdXtuSNsMZuNra-7i5V3-sHqzKPDofkEjCiarVXAeSZdq9HQHPQa6hUBgRFTtcK3_GoY60miToLSTrigew3ffnj_-RX4ZYgLy2H3ujSguMmfEqtkZB--iAXdwS3rLVqXLp2h35U" },
  { id: "demo-monumental", slug: "monumental-oak-table", name: "Monumental Oak Table", shortDescription: "A grounded timber table for dining, display, or registration moments.", description: "A grounded timber table for dining, display, or registration moments.", rentalUnit: "piece", sortOrder: 6, categoryId: "tables", categoryName: "Tables", source: "fallback", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDOXJiSNZDvvrg_DY68YsYIOCmrdAlAOA4EN1yokboEu5mxNIo9BFnQQi7wxGxAa3U1PG-2HiCK52v2FCxWSVEzQomhER2MQgpdKFoUU9-wn9kRfx0Sr-DUl6TqFRB1NRbgG4q5Vte12hR9ujIZQx3t9pKk8e6y5es5vjesVzBzkeokBTJ2ViA-ZlwO4ieGTwRAKBMiPlSpiM6kwQS594ClJZFacbGEYGo1_fT0dkuW8PZUpsJ5nXIsmB01oMoqadS5nVhQgiswHZAf" }
];

const demoSetups = [
  { slug: "the-metropolitan-gala", title: "The Metropolitan Gala", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDTX7SO5TNNQtDk2W9OqnTv0KbU7nuLqI7Sry2KOUIpPkcOXT5Aj39HvEUHSINH1Uj1Q419Hhdm9axGFDeKJPUzvBlYsyt9xf_lFlRpWF7dLZ1HxdrQjqKYMMJznVMdEE54KFuU6DyjrlRq031Nn08_hsqQzF4f4C_TTD1EhFwwMfEhCitIlltVrSaqKsNA774EROa0DKj213wM8ewD520JuASYWyBuj7pn9FvnOb5S06fyF0fZqi5gL89qvDeTWgP3Lw5Tmu1I-6GU", summary: "Tonal layers, sculptural surfaces, and lounge pieces for elevated evening event settings." },
  { slug: "botanical-wedding", title: "Botanical Wedding", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBUtYl2B4KD6m2_dSMS18WPLv8P3yhFut2qRl_YG-3Eq_01_GhbuWOmLVc_M91j65Y4BHpu0EHxOaVhzNxyt4yGfcsGrWg-hjt58aPR-DRvprdtUf8hnlI1yYCfDRyKGYh7Vcp2N38Fv0Y8-5y9p5J4rEFNJeOnqWEPWYDC9cqveOLZjhixkz8SRedF6QrCEt5XVj-VXhK0bmJFy2rhrG46ghV8LP-GtotX-xl0KaHTIcUnmXlfMNv39yCPFfkG7lc_SvNfVhdwsepB", summary: "Organic silhouettes and soft seating cues for daylight celebrations and garden-led spaces." },
  { slug: "executive-summit", title: "Executive Summit", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBySE2F1_2J95qMsecqsIG9T6w51jQmD4NhABeyd-5OU3t9QQ5mqEtVKIzPGO90_B3knnGPsA5kzreSFZ7NmzxftT-ypwr2rLYX-vAiQcUviigLSrSbwkJQTNlI9yxuv_uU6ZfiimZwsRD-8MXOOfeNwEm-G-BDAAKAz3B-tVgflNw_AjvlhBWql3cl1-jN58uK6Nh0hbf0O3lyrCzrkR5lVRKXKv3LdOqEEGBPXVpFrEGa4OHkB48av3MflsDtHaVBKMHv4mbfXPdg", summary: "Structured furniture groupings for focused sessions, reception points, and calm networking areas." },
  { slug: "intimate-nocturne", title: "Intimate Nocturne", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDvP42lEAX8n0nz7cNBM6UDonwbvBqD8nKJ2_mmkqFff6QlAJjfVVZfdcASHtKASEOQXeS5sCnVYIgs4jxBMIL7tqLp7Vrva2OnUdojZKE82sIJjA4qFIoppWkFl-Kl8TETFIQ6QlEBOq4FRcyA1BKgu62zvcGP_7ibt5_2Ewnmn5zXo-23UYKrnYHKOgeRstmNMAwCT_SPDwXB9s0Opu2vycV6T9dA0cKPyMe_EFno9nL9-BgzHrkaNq6O3R2QSxG5cqZG3DoByiCp", summary: "Warm low-light dining cues with layered surfaces, soft seating, and enclosed atmosphere." },
  { slug: "terrace-lounge", title: "Terrace Lounge", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAFxdE0niFeFoIoLuXKuuuC_MQs6gl2lwmOqoTyjx7S08WwEXDgj3PNBMD1PO1hkrnBk16G6pKIkPGukjAIflrAF05kGLe3A4Op59rMTppzzKdW8LHJGf1OsLU55vRLK9x_4gMkvm-LGkLNvJkOmvrRyhDMx8tyDMj1F9ulpmzrCnFuvuHH7W_5SHoCmYiOuT0Ub1cvUG4CbyLiV8Qhryw9dHiV5DJ8RrmZfvcZv_-9o5SVQv-BGoyTbRSd6QVI47ByYlmdDmmM-T2u", summary: "Low-profile lounge references for alfresco mingling, relaxed conversation, and sculptural accents." },
  { slug: "gallery-exhibition", title: "Gallery Exhibition", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAiljrIyhMN9Z7RX4VMV_Bk1wSCLVt26F9ST-5WpGLngA77j4dBWg_6prv-GSNNxcIR5XH4icMJsZUsk3rrYGvxMmDgPwXP3v62uDfPYZLdb_5zIUTumReVbnIt0fU-h_0pSNV_79X9S9FWpah6JEBGWLq_BRRWxBB52EA1qn1t9ZVFCpVg-VdqcBOO5OvCrwRMrZSrtiW7dqHfwheDEPYwdncN6xIfJ4fpKovD1_xVCKgKWVn3ICFXAuON5GgL5804KyD5QOEHMMQZ", summary: "Minimal display-friendly layouts that leave room for launches, galleries, and product showcases." }
];

export function isDemoContentEnabled() {
  return process.env.NEXT_PUBLIC_SKR_DEMO_CONTENT === "true";
}

export function getDemoProducts() {
  return isDemoContentEnabled() ? demoProducts : [];
}

export function getDemoSetupImageSrc(slug: string) {
  return demoSetups.find((setup) => setup.slug === slug)?.image;
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

export function fallbackProductImage(product: PublicCatalogueProduct | DemoProduct): StaticImageData | string {
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
  return <section className="stitch-home-hero"><div className="stitch-container stitch-home-hero__grid"><div className="stitch-home-hero__copy"><p className="stitch-eyebrow">Furniture and event rentals</p><h1>Furnish Your Vision. Elevate Every Space.</h1><p>Browse rental pieces, explore setup directions, and send an enquiry for manual team review.</p><StitchActions><StitchButton href="/quote">Request Quote</StitchButton><StitchButton href="/catalogue" variant="secondary">Browse Catalogue</StitchButton><StitchButton href="/listings" variant="secondary">Explore Setups</StitchButton></StitchActions></div><div className="stitch-home-hero__media"><picture><source media="(max-width: 639px)" srcSet={homeHeroImageUrl} /><img src={homeHeroImageUrl} alt="Styled rental furniture event setting" /></picture></div></div></section>;
}

export function StitchAdvantageCards() {
  const items = [
    ["Superior Quality", "Curated rental pieces selected for considered event spaces and visual cohesion.", "diamond"],
    ["Expert Setup", "Share logistics and venue context so the team can review each setup direction.", "tools"],
    ["Customizable Solutions", "Tailored enquiry notes help the team understand your event vision and rental needs.", "layout"]
  ];
  return <section className="stitch-section stitch-home-advantage"><div className="stitch-container"><div className="stitch-section-heading stitch-section-heading--center"><h2>The SpaceKonceptRental Advantage</h2></div><div className="stitch-feature-grid">{items.map(([title, text, icon]) => <article className="stitch-feature" key={title}><span className={`stitch-feature__icon stitch-feature__icon--${icon}`} aria-hidden="true" /><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>;
}

export function StitchCategoryPreview({ catalogue }: { catalogue: PublicCatalogue }) {
  const categories = catalogue.categories.length ? catalogue.categories.slice(0, 4) : [
    { id: "seating", slug: "seating", name: "Seating", description: "Chairs, sofas, and lounge pieces for event spaces.", sortOrder: 1 },
    { id: "tables", slug: "tables", name: "Tables", description: "Surfaces for dining, display, registration, and gathering.", sortOrder: 2 },
    { id: "lighting", slug: "lighting", name: "Lighting", description: "Ambient pieces to support the overall setting.", sortOrder: 3 },
    { id: "accents", slug: "accents", name: "Decor and accents", description: "Texture, shape, and finishing details for the room.", sortOrder: 4 }
  ];
  const imageMap = homeCategoryImageUrls;
  return <section className="stitch-section stitch-section--tonal stitch-home-categories"><div className="stitch-container"><div className="stitch-section-heading stitch-section-heading--row"><h2>Browse By Category</h2><StitchButton href="/categories" variant="secondary">View All</StitchButton></div><div className="stitch-home-category-mosaic">{categories.map((category, index) => <Link className={`stitch-home-category-card stitch-home-category-card--${index + 1}`} href="/categories" key={category.id}><img src={imageMap[index % imageMap.length]} alt={`${category.name} rental category`} /><span>{category.name}</span></Link>)}</div></div></section>;
}

export function StitchItemCard({ product, detailBasePath = "/catalogue" }: { product: PublicCatalogueProduct | DemoProduct; detailBasePath?: string }) {
  const image = "primaryImage" in product ? product.primaryImage : undefined;
  const alt = textOrUndefined(image?.altText) ?? `${product.name} furniture rental setup`;
  const imgSrc = image?.publicUrl ?? stitchImageSrc(fallbackProductImage(product));
  return <article className="stitch-card stitch-product-card" aria-label={`Rental listing card for ${product.name}`}><Link className="stitch-card__image" href={`${detailBasePath}/${product.slug}`}><img alt={alt} src={imgSrc} /></Link><div className="stitch-card__body"><p className="stitch-card__meta">{productCategory(product)}</p><h2>{product.name}</h2><p>{productSummary(product)}</p><div className="stitch-card__actions"><Link aria-label={`Add ${product.name} to quote`} className="stitch-link-button" href={getQuoteHrefForListing(product.slug)}>Add to Quote</Link><Link aria-label={`View details for ${product.name}`} className="stitch-link-button stitch-link-button--quiet" href={`${detailBasePath}/${product.slug}`}>View Details</Link></div></div></article>;
}

export function StitchFeaturedPieces({ catalogue }: { catalogue: PublicCatalogue }) {
  const products = catalogue.products.length ? catalogue.products.slice(0, 4) : getDemoProducts().slice(0, 4);
  return <section className="stitch-section stitch-home-featured"><div className="stitch-container"><div className="stitch-section-heading stitch-section-heading--center"><h2>Featured Pieces</h2></div>{products.length ? <><div className="stitch-home-featured-grid">{products.map((product) => <Link className="stitch-home-feature-card" href={`/catalogue/${product.slug}`} key={product.id}><img alt={`${product.name} rental piece`} src={stitchImageSrc(fallbackProductImage(product))} /><strong>{product.name}</strong><small>{productCategory(product)}</small></Link>)}</div><div className="stitch-home-featured-action"><StitchButton href="/catalogue" variant="secondary">View Full Catalogue</StitchButton></div></> : <StitchEmptyState title="Catalogue records are not published yet." message="The public catalogue will show real rental records when they are available. You can still send an enquiry with the pieces or setup you have in mind." />}</div></section>;
}

export function StitchSetupCard({ setup }: { setup: typeof demoSetups[number] }) {
  return <div className="stitch-setup-card"><Link className="stitch-setup-card__image" href={`/listings/${setup.slug}`}><Image src={setup.image} alt={`${setup.title} event furniture setup`} /></Link><div><h2>{setup.title}</h2><p>{setup.summary}</p><Link className="stitch-link-button stitch-link-button--quiet" href={`/listings/${setup.slug}`}>View Setup Details</Link></div></div>;
}

export function StitchEmptyState({ title, message, actionHref = "/quote", actionLabel = "Request Quote" }: { title: string; message: string; actionHref?: string; actionLabel?: string }) {
  return <section className="stitch-empty"><p className="stitch-eyebrow">Current selection</p><h2>{title}</h2><p>{message}</p><StitchButton href={actionHref}>{actionLabel}</StitchButton></section>;
}

export function StitchCatalogueShell({ catalogue, detailBasePath = "/catalogue", title = "Furniture Catalogue", intro = "Curated rental pieces for elevated event environments. Browsing does not set aside furniture or finalise rental details.", emptyTitle = "No public rental listings are available right now", emptyMessage = "Real catalogue records will appear here once published. Send a rental enquiry if you already know the pieces or setup direction you need." }: { catalogue: PublicCatalogue; detailBasePath?: string; title?: string; intro?: string; emptyTitle?: string; emptyMessage?: string }) {
  const demo = getDemoProducts();
  const products = catalogue.products.length ? catalogue.products : demo;
  const categoryFilters = catalogue.categories.length ? catalogue.categories : Array.from(new Map(products.map((product) => [productCategory(product).toLowerCase(), { id: product.categoryId ?? productCategory(product), slug: product.categoryId ?? productCategory(product).toLowerCase().replaceAll(" ", "-"), name: productCategory(product) }])).values());
  return <><section className="stitch-catalogue-hero"><div className="stitch-container"><StitchPageIntro eyebrow={detailBasePath === "/listings" ? "Setups" : "Catalogue"} title={title} intro={intro} /></div></section><section className="stitch-section stitch-catalogue-section"><div className="stitch-container stitch-catalogue-layout"><aside className="stitch-filter-panel" aria-label="Catalogue filters"><h2>Categories</h2><Link href={detailBasePath}>All Items</Link>{categoryFilters.map((category) => <Link href={detailBasePath === "/catalogue" ? "/categories" : `${detailBasePath}?category=${category.slug}`} key={category.id}>{category.name}</Link>)}<h2>Style context</h2><span>Mid-Century Modern</span><span>Minimalist</span><span>Brutalist</span></aside><div className="stitch-catalogue-results">{products.length ? <div className="stitch-card-grid">{products.map((product) => <StitchItemCard key={product.id} product={product} detailBasePath={detailBasePath} />)}</div> : <StitchEmptyState title={emptyTitle} message={emptyMessage} />}</div></div></section></>;
}

export function StitchSetupsPage({ catalogue }: { catalogue: PublicCatalogue }) {
  const realSetups = catalogue.products.slice(0, 5).map((product, index) => ({ slug: product.slug, title: product.name, image: fallbackProductImage(product), summary: productSummary(product), featured: index === 0 }));
  const setupCards = realSetups.length ? realSetups : isDemoContentEnabled() ? demoSetups.map((setup, index) => ({ ...setup, featured: index === 0 })) : [];
  const featuredSetup = setupCards[0];
  const supportingSetups = setupCards.slice(1);

  return <><section className="stitch-setups-hero"><div className="stitch-container stitch-setups-hero__copy"><p className="stitch-eyebrow">Setups</p><h1>Curated Scapes.</h1><p>Explore styled environment directions that help describe rental mood, scale, and event context for team review.</p></div></section>{featuredSetup ? <section className="stitch-setups-feature-section"><div className="stitch-container stitch-setups-feature-split"><Link className="stitch-setups-feature__image" href={`/listings/${featuredSetup.slug}`}><img src={stitchImageSrc(featuredSetup.image)} alt={`${featuredSetup.title} event furniture setup`} /></Link><div className="stitch-setups-feature__copy"><span>Featured Editorial</span><h2>{featuredSetup.title}</h2><p>{featuredSetup.summary}</p><Link className="stitch-link-button stitch-link-button--quiet" href={`/listings/${featuredSetup.slug}`}>Explore Collection</Link></div></div></section> : null}<section className="stitch-setups-filter-section"><div className="stitch-container"><div className="stitch-pill-row"><span>All Setups</span><span>Weddings</span><span>Corporate Summits</span><span>Intimate Dining</span><span>Lounges</span></div></div></section><section className="stitch-setups-grid-section"><div className="stitch-container">{setupCards.length ? <div className="stitch-setups-grid">{supportingSetups.map((setup, index) => <Link className={`stitch-setup-tile ${index === supportingSetups.length - 1 ? "stitch-setup-tile--wide" : ""}`} href={`/listings/${setup.slug}`} key={setup.slug}><span className="stitch-setup-tile__image"><img src={stitchImageSrc(setup.image)} alt={`${setup.title} event furniture setup`} /></span><span className="stitch-setup-tile__body"><strong>{setup.title}</strong><small>{setup.summary}</small><em>View Setup Details</em></span></Link>)}</div> : <StitchEmptyState title="No public setup records are available right now" message="Published setup directions will appear here once available. You can still send an enquiry with the event mood, furniture pieces, and setup context you have in mind." />}</div></section></>;
}

export function StitchDetail({ product, backHref, backLabel, setup = false, related = [] }: { product: PublicCatalogueProduct; backHref: string; backLabel: string; setup?: boolean; related?: Array<PublicCatalogueProduct | DemoProduct> }) {
  const image = product.primaryImage;
  const alt = textOrUndefined(image?.altText) ?? `${product.name} furniture rental setup`;
  const imgSrc = image?.publicUrl ?? stitchImageSrc(setup ? galaImage : fallbackProductImage(product));
  const fallbackRelated = setup ? getDemoProducts().slice(0, 4) : getDemoProducts().filter((item) => item.slug !== product.slug).slice(0, 3);
  const relatedItems = related.length ? related : fallbackRelated;
  return <><section className={setup ? "stitch-detail-page stitch-detail-page--setup" : "stitch-detail-page"}><div className="stitch-container">{setup ? <p className="stitch-detail-breadcrumb">Setups / {product.name}</p> : null}<div className="stitch-detail-open-grid"><div className="stitch-detail-open-media"><img alt={alt} src={imgSrc} /></div><div className="stitch-detail-open-copy"><Link className="stitch-back" href={backHref}>{setup ? "Setups" : productCategory(product)}</Link><h1>{product.name}</h1><p>{productSummary(product)}</p>{setup ? <div className="stitch-detail-context"><p className="stitch-eyebrow">Setup context</p><h2>Our team will prepare a custom proposal based on your event requirements.</h2></div> : <><p className="stitch-detail-safe-note">Bring event details. Add quantities and alternatives in the enquiry notes. Share setup, access, and timing notes. This request does not set aside furniture or finish rental details.</p><div className="stitch-detail-spec-card"><h2>Listing details</h2><dl><div><dt>Category</dt><dd>{productCategory(product)}</dd></div><div><dt>Rental unit</dt><dd>{product.rentalUnit}</dd></div><div><dt>Listing reference</dt><dd>{product.slug}</dd></div><div><dt>Review path</dt><dd>Manual proposal</dd></div></dl></div><div className="stitch-detail-quantity-row"><span>Quantity to share</span><span>Use enquiry notes</span></div></>}<div className="stitch-detail-actions"><Link className="stitch-detail-button stitch-detail-button--request" href="/quote">Request Quote</Link><Link className="stitch-detail-button stitch-detail-button--primary" href={getQuoteHrefForListing(product.slug)}>{setup ? "Request Quote for this Setup" : "Add to Quote"}</Link><Link className="stitch-detail-button stitch-detail-button--back" href={backHref}>{setup ? "Back to Setups" : "Back to Catalogue"}</Link></div></div></div>{setup ? <div className="stitch-setup-lower"><div><h2>{product.name}</h2><p>{productSummary(product)}</p><div className="stitch-detail-context"><p className="stitch-eyebrow">Setup context</p><h2>Our team will prepare a custom proposal based on your event requirements.</h2></div><Link className="stitch-detail-button stitch-detail-button--primary stitch-detail-button--compact" href={getQuoteHrefForListing(product.slug)}>Request Quote for this Setup</Link></div><section className="stitch-included-open"><h2>Included rental pieces</h2><div>{fallbackRelated.map((item, index) => <article key={item.id}><img alt={`${item.name} rental piece`} src={stitchImageSrc(fallbackProductImage(item))} /><div><strong>{item.name}</strong><small>Qty: {index === 0 ? "120" : index === 1 ? "15" : "6"}</small></div></article>)}</div></section></div> : null}</div></section>{!setup && relatedItems.length ? <section className="stitch-section stitch-detail-related"><div className="stitch-container"><div className="stitch-detail-related-heading"><div><h2>Complementary Pieces</h2><p>Curated pairings for {product.name}</p></div><Link href="/catalogue">See All</Link></div><div className="stitch-detail-related-grid">{relatedItems.map((item) => <Link className="stitch-detail-related-card" href={`/catalogue/${item.slug}`} key={item.id}><img alt={`${item.name} rental piece`} src={stitchImageSrc(fallbackProductImage(item))} /><strong>{item.name}</strong></Link>)}</div></div></section> : null}</>;
}

export function StitchAboutPage() {
  const principles = [["Form and function", "Rental pieces should support the room plan, not compete with it."], ["Material honesty", "Texture, proportion, and finish help each event setting feel considered."], ["Timelessness", "Simple silhouettes leave space for different venues, moods, and guest flows."]];
  const support = [["Brief review", "We review your event context and selected rental pieces."], ["Rental coordination", "We help align items, setups, and practical rental details."], ["Proposal follow-up", "We follow up with a tailored proposal and next steps."], ["Start an enquiry", "Share the pieces, date, venue context, and setup notes you have."]];
  return <><section className="stitch-about-hero"><div className="stitch-container"><p className="stitch-eyebrow">Our Ethos</p><h1>Curating spaces that breathe, inspire, and endure.</h1><p>Furniture is the quiet architecture of an event. SpaceKonceptRental helps visitors browse rental pieces and setup directions, then share event context for manual team review.</p></div></section><section className="stitch-section stitch-about-story"><div className="stitch-container stitch-about-story__grid"><div><p className="stitch-eyebrow">Our story</p><h2>Our Story</h2><p>Use public catalogue records and setup references to shape the enquiry. The team reviews submitted details before preparing a tailored proposal.</p><p>The website supports browsing and enquiry intake only; final rental details stay in direct team follow-up.</p></div><div className="stitch-about-story__image"><img src={aboutStoryImageUrl} alt="Curated lounge furniture setting" /></div></div></section><section className="stitch-section stitch-section--tonal stitch-about-principles"><div className="stitch-container"><div className="stitch-section-heading stitch-section-heading--center"><h2>Architecture-First Design</h2></div><div className="stitch-feature-grid">{principles.map(([title, text]) => <div className="stitch-about-card" key={title}><h3>{title}</h3><p>{text}</p></div>)}</div></div></section><section className="stitch-section stitch-about-service"><div className="stitch-container"><div className="stitch-section-heading"><p className="stitch-eyebrow">How We Help</p><h2>Service-led rental support</h2><p>A rental team focused on practical enquiry review and tailored proposal follow-up.</p></div><div className="stitch-feature-grid">{support.map(([title, text]) => <div className="stitch-about-card stitch-about-card--large" key={title}><h3>{title}</h3><p>{text}</p></div>)}</div></div></section><section className="stitch-section stitch-section--tonal"><div className="stitch-container stitch-cta-band"><h2>Ready to elevate your space?</h2><p>Explore the catalogue to find rental pieces that resonate with your vision.</p><StitchButton href="/catalogue">Browse Catalogue</StitchButton></div></section></>;
}

export function StitchContactPage() {
  return <><section className="stitch-contact-hero"><div className="stitch-container"><StitchPageIntro eyebrow="Contact" title="Get in Touch" intro="Share rental catalogue questions, setup context, or event notes through the enquiry path so the team can review the details and follow up." /></div></section><section className="stitch-section stitch-contact-section"><div className="stitch-container stitch-contact-grid"><aside className="stitch-contact-panel stitch-contact-copy"><h2>Contact Us</h2><p>Have a question about the rental catalogue or need a custom setup? Use the enquiry form path with the pieces, date, venue context, and notes you have.</p><div className="stitch-contact-support-card"><h2>Enquiry-led support</h2><p>Tell us about your event, rental needs, and preferred setup direction through the enquiry form.</p><div><strong>Manual review</strong><span>Our rental team reviews your selection and follows up with practical next steps.</span></div><Link href="/quote">Share event details</Link></div><dl><div><dt>Enquiry support</dt><dd>Use the enquiry form</dd></div><div><dt>Catalogue review</dt><dd>Share selected rental pieces</dd></div></dl></aside><form className="stitch-contact-form-panel" action="/quote" aria-label="Inquiry form preview" method="get"><h2><span className="stitch-contact-desktop-title">Inquiry Form</span><span className="stitch-contact-mobile-title">Send an Enquiry</span></h2><div className="stitch-contact-form-grid"><label className="stitch-contact-name-field"><span>First Name</span><input name="firstName" placeholder="First Name" type="text" /></label><label className="stitch-contact-desktop-field"><span>Last Name</span><input name="lastName" placeholder="Last Name" type="text" /></label><label><span>Email Address</span><input name="email" placeholder="Email Address" type="email" /></label><label className="stitch-contact-desktop-field"><span>Phone Number</span><input name="phone" placeholder="Phone Number (Optional)" type="tel" /></label></div><fieldset className="stitch-contact-select"><legend>Interest (optional)</legend><div className="stitch-contact-chip-row"><label><input name="interest" type="radio" value="catalogue" /><span>Catalogue</span></label><label><input name="interest" type="radio" value="setups" /><span>Setups</span></label><label><input name="interest" type="radio" value="rental-enquiry" /><span>Rental enquiry</span></label></div></fieldset><label className="stitch-contact-message"><span>Your Message</span><textarea name="message" placeholder="Your Message" rows={5} /></label><button className="stitch-link-button" type="submit">Send Message</button></form></div></section></>;
}
