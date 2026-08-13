import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:42076";
const outputDirectory =
  process.env.OUTPUT_DIR ?? "/tmp/goldlocks-r076-adversarial";
const saveKey = "goldilocks-simulation-save-v4";
const findings = [];
const evidence = {};

await mkdir(outputDirectory, { recursive: true });

function check(id, condition, actual, expected) {
  if (!condition) findings.push({ actual, expected, id });
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

async function openRecord(browser, viewport, initScript = undefined) {
  const context = await browser.newContext({ serviceWorkers: "allow" });
  if (initScript) await context.addInitScript(initScript);
  const page = await context.newPage();
  await page.setViewportSize(viewport);
  const errors = attachErrors(page);
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await waitForReady(page);
  return { context, errors, page, viewport };
}

async function closeRecord(record) {
  await record.page.close();
  await record.context.close();
}

async function activeTab(page, name) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name, exact: true })
    .click();
  await page.waitForFunction(
    (expected) =>
      document
        .querySelector("nav[aria-label='Primary'] button[aria-current='page']")
        ?.getAttribute("aria-label") === expected,
    name,
    { timeout: 10_000 },
  );
}

async function savedState(page) {
  const serialized = await page.evaluate(
    (key) => localStorage.getItem(key),
    saveKey,
  );
  if (serialized === null)
    throw new Error("Expected a durable simulation save");
  return JSON.parse(serialized);
}

async function seedNextBoot(record, state, marker) {
  const { context, page, viewport } = record;
  await page.close();
  await context.addInitScript(
    ({ key, marker, serialized }) => {
      if (sessionStorage.getItem(marker) === "seeded") return;
      sessionStorage.setItem(marker, "seeded");
      localStorage.setItem(key, serialized);
    },
    { key: saveKey, marker, serialized: JSON.stringify(state) },
  );
  const restored = await context.newPage();
  await restored.setViewportSize(viewport);
  const errors = attachErrors(restored);
  await restored.goto(baseURL, { waitUntil: "domcontentloaded" });
  await waitForReady(restored);
  return { context, errors, page: restored, viewport };
}

function rangeLayout() {
  const readRanges = (selector) => {
    const element = document.querySelector(selector);
    if (!element) return { element: null, ranges: [] };
    const range = document.createRange();
    range.selectNodeContents(element);
    return {
      element: {
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        text: element.textContent?.trim() ?? "",
        visibility: getComputedStyle(element).visibility,
      },
      ranges: [...range.getClientRects()].map((box) => ({
        bottom: box.bottom,
        left: box.left,
        right: box.right,
        top: box.top,
      })),
    };
  };
  const intersects = (left, right) =>
    Math.max(left.left, right.left) < Math.min(left.right, right.right) &&
    Math.max(left.top, right.top) < Math.min(left.bottom, right.bottom);
  const title = readRanges(".selected-dispatch strong");
  const price = readRanges(".selected-dispatch b");
  const width = document.documentElement.clientWidth;
  const allRanges = [...title.ranges, ...price.ranges];
  return {
    overflow: document.documentElement.scrollWidth > width,
    price,
    rangesWithinViewport: allRanges.every(
      (box) => box.left >= 0 && box.right <= width && box.right > box.left,
    ),
    title,
    titlePriceOverlaps: title.ranges.flatMap((titleBox) =>
      price.ranges
        .filter((priceBox) => intersects(titleBox, priceBox))
        .map((priceBox) => ({ price: priceBox, title: titleBox })),
    ),
  };
}

