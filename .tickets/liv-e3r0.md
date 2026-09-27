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
# Tech debt from the liv-ybyq and liv-ter0 reviews

Deferred findings from the liv-ybyq and liv-ter0 implementation reviews.

## Token and generation

- The generated `it` title keeps the raw assertion text (e.g. `toBe 90`).
  Revisit once rendering (DESIGN 16.5) defines how tokens are shown.
- Assertion verbs are not validated against a closed vocabulary (DESIGN 9). An
  unknown verb, or the middle form `{{! "x" toBe true }}`, produces invalid
  generated code instead of a clear error.
- A document whose heading names no binding fails as a raw vitest error; there
  is no `no binding for <slug>` message.

## Config

- `bin` catches every error and prints only the message, so a programming fault
  loses its stack. A typed config error would keep the actionable path without
  masking bugs.
- `Config.root` is written and never read; `loadConfig` threads `from` only to
  build the error string.
- A malformed `livingdoc.toml` surfaces the raw `smol-toml` message.
- `resolveBackend` matches on `startsWith('livingdoc.backend.')` without a file
  check, and its message does not distinguish none from several.

## Layout and lifecycle

- `checkProject` is non-recursive: documents in subfolders of `livingdocs` are
  silently skipped.
- Generated checks are named `<doc-basename>.test.ts`, so two documents sharing
  a basename overwrite each other in the `backend` folder (DESIGN 16.3).
- `checkProject` re-walks the config and spawns vitest once per document.

## Architecture

- The generator lives in `@livingdoc/cli`; `@livingdoc/core` and
  `@livingdoc/adapter-vitest` are empty stubs. DESIGN 8's language-core/adapter
  split and the adapter's verb list are not realized in code.

## Coverage

- The backend error branches (missing, several) are only verified by hand, not
  in-process, and the e2e error assertion (`not.toContain('\n    at ')`) is a
  proxy for "no stack trace" rather than a check on the message shape.
- Retiring `check.e2e.test.ts` dropped its "no stack trace" check; the dogfood
  misconfigured example asserts the exit code only.
