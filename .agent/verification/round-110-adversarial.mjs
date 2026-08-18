import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const port = Number(process.env.ROUND_110_PORT ?? 43911);
const baseURL = `http://127.0.0.1:${port}`;
const saveKey = "goldilocks-simulation-save-v4";
const tabs = [
  "Build",
  "Jobs",
  "Career",
  "Upgrades",
  "Inspect",
  "Research",
  "Lab",
  "World",
];
const findings = [];

function record(id, expected, actual, evidence) {
  if (expected !== actual) findings.push({ id, expected, actual, evidence });
}

async function waitForServer() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(`${baseURL}/`);
      if (response.ok) return;
    } catch {
      // Vite is still starting.
    }
    await delay(100);
  }
  throw new Error(`server did not become ready at ${baseURL}`);
}

function startServer() {
  return spawn("./scripts/run-e2e", [], {
    cwd: new URL("../../", import.meta.url),
    env: { ...process.env, E2E_PORT: String(port), FORCE_COLOR: "0" },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function openTab(page, name) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name, exact: true })
    .click();
}

async function pageErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror:${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console:${message.text()}`);
  });
  return errors;
}

async function assertPortrait(page, id) {
  const geometry = await page.evaluate(() => {
    const pipeline = document.querySelector("[data-testid=pipeline]");
    const buttons = [...document.querySelectorAll("button")]
      .filter((button) => {
        const style = getComputedStyle(button);
        const box = button.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          box.width > 0 &&
          box.height > 0
        );
      })
      .map((button) => {
        const box = button.getBoundingClientRect();
        return {
          label:
            button.getAttribute("aria-label") ?? button.textContent?.trim(),
          width: box.width,
          height: box.height,
        };
      });
    return {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      pipelineScroll: pipeline
        ? {
            scrollHeight: pipeline.scrollHeight,
            clientHeight: pipeline.clientHeight,
          }
        : null,
      buttons,
    };
  });
  record(
    `${id}-document-overflow`,
    true,
    geometry.scrollWidth <= geometry.clientWidth,
    geometry,
  );
  record(
    `${id}-pipeline-single-scroll-owner`,
    true,
    geometry.pipelineScroll === null ||
      geometry.pipelineScroll.scrollHeight ===
        geometry.pipelineScroll.clientHeight,
    geometry,
  );
  const undersized = geometry.buttons.filter(
    (button) => button.width < 44 || button.height < 44,
  );
  record(`${id}-button-targets`, 0, undersized.length, undersized.slice(0, 8));
}

async function inspectTabSet(page, width) {
  const errors = await pageErrors(page);
  await page.goto(`${baseURL}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="first-session-guide"]');
  const navLabels = await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button")
    .locator(".tab-label")
    .allTextContents();
  record(
    `nav-order-${width}`,
    tabs.join("|"),
    navLabels.map((label) => label.trim()).join("|"),
    navLabels,
  );
  for (const tab of tabs) {
    await openTab(page, tab);
    const summary = page.getByTestId("destination-decision");
    record(`summary-count-${width}-${tab}`, 1, await summary.count(), tab);
    if ((await summary.count()) === 1) {
      record(
        `summary-destination-${width}-${tab}`,
        tab,
        await summary.getAttribute("data-editorial-destination"),
        await summary.getAttribute("data-editorial-next-action"),
      );
      for (const attr of [
        "data-editorial-state",
        "data-editorial-consequence",
        "data-editorial-cost-risk",
        "data-editorial-next-action",
      ]) {
        const value = await summary.getAttribute(attr);
        record(
          `summary-live-${width}-${tab}-${attr}`,
          true,
          Boolean(value?.trim()),
          value,
        );
      }
    }
    const guideCount = await page.getByTestId("first-session-guide").count();
    record(
      `onboarding-single-${width}-${tab}`,
      true,
      guideCount <= 1,
      guideCount,
    );
    if (["Research", "Lab", "World"].includes(tab)) {
      const locked = await page.getByTestId("locked-state").count();
      if (locked > 0) {
        const text = await page.getByTestId("locked-state").first().innerText();
        record(
          `locked-contract-${width}-${tab}`,
          true,
          /requirement|progress|next action/i.test(text),
          text,
        );
      }
    }
    await assertPortrait(page, `${width}-${tab}`);
  }
  record("initial-page-errors", 0, errors.length, errors);
}

