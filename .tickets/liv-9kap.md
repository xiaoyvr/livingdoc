---
id: liv-9kap
status: closed
deps: []
links: []
created: 2026-09-27T07:13:03Z
type: feature
priority: 1
assignee: xiaoyvr
---
# Bind a fenced block as an input

**As a** documentation author, **I want** to bind a whole block of content as an
input, **so that** I can write a multi-line expected value, like a whole file, in
the document itself.

## Acceptance criteria

- **Given** an input written as `name :=` followed by a fenced code block
  **When** I run `livingdoc generate`
  **Then** the generated test binds the block's content as a string

- **Given** a document with a fenced input and an assertion naming it
  **When** the generated test runs
  **Then** the assertion compares the output to the block's content

## Scope

- The tokenizer walks the bullet's block children, not only its inline nodes.
- The fenced content is emitted as a JSON string literal, so newlines, quotes,
  and backticks survive verbatim.
- A fenced block after `:=` is an input. A fenced block after `!!` (a multi-line
  assertion) stays out of scope.
- The doc's title rendering ignores fenced blocks.

## Implementation tasks

- [x] 1. Walk the bullet's block children and treat a fenced `code` node as the
      value of a `name :=` input, emitted as a JSON string.
- [x] 2. Add the fenced-input example to `docs/explain/livingdoc.md` and assert
      the whole generated file.
- [x] 3. Record fenced inputs in DESIGN §5.

