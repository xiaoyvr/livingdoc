---
id: liv-53z4
status: open
deps: [liv-hu8o]
links: [liv-ter0]
created: 2026-09-26T03:21:48Z
type: feature
priority: 4
assignee: xiaoyvr
---
# Configuration and commands

**As a** developer adopting livingdoc, **I want** to configure my framework and
backend, **so that** livingdoc fits my project and my CI.

## Acceptance criteria

- **Given** a `livingdoc.toml` and a backend whose extension selects a framework
  **When** I run `livingdoc generate`
  **Then** that framework's adapter writes the test files
  **And** an explicit `framework` setting overrides the inferred one

- **Given** an unknown framework, or a `backend` folder with no
  `livingdoc.backend.<ext>`
  **When** I run `livingdoc generate`
  **Then** it fails with an actionable message, not a stack trace

## Notes

- `livingdocs` and `backend` are already delivered by liv-ter0; this story adds
  framework selection and the remaining error reporting.
