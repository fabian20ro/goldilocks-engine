import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:42781";
const outputDirectory = process.env.OUTPUT_DIR ?? "/private/tmp/goldlocks-r079";
const saveKey = "goldilocks-simulation-save-v4";
const checks = [];

await mkdir(outputDirectory, { recursive: true });

function check(name, condition, detail) {
  checks.push({ detail, name, pass: condition });
  if (!condition) throw new Error(`${name}: ${detail}`);
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
    (key) => localStorage.getItem(key) !== null,
    saveKey,
    { timeout: 15_000 },
  );
}

async function open(browser, viewport, options = {}) {
  const context = await browser.newContext({
    hasTouch: options.hasTouch ?? false,
    isMobile: options.isMobile ?? false,
    serviceWorkers: "allow",
    viewport,
  });
  const page = await context.newPage();
  const errors = observeErrors(page);
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await waitForReady(page);
  return { context, errors, page };
}

async function saveState(page) {
  const raw = await page.evaluate((key) => localStorage.getItem(key), saveKey);
  if (raw === null) throw new Error("durable state absent");
  return JSON.parse(raw);
}

async function mutateSave(page, mutate) {
  await page.evaluate(
    ({ key, source }) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null");
      // This probe deliberately uses restore's untrusted local-state boundary,
      // then reloads through the production migration/integrity path.
      new Function("state", source)(state);
      localStorage.setItem(key, JSON.stringify(state));
    },
    { key: saveKey, source: `(${mutate.toString()})(state)` },
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForReady(page);
}

async function goJobs(page) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Jobs", exact: true })
    .click();
  await page.getByRole("heading", { name: "Workloads" }).waitFor();
}

async function choose64x(page) {
  const context = page.getByTestId("simulation-context");
  if (!(await context.evaluate((element) => element.open)))
    await context.locator(":scope > summary").click();
  await context.getByRole("button", { name: "64×", exact: true }).click();
}

async function settleStarter(page) {
  await page
    .getByRole("button", {
      name: "Queue one safe Interactive Chat job",
      exact: true,
    })
    .click();
  await choose64x(page);
  await page.waitForFunction(
    (key) => {
      const raw = localStorage.getItem(key);
      return raw !== null && JSON.parse(raw).lastSettlement !== null;
    },
    saveKey,
    { timeout: 20_000 },
  );
}

async function removeStarterProcessingModules(page) {
  for (const [slotId, moduleName, stageName] of [
    ["prepare", "Basic Cleaner", "Prepare"],
    ["runtime", "Quantized Model", "Runtime"],
    ["verify", "Smoke Check", "Verify"],
  ]) {
    await page
      .getByTestId(`slot-${slotId}`)
      .getByRole("button", { name: new RegExp(`^${moduleName}`) })
      .click();
    await page
      .getByRole("button", {
        name: `Remove ${moduleName} from ${stageName} and bypass position`,
        exact: true,
      })
      .click();
  }
}

async function initialGeometry(page, expectedWidth) {
  const geometry = await page.evaluate(() => {
    const nav = document.querySelector(".bottom-nav");
    const queue = document.querySelector(".queue-one");
    const selected = document.querySelector(".selected-dispatch");
    const loop = document.querySelector(".money-loop");
    const app = document.querySelector(".app-scroll-region");
    if (!nav || !queue || !selected || !loop || !app) return null;
    const navBox = nav.getBoundingClientRect();
    const queueBox = queue.getBoundingClientRect();
    return {
      columns: getComputedStyle(document.querySelector(".money-loop-copy"))
        .gridTemplateColumns.trim()
        .split(/\s+/).length,
      documentOverflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
      queueBeforeSettlement: Boolean(
        selected.compareDocumentPosition(loop) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ),
      queueClearance: navBox.top - queueBox.bottom,
      scrollTop: app.scrollTop,
      width: document.documentElement.clientWidth,
    };
  });
  check(
    "initial Jobs geometry available",
    geometry !== null,
    "required elements",
  );
  check(
    "initial Jobs width",
    geometry.width === expectedWidth,
    JSON.stringify(geometry),
  );
  check(
    "D-018 queue reserve",
    geometry.queueClearance >= 8,
    JSON.stringify(geometry),
  );
  check(
    "initial Jobs starts unscrolled",
    geometry.scrollTop === 0,
    JSON.stringify(geometry),
  );
  check(
    "selected Queue precedes settlement",
    geometry.queueBeforeSettlement,
    JSON.stringify(geometry),
  );
  check(
    "<=393 one money-loop column",
    geometry.columns === 1,
    JSON.stringify(geometry),
  );
  check(
    "initial Jobs no horizontal overflow",
    !geometry.documentOverflow,
    JSON.stringify(geometry),
  );
}

