import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:4967";
const outputDirectory = process.env.OUTPUT_DIR ?? "test-results/round-064";
const saveKey = "goldilocks-simulation-save-v4";
const widths = [
  { width: 320, height: 693 },
  { width: 393, height: 742 },
];
const tabs = ["Build", "Jobs", "Career", "Upgrades", "Inspect"];
const purchasable = [
  ["Precision Cleaner", "$4.00"],
  ["Adaptive Context", "$8.00"],
  ["Efficient Runtime", "$7.00"],
  ["Guarded Batch Runtime", "$10.00"],
  ["Trace Evaluation", "$5.00"],
  ["Resilient Delivery", "$4.00"],
];
const stages = [
  ["Input", "request-buffer"],
  ["Prepare", "basic-cleaner"],
  ["Runtime", "quantized-model"],
  ["Verify", "smoke-check"],
  ["Output", "delivery-gate"],
];

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const findings = [];
const screenshots = [];

function recordError(bucket, type, value) {
  bucket.push(`${type}: ${value}`);
}

async function attachErrorCollection(page) {
  const errors = [];
  page.on("pageerror", (error) =>
    recordError(errors, "pageerror", error.message),
  );
  page.on("console", (message) => {
    if (message.type() === "error")
      recordError(errors, "console", message.text());
  });
  return errors;
}

async function waitForSave(page) {
  await page.waitForFunction(
    (key) => localStorage.getItem(key) !== null,
    saveKey,
  );
}

async function freshPage(context, viewport) {
  const page = await context.newPage();
  await page.setViewportSize(viewport);
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await waitForSave(page);
  return page;
}

async function setMoney(page, money) {
  await waitForSave(page);
  await page.evaluate(
    ({ key, nextMoney }) => {
      const state = JSON.parse(localStorage.getItem(key));
      state.resources.money = nextMoney;
      localStorage.setItem(key, JSON.stringify(state));
    },
    { key: saveKey, nextMoney: money },
  );
  await page.reload();
  await waitForSave(page);
}

async function openTab(page, tab) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: tab, exact: true })
    .click();
  await page.getByRole("heading").first().waitFor();
}

async function geometry(page) {
  return page.evaluate(() => {
    const client = document.documentElement.clientWidth;
    const interactive = [...document.querySelectorAll("button")]
      .filter((element) => {
        const style = getComputedStyle(element);
        return style.display !== "none" && style.visibility !== "hidden";
      })
      .map((element) => {
        const box = element.getBoundingClientRect();
        return {
          label:
            element.getAttribute("aria-label") ?? element.textContent?.trim(),
          width: box.width,
          height: box.height,
        };
      })
      .filter((entry) => entry.width < 44 || entry.height < 44);
    const pipeline = document.querySelector("[data-testid=pipeline]");
    const tray = document.querySelector(".placement-tray");
    const nav = document.querySelector(".bottom-nav");
    const trayBox = tray?.getBoundingClientRect();
    const navBox = nav?.getBoundingClientRect();
    return {
      client,
      scroll: document.documentElement.scrollWidth,
      undersized: interactive,
      nestedPipelineScroll: pipeline
        ? pipeline.scrollHeight !== pipeline.clientHeight
        : false,
      trayClear: !trayBox || !navBox || trayBox.bottom <= navBox.top + 0.5,
    };
  });
}

async function assertPortrait(page, label) {
  const result = await geometry(page);
  assert.ok(result.scroll <= result.client, `${label}: horizontal overflow`);
  assert.equal(
    result.nestedPipelineScroll,
    false,
    `${label}: nested rail scroll`,
  );
  assert.equal(
    result.trayClear,
    true,
    `${label}: tray intersects bottom navigation`,
  );
  assert.deepEqual(
    result.undersized,
    [],
    `${label}: undersized visible button`,
  );
}

async function screenshot(page, name) {
  const path = `${outputDirectory}/${name}.png`;
  await page.screenshot({ path });
  screenshots.push(path);
}

