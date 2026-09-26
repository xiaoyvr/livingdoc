# Story 2 — One real assertion against an operation

**As a** documentation author, **I want** to state an expected result in the
document, **so that** the document verifies real behavior and goes red when the
behavior changes.

## Acceptance criteria

- **Given** a document whose heading selects an operation and that asserts an
  expected result
  **When** I run `livingdoc check`
  **Then** the check runs the operation and asserts its result

- **Given** the operation's result no longer matches the document's expectation
  **When** I run `livingdoc check`
  **Then** the check fails and the command exits non-zero
