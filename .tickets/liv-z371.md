---
id: liv-z371
status: open
deps: []
links: [liv-9kap]
created: 2026-09-29T18:58:53Z
type: feature
priority: 4
assignee: xiaoyvr
---
# Fenced input after a leading name :=

**As a** documentation author, **I want** a fenced block that follows a leading
`name :=` to bind as that input even when the fence info has no `name :=`,
**so that** I can write:

    - given doc :=
      ```markdown
      something here
      ```
      then !!`toContain "something"`

## Acceptance criteria

- **Given** a bullet with `name :=` in the prose followed by a fenced block
  whose info is only a language (or empty), with no `name :=`
  **When** I run `livingdoc generate`
  **Then** the generated test binds `name` to the block's content as a string
  literal

- **Given** a fenced block whose info ends with `name :=` (today's form)
  **When** I run `livingdoc generate`
  **Then** that form still binds as today

- **Given** a leading `name :=` and a fence whose info also ends with
  `other :=`
  **When** I run `livingdoc generate`
  **Then** the fence info wins (one binding from the fence; the leading
  pending name is not also bound)

## Scope

- Parser only: when pending input meets a fence without `name :=` in its info,
  consume the pending name and bind the fence body as a literal string.
- Keep the existing info-string form (`` ```markdown doc := ``).
- No change to assertion fences, `>>` blocks, or rendering.

## Notes

- liv-9kap's AC described `name :=` followed by a fence; the shipped form put
  `name :=` in the fence info instead. This story adds the leading-`:=` form
  alongside it.
- The explain docs currently use only the info-string form (the redundant
  leading `doc :=` was removed as a no-op under today's parser).
