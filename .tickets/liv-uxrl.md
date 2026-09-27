---
id: liv-uxrl
status: open
deps: []
links: []
created: 2026-09-27T05:00:00Z
type: feature
priority: 0
assignee: xiaoyvr
---
# Multiple backends in one document

**As a** documentation author, **I want** to name each backend and mark which
one an `Example:` group targets, **so that** one document can explain and
exercise several systems.

## Acceptance criteria

- **Given** a `livingdoc.toml` with `livingdocs` and `code_path`, and
  `[[backend.<framework>]]` entries naming each backend
  **When** I run `livingdoc generate`
  **Then** each backend's folder is `<code_path>/<name>` and its bindings are
  resolved with that framework

- **Given** a document with an `Example (web):` group and an
  `Example (pricing):` group
  **When** I run `livingdoc generate`
  **Then** each group's cases are written into its backend's folder with that
  framework's file naming

- **Given** an `Example:` with no marker
  **When** I run `livingdoc generate`
  **Then** it uses the first configured backend

- **Given** an `Example (unknown):` naming no configured backend
  **When** I run `livingdoc generate`
  **Then** the alias is reported as an error

## Config

```toml
livingdocs = "docs/explain"
code_path  = "tests/explain"

[[backend.vitest]]
name = "web"

[[backend.vitest]]
name = "admin"

[[backend.pytest]]
name = "pricing"
```

- The table key is the **framework** — the language and its test runner. Every
  backend under it uses that framework, so two backends can share `vitest`.
- A backend's folder is `<code_path>/<name>` and its backend file is
  `backend.<ext>`. The framework is not part of the path.
- A backend may be named after its framework; this repository's backend is
  `[[backend.vitest]]` named `vitest`.
- `Example:` with no marker uses the first configured backend.

## Vocabulary

- **backend** — a named system under test with one framework (`web`, `pricing`).
- **framework** — the language and test runner (`vitest`, `pytest`, `jest`).
- **adapter** — reserved for a future runtime SDK that generated code would
  import; not used in this story.

## Scope

- `Example (name):` marks the backend for a group.
- Generation is per (document, backend): a document that touches two backends
  produces two files, each in that backend's folder, named by its framework.
- The framework owns the backend file extension, the generated filename, the
  import, the binding call, the assertion shape, and the verbs.
- Keep it a modular monolith: `packages/cli/src/document.ts` (parsing and token
  model), `packages/cli/src/frameworks/<name>.ts` (one generator per framework),
  `packages/cli/src/frameworks/index.ts` (the registry). No new packages. Only
  `vitest` is registered here; this story must not add a second framework.
- Migrate this repository's own `livingdoc.toml`.

## Out of scope

- A second framework (liv-f6ao, pytest), per-case results (liv-hu8o), directives
  (liv-m0mf), rendering.

## Implementation tasks

- [x] 1. One named backend generates its test file, end to end. A
      `livingdoc.toml` with `code_path` and one `[[backend.vitest]] name = "…"`:
      `generate` resolves `<code_path>/<name>`, the framework's `backend.ts`, and
      writes `<code_path>/<name>/<doc>.test.ts` importing `./backend`. The vitest
      codegen moves to `frameworks/vitest.ts` behind a registry, and an
      unregistered framework errors. Migrates the repo config and the dogfood.
- [x] 2. A document addresses several backends, end to end. `Example (web):` and
      `Example (pricing):` groups: each group's cases are written into that
      backend's file, a bare `Example:` uses the first backend, and an unknown
      alias errors. One document produces two files.
- [ ] 3. Remove the empty `@livingdoc/core` / `@livingdoc/adapter-vitest`
      packages (the generators live in the CLI), refresh the README layout, and
      verify DESIGN §6/§8/§9/§13/§14.
