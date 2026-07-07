export const ABOUT_STORY_MEDIA_SLOT = "about.story" as const;

export const publicPageMediaSlots = [ABOUT_STORY_MEDIA_SLOT] as const;

export type PublicPageMediaSlot = (typeof publicPageMediaSlots)[number];

export type PublicPageMediaSource = "default" | "supabase";

export type PublicPageMediaContent = {
  source: PublicPageMediaSource;
  slot: PublicPageMediaSlot;
  imageUrl: string;
  imageAlt: string;
  isEnabled: boolean;
};

export type AdminPublicPageMediaContent = PublicPageMediaContent & {
  updatedAt?: string;
  updatedBy?: string;
};

export type PublicPageMediaInput = Omit<PublicPageMediaContent, "source">;

export type PublicPageMediaValidationError =
  | "slot_invalid"
  | "image_url_invalid"
  | "image_alt_required"
  | "is_enabled_invalid";

export type PublicPageMediaValidationResult =
  | {
      ok: true;
      content: PublicPageMediaInput;
    }
  | {
      ok: false;
      error: PublicPageMediaValidationError;
    };

export type PublicPageMediaRow = {
  slot?: unknown;
  image_url?: unknown;
  image_alt?: unknown;
  is_enabled?: unknown;
  updated_at?: unknown;
  updated_by?: unknown;
};

export const DEFAULT_PUBLIC_PAGE_MEDIA: Record<
  PublicPageMediaSlot,
  PublicPageMediaContent
> = {
  [ABOUT_STORY_MEDIA_SLOT]: {
    source: "default",
    slot: ABOUT_STORY_MEDIA_SLOT,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCVRiKMpVS17P0POe4hgYLWJOqLZWHNBK0YGHw-bG4ETu7eWNw2o_RDNmsHhEgmEAfc1nWGlfVYJswBZRdLxn0pVc44lfcblgiNEyuHfr4APLO9MARpxHtb8kRWvMV7otaSDpU_tfoAPYGYbCMtj9DUnC49_anMv7E80cfYVCCK_uheLjc8ZiIEccgZUgjO8H3dhTXXY_cBGYInmYRilsvWVY_akz3twXUoGZotZr6SB4yHpefF4EcE8HJb4gp8pwrC_XR3IlH3bkkl",
    imageAlt: "Curated lounge furniture setting",
    isEnabled: true
  }
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

function isSafeImageUrl(value: string) {
  return (
    value.length <= 1_000 &&
    (isSafeRelativePath(value) || isSafeHttpsUrl(value))
  );
}

function rowText(row: PublicPageMediaRow, key: keyof PublicPageMediaRow) {
  return optionalText(row[key]);
}

export function isPublicPageMediaSlot(
  value: unknown
): value is PublicPageMediaSlot {
  return (
    typeof value === "string" &&
    publicPageMediaSlots.includes(value.trim() as PublicPageMediaSlot)
  );
}

export function defaultPublicPageMediaForSlot(slot: PublicPageMediaSlot) {
  return DEFAULT_PUBLIC_PAGE_MEDIA[slot];
}

export function validatePublicPageMediaInput(
  input: Record<string, unknown>
): PublicPageMediaValidationResult {
  const slot = text(input.slot);
  const imageUrl = text(input.imageUrl);
  const imageAlt = text(input.imageAlt);

  if (!isPublicPageMediaSlot(slot)) {
    return { ok: false, error: "slot_invalid" };
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
      slot,
      imageUrl,
      imageAlt,
      isEnabled: input.isEnabled
    }
  };
}

export function mapPublicPageMediaRow(
  row: PublicPageMediaRow | null | undefined
): PublicPageMediaContent | null {
  if (!row || row.is_enabled === false) {
    return null;
  }

  const validation = validatePublicPageMediaInput({
    slot: rowText(row, "slot") ?? "",
    imageUrl: rowText(row, "image_url") ?? "",
    imageAlt: rowText(row, "image_alt") ?? "",
    isEnabled: true
  });

  if (!validation.ok) {
    return null;
  }

  return {
    source: "supabase",
    ...validation.content
  };
}

export function mapAdminPublicPageMediaRow(
  row: PublicPageMediaRow | null | undefined
): AdminPublicPageMediaContent | null {
  if (!row || typeof row.is_enabled !== "boolean") {
    return null;
  }

  const validation = validatePublicPageMediaInput({
    slot: rowText(row, "slot") ?? "",
    imageUrl: rowText(row, "image_url") ?? "",
    imageAlt: rowText(row, "image_alt") ?? "",
    isEnabled: row.is_enabled
  });

  if (!validation.ok) {
    return null;
  }

  return {
    source: "supabase",
    ...validation.content,
    ...(rowText(row, "updated_at")
      ? { updatedAt: rowText(row, "updated_at") }
      : {}),
    ...(rowText(row, "updated_by")
      ? { updatedBy: rowText(row, "updated_by") }
      : {})
  };
}
