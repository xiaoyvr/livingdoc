---
id: liv-f6ao
status: open
deps: [liv-frgb]
links: []
created: 2026-09-26T03:21:48Z
type: feature
priority: 0
assignee: xiaoyvr
---
# A second system under test: Python

**As a** documentation author whose system is written in Python, **I want** the
behaviors I document to be checked against my Python code, **so that** livingdoc
verifies my project in the language it is actually written in, not only
TypeScript.

## Scope

Basic, mirroring Story 1, for a Python system under test:

- The `livingdoc check <file.md>` command against a Python project.
- A document that opts in and contains one `Example:` bullet with one marked
  input, written in Python's terms.
- A check produced in Python and executed with the project's test framework.
- The command reports the outcome and exits 0 on success, non-zero otherwise.

Out of scope:

- The consumer's binding and real assertions, expressions, multiple
  bullets/headings, directives, per-case reporting, configuration, rendering.

## Acceptance criteria

- **Given** a project whose system under test is Python and a document written
  in Python's terms
  **When** I run `livingdoc check`
  **Then** a check is produced in Python
  **And** it is executed with the project's test framework
  **And** it passes and the command exits 0

- **Given** a project whose system under test is TypeScript and a document
  written in TypeScript's terms
  **When** I run `livingdoc check`
  **Then** a check is produced in TypeScript
  **And** it passes and the command exits 0

- **Given** a document written in one language's terms but checked against a
  project whose system under test is another
  **When** I run `livingdoc check`
  **Then** the mismatch is reported, not silently accepted

