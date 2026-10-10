---
id: liv-j2jx
status: open
deps: [liv-1wj2]
links: [liv-1wj2, liv-ejez, liv-du6y]
created: 2026-10-10T18:49:01Z
type: feature
priority: 2
assignee: xiaoyvr
---
# Lifecycle hooks: a binding's setup and teardown

**As a** documentation author, **I want** a binding to declare setup and teardown
that run once around its cases, **so that** expensive or stateful preparation is
shared instead of repeated per case, and documents stay free of setup code.

## Acceptance criteria

- **Given** a binding declares setup that prepares shared state
  **When** a document's cases for that binding run
  **Then** setup runs once before the first case, and every case sees the state
  it prepared — not once per case

- **Given** the binding also declares teardown
  **When** its cases finish
  **Then** teardown runs once after the last case, including when a case failed

- **Given** a binding declares neither setup nor teardown
  **When** its cases run
  **Then** no setup or teardown is registered for it, and the cases behave
  exactly as before

- **Given** setup or teardown must await asynchronous work
  **When** the cases run
  **Then** setup completes before the first case and teardown after the last

- **Given** setup or teardown throws
  **When** the tests run
  **Then** the failure names the binding whose lifecycle failed: a setup failure
  prevents its cases from running, and a teardown failure is still reported

- **Given** cases for the same binding appear in more than one place
  **When** the tests run
  **Then** setup and teardown run around each place the binding is used, and
  state does not leak from one use to the next

- **Given** a binding declares setup and teardown
  **When** the document and its generated test are written
  **Then** that implementation lives only in the backend — never in the
  document, and never as suite-level setup

## Design

### API

`bind` takes the lifecycle functions as an optional object; `run` gets two
siblings that the generated hooks call:

```ts
bind(name, params, run, { beforeAll?, afterAll? })
run(name, args)         // per case
runBeforeAll(name)      // no-op when the binding declares none
runAfterAll(name)       // no-op when the binding declares none
```

### Emission

The generator emits the framework's own hook calls inside the describe whose
cases call the binding:

```ts
describe('Applying a discount', () => {
  beforeAll(() => runBeforeAll('applying-a-discount'))
  afterAll(() => runAfterAll('applying-a-discount'))

  it('…', () => {
    const result = run('applying-a-discount', { code, total })
    expect(result).toBe(…)
  })
})
```

Invariant: **the describe that calls `run(X)` is the describe that emits
`runBeforeAll(X)` / `runAfterAll(X)`.** The heading supplies the binding by
default, so the two coincide; if a describe would host more than one binding,
nest a describe per binding so the invariant holds.

### State

Setup and teardown close over module state in the backend; `run` reads it. No
second `run` parameter, no runtime-owned context.

### Frameworks

vitest uses `beforeAll` / `afterAll` inside the `describe`. pytest maps a
heading to a class, so the same lines become class-scoped setup and teardown.

### Not doing

No `describeBinding` wrapper — the generator owns the describe structure and the
runtime stays a per-name lookup.

## Notes

- Scope is per use of the binding, not once globally: the number of hook runs
  follows the places the binding is used, not the number of documents.
- Depends on `liv-1wj2` for `bind` / `run` and the generated-test shape.
- Interacts with `liv-ejez` (binding keys, per-group binding overrides) and
  `liv-du6y` (one describe per heading): the emission invariant above is what
  keeps hooks correct once those land.
