# Story 1 — Walking skeleton

A token becomes a passing test.

## Goal

Prove the whole pipeline end-to-end with the smallest possible feature:
`parse → generate → run → report`. After this slice, `livingdoc check` reads a
markdown file, generates a `.test.ts`, runs it under vitest, and reports the
result.

## Why this slice

It de-risks the riskiest unknown — driving vitest from a generated TypeScript
file — before any real behavior exists. Every later slice only adds features to
a loop that already works.

## In scope

- A Node CLI entry point: `livingdoc check <file.md>`.
- A minimal markdown parser that finds one input token:
  `{{ code: "SAVE10" }}` inside one `Example:` bullet.
- A code generator emitting a vitest `.test.ts` that binds the value and
  self-checks it.
- Running vitest on the generated file and reading pass/fail.
- Exit code 0 on pass, non-zero on fail.

## Out of scope

- Backend/operations, real assertions (`toBe` on a result), expressions,
  multiple bullets/headings, directives, result mapping, config, rendering.

## Acceptance criteria

- [ ] `livingdoc check fixture.md` generates `livingdoc.test.ts` next to the
      fixture.
- [ ] The generated test runs under `vitest run` and passes.
- [ ] The command exits 0.
- [ ] The generated test name is the bullet's text.

## Tasks

- [ ] Scaffold the livingdoc project: TypeScript, vitest as a dev dependency,
      a `bin` entry.
- [ ] Add a fixture: `stories/fixtures/walking-skeleton.md` with one heading,
      one `Example:`, one bullet containing `{{ code: "SAVE10" }}`.
- [ ] Minimal tokenizer: scan for `{{ name: value }}` and extract `name` +
      raw `value` (split on the first `:`).
- [ ] Codegen: emit a `.test.ts` that declares the value and asserts it —
      `const code = "SAVE10"; expect(code).toBe("SAVE10")` — named after the
      bullet.
- [ ] Runner: invoke `vitest run` on the generated file and capture the exit
      code.
- [ ] Report: print a one-line summary (e.g. `1 passed`) and mirror the exit
      code.

## Notes

The self-check (`expect(code).toBe("SAVE10")`) proves the value round-trips
through parse → generated code → executed code, without needing a backend yet.
