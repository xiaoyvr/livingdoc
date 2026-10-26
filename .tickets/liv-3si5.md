---
id: liv-3si5
status: open
deps: []
links: [liv-1wj2]
created: 2026-10-19T04:26:24Z
type: feature
priority: 0
assignee: xiaoyvr
tags: [init, scaffold]
---
# livingdoc init: scaffold a backend's folder and index stub

**As a** documentation author, **I want** `livingdoc init` to create a missing
backend folder and an inert backend index from `livingdoc.toml`, **so that** I
have the folder and import target to declare bindings in, without hand-creating
either.

## Acceptance criteria

- **Given** a `livingdoc.toml` declaring `[[backend.vitest]] name = "web"` and
  `code_path = "tests/explain"`
  **When** I run `livingdoc init`
  **Then** `tests/explain/web/backend.ts` is created, it declares no bindings,
  and the command exits zero

- **Given** a backend folder where `backend.ts` exists
  **When** I run `livingdoc init`
  **Then** it is left byte-for-byte untouched, nothing is written for that
  backend, and the command exits zero (re-runnable, safe in a dirty tree)

- **Given** two backends, one with `backend.ts` and one without
  **When** I run `livingdoc init`
  **Then** only the missing one is created and the run reports `created` /
  `exists` per file

- **Given** `[[backend.pytest]] name = "pricing"` and `code_path = "tests/explain"`
  **When** I run `livingdoc init`
  **Then** `tests/explain/pricing/backend.py` is created and declares no bindings

- **Given** a directory with no `livingdoc.toml`
  **When** I run `livingdoc init`
  **Then** it fails with `config-not-found` and writes nothing

## Design

### Ownership: the rule that makes this safe

| path | owner | lifecycle | written by |
|---|---|---|---|
| `code_path/<name>/` | consumer, committed | created once, edited forever | `init` (create-if-missing), the consumer |
| `code_path/<name>/generated/` | livingdoc, disposable | cleared by `generate` | livingdoc |

```
tests/explain/web/
├── backend.ts          # consumer index (init stubs it)
└── generated/          # livingdoc owned, disposable
```

### Config is the source of intent

`init` reads `livingdoc.toml` and materializes what is missing. It does **not**
write `livingdoc.toml` — without a config declaring backends there is nothing
to scaffold, and config stays hand-authored. No defaults, no discovery.

### Why the index is inert

`backend.<ext>` imports `bind` and shows a registration only as a comment;
nothing is registered. The consumer replaces the example with real bindings. A
demo bind would be a binding no document refers to, so the stub stays inert.

## Decisions taken

- **The index is inert** — never a demo binding (see above).
- **`init` never writes `livingdoc.toml`** — config stays hand-authored.
- **`init` never writes into `generated/` or `livingdocs`** — those are
  livingdoc's disposable output and the documents' home respectively.

## Notes

- `generate` already fails with `backend-file-missing` when the index is absent;
  `init` is what creates it.

## Tasks

Realtime list. One slice = red → confirm → green → refactor-on-smell; approval
for one step is not approval for the next.

- [x] **I1 red** — `livingdoc init` in a temp project: config declares
      `[[backend.vitest]] name = "web"`, `code_path = "tests/explain"`; after
      `init`, `tests/explain/web/backend.ts` exists, contains an inert stub,
      and the command exits zero. Red for the right reason: `bin.ts` accepts
      only `generate`.
- [x] **I1 green** — the `init` verb in `bin.ts`, config load, and the write
      of `backend.<ext>`.

- [x] **I2** — pytest extension: `backend.py` is emitted by the
      extension-generic write; the test asserts the file exists, not its
      placeholder content.
- [ ] **I3** — create-if-missing and reporting: an existing `backend.ts` is
      byte-for-byte untouched; the run reports `created` / `exists` per file;
      re-running writes nothing and exits 0.
- [ ] **I4** — no `livingdoc.toml` → `config-not-found`, nothing written.
