#!/usr/bin/env node

/*
 * M7B mobile-performance collector.
 *
 * Browser measurements are repository-native Playwright/PerformanceObserver
 * samples. Device measurements are optional adb supplements. A missing
 * same-device frozen-build baseline or physical battery/thermal observation is
 * a BLOCKED gate, never an implicit pass.
 */

import { execFileSync, spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { expect } from "@playwright/test";
import { chromium, webkit } from "playwright";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const evidenceDir = path.resolve(
  root,
  process.env.M7B_PERFORMANCE_EVIDENCE_DIR ?? ".cache/m7b/performance",
);
const port = Number(process.env.M7B_PERFORMANCE_PORT ?? "4176");
const androidCdpPort = Number(
  process.env.M7B_PERFORMANCE_ANDROID_CDP_PORT ?? "9223",
);
const loopbackUrl = `http://127.0.0.1:${port}/`;
const runs = Number(process.env.M7B_PERFORMANCE_RUNS ?? "5");
const widths = [320, 393];
const browsers = (process.env.M7B_PERFORMANCE_BROWSERS ?? "chromium,webkit")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const allowBlocked =
  process.env.M7B_PERFORMANCE_ALLOW_BLOCKED === "1" ||
  process.argv.includes("--allow-blocked");
const captureFrozenBaseline = process.argv.includes(
  "--capture-frozen-baseline",
);
const frozenAcceptedCandidateSha =
  process.env.M7B_FROZEN_ACCEPTED_SHA ??
  "d25e80e6781de89e80fc3b3c240a922ada53d978";
const frozenAcceptedBuildId =
  process.env.M7B_FROZEN_BUILD_ID ?? "dc97ee41f6dbbc0e29d2";
const performanceDeviceId =
  process.env.M7B_PERFORMANCE_DEVICE_ID ?? "unidentified-device";
const baselineArg = process.argv.find((value) =>
  value.startsWith("--baseline="),
);
const baselinePath = path.resolve(
  root,
  baselineArg?.slice("--baseline=".length) ??
    process.env.M7B_PERFORMANCE_BASELINE ??
    ".cache/m7b/performance/frozen-baseline.json",
);
const summaryArg = process.argv.find((value) => value.startsWith("--output="));
const summaryPath = path.resolve(
  root,
  summaryArg?.slice("--output=".length) ??
    path.join(evidenceDir, "summary.json"),
);
const measurementSettings = {
  hasTouch: true,
  isMobile: true,
  textScale: "100%",
  reducedMotion: "no-preference",
  viewportHeights: { 320: 693, 393: 742 },
  browsers,
  widths,
};
const measurementSettingsFingerprint = settingsFingerprint(measurementSettings);

if (!Number.isInteger(runs) || runs < 5) {
  console.error(
    "M7B performance requires at least five cold runs per matrix cell",
  );
  process.exitCode = 64;
}

fs.mkdirSync(evidenceDir, { recursive: true });
fs.mkdirSync(path.join(evidenceDir, "traces"), { recursive: true });
fs.mkdirSync(path.join(evidenceDir, "samples"), { recursive: true });

function command(commandName, args = []) {
  try {
    return {
      available: true,
      status: 0,
      stdout: execFileSync(commandName, args, {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        maxBuffer: 4 * 1024 * 1024,
      }),
      stderr: "",
    };
  } catch (error) {
    return {
      available: error?.code !== "ENOENT",
      status: Number.isInteger(error?.status) ? error.status : 127,
      stdout: String(error?.stdout ?? ""),
      stderr: String(error?.stderr ?? error?.message ?? ""),
    };
  }
}

function sha256(filePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

function artifact(relativePath, value) {
  const target = path.join(evidenceDir, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(
    target,
    typeof value === "string" ? value : JSON.stringify(value, null, 2) + "\n",
  );
  return {
    path: path.relative(root, target),
    sha256: sha256(target),
  };
}

function existingArtifact(filePath) {
  return {
    path: path.relative(root, filePath),
    sha256: sha256(filePath),
  };
}

function gitSha() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
}

function settingsFingerprint(settings) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(settings))
    .digest("hex");
}

function percentile(values, percentileValue) {
  const finite = values
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
  if (finite.length === 0) return null;
  const index = Math.min(
    finite.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * finite.length) - 1),
  );
  return finite[index];
}

function median(values) {
  return percentile(values, 50);
}

function numberOrNull(value) {
  return Number.isFinite(value) ? Number(value) : null;
}

const observerScript = () => {
  const state = {
    lcp: [],
    cls: 0,
    inp: [],
    supportedEntryTypes: PerformanceObserver.supportedEntryTypes ?? [],
  };
  window.__m7bPerformance = state;
  try {
    if (state.supportedEntryTypes.includes("largest-contentful-paint")) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) state.lcp.push(entry.startTime);
      }).observe({ type: "largest-contentful-paint", buffered: true });
    }
  } catch {
    // The result retains a null LCP plus an explicit unsupported metric note.
  }
  try {
    if (state.supportedEntryTypes.includes("layout-shift")) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) state.cls += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    }
  } catch {
    // See the explicit unsupported metric note above.
  }
  try {
    if (state.supportedEntryTypes.includes("event")) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name !== "pointerdown" && entry.name !== "keydown")
            state.inp.push(entry.duration);
        }
      }).observe({ type: "event", buffered: true, durationThreshold: 16 });
    }
  } catch {
    // Safari/WebKit may not expose Event Timing; record the limitation.
  }
};

