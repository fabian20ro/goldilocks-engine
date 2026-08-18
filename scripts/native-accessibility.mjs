#!/usr/bin/env node

/*
 * M7B native accessibility harness.
 *
 * This intentionally separates device plumbing from speech evidence. Native
 * screen-reader speech cannot be asserted from a browser AX tree, so the
 * harness captures device identity, settings, screenshots, logs, and the
 * exact manual checklist; it remains BLOCKED until the operator records the
 * VoiceOver/TalkBack transcript and actual CSS viewport in the artifact.
 */

import { execFileSync, spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const evidenceDir = path.resolve(
  root,
  process.env.M7B_NATIVE_EVIDENCE_DIR ?? ".cache/m7b/native",
);
const port = Number(process.env.M7B_NATIVE_PORT ?? "4175");
const loopbackUrl = `http://127.0.0.1:${port}/`;
const browserSettleMs = (() => {
  const value = Number(process.env.M7B_NATIVE_BROWSER_SETTLE_MS ?? "4000");
  return Number.isFinite(value) && value >= 0 && value <= 30_000 ? value : 4000;
})();
const allowBlocked =
  process.env.M7B_NATIVE_ALLOW_BLOCKED === "1" ||
  process.argv.includes("--allow-blocked");
const enableNativeSettings = process.env.M7B_NATIVE_ENABLE_SETTINGS === "1";
const modeArg = process.argv.find((value) => value.startsWith("--mode="));
const mode =
  modeArg?.slice("--mode=".length) ?? process.env.M7B_NATIVE_MODE ?? "capture";
const outputArg = process.argv.find((value) => value.startsWith("--output="));
const summaryPath = path.resolve(
  root,
  outputArg?.slice("--output=".length) ??
    path.join(
      evidenceDir,
      mode === "validate" ? "validation-summary.json" : "summary.json",
    ),
);

fs.mkdirSync(evidenceDir, { recursive: true });

function command(commandName, args = []) {
  try {
    const stdout = execFileSync(commandName, args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 8 * 1024 * 1024,
    });
    return { available: true, status: 0, stdout, stderr: "" };
  } catch (error) {
    return {
      available: error?.code !== "ENOENT",
      status: Number.isInteger(error?.status) ? error.status : 127,
      stdout: String(error?.stdout ?? ""),
      stderr: String(error?.stderr ?? error?.message ?? ""),
    };
  }
}

function binaryCommand(commandName, args = []) {
  try {
    return {
      available: true,
      status: 0,
      stdout: execFileSync(commandName, args, {
        cwd: root,
        encoding: "buffer",
        stdio: ["ignore", "pipe", "pipe"],
        maxBuffer: 16 * 1024 * 1024,
      }),
      stderr: "",
    };
  } catch (error) {
    return {
      available: error?.code !== "ENOENT",
      status: Number.isInteger(error?.status) ? error.status : 127,
      stdout: Buffer.from(error?.stdout ?? ""),
      stderr: String(error?.stderr ?? error?.message ?? ""),
    };
  }
}

function writeArtifact(relativePath, content) {
  const target = path.join(evidenceDir, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  return artifactRecord(target);
}

function artifactRecord(filePath) {
  return {
    path: path.relative(root, filePath),
    sha256: crypto
      .createHash("sha256")
      .update(fs.readFileSync(filePath))
      .digest("hex"),
  };
}

function readGitSha() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

function waitForNativeBrowser(deviceResult, result) {
  const seconds = String(browserSettleMs / 1000);
  const wait = command("sleep", [seconds]);
  deviceResult.commands.push({
    command: `sleep ${seconds}`,
    label: "wait for native browser shell readiness",
    status: wait.status,
    stderr: wait.stderr,
  });
  if (wait.status !== 0) {
    result.blockers.push({
      gate: "native-browser-readiness",
      reason: "native browser settle wait could not complete",
      command: `sleep ${seconds}`,
      stderr: wait.stderr,
    });
  }
}

function androidEmulatorBinary() {
  const roots = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    "/opt/homebrew/share/android-commandlinetools",
    "/usr/local/share/android-commandlinetools",
  ].filter(Boolean);
  const candidates = [
    ...roots.map((rootPath) => path.join(rootPath, "emulator", "emulator")),
    "emulator",
  ];
  return candidates.find((candidate) =>
    candidate === "emulator" ? true : fs.existsSync(candidate),
  );
}

function captureAndroidEmulatorInventory(result) {
  const binary = androidEmulatorBinary();
  const inventory = binary
    ? command(binary, ["-list-avds"])
    : {
        available: false,
        status: 127,
        stdout: "",
        stderr: "no Android emulator executable found",
      };
  result.androidEmulatorInventory = {
    binary: binary ?? null,
    command: binary
      ? `${shellQuote(binary)} -list-avds`
      : "emulator -list-avds",
    available: inventory.available && inventory.status === 0,
    status: inventory.status,
    avds: inventory.stdout
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter(Boolean),
    stderr: inventory.stderr,
  };
  result.commands.push({
    command: result.androidEmulatorInventory.command,
    label: "inventory installed Android emulators",
    status: inventory.status,
    stderr: inventory.stderr,
  });
}

function operatorSubmissionPath() {
  return path.join(evidenceDir, "operator-submission.json");
}

function operatorValidationCommand() {
  return `M7B_NATIVE_EVIDENCE_DIR=${shellQuote(evidenceDir)} npm run test:native-a11y:validate`;
}

function captureSetting(result, key, value) {
  result.settings[key] = value.trim() || "<unavailable>";
}

