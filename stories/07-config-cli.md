# Story 7 — Configuration and commands

Make it a real tool.

## Goal

Let a project choose its framework and its backend through configuration, and
give livingdoc two commands: one that writes the check, and one that writes and
runs it. Honest exit codes and actionable errors.

## Why this slice

It turns the working pipeline into something a project can adopt: configurable,
with a clear interface and errors a human can act on.

## In scope

- Configuration selecting the framework and the consumer's backend.
- `livingdoc generate` — produce the check without running it.
- `livingdoc check` — produce and run the check, exiting 0 or non-zero.
- Clear errors for missing configuration, a missing backend, and undeclared
  names.

## Out of scope

- Frameworks beyond the current adapter, rendering, compound values.

## Acceptance criteria

- [ ] `livingdoc generate` produces the check and nothing else.
- [ ] `livingdoc check` uses the configured framework and backend.
- [ ] A failing assertion makes `check` exit non-zero.
- [ ] Misconfiguration fails with an actionable message, not a stack trace.

## Notes

This is the thin-slice boundary: livingdoc is now usable for a project. Showing
results in the document comes later, after per-case results exist.
