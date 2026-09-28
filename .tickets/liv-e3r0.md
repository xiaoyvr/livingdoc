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
# Tech debt from the reviews

Deferred findings from the liv-ybyq, liv-ter0, and liv-uxrl reviews.

## Token and generation

- The generated `it` title keeps the raw assertion text (e.g. `toBe 90`), and a
  fenced input echoes its name into the title. Revisit once rendering
  (DESIGN 16.5) defines how tokens are shown.
- Assertion verbs are not validated against a closed vocabulary (DESIGN 9). An
  unknown verb, or the middle form ``!!`"x" toBe true` ``, emits invalid
  generated code instead of a clear error. liv-m0mf owns this.
- A document whose heading names no binding fails as a raw runner error; there
  is no `no binding for <slug>` message.

## Config

- An `Example ( web ):` alias is not trimmed and fails as an unknown backend.
- `Config.root` is written and never read.

## Layout and lifecycle

- Generated test files are named after the document basename, so two documents
  sharing a basename overwrite each other in a backend folder (DESIGN 16.3).

## Coverage

- The `bin` error path is uncovered: nothing drives an unexpected exception
  through `bin` to show it now surfaces with a stack while `ConfigError` stays a
  one-liner. The untrimmed alias is untested too.
