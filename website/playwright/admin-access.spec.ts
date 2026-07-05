import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const screenshotDir = path.resolve(
  process.cwd(),
  "..",
  ".tmp",
  "admin-access-playwright"
);

const protectedAdminRoutes = [
  "/admin",
  "/admin/hero",
  "/admin/catalogue",
  "/admin/setups",
  "/admin/enquiry-email",
  "/admin/delivery-log"
];

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

async function capture(page: Page, filename: string) {
  await page.screenshot({
    fullPage: true,
    path: path.join(screenshotDir, filename)
  });
}

test.describe("protected admin access shell", () => {
  test("renders admin login without the public shell", async ({ page }) => {
    await page.goto("/admin/login");

    await expect(
      page.getByRole("heading", { name: /admin sign in/i })
    ).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.locator('button[formaction="/api/admin/login"]')).toHaveCount(
      1
    );
    await expect(page.getByRole("link", { name: /public site/i })).toHaveAttribute(
      "href",
      "/"
    );
    await expectPublicShellAbsent(page);
    await expectProtectedRouteMapAbsent(page);
    await capture(page, "admin-login.png");
  });

  test("renders admin root pre-auth without protected route links", async ({
    page
  }) => {
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
  });

  test("renders protected sub-route pre-auth without protected route links", async ({
    page
  }) => {
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
