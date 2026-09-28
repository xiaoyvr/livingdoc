---
id: liv-hu8o
status: open
deps: [liv-du6y, liv-m0mf]
links: [liv-ty09, liv-m0mf]
created: 2026-09-26T03:21:48Z
type: feature
priority: 3
assignee: xiaoyvr
---
# Per-case results

**As a** documentation author, **I want** to know which bullet failed and why,
**so that** I can fix the behavior or the document without hunting.

## Acceptance criteria

- **Given** a document with several bullets
  **When** I run `livingdoc generate`
  **Then** each generated case has a stable, discoverable identity

- **Given** a case whose expectation does not hold
  **When** the project's tests run
  **Then** the failing case's identity and actual value are reported
  **And** the report is machine-readable
