# livingdoc

> Documentation that cannot be published while it is false.

`livingdoc` turns the important behaviors of a system into living
documentation: you describe them in ordinary prose, mark the inputs and
expectations, and livingdoc executes the behavior against your real code at
build time. See [DESIGN.md](./DESIGN.md) for the full design.

## Repository layout

```
packages/
  core/                  @livingdoc/core — tokenizer, parser, document model
  adapters/
    vitest/              @livingdoc/adapter-vitest — TS + Vitest adapter
  cli/                   @livingdoc/cli — the `livingdoc` command
.tickets/                work items, tracked with `tk` (run `tk help`)
```

`@livingdoc/core` is framework-agnostic. Each language/framework adapter lives
in its own folder under `packages/adapters/` (design §8–9). See
[`packages/adapters/README.md`](./packages/adapters/README.md).

## Development

The devShell is provided by Nix + direnv; `direnv allow` once, then:

```sh
npm install        # install dependencies and link workspaces
npm test           # run the test suite (vitest)
npm run typecheck  # tsc -b across all packages
npm run checks     # typecheck + test
```

Work is tracked with `tk` in `.tickets/`; `tk ready` lists unblocked work.

The CLI runs from source with `npm run livingdoc -- check <file.md>`
(or `tsx packages/cli/src/bin.ts`). `npm run build` emits `dist/` per package,
after which `packages/cli/dist/bin.js` is the `livingdoc` executable.
