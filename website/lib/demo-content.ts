import type {
  PublicCatalogue,
  PublicCatalogueCategory,
  PublicCatalogueProduct,
  PublicCatalogueImage
} from "./catalogue/types";

// Helper to create safe demo images
function createDemoImage(id: string, filename: string, alt: string): PublicCatalogueImage {
  return {
    id,
    storageBucket: "demo",
    storagePath: `skr-v3/${filename}`,
    publicUrl: `/demo/skr-v3/${filename}`,
    altText: alt,
    sortOrder: 0,
    isPrimary: true
  };
}

const categories: PublicCatalogueCategory[] = [
  {
    id: "demo-cat-seating",
    slug: "seating",
    name: "Seating",
    sortOrder: 1
  },
  {
    id: "demo-cat-tables",
    slug: "tables",
    name: "Tables",
    sortOrder: 2
  },
  {
    id: "demo-cat-counters",
    slug: "counters",
    name: "Counters & Plinths",
    sortOrder: 3
  },
  {
    id: "demo-cat-setups",
    slug: "setups",
    name: "Curated Setups",
    sortOrder: 4
  }
];

const demoProducts: PublicCatalogueProduct[] = [
  {
    id: "demo-lounge-chair",
    slug: "demo-lounge-chair",
    name: "Demo Lounge Chair",
    shortDescription: "Demo rental item for lounge, reception, and styling zones.",
    description: "Placeholder content used only when demo visual QA mode is enabled. This premium lounge chair brings warmth to any event space.",
    rentalUnit: "item",
    sortOrder: 1,
    categoryId: "demo-cat-seating",
    categoryName: "Seating",
    source: "fallback",
    images: [createDemoImage("img-chair", "demo-lounge-chair.png", "Warm editorial lounge chair")],
    primaryImage: createDemoImage("img-chair", "demo-lounge-chair.png", "Warm editorial lounge chair")
  },
  {
    id: "demo-cocktail-table",
    slug: "demo-cocktail-table",
    name: "Demo Cocktail Table",
    shortDescription: "Demo rental item for lounge, reception, and styling zones.",
    description: "Placeholder content used only when demo visual QA mode is enabled. A sleek, minimal cocktail table for receptions and standing events.",
    rentalUnit: "item",
    sortOrder: 2,
    categoryId: "demo-cat-tables",
    categoryName: "Tables",
    source: "fallback",
    images: [createDemoImage("img-cocktail-table", "demo-cocktail-table.png", "Editorial cocktail table")],
    primaryImage: createDemoImage("img-cocktail-table", "demo-cocktail-table.png", "Editorial cocktail table")
  },
  {
    id: "demo-reception-sofa",
    slug: "demo-reception-sofa",
    name: "Demo Reception Sofa",
    shortDescription: "Demo rental item for lounge, reception, and styling zones.",
    description: "Placeholder content used only when demo visual QA mode is enabled. Spacious and comfortable seating for key conversation areas.",
    rentalUnit: "item",
    sortOrder: 3,
    categoryId: "demo-cat-seating",
    categoryName: "Seating",
    source: "fallback",
    images: [createDemoImage("img-reception-sofa", "demo-reception-sofa.png", "Warm reception sofa")],
    primaryImage: createDemoImage("img-reception-sofa", "demo-reception-sofa.png", "Warm reception sofa")
  },
  {
    id: "demo-display-plinth",
    slug: "demo-display-plinth",
    name: "Demo Display Plinth",
    shortDescription: "Demo rental item for lounge, reception, and styling zones.",
    description: "Placeholder content used only when demo visual QA mode is enabled. Perfect for product launches or exhibition stands.",
    rentalUnit: "item",
    sortOrder: 4,
    categoryId: "demo-cat-counters",
    categoryName: "Counters & Plinths",
    source: "fallback",
    images: [createDemoImage("img-display-plinth", "demo-display-plinth.png", "Premium display plinth")],
    primaryImage: createDemoImage("img-display-plinth", "demo-display-plinth.png", "Premium display plinth")
  },
  {
    id: "demo-bar-counter",
    slug: "demo-bar-counter",
    name: "Demo Bar Counter",
    shortDescription: "Demo rental item for lounge, reception, and styling zones.",
    description: "Placeholder content used only when demo visual QA mode is enabled. A stylish modular bar unit for evening events.",
    rentalUnit: "item",
    sortOrder: 5,
    categoryId: "demo-cat-counters",
    categoryName: "Counters & Plinths",
    source: "fallback",
    images: [createDemoImage("img-bar-counter", "demo-bar-counter.png", "Event bar counter")],
    primaryImage: createDemoImage("img-bar-counter", "demo-bar-counter.png", "Event bar counter")
  },
  {
    id: "demo-accent-armchair",
    slug: "demo-accent-armchair",
    name: "Demo Accent Armchair",
    shortDescription: "Demo rental item for lounge, reception, and styling zones.",
    description: "Placeholder content used only when demo visual QA mode is enabled. Add a pop of character to your corporate seating.",
    rentalUnit: "item",
    sortOrder: 6,
    categoryId: "demo-cat-seating",
    categoryName: "Seating",
    source: "fallback",
    images: [createDemoImage("img-accent-armchair", "demo-accent-armchair.png", "Accent armchair")],
    primaryImage: createDemoImage("img-accent-armchair", "demo-accent-armchair.png", "Accent armchair")
  },
  {
    id: "demo-coffee-table",
    slug: "demo-coffee-table",
    name: "Demo Coffee Table",
    shortDescription: "Demo rental item for lounge, reception, and styling zones.",
    description: "Placeholder content used only when demo visual QA mode is enabled. Low table ideal for pairing with our lounge sofas.",
    rentalUnit: "item",
    sortOrder: 7,
    categoryId: "demo-cat-tables",
    categoryName: "Tables",
    source: "fallback",
    images: [createDemoImage("img-coffee-table", "demo-coffee-table.png", "Minimal coffee table")],
    primaryImage: createDemoImage("img-coffee-table", "demo-coffee-table.png", "Minimal coffee table")
  },
  {
    id: "demo-console-table",
    slug: "demo-console-table",
    name: "Demo Console Table",
    shortDescription: "Demo rental item for lounge, reception, and styling zones.",
    description: "Placeholder content used only when demo visual QA mode is enabled. Great for registration areas and room dividers.",
    rentalUnit: "item",
    sortOrder: 8,
    categoryId: "demo-cat-tables",
    categoryName: "Tables",
    source: "fallback",
    images: [createDemoImage("img-console-table", "demo-console-table.png", "Event console table")],
    primaryImage: createDemoImage("img-console-table", "demo-console-table.png", "Event console table")
  }
];

