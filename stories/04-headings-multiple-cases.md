# Story 4 — Headings, multiple cases, describe/it

The document structure becomes the test structure.

## Goal

Map headings to `describe` blocks and operation slugs, and each bullet to an
`it` test, so a full document generates a real vitest suite.

## Why this slice

It makes livingdoc usable for real documents — multiple behaviors, multiple
examples — and establishes the heading→operation resolution that binds prose to
code.

## In scope

- Heading slug → operation name (`## Applying a discount` →
  `applying-a-discount`).
- Multiple bullets under one `Example:` → multiple `it()`.
- Multiple headings → multiple `describe()`.
- Named-output subjects: `{{ "order saved" toBe true }}` → assert
  `outputs["order saved"]`.
- All cases run even when one fails (vitest's default).

## Out of scope

- Directives, result mapping, config, rendering.

## Acceptance criteria

- [ ] Two headings produce two `describe` blocks with the right operation lookups.
- [ ] Bullets under a heading produce one `it` each, named by the bullet text.
- [ ] `{{ "order saved" toBe true }}` asserts the named output.
- [ ] A failing case fails the run while the other cases still execute.

## Tasks

- [ ] Slugify headings (lowercase, whitespace → hyphen, strip punctuation).
- [ ] Group bullets under their owning heading; derive the operation slug.
- [ ] Codegen: `describe(<heading>, () => { it(<bullet>, ...) })`.
- [ ] Resolve the subject: primary result when the verb is first, named output
      when the verb is in the middle.
- [ ] Emit `outputs["<subject>"]` for named-output subjects.

## Notes

Slug convention (kebab-case) and "no explicit operation override" are design
decisions from §6 — a heading rename breaks the lookup, which is caught red.
