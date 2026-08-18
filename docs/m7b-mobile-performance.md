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

LCP/CLS are measured from `PerformanceObserver`; INP is populated only from
`PerformanceEventTiming`/Event Timing `event` entries with interaction IDs.
When a browser does not expose an entry type, its metric is `null` and the
summary is explicitly `BLOCKED`; no wall-clock click duration is substituted
(that diagnostic is retained separately as `interactionWallClockMs`). The
collector wraps the shipped `Worker` constructor only
inside the test page, records the actual product Worker's `postMessage` to
`message` round trips for 1× and 64×, and blocks if no attributable Worker
evidence is present. This is local evidence, not product telemetry.

The installed WebKit build may report `WebKit encountered an internal error`
for a top-level offline reload even when the service-worker controller and
cached shell are usable. The collector retains that exact navigation error as
an `offline-navigation` `BLOCKED` finding alongside the cache proof; it is not
silently converted into a passing offline navigation.

## Frozen-build baseline and physical Android evidence

The accepted-build baseline is captured by every candidate collector
invocation; the current candidate is never used as its own baseline. The
collector creates an unpredictable nonce, asks the internal helper to extract
the exact frozen SHA (`d25e80e6781de89e80fc3b3c240a922ada53d978` /
`dc97ee41f6dbbc0e29d2`), installs it with the repository-local caches, and
consumes only the helper's nonce-authenticated stdout envelope. The helper and
parent validate the Git object/tree/build, explicit device ID, browser matrix,
settings fingerprint, result, and every retained `{path,sha256}` artifact
before comparing metrics. A digest-addressed copy is written as output
evidence after validation; no persisted JSON receipt is read as authority.

`--baseline`, `M7B_PERFORMANCE_BASELINE`, and legacy
`.cache/m7b/performance/frozen-baseline*.json` receipts are rejected or
ignored and produce an explicit `same-device-baseline-provenance` `BLOCKED`
finding. Forged, self, unrelated, missing, or mismatched evidence cannot enter
the comparison path. The public `capture:frozen-baseline` helper is an
internal nonce-bound child and is not a standalone receipt-import command.

The candidate command requires an explicit physical/same-device identifier
for this gate and uses only ignored repository-local npm/browser caches:

```sh
M7B_PERFORMANCE_DEVICE_ID=my-device \
npm run collect:mobile-performance
```

When the accepted Git object has no available collector/dependency or the
device/browser infrastructure is unavailable, the authenticated capture lane
returns `BLOCKED`; it never falls back to a caller-supplied or prior file.

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
