import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:42291";
const outputDir = process.env.OUTPUT_DIR ?? "/private/tmp/goldlocks-r088-shots";
const saveKey = "goldilocks-simulation-save-v4";
const findings = [];

function check(name, condition, evidence) {
  if (!condition) findings.push({ name, evidence });
}

function observeErrors(page, errors) {
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
}

async function waitForSave(page) {
  await page.getByRole("heading", { name: "Goldilocks Engine" }).waitFor();
  await page.waitForFunction(
    (key) => localStorage.getItem(key) !== null,
    saveKey,
  );
}

async function waitForSafeResearch(page) {
  await page.waitForFunction((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null");
    return (
      state?.research?.frontier?.discoveredProjectIds?.length === 1 &&
      state.research.goal === null &&
      state.research.activeProject === null &&
      state.research.firstPrinciplesUses === 0
    );
  }, saveKey);
}

async function openResearch(page) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Research", exact: true })
    .click();
  await page.getByRole("heading", { name: "Research console" }).waitFor();
}

async function seedStaleResearch(page, forge) {
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await waitForSave(page);
  await page.evaluate(
    ({ key, forge }) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null");
      state.resources.money = 10;
      state.resources.reputation = 0.6;
      state.jobs.completed = 1;
      state.jobs.paused = true;
      const mutate = new Function(`return (${forge})`)();
      mutate(state);
      localStorage.setItem(key, JSON.stringify(state));
    },
    { key: saveKey, forge: forge.toString() },
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForSave(page);
  await waitForSafeResearch(page);
}

async function captureCommandDeck(browser) {
  for (const viewport of [
    { width: 320, height: 693 },
    { width: 393, height: 742 },
  ]) {
    const context = await browser.newContext({
      serviceWorkers: "allow",
      viewport,
      locale: "en-US",
      timezoneId: "Europe/Bucharest",
    });
    const page = await context.newPage();
    const errors = [];
    observeErrors(page, errors);
    await page.goto(baseURL, { waitUntil: "domcontentloaded" });
    await waitForSave(page);
    for (const tab of [
      "Build",
      "Jobs",
      "Career",
      "Upgrades",
      "Inspect",
      "Research",
    ]) {
      await page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("button", { name: tab, exact: true })
        .click();
      await page.screenshot({
        path: `${outputDir}/${viewport.width}-${tab.toLowerCase()}.png`,
        fullPage: true,
      });
    }
    check(
      `command-deck ${viewport.width}px has no page or console errors`,
      errors.length === 0,
      JSON.stringify(errors),
    );
    await context.close();
  }
}

async function checkStaleRecovery(browser, viewport) {
  const context = await browser.newContext({
    serviceWorkers: "allow",
    viewport,
    locale: "en-US",
    timezoneId: "Europe/Bucharest",
  });
  const page = await context.newPage();
  const errors = [];
  observeErrors(page, errors);
  await seedStaleResearch(page, (state) => {
    state.research.frontier.discoveredProjectIds = [
      "context-reconstruction",
      "negative-space",
    ];
    state.research.frontier.inspectedProjectIds = [
      "context-reconstruction",
      "negative-space",
    ];
    state.research.frontier.completedProjectIds = ["context-reconstruction"];
    state.research.goal = {
      text: "Forged progression",
      createdAtTick: state.tick,
      status: "pending",
    };
    state.research.availableResearcherIds = [];
    state.research.recruitedResearcherIds = ["mira-voss"];
    state.research.teamMemberIds = ["mira-voss"];
    state.research.institutionalKnowledge = 1;
    state.research.activeProject = {
      projectId: "context-reconstruction",
      startedAtTick: state.tick,
      elapsedHours: 0,
      expectedDurationHours: 0.5,
      committedCost: 0.4,
    };
  });
  await openResearch(page);
  const negativeProject = page.getByTestId("research-project-negative-space");
  check(
    `stale Research restore clears forged progression at ${viewport.width}px`,
    (await negativeProject.count()) === 0 &&
      (await page.locator(".research-active").count()) === 0 &&
      (await page
        .getByRole("textbox", { name: "Research goal" })
        .inputValue()) === "",
    JSON.stringify({
      negativeVisible: (await negativeProject.count()) > 0,
      activeVisible: (await page.locator(".research-active").count()) > 0,
      goal: await page
        .getByRole("textbox", { name: "Research goal" })
        .inputValue(),
    }),
  );
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForSafeResearch(page);
  check(
    `stale Research recovery remains safe offline at ${viewport.width}px`,
    JSON.stringify(
      await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key) ?? "null").research,
        saveKey,
      ),
    ).includes('"firstPrinciplesUses":0'),
    await page.evaluate((key) => localStorage.getItem(key), saveKey),
  );
  check(
    `stale Research recovery has no page or console errors at ${viewport.width}px`,
    errors.length === 0,
    JSON.stringify(errors),
  );
  await context.close();
}

