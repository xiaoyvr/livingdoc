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
  **Then** livingdoc spawns that command exactly as declared (no extra argv)
  with the config root as cwd, reads the manifest from
  `<backend folder>/generated/manifest.json`, never parses stdout, and produces
  the parsed manifest as the value liv-ejez's check stage consumes

- **Given** a valid manifest left at that path by an earlier run
  **When** the collect command exits zero without writing
  **Then** livingdoc reports `manifest-missing` for the backend and path and
  exits non-zero — it does not reuse the stale file, because it unlinked the
  path before spawning

- **Given** a backend entry with no `collect` command
  **When** I run `livingdoc generate`
  **Then** that backend is skipped, the other backends are still collected, and
  the command exits zero

- **Given** a collect command that exits non-zero
  **When** I run `livingdoc generate`
  **Then** the error carries the backend, the command, the exit code and a
  stderr tail, and the command exits non-zero

- **Given** a collect command that writes no manifest
  **When** I run `livingdoc generate`
  **Then** the error is `manifest-missing`, naming the backend and the path,
  and the command exits non-zero

- **Given** a collect command that writes a file that is not the manifest
  schema
  **When** I run `livingdoc generate`
  **Then** the error names the backend and the schema problem, and the command
  exits non-zero

- **Given** a backend entry with `manifest = "…json"` instead of `collect`
  **When** I run `livingdoc generate`
  **Then** the manifest is read from that path, with no process spawned; a
  missing path is `manifest-missing` naming that path, and a bad file is
  `manifest-invalid`

- **Given** a backend entry with both `collect` and `manifest`
  **When** I run `livingdoc generate`
  **Then** `collect` wins: the command is spawned, its
  `generated/manifest.json` is read, and the configured `manifest` file is not
  read — proven at the collect boundary, by a stale or deliberately wrong
  `manifest` file whose contents do not appear in the manifest produced

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

- [ ] **S1 red** — `packages/cli/test/collect.test.ts`: config declares
      `collect = [argv]`; `generate` spawns it with the config root as cwd and
      no extra argv, reads the manifest the command writes to
      `<backend>/generated/manifest.json`, and exits ok. Red for the right
      reason: `collect` is parsed nowhere, so nothing spawns and the manifest
      file is never written. *(supersedes the earlier stdout- and argv-based
      reds)*
- [ ] **S1 green** — `collect` on the config backend entry + `mkdir` the
      backend's `generated/` + spawn at the config root + read that file.
      Minimum to pass; no failure handling, no schema, no `manifest`.

- [ ] **S2** — collect command exits non-zero → `collect-failed` carrying
      backend, command, exit code, stderr tail; CLI exit 1.
- [ ] **S3** — unlink the manifest before spawning, then: collect exits zero
      without writing → `manifest-missing` naming backend + path; exit 1. Test
      seeds a valid stale manifest to prove it is not reused.
- [ ] **S4** — collect wrote a file that is not the manifest schema →
      `manifest-invalid` naming backend + problem; exit 1.
- [ ] **S5** — `manifest = "…json"`, no `collect` → read from disk, nothing
      spawned; missing path → `manifest-missing`, bad file → `manifest-invalid`
      naming the path.
- [ ] **S6** — `collect` wins over `manifest`, asserted at the collect
      boundary: with a stale/lying file at `manifest`, the manifest returned is
      `<backend>/generated/manifest.json`. Nothing reads that `manifest` file
      when `collect` is set.
- [ ] **S7** — backend with neither key → skipped, exit 0, siblings still
      collected.
- [ ] **S8** — hand the in-memory manifest to the check stage boundary that
      liv-ejez builds on (no key resolution here).
- [x] ~~**S9** dogfood against the entrypoint `init` emits~~ — **moved to
      liv-3si5** (option B, decided 2026-10-19): the entrypoint this repo points
      `collect` at is `init`'s own output, not a hand-written one, so the proof
      lives with `init` and liv-3si5 carries the dep on this ticket. `liv-s5ym`
      tests the spawn against fixtures it writes itself, and closes without
      waiting.

**Deferred, decided:** no timeout knob, no `--no-collect`, no `livingdoc collect`
command, no committed manifest file — `collect` writes into the disposable
`generated/` folder (see Decisions taken).

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

### A fixed per-backend file, no `collect` command

The manifest is read from a **file the command writes**, not from stdout: a
toolchain command's stdout is noisy (build output, warnings, framework
banners) and livingdoc does not control it. The path is fixed and owned by
livingdoc:

