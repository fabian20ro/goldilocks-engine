import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:42184";
const outputDirectory = process.env.OUTPUT_DIR ?? "/tmp/goldlocks-r078";
const saveKey = "goldilocks-simulation-save-v4";
const tabs = ["Build", "Jobs", "Career", "Upgrades", "Inspect"];
const viewports = [
  { width: 320, height: 693 },
  { width: 393, height: 742 },
];
const findings = [];
const evidence = {};

await mkdir(outputDirectory, { recursive: true });

function check(id, condition, actual, expected) {
  if (!condition) findings.push({ actual, expected, id });
}

function observeErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

async function waitForReady(page) {
  await page.getByRole("heading", { name: "Goldilocks Engine" }).waitFor({
    timeout: 15_000,
  });
  await page.waitForFunction(
    (key) => localStorage.getItem(key) !== null,
    saveKey,
    { timeout: 15_000 },
  );
}

async function openRecord(browser, viewport, options = {}) {
  const context = await browser.newContext({
    hasTouch: options.hasTouch ?? false,
    isMobile: options.isMobile ?? false,
    serviceWorkers: "allow",
    viewport,
  });
  if (options.seed !== undefined) {
    await context.addInitScript(
      ({ key, marker, serialized }) => {
        if (sessionStorage.getItem(marker) === "seeded") return;
        sessionStorage.setItem(marker, "seeded");
        localStorage.setItem(key, serialized);
      },
      {
        key: saveKey,
        marker: options.marker ?? "r078-seed",
        serialized: options.seed,
      },
    );
  }
  const page = await context.newPage();
  const errors = observeErrors(page);
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await waitForReady(page);
  return { context, errors, page, viewport };
}

async function closeRecord(record) {
  await record.context.close();
}

async function tab(page, name) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name, exact: true })
    .click();
  await page.waitForFunction(
    (expected) =>
      document
        .querySelector("nav[aria-label='Primary'] button[aria-current='page']")
        ?.getAttribute("aria-label") === expected,
    name,
  );
}

async function savedState(page) {
  const raw = await page.evaluate((key) => localStorage.getItem(key), saveKey);
  if (raw === null) throw new Error("missing durable simulation save");
  return JSON.parse(raw);
}

async function openDetails(page, selector) {
  const details = page.locator(selector);
  const open = await details.evaluate((element) => element.open);
  if (!open) await details.locator(":scope > summary").click();
  return details;
}

async function openSimulation(page) {
  return openDetails(page, "[data-testid='simulation-context']");
}

async function openSettings(page) {
  return openDetails(page, ".header-settings");
}

