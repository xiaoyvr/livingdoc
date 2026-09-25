# Story 7 — Config + CLI

Make it a real tool.

## Goal

Move the framework and backend out of hardcoded defaults into a config file,
and provide the two commands: `livingdoc check` and `livingdoc generate`.

## Why this slice

It turns the working pipeline into a distributable tool a project can adopt:
config-driven, with a clean CLI and honest exit codes.

## In scope

- `livingdoc.toml`: `framework = "vitest"`, `backend = "./livingdoc.backend.ts"`.
- `livingdoc generate` — write the generated test file without running.
- `livingdoc check` — generate + run + report, exit 0/1.
- Clear errors: missing config, missing backend, undeclared verb/param.

## Out of scope

- Frameworks beyond vitest, HTML rendering, compound values.

## Acceptance criteria

- [ ] `livingdoc generate` writes the `.test.ts` and nothing else.
- [ ] `livingdoc check` uses the configured backend and framework.
- [ ] A red assertion makes `check` exit non-zero.
- [ ] Misconfiguration fails with an actionable message, not a stack trace.

## Tasks

- [ ] Parse `livingdoc.toml` (framework, backend).
- [ ] Route codegen through the vitest adapter (the only adapter so far).
- [ ] Split `generate` and `check` commands behind a small arg parser.
- [ ] Wire exit codes and error messages end-to-end.

## Notes

This is the thin-slice boundary: the tool is now genuinely usable for a
TypeScript + Vitest project. Rendering/coloring is a later slice, after the
result-mapping report from Story 6 exists.
