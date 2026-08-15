import { spawn } from "node:child_process";
import { chromium } from "playwright";

const ROOT = process.cwd();
const PORT = Number(process.env.PORT ?? "42493");
const BASE_URL = `http://127.0.0.1:${PORT}/`;
const SAVE_KEY = "goldilocks-simulation-save-v4";
const findings = [];

function check(name, condition, evidence) {
  if (!condition) findings.push({ name, evidence });
}

async function waitForServer() {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(BASE_URL);
      if (response.ok) return;
    } catch {
      // The preview is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("E2E preview did not become ready");
}

async function seedLaboratory(page, activeRun) {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    (key) => localStorage.getItem(key) !== null,
    SAVE_KEY,
  );
  await page.evaluate(
    ({ key, activeRun }) => {
      const current = JSON.parse(localStorage.getItem(key) ?? "null");
      if (!current) throw new Error("Initial simulation save missing");
      const tick = current.tick;
      const scenarioProgress = {
        ...current.laboratory.scenarioProgress,
        "limited-hardware": 1,
      };
      current.resources.money = 100;
      current.career.runEnding = null;
      current.laboratory = {
        ...current.laboratory,
        unlocked: true,
        unlockedAtTick: tick,
        scenarioId: "limited-hardware",
        scenarioUnlockIds: ["limited-hardware"],
        scenarioProgress,
        machines: [
          { id: "bench-node", acquiredAtTick: 0 },
          { id: "parallel-rack", acquiredAtTick: 0 },
        ],
        pipelines: [
          {
            id: "reproducibility",
            machineIds: ["bench-node"],
            waitingRuns: activeRun ? 0 : 0,
            activeRun: activeRun
              ? {
                  startedAtTick: tick,
                  elapsedHours: 0,
                  expectedDurationHours: 100,
                  committedCost: 0.2,
                }
              : null,
            completedRuns: activeRun ? 0 : 1,
            failedRuns: 0,
            lastRunTick: activeRun ? null : tick,
          },
          {
            id: "research",
            machineIds: ["parallel-rack"],
            waitingRuns: 0,
            activeRun: null,
            completedRuns: 1,
            failedRuns: 0,
            lastRunTick: tick,
          },
        ],
        collaboratorIds: ["orin-kade"],
        cultureId: "evidence-first",
        reproducibility: {
          versionedConfigs: true,
          lockedSeeds: true,
          independentEvaluation: true,
          documentedRuns: 2,
          score: 0.9,
        },
        foundingDecision: null,
        pendingDecision: activeRun
          ? "Finish all active and queued laboratory runs before founding the lab."
          : "Choose a founding route.",
        lastRun: {
          pipelineId: "research",
          completed: true,
          startedAtTick: tick,
          finishedAtTick: tick,
          reproducibilityScore: 0.9,
          note: "A retained research trace is available.",
        },
        totalOperatingCost: 0,
      };
      const payload = { ...current };
      delete payload.integrity;
      const serialized = JSON.stringify(payload);
      let hash = 0x811c9dc5;
      for (let index = 0; index < serialized.length; index += 1) {
        hash ^= serialized.charCodeAt(index);
        hash = Math.imul(hash, 0x01000193);
      }
      current.integrity = {
        algorithm: "fnv1a-32-json-v1",
        digest: (hash >>> 0).toString(16).padStart(8, "0"),
      };
      localStorage.setItem(key, JSON.stringify(current));
    },
    { key: SAVE_KEY, activeRun },
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    (key) =>
      JSON.parse(localStorage.getItem(key) ?? "null").laboratory?.unlocked,
    SAVE_KEY,
  );
}

