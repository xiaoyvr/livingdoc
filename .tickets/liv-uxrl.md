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

- **Given** a `livingdoc.toml` whose `livingdocs` folder holds a document and
  whose `[[backend]]` entries each name a `path` and an `adapter`
  **When** I run `livingdoc generate`
  **Then** each backend's bindings are resolved through that adapter

- **Given** a document with an `Example (web):` group and an
  `Example (pricing):` group
  **When** I run `livingdoc generate`
  **Then** each group's cases are written into its backend's folder with that
  adapter's file naming

- **Given** an `Example:` with no marker
  **When** I run `livingdoc generate`
  **Then** it uses the default backend

- **Given** an `Example (unknown):` naming no configured backend
  **When** I run `livingdoc generate`
  **Then** the alias is reported as an error

## Scope

- `livingdoc.toml` gains `[[backend]]` entries: `name`, `path`, `adapter`.
  The adapter is named explicitly, not inferred from the backend file's
  extension — vitest and jest are both `.ts`.
- `Example (name):` marks the backend for a group. `Example:` alone uses the
  default backend: the only backend, or the one named `default`.
- Generation is per (document, backend): a document that touches two backends
  produces two files, each in that backend's folder, named by that adapter.
- The adapter owns its backend filename, generated filename, import, binding
  call, assertion shape, and verb set.
- Realize the boundary this needs and DESIGN §8 has promised: move the token
  model and parser into `@livingdoc/core`, move the vitest codegen into
  `@livingdoc/adapter-vitest`, and register adapters by name. Only `vitest` is
  registered here; this story must not add a second language.
- The flat `livingdocs`/`backend` config stays valid as a single default
  backend whose adapter is `vitest`.

## Out of scope

- A second real adapter (liv-f6ao, pytest).
- Per-case results (liv-hu8o), directives (liv-m0mf), rendering.

## Implementation tasks

- [ ] 1. Config: parse `[[backend]]` (`name`, `path`, `adapter`) alongside the
      flat single-backend form.
- [ ] 2. Adapter boundary: `@livingdoc/core` owns the token model and parser;
      `@livingdoc/adapter-vitest` owns the vitest codegen and its verbs;
      an adapter registry selects by name.
- [ ] 3. The `Example (name):` marker selects the backend for a group.
- [ ] 4. Generation per (document, backend): group cases per backend, one file
      per backend in its folder.
- [ ] 5. An unknown alias is a generate-time error.
- [ ] 6. Docs: DESIGN §6/§13/§14.
