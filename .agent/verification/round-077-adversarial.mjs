import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:42077";
const outputDirectory = process.env.OUTPUT_DIR ?? "/tmp/goldlocks-r077";
const saveKey = "goldilocks-simulation-save-v4";
const findings = [];
const evidence = {};

await mkdir(outputDirectory, { recursive: true });

function check(id, condition, actual, expected) {
  if (!condition) findings.push({ actual, expected, id });
}

function observeErrors(page) {
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

async function openPage(browser, viewport, initScript) {
  const context = await browser.newContext({ serviceWorkers: "allow" });
  if (initScript) await context.addInitScript(initScript);
  const page = await context.newPage();
  await page.setViewportSize(viewport);
  const errors = observeErrors(page);
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await waitForReady(page);
  return { context, errors, page };
}

async function openTab(page, label) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { exact: true, name: label })
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

function selectedWorkloadGeometry() {
  const rangeBoxes = (selector) => {
    const element = document.querySelector(selector);
    if (!element) return { ranges: [], text: "" };
    const range = document.createRange();
    range.selectNodeContents(element);
    return {
      ranges: [...range.getClientRects()].map((box) => ({
        bottom: box.bottom,
        left: box.left,
        right: box.right,
        top: box.top,
      })),
      text: element.textContent?.trim() ?? "",
    };
  };
  const intersects = (a, b) =>
    Math.max(a.left, b.left) < Math.min(a.right, b.right) &&
    Math.max(a.top, b.top) < Math.min(a.bottom, b.bottom);
  const nav = document
    .querySelector("nav[aria-label='Primary']")
    ?.getBoundingClientRect();
  const card = document.querySelector(".selected-dispatch");
  const header = document.querySelector(".selected-dispatch > div");
  const queue = document.querySelector(".queue-one")?.getBoundingClientRect();
  const title = rangeBoxes(".selected-dispatch strong");
  const price = rangeBoxes(".selected-dispatch b");
  const cardStyle = card ? getComputedStyle(card) : null;
  const headerStyle = header ? getComputedStyle(header) : null;
  const rootStyle = getComputedStyle(document.documentElement);
  const rootWidth = document.documentElement.clientWidth;
  const allText = [...title.ranges, ...price.ranges];
  const visibleButtons = [...document.querySelectorAll("button")].filter(
    (button) => {
      const style = getComputedStyle(button);
      const box = button.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        box.width > 0 &&
        box.height > 0
      );
    },
  );
  return {
    cardInlineSize: card?.getBoundingClientRect().width ?? null,
    cardThreshold: cardStyle
      ? Number.parseFloat(cardStyle.fontSize) * 12
      : null,
    containerName: cardStyle?.containerName ?? null,
    containerType: cardStyle?.containerType ?? null,
    documentOverflow: document.documentElement.scrollWidth > rootWidth,
    gridTemplateAreas: headerStyle?.gridTemplateAreas ?? null,
    gridTrackCount: headerStyle
      ? headerStyle.gridTemplateColumns.trim().split(/\s+/).length
      : null,
    queueClearance: nav && queue ? nav.top - queue.bottom : null,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    rootFontSize: rootStyle.fontSize,
    scrollTop: document.querySelector(".app-scroll-region")?.scrollTop ?? null,
    title,
    price,
    textInViewport: allText.every(
      (box) => box.left >= 0 && box.right <= rootWidth && box.right > box.left,
    ),
    titlePriceIntersections: title.ranges.flatMap((titleBox) =>
      price.ranges
        .filter((priceBox) => intersects(titleBox, priceBox))
        .map((priceBox) => ({ price: priceBox, title: titleBox })),
    ),
    undersizedControls: visibleButtons.flatMap((button) => {
      const box = button.getBoundingClientRect();
      return box.width < 44 || box.height < 44
        ? [button.getAttribute("aria-label") ?? button.textContent?.trim()]
        : [];
    }),
  };
}

