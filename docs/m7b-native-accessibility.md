# M7B native accessibility evidence

The native lane is deliberately device-first. Chromium, WebKit accessibility
trees, and the in-app Browser are supporting evidence only; they do not close
VoiceOver or TalkBack speech requirements.

## Reproducible setup

Use the repository-local Node/npm and ignored caches:

```sh
export npm_config_cache="$PWD/.cache/npm"
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright"
./scripts/setup
```

The harness starts a production preview on a deterministic loopback port and
cleans up its process group. It captures device identity, settings, browser
launch commands, screenshots, accessibility logs/hierarchy, and a JSON
checklist under `.cache/m7b/native/`. Every generated artifact is listed with
its SHA-256 in `summary.json`.

```sh
npm run test:native-a11y
```

The command exits `2` when an iOS Simulator, an unlocked authorized USB
Android device, or required manual speech evidence is unavailable. Canonical
verification uses the explicit infrastructure form below so it records the
same `BLOCKED` artifact without treating it as a pass:

```sh
M7B_NATIVE_ALLOW_BLOCKED=1 npm run test:native-a11y
```

Override the port or artifact path when running parallel isolated work:

```sh
M7B_NATIVE_PORT=43120 \
M7B_NATIVE_EVIDENCE_DIR=.cache/m7b/native/round-local \
npm run test:native-a11y
```

## iOS Simulator / Safari / VoiceOver

The harness uses `xcrun simctl list devices available --json`, boots one
available device when needed, captures `com.apple.Accessibility` settings,
opens `http://127.0.0.1:<port>/` with `xcrun simctl openurl`, captures a
simulator screenshot and accessibility log, and restores captured accessibility
settings during teardown. The generated command list is retained in
`summary.json`.

On the booted simulator, complete the rows in `checklist.json` with VoiceOver
enabled. At both 393×742 and 320×693 CSS-pixel orientations, cover:

- all eight tab names and the selected/page state;
- the 320px horizontal reveal instruction and active-tab reveal;
- the first actionable control and its result;
- 200% text with reduced motion;
- reload and offline resume.

Record exact spoken words in `ios-voiceover-speech.txt`, actual CSS viewport,
and screenshot paths in the checklist. A simulator screenshot or log without a
speech transcript remains `UNVERIFIED`/`BLOCKED`.

For a controlled operator session, the harness can enable VoiceOver and reduced
motion after capturing the before snapshot; teardown restores both values:

```sh
M7B_NATIVE_ENABLE_SETTINGS=1 M7B_NATIVE_ALLOW_BLOCKED=1 \
npm run test:native-a11y
```

## USB Android / Chrome / TalkBack

The harness accepts only an authorized `adb devices -l` row with status
`device`, checks the unlocked state with `adb shell dumpsys window policy`,
captures secure/global animation and accessibility settings, establishes
`adb reverse tcp:<port> tcp:<port>`, opens the URL in Chrome, captures a PNG,
UIAutomator hierarchy, and logcat. It restores every captured setting and
removes the reverse tunnel in teardown.

Complete the same checklist with TalkBack enabled at both widths and 200%
text/reduced motion. Record exact speech in `android-talkback-speech.txt`,
actual CSS viewport, and evidence paths. UIAutomator is supporting semantics,
not a TalkBack speech substitute.

With `M7B_NATIVE_ENABLE_SETTINGS=1`, the harness discovers the installed
TalkBack package, captures the secure/global settings, enables TalkBack and
zero animation scales for the operator session, then restores every captured
value. It still requires an unlocked device and a manual speech transcript.

Never enable a screen reader or change animation settings without retaining the
before snapshot. If the device is locked, unauthorized, missing Chrome, or
cannot reverse the loopback, preserve the command/error in `summary.json` and
leave the gate `BLOCKED`.
