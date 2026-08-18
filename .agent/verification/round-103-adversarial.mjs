#!/usr/bin/env node

/* Independent M7B authenticity and malformed-state probes for round 103. */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const root = process.cwd();
const candidateSha = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8",
}).trim();
const findings = [];

function check(id, condition, evidence) {
  if (!condition) findings.push({ id, evidence });
}

function sha256(filePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

function settingsFingerprint(browsers) {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        hasTouch: true,
        isMobile: true,
        textScale: "100%",
        reducedMotion: "no-preference",
        viewportHeights: { 320: 693, 393: 742 },
        browsers,
        widths: [320, 393],
      }),
    )
    .digest("hex");
}

function runCollector(baselinePath, evidenceDir, outputPath) {
  return spawnSync(
    process.execPath,
    ["scripts/collect-mobile-performance.mjs", `--output=${outputPath}`],
    {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        M7B_PERFORMANCE_ALLOW_BLOCKED: "1",
        M7B_PERFORMANCE_BASELINE: baselinePath,
        M7B_PERFORMANCE_BROWSERS: "",
        M7B_PERFORMANCE_DEVICE_ID: "round-103-forged-baseline-device",
        M7B_PERFORMANCE_EVIDENCE_DIR: evidenceDir,
        M7B_PERFORMANCE_RUNS: "5",
      },
    },
  );
}

function probeForgedBaseline() {
  const temporary = fs.mkdtempSync(
    path.join(root, ".cache/m7b/r103-baseline-"),
  );
  const baselinePath = path.join(temporary, "forged-baseline.json");
  const evidenceDir = path.join(temporary, "evidence");
  const outputPath = path.join(evidenceDir, "summary.json");
  const retainedArtifactPath = path.join(temporary, "retained-baseline.txt");
  fs.writeFileSync(retainedArtifactPath, "retained baseline bytes\n");
  const retainedArtifact = {
    path: path.relative(root, retainedArtifactPath),
    sha256: sha256(retainedArtifactPath),
  };
  const forged = {
    schemaVersion: 1,
    kind: "m7b-mobile-performance",
    candidateSha: "d25e80e6781de89e80fc3b3c240a922ada53d978",
    buildInfo: { version: "dc97ee41f6dbbc0e29d2" },
    environment: {
      deviceId: "round-103-forged-baseline-device",
      browserSet: [],
      settingsFingerprint: settingsFingerprint([]),
    },
    cells: [],
    artifacts: [retainedArtifact],
  };
  fs.writeFileSync(baselinePath, JSON.stringify(forged, null, 2) + "\n");
  const run = runCollector(baselinePath, evidenceDir, outputPath);
  const result = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  const identityFindings = result.findings.filter((finding) =>
    String(finding.gate ?? "").startsWith("same-device-baseline"),
  );
  check("V-103-001", identityFindings.length > 0, {
    expected:
      "a baseline summary must prove trusted frozen-build provenance, not merely repeat the accepted SHA/build/device/settings metadata",
    actual: {
      collectorExit: run.status,
      result: result.result,
      identityFindings,
      forgedMetadata: {
        candidateSha: forged.candidateSha,
        buildId: forged.buildInfo.version,
        deviceId: forged.environment.deviceId,
      },
    },
  });
  fs.rmSync(temporary, { recursive: true, force: true });
  return {
    skipped: false,
    result: result.result,
    identityFindings,
    forgedCandidateSha: forged.candidateSha,
    forgedBuildId: forged.buildInfo.version,
    collectorExit: run.status,
  };
}

