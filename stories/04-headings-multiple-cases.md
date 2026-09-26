# Story 4 — Headings and multiple cases

The document structure becomes the run.

## Goal

Let a document describe several behaviors and several examples, each becoming
its own case, so livingdoc is usable for real documents.

## Why this slice

It maps a document's structure onto the run: each heading is a behavior, each
bullet under `Example:` is a case, and a heading selects the operation it
exercises.

## In scope

- A heading selects the operation by name.
- Several bullets under one `Example:` each become a case.
- Several headings each become their own group of cases.
- An assertion may target a named output, e.g. `{{ "order saved" toBe true }}`.
- One failing case does not prevent the other cases from running.

## Out of scope

- Directives, per-case reporting, configuration, rendering.

## Acceptance criteria

- [ ] Two headings exercise their respective operations.
- [ ] Each bullet becomes one case, named after the bullet.
- [ ] An assertion can target a named output.
- [ ] A failing case fails the run while the other cases still execute.

## Notes

An operation is selected by the heading, so renaming a heading breaks the
selection — drift that is caught as a failure.
