# Story 5 — Directives

Consumer-defined assertions, called directly.

## Goal

Support the consumer's custom assertion verbs (e.g. mock verification) as
direct calls in the generated test, throwing on mismatch like a framework
assertion.

## Why this slice

It closes the gap between "assert on the return value" and "assert on side
effects" without livingdoc knowing anything about the consumer's mocks or
libraries.

## In scope

- A `directives` export in the backend (`calls`).
- Parsing `{{ calls "pricing service" "Once" }}` (verb + multiple raw args).
- Codegen: a direct call — `calls(outputs, "pricing service", "Once")` — not
  wrapped in a framework assertion.
- Directives fail by throwing, so a mismatch fails the vitest test.

## Out of scope

- Framework-verb whitelisting/validation beyond directives, result mapping,
  config, rendering.

## Acceptance criteria

- [ ] `{{ calls "pricing service" "Once" }}` generates a direct `calls(...)` call.
- [ ] A directive throwing on mismatch fails the run.
- [ ] An undeclared directive name is reported as an error.

## Tasks

- [ ] Backend fixture: export `directives.calls(outputs, subject, n)` that
      throws when the observed count differs.
- [ ] Tokenizer: pass the verb's raw argument text to the directive.
- [ ] Codegen: emit `directives["<verb>"](outputs, ...args)` for verbs not in the
      framework's known set.
- [ ] Declare the known framework verbs (vitest's `toBe`, `toEqual`, …) so a
      verb is routed to `expect(SUBJECT).VERB(...)` vs a directive call.

## Notes

Framework verbs vs consumer directives are distinguished by the adapter's known
verb set plus the backend's `directives` export — an undeclared verb is red.
