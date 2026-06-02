import Image from "next/image";
import Link from "next/link";
import chairImage from "../../assets/images/product_chair.png";
import sofaImage from "../../assets/images/product_sofa.png";
import corporateImage from "../../assets/images/event_corporate.png";
import { getPublicCatalogue } from "../../lib/catalogue/catalogue-repository";
import type { PublicCatalogueProduct, PublicCatalogue } from "../../lib/catalogue/types";

export const dynamic = "force-dynamic";

function getProductImage(product: PublicCatalogueProduct) {
  const slug = product.slug.toLowerCase();
  const categoryName = product.categoryName?.toLowerCase() ?? "";

  if (slug.includes("chair") || categoryName.includes("seating")) {
    return chairImage;
  }

  if (
    slug.includes("table") ||
    slug.includes("corporate") ||
    slug.includes("garden") ||
    categoryName.includes("event")
  ) {
    return corporateImage;
  }

  return sofaImage;
}

export function CataloguePageContent({
  catalogue
}: {
  catalogue: PublicCatalogue;
}) {
  return (
    <section className="section">
      <div className="page-title">
        <h1>Catalogue</h1>
        <p>
          Browse starter categories for event furniture, lounge layouts, and
          corporate rental setups.
        </p>
      </div>

      <div className="catalogue-grid">
        {catalogue.products.map((product) => (
          <article className="catalogue-card" key={product.slug}>
            <div className="catalogue-card__image">
              <Image
                alt={product.primaryImage?.altText ?? ""}
                src={getProductImage(product)}
              />
            </div>
            <div className="catalogue-card__body">
              <h2>{product.name}</h2>
              <p>{product.shortDescription ?? product.description}</p>
              {product.categoryName ? <p>{product.categoryName}</p> : null}
              <Link className="card-link" href={`/catalogue/${product.slug}`}>
                View listing shell
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="hero__actions">
        <Link className="button" href="/quote">
          Start quote
        </Link>
      </div>
    </section>
  );
}

export default async function CataloguePage() {
  const catalogue = await getPublicCatalogue();

  return <CataloguePageContent catalogue={catalogue} />;
}