function validRawGeometry(geometry) {
  return (
    geometry.containerName === "selected-workload" &&
    geometry.containerType === "inline-size" &&
    geometry.cardInlineSize !== null &&
    geometry.cardThreshold !== null &&
    geometry.cardInlineSize > geometry.cardThreshold &&
    geometry.gridTemplateAreas === "none" &&
    geometry.gridTrackCount === 3 &&
    geometry.queueClearance !== null &&
    geometry.queueClearance >= 8 &&
    geometry.scrollTop === 0 &&
    !geometry.documentOverflow &&
    geometry.title.text.length > 0 &&
    geometry.price.text.length > 0 &&
    geometry.textInViewport &&
    geometry.titlePriceIntersections.length === 0 &&
    geometry.undersizedControls.length === 0
  );
}

function validScaledGeometry(geometry) {
  return (
    geometry.reducedMotion &&
    geometry.rootFontSize === "32px" &&
    geometry.cardInlineSize !== null &&
    geometry.cardThreshold !== null &&
    geometry.cardInlineSize <= geometry.cardThreshold &&
    geometry.gridTemplateAreas === '"glyph summary" ". price"' &&
    geometry.gridTrackCount === 2 &&
    !geometry.documentOverflow &&
    geometry.title.text.length > 0 &&
    geometry.price.text.length > 0 &&
    geometry.textInViewport &&
    geometry.titlePriceIntersections.length === 0 &&
    geometry.undersizedControls.length === 0
  );
}

async function jobsResponsiveProbe(browser, viewport, fontFamily) {
  const label = `${viewport.width}x${viewport.height}-${fontFamily ? "font" : "default"}`;
  const { context, errors, page } = await openPage(browser, viewport);
  try {
    await openTab(page, "Jobs");
    const initialExplanation = await page
      .getByTestId("onboarding-explanation")
      .innerText();
    check(
      `onboarding-${label}-queue-rationale`,
      initialExplanation.includes(
        "Interactive Chat is the reliable first route",
      ),
      initialExplanation,
      "The first visible handoff explains why the safe starter is currently recommended.",
    );

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
    const observeExplanation = await page
      .getByTestId("onboarding-explanation")
      .innerText();
    check(
      `onboarding-${label}-observe-rationale`,
      observeExplanation.includes("locked quote, configured cost, and outcome"),
      observeExplanation,
      "The rail explains where the accepted task's accounting and outcome are observed.",
    );

    await page.getByRole("button", { name: "64×", exact: true }).click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='first-session-guide']")
          ?.getAttribute("data-onboarding-action") === "earn-remainder",
      { timeout: 10_000 },
    );
    const earnExplanation = await page
      .getByTestId("onboarding-explanation")
      .innerText();
    check(
      `onboarding-${label}-earn-rationale`,
      earnExplanation.includes("Precision Cleaner costs $4.00"),
      earnExplanation,
      "The purchase handoff states the live recommended-module price and remaining purpose.",
    );

    if (fontFamily)
      await page.addStyleTag({
        content: `:root { font-family: ${fontFamily} !important; }`,
      });
    await page.waitForTimeout(250);
    const raw = await page.evaluate(selectedWorkloadGeometry);
    evidence[`jobs-${label}-raw`] = raw;
    check(
      `jobs-${label}-raw-compact-reserve`,
      validRawGeometry(raw),
      raw,
      "At raw text the post-settlement selected card retains the compact three-track layout and Queue 1 clears fixed navigation by at least 8px.",
    );
    await page.screenshot({
      path: `${outputDirectory}/jobs-${label}-raw.png`,
      fullPage: true,
    });

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addStyleTag({
      content: ":root { font-size: 200% !important; }",
    });
    await page.waitForTimeout(350);
    const scaled = await page.evaluate(selectedWorkloadGeometry);
    evidence[`jobs-${label}-scaled`] = scaled;
    check(
      `jobs-${label}-scaled-reflow`,
      validScaledGeometry(scaled),
      scaled,
      "At 200% text with reduced motion, the card changes to a two-track/two-row layout and retains full, separate title and price text without overflow or undersized controls.",
    );
    await page.locator(".selected-dispatch").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `${outputDirectory}/jobs-${label}-scaled.png`,
      fullPage: true,
    });

    check(
      `jobs-${label}-errors`,
      errors.length === 0,
      errors,
      "Responsive Jobs and onboarding transitions emit no page or console errors.",
    );
  } finally {
    await page.close();
    await context.close();
  }
}

