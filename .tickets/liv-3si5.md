---
id: liv-3si5
status: open
deps: []
links: [liv-s5ym, liv-1wj2, liv-ty09]
created: 2026-10-19T04:26:24Z
type: feature
priority: 1
assignee: xiaoyvr
tags: [init, scaffold, runtime, collect]
---
# livingdoc init: scaffold a backend's folder and collector entrypoint

## Tasks

Realtime list. One slice = red → confirm → green → refactor-on-smell; approval
for one step is not approval for the next. Not blocked: this ticket needs
neither liv-s5ym nor liv-ejez — only I7 does. Ordering note: landing this first
repairs `bind`, which discards `params` today, and puts a real producer of the
manifest contract on the ground before liv-s5ym writes its validator.

- [ ] **I1 red** — `livingdoc init` in a temp project: config declares
      `[[backend.vitest]] name = "web"`, `code_path = "tests/explain"`; after
      `init`, `tests/explain/web/collect.ts` exists and running it with node
      prints `{"bindings":[…{name,params}…]}` for a binding the index reached.
      This is the vertical slice: it drives the runtime read side
      (`collectBindings()`, TS `bind` retaining `params`) rather than
      pre-building it.
- [ ] **I1 green** — emit `collect.<ext>` + runtime `collectBindings()`.
      `backend.<ext>` is not created by this slice if it gets in the way; it is
      I3.

- [ ] **I2** — runtime read side for Python: `collect_bindings()`; `init` emits
      `collect.py`, runnable with the `PYTHONPATH` the generated pytest checks
      already use.
- [ ] **I3** — `backend.<ext>` stub per backend, with a `bind` example.
- [ ] **I4** — create-if-missing: an existing `backend.ts` survives byte-for-byte
      untouched; the run reports `created` / `exists` per file; re-running
      writes nothing and exits 0.
- [ ] **I5** — no `livingdoc.toml` → `config-not-found`, nothing written.
- [ ] **I6** — CLI surface: `livingdoc init` in `bin.ts` alongside `generate`
      (usage string, exit codes).
- [ ] **I7** — dogfood (moved from liv-s5ym S8): this repo's `livingdoc.toml`
      points `collect` at the emitted entrypoint, so `npm run checks` walks the
      real spawn path. Needs liv-s5ym's collect stage.

**Out of scope, decided:** `init` never writes `livingdoc.toml`; `init` never
writes into `generated/`.

## Design

## Ownership: the rule that makes this safe

| path | owner | lifecycle | written by |
|---|---|---|---|
| `code_path/<name>/` | consumer, committed | created once, edited forever | `init` (create-if-missing), the consumer |
| `code_path/<name>/generated/` | livingdoc, disposable | `rm -rf`d on every `generate` | `generate` only |

`init` never writes into `generated/`: anything there is deleted by the next `generate`. The collector entrypoint lives beside the backend index, so the spawn target named by a config `collect` command is committed consumer code — `generate` never has to write it, and there is no generated template to fall out of sync with the runtime version.

```
tests/explain/web/
├── backend.ts          # consumer index (init stubs it)
├── collect.ts          # collector entrypoint (init stubs it)
└── generated/          # livingdoc owned, disposable
```

## Config is the source of intent

`init` reads `livingdoc.toml` and materializes what is missing. It does **not** write `livingdoc.toml` — without a config declaring backends there is nothing to scaffold, and config stays hand-authored. No defaults, no discovery.

## Runtime read side

The emitted entrypoint is only 3 lines, and it depends on a runtime export that does not exist yet:

```ts
collectBindings(): Array<{ name: string; params: string[] }>
```

TS `bind(name, params, run)` currently discards `params` (`registry.set(name, run)`); it must retain them. Python `_registry` already keeps `(params, run)`, so it needs `collect_bindings()` only. Duplicates keep erroring.

```ts
// tests/explain/web/collect.ts (emitted)
import "./backend.js"
import { collectBindings } from "@livingdoc/runtime"
process.stdout.write(JSON.stringify({ bindings: collectBindings() }, null, 2))
```

The pytest sibling imports `backend` and prints the same shape via `json.dump`.

## Why a file and not a shipped collector

The alternative is pointing `collect` at a runtime-provided entry (`python -m livingdoc_runtime.collect backend`). Zero files, zero skew, less CLI code. Rejected: the TS side needs a loader for a `.ts` index driven from an argv array, and a committed entrypoint is where a consumer adds env setup, a dotenv import, or a second index module — the transparency that makes "livingdoc spawns this" tolerable.

## Contract

- create-if-missing, never clobber; report `created` / `exists` per file
- exit 0 when it created nothing
- per backend, per framework extension: `backend.<ext>`, `collect.<ext>`

## Acceptance Criteria

- **Given** a `livingdoc.toml` declaring `[[backend.vitest]] name = "web"` and `code_path = "tests/explain"`
  **When** I run `livingdoc init`
  **Then** `tests/explain/web/backend.ts` and `tests/explain/web/collect.ts` are created, and the command exits zero

- **Given** a backend folder created by `livingdoc init`
  **When** the consumer binds a binding in a module the index imports, and runs the emitted `collect.ts` with their own tooling
  **Then** it prints `{ "bindings": [ { "name": …, "params": [ … ] } ] }` for every `bind(name, params, run)` the index reached, so `collect` in the config may point at it

- **Given** a backend folder where `backend.ts` exists and `collect.ts` does not
  **When** I run `livingdoc init`
  **Then** `backend.ts` is left byte-for-byte untouched, `collect.ts` is created, and the run reports which files it created and which already existed

- **Given** a backend folder where both files exist
  **When** I run `livingdoc init`
  **Then** nothing is written and the command exits zero (re-runnable, safe in a dirty tree)

- **Given** `[[backend.pytest]] name = "pricing"`
  **When** I run `livingdoc init`
  **Then** `pricing/backend.py` and `pricing/collect.py` are emitted, and `collect.py` prints the same manifest shape when run with the `PYTHONPATH` the generated pytest checks already use

- **Given** a directory with no `livingdoc.toml`
  **When** I run `livingdoc init`
  **Then** it fails with `config-not-found` and writes nothing

- **Given** this repository's own `livingdoc.toml`
  **When** `npm run checks` runs
  **Then** a backend declares `collect` pointing at the entrypoint `init`
  emits, and the real spawn path is exercised end to end (moved here from
  liv-s5ym on 2026-10-19: this is the ticket where the entrypoint exists to be
  pointed at)

