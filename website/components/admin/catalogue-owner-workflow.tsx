"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";

import styles from "./catalogue-owner-workflow.module.css";

export type CatalogueOwnerCategory = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  sortOrder: number;
  isPublished: boolean;
  productCount: number;
  publishedProductCount?: number;
};

export type CatalogueOwnerProduct = {
  id: string;
  categoryId?: string;
  slug: string;
  name: string;
  shortDescription?: string;
  description?: string;
  rentalUnit: string;
  status: "draft" | "published" | "archived";
  sortOrder: number;
  imageCount: number;
  primaryImageAltText?: string;
};

export type CatalogueOwnerImage = {
  id: string;
  productId: string;
  storageBucket: string;
  storagePath: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
  status: "active" | "archived";
};

type CatalogueOwnerWorkflowProps = {
  categories: CatalogueOwnerCategory[];
  products: CatalogueOwnerProduct[];
  images: CatalogueOwnerImage[];
  advancedCategoryPanel?: ReactNode;
  fetcher?: typeof fetch;
  onMutationComplete?: () => void | Promise<void>;
};

type PanelStatus =
  | {
      kind: "idle";
    }
  | {
      kind: "pending";
      message: string;
    }
  | {
      kind: "success";
      message: string;
    }
  | {
      kind: "error";
      message: string;
    };

type ProductPayload = {
  categoryId?: string;
  slug?: string;
  name?: string;
  shortDescription?: string;
  description?: string;
  rentalUnit?: string;
  status?: CatalogueOwnerProduct["status"];
  sortOrder?: number;
};

type ImagePayload = {
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
};

const createSelection = "__new_catalogue_item__";
const productWriteOperation = "product.write";
const productImageWriteOperation = "productImage.write";
const genericProductFailure =
  "Protected admin save could not be completed. Check catalogue item fields and public status before retrying.";
const genericImageFailure =
  "Protected admin image save could not be completed. Check selected item, file type, image alt text, primary image, and display position before retrying.";

function reloadDashboard() {
  if (typeof window !== "undefined") {
    window.location.reload();
  }
}

