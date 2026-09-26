# Story 2 — One real assertion against an operation

The check asserts real behavior.

## Goal

Let a document assert against the consumer's real operation, so the check
verifies behavior rather than restating the input. A wrong result fails the
check and the command.

## Why this slice

It delivers the first honest "documentation cannot be false" guarantee: the
document calls real code, and its expectation can be wrong.

## In scope

- A consumer-provided operation the check runs, selected by the document's
  heading.
- An assertion in the document, e.g. `{{ toBe 90 }}`, stating an expected value
  in the consumer's own assertion vocabulary.
- The check evaluates the operation's result against the document's
  expectation.
- The command exits non-zero when the expectation does not hold.

## Out of scope

- Passing inputs to the operation, expressions, multiple bullets/headings,
  directives, per-case reporting, configuration, rendering.

## Acceptance criteria

- [ ] The check runs the document's operation and asserts its result.
- [ ] Changing the operation's result makes the check fail and the command exit
      non-zero.
- [ ] The expectation in the document is what the check verifies.

## Notes

The assertion's subject is the operation's primary result until Story 4 adds
named outputs.
