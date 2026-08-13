import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:5746";
const outputDirectory =
  process.env.OUTPUT_DIR ?? "/tmp/goldlocks-r074-adversarial";
const saveKey = "goldilocks-simulation-save-v4";
const findings = [];

await mkdir(outputDirectory, { recursive: true });

function finding(id, actual, expected) {
  findings.push({ id, actual, expected });
}

function check(id, condition, actual, expected) {
  if (!condition) finding(id, actual, expected);
}

function browserStorageState(serialized) {
  return {
    cookies: [],
    origins: [
      {
        origin: new URL(baseURL).origin,
        localStorage: [{ name: saveKey, value: serialized }],
      },
    ],
  };
}

function attachErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push("page: " + error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push("console: " + message.text());
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

async function openRecord(browser, viewport, storageState = undefined) {
  const context = await browser.newContext({
    serviceWorkers: "allow",
    ...(storageState ? { storageState } : {}),
  });
  const page = await context.newPage();
  await page.setViewportSize(viewport);
  const errors = attachErrors(page);
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Goldilocks Engine" }).waitFor();
  await waitForSave(page);
  return { context, errors, page, viewport };
}

async function closeRecord(record) {
  await record.page.close();
  await record.context.close();
}

async function persistedState(page) {
  const serialized = await page.evaluate(
    (key) => localStorage.getItem(key),
    saveKey,
  );
  if (serialized === null) throw new Error("Expected a durable save");
  return JSON.parse(serialized);
}

async function replaceRecordFromState(browser, record, transform) {
  const next = await persistedState(record.page);
  transform(next);
  const viewport = record.viewport;
  await closeRecord(record);
  return openRecord(
    browser,
    viewport,
    browserStorageState(JSON.stringify(next)),
  );
}

async function reopenDurableRecord(browser, record) {
  const state = await persistedState(record.page);
  const viewport = record.viewport;
  await closeRecord(record);
  return openRecord(
    browser,
    viewport,
    browserStorageState(JSON.stringify(state)),
  );
}

async function openTab(page, tab) {
  const button = page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: tab, exact: true });
  await button.click();
  await page.waitForFunction(
    (expectedTab) =>
      document
        .querySelector("nav[aria-label='Primary'] button[aria-current='page']")
        ?.getAttribute("aria-label") === expectedTab,
    tab,
    { timeout: 10_000 },
  );
}

async function waitForAction(page, action) {
  await page.getByTestId("first-session-guide").waitFor({
    state: "visible",
    timeout: 15_000,
  });
  await page.waitForFunction(
    (expectedAction) =>
      document
        .querySelector("[data-testid='first-session-guide']")
        ?.getAttribute("data-onboarding-action") === expectedAction,
    action,
    { timeout: 15_000 },
  );
}

async function capture(page, label) {
  await page.screenshot({ path: outputDirectory + "/" + label + ".png" });
}

