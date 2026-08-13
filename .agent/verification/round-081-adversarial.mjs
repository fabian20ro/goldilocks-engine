import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:43182";
const outputDirectory = process.env.OUTPUT_DIR ?? "/private/tmp/goldlocks-r081";
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

async function openTab(page, tab, touch) {
  const control = page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: tab, exact: true });
  if (touch) await control.tap();
  else await control.click();
}

async function removeRuntime(page, touch) {
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
}

async function selectSpeed(page, speed, touch) {
  const simulation = page.getByTestId("simulation-context");
  const summary = simulation.locator(":scope > summary");
  if (!(await simulation.evaluate((element) => element.open))) {
    if (touch) await summary.tap();
    else {
      await summary.focus();
      await page.keyboard.press("Space");
    }
  }
  const control = simulation.getByRole("button", { name: speed, exact: true });
  if (touch) await control.tap();
  else {
    await control.focus();
    await page.keyboard.press("Enter");
  }
}

async function settleFailure(page, touch) {
  await openTab(page, "Jobs", touch);
  const queue = page.getByRole("button", {
    name: "Queue one safe Interactive Chat job",
    exact: true,
  });
  if (touch) await queue.tap();
  else await queue.click();
  await selectSpeed(page, "64×", touch);
  await page.waitForFunction((key) => {
    const raw = localStorage.getItem(key);
    return raw !== null && JSON.parse(raw).lastSettlement?.failed === 1;
  }, saveKey);
}

async function writeForgedStructuralProvenance(page) {
  await openTab(page, "Inspect", false);
  await page.getByRole("button", { name: "Capture", exact: true }).click();
  await page.waitForFunction((key) => {
    const raw = localStorage.getItem(key);
    return (
      raw !== null &&
      JSON.parse(raw).ledger.at(-1)?.message ===
        "Current configuration captured for comparison."
    );
  }, saveKey);
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null");
    const decoy = state.ledger.at(-1);
    decoy.kind = "failure";
    decoy.settlementTaskId = state.lastSettlement.taskId;
    decoy.settlementFailureCause = "memory-capacity-exceeded";
    decoy.directCause = "Forged unrelated direct cause.";
    state.lastSettlement.ledgerEventId = decoy.id;
    localStorage.setItem(key, JSON.stringify(state));
  }, saveKey);
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForSave(page);
  await openTab(page, "Jobs", false);
}

async function inspectForgedProvenance(browser, viewport, touch) {
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
    await removeRuntime(page, touch);
    await settleFailure(page, touch);
    await writeForgedStructuralProvenance(page);

    const record = page.locator(".settlement-recovery");
    const text = await record.innerText();
    check(
      `${viewport.width}px stale structural provenance remains unknown`,
      text.includes(
        "Cause unknown — the retained settlement record is unavailable.",
      ) && !text.includes("Required memory exceeded available memory."),
      text,
    );

    const accounting = page.getByTestId("settlement-accounting");
    const summary = accounting.locator(":scope > summary");
    if (touch) await summary.tap();
    else {
      await summary.focus();
      await page.keyboard.press("Space");
    }
    check(
      `${viewport.width}px stale record retains native accounting disclosure`,
      (await accounting.count()) === 1 &&
        (await accounting.evaluate((element) => element.tagName)) ===
          "DETAILS" &&
        (await accounting.evaluate((element) => element.open)),
      await accounting.evaluate((element) => element.outerHTML),
    );

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addStyleTag({
      content: ":root { font-size: 200% !important; }",
    });
    await record.scrollIntoViewIfNeeded();
    const geometry = await page.evaluate(() => {
      const target = document.querySelector(".settlement-accounting > summary");
      const box = target?.getBoundingClientRect();
      return {
        overflow:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
        height: box?.height ?? 0,
        width: box?.width ?? 0,
      };
    });
    check(
      `${viewport.width}px 200% stale-record disclosure remains reachable`,
      !geometry.overflow && geometry.height >= 44 && geometry.width >= 44,
      JSON.stringify(geometry),
    );
    await page.screenshot({
      path: `${outputDirectory}/forged-provenance-${viewport.width}-200-reduced.png`,
    });
    check(
      `${viewport.width}px forged-provenance page and console errors`,
      errors.length === 0,
      JSON.stringify(errors),
    );
  } finally {
    await context.close();
  }
}

async function inspectFutureIdCollision(browser) {
  const context = await browser.newContext({
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
    await removeRuntime(page, false);
    await settleFailure(page, false);
    await openTab(page, "Inspect", false);
    await page.getByRole("button", { name: "Capture", exact: true }).click();
    await openTab(page, "Jobs", false);
    await page.getByRole("button", { name: "Queue 1", exact: true }).click();
    await page.waitForFunction((key) => {
      const raw = localStorage.getItem(key);
      return raw !== null && JSON.parse(raw).jobs.queued === 1;
    }, saveKey);
    const before = await page.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null");
      const target = state.ledger.find(
        (event) =>
          event.message === "Current configuration captured for comparison.",
      );
      target.id = `evt-${state.tick + 10_000}-${state.eventSequence + 1}`;
      localStorage.setItem(key, JSON.stringify(state));
      return { eventSequence: state.eventSequence, tick: state.tick };
    }, saveKey);
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForSave(page);
    await selectSpeed(page, "64×", false);
    await page.waitForTimeout(1_200);
    const after = await page.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null");
      return {
        eventSequence: state.eventSequence,
        queued: state.jobs.queued,
        tick: state.tick,
      };
    }, saveKey);
    check(
      "future ledger-ID collision does not freeze Worker progress after reload",
      after.tick > before.tick,
      JSON.stringify({ after, before }),
    );
    check(
      "future-ID collision page and console errors",
      errors.length === 0,
      JSON.stringify(errors),
    );
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true });
try {
  await inspectForgedProvenance(browser, { width: 320, height: 693 }, false);
  await inspectForgedProvenance(browser, { width: 393, height: 742 }, true);
  await inspectFutureIdCollision(browser);
} finally {
  await browser.close();
}

console.log(JSON.stringify({ findings }, null, 2));
if (findings.length > 0) process.exitCode = 1;
