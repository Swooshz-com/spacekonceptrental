export type HomepageHeroContentSource = "default" | "supabase";

export type HomepageHeroContent = {
  source: HomepageHeroContentSource;
  eyebrow: string;
  headline: string;
  body: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  imageUrl: string;
  imageAlt: string;
  isEnabled: boolean;
};

export type AdminHomepageHeroContent = HomepageHeroContent & {
  updatedAt?: string;
  updatedBy?: string;
};

export type HomepageHeroContentInput = Omit<HomepageHeroContent, "source">;

export type HomepageHeroImageInput = {
  imageUrl?: string;
  imageAlt: string;
  isEnabled: boolean;
};

export type HomepageHeroValidationError =
  | "eyebrow_invalid"
  | "headline_required"
  | "body_required"
  | "primary_cta_label_required"
  | "primary_cta_href_invalid"
  | "secondary_cta_label_required"
  | "secondary_cta_href_invalid"
  | "image_url_invalid"
  | "image_alt_required"
  | "is_enabled_invalid";

export type HomepageHeroValidationResult =
  | {
      ok: true;
      content: HomepageHeroContentInput;
    }
  | {
      ok: false;
      error: HomepageHeroValidationError;
    };

export type HomepageHeroImageValidationError =
  | "image_url_invalid"
  | "image_alt_required"
  | "is_enabled_invalid";

export type HomepageHeroImageValidationResult =
  | {
      ok: true;
      image: HomepageHeroImageInput;
    }
  | {
      ok: false;
      error: HomepageHeroImageValidationError;
    };

export type HomepageHeroRow = {
  eyebrow?: unknown;
  headline?: unknown;
  body?: unknown;
  primary_cta_label?: unknown;
  primary_cta_href?: unknown;
  secondary_cta_label?: unknown;
  secondary_cta_href?: unknown;
  image_url?: unknown;
  image_alt?: unknown;
  is_enabled?: unknown;
  updated_at?: unknown;
  updated_by?: unknown;
};

export type PublicHomepageHeroRow = Omit<
  HomepageHeroRow,
  "updated_at" | "updated_by"
>;

export const DEFAULT_HOMEPAGE_HERO_CONTENT: HomepageHeroContent = {
  source: "default",
  eyebrow: "Furniture and event rentals",
  headline: "Furnish Your Vision, Elevate Every Space",
  body: "Browse rental pieces, explore setup directions, and send an enquiry for manual team review.",
  primaryCtaLabel: "Request Quote",
  primaryCtaHref: "/quote",
  secondaryCtaLabel: "Browse Catalogue",
  secondaryCtaHref: "/catalogue",
  imageUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBMIAb-s3hFM7-rX6NqHe8HjNDVJ-VnaBLOlppG1oQtolnRXq__CGiW5eTsqbMyrs8ZVHafSQazQ5CU1RkOP6nNPfgWFrcyJk2H9T4u4S-EWRUUIb6F0l1vSCMvF62-NnKWfJCkrUGT8FV19LAyjqfjRNO9JuxEOz1O9tHH4CltNllxzsgL6FPoXzet1gGu4OBt4B0R5N5rlRfckyw_7uYkQJRpxq0C6VgsDFaKgDqQ_B2F-LEbezRSgIVzDRwO9irCS47fQkgQqMsb",
  imageAlt: "Styled rental furniture event setting",
  isEnabled: true
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  const normalized = text(value);

  return normalized ? normalized : undefined;
}

function bounded(value: string, maxLength: number) {
  return value.length > 0 && value.length <= maxLength;
}

function isSafeRelativePath(value: string) {
  return (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !value.includes("..") &&
    !/\s/.test(value)
  );
}