function geometry() {
  const visible = (element) => {
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      box.width > 0 &&
      box.height > 0 &&
      box.bottom > 0 &&
      box.top < window.innerHeight
    );
  };
  // Measure all visible conventional controls plus the native summaries added
  // by D-032. Older local details elsewhere retain their separately accepted
  // target policy and are not part of this presentation-only candidate.
  const targets = [
    ...document.querySelectorAll(
      "button, input, [role='button'], .header-settings > summary, [data-testid='simulation-context'] > summary, [data-testid='simulation-context'] .warning-banner details summary",
    ),
  ]
    .filter(visible)
    .flatMap((element) => {
      const box = element.getBoundingClientRect();
      return box.width < 44 || box.height < 44
        ? [
            {
              box: { height: box.height, width: box.width, x: box.x, y: box.y },
              name:
                element.getAttribute("aria-label") ??
                element.textContent?.trim(),
              tag: element.tagName,
            },
          ]
        : [];
    });
  const scrollables = [
    "[data-testid='pipeline']",
    ".module-library",
    ".placement-tray",
  ].flatMap((selector) =>
    [...document.querySelectorAll(selector)].flatMap((element) => {
      if (!visible(element)) return [];
      const style = getComputedStyle(element);
      return element.scrollHeight > element.clientHeight + 1 &&
        /auto|scroll/.test(style.overflowY)
        ? [
            {
              clientHeight: element.clientHeight,
              overflowY: style.overflowY,
              scrollHeight: element.scrollHeight,
              selector,
            },
          ]
        : [];
    }),
  );
  const nav = document.querySelector("nav[aria-label='Primary']");
  const navBox = nav?.getBoundingClientRect();
  const active = document.querySelector(
    "nav[aria-label='Primary'] button[aria-current='page']",
  );
  const primary = {
    Build: document.querySelector(".presentation-toggle"),
    Career: document.querySelector(".career-deck"),
    Inspect: document.querySelector("[data-testid='inspect-priority']"),
    Jobs: document.querySelector(".queue-one"),
    Upgrades: document.querySelector(".upgrades-content article"),
  }[active?.getAttribute("aria-label") ?? ""];
  const primaryBox = primary?.getBoundingClientRect();
  const resources = document.querySelector("[aria-label='Primary resources']");
  const resourceBox = resources?.getBoundingClientRect();
  const main = document.querySelector("main");
  const mainBox = main?.getBoundingClientRect();
  return {
    activeTab: active?.getAttribute("aria-label") ?? null,
    appScrollTop:
      document.querySelector(".app-scroll-region")?.scrollTop ?? null,
    documentOverflow:
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
    nestedScrollables: scrollables,
    nav: navBox
      ? {
          bottom: navBox.bottom,
          paddingBottom: nav
            ? Number.parseFloat(getComputedStyle(nav).paddingBottom)
            : null,
          top: navBox.top,
        }
      : null,
    primary: primaryBox
      ? { bottom: primaryBox.bottom, top: primaryBox.top }
      : null,
    resources: resourceBox
      ? { bottom: resourceBox.bottom, top: resourceBox.top }
      : null,
    main: mainBox ? { bottom: mainBox.bottom, top: mainBox.top } : null,
    undersized: targets,
    viewport: {
      height: window.innerHeight,
      width: document.documentElement.clientWidth,
    },
  };
}

function selectedWorkloadGeometry() {
  const intersects = (left, right) =>
    Math.max(left.left, right.left) < Math.min(left.right, right.right) &&
    Math.max(left.top, right.top) < Math.min(left.bottom, right.bottom);
  const read = (selector) => {
    const element = document.querySelector(selector);
    if (!element) return { ranges: [], text: "" };
    const range = document.createRange();
    range.selectNodeContents(element);
    return {
      ranges: [...range.getClientRects()].map((box) => ({
        bottom: box.bottom,
        left: box.left,
        right: box.right,
        top: box.top,
      })),
      text: element.textContent?.trim() ?? "",
    };
  };
  const nav = document
    .querySelector("nav[aria-label='Primary']")
    ?.getBoundingClientRect();
  const queue = document.querySelector(".queue-one")?.getBoundingClientRect();
  const header = document.querySelector(".selected-dispatch > div");
  const title = read(".selected-dispatch strong");
  const price = read(".selected-dispatch b");
  const width = document.documentElement.clientWidth;
  const all = [...title.ranges, ...price.ranges];
  return {
    documentOverflow: document.documentElement.scrollWidth > width,
    gridAreas: header ? getComputedStyle(header).gridTemplateAreas : null,
    gridTracks: header
      ? getComputedStyle(header).gridTemplateColumns.trim().split(/\s+/).length
      : null,
    queueClearance: nav && queue ? nav.top - queue.bottom : null,
    scrollTop: document.querySelector(".app-scroll-region")?.scrollTop ?? null,
    textInViewport: all.every(
      (box) => box.left >= 0 && box.right <= width && box.right > box.left,
    ),
    title,
    price,
    titlePriceOverlap: title.ranges.flatMap((left) =>
      price.ranges.filter((right) => intersects(left, right)),
    ),
  };
}

