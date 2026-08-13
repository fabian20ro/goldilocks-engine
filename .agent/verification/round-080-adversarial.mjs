import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:42881";
const outputDirectory = process.env.OUTPUT_DIR ?? "/private/tmp/goldlocks-r080";
const saveKey = "goldilocks-simulation-save-v4";
const findings = [];

await mkdir(outputDirectory, { recursive: true });

function check(name, condition, evidence) {
  if (!condition) findings.push({ evidence, name });
}

async function waitForSave(page) {
  await page.getByRole("heading", { name: "Goldilocks Engine" }).waitFor();
  await page.waitForFunction(
    (key) => localStorage.getItem(key) !== null,
    saveKey,
  );
}

async function openTab(page, tab) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: tab, exact: true })
    .click();
}

async function removeRuntime(page) {
  await page
    .getByTestId("slot-runtime")
    .getByRole("button", { name: /^Quantized Model/ })
    .click();
  await page
    .getByRole("button", {
      name: "Remove Quantized Model from Runtime and bypass position",
      exact: true,
    })
    .click();
}

async function settleFailure(page, touch) {
  await openTab(page, "Jobs");
  await page
    .getByRole("button", {
      name: "Queue one safe Interactive Chat job",
      exact: true,
    })
    .click();
  const simulation = page.getByTestId("simulation-context");
  const summary = simulation.locator(":scope > summary");
  if (!(await simulation.evaluate((element) => element.open))) {
    if (touch) await summary.tap();
    else {
      await summary.focus();
      await page.keyboard.press("Space");
    }
  }
  const speed = simulation.getByRole("button", { name: "64×", exact: true });
  if (touch) await speed.tap();
  else {
    await speed.focus();
    await page.keyboard.press("Enter");
  }
  await page.waitForFunction((key) => {
    const raw = localStorage.getItem(key);
    return raw !== null && JSON.parse(raw).lastSettlement?.failed === 1;
  }, saveKey);
}

async function createStaleDecoy(page) {
  await openTab(page, "Inspect");
  await page.getByRole("button", { name: "Capture", exact: true }).click();
  await page.waitForFunction((key) => {
    const raw = localStorage.getItem(key);
    if (raw === null) return false;
    const state = JSON.parse(raw);
    return (
      state.ledger.at(-1)?.message ===
      "Current configuration captured for comparison."
    );
  }, saveKey);
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null");
    const laterEvent = state.ledger.at(-1);
    laterEvent.kind = "failure";
    laterEvent.message = `Unrelated later failure mentioned task ${state.lastSettlement.taskId} but did not settle it.`;
    laterEvent.directCause = "Forged unrelated cause.";
    localStorage.setItem(key, JSON.stringify(state));
  }, saveKey);
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForSave(page);
  await openTab(page, "Jobs");
}

async function inspectViewport(browser, viewport, touch) {
  const context = await browser.newContext({
    hasTouch: touch,
    isMobile: touch,
    serviceWorkers: "allow",
    viewport,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });

  try {
    await page.goto(baseURL, { waitUntil: "domcontentloaded" });
    await waitForSave(page);
    await removeRuntime(page);
    await settleFailure(page, touch);
    await createStaleDecoy(page);

    const recovery = page.locator(".settlement-recovery");
    const rawText = await recovery.innerText();
    check(
      `${viewport.width}px stale decoy cannot replace settlement cause`,
      rawText.includes("The active pipeline had no model stage.") &&
        !rawText.includes("Forged unrelated cause."),
      rawText,
    );

    const accounting = page.getByTestId("settlement-accounting");
    const accountingSummary = accounting.locator(":scope > summary");
    check(
      `${viewport.width}px has one native settlement disclosure`,
      (await accounting.count()) === 1 &&
        (await accounting.evaluate((element) => element.tagName)) === "DETAILS",
      await accounting.evaluate((element) => element.outerHTML),
    );
    if (touch) await accountingSummary.tap();
    else {
      await accountingSummary.focus();
      await page.keyboard.press("Space");
    }
    check(
      `${viewport.width}px disclosure opens through ${touch ? "touch" : "keyboard"}`,
      await accounting.evaluate((element) => element.open),
      "Settlement accounting and provenance",
    );

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addStyleTag({
      content: ":root { font-size: 200% !important; }",
    });
    await recovery.scrollIntoViewIfNeeded();
    const geometry = await page.evaluate(() => {
      const summary = document.querySelector(
        ".settlement-accounting > summary",
      );
      const box = summary?.getBoundingClientRect();
      return {
        documentOverflow:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
        summaryHeight: box?.height ?? 0,
        summaryWidth: box?.width ?? 0,
      };
    });
    check(
      `${viewport.width}px 200% reduced-motion no horizontal overflow`,
      !geometry.documentOverflow,
      JSON.stringify(geometry),
    );
    check(
      `${viewport.width}px 200% disclosure target remains 44px`,
      geometry.summaryHeight >= 44 && geometry.summaryWidth >= 44,
      JSON.stringify(geometry),
    );
    await page.screenshot({
      path: `${outputDirectory}/stale-provenance-${viewport.width}-200-reduced.png`,
    });
    check(
      `${viewport.width}px page and console errors`,
      errors.length === 0,
      JSON.stringify(errors),
    );
  } finally {
    await context.close();
  }
}

async function inspectOfflineRecovery(browser) {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    serviceWorkers: "allow",
    viewport: { width: 393, height: 742 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });

  try {
    await page.goto(baseURL, { waitUntil: "domcontentloaded" });
    await waitForSave(page);
    await page
      .locator("html[data-offline-ready='true']")
      .waitFor({ timeout: 15_000 });
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForSave(page);
    await openTab(page, "Jobs");
    await page
      .getByRole("button", {
        name: "Queue one safe Interactive Chat job",
        exact: true,
      })
      .tap();
    await openTab(page, "Build");
    check(
      "393px offline reload keeps the worker-backed Jobs flow operable",
      await page.getByLabel(/jobs queued at bottleneck/).isVisible(),
      "offline reload, queue one safe job",
    );
    check(
      "393px offline reload has no page or console errors",
      errors.length === 0,
      JSON.stringify(errors),
    );
  } finally {
    await context.setOffline(false);
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true });
try {
  await inspectViewport(browser, { width: 320, height: 693 }, false);
  await inspectViewport(browser, { width: 393, height: 742 }, true);
  await inspectOfflineRecovery(browser);
} finally {
  await browser.close();
}

console.log(JSON.stringify({ findings }, null, 2));
if (findings.length > 0) process.exitCode = 1;
