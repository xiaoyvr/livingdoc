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

- **Given** a literal `:=` or `!!` in front of a code span
  **When** I escape it
  **Then** it is not a token

## Scope

- Markdown is the only base format. A token is an `inlineCode` node whose
  immediately preceding text ends in `:=` (input, name is the word before) or
  `!!` (assertion); the sigil must be glued to the opening backtick.
- Replaces `{{ name: value }}` and `{{! verb args }}` throughout: tokenizer,
  generator, DESIGN §4/§5/§10/§11, the existing fixtures, and the liv-l4s2
  dogfood document.
- The token pass moves from a text regex (`INLINE_TOKEN` and the `(?!\s*!)`
  lookahead) to the mdast inline tree.
- Escaping: `\:=` / `\!!` (or a doubled sigil) writes a literal marker.

## Out of scope

- Multi-line or multi-line compound expressions: a code span is one line, so a
  fenced variant (`!!` before a fenced block) is a later slice.
- AsciiDoc and other base formats. The sigils port, but AsciiDoc's inline
  verbatim cannot carry `+` or `]`, so a second format would need a
  livingdoc-owned body delimiter rather than the host's literal syntax.
  Record as a design note, not an implementation.

## Implementation tasks

- [ ] 1. Tokenize over mdast: `:=` binds the preceding word to the following
      `inlineCode`, `!!` marks an assertion on it.
- [ ] 2. Generate from the new tokens; the downstream codegen is unchanged.
- [ ] 3. Escaping for a literal `:=` / `!!` before a code span.
- [ ] 4. Migrate the fixtures, the dogfood document, and DESIGN §4/§5/§10/§11.

