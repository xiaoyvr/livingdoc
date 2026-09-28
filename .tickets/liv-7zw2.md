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
  **Then** the block's statements are part of the generated test

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
- Placement follows position: a `>>` block under a heading, outside any case, is
  appended at the top of the generated file, before the `describe`; a `>>` block
  inside a bullet is appended inside that case, in order with its assertions.
- Inline bindings are visible only in that document's generated test; the
  backend's bindings are visible to every document.
- The backend is not replaced — it stays for the system under test; the inline
  form is for simple cases.
- A duplicate action is an error.

## Notes

- `>>` means "append to the test", in the same sigil family as `:=` (input) and
  `!!` (assertion). It is deliberately not `!!`, which means "assert".
- The block's content is verbatim; livingdoc never parses it. The `bind(...)`
  idiom works because the generated test declares a mutable `bindings` seeded
  from the backend and a `bind(name, binding)` that throws on a duplicate:

  ```ts
  import { bindings as backend } from '../backend'
  const bindings = { ...backend }
  function bind(name, binding) {
    if (name in bindings) throw new Error(`duplicate binding: ${name}`)
    bindings[name] = binding
  }
  ```

## Open questions

- Whether several `Example:` groups in one document share a heading-level block,
  or each group needs its own.
- Is the emitted `bind`/`bindings` scaffold the start of the "runtime SDK" the
  word *adapter* was reserved for?
