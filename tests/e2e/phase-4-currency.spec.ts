import { expect, test, type Page } from "@playwright/test";
import {
  formatCompactCurrency,
  formatExactCurrency,
} from "../../src/simulation/currency";
import { getWorkloadQuote } from "../../src/simulation/engine";
import type { SimulationState } from "../../src/simulation/types";
import { settleStarterJob } from "./helpers";

const SAVE_KEY = "goldilocks-simulation-save-v4";

async function savedState(page: Page): Promise<SimulationState> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (raw === null) throw new Error("Expected a persisted simulation state");
    return JSON.parse(raw) as SimulationState;
  }, SAVE_KEY);
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
  const first = quotes[0] ?? 0;
  const last = quotes.at(-1) ?? 0;

  expect(first).toBeCloseTo(Math.round(first * 100) / 100, 10);
  expect(last).toBeCloseTo(Math.round(last * 100) / 100, 10);
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
  await page.getByRole("button", { name: "64×", exact: true }).click();
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
