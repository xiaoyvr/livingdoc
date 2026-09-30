---
id: liv-otqr
status: open
deps: []
links: [liv-7zw2, liv-ty09, liv-ejez]
created: 2026-09-27T00:00:00Z
type: feature
priority: 2
assignee: xiaoyvr
---
# Register the binding on the example group

**As a** documentation author, **I want** to name the binding a group targets,
**so that** the document's lookup does not change when I reword the heading.

## Acceptance criteria

- **Given** a document whose `Example:` group names a binding
  **When** I run `livingdoc generate`
  **Then** the generated test calls `bindings[<named binding>]`, whatever the
  heading says

- **Given** an `Example:` group that names no binding
  **When** I run `livingdoc generate`
  **Then** the binding is the heading's slug, as today

## Scope

- The `Example:` marker is keyed —
  `Example (backend: web, binding: applying-a-discount):` — and either key may be
  omitted.
- With no `binding:`, the heading's slug is the binding (today's behavior).
- The heading still names the `describe`, whatever the binding is.
- Migrating the existing positional marker (`Example (web):`) to the keyed form
  is part of this story.

## Open questions

- With no `backend:`, is the first configured backend the default, as the
  unmarked `Example:` is today?
