import { expect, test, type Page } from "@playwright/test";
import { formatCompactCurrency } from "../../src/simulation/currency";
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
  await page.getByRole("button", { name: "Jobs", exact: true }).click();
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
