---
id: liv-1wj2
status: in_progress
deps: []
links: [liv-ty09, liv-ejez, liv-7zw2, liv-du6y]
created: 2026-09-30T03:25:00Z
type: feature
priority: 0
assignee: xiaoyvr
---
# Backend binds: direct bind, multi-file index, describe hooks

**As a** documentation author, **I want** backend bindings declared with `bind()`
across multiple files behind one index import, with optional describe-level
`beforeAll` / `afterAll` on each bind, **so that** generated tests stay thin and
documents need not carry setup implementation.

## Acceptance criteria

- **Given** a backend index that side-effect imports modules calling
  `bind(name, params, run)`
  **When** a generated test imports only that index
  **Then** `run(name, args)` resolves those bindings — there is no `register`

- **Given** `bind` called from two backend modules with different names
  **When** tests run
  **Then** both bindings are available

- **Given** two modules `bind` the same name
  **When** the backend loads
  **Then** duplicate binding is an error

- **Given** `bind(name, params, run, { beforeAll, afterAll })`
  **When** the generated test runs under vitest
  **Then** that binding’s `describe` runs those hooks once around its cases
  (via a runtime helper such as `describeBinding`)

- **Given** a binding with no hooks
  **When** the generated test loads
  **Then** the framework’s `beforeAll` / `afterAll` are not registered for that
  describe — the runtime helper no-ops on missing hooks

- **Given** `livingdoc generate`
  **When** it runs
  **Then** it loads the backend (pre-run), collects a bindings manifest, checks
  missing/unused against the documents, and feeds the manifest into emit
  (fail closed on check errors)

- **Given** suite-level setup owned by the runner (`globalSetup`, setupFiles,
  root `conftest`)
  **When** documents and generated tests are written
  **Then** they do not contain suite-level setup (backend binds may read
  env/handles published by it)

- **Given** dogfood / explain backends
  **When** this lands
  **Then** they use `bind(...)` in modules imported by the index; `register` is
  gone from runtime and generators

## Design

### No `register`

Consumer API is module-level `bind` / `run` / `list` from `@livingdoc/runtime`
(and the Python sibling). Internal `createBindings` may remain for tests.

```ts
// backend/checkout.ts
import { bind } from '@livingdoc/runtime'

bind('checkout.md#applying-a-discount', ['code', 'total'],
  ({ code, total }) => applyDiscount(code, total),
  { beforeAll, afterAll }, // optional
)
```

```ts
// backend/index.ts — only entry generate and generated tests import
import './checkout'
import './cart'
```

```ts
// generated (vitest)
import '../backend'
import { run } from '@livingdoc/runtime'
import { describeBinding } from '@livingdoc/runtime/vitest'

describeBinding('applying-a-discount', 'Applying a discount', () => {
  it('…', () => {
    const result = run('applying-a-discount', { code, total })
    expect(result).toBe(…)
  })
})
```

### Collect → check → generate

```
load backend → manifest (list)
       ↓
check vs docs (missing / unused → fail)
       ↓
emit from docs + manifest
```

- Generate always loads the backend for the suite being emitted.
- Manifest feeds validation and (with liv-ejez) resolved keys; emit still uses
  `describeBinding` so hooks attach at test runtime from the registry.
- Document parse supplies cases and inline `>>`; pre-run supplies backend binds.

### One `bind` shape

`bind(name, params, run, hooks?)` — `run` returns the bare value; the runtime
wraps `{ result }`. Optional `hooks`: `beforeAll` / `afterAll` on the entry.
`list()` returns `{ name, params, hasBeforeAll, hasAfterAll }[]` for the
manifest (no function values).

### Registry

- **Backend** `bind` → shared registry for that process/suite
- **Inline** `bind` → describe-local overlay (liv-ejez); not in the pre-run
  manifest

### Lifecycle split

| Scope | Where |
|---|---|
| Once per suite / every `it` suite-wide | Runner — not Markdown |
| Once per heading (`describe`) | Optional hooks on `bind`, via `describeBinding` |
| Per case | Binding `run` |
| Demo in a document | Verbatim hooks in `>>` |

## Notes

- Foundation for liv-ejez (keys, unnamed inline, richer check). liv-ejez depends
  on this.
- Replaces `register` + `bindings.bind` from liv-ty09 / liv-7zw2.
- Today’s default key remains the heading slug until liv-ejez ships file+anchor.

## Implementation tasks

Vertical slices (each delivers a usable path, not a layer). Strict TDD per
slice: red → confirm → green → refactor; one slice at a time.

- [ ] 1. **Module-level `bind` / `run` / `list` (TS runtime)**

      Failing tests for `bind(name, params, run)`, `run`, duplicate, unknown,
      and `list()` manifest (params + hook flags). No `register` / `setup` in
      the new surface. Minimum impl in `@livingdoc/runtime`.

- [ ] 2. **`describeBinding` under vitest**

      Binding with hooks → vitest `beforeAll`/`afterAll` run once for the
      describe; binding without hooks → those hooks are not registered. Ship
      `@livingdoc/runtime/vitest`.

- [ ] 3. **Generated vitest file uses `import '../backend'` + `describeBinding`**

      Generator emits the new shape (no `setup(backend)`). One CLI/unit fixture
      generate → output contains `describeBinding` and `run`; a tiny backend
      with `bind(...)` makes the generated test pass under vitest.

- [ ] 4. **Collect → check → generate (vitest)**

      Generate loads the backend, builds a manifest, fails on missing/unused
      (slug key as today), then emits. Fixture: missing bind → generate red;
      matching bind → generate green and test passes.

- [ ] 5. **Dogfood vitest backend on `bind(...)`**

      Migrate `tests/explain/vitest` (and explain expected snippets) off
      `register`; dogfood vitest path green.

- [ ] 6. **Python `bind` / `run` / `list_bindings` + pytest generator**

      Same consumer surface; pytest emit imports `backend` and uses `run` (no
      `setup`). Collect/check for `.py` backends. Pytest dogfood green.

- [ ] 7. **Multi-file backend index**

      Two modules each `bind` a name; index side-effect imports both; generate
      collect sees both; duplicate across files → red.
