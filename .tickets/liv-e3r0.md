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

- A missing `livingdoc.toml` is reported as `invalid-config` with
  `issues: ['not found']`; a distinct `config-not-found` kind would read better.
- `resolveBackend` casts `config.backends[0] as Backend`, because the non-empty
  guarantee is not in the type; a `defaultBackend` field or a `[Backend,
  ...Backend[]]` tuple would remove it.

## Coverage

- `bin` itself is untested: the Result-to-message path and the exit code are not
  driven through the built command, and `document-missing` has no test.
