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

  it("renders a protected admin form instead of a disabled hero placeholder", () => {
    render(<HeroContentManagementPanel hero={null} />);

    expect(
      screen.getByRole("heading", { name: /homepage hero content/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/hero headline/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hero body/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hero image url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hero image alt/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/publish hero content/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save hero content/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /replace hero image/i })
    ).not.toBeInTheDocument();
  });

  it("requests a hero.write CSRF proof and posts valid hero updates", async () => {
    const fetcher = createSuccessfulFetchMock();
    const onMutationComplete = vi.fn();

    render(
      <HeroContentManagementPanel
        hero={null}
        fetcher={fetcher}
        onMutationComplete={onMutationComplete}
      />
    );

    fireEvent.change(screen.getByLabelText(/hero headline/i), {
      target: { value: "Managed homepage hero" }
    });
    fireEvent.change(screen.getByLabelText(/hero body/i), {
      target: { value: "Owner-managed homepage intro." }
    });
    fireEvent.change(screen.getByLabelText(/hero image url/i), {
      target: { value: "https://cdn.example.test/hero.jpg" }
    });
    fireEvent.change(screen.getByLabelText(/hero image alt/i), {
      target: { value: "Managed lounge setup" }
    });
    fireEvent.click(screen.getByRole("button", { name: /save hero content/i }));

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
        "Content-Type": "application/json",
        "x-csrf-proof": rawProof
      }
    });
    expect(JSON.parse(String(fetcher.mock.calls[1][1]?.body))).toMatchObject({
      headline: "Managed homepage hero",
      body: "Owner-managed homepage intro.",
      imageUrl: "https://cdn.example.test/hero.jpg",
      imageAlt: "Managed lounge setup",
      isEnabled: true
    });
    expect(onMutationComplete).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(rawProof)).not.toBeInTheDocument();
  });

  it("rejects invalid href and image input before requesting a proof", async () => {
    const fetcher = vi.fn();

    render(<HeroContentManagementPanel hero={null} fetcher={fetcher} />);

    fireEvent.change(screen.getByLabelText(/primary CTA href/i), {
      target: { value: "javascript:alert(1)" }
    });
    fireEvent.click(screen.getByRole("button", { name: /save hero content/i }));

    expect(
      await screen.findByText(/check headline, links, image URL, and alt text/i)
    ).toBeInTheDocument();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
