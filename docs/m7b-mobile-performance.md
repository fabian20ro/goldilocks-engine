# M7B mobile-performance evidence

`collect:mobile-performance` is the repository-native collector for the
bounded M7B performance gate. It uses the pinned Playwright package, a
production loopback preview, `PerformanceObserver`, Chromium CDP metrics when
available, and optional `adb` device counters. It does not add telemetry or a
Chrome DevTools MCP dependency.

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
`summary.json`. The summary contains candidate SHA, browser identity, actual
CSS viewport, startup, LCP/INP/CLS, interaction, transfer, memory, offline
startup, Worker 1×/64× proxy samples, median/p95 aggregates, thresholds,
artifact SHA-256 values, page errors, and cleanup commands.

LCP/INP/CLS are measured from `PerformanceObserver`. When a browser does not
expose an entry type, its metric is `null` and the summary is `BLOCKED`; no
zero is fabricated. Chromium's CDP `Performance.TaskDuration` is labeled as a
Worker-cost proxy because browser CDP does not expose the dedicated Worker's
CPU attribution. The 1× and 64× controls are still exercised through the
shipped UI and are recorded separately.

The installed WebKit build may report `WebKit encountered an internal error`
for a top-level offline reload even when the service-worker controller and
cached shell are usable. The collector retains that exact navigation error as
an `offline-navigation` `BLOCKED` finding alongside the cache proof; it is not
silently converted into a passing offline navigation.

## Frozen-build baseline and physical Android evidence

The accepted-build baseline must be collected separately and passed explicitly;
the current candidate is never used as its own baseline:

```sh
M7B_PERFORMANCE_BASELINE=.cache/m7b/performance/frozen-baseline.json \
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
