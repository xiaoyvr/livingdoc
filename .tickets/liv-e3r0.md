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

- `bin` catches every error and prints only the message, so a programming fault
  loses its stack. A typed config error would keep the actionable path without
  masking bugs.
- A malformed `livingdoc.toml` surfaces the raw `smol-toml` message.
- `readBackends` silently skips a `backend.<framework>` value that is not an
  array, so `backend = 1` reports "no backends configured" instead of the actual
  mistake.
- Two backends may share a name; the first silently wins. A duplicate name
  should be a config error.
- An `Example ( web ):` alias is not trimmed and fails as an unknown backend.
- `Config.root` is written and never read.

## Layout and lifecycle

- A document that stops touching a backend leaves its generated file behind:
  `generate` writes but never removes stale outputs, so an old test keeps
  running. The repo hides this with `clean:checks`.
- Generated test files are named after the document basename, so two documents
  sharing a basename overwrite each other in a backend folder (DESIGN 16.3).

## Coverage

- The retired e2e's "no stack trace" check was not replaced; the `bin` error
  path is uncovered, as are duplicate names, an untrimmed alias, and stale
  generated files.
