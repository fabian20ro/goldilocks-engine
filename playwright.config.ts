import { defineConfig } from "@playwright/test";

const port = process.env.E2E_PORT ?? "4173";
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: "pages.spec.ts",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    browserName: "chromium",
    headless: true,
    locale: "en-US",
    timezoneId: "Europe/Bucharest",
    serviceWorkers: "allow",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "./scripts/run-e2e",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
