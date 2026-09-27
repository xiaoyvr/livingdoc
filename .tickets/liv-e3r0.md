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

- The generated `it` title keeps the raw assertion text (e.g. `toBe 90`), and a
  fenced input echoes its name into the title. Revisit once rendering
  (DESIGN 16.5) defines how tokens are shown.
- Assertion verbs are not validated against a closed vocabulary (DESIGN 9). An
  unknown verb, or the middle form ``!!`"x" toBe true` ``, produces invalid
  generated code instead of a clear error. liv-m0mf owns this.
- A document whose heading names no binding fails as a raw runner error; there
  is no `no binding for <slug>` message.

## Config

- `bin` catches every error and prints only the message, so a programming fault
  loses its stack. A typed config error would keep the actionable path without
  masking bugs.
- `Config.root` is written and never read; `loadConfig` threads `from` only to
  build the error string.
- A malformed `livingdoc.toml` surfaces the raw `smol-toml` message.
- `resolveBackend` resolves the backend file by backend name and framework;
  revisit its missing/duplicate handling once liv-uxrl lands.

## Layout and lifecycle

- `generateProject` is non-recursive: documents in subfolders of `livingdocs`
  are silently skipped.
- Generated test files are named `<doc-basename>.test.ts`, so two documents
  sharing a basename overwrite each other in the `backend` folder (DESIGN 16.3).
- `generateProject` re-walks the config and re-resolves the backend once per
  document.

## Architecture

- The generators live in `@livingdoc/cli` as the `frameworks/` modules; liv-uxrl
  removes the empty `@livingdoc/core` and `@livingdoc/adapter-vitest` stubs.
  "Adapter" is reserved for a future runtime SDK.

## Coverage

- The backend error branches (missing, several) are verified in process only;
  the retired e2e's "no stack trace" check is not replaced, and the dogfood
  misconfigured example asserts the exit code only.
