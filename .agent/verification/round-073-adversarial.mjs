import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:5731";
const outputDirectory =
  process.env.OUTPUT_DIR ?? "/tmp/goldlocks-r073-adversarial";
const saveKey = "goldilocks-simulation-save-v4";
const viewports = [
  { width: 320, height: 693 },
  { width: 393, height: 742 },
];
const findings = [];

await mkdir(outputDirectory, { recursive: true });

function finding(id, actual, expected) {
  findings.push({ id, actual, expected });
}

function check(id, condition, actual, expected) {
  if (!condition) finding(id, actual, expected);
}

function attachErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

async function waitForSave(page) {
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

async function openPage(context, viewport) {
  const page = await context.newPage();
  await page.setViewportSize(viewport);
  const errors = attachErrors(page);
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Goldilocks Engine" }).waitFor();
  await waitForSave(page);
  return { page, errors };
}

async function openTab(page, tab) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: tab, exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: tab, exact: true })
    .waitFor();
}

async function persistedState(page) {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null"),
    saveKey,
  );
}

async function waitForGuideAction(page, action) {
  await page
    .getByTestId("first-session-guide")
    .waitFor({ state: "visible", timeout: 15_000 });
  await page.waitForFunction(
    (expected) =>
      document
        .querySelector("[data-testid='first-session-guide']")
        ?.getAttribute("data-onboarding-action") === expected,
    action,
    { timeout: 15_000 },
  );
}

async function screenshot(page, label) {
  await page.screenshot({ path: `${outputDirectory}/${label}.png` });
}

async function assertPortrait(
  page,
  label,
  requireGuideVisible = false,
  requireQueueClear = false,
) {
  const geometry = await page.evaluate(() => {
    const nav = document.querySelector(".bottom-nav")?.getBoundingClientRect();
    const guide = document
      .querySelector("[data-testid='first-session-guide']")
      ?.getBoundingClientRect();
    const queue = [...document.querySelectorAll("button")]
      .find(
        (button) =>
          button.textContent?.trim() === "Queue one safe Interactive Chat job",
      )
      ?.getBoundingClientRect();
    const undersized = [...document.querySelectorAll("button")]
      .filter((button) => {
        const style = getComputedStyle(button);
        return style.display !== "none" && style.visibility !== "hidden";
      })
      .flatMap((button) => {
        const box = button.getBoundingClientRect();
        return box.width < 44 || box.height < 44
          ? [button.getAttribute("aria-label") ?? button.textContent?.trim()]
          : [];
      });
    const pipeline = document.querySelector("[data-testid='pipeline']");
    return {
      noHorizontalOverflow:
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
      guideVisible:
        !guide || (guide.bottom > 0 && guide.top < window.innerHeight),
      hasQueue: Boolean(queue),
      queueClear: !queue || !nav || queue.bottom <= nav.top,
      nestedPipelineScroll: pipeline
        ? pipeline.scrollHeight > pipeline.clientHeight
        : false,
      undersized,
    };
  });
  check(
    `${label}-no-horizontal-overflow`,
    geometry.noHorizontalOverflow,
    geometry,
    "Portrait document has no horizontal overflow.",
  );
  if (requireGuideVisible)
    check(
      `${label}-guide-visible`,
      geometry.guideVisible,
      geometry,
      "The first-session guide remains visibly reachable before a player scrolls toward another control.",
    );
  if (requireQueueClear && geometry.hasQueue)
    check(
      `${label}-queue-clear`,
      geometry.queueClear,
      geometry,
      "The safe Queue 1 control clears fixed primary navigation.",
    );
  check(
    `${label}-no-nested-pipeline-scroll`,
    !geometry.nestedPipelineScroll,
    geometry,
    "The ordered pipeline rail has no nested vertical scroll trap.",
  );
  check(
    `${label}-44px-controls`,
    geometry.undersized.length === 0,
    geometry.undersized,
    "Visible actionable controls are at least 44 CSS pixels.",
  );
}

