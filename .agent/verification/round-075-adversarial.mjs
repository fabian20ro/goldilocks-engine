import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:42076";
const outputDirectory =
  process.env.OUTPUT_DIR ?? "/tmp/goldlocks-r075-adversarial";
const saveKey = "goldilocks-simulation-save-v4";
const findings = [];
const measurements = {};

await mkdir(outputDirectory, { recursive: true });

function check(id, condition, actual, expected) {
  if (!condition) findings.push({ id, actual, expected });
}

function attachErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

async function waitForReady(page) {
  await page.getByRole("heading", { name: "Goldilocks Engine" }).waitFor({
    timeout: 15_000,
  });
  await page.waitForFunction(
    (key) => {
      try {
        return localStorage.getItem(key) !== null;
      } catch {
        return false;
      }
    },
    saveKey,
    { timeout: 15_000 },
  );
}

async function openPage(browser, viewport, initScript = undefined) {
  const context = await browser.newContext({ serviceWorkers: "allow" });
  if (initScript) await context.addInitScript(initScript);
  const page = await context.newPage();
  const errors = attachErrors(page);
  await page.setViewportSize(viewport);
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await waitForReady(page);
  return { context, errors, page };
}

async function openTab(page, label) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: label, exact: true })
    .click();
  await page.waitForFunction(
    (expected) =>
      document
        .querySelector("nav[aria-label='Primary'] button[aria-current='page']")
        ?.getAttribute("aria-label") === expected,
    label,
    { timeout: 10_000 },
  );
}

async function rawJobsProbe(browser, viewport) {
  const record = await openPage(browser, viewport);
  const { context, errors, page } = record;
  const label = `${viewport.width}x${viewport.height}`;
  try {
    await openTab(page, "Jobs");
    const geometry = await page.evaluate(() => {
      const region = document.querySelector(".app-scroll-region");
      const nav = document
        .querySelector("nav[aria-label='Primary']")
        ?.getBoundingClientRect();
      const selected = document
        .querySelector(".selected-dispatch strong")
        ?.getBoundingClientRect();
      const queue = document
        .querySelector(".queue-one")
        ?.getBoundingClientRect();
      const smallButtons = [...document.querySelectorAll("button")]
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
        .flatMap((button) => {
          const box = button.getBoundingClientRect();
          return box.width < 44 || box.height < 44
            ? [button.getAttribute("aria-label") ?? button.textContent?.trim()]
            : [];
        });
      return {
        documentOverflow:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
        queueClearance: nav && queue ? nav.top - queue.bottom : null,
        scrollTop: region?.scrollTop ?? null,
        selectedClearance: nav && selected ? nav.top - selected.bottom : null,
        smallButtons,
      };
    });
    measurements[`jobs-${label}`] = geometry;
    check(
      `jobs-${label}-initial-scroll`,
      geometry.scrollTop === 0,
      geometry,
      "Jobs opens at its deliberate initial scroll position.",
    );
    check(
      `jobs-${label}-navigation-reserve`,
      geometry.selectedClearance !== null &&
        geometry.queueClearance !== null &&
        geometry.selectedClearance >= 8 &&
        geometry.queueClearance >= 8,
      geometry,
      "The selected workload and Queue 1 action retain the D-018 8px reserve above Primary navigation.",
    );
    check(
      `jobs-${label}-portrait-controls`,
      !geometry.documentOverflow && geometry.smallButtons.length === 0,
      geometry,
      "Raw portrait Jobs has no horizontal overflow and no visible action below 44 CSS pixels.",
    );
    await page.screenshot({ path: `${outputDirectory}/jobs-raw-${label}.png` });
    await page
      .getByRole("button", { name: "Queue one safe Interactive Chat job" })
      .click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='first-session-guide']")
          ?.getAttribute("data-onboarding-action") === "observe-settlement",
      { timeout: 10_000 },
    );
    const guide = await page.getByTestId("onboarding-explanation").innerText();
    check(
      `jobs-${label}-observe-rationale`,
      guide.includes("locked quote, configured cost, and outcome"),
      guide,
      "The complete current-step rationale remains visible after Queue 1.",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addStyleTag({
      content: ":root { font-size: 200% !important; }",
    });
    // Let the injected root-size rule finish reflowing the long Jobs document
    // before reading text fragments; immediate range rects can be stale here.
    await page.waitForTimeout(1_000);
    const scaled = await page.evaluate(() => {
      const textRects = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return [];
        const range = document.createRange();
        range.selectNodeContents(element);
        return [...range.getClientRects()].map((rect) => ({
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          top: rect.top,
        }));
      };
      const title = textRects(".selected-dispatch strong");
      const price = textRects(".selected-dispatch b");
      const titlePriceOverlaps = title.flatMap((titleRect) =>
        price
          .filter(
            (priceRect) =>
              Math.max(titleRect.left, priceRect.left) <
                Math.min(titleRect.right, priceRect.right) &&
              Math.max(titleRect.top, priceRect.top) <
                Math.min(titleRect.bottom, priceRect.bottom),
          )
          .map((priceRect) => ({ price: priceRect, title: titleRect })),
      );
      return {
        overflow:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
        reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
        title,
        titlePriceOverlaps,
        price,
      };
    });
    check(
      `jobs-${label}-scaled-motion`,
      !scaled.overflow &&
        scaled.reduced &&
        scaled.titlePriceOverlaps.length === 0,
      scaled,
      "200% text with reduced motion remains horizontally contained and keeps the selected workload name separate from its price.",
    );
    check(
      `jobs-${label}-errors`,
      errors.length === 0,
      errors,
      "No page or console errors.",
    );
  } finally {
    await page.close();
    await context.close();
  }
}

