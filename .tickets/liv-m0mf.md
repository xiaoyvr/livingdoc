---
id: liv-m0mf
status: open
deps: [liv-ybyq, liv-0ou1]
links: []
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
