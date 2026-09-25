# Story 3 — Input binding + native expressions

Inputs become variables; expectations become native code.

## Goal

Bind the document's inputs as variables in the generated test, pass them to the
operation, and emit the expectation expression as native TypeScript.

## Why this slice

It delivers the core readability property: the document writes
`{{ toBe total * 0.9 }}` and the generated test literally contains
`expect(outputs.result).toBe(total * 0.9)`, computed by TypeScript itself.

## In scope

- Multiple input tokens on a bullet: `{{ code: "SAVE10" }} {{ total: 100 }}`.
- Codegen that binds inputs: `const code = "SAVE10"; const total = 100;`.
- Passing inputs to the operation: `run({ code, total })`.
- Expressions in assertions, emitted verbatim: `{{ toBe total * 0.9 }}`.

## Out of scope

- Multiple bullets/headings, named-output subjects (`"order saved" toBe …`),
  directives, result mapping, config, rendering.

## Acceptance criteria

- [ ] Inputs are passed to the operation as declared.
- [ ] `{{ toBe total * 0.9 }}` evaluates to the computed value.
- [ ] Wrong arithmetic in the expression makes the run fail.
- [ ] An input name that isn't a valid identifier is reported as an error.

## Tasks

- [ ] Tokenizer: collect all input tokens on a bullet.
- [ ] Codegen: emit `const <name> = <value>;` for each input (verbatim value).
- [ ] Codegen: pass the inputs object to `run`.
- [ ] Codegen: emit the assertion arg verbatim as native code.
- [ ] Validate input names as TS identifiers; reject with a clear message.

## Notes

Values are emitted verbatim (§11 of the design), so `total * 0.9` is plain
TypeScript. Input names must be valid identifiers because they become variables.