function isAndroidUnlocked(policyOutput) {
  return (
    /mDreamingLockscreen=false|isStatusBarKeyguard=false|mShowingLockscreen=false|^\s*showing=false\s*$/m.test(
      policyOutput,
    ) &&
    !/inputRestricted=true|^\s*dreaming=true\s*$|screenState=SCREEN_STATE_OFF|interactiveState=INTERACTIVE_STATE_SLEEP/.test(
      policyOutput,
    )
  );
}

function nativeChecklist(platform, device, browser) {
  const destinations = [
    "Build",
    "Jobs",
    "Career",
    "Upgrades",
    "Inspect",
    "Research",
    "Lab",
    "World",
  ];
  const rows = [];
  for (const width of [393, 320]) {
    const height = width === 320 ? 693 : 742;
    for (const name of destinations) {
      rows.push({
        id: `${platform}:${width}:${name}:100-normal`,
        platform,
        device,
        browser,
        width,
        height,
        textScale: "100%",
        reducedMotion: false,
        check: `screen-reader announces ${name} tab and active state`,
        expected: `${name}; selected/page state when active`,
        observed: "",
        speechEvidence: "",
        screenshot: "",
        status: "UNVERIFIED",
      });
      rows.push({
        id: `${platform}:${width}:${name}:200-boundary`,
        platform,
        device,
        browser,
        width,
        height,
        textScale: "200%",
        reducedMotion: true,
        check:
          "screen-reader announces horizontal reveal instruction and first actionable control",
        expected:
          width === 320
            ? "Swipe navigation strip horizontally to reveal every tab; first action has a name"
            : "First action has a name; no document overflow",
        observed: "",
        speechEvidence: "",
        screenshot: "",
        status: "UNVERIFIED",
      });
    }
  }
  return rows;
}

function operatorRows() {
  return [
    ...nativeChecklist(
      "iOS Simulator",
      "operator-supplied device",
      "Safari + VoiceOver",
    ),
    ...nativeChecklist(
      "USB Android",
      "operator-supplied device",
      "Chrome + TalkBack",
    ),
  ];
}

