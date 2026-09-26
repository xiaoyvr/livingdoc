---
id: liv-ybyq
status: open
deps: [liv-frgb]
links: []
created: 2026-09-26T03:21:48Z
type: feature
priority: 1
assignee: xiaoyvr
---
# One real assertion against a binding

**As a** documentation author, **I want** to state an expected result in the
document, **so that** the document verifies real behavior and goes red when the
behavior changes.

## Acceptance criteria

- **Given** a document whose heading selects a binding and that asserts an
  expected result
  **When** I run `livingdoc check`
  **Then** the check runs the binding and asserts its result

- **Given** the binding's result no longer matches the document's expectation
  **When** I run `livingdoc check`
  **Then** the check fails and the command exits non-zero

## Implementation tasks

- [x] 0. Rename `operation` to `binding` across the design and tickets (docs
      only; no code references it yet).
- [x] 1. The heading selects and runs the binding: the check imports `bindings`
      from `./livingdoc.backend` and calls `bindings[<heading-slug>].run(...)`
      with the bound inputs.
- [x] 2. The document asserts the binding's result: `{{ toBe <expr> }}`
      generates `expect(outputs.result).toBe(<expr>)`.
- [ ] 3. A stale expectation fails the check and the command exits non-zero.

### Notes

- The backend path is a convention, `./livingdoc.backend` beside the document;
  configuration (`livingdoc.toml`) is out of scope (liv-53z4), so the binding's
  `params` are not validated yet.
- Only the primary-result, verb-first assertion is in scope; middle-form
  assertions, directives, and multiple validated inputs are liv-m0mf / liv-d7uk.

