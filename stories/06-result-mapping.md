# Story 6 — Per-case results

**As a** documentation author, **I want** to know which bullet failed and why,
**so that** I can fix the behavior or the document without hunting.

## Acceptance criteria

- **Given** a document with several bullets
  **When** I run `livingdoc check`
  **Then** each bullet has a stable, discoverable identity

- **Given** a case whose expectation does not hold
  **When** I run `livingdoc check`
  **Then** its identity and actual value are reported
  **And** the report is machine-readable
