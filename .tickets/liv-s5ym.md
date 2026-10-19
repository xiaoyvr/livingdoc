---
id: liv-s5ym
status: open
deps: []
links: [liv-ejez, liv-d7uk, liv-1wj2, liv-ty09, liv-3si5]
created: 2026-10-19T03:36:27Z
type: feature
priority: 0
tags: [collect, manifest, runtime, cli]
---
# configured collect command produces the backend manifest for generate

**As a** documentation author, **I want** `livingdoc generate` to run a command
I declare in `livingdoc.toml` and read the backend's bindings back as a
manifest, **so that** generate can check and optimise against real binding
names without livingdoc assuming anything about my toolchain.

## Acceptance criteria

- **Given** a backend entry with `collect = ["uv", "run", "python", "-m",
  "pricing.collect_bindings"]`
  **When** I run `livingdoc generate`
  **Then** livingdoc spawns that command with the config root as cwd, parses
  its stdout as the manifest, and produces it as the value liv-ejez's check
  stage consumes — never through a file

- **Given** a backend entry with no `collect` command
  **When** I run `livingdoc generate`
  **Then** that backend is skipped, the other backends are still collected, and
  the command exits zero

- **Given** a collect command that exits non-zero
  **When** I run `livingdoc generate`
  **Then** the error carries the backend, the command, the exit code and a
  stderr tail, and the command exits non-zero

- **Given** a collect command whose stdout is not the manifest schema
  **When** I run `livingdoc generate`
  **Then** the error names the backend and the schema problem, and the command
  exits non-zero

- **Given** a backend entry with `manifest = "…json"` instead of `collect`
  **When** I run `livingdoc generate`
  **Then** the manifest is read from that path, with no process spawned

- **Given** a backend entry with both `collect` and `manifest`
  **When** I run `livingdoc generate`
  **Then** `collect` wins: the command is spawned and the file on disk is not
  read — proven at the collect boundary, by a stale or deliberately wrong file
  whose contents do not appear in the manifest produced

- **Given** the collect stage
  **When** a document's binding names are checked
  **Then** the manifest is available to that check unchanged — the check itself
  (`binding-missing` / `binding-unused`) is owned by liv-ejez and is not an
  acceptance criterion here

## Tasks

Realtime list. One slice = red → confirm → green → refactor-on-smell; approval
for one step is not approval for the next.

- [x] **S0** environment — restore `node_modules` (`npm ci`); note:
      `esbuild` postinstall is blocked by `allowScripts`, vitest still runs

- [x] **S1 red** — `packages/cli/test/collect.test.ts`: config declares
      `collect = [argv]`; `generate` spawns it with the config root as cwd and
      still exits ok. Red for the right reason: `collect` is parsed nowhere, so
      nothing spawns and the cwd marker is never written. *(written 2026-10-19,
      awaiting review)*
- [ ] **S1 green** — `collect` on the config backend entry + spawn at the config
      root. Minimum to pass; no failure handling, no schema, no `manifest`.

- [ ] **S2** — collect command exits non-zero → `collect-failed` carrying
      backend, command, exit code, stderr tail; CLI exit 1.
- [ ] **S3** — stdout is not the manifest schema → `manifest-invalid` naming
      backend + problem, exit 1.
- [ ] **S4** — `manifest = "…json"`, no `collect` → read from disk, nothing
      spawned; bad file → `manifest-invalid` naming the path.
- [ ] **S5** — `collect` wins over `manifest`, asserted at the collect
      boundary: with a stale/lying file on disk, the manifest returned is the
      command's stdout. Nothing spawns for `manifest` when `collect` is set.
- [ ] **S6** — backend with neither key → skipped, exit 0, siblings still
      collected.
- [ ] **S7** — hand the in-memory manifest to the check stage boundary that
      liv-ejez builds on (no key resolution here).
- [x] ~~**S8** dogfood against the entrypoint `init` emits~~ — **moved to
      liv-3si5**, where the entrypoint exists to be pointed at. Keeping it here
      made this P0 wait on a P1 that itself only exists for this step.

**Deferred, decided:** no timeout knob, no `--no-collect`, no `livingdoc collect`
command, no manifest file (see Decisions taken).

## Design

### Why a configured command

livingdoc cannot know the consumer's toolchain — `npm`/`yarn`/`npx`, `uv`/
`pip`/`poetry`, a Make target — and must not guess. The consumer declares the
command in `livingdoc.toml`; livingdoc spawns exactly what is declared. No
defaults, no discovery, no runner assumptions.

This is the one place livingdoc executes consumer code. DESIGN.md §2/§14 said it
"never runs" / "never spawns the runner"; amended to: it never spawns the
**test** runner, but may spawn the **configured collect command**. Same trust
model as `npm run` / `pre-commit`.

### No manifest file, no `collect` command

