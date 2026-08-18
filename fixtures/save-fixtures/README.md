# Golden save fixtures

These JSON records are the D-046 restore-boundary corpus. Each record contains
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
commits and current migration boundary. The historical code was not executable
in the current dependency tree, so the generator records the unavoidable
derivation rather than pretending that a test-shaped object was a captured
production save. Regenerate with:

```sh
npm run generate:save-fixtures
```

The same directory contains explicit adversarial boundary fixtures for malformed
JSON, stale integrity, unsealed current state, tampered progression, future
schema, and unsupported schema. Each carries a boundary derivation, checksum,
and expected recovery disposition/reason. Do not edit payloads without updating
their provenance/checksum and the fixture harness expectations.
