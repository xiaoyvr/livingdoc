---
id: liv-otqr
status: open
deps: []
links: [liv-7zw2]
created: 2026-09-27T00:00:00Z
type: feature
priority: 2
assignee: xiaoyvr
---
# Register the action on the example group

**As a** documentation author, **I want** to name the action a group targets,
**so that** the document's lookup does not change when I reword the heading.

## Acceptance criteria

- **Given** a document whose `Example:` group names an action
  **When** I run `livingdoc generate`
  **Then** the generated test calls `bindings[<named action>]`, whatever the
  heading says

- **Given** an `Example:` group that names no action
  **When** I run `livingdoc generate`
  **Then** the action is the heading's slug, as today

## Scope

- The `Example:` marker is keyed —
  `Example (backend: web, action: applying-a-discount):` — and either key may be
  omitted.
- With no `action:`, the heading's slug is the action (today's behavior).
- The heading still names the `describe`, whatever the action is.
- Migrating the existing positional marker (`Example (web):`) to the keyed form
  is part of this story.

## Open questions

- With no `backend:`, is the first configured backend the default, as the
  unmarked `Example:` is today?