async function reorderProbe(browser, inputKind) {
  const { context, errors, page } = await openPage(browser, {
    height: 900,
    width: 393,
  });
  try {
    const source = page
      .getByTestId("slot-prepare")
      .locator('[data-module-id="basic-cleaner"]');
    const destination = page.getByTestId("slot-runtime");
    await source.scrollIntoViewIfNeeded();
    await destination.scrollIntoViewIfNeeded();
    const [from, to, endpoints] = await Promise.all([
      source.boundingBox(),
      destination.boundingBox(),
      page.evaluate(() => {
        const nav = document
          .querySelector("nav[aria-label='Primary']")
          ?.getBoundingClientRect();
        const source = document
          .querySelector(
            "[data-testid='slot-prepare'] [data-module-id='basic-cleaner']",
          )
          ?.getBoundingClientRect();
        const destination = document
          .querySelector("[data-testid='slot-runtime']")
          ?.getBoundingClientRect();
        const centerVisible = (box) =>
          Boolean(
            box &&
              nav &&
              box.left + box.width / 2 >= 0 &&
              box.left + box.width / 2 <= window.innerWidth &&
              box.top + box.height / 2 >= 0 &&
              box.top + box.height / 2 <= nav.top,
          );
        return {
          destinationVisible: centerVisible(destination),
          sourceVisible: centerVisible(source),
        };
      }),
    ]);
    if (!from || !to) throw new Error(`${inputKind} drag endpoint missing`);
    check(
      `drag-${inputKind}-visible-endpoints`,
      endpoints.sourceVisible && endpoints.destinationVisible,
      endpoints,
      "Both actual coordinate endpoints are visible above fixed navigation before input is dispatched.",
    );
    const start = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
    const end = { x: to.x + to.width / 2, y: to.y + to.height / 2 };
    if (inputKind === "pointer") {
      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      await page.mouse.move(end.x, end.y, { steps: 8 });
      await page.mouse.up();
    } else {
      const cdp = await context.newCDPSession(page);
      await cdp.send("Input.dispatchTouchEvent", {
        touchPoints: [{ ...start, id: 1 }],
        type: "touchStart",
      });
      for (let step = 1; step <= 8; step += 1) {
        await cdp.send("Input.dispatchTouchEvent", {
          touchPoints: [
            {
              id: 1,
              x: start.x + ((end.x - start.x) * step) / 8,
              y: start.y + ((end.y - start.y) * step) / 8,
            },
          ],
          type: "touchMove",
        });
      }
      await cdp.send("Input.dispatchTouchEvent", {
        touchPoints: [],
        type: "touchEnd",
      });
      await cdp.detach();
    }
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='slot-prepare']")
          ?.textContent?.includes("Quantized Model") &&
        document
          .querySelector("[data-testid='slot-runtime']")
          ?.textContent?.includes("Basic Cleaner"),
      { timeout: 10_000 },
    );
    await page.waitForTimeout(200);
    const beforeReload = await page.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null");
      return {
        prepare: document.querySelector("[data-testid='slot-prepare']")
          ?.textContent,
        runtime: document.querySelector("[data-testid='slot-runtime']")
          ?.textContent,
        slots: state?.slots,
      };
    }, saveKey);
    check(
      `drag-${inputKind}-durable-swap`,
      beforeReload.prepare?.includes("Quantized Model") &&
        beforeReload.runtime?.includes("Basic Cleaner") &&
        beforeReload.slots?.some(
          (slot) =>
            slot.slotId === "prepare" && slot.moduleId === "quantized-model",
        ) &&
        beforeReload.slots?.some(
          (slot) =>
            slot.slotId === "runtime" && slot.moduleId === "basic-cleaner",
        ),
      beforeReload,
      "Actual input swaps both DOM endpoints and the persisted ordered slots.",
    );
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForReady(page);
    const afterReload = await page.evaluate(() => ({
      prepare: document.querySelector("[data-testid='slot-prepare']")
        ?.textContent,
      runtime: document.querySelector("[data-testid='slot-runtime']")
        ?.textContent,
    }));
    evidence[`drag-${inputKind}`] = { afterReload, beforeReload, endpoints };
    check(
      `drag-${inputKind}-reload`,
      afterReload.prepare?.includes("Quantized Model") &&
        afterReload.runtime?.includes("Basic Cleaner"),
      afterReload,
      "The swapped pipeline survives a normal reload.",
    );
    check(
      `drag-${inputKind}-errors`,
      errors.length === 0,
      errors,
      "Actual input and reload emit no page or console errors.",
    );
  } finally {
    await page.close();
    await context.close();
  }
}

