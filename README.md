# The Goldilocks Engine — Pipeline Toy

Milestone 0 numeric prototype and Milestone 1 portrait PWA with the D-006 bounded purchase-loop redesign. Later first-release milestones remain blocked on the plan's 30-minute human Pipeline Toy exit gate.

The first-run Quick Start explains the queue → run → completion → payout loop, normalized Compute Units (CU), memory use/capacity/reserve, pressure recovery, upgrades, presets, animation, pause, and bounded 1×/4×/16× simulation time. Dismissal persists; **Help / Quick start** always reopens it.

The **Upgrades** view implements a deliberately bounded kill-gate redesign: earn money from settlements, compare rig/module tradeoffs, pay once for durable ownership, then separately equip a rig or add an owned compatible module. Schema-v4 state preserves the run, purchases, equipment, and pipeline across reload/offline use, carries migration metadata plus a deterministic full-snapshot integrity check, validates every UI-bound field before restore, and safely migrates schema-v3 state. Saved configurations continue to describe their own rig after the live rig changes. The deterministic balance gate funds a first module by five successful starter jobs and a used rig by fifteen, including that module purchase. Researchers, longer/multiple pipelines, newer-model content, hype/fear, personal scheduling, and the rest of Milestone 2+ remain deferred.

Playtest deployment target: <https://fabian20ro.github.io/goldlocks-engine/>. The GitHub Pages workflow at `.github/workflows/deploy-pages.yml` deploys `dist` after pushes to `agent/implementation` or a manual dispatch. `.github/workflows/verify.yml` independently runs the exact `./scripts/verify` gate on Ubuntu before its immutable run/artifacts can be used as browser evidence for that SHA.

```sh
./scripts/setup
./scripts/run       # http://127.0.0.1:4173
./scripts/verify    # root + Pages complete reproducible check

# 20,001-seed first-module/first-rig pacing and exact-once checks
npm run balance:upgrades

# GitHub Pages package and scoped offline/worker browser check
npm run build:pages
npm run test:e2e:pages
```

The default build and local server remain rooted at `/`. `build:pages` packages every HTML, manifest, icon, service-worker, CSS, JavaScript, and Web Worker URL for `/goldlocks-engine/`. The Pages browser check serves that exact subpath, loads it online, audits the scoped cache, reloads offline, and exercises the worker-backed pipeline again.

Local setup and GitHub Actions both keep npm downloads in the ignored workspace path `.cache/npm`; Playwright browsers use `.cache/ms-playwright`. Neither workflow depends on a writable user-home cache.

The Linux verification workflow asserts that its checkout equals `GITHUB_SHA`, installs the pinned Chromium plus Linux libraries only when `PLAYWRIGHT_INSTALL_DEPS=1`, and uploads reports/results even if the canonical gate fails. After pushing a candidate, inspect its exact evidence with:

```sh
gh run list --workflow verify.yml --commit <candidate-sha>
gh run view <run-id> --log-failed
```

See `.agent/HANDOFF.md` for scope, architecture, commands, evidence, and the exact gate input still required. Informal playtest observations live as immutable dated records under `.agent/playtests/`; accepted product changes are promoted into `.agent/DECISIONS.md` without modifying `plan.md`.
