# livingdoc

> Documentation that cannot be published while it is false.

`livingdoc` turns the important behaviors of a system into living
documentation: you describe them in ordinary prose, mark the inputs and
expectations, and livingdoc generates the tests that verify them against your
real code. See [DESIGN.md](./DESIGN.md) for the full design.

## Repository layout

```
packages/
  cli/                   @livingdoc/cli — the `livingdoc` command
    src/document.ts      markdown parsing and the token model
    src/frameworks/      one generator per framework (`vitest`, …)
.tickets/                work items, tracked with `tk` (run `tk help`)
```

The CLI is a modular monolith: `document.ts` is framework-agnostic, and each
framework's generator lives under `src/frameworks/` (design §8–9).

## Development

The devShell is provided by Nix + direnv; `direnv allow` once, then:

```sh
npm install        # install dependencies and link workspaces
npm test           # run the test suite (vitest)
npm run typecheck  # tsc -b across all packages
npm run generate   # write the checks for docs/explain with the built CLI
npm run dogfood    # clean the checks, rebuild, generate, then run them
npm run checks     # typecheck + generate + test
```

Work is tracked with `tk` in `.tickets/`; `tk ready` lists unblocked work.

The CLI runs from source with `npm run livingdoc -- check <file.md>`
(or `tsx packages/cli/src/bin.ts`). `npm run build` emits `dist/` per package,
after which `packages/cli/dist/bin.js` is the `livingdoc` executable.

The CLI reads `livingdoc.toml` at the project root. It names the `livingdocs`
folder to check and the `backend` folder, which holds the
`livingdoc.backend.<ext>` file and where the generated checks are written. Run
`livingdoc generate <file.md>` for one document, or `livingdoc generate` for
every opted-in document under `livingdocs`.

`generate` only writes the checks. They are ordinary test files, so the
project's own runner executes them: `npm run checks` generates first, then
`npm test` runs everything, including the livingdoc that documents livingdoc
under `docs/explain`.
