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

**As a** documentation author, **I want** to name each system under test and
mark which one an example group targets, **so that** one document can explain
and exercise several systems.

## Acceptance criteria

- **Given** a `livingdoc.toml` with a `livingdocs` folder, a top-level
  `backend_path`, and `[[backend]]` entries that each name an `adapter`
  **When** I run `livingdoc generate`
  **Then** each backend's folder is `<backend_path>/<name>` and its bindings are
  resolved through that adapter

- **Given** a document with an `Example (web):` group and an
  `Example (pricing):` group
  **When** I run `livingdoc generate`
  **Then** each group's cases are written into its backend's folder with that
  adapter's file naming

- **Given** an `Example:` with no marker
  **When** I run `livingdoc generate`
  **Then** it uses the first configured backend

- **Given** an `Example (unknown):` naming no configured backend
  **When** I run `livingdoc generate`
  **Then** the alias is reported as an error

## Config

```toml
livingdocs   = "docs/explain"
backend_path = "tests"

[[backend]]
name    = "web"
adapter = "vitest"     # folder: tests/web

[[backend]]
name    = "pricing"
adapter = "pytest"     # folder: tests/pricing
```

- `backend_path` is the single root; a backend's folder is
  `<backend_path>/<name>`.
- The adapter is named explicitly, not inferred from the backend file's
  extension — vitest and jest are both `.ts`.
- There is no flat form: a single backend is still a `[[backend]]` entry.
  `Example:` with no marker uses the first configured backend.

## Scope

- `Example (name):` marks the backend for a group.
- Generation is per (document, backend): a document that touches two backends
  produces two files, each in that backend's folder, named by that adapter.
- The adapter owns its backend filename, generated filename, import, binding
  call, assertion shape, and verb set.
- Realize the boundary DESIGN §8 promised: move the token model and parser into
  `@livingdoc/core`, move the vitest codegen into `@livingdoc/adapter-vitest`,
  and register adapters by name. Only `vitest` is registered here; this story
  must not add a second language.
- Migrate this repository's own `livingdoc.toml` to the new shape (one
  `[[backend]]` for `tests/explain`).

## Out of scope

- A second real adapter (liv-f6ao, pytest).
- Per-case results (liv-hu8o), directives (liv-m0mf), rendering.

## Implementation tasks

- [ ] 1. Config: parse the top-level `backend_path` plus `[[backend]]`
      (`name`, `adapter`).
- [ ] 2. Adapter boundary: `@livingdoc/core` owns the token model and parser;
      `@livingdoc/adapter-vitest` owns the vitest codegen and its verbs; an
      adapter registry selects by name.
- [ ] 3. The `Example (name):` marker selects the backend for a group.
- [ ] 4. Generation per (document, backend): group cases per backend, one file
      per backend in `<backend_path>/<name>`.
- [ ] 5. An unknown alias is a generate-time error.
- [ ] 6. Migrate the repository's `livingdoc.toml`, then docs: DESIGN
      §6/§13/§14.