function writeFixtureFile(evidenceDir, relativePath, content) {
  const filePath = path.join(evidenceDir, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  return {
    path: path.relative(root, filePath),
    sha256: sha256(filePath),
  };
}

function nativeRows(heightByWidth, screenshotPath) {
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
  for (const [platform, device, browser] of [
    ["iOS Simulator", "operator-supplied device", "Safari + VoiceOver"],
    ["USB Android", "operator-supplied device", "Chrome + TalkBack"],
  ]) {
    for (const width of [393, 320]) {
      for (const name of destinations) {
        for (const boundary of [false, true]) {
          rows.push({
            id: `${platform}:${width}:${name}:${boundary ? "200-boundary" : "100-normal"}`,
            platform,
            device,
            browser,
            width,
            height: heightByWidth[width],
            textScale: boundary ? "200%" : "100%",
            reducedMotion: boundary,
            check: boundary
              ? "screen-reader announces horizontal reveal instruction and first actionable control"
              : `screen-reader announces ${name} tab and active state`,
            expected: `${name}; selected/page state when active`,
            observed: "Observed by operator",
            speechEvidence: "Retained speech transcript row",
            screenshot: screenshotPath,
            actualCssViewport: {
              width,
              height: heightByWidth[width],
            },
            status: "PASS",
          });
        }
      }
    }
  }
  return rows;
}

function nativeFixture(heightByWidth) {
  const evidenceDir = fs.mkdtempSync(
    path.join("/private/tmp", "goldlocks-r103-native-"),
  );
  const artifacts = [
    writeFixtureFile(evidenceDir, "shared-screen.png", "PNG fixture"),
    writeFixtureFile(evidenceDir, "ios-settings-before.txt", "ios before"),
    writeFixtureFile(evidenceDir, "ios-settings-after.txt", "ios after"),
    writeFixtureFile(
      evidenceDir,
      "android-settings-before.txt",
      "android before",
    ),
    writeFixtureFile(
      evidenceDir,
      "android-settings-after.txt",
      "android after",
    ),
    writeFixtureFile(
      evidenceDir,
      "ios-voiceover-speech.txt",
      "VoiceOver announces every retained row and active state.\n",
    ),
    writeFixtureFile(
      evidenceDir,
      "android-talkback-speech.txt",
      "TalkBack announces every retained row and active state.\n",
    ),
  ];
  const artifactByName = new Map(
    artifacts.map((entry) => [path.basename(entry.path), entry]),
  );
  const capture = {
    schemaVersion: 1,
    kind: "m7b-native-capture",
    candidateSha,
    buildInfo: { version: "fixture-native-build" },
    devices: [
      {
        platform: "ios-simulator",
        id: "fixture-ios",
        device: "Fixture iPhone",
        os: "iOS fixture",
        browser: "Safari",
        settings: { VoiceOverTouchEnabled: "1" },
        settingsBeforeArtifact: artifactByName.get("ios-settings-before.txt")
          .path,
        settingsAfterArtifact: artifactByName.get("ios-settings-after.txt")
          .path,
      },
      {
        platform: "android-usb",
        id: "fixture-android",
        device: "Fixture Pixel",
        os: "Android fixture",
        browser: "Chrome",
        unlocked: true,
        settings: { talkback: "enabled" },
        settingsBeforeArtifact: artifactByName.get(
          "android-settings-before.txt",
        ).path,
        settingsAfterArtifact: artifactByName.get("android-settings-after.txt")
          .path,
      },
    ],
    artifacts,
  };
  const submission = {
    schemaVersion: 1,
    kind: "m7b-native-operator-submission",
    candidateSha,
    buildId: "fixture-native-build",
    submittedAt: new Date().toISOString(),
    devices: [
      {
        platform: "ios-simulator",
        id: "fixture-ios",
        device: "Fixture iPhone",
        os: "iOS fixture",
        browser: "Safari + VoiceOver",
        settingsBefore: { VoiceOverTouchEnabled: "1" },
        settingsAfter: { VoiceOverTouchEnabled: "1" },
        settingsRestored: true,
        settingsBeforeArtifact: artifactByName.get("ios-settings-before.txt")
          .path,
        settingsAfterArtifact: artifactByName.get("ios-settings-after.txt")
          .path,
        actualCssViewports: {
          320: { width: 320, height: heightByWidth[320] },
          393: { width: 393, height: heightByWidth[393] },
        },
        textScales: ["100%", "200%"],
        reducedMotion: true,
      },
      {
        platform: "android-usb",
        id: "fixture-android",
        device: "Fixture Pixel",
        os: "Android fixture",
        browser: "Chrome + TalkBack",
        settingsBefore: { talkback: "enabled" },
        settingsAfter: { talkback: "enabled" },
        settingsRestored: true,
        settingsBeforeArtifact: artifactByName.get(
          "android-settings-before.txt",
        ).path,
        settingsAfterArtifact: artifactByName.get("android-settings-after.txt")
          .path,
        actualCssViewports: {
          320: { width: 320, height: heightByWidth[320] },
          393: { width: 393, height: heightByWidth[393] },
        },
        textScales: ["100%", "200%"],
        reducedMotion: true,
      },
    ],
    checklist: nativeRows(
      heightByWidth,
      artifactByName.get("shared-screen.png").path,
    ),
    speech: {
      voiceover: {
        path: artifactByName.get("ios-voiceover-speech.txt").path,
        transcript: "VoiceOver transcript retained",
      },
      talkback: {
        path: artifactByName.get("android-talkback-speech.txt").path,
        transcript: "TalkBack transcript retained",
      },
    },
    artifactPaths: artifacts,
  };
  const capturePath = path.join(evidenceDir, "capture-summary.json");
  const submissionPath = path.join(evidenceDir, "operator-submission.json");
  fs.writeFileSync(capturePath, JSON.stringify(capture, null, 2) + "\n");
  fs.writeFileSync(submissionPath, JSON.stringify(submission, null, 2) + "\n");
  return { evidenceDir, capturePath, submissionPath, submission };
}

function runNativeValidation(fixture, outputPath) {
  return spawnSync(
    process.execPath,
    [
      "scripts/native-accessibility.mjs",
      "--mode=validate",
      `--output=${outputPath}`,
    ],
    {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        M7B_NATIVE_ALLOW_BLOCKED: "1",
        M7B_NATIVE_CAPTURE_SUMMARY: fixture.capturePath,
        M7B_NATIVE_EVIDENCE_DIR: fixture.evidenceDir,
        M7B_NATIVE_SUBMISSION: fixture.submissionPath,
      },
    },
  );
}

