# The Goldilocks Engine — Pipeline Toy

Gate-ready Milestone 0 numeric prototype and Milestone 1 portrait PWA. Later first-release milestones remain blocked on the plan's 30-minute human Pipeline Toy exit gate.

The first-run Quick Start explains the queue → run → completion → payout loop, normalized Compute Units (CU), memory use/capacity/reserve, pressure recovery, current rig progression, presets, animation, pause, and bounded 1×/4×/16× simulation time. Dismissal persists; **Help / Quick start** always reopens it. Hardware purchasing remains intentionally unavailable: the Pipeline Toy improves through module choice/order, workload, compute budget, memory reserve, and Shadow evaluation until the human gate authorizes Milestone 2.

Playtest deployment target: <https://fabian20ro.github.io/goldlocks-engine/>. The GitHub Pages workflow at `.github/workflows/deploy-pages.yml` deploys `dist` after pushes to `agent/implementation` or a manual dispatch.

```sh
./scripts/setup
./scripts/run       # http://127.0.0.1:4173
./scripts/verify    # root + Pages complete reproducible check

# GitHub Pages package and scoped offline/worker browser check
npm run build:pages
npm run test:e2e:pages
```

The default build and local server remain rooted at `/`. `build:pages` packages every HTML, manifest, icon, service-worker, CSS, JavaScript, and Web Worker URL for `/goldlocks-engine/`. The Pages browser check serves that exact subpath, loads it online, audits the scoped cache, reloads offline, and exercises the worker-backed pipeline again.

Local setup and GitHub Actions both keep npm downloads in the ignored workspace path `.cache/npm`; Playwright browsers use `.cache/ms-playwright`. Neither workflow depends on a writable user-home cache.

See `.agent/HANDOFF.md` for scope, architecture, commands, evidence, and the exact gate input still required. Informal playtest observations live as immutable dated records under `.agent/playtests/`; accepted product changes are promoted into `.agent/DECISIONS.md` without modifying `plan.md`.