async function jobsLayoutProbe(browser, viewport) {
  const record = await openRecord(browser, viewport);
  const { context, errors, page } = record;
  const label = `${viewport.width}x${viewport.height}`;
  try {
    await activeTab(page, "Jobs");
    const raw = await page.evaluate(() => {
      const nav = document
        .querySelector("nav[aria-label='Primary']")
        ?.getBoundingClientRect();
      const queue = document
        .querySelector(".queue-one")
        ?.getBoundingClientRect();
      const title = document
        .querySelector(".selected-dispatch strong")
        ?.getBoundingClientRect();
      const scrollTop = document.querySelector(".app-scroll-region")?.scrollTop;
      const undersized = [...document.querySelectorAll("button")]
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
        scrollTop,
        titleClearance: nav && title ? nav.top - title.bottom : null,
        undersized,
      };
    });
    const rawText = await page.evaluate(rangeLayout);
    evidence[`jobs-raw-${label}`] = { raw, text: rawText };
    check(
      `jobs-${label}-raw-reserve`,
      raw.scrollTop === 0 &&
        raw.queueClearance !== null &&
        raw.titleClearance !== null &&
        raw.queueClearance >= 8 &&
        raw.titleClearance >= 8,
      raw,
      "Initial Jobs title and Queue 1 retain D-018's 8px reserve above fixed Primary navigation.",
    );
    check(
      `jobs-${label}-raw-layout`,
      !raw.documentOverflow &&
        raw.undersized.length === 0 &&
        !rawText.overflow &&
        rawText.titlePriceOverlaps.length === 0 &&
        rawText.rangesWithinViewport &&
        rawText.title.element?.text.length > 0 &&
        rawText.price.element?.text.length > 0,
      { raw, rawText },
      "At 100% text the selected workload title and price are independently complete, visible, non-overlapping, and horizontally contained; visible controls are at least 44px.",
    );
    await page.screenshot({
      path: `${outputDirectory}/jobs-${label}-100.png`,
      fullPage: true,
    });

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
    const observeText = await page
      .getByTestId("onboarding-explanation")
      .innerText();
    check(
      `jobs-${label}-observe-rationale`,
      observeText.includes("locked quote, configured cost, and outcome"),
      observeText,
      "Queueing the starter preserves the human-readable observe-settlement rationale.",
    );

    for (const scale of [100, 200]) {
      await page.emulateMedia({ reducedMotion: "reduce" });
      if (scale === 200) {
        await page.addStyleTag({
          content: ":root { font-size: 200% !important; }",
        });
      }
      await page.waitForTimeout(350);
      const [layout, scaledControls] = await Promise.all([
        page.evaluate(rangeLayout),
        page.evaluate(() => ({
          reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
          undersized: [...document.querySelectorAll("button")]
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
                ? [
                    button.getAttribute("aria-label") ??
                      button.textContent?.trim(),
                  ]
                : [];
            }),
        })),
      ]);
      const scaled = { layout, ...scaledControls };
      evidence[`jobs-${label}-${scale}-reduced`] = scaled;
      check(
        `jobs-${label}-${scale}-reduced-reflow`,
        scaled.reduced &&
          !scaled.layout.overflow &&
          scaled.layout.titlePriceOverlaps.length === 0 &&
          scaled.layout.rangesWithinViewport &&
          scaled.layout.title.element?.text.length > 0 &&
          scaled.layout.price.element?.text.length > 0 &&
          scaled.undersized.length === 0,
        scaled,
        "Reduced motion with 100%/200% text keeps title and price distinct, full, visible, contained, and adjacent controls at least 44px.",
      );
      await page.locator(".selected-dispatch").scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `${outputDirectory}/jobs-${label}-${scale}-reduced.png`,
        fullPage: true,
      });
    }
    check(
      `jobs-${label}-errors`,
      errors.length === 0,
      errors,
      "Jobs reflow and first-session transition emit no page or console error.",
    );
  } finally {
    await page.close();
    await context.close();
  }
}

