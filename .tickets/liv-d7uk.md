---
id: liv-d7uk
status: open
deps: [liv-ybyq]
links: []
created: 2026-09-26T03:21:48Z
type: feature
priority: 2
assignee: xiaoyvr
---
# Inputs and native expressions

**As a** documentation author, **I want** to give an operation several named
inputs and write expectations as computations, **so that** the document reads
in the language my team already writes.

## Acceptance criteria

- **Given** a document with several marked inputs and an expectation written as
  a computation
  **When** I run `livingdoc check`
  **Then** the operation receives the declared inputs
  **And** the computation is evaluated in the consumer's language

- **Given** an expectation whose computation is wrong
  **When** I run `livingdoc check`
  **Then** the check fails

- **Given** a document with an input name that is not a valid identifier
  **When** I run `livingdoc check`
  **Then** the invalid name is reported as an error

