import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:42490";
const outputDir =
  process.env.OUTPUT_DIR ?? "/private/tmp/goldlocks-r090-independent";
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
      unnamed: actionable
        .filter((element) => {
          const text = element.textContent?.trim();
          return (
            element.getBoundingClientRect().width > 0 &&
            !text &&
            !element.getAttribute("aria-label") &&
            !element.getAttribute("aria-labelledby")
          );
        })
        .map((element) => element.outerHTML.slice(0, 160)),
      small: actionable
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            text: element.textContent?.trim().slice(0, 80),
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
    `${label} has named actionable controls`,
    result.unnamed.length === 0,
    result.unnamed,
  );
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
  const card = page.getByTestId("narrative-card");
  const initialText = await card.innerText();
  check(
    `deadline visible before coverage at ${viewport.width}px`,
    /2\.5H/i.test(initialText),
    initialText,
  );
  await geometry(page, `World ${viewport.width}px`);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await geometry(page, `World 200% ${viewport.width}px`);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "100%";
  });
  await page.emulateMedia({ reducedMotion: "reduce" });

  const switchButton = page.getByRole("button", { name: "Fast new runtime" });
  const beforeSwitch = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null").hypeFear,
    saveKey,
  );
  await switchButton.tap();
  await page.waitForFunction(
    (key) =>
      JSON.parse(localStorage.getItem(key) ?? "null").hypeFear.toolSwitches > 0,
    saveKey,
  );
  const afterSwitch = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null").hypeFear,
    saveKey,
  );
  check(
    `recognized tool switch mutates durable panic at ${viewport.width}px`,
    afterSwitch.toolSwitches === beforeSwitch.toolSwitches + 1 &&
      afterSwitch.toolSwitchingPanic > beforeSwitch.toolSwitchingPanic,
    { beforeSwitch, afterSwitch },
  );

  const cover = page.getByRole("button", { name: "Cover with Rhea Sol" });
  await cover.focus();
  check(
    `creator control is keyboard focusable at ${viewport.width}px`,
    await cover.evaluate((node) => document.activeElement === node),
    null,
  );
  await cover.tap();
  await page.waitForFunction(
    (key) =>
      JSON.parse(localStorage.getItem(key) ?? "null").hypeFear.narratives[0]
        ?.status === "awaiting-prediction",
    saveKey,
  );
  await page.getByRole("button", { name: "Predict a narrower result" }).tap();
  await page.waitForFunction(
    (key) =>
      JSON.parse(localStorage.getItem(key) ?? "null").hypeFear.narratives[0]
        ?.status === "countdown",
    saveKey,
  );
  const countdown = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null").hypeFear,
    saveKey,
  );
  await page.context().setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await openWorld(page);
  const offlineReload = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null").hypeFear,
    saveKey,
  );
  check(
    `countdown survives offline reload at ${viewport.width}px`,
    offlineReload.narratives[0]?.status === "countdown" &&
      offlineReload.narratives[0]?.deadlineTick ===
        countdown.narratives[0]?.deadlineTick &&
      offlineReload.toolSwitches === countdown.toolSwitches,
    { countdown, offlineReload },
  );
  await page.context().setOffline(false);
  check(
    `normal World flow has no page/console errors at ${viewport.width}px`,
    errors.length === 0,
    errors,
  );
  await context.close();
}

async function lockedAndMalformed(browser) {
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
  const before = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null").hypeFear,
    saveKey,
  );
  const lockedTool = page.getByRole("button", { name: "Fast new runtime" });
  check(
    "locked World disables tool switching",
    await lockedTool.isDisabled(),
    await lockedTool.getAttribute("disabled"),
  );
  check(
    "locked World has no narrative card",
    (await page.getByTestId("narrative-card").count()) === 0,
    await page.locator("main").innerText(),
  );
  const after = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null").hypeFear,
    saveKey,
  );
  check(
    "locked World state remains unchanged",
    JSON.stringify(before) === JSON.stringify(after),
    { before, after },
  );

  await seedRecognized(page);
  const forged = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null");
    state.hypeFear.attention = 101;
    state.hypeFear.narratives.push({
      ...state.hypeFear.narratives[0],
      id: "forged-narrative",
      templateId: "unknown-template",
    });
    localStorage.setItem(key, JSON.stringify(state));
    return state.hypeFear;
  }, saveKey);
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForSave(page);
  await openWorld(page);
  const recovered = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null").hypeFear,
    saveKey,
  );
  check(
    "malformed Hype/Fear restore falls back to safe default",
    recovered.unlocked === false &&
      recovered.narratives.length === 0 &&
      recovered.attention === 0 &&
      recovered.toolSwitches === 0,
    { forged, recovered },
  );
  check(
    "locked/malformed World has no page/console errors",
    errors.length === 0,
    errors,
  );
  await context.close();
}

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  await lockedAndMalformed(browser);
  await normalFlow(browser, { width: 320, height: 693 });
  await normalFlow(browser, { width: 393, height: 742 });
} finally {
  await browser.close();
}

console.log(JSON.stringify({ findings }, null, 2));
process.exitCode = findings.length === 0 ? 0 : 1;