async function captureFiveTabDeck(browser, viewport, kind) {
  const context = await browser.newContext({ serviceWorkers: "allow" });
  let record = await openPage(context, viewport);
  const tabs = ["Build", "Jobs", "Career", "Upgrades", "Inspect"];
  try {
    if (kind === "expanded") {
      record = await restartWithMoney(record, viewport, 45);
      await openTab(record.page, "Upgrades");
      await record.page
        .getByRole("button", {
          name: "Buy Workstation Expansion I for $45.00",
          exact: true,
        })
        .click();
      await record.page
        .getByRole("button", {
          name: "Activate six-position pipeline",
          exact: true,
        })
        .click();
      await openTab(record.page, "Build");
      await record.page
        .getByTestId("slot-process-4")
        .getByText("Empty / bypassed")
        .waitFor();
      const emptySlots = await record.page.evaluate(() =>
        ["process-4", "process-5", "process-6"].filter((slotId) => {
          const slot = document.querySelector(`[data-testid='slot-${slotId}']`);
          return slot?.textContent?.includes("Empty / bypassed") ?? false;
        }),
      );
      check(
        `expanded-empty-slots-${viewport.width}`,
        emptySlots.length === 3,
        emptySlots,
        "Workstation Expansion I begins with three visibly empty/bypassed process positions.",
      );
    }
    for (const tab of tabs) {
      await openTab(record.page, tab);
      await assertPortrait(record.page, `${kind}-${tab}-${viewport.width}`);
      if (kind === "starter" && tab !== "Inspect")
        check(
          `starter-guide-present-${tab}-${viewport.width}`,
          (await record.page.getByTestId("first-session-guide").count()) === 1,
          await record.page.getByTestId("first-session-guide").count(),
          "The active finite first-session rail remains present outside the optional Inspect report.",
        );
      if (kind === "starter" && tab === "Upgrades") {
        const guideGeometry = await record.page
          .getByTestId("first-session-guide")
          .evaluate((element) => {
            const box = element.getBoundingClientRect();
            return {
              text: element.textContent,
              top: box.top,
              bottom: box.bottom,
              viewportHeight: window.innerHeight,
            };
          });
        check(
          `starter-upgrades-guide-visible-${viewport.width}`,
          guideGeometry.bottom > 0 &&
            guideGeometry.top < guideGeometry.viewportHeight,
          guideGeometry,
          "The active first-session guide is visible when Upgrades opens before the first settlement.",
        );
      }
      await screenshot(
        record.page,
        `${kind}-${tab.toLowerCase()}-${viewport.width}`,
      );
      if (kind === "expanded" && tab === "Build") {
        await record.page
          .getByTestId("slot-process-4")
          .scrollIntoViewIfNeeded();
        await screenshot(
          record.page,
          `expanded-build-empty-slots-${viewport.width}`,
        );
      }
    }
    check(
      `${kind}-deck-errors-${viewport.width}`,
      record.errors.length === 0,
      record.errors,
      "Every fresh five-tab portrait capture is free of page and console errors.",
    );
  } finally {
    await record.page.close();
    await context.close();
  }
}

async function restartWithMoney(record, viewport, money) {
  const serialized = await record.page.evaluate(
    (key) => localStorage.getItem(key),
    saveKey,
  );
  if (serialized === null) throw new Error("No durable state to seed");
  const next = JSON.parse(serialized);
  next.resources.money = money;
  const context = record.page.context();
  await record.page.close();
  await context.addInitScript(
    ({ key, saved }) => {
      try {
        localStorage.setItem(key, saved);
      } catch {
        // The initial opaque document has no origin storage.
      }
    },
    { key: saveKey, saved: JSON.stringify(next) },
  );
  return openPage(context, viewport);
}

async function settleStarter(record) {
  const { page } = record;
  await openTab(page, "Jobs");
  await page
    .getByRole("button", {
      name: "Queue one safe Interactive Chat job",
      exact: true,
    })
    .click();
  await waitForGuideAction(page, "observe-settlement");
  await page.getByRole("button", { name: "64×", exact: true }).click();
  await page.waitForFunction(
    (key) => {
      try {
        return (
          JSON.parse(localStorage.getItem(key) ?? "null").lastSettlement !==
          null
        );
      } catch {
        return false;
      }
    },
    saveKey,
    { timeout: 15_000 },
  );
  await waitForGuideAction(page, "earn-remainder");
}

