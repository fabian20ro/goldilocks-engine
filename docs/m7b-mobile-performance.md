# M7B mobile-performance evidence

`collect:mobile-performance` is the repository-native collector for the
bounded M7B performance gate. It uses the pinned Playwright package, a
production loopback preview, `PerformanceObserver`, test-only instrumentation
of the shipped Dedicated Worker, and optional `adb` device counters. It does
not add telemetry or a Chrome DevTools MCP dependency.

## Setup, startup, and cache

```sh
export npm_config_cache="$PWD/.cache/npm"
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright"
./scripts/setup
```

`./scripts/setup` installs both the pinned Chromium and WebKit browsers into
`.cache/ms-playwright`; npm uses `.cache/npm`. `scripts/run-e2e` builds the
candidate and starts `127.0.0.1` with a caller-selected port. The collector
terminates every preview group, browser, context, and trace session.

## Five-run matrix

The default command collects five cold, empty-storage contexts for each pinned
Chromium/WebKit cell at 320×693 and 393×742. When an unlocked USB Android is
available, it additionally force-stops/reopens Chrome for five cold runs,
uses `adb reverse` for the loopback and `adb forward` to Chrome's
`localabstract:chrome_devtools_remote`, and records the device's actual CSS
viewport:

```sh
npm run collect:mobile-performance
```

Each raw sample is written under `.cache/m7b/performance/samples/`, each
Playwright trace under `traces/`, and the machine-readable summary under
`summary.json`. The summary contains candidate SHA/build identity, browser and
device/settings identity, actual CSS viewport, startup, LCP/INP/CLS,
interaction, transfer, memory, offline startup, Dedicated Worker 1×/64×
request/response attribution, median/p95 aggregates, thresholds, artifact
SHA-256 values, page errors, and cleanup commands.

LCP/INP/CLS are measured from `PerformanceObserver`. When a browser does not
expose an entry type, its metric is `null` and the summary is `BLOCKED`; no
zero is fabricated. The collector wraps the shipped `Worker` constructor only
inside the test page, records the actual product Worker's `postMessage` to
`message` round trips for 1× and 64×, and blocks if no attributable Worker
evidence is present. This is local evidence, not product telemetry.

The installed WebKit build may report `WebKit encountered an internal error`
for a top-level offline reload even when the service-worker controller and
cached shell are usable. The collector retains that exact navigation error as
an `offline-navigation` `BLOCKED` finding alongside the cache proof; it is not
silently converted into a passing offline navigation.

## Frozen-build baseline and physical Android evidence

The accepted-build baseline is captured separately; the current candidate is
never used as its own baseline. Candidate collection consumes only the
canonical retained capture at
`.cache/m7b/performance/frozen-baseline.json` and its adjacent
`.provenance.json` receipt. `--baseline` and `M7B_PERFORMANCE_BASELINE` are
rejected as caller-supplied evidence, not treated as an override.

The capture helper binds the baseline to the frozen accepted SHA/build
(`d25e80e6781de89e80fc3b3c240a922ada53d978` /
`dc97ee41f6dbbc0e29d2`), re-derives the accepted Git tree, records a unique
capture ID, explicit same-device ID, browser matrix, settings fingerprint,
and checksummed artifact manifest. The collector revalidates those inputs,
the summary digest, and every retained `{path,sha256}` entry before comparing
metrics. Missing, self, forged, unrelated, or mismatched evidence is
`BLOCKED` before metric comparison.

Capture a baseline reproducibly from a detached worktree of that exact frozen
SHA. The command requires an explicit physical/same-device identifier and
uses only ignored repository-local npm/browser caches:

```sh
M7B_PERFORMANCE_DEVICE_ID=my-device \
npm run capture:frozen-baseline
```

The helper runs `npm ci --prefer-offline`, installs the pinned Chromium/WebKit
builds into `.cache/ms-playwright`, runs the collector with
`--capture-frozen-baseline`, validates the frozen SHA/build/tree ID, writes the
summary and provenance receipt, and removes its temporary worktree. The
canonical default output must remain at the path above; a custom `--output`
is retained for inspection but is not consumed as candidate evidence.

```sh
npm run collect:mobile-performance
```

Startup, memory, and offline-startup medians are compared with a 1.20 ratio
limit per same browser/portrait cell. A missing or mismatched baseline is
`BLOCKED`.

When an authorized physical Android is attached, the collector also records
`adb dumpsys battery`, `dumpsys thermalservice`, Chrome memory, and the
five-run Chrome lane. A simulator does not satisfy the physical
battery/thermal sub-gate. Without a physical device, preserve the
`adb devices -l`/unlock error and use the explicit canonical infrastructure
form:

```sh
M7B_PERFORMANCE_ALLOW_BLOCKED=1 npm run collect:mobile-performance
```

That flag only permits the verification pipeline to continue while retaining a
`BLOCKED` result; it never changes the result to PASS. Raw traces and device
artifacts stay ignored under `.cache/m7b/performance/` and should be attached
to the independent verifier/CI evidence store rather than committed.
