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
  **When** the project's tests run
  **Then** the case fails — livingdoc does not check verbs at generate time
  (decided 2026-10-19, DESIGN §9)

## Decided 2026-10-19 — no verb check

An earlier AC asked generate to report an unknown verb. That would need livingdoc
to learn a backend's `directives`, and the manifest carries only
`{ name, params }` — the same "read the backend without running it" problem
the manifest solves for params, at a cost that buys little: the target already
catches a bad name when the generated code runs.

**Decision: do not check verbs at generate time, framework or consumer.**
DESIGN §9 records the rule and the accepted cost — note that in pytest a bad
verb is a syntax error, so the whole generated file fails, not one case.

## Still open — how a directive is reached

Not a checking question, a wiring one:

- does the generated test import `directives` from the backend index and call
  `directives.calls(outputs, …)` directly, or go through a runtime registry
  (`registerDirectives` alongside `bind`)?
- is a directive per backend, per document, or per heading?
- do directives receive the same `outputs` the assertions receive (DESIGN §12
  names them; §16.7 says named outputs are not supported yet — is this ticket
  the one that adds them, or does it land after)?

Decide while tasking; they shape the emitted line, not the manifest.
