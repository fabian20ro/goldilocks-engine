import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:4968";
const outputDirectory = process.env.OUTPUT_DIR ?? "test-results/round-066";
const saveKey = "goldilocks-simulation-save-v4";

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 393, height: 742 },
});
const findings = [];

function recordFinding(id, actual, expected) {
  findings.push({ id, expected, actual });
}

async function freshPage() {
  const page = await context.newPage();
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(
    (key) => localStorage.getItem(key) !== null,
    saveKey,
  );
  return page;
}

async function openTab(page, label) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: label, exact: true })
    .click();
}

async function waitForFrames(page, count = 2) {
  await page.evaluate(
    (frames) =>
      new Promise((resolve) => {
        let remaining = frames;
        const next = () => {
          remaining -= 1;
          if (remaining === 0) resolve(undefined);
          else requestAnimationFrame(next);
        };
        requestAnimationFrame(next);
      }),
    count,
  );
}

async function verifyCareerPrecision() {
  const page = await freshPage();
  await openTab(page, "Career");
  await page
    .getByRole("button", {
      name: "Allocate 1 hours to Freelance delivery",
      exact: true,
    })
    .click();
  await page.getByText("1.00h allocated", { exact: true }).waitFor();

  const text = await page.locator(".career-quick-resources").innerText();
  await page.screenshot({ path: `${outputDirectory}/career-precision.png` });
  if (!text.includes("Cash\n$0.00") || !text.includes("Savings\n$0.00")) {
    recordFinding(
      "career-unrelated-mill-precision",
      text,
      "Cash and Savings retain cents when an unrelated route projection has mills.",
    );
  }
  await page
    .getByRole("button", {
      name: "Freelance delivery details",
      exact: true,
    })
    .click();
  const details = page.getByLabel("Freelance delivery details", {
    exact: true,
  });
  await details.waitFor();
  const detailsText = await details.innerText();
  if (
    !detailsText.includes("$2.276 gross") ||
    !detailsText.includes("$0.098 operating") ||
    !detailsText.includes("$0.012 electricity") ||
    !detailsText.includes("$2.166 economic net")
  ) {
    recordFinding(
      "career-details-loses-equation-precision",
      detailsText,
      "Career Details preserves the one-hour Freelance gross, operating, electricity, and economic-net equation to mills.",
    );
  }
  await page.close();
}

async function verifyJobsZeroPrecision() {
  const page = await freshPage();
  await openTab(page, "Jobs");
  const selectedDispatch = page.locator(".selected-dispatch");
  const text = await selectedDispatch.innerText();
  await selectedDispatch.screenshot({
    path: `${outputDirectory}/jobs-zero-precision.png`,
  });
  if (!text.includes("$0.00 gross")) {
    recordFinding(
      "jobs-hard-coded-zero-precision",
      text,
      "The selected dispatch's compact failed-payout summary uses the shared cents-default format ($0.00).",
    );
  }
  await page.close();
}

async function verifyTabScrollAndDetailsFocus() {
  const page = await freshPage();
  const region = page.locator(".app-scroll-region");
  await region.evaluate((element) => {
    element.scrollTop = Math.min(
      180,
      element.scrollHeight - element.clientHeight,
    );
  });
  const buildBefore = await region.evaluate((element) => element.scrollTop);
  assert.ok(buildBefore > 0, "Build needs a nonzero source scroll position");
  await openTab(page, "Jobs");
  await openTab(page, "Build");
  await waitForFrames(page);
  const buildAfter = await region.evaluate((element) => element.scrollTop);
  if (Math.abs(buildAfter - buildBefore) > 2) {
    recordFinding(
      "tab-scroll-does-not-restore-build-position",
      { buildBefore, buildAfter },
      "Returning from Jobs to Build restores Build's own recorded scroll position.",
    );
  }

  const buildOrigin = page
    .getByTestId("slot-prepare")
    .locator('[data-module-id="basic-cleaner"]');
  await buildOrigin.focus();
  await buildOrigin.press("Enter");
  const buildDetails = page.getByLabel("Basic Cleaner details", {
    exact: true,
  });
  await buildDetails.waitFor();
  if (await page.locator(".placement-tray").count()) {
    recordFinding(
      "details-starts-placement",
      "Basic Cleaner Details opened with a visible placement tray.",
      "Opening Details is inspect-only and never starts placement.",
    );
  }
  await page.keyboard.press("Escape");
  await waitForFrames(page);
  const buildFocusRestored = await buildOrigin.evaluate(
    (element) => document.activeElement === element,
  );
  if (!buildFocusRestored) {
    recordFinding(
      "build-details-does-not-restore-focus",
      await page.evaluate(() => document.activeElement?.outerHTML ?? null),
      "Closing Build Details returns keyboard focus to its originating module card.",
    );
  }

  await openTab(page, "Career");
  const careerOrigin = page.getByRole("button", {
    name: "Freelance delivery details",
    exact: true,
  });
  await careerOrigin.focus();
  await careerOrigin.press("Enter");
  await page
    .getByLabel("Freelance delivery details", { exact: true })
    .waitFor();
  await page.keyboard.press("Escape");
  await waitForFrames(page);
  const careerFocusRestored = await careerOrigin.evaluate(
    (element) => document.activeElement === element,
  );
  if (!careerFocusRestored) {
    recordFinding(
      "career-details-does-not-restore-focus",
      await page.evaluate(() => document.activeElement?.outerHTML ?? null),
      "Closing Career Details returns keyboard focus to its originating Details button.",
    );
  }
  await page.screenshot({ path: `${outputDirectory}/details-focus.png` });
  await page.close();
}

