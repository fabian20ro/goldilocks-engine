import { spawn } from "node:child_process";
import { chromium } from "playwright";

const ROOT = process.cwd();
const PORT = Number(process.env.PORT ?? "42801");
const BASE_URL = `http://127.0.0.1:${PORT}/`;
const LABELS = [
  "Build",
  "Jobs",
  "Career",
  "Upgrades",
  "Inspect",
  "Research",
  "Lab",
  "World",
];
const findings = [];
let step = "startup";

function check(name, condition, evidence) {
  if (!condition) findings.push({ name, evidence });
}

async function waitForServer() {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(BASE_URL)).ok) return;
    } catch {
      // The preview is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("navigation probe preview did not become ready");
}

async function snapshot(page) {
  return page.evaluate(() => {
    const nav = document.querySelector(".bottom-nav");
    if (!(nav instanceof HTMLElement)) return null;
    const navBox = nav.getBoundingClientRect();
    const buttons = [...nav.querySelectorAll("button")].map((button) => {
      const box = button.getBoundingClientRect();
      return {
        label: button.getAttribute("aria-label"),
        current: button.getAttribute("aria-current"),
        focused: document.activeElement === button,
        left: box.left,
        right: box.right,
        width: box.width,
        height: box.height,
      };
    });
    const maxScrollLeft = Math.max(0, nav.scrollWidth - nav.clientWidth);
    const leftCue = nav.classList.contains("has-left-overflow");
    const rightCue = nav.classList.contains("has-right-overflow");
    const expectedLeftCue = nav.scrollLeft > 1;
    const expectedRightCue = nav.scrollLeft < maxScrollLeft - 1;
    return {
      labels: buttons.map((button) => button.label),
      buttons,
      navLeft: navBox.left,
      navRight: navBox.right,
      clientWidth: nav.clientWidth,
      scrollWidth: nav.scrollWidth,
      scrollLeft: nav.scrollLeft,
      maxScrollLeft,
      viewportWidth: innerWidth,
      documentWidth: Math.max(
        document.documentElement.scrollWidth,
        document.body?.scrollWidth ?? 0,
      ),
      leftCue,
      rightCue,
      expectedLeftCue,
      expectedRightCue,
      describedBy: nav.getAttribute("aria-describedby"),
      instruction: document.getElementById("primary-nav-overflow-hint")
        ?.textContent,
      leftOpacity: getComputedStyle(
        nav.querySelector(".bottom-nav-overflow-left"),
      ).opacity,
      rightOpacity: getComputedStyle(
        nav.querySelector(".bottom-nav-overflow-right"),
      ).opacity,
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    };
  });
}

function activeInside(value, label) {
  const button = value?.buttons.find((candidate) => candidate.label === label);
  return Boolean(
    button &&
      button.current === "page" &&
      button.left >= value.navLeft - 1 &&
      button.right <= value.navRight + 1,
  );
}

function contractIsTruthful(value) {
  if (!value) return false;
  const cueMatches =
    value.leftCue === value.expectedLeftCue &&
    value.rightCue === value.expectedRightCue &&
    value.leftOpacity === (value.leftCue ? "1" : "0") &&
    value.rightOpacity === (value.rightCue ? "1" : "0");
  const disclosureMatches =
    value.maxScrollLeft > 1
      ? value.describedBy === "primary-nav-overflow-hint" &&
        /swipe/i.test(value.instruction ?? "")
      : value.describedBy === null;
  return cueMatches && disclosureMatches;
}

function targetsAreSafe(value) {
  return Boolean(
    value?.buttons.length === LABELS.length &&
      value.buttons.every(
        (button) => button.width >= 44 && button.height >= 44,
      ) &&
      value.documentWidth <= value.viewportWidth + 1,
  );
}

