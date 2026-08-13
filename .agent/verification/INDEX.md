# Verification index

Status date: 2026-08-14. Compact routing only; reports and plan/decisions remain
authoritative and immutable.

## Current status

- Last accepted PASS: [round 078](round-078.md), verifier commit
  `437b56245b8488cce0ea1193be4200985cace2c7`.
- Current unverified candidate:
  `0bdff6ea88f7496bfb8348c7551652bf53a676ca`.
- No round-083 report/PASS exists.
- Current unresolved FAIL history: [079](round-079.md),
  [080](round-080.md), [081](round-081.md), [082](round-082.md).
- Next gate: fresh independent PASS, then exact-SHA hosted verification and
  deployment before Milestone 4 Research.

## Canonical baseline

`./scripts/verify` is the complete local gate: locked setup; format; lint;
typecheck; unit/property; deterministic balances; production build/audit; root
browser/PWA; Pages/offline. `tests/e2e` and `playwright*.report` are generated
evidence, not authority. The canonical command must retain every lane.

## Open finding map

| Finding | Authoritative report | Candidate regression / normal case | Adversarial / lifecycle evidence | Canonical lane |
| --- | --- | --- | --- | --- |
| V-078 later Career failure borrows a Jobs cause | [round-079](round-079.md) | `src/ui/verifierRound079.test.tsx`; `src/ui/settlementProvenance.test.tsx` valid-integrity later-Career restore | `round-079-adversarial.mjs`; reload/offline Jobs provenance E2E | root unit + `npm run test:e2e` |
| V-079 free-text stale decoy impersonates cause | [round-080](round-080.md) | `src/ui/verifierRound080.test.tsx`; `src/ui/settlementProvenance.test.tsx` decoy/unknown | `round-080-adversarial.mjs`; raw 320 keyboard / 393 touch offline | root unit + `npm run test:e2e` |
| V-080 stale structural relink claims a precise cause | [round-081](round-081.md) | `src/ui/verifierRound081.test.tsx`; `tests/e2e/jobs-settlement-provenance.spec.ts` raw 320 | `round-081-adversarial.mjs`; restore/reload/offline | root unit + `npm run test:e2e` |
| V-081 future/colliding ID freezes progress | [round-081](round-081.md) | `src/simulation/engine.test.ts`; `tests/e2e/jobs-settlement-provenance.spec.ts` raw 393 | `round-081-adversarial.mjs`; repeated tick/reload/resume | unit/balance + root browser |
| V-082 canonical-looking stale marker forges cause | [round-082](round-082.md) | `src/ui/verifierRound082.test.tsx`; `src/ui/settlementProvenance.test.tsx`; browser stale-marker case | `round-082-adversarial.mjs`; raw 320 keyboard / 393 touch, 200%, offline | root unit + `npm run test:e2e` |

## Archived probe policy

- `round-079-adversarial.mjs`, `round-080-adversarial.mjs`,
  `round-081-adversarial.mjs`, and `round-082-adversarial.mjs` are retained
  verifier evidence. Do not edit, delete, or silently stop invoking them in
  release verification.
- The round-080 probe contains a historical stale-precision expectation
  superseded only by D-036. Keep it unchanged and label its result accurately;
  valid-integrity V-078 precision remains required.
- Earlier `*-adversarial.mjs` and verifier tests remain archival regression
  evidence. Expand to them for release, broad changes, or when their source
  mapping is implicated; do not use the index to discard them.

## Full-read triggers

Take the full plan/decisions/archive route if any cited source is missing,
conflicting, or insufficient; the change touches another product seam; the role
is release verification; or the user explicitly requests it. The index never
authorizes a product change by itself.
