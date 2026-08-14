import { chromium } from "playwright";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:42193";
const saveKey = "goldilocks-simulation-save-v4";
const findings = [];

function check(name, condition, evidence) {
  if (!condition) findings.push({ name, evidence });
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

async function seedRecognized(page, mutate) {
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await waitForSave(page);
  await page.evaluate(
    ({ key, change }) => {
      const raw = localStorage.getItem(key);
      if (raw === null) throw new Error("No persisted simulation state.");
      const state = JSON.parse(raw);
      state.resources.money = 10;
      state.resources.reputation = 0.6;
      state.jobs.completed = 1;
      state.jobs.paused = true;
      const changeFunction = new Function(`return (${change})`)();
      changeFunction(state);
      localStorage.setItem(key, JSON.stringify(state));
    },
    { key: saveKey, change: mutate.toString() },
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForSave(page);
}

const browser = await chromium.launch({ headless: true });
try {
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

  await seedRecognized(page, (state) => {
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
  });
  await openResearch(page);
  const forgedProject = page.getByTestId("research-project-negative-space");
  const forgedStart = page.getByRole("button", {
    name: /Start Negative-Space Audit/,
  });
  check(
    "stale Research restore does not expose forged hidden progression",
    (await forgedProject.count()) === 0 || (await forgedStart.isDisabled()),
    JSON.stringify({
      projectVisible: (await forgedProject.count()) > 0,
      startDisabled: (await forgedStart.count())
        ? await forgedStart.isDisabled()
        : null,
      body: await page.locator("main").innerText(),
    }),
  );
  await context.close();

  const signatureContext = await browser.newContext({
    serviceWorkers: "allow",
    viewport: { width: 393, height: 742 },
  });
  const signaturePage = await signatureContext.newPage();
  const signatureErrors = [];
  signaturePage.on("pageerror", (error) =>
    signatureErrors.push(`page: ${error.message}`),
  );
  signaturePage.on("console", (message) => {
    if (message.type() === "error")
      signatureErrors.push(`console: ${message.text()}`);
  });
  await seedRecognized(signaturePage, (state) => {
    state.research.goal = {
      text: "Find durable evidence",
      createdAtTick: state.tick,
      status: "pending",
    };
    state.research.availableResearcherIds = [];
    state.research.recruitedResearcherIds = ["orin-kade"];
    state.research.teamMemberIds = ["orin-kade"];
    state.research.chemistry = 0.45;
  });
  await openResearch(signaturePage);
  const action = signaturePage.getByRole("button", {
    name: "Use First-Principles Reconstruction",
  });
  await action.click();
  await signaturePage.waitForFunction(
    (key) =>
      JSON.parse(localStorage.getItem(key) ?? "null").research
        .firstPrinciplesUses === 1,
    saveKey,
  );
  const once = await signaturePage.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null");
    return {
      firstPrinciplesUses: state.research.firstPrinciplesUses,
      institutionalKnowledge: state.research.institutionalKnowledge,
      money: state.resources.money,
    };
  }, saveKey);
  await action.click();
  await signaturePage.waitForFunction(
    (key) =>
      JSON.parse(localStorage.getItem(key) ?? "null").research
        .firstPrinciplesUses === 2,
    saveKey,
  );
  const twice = await signaturePage.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null");
    return {
      firstPrinciplesUses: state.research.firstPrinciplesUses,
      institutionalKnowledge: state.research.institutionalKnowledge,
      money: state.resources.money,
      activeProject: state.research.activeProject,
    };
  }, saveKey);
  check(
    "First-Principles Reconstruction cannot be spammed into free knowledge",
    twice.firstPrinciplesUses === once.firstPrinciplesUses &&
      twice.institutionalKnowledge === once.institutionalKnowledge &&
      twice.money === once.money,
    JSON.stringify({ once, twice }),
  );
  check(
    "Research signature-action flow has no page or console errors",
    signatureErrors.length === 0 && errors.length === 0,
    JSON.stringify({ errors, signatureErrors }),
  );
  await signatureContext.close();
} finally {
  await browser.close();
}

console.log(JSON.stringify({ findings }, null, 2));
process.exitCode = findings.length === 0 ? 0 : 1;
