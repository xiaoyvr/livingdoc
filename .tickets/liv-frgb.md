---
id: liv-frgb
status: in_progress
deps: []
links: []
created: 2026-09-26T03:21:48Z
type: feature
priority: 0
assignee: xiaoyvr
---
# Walking skeleton

**As a** documentation author, **I want** to run `livingdoc check` on a
document that marks one input, **so that** a written document is proven by
execution instead of trusted as prose.

## Acceptance criteria

- **Given** a document that opts in and contains one `Example:` bullet with one
  marked input, `{{ code: "SAVE10" }}`
  **When** I run `livingdoc check <file.md>`
  **Then** a check is produced beside the document
  **And** the check executes and passes
  **And** the command exits 0

- **Given** a document with an `Example:` bullet
  **When** livingdoc produces the check
  **Then** the check is named after the bullet

## Implementation tasks

- [x] 1. An **opted-in** document: `check` writes `describe(<heading>)` next
      to the input.
- [x] 2. A **non-opted** document: `check` writes nothing.
- [x] 3. One `Example:` bullet: the `describe` gets an `it(<bullet text>)` that
      binds the input — `const code = "SAVE10"`.
- [x] 4. `check` runs the generated check and returns its exit code.
- [ ] 5. `bin.ts` wired to `check`: reports the outcome and mirrors the exit
      code (thin entry; not the thing under test).

### Notes

- Task 2 exists so the frontmatter opt-in introduced in task 1 is verified.
- Task 5 is wiring and reporting only. Per the process, the entry point is not
  the thing under test, so it has no test of its own.

