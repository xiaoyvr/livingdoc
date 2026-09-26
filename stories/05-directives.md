# Story 5 — Directives

Consumer-defined assertions.

## Goal

Let a document assert on what a return value cannot express — side effects,
calls, state — using assertion phrases the consumer defines, which fail like any
other assertion.

## Why this slice

It closes the gap between asserting on a result and asserting on side effects,
without livingdoc knowing anything about the consumer's mocks or libraries.

## In scope

- Consumer-defined assertion phrases, e.g.
  `{{ calls "pricing service" "Once" }}`.
- A directive reads the operation's outputs and its own arguments.
- A directive that does not hold fails the check.
- An unknown assertion phrase is reported as an error.

## Out of scope

- Per-case reporting, configuration, rendering.

## Acceptance criteria

- [ ] A consumer-defined phrase receives the operation's outputs and its
      arguments.
- [ ] A directive that does not hold fails the run.
- [ ] An unknown phrase is reported as an error.

## Notes

The vocabulary is closed: the framework's assertions plus the consumer's
directives. Anything else is a failure, so a typo cannot silently pass.