async function expand(record) {
  const before = await savedState(record.page);
  before.resources.money = 45;
  await closeRecord(record);
  const expanded = await openRecord(chromiumBrowser, record.viewport, {
    marker: `r078-expand-${record.viewport.width}-${record.viewport.height}`,
    seed: JSON.stringify(before),
  });
  await tab(expanded.page, "Upgrades");
  await expanded.page
    .getByRole("button", { name: "Buy Workstation Expansion I for $45.00" })
    .click();
  await expanded.page
    .getByRole("button", { name: "Activate six-position pipeline" })
    .click();
  await tab(expanded.page, "Build");
  await expanded.page.waitForFunction(
    () =>
      document.querySelectorAll("[data-testid='pipeline'] .pipeline-slot")
        .length === 8,
  );
  return expanded;
}

async function captureDeck(browser) {
  for (const viewport of viewports) {
    for (const kind of ["starter", "expanded"]) {
      let record = await openRecord(browser, viewport);
      if (kind === "expanded") record = await expand(record);
      const stateEvidence = {};
      for (const scale of [100, 200]) {
        if (scale === 200) {
          await record.page.emulateMedia({ reducedMotion: "reduce" });
          await record.page.addStyleTag({
            content: ":root { font-size: 200% !important; }",
          });
          await record.page.waitForTimeout(200);
        }
        const scaleEvidence = {};
        for (const name of tabs) {
          await tab(record.page, name);
          await record.page.waitForTimeout(40);
          // This is the requested first-viewport matrix, not a scroll-state
          // test; state-boundary coverage below independently exercises the
          // per-tab restoration contract.
          await record.page.locator(".app-scroll-region").evaluate((region) => {
            region.scrollTop = 0;
          });
          await record.page.waitForTimeout(20);
          const snapshot = await record.page.evaluate(geometry);
          scaleEvidence[name] = snapshot;
          check(
            `deck-${kind}-${viewport.width}x${viewport.height}-${scale}-${name}`,
            !snapshot.documentOverflow &&
              snapshot.nestedScrollables.length === 0 &&
              snapshot.undersized.length === 0 &&
              snapshot.nav !== null &&
              snapshot.nav.bottom <= snapshot.viewport.height + 0.5 &&
              snapshot.nav.paddingBottom >= 6 &&
              snapshot.resources !== null &&
              snapshot.resources.top >= 0 &&
              snapshot.main !== null &&
              snapshot.main.top < snapshot.nav.top,
            snapshot,
            "Every raw/scaled tab keeps its resource HUD, current tab priority, fixed navigation/safe padding, >=44px visible targets, and no horizontal or nested overflow.",
          );
          await record.page.screenshot({
            path: `${outputDirectory}/${kind}-${viewport.width}x${viewport.height}-${scale}-${name.toLowerCase()}.png`,
          });
        }
        stateEvidence[scale] = scaleEvidence;
      }
      evidence[`deck-${kind}-${viewport.width}x${viewport.height}`] =
        stateEvidence;
      check(
        `deck-${kind}-${viewport.width}x${viewport.height}-errors`,
        record.errors.length === 0,
        record.errors,
        "Deck traversal emits no page or console errors.",
      );
      await closeRecord(record);
    }
  }
}

