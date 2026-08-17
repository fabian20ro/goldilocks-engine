import { spawn } from "node:child_process";
import { chromium } from "playwright";

const ROOT = process.cwd();
const PORT = Number(process.env.PORT ?? "42494");
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
let probeStep = "startup";

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
  throw new Error("navigation probe preview did not become ready");
}

async function navSnapshot(page) {
  return page.evaluate(() => {
    const nav = document.querySelector(".bottom-nav");
    if (!(nav instanceof HTMLElement)) return null;
    const buttons = [...nav.querySelectorAll("button")];
    const navBox = nav.getBoundingClientRect();
    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
      navScrollWidth: nav.scrollWidth,
      navClientWidth: nav.clientWidth,
      navBox: {
        left: navBox.left,
        right: navBox.right,
        top: navBox.top,
        bottom: navBox.bottom,
      },
      labels: buttons.map((button) => button.getAttribute("aria-label")),
      buttons: buttons.map((button) => {
        const box = button.getBoundingClientRect();
        return {
          label: button.getAttribute("aria-label"),
          left: box.left,
          right: box.right,
          width: box.width,
          height: box.height,
          current: button.getAttribute("aria-current"),
          connectedToNav: button.closest("nav") !== null,
        };
      }),
      scrollLeft: nav.scrollLeft,
      className: nav.className,
      describedBy: nav.getAttribute("aria-describedby"),
      instruction: document.getElementById("primary-nav-overflow-hint")
        ?.textContent,
      rightIndicatorOpacity: getComputedStyle(
        nav.querySelector(".bottom-nav-overflow-right"),
      ).opacity,
      leftIndicatorOpacity: getComputedStyle(
        nav.querySelector(".bottom-nav-overflow-left"),
      ).opacity,
      transitionDuration: getComputedStyle(
        nav.querySelector(".bottom-nav-overflow-right"),
      ).transitionDuration,
      focusedLabel: document.activeElement?.getAttribute("aria-label") ?? null,
    };
  });
}

function allButtonsInside(snapshot) {
  return snapshot?.buttons.every(
    (button) =>
      button.left >= snapshot.navBox.left - 1 &&
      button.right <= snapshot.navBox.right + 1,
  );
}

function targetInside(snapshot, label) {
  const button = snapshot?.buttons.find(
    (candidate) => candidate.label === label,
  );
  return Boolean(
    button &&
      button.left >= snapshot.navBox.left - 1 &&
      button.right <= snapshot.navBox.right + 1,
  );
}

async function focusAndActivate(page, label) {
  const nav = page.getByRole("navigation", { name: "Primary" });
  const button = nav.getByRole("button", { name: label, exact: true });
  await button.evaluate((element) =>
    element instanceof HTMLElement
      ? element.focus({ preventScroll: true })
      : undefined,
  );
  await page.keyboard.press("Enter");
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
  return navSnapshot(page);
}

async function cdpSwipe(context, page, fromX, toX) {
  const session = await context.newCDPSession(page);
  const y = await page.locator(".bottom-nav").evaluate((element) => {
    const box = element.getBoundingClientRect();
    return box.top + box.height / 2;
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: fromX, y }],
  });
  for (let index = 1; index <= 5; index += 1) {
    const x = fromX + ((toX - fromX) * index) / 5;
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y }],
    });
    await page.waitForTimeout(20);
  }
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.waitForTimeout(100);
}