async function verifyReducedMotion() {
  const page = await freshPage();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() =>
    document.querySelector(".app-shell")?.classList.contains("motion-reduced"),
  );
  const styles = await page.evaluate(() => {
    const slot = document.querySelector(".pipeline-slot");
    const live = document.querySelector(".status-chip.live");
    if (!slot || !live) throw new Error("missing animated Build elements");
    return {
      shellClass: document.querySelector(".app-shell")?.className ?? "",
      slotTransition: getComputedStyle(slot).transitionDuration,
      liveAnimation: getComputedStyle(live).animationName,
      scrollBehavior: getComputedStyle(
        document.querySelector(".app-scroll-region"),
      ).scrollBehavior,
    };
  });
  await page.screenshot({ path: `${outputDirectory}/reduced-motion.png` });
  if (
    styles.slotTransition !== "0s" ||
    styles.liveAnimation !== "none" ||
    styles.scrollBehavior !== "auto"
  ) {
    recordFinding(
      "reduced-motion-leaves-animation-or-smooth-scroll",
      styles,
      "Reduced motion cancels visual transitions/animations and uses instant scrolling.",
    );
  }
  await page.close();
}

async function verifyMalformedSaveRecovery() {
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(
    (key) => localStorage.setItem(key, "{malformed-save"),
    saveKey,
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Goldilocks Engine" }).waitFor();
  const recovered = await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw);
  }, saveKey);
  await page.screenshot({ path: `${outputDirectory}/malformed-recovery.png` });
  if (errors.length > 0) {
    recordFinding(
      "malformed-save-recovery-emits-browser-error",
      errors,
      "A malformed persisted save recovers without browser page or console errors.",
    );
  }
  if (
    recovered !== null &&
    (recovered.schemaVersion !== 7 || recovered.resources.money < 0)
  ) {
    recordFinding(
      "malformed-save-does-not-recover-safe-state",
      recovered,
      "A malformed persisted save is removed or replaced with a valid nonnegative schema-7 state.",
    );
  }
  await page.close();
}

async function verifyPresetLoadScroll() {
  const page = await freshPage();
  const region = page.locator(".app-scroll-region");
  await region.evaluate((element) => {
    element.scrollTop = Math.min(
      180,
      element.scrollHeight - element.clientHeight,
    );
  });
  const buildBefore = await region.evaluate((element) => element.scrollTop);
  assert.ok(buildBefore > 0, "Build needs a nonzero source scroll position");

  await openTab(page, "Inspect");
  await page.getByRole("button", { name: "Save current", exact: true }).click();
  const load = page.getByRole("button", { name: "Load Preset 1", exact: true });
  await load.scrollIntoViewIfNeeded();
  const inspectBefore = await region.evaluate((element) => element.scrollTop);
  assert.ok(inspectBefore > 0, "Inspect needs an independent scroll position");
  const loadBox = await load.boundingBox();
  assert.notEqual(loadBox, null, "Load control needs a bounding box");
  await page.mouse.click(
    loadBox.x + loadBox.width / 2,
    loadBox.y + loadBox.height / 2,
  );
  await page.getByTestId("pipeline").waitFor();
  await waitForFrames(page);
  const afterLoad = await region.evaluate((element) => element.scrollTop);
  await page.screenshot({ path: `${outputDirectory}/preset-load-scroll.png` });
  const entersMeaningfulTop = Math.abs(afterLoad) <= 2;
  const restoresBuildPosition = Math.abs(afterLoad - buildBefore) <= 2;
  if (!entersMeaningfulTop && !restoresBuildPosition) {
    recordFinding(
      "preset-load-inherits-inspect-scroll",
      { buildBefore, inspectBefore, afterLoad },
      "Loading a preset enters Build at its meaningful top or Build's own position, never an arbitrary Inspect offset.",
    );
  }
  await page.close();
}

try {
  await verifyCareerPrecision();
  await verifyJobsZeroPrecision();
  await verifyTabScrollAndDetailsFocus();
  await verifyReducedMotion();
  await verifyMalformedSaveRecovery();
  await verifyPresetLoadScroll();
} finally {
  await browser.close();
}

process.stdout.write(`${JSON.stringify({ baseURL, findings }, null, 2)}\n`);
if (findings.length > 0) process.exitCode = 1;
