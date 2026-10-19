---
id: liv-m0mf
status: open
deps: [liv-ybyq, liv-0ou1]
links: [liv-ty09, liv-hu8o, liv-f6ao]
created: 2026-09-26T03:21:48Z
type: feature
priority: 2
assignee: xiaoyvr
---
# Directives

**As a** documentation author, **I want** to assert on side effects with
assertion phrases my project defines, **so that** I can verify calls and state,
not only return values.

## Acceptance criteria

- **Given** a document using a consumer-defined assertion phrase, e.g.
  ``!!`calls "pricing service" "Once"` ``
  **When** I run `livingdoc generate`
  **Then** the generated test calls the directive with the binding's outputs
  and the phrase's arguments

- **Given** a directive that does not hold
  **When** the project's tests run
  **Then** the generated test fails

- **Given** an assertion phrase neither the framework nor the backend declares
  **When** I run `livingdoc generate`
  **Then** the unknown verb is reported as an error

## Open question — how does generate know the declared verbs?

AC3 is a **generate-time** check on consumer-declared verbs. That is the same
"read the backend without running it" problem liv-s5ym solved for `params` — and
the manifest contract liv-s5ym defines carries only `{ name, params }`. There is
no path by which livingdoc learns a backend's `directives` (DESIGN §7.2).
Undecided fork:

1. **Grow the manifest** with a `directives` field (runtime read side alongside
   `collectBindings()`), keep AC3 as a generate-time failure, and this ticket
   depends on liv-s5ym.
2. **Move the check to run time** — generated code calls the directive, an
   unknown verb is `undefined`, the case goes red in the consumer's suite; AC3
   is reworded from "generate reports it" to "the case fails".

Option 2 is smaller and matches "livingdoc carries text; the target language
and framework give it meaning". Option 1 keeps the fail-early property that is
the point of the check stage. Not decided as of 2026-10-19 — decide before this
ticket is picked up.
