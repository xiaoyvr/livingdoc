---
id: liv-e3r0
status: closed
deps: []
links: []
created: 2026-09-26T22:27:13Z
type: task
priority: 3
assignee: xiaoyvr
---
# Tech debt from the reviews

Deferred findings from the liv-ybyq, liv-ter0, and liv-uxrl reviews.

## Ready

- **`config-not-found` kind.** A missing `livingdoc.toml` is reported as
  `invalid-config` with `issues: ['not found']`; a distinct kind carrying the
  path reads better.
- **Non-empty `backends`.** `resolveBackend` casts `config.backends[0] as
  Backend` because the non-empty guarantee is not in the type; express it as
  `[Backend, ...Backend[]]` or a `defaultBackend` field.
- **`document-missing` coverage.** `generate(<missing path>)` returns
  `document-missing`, but no test drives it.
- **`bin` coverage.** The Result-to-message path and exit code are not driven
  through the built command.

## Owned elsewhere / blocked

- Generated `it` title keeps the raw assertion text (e.g. `toBe 90`), and a
  fenced input echoes its name into the title; revisit once rendering
  (DESIGN §16.5) defines how tokens are shown.
- Assertion verbs are not validated against a closed vocabulary; an unknown
  verb or the middle form ``!!`"x" toBe true` `` emits invalid generated code.
  liv-m0mf owns this.
- A heading naming no binding: the runtime now says `unknown binding: <slug>`;
  the generate-time "no binding" check is liv-ejez's missing-binding pass.

## Implementation tasks

- [x] 1. **`config-not-found` kind**
- [x] 2. **Non-empty `backends`; drop the `as Backend` cast**
- [x] 3. **`document-missing` test**
- [x] 4. **`bin` end-to-end test**