const demoSetups: PublicCatalogueProduct[] = [
  {
    id: "demo-wedding-lounge-setup",
    slug: "demo-wedding-lounge-setup",
    name: "Demo Wedding Lounge Setup",
    shortDescription: "Demo setup concept for visual QA of the Setups page layout.",
    description: "Placeholder content used only when demo visual QA mode is enabled. Curated specifically for elegant evening receptions.",
    rentalUnit: "setup",
    sortOrder: 1,
    categoryId: "demo-cat-setups",
    categoryName: "Curated Setup",
    source: "fallback",
    images: [createDemoImage("img-wedding-lounge", "demo-wedding-lounge-setup.png", "Wedding lounge setup")],
    primaryImage: createDemoImage("img-wedding-lounge", "demo-wedding-lounge-setup.png", "Wedding lounge setup")
  },
  {
    id: "demo-product-launch-setup",
    slug: "demo-product-launch-setup",
    name: "Demo Product Launch Setup",
    shortDescription: "Demo setup concept for visual QA of the Setups page layout.",
    description: "Placeholder content used only when demo visual QA mode is enabled. Highlight your new product with this clean, focused arrangement.",
    rentalUnit: "setup",
    sortOrder: 2,
    categoryId: "demo-cat-setups",
    categoryName: "Curated Setup",
    source: "fallback",
    images: [createDemoImage("img-product-launch", "demo-product-launch-setup.png", "Product launch setup")],
    primaryImage: createDemoImage("img-product-launch", "demo-product-launch-setup.png", "Product launch setup")
  },
  {
    id: "demo-exhibition-counter-setup",
    slug: "demo-exhibition-counter-setup",
    name: "Demo Exhibition Counter Setup",
    shortDescription: "Demo setup concept for visual QA of the Setups page layout.",
    description: "Placeholder content used only when demo visual QA mode is enabled. Everything you need for an engaging tradeshow booth.",
    rentalUnit: "setup",
    sortOrder: 3,
    categoryId: "demo-cat-setups",
    categoryName: "Curated Setup",
    source: "fallback",
    images: [createDemoImage("img-exhibition-counter", "demo-exhibition-counter-setup.png", "Exhibition setup")],
    primaryImage: createDemoImage("img-exhibition-counter", "demo-exhibition-counter-setup.png", "Exhibition setup")
  },
  {
    id: "demo-corporate-lounge-setup",
    slug: "demo-corporate-lounge-setup",
    name: "Demo Corporate Lounge Setup",
    shortDescription: "Demo setup concept for visual QA of the Setups page layout.",
    description: "Placeholder content used only when demo visual QA mode is enabled. Professional networking environment for key stakeholders.",
    rentalUnit: "setup",
    sortOrder: 4,
    categoryId: "demo-cat-setups",
    categoryName: "Curated Setup",
    source: "fallback",
    images: [createDemoImage("img-corporate-lounge", "demo-corporate-lounge-setup.png", "Corporate lounge setup")],
    primaryImage: createDemoImage("img-corporate-lounge", "demo-corporate-lounge-setup.png", "Corporate lounge setup")
  }
];

export function getDemoCatalogue(): PublicCatalogue {
  return {
    source: "fallback",
    categories,
    products: [...demoProducts, ...demoSetups]
  };
}

export function getDemoProductBySlug(slug: string): PublicCatalogueProduct | null {
  const catalogue = getDemoCatalogue();
  return catalogue.products.find(p => p.slug === slug) ?? null;
}