async function prepareExpanded(page) {
  await setMoney(page, 45);
  await openTab(page, "Upgrades");
  await page
    .getByRole("button", {
      name: "Buy Workstation Expansion I for $45.00",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "Activate six-position pipeline",
      exact: true,
    })
    .click();
  await openTab(page, "Build");
  await page
    .getByTestId("slot-process-4")
    .getByText("Empty / bypassed")
    .waitFor();
}

async function captureTabDeck(context, kind) {
  for (const viewport of widths) {
    const page = await freshPage(context, viewport);
    const errors = await attachErrorCollection(page);
    if (kind === "expanded") await prepareExpanded(page);
    for (const tab of tabs) {
      await openTab(page, tab);
      await assertPortrait(page, `${kind}-${viewport.width}-${tab}`);
      await screenshot(page, `${kind}-${viewport.width}-${tab.toLowerCase()}`);
    }
    assert.deepEqual(
      errors,
      [],
      `${kind}-${viewport.width}: page/console errors`,
    );
    await page.close();
  }
}

async function testSelectedStageOrder(context) {
  const page = await freshPage(context, widths[1]);
  const errors = await attachErrorCollection(page);
  await setMoney(page, 100);
  await openTab(page, "Upgrades");
  await page
    .getByRole("button", { name: "Show every module (17)", exact: true })
    .click();
  for (const [name, price] of purchasable) {
    await page
      .getByRole("button", { name: `Buy ${name} for ${price}`, exact: true })
      .click();
  }
  await openTab(page, "Build");

  for (const [stageName, installedModuleId] of stages) {
    await page
      .getByRole("button", { name: `Select ${stageName} stage`, exact: true })
      .click();
    const owned = page.locator('[data-inventory-section="owned"]');
    const defaultIds = await owned
      .locator(".module-card")
      .evaluateAll((cards) =>
        cards.map((card) => card.getAttribute("data-module-id")),
      );
    assert.equal(
      defaultIds[0],
      installedModuleId,
      `${stageName}: installed item is not compact first`,
    );
    await page
      .getByRole("button", { name: "Show every module (17)", exact: true })
      .click();
    const full = await owned.locator(".module-card").evaluateAll((cards) =>
      cards.map((card) => ({
        id: card.getAttribute("data-module-id"),
        incompatible: card.classList.contains("incompatible"),
      })),
    );
    const firstIncompatible = full.findIndex((entry) => entry.incompatible);
    const lastCompatible = full.reduce(
      (last, entry, index) => (!entry.incompatible ? index : last),
      -1,
    );
    assert.ok(
      firstIncompatible === -1 || firstIncompatible > lastCompatible,
      `${stageName}: incompatible owned item ranks ahead of compatible choice`,
    );
    assert.equal(
      full.length,
      17,
      `${stageName}: full catalogue route omits an item`,
    );
    await page
      .getByRole("button", { name: "Show compact next choices", exact: true })
      .click();
    assert.ok(
      defaultIds.length <= 3,
      `${stageName}: compact subset exceeds three cards`,
    );
  }
  await assertPortrait(page, "selected-stage-order");
  await screenshot(page, "selected-stage-order-rich");
  assert.deepEqual(errors, [], "selected-stage-order: page/console errors");
  await page.close();
}

async function beginStreamPlacement(page) {
  await openTab(page, "Build");
  await page
    .getByRole("button", { name: "Select Input stage", exact: true })
    .click();
  const module = page.locator(
    '[data-inventory-section="owned"] [data-module-id="stream-intake"]',
  );
  await module.click();
  await page
    .getByRole("button", { name: "Place Stream Intake in Build", exact: true })
    .click();
  return module;
}

