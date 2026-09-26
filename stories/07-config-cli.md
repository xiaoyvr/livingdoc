# Story 7 — Configuration and commands

**As a** developer adopting livingdoc, **I want** to configure my framework and
backend and choose whether to generate or check, **so that** livingdoc fits my
project and my CI.

## Acceptance criteria

- **Given** a project with a configured framework and backend
  **When** I run `livingdoc generate`
  **Then** the check is produced and nothing else happens

- **Given** a project with a configured framework and backend
  **When** I run `livingdoc check`
  **Then** it uses the configured framework and backend
  **And** it exits 0 on success and non-zero on failure

- **Given** a misconfigured project
  **When** I run `livingdoc check`
  **Then** it fails with an actionable message, not a stack trace
