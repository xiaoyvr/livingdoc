---
id: liv-l4s2
status: closed
deps: [liv-ter0, liv-0ou1]
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

- [x] 1. The dogfood check passes (AC1, AC2): add `livingdoc.toml`,
      `docs/explain/livingdoc.md`, and `tests/explain/livingdoc.backend.ts`
      driving the built `packages/cli/dist/bin.js` on temp fixtures. Cover the
      holds and stale cases, plus a misconfigured project so the e2e's error
      path is not lost. Run `livingdoc check` to green.
- [x] 2. Wire and retire (AC3): add the `dogfood` script to `checks`, confirm
      the generated `tests/explain/livingdoc.test.ts` is gitignored, and delete
      `packages/cli/test/check.e2e.test.ts`.

### Notes

- One assertion per bullet is all the grammar offers today, so each example
  asserts the exit code (`outputs.result`).
- The misconfigured example asserts the exit code only; the "no stack trace"
  detail stays a coverage gap (liv-e3r0).
- `tests/explain/livingdoc.backend.ts` is outside `packages/`, so `tsc -b` does
  not typecheck it; the dogfood run is its only check.

