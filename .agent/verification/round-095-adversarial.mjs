import { spawn } from "node:child_process";
import { chromium } from "playwright";

const ROOT = process.cwd();
const PORT = Number(process.env.PORT ?? "42495");
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
      const response = await fetch(BASE_URL);
      if (response.ok) return;
    } catch {
      // The preview is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("independent navigation probe preview did not become ready");
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
    return {
      labels: buttons.map((button) => button.label),
      buttons,
      navLeft: navBox.left,
      navRight: navBox.right,
      clientWidth: nav.clientWidth,
      scrollWidth: nav.scrollWidth,
      scrollLeft: nav.scrollLeft,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
      className: nav.className,
      describedBy: nav.getAttribute("aria-describedby"),
      instruction: document.getElementById("primary-nav-overflow-hint")
        ?.textContent,
      rightOpacity: getComputedStyle(
        nav.querySelector(".bottom-nav-overflow-right"),
      ).opacity,
      leftOpacity: getComputedStyle(
        nav.querySelector(".bottom-nav-overflow-left"),
      ).opacity,
    };
  });
}

function inside(snapshotValue, label) {
  const button = snapshotValue?.buttons.find(
    (candidate) => candidate.label === label,
  );
  return Boolean(
    button &&
      button.left >= snapshotValue.navLeft - 1 &&
      button.right <= snapshotValue.navRight + 1,
  );
}

function allInside(snapshotValue) {
  return snapshotValue?.buttons.every(
    (button) =>
      button.left >= snapshotValue.navLeft - 1 &&
      button.right <= snapshotValue.navRight + 1,
  );
}

async function waitForNav(page, predicate) {
  await page.waitForFunction(predicate, undefined, { timeout: 5_000 });
}

async function activate(page, label) {
  const nav = page.getByRole("navigation", { name: "Primary" });
  await nav.getByRole("button", { name: label, exact: true }).click();
  await page.waitForFunction(
    (target) =>
      document
        .querySelector(`.bottom-nav button[aria-label="${target}"]`)
        ?.getAttribute("aria-current") === "page",
    label,
  );
  await page.waitForFunction((target) => {
    const navElement = document.querySelector(".bottom-nav");
    const button = document.querySelector(
      `.bottom-nav button[aria-label="${target}"]`,
    );
    if (
      !(navElement instanceof HTMLElement) ||
      !(button instanceof HTMLElement)
    )
      return false;
    const navBox = navElement.getBoundingClientRect();
    const buttonBox = button.getBoundingClientRect();
    return (
      buttonBox.left >= navBox.left - 1 && buttonBox.right <= navBox.right + 1
    );
  }, label);
}

async function swipe(context, page, fromX, toX) {
  const session = await context.newCDPSession(page);
  const y = await page.locator(".bottom-nav").evaluate((element) => {
    const box = element.getBoundingClientRect();
    return box.top + box.height / 2;
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: fromX, y }],
  });
  for (let index = 1; index <= 6; index += 1) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: fromX + ((toX - fromX) * index) / 6, y }],
    });
    await page.waitForTimeout(16);
  }
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.waitForTimeout(100);
}