async function dragProbe(browser, kind, iteration) {
  const record = await openPage(browser, { width: 393, height: 900 });
  const { context, errors, page } = record;
  const label = `${kind}-${iteration}`;
  try {
    const source = page
      .getByTestId("slot-prepare")
      .locator('[data-module-id="basic-cleaner"]');
    const destination = page.getByTestId("slot-runtime");
    await source.scrollIntoViewIfNeeded();
    await destination.scrollIntoViewIfNeeded();
    const geometry = await page.evaluate(() => {
      const source = document.querySelector(
        "[data-testid='slot-prepare'] [data-module-id='basic-cleaner']",
      );
      const destination = document.querySelector(
        "[data-testid='slot-runtime']",
      );
      const nav = document
        .querySelector("nav[aria-label='Primary']")
        ?.getBoundingClientRect();
      const sourceBox = source?.getBoundingClientRect();
      const destinationBox = destination?.getBoundingClientRect();
      const visible = (box) =>
        Boolean(
          box &&
            nav &&
            box.left + box.width / 2 >= 0 &&
            box.left + box.width / 2 <= window.innerWidth &&
            box.top + box.height / 2 >= 0 &&
            box.top + box.height / 2 <= nav.top,
        );
      return {
        destinationBox,
        destinationVisible: visible(destinationBox),
        nav,
        sourceBox,
        sourceVisible: visible(sourceBox),
      };
    });
    check(
      `drag-${label}-endpoint-visibility`,
      geometry.sourceVisible && geometry.destinationVisible,
      geometry,
      "The regression sends actual pointer/touch center coordinates to two visible pipeline endpoints above fixed navigation.",
    );
    const from = await source.boundingBox();
    const to = await destination.boundingBox();
    if (!from || !to) throw new Error("Pipeline drag endpoint did not render");
    const start = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
    const end = { x: to.x + to.width / 2, y: to.y + to.height / 2 };
    if (kind === "pointer") {
      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      await page.mouse.move(end.x, end.y, { steps: 8 });
      await page.mouse.up();
    } else {
      const session = await context.newCDPSession(page);
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ ...start, id: 1 }],
      });
      for (let step = 1; step <= 8; step += 1) {
        await session.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [
            {
              x: start.x + ((end.x - start.x) * step) / 8,
              y: start.y + ((end.y - start.y) * step) / 8,
              id: 1,
            },
          ],
        });
      }
      await session.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await session.detach();
    }
    await page.waitForFunction(
      () => {
        const prepare = document.querySelector(
          "[data-testid='slot-prepare']",
        )?.textContent;
        const runtime = document.querySelector(
          "[data-testid='slot-runtime']",
        )?.textContent;
        return (
          prepare?.includes("Quantized Model") &&
          runtime?.includes("Basic Cleaner")
        );
      },
      { timeout: 10_000 },
    );
    const state = await page.evaluate(() => ({
      prepare: document.querySelector("[data-testid='slot-prepare']")
        ?.textContent,
      runtime: document.querySelector("[data-testid='slot-runtime']")
        ?.textContent,
    }));
    check(
      `drag-${label}-state`,
      state.runtime?.includes("Basic Cleaner") &&
        state.prepare?.includes("Quantized Model"),
      state,
      "A real drag reorders the two compatible active modules; it is not a selector-only or hidden endpoint assertion.",
    );
    check(
      `drag-${label}-errors`,
      errors.length === 0,
      errors,
      "No page or console errors.",
    );
  } finally {
    await page.close();
    await context.close();
  }
}

