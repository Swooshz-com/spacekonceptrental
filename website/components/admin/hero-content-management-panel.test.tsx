import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HeroContentManagementPanel } from "./hero-content-management-panel";

const rawProof = "raw-hero-proof-that-must-not-render";

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body)
  } as unknown as Response;
}

function createSuccessfulFetchMock() {
  return vi
    .fn()
    .mockResolvedValueOnce(
      jsonResponse({
        ok: true,
        csrfProof: rawProof,
        expiresAt: Date.now() + 60_000
      })
    )
    .mockResolvedValueOnce(
      jsonResponse({
        ok: true,
        record: {
          workspaceId: "11111111-1111-4111-8111-111111111111"
        }
      })
    );
}

describe("hero content management panel", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders hero image management without text, CTA, or raw URL controls", () => {
    render(<HeroContentManagementPanel hero={null} />);

    expect(
      screen.getByRole("heading", { name: /homepage hero image/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("form", { name: /homepage hero image/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: /current hero image/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: /upload new hero image/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/select a hero image/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/image alt text/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save hero image/i })
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/hero headline/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/hero body/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/primary CTA/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/secondary CTA/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/hero image url/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/about story/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/publish hero image/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /publish hero image/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /image url/i })).not.toBeInTheDocument();
    expect(document.querySelector('input[type="url"]')).toBeNull();
    expect(document.querySelector('input[name="imageUrl"]')).toBeNull();
    expect(document.querySelector('input[name="isEnabled"]')).toBeNull();
    expect(screen.getAllByText(/code-managed/i).length).toBeGreaterThan(0);
  });

  it("requests a hero.write CSRF proof and posts multipart hero image metadata", async () => {
    const fetcher = createSuccessfulFetchMock();
    const onMutationComplete = vi.fn();

    render(
      <HeroContentManagementPanel
        hero={null}
        fetcher={fetcher}
        onMutationComplete={onMutationComplete}
      />
    );

    fireEvent.change(screen.getByLabelText(/image alt text/i), {
      target: { value: "Managed lounge setup" }
    });
    fireEvent.click(screen.getByRole("button", { name: /save hero image/i }));

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));

    expect(fetcher.mock.calls[0][0]).toBe("/api/admin/csrf-proof");
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toMatchObject({
      requestedOperation: "hero.write",
      operation: "hero.write"
    });
    expect(fetcher.mock.calls[1][0]).toBe("/api/admin/hero");
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
    expect((body as FormData).get("imageAlt")).toBe("Managed lounge setup");
    expect((body as FormData).get("isEnabled")).toBe("true");
    expect((body as FormData).get("imageUrl")).toBeNull();
    expect((body as FormData).get("headline")).toBeNull();
    expect((body as FormData).get("body")).toBeNull();
    expect((body as FormData).get("primaryCtaLabel")).toBeNull();
    expect((body as FormData).get("secondaryCtaLabel")).toBeNull();
    expect(onMutationComplete).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(rawProof)).not.toBeInTheDocument();
  });

  it("rejects invalid hero image input before requesting a proof", async () => {
    const fetcher = vi.fn();

    render(<HeroContentManagementPanel hero={null} fetcher={fetcher} />);

    fireEvent.change(screen.getByLabelText(/image alt text/i), {
      target: { value: "" }
    });
    fireEvent.click(screen.getByRole("button", { name: /save hero image/i }));

    expect(
      await screen.findByText(/check the image file and alt text/i)
    ).toBeInTheDocument();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
