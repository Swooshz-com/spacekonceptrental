import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const screenshotDir = path.resolve(
  process.cwd(),
  "..",
  ".tmp",
  "skr-public-regression-playwright"
);

const protectedAdminRoutes = [
  "/admin",
  "/admin/hero",
  "/admin/catalogue",
  "/admin/setups",
  "/admin/enquiry-email",
  "/admin/delivery-log"
];

async function capture(page: Page, filename: string) {
  await page.screenshot({
    fullPage: true,
    path: path.join(screenshotDir, filename)
  });
}

async function expectPublicShell(page: Page) {
  await expect(page.locator(".stitch-site-header")).toBeVisible();
  await expect(page.locator(".stitch-footer")).toBeVisible();
}

async function expectPublicShellAbsent(page: Page) {
  await expect(page.locator(".stitch-site-header")).toHaveCount(0);
  await expect(page.locator(".stitch-footer")).toHaveCount(0);
  await expect(page.locator(".stitch-bottom-nav")).toHaveCount(0);
  await expect(
    page.locator(".chat-widget, .chat-widget-launcher, .chat-widget-panel")
  ).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: /primary navigation/i })
  ).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: /mobile quick navigation/i })
  ).toHaveCount(0);
}

async function expectProtectedRouteMapAbsent(page: Page) {
  for (const href of protectedAdminRoutes) {
    await expect(page.locator(`a[href="${href}"]`)).toHaveCount(0);
  }

  await expect(
    page.getByRole("navigation", { name: /admin workspace sections/i })
  ).toHaveCount(0);
  await expect(page.getByText(/admin menu -/i)).toHaveCount(0);
}

async function expectSafeRecoveryActions(page: Page) {
  await expect(page.locator('a[href="/admin/login"]')).toHaveCount(1);
  await expect(page.locator('a[href="/"]')).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: /admin sign in|sign in/i })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /public site/i })).toBeVisible();
}

async function seedInflatedQuoteSelection(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "skr.quoteSelection.v1",
      JSON.stringify([
        {
          category: "Lounge Seating",
          imageSrc: "/assets/images/product_chair.png",
          kind: "rental",
          name: "Inflated Local Selection",
          quantity: 597,
          slug: "inflated-local-selection"
        },
        {
          category: "Setups",
          imageSrc: "/assets/images/event_gala.png",
          kind: "setup-included",
          name: "Nested Setup Piece",
          quantity: 120,
          setupName: "Legacy Setup",
          setupSlug: "legacy-setup",
          slug: "nested-setup-piece"
        }
      ])
    );
  });
}

async function expectEmptyStateCenteredIfVisible(page: Page) {
  const emptyState = page.locator(".stitch-empty").first();

  if ((await emptyState.count()) === 0 || !(await emptyState.isVisible())) {
    return;
  }

  await expect(emptyState).toHaveCSS("text-align", "center");
}

test.describe("post-demo-removal public/admin regression smoke", () => {
  test("captures public pages and keeps the hero, chat, and quote count sane", async ({
    page
  }) => {
    await seedInflatedQuoteSelection(page);
    await page.goto("/");

    await expectPublicShell(page);
    await expect(page.locator(".stitch-home-hero")).toBeVisible();
    await expect(page.getByLabel("597 selected")).toHaveCount(0);
    await expect(page.locator('strong[aria-label="1 selected"]')).toBeVisible();

    const heroMetrics = await page.locator(".stitch-home-hero__grid").evaluate(
      (element) => {
        const rect = element.getBoundingClientRect();
        return {
          width: rect.width,
          viewportWidth: window.innerWidth
        };
      }
    );
    expect(heroMetrics.width).toBeGreaterThan(heroMetrics.viewportWidth * 0.88);

    await page.getByRole("button", { name: /open chat/i }).click();
    await expect(page.locator(".chat-widget-panel")).toBeVisible();
    await expect(page.getByText(/what event are you planning/i)).toBeVisible();
    await capture(page, "public-home.png");

    await page.goto("/catalogue");
    await expectPublicShell(page);
    await expectEmptyStateCenteredIfVisible(page);
    if ((await page.locator(".stitch-product-card").count()) === 0) {
      await expect(page.getByRole("link", { name: /mid-century modern/i })).toHaveCount(0);
      await expect(page.getByRole("link", { name: /minimalist/i })).toHaveCount(0);
      await expect(page.getByRole("link", { name: /brutalist/i })).toHaveCount(0);
      await expect(page.getByRole("link", { name: /all styles/i })).toHaveCount(0);
    }
    await capture(page, "public-catalogue.png");

    await page.goto("/listings");
    await expectPublicShell(page);
    await expectEmptyStateCenteredIfVisible(page);
    if ((await page.locator(".stitch-setup-tile").count()) === 0) {
      await expect(page.getByRole("link", { name: /all setups/i })).toHaveCount(0);
      await expect(page.getByRole("link", { name: /intimate dining/i })).toHaveCount(0);
      await expect(page.getByRole("link", { name: /lounges/i })).toHaveCount(0);
    }
    await capture(page, "public-listings.png");

    await page.goto("/about");
    await expectPublicShell(page);
    await expect(page.getByRole("heading", { name: /curating spaces/i })).toBeVisible();
    await capture(page, "public-about.png");

    await page.goto("/contact");
    await expectPublicShell(page);
    await expect(page.getByRole("heading", { name: /get in touch/i })).toBeVisible();
    await capture(page, "public-contact.png");

    await page.goto("/quote");
    await expectPublicShell(page);
    await expect(page.getByRole("heading", { name: /request a rental quote/i })).toBeVisible();
    await expect(page.getByLabel("597 selected")).toHaveCount(0);
    await expect(page.locator('strong[aria-label="1 selected"]')).toBeVisible();
    await expect(page.getByText("Legacy Setup")).toHaveCount(0);
    await expect(page.getByText("Nested Setup Piece")).toHaveCount(0);
    await capture(page, "public-quote.png");
  });

  test("captures protected admin pre-auth screens without public shell or route map", async ({
    page
  }) => {
    await page.goto("/admin/login");
    await expect(
      page.getByRole("heading", { name: /admin sign in/i })
    ).toBeVisible();
    await expect(page.locator('button[formaction="/api/admin/login"]')).toHaveCount(1);
    await expectPublicShellAbsent(page);
    await expectProtectedRouteMapAbsent(page);
    await capture(page, "admin-login.png");

    await page.goto("/admin");
    await expect(
      page.getByRole("heading", {
        name: /admin sign in required|admin access unavailable|access denied/i
      })
    ).toBeVisible();
    await expectPublicShellAbsent(page);
    await expectProtectedRouteMapAbsent(page);
    await expectSafeRecoveryActions(page);
    await capture(page, "admin-root-preauth.png");

    await page.goto("/admin/catalogue");
    await expect(
      page.getByRole("heading", {
        name: /admin sign in required|admin access unavailable|access denied/i
      })
    ).toBeVisible();
    await expectPublicShellAbsent(page);
    await expectProtectedRouteMapAbsent(page);
    await expectSafeRecoveryActions(page);
    await capture(page, "admin-catalogue-preauth.png");
  });
});