async function inspectWidth(browser, width) {
  const context = await browser.newContext({
    hasTouch: true,
    serviceWorkers: "allow",
    viewport: { width, height: 742 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  try {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await seedLaboratory(page, true);
    await page.getByRole("button", { name: "Lab", exact: true }).tap();
    await page.getByRole("heading", { name: "Local Laboratory" }).waitFor();
    await page.waitForFunction(
      () => navigator.serviceWorker.controller !== null,
    );
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    const layout = await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    check(
      `active Lab ${width}px has no 200% overflow`,
      layout.scrollWidth <= layout.width + 1,
      layout,
    );
    const founding = page.getByRole("button", {
      name: /Independent laboratory/,
    });
    await founding.waitFor();
    check(
      `active Lab ${width}px blocks founding`,
      await founding.isDisabled(),
      {
        active: await page.evaluate(
          (key) =>
            JSON.parse(localStorage.getItem(key) ?? "null").laboratory
              .pipelines,
          SAVE_KEY,
        ),
      },
    );
    check(
      `active Lab ${width}px explains lifecycle block`,
      await page
        .getByRole("list", { name: "Laboratory founding requirements" })
        .getByText(
          /Finish all active and queued laboratory runs before founding/,
        )
        .isVisible(),
      null,
    );
    const before = await page.evaluate(
      (key) => localStorage.getItem(key),
      SAVE_KEY,
    );
    await page.reload({ waitUntil: "domcontentloaded" });
    const afterReload = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? "null"),
      SAVE_KEY,
    );
    check(
      `active Lab ${width}px preserves active run after reload`,
      afterReload.laboratory.pipelines.some(
        (pipeline) => pipeline.activeRun !== null,
      ) && afterReload.career.runEnding === null,
      afterReload.laboratory.pipelines,
    );
    check(
      `active Lab ${width}px retains persisted save identity`,
      typeof before === "string" &&
        typeof afterReload.integrity?.digest === "string",
      {
        beforePresent: typeof before === "string",
        digest: afterReload.integrity?.digest,
      },
    );
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    const offline = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? "null"),
      SAVE_KEY,
    );
    check(
      `active Lab ${width}px offline reload does not found or complete`,
      offline.career.runEnding === null &&
        offline.laboratory.pipelines.some(
          (pipeline) => pipeline.activeRun !== null,
        ),
      offline.laboratory.pipelines,
    );
    await context.setOffline(false);

    await seedLaboratory(page, false);
    await page.getByRole("button", { name: "Lab", exact: true }).tap();
    const readyFounding = page.getByRole("button", {
      name: /Independent laboratory/,
    });
    await readyFounding.waitFor();
    check(
      `ready Lab ${width}px enables founding`,
      !(await readyFounding.isDisabled()),
      null,
    );
    await readyFounding.tap();
    await page.waitForFunction(
      (key) =>
        JSON.parse(localStorage.getItem(key) ?? "null").career?.runEnding,
      SAVE_KEY,
    );
    const ended = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? "null"),
      SAVE_KEY,
    );
    check(
      `ready Lab ${width}px founding closes only settled route`,
      ended.career.runEnding !== null &&
        ended.laboratory.foundingDecision === "independent-laboratory" &&
        ended.laboratory.pipelines.every(
          (pipeline) =>
            pipeline.activeRun === null && pipeline.waitingRuns === 0,
        ),
      {
        ending: ended.career.runEnding,
        decision: ended.laboratory.foundingDecision,
        pipelines: ended.laboratory.pipelines,
      },
    );
    check(
      `Lab ${width}px has no page/console errors`,
      errors.length === 0,
      errors,
    );
  } finally {
    await context.close();
  }
}

const server = spawn("./scripts/run-e2e", {
  cwd: ROOT,
  detached: true,
  env: { ...process.env, E2E_PORT: String(PORT) },
  stdio: "ignore",
});
let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  await inspectWidth(browser, 320);
  await inspectWidth(browser, 393);
} finally {
  await browser?.close();
  if (server.pid) {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      // The server group may already have exited after a failed startup.
    }
  }
}

console.log(JSON.stringify({ findings }, null, 2));
process.exitCode = findings.length === 0 ? 0 : 1;
