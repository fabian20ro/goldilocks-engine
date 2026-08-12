import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:4981";
const outputDirectory =
  process.env.OUTPUT_DIR ?? "test-results/round-067-adversarial";
const saveKey = "goldilocks-simulation-save-v4";

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const findings = [];

function recordFinding(id, actual, expected) {
  findings.push({ id, expected, actual });
}

function compactCurrency(amount) {
  const roundedToCents = Math.round(amount * 100) / 100;
  const precision = Math.abs(amount - roundedToCents) > 1e-9 ? 3 : 2;
  const normalized = Math.abs(amount) < 0.0005 ? 0 : amount;
  return `${normalized < 0 ? "-$" : "$"}${Math.abs(normalized).toFixed(
    precision,
  )}`;
}

function equationCurrency(amount, amounts) {
  const hasMills = amounts.some(
    (candidate) =>
      Math.abs(candidate - Math.round(candidate * 100) / 100) > 1e-9,
  );
  const normalized = Math.abs(amount) < 0.0005 ? 0 : amount;
  return `${normalized < 0 ? "-$" : "$"}${Math.abs(normalized).toFixed(
    hasMills ? 3 : 2,
  )}`;
}

async function createFreshPage(viewport = { width: 393, height: 742 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Goldilocks Engine" }).waitFor();
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Goldilocks Engine" }).waitFor();
  await page.waitForFunction(
    (key) => localStorage.getItem(key) !== null,
    saveKey,
    { timeout: 10_000 },
  );
  return { context, errors, page };
}

async function openTab(page, label) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: label, exact: true })
    .click();
}

async function readSavedState(page) {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (raw === null) throw new Error("missing persisted state");
    return JSON.parse(raw);
  }, saveKey);
}

async function settleStarterAndPause(page) {
  await openTab(page, "Jobs");
  await page
    .getByRole("button", { name: "Queue one safe Interactive Chat job" })
    .click();
  await page.getByRole("button", { name: "64×", exact: true }).click();
  await page
    .getByTestId("first-session-guide")
    .getByText(/step 3 of 3/i)
    .waitFor({ timeout: 10_000 });
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("button", { name: "Resume", exact: true }).waitFor();
}

async function verifyCareerPrecision() {
  const { context, errors, page } = await createFreshPage();
  try {
    process.stderr.write("round-067: career precision\n");
    await openTab(page, "Career");
    await page
      .getByRole("button", {
        name: "Allocate 1 hours to Freelance delivery",
        exact: true,
      })
      .click();
    await page.getByText("1.00h allocated", { exact: true }).waitFor();

    const quickResources = await page
      .locator(".career-quick-resources")
      .innerText();
    if (
      !quickResources.includes("Cash\n$0.00") ||
      !quickResources.includes("Savings\n$3.00")
    ) {
      recordFinding(
        "career-independent-resources-lose-cents-default",
        quickResources,
        "The initial Cash and Savings values are independent compact resources and render as $0.00 and $3.00, despite the separate one-hour Freelance equation requiring mills.",
      );
    }

    const projection = await page
      .getByTestId("career-projection-freelance")
      .innerText();
    if (
      !projection.includes("$2.166 expected net") ||
      !projection.includes("$0.110 configured cost")
    ) {
      recordFinding(
        "career-route-equation-loses-mills",
        projection,
        "A one-hour Freelance route equation promotes its related net and configured-cost terms to mills.",
      );
    }

    await page
      .getByRole("button", {
        name: "Freelance delivery details",
        exact: true,
      })
      .click();
    const details = await page
      .getByLabel("Freelance delivery details", { exact: true })
      .innerText();
    for (const expected of [
      "$2.276 gross",
      "$0.098 operating",
      "$0.012 electricity",
      "$2.166 economic net",
    ]) {
      if (!details.includes(expected)) {
        recordFinding(
          "career-details-loses-exact-mills",
          details,
          "Career Details retains the exact one-hour Freelance gross, operating, electricity, and economic-net amounts to mills.",
        );
        break;
      }
    }
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Run scheduled evening" }).click();
    const completion = page.getByLabel("Latest evening result", {
      exact: true,
    });
    await completion.waitFor({ timeout: 10_000 });
    const completionText = await completion.innerText();
    for (const expected of [
      "+$2.166",
      "$0.012 electricity",
      "$0.098 operating",
    ]) {
      if (!completionText.includes(expected)) {
        recordFinding(
          "career-completion-equation-loses-mills",
          completionText,
          "A completed Freelance evening keeps its own money/cost equation at mill precision.",
        );
        break;
      }
    }

    await openTab(page, "Inspect");
    const ledger = await page.locator(".event-log").innerText();
    if (
      !ledger.includes("$2.276 gross") ||
      !ledger.includes("$0.110 configured")
    ) {
      recordFinding(
        "career-ledger-loses-exact-mills",
        ledger,
        "The Inspect ledger preserves the completed Freelance accounting event at exact mill precision.",
      );
    }
    await page.screenshot({ path: `${outputDirectory}/career-precision.png` });
  } finally {
    if (errors.length) {
      recordFinding(
        "career-precision-emits-browser-errors",
        errors,
        "Career compact/exact precision actions complete without page or console errors.",
      );
    }
    await context.close();
  }
}

async function verifyJobsCardPrecision() {
  const { context, errors, page } = await createFreshPage();
  try {
    process.stderr.write("round-067: jobs card precision\n");
    await openTab(page, "Jobs");
    const text = await page.locator(".selected-dispatch").innerText();
    if (!text.includes("A failed delivery pays $0.00 gross.")) {
      recordFinding(
        "jobs-failed-payout-bypasses-cents-default",
        text,
        "The selected compact dispatch card formats its failed payout through the cents-default policy as $0.00 gross.",
      );
    }
    await page
      .locator(".selected-dispatch")
      .screenshot({ path: `${outputDirectory}/jobs-failed-payout.png` });
  } finally {
    if (errors.length) {
      recordFinding(
        "jobs-card-emits-browser-errors",
        errors,
        "The selected Jobs card renders without page or console errors.",
      );
    }
    await context.close();
  }
}