async function dragProbe(browser, inputKind) {
  const record = await openRecord(browser, { width: 393, height: 900 });
  const { context, errors, page } = record;
  try {
    const source = page
      .getByTestId("slot-prepare")
      .locator('[data-module-id="basic-cleaner"]');
    const destination = page.getByTestId("slot-runtime");
    await source.scrollIntoViewIfNeeded();
    await destination.scrollIntoViewIfNeeded();
    const [from, to, endpoint] = await Promise.all([
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
        const visibleCenter = (box) =>
          Boolean(
            box &&
              nav &&
              box.left + box.width / 2 >= 0 &&
              box.left + box.width / 2 <= window.innerWidth &&
              box.top + box.height / 2 >= 0 &&
              box.top + box.height / 2 <= nav.top,
          );
        return {
          destination,
          destinationVisible: visibleCenter(destination),
          source,
          sourceVisible: visibleCenter(source),
        };
      }),
    ]);
    if (!from || !to)
      throw new Error(`${inputKind} endpoints were not rendered`);
    check(
      `drag-${inputKind}-visible-endpoints`,
      endpoint.sourceVisible && endpoint.destinationVisible,
      endpoint,
      "Both coordinate-drag endpoints are visible above navigation before real input dispatch.",
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
        type: "touchStart",
        touchPoints: [{ ...start, id: 1 }],
      });
      for (let step = 1; step <= 8; step += 1) {
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [
            {
              id: 1,
              x: start.x + ((end.x - start.x) * step) / 8,
              y: start.y + ((end.y - start.y) * step) / 8,
            },
          ],
        });
      }
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await cdp.detach();
    }
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='slot-runtime']")
          ?.textContent?.includes("Basic Cleaner") &&
        document
          .querySelector("[data-testid='slot-prepare']")
          ?.textContent?.includes("Quantized Model"),
      { timeout: 10_000 },
    );
    const state = await savedState(page);
    const moved = {
      dom: await page.evaluate(() => ({
        prepare: document.querySelector("[data-testid='slot-prepare']")
          ?.textContent,
        runtime: document.querySelector("[data-testid='slot-runtime']")
          ?.textContent,
      })),
      slots: state.slots,
    };
    check(
      `drag-${inputKind}-mutation`,
      moved.dom.prepare?.includes("Quantized Model") &&
        moved.dom.runtime?.includes("Basic Cleaner") &&
        moved.slots?.some(
          (slot) =>
            slot.slotId === "prepare" && slot.moduleId === "quantized-model",
        ) &&
        moved.slots?.some(
          (slot) =>
            slot.slotId === "runtime" && slot.moduleId === "basic-cleaner",
        ),
      moved,
      "The real drag mutates both rendered and durable pipeline order.",
    );
    check(
      `drag-${inputKind}-errors`,
      errors.length === 0,
      errors,
      "Real pointer/CDP touch reordering emits no page or console error.",
    );
  } finally {
    await page.close();
    await context.close();
  }
}

async function draftAndOfflineProbe(browser, viewport) {
  const record = await openRecord(browser, viewport);
  const { context, errors, page } = record;
  const label = `${viewport.width}x${viewport.height}`;
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
    await activeTab(page, "Career");
    const freelance = page.getByLabel("Freelance delivery evening hours");
    await freelance.fill("3.00");
    await page.waitForTimeout(1_200);
    await activeTab(page, "Jobs");
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await activeTab(page, "Inspect");
    await activeTab(page, "Career");
    const retained = await freelance.inputValue();
    check(
      `career-${label}-draft-ticks-tabs`,
      retained === "3",
      retained,
      "Uncommitted Career input survives normal Worker ticks, Pause, and tab visits in the App session.",
    );
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForReady(page);
    await activeTab(page, "Career");
    const reloaded = await page
      .getByLabel("Freelance delivery evening hours")
      .inputValue();
    check(
      `career-${label}-draft-reload-boundary`,
      reloaded === "0",
      reloaded,
      "Reload discards only the uncommitted draft and restores durable Worker schedule state.",
    );
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Goldilocks Engine" }).waitFor({
      timeout: 15_000,
    });
    const offline = await page.evaluate(
      (key) => ({
        controlled: navigator.serviceWorker.controller !== null,
        save: localStorage.getItem(key),
      }),
      saveKey,
    );
    check(
      `pwa-${label}-offline-reload`,
      offline.controlled && offline.save !== null,
      offline,
      "Controlled root PWA reloads offline while retaining durable save state.",
    );
    await context.setOffline(false);
    check(
      `career-pwa-${label}-errors`,
      errors.length === 0,
      errors,
      "Career input, reload, and controlled offline recovery emit no page or console error.",
    );
  } finally {
    await page.close();
    await context.close();
  }
}

