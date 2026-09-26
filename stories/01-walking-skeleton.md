# Story 1 — Walking skeleton

A document becomes a passing check.

## Goal

Prove the whole promise end to end with the smallest possible feature: a
document is read, a check is produced and executed, and its result is reported.
After this slice, `livingdoc check` succeeds on a sound document.

## Why this slice

It de-risks the idea itself — that a written document can drive a real, executed
check — before any real behavior exists. Every later slice only adds capability
to a pipeline that already works.

## In scope

- The `livingdoc check <file.md>` command.
- A document that opts in with `livingdoc` frontmatter and contains one
  `Example:` bullet with one marked input, `{{ code: "SAVE10" }}`.
- The marked input is made available to the check, and the check is named after
  the bullet.
- The command reports the outcome and exits 0 on success, non-zero otherwise.

## Out of scope

- The consumer's operation and real assertions, expressions, multiple
  bullets/headings, directives, per-case reporting, configuration, rendering.

## Acceptance criteria

- [ ] `livingdoc check <file.md>` produces a check beside the document.
- [ ] The check executes and passes.
- [ ] The command exits 0.
- [ ] The check is named after the bullet.

## Notes

The marked input is a parameter of the case, not something to assert. Real
assertions arrive in Story 2, against the consumer's operation.