async function checkGuide(page, label, expected) {
  await page.getByTestId("onboarding-explanation").scrollIntoViewIfNeeded();
  const data = await page.evaluate(() => {
    const guide = document.querySelector("[data-testid='first-session-guide']");
    const explanation = document.querySelector(
      "[data-testid='onboarding-explanation']",
    );
    const title = document.querySelector("#first-session-guide-title");
    const requiredTab = document.querySelector(
      "[data-testid='onboarding-required-tab']",
    );
    const guideBox = guide?.getBoundingClientRect();
    const explanationBox = explanation?.getBoundingClientRect();
    const style = explanation ? getComputedStyle(explanation) : null;
    return {
      action: guide?.getAttribute("data-onboarding-action") ?? null,
      ariaLive: guide?.getAttribute("aria-live") ?? null,
      labelledBy: guide?.getAttribute("aria-labelledby") ?? null,
      guideButtonCount: guide?.querySelectorAll("button, a").length ?? -1,
      guideContainsExplanation: Boolean(
        guide &&
          explanation &&
          guide.contains(explanation) &&
          guideBox &&
          explanationBox &&
          explanationBox.top >= guideBox.top &&
          explanationBox.bottom <= guideBox.bottom,
      ),
      explanationDisplay: style?.display ?? null,
      explanationVisibility: style?.visibility ?? null,
      explanationText: explanation?.textContent?.trim() ?? "",
      title: title?.textContent?.trim() ?? "",
      requiredTab: requiredTab?.textContent?.trim() ?? "",
      noDocumentHorizontalOverflow:
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
      noGuideHorizontalOverflow: Boolean(
        guide && guide.scrollWidth <= guide.clientWidth,
      ),
    };
  });
  check(
    label + "-action",
    data.action === expected.action,
    data,
    "The durable first-session state selects action " + expected.action + ".",
  );
  check(
    label + "-live-region",
    data.ariaLive === "polite" &&
      data.labelledBy === "first-session-guide-title",
    data,
    "The state-specific guide remains a labeled polite live region.",
  );
  check(
    label + "-body-in-guide",
    data.guideContainsExplanation &&
      data.explanationDisplay !== "none" &&
      data.explanationVisibility !== "hidden" &&
      data.explanationText.includes(expected.bodyFragment),
    data,
    "The active guide visibly renders its state-specific explanatory body.",
  );
  check(
    label + "-title-and-tab",
    data.title.includes(expected.titleFragment) &&
      data.requiredTab === "Required tab · " + expected.requiredTab,
    data,
    "The active guide names exactly its current action and required bottom tab.",
  );
  check(
    label + "-no-duplicate-navigation-control",
    data.guideButtonCount === 0,
    data,
    "The guide explains the handoff without adding a second global navigation control.",
  );
  check(
    label + "-no-overflow",
    data.noDocumentHorizontalOverflow && data.noGuideHorizontalOverflow,
    data,
    "The guide body remains within the portrait document and its own card.",
  );
}

async function checkPortrait(page, label, requireInitialPipeline = false) {
  const data = await page.evaluate(() => {
    const nav = document
      .querySelector("nav[aria-label='Primary']")
      ?.getBoundingClientRect();
    const firstPipelineControl = document
      .querySelector("[data-testid='pipeline'] button")
      ?.getBoundingClientRect();
    const visibleButtons = [...document.querySelectorAll("button")]
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
    const guide = document.querySelector("[data-testid='first-session-guide']");
    const explanation = document.querySelector(
      "[data-testid='onboarding-explanation']",
    );
    const guideStyle = guide ? getComputedStyle(guide) : null;
    return {
      noDocumentHorizontalOverflow:
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
      undersizedButtons: visibleButtons,
      guideIsInDocumentFlow:
        guideStyle?.overflowY !== "auto" && guideStyle?.overflowY !== "scroll",
      guideContainsExplanation: Boolean(guide?.contains(explanation)),
      firstPipelineControlAboveNavigation: Boolean(
        nav && firstPipelineControl && firstPipelineControl.bottom <= nav.top,
      ),
    };
  });
  check(
    label + "-portrait-geometry",
    data.noDocumentHorizontalOverflow &&
      data.undersizedButtons.length === 0 &&
      data.guideIsInDocumentFlow &&
      data.guideContainsExplanation,
    data,
    "Portrait guide has no horizontal spill or nested guide scroll and visible buttons retain 44px targets.",
  );
  if (requireInitialPipeline) {
    check(
      label + "-initial-pipeline-control",
      data.firstPipelineControlAboveNavigation,
      data,
      "The initial first actionable pipeline control clears fixed bottom navigation.",
    );
  }
}

async function checkReachableQueue(page, label) {
  const queue = page.getByRole("button", {
    name: /^(Queue one safe Interactive Chat job|Queue 1)$/,
  });
  await queue.scrollIntoViewIfNeeded();
  const data = await page.evaluate(() => {
    const nav = document
      .querySelector("nav[aria-label='Primary']")
      ?.getBoundingClientRect();
    const queue = [...document.querySelectorAll("button")]
      .find((button) =>
        /^(Queue one safe Interactive Chat job|Queue 1)$/.test(
          button.textContent?.trim() ?? "",
        ),
      )
      ?.getBoundingClientRect();
    return {
      queue,
      nav,
      queueClearsNavigation: Boolean(nav && queue && queue.bottom <= nav.top),
    };
  });
  check(
    label + "-queue-reachable",
    data.queueClearsNavigation,
    data,
    "The selected current Queue 1 action is reachable above fixed navigation after normal document scrolling.",
  );
}