async function inspectNarrowLifecycle(browser) {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 320, height: 693 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  try {
    await page.emulateMedia({ reducedMotion: "reduce" });
    probeStep = "initial 320px snapshot";
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    let snapshot = await navSnapshot(page);
    check(
      "320px nav has exactly the stable eight-button order",
      JSON.stringify(snapshot?.labels) === JSON.stringify(LABELS),
      snapshot,
    );
    check(
      "320px nav uses inner overflow without document overflow",
      snapshot?.navScrollWidth > snapshot?.navClientWidth &&
        snapshot.documentWidth <= snapshot.viewportWidth + 1,
      snapshot,
    );
    check(
      "320px nav exposes the right cue and accessible instruction",
      snapshot?.className.includes("has-right-overflow") &&
        snapshot.describedBy === "primary-nav-overflow-hint" &&
        snapshot.rightIndicatorOpacity === "1" &&
        /swipe/i.test(snapshot.instruction ?? ""),
      snapshot,
    );
    check(
      "320px all navigation targets remain at least 44px",
      snapshot?.buttons.every(
        (button) => button.width >= 44 && button.height >= 44,
      ),
      snapshot,
    );
    check(
      "320px every primary button is in the nav, without duplicate global controls",
      snapshot?.buttons.length === LABELS.length &&
        snapshot.buttons.every((button) => button.connectedToNav),
      snapshot,
    );
    check(
      "reduced-motion removes cue transition",
      snapshot?.transitionDuration === "0s",
      snapshot,
    );

    for (const label of LABELS) {
      probeStep = `keyboard reveal ${label}`;
      snapshot = await focusAndActivate(page, label);
      check(
        `state-driven keyboard activation reveals ${label} at 320px`,
        targetInside(snapshot, label) &&
          snapshot.buttons.find((button) => button.label === label)?.current ===
            "page",
        snapshot,
      );
      check(
        `focused ${label} remains the active control after reveal`,
        snapshot.focusedLabel === label,
        snapshot,
      );
    }

    await page.evaluate(() => {
      const nav = document.querySelector(".bottom-nav");
      if (nav instanceof HTMLElement) nav.scrollLeft = 0;
    });
    probeStep = "direct touch swipe right";
    await cdpSwipe(context, page, 285, 55);
    snapshot = await navSnapshot(page);
    check(
      "direct touch swipe reveals the right side",
      snapshot.scrollLeft > 0 &&
        snapshot.className.includes("has-left-overflow"),
      snapshot,
    );
    probeStep = "direct touch swipe left";
    await cdpSwipe(context, page, 55, 285);
    snapshot = await navSnapshot(page);
    check(
      "direct touch swipe back restores the left edge cue state",
      snapshot.scrollLeft <= 1 &&
        snapshot.className.includes("has-right-overflow") &&
        !snapshot.className.includes("has-left-overflow"),
      snapshot,
    );

    probeStep = "normal resize active World setup";
    await page.setViewportSize({ width: 393, height: 742 });
    await page.waitForFunction(() => {
      const nav = document.querySelector(".bottom-nav");
      return (
        nav instanceof HTMLElement &&
        !nav.classList.contains("has-right-overflow")
      );
    });
    const nav = page.getByRole("navigation", { name: "Primary" });
    await nav.getByRole("button", { name: "Build", exact: true }).click();
    await nav.getByRole("button", { name: "World", exact: true }).click();
    await page.setViewportSize({ width: 320, height: 693 });
    await page.waitForFunction(() => {
      const navElement = document.querySelector(".bottom-nav");
      return (
        navElement instanceof HTMLElement &&
        navElement.classList.contains("has-right-overflow")
      );
    });
    const normalResize = await navSnapshot(page);

    await nav.getByRole("button", { name: "Build", exact: true }).click();
    probeStep = "200 percent text";
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    snapshot = await navSnapshot(page);
    check(
      "200% text keeps narrow targets and document overflow safe",
      snapshot.documentWidth <= snapshot.viewportWidth + 1 &&
        snapshot.buttons.every(
          (button) => button.width >= 44 && button.height >= 44,
        ),
      snapshot,
    );
    probeStep = "200 percent keyboard reveal World";
    snapshot = await focusAndActivate(page, "World");
    check(
      "200% text keyboard activation reveals World",
      targetInside(snapshot, "World") && snapshot.focusedLabel === "World",
      snapshot,
    );

    probeStep = "200 percent resize to 393px";
    await page.setViewportSize({ width: 393, height: 742 });
    await page.waitForFunction(() => {
      const nav = document.querySelector(".bottom-nav");
      return (
        nav instanceof HTMLElement &&
        nav.scrollWidth <= nav.clientWidth + 1 &&
        !nav.classList.contains("has-right-overflow") &&
        !nav.classList.contains("has-left-overflow")
      );
    });
    snapshot = await navSnapshot(page);
    check(
      "200% resize to 393px fits all tabs without a cue",
      snapshot.navScrollWidth <= snapshot.navClientWidth + 1 &&
        !snapshot.className.includes("has-right-overflow") &&
        snapshot.rightIndicatorOpacity === "0" &&
        allButtonsInside(snapshot),
      snapshot,
    );
    check(
      "resize keeps the active destination",
      snapshot.buttons.find((button) => button.label === "World")?.current ===
        "page",
      snapshot,
    );

    probeStep = "200 percent resize back to 320px";
    await page.setViewportSize({ width: 320, height: 693 });
    await page.waitForFunction(() => {
      const nav = document.querySelector(".bottom-nav");
      return (
        nav instanceof HTMLElement &&
        nav.scrollWidth > nav.clientWidth &&
        nav.classList.contains("has-right-overflow")
      );
    });
    snapshot = await navSnapshot(page);
    const scaledResize = snapshot;
    check(
      "resize back to 320px restores the overflow cue",
      snapshot.className.includes("has-right-overflow") &&
        snapshot.buttons.find((button) => button.label === "World")?.current ===
          "page",
      snapshot,
    );
    check(
      "active World remains visible after 393-to-320 resize at normal and 200% text",
      targetInside(normalResize, "World") &&
        targetInside(scaledResize, "World"),
      { normalResize, scaledResize },
    );

    probeStep = "reload after resize lifecycle";
    await page.reload({ waitUntil: "networkidle" });
    snapshot = await navSnapshot(page);
    check(
      "reload restores one active Build tab and safe narrow overflow",
      snapshot.buttons
        .filter((button) => button.current === "page")
        .map((button) => button.label)
        .join(",") === "Build" &&
        snapshot.navScrollWidth > snapshot.navClientWidth &&
        snapshot.documentWidth <= snapshot.viewportWidth + 1,
      snapshot,
    );
    check(
      "navigation lifecycle has no page or console errors",
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
  await inspectNarrowLifecycle(browser);
} catch (error) {
  findings.push({
    name: `probe failed during ${probeStep}`,
    evidence: String(error),
  });
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
