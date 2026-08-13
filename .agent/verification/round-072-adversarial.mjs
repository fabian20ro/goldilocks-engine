import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:5180";
const outputDirectory =
  process.env.OUTPUT_DIR ?? "/tmp/goldlocks-r072-adversarial";
const saveKey = "goldilocks-simulation-save-v4";
const bootstrapKey = "goldlocks-r072-seed-bootstrap";
const viewports = [
  { width: 320, height: 693 },
  { width: 393, height: 742 },
];
const tabs = ["Build", "Jobs", "Career", "Upgrades", "Inspect"];

await mkdir(outputDirectory, { recursive: true });

let bootstrapSequence = 0;
const screenshots = [];

function attachErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

async function waitForSave(page, expectedMoney) {
  await page.waitForFunction(
    ({ key, expected }) => {
      const raw = localStorage.getItem(key);
      if (raw === null) return false;
      if (expected === undefined) return true;
      try {
        return JSON.parse(raw).resources?.money === expected;
      } catch {
        return false;
      }
    },
    { key: saveKey, expected: expectedMoney },
    { timeout: 15_000 },
  );
}

async function openPage(context, viewport) {
  const page = await context.newPage();
  await page.setViewportSize(viewport);
  const errors = attachErrors(page);
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await waitForSave(page);
  return { page, errors };
}

async function openTab(page, tab) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: tab, exact: true })
    .click();
  await page.getByRole("heading").first().waitFor();
}

async function assertPortrait(page, label) {
  const geometry = await page.evaluate(() => {
    const pipeline = document.querySelector("[data-testid=pipeline]");
    const tray = document.querySelector(".placement-tray");
    const nav = document.querySelector(".bottom-nav");
    const trayBox = tray?.getBoundingClientRect();
    const navBox = nav?.getBoundingClientRect();
    const undersized = [...document.querySelectorAll("button")]
      .filter((button) => {
        const style = getComputedStyle(button);
        return style.display !== "none" && style.visibility !== "hidden";
      })
      .flatMap((button) => {
        const box = button.getBoundingClientRect();
        return box.width < 44 || box.height < 44
          ? [button.getAttribute("aria-label") ?? button.textContent?.trim()]
          : [];
      });
    return {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      nestedPipelineScroll: pipeline
        ? pipeline.scrollHeight !== pipeline.clientHeight
        : false,
      trayClear: !trayBox || !navBox || trayBox.bottom <= navBox.top + 0.5,
      undersized,
    };
  });
  assert.ok(
    geometry.scrollWidth <= geometry.clientWidth,
    `${label}: horizontal document overflow`,
  );
  assert.equal(
    geometry.nestedPipelineScroll,
    false,
    `${label}: nested pipeline scroll`,
  );
  assert.equal(geometry.trayClear, true, `${label}: tray overlaps navigation`);
  assert.deepEqual(geometry.undersized, [], `${label}: undersized control`);
}

async function screenshot(page, label) {
  const path = `${outputDirectory}/${label}.png`;
  await page.screenshot({ path });
  screenshots.push(path);
}

async function restartWithSeed(record, viewport, money) {
  await waitForSave(record.page);
  const saved = await record.page.evaluate(
    (key) => localStorage.getItem(key),
    saveKey,
  );
  assert.notEqual(saved, null, "missing durable state before seed restart");
  const parsed = JSON.parse(saved);
  parsed.resources.money = money;
  const token = `money-${++bootstrapSequence}`;
  await record.page.evaluate(
    ({ key, token: nextToken }) => localStorage.setItem(key, nextToken),
    { key: bootstrapKey, token },
  );
  const context = record.page.context();
  await context.addInitScript(
    ({ markerKey, token: nextToken, stateKey, serialized }) => {
      try {
        if (localStorage.getItem(markerKey) !== nextToken) return;
        localStorage.setItem(stateKey, serialized);
        localStorage.removeItem(markerKey);
      } catch {
        // The initial opaque document has no origin storage; the app navigation does.
      }
    },
    {
      markerKey: bootstrapKey,
      token,
      stateKey: saveKey,
      serialized: JSON.stringify(parsed),
    },
  );
  await record.page.close();
  const restarted = await openPage(context, viewport);
  await waitForSave(restarted.page, money);
  const marker = await restarted.page.evaluate(
    (key) => localStorage.getItem(key),
    bootstrapKey,
  );
  assert.equal(
    marker,
    null,
    "one-shot bootstrap marker leaked into durable state",
  );
  return restarted;
}

