---
id: liv-s5ym
status: open
deps: []
links: [liv-ejez, liv-d7uk, liv-1wj2, liv-ty09]
created: 2026-10-19T03:36:27Z
type: feature
priority: 0
tags: [collect, manifest, runtime, cli]
---
# livingdoc collect: configured collect command emits the backend manifest

**As a** documentation author, **I want** `livingdoc collect` to run a command
I declare in `livingdoc.toml` and read the backend's bindings back as a
manifest, **so that** generate can check and optimise against real binding
names without livingdoc assuming anything about my toolchain.

## Acceptance criteria

- **Given** a backend entry with `collect = ["uv", "run", "python", "-m",
  "pricing.collect_bindings"]`
  **When** I run `livingdoc collect`
  **Then** livingdoc spawns that command with the config root as cwd, parses
  its stdout as the manifest, and writes it to the backend's `generated/`
  folder

- **Given** a backend entry with no `collect` command
  **When** I run `livingdoc collect`
  **Then** that backend is skipped and the command exits zero for the rest

- **Given** a collect command that exits non-zero
  **When** I run `livingdoc collect`
  **Then** the error carries the backend, the command, the exit code and a
  stderr tail, and the command exits non-zero

- **Given** a collect command whose stdout is not the manifest schema
  **When** I run `livingdoc collect`
  **Then** the error names the backend and the schema problem, and the command
  exits non-zero

- **Given** a backend entry with `manifest = "…json"` instead of `collect`
  **When** I run `livingdoc collect` or `livingdoc generate`
  **Then** the manifest is read from that path, with no process spawned

- **Given** a manifest on disk and a matching `collect` command
  **When** I run `livingdoc generate`
  **Then** generate collects first (spawns), so the manifest it checks is never
  stale; `collect` wins over `manifest` when both are set

- **Given** the runtime
  **When** a collector imports the backend index
  **Then** `collectBindings()` returns `{ name, params }` for every
  `bind(name, params, run)` call, and a duplicate name is still an error

- **Given** a generated collect entrypoint for a backend
  **When** the consumer runs it with their own tooling
  **Then** it prints the manifest to stdout, so the `collect` command may point
  at it instead of emitted tests

## Design

### Why a configured command

livingdoc cannot know the consumer's toolchain — `npm`/`yarn`/`npx`, `uv`/
`pip`/`poetry`, a Make target — and must not guess. The consumer declares the
command in `livingdoc.toml`; livingdoc spawns exactly what is declared. No
defaults, no discovery, no runner assumptions.

This is the one place livingdoc executes consumer code. DESIGN.md §2/§14 say it
"never runs" / "never spawns the runner"; amend to: it never spawns the **test**
runner, but may spawn the **configured collect command**. Same trust model as
`npm run` / `pre-commit`.

### Config

Per backend, because each backend has its own toolchain:

```toml
[[backend.vitest]]
name = "web"
collect = ["npx", "tsx", "tests/explain/web/generated/bindings.ts"]

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
→ emit. The generated entrypoint is the reference implementation of the
contract, so a hand-written collector only has to match it.

### Pipeline

```
livingdoc collect          → spawn collect (per backend) → write generated/bindings.json
livingdoc generate [file]  → collect (spawn if configured, else read manifest)
                             → resolve keys → check → emit tests
```

Both entry points share one collect stage; `collect` is "collect without
emitting tests". The manifest is written into the backend's `generated/`
folder so it is inspectable and reusable, but freshness comes from spawning on
every `generate`, not from a fingerprint or a committed lockfile.

### Runtime collector

The TS registry currently discards `params` (`registry.set(name, run)`); Python
already keeps `(params, run)`. Both need:

```ts
collectBindings(): Array<{ name: string; params: string[] }>
```

and TS `bind` must retain `params`. Duplicates keep erroring. The generated
entrypoint:

```ts
// tests/explain/web/generated/bindings.ts (generated)
import '../backend/index.js'
import { collectBindings } from '@livingdoc/runtime'
process.stdout.write(JSON.stringify({ bindings: collectBindings() }, null, 2))
```

The Python sibling emits the equivalent module.

### Failure taxonomy (DomainError values, not strings)

| kind | carries |
|---|---|
| `collect-failed` | backend, command, exit code, stderr tail |
| `manifest-invalid` | backend, path, schema issue |
| `manifest-missing` | backend, path (read-only mode) |

`binding-missing` / `binding-unused` stay in liv-ejez — this ticket only
produces and validates the manifest.

## Open questions

- Timeout for the spawned command: a fixed default, or a config knob?
- Is `collect` a sibling of `code_path` (one command for all backends) or
  strictly per backend? Current leaning: per backend, since toolchains differ.
- Should `livingdoc generate` gain a `--no-collect` (read the existing manifest)
  for environments where the toolchain is unavailable but a manifest was
  produced elsewhere?

## Notes

- Extracted from liv-ejez, which had "load backend → manifest" as an opaque
  first step. This ticket owns the mechanism; liv-ejez owns key resolution and
  the missing/unused check and now depends on this.
- Resolves liv-d7uk's open question ("getting `params` without running the
  backend"): the consumer's own command produces it.
- Runtime version coupling: the collector must resolve the same
  `@livingdoc/runtime` / `livingdoc_runtime` as the generated tests, or
  `collectBindings` will not exist.
- The old command name `livingdoc bindings` is dropped in favour of
  `livingdoc collect`.

## Linked

- liv-ejez [open] Binding keys: file+anchor, global names, unnamed inline, and bindings check
- liv-d7uk [open] Validating input names against the binding
- liv-1wj2 [closed] Backend binds: module-level `bind` / `run` behind one index
- liv-ty09 [closed] The livingdoc runtime
