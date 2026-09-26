---
id: liv-e3r0
status: open
deps: []
links: []
created: 2026-09-26T22:27:13Z
type: task
priority: 3
assignee: xiaoyvr
---
# Tech debt from the liv-ybyq review

Deferred findings from the liv-ybyq implementation review:

- The generated `it` title keeps the raw assertion text (e.g. `toBe 90`). Revisit once rendering (DESIGN 16.5) defines how tokens are shown; task 7 only documents the current behavior.
- Assertion verbs are not validated against a closed vocabulary (DESIGN 9). An unknown verb, or the middle form `{{! "x" toBe true }}`, produces invalid generated code instead of a clear error.
- The generator lives in `@livingdoc/cli`; `@livingdoc/core` and `@livingdoc/adapter-vitest` are empty stubs. DESIGN 8's language-core/adapter split and the adapter's verb list are not realized in code.
- The generated file is a fixed `livingdoc.test.ts` beside each document, so two documents in one directory overwrite each other (DESIGN 16.3).
- A missing backend or binding surfaces as a raw vitest failure, not an actionable message.

