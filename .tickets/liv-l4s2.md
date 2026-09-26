---
id: liv-l4s2
status: open
deps: [liv-ter0]
links: []
created: 2026-09-26T23:00:28Z
type: feature
priority: 1
assignee: xiaoyvr
---
# Check livingdoc with livingdoc

**As a** livingdoc maintainer, **I want** livingdoc's own end-to-end behavior
described in a livingdoc document and checked by `livingdoc check`, **so that**
the CLI's e2e coverage is executable documentation that grows with the tool
instead of a bespoke test.

## Acceptance criteria

- **Given** `docs/explain/livingdoc.md` and `tests/explain/livingdoc.backend.ts`
  **When** I run `livingdoc check`
  **Then** the binding drives the built CLI against fixtures and the document's
  exit-code assertions hold, and the check passes

- **Given** the document covers the passing and stale cases that
  `packages/cli/test/check.e2e.test.ts` covers
  **When** the check runs in CI
  **Then** that e2e test file is deleted

- **Given** a clean checkout
  **When** I run `npm run checks`
  **Then** the dogfood check runs after the build and a stale document fails
  the suite

## Implementation tasks

- [ ] 1. Add `livingdoc.toml` with `livingdocs = "docs/explain"` and
      `backend = "tests/explain"`.
- [ ] 2. Write `docs/explain/livingdoc.md` (heading plus passing/stale bullets)
      in the current grammar.
- [ ] 3. Write `tests/explain/livingdoc.backend.ts` driving
      `packages/cli/dist/bin.js` on temp fixtures.
- [ ] 4. Add the `dogfood` script to `checks` and gitignore the generated
      `tests/explain/*.test.ts`.
- [ ] 5. Delete `packages/cli/test/check.e2e.test.ts`.

## Notes

- One document, one heading, two bullets (passing exit 0, stale exit 1),
  current grammar.
- Growth: liv-d7uk, liv-du6y, liv-m0mf, and liv-hu8o each add cases to this
  document.