async function waitForActive(page, label) {
  await page.waitForFunction(
    (target) =>
      document
        .querySelector(`.bottom-nav button[aria-label="${target}"]`)
        ?.getAttribute("aria-current") === "page",
    label,
  );
  await page.waitForFunction((target) => {
    const nav = document.querySelector(".bottom-nav");
    const button = document.querySelector(
      `.bottom-nav button[aria-label="${target}"]`,
    );
    if (!(nav instanceof HTMLElement) || !(button instanceof HTMLElement))
      return false;
    const navBox = nav.getBoundingClientRect();
    const buttonBox = button.getBoundingClientRect();
    return (
      buttonBox.left >= navBox.left - 1 && buttonBox.right <= navBox.right + 1
    );
  }, label);
  await waitForContract(page);
}

async function waitForContract(page) {
  await page.waitForFunction(() => {
    const nav = document.querySelector(".bottom-nav");
    if (!(nav instanceof HTMLElement)) return false;
    const maxScrollLeft = Math.max(0, nav.scrollWidth - nav.clientWidth);
    const hasLeftCue = nav.classList.contains("has-left-overflow");
    const hasRightCue = nav.classList.contains("has-right-overflow");
    const expectedLeftCue = nav.scrollLeft > 1;
    const expectedRightCue = nav.scrollLeft < maxScrollLeft - 1;
    const overflowing = maxScrollLeft > 1;
    const instruction =
      document.getElementById("primary-nav-overflow-hint")?.textContent ?? "";
    return (
      hasLeftCue === expectedLeftCue &&
      hasRightCue === expectedRightCue &&
      (overflowing
        ? nav.getAttribute("aria-describedby") ===
            "primary-nav-overflow-hint" && /swipe/i.test(instruction)
        : nav.getAttribute("aria-describedby") === null)
    );
  });
}

async function activate(page, label, mode = "click") {
  const button = page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: label, exact: true });
  if (mode === "touch") await button.tap();
  else await button.click();
  await waitForActive(page, label);
}