// Test-only attribution for the product's Dedicated Worker. Renderer-wide
// timing cannot identify this Worker; this hook measures the product Worker
// request/response boundary without shipping telemetry.
const dedicatedWorkerInstrumentation = () => {
  const NativeWorker = window.Worker;
  if (typeof NativeWorker !== "function") return;
  const records = [];
  window.__m7bDedicatedWorkerRecords = records;
  window.Worker = class InstrumentedDedicatedWorker extends NativeWorker {
    constructor(...args) {
      super(...args);
      const worker = this;
      const workerUrl = String(args[0] ?? "");
      const pending = [];
      const postMessage = worker.postMessage.bind(worker);
      worker.postMessage = (...messageArgs) => {
        pending.push(performance.now());
        records.push({
          type: "request",
          url: workerUrl,
          atMs: performance.now(),
        });
        return postMessage(...messageArgs);
      };
      worker.addEventListener("message", () => {
        const sentAt = pending.shift();
        const receivedAt = performance.now();
        records.push({
          type: "response",
          url: workerUrl,
          atMs: receivedAt,
          roundTripMs:
            sentAt === undefined ? null : Math.max(0, receivedAt - sentAt),
        });
      });
    }
  };
};

async function waitForApp(page) {
  await page
    .locator("h1", { hasText: "Goldilocks Engine" })
    .waitFor({ state: "visible" });
}

async function readPageMetrics(page) {
  return page.evaluate(() => {
    const state = window.__m7bPerformance;
    const navigation = performance.getEntriesByType("navigation")[0];
    const resources = performance.getEntriesByType("resource");
    return {
      lcpMs: state?.lcp?.length ? Math.max(...state.lcp) : null,
      cls: state?.cls ?? null,
      inpMs: state?.inp?.length ? Math.max(...state.inp) : null,
      supportedEntryTypes: state?.supportedEntryTypes ?? [],
      domContentLoadedMs: navigation?.domContentLoadedEventEnd ?? null,
      transferBytes: resources.reduce(
        (total, resource) => total + (resource.transferSize ?? 0),
        0,
      ),
      jsCssTransferBytes: resources
        .filter((resource) => /\.js(?:\?|$)|\.css(?:\?|$)/.test(resource.name))
        .reduce((total, resource) => total + (resource.transferSize ?? 0), 0),
      memoryMb:
        performance.memory?.usedJSHeapSize != null
          ? performance.memory.usedJSHeapSize / 1024 / 1024
          : null,
      viewport: { width: innerWidth, height: innerHeight },
    };
  });
}

async function clickSpeed(page, speed) {
  const details = page.getByTestId("simulation-context");
  const open = await details.evaluate((element) => element.open);
  if (!open) await details.locator(":scope > summary").click();
  await details.getByRole("button", { name: speed, exact: true }).click();
}

async function measureDedicatedWorkerCost(page) {
  const readMemory = async () =>
    page.evaluate(() =>
      performance.memory?.usedJSHeapSize != null
        ? performance.memory.usedJSHeapSize / 1024 / 1024
        : null,
    );
  const samples = {};
  for (const [label, speed] of [
    ["1x", "1×"],
    ["64x", "64×"],
  ]) {
    await clickSpeed(page, speed);
    await page.evaluate(() => {
      if (Array.isArray(window.__m7bDedicatedWorkerRecords))
        window.__m7bDedicatedWorkerRecords.length = 0;
    });
    const memoryBeforeMb = await readMemory();
    const start = Date.now();
    await page.waitForTimeout(1_000);
    const memoryAfterMb = await readMemory();
    const workerEvidence = await page.evaluate(() => {
      const records = Array.isArray(window.__m7bDedicatedWorkerRecords)
        ? window.__m7bDedicatedWorkerRecords
        : [];
      const responses = records
        .filter(
          (record) =>
            record?.type === "response" && Number.isFinite(record.roundTripMs),
        )
        .map((record) => record.roundTripMs);
      const sorted = responses.slice().sort((a, b) => a - b);
      const atPercentile = (fraction) =>
        sorted.length
          ? sorted[
              Math.min(
                sorted.length - 1,
                Math.max(0, Math.ceil(sorted.length * fraction) - 1),
              )
            ]
          : null;
      return {
        requestCount: records.filter((record) => record?.type === "request")
          .length,
        responseCount: responses.length,
        responseMedianMs: atPercentile(0.5),
        responseP95Ms: atPercentile(0.95),
        workerUrls: [
          ...new Set(
            records
              .map((record) => record?.url)
              .filter((url) => typeof url === "string" && url.length > 0),
          ),
        ],
      };
    });
    samples[label] = {
      elapsedMs: Date.now() - start,
      dedicatedWorkerResponseMs: workerEvidence.responseP95Ms,
      dedicatedWorkerResponseMedianMs: workerEvidence.responseMedianMs,
      dedicatedWorkerRequestCount: workerEvidence.requestCount,
      dedicatedWorkerResponseCount: workerEvidence.responseCount,
      dedicatedWorkerUrls: workerEvidence.workerUrls,
      memoryBeforeMb,
      memoryAfterMb,
      memoryDeltaMb:
        memoryBeforeMb !== null && memoryAfterMb !== null
          ? memoryAfterMb - memoryBeforeMb
          : null,
      method:
        "test-only Dedicated Worker postMessage/message round-trip attribution",
    };
  }
  return samples;
}

