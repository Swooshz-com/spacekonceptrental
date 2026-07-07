import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ABOUT_STORY_MEDIA_SLOT } from "../../lib/page-media/public-page-media-content";
import { PublicPageMediaManagementPanel } from "./public-page-media-management-panel";

const rawProof = "raw-page-media-proof-that-must-not-render";

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
          workspaceId: "11111111-1111-4111-8111-111111111111",
          slot: ABOUT_STORY_MEDIA_SLOT
        }
      })
    );
}

describe("public page media management panel", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders a protected admin form for the About story image slot", () => {
    render(<PublicPageMediaManagementPanel media={null} />);

    expect(
      screen.getByRole("heading", { name: /about story media/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/about story image url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/about story image alt/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/publish about story image/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save about story image/i })
    ).toBeInTheDocument();
  });

  it("requests a hero.write CSRF proof and posts valid About story media", async () => {
    const fetcher = createSuccessfulFetchMock();
    const onMutationComplete = vi.fn();

    render(
      <PublicPageMediaManagementPanel
        media={null}
        fetcher={fetcher}
        onMutationComplete={onMutationComplete}
      />
    );

    fireEvent.change(screen.getByLabelText(/about story image url/i), {
      target: { value: "https://cdn.example.test/about-story.jpg" }
    });
    fireEvent.change(screen.getByLabelText(/about story image alt/i), {
      target: { value: "Owner selected About story lounge" }
    });
    fireEvent.click(
      screen.getByRole("button", { name: /save about story image/i })
    );

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));

    expect(fetcher.mock.calls[0][0]).toBe("/api/admin/csrf-proof");
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toMatchObject({
      requestedOperation: "hero.write",
      operation: "hero.write"
    });
    expect(fetcher.mock.calls[1][0]).toBe("/api/admin/page-media");
    expect(fetcher.mock.calls[1][1]).toMatchObject({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-proof": rawProof
      }
    });
    expect(JSON.parse(String(fetcher.mock.calls[1][1]?.body))).toEqual({
      slot: ABOUT_STORY_MEDIA_SLOT,
      imageUrl: "https://cdn.example.test/about-story.jpg",
      imageAlt: "Owner selected About story lounge",
      isEnabled: true
    });
    expect(onMutationComplete).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(rawProof)).not.toBeInTheDocument();
  });

  it("rejects invalid image input before requesting a proof", async () => {
    const fetcher = vi.fn();

    render(<PublicPageMediaManagementPanel media={null} fetcher={fetcher} />);

    fireEvent.change(screen.getByLabelText(/about story image url/i), {
      target: { value: "http://cdn.example.test/about-story.jpg" }
    });
    fireEvent.click(
      screen.getByRole("button", { name: /save about story image/i })
    );

    expect(
      await screen.findByText(/check image URL, alt text, and publish state/i)
    ).toBeInTheDocument();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
