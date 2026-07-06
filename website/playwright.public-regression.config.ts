import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.SKR_PUBLIC_REGRESSION_PLAYWRIGHT_PORT ?? 3218);
const configuredBaseUrl = process.env.SKR_PUBLIC_REGRESSION_BASE_URL;
const baseURL = configuredBaseUrl ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  expect: {
    timeout: 10000
  },
  outputDir: "../.tmp/skr-public-regression-playwright/results",
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: {
          height: 900,
          width: 1440
        }
      }
    }
  ],
  reporter: [["list"]],
  testDir: "./playwright",
  testMatch: /public-regression\.spec\.ts/,
  timeout: 90000,
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  webServer: configuredBaseUrl
    ? undefined
    : {
        command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
        reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "1",
        timeout: 120000,
        url: baseURL
      }
});
