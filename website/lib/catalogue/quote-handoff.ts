const publicListingSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizePublicListingSlug(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const slug = value.trim().toLowerCase();

  return publicListingSlugPattern.test(slug) ? slug : undefined;
}

export function getQuoteHrefForListing(slug: string) {
  const listingSlug = normalizePublicListingSlug(slug);

  return listingSlug
    ? `/quote?listing=${encodeURIComponent(listingSlug)}`
    : "/quote";
}
