import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:5073";
const outputDirectory =
  process.env.OUTPUT_DIR ?? "output/playwright/round-068-adversarial";
const saveKey = "goldilocks-simulation-save-v4";

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const findings = [];

function recordFinding(id, actual, expected) {
  findings.push({ id, expected, actual });
}

function compactCurrency(amount) {
  const normalized = Math.abs(amount) < 0.0005 ? 0 : amount;
  const cents = Math.round(normalized * 100) / 100;
  const precision = Math.abs(normalized - cents) > 1e-9 ? 3 : 2;
  return `${normalized < 0 ? "-$" : "$"}${Math.abs(normalized).toFixed(
    precision,
  )}`;
}

function exactCurrency(amount) {
  const normalized = Math.abs(amount) < 0.0005 ? 0 : amount;
  return `${normalized < 0 ? "-$" : "$"}${Math.abs(normalized).toFixed(3)}`;
}

async function freshPage(viewport = { width: 393, height: 742 }) {
  const context = await browser.newContext({
    viewport,
    serviceWorkers: "allow",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  try {
    await page.waitForFunction(
      (key) => localStorage.getItem(key) !== null,
      saveKey,
      { timeout: 5_000 },
    );
  } catch {
    throw new Error(
      JSON.stringify({
        errors,
        heading: await page.locator("h1").first().textContent(),
        save: await page.evaluate((key) => localStorage.getItem(key), saveKey),
      }),
    );
  }
  return { context, errors, page };
}

async function openTab(page, label) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: label, exact: true })
    .click();
}

async function closeWithErrors(context, errors, label) {
  if (errors.length > 0) {
    recordFinding(
      `${label}-browser-errors`,
      errors,
      `${label} completes without page or console errors.`,
    );
  }
  await context.close();
}

async function removeStarterProcessingModules(page) {
  for (const [slotId, moduleName] of [
    ["prepare", "Basic Cleaner"],
    ["runtime", "Quantized Model"],
    ["verify", "Smoke Check"],
  ]) {
    await page
      .getByTestId(`slot-${slotId}`)
      .getByRole("button", { name: new RegExp(`^${moduleName}`) })
      .click();
    await page
      .getByRole("button", {
        name: `Remove ${moduleName} from ${
          slotId === "prepare"
            ? "Prepare"
            : slotId === "runtime"
              ? "Runtime"
              : "Verify"
        } and bypass position`,
        exact: true,
      })
      .click();
  }
}

async function verifyIndependentCompactAction() {
  const { context, errors, page } = await freshPage();
  try {
    await openTab(page, "Career");
    await page
      .getByLabel("Show Evaluation discipline", { exact: true })
      .click();
    const action = page.getByRole("button", {
      name: "Run paid private evaluation",
      exact: true,
    });
    await action.waitFor();
    const text = await action.innerText();
    await action.screenshot({
      path: `${outputDirectory}/career-private-evaluation-action.png`,
    });
    const expected = `Run private evaluation · ${compactCurrency(0.75)}`;
    if (text !== expected) {
      recordFinding(
        "career-private-evaluation-action-bypasses-compact-currency",
        text,
        expected,
      );
    }
  } finally {
    await closeWithErrors(context, errors, "career-private-evaluation-action");
  }
}

async function verifyCompactWarningAndExactLedger() {
  const { context, errors, page } = await freshPage();
  try {
    await removeStarterProcessingModules(page);
    const warning = page.getByLabel("Current warning and actions", {
      exact: true,
    });
    await warning
      .getByText("Warning details and valid responses", { exact: true })
      .click();
    const warningText = await warning.innerText();
    await warning.screenshot({
      path: `${outputDirectory}/build-no-model-warning.png`,
    });
    if (!warningText.includes(`pay ${compactCurrency(0)} gross`)) {
      recordFinding(
        "build-no-model-warning-bypasses-compact-currency",
        warningText,
        `The compact warning formats its failed payout as ${compactCurrency(0)} gross.`,
      );
    }

    await openTab(page, "Jobs");
    await page.getByRole("button", { name: "64×", exact: true }).click();
    await page
      .getByRole("button", {
        name: "Queue one safe Interactive Chat job",
        exact: true,
      })
      .click();
    await page.waitForFunction((key) => {
      const raw = localStorage.getItem(key);
      if (raw === null) return false;
      return JSON.parse(raw).lastSettlement !== null;
    }, saveKey);
    const selected = page.getByLabel("Selected playable workload", {
      exact: true,
    });
    const selectedText = await selected.innerText();
    if (!selectedText.includes(`pays ${compactCurrency(0)} gross.`)) {
      recordFinding(
        "jobs-selected-failed-payout-regressed",
        selectedText,
        `Selected Jobs payout remains ${compactCurrency(0)} gross.`,
      );
    }
    await selected
      .getByText("Quote, cost, and uncertainty details", { exact: true })
      .click();
    const detailText = await selected.innerText();
    if (!detailText.includes(`failure pays ${exactCurrency(0)} gross`)) {
      recordFinding(
        "jobs-details-failed-payout-loses-exact-currency",
        detailText,
        `Jobs Details retains ${exactCurrency(0)} gross.`,
      );
    }

    await openTab(page, "Inspect");
    const ledger = page.locator(".event-log");
    await ledger.getByText(/failed before delivery/i).waitFor();
    const ledgerText = await ledger.innerText();
    await ledger.screenshot({
      path: `${outputDirectory}/inspect-failed-settlement-ledger.png`,
    });
    if (!ledgerText.includes(`Locked quote paid ${exactCurrency(0)} gross`)) {
      recordFinding(
        "inspect-ledger-failed-payout-loses-exact-currency",
        ledgerText,
        `The Inspect ledger keeps the failed payout at explicit mill precision (${exactCurrency(0)} gross), matching the exact Details disclosure.`,
      );
    }
    await page.reload({ waitUntil: "domcontentloaded" });
    await openTab(page, "Inspect");
    const reloadedLedgerText = await page.locator(".event-log").innerText();
    if (!reloadedLedgerText.includes("failed before delivery")) {
      recordFinding(
        "inspect-ledger-failed-settlement-does-not-survive-reload",
        reloadedLedgerText,
        "The failed settlement event persists across reload.",
      );
    }
  } finally {
    await closeWithErrors(context, errors, "warning-ledger-currency");
  }
}

try {
  await verifyIndependentCompactAction();
  await verifyCompactWarningAndExactLedger();
} catch (error) {
  recordFinding(
    "probe-runtime-error",
    error instanceof Error ? (error.stack ?? error.message) : String(error),
    "Every independent currency probe reaches its asserted UI state.",
  );
} finally {
  await browser.close();
}

process.stdout.write(`${JSON.stringify({ baseURL, findings }, null, 2)}\n`);
if (findings.length > 0) process.exitCode = 1;
