import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:42391";
const outputDir = process.env.OUTPUT_DIR ?? "/private/tmp/goldlocks-r089-shots";
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

async function seedRecognized(page) {
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await waitForSave(page);
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null");
    state.resources.reputation = 0.2;
    state.jobs.completed = 1;
    state.jobs.paused = true;
    localStorage.setItem(key, JSON.stringify(state));
  }, saveKey);
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForSave(page);
  await page.waitForFunction(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null").hypeFear.unlocked,
    saveKey,
  );
}

async function openWorld(page) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "World", exact: true })
    .click();
  await page.getByRole("heading", { name: "Hype & Fear" }).waitFor();
}

async function geometry(page, label) {
  const result = await page.evaluate(() => {
    const actionable = [...document.querySelectorAll("button, summary")];
    return {
      overflow:
        document.documentElement.scrollWidth >
          document.documentElement.clientWidth + 1 ||
        document.body.scrollWidth > document.body.clientWidth + 1,
      small: actionable
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            text: element.textContent?.trim().slice(0, 60),
            width: rect.width,
            height: rect.height,
          };
        })
        .filter(
          ({ width, height }) => width > 0 && (width < 44 || height < 44),
        ),
    };
  });
  check(`${label} has no horizontal overflow`, !result.overflow, result);
  check(
    `${label} has 44px actionable controls`,
    result.small.length === 0,
    result.small,
  );
}

async function normalFlow(browser, viewport) {
  const context = await browser.newContext({
    serviceWorkers: "allow",
    hasTouch: true,
    viewport,
    locale: "en-US",
    timezoneId: "Europe/Bucharest",
  });
  const page = await context.newPage();
  const errors = [];
  observeErrors(page, errors);
  await seedRecognized(page);
  await openWorld(page);
  await page.screenshot({
    path: `${outputDir}/world-initial-${viewport.width}.png`,
    fullPage: true,
  });
  const cardText = await page.getByTestId("narrative-card").innerText();
  check(
    `initial narrative exposes its deadline at ${viewport.width}px`,
    /2\.5H/i.test(cardText),
    cardText,
  );
  await page.getByTestId("narrative-card").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `${outputDir}/world-card-${viewport.width}.png`,
    fullPage: false,
  });
  await geometry(page, `World initial ${viewport.width}px`);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await geometry(page, `World 200% text ${viewport.width}px`);
  await page.screenshot({
    path: `${outputDir}/world-200-${viewport.width}.png`,
    fullPage: false,
  });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "100%";
  });

  await page.getByRole("button", { name: "Cover with Rhea Sol" }).tap();
  await page.getByRole("button", { name: "Predict a narrower result" }).tap();
  await expectText(page, /Countdown active/);
  const countdownState = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null").hypeFear,
    saveKey,
  );
  await page.screenshot({
    path: `${outputDir}/world-countdown-${viewport.width}.png`,
    fullPage: true,
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await openWorld(page);
  const reloadedState = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null").hypeFear,
    saveKey,
  );
  check(
    `countdown survives reload at ${viewport.width}px`,
    reloadedState.narratives[0]?.status === "countdown" &&
      reloadedState.narratives[0]?.deadlineTick ===
        countdownState.narratives[0]?.deadlineTick,
    {
      before: countdownState.narratives[0],
      after: reloadedState.narratives[0],
    },
  );

  await page
    .getByTestId("simulation-context")
    .locator("summary")
    .first()
    .click();
  await page.getByRole("button", { name: "64×" }).click();
  await page
    .getByText(/Response required/)
    .first()
    .waitFor({ timeout: 15_000 });
  await page.screenshot({
    path: `${outputDir}/world-hype-response-${viewport.width}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Publish supported evidence" }).tap();
  await page.getByTestId("narrative-card").waitFor();

  // The second template is a fear narrative. Cover/predict it, then verify the
  // separate fear response and response-required doom-feed entry.
  const secondCreator = page.getByRole("button", {
    name: "Cover with Cass Orbit",
  });
  if (await secondCreator.count()) {
    await secondCreator.tap();
    await page.getByRole("button", { name: "Predict a delay" }).tap();
    await page
      .getByText(/Response required/)
      .first()
      .waitFor({ timeout: 15_000 });
    check(
      `fear response and doom feed are distinct at ${viewport.width}px`,
      (await page
        .getByRole("button", { name: "Publish boundaries" })
        .count()) === 1 &&
        (await page.getByTestId("doom-feed").innerText()).includes(
          "Response required",
        ),
      await page.getByTestId("doom-feed").innerText(),
    );
    await page.getByRole("button", { name: "Publish boundaries" }).tap();
  }
  check(
    `World flow has no page/console errors at ${viewport.width}px`,
    errors.length === 0,
    errors,
  );
  await context.close();
}

async function expectText(page, pattern) {
  await page.getByText(pattern).waitFor();
}

async function lockedToolBoundary(browser) {
  const context = await browser.newContext({
    serviceWorkers: "allow",
    hasTouch: true,
    viewport: { width: 393, height: 742 },
  });
  const page = await context.newPage();
  const errors = [];
  observeErrors(page, errors);
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await waitForSave(page);
  await openWorld(page);
  const tool = page.getByRole("button", { name: "Fast new runtime" });
  const before = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null").hypeFear,
    saveKey,
  );
  check(
    "unrecognized World shows its locked status",
    (await page.getByText(/not recognized yet/i).count()) === 1,
    await page.locator("main").innerText(),
  );
  check(
    "unrecognized tool switch is disabled",
    await tool.isDisabled(),
    await tool.getAttribute("disabled"),
  );
  if (!(await tool.isDisabled())) await tool.tap();
  await page.waitForTimeout(250);
  const after = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null").hypeFear,
    saveKey,
  );
  check(
    "unrecognized tool switch leaves Hype/Fear unchanged",
    JSON.stringify(before) === JSON.stringify(after),
    { before, after },
  );
  check("locked World has no page/console errors", errors.length === 0, errors);
  await context.close();
}

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  await lockedToolBoundary(browser);
  await normalFlow(browser, { width: 320, height: 693 });
  await normalFlow(browser, { width: 393, height: 742 });
} finally {
  await browser.close();
}

console.log(JSON.stringify({ findings }, null, 2));
process.exitCode = findings.length === 0 ? 0 : 1;