async function probeGuideRationales(browser, viewport) {
  const context = await browser.newContext({ serviceWorkers: "allow" });
  const record = await openPage(context, viewport);
  const { page } = record;
  try {
    const initialGuide = await page
      .getByTestId("first-session-guide")
      .innerText();
    check(
      `initial-rationale-${viewport.width}`,
      initialGuide.includes("Interactive Chat is the reliable first route"),
      initialGuide,
      "The queue-starter guide includes its concise reason: Interactive Chat is the reliable first route.",
    );
    check(
      `bottom-navigation-only-${viewport.width}`,
      (await page.locator("nav[aria-label='Primary'] button").count()) === 5,
      await page.locator("nav[aria-label='Primary'] button").count(),
      "Exactly the five bottom tabs provide global page navigation.",
    );
    await screenshot(page, `initial-build-${viewport.width}`);

    await openTab(page, "Jobs");
    await assertPortrait(page, `initial-jobs-${viewport.width}`, true, true);
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await page
      .getByRole("button", {
        name: "Queue one safe Interactive Chat job",
        exact: true,
      })
      .click();
    await waitForGuideAction(page, "observe-settlement");
    const observingGuide = await page
      .getByTestId("first-session-guide")
      .innerText();
    check(
      `observe-rationale-${viewport.width}`,
      observingGuide.includes("locked quote, configured cost, and outcome"),
      observingGuide,
      "The settlement objective explains where its locked quote, cost, and outcome remain available.",
    );
    await screenshot(page, `observe-starter-${viewport.width}`);

    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await page.getByRole("button", { name: "64×", exact: true }).click();
    await page.waitForFunction(
      (key) => {
        try {
          return (
            JSON.parse(localStorage.getItem(key) ?? "null").lastSettlement !==
            null
          );
        } catch {
          return false;
        }
      },
      saveKey,
      { timeout: 15_000 },
    );
    await waitForGuideAction(page, "earn-remainder");
    const earningGuide = await page
      .getByTestId("first-session-guide")
      .innerText();
    check(
      `earn-rationale-${viewport.width}`,
      earningGuide.includes("Precision Cleaner costs $4.00"),
      earningGuide,
      "The earn-remainder objective explains the live recommended-module price and next viable route.",
    );
    await screenshot(page, `earn-remainder-${viewport.width}`);

    await page.addStyleTag({
      content: ":root { font-size: 200% !important; }",
    });
    await page
      .getByRole("button", { name: "Queue 1", exact: true })
      .scrollIntoViewIfNeeded();
    await assertPortrait(page, `scaled-jobs-${viewport.width}`);
    await screenshot(page, `earn-remainder-${viewport.width}-200`);
    check(
      `guide-errors-${viewport.width}`,
      record.errors.length === 0,
      record.errors,
      "Guide flow emits no page or console errors.",
    );
  } finally {
    await page.close();
    await context.close();
  }
}

async function probeExplicitHandoff(browser) {
  const viewport = viewports[1];
  const context = await browser.newContext({ serviceWorkers: "allow" });
  let record = await openPage(context, viewport);
  try {
    await settleStarter(record);
    record = await restartWithMoney(record, viewport, 4);
    const { page } = record;
    await waitForGuideAction(page, "buy-module");
    await openTab(page, "Upgrades");
    const recommended = page.getByTestId("recommended-first-module");
    check(
      "recommended-module-precedes-expansion",
      (await recommended.count()) === 1,
      await page.locator("main").innerText(),
      "One named recommended module is visible before the expansion catalogue.",
    );
    const details = page.locator("article.upgrade-card details[open]");
    check(
      "one-upgrades-details-surface",
      (await details.count()) === 1,
      await details.count(),
      "Upgrades has exactly one primary item Details surface.",
    );
    const region = page.locator(".app-scroll-region");
    await region.evaluate((element) => {
      element.scrollTop = Math.min(
        96,
        element.scrollHeight - element.clientHeight,
      );
    });
    const before = await region.evaluate((element) => element.scrollTop);
    await page
      .getByRole("button", {
        name: "Buy Precision Cleaner for $4.00",
        exact: true,
      })
      .click();
    await waitForGuideAction(page, "start-placement");
    await page
      .getByRole("button", {
        name: "Place Precision Cleaner in Build",
        exact: true,
      })
      .click();
    await waitForGuideAction(page, "place-module");
    check(
      "explicit-handoff-does-not-navigate",
      (await page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("button", { name: "Upgrades", exact: true })
        .getAttribute("aria-current")) === "page",
      await page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("button", { name: "Upgrades", exact: true })
        .getAttribute("aria-current"),
      "Explicit placement begins in Upgrades without surprise navigation.",
    );
    check(
      "explicit-handoff-no-automatic-install",
      (await page.locator(".placement-tray").count()) === 0,
      await page.locator(".placement-tray").count(),
      "No Build tray or installation appears before the player selects Build.",
    );
    check(
      "explicit-handoff-scroll-preserved",
      (await region.evaluate((element) => element.scrollTop)) > 0 ||
        before === 0,
      await region.evaluate((element) => element.scrollTop),
      "Upgrades scroll position remains available through the handoff.",
    );
    await screenshot(page, "upgrades-pending-placement-393");
    await openTab(page, "Build");
    check(
      "manual-build-reveals-tray",
      (await page.locator(".placement-tray").count()) === 1,
      await page.locator("main").innerText(),
      "The pending placement tray appears only after the player selects Build.",
    );
    await assertPortrait(page, "manual-build-placement-393");
    await screenshot(page, "build-pending-placement-393");
    const beforeSlots = JSON.stringify((await persistedState(page)).slots);
    await page
      .getByRole("button", { name: "Cancel placement", exact: true })
      .click();
    const afterSlots = JSON.stringify((await persistedState(page)).slots);
    check(
      "cancel-handoff-no-pipeline-mutation",
      beforeSlots === afterSlots,
      { beforeSlots, afterSlots },
      "Cancelling the explicit handoff does not mutate the pipeline.",
    );
    check(
      "handoff-errors",
      record.errors.length === 0,
      record.errors,
      "Explicit handoff emits no page or console errors.",
    );
  } finally {
    await record.page.close();
    await context.close();
  }
}

