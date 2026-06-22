import type { PublicCatalogue, PublicCatalogueProduct } from "./types";

type DemoCatalogueKind = "individual" | "setups";

const demoIndividualCatalogue: PublicCatalogue = {
  source: "fallback",
  categories: [
    {
      id: "demo-category-seating",
      slug: "seating",
      name: "Seating",
      description: "Editorial seating pieces for lounges and guest areas.",
      sortOrder: 10
    },
    {
      id: "demo-category-lighting",
      slug: "lighting",
      name: "Lighting",
      description: "Warm accents for event atmosphere.",
      sortOrder: 20
    },
    {
      id: "demo-category-surfaces",
      slug: "surfaces",
      name: "Surfaces",
      description: "Tables and plinths for practical event layouts.",
      sortOrder: 30
    }
  ],
  products: [
    {
      id: "demo-arc-sectional",
      slug: "arc-sectional",
      name: "The Arc Sectional",
      shortDescription:
        "A sculptural linen sofa for arrival lounges, brand moments, and calm guest pauses.",
      description:
        "Use this as a visual starting point for a reception lounge or quiet VIP corner.",
      rentalUnit: "piece",
      sortOrder: 10,
      categoryId: "demo-category-seating",
      categoryName: "Seating",
      source: "fallback"
    },
    {
      id: "demo-terracotta-pleat-lamp",
      slug: "terracotta-pleat-lamp",
      name: "Terracotta Pleat Lamp",
      shortDescription:
        "A warm ceramic accent lamp for styled counters, lounges, and display corners.",
      rentalUnit: "piece",
      sortOrder: 20,
      categoryId: "demo-category-lighting",
      categoryName: "Lighting",
      source: "fallback"
    },
    {
      id: "demo-monolith-low-table",
      slug: "monolith-low-table",
      name: "Monolith Low Table",
      shortDescription:
        "A low stone-inspired table that anchors soft seating and curated conversation areas.",
      rentalUnit: "piece",
      sortOrder: 30,
      categoryId: "demo-category-surfaces",
      categoryName: "Surfaces",
      source: "fallback"
    },
    {
      id: "demo-weave-lounge-chair",
      slug: "weave-lounge-chair",
      name: "Weave Lounge Chair",
      shortDescription:
        "A crafted lounge chair for tactile, gallery-like event corners.",
      rentalUnit: "piece",
      sortOrder: 40,
      categoryId: "demo-category-seating",
      categoryName: "Seating",
      source: "fallback"
    },
    {
      id: "demo-heritage-dining-table",
      slug: "heritage-dining-table",
      name: "Heritage Dining Table",
      shortDescription:
        "A generous timber table for seated programmes, editorial displays, and hospitality moments.",
      rentalUnit: "piece",
      sortOrder: 50,
      categoryId: "demo-category-surfaces",
      categoryName: "Surfaces",
      source: "fallback"
    }
  ]
};

const demoSetupsCatalogue: PublicCatalogue = {
  source: "fallback",
  categories: [
    {
      id: "demo-category-lounge-setups",
      slug: "lounge-setups",
      name: "Lounge setups",
      description: "Styled lounge compositions for guest flow.",
      sortOrder: 10
    },
    {
      id: "demo-category-showcase-setups",
      slug: "showcase-setups",
      name: "Showcase setups",
      description: "Furniture groupings for brand and display moments.",
      sortOrder: 20
    },
    {
      id: "demo-category-dining-setups",
      slug: "dining-setups",
      name: "Dining setups",
      description: "Tablescapes and grouped seating concepts.",
      sortOrder: 30
    }
  ],
  products: [
    {
      id: "demo-earth-air-suite",
      slug: "earth-air-suite",
      name: "The Earth and Air Suite",
      shortDescription:
        "A calm lounge composition with linen seating, low tables, and warm material contrast.",
      description:
        "A frontend-only demo setup for local visual review when demo content is enabled.",
      rentalUnit: "setup",
      sortOrder: 10,
      categoryId: "demo-category-lounge-setups",
      categoryName: "Lounge setups",
      source: "fallback"
    },
    {
      id: "demo-minimalist-showcase",
      slug: "minimalist-showcase",
      name: "Minimalist Showcase",
      shortDescription:
        "Plinths, quiet seating, and neutral surfaces for product or gallery-style moments.",
      rentalUnit: "setup",
      sortOrder: 20,
      categoryId: "demo-category-showcase-setups",
      categoryName: "Showcase setups",
      source: "fallback"
    },
    {
      id: "demo-focus-assembly",
      slug: "focus-assembly",
      name: "The Focus Assembly",
      shortDescription:
        "A considered table-and-chair setting for conversations, workshops, or hospitality.",
      rentalUnit: "setup",
      sortOrder: 30,
      categoryId: "demo-category-showcase-setups",
      categoryName: "Showcase setups",
      source: "fallback"
    },
    {
      id: "demo-tactile-banquet",
      slug: "tactile-banquet",
      name: "The Tactile Banquet",
      shortDescription:
        "A layered table composition with sculptural accents and practical guest spacing.",
      rentalUnit: "setup",
      sortOrder: 40,
      categoryId: "demo-category-dining-setups",
      categoryName: "Dining setups",
      source: "fallback"
    }
  ]
};

export function isDemoPublicContentEnabled() {
  return process.env.NEXT_PUBLIC_SKR_DEMO_CONTENT === "true";
}

export function withDemoPublicCatalogue(
  catalogue: PublicCatalogue,
  kind: DemoCatalogueKind
) {
  if (catalogue.products.length > 0 || !isDemoPublicContentEnabled()) {
    return catalogue;
  }

  return kind === "setups" ? demoSetupsCatalogue : demoIndividualCatalogue;
}

export function getDemoPublicProductBySlug(
  slug: string,
  kind?: DemoCatalogueKind
): PublicCatalogueProduct | null {
  if (!isDemoPublicContentEnabled()) {
    return null;
  }

  const catalogues =
    kind === "setups"
      ? [demoSetupsCatalogue]
      : kind === "individual"
        ? [demoIndividualCatalogue]
        : [demoIndividualCatalogue, demoSetupsCatalogue];

  for (const catalogue of catalogues) {
    const product = catalogue.products.find((item) => item.slug === slug);
    if (product) {
      return product;
    }
  }

  return null;
}