The manifest is a **wire value, not an artifact**. `generate` spawns, parses
stdout, and passes the parsed manifest straight to resolve → check → emit. It
never writes a manifest file and never reads one back, which removes the
write/read round-trip, the `manifest-missing` failure kind, and any question
about whether the file is what this run actually used.

There is therefore no `livingdoc collect` command: collection is an internal
stage of `generate`. A consumer who wants the manifest on disk runs their own
command (`npx tsx tests/explain/web/collect.ts > bindings.json`) and points
`manifest` at the result; `manifest` remains as the environment-free input for
pipelines that cannot run the toolchain.

### Config

Per backend, because each backend has its own toolchain:

```toml
[[backend.vitest]]
name = "web"
collect = ["npx", "tsx", "tests/explain/web/collect.ts"]

[[backend.pytest]]
name = "pricing"
collect = ["uv", "run", "python", "-m", "pricing.collect_bindings"]
# or, for pipelines that can't run the toolchain:
# manifest = "tests/explain/pricing/bindings.json"
```

- `collect` is an **array**, not a shell string — no shell parsing, no quoting
  or Windows differences.
- `cwd` is the `livingdoc.toml` root, so `uv` finds `pyproject.toml` and
  relative paths are stable.
- `collect` wins over `manifest`. `manifest` is the explicitly
  environment-free path.

### Contract

> **stdout = one JSON document. stderr = logs. Exit 0 = success.**

```json
{
  "bindings": [
    { "name": "checkout.md#applying-a-discount", "params": ["code", "total"] },
    { "name": "applying-a-discount", "params": ["code", "total"] }
  ]
}
```

livingdoc validates this against the schema, then feeds it to resolve → check
→ emit. The `collect.ts` entrypoint `livingdoc init` emits (liv-3si5) is the
reference implementation of the contract, so a hand-written collector only has
to match it.

### Pipeline

```
livingdoc generate [file]  → collect (per backend: spawn `collect`, else read
                             `manifest`, else skip)
                           → resolve keys → check → emit tests
```

Freshness comes from collecting on every `generate` — there is no manifest file
to be stale, and no fingerprint or lockfile.

### Runtime collector

The runtime's read side — `collectBindings(): Array<{ name: string; params:
string[] }>` — and the entrypoint that calls it are owned by **liv-3si5**; this
ticket only consumes their output. Note the ordering constraint that decision
created: the spawn target is a committed file under `code_path/<name>/`, never
`generated/`, which `cleanGenerated()` deletes on every run.

### Failure taxonomy (DomainError values, not strings)

| kind | carries |
|---|---|
| `collect-failed` | backend, command, exit code, stderr tail |
| `manifest-invalid` | backend, path, schema issue |

`manifest-missing` is dropped with the manifest file; a configured `manifest`
path that does not exist is reported against that path.

`binding-missing` / `binding-unused` stay in liv-ejez — this ticket only
produces and validates the manifest.

## Decisions taken

- **No manifest file, no `livingdoc collect` command** — the manifest is a wire
  value passed in memory; a pipeline that cannot run the toolchain points
  `manifest` at a file its own tooling produced.
- **`collect` is strictly per backend** — toolchains differ per backend, so one
  sibling of `code_path` would not serve two backends.
- **No timeout for now** — no knob until someone is hurt by the absence of one.
- **No `--no-collect`** — `manifest` already covers the environment that cannot
  spawn.

## Notes

- Extracted from liv-ejez, which had "load backend → manifest" as an opaque
  first step. This ticket owns the mechanism; liv-ejez owns key resolution and
  the missing/unused check and now depends on this.
- Resolves liv-d7uk's open question ("getting `params` without running the
  backend"): the consumer's own command produces it.
- Runtime version coupling: the collector must resolve the same
  `@livingdoc/runtime` / `livingdoc_runtime` as the generated tests, or
  `collectBindings` will not exist.
- The old command names `livingdoc bindings` and `livingdoc collect` are both
  dropped: collection is a stage of `generate`, not a command.
- The `collect`/`manifest` config keys and the entrypoint that prints the
  manifest are split out into liv-3si5 (`livingdoc init`) and the runtime read
  side it drives. liv-3si5 does **not** depend on this ticket and can land
  first — see the ordering note: it repairs `bind`, which currently discards
  `params`, the very field the manifest contract carries.
- 2026-10-19 scan: this ticket's boundary with liv-ejez is "the manifest value
  is produced". Anything observable only because a consumer reads the manifest
  belongs to liv-ejez.

## Linked

- liv-ejez [open] Binding keys: file+anchor, global names, unnamed inline, and bindings check
- liv-d7uk [open] Validating input names against the binding
- liv-1wj2 [closed] Backend binds: module-level `bind` / `run` behind one index
- liv-ty09 [closed] The livingdoc runtime
