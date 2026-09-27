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

- [ ] 1. Config: parse `code_path` and `[[backend.<framework>]]` (`name`).
- [ ] 2. `frameworks/` registry keyed by framework name, with `vitest`.
- [ ] 3. The `Example (name):` marker selects the backend for a group.
- [ ] 4. Generation per (document, backend): `<code_path>/<name>/backend.<ext>`
      and one generated file per backend in `<code_path>/<name>`.
- [ ] 5. Unknown framework and unknown alias are generate-time errors.
- [ ] 6. Migrate the repository's `livingdoc.toml`, then DESIGN §6/§13/§14.