async function runBrowserSample(browserName, width, runIndex, browser) {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width, height: width === 320 ? 693 : 742 },
    serviceWorkers: "allow",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  const tracePath = path.join(
    evidenceDir,
    "traces",
    `${browserName}-${width}-${runIndex}.zip`,
  );
  await context.tracing.start({
    screenshots: true,
    snapshots: true,
    sources: false,
  });
  let sample;
  try {
    await page.addInitScript(observerScript);
    await page.addInitScript(dedicatedWorkerInstrumentation);
    const navigationStart = Date.now();
    await page.goto(loopbackUrl, { waitUntil: "domcontentloaded" });
    await waitForApp(page);
    const startupMs = Date.now() - navigationStart;
    await page.waitForTimeout(750);
    const metrics = await readPageMetrics(page);
    const eventStart = Date.now();
    await page.getByRole("button", { name: "Jobs", exact: true }).click();
    const interactionMs = Date.now() - eventStart;
    await page.waitForTimeout(100);
    const interactionMetrics = await page.evaluate(() => {
      const state = window.__m7bPerformance;
      return {
        inpMs: state?.inp?.length ? Math.max(...state.inp) : null,
      };
    });
    const worker = await measureDedicatedWorkerCost(page);
    const offlineStart = Date.now();
    const offlineNavigationError = await expectOfflineReload(
      page,
      context,
      browserName,
    );
    const offlineStartupMs = Date.now() - offlineStart;
    sample = {
      browser: browserName,
      width,
      height: width === 320 ? 693 : 742,
      run: runIndex,
      startupMs,
      lcpMs: numberOrNull(metrics.lcpMs),
      inpMs: numberOrNull(
        interactionMetrics.inpMs ?? metrics.inpMs ?? interactionMs,
      ),
      cls: numberOrNull(metrics.cls),
      interactionMs,
      domContentLoadedMs: numberOrNull(metrics.domContentLoadedMs),
      transferBytes: numberOrNull(metrics.transferBytes),
      jsCssTransferBytes: numberOrNull(metrics.jsCssTransferBytes),
      memoryMb: numberOrNull(metrics.memoryMb),
      worker,
      offlineStartupMs,
      actualCssViewport: metrics.viewport,
      supportedEntryTypes: metrics.supportedEntryTypes,
      errors: errors.filter(
        (error) => !/WebKit encountered an internal error/i.test(error),
      ),
      infrastructureErrors: errors.filter((error) =>
        /WebKit encountered an internal error/i.test(error),
      ),
      offlineNavigationError,
    };
  } finally {
    await context.tracing.stop({ path: tracePath }).catch(() => undefined);
    await context.close();
  }
  const sampleArtifact = artifact(
    path.join("samples", `${browserName}-${width}-${runIndex}.json`),
    sample ?? { browser: browserName, width, run: runIndex, errors },
  );
  return {
    sample,
    trace: { path: path.relative(root, tracePath), sha256: sha256(tracePath) },
    sampleArtifact,
  };
}

async function expectOfflineReload(page, context, browserName) {
  await expect
    .poll(
      async () =>
        page.evaluate(() => navigator.serviceWorker.controller !== null),
      {
        timeout: 15_000,
      },
    )
    .toBe(true);
  await context.setOffline(true);
  let navigationError = null;
  try {
    try {
      await page.reload({ waitUntil: "domcontentloaded" });
    } catch (error) {
      if (browserName !== "webkit") throw error;
      navigationError = String(error);
    }
    await waitForApp(page);
    const cacheProof = await page.evaluate(async () => {
      const names = await caches.keys();
      const shell = await Promise.all(
        names.map(async (name) =>
          (await caches.open(name)).match(location.href),
        ),
      );
      return {
        controller: navigator.serviceWorker.controller !== null,
        shellCached: shell.some(Boolean),
      };
    });
    if (!cacheProof.controller || !cacheProof.shellCached)
      throw new Error("offline cache proof failed");
  } finally {
    await context.setOffline(false);
  }
  return navigationError;
}

