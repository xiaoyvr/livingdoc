---
id: liv-du6y
status: open
deps: [liv-ybyq, liv-0ou1]
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
  **When** I run `livingdoc generate`
  **Then** each heading is its own `describe`
  **And** each bullet becomes its own generated case, named after the bullet
  **And** the action a case targets is the group's (liv-otqr) or, if unnamed,
  its heading's

- **Given** a bullet asserting a named output
  **When** I run `livingdoc generate`
  **Then** the assertion targets that output

- **Given** a document in which one case is stale
  **When** the project's tests run
  **Then** that case fails while the other cases still run

## Notes

- The heading is a `describe` and the default action; liv-otqr lets a group name
  its action, so a multi-heading document composes with that instead of relying
  on the heading slug alone.