async function checkAuthorizedSignature(browser) {
  const context = await browser.newContext({
    serviceWorkers: "allow",
    viewport: { width: 393, height: 742 },
    locale: "en-US",
    timezoneId: "Europe/Bucharest",
  });
  const page = await context.newPage();
  const errors = [];
  observeErrors(page, errors);
  await seedStaleResearch(page, () => {});
  await openResearch(page);
  await page
    .getByRole("textbox", { name: "Research goal" })
    .fill("Find durable evidence");
  await page.getByRole("button", { name: "Save research goal" }).click();
  await page
    .getByRole("button", {
      name: "Inspect evidence for Context Reconstruction",
    })
    .click();
  const recruit = page.getByRole("button", { name: /Recruit Orin Kade/ });
  await recruit.scrollIntoViewIfNeeded();
  await recruit.click();
  await page
    .getByRole("button", { name: "Add Orin Kade to research team" })
    .click();
  const signature = page.getByRole("button", {
    name: "Use First-Principles Reconstruction",
  });
  await signature.scrollIntoViewIfNeeded();
  await signature.click();
  await page.waitForFunction(
    (key) =>
      JSON.parse(localStorage.getItem(key) ?? "null").research
        .firstPrinciplesUses === 1,
    saveKey,
  );
  const once = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null");
    return {
      firstPrinciplesUses: state.research.firstPrinciplesUses,
      institutionalKnowledge: state.research.institutionalKnowledge,
      money: state.resources.money,
    };
  }, saveKey);
  await signature.click();
  await page.waitForFunction((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null");
    return (
      state.research.firstPrinciplesUses === 1 &&
      state.ledger.at(-1)?.message.includes("already retained")
    );
  }, saveKey);
  const twice = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null");
    return {
      firstPrinciplesUses: state.research.firstPrinciplesUses,
      institutionalKnowledge: state.research.institutionalKnowledge,
      money: state.resources.money,
      lastLedgerMessage: state.ledger.at(-1)?.message,
    };
  }, saveKey);
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForSave(page);
  const afterReload = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null").research,
    saveKey,
  );
  check(
    "authorized signature is one-use, cost-bounded, and persists through reload",
    once.firstPrinciplesUses === 1 &&
      twice.firstPrinciplesUses === 1 &&
      twice.institutionalKnowledge === once.institutionalKnowledge &&
      twice.money === once.money &&
      afterReload.firstPrinciplesUses === 1,
    JSON.stringify({ once, twice, afterReload }),
  );
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForSave(page);
  const offline = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null").research,
    saveKey,
  );
  check(
    "authorized signature bound survives an offline reload",
    offline.firstPrinciplesUses === 1 &&
      offline.institutionalKnowledge === once.institutionalKnowledge,
    JSON.stringify(offline),
  );
  check(
    "authorized signature UI has no page or console errors",
    errors.length === 0,
    JSON.stringify(errors),
  );
  await context.close();
}

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  await captureCommandDeck(browser);
  await checkStaleRecovery(browser, { width: 320, height: 693 });
  await checkStaleRecovery(browser, { width: 393, height: 742 });
  await checkAuthorizedSignature(browser);
} finally {
  await browser.close();
}

console.log(JSON.stringify({ findings, outputDir }, null, 2));
process.exitCode = findings.length === 0 ? 0 : 1;
