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
const allowBlocked =
  process.env.M7B_NATIVE_ALLOW_BLOCKED === "1" ||
  process.argv.includes("--allow-blocked");
const enableNativeSettings = process.env.M7B_NATIVE_ENABLE_SETTINGS === "1";
const outputArg = process.argv.find((value) => value.startsWith("--output="));
const summaryPath = path.resolve(
  root,
  outputArg?.slice("--output=".length) ??
    path.join(evidenceDir, "summary.json"),
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
    for (const name of destinations) {
      rows.push({
        platform,
        device,
        browser,
        width,
        height: width === 320 ? 693 : 742,
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
        platform,
        device,
        browser,
        width,
        height: width === 320 ? 693 : 742,
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
  }

  const settingsBefore = run(
    ["spawn", id, "defaults", "read", "com.apple.Accessibility"],
    "capture accessibility settings",
  );
  deviceResult.artifacts.push(
    writeArtifact("ios-settings-before.txt", settingsBefore.stdout),
  );
  for (const key of ["VoiceOverTouchEnabled", "ReduceMotionEnabled"]) {
    const setting = run(
      ["spawn", id, "defaults", "read", "com.apple.Accessibility", key],
      `capture ${key}`,
    );
    captureSetting(deviceResult, key, setting.stdout);
  }
  if (enableNativeSettings) {
    run(
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
    run(
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
    command:
      "Edit .cache/m7b/native/ios-voiceover-speech.txt and checklist.json after the Safari session",
    stderr: "AX-tree/browser substitutes are intentionally not accepted",
  });
  return deviceResult;
}

function captureAndroid(result) {
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
  deviceResult.artifacts.push(
    writeArtifact("android-settings-before.txt", settingsBefore),
  );
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
      run(
        ["shell", "settings", "put", "secure", "accessibility_enabled", "1"],
        "enable Android accessibility",
      );
      run(
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
      for (const key of [
        "transition_animation_scale",
        "window_animation_scale",
        "animator_duration_scale",
      ])
        run(
          ["shell", "settings", "put", "global", key, "0"],
          `enable reduced motion ${key}`,
        );
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
    deviceResult.artifacts.push(path.relative(root, screenshotPath));
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
  result.devices.push(deviceResult);
  result.checklist.push(
    ...nativeChecklist("USB Android", deviceResult.device, "Chrome + TalkBack"),
  );
  result.blockers.push({
    gate: "talkback-speech",
    reason:
      "native TalkBack speech transcript and actual CSS viewport require an operator session",
    command:
      "Edit .cache/m7b/native/android-talkback-speech.txt and checklist.json after the Chrome session",
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
  devices: [],
  checklist: [],
  blockers: [],
  artifacts: [],
};

let server;
let androidId = null;
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
  }
  captureIos(result);
  const android = captureAndroid(result);
  androidId = android?.id ?? null;
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
      }
    }
  }
  if (androidId)
    command("adb", ["-s", androidId, "reverse", "--remove", `tcp:${port}`]);
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
