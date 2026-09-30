---
id: liv-ejez
status: open
deps: []
links: [liv-ty09, liv-otqr, liv-7zw2, liv-du6y]
created: 2026-09-30T02:45:23Z
type: feature
priority: 0
assignee: xiaoyvr
---
# Binding keys: file+anchor, global names, unnamed inline, and bindings check

**As a** documentation author, **I want** document bindings to resolve by
file+anchor or a shared global name, with unnamed inline binds for local demos,
and a CLI that reports missing or unused backend bindings, **so that** lookup is
stable, shareable across docs, and gaps show up before generate/run.

## Acceptance criteria

- **Given** a heading with no `binding:` and no inline bind
  **When** I run `livingdoc generate`
  **Then** the binding is `‹file-relative-to-docs-root›#‹heading-anchor›`

- **Given** `Example (binding: applying-a-discount):`
  **When** I run `livingdoc generate`
  **Then** the generated test uses that global backend key, whatever the
  heading says

- **Given** `Example (binding: checkout.md#applying-a-discount):`
  **When** I run `livingdoc generate`
  **Then** the generated test uses that backend key

- **Given** `Example (backend: web, binding: applying-a-discount):`
  **When** I run `livingdoc generate`
  **Then** the group's cases use that backend and that binding; either key may
  be omitted

- **Given** the positional marker `Example (web):`
  **When** I run `livingdoc generate`
  **Then** it is accepted as `Example (backend: web):` (migration of today's
  form)

- **Given** a heading-level `>>` with `bind(params, run)` (no name)
  **When** the generated test runs
  **Then** cases under that heading use the inline bind and do not look up a
  global key

- **Given** two headings each with an inline bind
  **When** the generated test runs
  **Then** each `describe` uses its own bind with no cross-talk

- **Given** two inline binds under the same heading
  **When** the test loads
  **Then** duplicate binding is an error

- **Given** `livingdoc bindings` (or equivalent)
  **When** a document resolves a binding with no backend bind and no covering
  inline bind
  **Then** it reports the binding as missing

- **Given** a backend bind no document refers to
  **When** the bindings check runs
  **Then** it reports the bind as unused

- **Given** missing or unused bindings
  **When** the check command finishes
  **Then** it exits non-zero

## Design

### Two kinds of bind

| Kind | Where | Name | Visibility |
|---|---|---|---|
| Inline | `>>` under a heading | Unnamed — `bind(params, run)` | That heading's `describe` only |
| Backend | `register(bindings)` | Required string key | Global — every document can use it |

### Binding keys (backend / `Example`)

- **Short** — `applying-a-discount` — shared across documents
- **File+anchor** — `checkout.md#applying-a-discount` — usual default for a
  heading in that file

Path relative to the docs root. `#` ⇒ file+anchor; otherwise ⇒ short name.
Anchor = Markdown heading id (lowercase, dashed).

### Keyed `Example` marker

`Example (backend: web, binding: applying-a-discount):` — either key may be
omitted. The heading still names the `describe`, whatever the binding is.
Migrating the positional marker (`Example (web):`) to the keyed form is in
scope.

### How a group picks its binding

1. `Example (binding: …):` — that key (short or file+anchor), defined on the
   backend
2. Else, inline `bind` under the heading — use it (no global lookup)
3. Else — `‹file›#‹heading-anchor›` on the backend

### Authoring

- Inline: `bind(['code', 'total'], …)` under the heading
- Backend file-default: `bindings.bind('checkout.md#applying-a-discount', …)`
- Backend shared: `bindings.bind('applying-a-discount', …)` +
  `Example (binding: applying-a-discount):`
- `Example (binding: checkout.md#applying-a-discount):` also fine

### Scoping

- One heading → at most one inline bind (duplicate → error)
- Per-`describe` inline binds don't cross-talk
- Nested heading: child wins for its cases
- Heading names `describe` only; `binding:` may diverge
- Inline never keyed as file+anchor, never global
- All backend keys are global

### Check command

`livingdoc bindings` (name flexible) walks docs + backends and reports missing
and unused backend binds; exit non-zero if either is found.

## Open questions

- With no `backend:`, is the first configured backend the default, as the
  unmarked `Example:` is today?

## Notes

- Absorbs liv-otqr (keyed `Example (backend:, binding:):` and positional
  migration).
- Inline `>>` bind API change (drop the name) builds on liv-7zw2 / liv-ty09.