async function manualHandoffProbe(browser) {
  let record = await openRecord(browser, { width: 393, height: 742 });
  try {
    const { page } = record;
    await activeTab(page, "Jobs");
    await page.getByRole("button", { name: "Pause", exact: true }).click();
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
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await page.getByRole("button", { name: "64×", exact: true }).click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='first-session-guide']")
          ?.getAttribute("data-onboarding-action") === "earn-remainder",
      { timeout: 15_000 },
    );
    const exact = await savedState(page);
    exact.resources.money = 4;
    record = await seedNextBoot(record, exact, "round-076-onboarding-money");
    await activeTab(record.page, "Upgrades");
    await record.page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='first-session-guide']")
          ?.getAttribute("data-onboarding-action") === "buy-module",
      { timeout: 10_000 },
    );
    const purchaseReason = await record.page
      .getByTestId("onboarding-explanation")
      .innerText();
    check(
      "handoff-buy-rationale",
      purchaseReason.includes("now affordable at $4.00"),
      purchaseReason,
      "Onboarding names the affordable recommended module and its current reason.",
    );
    await record.page
      .getByRole("button", { name: "Buy Precision Cleaner for $4.00" })
      .click();
    await record.page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='first-session-guide']")
          ?.getAttribute("data-onboarding-action") === "start-placement",
      { timeout: 10_000 },
    );
    const before = JSON.stringify((await savedState(record.page)).slots);
    await record.page
      .getByRole("button", { name: "Place Precision Cleaner in Build" })
      .click();
    const pending = {
      buildCurrent: await record.page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("button", { name: "Build", exact: true })
        .getAttribute("aria-current"),
      tray: await record.page.locator(".placement-tray").count(),
      slots: JSON.stringify((await savedState(record.page)).slots),
      upgradesCurrent: await record.page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("button", { name: "Upgrades", exact: true })
        .getAttribute("aria-current"),
    };
    check(
      "handoff-explicit-manual-no-mutation",
      pending.upgradesCurrent === "page" &&
        pending.buildCurrent === null &&
        pending.tray === 0 &&
        pending.slots === before,
      pending,
      "Explicit placement remains in Upgrades, starts no automatic install, and awaits manual Build navigation.",
    );
    await activeTab(record.page, "Build");
    await record.page.locator(".placement-tray").waitFor({ timeout: 10_000 });
    await record.page
      .getByTestId("slot-prepare")
      .getByRole("button", { name: "Snap here" })
      .click();
    await record.page.waitForFunction(
      (key) => {
        const raw = localStorage.getItem(key);
        if (!raw) return false;
        const state = JSON.parse(raw);
        return state.slots?.some(
          (slot) =>
            slot.slotId === "prepare" && slot.moduleId === "precision-cleaner",
        );
      },
      saveKey,
      { timeout: 10_000 },
    );
    const placed = await savedState(record.page);
    check(
      "handoff-manual-placement-durable",
      placed.firstSession?.step === "complete" &&
        placed.slots?.some(
          (slot) =>
            slot.slotId === "prepare" && slot.moduleId === "precision-cleaner",
        ),
      { firstSession: placed.firstSession, slots: placed.slots },
      "Manual compatible Build snap performs the only placement mutation and completes the durable first-session handoff.",
    );
    await record.page.reload({ waitUntil: "domcontentloaded" });
    await waitForReady(record.page);
    const reloaded = await savedState(record.page);
    check(
      "handoff-placement-reload",
      reloaded.slots?.some(
        (slot) =>
          slot.slotId === "prepare" && slot.moduleId === "precision-cleaner",
      ) && (await record.page.locator(".placement-tray").count()) === 0,
      {
        slots: reloaded.slots,
        tray: await record.page.locator(".placement-tray").count(),
      },
      "Completed placement survives reload without leaving a ghost pending-placement tray.",
    );
    check(
      "handoff-errors",
      record.errors.length === 0,
      record.errors,
      "Onboarding rationale, explicit handoff, placement, and reload emit no page or console error.",
    );
  } finally {
    await closeRecord(record);
  }
}

