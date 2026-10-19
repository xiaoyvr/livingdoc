---
id: liv-du6y
status: open
deps: [liv-ybyq, liv-0ou1, liv-7zw2]
links: [liv-7zw2, liv-ejez, liv-1wj2, liv-ty09, liv-j2jx]
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

- **Given** a document with two headings, each with a heading-level `>>` block
  **When** I run `livingdoc generate`
  **Then** each block is emitted only inside that heading's `describe`, before
  its cases
  **And** a block under one heading is not visible in the other's `describe`

- **Given** a bullet asserting a named output
  **When** I run `livingdoc generate`
  **Then** the assertion targets that output

- **Given** a document in which one case is stale
  **When** the project's tests run
  **Then** that case fails while the other cases still run

## Notes

- Which binding a case targets — the group's declared one, an inline bind, or
  the heading default — is **liv-ejez's** rule, not an acceptance criterion
  here. This ticket only splits the document into headings and cases; it states
  no key-resolution behaviour, because stating it here made this ticket look
  independent of liv-ejez while depending on its semantics.
- 2026-10-19 scan: liv-j2jx now depends on this ticket — its "setup/teardown run
  around each place the binding is used" needs per-heading `describe` scope.
- Per-heading `>>` placement was deferred from liv-7zw2: today every `>>` in
  the document lands in the single generated `describe`; this ticket splits
  that by heading.

**2026-09-29T20:30:35Z**

Added AC: each heading-level >> emits only into that heading's describe.