async function persistenceRecoveryProbe(browser) {
  const record = await openPage(browser, { width: 393, height: 742 });
  const { context, errors, page } = record;
  try {
    await page.locator("html[data-offline-ready='true']").waitFor({
      timeout: 15_000,
    });
    await page.waitForFunction(
      () => Boolean(navigator.serviceWorker.controller),
      {
        timeout: 15_000,
      },
    );
    await openTab(page, "Career");
    const freelance = page.getByLabel("Freelance delivery evening hours");
    await freelance.fill("3");
    await page.waitForTimeout(1_200);
    await openTab(page, "Jobs");
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await openTab(page, "Inspect");
    await openTab(page, "Career");
    check(
      "career-draft-tick-tab-retention",
      (await freelance.inputValue()) === "3",
      await freelance.inputValue(),
      "A human-paced uncommitted Career draft survives Worker ticks and ordinary tab visits.",
    );
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForReady(page);
    await openTab(page, "Career");
    check(
      "career-draft-reload-boundary",
      (await page
        .getByLabel("Freelance delivery evening hours")
        .inputValue()) === "0",
      await page.getByLabel("Freelance delivery evening hours").inputValue(),
      "A pre-Run draft is session-only and reload restores the durable schedule.",
    );
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Goldilocks Engine" }).waitFor({
      timeout: 15_000,
    });
    const offlineSave = await page.evaluate(
      (key) => localStorage.getItem(key),
      saveKey,
    );
    check(
      "pwa-offline-reload",
      offlineSave !== null,
      offlineSave,
      "The controlled PWA reloads offline without losing durable state.",
    );
    await context.setOffline(false);
    check(
      "persistence-recovery-errors",
      errors.length === 0,
      errors,
      "Draft, reload, and offline recovery emit no page or console errors.",
    );
  } finally {
    await page.close();
    await context.close();
  }

  const malformed = await openPage(browser, { width: 320, height: 693 }, () =>
    localStorage.setItem("goldilocks-simulation-save-v4", "{malformed"),
  );
  try {
    const guide = await malformed.page
      .getByTestId("first-session-guide")
      .innerText();
    check(
      "malformed-save-fails-safe",
      guide.includes("Queue one safe Interactive Chat job"),
      guide,
      "Malformed persisted state falls back to a fresh first-session guide.",
    );
    check(
      "malformed-save-errors",
      malformed.errors.length === 0,
      malformed.errors,
      "Malformed persisted state recovers without page or console errors.",
    );
  } finally {
    await malformed.page.close();
    await malformed.context.close();
  }
}

const browser = await chromium.launch({ headless: true });
try {
  const viewports = [
    { width: 320, height: 693 },
    { width: 393, height: 742 },
  ];
  for (const viewport of viewports) await rawJobsProbe(browser, viewport);
  if (process.env.R075_MODE !== "jobs") {
    for (let iteration = 1; iteration <= 10; iteration += 1) {
      await dragProbe(browser, "pointer", iteration);
      await dragProbe(browser, "touch", iteration);
    }
    await persistenceRecoveryProbe(browser);
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify({ measurements, findings }, null, 2));
if (findings.length > 0) process.exitCode = 1;
