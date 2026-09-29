---
id: liv-7zw2
status: open
deps: [liv-ty09]
links: [liv-otqr]
created: 2026-09-27T00:00:00Z
type: feature
priority: 2
assignee: xiaoyvr
---
# Append code to the generated test

**As a** documentation author, **I want** to append target-language code to the
generated test, **so that** a small example can define what it needs inside the
document itself.

## Acceptance criteria

- **Given** a document with a `>>` block
  **When** I run `livingdoc generate`
  **Then** the block's statements are inside the generated `describe`, before
  its cases

- **Given** a document with a `>>` block that binds an action, and an `Example:`
  group whose action is that binding
  **When** the generated test runs
  **Then** it calls the binding and passes

- **Given** a document that binds an action twice, or binds one the backend also
  provides
  **When** the generated test runs
  **Then** the duplicate is an error

## Scope

- A fenced block whose info is `<language> >>` — e.g. ```` ```ts >> ```` —
  contributes its content, verbatim, to the generated test.
- Only heading-level blocks: a `>>` block sits under a heading, outside any
  case. There is no bullet-level form.
- With several headings (liv-du6y), a block belongs to the heading it sits under
  and is emitted into that heading's `describe`.
- The block is emitted inside the `describe`, before its cases, so what it
  defines is in scope for them.
- Inline bindings are visible only in that document's generated test; the
  backend's bindings are visible to every document.
- The backend is not replaced — it stays for the system under test; the inline
  form is for simple cases.
- A duplicate action is an error.

## Notes

- `>>` means "append to the test", in the same sigil family as `:=` (input) and
  `!!` (assertion). It is deliberately not `!!`, which means "assert".
- The block's content is verbatim; livingdoc never parses it. `bind(...)` is the
  first use: the generated test creates file-scoped `bindings` from the runtime
  (liv-ty09), with the backend's bindings, and the block binds into them. The
  duplicate rule is the runtime's, so it holds the same way for every document.

  ```ts
  import { createBindings } from '@livingdoc/runtime'
  import { register } from '../backend'

  const bindings = createBindings()
  register(bindings)

  describe("…", () => {
    // the document's >> block, binding into bindings
    bindings.bind('what-a-document-means', { … })
    it("…", () => { … })
  })
  ```

## Open questions

- (none — the runtime (liv-ty09) owns `bindings`, including the duplicate and
  missing-binding rules; the API shape is decided there)
