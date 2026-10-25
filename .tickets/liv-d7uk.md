---
id: liv-d7uk
status: open
deps: [liv-ybyq, liv-0ou1, liv-ejez]
links: [liv-s5ym, liv-ejez]
created: 2026-09-26T03:21:48Z
type: feature
priority: 2
assignee: xiaoyvr
---
# Validating input names against the binding

**As a** documentation author, **I want** an input name the binding does not
declare to be reported, **so that** a typo in the document fails the build
instead of being passed silently.

## Acceptance criteria

- **Given** a document whose input name the binding does not declare
  **When** I run `livingdoc generate`
  **Then** the undeclared name is reported as an error, alongside the binding's
  declared names

- **Given** a document whose input names all match the binding's declared
  parameters
  **When** I run `livingdoc generate`
  **Then** the generated test binds each input and passes it to the binding

## Notes

- Several inputs and computed expectations already work — the generated test
  binds each `name :=`expr`` and emits the computation verbatim. What is
  missing is checking the names against the collected manifest's declared
  params at generate time (DESIGN §6, §15.2).
- **Resolved:** "how to get `params` without running the backend" is answered by
  liv-ejez — the check feature emits the collector entrypoint, declares a
  `collect` command and reads `{name, params}` from the per-backend
  `<code_path>/<name>/generated/manifest.json` the command writes; the runtime
  read side (`collectBindings()`, TS `bind` retaining `params`) is part of that
  slice.
- 2026-10-25 scan: depends on liv-ejez, which owns collection, the check pass
  this extends, and the collector entrypoint. It is no longer ready work.

## Revisit when working this

- The runtime does not check `run(args)` keys against `params` either — only
  `bind` ties `params` to `run`'s TypeScript type. Decide whether generate-time
  validation is enough, or whether `@livingdoc/runtime` / the Python sibling
  should also reject mismatched args at call time.