async function portraitIntegrity(page, label) {
  const result = await page.evaluate(() => {
    const isVisible = (element) => {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        box.width > 0 &&
        box.height > 0 &&
        box.bottom > 0 &&
        box.top < window.innerHeight
      );
    };
    const undersized = [...document.querySelectorAll("button, summary")]
      .filter(isVisible)
      .flatMap((element) => {
        const box = element.getBoundingClientRect();
        return box.width < 44 || box.height < 44
          ? [
              {
                height: box.height,
                text: element.textContent?.trim(),
                width: box.width,
              },
            ]
          : [];
      });
    const loop = document.querySelector(".money-loop");
    const loopStyle = loop ? getComputedStyle(loop) : null;
    return {
      documentOverflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
      moneyLoopNestedScroll: Boolean(
        loop &&
          loop.scrollHeight > loop.clientHeight + 1 &&
          loopStyle &&
          /auto|scroll/.test(loopStyle.overflowY),
      ),
      undersized,
    };
  });
  check(
    `${label}: no horizontal overflow`,
    !result.documentOverflow,
    JSON.stringify(result),
  );
  check(
    `${label}: no nested MoneyLoop scroll`,
    !result.moneyLoopNestedScroll,
    JSON.stringify(result),
  );
  check(
    `${label}: visible buttons/summaries at least 44px`,
    result.undersized.length === 0,
    JSON.stringify(result.undersized),
  );
}

async function openAccountingKeyboard(page) {
  const details = page.getByTestId("settlement-accounting");
  const summary = details.locator(":scope > summary");
  check(
    "one native settlement Details",
    (await details.count()) === 1 &&
      (await details.evaluate((element) => element.tagName)) === "DETAILS",
    "settlement-accounting",
  );
  check(
    "native Details summary naming",
    (await summary.textContent())?.trim() ===
      "Settlement accounting and provenance",
    await summary.textContent(),
  );
  await summary.focus();
  await page.keyboard.press("Space");
  check(
    "Details opens with keyboard",
    await details.evaluate((element) => element.open),
    "Space",
  );
  check(
    "Details retains keyboard focus",
    await summary.evaluate((element) => document.activeElement === element),
    "summary focus",
  );
  return details;
}

async function checkSettlementAccounting(page, expected) {
  const settlement = page.locator(".settlement");
  const state = await saveState(page);
  const overview = await page.getByTestId("settlement-overview").innerText();
  const firstLayer = await settlement.evaluate((element) =>
    [...element.children]
      .filter((child) => child.tagName !== "DETAILS")
      .map((child) => child.textContent ?? "")
      .join(" "),
  );
  check(
    "first layer has actual durable cash change",
    firstLayer.includes(expected.compactCash),
    firstLayer,
  );
  check(
    "first layer does not call economic net cash",
    !firstLayer.includes("economic net"),
    firstLayer,
  );
  check("first layer outcome", overview.includes(expected.outcome), overview);
  check(
    "durable netChange matches expected scenario",
    state.lastSettlement?.netChange === expected.netChange,
    JSON.stringify(state.lastSettlement),
  );
  const details = await openAccountingKeyboard(page);
  const text = await details.innerText();
  for (const fragment of expected.accounting)
    check(`accounting: ${fragment}`, text.includes(fragment), text);
  if (expected.fullPayment)
    check(
      "full payment has no zero unpaid residue",
      !text.includes("unpaid"),
      text,
    );
  return { details, settlement };
}

async function shot(page, name) {
  await page.screenshot({ path: `${outputDirectory}/${name}.png` });
}

