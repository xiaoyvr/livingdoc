# Story 6 — Per-case results

Know which bullet failed, and why.

## Goal

Report each bullet's outcome individually, with enough detail to say "bullet X
failed: expected 90, got 85", so a document's failures are useful today and can
be shown in place later.

## Why this slice

The run's pass/fail is the gate; this slice gives livingdoc the per-case detail
to explain a failure and to mark up the document afterwards.

## In scope

- A stable identity per bullet.
- The outcome of each bullet, including the actual value on failure.
- A machine-readable report.

## Out of scope

- Rendering/coloring, configuration, compound values.

## Acceptance criteria

- [ ] Every bullet has a stable, discoverable identity.
- [ ] A failing bullet is reported with its identity and actual value.
- [ ] The report is machine-readable.

## Notes

How per-case results are obtained is an open design question (DESIGN §16.1);
the report is the contract this slice establishes.