async function disclosureProbe(browser) {
  const record = await openRecord(browser, viewports[0], {
    hasTouch: true,
    isMobile: true,
  });
  const { context, errors, page } = record;
  try {
    const settings = page.locator(".header-settings");
    const settingsSummary = settings.locator(":scope > summary");
    const simulation = page.locator("[data-testid='simulation-context']");
    const simulationSummary = simulation.locator(":scope > summary");
    const initial = await page.evaluate(() => ({
      maxTouchPoints: navigator.maxTouchPoints,
      simulationOpen: document.querySelector(
        "[data-testid='simulation-context']",
      )?.open,
      settingsOpen: document.querySelector(".header-settings")?.open,
      simulationTag: document.querySelector(
        "[data-testid='simulation-context']",
      )?.tagName,
      settingsTag: document.querySelector(".header-settings")?.tagName,
    }));
    const ax = await accessibilityNames(page, [
      ".header-settings > summary",
      "[data-testid='simulation-context'] > summary",
    ]);
    check(
      "disclosures-native-touch-and-names",
      initial.maxTouchPoints > 0 &&
        initial.settingsOpen === false &&
        initial.simulationOpen === false &&
        initial.settingsTag === "DETAILS" &&
        initial.simulationTag === "DETAILS" &&
        (await settingsSummary.getAttribute("aria-label")) ===
          "Help and motion settings" &&
        (await settingsSummary.textContent())?.trim() === "Help & motion" &&
        (await simulationSummary.getAttribute("aria-label"))?.includes(
          "Simulation time 1×",
        ) &&
        ax[".header-settings > summary"].includes("Help and motion settings") &&
        ax["[data-testid='simulation-context'] > summary"].some((name) =>
          name.includes("Simulation time 1×"),
        ),
      { ax, initial },
      "Both compact surfaces are native closed details with touch capability and correct accessible names.",
    );

    await settingsSummary.focus();
    await page.keyboard.press("Space");
    check(
      "help-keyboard-open",
      (await settings.getAttribute("open")) !== null &&
        (await page
          .getByRole("button", { name: "Help / Quick start" })
          .count()) === 1 &&
        (await page.getByRole("button", { name: "Animations on" }).count()) ===
          1,
      {
        help: await page
          .getByRole("button", { name: "Help / Quick start" })
          .count(),
        motion: await page
          .getByRole("button", { name: "Animations on" })
          .count(),
      },
      "Keyboard opens Help & motion with retained Help and motion names.",
    );
    const initialTutorial = page.getByRole("button", {
      name: "Dismiss tutorial",
    });
    if (await initialTutorial.isVisible()) await initialTutorial.click();
    await page.getByRole("button", { name: "Help / Quick start" }).click();
    await page.getByRole("button", { name: "Dismiss tutorial" }).click();
    await page.waitForTimeout(40);
    check(
      "quick-start-dismiss-focus-return",
      await settingsSummary.evaluate(
        (element) => document.activeElement === element,
      ),
      await page.evaluate(() => ({
        active:
          document.activeElement?.getAttribute("aria-label") ??
          document.activeElement?.tagName,
      })),
      "Quick Start dismissal returns focus to the visible Help & motion disclosure summary.",
    );

    const beforeMotion = await simulationSummary.getAttribute("aria-label");
    await openSettings(page);
    await page.getByRole("button", { name: "Animations on" }).click();
    const afterMotion = await simulationSummary.getAttribute("aria-label");
    check(
      "motion-is-visual-only",
      (await page
        .getByRole("button", { name: "Animations off" })
        .getAttribute("aria-pressed")) === "true" &&
        beforeMotion?.includes("Simulation time 1×") &&
        afterMotion?.includes("Simulation time 1×") &&
        (await page.evaluate(() => document.getAnimations().length)) === 0,
      {
        afterMotion,
        animations: await page.evaluate(() => document.getAnimations().length),
        beforeMotion,
      },
      "Motion switch is visual-only and leaves simulation speed unchanged.",
    );

    await settingsSummary.tap();
    await simulationSummary.tap();
    check(
      "simulation-touch-open",
      (await simulation.getAttribute("open")) !== null,
      { open: await simulation.getAttribute("open") },
      "A real touch tap opens Simulation context.",
    );
    const warning = simulation.getByLabel("Current warning and actions");
    const currentWarning = (await warning.locator("strong").innerText()).trim();
    const speedNames = await simulation
      .getByRole("group", { name: "Time speed" })
      .getByRole("button")
      .allTextContents();
    const speedEvidence = [];
    for (const speed of ["1×", "4×", "16×", "64×"]) {
      const open = await openSimulation(page);
      await open.getByRole("button", { name: speed, exact: true }).click();
      const label = await simulationSummary.getAttribute("aria-label");
      const closed = (await simulation.getAttribute("open")) === null;
      await openSimulation(page);
      const pressed = await simulation
        .getByRole("button", { name: speed, exact: true })
        .getAttribute("aria-pressed");
      speedEvidence.push({ closed, label, pressed, speed });
      check(
        `simulation-speed-${speed}`,
        closed &&
          label?.includes(`Simulation time ${speed}`) &&
          pressed === "true",
        speedEvidence.at(-1),
        "Each exact time-speed choice updates the native summary and selected control.",
      );
    }
    const warningDetails = warning.locator("details");
    await warningDetails.locator("summary").click();
    const warningCopy = await warning.innerText();
    const postDisclosure = await page.evaluate(geometry);
    check(
      "simulation-warning-details-and-autoclose",
      speedNames.join("|") === "1×|4×|16×|64×" &&
        (await warningDetails.getAttribute("open")) !== null &&
        warningCopy.includes(currentWarning) &&
        warningCopy.includes(
          "more evidence narrows blind spots without guaranteeing correctness",
        ) &&
        warningCopy.includes(
          "Use the bottom tabs for Build, Jobs, Career, Upgrades, and Inspect.",
        ) &&
        !postDisclosure.documentOverflow &&
        postDisclosure.undersized.length === 0,
      { currentWarning, postDisclosure, speedEvidence, warningCopy },
      "Simulation retains exact controls and full warning evidence/valid responses on demand; speed selection closes its disclosure before return to tab priority.",
    );
    evidence.disclosures = {
      ax,
      currentWarning,
      initial,
      postDisclosure,
      speedEvidence,
      warningCopy,
    };
    check(
      "disclosures-errors",
      errors.length === 0,
      errors,
      "Disclosure keyboard/touch/focus flows emit no errors.",
    );
  } finally {
    await context.close();
  }
}