function formValue(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function hasText(value?: string) {
  return Boolean(value?.trim());
}

function parseOptionalSortOrder(value: string) {
  if (!value) {
    return {
      ok: true as const,
    };
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 1_000_000) {
    return {
      ok: false as const,
    };
  }

  return {
    ok: true as const,
    sortOrder: parsed,
  };
}

function parseProductStatus(
  value: string,
): CatalogueOwnerProduct["status"] | null {
  return value === "draft" || value === "published" || value === "archived"
    ? value
    : null;
}

async function readSafeJson(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function requestWriteProof(
  fetcher: typeof fetch,
  operation: typeof productWriteOperation | typeof productImageWriteOperation,
) {
  const response = await fetcher("/api/admin/csrf-proof", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requestedOperation: operation,
      operation,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const body = await readSafeJson(response);

  if (
    !isRecord(body) ||
    body.ok !== true ||
    typeof body.csrfProof !== "string" ||
    !body.csrfProof.trim()
  ) {
    return null;
  }

  return body.csrfProof;
}

function slugFromName(name: string) {
  const normalized = name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  const candidate =
    normalized.length >= 3 ? normalized : `${normalized || "catalogue"}-item`;
  const trimmed = candidate.slice(0, 100).replace(/^-+|-+$/g, "");

  return trimmed.length >= 3 ? trimmed : "catalogue-item";
}

function categoryLabel(
  product: CatalogueOwnerProduct,
  categoryById: Map<string, CatalogueOwnerCategory>,
) {
  return product.categoryId
    ? categoryById.get(product.categoryId)?.name ?? "Unassigned category"
    : "Unassigned category";
}

function statusLabel(status: CatalogueOwnerProduct["status"]) {
  if (status === "published") {
    return "Published";
  }

  if (status === "archived") {
    return "Hidden";
  }

  return "Draft";
}

function statusClass(status: CatalogueOwnerProduct["status"]) {
  if (status === "published") {
    return styles.statusPublished;
  }

  if (status === "archived") {
    return styles.statusArchived;
  }

  return styles.statusDraft;
}

function imageAttention(
  product: CatalogueOwnerProduct,
  images: CatalogueOwnerImage[],
) {
  const productImages = images.filter((image) => image.productId === product.id);
  const activeImages = productImages.filter((image) => image.status === "active");
  const activePrimary = activeImages.find((image) => image.isPrimary);
  const activeMissingAlt = activeImages.filter((image) => !hasText(image.altText));

  if (activeImages.length === 0 && product.imageCount === 0) {
    return {
      label: "Missing image",
      detail: "Add image",
      attention: true,
    };
  }

  if (!activePrimary || !hasText(activePrimary.altText)) {
    return {
      label: "Primary image needs text",
      detail: "Review alt text",
      attention: true,
    };
  }

  if (activeMissingAlt.length > 0) {
    return {
      label: "Alt text needed",
      detail: `${activeMissingAlt.length} image${activeMissingAlt.length === 1 ? "" : "s"}`,
      attention: true,
    };
  }

  return {
    label: "Image ready",
    detail: `${activeImages.length} image${activeImages.length === 1 ? "" : "s"}`,
    attention: false,
  };
}

function imageDisplayName(image: CatalogueOwnerImage, index: number) {
  if (image.isPrimary) {
    return "Primary image";
  }

  return `Image ${index + 1}`;
}

function buildProductPayload(formData: FormData, isCreate: boolean) {
  const sortOrder = parseOptionalSortOrder(formValue(formData, "sortOrder"));

  if (!sortOrder.ok) {
    return null;
  }

  const name = formValue(formData, "name");
  const status = parseProductStatus(formValue(formData, "status"));
  const categoryId = formValue(formData, "categoryId");
  const shortDescription = formValue(formData, "shortDescription");
  const description = formValue(formData, "description");
  const rentalUnit = formValue(formData, "rentalUnit");

  if (!name || !status || !rentalUnit) {
    return null;
  }

  return {
    ...(categoryId ? { categoryId } : {}),
    ...(isCreate ? { slug: slugFromName(name) } : {}),
    name,
    ...(shortDescription ? { shortDescription } : {}),
    ...(description ? { description } : {}),
    rentalUnit,
    status,
    ...(sortOrder.sortOrder !== undefined
      ? { sortOrder: sortOrder.sortOrder }
      : {}),
  } satisfies ProductPayload;
}

function buildImagePayload(form: HTMLFormElement, formData: FormData) {
  const sortOrder = parseOptionalSortOrder(formValue(formData, "sortOrder"));
  const isPrimaryInput = form.elements.namedItem("isPrimary");

  if (!sortOrder.ok) {
    return null;
  }

  return {
    altText: formValue(formData, "altText"),
    ...(sortOrder.sortOrder !== undefined
      ? { sortOrder: sortOrder.sortOrder }
      : {}),
    isPrimary:
      isPrimaryInput instanceof HTMLInputElement
        ? isPrimaryInput.checked
        : false,
  } satisfies ImagePayload;
}

function StatusMessage({ status }: { status: PanelStatus }) {
  if (status.kind === "idle") {
    return null;
  }

  const statusClassName =
    status.kind === "success"
      ? styles.statusMessageSuccess
      : status.kind === "error"
        ? styles.statusMessageError
        : styles.statusMessagePending;

  return (
    <div
      className={`${styles.statusMessage} ${statusClassName}`}
      aria-live="polite"
    >
      {status.message}
    </div>
  );
}

export function CatalogueOwnerWorkflow({
  advancedCategoryPanel,
  categories,
  fetcher = fetch,
  images,
  onMutationComplete = reloadDashboard,
  products,
}: CatalogueOwnerWorkflowProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProductId, setSelectedProductId] = useState(
    products[0]?.id ?? createSelection,
  );
  const [productStatus, setProductStatus] = useState<PanelStatus>({
    kind: "idle",
  });
  const [imageStatus, setImageStatus] = useState<PanelStatus>({
    kind: "idle",
  });

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((first, second) =>
        first.name.localeCompare(second.name),
      ),
    [categories],
  );
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  const selectedProduct = products.find(
    (product) => product.id === selectedProductId,
  );
  const isCreating = selectedProductId === createSelection || !selectedProduct;
  const selectedImages = selectedProduct
    ? images
        .filter((image) => image.productId === selectedProduct.id)
        .sort((first, second) =>
          first.sortOrder === second.sortOrder
            ? first.id.localeCompare(second.id)
            : first.sortOrder - second.sortOrder,
        )
    : [];
  const filteredProducts = products.filter((product) => {
    const matchesQuery = product.name
      .toLowerCase()
      .includes(query.trim().toLowerCase());
    const matchesStatus =
      statusFilter === "all" || product.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" ||
      (categoryFilter === "uncategorized" && !product.categoryId) ||
      product.categoryId === categoryFilter;

    return matchesQuery && matchesStatus && matchesCategory;
  });
  const published = products.filter(
    (product) => product.status === "published",
  ).length;
  const draft = products.filter((product) => product.status === "draft").length;
  const hidden = products.filter(
    (product) => product.status === "archived",
  ).length;
  const itemsNeedingImages = products.filter((product) => {
    const attention = imageAttention(product, images);

    return attention.attention;
  }).length;

  async function submitProductMutation(
    endpoint: string,
    payload: ProductPayload,
    successMessage: string,
  ) {
    setProductStatus({
      kind: "pending",
      message: "Protected admin save is checking catalogue item details...",
    });

    try {
      const csrfProof = await requestWriteProof(fetcher, productWriteOperation);

      if (!csrfProof) {
        setProductStatus({
          kind: "error",
          message: genericProductFailure,
        });
        return;
      }

      const response = await fetcher(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-proof": csrfProof,
        },
        body: JSON.stringify(payload),
      });
      const responseBody = await readSafeJson(response);

      if (!response.ok || !isRecord(responseBody) || responseBody.ok !== true) {
        setProductStatus({
          kind: "error",
          message: genericProductFailure,
        });
        return;
      }

      setProductStatus({
        kind: "success",
        message: successMessage,
      });

      await onMutationComplete();
    } catch {
      setProductStatus({
        kind: "error",
        message: genericProductFailure,
      });
    }
  }

  async function handleProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const payload = buildProductPayload(formData, isCreating);

    if (!payload) {
      setProductStatus({
        kind: "error",
        message: genericProductFailure,
      });
      return;
    }

    if (!isCreating && !selectedProduct) {
      setProductStatus({
        kind: "error",
        message: genericProductFailure,
      });
      return;
    }

    const endpoint = isCreating
      ? "/api/admin/products"
      : `/api/admin/products/${encodeURIComponent(selectedProduct.id)}`;

    await submitProductMutation(
      endpoint,
      payload,
      "Catalogue item saved for protected admin review. Refreshing dashboard.",
    );
  }

  async function handleImageUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProduct) {
      setImageStatus({
        kind: "error",
        message: genericImageFailure,
      });
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const imageFile = formData.get("imageFile");
    const sortOrder = parseOptionalSortOrder(formValue(formData, "sortOrder"));
    const isPrimaryInput = form.elements.namedItem("isPrimary");

    if (!(imageFile instanceof File) || !sortOrder.ok) {
      setImageStatus({
        kind: "error",
        message: genericImageFailure,
      });
      return;
    }

    setImageStatus({
      kind: "pending",
      message: "Protected admin upload is checking catalogue item image...",
    });

    try {
      const csrfProof = await requestWriteProof(
        fetcher,
        productImageWriteOperation,
      );

      if (!csrfProof) {
        setImageStatus({
          kind: "error",
          message: genericImageFailure,
        });
        return;
      }

      const uploadBody = new FormData();
      uploadBody.set("productId", selectedProduct.id);
      uploadBody.set("imageFile", imageFile);

      const altText = formValue(formData, "altText");

      if (altText) {
        uploadBody.set("altText", altText);
      }

      if (sortOrder.sortOrder !== undefined) {
        uploadBody.set("sortOrder", String(sortOrder.sortOrder));
      }

      if (
        isPrimaryInput instanceof HTMLInputElement &&
        isPrimaryInput.checked
      ) {
        uploadBody.set("isPrimary", "true");
      }

      const response = await fetcher("/api/admin/product-images", {
        method: "POST",
        headers: {
          "x-csrf-proof": csrfProof,
        },
        body: uploadBody,
      });
      const responseBody = await readSafeJson(response);

      if (!response.ok || !isRecord(responseBody) || responseBody.ok !== true) {
        setImageStatus({
          kind: "error",
          message: genericImageFailure,
        });
        return;
      }

      setImageStatus({
        kind: "success",
        message:
          "Catalogue item image saved for protected admin review. Refreshing dashboard.",
      });

      await onMutationComplete();
    } catch {
      setImageStatus({
        kind: "error",
        message: genericImageFailure,
      });
    }
  }

  async function handleImageMetadataSubmit(
    event: FormEvent<HTMLFormElement>,
    image: CatalogueOwnerImage,
  ) {
    event.preventDefault();

    const payload = buildImagePayload(
      event.currentTarget,
      new FormData(event.currentTarget),
    );

    if (!payload) {
      setImageStatus({
        kind: "error",
        message: genericImageFailure,
      });
      return;
    }

    setImageStatus({
      kind: "pending",
      message: "Protected admin save is checking image alt text...",
    });

    try {
      const csrfProof = await requestWriteProof(
        fetcher,
        productImageWriteOperation,
      );

      if (!csrfProof) {
        setImageStatus({
          kind: "error",
          message: genericImageFailure,
        });
        return;
      }

      const response = await fetcher(
        `/api/admin/product-images/${encodeURIComponent(image.id)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-proof": csrfProof,
          },
          body: JSON.stringify(payload),
        },
      );
      const responseBody = await readSafeJson(response);

      if (!response.ok || !isRecord(responseBody) || responseBody.ok !== true) {
        setImageStatus({
          kind: "error",
          message: genericImageFailure,
        });
        return;
      }

      setImageStatus({
        kind: "success",
        message:
          "Image alt text and primary image details saved for protected admin review. Refreshing dashboard.",
      });

      await onMutationComplete();
    } catch {
      setImageStatus({
        kind: "error",
        message: genericImageFailure,
      });
    }
  }

  async function handleImageArchive(image: CatalogueOwnerImage) {
    setImageStatus({
      kind: "pending",
      message: "Protected admin archive is checking image status...",
    });

    try {
      const csrfProof = await requestWriteProof(
        fetcher,
        productImageWriteOperation,
      );

      if (!csrfProof) {
        setImageStatus({
          kind: "error",
          message: genericImageFailure,
        });
        return;
      }

      const response = await fetcher(
        `/api/admin/product-images/${encodeURIComponent(image.id)}/archive`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-proof": csrfProof,
          },
          body: JSON.stringify({}),
        },
      );
      const responseBody = await readSafeJson(response);

      if (!response.ok || !isRecord(responseBody) || responseBody.ok !== true) {
        setImageStatus({
          kind: "error",
          message: genericImageFailure,
        });
        return;
      }

      setImageStatus({
        kind: "success",
        message:
          "Image archive state saved for protected admin review. Refreshing dashboard.",
      });

      await onMutationComplete();
    } catch {
      setImageStatus({
        kind: "error",
        message: genericImageFailure,
      });
    }
  }

  return (
    <section
      className={styles.workflow}
      aria-label="Catalogue owner workflow"
    >
      <div className={styles.toolbar}>
        <div className={styles.toolbarCopy}>
          <h2>Catalogue</h2>
          <p>Manage rental catalogue items shown on the public site.</p>
        </div>
        <div className={styles.toolbarActions}>
          <button
            className={styles.primaryAction}
            onClick={() => setSelectedProductId(createSelection)}
            type="button"
          >
            Add catalogue item
          </button>
          <a className={styles.secondaryAction} href="/catalogue">
            View public catalogue
          </a>
        </div>
      </div>

      <section className={styles.summaryGrid} aria-label="Catalogue overview">
        <dl className={styles.summaryCard}>
          <dt>Catalogue items</dt>
          <dd>{products.length}</dd>
          <p>Rental items currently in protected catalogue management.</p>
        </dl>
        <dl className={styles.summaryCard}>
          <dt>Published</dt>
          <dd>{published}</dd>
          <p>Items visible on the public catalogue when public reads include them.</p>
        </dl>
        <dl className={styles.summaryCard}>
          <dt>Draft</dt>
          <dd>{draft}</dd>
          <p>Items still protected while copy or images are being prepared.</p>
        </dl>
        <dl className={styles.summaryCard}>
          <dt>Needs image review</dt>
          <dd>{itemsNeedingImages}</dd>
          <p>Items missing image coverage, primary image, or image alt text.</p>
        </dl>
      </section>

      <section className={styles.filters} aria-label="Catalogue filters">
        <label className={styles.field}>
          <span>Search item name</span>
          <input
            autoComplete="off"
            name="catalogueSearch"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search catalogue items"
            type="search"
            value={query}
          />
        </label>
        <label className={styles.field}>
          <span>Public status</span>
          <select
            name="statusFilter"
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Hidden</option>
          </select>
        </label>
        <label className={styles.field}>
          <span>Category</span>
          <select
            name="categoryFilter"
            onChange={(event) => setCategoryFilter(event.target.value)}
            value={categoryFilter}
          >
            <option value="all">All categories</option>
            <option value="uncategorized">Unassigned category</option>
            {sortedCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <div className={styles.mainGrid}>
        <section className={styles.cataloguePanel} aria-label="Catalogue items">
          <div className={styles.panelHeader}>
            <div>
              <h2>Catalogue items</h2>
              <p>Public-catalogue style cards with protected admin controls.</p>
            </div>
            <span className={styles.panelCount}>{filteredProducts.length}</span>
          </div>

          {products.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No catalogue items yet</h3>
              <p>
                Add a rental item, save it as draft, then attach reviewed images
                before making it public.
              </p>
              <button
                className={styles.primaryAction}
                onClick={() => setSelectedProductId(createSelection)}
                type="button"
              >
                Add catalogue item
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No matching catalogue items</h3>
              <p>Adjust search, public status, or category filters.</p>
            </div>
          ) : (
            <div className={styles.cardGrid}>
              {filteredProducts.map((product) => {
                const attention = imageAttention(product, images);
                const isActive = product.id === selectedProductId;

                return (
                  <article
                    className={`${styles.itemCard} ${
                      isActive ? styles.itemCardActive : ""
                    }`}
                    key={product.id}
                    aria-label={`Catalogue item ${product.name}`}
                  >
                    <div className={styles.imageState} aria-hidden="true">
                      <div>
                        <strong>
                          {product.imageCount > 0 ? "Image saved" : "No image"}
                        </strong>
                        <span>{attention.detail}</span>
                      </div>
                    </div>
                    <div className={styles.itemCardBody}>
                      <div className={styles.itemCardTitle}>
                        <h3>{product.name}</h3>
                        <p>{categoryLabel(product, categoryById)}</p>
                      </div>
                      <div className={styles.tagRow}>
                        <span
                          className={`${styles.statusTag} ${statusClass(
                            product.status,
                          )}`}
                        >
                          {statusLabel(product.status)}
                        </span>
                        <span
                          className={
                            attention.attention
                              ? styles.attentionTag
                              : `${styles.statusTag} ${styles.statusPublished}`
                          }
                        >
                          {attention.label}
                        </span>
                      </div>
                      <div className={styles.cardFooter}>
                        <button
                          className={styles.cardAction}
                          onClick={() => setSelectedProductId(product.id)}
                          type="button"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section
          className={styles.editorPanel}
          id="catalogue-item-editor"
          aria-label="Catalogue item editor"
        >
          <div className={styles.panelHeader}>
            <div>
              <h2>{isCreating ? "Add catalogue item" : "Edit catalogue item"}</h2>
              <p>
                One owner workflow for item copy, category, public status,
                images, primary image, and image alt text.
              </p>
            </div>
            {hidden > 0 ? <span className={styles.panelCount}>{hidden} hidden</span> : null}
          </div>
          <div className={styles.editorBody}>
            <section className={styles.editorSection}>
              <h3>Item details</h3>
              <StatusMessage status={productStatus} />
              <form
                className={styles.formGrid}
                onSubmit={(event) => void handleProductSubmit(event)}
              >
                <label className={styles.field}>
                  <span>Name</span>
                  <input
                    defaultValue={selectedProduct?.name ?? ""}
                    maxLength={160}
                    name="name"
                    required
                  />
                </label>

                <label className={styles.field}>
                  <span>Catalogue card summary</span>
                  <textarea
                    defaultValue={selectedProduct?.shortDescription ?? ""}
                    maxLength={240}
                    name="shortDescription"
                    rows={3}
                  />
                  <small>
                    Short owner-supplied copy for browsing and enquiry context.
                  </small>
                </label>

                <label className={styles.field}>
                  <span>Description</span>
                  <textarea
                    defaultValue={selectedProduct?.description ?? ""}
                    maxLength={2000}
                    name="description"
                    rows={5}
                  />
                </label>

                <div className={styles.twoColumn}>
                  <label className={styles.field}>
                    <span>Category</span>
                    <select
                      defaultValue={selectedProduct?.categoryId ?? ""}
                      name="categoryId"
                    >
                      {isCreating || !selectedProduct?.categoryId ? (
                        <option value="">Unassigned category</option>
                      ) : null}
                      {sortedCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <small>
                      Categories are sorted alphabetically for owner browsing.
                    </small>
                  </label>

                  <label className={styles.field}>
                    <span>Public status</span>
                    <select
                      defaultValue={selectedProduct?.status ?? "draft"}
                      name="status"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Hidden</option>
                    </select>
                  </label>
                </div>

                <div className={styles.twoColumn}>
                  <label className={styles.field}>
                    <span>Enquiry unit label</span>
                    <input
                      defaultValue={selectedProduct?.rentalUnit ?? "item"}
                      maxLength={80}
                      name="rentalUnit"
                      required
                    />
                    <small>Used for enquiry context, not availability.</small>
                  </label>

                  <label className={styles.field}>
                    <span>Display position</span>
                    <input
                      defaultValue={selectedProduct?.sortOrder ?? ""}
                      max={1000000}
                      min={0}
                      name="sortOrder"
                      type="number"
                    />
                  </label>
                </div>

                <button className={styles.primaryAction} type="submit">
                  Save catalogue item
                </button>
              </form>
            </section>

            <section className={styles.editorSection}>
              <h3>Images</h3>
              <p className={styles.emptyText}>
                Upload reviewed catalogue images and maintain primary image alt
                text without exposing storage paths.
              </p>
              <StatusMessage status={imageStatus} />
              {selectedProduct ? (
                <>
                  <form
                    className={styles.formGrid}
                    onSubmit={(event) => void handleImageUpload(event)}
                  >
                    <label className={styles.field}>
                      <span>New catalogue image</span>
                      <input
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        name="imageFile"
                        required
                        type="file"
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Image alt text</span>
                      <input maxLength={240} name="altText" />
                      <small>
                        Describe the rental item or setup shown for public
                        accessibility.
                      </small>
                    </label>
                    <div className={styles.twoColumn}>
                      <label className={styles.field}>
                        <span>Image display position</span>
                        <input
                          max={1000000}
                          min={0}
                          name="sortOrder"
                          type="number"
                        />
                      </label>
                      <label className={styles.checkboxField}>
                        <input name="isPrimary" type="checkbox" />
                        <span>Make this the primary image</span>
                      </label>
                    </div>
                    <button className={styles.primaryAction} type="submit">
                      Upload listing image for review
                    </button>
                  </form>

                  {selectedImages.length === 0 ? (
                    <div className={styles.emptyState}>
                      <h3>No images for this item yet</h3>
                      <p>
                        Upload a reviewed image, add alt text, and mark a
                        primary image before publishing.
                      </p>
                    </div>
                  ) : (
                    <div className={styles.imageList}>
                      {selectedImages.map((image, index) => {
                        const label = imageDisplayName(image, index);

                        return (
                          <article
                            className={styles.imageEditorCard}
                            key={image.id}
                            aria-label={`${label} metadata`}
                          >
                            <div className={styles.imageEditorHeader}>
                              <div>
                                <h4>{label}</h4>
                                <p>
                                  {image.status === "active"
                                    ? "Active image"
                                    : "Hidden image"}{" "}
                                  for this catalogue item.
                                </p>
                              </div>
                              <span
                                className={`${styles.statusTag} ${
                                  image.isPrimary
                                    ? styles.statusPublished
                                    : styles.statusDraft
                                }`}
                              >
                                {image.isPrimary ? "Primary" : "Supporting"}
                              </span>
                            </div>
                            <form
                              className={styles.formGrid}
                              onSubmit={(event) =>
                                void handleImageMetadataSubmit(event, image)
                              }
                            >
                              <label className={styles.field}>
                                <span>Image alt text</span>
                                <input
                                  defaultValue={image.altText ?? ""}
                                  maxLength={240}
                                  name="altText"
                                />
                              </label>
                              <div className={styles.twoColumn}>
                                <label className={styles.field}>
                                  <span>Image display position</span>
                                  <input
                                    defaultValue={image.sortOrder}
                                    max={1000000}
                                    min={0}
                                    name="sortOrder"
                                    type="number"
                                  />
                                </label>
                                <label className={styles.checkboxField}>
                                  <input
                                    defaultChecked={image.isPrimary}
                                    name="isPrimary"
                                    type="checkbox"
                                  />
                                  <span>Primary image</span>
                                </label>
                              </div>
                              <div className={styles.toolbarActions}>
                                <button
                                  className={styles.primaryAction}
                                  type="submit"
                                >
                                  Save image metadata
                                </button>
                                <button
                                  className={styles.quietButton}
                                  onClick={() => void handleImageArchive(image)}
                                  type="button"
                                >
                                  Hide image
                                </button>
                              </div>
                            </form>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <p className={styles.emptyText}>
                  Save a catalogue item before attaching images.
                </p>
              )}
            </section>
          </div>
        </section>
      </div>

      {advancedCategoryPanel ? (
        <details className={styles.advancedPanel}>
          <summary>Advanced category details</summary>
          <div>{advancedCategoryPanel}</div>
        </details>
      ) : null}
    </section>
  );
}