async function runProbe(browser) {
  const context = await browser.newContext({
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

  try {
    await page.emulateMedia({ reducedMotion: "reduce" });
    step = "393px normal baseline";
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    let current = await snapshot(page);
    check(
      "393px preserves all eight destinations in stable order",
      JSON.stringify(current?.labels) === JSON.stringify(LABELS),
      current,
    );
    check(
      "393px fits every target without an overflow cue or document overflow",
      current?.scrollWidth <= current?.clientWidth + 1 &&
        !current.className.includes("overflow") &&
        current.documentWidth <= current.viewportWidth + 1 &&
        allInside(current),
      current,
    );
    check(
      "393px target geometry meets the 44px minimum",
      current?.buttons.every(
        (button) => button.width >= 44 && button.height >= 44,
      ),
      current,
    );

    step = "393px state-driven activation";
    for (const label of LABELS) {
      await activate(page, label);
      current = await snapshot(page);
      check(
        `393px activation keeps ${label} visible`,
        inside(current, label),
        current,
      );
    }

    step = "320px boundary";
    await page.setViewportSize({ width: 320, height: 693 });
    await activate(page, "Build");
    await page.evaluate(() => {
      const navElement = document.querySelector(".bottom-nav");
      if (navElement instanceof HTMLElement) navElement.scrollLeft = 0;
    });
    await waitForNav(
      page,
      () =>
        document
          .querySelector(".bottom-nav")
          ?.classList.contains("has-right-overflow") ?? false,
    );
    current = await snapshot(page);
    check(
      "320px uses inner overflow while keeping the document width bounded",
      current?.scrollWidth > current?.clientWidth &&
        current.documentWidth <= current.viewportWidth + 1,
      current,
    );
    check(
      "320px exposes cue and accessible horizontal disclosure",
      current?.className.includes("has-right-overflow") &&
        current.describedBy === "primary-nav-overflow-hint" &&
        current.rightOpacity === "1" &&
        /swipe/i.test(current.instruction ?? ""),
      current,
    );

    step = "320px keyboard traversal and activation";
    const nav = page.getByRole("navigation", { name: "Primary" });
    await nav
      .getByRole("button", { name: "Build", exact: true })
      .evaluate((element) =>
        element instanceof HTMLElement
          ? element.focus({ preventScroll: true })
          : undefined,
      );
    for (const label of LABELS) {
      if (label !== "Build") await page.keyboard.press("Tab");
      const focused = await snapshot(page);
      check(
        `320px keyboard focus reaches ${label}`,
        focused?.buttons.find((button) => button.label === label)?.focused,
        focused,
      );
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        (target) =>
          document
            .querySelector(`.bottom-nav button[aria-label="${target}"]`)
            ?.getAttribute("aria-current") === "page",
        label,
      );
      const activated = await snapshot(page);
      check(
        `320px keyboard activation reveals active ${label}`,
        inside(activated, label),
        activated,
      );
    }

    step = "320px touch edge recovery";
    await page.evaluate(() => {
      const navElement = document.querySelector(".bottom-nav");
      if (navElement instanceof HTMLElement) navElement.scrollLeft = 0;
    });
    await swipe(context, page, 285, 55);
    current = await snapshot(page);
    check(
      "320px touch swipe reveals the right side and left cue",
      current.scrollLeft > 0 && current.className.includes("has-left-overflow"),
      current,
    );
    await swipe(context, page, 55, 285);
    current = await snapshot(page);
    check(
      "320px reverse touch swipe restores the left edge cue",
      current.scrollLeft <= 1 &&
        current.className.includes("has-right-overflow") &&
        !current.className.includes("has-left-overflow"),
      current,
    );

    step = "normal resize reveal for every active destination";
    for (const label of LABELS) {
      await page.setViewportSize({ width: 393, height: 742 });
      await waitForNav(
        page,
        () =>
          !document
            .querySelector(".bottom-nav")
            ?.classList.contains("has-right-overflow"),
      );
      await activate(page, label);
      await page.setViewportSize({ width: 320, height: 693 });
      await waitForNav(
        page,
        () =>
          document
            .querySelector(".bottom-nav")
            ?.classList.contains("has-right-overflow") ?? false,
      );
      current = await snapshot(page);
      check(
        `393-to-320 resize reveals active ${label}`,
        inside(current, label),
        current,
      );
    }

    step = "200 percent text resize reveal for every active destination";
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    for (const label of LABELS) {
      await page.setViewportSize({ width: 393, height: 742 });
      await waitForNav(
        page,
        () =>
          !document
            .querySelector(".bottom-nav")
            ?.classList.contains("has-right-overflow"),
      );
      await activate(page, label);
      await page.setViewportSize({ width: 320, height: 693 });
      await waitForNav(
        page,
        () =>
          document
            .querySelector(".bottom-nav")
            ?.classList.contains("has-right-overflow") ?? false,
      );
      current = await snapshot(page);
      check(
        `200% text 393-to-320 resize reveals active ${label} with safe targets`,
        inside(current, label) &&
          current.documentWidth <= current.viewportWidth + 1 &&
          current.buttons.every(
            (button) => button.width >= 44 && button.height >= 44,
          ),
        current,
      );
    }

    step = "reload and offline lifecycle";
    await page.reload({ waitUntil: "networkidle" });
    current = await snapshot(page);
    check(
      "reload restores Build as active and keeps narrow overflow safe",
      current?.buttons
        .filter((button) => button.current === "page")
        .map((button) => button.label)
        .join(",") === "Build" &&
        current.scrollWidth > current.clientWidth &&
        current.documentWidth <= current.viewportWidth + 1 &&
        inside(current, "Build"),
      current,
    );
    await context.setOffline(true);
    await activate(page, "World");
    current = await snapshot(page);
    check(
      "loaded navigation remains usable offline",
      current?.buttons.find((button) => button.label === "World")?.current ===
        "page" && inside(current, "World"),
      current,
    );
    await context.setOffline(false);
    check(
      "navigation lifecycle emits no page or console errors",
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
  await runProbe(browser);
} catch (error) {
  findings.push({
    name: `probe failed during ${step}`,
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
