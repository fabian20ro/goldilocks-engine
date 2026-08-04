import { defineConfig } from "@playwright/test";

const port = process.env.E2E_PORT ?? "4173";
const pagesUrl = `http://127.0.0.1:${port}/goldilocks-engine/`;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "pages.spec.ts",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-pages-report" }],
  ],
  use: {
    baseURL: pagesUrl,
    browserName: "chromium",
    headless: true,
    locale: "en-US",
    timezoneId: "Europe/Bucharest",
    serviceWorkers: "allow",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "./scripts/run-pages-e2e",
    url: pagesUrl,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