async function runProbe() {
  const server = spawn("./scripts/run-e2e", {
    cwd: ROOT,
    detached: true,
    env: { ...process.env, E2E_PORT: String(PORT) },
    stdio: "ignore",
  });
  let browser;
  let context;
  try {
    step = "server readiness";
    await waitForServer();
    step = "browser launch";
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      hasTouch: true,
      isMobile: true,
      viewport: { width: 320, height: 693 },
      serviceWorkers: "allow",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`console: ${message.text()}`);
    });

    step = "initial reduced-motion navigation";
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await waitForContract(page);
    let current = await snapshot(page);
    check(
      "320px normal direct launch has stable eight-tab order",
      JSON.stringify(current?.labels) === JSON.stringify(LABELS),
      current,
    );
    check(
      "320px normal boundary exposes truthful disclosure and safe targets",
      current?.scrollWidth > current.clientWidth &&
        contractIsTruthful(current) &&
        targetsAreSafe(current),
      current,
    );
    check(
      "reduced-motion preference is active",
      current?.reducedMotion,
      current,
    );

    // Direct activation at the boundary exercises browser hit testing as well
    // as the state-driven reveal for every destination.
    for (const label of LABELS) {
      step = `320px direct activation ${label}`;
      await activate(page, label);
      current = await snapshot(page);
      check(
        `320px direct activation reveals ${label}`,
        activeInside(current, label),
        current,
      );
      check(
        `320px direct activation keeps ${label} contract`,
        contractIsTruthful(current) && targetsAreSafe(current),
        current,
      );
    }

    // Stress the Linux-sensitive seam: every active destination crosses
    // 320 -> 393 -> 320 repeatedly while 200% text and reduced motion are on.
    await page.addStyleTag({
      content: `
        :root { font-size: 200% !important; }
        .bottom-nav button,
        .bottom-nav button > .tab-label { letter-spacing: 0.02em !important; }
      `,
    });
    await page.waitForFunction(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    );
    for (let iteration = 1; iteration <= 3; iteration += 1) {
      for (const label of LABELS) {
        step = `200% cycle ${iteration} 320px ${label}`;
        await page.setViewportSize({ width: 320, height: 693 });
        await activate(page, label);
        current = await snapshot(page);
        check(
          `200% cycle ${iteration} 320px keeps ${label} visible`,
          activeInside(current, label),
          current,
        );
        check(
          `200% cycle ${iteration} 320px keeps ${label} cues/targets`,
          contractIsTruthful(current) && targetsAreSafe(current),
          current,
        );

        step = `200% cycle ${iteration} 393px ${label}`;
        await page.setViewportSize({ width: 393, height: 742 });
        await waitForActive(page, label);
        current = await snapshot(page);
        check(
          `200% cycle ${iteration} 393px keeps ${label} visible`,
          activeInside(current, label),
          current,
        );
        check(
          `200% cycle ${iteration} 393px keeps ${label} cues/targets`,
          contractIsTruthful(current) && targetsAreSafe(current),
          current,
        );

        step = `200% cycle ${iteration} repeated 320px ${label}`;
        await page.evaluate(() => {
          const nav = document.querySelector(".bottom-nav");
          if (nav instanceof HTMLElement) nav.scrollLeft = 0;
        });
        await page.setViewportSize({ width: 320, height: 693 });
        await waitForActive(page, label);
        current = await snapshot(page);
        check(
          `200% cycle ${iteration} repeated 320px reveal keeps ${label} visible`,
          activeInside(current, label),
          current,
        );
        check(
          `200% cycle ${iteration} repeated 320px keeps ${label} cues/targets`,
          contractIsTruthful(current) && targetsAreSafe(current),
          current,
        );
      }
    }

    // Keyboard/focus and touch are separate activation boundaries.
    const nav = page.getByRole("navigation", { name: "Primary" });
    step = "200% keyboard World";
    step = "200% touch Jobs";
    await nav.evaluate((element) => {
      element.scrollLeft = 0;
    });
    const world = nav.getByRole("button", { name: "World", exact: true });
    await world.evaluate((element) => {
      if (element instanceof HTMLElement)
        element.focus({ preventScroll: true });
    });
    await page.keyboard.press("Enter");
    await waitForActive(page, "World");
    current = await snapshot(page);
    check(
      "200% keyboard activation reveals focused World",
      activeInside(current, "World") &&
        current?.buttons.find((button) => button.label === "World")?.focused,
      current,
    );
    await nav.evaluate((element) => {
      element.scrollLeft = 0;
    });
    await activate(page, "Jobs", "touch");
    current = await snapshot(page);
    check(
      "200% touch activation reveals Jobs",
      activeInside(current, "Jobs"),
      current,
    );

    // Reload must restore the default active destination and the same narrow
    // contract; re-apply the scale after reload to inspect the scaled layout.
    step = "200% reload and scaled Build";
    await page.reload({ waitUntil: "networkidle" });
    await page.addStyleTag({
      content: `
        :root { font-size: 200% !important; }
        .bottom-nav button,
        .bottom-nav button > .tab-label { letter-spacing: 0.02em !important; }
      `,
    });
    await waitForActive(page, "Build");
    await waitForContract(page);
    current = await snapshot(page);
    check(
      "reload restores visible Build under 200% text",
      activeInside(current, "Build"),
      current,
    );
    check(
      "reload preserves truthful cues, targets, and document fit",
      contractIsTruthful(current) && targetsAreSafe(current),
      current,
    );

    step = "offline World navigation";
    await context.setOffline(true);
    await activate(page, "World");
    current = await snapshot(page);
    check(
      "offline loaded shell keeps World navigation usable",
      activeInside(current, "World"),
      current,
    );
    await context.setOffline(false);
    check(
      "navigation emits no page or console errors",
      errors.length === 0,
      errors,
    );
  } finally {
    await context?.close();
    await browser?.close();
    if (server.pid) {
      try {
        process.kill(-server.pid, "SIGTERM");
      } catch {
        // The server group may already have exited after a failed startup.
      }
    }
  }
}

try {
  await runProbe();
} catch (error) {
  findings.push({
    name: "probe failed",
    evidence: `${step}: ${String(error)}`,
  });
}

console.log(JSON.stringify({ findings }, null, 2));
process.exitCode = findings.length === 0 ? 0 : 1;