async function malformedRecoveryProbe(browser) {
  const record = await openRecord(browser, { width: 320, height: 693 }, () =>
    localStorage.setItem("goldilocks-simulation-save-v4", "{malformed"),
  );
  try {
    const guide = await record.page
      .getByTestId("first-session-guide")
      .innerText();
    check(
      "malformed-save-fresh-guide",
      guide.includes("Queue one safe Interactive Chat job"),
      guide,
      "Malformed durable state fails safe to a usable fresh first-session rail.",
    );
    check(
      "malformed-save-errors",
      record.errors.length === 0,
      record.errors,
      "Malformed save recovery emits no page or console error.",
    );
  } finally {
    await closeRecord(record);
  }
}

async function activateExpansion(record) {
  const state = await savedState(record.page);
  state.resources.money = 45;
  const seeded = await seedNextBoot(record, state, "round-076-expansion-money");
  await activeTab(seeded.page, "Upgrades");
  await seeded.page
    .getByRole("button", { name: "Buy Workstation Expansion I for $45.00" })
    .click();
  await seeded.page
    .getByRole("button", { name: "Activate six-position pipeline" })
    .click();
  await activeTab(seeded.page, "Build");
  return seeded;
}

async function screenshotDeck(browser, viewport) {
  const tabs = ["Build", "Jobs", "Career", "Upgrades", "Inspect"];
  const label = `${viewport.width}x${viewport.height}`;
  let starter = await openRecord(browser, viewport);
  try {
    for (const tab of tabs) {
      await activeTab(starter.page, tab);
      await starter.page.screenshot({
        path: `${outputDirectory}/${label}-starter-${tab.toLowerCase()}.png`,
        fullPage: true,
      });
    }
    const expanded = await activateExpansion(starter);
    starter = null;
    try {
      const topology = await expanded.page.evaluate(() => {
        const rail = document.querySelector("[data-testid='pipeline']");
        return {
          empty: ["process-4", "process-5", "process-6"].map(
            (id) =>
              document.querySelector(`[data-testid='slot-${id}']`)?.textContent,
          ),
          overflow:
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth,
          slotCount: rail?.querySelectorAll(".pipeline-slot").length,
          trapped: Boolean(rail && rail.scrollHeight !== rail.clientHeight),
        };
      });
      evidence[`expanded-${label}`] = topology;
      check(
        `expanded-${label}-topology`,
        topology.slotCount === 8 &&
          topology.empty.every((text) => text?.includes("Empty / bypassed")) &&
          !topology.overflow &&
          !topology.trapped,
        topology,
        "Expansion retains one eight-stage rail with three empty/bypassed positions and no document overflow or nested rail scroll trap.",
      );
      for (const tab of tabs) {
        await activeTab(expanded.page, tab);
        await expanded.page.screenshot({
          path: `${outputDirectory}/${label}-expanded-${tab.toLowerCase()}.png`,
          fullPage: true,
        });
      }
      check(
        `deck-${label}-errors`,
        expanded.errors.length === 0,
        expanded.errors,
        "Starter/expanded five-tab screenshot deck emits no page or console error.",
      );
    } finally {
      await closeRecord(expanded);
    }
  } finally {
    if (starter) await closeRecord(starter);
  }
}

const browser = await chromium.launch({ headless: true });
try {
  const viewports = [
    { height: 693, width: 320 },
    { height: 742, width: 393 },
  ];
  for (const viewport of viewports) await jobsLayoutProbe(browser, viewport);
  await dragProbe(browser, "pointer");
  await dragProbe(browser, "cdp-touch");
  for (const viewport of viewports)
    await draftAndOfflineProbe(browser, viewport);
  await manualHandoffProbe(browser);
  await malformedRecoveryProbe(browser);
  for (const viewport of viewports) await screenshotDeck(browser, viewport);
} finally {
  await browser.close();
}

console.log(JSON.stringify({ evidence, findings }, null, 2));
if (findings.length > 0) process.exitCode = 1;
