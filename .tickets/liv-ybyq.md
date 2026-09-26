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
- [x] 3. A stale expectation fails the check and the command exits non-zero.
- [x] 4. New token grammar from review: an input is `<name> {{ <expr> }}` where
      the name is the word before the token; an assertion is `{{! <verb> <args> }}`.
      Everything inside the braces is verbatim, and `!` alone distinguishes an
      assertion, so no colon is lexed.
- [x] 5. Emit every assertion in a bullet; none are silently dropped.
- [x] 6. Import the backend only when the document has `Example:` bullets, so a
      document with no cases fails from vitest's no-test rule, not a missing
      backend. No synthetic empty case is generated.
- [x] 7. Update DESIGN.md for the new grammar and for the `it` title keeping raw
      assertion text until rendering lands.

### Notes

- The backend path is a convention, `./livingdoc.backend` beside the document;
  configuration (`livingdoc.toml`) is out of scope (liv-53z4), so the binding's
  `params` are not validated yet.
- Only the primary-result, verb-first assertion is in scope; middle-form
  assertions, directives, and multiple validated inputs are liv-m0mf / liv-d7uk.
- Reopened after review: tasks 4-6 fix defects found in the delivered
  implementation; task 7 records the deferred title behavior.