async function testPlacementInteractions(context) {
  const page = await freshPage(context, widths[1]);
  const errors = await attachErrorCollection(page);
  await setMoney(page, 4);
  await openTab(page, "Upgrades");
  await page
    .getByRole("button", {
      name: "Buy Precision Cleaner for $4.00",
      exact: true,
    })
    .click();
  assert.equal(
    await page.locator(".placement-tray").count(),
    0,
    "buy began placement",
  );
  await page
    .getByRole("button", {
      name: "Place Precision Cleaner in Build",
      exact: true,
    })
    .click();
  const tray = page.locator(".placement-tray");
  await tray.waitFor();
  assert.match(await tray.textContent(), /3 compatible positions/);
  await page
    .getByTestId("slot-verify")
    .getByRole("button", { name: "Snap here" })
    .click();
  await page
    .getByTestId("slot-verify")
    .getByText("Precision Cleaner")
    .waitFor();
  await page.reload();
  await waitForSave(page);
  await page
    .getByTestId("slot-verify")
    .getByText("Precision Cleaner")
    .waitFor();

  await page
    .getByTestId("slot-prepare")
    .getByRole("button", { name: /Basic Cleaner/ })
    .focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("button", { name: "Place Basic Cleaner in Build", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await assert.equal(await tray.count(), 0, "Escape did not cancel placement");
  await page.waitForFunction(
    () =>
      document.activeElement?.getAttribute("data-module-id") ===
      "basic-cleaner",
  );
  await assert.equal(
    await page.evaluate(() =>
      document.activeElement?.getAttribute("data-module-id"),
    ),
    "basic-cleaner",
    "Escape did not restore originating module focus",
  );

  const beforeSlots = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key));
    return JSON.stringify(state.slots);
  }, saveKey);
  const streamCard = await beginStreamPlacement(page);
  await openTab(page, "Jobs");
  assert.equal(await tray.count(), 0, "Jobs did not cancel placement");
  const afterSlots = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key));
    return JSON.stringify(state.slots);
  }, saveKey);
  assert.equal(beforeSlots, afterSlots, "tab cancellation mutated pipeline");
  await openTab(page, "Build");
  await streamCard.focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("button", { name: "Place Stream Intake in Build", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Cancel placement", exact: true })
    .click();
  await assert.equal(await tray.count(), 0, "Cancel did not clear tray");

  // Keep both live rail endpoints physically visible for direct CDP touch
  // coordinates. The canonical 393×742 suite separately covers the short
  // portrait path; this probe focuses on the real touch move/reorder action.
  await page.setViewportSize({ width: 393, height: 900 });
  const source = page
    .getByTestId("slot-prepare")
    .locator('[data-module-id="basic-cleaner"]');
  const destination = page.getByTestId("slot-runtime");
  await source.scrollIntoViewIfNeeded();
  const [from, to] = await Promise.all([
    source.boundingBox(),
    destination.boundingBox(),
  ]);
  assert.ok(from && to, "missing touch move endpoints");
  const session = await page.context().newCDPSession(page);
  const start = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
  const end = { x: to.x + to.width / 2, y: to.y + to.height / 2 };
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ ...start, id: 1 }],
  });
  for (let step = 1; step <= 6; step += 1) {
    await session.send("Input.dispatchTouchEvent", {
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
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.getByTestId("slot-runtime").getByText("Basic Cleaner").waitFor();
  await page
    .getByTestId("slot-runtime")
    .getByRole("button", { name: /Basic Cleaner/ })
    .click();
  await page
    .getByRole("button", {
      name: /Remove Basic Cleaner from Runtime and bypass position/,
    })
    .click();
  await page
    .getByTestId("slot-runtime")
    .getByText("Empty / bypassed")
    .waitFor();
  await assertPortrait(page, "placement-interactions");
  await screenshot(page, "placement-replace-move-bypass");
  assert.deepEqual(errors, [], "placement interactions: page/console errors");
  await page.close();
}

async function testScaledTrayAndOffline(context) {
  for (const viewport of widths) {
    const page = await freshPage(context, viewport);
    const errors = await attachErrorCollection(page);
    await page.addStyleTag({
      content: ":root { font-size: 200% !important; }",
    });
    const origin = await beginStreamPlacement(page);
    const tray = page.locator(".placement-tray");
    await tray.scrollIntoViewIfNeeded();
    const trayGeometry = await page.evaluate(() => {
      const tray = document.querySelector(".placement-tray");
      const copy = tray?.querySelector("div");
      const cancel = tray?.querySelector("button");
      const cancelBox = cancel?.getBoundingClientRect();
      const range = document.createRange();
      if (!tray || !copy || !cancel || !cancelBox)
        throw new Error("missing placement tray");
      range.selectNodeContents(copy);
      return {
        tray: tray.getBoundingClientRect().toJSON(),
        cancel: cancelBox.toJSON(),
        overlap: [...range.getClientRects()].some(
          (rect) =>
            rect.left < cancelBox.right &&
            rect.right > cancelBox.left &&
            rect.top < cancelBox.bottom &&
            rect.bottom > cancelBox.top,
        ),
        height: innerHeight,
      };
    });
    assert.ok(
      trayGeometry.tray.top >= 0,
      `${viewport.width}: tray starts above viewport`,
    );
    assert.ok(
      trayGeometry.tray.bottom <= trayGeometry.height,
      `${viewport.width}: tray extends past viewport`,
    );
    assert.ok(
      trayGeometry.cancel.top >= 0,
      `${viewport.width}: cancel starts above viewport`,
    );
    assert.ok(
      trayGeometry.cancel.bottom <= trayGeometry.height,
      `${viewport.width}: cancel extends past viewport`,
    );
    assert.equal(
      trayGeometry.overlap,
      false,
      `${viewport.width}: tray copy overlaps Cancel`,
    );
    await assertPortrait(page, `scaled-tray-${viewport.width}`);
    await screenshot(page, `scaled-tray-${viewport.width}`);
    await page
      .getByRole("button", { name: "Cancel placement", exact: true })
      .click();
    await origin.waitFor({ state: "visible" });
    assert.deepEqual(
      errors,
      [],
      `scaled tray ${viewport.width}: page/console errors`,
    );
    await page.close();
  }

  const page = await freshPage(context, widths[1]);
  const errors = await attachErrorCollection(page);
  await setMoney(page, 4);
  await openTab(page, "Upgrades");
  await page
    .getByRole("button", {
      name: "Buy Precision Cleaner for $4.00",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "Place Precision Cleaner in Build",
      exact: true,
    })
    .click();
  await page
    .getByTestId("slot-verify")
    .getByRole("button", { name: "Snap here" })
    .click();
  await page
    .getByTestId("slot-verify")
    .getByText("Precision Cleaner")
    .waitFor();
  await page.evaluate(async () => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: "networkidle" });
  const worker = await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    return {
      controller: navigator.serviceWorker.controller?.scriptURL ?? null,
      scope: (await navigator.serviceWorker.getRegistration())?.scope ?? null,
    };
  });
  assert.ok(
    worker.controller?.includes("/sw.js?build="),
    "root PWA controller unavailable",
  );
  assert.equal(worker.scope, `${baseURL}/`, "root PWA scope differs");
  await page.context().setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page
    .getByTestId("slot-verify")
    .getByText("Precision Cleaner")
    .waitFor();
  await page.context().setOffline(false);
  assert.deepEqual(errors, [], "offline persistence: page/console errors");
  await page.close();
}

try {
  const context = await browser.newContext({ serviceWorkers: "allow" });
  await captureTabDeck(context, "starter");
  await captureTabDeck(context, "expanded");
  await testSelectedStageOrder(context);
  await testPlacementInteractions(context);
  await testScaledTrayAndOffline(context);
  await context.close();
  console.log(
    JSON.stringify(
      {
        baseURL,
        screenshots,
        checks: [
          "starter/expanded five-tab 320/393 screenshot deck",
          "all selected stages across complete ownership mix",
          "purchase/explicit-place/replace/move/bypass/cancel/tab-cancel",
          "200% tray geometry and cancellation",
          "root PWA controller, durable placement, offline reload",
        ],
        findings,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
