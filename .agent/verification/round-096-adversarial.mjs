import { spawn } from "node:child_process";
import { chromium } from "playwright";

const ROOT = process.cwd();
const PORT = Number(process.env.PORT ?? "42604");
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
        left: box.left,
        right: box.right,
        width: box.width,
        height: box.height,
        focused: document.activeElement === button,
      };
    });
    const maxScrollLeft = Math.max(0, nav.scrollWidth - nav.clientWidth);
    return {
      labels: buttons.map((button) => button.label),
      buttons,
      navLeft: navBox.left,
      navRight: navBox.right,
      clientWidth: nav.clientWidth,
      scrollWidth: nav.scrollWidth,
      scrollLeft: nav.scrollLeft,
      maxScrollLeft,
      documentWidth: Math.max(
        document.documentElement.scrollWidth,
        document.body?.scrollWidth ?? 0,
      ),
      viewportWidth: innerWidth,
      className: nav.className,
      describedBy: nav.getAttribute("aria-describedby"),
      instruction: document.getElementById("primary-nav-overflow-hint")
        ?.textContent,
    };
  });
}

function isInside(snapshotValue, label) {
  const button = snapshotValue?.buttons.find(
    (candidate) => candidate.label === label,
  );
  return Boolean(
    button &&
      button.left >= snapshotValue.navLeft - 1 &&
      button.right <= snapshotValue.navRight + 1,
  );
}

function cueStateMatches(snapshotValue) {
  if (!snapshotValue) return false;
  const hasLeft = snapshotValue.className.includes("has-left-overflow");
  const hasRight = snapshotValue.className.includes("has-right-overflow");
  const expectedLeft = snapshotValue.scrollLeft > 1;
  const expectedRight =
    snapshotValue.scrollLeft < snapshotValue.maxScrollLeft - 1;
  return hasLeft === expectedLeft && hasRight === expectedRight;
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
}

async function activate(page, label) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: label, exact: true })
    .click();
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
    await waitForServer();
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      hasTouch: true,
      isMobile: true,
      viewport: { width: 393, height: 742 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`console: ${message.text()}`);
    });

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    let current = await snapshot(page);
    check(
      "393px normal navigation has stable eight-tab order",
      JSON.stringify(current?.labels) === JSON.stringify(LABELS),
      current,
    );
    check(
      "393px normal navigation fits all tabs without cue",
      current?.scrollWidth <= current?.clientWidth + 1 &&
        !current.className.includes("overflow") &&
        current.describedBy === null &&
        current.buttons.every(
          (button) =>
            button.left >= current.navLeft - 1 &&
            button.right <= current.navRight + 1,
        ),
      current,
    );
    check(
      "393px normal navigation keeps 44px targets and document fit",
      current?.buttons.every(
        (button) => button.width >= 44 && button.height >= 44,
      ) && current.documentWidth <= current.viewportWidth + 1,
      current,
    );
    for (const label of LABELS) {
      await activate(page, label);
      current = await snapshot(page);
      check(
        `393px activates visible ${label}`,
        isInside(current, label),
        current,
      );
    }

    await page.setViewportSize({ width: 320, height: 693 });
    await page.waitForFunction(
      () =>
        document.querySelector(".bottom-nav")?.scrollWidth >
        document.querySelector(".bottom-nav")?.clientWidth,
    );
    await activate(page, "Build");
    current = await snapshot(page);
    check(
      "320px uses an inner strip with accessible directional disclosure",
      current?.scrollWidth > current.clientWidth &&
        current.documentWidth <= current.viewportWidth + 1 &&
        current.describedBy === "primary-nav-overflow-hint" &&
        /swipe/i.test(current.instruction ?? "") &&
        cueStateMatches(current),
      current,
    );
    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("button", { name: "World", exact: true })
      .evaluate((element) =>
        element instanceof HTMLElement
          ? element.focus({ preventScroll: true })
          : undefined,
      );
    await page.keyboard.press("Enter");
    await waitForActive(page, "World");
    current = await snapshot(page);
    check(
      "320px keyboard activation reveals World and keeps cues truthful",
      isInside(current, "World") &&
        current.scrollLeft > 1 &&
        cueStateMatches(current),
      current,
    );
    await page.setViewportSize({ width: 393, height: 742 });
    await page.addStyleTag({
      content: ":root { font-size: 200% !important; }",
    });
    for (const label of ["Build", "World"]) {
      await activate(page, label);
      current = await snapshot(page);
      check(
        `393px 200% text keeps active ${label} visible without document overflow`,
        isInside(current, label) &&
          current.documentWidth <= current.viewportWidth + 1 &&
          current.buttons.every(
            (button) => button.width >= 44 && button.height >= 44,
          ) &&
          cueStateMatches(current) &&
          (current.scrollWidth <= current.clientWidth + 1 ||
            (current.describedBy === "primary-nav-overflow-hint" &&
              /swipe/i.test(current.instruction ?? ""))),
        current,
      );
    }
    await page.setViewportSize({ width: 320, height: 693 });
    await activate(page, "World");
    current = await snapshot(page);
    check(
      "320px 200% text preserves active reveal and document fit",
      isInside(current, "World") &&
        current.documentWidth <= current.viewportWidth + 1 &&
        cueStateMatches(current),
      current,
    );
    await page.reload({ waitUntil: "networkidle" });
    current = await snapshot(page);
    check(
      "reload restores Build with a truthful narrow cue",
      current?.buttons.find((button) => button.label === "Build")?.current ===
        "page" &&
        isInside(current, "Build") &&
        cueStateMatches(current),
      current,
    );
    await context.setOffline(true);
    await activate(page, "World");
    current = await snapshot(page);
    check(
      "loaded navigation remains usable offline",
      current?.buttons.find((button) => button.label === "World")?.current ===
        "page" && isInside(current, "World"),
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
        // The process group may already have exited after a failed startup.
      }
    }
  }
}

try {
  await runProbe();
} catch (error) {
  findings.push({ name: "probe failed", evidence: String(error) });
}

console.log(JSON.stringify({ findings }, null, 2));
process.exitCode = findings.length === 0 ? 0 : 1;