async function settleStarter(page) {
  await openTab(page, "Jobs");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Queue one safe Interactive Chat job",
      exact: true,
    })
    .click();
  await waitForAction(page, "observe-settlement");
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.getByRole("button", { name: "64×", exact: true }).click();
  await waitForAction(page, "earn-remainder");
}

async function probeRationaleLayouts(browser, viewport) {
  const record = await openRecord(browser, viewport);
  const label = String(viewport.width) + "x" + String(viewport.height);
  try {
    await waitForAction(record.page, "queue-starter");
    await checkGuide(record.page, "initial-" + label, {
      action: "queue-starter",
      bodyFragment: "Interactive Chat is the reliable first route",
      requiredTab: "Jobs",
      titleFragment: "Queue one safe Interactive Chat job",
    });
    await checkPortrait(
      record.page,
      "initial-" + label,
      viewport.width === 320 || viewport.width === 393,
    );
    const primaryTabCount = await record.page
      .locator("nav[aria-label='Primary'] > button")
      .count();
    check(
      "initial-" + label + "-five-bottom-tabs",
      primaryTabCount === 5,
      primaryTabCount,
      "Only the five bottom tabs form global navigation.",
    );
    await capture(record.page, "initial-" + label);

    await openTab(record.page, "Jobs");
    await record.page
      .getByRole("button", { name: "Pause", exact: true })
      .click();
    await record.page
      .getByRole("button", {
        name: "Queue one safe Interactive Chat job",
        exact: true,
      })
      .click();
    await waitForAction(record.page, "observe-settlement");
    await checkGuide(record.page, "observe-" + label, {
      action: "observe-settlement",
      bodyFragment: "locked quote, configured cost, and outcome",
      requiredTab: "Jobs",
      titleFragment: "Observe the starter settlement",
    });
    await record.page.reload({ waitUntil: "domcontentloaded" });
    await waitForSave(record.page);
    await waitForAction(record.page, "observe-settlement");
    await checkGuide(record.page, "observe-reload-" + label, {
      action: "observe-settlement",
      bodyFragment: "locked quote, configured cost, and outcome",
      requiredTab: "Jobs",
      titleFragment: "Observe the starter settlement",
    });
    check(
      "observe-reload-" + label + "-manual-navigation",
      (await record.page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("button", { name: "Build", exact: true })
        .getAttribute("aria-current")) === "page",
      await record.page
        .getByRole("navigation", { name: "Primary" })
        .locator("button[aria-current='page']")
        .getAttribute("aria-label"),
      "Reload preserves the guide but does not auto-navigate to the required Jobs tab.",
    );
    await capture(record.page, "observe-reload-" + label);

    await openTab(record.page, "Jobs");
    await record.page
      .getByRole("button", { name: "Resume", exact: true })
      .click();
    await record.page.getByRole("button", { name: "64×", exact: true }).click();
    await waitForAction(record.page, "earn-remainder");
    await checkGuide(record.page, "earn-" + label, {
      action: "earn-remainder",
      bodyFragment: "Precision Cleaner costs $4.00",
      requiredTab: "Jobs",
      titleFragment: "Earn $",
    });
    await checkReachableQueue(record.page, "earn-" + label);
    await capture(record.page, "earn-" + label);

    await record.page.addStyleTag({
      content: ":root { font-size: 200% !important; }",
    });
    await checkGuide(record.page, "earn-scaled-" + label, {
      action: "earn-remainder",
      bodyFragment: "Precision Cleaner costs $4.00",
      requiredTab: "Jobs",
      titleFragment: "Earn $",
    });
    await checkPortrait(record.page, "earn-scaled-" + label);
    await checkReachableQueue(record.page, "earn-scaled-" + label);
    await capture(record.page, "earn-scaled-" + label);
    check(
      "rationale-layout-errors-" + label,
      record.errors.length === 0,
      record.errors,
      "No page or console error occurs across queue, observe, settlement, reload, and scaled text.",
    );
  } finally {
    await closeRecord(record);
  }
}

