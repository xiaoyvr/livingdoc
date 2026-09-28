---
id: liv-7zw2
status: open
deps: []
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
  first use, and the generated test provides the scaffold at module scope — a
  mutable `bindings` seeded from the backend, and a `bind(name, binding)` that
  throws on a duplicate — with the import renamed to `bindings as backend`:

  ```ts
  import { bindings as backend } from '../backend'

  const bindings = { ...backend }
  function bind(name, binding) {
    if (name in bindings) throw new Error(`duplicate binding: ${name}`)
    bindings[name] = binding
  }

  describe("…", () => {
    bind('what-a-document-means', { … })
    it("…", () => { … })
  })
  ```

## Open questions

- Several headings (liv-du6y): a heading-level block belongs to its heading's
  `describe`; whether one block can serve several groups stays open.
- Is the emitted `bind`/`bindings` scaffold the start of the "runtime SDK" the
  word *adapter* was reserved for?
