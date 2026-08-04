export type AdminProductOrderKey = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
};

function normalizedText(value: string) {
  return value.trim().toLocaleLowerCase("en-US");
}

function compareText(first: string, second: string) {
  const left = normalizedText(first);
  const right = normalizedText(second);

  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export function compareAdminProductOrder(
  first: AdminProductOrderKey,
  second: AdminProductOrderKey
) {
  const sortOrder = first.sortOrder - second.sortOrder;
  if (sortOrder !== 0) return sortOrder;

  const name = compareText(first.name, second.name);
  if (name !== 0) return name;

  const slug = compareText(first.slug, second.slug);
  if (slug !== 0) return slug;

  return compareText(first.id, second.id);
}