function isSafeHttpsUrl(value: string) {
  try {
    const parsed = new URL(value);

    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isSafeHref(value: string) {
  return (
    value.length <= 300 &&
    (isSafeRelativePath(value) || isSafeHttpsUrl(value))
  );
}

function isSafeImageUrl(value: string) {
  return (
    value.length <= 1_000 &&
    (isSafeRelativePath(value) || isSafeHttpsUrl(value))
  );
}

function rowText(row: HomepageHeroRow, key: keyof HomepageHeroRow) {
  return optionalText(row[key]);
}

export function validateHomepageHeroContentInput(
  input: Record<string, unknown>
): HomepageHeroValidationResult {
  const eyebrow = text(input.eyebrow);
  const headline = text(input.headline);
  const body = text(input.body);
  const primaryCtaLabel = text(input.primaryCtaLabel);
  const primaryCtaHref = text(input.primaryCtaHref);
  const secondaryCtaLabel = text(input.secondaryCtaLabel);
  const secondaryCtaHref = text(input.secondaryCtaHref);
  const imageUrl = text(input.imageUrl);
  const imageAlt = text(input.imageAlt);

  if (eyebrow.length > 120) {
    return { ok: false, error: "eyebrow_invalid" };
  }

  if (!bounded(headline, 160)) {
    return { ok: false, error: "headline_required" };
  }

  if (!bounded(body, 500)) {
    return { ok: false, error: "body_required" };
  }

  if (!bounded(primaryCtaLabel, 80)) {
    return { ok: false, error: "primary_cta_label_required" };
  }

  if (!isSafeHref(primaryCtaHref)) {
    return { ok: false, error: "primary_cta_href_invalid" };
  }

  if (!bounded(secondaryCtaLabel, 80)) {
    return { ok: false, error: "secondary_cta_label_required" };
  }

  if (!isSafeHref(secondaryCtaHref)) {
    return { ok: false, error: "secondary_cta_href_invalid" };
  }

  if (!isSafeImageUrl(imageUrl)) {
    return { ok: false, error: "image_url_invalid" };
  }

  if (!bounded(imageAlt, 240)) {
    return { ok: false, error: "image_alt_required" };
  }

  if (typeof input.isEnabled !== "boolean") {
    return { ok: false, error: "is_enabled_invalid" };
  }

  return {
    ok: true,
    content: {
      eyebrow,
      headline,
      body,
      primaryCtaLabel,
      primaryCtaHref,
      secondaryCtaLabel,
      secondaryCtaHref,
      imageUrl,
      imageAlt,
      isEnabled: input.isEnabled
    }
  };
}

export function validateHomepageHeroImageInput(
  input: Record<string, unknown>,
  options: {
    imageUrlRequired?: boolean;
  } = {}
): HomepageHeroImageValidationResult {
  const imageUrl = text(input.imageUrl);
  const imageAlt = text(input.imageAlt);
  const imageUrlRequired = options.imageUrlRequired ?? true;

  if ((imageUrlRequired || imageUrl) && !isSafeImageUrl(imageUrl)) {
    return { ok: false, error: "image_url_invalid" };
  }

  if (!bounded(imageAlt, 240)) {
    return { ok: false, error: "image_alt_required" };
  }

  if (typeof input.isEnabled !== "boolean") {
    return { ok: false, error: "is_enabled_invalid" };
  }

  return {
    ok: true,
    image: {
      ...(imageUrl ? { imageUrl } : {}),
      imageAlt,
      isEnabled: input.isEnabled
    }
  };
}

export function mapHomepageHeroRow(
  row: PublicHomepageHeroRow | null | undefined
): HomepageHeroContent | null {
  if (!row || row.is_enabled === false) {
    return null;
  }

  const validation = validateHomepageHeroImageInput({
    imageUrl: rowText(row, "image_url") ?? "",
    imageAlt: rowText(row, "image_alt") ?? "",
    isEnabled: true
  });

  if (!validation.ok) {
    return null;
  }

  return {
    ...DEFAULT_HOMEPAGE_HERO_CONTENT,
    source: "supabase",
    imageUrl: validation.image.imageUrl ?? DEFAULT_HOMEPAGE_HERO_CONTENT.imageUrl,
    imageAlt: validation.image.imageAlt,
    isEnabled: true
  };
}

export function mapAdminHomepageHeroRow(
  row: HomepageHeroRow | null | undefined
): AdminHomepageHeroContent | null {
  if (!row || typeof row.is_enabled !== "boolean") {
    return null;
  }

  const validation = validateHomepageHeroImageInput({
    imageUrl: rowText(row, "image_url") ?? "",
    imageAlt: rowText(row, "image_alt") ?? "",
    isEnabled: row.is_enabled
  });

  if (!validation.ok) {
    return null;
  }

  return {
    ...DEFAULT_HOMEPAGE_HERO_CONTENT,
    source: "supabase",
    imageUrl: validation.image.imageUrl ?? DEFAULT_HOMEPAGE_HERO_CONTENT.imageUrl,
    imageAlt: validation.image.imageAlt,
    isEnabled: validation.image.isEnabled,
    ...(typeof row.updated_at === "string" && row.updated_at.trim()
      ? { updatedAt: row.updated_at.trim() }
      : {}),
    ...(typeof row.updated_by === "string" && row.updated_by.trim()
      ? { updatedBy: row.updated_by.trim() }
      : {})
  };
}