async function verifyQueueTenPrecisionBoundary() {
  const { context, errors, page } = await createFreshPage();
  try {
    process.stderr.write("round-067: queue ten precision\n");
    await settleStarterAndPause(page);
    const queueTen = page.getByRole("button", { name: /^Queue 10/ });
    const rendered = await queueTen.innerText();
    await queueTen.click();
    await page.waitForFunction((key) => {
      const raw = localStorage.getItem(key);
      if (raw === null) return false;
      const state = JSON.parse(raw);
      return state.jobs.waitingTasks.length === 10;
    }, saveKey);
    const state = await readSavedState(page);
    const quotes = state.jobs.waitingTasks.map((task) => task.lockedGrossQuote);
    const first = quotes[0];
    const last = quotes.at(-1);
    const expected = `Queue 10 · locks ${compactCurrency(first)} → ${compactCurrency(last)}`;
    const grouped = `Queue 10 · locks ${equationCurrency(first, quotes)} → ${equationCurrency(last, quotes)}`;
    if (rendered !== expected) {
      recordFinding(
        "queue-ten-range-promotes-unrelated-quotes",
        {
          rendered,
          lockedQuotes: quotes,
          individuallyFormatted: expected,
          grouped,
        },
        "Queue 10's two endpoint quotes are independent compact values: each defaults to cents unless that endpoint itself needs mills. A quote range is not an additive settlement equation.",
      );
    }
    await page.screenshot({
      path: `${outputDirectory}/queue-ten-precision.png`,
    });
  } finally {
    if (errors.length) {
      recordFinding(
        "queue-ten-emits-browser-errors",
        errors,
        "Queue 10 quote preview and locking complete without page or console errors.",
      );
    }
    await context.close();
  }
}

async function verifySettlementEquationPrecision() {
  const { context, errors, page } = await createFreshPage();
  try {
    process.stderr.write("round-067: settlement equation\n");
    for (const [slotId, moduleName, removeName] of [
      [
        "prepare",
        "Basic Cleaner",
        "Remove Basic Cleaner from Prepare and bypass position",
      ],
      [
        "runtime",
        "Quantized Model",
        "Remove Quantized Model from Runtime and bypass position",
      ],
      [
        "verify",
        "Smoke Check",
        "Remove Smoke Check from Verify and bypass position",
      ],
    ]) {
      await page
        .getByTestId(`slot-${slotId}`)
        .getByRole("button", { name: new RegExp(`^${moduleName}`) })
        .click();
      await page.getByRole("button", { name: removeName }).click();
    }

    await openTab(page, "Jobs");
    await page.getByRole("button", { name: "64×", exact: true }).click();
    await page
      .getByRole("button", { name: "Queue one safe Interactive Chat job" })
      .click();
    const settlement = page
      .getByText("Latest settlement", { exact: true })
      .locator("..");
    await settlement
      .getByText("configured actual costs", { exact: false })
      .waitFor({
        timeout: 10_000,
      });
    const text = await settlement.innerText();
    const state = await readSavedState(page);
    const lastSettlement = state.lastSettlement;
    const paidCost = Math.max(
      0,
      Math.min(
        lastSettlement.operatingCost,
        lastSettlement.grossPayout - lastSettlement.netChange,
      ),
    );
    const unpaidCost = Math.max(0, lastSettlement.operatingCost - paidCost);
    const equation = [
      lastSettlement.lockedGrossQuote,
      lastSettlement.grossPayout,
      lastSettlement.operatingCost,
      lastSettlement.grossPayout - lastSettlement.operatingCost,
      paidCost,
      unpaidCost,
    ];
    const expectedTerms = [
      equationCurrency(
        lastSettlement.grossPayout - lastSettlement.operatingCost,
        equation,
      ),
      equationCurrency(lastSettlement.lockedGrossQuote, equation),
      equationCurrency(lastSettlement.grossPayout, equation),
      equationCurrency(lastSettlement.operatingCost, equation),
      equationCurrency(paidCost, equation),
      equationCurrency(unpaidCost, equation),
    ];
    if (expectedTerms.some((expected) => !text.includes(expected))) {
      recordFinding(
        "settlement-equation-loses-related-mills",
        { text, lastSettlement, expectedTerms },
        "A displayed settlement row promotes every gross/cost/net/paid/unpaid term together when any related term requires mills.",
      );
    }
    await page.screenshot({ path: `${outputDirectory}/failed-settlement.png` });
  } finally {
    if (errors.length) {
      recordFinding(
        "settlement-equation-emits-browser-errors",
        errors,
        "A failed settlement and its recovery feedback render without page or console errors.",
      );
    }
    await context.close();
  }
}

try {
  await verifyCareerPrecision();
  await verifyJobsCardPrecision();
  await verifyQueueTenPrecisionBoundary();
  await verifySettlementEquationPrecision();
} catch (error) {
  recordFinding(
    "probe-runtime-error",
    error instanceof Error ? (error.stack ?? error.message) : String(error),
    "Each independent browser probe reaches its asserted state; an unexpected probe exception is reported rather than hidden.",
  );
} finally {
  await browser.close();
}

process.stdout.write(`${JSON.stringify({ baseURL, findings }, null, 2)}\n`);
if (findings.length > 0) process.exitCode = 1;
