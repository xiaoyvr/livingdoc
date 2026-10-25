---
id: liv-ejez
status: open
deps: [liv-1wj2, liv-3si5]
links: [liv-ty09, liv-otqr, liv-7zw2, liv-du6y, liv-1wj2, liv-j2jx, liv-s5ym, liv-d7uk]
created: 2026-09-30T02:45:23Z
type: feature
priority: 0
assignee: xiaoyvr
---
# Bindings check end to end: collect → resolve → check → emit

**As a** documentation author, **I want** `livingdoc generate` to collect my
backend's real binding names, resolve each document's binding key against them,
and fail on a missing or unused bind, **so that** gaps show up before tests run,
without livingdoc knowing my toolchain.

## Acceptance criteria

### Collecting the manifest

- **Given** a backend entry with `collect = ["uv", "run", "python", "-m",
  "pricing.collect_bindings", "{manifest}"]`
  **When** I run `livingdoc generate`
  **Then** it spawns that command with the config root as cwd and `{manifest}`
  replaced by the absolute `<code_path>/<name>/generated/manifest.json`, reads
  the manifest from that path, never parses stdout, and checks documents
  against it

- **Given** a `collect` array with no `{manifest}`, or an unknown `{…}` token
  **When** I run `livingdoc generate`
  **Then** it fails with `invalid-config` and spawns nothing

- **Given** a collect command that exits non-zero
  **When** I run `livingdoc generate`
  **Then** the error carries the backend, the command, the exit code and a
  stderr tail, and the command exits non-zero

- **Given** a valid manifest left at that path by an earlier run
  **When** the collect command exits zero without writing
  **Then** livingdoc reports `manifest-missing` and exits non-zero — it does
  not reuse the stale file, because it unlinked the path before spawning

- **Given** a collect command that writes a file that is not the manifest
  schema
  **When** I run `livingdoc generate`
  **Then** the error names the backend and the schema problem, and the command
  exits non-zero

- **Given** a backend entry with no `collect` command
  **When** I run `livingdoc generate`
  **Then** that backend is skipped, the other backends are still collected, and
  the command exits zero

- **Given** a backend entry with `manifest = "…json"` instead of `collect`
  **When** I run `livingdoc generate`
  **Then** the manifest is read from that path, with no process spawned; a
  missing path is `manifest-missing` naming that path, and a bad file is
  `manifest-invalid`

- **Given** a backend entry with both `collect` and `manifest`
  **When** I run `livingdoc generate`
  **Then** `collect` wins: the command is spawned, the file at the substituted
  `{manifest}` path is read, and the configured `manifest` file is not read —
  proven by a stale or deliberately wrong `manifest` file whose contents do not
  appear in the manifest used

### Resolving binding keys

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

- **Given** generate’s check pass
  **When** a document resolves a binding with no backend bind and no covering
  inline bind
  **Then** it reports the binding as missing and generate exits non-zero

- **Given** a backend bind no document refers to
  **When** the check runs
  **Then** it reports the bind as unused and exits non-zero

### Dogfood

- **Given** this repository's `livingdoc.toml`, whose backend `collect` points
  at the entrypoint `livingdoc init` emits with `{manifest}`
  **When** `npm run checks` runs
  **Then** collect produces the manifest, the check consumes it, and a binding
  that is missing or unused makes the command exit non-zero

## Design

### One pipeline, from the scaffold to the emitted test

This feature touches every layer the check needs, because none of them is
useful alone:

```
livingdoc init        →  code_path/<name>/backend.<ext>      (liv-3si5)
                      →  code_path/<name>/collect.<ext>       (this feature)
livingdoc generate    →  spawn collect with {manifest}
                      →  read code_path/<name>/generated/manifest.json
                      →  resolve keys → check missing/unused
                      →  emit tests
```

The collector entrypoint is delivered here, by extending `livingdoc init`, not
by the init feature: a collector has no consumer until this pipeline runs.
`init`'s own story stops at the folder and the inert index (liv-3si5).

### The collector entrypoint

