import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ListingImageUploadPanel,
  type ListingImageUploadProduct
} from "./listing-image-upload-panel";

const sourcePath = resolve(
  process.cwd(),
  "components/admin/listing-image-upload-panel.tsx"
);
const product: ListingImageUploadProduct = {
  id: "22222222-2222-4222-8222-222222222222",
  slug: "modular-lounge",
  name: "Modular Lounge",
  status: "published",
  sortOrder: 10,
  rentalUnit: "set",
  imageCount: 1
};
const rawProof = "raw-upload-proof-that-must-not-render";

function readSource() {
  return readFileSync(sourcePath, "utf8");
}

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body)
  } as unknown as Response;
}

function imageFile() {
  return new File([new Uint8Array([1, 2, 3])], "lounge.webp", {
    type: "image/webp"
  });
}

describe("listing image upload panel", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders authorised admin upload controls without ecommerce flows", () => {
    render(<ListingImageUploadPanel products={[product]} />);

    expect(
      screen.getByRole("heading", { name: /upload listing image/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/upload image listing/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/listing image file/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/upload image alt text/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /upload listing image/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/cart|checkout|payment|customer account|stock reservation|order fulfilment|online ordering/i)
    ).not.toBeInTheDocument();
  });

  it("uses visible MVP image upload guidance without old internal ladder wording", () => {
    render(<ListingImageUploadPanel products={[product]} />);

    expect(
      screen.getByText(/Upload reviewed image files for furniture and event-rental listings/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/public catalogue display/i)
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(
      /readiness|phase|governance|provider handoff|CRM handoff|sync readiness|workflow readiness|future sync|future integration|provider sync|automation handoff|owner approval|evidence|deployment/i
    );
  });

  it("requests a productImage CSRF proof and uploads multipart form data with the proof", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          ok: true,
          csrfProof: rawProof
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          ok: true,
          record: {
            id: "33333333-3333-4333-8333-333333333333",
            type: "productImage"
          }
        })
      );
    const onMutationComplete = vi.fn();

    render(
      <ListingImageUploadPanel
        products={[product]}
        fetcher={fetcher}
        onMutationComplete={onMutationComplete}
      />
    );

    fireEvent.change(screen.getByLabelText(/upload image listing/i), {
      target: {
        value: product.id
      }
    });
    fireEvent.change(screen.getByLabelText(/listing image file/i), {
      target: {
        files: [imageFile()]
      }
    });
    fireEvent.change(screen.getByLabelText(/upload image alt text/i), {
      target: {
        value: "Styled lounge setup"
      }
    });
    fireEvent.change(screen.getByLabelText(/upload image display position/i), {
      target: {
        value: "3"
      }
    });
    fireEvent.click(screen.getByLabelText(/mark uploaded image as primary/i));
    fireEvent.submit(
      screen.getByRole("form", { name: /upload listing image/i })
    );

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));

    expect(fetcher.mock.calls[0][0]).toBe("/api/admin/csrf-proof");
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toMatchObject({
      requestedOperation: "productImage.write",
      operation: "productImage.write"
    });
    expect(fetcher.mock.calls[1][0]).toBe("/api/admin/product-images");
    expect(fetcher.mock.calls[1][1]).toMatchObject({
      method: "POST",
      headers: {
        "x-csrf-proof": rawProof
      }
    });
    expect(fetcher.mock.calls[1][1]?.headers).not.toHaveProperty(
      "Content-Type"
    );
    const body = fetcher.mock.calls[1][1]?.body;

    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("productId")).toBe(product.id);
    expect((body as FormData).get("altText")).toBe("Styled lounge setup");
    expect((body as FormData).get("sortOrder")).toBe("3");
    expect((body as FormData).get("isPrimary")).toBe("true");
    expect((body as FormData).get("imageFile")).toBeInstanceOf(File);
    expect(onMutationComplete).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(rawProof)).not.toBeInTheDocument();
  });

  it("renders generic upload failures without provider, proof, or workspace details", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          ok: true,
          csrfProof: rawProof
        })
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            ok: false,
            error: "sql supabase storage stack env token cookie workspace provider"
          },
          false
        )
      );

    render(
      <ListingImageUploadPanel
        products={[product]}
        fetcher={fetcher}
        onMutationComplete={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/upload image listing/i), {
      target: {
        value: product.id
      }
    });
    fireEvent.change(screen.getByLabelText(/listing image file/i), {
      target: {
        files: [imageFile()]
      }
    });
    fireEvent.submit(
      screen.getByRole("form", { name: /upload listing image/i })
    );

    expect(
      await screen.findByText(/protected admin upload could not be completed/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/sql|supabase|storage|stack|env|token|cookie|workspace|provider/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(rawProof)).not.toBeInTheDocument();
  });

  it("keeps browser upload source free of Supabase clients and ecommerce flows", () => {
    const source = readSource();

    expect(source).toContain('"use client";');
    expect(source).toContain('type="file"');
    expect(source).toContain("FormData");
    expect(source).toContain("productImage.write");
    expect(source).not.toContain("@supabase/");
    expect(source).not.toContain("lib/supabase");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(source).not.toMatch(/cart|checkout|payment|customer account|stock reservation|order fulfilment|online ordering/i);
  });
});
