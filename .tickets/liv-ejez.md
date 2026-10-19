---
id: liv-ejez
status: open
deps: [liv-1wj2, liv-s5ym]
links: [liv-ty09, liv-otqr, liv-7zw2, liv-du6y, liv-1wj2, liv-j2jx, liv-s5ym]
created: 2026-09-30T02:45:23Z
type: feature
priority: 0
assignee: xiaoyvr
---
# Binding keys: file+anchor, global names, unnamed inline, and bindings check

**As a** documentation author, **I want** document bindings to resolve by
file+anchor or a shared global name, with unnamed inline binds for local demos,
and generate to check → emit against the collected manifest using that model,
**so that** lookup is stable, shareable across docs, and gaps show up before
tests run.

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

- **Given** generate’s check pass (or `livingdoc collect`)
  **When** a document resolves a binding with no backend bind and no covering
  inline bind
  **Then** it reports the binding as missing and generate exits non-zero

- **Given** a backend bind no document refers to
  **When** the check runs
  **Then** it reports the bind as unused and exits non-zero

## Design

### Pipeline (manifest from liv-s5ym)

```
manifest ← livingdoc collect (liv-s5ym)
       ↓
resolve each group’s binding key (rules below)
       ↓
check missing / unused → fail closed
       ↓
emit (docs)
```

Inline `>>` binds are not in the manifest; a heading covered by inline bind is
not missing.

The manifest's production — the configured `collect` command, its JSON contract
and its error kinds — is owned by liv-s5ym. This ticket consumes it as an
input.

### Two kinds of bind

| Kind | Where | Name | Visibility |
|---|---|---|---|
| Inline | `>>` under a heading | Unnamed — `bind(params, run)` | That heading's `describe` only |
| Backend | `bind(...)` in backend modules | Required string key | Global |

### Binding keys

- **Short** — `applying-a-discount` — shared across documents
- **File+anchor** — `checkout.md#applying-a-discount` — default for a heading

Path relative to the docs root. `#` ⇒ file+anchor; otherwise ⇒ short name.
Anchor = Markdown heading id (lowercase, dashed).

### Keyed `Example` marker

`Example (backend: web, binding: applying-a-discount):` — either key may be
omitted. Heading names `describe`. Positional `Example (web):` →
`Example (backend: web):`.

### How a group picks its binding

1. `Example (binding: …):` — that key on the backend
2. Else, inline `bind` under the heading — local overlay
3. Else — `‹file›#‹heading-anchor›` on the backend

### Authoring

- Inline: `bind(['code', 'total'], …)` under the heading
- Backend file-default: `bind('checkout.md#applying-a-discount', …)`
- Backend shared: `bind('applying-a-discount', …)` +
  `Example (binding: applying-a-discount):`

## Open questions

- With no `backend:`, is the first configured backend the default, as the
  unmarked `Example:` is today?

## Notes

- Absorbs liv-otqr. Depends on liv-1wj2 for `bind` and on liv-s5ym for the
  manifest (`livingdoc collect`) that the check and codegen consume.
- Extracted: backend manifest production moved to liv-s5ym; the old
  `livingdoc bindings` command is now `livingdoc collect`.