async function accessibilityNames(page, selectors) {
  const cdp = await page.context().newCDPSession(page);
  try {
    const documentTree = await cdp.send("DOM.getDocument");
    const names = {};
    for (const selector of selectors) {
      const node = await cdp.send("DOM.querySelector", {
        nodeId: documentTree.root.nodeId,
        selector,
      });
      const ax = await cdp.send("Accessibility.getPartialAXTree", {
        nodeId: node.nodeId,
      });
      names[selector] = ax.nodes
        .map((entry) => entry.name?.value)
        .filter((value) => typeof value === "string");
    }
    return names;
  } finally {
    await cdp.detach();
  }
}

async function warningResponses(browser) {
  const record = await openRecord(browser, { width: 393, height: 850 });
  const { errors, page } = record;
  try {
    await tab(page, "Jobs");
    await page
      .getByRole("button", { name: "Queue one safe Interactive Chat job" })
      .click();
    await openSimulation(page);
    await page.getByRole("button", { name: "64×", exact: true }).click();
    await page.getByRole("button", { name: "Build", exact: true }).click();
    if (
      (await page
        .locator('.module-library [data-module-id="full-model"]')
        .count()) === 0
    )
      await page
        .getByRole("button", { name: "Show every module (17)" })
        .click();
    await page.locator('.module-library [data-module-id="full-model"]').click();
    await page
      .getByRole("button", { name: "Place Full Precision Model in Build" })
      .click();
    await page
      .getByTestId("slot-runtime")
      .getByRole("button", { name: "Snap here" })
      .click();
    await tab(page, "Jobs");
    await page.getByRole("button", { name: /Long Document/ }).click();
    const simulation = await openSimulation(page);
    const warning = simulation.getByLabel("Current warning and actions");
    const memorySummary = await warning.locator("strong").innerText();
    await warning.locator("summary").click();
    const memoryCopy = await warning.innerText();
    await page.getByLabel("Memory reserve percentage").fill("0");
    await page.waitForFunction(() =>
      document
        .querySelector(
          "[data-testid='simulation-context'] [aria-label='Current warning and actions']",
        )
        ?.textContent?.includes("0 GB (0%)"),
    );
    const zeroReserveCopy = await warning.innerText();
    check(
      "memory-warning-valid-responses",
      memorySummary.includes("Memory limit exceeded") &&
        memoryCopy.includes("Lower the reserve") &&
        memoryCopy.includes("lighter compatible modules") &&
        memoryCopy.includes("the warning does not assume one sole cause") &&
        zeroReserveCopy.includes("Choose lighter compatible modules") &&
        zeroReserveCopy.includes("lower-memory workload") &&
        !zeroReserveCopy.includes("Lower the reserve"),
      { memoryCopy, memorySummary, zeroReserveCopy },
      "Memory warnings expose only current valid responses and remove a response at its boundary.",
    );
    evidence.memoryWarning = { memoryCopy, memorySummary, zeroReserveCopy };
    check(
      "memory-warning-errors",
      errors.length === 0,
      errors,
      "Memory-warning disclosure produces no error.",
    );
  } finally {
    await closeRecord(record);
  }
}

