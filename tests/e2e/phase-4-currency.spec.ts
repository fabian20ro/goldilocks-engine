import { expect, test, type Page } from "@playwright/test";
import {
  formatCompactCurrency,
  formatExactCurrency,
} from "../../src/simulation/currency";
import { getWorkloadQuote } from "../../src/simulation/engine";
import type { SimulationState } from "../../src/simulation/types";
import {
  chooseSimulationSpeed,
  openSimulationContext,
  resealSavedRecord,
  settleStarterJob,
} from "./helpers";

const SAVE_KEY = "goldilocks-simulation-save-v4";

async function savedState(page: Page): Promise<SimulationState> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (raw === null) throw new Error("Expected a persisted simulation state");
    return JSON.parse(raw) as SimulationState;
  }, SAVE_KEY);
}

async function setSavedMoney(page: Page, money: number): Promise<void> {
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
  await page.evaluate(
    ({ key, value }) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
        resources: { money: number };
      };
      state.resources.money = value;
      localStorage.setItem(key, JSON.stringify(state));
    },
    { key: SAVE_KEY, value: money },
  );
  await resealSavedRecord(page, SAVE_KEY);
  await page.reload({ waitUntil: "domcontentloaded" });
}

async function openTab(page: Page, label: string) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: label, exact: true })
    .click();
}

async function removeStarterProcessingModules(page: Page) {
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

function queueTenRangeLabel(state: SimulationState) {
  const first = getWorkloadQuote(state, state.workloadId, 0).grossQuote;
  const last = getWorkloadQuote(state, state.workloadId, 9).grossQuote;
  return `Queue 10 · locks ${formatCompactCurrency(first)} → ${formatCompactCurrency(last)}`;
}

test("Queue 10 formats its non-additive range endpoints independently", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });

  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await openTab(page, "Jobs");
  await settleStarterJob(page);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Resume", exact: true }),
  ).toBeVisible();

  const queueTen = page.getByRole("button", { name: /^Queue 10/ });
  await expect
    .poll(async () => {
      const state = await savedState(page);
      return (await queueTen.innerText()) === queueTenRangeLabel(state);
    })
    .toBe(true);
  await queueTen.click();
  await expect
    .poll(() =>
      savedState(page).then((state) => state.jobs.waitingTasks.length),
    )
    .toBe(10);
  const quotes = (await savedState(page)).jobs.waitingTasks.map(
    (task) => task.lockedGrossQuote,
  );

  // The UI assertion above binds the visible range to the current persisted
  // quote snapshot and formats both endpoints independently. A locked quote
  // can itself legitimately have mill precision at a later Worker boundary;
  // only an undisplayed middle quote must not promote the visible endpoints.
  expect(
    quotes.slice(1, -1).some((quote) => {
      const cents = Math.round(quote * 100) / 100;
      return Math.abs(quote - cents) > 1e-9;
    }),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("keeps V-071 compact disclosures separate from exact failed-settlement accounting", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });

  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");

  await openTab(page, "Career");
  await page.getByLabel("Show Evaluation discipline", { exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Run paid private evaluation",
      exact: true,
    }),
  ).toHaveText(`Run private evaluation · ${formatCompactCurrency(0.75)}`);

  await openTab(page, "Build");
  await removeStarterProcessingModules(page);
  await openSimulationContext(page);
  const warning = page.getByLabel("Current warning and actions", {
    exact: true,
  });
  await warning
    .getByText("Warning details and valid responses", { exact: true })
    .click();
  await expect(warning).toContainText(
    `accepted tasks fail and pay ${formatCompactCurrency(0)} gross.`,
  );

  await openTab(page, "Jobs");
  await chooseSimulationSpeed(page, "64×");
  await page
    .getByRole("button", {
      name: "Queue one safe Interactive Chat job",
      exact: true,
    })
    .click();
  await expect
    .poll(() => savedState(page).then((state) => state.lastSettlement?.failed))
    .toBe(1);

  await openTab(page, "Inspect");
  const ledger = page.locator(".event-log");
  const exactFailure = `Locked quote paid ${formatExactCurrency(0)} gross; configured actual cost was ${formatExactCurrency(0.01)}. ${formatExactCurrency(0)} was paid and ${formatExactCurrency(0.01)} remains unpaid because cash cannot go below ${formatExactCurrency(0)}.`;
  await expect(ledger).toContainText(exactFailure);

  await page.reload({ waitUntil: "domcontentloaded" });
  await openTab(page, "Inspect");
  await expect(page.locator(".event-log")).toContainText(exactFailure);
  expect(errors).toEqual([]);
});

test("keeps the settlement cash floor in its promoted equation and tier requirements compact", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });

  await page.setViewportSize({ width: 393, height: 850 });
  await page.goto("/");
  await setSavedMoney(page, 0.005);
  await removeStarterProcessingModules(page);

  await openTab(page, "Jobs");
  await chooseSimulationSpeed(page, "64×");
  await page
    .getByRole("button", {
      name: "Queue one safe Interactive Chat job",
      exact: true,
    })
    .click();

  const latestSettlement = page
    .getByText("Latest settlement", { exact: true })
    .locator("..");
  await expect(latestSettlement).toContainText(
    "$0.010 configured actual costs · $0.005 paid · $0.005 unpaid because cash cannot go below $0.000",
  );

  await openTab(page, "Career");
  await page
    .getByLabel("Show Model tiers and quantization", { exact: true })
    .click();
  await expect(page.locator(".career-model-list")).toContainText(
    "Unlock with $8.00 saved, one competition submission, or one product release.",
  );
  await expect(page.locator(".career-model-list")).toContainText(
    "Unlock with $18.00 saved plus either the competition prize or $8.00 product revenue.",
  );
  expect(errors).toEqual([]);
});

test("persists capital purchase accounting at fixed three decimals", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });

  await page.setViewportSize({ width: 393, height: 850 });
  await page.goto("/");
  await setSavedMoney(page, 4);
  await openTab(page, "Jobs");
  await settleStarterJob(page);

  await openTab(page, "Upgrades");
  await page
    .getByRole("button", {
      name: "Buy Precision Cleaner for $4.00",
      exact: true,
    })
    .click();

  const expected = "Precision Cleaner purchased for $4.000 and is now owned.";
  await openTab(page, "Inspect");
  await expect(page.locator(".event-log")).toContainText(expected);
  await page.reload({ waitUntil: "domcontentloaded" });
  await openTab(page, "Inspect");
  await expect(page.locator(".event-log")).toContainText(expected);
  expect(errors).toEqual([]);
});

test("keeps the Career exit target compact and live savings exact", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });

  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await openTab(page, "Career");
  await page.getByLabel("Show Independent conclusion", { exact: true }).click();

  const exit = page.locator(".career-exit");
  await expect(exit).toContainText(
    "Bedroom Developer exit: save $24.00, submit one Cup entry, release Deskflow Local, and unlock Kiln 13B.",
  );
  await expect(exit).toContainText("Current: $3.000");
  expect(errors).toEqual([]);
});
