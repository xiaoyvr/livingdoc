---
id: liv-m0mf
status: open
deps: [liv-ybyq]
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
  `{{ calls "pricing service" "Once" }}`
  **When** I run `livingdoc check`
  **Then** the phrase receives the binding's outputs and its arguments

- **Given** a directive that does not hold
  **When** I run `livingdoc check`
  **Then** the check fails

- **Given** a document using an unknown assertion phrase
  **When** I run `livingdoc check`
  **Then** the unknown phrase is reported as an error