async function probeRecommendedReloadBoundary(browser) {
  let record = await openRecord(browser, { width: 393, height: 742 });
  try {
    await settleStarter(record.page);
    record = await replaceRecordFromState(browser, record, (state) => {
      state.resources.money = 4;
    });
    await waitForAction(record.page, "buy-module");
    await openTab(record.page, "Upgrades");
    await checkGuide(record.page, "recommended-buy", {
      action: "buy-module",
      bodyFragment: "now affordable at $4.00",
      requiredTab: "Upgrades",
      titleFragment: "Buy the recommended Precision Cleaner",
    });
    const recommendedCard = record.page.getByTestId("recommended-first-module");
    check(
      "recommended-card-visible",
      (await recommendedCard.count()) === 1 &&
        (await recommendedCard.innerText()).includes("Precision Cleaner"),
      await recommendedCard.count(),
      "The state-derived recommended module is visibly prioritized before distant catalogue goals.",
    );
    await record.page
      .getByRole("button", {
        name: "Buy Precision Cleaner for $4.00",
        exact: true,
      })
      .click();
    await waitForAction(record.page, "start-placement");
    await checkGuide(record.page, "recommended-owned", {
      action: "start-placement",
      bodyFragment: "then choose Build yourself",
      requiredTab: "Upgrades",
      titleFragment: "Start explicit placement for Precision Cleaner",
    });
    const slotsBeforeSelection = JSON.stringify(
      (await persistedState(record.page)).slots,
    );
    const placement = record.page.getByRole("button", {
      name: "Place Precision Cleaner in Build",
      exact: true,
    });
    await placement.focus();
    await record.page.keyboard.press("Enter");
    await waitForAction(record.page, "place-module");
    check(
      "recommended-keyboard-handoff-stays-upgrades",
      (await record.page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("button", { name: "Upgrades", exact: true })
        .getAttribute("aria-current")) === "page" &&
        (await record.page.locator(".placement-tray").count()) === 0 &&
        JSON.stringify((await persistedState(record.page)).slots) ===
          slotsBeforeSelection,
      {
        currentTab: await record.page
          .getByRole("navigation", { name: "Primary" })
          .getByRole("button", { name: "Upgrades", exact: true })
          .getAttribute("aria-current"),
        trayCount: await record.page.locator(".placement-tray").count(),
      },
      "Keyboard explicit placement preserves Upgrades, makes no automatic installation, and has no Build tray before manual navigation.",
    );
    await capture(record.page, "recommended-pending-upgrades");

    record = await reopenDurableRecord(browser, record);
    await waitForAction(record.page, "start-placement");
    await checkGuide(record.page, "recommended-reload-clears-transient", {
      action: "start-placement",
      bodyFragment: "then choose Build yourself",
      requiredTab: "Upgrades",
      titleFragment: "Start explicit placement for Precision Cleaner",
    });
    check(
      "recommended-reload-no-ghost-placement",
      (await record.page.locator(".placement-tray").count()) === 0 &&
        JSON.stringify((await persistedState(record.page)).slots) ===
          slotsBeforeSelection,
      {
        trayCount: await record.page.locator(".placement-tray").count(),
        slots: (await persistedState(record.page)).slots,
      },
      "A reload safely clears only transient placement selection while preserving the owned first-session handoff and pipeline.",
    );

    await openTab(record.page, "Upgrades");
    await record.page
      .getByRole("button", {
        name: "Place Precision Cleaner in Build",
        exact: true,
      })
      .click();
    await openTab(record.page, "Build");
    await record.page.locator(".placement-tray").waitFor({ state: "visible" });
    await record.page
      .getByTestId("slot-prepare")
      .getByRole("button", { name: "Snap here", exact: true })
      .click();
    await record.page
      .getByTestId("first-session-guide")
      .waitFor({ state: "detached", timeout: 15_000 });
    const completed = await persistedState(record.page);
    check(
      "recommended-manual-placement-completes",
      completed.firstSession?.step === "complete" &&
        completed.slots?.some(
          (slot) =>
            slot.slotId === "prepare" && slot.moduleId === "precision-cleaner",
        ),
      completed.firstSession,
      "Manual Build Snap completes the durable guide only after a compatible explicit placement.",
    );
    check(
      "recommended-reload-errors",
      record.errors.length === 0,
      record.errors,
      "The recommended purchase, keyboard handoff, transient reload, and manual placement emit no page or console errors.",
    );
  } finally {
    await closeRecord(record);
  }
}