```
<code_path>/<name>/generated/manifest.json
```

- The collector resolves that path **relative to its own file**, not to cwd
  (`new URL('./generated/manifest.json', import.meta.url)` in TS,
  `Path(__file__).parent / 'generated' / 'manifest.json'` in Python). The
  entrypoint lives in `<backend folder>/`, so this lands in the right place
  even though cwd is the config root, and it survives a `code_path` move.
- livingdoc `mkdir`s `generated/` and **unlinks the manifest before spawning**.
  A command that exits zero without writing therefore fails as
  `manifest-missing`; it cannot pass on a previous run's file. This matters
  because `generate <file>` only cleans that document's output, not the whole
  folder — the unlink, not `cleanGenerated()`, is what guarantees freshness.
- A full `generate` also `rm -rf`s `generated/`, so nothing accumulates.

The manifest is therefore disposable, never committed, and carries no drift: it
is refreshed every `generate`, and there is no fingerprint or lockfile.

There is no `livingdoc collect` command: collection is an internal stage of
`generate`. A consumer who wants the manifest on disk outside `generate` runs
their own command and points `manifest` at the result; `manifest` remains the
environment-free input for pipelines that cannot run the toolchain.

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
  or Windows differences. livingdoc spawns it exactly as written; it appends no
  argument.
- `cwd` is the `livingdoc.toml` root, so `uv` finds `pyproject.toml` and
  relative paths are stable.
- `collect` wins over `manifest`. `manifest` is the explicitly
  environment-free path.

### Contract

> **Write one JSON document to `<backend folder>/generated/manifest.json`.
> stdout/stderr are logs. Exit 0 = success.**

```json
{
  "bindings": [
    { "name": "checkout.md#applying-a-discount", "params": ["code", "total"] },
    { "name": "applying-a-discount", "params": ["code", "total"] }
  ]
}
```

livingdoc validates this against the schema, then feeds it to resolve → check
→ emit. The entrypoint `livingdoc init` emits (liv-3si5) is the reference
implementation of the contract — it writes the JSON beside itself — so a
hand-written collector only has to match it.

### Pipeline

```
livingdoc generate [file]  → collect (per backend: unlink manifest, mkdir
                             generated/, spawn `collect`, read the manifest;
                             else read `manifest`, else skip)
                           → resolve keys → check → emit tests
```

Freshness comes from collecting on every `generate`: the manifest is unlinked
before the spawn and rewritten by the command, so there is no manifest file to
be stale, and no fingerprint or lockfile.

### Runtime collector

The runtime's read side — `collectBindings(): Array<{ name: string; params:
string[] }>` — and the entrypoint that writes the manifest are owned by
**liv-3si5**; this ticket only consumes their output. Note the ordering
constraint that decision created: the spawn target is a committed file under
`code_path/<name>/`, never `generated/`, which `cleanGenerated()` deletes on
every run. The manifest itself is the opposite: it lives *in* `generated/`,
because it is disposable.

### Failure taxonomy (DomainError values, not strings)

| kind | carries |
|---|---|
| `collect-failed` | backend, command, exit code, stderr tail |
| `manifest-missing` | backend, path |
| `manifest-invalid` | backend, path, schema issue |

`manifest-missing` covers a `collect` that exits zero without writing (livingdoc
unlinked the path first) and a configured `manifest` path that does not exist.

`binding-missing` / `binding-unused` stay in liv-ejez — this ticket only
produces and validates the manifest.

## Decisions taken

- **Fixed path in the disposable folder, no argv** — the manifest is
  `<backend folder>/generated/manifest.json`; `collect` is spawned exactly as
  configured. stdout is not parsed because builds are noisy. livingdoc unlinks
  the path before spawning, so an exit-0-without-write cannot read a stale
  manifest; `generated/` is disposable, so nothing durable drifts.
  *Considered and rejected:* appending an output path as argv (the collector
  then need not know the location, but the contract carries plumbing and there
  is no natural place for the file); a committed `manifest.json` beside
  `collect.<ext>` (reviewable, but livingdoc would have to delete inside the
  consumer's committed tree to keep `manifest-missing` honest).
- **The collector resolves the manifest path relative to itself** — not to
  cwd, which is the config root; `init` emits the reference form.
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
- The `collect`/`manifest` config keys and the entrypoint that writes the
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
