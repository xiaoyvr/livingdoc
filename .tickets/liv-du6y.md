---
id: liv-du6y
status: open
deps: [liv-ybyq]
links: []
created: 2026-09-26T03:21:48Z
type: feature
priority: 2
assignee: xiaoyvr
---
# Headings and multiple cases

**As a** documentation author, **I want** to describe several behaviors and
several examples in one document, **so that** a document can cover the
behaviors of a real system.

## Acceptance criteria

- **Given** a document with two headings, each with an `Example:` bullet
  **When** I run `livingdoc check`
  **Then** each heading exercises its own operation
  **And** each bullet becomes its own case, named after the bullet

- **Given** a bullet asserting a named output
  **When** I run `livingdoc check`
  **Then** the assertion targets that output

- **Given** a document in which one case fails
  **When** I run `livingdoc check`
  **Then** that case fails while the other cases still execute