const browser = await chromium.launch({ headless: true });
try {
  // Fresh 320px state: no-settlement presentation and raw D-018 reserve.
  {
    const record = await open(browser, { width: 320, height: 693 });
    try {
      await goJobs(record.page);
      check(
        "no-settlement presentation",
        (await record.page.getByTestId("settlement-overview").innerText()) ===
          "No payout yet — queue a job.",
        "no-settlement overview",
      );
      check(
        "no settlement has no provenance Details",
        (await record.page.getByTestId("settlement-accounting").count()) === 0,
        "settlement-accounting count",
      );
      await initialGeometry(record.page, 320);
      await shot(record.page, "jobs-initial-320-raw");
      check(
        "initial page errors",
        record.errors.length === 0,
        JSON.stringify(record.errors),
      );
    } finally {
      await record.context.close();
    }
  }

  // Successful full payment: compact actual cash and exact 3dp provenance.
  {
    const record = await open(browser, { width: 320, height: 693 });
    try {
      await mutateSave(record.page, (state) => {
        state.resources.money = 10;
      });
      await goJobs(record.page);
      await settleStarter(record.page);
      const { settlement } = await checkSettlementAccounting(record.page, {
        accounting: [
          "Task ID task-0-1 · locked gross quote $1.400.",
          "1 completed · 0 failed.",
          "$1.400 gross payout − $0.065 configured actual cost = +$1.335 economic net.",
          "$0.065 configured actual costs · $0.065 paid in full.",
          "+$1.335 cash change after the cash floor.",
          "Three decimals shown to preserve sub-cent accounting.",
        ],
        compactCash: "+$1.335 cash change",
        fullPayment: true,
        netChange: 1.335,
        outcome: "Successful delivery Interactive Chat delivered successfully.",
      });
      check(
        "first-success recognition",
        (
          await record.page.locator(".settlement-recognition").innerText()
        ).includes("First successful delivery recorded"),
        "recognition",
      );
      await settlement.scrollIntoViewIfNeeded();
      await shot(record.page, "jobs-success-320-raw");
      await record.page.emulateMedia({ reducedMotion: "reduce" });
      await record.page.addStyleTag({
        content: ":root { font-size: 200% !important; }",
      });
      await settlement.scrollIntoViewIfNeeded();
      await portraitIntegrity(record.page, "320px 200% reduced motion success");
      check(
        "reduced-motion settlement animation",
        ["0s", "0.01ms"].includes(
          await settlement.evaluate(
            (element) => getComputedStyle(element).animationDuration,
          ),
        ),
        await settlement.evaluate(
          (element) => getComputedStyle(element).animationDuration,
        ),
      );
      await shot(record.page, "jobs-success-320-200-reduced-motion");
      check(
        "success page errors",
        record.errors.length === 0,
        JSON.stringify(record.errors),
      );
    } finally {
      await record.context.close();
    }
  }

  // Zero-payout full-cost failure: cause, recovery, and full-payment wording.
  {
    const record = await open(browser, { width: 320, height: 693 });
    try {
      await mutateSave(record.page, (state) => {
        state.resources.money = 10;
      });
      await removeStarterProcessingModules(record.page);
      await goJobs(record.page);
      await settleStarter(record.page);
      const { settlement } = await checkSettlementAccounting(record.page, {
        accounting: [
          "$0.000 gross payout − $0.010 configured actual cost = −$0.010 economic net.",
          "$0.010 configured actual costs · $0.010 paid in full.",
          "−$0.010 cash change after the cash floor.",
        ],
        compactCash: "−$0.01 cash change",
        fullPayment: true,
        netChange: -0.01,
        outcome: "Failed delivery Interactive Chat failed before delivery.",
      });
      const recovery = await record.page
        .locator(".settlement-recovery")
        .innerText();
      check(
        "direct failure cause",
        recovery.includes("The active pipeline had no model stage."),
        recovery,
      );
      check(
        "recovery forecast",
        recovery.includes("Recovery forecast: steady quote $1.40"),
        recovery,
      );
      await settlement.scrollIntoViewIfNeeded();
      await shot(record.page, "jobs-zero-payout-320-raw");
      check(
        "zero-payout page errors",
        record.errors.length === 0,
        JSON.stringify(record.errors),
      );
    } finally {
      await record.context.close();
    }
  }

  // 393px raw no-settlement geometry, plus touch/reload partial cash at 200%.
  {
    const record = await open(
      browser,
      { width: 393, height: 742 },
      { hasTouch: true, isMobile: true },
    );
    try {
      await goJobs(record.page);
      await initialGeometry(record.page, 393);
      await shot(record.page, "jobs-initial-393-raw");
      await mutateSave(record.page, (state) => {
        state.resources.money = 0.005;
      });
      await removeStarterProcessingModules(record.page);
      await goJobs(record.page);
      await settleStarter(record.page);
      const { details, settlement } = await checkSettlementAccounting(
        record.page,
        {
          accounting: [
            "$0.000 gross payout − $0.010 configured actual cost = −$0.010 economic net.",
            "$0.010 configured actual costs · $0.005 paid · $0.005 unpaid because cash cannot go below $0.000.",
            "−$0.005 cash change after the cash floor.",
          ],
          compactCash: "−$0.005 cash change",
          fullPayment: false,
          netChange: -0.005,
          outcome: "Failed delivery Interactive Chat failed before delivery.",
        },
      );
      await details.locator(":scope > summary").tap();
      check(
        "touch toggles native Details",
        !(await details.evaluate((element) => element.open)),
        "tap close",
      );
      await details.locator(":scope > summary").tap();
      check(
        "touch reopens native Details",
        await details.evaluate((element) => element.open),
        "tap open",
      );
      await record.page.reload({ waitUntil: "domcontentloaded" });
      await waitForReady(record.page);
      await goJobs(record.page);
      check(
        "reload preserves partial settlement actual cash",
        (await record.page.locator(".settlement").innerText()).includes(
          "−$0.005 cash change",
        ),
        await record.page.locator(".settlement").innerText(),
      );
      await record.page.emulateMedia({ reducedMotion: "reduce" });
      await record.page.addStyleTag({
        content: ":root { font-size: 200% !important; }",
      });
      await settlement.scrollIntoViewIfNeeded();
      await portraitIntegrity(
        record.page,
        "393px 200% reduced motion partial failure",
      );
      await shot(record.page, "jobs-partial-393-200-reduced-motion");
      check(
        "partial page errors",
        record.errors.length === 0,
        JSON.stringify(record.errors),
      );
    } finally {
      await record.context.close();
    }
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify({ baseURL, checks, outputDirectory }, null, 2));