async function recoveryProbe(browser) {
  const online = await openPage(browser, { height: 742, width: 393 });
  try {
    await online.page.locator("html[data-offline-ready='true']").waitFor({
      timeout: 15_000,
    });
    await online.page.waitForFunction(
      () => Boolean(navigator.serviceWorker.controller),
      { timeout: 15_000 },
    );
    await openTab(online.page, "Jobs");
    await online.page
      .getByRole("button", { name: "Queue one safe Interactive Chat job" })
      .click();
    await online.page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='first-session-guide']")
          ?.getAttribute("data-onboarding-action") === "observe-settlement",
      { timeout: 10_000 },
    );
    await online.context.setOffline(true);
    await online.page.reload({ waitUntil: "domcontentloaded" });
    await online.page
      .getByRole("heading", { name: "Goldilocks Engine" })
      .waitFor({ timeout: 15_000 });
    const offline = await online.page.evaluate(
      (key) => ({
        action: document
          .querySelector("[data-testid='first-session-guide']")
          ?.getAttribute("data-onboarding-action"),
        controlled: Boolean(navigator.serviceWorker.controller),
        saved: localStorage.getItem(key) !== null,
      }),
      saveKey,
    );
    evidence.offlineRecovery = offline;
    check(
      "pwa-offline-reload-preserves-accepted-starter",
      offline.controlled &&
        offline.saved &&
        offline.action === "observe-settlement",
      offline,
      "A controlled offline reload keeps the durable accepted starter and observation step.",
    );
    await online.context.setOffline(false);
    check(
      "pwa-offline-reload-errors",
      online.errors.length === 0,
      online.errors,
      "Controlled offline reload emits no page or console errors.",
    );
  } finally {
    await online.page.close();
    await online.context.close();
  }

  const malformed = await openPage(browser, { height: 693, width: 320 }, () =>
    localStorage.setItem("goldilocks-simulation-save-v4", "{malformed"),
  );
  try {
    await openTab(malformed.page, "Jobs");
    const recovery = await malformed.page.evaluate(() => ({
      action: document
        .querySelector("[data-testid='first-session-guide']")
        ?.getAttribute("data-onboarding-action"),
      queue: document.querySelector(".queue-one")?.textContent?.trim(),
    }));
    evidence.malformedRecovery = recovery;
    check(
      "malformed-save-fails-safe",
      recovery.action === "queue-starter" &&
        recovery.queue === "Queue one safe Interactive Chat job",
      recovery,
      "Malformed persisted data fails closed to an actionable fresh starter state.",
    );
    check(
      "malformed-save-errors",
      malformed.errors.length === 0,
      malformed.errors,
      "Malformed-state recovery emits no page or console errors.",
    );
  } finally {
    await malformed.page.close();
    await malformed.context.close();
  }
}

const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of [
    { height: 693, width: 320 },
    { height: 742, width: 393 },
  ]) {
    await jobsResponsiveProbe(browser, viewport);
    await jobsResponsiveProbe(browser, viewport, "Arial, sans-serif");
  }
  await reorderProbe(browser, "pointer");
  await reorderProbe(browser, "touch");
  await recoveryProbe(browser);
} finally {
  await browser.close();
}

console.log(JSON.stringify({ evidence, findings }, null, 2));
if (findings.length > 0) process.exitCode = 1;