async function stateBoundaryProbe(browser) {
  const record = await openRecord(browser, viewports[1]);
  const { context, errors, page } = record;
  try {
    const snapshot = async () => {
      const state = await savedState(page);
      return JSON.stringify({
        computeAllocation: state.computeAllocation,
        hardwareId: state.hardwareId,
        memoryReserve: state.memoryReserve,
        ownedModuleIds: state.ownedModuleIds,
        slots: state.slots,
        workloadId: state.workloadId,
      });
    };
    const beforePresentation = await snapshot();
    const configure = page.getByRole("button", {
      name: "Configure current pipeline presentation",
    });
    const observe = page.getByRole("button", {
      name: "Observe current pipeline presentation",
    });
    await observe.click();
    await configure.click();
    const afterPresentation = await snapshot();
    check(
      "configure-observe-presentation-only",
      beforePresentation === afterPresentation &&
        (await page
          .getByRole("navigation", { name: "Primary" })
          .getByRole("button", { name: "Build", exact: true })
          .getAttribute("aria-current")) === "page",
      { afterPresentation, beforePresentation },
      "Configure/Observe changes only Build presentation without routing or simulation state mutation.",
    );

    const origin = page
      .getByTestId("slot-prepare")
      .getByRole("button", { name: /^Basic Cleaner/ });
    await origin.click();
    await page
      .getByRole("button", { name: "Place Basic Cleaner in Build" })
      .click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(40);
    const escape = {
      focus: await origin.evaluate(
        (element) => document.activeElement === element,
      ),
      snap: await page.getByRole("button", { name: "Snap here" }).count(),
    };
    await origin.click();
    await page
      .getByRole("button", { name: "Place Basic Cleaner in Build" })
      .click();
    await tab(page, "Jobs");
    const afterTab = {
      pendingNav: await page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("button", { name: "Build", exact: true })
        .innerText(),
      snap: await page.getByRole("button", { name: "Snap here" }).count(),
    };
    check(
      "placement-cancellation",
      escape.focus &&
        escape.snap === 0 &&
        afterTab.snap === 0 &&
        !afterTab.pendingNav.includes("pending"),
      { afterTab, escape },
      "Escape and tab change cancel pending placement without hidden state mutation and restore focus to the origin.",
    );

    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForReady(page);
    const region = page.locator(".app-scroll-region");
    await region.evaluate((element) => {
      element.scrollTop = Math.min(
        180,
        element.scrollHeight - element.clientHeight,
      );
    });
    const buildScroll = await region.evaluate((element) => element.scrollTop);
    await tab(page, "Jobs");
    await page.waitForTimeout(40);
    const jobsScroll = await region.evaluate((element) => element.scrollTop);
    await tab(page, "Build");
    await page.waitForTimeout(40);
    const restoredScroll = await region.evaluate(
      (element) => element.scrollTop,
    );
    check(
      "tab-scroll-restoration",
      buildScroll > 0 && jobsScroll === 0 && restoredScroll > 0,
      { buildScroll, jobsScroll, restoredScroll },
      "Bottom tabs retain per-tab scroll and do not transfer scroll into a new tab.",
    );

    await tab(page, "Career");
    const freelance = page.getByLabel("Freelance delivery evening hours");
    await freelance.fill("3");
    await openSimulation(page);
    await page.getByRole("button", { name: "64×", exact: true }).click();
    await tab(page, "Jobs");
    await tab(page, "Inspect");
    await tab(page, "Career");
    const tabDraft = await freelance.inputValue();
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForReady(page);
    await tab(page, "Career");
    const reloadDraft = await page
      .getByLabel("Freelance delivery evening hours")
      .inputValue();
    check(
      "career-app-session-draft",
      tabDraft === "3" && reloadDraft === "0",
      { reloadDraft, tabDraft },
      "Career allocation draft survives Worker speed/tab presentation but remains session-only after reload.",
    );
    evidence.stateBoundary = {
      afterTab,
      buildScroll,
      escape,
      jobsScroll,
      reloadDraft,
      restoredScroll,
      tabDraft,
    };
    check(
      "state-boundary-errors",
      errors.length === 0,
      errors,
      "Presentation/cancellation/draft routes emit no page or console errors.",
    );
  } finally {
    await context.close();
  }
}

