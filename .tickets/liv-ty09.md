---
id: liv-ty09
status: open
deps: []
links: [liv-m0mf, liv-hu8o]
created: 2026-09-27T00:00:00Z
type: feature
priority: 0
assignee: xiaoyvr
---
# The livingdoc runtime

**As a** documentation author, **I want** a target-language runtime the generated
test can import, **so that** inline bindings — and later directives and per-case
results — behave consistently.

## Acceptance criteria

- **Given** the runtime
  **When** a generated test creates a bindings registry seeded with the backend's
  bindings
  **Then** that registry is private to that file, and another file's registry is
  independent of it

- **Given** a registry that already has a binding under a name
  **When** a binding is registered under that name again
  **Then** it is a duplicate error

- **Given** a registry with no binding for a name
  **When** that name is looked up
  **Then** the miss is a clear error, not a raw runner error

## Scope

- One story ships the runtime for both target languages: `@livingdoc/runtime`
  (npm) for vitest and its Python sibling. The Python half is exercised by
  liv-f6ao, which depends on this.
- It provides the scoped bindings registry: a factory seeded from the backend's
  bindings, with register and lookup.
- The generated test imports it, so today's codegen — `bindings[<slug>].run(…)`
  and the backend import — moves onto the runtime.

## Out of scope

- Directives (liv-m0mf) and per-case results (liv-hu8o) — they use it later.
- The exact API shape (a factory with methods, a map plus a register, …), decided
  when the story is worked.

## Notes

- Introduces the target-side "runtime SDK" the word *adapter* was reserved for.
- A module-level registry would be shared across every generated file in a run,
  so scoping to one document requires a per-file instance — hence a factory.
- liv-7zw2 (append code / inline bindings) and liv-f6ao (the pytest generator)
  depend on this.