async function collectAdbDevice() {
  const listing = command("adb", ["devices", "-l"]);
  const line = listing.stdout
    .split(/\r?\n/)
    .find((entry) => /^\S+\s+device\s/.test(entry));
  const serial = line?.split(/\s+/)[0];
  if (!serial)
    return {
      gate: "physical-battery-thermal",
      status: "BLOCKED",
      reason:
        "no authorized USB Android device for physical battery/thermal evidence",
      command: "adb devices -l",
      result: "BLOCKED",
    };
  const battery = command("adb", ["-s", serial, "shell", "dumpsys", "battery"]);
  const thermal = command("adb", [
    "-s",
    serial,
    "shell",
    "dumpsys",
    "thermalservice",
  ]);
  const memory = command("adb", [
    "-s",
    serial,
    "shell",
    "dumpsys",
    "meminfo",
    "com.android.chrome",
  ]);
  const policy = command("adb", [
    "-s",
    serial,
    "shell",
    "dumpsys",
    "window",
    "policy",
  ]);
  const unlocked =
    /mDreamingLockscreen=false|isStatusBarKeyguard=false|mShowingLockscreen=false|^\s*showing=false\s*$/m.test(
      policy.stdout,
    ) &&
    !/inputRestricted=true|^\s*dreaming=true\s*$|screenState=SCREEN_STATE_OFF|interactiveState=INTERACTIVE_STATE_SLEEP/.test(
      policy.stdout,
    );
  return {
    gate: "physical-battery-thermal",
    status:
      battery.status === 0 && thermal.status === 0 && unlocked
        ? "OBSERVED"
        : "BLOCKED",
    serial,
    identity: line,
    unlocked,
    battery: battery.stdout,
    thermal: thermal.stdout,
    memory: memory.stdout,
    policy: policy.stdout,
    artifacts: [
      artifact("android-battery.txt", battery.stdout),
      artifact("android-thermal.txt", thermal.stdout),
      artifact("android-memory.txt", memory.stdout),
      artifact("android-window-policy.txt", policy.stdout),
    ],
  };
}

async function waitForAndroidPage(context) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const existing = context
      .pages()
      .find((candidate) => candidate.url().startsWith(loopbackUrl));
    const page = existing ?? context.pages()[0] ?? (await context.newPage());
    try {
      if (!page.url().startsWith(loopbackUrl))
        await page.goto(loopbackUrl, { waitUntil: "domcontentloaded" });
      await waitForApp(page);
      return page;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error(
    "Android Chrome did not expose the deterministic loopback page",
  );
}

async function clearAndroidOrigin(page, cdp) {
  await cdp
    .send("Storage.clearDataForOrigin", {
      origin: new URL(loopbackUrl).origin,
      storageTypes: "all",
    })
    .catch(() => undefined);
  await cdp.send("Network.clearBrowserCache").catch(() => undefined);
  await page.goto("about:blank", { waitUntil: "domcontentloaded" });
}

async function runAndroidChromeSample(
  browser,
  runIndex,
  deviceIdentity,
  tracePath,
) {
  const context = browser.contexts()[0];
  if (!context) throw new Error("Android Chrome CDP context was unavailable");
  const page = await waitForAndroidPage(context);
  const errors = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  await context.tracing.start({
    screenshots: true,
    snapshots: true,
    sources: false,
  });
  let sample;
  try {
    const cdp = await context.newCDPSession(page);
    await clearAndroidOrigin(page, cdp);
    await page.addInitScript(observerScript);
    await page.addInitScript(dedicatedWorkerInstrumentation);
    const navigationStart = Date.now();
    await page.goto(loopbackUrl, { waitUntil: "domcontentloaded" });
    await waitForApp(page);
    const startupMs = Date.now() - navigationStart;
    await page.waitForTimeout(750);
    const metrics = await readPageMetrics(page);
    const eventStart = Date.now();
    await page.getByRole("button", { name: "Jobs", exact: true }).click();
    const interactionMs = Date.now() - eventStart;
    await page.waitForTimeout(100);
    const interactionMetrics = await page.evaluate(() => {
      const state = window.__m7bPerformance;
      return {
        inpMs: state?.inp?.length ? Math.max(...state.inp) : null,
      };
    });
    const worker = await measureDedicatedWorkerCost(page);
    await expect
      .poll(
        async () =>
          page.evaluate(() => navigator.serviceWorker.controller !== null),
        { timeout: 15_000 },
      )
      .toBe(true);
    const offlineStart = Date.now();
    let offlineNavigationError = null;
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: true,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    });
    try {
      try {
        await page.reload({ waitUntil: "domcontentloaded" });
      } catch (error) {
        offlineNavigationError = String(error);
      }
      await waitForApp(page);
      const cacheProof = await page.evaluate(async () => {
        const names = await caches.keys();
        const matches = await Promise.all(
          names.map(async (name) =>
            (await caches.open(name)).match(location.href),
          ),
        );
        return {
          controller: navigator.serviceWorker.controller !== null,
          shellCached: matches.some(Boolean),
        };
      });
      if (!cacheProof.controller || !cacheProof.shellCached)
        throw new Error("Android Chrome offline cache proof failed");
    } finally {
      await cdp
        .send("Network.emulateNetworkConditions", {
          offline: false,
          latency: 0,
          downloadThroughput: -1,
          uploadThroughput: -1,
        })
        .catch(() => undefined);
      await cdp.detach().catch(() => undefined);
    }
    sample = {
      browser: "android-chrome",
      device: deviceIdentity,
      run: runIndex,
      startupMs,
      lcpMs: numberOrNull(metrics.lcpMs),
      inpMs: numberOrNull(
        interactionMetrics.inpMs ?? metrics.inpMs ?? interactionMs,
      ),
      cls: numberOrNull(metrics.cls),
      interactionMs,
      domContentLoadedMs: numberOrNull(metrics.domContentLoadedMs),
      transferBytes: numberOrNull(metrics.transferBytes),
      jsCssTransferBytes: numberOrNull(metrics.jsCssTransferBytes),
      memoryMb: numberOrNull(metrics.memoryMb),
      worker,
      offlineStartupMs: Date.now() - offlineStart,
      actualCssViewport: metrics.viewport,
      supportedEntryTypes: metrics.supportedEntryTypes,
      errors,
      offlineNavigationError,
    };
  } finally {
    await context.tracing.stop({ path: tracePath }).catch(() => undefined);
  }
  return sample;
}

