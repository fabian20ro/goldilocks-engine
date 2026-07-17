import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "round-023-live.spec.ts",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    browserName: "chromium",
    headless: true,
    locale: "en-US",
    timezoneId: "Europe/Bucharest",
    serviceWorkers: "allow",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