async function malformedRestore(browser) {
  const context = await browser.newContext({
    viewport: { width: 393, height: 742 },
  });
  await context.addInitScript(
    ({ key }) => localStorage.setItem(key, "{malformed"),
    { key: saveKey },
  );
  const page = await context.newPage();
  const errors = await pageErrors(page);
  await page.goto(`${baseURL}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="first-session-guide"]');
  record(
    "malformed-recovery-loaded",
    true,
    (await page.getByRole("navigation", { name: "Primary" }).count()) === 1,
    "navigation",
  );
  record("malformed-recovery-errors", 0, errors.length, errors);
  await context.close();
}

async function offlineLifecycle(browser) {
  const context = await browser.newContext({
    viewport: { width: 320, height: 693 },
    serviceWorkers: "allow",
  });
  const page = await context.newPage();
  const errors = await pageErrors(page);
  await page.goto(`${baseURL}/`, { waitUntil: "domcontentloaded" });
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Jobs", exact: true })
    .click();
  await page
    .locator('html[data-offline-ready="true"]')
    .waitFor({ timeout: 15_000 });
  const workerControlled = await page.evaluate(() =>
    Boolean(navigator.serviceWorker.controller),
  );
  if (!workerControlled)
    throw new Error(
      "offline probe did not reach a service-worker-controlled page",
    );
  await context.setOffline(true);
  let reloadError = null;
  try {
    await page.reload({ waitUntil: "domcontentloaded" });
  } catch (error) {
    reloadError = String(error);
  }
  record(
    "offline-reload-rendered",
    true,
    (await page.getByRole("navigation", { name: "Primary" }).count()) === 1,
    reloadError,
  );
  record(
    "offline-reload-errors",
    0,
    errors.filter((error) => !error.includes("Failed to load resource")).length,
    errors,
  );
  await context.setOffline(false);
  await page.reload({ waitUntil: "domcontentloaded" });
  record(
    "online-reload-rendered",
    true,
    (await page.getByRole("navigation", { name: "Primary" }).count()) === 1,
    "navigation",
  );
  await context.close();
}

async function scaledTouchKeyboard(browser) {
  const context = await browser.newContext({
    viewport: { width: 320, height: 693 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  const errors = await pageErrors(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${baseURL}/`, { waitUntil: "domcontentloaded" });
  await page.addStyleTag({ content: ":root { font-size: 200% !important; }" });
  const nav = page.getByRole("navigation", { name: "Primary" });
  const world = nav.getByRole("button", { name: "World", exact: true });
  await world.focus();
  await page.keyboard.press("Enter");
  record(
    "keyboard-active-world",
    "page",
    await world.getAttribute("aria-current"),
    await nav.evaluate((element) => element.scrollLeft),
  );
  await nav.getByRole("button", { name: "Build", exact: true }).tap();
  await assertPortrait(page, "scaled-reduced-motion-touch");
  record("scaled-page-errors", 0, errors.length, errors);
  await context.close();
}

async function expandedTopology(browser) {
  const context = await browser.newContext({
    viewport: { width: 320, height: 693 },
  });
  const page = await context.newPage();
  await page.goto(`${baseURL}/`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    (key) => localStorage.getItem(key) !== null,
    saveKey,
  );
  const serialized = await page.evaluate(
    (key) => localStorage.getItem(key),
    saveKey,
  );
  if (!serialized) throw new Error("initial save missing");
  const state = JSON.parse(serialized);
  state.resources.money = 45;
  await page.close();
  await context.close();

  const seeded = await browser.newContext({
    viewport: { width: 320, height: 693 },
  });
  await seeded.addInitScript(
    ({ key, value }) => localStorage.setItem(key, value),
    {
      key: saveKey,
      value: JSON.stringify(state),
    },
  );
  const expanded = await seeded.newPage();
  await expanded.goto(`${baseURL}/`, { waitUntil: "domcontentloaded" });
  await expanded
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Upgrades", exact: true })
    .click();
  await expanded
    .getByRole("button", { name: "Buy Workstation Expansion I for $45.00" })
    .click();
  await expanded
    .getByRole("button", { name: "Activate six-position pipeline" })
    .click();
  await expanded
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Build", exact: true })
    .click();
  record(
    "expanded-slot-count",
    8,
    await expanded.getByTestId("pipeline").locator(".pipeline-slot").count(),
    "pipeline slots",
  );
  const emptyCount = await expanded
    .getByTestId("pipeline")
    .locator(".pipeline-slot")
    .filter({ hasText: "Empty / bypassed" })
    .count();
  record("expanded-empty-slots", 3, emptyCount, "new process positions");
  await seeded.close();
}

async function main() {
  const server = startServer();
  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch({ headless: true });
    for (const viewport of [
      { width: 320, height: 693 },
      { width: 393, height: 742 },
    ]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      await inspectTabSet(page, viewport.width);
      await context.close();
    }
    await malformedRestore(browser);
    await offlineLifecycle(browser);
    await scaledTouchKeyboard(browser);
    await expandedTopology(browser);
  } finally {
    await browser?.close();
    if (server && !server.killed) {
      server.kill("SIGTERM");
      await delay(250);
      if (!server.killed) server.kill("SIGKILL");
    }
  }
  console.log(
    JSON.stringify(
      { candidate: process.env.CANDIDATE_SHA ?? "unknown", findings },
      null,
      2,
    ),
  );
  process.exitCode = findings.length > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
