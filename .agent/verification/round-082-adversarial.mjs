import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:43382";
const outputDirectory = process.env.OUTPUT_DIR ?? "/private/tmp/goldlocks-r082";
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

async function openTab(page, name, touch) {
  const tab = page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name, exact: true });
  if (touch) await tab.tap();
  else await tab.click();
}

async function chooseSpeed(page, touch) {
  const context = page.getByTestId("simulation-context");
  const summary = context.locator(":scope > summary");
  if (!(await context.evaluate((element) => element.open))) {
    if (touch) await summary.tap();
    else {
      await summary.focus();
      await page.keyboard.press("Space");
    }
  }
  const speed = context.getByRole("button", { name: "64×", exact: true });
  if (touch) await speed.tap();
  else {
    await speed.focus();
    await page.keyboard.press("Enter");
  }
}

async function seedFailedSettlement(page, touch) {
  await openTab(page, "Build", touch);
  const runtime = page
    .getByTestId("slot-runtime")
    .getByRole("button", { name: /^Quantized Model/ });
  if (touch) await runtime.tap();
  else await runtime.click();
  const remove = page.getByRole("button", {
    name: "Remove Quantized Model from Runtime and bypass position",
    exact: true,
  });
  if (touch) await remove.tap();
  else await remove.click();

  await openTab(page, "Jobs", touch);
  const queue = page.getByRole("button", {
    name: "Queue one safe Interactive Chat job",
    exact: true,
  });
  if (touch) await queue.tap();
  else await queue.click();
  await chooseSpeed(page, touch);
  await page.waitForFunction((key) => {
    const raw = localStorage.getItem(key);
    return raw !== null && JSON.parse(raw).lastSettlement?.failed === 1;
  }, saveKey);
}

async function probeCanonicalIdMarkerForgery(browser, viewport, touch) {
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
    await seedFailedSettlement(page, touch);

    const before = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      if (raw === null) throw new Error("No persisted simulation state.");
      const state = JSON.parse(raw);
      const linked = state.ledger.find(
        (event) => event.id === state.lastSettlement?.ledgerEventId,
      );
      if (!linked) throw new Error("No linked failed settlement event.");
      const original = {
        id: linked.id,
        marker: linked.settlementFailureCause,
        sequence: state.eventSequence,
        tick: state.tick,
      };
      linked.settlementFailureCause = "memory-capacity-exceeded";
      localStorage.setItem(key, JSON.stringify(state));
      return original;
    }, saveKey);

    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForSave(page);
    await openTab(page, "Jobs", touch);

    const after = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      if (raw === null) throw new Error("No restored simulation state.");
      const state = JSON.parse(raw);
      const linked = state.ledger.find(
        (event) => event.id === state.lastSettlement?.ledgerEventId,
      );
      return {
        id: linked?.id,
        marker: linked?.settlementFailureCause,
        sequence: state.eventSequence,
        tick: state.tick,
      };
    }, saveKey);
    const record = page.locator(".settlement-recovery");
    const text = await record.innerText();
    check(
      `${viewport.width}px stale canonical-ID marker forgery stays unknown`,
      text.includes(
        "Cause unknown — the retained settlement record is unavailable.",
      ) && !text.includes("Required memory exceeded available memory."),
      JSON.stringify({ after, before, text }),
    );

    const accounting = page.getByTestId("settlement-accounting");
    const summary = accounting.locator(":scope > summary");
    if (touch) await summary.tap();
    else {
      await summary.focus();
      await page.keyboard.press("Space");
    }
    const accountingText = await accounting.innerText();
    check(
      `${viewport.width}px native accounting remains keyboard/touch reachable`,
      (await accounting.count()) === 1 &&
        (await accounting.evaluate((element) => element.tagName)) ===
          "DETAILS" &&
        (await accounting.evaluate((element) => element.open)) &&
        accountingText.includes("Task ID task-0-1") &&
        accountingText.includes("cash change after the cash floor"),
      accountingText,
    );

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addStyleTag({
      content: ":root { font-size: 200% !important; }",
    });
    await record.scrollIntoViewIfNeeded();
    const geometry = await page.evaluate(() => {
      const summary = document.querySelector(
        ".settlement-accounting > summary",
      );
      const box = summary?.getBoundingClientRect();
      return {
        height: box?.height ?? 0,
        overflow:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
        width: box?.width ?? 0,
      };
    });
    check(
      `${viewport.width}px 200%-text forged-record accounting remains reachable`,
      !geometry.overflow && geometry.height >= 44 && geometry.width >= 44,
      JSON.stringify(geometry),
    );
    await page.screenshot({
      path: `${outputDirectory}/canonical-id-marker-${viewport.width}-200-reduced.png`,
    });

    await page.locator("html[data-offline-ready='true']").waitFor({
      timeout: 15_000,
    });
    await context.setOffline(true);
    try {
      await page.reload({ waitUntil: "domcontentloaded" });
      await waitForSave(page);
      await openTab(page, "Jobs", touch);
      const offlineText = await page
        .locator(".settlement-recovery")
        .innerText();
      check(
        `${viewport.width}px offline reload still rejects stale marker forgery`,
        offlineText.includes(
          "Cause unknown — the retained settlement record is unavailable.",
        ) &&
          !offlineText.includes("Required memory exceeded available memory."),
        offlineText,
      );
    } finally {
      await context.setOffline(false);
    }

    check(
      `${viewport.width}px canonical-marker probe has no page or console errors`,
      errors.length === 0,
      JSON.stringify(errors),
    );
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true });
try {
  await probeCanonicalIdMarkerForgery(
    browser,
    { width: 320, height: 693 },
    false,
  );
  await probeCanonicalIdMarkerForgery(
    browser,
    { width: 393, height: 742 },
    true,
  );
} finally {
  await browser.close();
}

console.log(JSON.stringify({ findings }, null, 2));
if (findings.length > 0) process.exitCode = 1;
