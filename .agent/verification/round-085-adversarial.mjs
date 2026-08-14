import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:42185";
const outputDirectory = process.env.OUTPUT_DIR ?? "/private/tmp/goldlocks-r085";
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

async function openSimulationDisclosure(page) {
  const context = page.getByTestId("simulation-context");
  const summary = context.locator(":scope > summary");
  if (!(await context.evaluate((element) => element.open)))
    await summary.click();
  return context;
}

async function normalAndLifecycleProbe(browser, viewport) {
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
    await openResearch(page);
    const initial = await page.evaluate(() => ({
      nav: [...document.querySelectorAll(".bottom-nav button")].map(
        (button) => {
          const box = button.getBoundingClientRect();
          return { height: box.height, width: box.width };
        },
      ),
      overflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
      projects: document.querySelectorAll("[data-testid^='research-project-']")
        .length,
    }));
    check(
      `${viewport.width}px Research initial layout is portrait-safe and actionable`,
      !initial.overflow &&
        initial.projects === 1 &&
        initial.nav.length === 6 &&
        initial.nav.every((box) => box.width >= 44 && box.height >= 44),
      JSON.stringify(initial),
    );
    check(
      `${viewport.width}px hidden questions are not initially exposed`,
      (await page.getByTestId("research-project-evidence-weave").count()) === 0,
      await page.locator("main").innerText(),
    );

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
    const evidenceWeaveInspect = page.getByRole("button", {
      name: "Inspect evidence for Evidence Weave",
    });
    await evidenceWeaveInspect.waitFor();
    check(
      `${viewport.width}px inspection reveals a bounded next question`,
      (await page.getByTestId("research-project-evidence-weave").count()) ===
        1 && (await evidenceWeaveInspect.isDisabled()),
      await page.locator("main").innerText(),
    );

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
    check(
      `${viewport.width}px staffed inspected project is startable`,
      await start.isEnabled(),
      await page.locator("main").innerText(),
    );
    await start.click();
    await page.getByText("Measurement in progress").waitFor();

    const simulation = await openSimulationDisclosure(page);
    await simulation.getByRole("button", { name: "64×", exact: true }).click();
    await page.waitForFunction(
      (key) => {
        const raw = localStorage.getItem(key);
        return raw !== null && JSON.parse(raw).research?.lastOutcome !== null;
      },
      saveKey,
      { timeout: 15_000 },
    );
    await openResearch(page);
    await page.getByText("Latest measurement").waitFor();
    await page
      .locator(".pending-decision")
      .filter({ hasText: "Outcome:" })
      .waitFor();
    const outcomeText = await page.locator(".research-outcome").innerText();
    const normalizedOutcomeText = outcomeText.toLowerCase();
    check(
      `${viewport.width}px measurement produces useful retained outcome`,
      normalizedOutcomeText.includes("latest measurement") &&
        normalizedOutcomeText.includes("knowledge +") &&
        (await page.locator(".pending-decision").innerText()).includes(
          "Outcome:",
        ),
      outcomeText,
    );

    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForSave(page);
    await openResearch(page);
    check(
      `${viewport.width}px completed Research outcome survives reload`,
      (await page.locator(".research-outcome").count()) === 1,
      await page.locator("main").innerText(),
    );
    await page.locator("html[data-offline-ready='true']").waitFor();
    await context.setOffline(true);
    try {
      await page.reload({ waitUntil: "domcontentloaded" });
      await waitForSave(page);
      await openResearch(page);
      check(
        `${viewport.width}px completed Research outcome survives offline reload`,
        (await page.locator(".research-outcome").count()) === 1,
        await page.locator("main").innerText(),
      );
    } finally {
      await context.setOffline(false);
    }
    check(
      `${viewport.width}px Research flow has no page or console errors`,
      errors.length === 0,
      JSON.stringify(errors),
    );
    await page.screenshot({
      path: `${outputDirectory}/research-${viewport.width}-completed.png`,
      fullPage: true,
    });
  } finally {
    await context.close();
  }
}

async function malformedActiveProjectProbe(browser) {
  const context = await browser.newContext({
    serviceWorkers: "allow",
    viewport: { width: 393, height: 742 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  try {
    await seedRecognized(page);
    await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      if (raw === null) throw new Error("No persisted simulation state.");
      const state = JSON.parse(raw);
      state.research.goal = null;
      state.research.frontier.inspectedProjectIds = ["context-reconstruction"];
      state.research.recruitedResearcherIds = ["mira-voss"];
      state.research.availableResearcherIds = [];
      state.research.teamMemberIds = ["mira-voss"];
      state.research.activeProject = {
        projectId: "context-reconstruction",
        startedAtTick: state.tick,
        elapsedHours: 0,
        expectedDurationHours: 0.6,
        committedCost: 0,
      };
      localStorage.setItem(key, JSON.stringify(state));
    }, saveKey);
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForSave(page);
    await openResearch(page);
    const active = await page.locator(".research-active").count();
    check(
      "Malformed active Research without a goal is rejected on restore",
      active === 0,
      JSON.stringify({ active, text: await page.locator("main").innerText() }),
    );
    check(
      "Malformed Research restore has no page or console errors",
      errors.length === 0,
      JSON.stringify(errors),
    );
  } finally {
    await context.close();
  }
}

async function touchAndScaledResearchProbe(browser) {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    serviceWorkers: "allow",
    viewport: { width: 393, height: 742 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  try {
    await seedRecognized(page);
    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("button", { name: "Research", exact: true })
      .tap();
    await page.getByRole("heading", { name: "Research console" }).waitFor();
    await page
      .getByRole("textbox", { name: "Research goal" })
      .fill("Touch and scale the research flow");
    await page.getByRole("button", { name: "Save research goal" }).tap();
    await page
      .getByRole("button", {
        name: "Inspect evidence for Context Reconstruction",
      })
      .tap();
    await page.getByRole("button", { name: /Recruit Mira Voss/ }).tap();
    await page
      .getByRole("button", { name: "Add Mira Voss to research team" })
      .tap();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addStyleTag({
      content: ":root { font-size: 200% !important; }",
    });
    const geometry = await page.evaluate(() => {
      const visible = (element) => {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
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
        .filter(visible)
        .map((element) => {
          const box = element.getBoundingClientRect();
          return {
            height: box.height,
            text: element.textContent?.trim(),
            width: box.width,
          };
        })
        .filter(({ height, width }) => height < 44 || width < 44);
      return {
        overflow:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
        undersized,
      };
    });
    check(
      "393px touch Research remains usable at 200% reduced motion",
      !geometry.overflow && geometry.undersized.length === 0,
      JSON.stringify(geometry),
    );
    check(
      "393px touch Research has no page or console errors",
      errors.length === 0,
      JSON.stringify(errors),
    );
    await page.screenshot({
      path: `${outputDirectory}/research-393-touch-200-reduced.png`,
      fullPage: true,
    });
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true });
try {
  await normalAndLifecycleProbe(browser, { width: 320, height: 693 });
  await normalAndLifecycleProbe(browser, { width: 393, height: 742 });
  await malformedActiveProjectProbe(browser);
  await touchAndScaledResearchProbe(browser);
} finally {
  await browser.close();
}

console.log(JSON.stringify({ findings }, null, 2));
if (findings.length > 0) process.exitCode = 1;