async function jobsAndRecoveryProbe(browser) {
  for (const viewport of viewports) {
    const record = await openRecord(browser, viewport);
    try {
      await tab(record.page, "Jobs");
      const raw = await record.page.evaluate(selectedWorkloadGeometry);
      await record.page
        .getByRole("button", { name: "Queue one safe Interactive Chat job" })
        .click();
      await openSimulation(record.page);
      await record.page
        .getByRole("button", { name: "64×", exact: true })
        .click();
      await record.page.waitForFunction(() =>
        document
          .querySelector("[data-testid='first-session-guide']")
          ?.textContent?.includes("step 3 of 3"),
      );
      const settledRaw = await record.page.evaluate(selectedWorkloadGeometry);
      await record.page.emulateMedia({ reducedMotion: "reduce" });
      await record.page.addStyleTag({
        content: ":root { font-size: 200% !important; }",
      });
      await record.page.locator(".selected-dispatch").scrollIntoViewIfNeeded();
      const scaled = await record.page.evaluate(selectedWorkloadGeometry);
      evidence[`jobs-${viewport.width}x${viewport.height}`] = {
        raw,
        scaled,
        settledRaw,
      };
      check(
        `jobs-${viewport.width}x${viewport.height}-d018-v077`,
        raw.scrollTop === 0 &&
          raw.queueClearance >= 8 &&
          settledRaw.gridTracks === 3 &&
          settledRaw.gridAreas === "none" &&
          !settledRaw.documentOverflow &&
          scaled.gridTracks === 2 &&
          scaled.gridAreas === '"glyph summary" ". price"' &&
          scaled.title.text.length > 0 &&
          scaled.price.text.length > 0 &&
          scaled.titlePriceOverlap.length === 0 &&
          scaled.textInViewport &&
          !scaled.documentOverflow,
        { raw, scaled, settledRaw },
        "D-018 raw Queue 1 reserve and V-077 raw/scaled selected-workload behavior remain intact.",
      );
    } finally {
      await closeRecord(record);
    }
  }

  const malformed = await openRecord(browser, viewports[0], {
    marker: "r078-malformed",
    seed: "{invalid-json",
  });
  try {
    await tab(malformed.page, "Jobs");
    const recovery = {
      queue: await malformed.page
        .getByRole("button", { name: "Queue one safe Interactive Chat job" })
        .count(),
      save: await malformed.page.evaluate(
        (key) => localStorage.getItem(key),
        saveKey,
      ),
    };
    check(
      "malformed-save-recovery",
      recovery.queue === 1 &&
        recovery.save !== "{invalid-json" &&
        malformed.errors.length === 0,
      { errors: malformed.errors, recovery },
      "Malformed persisted state fails closed to a usable first-session route without error.",
    );
  } finally {
    await closeRecord(malformed);
  }

  const offline = await openRecord(browser, viewports[1]);
  try {
    await offline.page.waitForFunction(
      () => navigator.serviceWorker.controller !== null,
      { timeout: 15_000 },
    );
    await tab(offline.page, "Career");
    await offline.page.getByLabel("Freelance delivery evening hours").fill("2");
    const before = await offline.page.evaluate(
      (key) => localStorage.getItem(key),
      saveKey,
    );
    await offline.context.setOffline(true);
    await offline.page.reload({ waitUntil: "domcontentloaded" });
    await waitForReady(offline.page);
    const after = await offline.page.evaluate(
      (key) => localStorage.getItem(key),
      saveKey,
    );
    const controller = await offline.page.evaluate(
      () => navigator.serviceWorker.controller?.scriptURL ?? null,
    );
    check(
      "root-pwa-offline-reload",
      before !== null && after !== null && controller !== null,
      { after, before, controller },
      "Installed root PWA shell reloads offline with its Worker controller and durable save present.",
    );
  } finally {
    await offline.context.close();
  }
}

