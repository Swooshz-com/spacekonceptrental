const publicListingSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const publicContextPattern = /^[a-z0-9][a-z0-9\s-]{0,79}$/;

export type QuoteDiscoveryContext = {
  category?: string;
  event?: string;
  search?: string;
};

export function normalizePublicListingSlug(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const slug = value.trim().toLowerCase();

  return publicListingSlugPattern.test(slug) ? slug : undefined;
}

export function normalizePublicDiscoveryContext(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase().replace(/\s+/g, " ");

  return publicContextPattern.test(normalized) ? normalized : undefined;
}

function addContextParam(
  params: URLSearchParams,
  key: keyof QuoteDiscoveryContext,
  value: string | undefined
) {
  const normalized = key === "search"
    ? normalizePublicDiscoveryContext(value)
    : normalizePublicListingSlug(value);

  if (normalized) {
    params.set(key, normalized);
  }
}

export function getQuoteHrefForListing(slug: string) {
  const listingSlug = normalizePublicListingSlug(slug);

  return listingSlug
    ? `/quote?listing=${encodeURIComponent(listingSlug)}`
    : "/quote";
}

export function getQuoteHrefForDiscoveryContext(context: QuoteDiscoveryContext) {
  const params = new URLSearchParams();

  addContextParam(params, "category", context.category);
  addContextParam(params, "event", context.event);
  addContextParam(params, "search", context.search);

  const query = params.toString();

  return query ? `/quote?${query}` : "/quote";
}