function operatorSubmissionTemplate(capture) {
  const rows = operatorRows().map((row) => ({
    ...row,
    actualCssViewport: null,
    observed: "",
    screenshot: "",
    speechEvidence: "",
    status: "UNVERIFIED",
  }));
  const devices = [
    {
      platform: "ios-simulator",
      id: "",
      device: "",
      os: "",
      browser: "Safari + VoiceOver",
      settingsBefore: {},
      settingsAfter: {},
      settingsRestored: false,
      settingsBeforeArtifact: "",
      settingsAfterArtifact: "",
      actualCssViewports: { 320: null, 393: null },
      textScales: [],
      reducedMotion: null,
    },
    {
      platform: "android-usb",
      id: "",
      device: "",
      os: "",
      browser: "Chrome + TalkBack",
      settingsBefore: {},
      settingsAfter: {},
      settingsRestored: false,
      settingsBeforeArtifact: "",
      settingsAfterArtifact: "",
      actualCssViewports: { 320: null, 393: null },
      textScales: [],
      reducedMotion: null,
    },
  ];
  for (const captured of capture.devices) {
    const target = devices.find(
      (device) => device.platform === captured.platform,
    );
    if (!target) continue;
    Object.assign(target, {
      id: captured.id,
      device: captured.device,
      os: captured.os,
      browser: captured.browser,
      settingsBefore: captured.settings,
      settingsBeforeArtifact: captured.settingsBeforeArtifact ?? "",
      settingsAfterArtifact: captured.settingsAfterArtifact ?? "",
    });
  }
  return {
    schemaVersion: 1,
    kind: "m7b-native-operator-submission",
    candidateSha: capture.candidateSha,
    buildId: capture.buildInfo?.version ?? "",
    submittedAt: "",
    devices,
    checklist: rows,
    speech: {
      voiceover: { path: "ios-voiceover-speech.txt", transcript: "" },
      talkback: { path: "android-talkback-speech.txt", transcript: "" },
    },
    artifactPaths: capture.artifacts.map((entry) => ({
      path: entry.path,
      sha256: entry.sha256,
    })),
  };
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function safeEvidencePath(relativePath) {
  if (typeof relativePath !== "string" || relativePath.length === 0)
    return null;
  const absolute = path.resolve(root, relativePath);
  const prefix = `${evidenceDir}${path.sep}`;
  return absolute.startsWith(prefix) ? absolute : null;
}

function validateOperatorEvidence() {
  const blockers = [];
  const captureSummaryPath = path.resolve(
    root,
    process.env.M7B_NATIVE_CAPTURE_SUMMARY ??
      path.join(evidenceDir, "summary.json"),
  );
  const submissionPath = path.resolve(
    root,
    process.env.M7B_NATIVE_SUBMISSION ??
      path.join(evidenceDir, "operator-submission.json"),
  );
  const capture = readJson(captureSummaryPath);
  const submission = readJson(submissionPath);
  if (!capture)
    blockers.push({
      gate: "capture-summary",
      reason: "capture summary is missing or malformed",
      path: path.relative(root, captureSummaryPath),
    });
  if (!submission)
    blockers.push({
      gate: "operator-submission",
      reason: "operator-submission.json is missing or malformed",
      path: path.relative(root, submissionPath),
    });
  if (blockers.length > 0) return { blockers, capture, submission };

  for (const entry of Array.isArray(capture.artifacts)
    ? capture.artifacts
    : []) {
    if (
      !entry ||
      typeof entry !== "object" ||
      typeof entry.path !== "string" ||
      !/^[a-f0-9]{64}$/.test(entry.sha256 ?? "")
    ) {
      blockers.push({
        gate: "capture-artifact-manifest",
        reason: "capture artifact entries must be {path,sha256}",
        entry,
      });
      continue;
    }
    const filePath = safeEvidencePath(entry.path);
    if (!filePath || !fs.existsSync(filePath)) {
      blockers.push({
        gate: "capture-artifact-manifest",
        path: entry.path,
        reason: "capture artifact is missing or outside retained evidence",
      });
      continue;
    }
    if (artifactRecord(filePath).sha256 !== entry.sha256)
      blockers.push({
        gate: "capture-artifact-manifest",
        path: entry.path,
        reason: "capture artifact digest does not match retained bytes",
      });
  }

  if (
    submission.schemaVersion !== 1 ||
    submission.kind !== "m7b-native-operator-submission"
  )
    blockers.push({
      gate: "submission-schema",
      reason: "unsupported operator submission schema",
    });
  if (
    submission.candidateSha !== capture.candidateSha ||
    submission.candidateSha !== readGitSha()
  )
    blockers.push({
      gate: "candidate-identity",
      reason:
        "submission candidate SHA does not match the retained capture and current candidate",
      expected: readGitSha(),
      actual: submission.candidateSha,
    });
  if (
    !capture.buildInfo?.version ||
    submission.buildId !== capture.buildInfo.version
  )
    blockers.push({
      gate: "build-identity",
      reason: "submission build ID does not match the retained capture",
      expected: capture.buildInfo?.version ?? "missing",
      actual: submission.buildId,
    });
  if (!submission.submittedAt)
    blockers.push({
      gate: "submission-time",
      reason: "operator submission timestamp is missing",
    });

  const expectedDevices = ["ios-simulator", "android-usb"];
  const devices = Array.isArray(submission.devices) ? submission.devices : [];
  const requiredDeviceArtifacts = [];
  for (const platform of expectedDevices) {
    const device = devices.find((entry) => entry?.platform === platform);
    if (!device) {
      blockers.push({
        gate: "device-identity",
        platform,
        reason: "device record is missing",
      });
      continue;
    }
    const capturedDevice = capture.devices?.find(
      (entry) => entry?.platform === platform,
    );
    if (!capturedDevice) {
      blockers.push({
        gate: "device-identity",
        platform,
        reason: "submission device is not present in retained native capture",
      });
    } else {
      if (device.id !== capturedDevice.id)
        blockers.push({
          gate: "device-identity",
          platform,
          reason: "submission device ID differs from retained capture",
          expected: capturedDevice.id,
          actual: device.id,
        });
      if (device.device !== capturedDevice.device)
        blockers.push({
          gate: "device-identity",
          platform,
          reason: "submission device description differs from retained capture",
        });
      if (platform === "android-usb" && capturedDevice.unlocked !== true)
        blockers.push({
          gate: "android-unlocked",
          platform,
          reason: "retained capture did not prove the USB Android was unlocked",
        });
    }
    for (const key of ["id", "device", "os", "browser"]) {
      if (typeof device[key] !== "string" || device[key].trim() === "")
        blockers.push({
          gate: "device-identity",
          platform,
          reason: `${key} is missing`,
        });
    }
    if (
      !device.settingsBefore ||
      Object.keys(device.settingsBefore).length === 0
    )
      blockers.push({
        gate: "settings",
        platform,
        reason: "before-settings snapshot is missing",
      });
    if (!device.settingsAfter || Object.keys(device.settingsAfter).length === 0)
      blockers.push({
        gate: "settings",
        platform,
        reason: "after-settings snapshot is missing",
      });
    if (device.settingsRestored !== true)
      blockers.push({
        gate: "settings",
        platform,
        reason: "settings restore was not attested",
      });
    for (const key of ["settingsBeforeArtifact", "settingsAfterArtifact"]) {
      const artifactPath = safeEvidencePath(device[key]);
      if (!artifactPath || !fs.existsSync(artifactPath))
        blockers.push({
          gate: "settings",
          platform,
          reason: `${key} must reference retained settings evidence`,
        });
      else requiredDeviceArtifacts.push(device[key]);
    }
    if (
      !Array.isArray(device.textScales) ||
      !device.textScales.includes("100%") ||
      !device.textScales.includes("200%")
    )
      blockers.push({
        gate: "settings",
        platform,
        reason: "100% and 200% text runs are not recorded",
      });
    if (device.reducedMotion !== true)
      blockers.push({
        gate: "settings",
        platform,
        reason: "reduced-motion run is not recorded",
      });
    for (const width of [320, 393]) {
      const expectedHeight = width === 320 ? 693 : 742;
      const viewport = device.actualCssViewports?.[String(width)];
      if (
        !viewport ||
        viewport.width !== width ||
        viewport.height !== expectedHeight
      )
        blockers.push({
          gate: "actual-css-viewport",
          platform,
          width,
          expected: { width, height: expectedHeight },
          actual: viewport,
          reason:
            "actual CSS viewport must match the exact requested portrait dimensions",
        });
    }
  }

  const expectedRows = operatorRows();
  const checklistEvidencePath = submissionPath;
  let checklistEvidence = null;
  try {
    checklistEvidence = JSON.parse(
      fs.readFileSync(checklistEvidencePath, "utf8"),
    ).checklist;
  } catch {
    blockers.push({
      gate: "checklist",
      reason: "retained checklist evidence is not valid JSON",
    });
  }
  const rows = Array.isArray(checklistEvidence) ? checklistEvidence : [];
  const byId = new Map(rows.map((row) => [row?.id, row]));
  if (rows.length !== expectedRows.length || byId.size !== expectedRows.length)
    blockers.push({
      gate: "checklist",
      reason:
        "checklist row count or IDs do not match the complete native matrix",
    });
  for (const expected of expectedRows) {
    const row = byId.get(expected.id);
    if (!row) {
      blockers.push({
        gate: "checklist",
        row: expected.id,
        reason: "required row is missing",
      });
      continue;
    }
    if (row.status !== "PASS")
      blockers.push({
        gate: "checklist",
        row: expected.id,
        reason: "row is not marked PASS",
      });
    for (const key of ["observed", "speechEvidence", "screenshot"]) {
      if (typeof row[key] !== "string" || row[key].trim() === "")
        blockers.push({
          gate: "checklist",
          row: expected.id,
          reason: `${key} is missing`,
        });
    }
    const screenshotPath = safeEvidencePath(row.screenshot);
    if (!screenshotPath || !fs.existsSync(screenshotPath))
      blockers.push({
        gate: "checklist",
        row: expected.id,
        reason: "row screenshot must reference a retained evidence file",
      });
    if (row.width !== expected.width || row.height !== expected.height)
      blockers.push({
        gate: "checklist",
        row: expected.id,
        expected: { width: expected.width, height: expected.height },
        actual: { width: row.width, height: row.height },
        reason:
          "row declared viewport must match the exact requested portrait dimensions",
      });
    if (
      row.actualCssViewport?.width !== expected.width ||
      row.actualCssViewport?.height !== expected.height
    )
      blockers.push({
        gate: "checklist",
        row: expected.id,
        expected: {
          width: expected.width,
          height: expected.height,
        },
        actual: row.actualCssViewport,
        reason:
          "row actual CSS viewport must match the exact requested portrait dimensions",
      });
  }

  const speech = submission.speech ?? {};
  const artifactRecords = [];
  for (const [key, platform] of [
    ["voiceover", "ios-simulator"],
    ["talkback", "android-usb"],
  ]) {
    const entry = speech[key];
    const filePath = safeEvidencePath(entry?.path);
    const content =
      filePath && fs.existsSync(filePath)
        ? fs.readFileSync(filePath, "utf8")
        : "";
    if (
      !filePath ||
      content.trim() === "" ||
      /Manual evidence required/i.test(content) ||
      typeof entry?.transcript !== "string" ||
      entry.transcript.trim() === ""
    )
      blockers.push({
        gate: "speech",
        platform,
        reason: "retained speech transcript is missing or placeholder",
      });
    if (filePath && fs.existsSync(filePath))
      artifactRecords.push(artifactRecord(filePath));
  }
  const artifactPaths = Array.isArray(submission.artifactPaths)
    ? submission.artifactPaths
    : [];
  const submittedArtifactPaths = new Set();
  for (const entry of artifactPaths) {
    if (
      !entry ||
      typeof entry !== "object" ||
      typeof entry.path !== "string" ||
      !/^[a-f0-9]{64}$/.test(entry.sha256 ?? "")
    ) {
      blockers.push({
        gate: "artifact",
        path: entry?.path,
        reason: "every submitted artifact entry must be {path,sha256}",
      });
      continue;
    }
    const relativePath = entry.path;
    submittedArtifactPaths.add(relativePath);
    const filePath = safeEvidencePath(relativePath);
    if (!filePath || !fs.existsSync(filePath)) {
      blockers.push({
        gate: "artifact",
        path: relativePath,
        reason:
          "referenced evidence artifact is missing or escapes evidence directory",
      });
      continue;
    }
    const record = artifactRecord(filePath);
    if (entry.sha256 !== record.sha256)
      blockers.push({
        gate: "artifact",
        path: relativePath,
        reason: "submitted artifact digest does not match retained bytes",
      });
    artifactRecords.push(record);
  }
  for (const row of rows) {
    if (
      typeof row?.screenshot === "string" &&
      row.screenshot.trim() !== "" &&
      safeEvidencePath(row.screenshot) &&
      !submittedArtifactPaths.has(row.screenshot)
    )
      blockers.push({
        gate: "checklist",
        row: row.id,
        reason: "row screenshot must be listed with its checksum",
      });
  }
  for (const artifactPath of requiredDeviceArtifacts)
    if (!submittedArtifactPaths.has(artifactPath))
      blockers.push({
        gate: "settings",
        path: artifactPath,
        reason: "settings evidence must be listed with its checksum",
      });
  for (const entry of Array.isArray(capture.artifacts)
    ? capture.artifacts
    : []) {
    if (
      path.basename(entry.path) !== "operator-submission.json" &&
      !submittedArtifactPaths.has(entry.path)
    )
      blockers.push({
        gate: "artifact",
        path: entry.path,
        reason: "operator submission omitted a retained capture artifact",
      });
  }
  for (const entry of Object.values(speech)) {
    const speechPath = safeEvidencePath(entry?.path);
    if (speechPath && !submittedArtifactPaths.has(entry.path))
      blockers.push({
        gate: "speech",
        path: entry.path,
        reason: "speech evidence must be listed with its checksum",
      });
  }
  return {
    blockers,
    capture,
    submission,
    artifacts: artifactRecords,
  };
}

if (mode !== "capture" && mode !== "validate") {
  console.error(`M7B_NATIVE_MODE must be capture or validate, got ${mode}`);
  process.exit(64);
}

if (mode === "validate") {
  if (fs.existsSync(summaryPath)) {
    console.error(
      `Refusing to overwrite retained native validation: ${summaryPath}`,
    );
    process.exit(2);
  }
  const validation = validateOperatorEvidence();
  const sourceSubmissionPath = path.resolve(
    root,
    process.env.M7B_NATIVE_SUBMISSION ??
      path.join(evidenceDir, "operator-submission.json"),
  );
  const output = {
    schemaVersion: 1,
    kind: "m7b-native-operator-validation",
    candidateSha: validation.submission?.candidateSha ?? readGitSha(),
    buildId: validation.submission?.buildId ?? null,
    result: validation.blockers.length === 0 ? "PASS" : "BLOCKED",
    sourceSubmission: path.relative(root, sourceSubmissionPath),
    blockers: validation.blockers,
    artifacts: validation.artifacts ?? [],
    validatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(summaryPath, JSON.stringify(output, null, 2) + "\n");
  console.log(JSON.stringify(output, null, 2));
  if (output.result === "BLOCKED" && !allowBlocked) process.exit(2);
  process.exit(0);
}

const existingCaptureEntries = fs.readdirSync(evidenceDir);
if (existingCaptureEntries.length > 0) {
  console.error(
    `Refusing to overwrite existing native evidence directory: ${evidenceDir}. Use a new capture directory or --mode=validate.`,
  );
  process.exit(2);
}

function captureIos(result) {
  const listing = command("xcrun", [
    "simctl",
    "list",
    "devices",
    "available",
    "--json",
  ]);
  result.commands.push({
    command: "xcrun simctl list devices available --json",
    status: listing.status,
    stderr: listing.stderr,
  });
  if (!listing.available || listing.status !== 0) {
    result.blockers.push({
      gate: "ios-simulator",
      reason: "xcrun simctl is unavailable",
      command: "xcrun simctl list devices available --json",
      stderr: listing.stderr,
    });
    return null;
  }

  let devices;
  try {
    devices = JSON.parse(listing.stdout).devices ?? {};
  } catch (error) {
    result.blockers.push({
      gate: "ios-simulator",
      reason: "xcrun simctl returned malformed device JSON",
      command: "xcrun simctl list devices available --json",
      stderr: String(error),
    });
    return null;
  }
  const available = Object.entries(devices).flatMap(([runtime, entries]) =>
    Array.isArray(entries)
      ? entries
          .filter((entry) => entry.isAvailable !== false)
          .map((entry) => ({ ...entry, runtime }))
      : [],
  );
  const device =
    available.find((entry) => entry.state === "Booted") ?? available[0];
  if (!device?.udid) {
    result.blockers.push({
      gate: "ios-simulator",
      reason: "no available iOS Simulator device",
      command: "xcrun simctl list devices available --json",
      stderr: listing.stderr,
    });
    return null;
  }

  const id = device.udid;
  const deviceResult = {
    id,
    platform: "ios-simulator",
    device: `${device.name ?? "iOS Simulator"} (${id})`,
    os: device.runtime ?? "unknown",
    browser: "Safari",
    bootedByHarness: false,
    actualCssViewport: null,
    settings: {},
    artifacts: [],
    commands: [],
  };
  const run = (args, label) => {
    const output = command("xcrun", ["simctl", ...args]);
    deviceResult.commands.push({
      command: `xcrun simctl ${args.map(shellQuote).join(" ")}`,
      label,
      status: output.status,
      stderr: output.stderr,
    });
    return output;
  };

  if (device.state !== "Booted") {
    const boot = run(["boot", id], "boot simulator");
    if (boot.status !== 0 && !/already booted/i.test(boot.stderr)) {
      result.blockers.push({
        gate: "ios-simulator",
        reason: "simulator boot failed",
        command: `xcrun simctl boot ${id}`,
        stderr: boot.stderr,
      });
      return deviceResult;
    }
    run(["bootstatus", id, "-b"], "wait for simulator boot");
    deviceResult.bootedByHarness = boot.status === 0;
  }

  const settingsBefore = run(
    ["spawn", id, "defaults", "read", "com.apple.Accessibility"],
    "capture accessibility settings",
  );
  const settingsBeforeArtifact = writeArtifact(
    "ios-settings-before.txt",
    settingsBefore.stdout,
  );
  deviceResult.settingsBeforeArtifact = settingsBeforeArtifact.path;
  deviceResult.artifacts.push(settingsBeforeArtifact);
  for (const key of ["VoiceOverTouchEnabled", "ReduceMotionEnabled"]) {
    const setting = run(
      ["spawn", id, "defaults", "read", "com.apple.Accessibility", key],
      `capture ${key}`,
    );
    captureSetting(deviceResult, key, setting.stdout);
  }
  if (enableNativeSettings) {
    const voiceOverEnable = run(
      [
        "spawn",
        id,
        "defaults",
        "write",
        "com.apple.Accessibility",
        "VoiceOverTouchEnabled",
        "-bool",
        "true",
      ],
      "enable VoiceOver for operator session",
    );
    if (voiceOverEnable.status !== 0)
      result.blockers.push({
        gate: "voiceover-setup",
        reason: "VoiceOver setting could not be enabled",
        stderr: voiceOverEnable.stderr,
      });
    const reduceMotionEnable = run(
      [
        "spawn",
        id,
        "defaults",
        "write",
        "com.apple.Accessibility",
        "ReduceMotionEnabled",
        "-bool",
        "true",
      ],
      "enable reduced motion for operator session",
    );
    if (reduceMotionEnable.status !== 0)
      result.blockers.push({
        gate: "ios-reduced-motion-setup",
        reason: "iOS reduced-motion setting could not be enabled",
        stderr: reduceMotionEnable.stderr,
      });
  }
  const open = run(
    ["openurl", id, loopbackUrl],
    "open deterministic loopback in Safari",
  );
  if (open.status !== 0) {
    result.blockers.push({
      gate: "ios-safari",
      reason: "Safari could not open the deterministic loopback URL",
      command: `xcrun simctl openurl ${id} ${loopbackUrl}`,
      stderr: open.stderr,
    });
  } else {
    waitForNativeBrowser(deviceResult, result);
  }
  const screenshotPath = path.join(evidenceDir, "ios-safari.png");
  const screenshot = run(
    ["io", id, "screenshot", screenshotPath],
    "capture Safari screenshot",
  );
  if (screenshot.status === 0)
    deviceResult.artifacts.push(artifactRecord(screenshotPath));
  const accessibilityLog = run(
    ["spawn", id, "log", "show", "--last", "2m", "--style", "compact"],
    "capture simulator accessibility log",
  );
  deviceResult.artifacts.push(
    writeArtifact("ios-accessibility.log", accessibilityLog.stdout),
  );
  deviceResult.artifacts.push(
    writeArtifact(
      "ios-voiceover-speech.txt",
      "Manual evidence required. With VoiceOver enabled, record the exact spoken transcript for every checklist row.\n",
    ),
  );
  const settingsAfter = run(
    ["spawn", id, "defaults", "read", "com.apple.Accessibility"],
    "capture accessibility settings after operator setup",
  );
  const settingsAfterArtifact = writeArtifact(
    "ios-settings-after.txt",
    settingsAfter.stdout,
  );
  deviceResult.settingsAfterArtifact = settingsAfterArtifact.path;
  deviceResult.artifacts.push(settingsAfterArtifact);
  deviceResult.settingsAfter = settingsAfter.stdout;
  result.devices.push(deviceResult);
  result.checklist.push(
    ...nativeChecklist(
      "iOS Simulator",
      deviceResult.device,
      "Safari + VoiceOver",
    ),
  );
  result.blockers.push({
    gate: "voiceover-speech",
    reason:
      "native VoiceOver speech transcript and actual CSS viewport require an operator session",
    command: `Complete ${operatorSubmissionPath()} after the Safari session (checklist.json is generated supporting output); then run ${operatorValidationCommand()}`,
    stderr: "AX-tree/browser substitutes are intentionally not accepted",
  });
  return deviceResult;
}

function captureAndroid(result) {
  captureAndroidEmulatorInventory(result);
  const listing = command("adb", ["devices", "-l"]);
  result.commands.push({
    command: "adb devices -l",
    status: listing.status,
    stderr: listing.stderr,
  });
  if (!listing.available || listing.status !== 0) {
    result.blockers.push({
      gate: "android-usb",
      reason: "adb is unavailable",
      command: "adb devices -l",
      stderr: listing.stderr,
    });
    return null;
  }
  const deviceLine = listing.stdout
    .split(/\r?\n/)
    .find((line) => /^\S+\s+device\s/.test(line));
  const id = deviceLine?.split(/\s+/)[0];
  if (!id) {
    result.blockers.push({
      gate: "android-usb",
      reason: "no unlocked/authorized USB Android device is listed as device",
      command: "adb devices -l",
      stderr: listing.stdout,
    });
    return null;
  }

  const run = (args, label) => {
    const output = command("adb", ["-s", id, ...args]);
    result.commands.push({
      command: `adb -s ${shellQuote(id)} ${args.map(shellQuote).join(" ")}`,
      label,
      status: output.status,
      stderr: output.stderr,
    });
    return output;
  };
  const policy = run(
    ["shell", "dumpsys", "window", "policy"],
    "check Android unlock state",
  );
  if (!isAndroidUnlocked(policy.stdout)) {
    result.blockers.push({
      gate: "android-unlocked",
      reason: "Android device is not proven unlocked by dumpsys window policy",
      command: `adb -s ${id} shell dumpsys window policy`,
      stderr: policy.stdout,
    });
  }
  const deviceResult = {
    id,
    platform: "android-usb",
    device: deviceLine,
    os: run(
      ["shell", "getprop", "ro.build.version.release"],
      "capture Android version",
    ).stdout.trim(),
    browser: "Chrome (operator-selected stable build)",
    unlocked: isAndroidUnlocked(policy.stdout),
    actualCssViewport: null,
    settings: {},
    artifacts: [],
    commands: [],
  };
  for (const [namespace, key] of [
    ["secure", "accessibility_enabled"],
    ["secure", "enabled_accessibility_services"],
    ["global", "transition_animation_scale"],
    ["global", "window_animation_scale"],
    ["global", "animator_duration_scale"],
  ]) {
    const setting = run(
      ["shell", "settings", "get", namespace, key],
      `capture ${namespace}.${key}`,
    );
    captureSetting(deviceResult, `${namespace}.${key}`, setting.stdout);
  }
  const settingsBefore = Object.entries(deviceResult.settings)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const settingsBeforeArtifact = writeArtifact(
    "android-settings-before.txt",
    settingsBefore,
  );
  deviceResult.settingsBeforeArtifact = settingsBeforeArtifact.path;
  deviceResult.artifacts.push(settingsBeforeArtifact);
  if (!deviceResult.unlocked) {
    deviceResult.commands.push({
      command: "skipped native browser interaction",
      label: "skip locked Android browser capture",
      status: 0,
      stderr:
        "device lock state was not proven; no Chrome launch, settings mutation, reverse tunnel, screenshot, or hierarchy capture attempted",
    });
    deviceResult.artifacts.push(
      writeArtifact(
        "android-talkback-speech.txt",
        "Manual evidence required after an operator unlocks the device. With TalkBack enabled, record the exact spoken transcript for every checklist row.\n",
      ),
    );
    const settingsAfterArtifact = writeArtifact(
      "android-settings-after.txt",
      Object.entries(deviceResult.settings)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n"),
    );
    deviceResult.settingsAfterArtifact = settingsAfterArtifact.path;
    deviceResult.artifacts.push(settingsAfterArtifact);
    result.devices.push(deviceResult);
    result.checklist.push(
      ...nativeChecklist(
        "USB Android",
        deviceResult.device,
        "Chrome + TalkBack",
      ),
    );
    result.blockers.push({
      gate: "talkback-speech",
      reason:
        "native TalkBack speech transcript and actual CSS viewport require an operator session",
      command: `Complete ${operatorSubmissionPath()} after the Chrome session (checklist.json is generated supporting output); then run ${operatorValidationCommand()}`,
      stderr:
        "Chrome interaction was skipped because the USB Android device is locked; UIAutomator output is not available",
    });
    return deviceResult;
  }
  if (enableNativeSettings) {
    const packages = run(
      ["shell", "pm", "list", "packages"],
      "discover Android TalkBack package",
    ).stdout;
    const talkBackPackage = packages
      .split(/\r?\n/)
      .map((line) => line.replace(/^package:/, "").trim())
      .find((name) => /talkback|marvin/i.test(name));
    if (!talkBackPackage) {
      result.blockers.push({
        gate: "talkback-setup",
        reason: "no installed TalkBack package was discoverable",
        command: `adb -s ${id} shell pm list packages`,
        stderr: packages,
      });
    } else {
      const accessibilityEnable = run(
        ["shell", "settings", "put", "secure", "accessibility_enabled", "1"],
        "enable Android accessibility",
      );
      if (accessibilityEnable.status !== 0)
        result.blockers.push({
          gate: "android-accessibility-setup",
          reason: "Android accessibility setting could not be enabled",
          stderr: accessibilityEnable.stderr,
        });
      const talkBackEnable = run(
        [
          "shell",
          "settings",
          "put",
          "secure",
          "enabled_accessibility_services",
          `${talkBackPackage}/com.google.android.marvin.talkback.TalkBackService`,
        ],
        "enable TalkBack for operator session",
      );
      if (talkBackEnable.status !== 0)
        result.blockers.push({
          gate: "talkback-setup",
          reason: "TalkBack setting could not be enabled",
          stderr: talkBackEnable.stderr,
        });
      for (const key of [
        "transition_animation_scale",
        "window_animation_scale",
        "animator_duration_scale",
      ]) {
        const reducedMotionEnable = run(
          ["shell", "settings", "put", "global", key, "0"],
          `enable reduced motion ${key}`,
        );
        if (reducedMotionEnable.status !== 0)
          result.blockers.push({
            gate: "android-reduced-motion-setup",
            key,
            reason: "Android reduced-motion setting could not be enabled",
            stderr: reducedMotionEnable.stderr,
          });
      }
    }
  }
  const reverse = run(
    ["reverse", `tcp:${port}`, `tcp:${port}`],
    "create adb reverse loopback",
  );
  if (reverse.status !== 0) {
    result.blockers.push({
      gate: "android-loopback",
      reason: "adb reverse could not expose the deterministic loopback URL",
      command: `adb -s ${id} reverse tcp:${port} tcp:${port}`,
      stderr: reverse.stderr,
    });
  } else {
    deviceResult.reverseCreated = true;
  }
  const open = run(
    [
      "shell",
      "am",
      "start",
      "-a",
      "android.intent.action.VIEW",
      "-d",
      loopbackUrl,
    ],
    "open deterministic loopback in Chrome",
  );
  if (open.status !== 0) {
    result.blockers.push({
      gate: "android-chrome",
      reason: "Chrome could not open the deterministic loopback URL",
      command: `adb -s ${id} shell am start -a android.intent.action.VIEW -d ${loopbackUrl}`,
      stderr: open.stderr,
    });
  } else {
    waitForNativeBrowser(deviceResult, result);
  }
  const screenshotPath = path.join(evidenceDir, "android-chrome.png");
  const screenshot = binaryCommand("adb", [
    "-s",
    id,
    "exec-out",
    "screencap",
    "-p",
  ]);
  if (screenshot.status === 0) {
    fs.writeFileSync(screenshotPath, screenshot.stdout);
    deviceResult.artifacts.push(artifactRecord(screenshotPath));
  }
  const hierarchy = run(
    ["shell", "uiautomator", "dump", "/sdcard/m7b-window.xml"],
    "capture Android accessibility hierarchy",
  );
  if (hierarchy.status === 0) {
    const xml = run(
      ["exec-out", "cat", "/sdcard/m7b-window.xml"],
      "read Android accessibility hierarchy",
    );
    deviceResult.artifacts.push(
      writeArtifact("android-window.xml", xml.stdout),
    );
  }
  const logcat = run(["logcat", "-d", "-t", "500"], "capture Android logcat");
  deviceResult.artifacts.push(
    writeArtifact("android-logcat.txt", logcat.stdout),
  );
  deviceResult.artifacts.push(
    writeArtifact(
      "android-talkback-speech.txt",
      "Manual evidence required. With TalkBack enabled, record the exact spoken transcript for every checklist row.\n",
    ),
  );
  const settingsAfter = Object.entries(deviceResult.settings)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const settingsAfterArtifact = writeArtifact(
    "android-settings-after.txt",
    settingsAfter,
  );
  deviceResult.settingsAfterArtifact = settingsAfterArtifact.path;
  deviceResult.artifacts.push(settingsAfterArtifact);
  result.devices.push(deviceResult);
  result.checklist.push(
    ...nativeChecklist("USB Android", deviceResult.device, "Chrome + TalkBack"),
  );
  result.blockers.push({
    gate: "talkback-speech",
    reason:
      "native TalkBack speech transcript and actual CSS viewport require an operator session",
    command: `Complete ${operatorSubmissionPath()} after the Chrome session (checklist.json is generated supporting output); then run ${operatorValidationCommand()}`,
    stderr:
      "UIAutomator output is retained as supporting evidence, not speech evidence",
  });
  return deviceResult;
}

const result = {
  schemaVersion: 1,
  kind: "m7b-native-accessibility",
  candidateSha: readGitSha(),
  generatedAt: new Date().toISOString(),
  loopback: {
    url: loopbackUrl,
    port,
    browserSettleMs,
    startup: "./scripts/run-e2e",
    cleanup:
      "terminate process group; adb reverse --remove; restore captured settings",
  },
  thresholds: {
    targetWidths: [320, 393],
    targetHeights: [693, 742],
    targetSizeCssPx: 44,
    textScale: "200% boundary run",
    reducedMotion: true,
  },
  commands: [],
  androidEmulatorInventory: null,
  devices: [],
  checklist: [],
  buildInfo: null,
  blockers: [],
  artifacts: [],
};

let server;
let androidId = null;
let androidReverseCreated = false;
try {
  // The loopback server is started even when native infrastructure is absent;
  // the recorded startup command and error make the blocker reproducible.
  server = spawn("./scripts/run-e2e", [], {
    cwd: root,
    detached: true,
    env: { ...process.env, E2E_PORT: String(port) },
    stdio: "ignore",
  });
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(loopbackUrl);
      if (response.ok) break;
    } catch {
      // Preview is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (Date.now() >= deadline) {
    result.blockers.push({
      gate: "loopback",
      reason: "deterministic loopback preview did not become ready",
      command: `E2E_PORT=${port} ./scripts/run-e2e`,
      stderr: "timeout after 120 seconds",
    });
  } else {
    try {
      const buildResponse = await fetch(
        new URL("build-info.json", loopbackUrl),
      );
      result.buildInfo = await buildResponse.json();
      result.commands.push({
        command: `${loopbackUrl}build-info.json`,
        label: "capture build identity",
        status: buildResponse.ok ? 0 : 1,
        stderr: buildResponse.ok ? "" : `HTTP ${buildResponse.status}`,
      });
    } catch (error) {
      result.blockers.push({
        gate: "build-identity",
        reason: "deterministic loopback build-info.json could not be captured",
        stderr: String(error),
      });
    }
  }
  captureIos(result);
  const android = captureAndroid(result);
  androidId = android?.id ?? null;
  androidReverseCreated = android?.reverseCreated === true;
} finally {
  for (const device of result.devices) {
    if (device.platform === "ios-simulator" && device.id) {
      for (const [key, value] of Object.entries(device.settings)) {
        if (value === "<unavailable>") continue;
        const restore = command("xcrun", [
          "simctl",
          "spawn",
          device.id,
          "defaults",
          "write",
          "com.apple.Accessibility",
          key,
          "-bool",
          /^(1|true)$/i.test(value) ? "true" : "false",
        ]);
        result.commands.push({
          command: `xcrun simctl spawn ${device.id} defaults write com.apple.Accessibility ${key} -bool ...`,
          label: `restore ${key}`,
          status: restore.status,
          stderr: restore.stderr,
        });
        if (restore.status !== 0)
          result.blockers.push({
            gate: "ios-settings-restore",
            key,
            reason: "captured iOS accessibility setting could not be restored",
            stderr: restore.stderr,
          });
      }
      if (device.bootedByHarness) {
        const shutdown = command("xcrun", ["simctl", "shutdown", device.id]);
        result.commands.push({
          command: `xcrun simctl shutdown ${device.id}`,
          label: "shutdown simulator booted by harness",
          status: shutdown.status,
          stderr: shutdown.stderr,
        });
        if (shutdown.status !== 0)
          result.blockers.push({
            gate: "ios-simulator-cleanup",
            reason: "simulator booted by harness could not be shut down",
            command: `xcrun simctl shutdown ${device.id}`,
            stderr: shutdown.stderr,
          });
      }
    }
    if (device.platform === "android-usb" && device.id) {
      for (const [key, value] of Object.entries(device.settings)) {
        const [namespace, setting] = key.split(".", 2);
        const restore =
          value === "<unavailable>" || value === "null"
            ? command("adb", [
                "-s",
                device.id,
                "shell",
                "settings",
                "delete",
                namespace,
                setting,
              ])
            : command("adb", [
                "-s",
                device.id,
                "shell",
                "settings",
                "put",
                namespace,
                setting,
                value,
              ]);
        result.commands.push({
          command: `adb -s ${device.id} shell settings ${value === "<unavailable>" || value === "null" ? "delete" : "put"} ${namespace} ${setting} ...`,
          label: `restore ${key}`,
          status: restore.status,
          stderr: restore.stderr,
        });
        if (restore.status !== 0)
          result.blockers.push({
            gate: "android-settings-restore",
            key,
            reason: "captured Android setting could not be restored",
            stderr: restore.stderr,
          });
      }
    }
  }
  if (androidId && androidReverseCreated) {
    const reverseCleanup = command("adb", [
      "-s",
      androidId,
      "reverse",
      "--remove",
      `tcp:${port}`,
    ]);
    if (reverseCleanup.status !== 0)
      result.blockers.push({
        gate: "android-loopback-cleanup",
        reason: "adb reverse tunnel could not be removed",
        stderr: reverseCleanup.stderr,
      });
  }
  if (server?.pid) {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      // The preview group may already have exited.
    }
  }
}

const checklistPath = writeArtifact(
  "checklist.json",
  JSON.stringify(result.checklist, null, 2) + "\n",
);
result.artifacts.push(checklistPath);
result.artifacts.push(...result.devices.flatMap((device) => device.artifacts));
const operatorSubmissionArtifactPath = path.join(
  evidenceDir,
  "operator-submission.json",
);
fs.writeFileSync(
  operatorSubmissionArtifactPath,
  JSON.stringify(operatorSubmissionTemplate(result), null, 2) + "\n",
);
result.operatorSubmissionTemplate = artifactRecord(
  operatorSubmissionArtifactPath,
);
result.artifacts.push(result.operatorSubmissionTemplate);
result.result = result.blockers.length === 0 ? "PASS" : "BLOCKED";
fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
fs.writeFileSync(summaryPath, JSON.stringify(result, null, 2) + "\n");
console.log(
  JSON.stringify(
    {
      result: result.result,
      candidateSha: result.candidateSha,
      devices: result.devices.map((device) => device.device),
      blockers: result.blockers,
      summary: path.relative(root, summaryPath),
    },
    null,
    2,
  ),
);

if (result.result === "BLOCKED" && !allowBlocked) process.exitCode = 2;
