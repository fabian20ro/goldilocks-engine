import { defineConfig } from "@playwright/test";

const port = process.env.E2E_WEBKIT_PORT ?? "4174";
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /m7b-webkit\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [
    ["list"],
    [
      "html",
      { outputFolder: ".cache/playwright/webkit-report", open: "never" },
    ],
  ],
  use: {
    baseURL,
    browserName: "webkit",
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
    env: {
      E2E_PORT: port,
    },
  },
});
