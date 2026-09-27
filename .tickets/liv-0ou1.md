---
id: liv-0ou1
status: open
deps: [liv-ybyq]
links: []
created: 2026-09-27T02:55:10Z
type: feature
priority: 0
assignee: xiaoyvr
---
# Native verbatim tokens for inputs and assertions

**As a** documentation author, **I want** inputs and assertions written as
compact sigils around native code spans, **so that** expressions are read
verbatim and ordinary prose and code spans are never mistaken for tokens.

## Acceptance criteria

- **Given** a document with `discountCode :=`"SAV10"`` and `!!`toBe 90``
  **When** I run `livingdoc check`
  **Then** `discountCode` is bound as an input and the assertion becomes
  `expect(outputs.result).toBe(90)`

- **Given** an expression containing `:`, `+`, `]`, `"`, or `{}`
  **When** it sits inside a code span
  **Then** it is emitted verbatim, unchanged

- **Given** an ordinary code span not preceded by `:=` or `!!`
  **When** I run `livingdoc check`
  **Then** it is left as prose and never executed

## Scope

- Markdown is the only base format. A token is an `inlineCode` node whose
  immediately preceding text ends in `:=` (input, name is the word before) or
  `!!` (assertion); the sigil must be glued to the opening backtick.
- Replaces `{{ name: value }}` and `{{! verb args }}` throughout: tokenizer,
  generator, DESIGN §4/§5/§10/§11, the existing fixtures, and the liv-l4s2
  dogfood document.
- The token pass moves from a text regex (`INLINE_TOKEN` and the `(?!\s*!)`
  lookahead) to the mdast inline tree.
- No escaping. The sigil is glued to the backtick; a space breaks the glue and
  opts the code span out. Documentation does not need a formal escape.

## Out of scope

- Multi-line or multi-line compound expressions: a code span is one line, so a
  fenced variant (`!!` before a fenced block) is a later slice.
- AsciiDoc and other base formats. The sigils port, but AsciiDoc's inline
  verbatim cannot carry `+` or `]`, so a second format would need a
  livingdoc-owned body delimiter rather than the host's literal syntax.
  Record as a design note, not an implementation.

## Implementation tasks

- [x] 1. Native tokens (AC1-AC3): tokenize the bullet's mdast inline nodes. A
      text node ending `name :=` (glued) before an `inlineCode` is an input; a
      text node ending `!!` before an `inlineCode` is an assertion. Generate
      from them and migrate the existing fixtures.
- [x] 2. Design: update DESIGN §4/§5/§10/§11 and record the AsciiDoc /
      multi-format note.