async function collectAndroidChrome(device) {
  if (!device?.serial || !device.unlocked)
    return {
      gate: "android-chrome-performance",
      status: "BLOCKED",
      reason: "physical Android device is unavailable or locked",
      result: "BLOCKED",
    };
  const reverse = command("adb", [
    "-s",
    device.serial,
    "reverse",
    `tcp:${port}`,
    `tcp:${port}`,
  ]);
  const forward = command("adb", [
    "-s",
    device.serial,
    "forward",
    `tcp:${androidCdpPort}`,
    "localabstract:chrome_devtools_remote",
  ]);
  if (reverse.status !== 0 || forward.status !== 0)
    return {
      gate: "android-chrome-performance",
      status: "BLOCKED",
      reason: "adb reverse or Chrome DevTools forwarding failed",
      reverse: reverse.stderr,
      forward: forward.stderr,
      result: "BLOCKED",
    };
  const samples = [];
  const artifacts = [];
  const findings = [];
  const connect = async () => {
    const deadline = Date.now() + 30_000;
    let lastError = "";
    while (Date.now() < deadline) {
      try {
        return await chromium.connectOverCDP(
          `http://127.0.0.1:${androidCdpPort}`,
        );
      } catch (error) {
        lastError = String(error);
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
    throw new Error(`Android Chrome CDP connection timed out: ${lastError}`);
  };
  try {
    for (let runIndex = 1; runIndex <= runs; runIndex += 1) {
      command("adb", [
        "-s",
        device.serial,
        "shell",
        "am",
        "force-stop",
        "com.android.chrome",
      ]);
      command("adb", [
        "-s",
        device.serial,
        "shell",
        "am",
        "start",
        "-a",
        "android.intent.action.VIEW",
        "-d",
        loopbackUrl,
      ]);
      let browser;
      const tracePath = path.join(
        evidenceDir,
        "traces",
        `android-chrome-${runIndex}.zip`,
      );
      try {
        browser = await connect();
        const sample = await runAndroidChromeSample(
          browser,
          runIndex,
          device.identity,
          tracePath,
        );
        samples.push(sample);
        const samplePath = path.join(
          evidenceDir,
          "samples",
          `android-chrome-${runIndex}.json`,
        );
        fs.writeFileSync(samplePath, JSON.stringify(sample, null, 2) + "\n");
        artifacts.push(
          existingArtifact(tracePath),
          existingArtifact(samplePath),
        );
      } catch (error) {
        findings.push({
          gate: "android-chrome-sample",
          run: runIndex,
          reason: String(error),
          result: "BLOCKED",
        });
      } finally {
        browser?.disconnect();
      }
    }
  } finally {
    command("adb", ["-s", device.serial, "reverse", "--remove", `tcp:${port}`]);
    command("adb", [
      "-s",
      device.serial,
      "forward",
      "--remove",
      `tcp:${androidCdpPort}`,
    ]);
  }
  const actualViewport = samples.find(
    (sample) => sample.actualCssViewport,
  )?.actualCssViewport;
  return {
    gate: "android-chrome-performance",
    status:
      findings.length === 0 && samples.length === runs ? "OBSERVED" : "BLOCKED",
    device: device.identity,
    browser: "Chrome via adb forward/localabstract:chrome_devtools_remote",
    actualCssViewport: actualViewport ?? null,
    coldRuns: runs,
    samples,
    artifacts,
    findings,
    result:
      findings.length === 0 && samples.length === runs ? "OBSERVED" : "BLOCKED",
  };
}

function summarizeCell(samples) {
  const metric = (key) => ({
    median: median(samples.map((sample) => sample[key])),
    p95: percentile(
      samples.map((sample) => sample[key]),
      95,
    ),
    samples: samples.map((sample) => sample[key]),
  });
  const workerMetric = (speed) => ({
    median: median(
      samples.map(
        (sample) => sample.worker?.[speed]?.dedicatedWorkerResponseMs,
      ),
    ),
    p95: percentile(
      samples.map(
        (sample) => sample.worker?.[speed]?.dedicatedWorkerResponseMs,
      ),
      95,
    ),
    samples: samples.map(
      (sample) => sample.worker?.[speed]?.dedicatedWorkerResponseMs ?? null,
    ),
  });
  return {
    sampleCount: samples.length,
    startupMs: metric("startupMs"),
    lcpMs: metric("lcpMs"),
    inpMs: metric("inpMs"),
    cls: metric("cls"),
    interactionMs: metric("interactionMs"),
    memoryMb: metric("memoryMb"),
    offlineStartupMs: metric("offlineStartupMs"),
    worker1xMs: workerMetric("1x"),
    worker64xMs: workerMetric("64x"),
    jsCssTransferBytes: metric("jsCssTransferBytes"),
    errors: samples.flatMap((sample) => sample.errors),
    viewportSamples: samples.map((sample) => sample.actualCssViewport),
  };
}

function budgetFindings(cells) {
  const findings = [];
  for (const cell of cells) {
    const label = `${cell.browser} ${cell.width}x${cell.height}`;
    for (const [key, threshold, unit] of [
      ["lcpMs", 2_500, "ms"],
      ["inpMs", 200, "ms"],
      ["cls", 0.1, ""],
    ]) {
      const p95 = cell.summary[key].p95;
      if (p95 === null) {
        findings.push({
          gate: key,
          cell: label,
          reason: "metric unsupported or absent",
          result: "BLOCKED",
        });
      } else if (p95 > threshold) {
        findings.push({
          gate: key,
          cell: label,
          value: p95,
          threshold,
          unit,
          result: "FAILED",
        });
      }
    }
    if (cell.summary.sampleCount < 5)
      findings.push({
        gate: "cold-runs",
        cell: label,
        reason: "fewer than five samples",
        result: "BLOCKED",
      });
    for (const key of ["worker1xMs", "worker64xMs"])
      if (cell.summary[key].p95 === null)
        findings.push({
          gate: "dedicated-worker-attribution",
          cell: label,
          speed: key === "worker1xMs" ? "1x" : "64x",
          reason:
            "product Dedicated Worker request/response evidence is unavailable",
          result: "BLOCKED",
        });
    if (cell.summary.errors.length > 0)
      findings.push({
        gate: "page-errors",
        cell: label,
        errors: cell.summary.errors,
        result: "FAILED",
      });
    const offlineErrors = cell.samples
      .map((sample) => sample.offlineNavigationError)
      .filter(Boolean);
    if (offlineErrors.length > 0)
      findings.push({
        gate: "offline-navigation",
        cell: label,
        reason:
          "browser reported an offline navigation error; cached-shell proof was retained",
        errors: offlineErrors,
        result: "BLOCKED",
      });
  }
  return findings;
}

function baselineArtifactFindings(baseline) {
  const entries = [
    ...(Array.isArray(baseline.artifacts) ? baseline.artifacts : []),
    ...(Array.isArray(baseline.physicalDevice?.artifacts)
      ? baseline.physicalDevice.artifacts
      : []),
    ...(Array.isArray(baseline.androidBrowser?.artifacts)
      ? baseline.androidBrowser.artifacts
      : []),
  ];
  const unique = [
    ...new Map(
      entries
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => [entry.path, entry]),
    ).values(),
  ];
  if (unique.length === 0)
    return [
      {
        gate: "same-device-baseline-artifacts",
        reason: "baseline has no retained artifact manifest",
        result: "BLOCKED",
      },
    ];
  const findings = [];
  for (const entry of unique) {
    if (
      typeof entry.path !== "string" ||
      !/^[a-f0-9]{64}$/.test(entry.sha256 ?? "")
    ) {
      findings.push({
        gate: "same-device-baseline-artifacts",
        path: entry.path,
        reason: "baseline artifact entries must be {path,sha256}",
        result: "BLOCKED",
      });
      continue;
    }
    const filePath = path.resolve(root, entry.path);
    if (
      !filePath.startsWith(`${root}${path.sep}`) ||
      !fs.existsSync(filePath)
    ) {
      findings.push({
        gate: "same-device-baseline-artifacts",
        path: entry.path,
        reason: "baseline artifact is missing or outside the repository",
        result: "BLOCKED",
      });
      continue;
    }
    if (sha256(filePath) !== entry.sha256)
      findings.push({
        gate: "same-device-baseline-artifacts",
        path: entry.path,
        reason: "baseline artifact digest does not match retained bytes",
        result: "BLOCKED",
      });
  }
  return findings;
}

function baselineFindings(cells, baseline, currentContext) {
  if (!baseline) {
    return [
      {
        gate: "same-device-baseline",
        reason: "frozen accepted-build baseline artifact is unavailable",
        required: "--baseline=<accepted-build-summary.json>",
        result: "BLOCKED",
      },
    ];
  }
  const findings = [];
  findings.push(...baselineArtifactFindings(baseline));
  const baselineDeviceId = baseline.environment?.deviceId;
  const currentDeviceId = currentContext.environment?.deviceId;
  const baselineBrowserSet = baseline.environment?.browserSet;
  const currentBrowserSet = currentContext.environment?.browserSet;
  const baselineIdentity = {
    candidateSha: baseline.candidateSha,
    buildId: baseline.buildInfo?.version,
    deviceId: baselineDeviceId,
    settingsFingerprint: baseline.environment?.settingsFingerprint,
    browserSet: baselineBrowserSet,
  };
  if (baseline.candidateSha === currentContext.candidateSha)
    findings.push({
      gate: "same-device-baseline-identity",
      reason: "baseline candidate SHA is the current candidate (self-baseline)",
      baseline: baselineIdentity,
      result: "BLOCKED",
    });
  if (baseline.candidateSha !== frozenAcceptedCandidateSha)
    findings.push({
      gate: "same-device-baseline-identity",
      reason: "baseline candidate SHA is not the frozen accepted candidate",
      expectedCandidateSha: frozenAcceptedCandidateSha,
      baseline: baselineIdentity,
      result: "BLOCKED",
    });
  if (baseline.buildInfo?.version !== frozenAcceptedBuildId)
    findings.push({
      gate: "same-device-baseline-identity",
      reason: "baseline build ID is not the frozen accepted build",
      expectedBuildId: frozenAcceptedBuildId,
      baseline: baselineIdentity,
      result: "BLOCKED",
    });
  if (
    !currentDeviceId ||
    currentDeviceId === "unidentified-device" ||
    baselineDeviceId !== currentDeviceId
  )
    findings.push({
      gate: "same-device-baseline-identity",
      reason:
        "baseline and current measurements do not identify the same explicit device",
      currentDeviceId,
      baselineDeviceId,
      result: "BLOCKED",
    });
  if (
    !Array.isArray(baselineBrowserSet) ||
    !Array.isArray(currentBrowserSet) ||
    JSON.stringify(baselineBrowserSet.slice().sort()) !==
      JSON.stringify(currentBrowserSet.slice().sort())
  )
    findings.push({
      gate: "same-device-baseline-identity",
      reason: "baseline browser matrix differs from the current matrix",
      currentBrowserSet,
      baselineBrowserSet,
      result: "BLOCKED",
    });
  if (
    !baseline.environment?.settingsFingerprint ||
    baseline.environment.settingsFingerprint !==
      currentContext.environment?.settingsFingerprint
  )
    findings.push({
      gate: "same-device-baseline-identity",
      reason: "baseline settings fingerprint differs from current settings",
      currentSettingsFingerprint:
        currentContext.environment?.settingsFingerprint,
      baselineSettingsFingerprint: baseline.environment?.settingsFingerprint,
      result: "BLOCKED",
    });
  const identityBlocked = findings.some(
    (finding) => finding.gate === "same-device-baseline-identity",
  );
  if (identityBlocked) return findings;
  for (const cell of cells) {
    const matching = baseline.cells?.find(
      (candidate) =>
        candidate.browser === cell.browser &&
        candidate.width === cell.width &&
        candidate.identity?.deviceId === cell.identity?.deviceId &&
        candidate.identity?.settingsFingerprint ===
          cell.identity?.settingsFingerprint &&
        candidate.identity?.browser === cell.identity?.browser,
    );
    if (!matching) {
      findings.push({
        gate: "same-device-baseline",
        cell: `${cell.browser} ${cell.width}`,
        reason: "matching frozen-build cell is absent",
        result: "BLOCKED",
      });
      continue;
    }
    for (const [key, current, before] of [
      [
        "startupMs",
        cell.summary.startupMs.median,
        matching.summary?.startupMs?.median,
      ],
      [
        "worker1xMs",
        cell.summary.worker1xMs.median,
        matching.summary?.worker1xMs?.median,
      ],
      [
        "worker64xMs",
        cell.summary.worker64xMs.median,
        matching.summary?.worker64xMs?.median,
      ],
      [
        "memoryMb",
        cell.summary.memoryMb.median,
        matching.summary?.memoryMb?.median,
      ],
      [
        "offlineStartupMs",
        cell.summary.offlineStartupMs.median,
        matching.summary?.offlineStartupMs?.median,
      ],
    ]) {
      if (!Number.isFinite(current) || !Number.isFinite(before)) {
        findings.push({
          gate: `baseline-${key}`,
          cell: `${cell.browser} ${cell.width}`,
          reason: "current or baseline metric is unavailable",
          result: "BLOCKED",
        });
        continue;
      }
      const ratio = current / before;
      if (ratio > 1.2)
        findings.push({
          gate: `baseline-${key}`,
          cell: `${cell.browser} ${cell.width}`,
          ratio,
          threshold: 1.2,
          result: "FAILED",
        });
    }
  }
  return findings;
}

const summary = {
  schemaVersion: 1,
  kind: "m7b-mobile-performance",
  mode: captureFrozenBaseline ? "frozen-baseline" : "candidate",
  candidateSha: gitSha(),
  buildInfo: null,
  environment: {
    deviceId: performanceDeviceId,
    browserSet: browsers.slice().sort(),
    settings: measurementSettings,
    settingsFingerprint: measurementSettingsFingerprint,
  },
  generatedAt: new Date().toISOString(),
  loopback: {
    url: loopbackUrl,
    port,
    startup: `E2E_PORT=${port} ./scripts/run-e2e`,
    cleanup:
      "terminate preview process group and close every Playwright context/browser",
  },
  matrix: {
    browsers,
    widths,
    heightByWidth: { 320: 693, 393: 742 },
    coldRunsPerCell: runs,
    cleanInstall: "new browser context with empty storage per run",
  },
  thresholds: {
    lcpMsP95: 2_500,
    inpMsP95: 200,
    clsP95: 0.1,
    sameDeviceBaselineRatio: 1.2,
    workerSpeeds: ["1x", "64x"],
    physicalBatteryThermal: true,
  },
  cells: [],
  findings: [],
  physicalDevice: null,
  androidBrowser: null,
  artifacts: [],
};

let server;
try {
  server = spawn("./scripts/run-e2e", [], {
    cwd: root,
    detached: true,
    env: { ...process.env, E2E_PORT: String(port) },
    stdio: "ignore",
  });
  const deadline = Date.now() + 60_000;
  let ready = false;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(loopbackUrl);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      // Production preview is still building.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!ready) {
    summary.findings.push({
      gate: "loopback",
      reason: "preview did not become ready",
      result: "BLOCKED",
    });
  } else {
    try {
      const buildResponse = await fetch(
        new URL("build-info.json", loopbackUrl),
      );
      if (!buildResponse.ok) throw new Error(`HTTP ${buildResponse.status}`);
      summary.buildInfo = await buildResponse.json();
      if (typeof summary.buildInfo?.version !== "string")
        throw new Error("build-info.json has no version");
    } catch (error) {
      summary.findings.push({
        gate: "build-identity",
        reason: `deterministic loopback build-info.json unavailable: ${String(error)}`,
        result: "BLOCKED",
      });
    }
    for (const browserName of browsers) {
      const launcher = { chromium, webkit }[browserName];
      if (!launcher) {
        summary.findings.push({
          gate: "browser",
          browser: browserName,
          reason: "unknown browser",
          result: "BLOCKED",
        });
        continue;
      }
      let browser;
      try {
        browser = await launcher.launch({ headless: true });
        for (const width of widths) {
          const cellSamples = [];
          for (let runIndex = 1; runIndex <= runs; runIndex += 1) {
            try {
              const output = await runBrowserSample(
                browserName,
                width,
                runIndex,
                browser,
              );
              cellSamples.push(output.sample);
              summary.artifacts.push(output.trace, output.sampleArtifact);
            } catch (error) {
              summary.findings.push({
                gate: "sample",
                browser: browserName,
                width,
                run: runIndex,
                reason: String(error),
                result: "BLOCKED",
              });
            }
          }
          summary.cells.push({
            browser: browserName,
            width,
            height: width === 320 ? 693 : 742,
            identity: {
              candidateSha: summary.candidateSha,
              buildId: summary.buildInfo?.version ?? null,
              deviceId: performanceDeviceId,
              browser: browserName,
              width,
              settingsFingerprint: measurementSettingsFingerprint,
            },
            summary: summarizeCell(cellSamples),
            samples: cellSamples,
          });
        }
      } catch (error) {
        summary.findings.push({
          gate: "browser-launch",
          browser: browserName,
          reason: String(error),
          result: "BLOCKED",
        });
      } finally {
        await browser?.close().catch(() => undefined);
      }
    }
  }
  summary.physicalDevice = await collectAdbDevice();
  if (summary.physicalDevice.status !== "OBSERVED")
    summary.findings.push(summary.physicalDevice);
  if (ready) {
    summary.androidBrowser = await collectAndroidChrome(summary.physicalDevice);
    if (summary.androidBrowser.status === "OBSERVED") {
      const samples = summary.androidBrowser.samples.map((sample) => ({
        ...sample,
        width: sample.actualCssViewport?.width ?? null,
        height: sample.actualCssViewport?.height ?? null,
      }));
      const viewport = samples.find(
        (sample) => sample.actualCssViewport,
      )?.actualCssViewport;
      summary.cells.push({
        browser: "android-chrome",
        width: viewport?.width ?? 0,
        height: viewport?.height ?? 0,
        identity: {
          candidateSha: summary.candidateSha,
          buildId: summary.buildInfo?.version ?? null,
          deviceId: summary.physicalDevice?.serial ?? performanceDeviceId,
          browser: "android-chrome",
          width: viewport?.width ?? 0,
          settingsFingerprint: measurementSettingsFingerprint,
        },
        summary: summarizeCell(samples),
        samples,
      });
    } else {
      summary.findings.push({
        gate: "android-chrome-performance",
        ...summary.androidBrowser,
        result: "BLOCKED",
      });
    }
  } else {
    summary.androidBrowser = {
      gate: "android-chrome-performance",
      status: "BLOCKED",
      reason: "loopback preview was unavailable",
      result: "BLOCKED",
    };
    summary.findings.push(summary.androidBrowser);
  }
  summary.findings.push(...budgetFindings(summary.cells));
  let baseline = null;
  try {
    baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
  } catch {
    baseline = null;
  }
  if (!captureFrozenBaseline)
    summary.findings.push(
      ...baselineFindings(summary.cells, baseline, {
        candidateSha: summary.candidateSha,
        buildInfo: summary.buildInfo,
        environment: summary.environment,
      }),
    );
} finally {
  if (server?.pid) {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      // The preview group may already have exited.
    }
  }
}

summary.result =
  summary.findings.length === 0
    ? "PASS"
    : summary.findings.some((finding) => finding.result === "FAILED")
      ? "FAILED"
      : "BLOCKED";
fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + "\n");
console.log(
  JSON.stringify(
    {
      result: summary.result,
      candidateSha: summary.candidateSha,
      cells: summary.cells.map(
        (cell) => `${cell.browser}:${cell.width}/${cell.summary.sampleCount}`,
      ),
      physicalDevice: summary.physicalDevice?.status,
      findings: summary.findings,
      summary: path.relative(root, summaryPath),
    },
    null,
    2,
  ),
);

if (summary.result !== "PASS" && !allowBlocked) process.exitCode = 2;
