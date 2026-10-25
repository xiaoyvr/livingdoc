---
id: liv-s5ym
status: closed
deps: []
links: [liv-ejez, liv-d7uk, liv-1wj2, liv-ty09, liv-3si5]
created: 2026-10-19T03:36:27Z
type: feature
priority: 0
tags: [collect, manifest, runtime, cli]
---
# configured collect command produces the backend manifest for generate

**Absorbed into liv-ejez on 2026-10-25.** Collection is not a feature of its
own: it exists only as the first stage of the bindings check, which owns the
spawn, the manifest contract and the consumer. This ticket is kept as the design
record behind that move; the work continues in **liv-ejez**.

**As a** documentation author, **I want** `livingdoc generate` to run a command
I declare in `livingdoc.toml` and read the backend's bindings back as a
manifest, **so that** generate can check and optimise against real binding
names without livingdoc assuming anything about my toolchain.

## Acceptance criteria

- **Given** a backend entry with `collect = ["uv", "run", "python", "-m",
  "pricing.collect_bindings", "{manifest}"]`
  **When** I run `livingdoc generate`
  **Then** livingdoc spawns that command with the config root as cwd and
  `{manifest}` replaced by the absolute
  `<code_path>/<name>/generated/manifest.json`, reads the manifest from that
  path, never parses stdout, and produces the parsed manifest as the value
  liv-ejez's check stage consumes

- **Given** a `collect` array with no `{manifest}` token, or with an unknown
  `{…}` token
  **When** I run `livingdoc generate`
  **Then** it fails with `invalid-config` naming the token problem and spawns
  nothing

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
  **Then** `collect` wins: the command is spawned, the file at the substituted
  `{manifest}` path is read, and the configured `manifest` file is not read —
  proven at the collect boundary, by a stale or deliberately wrong `manifest`
  file whose contents do not appear in the manifest produced

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
      `collect = [argv, "{manifest}"]`; `generate` spawns it with the config
      root as cwd and the token substituted with the absolute
      `<backend>/generated/manifest.json`, reads the manifest the command
      wrote there, and exits ok. Red for the right reason: `collect` is parsed
      nowhere, so nothing spawns and the manifest file is never written.
      *(supersedes the earlier stdout-, argv- and fixed-path-based reds)*
- [ ] **S1 green** — `collect` on the config backend entry + substitute
      `{manifest}` + `mkdir` the backend's `generated/` + spawn at the config
      root + read that file. Minimum to pass; no token validation, no failure
      handling, no schema, no `manifest`.

- [ ] **S2** — a `collect` array with no `{manifest}`, or an unknown `{…}`
      token, is `invalid-config` and spawns nothing.
- [ ] **S3** — collect command exits non-zero → `collect-failed` carrying
      backend, command, exit code, stderr tail; CLI exit 1.
- [ ] **S4** — unlink the manifest before spawning, then: collect exits zero
      without writing → `manifest-missing` naming backend + path; exit 1. Test
      seeds a valid stale manifest to prove it is not reused.
- [ ] **S5** — collect wrote a file that is not the manifest schema →
      `manifest-invalid` naming backend + problem; exit 1.
- [ ] **S6** — `manifest = "…json"`, no `collect` → read from disk, nothing
      spawned; missing path → `manifest-missing`, bad file → `manifest-invalid`
      naming the path.
- [ ] **S7** — `collect` wins over `manifest`, asserted at the collect
      boundary: with a stale/lying file at `manifest`, the manifest returned is
      the one at the substituted `{manifest}` path. Nothing reads that
      `manifest` file when `collect` is set.
- [ ] **S8** — backend with neither key → skipped, exit 0, siblings still
      collected.
- [ ] **S9** — hand the in-memory manifest to the check stage boundary that
      liv-ejez builds on (no key resolution here).

**Dogfood, moved:** `init`'s own dogfood (run the emitted collector standalone)
lives in liv-3si5 I7 and needs nothing from this ticket. The end-to-end
`npm run checks` dogfood lives in liv-ejez, whose deps include this ticket and
liv-3si5.

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

### The manifest path is substituted, not appended

The manifest is read from a **file the command writes**, not from stdout: a
toolchain command's stdout is noisy (build output, warnings, framework
banners) and livingdoc does not control it. The destination is fixed and
livingdoc-owned:

```
<code_path>/<name>/generated/manifest.json
```

The consumer names that destination where their command expects it, using a
`{manifest}` token in the declared argv:

```toml
collect = ["npx", "tsx", "tests/explain/web/collect.ts", "{manifest}"]
collect = ["uv", "run", "python", "-m", "pricing.collect_bindings", "{manifest}"]
collect = ["make", "collect", "MANIFEST={manifest}"]     # a make variable, not a target
```

livingdoc replaces every `{manifest}` with the **absolute** path before
spawning. A placeholder rather than a hidden trailing argument because appending
is not universally valid: `npx`, `uv` and `npm run` forward a trailing
positional, but `make collect /abs/path` treats it as another target and fails
with "No rule to make target". The token lets the consumer choose the position
and form (`MANIFEST=…` for make), while livingdoc still owns the path.

