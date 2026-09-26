# Story 3 — Inputs and native expressions

Inputs become variables; expectations become native code.

## Goal

Let a document supply several named inputs to an operation and express its
expectation as a computation. The document reads the way the team already
writes code.

## Why this slice

It delivers the core readability property: what the document states is what the
consumer's language evaluates, with no translation layer in between.

## In scope

- Multiple marked inputs on a bullet, e.g.
  `{{ code: "SAVE10" }} {{ total: 100 }}`.
- The operation receives the declared inputs.
- An expectation may be any computation in the consumer's language, e.g.
  `{{ toBe total * 0.9 }}`.
- An input name that is not a valid identifier is reported as an error.

## Out of scope

- Multiple bullets/headings, named-output subjects, directives, per-case
  reporting, configuration, rendering.

## Acceptance criteria

- [ ] The operation receives the declared inputs.
- [ ] An expectation written as a computation evaluates in the consumer's
      language.
- [ ] Wrong arithmetic in an expectation makes the check fail.
- [ ] An invalid input name is reported as an error.

## Notes

Marked values and expectations are the consumer's language, used as written;
livingdoc neither parses nor translates them.
