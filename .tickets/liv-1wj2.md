---
id: liv-1wj2
status: closed
deps: []
links: [liv-ty09, liv-ejez, liv-7zw2, liv-du6y, liv-j2jx, liv-3si5]
created: 2026-09-30T03:25:00Z
type: feature
priority: 0
assignee: xiaoyvr
---
# Backend binds: module-level `bind` / `run` behind one index

**As a** documentation author, **I want** backend bindings declared with
`bind()` in modules behind a single index import, **so that** generated tests
stay thin and documents need not carry setup implementation.

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

- **Given** `livingdoc generate` for vitest
  **When** it writes a document's test
  **Then** the test imports the backend index and calls `run` — there is no
  `setup(backend)`

- **Given** dogfood / explain backends
  **When** this lands
  **Then** they use `bind(...)` in modules imported by the index; `register`
  and `setup` are gone from the runtime and the generators

## Design

Consumer API is module-level `bind` / `run` from `@livingdoc/runtime`. Internal
`createBindings` may remain for tests.

```ts
// backend/checkout.ts
import { bind } from '@livingdoc/runtime'

bind('applying-a-discount', ['code', 'total'],
  ({ code, total }) => applyDiscount(code, total),
)
```

```ts
// backend/index.ts — the only entry generate and generated tests import
import './checkout.js'
import './cart.js'
```

```ts
// generated (vitest)
import '../backend/index.js'
import { run } from '@livingdoc/runtime'

describe('Applying a discount', () => {
  it('…', () => {
    const result = run('applying-a-discount', { code, total })
    expect(result).toBe(…)
  })
})
```

### One `bind` shape

`bind(name, params, run)` — `run` returns the bare value; the runtime wraps
`{ result }`.

### Registry

- **Backend** `bind` → shared registry for that process/suite
- Duplicate name → error; unknown name on `run` → error

### Lifecycle

All suite-level setup is owned by the runner (`globalSetup`, setup files, root
`conftest`). Documents and generated tests carry none; backend binds may read
env/handles the runner publishes. Per-case setup is the binding's own business.

## Notes

- Foundation for liv-ejez, which owns key resolution and the collect → check →
  generate pass; this ticket only provides the registry and the generated-test
  shape.
- Replaces `register` + `bindings.bind` from liv-ty09 / liv-7zw2.
- Today's default key remains the heading slug until liv-ejez ships file+anchor.

## Implementation tasks

Vertical slices (each delivers a usable path, not a layer). Strict TDD per
slice: red → confirm → green → refactor; one slice at a time.

- [x] 1. **Module-level `bind` / `run` registry (TS runtime)**

      No `register` / `setup` in the new surface. Registry in
      `@livingdoc/runtime`.

      - [x] happy path: `bind(name, params, run)` then `run(name, args)`
      - [x] duplicate: binding a name already bound throws
      - [x] unknown: running a name not bound throws

- [x] 2. **Generated vitest file imports the index and calls `run`**

      Generator emits `import '../backend.js'` (or `../backend/index.js`) +
      `run` (no `setup(backend)`); a tiny backend with `bind(...)` makes the
      generated test pass under vitest.

- [x] 3. **Multi-file backend index**

      `backend/index.<ext>` is accepted when `backend.<ext>` is absent; the index
      side-effect imports modules that each `bind` a name; a generated test
      imports the index by an explicit `.js` specifier (Vite, Node ESM, and
      `tsc` all resolve it) and sees both bindings. Duplicate across modules is
      the registry's existing duplicate guarantee.

- [x] 4. **Dogfood vitest backend on `bind(...)` + index**

      Migrate `tests/explain/vitest` (and explain expected snippets) off
      `register`; dogfood vitest path green.

- [x] 5. **Remove `setup` / `register` from the TS runtime and generator**

      Once no consumer remains. `createBindings` may stay for tests.

- [x] 6. **Python `bind` / `run` + pytest generator**

      Module-level `bind` / `run` in `livingdoc_runtime` (duplicate and unknown
      throw); pytest emit imports `backend` and calls `run` (no `setup`);
      pytest dogfood green; `setup` gone from the Python runtime and generator.

## Moved out

- collect → check → generate: liv-ejez (owns the bindings check).
- binding lifecycle setup / teardown: liv-j2jx (Lifecycle hooks).