The runtime's read side — `collectBindings(): Array<{ name: string; params:
string[] }>` — and the emitted entrypoint are part of this feature, because
the check is what consumes their output. TS `bind(name, params, run)` currently
discards `params` (`registry.set(name, run)`); it must retain them. Python
`_registry` already keeps `(params, run)`, so it needs `collect_bindings()`
only. Duplicates keep erroring.

```ts
// tests/explain/web/collect.ts (emitted)
import { writeFileSync } from "node:fs"
import "./backend.js"
import { collectBindings } from "@livingdoc/runtime"
writeFileSync(
  process.argv[2],
  JSON.stringify({ bindings: collectBindings() }, null, 2),
)
```

The sibling Python collector imports `backend` and writes the same shape to
`sys.argv[1]`. The path is not derived from cwd, the entrypoint's location or
the config: `generate` substitutes it into the `collect` argv as `{manifest}`,
and a direct run passes it by hand.

The spawn target is a committed file under `code_path/<name>/`, never
`generated/`, which `cleanGenerated()` deletes on every run. The manifest it
writes is the opposite: it lives *in* `generated/`, because it is disposable.

### The manifest contract

The manifest is read from a **file the command writes**, not from stdout: a
toolchain command's stdout is noisy and livingdoc does not control it. The
destination is fixed and livingdoc-owned:

```
<code_path>/<name>/generated/manifest.json
```

The destination is fixed and livingdoc-owned; the consumer chooses where in the
argv it appears, using a `{manifest}` token:

```toml
collect = ["npx", "tsx", "tests/explain/web/collect.ts", "{manifest}"]
collect = ["uv", "run", "python", "-m", "pricing.collect_bindings", "{manifest}"]
collect = ["make", "collect", "MANIFEST={manifest}"]     # a make variable, not a target
```

livingdoc replaces every `{manifest}` with the **absolute** path before
spawning. A placeholder rather than a hidden trailing argument because
appending is not universally valid: `npx`, `uv` and `npm run` forward a
trailing positional, but `make collect /abs/path` treats it as another target
and fails. `{manifest}` is **required**; a missing or unknown token is
`invalid-config`, so a command is never spawned without being told where to
write.

`generate` `mkdir`s `generated/` and **unlinks the manifest before spawning**,
so a command that exits zero without writing fails as `manifest-missing`
instead of passing on an earlier run's file. That unlink, not
`cleanGenerated()`, is what guarantees freshness: `generate <file>` cleans only
that document's output, while a full `generate` also removes the whole folder.

cwd stays the config root, not the backend folder: the backend index is
imported by both the collector and the generated tests, and the runner's cwd is
the project root, so one cwd keeps module-level code consistent.

> **Write one JSON document to the path substituted for `{manifest}`.
> stdout/stderr are logs. Exit 0 = success.**

```json
{
  "bindings": [
    { "name": "checkout.md#applying-a-discount", "params": ["code", "total"] },
    { "name": "applying-a-discount", "params": ["code", "total"] }
  ]
}
```

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

Inline `>>` binds are not in the manifest; a heading covered by an inline bind
is not missing.

### Authoring

- Inline: `bind(['code', 'total'], …)` under the heading
- Backend file-default: `bind('checkout.md#applying-a-discount', …)`
- Backend shared: `bind('applying-a-discount', …)` +
  `Example (binding: applying-a-discount):`

### Failure taxonomy (DomainError values, not strings)

| kind | carries |
|---|---|
| `invalid-config` | file, issues (`collect` without `{manifest}`, unknown token) |
| `collect-failed` | backend, command, exit code, stderr tail |
| `manifest-missing` | backend, path |
| `manifest-invalid` | backend, path, schema issue |

`manifest-missing` covers a `collect` that exits zero without writing
(livingdoc unlinked the path first) and a configured `manifest` path that does
not exist.

`binding-missing` / `binding-unused` are this feature's check results, reported
per document/backend.

### Dogfood

The end-to-end proof lives here, not in `init`: this repo's `livingdoc.toml`
points `collect` at the entrypoint `init` emits with `{manifest}`, so
`npm run checks` walks the real scaffold → collect → check → emit path.

## Decisions taken

- **Collection is a stage of `generate`, not a feature of its own** — no
  `livingdoc collect` command. The spawn, the manifest contract and the
  collector entrypoint exist only because the check consumes them.
- **`{manifest}` is a required placeholder in the declared argv** — livingdoc
  substitutes the absolute path; it never appends a hidden positional.
  Rejected: trailing append (breaks `make`), `code_path`-only (needs the
  backend name), env var, entrypoint-relative, config-read.
- **The manifest path is fixed inside `generated/`** — livingdoc owns the
  filename; the manifest is disposable and never committed.
- **livingdoc unlinks the manifest before spawning** — `cleanGenerated()` alone
  is not enough, because `generate <file>` cleans only that document's output.
- **cwd stays the config root** — the backend index runs under the same cwd in
  collect and in the tests.
- **`collect` wins over `manifest`** — `manifest` is the environment-free input
  for pipelines that cannot spawn.
- **No timeout, no `--no-collect`** — no knob until someone is hurt by the
  absence of one.
- **The collector is emitted by `init` but owned here** — the check is its
  consumer; `init`'s own feature stays scaffolding-only.

## Notes

- Depends on liv-1wj2 for `bind` and liv-3si5 for the backend folder and index
  this feature extends.
- Runtime version coupling: the collector must resolve the same
  `@livingdoc/runtime` / `livingdoc_runtime` as the generated tests, or
  `collectBindings` will not exist.
- Open question: with no `backend:`, is the first configured backend the
  default, as the unmarked `Example:` is today?

## Tasks

Realtime list. One slice = red → confirm → green → refactor-on-smell; approval
for one step is not approval for the next. Each slice runs the whole pipeline,
not a layer.

- [ ] **V1 — a missing binding fails generate** *(touches init, runtime,
      collect, check, generate)*: `livingdoc init` emits `collect.ts`;
      `generate` in that project spawns it with `{manifest}`, reads the
      manifest, resolves a heading’s default `‹file›#‹anchor›` key, reports
      `binding-missing`, and exits 1. Minimum manifest handling; no error
      taxonomy, no explicit or inline keys.
