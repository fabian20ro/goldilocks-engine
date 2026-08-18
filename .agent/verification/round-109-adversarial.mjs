#!/usr/bin/env node

/* Independent M7B browser probe; does not import the candidate's E2E helpers. */

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium, webkit } from "playwright";

const root = process.cwd();
const port = Number(process.env.M7B_ROUND109_PORT ?? "43910");
const baseUrl = `http://127.0.0.1:${port}/`;
const navigationLabels = [
  "Build",
  "Jobs",
  "Career",
  "Upgrades",
  "Inspect",
  "Research",
  "Lab",
  "World",
];
const knownWebKitOfflineMarker = "WebKit encountered an internal error";
const browserNames = (process.env.M7B_ROUND109_BROWSERS ?? "chromium,webkit")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const launchers = { chromium, webkit };

function recordError(page, errors) {
  page.on("pageerror", (error) =>
    errors.push({ kind: "pageerror", message: error.message }),
  );
  page.on("console", (message) => {
    if (message.type() === "error")
      errors.push({ kind: "console", message: message.text() });
  });
}

async function waitForReady() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // Preview is still building.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`preview did not become ready at ${baseUrl}`);
}

async function waitForApp(page) {
  await page.locator("h1", { hasText: "Goldilocks Engine" }).waitFor({
    state: "visible",
  });
}

async function assertNavigation(page, width) {
  const navigation = page.getByRole("navigation", { name: "Primary" });
  const labels = await navigation
    .getByRole("button")
    .evaluateAll((buttons) =>
      buttons.map((button) => button.getAttribute("aria-label")),
    );
  assert.deepEqual(labels, navigationLabels);
  const targets = await navigation.getByRole("button").all();
  for (const target of targets) {
    const box = await target.boundingBox();
    assert.ok(box && box.width >= 44 && box.height >= 44);
  }
  const geometry = await page.evaluate(() => ({
    viewport: innerWidth,
    documentWidth: Math.max(
      document.documentElement.scrollWidth,
      document.body?.scrollWidth ?? 0,
    ),
  }));
  assert.ok(geometry.documentWidth <= geometry.viewport + 1);
  if (width === 320)
    assert.equal(
      await navigation.getAttribute("aria-describedby"),
      "primary-nav-overflow-hint",
    );

  const world = navigation.getByRole("button", { name: "World", exact: true });
  await world.focus();
  await page.keyboard.press("Enter");
  assert.equal(await world.getAttribute("aria-current"), "page");
  await navigation.getByRole("button", { name: "Jobs", exact: true }).tap();
  assert.equal(
    await navigation
      .getByRole("button", { name: "Jobs", exact: true })
      .getAttribute("aria-current"),
    "page",
  );
}

async function assertMalformedRecovery(page) {
  await page.evaluate(() => {
    localStorage.setItem("goldilocks-simulation-save-v4", "{malformed");
    localStorage.setItem("round-109-probe", "before-reload");
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForApp(page);
  await page.getByRole("navigation", { name: "Primary" }).waitFor({
    state: "visible",
  });
}

async function assertOfflineRecovery(page, context, browserName) {
  await assert.ok(
    await page.evaluate(() => navigator.serviceWorker.controller !== null),
  );
  await context.setOffline(true);
  let navigationError = null;
  try {
    await page.reload({ waitUntil: "domcontentloaded" });
  } catch (error) {
    navigationError = String(error);
  }
  await waitForApp(page);
  const cacheProof = await page.evaluate(async () => {
    const names = await caches.keys();
    const matches = await Promise.all(
      names.map(async (name) => (await caches.open(name)).match(location.href)),
    );
    return {
      controller: navigator.serviceWorker.controller !== null,
      shellCached: matches.some(Boolean),
    };
  });
  await context.setOffline(false);
  assert.equal(cacheProof.controller, true);
  assert.equal(cacheProof.shellCached, true);
  if (browserName === "chromium") assert.equal(navigationError, null);
  else if (navigationError)
    assert.match(navigationError, new RegExp(knownWebKitOfflineMarker));
  return navigationError;
}

async function runCell(browserName, width, browser) {
  const height = width === 320 ? 693 : 742;
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
    serviceWorkers: "allow",
    viewport: { width, height },
  });
  const page = await context.newPage();
  const errors = [];
  recordError(page, errors);
  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await waitForApp(page);
    assert.equal(
      await page.evaluate(
        () => matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
      true,
    );
    await assertNavigation(page, width);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
      window.dispatchEvent(new Event("resize"));
    });
    await page.waitForTimeout(100);
    const scaledWidth = await page.evaluate(() => ({
      viewport: innerWidth,
      documentWidth: Math.max(
        document.documentElement.scrollWidth,
        document.body?.scrollWidth ?? 0,
      ),
    }));
    assert.ok(scaledWidth.documentWidth <= scaledWidth.viewport + 1);
    await assertMalformedRecovery(page);
    const offlineError = await assertOfflineRecovery(
      page,
      context,
      browserName,
    );
    const nonOfflineErrors = errors.filter(
      ({ message }) =>
        !message.includes(knownWebKitOfflineMarker) &&
        !message.includes("Failed to load resource"),
    );
    assert.deepEqual(nonOfflineErrors, []);
    return {
      browser: browserName,
      width,
      height,
      scaledDocumentWidth: scaledWidth.documentWidth,
      offlineError: offlineError ? "known-webkit-blocker" : null,
      rawErrors: errors,
    };
  } finally {
    await context.close();
  }
}

const server = spawn("./scripts/run-e2e", [], {
  cwd: root,
  detached: true,
  env: { ...process.env, E2E_PORT: String(port) },
  stdio: "ignore",
});
const results = [];
try {
  await waitForReady();
  for (const browserName of browserNames) {
    const launcher = launchers[browserName];
    if (!launcher) throw new Error(`unknown browser ${browserName}`);
    const browser = await launcher.launch({ headless: true });
    try {
      for (const width of [320, 393])
        results.push(await runCell(browserName, width, browser));
    } finally {
      await browser.close();
    }
  }
  console.log(
    JSON.stringify(
      { candidateSha: process.env.M7B_CANDIDATE_SHA ?? "", results },
      null,
      2,
    ),
  );
} finally {
  if (server.pid) {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      // Preview may have already exited.
    }
  }
}