async function probeAlternativePurchase(browser) {
  let record = await openRecord(browser, { width: 393, height: 742 });
  try {
    await settleStarter(record.page);
    record = await replaceRecordFromState(browser, record, (state) => {
      state.resources.money = 4;
    });
    await waitForAction(record.page, "buy-module");
    await openTab(record.page, "Upgrades");
    let buyAlternative = record.page.getByRole("button", {
      name: "Buy Resilient Delivery for $4.00",
      exact: true,
    });
    if ((await buyAlternative.count()) === 0) {
      const allModules = record.page.getByRole("button", {
        name: /Show every module/,
      });
      await allModules.scrollIntoViewIfNeeded();
      await allModules.click();
      buyAlternative = record.page.getByRole("button", {
        name: "Buy Resilient Delivery for $4.00",
        exact: true,
      });
    }
    await buyAlternative.scrollIntoViewIfNeeded();
    check(
      "alternative-purchase-remains-available",
      (await buyAlternative.count()) === 1 &&
        (await buyAlternative.isEnabled()),
      {
        count: await buyAlternative.count(),
        enabled:
          (await buyAlternative.count()) === 1
            ? await buyAlternative.isEnabled()
            : false,
      },
      "A valid non-recommended paid alternative remains available to the player.",
    );
    await buyAlternative.click();
    await waitForAction(record.page, "start-placement");
    await checkGuide(record.page, "alternative-owned", {
      action: "start-placement",
      bodyFragment: "Resilient Delivery is owned",
      requiredTab: "Upgrades",
      titleFragment: "Start explicit placement for Resilient Delivery",
    });
    const placeAlternative = record.page.getByRole("button", {
      name: "Place Resilient Delivery in Build",
      exact: true,
    });
    await placeAlternative.focus();
    await record.page.keyboard.press("Enter");
    await waitForAction(record.page, "place-module");
    check(
      "alternative-handoff-stays-manual",
      (await record.page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("button", { name: "Upgrades", exact: true })
        .getAttribute("aria-current")) === "page" &&
        (await record.page.locator(".placement-tray").count()) === 0,
      {
        currentTab: await record.page
          .getByRole("navigation", { name: "Primary" })
          .getByRole("button", { name: "Upgrades", exact: true })
          .getAttribute("aria-current"),
        trayCount: await record.page.locator(".placement-tray").count(),
      },
      "A valid alternative purchase uses the same manual Upgrades-to-Build handoff.",
    );

    record = await reopenDurableRecord(browser, record);
    await waitForAction(record.page, "start-placement");
    await checkGuide(record.page, "alternative-reload", {
      action: "start-placement",
      bodyFragment: "Resilient Delivery is owned",
      requiredTab: "Upgrades",
      titleFragment: "Start explicit placement for Resilient Delivery",
    });
    await openTab(record.page, "Upgrades");
    await record.page
      .getByRole("button", {
        name: "Place Resilient Delivery in Build",
        exact: true,
      })
      .click();
    await openTab(record.page, "Build");
    await record.page.locator(".placement-tray").waitFor({ state: "visible" });
    const compatibleCount = await record.page
      .locator(".pipeline-slot.compatible")
      .count();
    check(
      "alternative-compatible-output",
      compatibleCount === 1,
      compatibleCount,
      "Resilient Delivery presents its one compatible output position.",
    );
    await record.page
      .getByTestId("slot-sink")
      .getByRole("button", { name: "Snap here", exact: true })
      .click();
    await record.page
      .getByTestId("first-session-guide")
      .waitFor({ state: "detached", timeout: 15_000 });
    const completed = await persistedState(record.page);
    check(
      "alternative-completion-is-durable",
      completed.firstSession?.step === "complete" &&
        completed.slots?.some(
          (slot) =>
            slot.slotId === "sink" && slot.moduleId === "resilient-delivery",
        ),
      completed,
      "A valid alternative remains named, explicitly installable, and completes the durable first-session rail.",
    );
    check(
      "alternative-errors",
      record.errors.length === 0,
      record.errors,
      "Alternative purchase, reload, keyboard handoff, and output placement emit no page or console errors.",
    );
  } finally {
    await closeRecord(record);
  }
}

