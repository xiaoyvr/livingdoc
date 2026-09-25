# Story 6 — Result mapping

Know which bullet failed, and why.

## Goal

Map vitest's per-test results back to the document's bullets, with a stable
identity and the actual value on failure, so livingdoc can report
"bullet X failed: expected 90, got 85".

## Why this slice

The framework's binary pass/fail is the CI gate; this slice gives livingdoc the
per-case detail it needs to color the document later, and a useful red output
now.

## In scope

- A stable id per bullet (e.g. heading slug + bullet index).
- Reading vitest's per-test results (or a `record(id, ok, actual)` helper in the
  generated test).
- A structured report: `[{ id, ok, actual? }]`.

## Out of scope

- HTML rendering/coloring, config, compound values.

## Acceptance criteria

- [ ] Every bullet has a stable, discoverable id.
- [ ] A failing bullet is reported with its id and actual value.
- [ ] The report is machine-readable (JSON).

## Tasks

- [ ] Assign ids at parse time: `<slug>/<bullet-index>`.
- [ ] Embed the id in the generated test (test name or a `record()` call).
- [ ] Decide the result channel: parse vitest's reporter, or emit a
      `record(id, ok, actual)` helper into each test. (Leaning: helper.)
- [ ] Produce a JSON report consumed by `livingdoc check`.

## Notes

Design open question §16.1: this is the "result mapping" decision. If the
`record()` helper is chosen, it must run even on failure (try/finally or a
custom assertion wrapper).