`{manifest}` is **required** in a `collect` argv; a missing or unknown token is
`invalid-config`, so a command is never spawned without being told where to
write. livingdoc `mkdir`s `generated/` and **unlinks the manifest before
spawning**, so a command that exits zero without writing fails as
`manifest-missing` instead of passing on an earlier run's file. That unlink, not
`cleanGenerated()`, is what guarantees freshness: `generate <file>` cleans only
that document's output, while a full `generate` also removes the whole folder.

The manifest is therefore disposable and never committed — refreshed every run,
with no fingerprint or lockfile. cwd stays the config root (not the backend
folder) so the backend index, imported by both the collector and the generated
tests, executes under the same cwd in both runs.

There is no `livingdoc collect` command: collection is an internal stage of
`generate`. A consumer who wants the manifest on disk outside `generate` runs
their own command and points `manifest` at the result; `manifest` remains the
environment-free input for pipelines that cannot run the toolchain.

### Config

Per backend, because each backend has its own toolchain:

```toml
[[backend.vitest]]
name = "web"
collect = ["npx", "tsx", "tests/explain/web/collect.ts", "{manifest}"]

[[backend.pytest]]
name = "pricing"
collect = ["uv", "run", "python", "-m", "pricing.collect_bindings", "{manifest}"]
# or, for pipelines that can't run the toolchain:
# manifest = "tests/explain/pricing/bindings.json"
```

- `collect` is an **array**, not a shell string — no shell parsing, no quoting
  or Windows differences; substitution is per array element, so a path with
  spaces is still one argument.
- `{manifest}` is replaced with an absolute path; any other `{…}` token is
  `invalid-config`. It names the collect **output**; the `manifest` key below
  is the **input** fallback, used only when `collect` is unset.
- `cwd` is the `livingdoc.toml` root, so `uv` finds `pyproject.toml` and
  relative paths are stable.
- `collect` wins over `manifest`. `manifest` is the explicitly
  environment-free path.

### Contract

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

livingdoc validates this against the schema, then feeds it to resolve → check
→ emit. The entrypoint `livingdoc init` emits (liv-3si5) is the reference
implementation of the contract — it writes the JSON to its manifest argument —
so a hand-written collector only has to match it.

### Pipeline

```
livingdoc generate [file]  → collect (per backend: unlink manifest, mkdir
                             generated/, substitute {manifest}, spawn `collect`,
                             read the file; else read `manifest`, else skip)
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
| `invalid-config` | file, issues (`collect` without `{manifest}`, unknown token) |
| `collect-failed` | backend, command, exit code, stderr tail |
| `manifest-missing` | backend, path |
| `manifest-invalid` | backend, path, schema issue |

`manifest-missing` covers a `collect` that exits zero without writing (livingdoc
unlinked the path first) and a configured `manifest` path that does not exist.

`binding-missing` / `binding-unused` stay in liv-ejez — this ticket only
produces and validates the manifest.

## Decisions taken

- **`{manifest}` placeholder in the declared argv** — livingdoc substitutes the
  absolute `<backend folder>/generated/manifest.json`; the command is spawned
  exactly as written otherwise. *Considered and rejected:* appending the path as
  a trailing argument (breaks `make`, which reads it as a target; also hides the
  position from the consumer); passing only `code_path` (the collector would
  still need its backend name); an environment variable (rejected — keeps the
  contract alphabetical instead of declarative); the collector resolving
  relative to its own file (works only for commands that are a file in the
  backend folder); reading `livingdoc.toml` in the collector (needs a TOML
  parser and the backend name).
- **`{manifest}` is required** — no silent append, no default; a command is
  never spawned without its destination.
- **The path is fixed inside `generated/`** — livingdoc owns the filename; the
  collector does not choose it.
- **livingdoc unlinks the manifest before spawning** — `cleanGenerated()` alone
  is not enough, because `generate <file>` cleans only that document's output.
- **cwd stays the config root** — the backend index is imported by both the
  collector and the generated tests, and the runner's cwd is the project root;
  moving collect to the backend folder would make module-level code see two
  different cwds.
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
  side it drives. liv-3si5 has no dependency on this ticket; the dogfood that
  exercises both lives in liv-ejez.
- 2026-10-19 scan: this ticket's boundary with liv-ejez is "the manifest value
  is produced". Anything observable only because a consumer reads the manifest
  belongs to liv-ejez.

## Linked

- liv-ejez [open] Binding keys: file+anchor, global names, unnamed inline, and bindings check
- liv-d7uk [open] Validating input names against the binding
- liv-1wj2 [closed] Backend binds: module-level `bind` / `run` behind one index
- liv-ty09 [closed] The livingdoc runtime
- liv-3si5 [open] livingdoc init: scaffold a backend's folder and collector entrypoint
