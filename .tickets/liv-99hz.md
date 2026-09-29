---
id: liv-99hz
status: open
deps: [liv-f6ao]
links: [liv-l4s2]
created: 2026-09-29T18:13:01Z
type: feature
priority: 1
assignee: xiaoyvr
---
# Dogfood livingdoc with pytest

**As a** livingdoc maintainer, **I want** livingdoc's own explain documents
checked under pytest as well as vitest, **so that** the Python path is
exercised end-to-end the same way the TypeScript dogfood is today.

## Acceptance criteria

- **Given** opted-in explain documents and a `[[backend.pytest]]` backend for
  livingdoc itself
  **When** `livingdoc generate` runs and pytest executes the generated checks
  **Then** those documents hold against the built CLI the same way the vitest
  dogfood does

- **Given** a clean checkout
  **When** `npm run checks` (or `dogfood`) runs
  **Then** the pytest dogfood is included and a stale Python-side document
  fails the suite

## Scope

- A pytest backend under `tests/explain/` (Python `register` + bindings that
  drive the built CLI), plus explain document(s) written with pytest verbs,
  generated into that backend's `generated/` folder.
- Wire pytest into `dogfood` / `checks` so the Python dogfood runs in the
  normal maintainer loop (alongside the existing vitest dogfood).
- Reuse or extend the explain coverage as needed; mirror liv-l4s2's intent,
  not necessarily the same file layout byte-for-byte.

## Out of scope

- Implementing the pytest generator (liv-f6ao) — this story consumes it.
- Directives, per-case results, or new product features beyond dogfooding.

## Notes

- Depends on liv-f6ao: without a pytest generator and runtime import shape,
  there is nothing to dogfood.
- Linked to liv-l4s2 (the original vitest dogfood) as the pattern to follow.
- Today `npm run dogfood` only runs vitest on `tests/`; this story adds the
  pytest half.