async function probeFailedOfflineRecovery(browser) {
  let record = await openRecord(browser, { width: 393, height: 742 });
  try {
    await record.page
      .getByTestId("slot-runtime")
      .getByRole("button", { name: /^Quantized Model/ })
      .click();
    await record.page
      .getByRole("button", { name: /Remove Quantized Model from Runtime/ })
      .click();
    await record.page.waitForFunction(
      (key) => {
        try {
          const state = JSON.parse(localStorage.getItem(key) ?? "null");
          return state?.slots?.some(
            (slot) => slot.slotId === "runtime" && slot.moduleId === null,
          );
        } catch {
          return false;
        }
      },
      saveKey,
      { timeout: 15_000 },
    );
    await settleStarter(record.page);
    await checkGuide(record.page, "failed-starter", {
      action: "earn-remainder",
      bodyFragment: "latest starter delivery failed",
      requiredTab: "Jobs",
      titleFragment: "Review failed settlement",
    });
    check(
      "failed-starter-recovery-record",
      (await record.page.locator(".settlement-recovery").count()) === 1,
      await record.page.locator("main").innerText(),
      "The Jobs failure/recovery record stays visible beside the guide explanation.",
    );
    await capture(record.page, "failed-starter");

    record = await reopenDurableRecord(browser, record);
    await openTab(record.page, "Jobs");
    await waitForAction(record.page, "earn-remainder");
    await checkGuide(record.page, "failed-starter-reload", {
      action: "earn-remainder",
      bodyFragment: "latest starter delivery failed",
      requiredTab: "Jobs",
      titleFragment: "Review failed settlement",
    });
    const recoveredState = await persistedState(record.page);
    check(
      "failed-starter-reload-preserves-work",
      recoveredState.lastSettlement?.failed === 1 &&
        recoveredState.slots?.filter((slot) => slot.moduleId === null)
          .length === 1,
      {
        failed: recoveredState.lastSettlement?.failed,
        slots: recoveredState.slots,
      },
      "Reload retains the failed settlement and only the deliberately removed runtime slot; it does not discard the remaining pipeline.",
    );

    await record.page.evaluate(async () => navigator.serviceWorker.ready);
    await record.page.reload({ waitUntil: "domcontentloaded" });
    await record.page.evaluate(async () => navigator.serviceWorker.ready);
    await record.context.setOffline(true);
    await record.page.reload({ waitUntil: "domcontentloaded" });
    await record.page
      .getByRole("heading", { name: "Goldilocks Engine" })
      .waitFor({
        timeout: 15_000,
      });
    await openTab(record.page, "Jobs");
    await waitForAction(record.page, "earn-remainder");
    await checkGuide(record.page, "failed-starter-offline", {
      action: "earn-remainder",
      bodyFragment: "latest starter delivery failed",
      requiredTab: "Jobs",
      titleFragment: "Review failed settlement",
    });
    check(
      "failed-starter-offline-controller",
      await record.page.evaluate(
        () => navigator.serviceWorker.controller !== null,
      ),
      await record.page.evaluate(
        () => navigator.serviceWorker.controller?.scriptURL ?? null,
      ),
      "The failed-recovery first-session state remains available after a controlled offline root reload.",
    );
    check(
      "failed-offline-errors",
      record.errors.length === 0,
      record.errors,
      "Failure, durable reload, and offline recovery emit no page or console errors.",
    );
  } finally {
    await closeRecord(record);
  }
}

const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of [
    { width: 320, height: 693 },
    { width: 375, height: 667 },
    { width: 393, height: 742 },
  ])
    await probeRationaleLayouts(browser, viewport);
  await probeRecommendedReloadBoundary(browser);
  await probeAlternativePurchase(browser);
  await probeFailedOfflineRecovery(browser);
} catch (error) {
  finding(
    "round-074-probe-runtime",
    error instanceof Error ? (error.stack ?? error.message) : String(error),
    "The independent browser probe reaches every planned state and assertion.",
  );
} finally {
  await browser.close();
}

process.stdout.write(
  JSON.stringify({ baseURL, outputDirectory, findings }, null, 2) + "\n",
);
if (findings.length > 0) process.exitCode = 1;