async function captureDeck(context, viewport, kind) {
  let record = await openPage(context, viewport);
  if (kind === "expanded") {
    record = await restartWithSeed(record, viewport, 45);
    await openTab(record.page, "Upgrades");
    await record.page
      .getByRole("button", {
        name: "Buy Workstation Expansion I for $45.00",
        exact: true,
      })
      .click();
    await record.page
      .getByRole("button", { name: "Activate six-position pipeline" })
      .click();
    await openTab(record.page, "Build");
    await record.page
      .getByTestId("slot-process-4")
      .getByText("Empty / bypassed")
      .waitFor();
  }
  for (const tab of tabs) {
    await openTab(record.page, tab);
    await assertPortrait(record.page, `${kind}-${viewport.width}-${tab}`);
    await screenshot(
      record.page,
      `${kind}-${viewport.width}-${tab.toLowerCase()}`,
    );
  }
  assert.deepEqual(
    record.errors,
    [],
    `${kind}-${viewport.width}: page/console errors`,
  );
  return record;
}

async function checkSeedBoundary(browser, viewport) {
  const context = await browser.newContext({ serviceWorkers: "allow" });
  let record = await openPage(context, viewport);
  record = await restartWithSeed(record, viewport, 10);
  await openTab(record.page, "Upgrades");
  const available = record.page.getByRole("region", {
    name: "Affordable / available",
  });
  await assertPortrait(record.page, `seed-boundary-${viewport.width}`);
  assert.match(
    await available.innerText(),
    /Precision Cleaner[\s\S]*Available now for \$4\.00/,
    `${viewport.width}: restarted seeded state did not drive live affordability`,
  );
  assert.deepEqual(record.errors, [], `${viewport.width}: page/console errors`);
  await record.page.close();
  await context.close();
}

function independentlyFormatCompactCurrency(amount) {
  const cents = Math.round(amount * 100) / 100;
  const precision = Math.abs(amount - cents) > 1e-9 ? 3 : 2;
  const normalized = Math.abs(amount) < 0.0005 ? 0 : amount;
  return `${normalized < 0 ? "-$" : "$"}${Math.abs(normalized).toFixed(
    precision,
  )}`;
}

async function checkQueueTenEndpoints(browser) {
  const context = await browser.newContext({ serviceWorkers: "allow" });
  const record = await openPage(context, viewports[1]);
  await openTab(record.page, "Jobs");
  await record.page
    .getByRole("button", {
      name: "Queue one safe Interactive Chat job",
      exact: true,
    })
    .click();
  await record.page.getByRole("button", { name: "64×", exact: true }).click();
  await record.page.waitForFunction((key) => {
    try {
      return (
        JSON.parse(localStorage.getItem(key) ?? "null").lastSettlement !== null
      );
    } catch {
      return false;
    }
  }, saveKey);
  await record.page.getByRole("button", { name: "Pause", exact: true }).click();
  await record.page
    .getByRole("button", { name: "Resume", exact: true })
    .waitFor();
  const queueTen = record.page.getByRole("button", { name: /^Queue 10/ });
  const preview = await queueTen.innerText();
  await queueTen.click();
  await record.page.waitForFunction((key) => {
    try {
      return (
        JSON.parse(localStorage.getItem(key) ?? "null").jobs.waitingTasks
          .length === 10
      );
    } catch {
      return false;
    }
  }, saveKey);
  const quotes = await record.page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null");
    return state.jobs.waitingTasks.map((task) => task.lockedGrossQuote);
  }, saveKey);
  const first = quotes[0];
  const last = quotes.at(-1);
  assert.equal(typeof first, "number", "missing first Queue 10 quote");
  assert.equal(typeof last, "number", "missing last Queue 10 quote");
  const expected = `Queue 10 · locks ${independentlyFormatCompactCurrency(
    first,
  )} → ${independentlyFormatCompactCurrency(last)}`;
  assert.equal(
    preview,
    expected,
    "Queue 10 preview did not independently format its locked endpoints",
  );
  assert.ok(
    quotes.slice(1, -1).some((quote) => {
      const cents = Math.round(quote * 100) / 100;
      return Math.abs(quote - cents) > 1e-9;
    }),
    "Queue 10 scenario did not exercise a mill-bearing undisplayed quote",
  );
  await screenshot(record.page, "queue-ten-independent-endpoints");
  assert.deepEqual(record.errors, [], "Queue 10: page/console errors");
  await record.page.close();
  await context.close();
}

