import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:42191";
const outputDirectory =
  process.env.OUTPUT_DIR ?? "/private/tmp/goldlocks-r086-future";
const saveKey = "goldilocks-simulation-save-v4";
const findings = [];

await mkdir(outputDirectory, { recursive: true });

function check(name, condition, evidence) {
  if (!condition) findings.push({ evidence, name });
}

async function waitForSave(page) {
  await page.getByRole("heading", { name: "Goldilocks Engine" }).waitFor();
  await page.waitForFunction(
    (key) => localStorage.getItem(key) !== null,
    saveKey,
  );
}

async function openResearch(page) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Research", exact: true })
    .click();
  await page.getByRole("heading", { name: "Research console" }).waitFor();
}

async function seedRecognized(page) {
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await waitForSave(page);
  await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (raw === null) throw new Error("No persisted simulation state.");
    const state = JSON.parse(raw);
    state.resources.money = 8;
    state.resources.reputation = 0.2;
    state.jobs.completed = 1;
    state.jobs.paused = true;
    localStorage.setItem(key, JSON.stringify(state));
  }, saveKey);
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForSave(page);
}

async function createActiveProject(page) {
  await openResearch(page);
  await page
    .getByRole("textbox", { name: "Research goal" })
    .fill("Find robust evidence for safer delivery");
  await page.getByRole("button", { name: "Save research goal" }).click();
  await page
    .getByRole("button", {
      name: "Inspect evidence for Context Reconstruction",
    })
    .click();
  await page.getByTestId("research-project-evidence-weave").waitFor();
  await page.getByRole("button", { name: /Recruit Mira Voss/ }).click();
  await page
    .getByRole("button", { name: "Add Mira Voss to research team" })
    .click();
  const start = page.getByRole("button", {
    name: /Start Context Reconstruction/,
  });
  await start.waitFor();
  await page.waitForFunction(() => {
    const button = [...document.querySelectorAll("button")].find((item) =>
      item.textContent?.includes("Start Context Reconstruction"),
    );
    return button instanceof HTMLButtonElement && !button.disabled;
  });
  await start.click();
  await page.locator(".research-active").waitFor();
}

async function futureTimestampProbe(viewport) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    serviceWorkers: "allow",
    viewport,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });

  try {
    await seedRecognized(page);
    await createActiveProject(page);
    const stored = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      if (raw === null) throw new Error("No active Research save.");
      const state = JSON.parse(raw);
      const futureTick = state.tick + 999999;
      state.research.goal.createdAtTick = futureTick;
      state.research.activeProject.startedAtTick = futureTick;
      localStorage.setItem(key, JSON.stringify(state));
      return {
        activeStartedAtTick: state.research.activeProject.startedAtTick,
        goalCreatedAtTick: state.research.goal.createdAtTick,
        tick: state.tick,
      };
    }, saveKey);

    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForSave(page);
    await openResearch(page);
    const restored = await page.evaluate(() => ({
      activeCount: document.querySelectorAll(".research-active").length,
      bodyText: document.querySelector("main")?.innerText ?? "",
    }));
    check(
      `${viewport.width}px future-dated Research save is safely recovered`,
      restored.activeCount === 0,
      JSON.stringify({ stored, restored, errors }),
    );
    check(
      `${viewport.width}px future-dated Research reload has no page errors`,
      errors.length === 0,
      JSON.stringify({ stored, restored, errors }),
    );
    return { errors, restored, stored };
  } finally {
    await context.close();
    await browser.close();
  }
}

const results = {};
for (const viewport of [
  { height: 742, width: 393 },
  { height: 693, width: 320 },
]) {
  results[viewport.width] = await futureTimestampProbe(viewport);
}

console.log(JSON.stringify({ findings, results }, null, 2));
process.exitCode = findings.length === 0 ? 0 : 1;
