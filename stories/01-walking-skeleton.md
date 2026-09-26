# Story 1 — Walking skeleton

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