- [ ] **V2 — an unused backend bind fails generate** *(touches check,
      generate)*: the same pipeline reports `binding-unused` and exits 1.
- [ ] **V3 — explicit keys** *(touches resolve, generate)*:
      `Example (binding: global)`, `Example (binding: file.md#anchor)`,
      `Example (backend: web, binding: …)` and the positional `Example (web):`.
- [ ] **V4 — inline binds** *(touches resolve, generate)*: heading-level
      `>>` binds, two headings with no cross-talk, duplicate under one heading
      errors.
- [ ] **V5 — collect fails** *(touches collect, generate)*: non-zero exit →
      `collect-failed` with backend, command, exit code, stderr tail; exit 1.
- [ ] **V6 — collect writes nothing** *(touches collect, generate)*: seed a
      stale valid manifest; the unlink means exit 0 without writing is
      `manifest-missing`, not a pass.
- [ ] **V7 — manifest is not the schema** *(touches collect, generate)*:
      `manifest-invalid` naming backend and problem; exit 1.
- [ ] **V8 — bad `{manifest}` token** *(touches config, generate)*: missing or
      unknown token → `invalid-config`, nothing spawned.
- [ ] **V9 — environment-free manifest** *(touches collect, generate)*:
      `manifest = "…json"` is read from disk with no process spawned; a missing
      path is `manifest-missing` and a bad file is `manifest-invalid`.
- [ ] **V10 — collect wins over manifest** *(touches collect, generate)*: with
      both set, the substituted `{manifest}` file is used and the configured
      `manifest` file is not read — a stale or lying file proves it.
- [ ] **V11 — no collect** *(touches collect, generate)*: a backend with
      neither key is skipped, siblings still collect, and the run exits 0.
- [ ] **V12 — dogfood** *(touches init, collect, check, generate)*: this repo's
      config points `collect` at the emitted entrypoint with `{manifest}`, and
      `npm run checks` proves a missing or unused binding fails it.