function probeNativeViewport() {
  const fixture = nativeFixture({ 320: 693, 393: 742 });
  const validOutput = path.join(fixture.evidenceDir, "valid-validation.json");
  const validRun = runNativeValidation(fixture, validOutput);
  const valid = JSON.parse(fs.readFileSync(validOutput, "utf8"));
  fixture.submission.devices.forEach((device) => {
    device.actualCssViewports["320"].height = 1;
  });
  fixture.submission.checklist
    .filter((row) => row.width === 320)
    .forEach((row) => {
      row.actualCssViewport.height = 1;
    });
  fs.writeFileSync(
    fixture.submissionPath,
    JSON.stringify(fixture.submission, null, 2) + "\n",
  );
  const malformedOutput = path.join(
    fixture.evidenceDir,
    "malformed-validation.json",
  );
  const malformedRun = runNativeValidation(fixture, malformedOutput);
  const malformed = JSON.parse(fs.readFileSync(malformedOutput, "utf8"));
  check(
    "V-103-002",
    valid.result === "PASS" && malformed.result === "BLOCKED",
    {
      expected:
        "native operator validation rejects a finite but wrong viewport height at the 320x693 boundary",
      actual: {
        validExit: validRun.status,
        validResult: valid.result,
        malformedExit: malformedRun.status,
        malformedResult: malformed.result,
        malformedViewportFindings: malformed.blockers.filter(
          (blocker) =>
            blocker.gate === "actual-css-viewport" ||
            blocker.reason?.includes("actual CSS viewport"),
        ),
      },
    },
  );
  fs.rmSync(fixture.evidenceDir, { recursive: true, force: true });
  return {
    validResult: valid.result,
    malformedResult: malformed.result,
    malformedBlockers: malformed.blockers.length,
    validExit: validRun.status,
    malformedExit: malformedRun.status,
  };
}

function probeWebkitFailureClassification() {
  const source = fs.readFileSync(
    path.join(root, "scripts/run-webkit-e2e.mjs"),
    "utf8",
  );
  const broadInfrastructureRegex =
    /const infrastructureFailure =([\s\S]*?)const blocked = infrastructureFailure;/m.exec(
      source,
    )?.[1] ?? "";
  const masksTestFailure =
    /WebKit offline reload reported:/.test(broadInfrastructureRegex) &&
    /const blocked = infrastructureFailure;/.test(source) &&
    !/run\.status\s*===\s*0[\s\S]*WebKit offline reload reported/.test(
      broadInfrastructureRegex,
    );
  check("V-103-003", !masksTestFailure, {
    expected:
      "a WebKit test assertion failure remains FAILED even when the same run also records a known offline navigation error",
    actual:
      "run-webkit-e2e classifies any output containing the offline annotation as infrastructure BLOCKED before considering the Playwright exit status",
  });
  return { masksTestFailure, matchedSource: broadInfrastructureRegex.trim() };
}

const forgedBaseline = probeForgedBaseline();
const nativeViewport = probeNativeViewport();
const webkitFailureClassification = probeWebkitFailureClassification();
console.log(
  JSON.stringify(
    {
      candidateSha,
      findings,
      forgedBaseline,
      nativeViewport,
      webkitFailureClassification,
    },
    null,
    2,
  ),
);
process.exitCode = findings.length === 0 ? 0 : 1;
