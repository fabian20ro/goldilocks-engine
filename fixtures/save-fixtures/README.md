# Golden save fixtures

These JSON records are the D-047 restore-boundary corpus, using D-046's audited
generation catalogue. Each record contains
the source commit/date, support tier, deployment evidence (when independently
observed), a SHA-256 checksum of its payload, and semantic source invariants.

The two `public-deployment` records are the only generations with independent
public evidence: schema 7 `evaluation-replay-1` from the live owner publication
identified by round 061, and schema 7 `local-lab-1` from the exact d25e80e…
receipt/build `dc97ee41f6dbbc0e29d2`. Schema 3–6 and the intermediate Research
and Hype/Fear generations are retained as explicit legacy-compatibility
fixtures because the current restore boundary accepts them; their metadata
does not claim a public deployment that the archive does not prove.

The payloads are deterministic reconstructions from the cited historical source
commits and current migration boundary. Schema 3–6 did not retain a compatible
seal in the surviving source snapshots, so the generator adds the current
deterministic `fnv1a-32-json-v1` seal to the audited reconstructed payload and
records that derivation; it is not presented as a historical deployment claim.
The restore boundary validates this seal before any legacy field is read.
Regenerate with:

```sh
npm run generate:save-fixtures
```

The same directory contains explicit adversarial boundary fixtures for malformed
JSON, stale integrity, unsealed current state, tampered progression, future
schema, and unsupported schema. Missing or invalid integrity always resets to a
fresh safe run after the UI preserves one bounded raw backup; no simulation
progression is salvaged. Each carries a boundary derivation, checksum, and
expected recovery disposition/reason. Do not edit payloads without updating
their provenance/checksum and the fixture harness expectations.