async function dragProbe(browser, kind) {
  const record = await openRecord(
    browser,
    { width: 393, height: 900 },
    {
      hasTouch: kind === "touch",
      isMobile: kind === "touch",
    },
  );
  const { context, page } = record;
  try {
    const source = page
      .getByTestId("slot-prepare")
      .locator('[data-module-id="basic-cleaner"]');
    const destination = page.getByTestId("slot-runtime");
    await source.scrollIntoViewIfNeeded();
    await destination.scrollIntoViewIfNeeded();
    const [from, to] = await Promise.all([
      source.boundingBox(),
      destination.boundingBox(),
    ]);
    if (!from || !to) throw new Error(`${kind} drag endpoints absent`);
    const start = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
    const end = { x: to.x + to.width / 2, y: to.y + to.height / 2 };
    if (kind === "pointer") {
      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      await page.mouse.move(end.x, end.y, { steps: 8 });
      await page.mouse.up();
    } else {
      const cdp = await context.newCDPSession(page);
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ ...start, id: 1 }],
      });
      for (let step = 1; step <= 8; step += 1) {
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [
            {
              id: 1,
              x: start.x + ((end.x - start.x) * step) / 8,
              y: start.y + ((end.y - start.y) * step) / 8,
            },
          ],
        });
      }
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await cdp.detach();
    }
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='slot-prepare']")
          ?.textContent?.includes("Quantized Model") &&
        document
          .querySelector("[data-testid='slot-runtime']")
          ?.textContent?.includes("Basic Cleaner"),
    );
    const state = await savedState(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForReady(page);
    const rendered = await page.evaluate(() => ({
      prepare: document.querySelector("[data-testid='slot-prepare']")
        ?.textContent,
      runtime: document.querySelector("[data-testid='slot-runtime']")
        ?.textContent,
    }));
    const result = { rendered, slots: state.slots, start, end };
    evidence[`drag-${kind}`] = result;
    check(
      `drag-${kind}`,
      rendered.prepare?.includes("Quantized Model") &&
        rendered.runtime?.includes("Basic Cleaner") &&
        state.slots.some(
          (slot) =>
            slot.slotId === "prepare" && slot.moduleId === "quantized-model",
        ) &&
        state.slots.some(
          (slot) =>
            slot.slotId === "runtime" && slot.moduleId === "basic-cleaner",
        ),
      result,
      "Visible endpoints support actual pointer/CDP-touch reorder and persist it through reload.",
    );
  } finally {
    await closeRecord(record);
  }
}

const chromiumBrowser = await chromium.launch({ headless: true });
try {
  await captureDeck(chromiumBrowser);
  await disclosureProbe(chromiumBrowser);
  await warningResponses(chromiumBrowser);
  await stateBoundaryProbe(chromiumBrowser);
  await jobsAndRecoveryProbe(chromiumBrowser);
  await dragProbe(chromiumBrowser, "pointer");
  await dragProbe(chromiumBrowser, "touch");
} finally {
  await chromiumBrowser.close();
}

console.log(JSON.stringify({ evidence, findings, outputDirectory }, null, 2));
if (findings.length > 0) process.exitCode = 1;
