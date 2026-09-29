---
id: liv-ty09
status: in_progress
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
  **When** a generated test creates `bindings` with the backend's bindings
  **Then** those `bindings` are private to that file, and another file's
  `bindings` are independent of them

- **Given** `bindings` that already have a binding under a name
  **When** a binding is bound under that name again
  **Then** it is a duplicate error

- **Given** `bindings` with no binding for a name
  **When** that name is used
  **Then** the miss is a clear error, not a raw runner error

## Scope

- One story ships the runtime for both target languages: `@livingdoc/runtime`
  (npm) for vitest and its Python sibling. The Python half is exercised by
  liv-f6ao, which depends on this.
- It provides file-scoped `bindings`: a factory that creates them with the
  backend's bindings, and lets the test bind more names and use them.
- The generated test imports it, so today's codegen — `bindings[<slug>].run(…)`
  and the backend import — moves onto the runtime.

## Out of scope

- Directives (liv-m0mf) and per-case results (liv-hu8o) — they use it later.
- The exact API shape (a factory with methods, a map plus a bind, …), decided
  when the story is worked.

## Notes

- Introduces the target-side "runtime SDK" the word *adapter* was reserved for.
- Module-level `bindings` would be shared across every generated file in a run,
  so scoping to one document requires a per-file instance — hence a factory.
- liv-7zw2 (append code / inline bindings) and liv-f6ao (the pytest generator)
  depend on this.

## Implementation tasks

Vertical slices (each delivers a usable path, not a layer):

- [x] 1. **Vitest codegen uses file-scoped bindings**

      Scenarios:

      - [x] **A case can use a backend binding.** Given `bindings` created with the
        backend's bindings, when a case uses a known binding name, then that
        binding runs and returns its outputs.
      - [x] **One file's bindings do not affect another's.** Given two `bindings`
        created with the same backend bindings, when one binds a new name, then
        the other does not have that name.
      - [x] **Generate gives each file its own bindings.** Given an opted-in
        document with a case, when `livingdoc generate` runs, then the
        generated test creates its own `bindings` with the backend's bindings
        and runs the case through them; existing checks still pass.

- [ ] 2. **Duplicate bind fails clearly**
      Binding a name already in `bindings` (from the backend's bindings or a
      prior bind) is a livingdoc duplicate error. Unblocks liv-7zw2's
      `bind(...)`.

- [ ] 3. **Unknown binding name fails clearly**
      Using a name that is not in `bindings` is a livingdoc miss error, not a
      raw runner/`undefined` failure.

- [ ] 4. **Python sibling mirrors the same three behaviors**
      Same create / bind / use / errors, importable by the future pytest
      generator (liv-f6ao).

### Notes

- API shape is decided in task 1; later stories follow it.
- Directives and per-case results stay out of scope.
