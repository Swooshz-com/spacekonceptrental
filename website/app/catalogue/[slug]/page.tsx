import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import sofaImage from "../../../assets/images/product_sofa.png";
import { getPublicProductBySlug } from "../../../lib/catalogue/catalogue-repository";
import type { PublicCatalogueProduct } from "../../../lib/catalogue/types";

type ProductPageProps = {
  params?: Promise<{ slug?: string }> | { slug?: string };
};

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export function generateStaticParams() {
  return [{ slug: "lounge-sofa-package" }];
}

function getRentalDetails(product: PublicCatalogueProduct) {
  return [
    product.description ?? product.shortDescription,
    product.categoryName ? `Category: ${product.categoryName}` : undefined,
    `Rental unit: ${product.rentalUnit}`,
    "Final availability, delivery, and styling details are confirmed by the team."
  ].filter((detail): detail is string => Boolean(detail));
}

async function getSlug(params: ProductPageProps["params"]) {
  if (!params) {
    return "lounge-sofa-package";
  }

  const resolvedParams = await params;

  return resolvedParams.slug ?? "lounge-sofa-package";
}

export function ProductPageContent({
  product
}: {
  product: PublicCatalogueProduct;
}) {
  return (
    <section className="section">
      <div className="page-title">
        <p className="eyebrow">Furniture listing</p>
        <h1>{product.name}</h1>
        <p>{product.shortDescription ?? product.description}</p>
      </div>

      <div className="detail-layout">
        <div className="detail-visual">
          <Image
            alt={product.primaryImage?.altText ?? "Sample lounge sofa rental setup"}
            priority
            src={sofaImage}
          />
        </div>

        <article className="quote-panel">
          <h2>Rental details</h2>
          <ul className="detail-list">
            {getRentalDetails(product).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className="hero__actions">
            <Link className="button button--secondary" href="/catalogue">
              Back to catalogue
            </Link>
            <Link className="button" href="/quote">
              Start enquiry
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
