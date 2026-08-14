import { spawn } from "node:child_process";
import { chromium } from "playwright";

const ROOT = process.cwd();
const PORT = Number(process.env.PORT ?? "42492");
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

async function seedActiveLaboratory(page) {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    (key) => localStorage.getItem(key) !== null,
    SAVE_KEY,
  );
  await page.evaluate((key) => {
    const current = JSON.parse(localStorage.getItem(key) ?? "null");
    if (!current) throw new Error("Initial simulation save missing");
    const lab = current.laboratory;
    const scenarioProgress = {
      ...lab.scenarioProgress,
      "limited-hardware": 1,
    };
    current.resources.money = 100;
    current.career.runEnding = null;
    current.research.recruitedResearcherIds = ["orin-kade"];
    current.laboratory = {
      ...lab,
      unlocked: true,
      unlockedAtTick: 0,
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
          waitingRuns: 0,
          activeRun: {
            startedAtTick: 0,
            elapsedHours: 0.01,
            expectedDurationHours: 100,
            committedCost: 0.2,
          },
          completedRuns: 0,
          failedRuns: 0,
          lastRunTick: null,
        },
        {
          id: "research",
          machineIds: ["bench-node"],
          waitingRuns: 0,
          activeRun: null,
          completedRuns: 1,
          failedRuns: 0,
          lastRunTick: 0,
        },
      ],
      collaboratorIds: ["orin-kade"],
      cultureId: "evidence-first",
      reproducibility: {
        versionedConfigs: true,
        lockedSeeds: true,
        independentEvaluation: true,
        documentedRuns: 1,
        score: 0.8,
      },
      foundingDecision: null,
      pendingDecision: "Finish the active run before founding.",
      lastRun: {
        pipelineId: "research",
        completed: true,
        startedAtTick: 0,
        finishedAtTick: 0,
        reproducibilityScore: 0.8,
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
  }, SAVE_KEY);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    (key) =>
      JSON.parse(localStorage.getItem(key) ?? "null").laboratory?.unlocked,
    SAVE_KEY,
  );
}

async function checkWidth(browser, width) {
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
    await seedActiveLaboratory(page);
    await page.getByRole("button", { name: "Lab", exact: true }).tap();
    await page.getByRole("heading", { name: "Local Laboratory" }).waitFor();
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    const layout = await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    check(
      `Lab ${width}px has no 200% overflow`,
      layout.scrollWidth <= layout.width + 1,
      layout,
    );

    const founding = page.getByRole("button", {
      name: /Independent laboratory/,
    });
    await founding.waitFor();
    check(
      `Lab ${width}px exposes founding action`,
      !(await founding.isDisabled()),
      null,
    );
    await founding.tap();
    await page.waitForFunction((key) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null");
      return (
        state?.career?.runEnding?.id === "honest-foundation" &&
        state.laboratory.pipelines.some(
          (pipeline) => pipeline.activeRun !== null,
        )
      );
    }, SAVE_KEY);
    const afterFounding = await page.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null");
      return {
        ending: state?.career?.runEnding?.id ?? null,
        active: state?.laboratory?.pipelines
          ?.filter((pipeline) => pipeline.activeRun !== null)
          .map((pipeline) => pipeline.id),
      };
    }, SAVE_KEY);
    check(
      `Lab ${width}px exposes no active run after founding`,
      afterFounding.active.length === 0,
      afterFounding,
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
  await checkWidth(browser, 320);
  await checkWidth(browser, 393);
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