async function checkScaledTouchAndOffline(record) {
  const { page } = record;
  await openTab(page, "Build");
  await page.addStyleTag({
    content: ":root { font-size: 200% !important; }",
  });
  await page
    .getByRole("button", { name: "Select Input stage", exact: true })
    .click();
  const stream = page.locator(
    '[data-inventory-section="owned"] [data-module-id="stream-intake"]',
  );
  await stream.click();
  await page
    .getByRole("button", { name: "Place Stream Intake in Build", exact: true })
    .click();
  await page.locator(".placement-tray").scrollIntoViewIfNeeded();
  await assertPortrait(page, "expanded-scaled-placement");
  await screenshot(page, "expanded-393-placement-200");
  await page
    .getByRole("button", { name: "Cancel placement", exact: true })
    .click();
  await stream.waitFor({ state: "visible" });

  await page.addStyleTag({
    content: ":root { font-size: 100% !important; }",
  });
  const source = page
    .getByTestId("slot-prepare")
    .locator('[data-module-id="basic-cleaner"]');
  const destination = page.getByTestId("slot-runtime");
  await source.scrollIntoViewIfNeeded();
  const [from, to] = await Promise.all([
    source.boundingBox(),
    destination.boundingBox(),
  ]);
  assert.ok(from && to, "touch-drag endpoints unavailable");
  const cdp = await page.context().newCDPSession(page);
  const start = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
  const end = { x: to.x + to.width / 2, y: to.y + to.height / 2 };
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ ...start, id: 1 }],
  });
  for (let step = 1; step <= 6; step += 1) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: start.x + ((end.x - start.x) * step) / 6,
          y: start.y + ((end.y - start.y) * step) / 6,
          id: 1,
        },
      ],
    });
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await destination.getByText("Basic Cleaner").waitFor();

  await page.evaluate(async () => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.evaluate(async () => navigator.serviceWorker.ready);
  const controller = await page.evaluate(
    () => navigator.serviceWorker.controller?.scriptURL ?? null,
  );
  assert.match(
    controller ?? "",
    /\/sw\.js\?build=/,
    "root PWA controller absent",
  );
  await page.context().setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page
    .getByTestId("slot-process-4")
    .getByText("Empty / bypassed")
    .waitFor();
  await page.context().setOffline(false);
  await assertPortrait(page, "expanded-offline-reload");
  assert.deepEqual(record.errors, [], "expanded: page/console errors");
}

const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of viewports) await checkSeedBoundary(browser, viewport);
  await checkQueueTenEndpoints(browser);

  for (const viewport of viewports) {
    const context = await browser.newContext({ serviceWorkers: "allow" });
    const starter = await captureDeck(context, viewport, "starter");
    await starter.page.close();
    const expanded = await captureDeck(context, viewport, "expanded");
    if (viewport.width === 393) await checkScaledTouchAndOffline(expanded);
    await expanded.page.close();
    await context.close();
  }

  console.log(
    JSON.stringify(
      {
        baseURL,
        screenshots,
        checks: [
          "worker-safe one-shot state bootstrap at 320 and 393",
          "Queue 10 endpoint-local compact precision with mill-bearing middle quotes",
          "starter and expanded five-tab portrait screenshot matrix",
          "44px controls, no overflow, no nested rail scroll, no console/page errors",
          "200% placement tray, CDP touch drag, PWA controller, offline expanded reload",
        ],
        findings: [],
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
