# Verification index — frozen provenance-repair map

Navigation only. Reports and plan/decisions remain authoritative and immutable.
This map is frozen history: it must not be used to infer live HEAD, latest
round, accepted verdict, unresolved state, or next gate. Run
`./scripts/agent-status` first for those facts.

## Freeze label

This map preserves the provenance-repair source set spanning the round-078
presentation baseline, rounds 079–082 adversarial findings, and the round-083
workflow/provenance release-verification record. It intentionally remains useful
after later reports and commits exist.

## Canonical baseline

`./scripts/verify` is the complete local gate: locked setup; format; lint;
typecheck; unit/property; deterministic balances; production build/audit; root
browser/PWA; Pages/offline. `tests/e2e` and `playwright*.report` are generated
evidence, not authority. The canonical command retains every lane.

## Archived finding map

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

## Round-085 authorized source route

The frozen provenance map above remains historical. The owner-authorized
Milestone 4 Research route is `plan.md` §§3–7.4, 12, 17, 19, 20/20.4, 23–27,
29, 33–34 plus D-037 in `.agent/DECISIONS.md`. Candidate evidence is expected
in the Research domain tests, balance scenario, and `tests/e2e/research.spec.ts`;
the canonical lane remains `./scripts/verify`. This routing note is not a
verdict or acceptance record.

## Full-read triggers

Take the full plan/decisions/archive route if status fails; any cited source is
missing, conflicting, or insufficient; the change touches another product seam;
the role is release verification; or the user explicitly requests it. The index
never authorizes a product change by itself.