async function probeFailedStarterRecovery(browser) {
  const context = await browser.newContext({ serviceWorkers: "allow" });
  const record = await openPage(context, viewports[1]);
  const { page } = record;
  try {
    await page
      .getByTestId("slot-runtime")
      .getByRole("button", { name: /^Quantized Model/ })
      .click();
    await page
      .getByRole("button", { name: /Remove Quantized Model from Runtime/ })
      .click();
    await settleStarter(record);
    const state = await persistedState(page);
    check(
      "failed-starter-scenario",
      state.lastSettlement?.failed === 1,
      state.lastSettlement,
      "The adverse scenario reaches a failed starter settlement.",
    );
    const guide = await page.getByTestId("first-session-guide").innerText();
    check(
      "failed-starter-rationale",
      guide.includes("latest starter delivery failed"),
      guide,
      "The guide names the failed starter and directs the player to the Jobs recovery record.",
    );
    check(
      "failed-starter-settlement-visible",
      (await page.locator(".settlement-recovery").count()) === 1,
      await page.locator("main").innerText(),
      "Jobs retains the failed settlement recovery record.",
    );
    await screenshot(page, "failed-starter-recovery-393");
    check(
      "failed-starter-errors",
      record.errors.length === 0,
      record.errors,
      "Failure/recovery flow emits no page or console errors.",
    );
  } finally {
    await page.close();
    await context.close();
  }
}

async function probeOfflineReload(browser) {
  const context = await browser.newContext({ serviceWorkers: "allow" });
  const record = await openPage(context, viewports[1]);
  const { page } = record;
  try {
    await page.evaluate(async () => navigator.serviceWorker.ready);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.evaluate(async () => navigator.serviceWorker.ready);
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Goldilocks Engine" }).waitFor({
      timeout: 15_000,
    });
    check(
      "root-offline-reload-controller",
      await page.evaluate(() => navigator.serviceWorker.controller !== null),
      await page.evaluate(
        () => navigator.serviceWorker.controller?.scriptURL ?? null,
      ),
      "A root-scope controlled PWA reloads offline.",
    );
    check(
      "root-offline-reload-errors",
      record.errors.length === 0,
      record.errors,
      "Offline reload emits no page or console errors.",
    );
  } finally {
    await page.close();
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of viewports)
    await probeGuideRationales(browser, viewport);
  await probeExplicitHandoff(browser);
  await probeFailedStarterRecovery(browser);
  await probeOfflineReload(browser);
  for (const viewport of viewports) {
    await captureFiveTabDeck(browser, viewport, "starter");
    await captureFiveTabDeck(browser, viewport, "expanded");
  }
} catch (error) {
  finding(
    "adversarial-probe-runtime",
    error instanceof Error ? (error.stack ?? error.message) : String(error),
    "The independent pinned-browser probe reaches every planned assertion.",
  );
} finally {
  await browser.close();
}

process.stdout.write(
  `${JSON.stringify({ baseURL, outputDirectory, findings }, null, 2)}\n`,
);
if (findings.length > 0) process.exitCode = 1;
