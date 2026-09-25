# Story 2 — One real assertion against a backend

The generated test asserts real behavior.

## Goal

Introduce the consumer's backend and a real assertion. The document's
`{{ toBe 90 }}` becomes `expect(outputs.result).toBe(90)`, run against the
consumer's actual operation.

## Why this slice

It proves the generated test can call consumer code and that a wrong result
surfaces as a red build — the first real "documentation cannot be false"
guarantee.

## In scope

- A backend module the generated test imports:
  `operations = { "applying-a-discount": { params, run } }`.
- Parsing an assertion token `{{ toBe 90 }}` (verb + literal expected).
- Codegen for the framework shape `expect(SUBJECT).toBe(ARGS)`.
- Exit 1 when the assertion fails.

## Out of scope

- Input binding into `run`, native expressions, multiple bullets/headings,
  directives, result mapping, config, rendering.

## Acceptance criteria

- [ ] `livingdoc check fixture.md` runs the operation and asserts its result.
- [ ] Changing the operation's return value makes the run fail and the command
      exit non-zero.
- [ ] The expected value in the document is what the generated assertion checks.

## Tasks

- [ ] Add a backend fixture: `operations["applying-a-discount"].run()` returning
      a fixed value.
- [ ] Extend the tokenizer to distinguish input tokens (`name: value`) from
      assertion tokens (`verb args`).
- [ ] Parse `{{ toBe 90 }}` into verb `toBe` + args `90`.
- [ ] Codegen: import the backend, call the operation, emit
      `expect(outputs.result).toBe(90)`.
- [ ] Wire the generated import path so vitest resolves the backend.

## Notes

The subject of `toBe` is implicitly the operation's primary result (`result`)
until Story 4 adds named outputs.
